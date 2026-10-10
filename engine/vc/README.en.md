# Shared components (VC)

中文:[README.md](README.md)

Visual components shared by every channel. Components only know text roles R1–R10; fonts, colors, carriers and entrances all come from the style.

| File | What it does |
|---|---|
| `vc.js` | The components (pure functions returning SVG strings, 1920×1080 coordinates, reproducible frame by frame) |
| `styles.js` | The style looks: paper skeuomorphic `paper-skeuo`, game skeuomorphic `game-ui`, flat geometric `flat-geometric`, flat illustration `flat-illustration`, cartoon UI `cartoon-ui`, dark tech `tech-ui`, whiteboard `whiteboard`, dark math `dark-math`, chalkboard `chalkboard`, kinetic type `kinetic`, Risograph `risograph`, thermal receipt `thermal` (12 in all; thumbnails in ../../styles/INDEX.md) |
| `demo.html` | Demo page: one row per component, switchable style, Chinese / English, timeline |
| `thumbs.html` / `thumbs.mjs` | Style thumbnails: the same scene, only the style changes; `node engine/vc/thumbs.mjs` → `.claude/skills/baitu-video/styles/thumbs/` |
| `transitions.html` / `measure-tx.mjs` | Transition demos (morph, zoom-through, slide-push, blur-push…) and transition measurement (with a linear-fade positive control): `node engine/vc/measure-tx.mjs paper-skeuo` |
| Fonts | `fonts.css` + `fonts/`: the engine's bundled subset fonts (every font the styles use, cut to the demo pages' characters); re-cut with `node <engine>/cli.mjs fonts-demo`. Finished episodes use `fonts <ep>` |
| `scene-gallery.html` / `scene-gallery.mjs` | Scene demo frames: one frame per scene (11), one neutral topic; `node engine/vc/scene-gallery.mjs en` (or `zh`) → the skill's `scenes/demo/` (scene cards show published-video screenshots in `scenes/thumbs/`; this doesn't overwrite them) |
| `shot.mjs` | Demo-page screenshots: `node engine/vc/shot.mjs <dir> paper-skeuo,zh,7.5 tech-ui,en,2.4` |

## Using them in a new episode
**Fastest: `node .claude/skills/baitu-video/engine/cli.mjs new <ep> --style <style>`** — the starter page it creates has all paths worked out (template [../templates/page.html](../templates/page.html)). When writing shots, copy from [demo.html](demo.html) — it shows how every component is used in every style.
By hand, with the page in the default location `video/<ep>.html`:
```html
<script src="../.claude/skills/baitu-video/engine/vc/vc.js"></script>
<script src="../.claude/skills/baitu-video/engine/vc/styles.js"></script>
<script>
const kit = VC.kit('paper-skeuo');
window.fontsReady = VC.ready(kit, [all text that appears on screen], ['Noto Sans SC:900']);   // third argument: fonts used outside the style table (e.g. subtitles). Returns "family:weight → count"; 0 = not loaded, and the renderer refuses to start
function render(t) {
  kit.begin();   // first thing each frame: resets clipPath ids
  …
}
</script>
```
Episode fonts: `node <engine>/cli.mjs fonts <ep>` cuts them for the styles the page uses and the characters it actually contains; the page links `<link rel="stylesheet" href="fonts-<ep>.css">`.

