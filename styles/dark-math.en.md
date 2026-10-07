# Dark math (id: dark-math)

中文:[dark-math.md](dark-math.md)

## Rendering language
Note: this is 3b1b's **on-screen typographic look** (printed type, clean thin lines), not a blackboard; for a chalk-board feel use [chalkboard](chalkboard.en.md).
The 3Blue1Brown approach: a near-black background (#111214), **one object morphing continuously into the next**, color = concept (the same quantity keeps the same color all video, text and graphics matching).
Lines are thin (2.5–4 px), clean, no wobble; fills are solid, no gradients or materials. Emphasis comes from "a yellow box around it", not from enlarging or glowing.

## Materials and post
Almost none: very light grain (overlay 6%), light vignette (20%).

## Palette [primary source] manimgl `default_config.yml`
| Use | Color | Manim name |
|---|---|---|
| Main color / big numbers | #58C4DD | blue_c |
| Notes / second concept | #5CD0B3 | teal_c |
| Third concept | #83C167 | green_c |
| Emphasis box / annotation | #FFFF00 | yellow_c |
| Spare | #F0AC5F, #FC6255 | gold_c, red_c |
| Character body | #1C758A | blue_e (the π creature's color) |
| Secondary text / lines | #BBBBBB / #888888 | grey_b / grey_c |
Background: manimgl's default is #333333; 3b1b's finished videos are darker, so we use #111214 (our choice, adjustable).

## Font tendencies
Chinese in Noto Sans SC 500; English and digits in STIX Two Text (OFL, a serif math face standing in for 3b1b's LaTeX Computer Modern). Terminal in JetBrains Mono. Only these two + monospace.

## Component looks
| Component | Look |
|---|---|
| Panel / window | Thin gray rounded frame, small title top left |
| Bubble | Thin white rounded bubble + tail, drawn in one stroke before the text appears (the π creature's bubble) |
| Stamp / marker | Yellow text "written" first, then a thin rectangle drawn around it |
| Annotation | A yellow rectangle drawn around it in one stroke (Manim's SurroundingRectangle) |
| Big number | Big blue serif digits, changing only between real values |

## Motion feel
- **Write**: each character first outlines, then fills, then drops the stroke, characters staggered (`entrance: 'write'`).
- Easing is smooth (6t⁵−15t⁴+10t³, matching the manimgl source); default animation length 1.0 s [primary source] manimgl.
- Transitions: **mostly morph**, **zoom-through** to go down a level; almost no cuts; no fade transitions (Manim's FadeIn/Out is only for elements).

## How characters are drawn
- In code: the mascot drawn like the π creature — a solid dark-blue body, no outline, big white eyes with black pupils, looking at whoever is talking (`kit.mascot`, line branch).
- Generated characters: not recommended; characters in this style should stay simple.

## Scenes it can draw
Samples: info cards. Suggested: concept lessons (../formats/concept-lesson.md), a "coordinates & graphs" scene (to build).

## Samples (2026-10-07)
[Empty scene](samples/dark-math-1-scene.jpg) · [Text roles R1–R10](samples/dark-math-2-roles.jpg) · [Character](samples/dark-math-3-character.jpg). Regenerate: `node engine/vc/samples.mjs dark-math`.

## Pitfalls
- The "star shapes" — coordinate systems, function curves — aren't components yet; add them (axes, function curves, secants / tangents, tables) when making the first concept lesson.
