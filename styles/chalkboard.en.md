# Chalkboard (id: chalkboard)

中文:[chalkboard.md](chalkboard.md)

## Rendering language
A classroom blackboard: a dark green board (#2E4A3E), four chalk colors — white (main lines, body text), yellow (titles, circling key points), pink (annotations, stamps), blue (notes, explanations).
Text, lines, frames and hatching are all **handwritten + chalk grain**, written out stroke by stroke in front of the viewer; shading by diagonal hatching.
Difference from dark-math: that one is 3b1b's on-screen typographic look (printed type, clean thin lines); this one is a person writing at a blackboard (decision-maker 2026-10-07: dark math "doesn't look like writing on a blackboard", so this style was made separately).

## Materials and post
- Chalk grain: `chalk: true` ⇒ all exported components get the `vc-chalk` filter (noise as an alpha mask, leaving small gaps in text and lines); the chapter progress bar is channel-wide and isn't filtered.
- Board: grain screen 10% + a gray-white haze from the eraser (5 wide strokes, 22 px blur, 4% opacity); a wooden frame when full screen. Vignette 35%.

## Font tendencies
Only one: **Jason Handwriting 1** (the finalized chalk font, ../design/fonts.md) for titles, body and numbers; no Gochi Hand for digits (hard to read). For handwritten English in an English version, switch to Gochi Hand. No printed or typed layers.

## Component looks
Reuses the whiteboard parts (hand-drawn wobbly frames, two-stroke bubble tails, stamps written first then circled, line-art mascot drawn stroke by stroke + hatching), recolored in chalk and all with chalk grain.
Annotations are a yellow chalk circle drawn in one stroke (`mark: 'ring'`, no multiply, so it shows on a dark board). The pen tip is a piece of chalk (`tool: 'chalk'`).

## Motion feel
Same as the whiteboard: handwriting letter by letter (angle ±2°, vertical ±3%, size ±4%), lines drawn stroke by stroke, hatching. Preferred transitions: pan across the same board (pan-next), pull back once the board is full; morph to advance a concept.

## How characters are drawn
Mascot as chalk line art + hatching (the same `kit.mascot` branch as the whiteboard, with chalk grain applied automatically). Generated characters: not recommended.

## Scenes it can draw
Samples: info cards. Suggested: concept lessons, teacher-style mechanism explainers, a "blackboard" scene (to build).

## Samples (2026-10-07)
[Empty scene](samples/chalkboard-1-scene.jpg) · [Text roles R1–R10](samples/chalkboard-2-roles.jpg) · [Character](samples/chalkboard-3-character.jpg). Regenerate: `node engine/vc/samples.mjs chalkboard`.

## Pitfalls
- When the eraser haze uses a blur filter, set the filter region in user space (`filterUnits="userSpaceOnUse"`): a nearly horizontal line has a very flat bounding box, and a proportional region clips it into a hard-edged band (seen in the first version).
- Red-pencil "multiply" annotations disappear on a dark board; switch to a non-multiplied chalk circle.
