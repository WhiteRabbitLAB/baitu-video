# Whiteboard (id: whiteboard)

中文:[whiteboard.md](whiteboard.md)

## Rendering language
A near-white board (#F8F8F5) with marker line art: black (main lines), blue (explanations and numbers), red (annotations, circling key points), green (spare); line width 4.5–7 px, each stroke in one go with slightly overshooting ends and a fixed-seed wobble.
No flat fills — **diagonal hatching** for shading / emphasis; **everything is drawn in front of the viewer** (drawn while talking), and you can pull back at the end to show the whole board.

## Materials and post
Board + faint traces of incomplete erasing (wide gray lines, 2.2% opacity); an aluminium frame when full screen. Almost no vignette (6%), no grain.

## Font tendencies
Three, all OFL (../design/fonts.md):
- Titles / big text / big numbers / markers: LXGW Marker Gothic (marker-style sans)
- Explanations, notes, dialogue, annotations, copied originals: Jason Handwriting 1
- Monospace (terminal): JetBrains Mono
Digits and Latin use these two Chinese fonts' own glyphs; **don't use Gochi Hand for digits**: its 5 looks like an S and its 7 has a crossbar — hard to read (2026-10-07 sample). For handwritten English in an English version, switch to Gochi Hand.
No typewriter or printed-original layers — everything on a whiteboard is hand-copied.

## Component looks
| Component | Look |
|---|---|
| Panel / window | A hand-drawn wobbly frame (`VC.wobblyRect`), title handwritten on the top edge with a blue hand-drawn line beneath |
| Bubble | Hand-drawn frame + a two-stroke tail; frame first, then the text |
| Stamp / marker | Red text + a wobbly frame circled in one marker stroke (text first, then the circle) |
| Annotation | A red marker circle |
| Big number | Blue marker-style sans, changing only between real values |
| Character | Line art drawn stroke by stroke, the right half hatched as the shadow side |

## Motion feel
- **Drawn stroke by stroke**: `kit.sketch(path, t, t0, duration)`, with a marker following the tip (cap color = ink color); multiple paths share the duration by length, one stroke after another.
- **Hatching**: `kit.hatch(...)`, diagonal lines drawn in one by one.
- Text is written out per the R8 handwriting rules (angle ±2°, vertical ±3%, size ±4%).
- Preferred transitions: **pan-next** across the same board, or **pull back on the whole board** once it's full; **morph** to advance a concept. No fades.

## How characters are drawn
- In code: mascot line art + hatching (`kit.mascot`, whiteboard branch) — being drawn stroke by stroke is the performance.
- Generated characters: ask for "black marker line art, white background, no fills, even line width, diagonal hatching allowed", then remove the background, keeping only the lines.
- No relighting needed: a whiteboard has no light and shadow, only hatching.

## Scenes it can draw
Samples: info cards (thumbs). Suggested: concept lessons (../formats/concept-lesson.md), mechanism explainers, a whiteboard / blackboard scene (to build).

## Samples (2026-10-07)
[Empty scene](samples/whiteboard-1-scene.jpg) · [Text roles R1–R10](samples/whiteboard-2-roles.jpg) · [Character (half drawn / finished)](samples/whiteboard-3-character.jpg). Regenerate: `node engine/vc/samples.mjs whiteboard`.

## Pitfalls
- Erase marks that are too strong look dirty (the first version at 4.5% opacity was rejected; now 2.2%).
- The annotation color needs its own setting (`c.mark` = red), or it follows the accent color and becomes a blue circle.