## Components
| Component | Call | Role | What the style decides |
|---|---|---|---|
| Per-frame base | `kit.begin()` (first line every frame); `<defs>${kit.defs()}</defs>`; `kit.backdrop(x, y, w, h)` | — | Paper / blackboard / whiteboard / dark backgrounds etc.; filters and gradients live in defs |
| Subtitles | `kit.subtitle(t, SUBS, {font,size,y,fill,stroke,strokeWidth,box,maxW})` | channel-wide | Not style-dependent; the spec lives in the channel profile; wraps to two lines past maxW (pass 960 for vertical) |
| Paragraph-start pan | `kit.panGroup(t, [start of paragraph 2, …], [shot1, shot2, …])`, each shot `t => SVG` | — | Not style-dependent |
| Drawn stroke by stroke | `kit.sketch(path d or array, t, t0, duration, {color,width,pen})`; wobbly lines `VC.wobblyLine(x1,y1,x2,y2,seed,amplitude)`, `VC.wobblyEllipse(cx,cy,rx,ry,seed,amplitude,overshoot)` | — | Whiteboard / blackboard line art; `pen:true` makes the pen follow the tip |
| Hatching (shadow side) | `kit.hatch(x, y, w, h, t, t0, duration, {clip,color,gap,width,opacity})` | — | Whiteboard / blackboard |
| Placeholder character | `kit.mascot(x, feet y, t, t0)` | — | A round body + sprout, drawn per style; replace with your own mascot |
| Role text (handwritten / typewriter / fade / pop) | `kit.text(role, s, x, y, t, t0, {anchor,size,fill})` | any R | Entrance: handwritten R8 on paper, monospace typed R8 in tech (no handwriting layer) |
| Text that fits (auto-shrink + wrap) | `kit.textFit(role, s, x, y, maxW, t, t0, {maxLines,min,size,lh,balance})`; for the result only, `kit.fit(role, s, maxW, same params)` → `{size, lines, ok, lh}` | any R | Same as `text` |
| Annotation | `kit.mark(x, y, w, h, t, t0)` | R6 | Red-pencil circle (multiply) / glowing underline / highlighter (drawn first, then the text) |
| Stamp | `kit.stamp(lines, cx, cy, t, t0, {rot,color})` | R9 | Mottled ink + a landing shake / status capsule / thick-outline sticker |
| Number | `kit.counter([[t,v],…], x, y, t, {fmt,unit})` | R4 | Printed + red line / glow / thick outline + a bounce |
| Bubble | `kit.bubble(s, x, y, t, t0, {side,t1,maxW})` | R7 | Taped paper note / rounded card / thick-outline bubble |
| AI dialog | `kit.chat(x, y, w, h, [{who,text,t0}], t, {title})` | R7 | Window frame and bubble colors |
| Terminal window | `kit.terminal(x, y, w, h, [{cmd,t0}/{out,t0}], t)` | commands and output | Device screen / dark window / thick-outline window |
| Chapter progress bar | `kit.chapterBar(t, [{name,start,end}])` | channel-wide | Only the accent color |
| Paragraph-start pan | `VC.pan(t, starts)` / `kit.panGroup(t, starts, [fn])` | — | Not style-dependent; default 1.2 s + motion blur |
| Transitions | `kit.transition(id, t, t0, A, B, params)`; id = `roller` (roller sweep: new shot left of the leading edge, old shot right of it, `{band,x0,x1}`) / `slide-push` / `blur-push` / `zoom-through` (`{cx,cy,r0}`) / `morph` (`{from,to}` paths + colors) / `fade` / `fill-zoom` / `bands` | — | slide-push's leading bar takes the accent color; zoom-through's opening background takes the style's background |
| Ink plates (Risograph) | `kit.ink('b'\|'p', content, {grain:'strong'\|'light'\|'none'})`; halftone fill `kit.tone('b', 0–1)`; page `<defs>${kit.defs({frame})}</defs>` (grain re-seeded by frame number) | — | Halftone and grain only exist in `riso` styles; elsewhere `tone` returns the solid color and `ink` only multiplies |
| Morphing | `VC.morphPath(dA, dB, k)`, `VC.shape.rect / circle` | — | Interpolates any two closed paths |
| Glowing lines | `kit.glow(path d or array, t, t0, duration, {col, w, k, hot, tip})` | — | Wide bloom + mid bloom + line + optional white core; with duration > 0 it draws on by length with a bright point at the tip. All Starlight line art (food, balance, number line, ridges) uses it; carries `data-over` |

