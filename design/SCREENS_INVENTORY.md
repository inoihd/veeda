# Veeda — Inventário de Telas e Componentes

Referência de todas as telas e componentes do app, extraída de `veeda/index.html`, `veeda-auth.js`, `veeda-modals.js` e `veeda-ui.js`. Cada item cita linha de origem para facilitar verificação.

---

## A. Fluxo de Autenticação (pré-login)

| # | Tela               | Função               | Arquivo / linha           | Descrição                                                                                 |
|---|--------------------|----------------------|---------------------------|-------------------------------------------------------------------------------------------|
| 1 | Splash             | `SplashScreen`       | index.html:2159           | Logo central, CTA "Entrar com Google", "Recuperar dados", "Guia de instalação".           |
| 2 | Seleção Google     | `ScreenGoogleSelect` | index.html:2195           | Lista de perfis vinculados ao Google; "Criar novo" / "Importar local".                    |
| 3 | Importar local     | `ScreenGoogleImport` | index.html:2243           | Checkbox list de perfis locais para importar pra conta Google.                            |
| 4 | Guia de instalação | `InstallGuide`       | index.html:2273           | Tabs iOS / Android com passo-a-passo para instalar PWA.                                   |
| 5 | Seleção de perfil  | `ScreenSelect`       | index.html:2288           | Grid de avatares para escolher perfil local.                                              |
| 6 | Senha              | `ScreenPassword`     | index.html:2318           | Input de senha + "Esqueci".                                                               |
| 7 | Criar conta        | `ScreenCreate`       | index.html:2350 (4 steps) | Stepper 1/4 Nome, 2/4 @handle, 3/4 Avatar (emoji + cor), 4/4 Senha + código de conexão.  |
| 8 | Recuperar senha    | `ScreenForgot`       | index.html:2466           | Recuperação via frase de segurança.                                                       |

---

## B. App autenticado (tabs principais)

Todas as telas abaixo vivem dentro de `VeedaApp` (index.html:2489) com header fixo (avatar + nome + @handle) e tab bar inferior.

| Tab        | View key    | Linha (render) | Conteúdo principal                                                               |
|------------|-------------|----------------|----------------------------------------------------------------------------------|
| Hoje       | `"hoje"`    | ~2879          | Editor de "Dia de Veeda": círculo de moments + sentimentos + botões de mídia.    |
| Círculo    | `"grupo"`   | ~2931          | Lista de contatos + botão "Adicionar contato" + "Meu código".                    |
| Recebidos  | `"recebidos"` | ~2950        | Feed de dias compartilhados por contatos.                                        |

---

## C. Modais

| # | Modal                | Função                  | Linha | Para que serve                                                        |
|---|----------------------|-------------------------|-------|-----------------------------------------------------------------------|
| 1 | Adicionar contato    | `AddContactModal`       | 1381  | **Busca no Supabase por nome/@handle** (refatorado) + botão Adicionar |
| 2 | Código de conexão    | `ConnectionCodeModal`   | 1484  | Mostra @handle e link de convite pra compartilhar                     |
| 3 | Convidar p/ Veeda    | `InviteModal`           | 1548  | Compartilha link do app (WhatsApp / E-mail / SMS)                     |
| 4 | Compartilhar dia     | `ShareDayModal`         | 1576  | Seleciona contatos + mensagem + envia (Supabase + link público)       |
| 5 | Aceitar dia recebido | `AcceptSharedDayModal`  | 1682  | Preview do dia recebido e CTA "Salvar no meu Veeda"                   |
| 6 | Eventos              | `EventsModal`           | 1730  | CRUD de próximos eventos                                              |
| 7 | Lembretes            | `RemindersModal`        | 1746  | CRUD de lembretes                                                     |
| 8 | Backup               | `BackupModal`           | 1762  | Export/import criptografado                                           |
| 9 | Configurações        | `SettingsModal`         | 1809  | Perfil, senha, backup, logout, excluir conta                          |
| 10| Perfil (view)        | `ProfileModal`          | 1956  | Ver perfil de um contato com histórico compartilhado                  |
| 11| Notificação recebida | `ReceivedNotif`         | 1526  | Toast persistente de dia novo                                         |

---

## D. Componentes atômicos / UI kit

Todos em `index.html` entre 906–1377 e `veeda-ui.js`:

| Componente         | Linha | Variações                                                                    |
|--------------------|-------|------------------------------------------------------------------------------|
| `AvatarBubble`     | 906   | size 38/42/44/46/60/64/80; com/sem `ring`; emoji ou imagem.                  |
| `Spinner`          | 912   | size, color.                                                                 |
| `SkeletonLine`     | 916   | largura, altura, radius variáveis.                                           |
| `Modal`            | 920   | fullHeight opcional, zIndex configurável.                                    |
| `Btn`              | 937   | variants: `primary`, `ghost`, `outline`, `green`.                            |
| `PulsingDot`       | 966   | Indicador animado colorido (online/gravando).                                |
| `Toast`            | 977   | types: `info`, `success`, `warn`, `error`.                                   |
| `CheckboxConfirm`  | 998   | Checkbox grande com label para termos/confirmações.                          |
| `DrawingCanvas`    | 1017  | Moment tipo desenho.                                                         |
| `VoiceRecorder`    | 1081  | Moment tipo áudio com timer e waveform.                                      |
| `LocationPicker`   | 1161  | Input de localização com autocomplete.                                       |
| `MomentCircle`     | 1217  | Ícone circular do moment no timeline diário.                                 |
| `MomentDetail`     | 1236  | Modal com detalhes/mídia do moment + delete.                                 |
| `MusicPicker`      | 1323  | Busca música (Spotify/YouTube).                                              |
| `TagPicker`        | 1357  | Seletor de tags pré-definidas + custom.                                      |

---

## E. Ordem sugerida para montar no Figma

1. **Foundations** (Variables + Text Styles + Effect Styles) — ver `DESIGN_SYSTEM.md`.
2. **Icon library** — importar todos os SVGs de `design/icons/` como componentes.
3. **Logo** — componente a partir de `design/logo/veeda-logo-mark.svg`.
4. **Atomic components** (linha D na ordem listada).
5. **Screens auth** (linha A).
6. **Screens app** (linha B).
7. **Modals** (linha C).

Sugestão: uma **Page** do Figma por bloco (Foundations / Icons / Components / Auth / App / Modals).
