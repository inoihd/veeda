# Veeda — Template para Criar Arquivo no Figma

Este arquivo contém instruções passo a passo para recriar o design do Veeda no Figma usando os tokens e componentes descritos.

---

## 1. Configurar o Arquivo no Figma

1. Abra o Figma e crie um novo arquivo: `File > New design file`
2. Renomeie o arquivo para "Veeda Design System"
3. Defina o frame principal como Mobile (375x812) para simular iPhone

---

## 2. Criar a Palette de Cores

No painel de cores (Color Styles), crie os seguintes estilos:

### Cores Principais
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
- `text`: #3A3350
- `textMid`: #7A7090
- `textLight`: #ADA8C0
- `white`: #FFFFFF
- `tabActive`: #7B6FA0

### Gradientes
- `cardBg`: Linear gradient 135° from `white` 0% to `rgba(255,255,255,0.95)` 100%

---

## 3. Configurar Tipografia

1. No painel Text Styles, crie estilos de texto:
   - **Section Title**: Font `Passo` (ou fallback sans-serif), 16px, 700, `text`
   - **Body**: Font sans-serif, 14px, 400, `text`
   - **Caption**: Font sans-serif, 12px, 500, `textMid`
   - **Small**: Font sans-serif, 10px, 400, `textLight`
   - **Button**: Font sans-serif, 14px, 600, `white` (para botões primários)

2. Para usar Passo: `Text > Font > Add custom font > Google Fonts > Passo`

---

## 4. Criar Componentes

### Componente Card
1. Crie um retângulo com:
   - Fill: `cardBg`
   - Stroke: 1px `rgba(255,255,255,0.2)`
   - Corner radius: 16px
   - Drop shadow: `0 8px 32px rgba(0,0,0,0.08)`, `0 4px 16px rgba(0,0,0,0.06)`
   - Padding: 16px (use Auto layout)
2. Adicione variant para hover: translateY -2px, sombras mais fortes
3. Torne componente: `Create component`

### Componente TabBar
1. Crie um container horizontal com gap 8px
2. Adicione botões com:
   - Padding: 10px 14px
   - Font: 13px, 400/600
   - Background: none
   - Border bottom: 2.5px solid (conditional: `tabActive` se ativo, transparent se inativo)
   - Color: conditional `tabActive` / `textMid`
3. Torne componente com variants para estado ativo/inativo

### Componente ProfileCard
1. Use o componente Card como base
2. Adicione layout horizontal: avatar (44px) + texto + botão opcional
3. Avatar: círculo com emoji ou imagem
4. Texto: nome (14px, 600, `text`) + handle (12px, 500, `purple`)
5. Indicador de status: pequeno círculo sobreposto no avatar
6. Torne componente

### Componente AvatarBubble
1. Círculo com tamanho variável (44px, 64px)
2. Fill: cor variável
3. Emoji centralizado
4. Variant com ring (stroke 2px `white`)

---

## 5. Criar Telas

### Tela "Hoje"
1. Frame: 375x812
2. Header (topo fixo):
   - Avatar 64px com ring
   - Nome: 14px, 600, `text`
   - Handle: 12px, 600, `purple`
   - Badge sentimento: fundo `purpleLight`, texto `tabActive`
3. TabBar abaixo
4. Área de conteúdo com timeline vertical/horizontal
5. Bottom bar fixa com botões de ação

### Tela "Meu Círculo"
1. Frame separado
2. Header com título "Meu Círculo" + botão renomear
3. Lista de ProfileCard
4. Empty state: emoji 👥 + texto + botão CTA

### Tela "Recebidos"
1. Frame separado
2. Título "Dias recebidos"
3. Lista de cards com avatar, autor, data, momentos
4. Cada item usa Card + layout horizontal

### Tela "Detalhe Dia Recebido"
1. Header com avatar autor, nome, data
2. Sentimento badge opcional
3. Mensagem em card destacado
4. Grid de momentos (58px cada)
5. Seção comentários

---

## 6. Organizar no Figma

1. Use páginas separadas para cada tela
2. Crie uma página "Components" para todos os componentes reutilizáveis
3. Use Auto layout em todos os containers
4. Nomeie camadas de forma descritiva
5. Adicione constraints para responsividade

---

## 7. Exportar para Desenvolvimento

1. Use o modo Dev do Figma para gerar specs
2. Exporte componentes como SVG/PNG se necessário
3. Compartilhe o link do arquivo Figma com a equipe

---

Este template permite recriar rapidamente o design atual e testar variações visuais antes de implementar no código.