# Veeda — Kit de Design

Este diretório é o **ponto de partida** para montar o arquivo Figma do Veeda.

## Conteúdo

```
design/
├── README.md                 ← este arquivo
├── DESIGN_SYSTEM.md          ← cores, tipografia, radius, sombras, gradientes
├── SCREENS_INVENTORY.md      ← lista de todas as telas, modais e componentes
├── logo/
│   ├── veeda-logo-mark.svg       ← logo quadrado (app icon)
│   └── veeda-logo-wordmark.svg   ← logo horizontal (mark + texto)
├── icons/                    ← 20 ícones SVG (stroke-based, editáveis)
│   ├── home.svg     circle.svg    received.svg   share.svg
│   ├── settings.svg plus.svg      check.svg      close.svg
│   ├── back.svg     heart.svg     mic.svg        camera.svg
│   ├── draw.svg     music.svg     location.svg   tag.svg
│   ├── bell.svg     search.svg    calendar.svg   lock.svg
│   └── leaf.svg
└── snapshots/                ← (reservado) HTML snapshots por tela
```

## Fluxo recomendado

### 1. Abra o arquivo Figma criado (link ao lado)

### 2. Crie os tokens (15 min)
- Siga `DESIGN_SYSTEM.md` seção 1 → **Variables › Color**.
- Siga seção 2 → **Text Styles**.
- Siga seção 5 → **Effect Styles**.

### 3. Importe os ícones (5 min)
- Arraste todos os `.svg` de `icons/` para uma **Page "Icons"**.
- Selecione tudo → **Create component set** (ou componente individual).
- Os ícones usam `stroke="currentColor"` — defina a cor no instance via Variables.

### 4. Importe o logo (2 min)
- Arraste os dois SVGs de `logo/` para uma **Page "Logo"**.
- Transforme cada um em componente.

### 5. Reconstrua as telas
Use `SCREENS_INVENTORY.md` como checklist. Para acelerar:
- **Plugin recomendado:** [html.to.design](https://www.figma.com/community/plugin/1159123024924461424/html-to-design)
- Abra o app no navegador (cada tela isoladamente) → copie a URL ou o HTML → cole no plugin → ele gera frames editáveis no Figma.

### 6. Feche o loop Figma → código
Quando fizer alterações no Figma, me avise com o **link do frame** (ou o node-id). Eu leio via Figma MCP (`get_design_context`) e aplico no código do app.

## Regras para manter o loop funcionando

- **Nomes de Variables = nomes dos tokens** em `DESIGN_SYSTEM.md` (`purple`, `purpleLight`, etc.). O MCP usa esses nomes para gerar código consistente com `C.purple` no app.
- **Nome de cada componente Figma = nome da função React** (`AvatarBubble`, `Btn`, `AddContactModal`, etc.).
- **Propriedades de componente** devem casar com `props` (`size`, `variant`, `ring`, `disabled`).
- Nunca renomeie/exclua um handle, layer ou variable sem me avisar — quebra o mapeamento.
