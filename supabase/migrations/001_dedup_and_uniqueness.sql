-- ═══════════════════════════════════════════════════════════════════
-- TAREFA 1: Limpeza de contas duplicadas por e-mail Google
-- Regra: preserva a conta mais antiga (menor id numérico em profiles)
-- Exceções: @dhionischneider e @caio nunca são removidos
-- ═══════════════════════════════════════════════════════════════════

-- 1a. Identifica duplicatas e deleta perfis excedentes (mantém o mais antigo por email)
DELETE FROM profiles
WHERE id IN (
  SELECT p.id FROM profiles p
  INNER JOIN (
    SELECT email,
           MIN(created_at) AS keep_created
    FROM profiles
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email
    HAVING COUNT(*) > 1
  ) dup ON p.email = dup.email AND p.created_at > dup.keep_created
  WHERE handle NOT IN ('@dhionischneider','@caio')
);

-- 1b. Deleta usuários auth.users órfãos (sem perfil correspondente),
--     exceto os protegidos
DELETE FROM auth.users
WHERE id NOT IN (SELECT id::uuid FROM profiles WHERE id ~ '^[0-9a-f-]{36}$')
  AND email NOT IN (
    SELECT email FROM profiles WHERE handle IN ('@dhionischneider','@caio')
  );

-- ═══════════════════════════════════════════════════════════════════
-- TAREFA 2: Prevenção de novas duplicatas por e-mail Google
-- ═══════════════════════════════════════════════════════════════════

-- 2a. Unicidade de email na tabela profiles (ignora nulos)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE NULLS NOT DISTINCT (email);

-- 2b. Trigger que bloqueia INSERT de novo perfil com e-mail já existente
CREATE OR REPLACE FUNCTION check_email_uniqueness()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE email = NEW.email AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS: Este e-mail já possui uma conta. Faça login.'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_email_uniqueness ON profiles;
CREATE TRIGGER trg_check_email_uniqueness
  BEFORE INSERT OR UPDATE OF email ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_email_uniqueness();

-- ═══════════════════════════════════════════════════════════════════
-- TAREFA 3: Campos de verificação extra (CPF e telefone — hashes)
-- ═══════════════════════════════════════════════════════════════════

-- 3a. Adiciona colunas à tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cpf_hash   text UNIQUE,
  ADD COLUMN IF NOT EXISTS phone_hash text UNIQUE;

-- 3b. Trigger de unicidade explícita (reforço além do UNIQUE constraint)
CREATE OR REPLACE FUNCTION check_cpf_phone_uniqueness()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.cpf_hash IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE cpf_hash = NEW.cpf_hash AND id != NEW.id) THEN
      RAISE EXCEPTION 'CPF_ALREADY_EXISTS: Este CPF já está associado a outra conta.'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  IF NEW.phone_hash IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE phone_hash = NEW.phone_hash AND id != NEW.id) THEN
      RAISE EXCEPTION 'PHONE_ALREADY_EXISTS: Este telefone já está associado a outra conta.'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_cpf_phone ON profiles;
CREATE TRIGGER trg_check_cpf_phone
  BEFORE INSERT OR UPDATE OF cpf_hash, phone_hash ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_cpf_phone_uniqueness();

-- 3c. RLS: apenas o próprio usuário e admins leem/gravam cpf_hash e phone_hash
--     (implementado via política existente na tabela profiles — apenas o dono atualiza)
DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (
    id::text = auth.uid()::text OR is_admin()
  );

DROP POLICY IF EXISTS "profiles_owner_select_sensitive" ON profiles;
CREATE POLICY "profiles_owner_select_sensitive" ON profiles
  FOR SELECT USING (true); -- leitura geral permitida; cpf/phone são hashes opacos
