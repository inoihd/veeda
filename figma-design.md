# Veeda — Especificação de Design para Figma

## Objetivo
Este arquivo descreve o sistema visual atual e os componentes principais do Veeda para facilitar evolução de layout no Figma.

---

## Palette de Cores
Use a paleta de tokens do projeto para manter consistência visual.

- `purple`: #9000FF
- `purpleLight`: #EDE9F6
- `purpleMid`: #BB7DEB
- `purpleSoft`: #F9F1FF
- `blue`: #5B7FA6
- `blueLight`: #E6EEF8
- `blueMid`: #A8C0DA
- `blueSoft`: #F0F6FD
- `green`: #1D9E75
- `greenLight`: #EAFFF8
- `greenMid`: #4DB896
- `greenSoft`: #F0FAF5
- `red`: #C0392B
- `redLight`: #FDE8E8
- `amber`: #D4860A
- `amberLight`: #FFF3DC
- `teal`: #0097A7
- `tealLight`: #E0F7FA
- `cardBorder`: #CBC0D3
- `headerBorder`: #DDD8EE
- `bg`: #EAFFF8
- `bgGradEnd`: #FEFEFC
- `splashBg`: #22FCB7
- `text`: #3A3350
- `textMid`: #7A7090
- `textLight`: #ADA8C0
- `textSoft`: #C4C0D3
- `white`: #FFFFFF
- `tabActive`: #7B6FA0
- `overlay`: rgba(40, 30, 60, 0.6)
- `overlayGlass`: rgba(255, 255, 255, 0.1)

---

## Tipografia
Use a família de fontes do app:

- Primária: `Passo`
- Alternativa: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`

### Hierarquia
- Titulos principais: 16px, 700, `Passo`
- Texto de seção / labels: 12-14px, 500-600
- Texto secundário: 10-12px, 400-500
- Botões: 12-14px, 600

---

## Componentes Principais

### Card
- Background: linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.95) 100%)
- Borda: 1px solid rgba(255,255,255,0.2)
- Border-radius: 16px
- Padding: 16px
- Sombra: `0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)`
- Hover: translateY(-2px) + sombra mais forte

### Aba (`TabBar`)
- Botões com padding `10px 14px`
- Texto: 13px
- Borda inferior ativa: 2.5px sólido `tabActive`
- Texto inativo: `textMid`
- Texto ativo: `tabActive`

### Avatar
- Tamanho principal: 64px (menu superior)
- Tamanho em cards: 44px
- Anel: use ring nos casos de card de dia recebido e perfil

### ProfileCard
- Usa `Card`
- Layout: horizontal com `gap: 12px`
- Texto principal: nome, 14px, 600, `text`
- Subtexto: handle, 12px, 500, `purple`
- Indicador de status: 12px redondo

### Botões de ação
- Fundo primário: `purple`
- Texto branco
- Borda arredondada 50px para botões principais
- Botões secundários: fundo `white`, border `1px solid cardBorder`

---

## Telas Principais

### 1. Hoje
- Header com avatar, nome, handle e sentimento do dia
- Navegação em abas: Hoje / Meu Círculo / Recebidos
- Ações rápidas: cor, sentimento, lembretes, eventos, alternar timeline
- Timeline: modo vertical e horizontal
- Fundo fixo inferior para ações rápidas de registrar ou compartilhar

### 2. Meu Círculo
- Listagem de contatos
- Cada card exibe avatar, nome, handle e status online/offline
- Botão de remover no card
- Botão de adicionar contato
- Empty state com CTA para convidar

### 3. Recebidos
- Lista de dias recebidos ordenada por `importedAt` decrescente
- Cada item mostra autor, data e quantidade de momentos
- Clicar abre visualização detalhada do dia
- Perfil do autor pode ser acessado pelo nome

### 4. Detalhe de dia recebido
- Header com avatar e autor
- Data completa
- Sentimento e mensagem opcional
- Grade de momentos recebidos
- Comentários salvos por dia

---

## Fluxo de trabalho para Figma → Código
1. Crie no Figma as telas principais acima usando os tokens desta especificação.
2. Use componentes reutilizáveis para cards, botões e abas.
3. Salve as variações de `Meu Círculo` e `Recebidos` como componentes separados.
4. Exporte as medidas e espaçamentos para a implementação.

---

## Como atualizar o código após ajustes no Figma
1. Compare o layout do Figma com os componentes atuais em `veeda-ui.js`.
2. Substitua estilos inline em `veeda-app.js` por um componente comum sempre que fizer sentido.
3. Atualize/adicione tokens em `veeda-core.js` se houver novas cores, sombras ou tipografia.
4. Mantenha a lógica do app separada do visual: preserve `setViewProfile`, `setViewRec`, `send`, `save`, `activeData`, etc.
5. Faça commit com mensagem descrevendo a evolução visual e crie um PR se houver branch de trabalho.

---

## Observações
- Este arquivo não é um arquivo `.figma` real, mas serve como guia de design para reproduzir a interface no Figma.
- Se quiser, posso também gerar um `figma-sketch` simplificado com os blocos de tela diretamente no repositório.
