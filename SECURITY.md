# Veeda — Plano de Segurança

> Documento vivo. Atualizar sempre que novas features forem adicionadas.  
> Última revisão: 2026-04-25

---

## Modelo de ameaças

O Veeda é um diário pessoal criptografado. Os ativos a proteger são:

| Ativo | Onde vive | Proteção atual |
|-------|-----------|----------------|
| Momentos e diário do usuário | localStorage (cifrado) + Google Drive (cifrado) | AES-256-GCM + PBKDF2 150k iterações ✅ |
| Senha do usuário | Nunca enviada a servidor — só o hash | SHA-256 local (ver item 3 abaixo) |
| Metadados sociais (handle, nome, emoji) | Supabase `profiles` | RLS obrigatória (ver item 1) |
| Pedidos e confirmações de conexão | Supabase | RLS obrigatória (ver item 1) |
| Dias compartilhados | Supabase `shared_days` | RLS obrigatória (ver item 1) |
| Token Google Drive | localStorage (`veeda_gdrive_token`) | Curta validade OAuth, não persistido além da sessão |

---

## CAMADA 1 — Supabase (crítico — fazer no painel)

### 1.1 Habilitar RLS em todas as tabelas

**Por que é crítico:** a anon key (`sb_publishable_`) é pública por design no Supabase.  
Sem RLS, qualquer pessoa que a tenha pode ler e escrever em todas as tabelas.

**No painel Supabase → Authentication → Policies, criar as seguintes políticas:**

#### Tabela `profiles`
```sql
-- Leitura: qualquer usuário autenticado pode ler perfis (busca de contatos)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Escrita: só o próprio usuário pode atualizar seu perfil
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid()::text);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()::text);
```

#### Tabela `connection_requests`
```sql
-- Enviar: qualquer autenticado pode criar (from_id deve ser o próprio)
CREATE POLICY "conn_req_insert" ON connection_requests
  FOR INSERT TO authenticated
  WITH CHECK (from_id = auth.uid()::text);

-- Ler: só quem enviou ou quem recebeu
CREATE POLICY "conn_req_select" ON connection_requests
  FOR SELECT TO authenticated
  USING (from_id = auth.uid()::text OR to_handle = (
    SELECT handle FROM profiles WHERE id = auth.uid()::text
  ));

-- Atualizar (aceitar/recusar): só o destinatário
CREATE POLICY "conn_req_update" ON connection_requests
  FOR UPDATE TO authenticated
  USING (to_handle = (
    SELECT handle FROM profiles WHERE id = auth.uid()::text
  ));
```

#### Tabela `connection_confirmations`
```sql
CREATE POLICY "conn_conf_insert" ON connection_confirmations
  FOR INSERT TO authenticated
  WITH CHECK (from_id = auth.uid()::text);

CREATE POLICY "conn_conf_select" ON connection_confirmations
  FOR SELECT TO authenticated
  USING (from_id = auth.uid()::text OR to_handle = (
    SELECT handle FROM profiles WHERE id = auth.uid()::text
  ));

CREATE POLICY "conn_conf_update" ON connection_confirmations
  FOR UPDATE TO authenticated
  USING (to_handle = (
    SELECT handle FROM profiles WHERE id = auth.uid()::text
  ));
```

#### Tabela `shared_days`
```sql
CREATE POLICY "shared_days_insert" ON shared_days
  FOR INSERT TO authenticated
  WITH CHECK (from_id = auth.uid()::text);

CREATE POLICY "shared_days_select" ON shared_days
  FOR SELECT TO authenticated
  USING (from_id = auth.uid()::text OR to_handle = (
    SELECT handle FROM profiles WHERE id = auth.uid()::text
  ));

CREATE POLICY "shared_days_update" ON shared_days
  FOR UPDATE TO authenticated
  USING (to_handle = (
    SELECT handle FROM profiles WHERE id = auth.uid()::text
  ));
```

#### Tabela `online_status` (se existir)
```sql
CREATE POLICY "online_status_own" ON online_status
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
```

### 1.2 Rate limiting no Supabase

**No painel → Settings → API → Rate Limiting:**
- Habilitar rate limiting global
- Limite sugerido: 100 req/min por IP para a anon key

### 1.3 Nunca criar a service key no client-side

A `service_role` key tem privilégios de superusuário — **jamais** colocar no código do app.  
Só usar em Edge Functions ou backends confiáveis.

---

## CAMADA 2 — Google OAuth (fazer no Google Cloud Console)

### 2.1 Restringir redirect URIs autorizados

**Console → APIs & Services → Credentials → seu OAuth Client ID:**

Em "Authorized redirect URIs", manter APENAS:
```
https://veeda.app/          ← domínio de produção
http://localhost:3000/       ← só se usar em dev local
```

Remover qualquer URI curinga (`*`) ou domínio não-produção.

### 2.2 Restringir origens JavaScript autorizadas

Em "Authorized JavaScript origins":
```
https://veeda.app
```

### 2.3 Verificar escopos solicitados

O app solicita apenas `drive.appdata` (arquivo privado do app no Drive).  
Nunca ampliar para `drive` ou `drive.file` sem necessidade.

