# Constituição do Veeda

> Princípios invioláveis que regem o desenvolvimento do aplicativo.
> Qualquer evolução, refatoração ou nova feature DEVE respeitá-los.

---

## Artigo 1 — Permanência dos Dados do Usuário

**1.1** Nenhuma atualização, migração, refatoração ou evolução do aplicativo pode impactar o acesso do usuário aos seus dados e histórico.

**1.2** Schemas de dados (localStorage, IndexedDB, Supabase, Google Drive) só podem evoluir de forma **aditiva** — é proibido remover campos ou renomear em produção. Migrações devem preservar retrocompatibilidade via `DATA_VERSION` com migradores em cadeia.

**1.3** O app deve sempre tentar recuperar dados antigos antes de assumir "perfil vazio" — incluindo snapshots mensais, backups da nuvem e chaves legadas do localStorage.

---

## Artigo 2 — Imutabilidade da Identidade

**2.1** Uma vez criado, o **`@handle`** do usuário é permanente e não pode ser alterado por nenhuma parte do código.

**2.2** O **ID interno do perfil** (`profile.id`) é imutável desde a criação.

**2.3** A conta só pode ser **alterada ou excluída mediante solicitação explícita do próprio usuário** — jamais por processo automático, limpeza de cache, migração, ou falha de sync.

**2.4** Nenhuma feature pode invalidar uma sessão de usuário sem consentimento explícito.

---

## Artigo 3 — Portabilidade entre Dispositivos

**3.1** O **mesmo login** (handle + senha) deve reconstituir a conta completa em qualquer dispositivo e navegador.

**3.2** Dados sociais (conexões, confirmações, dias compartilhados) são espelhados no backend (Supabase) para garantir continuidade cross-device.

**3.3** A estratégia de auth no Supabase usa `{handle}@veeda.local` + `passwordHash` (SHA-256) — determinística, permitindo login idêntico de qualquer device.

**3.4** O localStorage funciona como **cache local e fallback offline**, nunca como única fonte de verdade para dados sociais.

---

## Artigo 4 — Privacidade e Consentimento

**4.1** Dados pessoais do usuário são criptografados em repouso com AES-256-GCM derivado da senha (PBKDF2, 150k iterações).

**4.2** Nada do histórico pessoal (moments, feelings, comentários, localizações) é escrito em texto claro no Supabase. O backend só conhece: perfil público, pedidos/confirmações de conexão e payloads de dias compartilhados (sem mídia).

**4.3** Mídia (fotos, vídeos, áudios) nunca é enviada ao Supabase — permanece local ou no Google Drive do próprio usuário.

---

## Artigo 5 — Soberania do Usuário

**5.1** O usuário pode exportar todos os seus dados a qualquer momento.

**5.2** O usuário pode excluir a própria conta — essa ação remove os dados do Supabase, localStorage, IndexedDB e snapshots da nuvem vinculados ao seu perfil.

**5.3** Desconectar ≠ Excluir. Logout preserva os dados para reentrada futura; exclusão é definitiva.

---

## Processo de Conformidade

Antes de aprovar qualquer mudança que toque em:

- Schema de `profiles`, autenticação, `veeda_data_*`, ou tabelas Supabase
- Fluxo de criação de perfil ou login
- Qualquer remoção de campos ou alteração de tipo

...verificar que os artigos 1 a 5 continuam respeitados. Em caso de dúvida, adicionar teste manual documentando o cenário antes do merge.
