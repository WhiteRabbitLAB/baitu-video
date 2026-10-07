# Tech terminal (id: terminal-tech)

中文:[terminal-tech.md](terminal-tech.md)

![terminal-tech](thumbs/terminal-tech.en.jpg)
*Screenshot from a published video the author made with this scene. Demo frames on one neutral topic are in [demo/](demo/).*

## Visual world
A dark tech UI: terminal windows, cards and data panels on a deep blue-black background, lines and numbers with a slight blue glow; demos are "terminal animation in our own style", never imitating a real product's UI.

**Default style**: [tech-ui](../styles/tech-ui.en.md). When switching style, writing sources and components stay; their look is redrawn in the new style.

## Palette
Dark tech (../design/palettes.md): background #070B16, panels #0E1528, lines #1C2A47, blue #2E8BFF, glow #7CC2FF, dim text #8C9BB8; light pages #EEF0F4 / ink #1B1D22.

## Writing source → text roles (verified against past source and frames on 2026-10-07)
The pages loaded only Space Grotesk 500/700, JetBrains Mono 400/700 and Noto Sans SC 500/900. Neither Latin font has Chinese, so Chinese falls back to Noto Sans SC by weight: 700 lands on 900, 400 on 500. The table records the weights **actually rendered**.

| Role | Writing source | Chinese font | Latin / digits | Color | Carrier | Entrance |
|---|---|---|---|---|---|---|
| R1 Opening headline | Show title | Noto Sans SC 900 | Space Grotesk 700 | white | Directly over the picture (two lines, 128 / 96 px) | Typed letter by letter + blinking cursor, after a small blue monospace label typed above it |
| R2 Title | Page / card titles | Noto Sans SC 900 | Space Grotesk 700 | white; numbering blue | Page top left (a "release overview" title, 54–72 px), card headers | Rise + fade |
| R3 Body / labels | UI text | Noto Sans SC 500 | Space Grotesk 500 | white; emphasis warm orange #FF9E3D | Cards, lists, chart axis labels | Rise + fade |
| R3 Small labels | Panel corner labels | Noto Sans SC 900 | JetBrains Mono 700 | dim #8C9BB8 | Panel top left ("RELEASE", an "intelligence index") | With the panel |
| R4 Big number | Meters / benchmarks / prices | Noto Sans SC 900 (Chinese inside numbers) | JetBrains Mono 700 | white / glow blue #7CC2FF / warm orange (costs) | Data panels, bar ends | Counting up as the bar grows |
| R5 Primary source | Official wording / docs | Neither video had a separate quote card; decide next time | | | | |
| R6 Annotation | Emphasis | — | — | warm orange / blue outline box | Boxing a conclusion ("the cost: …") | Rise + fade |
| R7 Character dialogue | Mascot | The bottom subtitle bar is the mascot speaking: body Noto Sans SC 500 | "Mascot name ›" in JetBrains Mono 700; body Space Grotesk 500 47 px | name glow blue, body white | Subtitle bar (no separate bubble) | With narration |
| R8 Handwritten note | Not used in this scene (the UI has no handwriting layer) | | | | | |
| R9 Marker | Status tags | Noto Sans SC 900 | JetBrains Mono 700 | blue / warm orange outline + same-color text on dark (not white on blue) | Capsule | Fades in with its page |
| R10 Source credit | Source credit | Noto Sans SC 500 | JetBrains Mono 400 | dim | Bottom left "Source: …" 24 px; top right "Data as of …" | With the page |
| Terminal | Commands and output | Noto Sans SC 900 | JetBrains Mono 700 | blue / white / dim (no green in the palette) | Opening label, window title | Typed letter by letter + blinking cursor |

(The "windows" in the two past videos were mostly redrawn app UIs (a "travel planner", a "flight search") or chart windows, with no real command-line output; fill in this row properly the first time you do real terminal output.)

## Through-line elements
One terminal / workbench window; the source credit.

## Mascot and characters
The mascot stands beside the UI as an operator, holding up signs.

## Signature moves and transitions
The terminal types commands letter by letter and output scrolls; cards flip; numbers count.

## Cases
Two practical-AI videos (a new-model explainer, a travel guide); the decision-maker called the style sample "properly techy".

## Pitfalls
- Don't draw a real product's UI (copyright / misleading); label demos "schematic animation".
- No URLs on screen (measured: a product domain appeared on screen and the platform throttled the video).
- Frame-by-frame self-review often catches "empty frames", "numbers that never finished counting", "overlapping labels", "text touching the window frame" — two rounds of screenshot review are standard.