---

## CAMADA 3 — Código (implementado em 2026-04-25)

### 3.1 Headers de segurança ✅

Adicionados ao `index.html`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=(self)`

**Adicionar também no servidor/CDN** (os meta tags são segunda linha de defesa):
- Configurar os mesmos headers como HTTP headers no servidor de hospedagem

### 3.2 Validação de input no Supabase ✅

Implementado em `veeda-supabase.js`:
- Nome: máx 80 chars
- Handle: máx 20 chars
- Mensagem de compartilhamento: máx 500 chars
- Conteúdo de momento: máx 2.000 chars
- Máx 50 momentos por dia compartilhado
- `avatarSrc` com `data:` URL nunca enviado ao Supabase

### 3.3 Migração pendente: hashPw SHA-256 → PBKDF2

**Problema:** `hashPw` usa SHA-256 simples. Este hash é o que autentica o usuário  
no Supabase (`handle@veeda.local` + `passwordHash`). Se comprometido via  
brute-force, o atacante aprende a senha mas **ainda não acessa os dados**  
(cifrados com PBKDF2 separado).

**Risco real:** médio — requer acesso ao localStorage para obter o hash.

**Plano de migração (próxima versão):**
1. Adicionar `hashPwStrong(pw, profileId)` usando PBKDF2 200k iterações + profileId como salt
2. Ao fazer login com sucesso: gerar `profile.localHashV2 = await hashPwStrong(pw, profile.id)`
3. Verificar login: tentar V2 primeiro, fallback V1 (SHA-256), ao passar → atualizar para V2
4. O hash do Supabase (usado como senha de auth) continua SHA-256 por compatibilidade

### 3.4 CSP parcial (limitação arquitetural)

O app usa Babel no browser para transpilar JSX → requer `eval()` / `unsafe-eval`.  
Uma CSP estrita que bloqueie `unsafe-eval` quebraria o app.

**Solução de longo prazo:** migrar para build com Vite/esbuild (elimina Babel  
no browser). Com isso, a CSP pode ser:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://accounts.google.com https://www.googleapis.com;
```

---

## CAMADA 4 — Criptografia de dados (já implementado, manter)

A criptografia de dados do usuário é a proteção mais forte do app:

| Componente | Implementação | Notas |
|------------|--------------|-------|
| Derivação de chave | PBKDF2, SHA-256, 150k iterações, salt aleatório 16 bytes | Forte ✅ |
| Cifra | AES-256-GCM, IV aleatório 12 bytes | Padrão da indústria ✅ |
| Salt/IV | `crypto.getRandomValues()` — nunca reutilizados | Correto ✅ |
| Cache de chave | `sessionKey` e `sessionSalt` em `useRef` (memória, não localStorage) | Correto ✅ |
| Dados no localStorage | Sempre cifrados, nunca plaintext | Correto ✅ |
| Dados no Google Drive | Mesmo blob cifrado do localStorage | Correto ✅ |
| Dados no Supabase | **Apenas metadados** — momentos/diário nunca chegam ao Supabase | Correto ✅ |

**Nunca mudar:** iterações PBKDF2, tamanho do salt, uso de GCM (autenticado).

---

## CAMADA 5 — Monitoramento e resposta a incidentes

### 5.1 O que monitorar no Supabase

- **Dashboard → Logs → API:** picos anormais de INSERT em `connection_requests` (spam)
- Erros 403 em massa (possível tentativa de bypass de RLS)
- Crescimento anormal da tabela `shared_days`

### 5.2 Rotação de credenciais

| Credencial | Quando rotar | Como |
|-----------|-------------|------|
| Supabase anon key | Se aparecer em repositório público | Painel → Settings → API → Regenerate |
| Google Client Secret | Se vazado | Console → Credentials → Regenerate |
| Senhas de usuário | Nunca — usuário controla. Oferecer "Esqueci minha senha" via backup |

### 5.3 Protocolo de vazamento

Se a anon key do Supabase vazar:
1. Regenerar imediatamente no painel (invalida a antiga)
2. Atualizar `SUPABASE_ANON_KEY` em `veeda-supabase.js`
3. Deploy imediato
4. **Impacto real:** zero para dados de usuário (cifrados client-side). Impacto em metadados sociais se RLS não estiver ativa.

---

## Checklist de segurança — antes de cada deploy

- [ ] RLS ativa em todas as tabelas Supabase
- [ ] Nenhuma `service_role` key no código client
- [ ] Headers de segurança presentes no `index.html`
- [ ] Validação de input no `veeda-supabase.js` não foi removida
- [ ] Nenhum `console.log` com senha, hash ou dado sensível
- [ ] `avatarSrc` com `data:` URL não sendo enviado ao Supabase
- [ ] `version.json` atualizado

---

## O que o app NÃO precisa proteger (por design)

- **Anon key exposta no client:** intencional no modelo Supabase. Segurança vem de RLS.
- **Google Client ID exposto:** intencional no OAuth. Segurança vem de redirect URI restrito.
- **Código fonte visível:** app é client-side. Ofuscação não é camada de segurança real.
- **Metadados de conexão (quem adicionou quem):** são públicos por design do produto.
