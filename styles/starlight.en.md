# Starlight (id: starlight)

## Rendering language
A night sky: near-black ground (#05070D), a faint deep-blue nebula in the middle, fixed-seed stars. The "actors" are **glowing points** and **thin lines**.
- **Glowing points** (`kit.orb`): warm gold for the key quantity, the answer, the surprise; a point sliding from one place to another is a reveal.
- **Glowing lines** (`kit.glow`): cool blue (#56769E / #86B6E6) for structure and line art — number lines, the balance, food, ridges; 1.5–2.5px, no fills, each line with two bloom layers; while drawing, a bright point sits at the tip ("light draws the object").
- **Fill the frame**: a few layers of distant glowing ridges for depth; the subject (balance, number line) spans most of the width; no UI cards as containers (the first sample used cards; the decision-maker found the look "so-so").
- **Color = meaning**: warm gold (#F2C27A) only for the key quantity / answer; cool blue for structure; red (#E8646E) only for noise / quantities to watch; everything else warm white (#EEEAE2) and grey (#8C95A8).
- Lots of empty space, one thing per screen; small, restrained type.
Reference: a Douyin science video on information theory (Sept 2026, ~1.05M likes), studied frame by frame. We borrow the methods (color bound to meaning, light points as actors, audience participation), not its assets, titles or series name.

## Texture and post
- Stars are static in the backdrop (`backdrop: 'starfield'`); for life, layer `kit.particles(t)` (slowly rising, twinkling dust, reproducible per frame).
- Vignette .55; very light grain 5% (overlay).
- Glow: `kit.orb` draws three layers (large radial gradient + blurred middle + white core); the glow group carries `data-over` so it isn't counted as "text over artwork".

## Fonts
- **Noto Sans SC 300** for large text (R1 / R2 / R4), **Noto Sans SC 400** for small text (R3 / R6–R10; 300 is too faint below 30px); Latin and digits also use Noto Sans SC. All text carries a **neon glow** (`neon: true` ⇒ components are wrapped in `vc-neon`: two blur layers under the glyphs).
- Why not serif: the first version used Noto Serif SC Light; on the second sample the decision-maker said the type on top "doesn't quite fit". After a side-by-side of four options (serif / light sans + neon / LXGW Marker Gothic + neon / Smiley Sans + neon), light sans + neon won — uniform stroke width, the same kind of thing as the glowing line art; the bookish serif looked like a different picture (2026-10-10).
- Quotes R5 keep Noto Serif SC 300 + STIX Two Text (printed originals).
- **Cormorant Italic only for whole English sub-caption lines** (drawn by the page, see the sample): its old-style figures look like subscripts inside Chinese sentences (found on the first sample sheet, fixed).
- No handwriting layer: R8 notes become thin cool-blue text that lights up.

## Components
| Component | Look |
|---|---|
| Text entrance `glow` | From blurred to sharp, dark to bright (blur 9→0 + opacity), no movement, no bounce; 0.9s default, R1 1.1s; keeps the neon glow afterwards |
| Panel / window | Thin grey rounded frame (`line`) |
| Annotation | Underline sweeps left to right with glow (`glow`) |
| Stamp | Status chip (`chip`), gold outline |
| Numbers | Glow (`glow`); answers on a number line slide in as a point via `numberLine` |
| Bubble | Thin white rounded bubble with tail (`line`) |
| Audience participation | Choice frames, countdown ring, number line, blank underline are all thin lines; reveal = turns warm gold + glow |

## Motion
- Slow and soft: ease-out (cubic); a reveal point glides 1.2s ease-in-out; no overshoot, no slams.
- Leave a gap before reveals: after the question, the narration pauses 3–4s (`gapAfter` in `narration.json`) while `kit.countdown` runs, so viewers choose / guess first.
- Transitions: `blur-push` between shots (sample); within a scene avoid cuts — new elements light up, old ones dim.

## Characters
- Code-drawn: avoid characters; represent people as points (in the sample, 20 points = 20 participants). The placeholder mascot uses the `line` bubble style (solid body + big eyes) and reads like a sticker on the sky — use sparingly.
- Generated characters: ask for "line-art only, thin glowing strokes on near-black, no fill", then add glow in code.
- Code lighting: put a warm point behind the subject as the light source.

## Scenes
Sample (2026-10-10): two-meal choice + number-line guess (verified facts from episode 13, Hall 2019), `video/starlight-demo.html` → `out/starlight-demo/proto.mp4` (41s).
Suggested: concept explainers (one concept + three everyday examples + one twist), "guess first, then reveal" numbers, reveals of real experiment results.

## Samples (2026-10-10)
[Empty scene](samples/starlight-1-scene.jpg) · [Text roles R1–R10](samples/starlight-2-roles.jpg) · [Character](samples/starlight-3-character.jpg). Regenerate: `node engine/vc/samples.mjs starlight`. All audience-participation components on one screen: `engine/vc/quiz.html?style=starlight` (`&t=2.2` for before the reveal).

## Pitfalls
- Don't pass the whole page `innerHTML` to `VC.ready(kit, texts)`: its newlines and spaces make the "drawn width vs expected width" probe report 0 for every font (SVG collapses whitespace, canvas doesn't). Pass the text that actually appears on screen.
- Wrap the tag, content and label of a card in separate `<g>`s: the checker merges same-parent text into one string, and the merged box overlaps the plate line art, reporting a false "text over artwork" (one case in the sample; `choice` fixed).
- Bloom filters can't use bounding-box-relative regions: a horizontal / vertical straight line has zero height / width, so its glow vanishes (the balance beam had no glow in the second sample). `kit.glow` uses user-space `vc-bloom` / `vc-bloom-s`.
- The sample has no music; half of the reference's calm comes from ambient music — a real episode needs a licensed ambient track.