## Rules
- **Numbers only change between real values**: every key in `counter` must be a fact-sheet value; digits roll individually with ease-out and no overshoot, so no frame ever shows a whole number other than the keys.
- Widths are measured with canvas (after fonts load): Chinese characters use the `zh` font, everything else the `en` font; —…“” in a Chinese context use the Chinese font.
- The paragraph-start pan defaults to 1.2 s (Vox median 1.29 s), slower than N8/N9's 0.85 s, with horizontal motion blur; for the old feel pass `{dur:.85, blur:false}`.
- Info panel `kit.panel(x, y, w, h, title)`: a style can give it its own look via `carriers.panel` (paper skeuomorphic = a sheet of paper); otherwise it uses the window look.
- One style's SVG per page: the `vc-*` defs ids are fixed, so several styles on one page clash (the side-by-side thumbnail page uses iframes for this reason).
- Adding a style: copy a set in `styles.js`; pick carriers from the existing kinds first, and for a new look add a kind branch to the matching component in `vc.js`.
- Older videos (N1–N9, A1–A6) weren't moved to these components; each is still its own big HTML.
- **Text of unpredictable length always uses `textFit`**: titles, thumbnail text, data-driven labels, every line in a vertical cut. It shrinks the size by real widths (default at most two lines, at least 0.6×), and `ok=false` warns in the console — then change the text or the layout instead of forcing it.
- **Line-breaking rules (shared by `wrap` / `fit` / bubbles / dialogs)**: Chinese breaks at word boundaries (the browser's `Intl.Segmenter`), never splitting "第 + number + measure word" (e.g. 第 114 卷); punctuation and closing quotes never start a line, opening quotes never end one. For two lines it picks among word boundaries: lines close in length, the first not shorter than the second, preferring breaks after commas / colons / spaces, never inside quotes or brackets.
- **Stress-test page `fit-test.html`**: a set of "unfriendly inputs" (very long titles, mixed Chinese and English, long punctuated sentences, long numbers); `?style=&w=&h=` changes style and size; controls `&bad` (no fit — should report out of frame) and `&overlap` (deliberate overlap — should report overlap). After changing layout code, run `engine/tools/check-text-bounds.mjs` over 12 styles × landscape and vertical; only all zeros passes (all zeros on 2026-10-07; all 24 runs zero on 2026-10-10 after adding thermal receipt). **Make sure the positive control actually fires on that style**: with small type, `&bad` may happen not to overflow (thermal receipt R1 is 72px); temporarily raise `&bad` to 96px and rerun.

## In a finished video (the first made with these components, 2026-10-07)
The first full video built with these components (12 shots, paper-skeuo). Practices worth copying:
- **Fonts**: that episode used an old script + the project's full font set; new episodes use the engine's `fonts <ep>` (family names matching `styles.js`, cutting only what's used).
- **Shot table + transitions**: `SHOTS = [{ fn, p, tx }]`, with transitions starting before the paragraph; `pan` and `flip` (flipping a medical chart) were written in the page, the rest straight `kit.transition(...)`. Morphs need a version of each of the two shots "without that object" (`shot3(t, { no: 1 })`).
- **Sound effects register themselves**: the page wraps `ty / hd / mk / st / dr` (typing, handwriting, annotation, stamp, paper landing) to log an entry when called; to generate sound effects, call each shot once "fully drawn" to get the complete cue list — when the picture changes, the sounds follow automatically.
- **Before export**: `fontsReady` is just `VC.ready`'s return value; fonts are cut with the engine's `fonts <ep>`, which registers every font of the styles the page uses, so "unused families reporting 0" can't happen. (That episode used the old approach: a hand-built `faces` object with only that episode's fonts.)

Pitfalls hit:
- `check-text-bounds` merges the `<text>` elements under one parent into a single string before measuring (for letter-by-letter handwriting): side-by-side independent strings (several readout lines on a screen, several items on a card) each need their own `<g>`, or the merged box reports overlaps that don't exist.
- `zoom-through` pads outside the opening with the style's base colour: a background the page draws itself must extend far beyond the frame for this transition; but `pan` / `slide-push` place the two shots side by side, so an oversized background lets the new shot cover the old one ⇒ pass the oversized version only as zoom-through's new shot (B, which grows out of the opening).
- If the thumbnail / vertical readiness code is written before `fontsReady`, `await window.fontsReady` gets undefined, and the `render(0)` when fonts become ready overwrites the thumbnail ⇒ first `while (!window.fontsReady) await …`, then draw.
- A file-writing tool turned escapes like `'：'` into the literal character on disk; later script replacements must match the actual character (the result was still full width, not broken).
- Some fonts draw traditional glyph forms for simplified characters (Long Cang's "时" → "時", see design/fonts.md); make a sample sheet of any new font and zoom in.
