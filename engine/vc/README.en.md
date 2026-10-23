# Shared components (VC)

中文:[README.md](README.md)

Visual components shared by every channel. Components only know text roles R1–R10; fonts, colors, carriers and entrances all come from the style.

| File | What it does |
|---|---|
| `vc.js` | The components (pure functions returning SVG strings, 1920×1080 coordinates, reproducible frame by frame) |
| `styles.js` | The style looks: paper skeuomorphic `paper-skeuo`, game skeuomorphic `game-ui`, flat geometric `flat-geometric`, flat illustration `flat-illustration`, cartoon UI `cartoon-ui`, dark tech `tech-ui`, whiteboard `whiteboard`, dark math `dark-math`, chalkboard `chalkboard`, kinetic type `kinetic`, Risograph `risograph`, thermal receipt `thermal`, starlight `starlight`, sports broadcast `broadcast`, 8-bit pixel `pixel`, newsprint `newsprint`, transit map `transit` (17 in all; thumbnails in ../../styles/INDEX.md) |
| `demo.html` | Demo page: one row per component, switchable style, Chinese / English, timeline |
| `receipt.js` | Receipt parts: an add-on module for the thermal receipt style (pulled out of the episode 13 full video), `const rc = VC.receipt(kit, {onPrint, onFeed})`; see the three "receipt" rows below |
| `broadcast.js` | Broadcast parts: an add-on module for the sports broadcast style (pulled out of the episode 14 full video), `const bc = VC.broadcast(kit, {onCue, onText, ledY})`; see the three "broadcast" rows below |
| `mannequin.js` | Wooden jointed mannequin (pulled out of the episode 21 full video): `const M = VC.mannequin`; poses `situp` / `standSide` / `standFront` / `seated` / `run` / `legPress` / `tennis`, drawn with `M.figure(J, {s, fat, heat, scan})` (fat-layer thickness per body region, effort glow, scan see-through); props `racket` / `dumbbell`; call `M.begin()` every frame and put `M.DEFS` in `<defs>`. No real people, no faces; the fat layer only illustrates thickness |
| `quiz.html` | Audience-participation components on one screen (choice + countdown, number-line guess, fill the blank, scramble, mask, points): `?style=<id>&t=seconds` (default 99 = all revealed; `t=2.2` for before the reveal) |
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
| Receipt (add-on `receipt.js`) | `rc.build(t, x, w, [{t0, h, d:(t, y) => SVG}], {top, lead, pad, slot})` a receipt that grows as it prints; lines: `rc.hd` (title) / `ln` / `row2` (two columns) / `ctr` / `dashed` (dashed rule); parts `rc.slot` (printer slot) / `strip` (paper strip) / `rule`; `onPrint(t0, chars)` / `onFeed(t0)` for sound-effect cues | R1 title 48 · R2 body 36 · R3 notes 24 | The strip grows with its lines, text is clipped to the paper, the ink filter wraps text only; clip ids reset with `kit.begin()` (several receipts panning in one frame never collide). Works in other styles too: paper from `c.paper` (else `c.card`), no curl shadow or ink mottle |
| 1-bit sprites, barcode, dot plots | `rc.sprite(name or row array, x, y, px)`, `rc.sprites([names…], x, y, px)` (library `VC.receipt.SPRITES`: 19 foods / objects, `'#'` = one dot); `rc.barcode(x, y, w, h, seed)`, `rc.dotBar` (halftone bar), `rc.dotCurve(x, y, w, h, [[x, 0–1]…], fill, bold, xMax)`, `rc.dotScatter(x, y, w, h, t, t0, up?)` | — | A thermal printer only prints dots: icons and curves are made of square dots; shapes drawn from a paper's description must be labelled "illustrative" on screen |
| Paper-feed transition | `rc.feed(t, t0, A, B, {dur: .9, under})` | — | The camera tilts down: the old frame leaves upward, the new one comes up from below (`under` = counter underneath, clipped to the new frame so it never covers the old one); unlike a tear-off, it never sweeps across the subtitle band |
| Broadcast: pitch and graphics (add-on `broadcast.js`) | `bc.pitch()` grass, `bc.led(t, text, t0, color)` pitch-side LED board (a new ad lights up left to right in 0.6s), `bc.tab(cx, y, text, t, t0, {anchor,w,size,fill,ink})` clock tab, `bc.head(t, t0, tag, title)`, `bc.refBar(cx, y, text, t, t0, {w,label})` referee bar, `bc.infoRow(x, y, w, label, text, t, t0)` info strip, `bc.steps(t, t0, [items…], current)` numbered steps, `bc.chip` / `pill` / `pills`, `bc.wipe(t, t0, x, y, w, h, SVG)` wipe any block in | R2 graphics · R3 small | Graphics are wiped in left to right (expoOut), never bounced (numbered steps fade in); clip ids reset with `kit.begin()`. `onCue(kind, t0)` for sound cues: swish wipe / ding referee / buzz LED / push + tick funnel / tx text wipe; `onText(text)` collects on-screen text for `VC.ready`; `bc.text` = `kit.text` with both hooks |
| Broadcast: scores | `bc.scoreboard(x, y, w, h, home, away, t, {scoreAt,scoreIn,scoreSize,nameSize})` (team = `{name, col, sub, score}`), `bc.miniBoard({x,y,w,tab,home,away,scores,sub,ref,t0,tScore,tRef,note}, t)` small scoreboard (two time points side by side), `bc.team(text, color, x, y, size, anchor)` italic team name, `bc.fixture(x, y, A, B, colA, colB, t, t0, struckAt)` fixture row | R4 scores (Anton) · R2 team names | CJK fonts have no true italic, so team names get a whole-group `skewX(-10)`; scores are group averages. **Not significant is written "not significant", never "a draw"** |
| Broadcast: funnel, result rows, dot grid | `bc.funnel(cx, y, w, label, count, t, t0, color)` one selection-funnel stage, `bc.result(y, region, t0, [[text,t0]…], [result,t0], color, [note,t0], t)` other-fixtures row, `bc.tip(y, n, text, small, t, t0, t1, color)` advice row, `bc.dots({x,y,n,keep}, t, t0, t1)` people dot grid (`VC.broadcast.pick(n, keep, seed)` picks with a fixed seed) | R2 · R3 · R4 | Falling head counts dim dots instead of rolling digits. Works in other styles: boards use `c.navy` (else the broadcast navy set, never a light `c.surface` / `c.card`), plain text on boards is white, secondary text light gray, scores use team colors, team names are white on scoreboards and team-colored on fixture rows (the broadcast orange / blue when the style has no `c.home` / `c.away`); pass the canvas as `{W, H}`, the LED board defaults to 290 above the bottom, and when the side copies of the ad text don't fit only the middle one is drawn |
| Glowing lines | `kit.glow(path d or array, t, t0, duration, {col, w, k, hot, tip})` | — | Wide bloom + mid bloom + line + optional white core; with duration > 0 it draws on by length with a bright point at the tip. All Starlight line art (food, balance, number line, ridges) uses it; carries `data-over` |
| Points / dust | `kit.orb(x, y, r, {k, col})`; `kit.particles(t, {n, x, y, w, h, speed, seed})` | — | Points default to `c.glow`; both carry `data-over`, so the checker doesn't count them as text over artwork. The actors of the Starlight style; usable in any style |
| Light pen | `const pen = kit.lightpen(segs, {col, w, hot, cams, follow, headOut})`; per frame `pen.stars(t)`, `pen.render(t)`; `pen.S(x, y, t)` world → screen, `pen.at(i, k)`, `pen.head(t)` | — | One pen draws the whole piece in a single line: a long world-space path drawn in segments, joined automatically along their tangents (`jump:true` lifts the pen). The tip is a white core, a halo and a horizontal lens streak, with a hot white stretch behind it. The camera follows keyframes or the tip (`follow`); line width and glow stay constant on screen. `stars` is a starfield with blurred bokeh that moves with parallax. Pages fade world-space labels before they reach the margin, so text never leaves the frame. Sample: `video/lightpen-demo.html` |
| Audience: countdown | `kit.countdown(x, y, t, t0, {n:3, r, label})` | R2 digits / R10 | A thin ring runs out over n seconds; place it after the question while the narration pauses (`gapAfter` in `narration.json`) |
| Audience: choice | `kit.choice([{x,y,w,h,label,tag,inner:t=>SVG}], t, {t0, gap, tReveal, pick})` | R2 labels / R10 tags | Frames use the style's window shape; on reveal the picked one gets an accent outline + glow, the others dim |
| Audience: number-line guess | `kit.numberLine(x, y, w, lo, hi, t, {t0, ticks, unit, label, guesses:[{v,t}], answer:{v,from,t}, answerSize})` | R10 ticks / R4 answer | A point glides from `from` to the answer (1.2s), then the answer lights up; **only real values are shown, no rolling through in-between numbers** |
| Audience: fill the blank | `kit.blank(prefix, answer, x, y, t, {t0, tFill, role, size})` | any R (default R1) | The blank (underline) blinks while viewers fill it in; at tFill the answer drops in in the accent color |
| Audience: scramble | `kit.scramble(scrambled, correct, x, y, t, {t0, tFix, dur, role})` | any R (default R2) | Viewers read the scrambled line first (and find they still can), then characters arc back into place; both strings must have the same characters |
| Audience: mask | `kit.mask(sentence, [indexes of covered chars], x, y, t, {t0, tReveal, role, color})` | any R (default R2) | Solid blocks fully cover the characters (`data-over`); on reveal they shrink away one by one |

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
