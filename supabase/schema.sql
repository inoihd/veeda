-- ═══════════════════════════════════════════════════════════
-- VEEDA — Schema Supabase
-- Modelado a partir do localStorage existente para cross-device social
-- ═══════════════════════════════════════════════════════════
-- Execute no SQL Editor do Supabase (em ordem)

-- ─── 0. Helper: extrair handle do email de auth ─────────────
-- O email de auth é "{handle}@veeda.local", então o handle é a parte antes do @
CREATE OR REPLACE FUNCTION auth_handle()
RETURNS TEXT AS $$
  SELECT split_part(email, '@', 1)
  FROM auth.users
  WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ─── 1. PROFILES ───────────────────────────────────────────
-- Espelho público do perfil local (sem dados sensíveis)
-- Equivalente a: veeda_public_registry + parte de veeda_profiles_v2
CREATE TABLE IF NOT EXISTS profiles (
  id            TEXT        PRIMARY KEY,  -- Mesmo ID do localStorage (timestamp-based)
  handle        TEXT        UNIQUE NOT NULL,  -- Sem @
  name          TEXT        NOT NULL,
  emoji         TEXT        NOT NULL,
  avatar_color  TEXT        NOT NULL,
  avatar_src    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_handle_idx ON profiles (handle);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth_handle() = handle);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth_handle() = handle);


-- ─── 2. CONNECTION REQUESTS ────────────────────────────────
-- Equivalente a: veeda_conn_requests_{handle}
-- Usuário A envia pedido para o handle de B
CREATE TABLE IF NOT EXISTS connection_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id          TEXT        NOT NULL,
  from_name        TEXT        NOT NULL,
  from_handle      TEXT        NOT NULL,  -- Sem @
  from_emoji       TEXT        NOT NULL,
  from_avatar_color TEXT       NOT NULL,
  from_avatar_src  TEXT,
  to_handle        TEXT        NOT NULL,  -- Handle do destinatário, sem @
  status           TEXT        NOT NULL DEFAULT 'pending'  -- pending | accepted | declined
                   CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS conn_req_to_handle_idx   ON connection_requests (to_handle, status);
CREATE INDEX IF NOT EXISTS conn_req_from_handle_idx ON connection_requests (from_handle);

-- Evita pedido duplicado do mesmo remetente
CREATE UNIQUE INDEX IF NOT EXISTS conn_req_unique_pair
  ON connection_requests (from_id, to_handle)
  WHERE status = 'pending';

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conn_req_insert"
  ON connection_requests FOR INSERT
  WITH CHECK (auth_handle() = from_handle);

CREATE POLICY "conn_req_select"
  ON connection_requests FOR SELECT
  USING (auth_handle() = to_handle OR auth_handle() = from_handle);

CREATE POLICY "conn_req_update_recipient"
  ON connection_requests FOR UPDATE
  USING (auth_handle() = to_handle);


-- ─── 3. CONNECTION CONFIRMATIONS ───────────────────────────
-- Equivalente a: veeda_connection_confirmed_{handle}
-- Quando B aceita o pedido de A, B envia confirmação de volta para A
CREATE TABLE IF NOT EXISTS connection_confirmations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id          TEXT        NOT NULL,  -- ID de quem aceitou (B)
  from_name        TEXT        NOT NULL,
  from_handle      TEXT        NOT NULL,  -- Handle de B, sem @
  from_emoji       TEXT        NOT NULL,
  from_avatar_color TEXT       NOT NULL,
  from_avatar_src  TEXT,
  to_handle        TEXT        NOT NULL,  -- Handle do remetente original (A), sem @
  confirmed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed         BOOLEAN     NOT NULL DEFAULT FALSE  -- TRUE após A processar
);

CREATE INDEX IF NOT EXISTS conn_confirm_to_handle_idx ON connection_confirmations (to_handle, consumed);

-- Evita confirmação duplicada para o mesmo par
CREATE UNIQUE INDEX IF NOT EXISTS conn_confirm_unique_pair
  ON connection_confirmations (from_id, to_handle);

ALTER TABLE connection_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conn_confirm_insert"
  ON connection_confirmations FOR INSERT
  WITH CHECK (auth_handle() = from_handle);

CREATE POLICY "conn_confirm_select"
  ON connection_confirmations FOR SELECT
  USING (auth_handle() = to_handle OR auth_handle() = from_handle);

CREATE POLICY "conn_confirm_update_recipient"
  ON connection_confirmations FOR UPDATE
  USING (auth_handle() = to_handle);


-- ─── 4. SHARED DAYS (INBOX) ────────────────────────────────
-- Equivalente a: veeda_inbox_{handle}
-- Dias compartilhados entre usuários conectados
CREATE TABLE IF NOT EXISTS shared_days (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id          TEXT        NOT NULL,
  from_name        TEXT        NOT NULL,
  from_handle      TEXT        NOT NULL,  -- Sem @
  from_emoji       TEXT        NOT NULL,
  from_avatar_color TEXT       NOT NULL,
  from_avatar_src  TEXT,
  to_handle        TEXT        NOT NULL,  -- Handle do destinatário, sem @
  date             DATE        NOT NULL,
  feeling          JSONB,                 -- {emoji, label} ou null
  message          TEXT,
  moments          JSONB       NOT NULL DEFAULT '[]',  -- Mídia já removida pelo app
  has_media        BOOLEAN     NOT NULL DEFAULT FALSE,
  shared_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed         BOOLEAN     NOT NULL DEFAULT FALSE,  -- TRUE após destinatário importar
  imported_at      TIMESTAMPTZ           -- Preenchido pelo destinatário ao aceitar

  -- Evita compartilhamento duplicado do mesmo dia para o mesmo destinatário
  , CONSTRAINT shared_days_unique_share UNIQUE (from_handle, to_handle, date)
);

CREATE INDEX IF NOT EXISTS shared_days_to_handle_idx ON shared_days (to_handle, consumed);
CREATE INDEX IF NOT EXISTS shared_days_from_handle_idx ON shared_days (from_handle);

ALTER TABLE shared_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_days_insert"
  ON shared_days FOR INSERT
  WITH CHECK (auth_handle() = from_handle);

CREATE POLICY "shared_days_select"
  ON shared_days FOR SELECT
  USING (auth_handle() = to_handle OR auth_handle() = from_handle);

CREATE POLICY "shared_days_update_recipient"
  ON shared_days FOR UPDATE
  USING (auth_handle() = to_handle);


-- ─── 5. ONLINE STATUS (PRESENÇA) ───────────────────────────
-- Equivalente a: veeda_online_status_{handle}
CREATE TABLE IF NOT EXISTS online_status (
  handle      TEXT        PRIMARY KEY,  -- Sem @
  is_online   BOOLEAN     NOT NULL DEFAULT FALSE,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "online_status_select_all"
  ON online_status FOR SELECT USING (true);

CREATE POLICY "online_status_insert_own"
  ON online_status FOR INSERT
  WITH CHECK (auth_handle() = handle);

CREATE POLICY "online_status_update_own"
  ON online_status FOR UPDATE
  USING (auth_handle() = handle);


-- ─── 6. REALTIME ───────────────────────────────────────────
-- Habilita subscriptions nas tabelas sociais
ALTER TABLE connection_requests    REPLICA IDENTITY FULL;
ALTER TABLE connection_confirmations REPLICA IDENTITY FULL;
ALTER TABLE shared_days            REPLICA IDENTITY FULL;

-- Adiciona tabelas ao publication do Realtime
-- (Execute separadamente se der erro de permission)
ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE connection_confirmations;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_days;
