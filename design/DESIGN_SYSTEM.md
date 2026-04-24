# Veeda — Design System

> Tokens extraídos de `veeda/index.html` (linhas 334–349) e `veeda/veeda-core.js`.
> Use estes valores para criar **Styles** e **Variables** no Figma antes de montar as telas.

---

## 1. Cores (Figma → Variables › Color)

### Primárias
| Token           | Hex       | Uso                                   |
|-----------------|-----------|---------------------------------------|
| `purple`        | `#9000FF` | Marca, botões primários, destaques    |
| `purpleLight`   | `#EDE9F6` | Chips, fundos de botões secundários   |
| `purpleMid`     | `#BB7DEB` | Gradientes, estados hover             |
| `purpleSoft`    | `#F9F1FF` | Cartões decorativos                   |

### Secundárias
| Token         | Hex       | Uso                           |
|---------------|-----------|-------------------------------|
| `blue`        | `#5B7FA6` | Informativo                   |
| `blueLight`   | `#E6EEF8` | Info boxes                    |
| `blueMid`     | `#A8C0DA` | Gradientes                    |
| `green`       | `#1D9E75` | Sucesso, confirmações         |
| `greenLight`  | `#EAFFF8` | Fundos de sucesso / bg geral  |
| `greenMid`    | `#4DB896` | Gradientes                    |
| `amber`       | `#D4860A` | Avisos                        |
| `amberLight`  | `#FFF3DC` | Fundos de aviso               |
| `red`         | `#C0392B` | Erros, delete                 |
| `redLight`    | `#FDE8E8` | Fundos de erro                |
| `pink`        | `#E91E8C` | Feeling "amor"                |
| `pinkLight`   | `#FDE8F4` |                               |
| `teal`        | `#0097A7` | Voice recorder                |
| `tealLight`   | `#E0F7FA` |                               |

### Neutros / Estrutura
| Token          | Hex       | Uso                   |
|----------------|-----------|-----------------------|
| `text`         | `#3A3350` | Texto principal       |
| `textMid`      | `#7A7090` | Texto secundário      |
| `textLight`    | `#ADA8C0` | Placeholder, inativo  |
| `white`        | `#FFFFFF` | Superfícies           |
| `cardBorder`   | `#CBC0D3` | Borda de cards        |
| `headerBorder` | `#DDD8EE` | Borda de header       |
| `bg`           | `#EAFFF8` | Fundo topo gradiente  |
| `bgGradEnd`    | `#FEFEFC` | Fundo base gradiente  |
| `splashBg`     | `#22FCB7` | Splash screen         |
| `tabActive`    | `#7B6FA0` | Tab ativa             |
| `overlay`      | `rgba(40,30,60,0.52)` | Overlay modal |

---

## 2. Tipografia

- **Fonte principal:** `Passo` (Google Fonts, pesos 400/600/700)
  - Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Fonte sans de sistema:** mesma stack sem Passo

### Escala (detectada no código)
| Role           | Size | Weight | Cor          |
|----------------|------|--------|--------------|
| Title XL       | 22   | 700    | `text`       |
| Title L        | 18   | 700    | `text`       |
| Title M        | 16   | 700    | `text`       |
| Body           | 14   | 400/500| `text`       |
| Body S         | 13   | 400    | `textMid`    |
| Caption        | 12   | 500/600| `textMid`    |
| Micro          | 10–11| 600    | `textLight`  |

Line-height padrão: **1.5–1.6** para body; **1.2** para títulos.

---

## 3. Radius
- `8` → inputs pequenos, chips
- `10` → info-boxes, botões de aba
- `14` → cards, textareas
- `18` → notificações flutuantes
- `50` → botões pill (primário)
- `50%` → avatares, dots

## 4. Spacing
Grid de **4px**. Padrões frequentes: `4, 6, 8, 10, 12, 14, 16, 20, 24`.

## 5. Sombras
- **Card padrão:** `0 4px 16px rgba(60,40,120,0.08)`
- **Notif flutuante:** `0 12px 40px rgba(60,40,120,.22)`
- **Botão primário:** `0 6px 18px rgba(144,0,255,.25)`

## 6. Gradientes recorrentes
- Header/marca: `linear-gradient(135deg, #9000FF, #5B7FA6)`
- Fundo app: `linear-gradient(180deg, #EAFFF8 0%, #FEFEFC 60%)`

---

## 7. Avatar
Componente circular com fundo `avatarColor` + emoji ou imagem. Tamanhos usados: **38, 42, 44, 46, 60, 64, 80**. Ring opcional (2px `purple`).

---

## 8. Como aplicar no Figma

1. Crie **Color Variables** com exatamente os nomes da tabela acima.
2. Crie **Text Styles** seguindo a escala da seção 2.
3. Crie **Effect Styles** com as sombras da seção 5.
4. Importe os SVGs de `design/icons/` como **Components** (um por ícone) — mantenha `stroke: currentColor` para que `color` do instance controle a cor.
5. Importe `design/logo/veeda-logo-mark.svg` e `veeda-logo-wordmark.svg` como componentes separados.
