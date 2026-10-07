# Kinetic type (id: kinetic)

中文:[kinetic.md](kinetic.md)

## Rendering language
The words are the actors: a near-black background (#0E0E10), heavy off-white type, one loud yellow (#FFD23F) + one red-orange (#FF4D2E). Keywords slam in on the narration's stresses, then pin in place; there's almost nothing on screen but words.
Suits vertical, lists (../formats/listicle.md), and the first 3 seconds of opinion videos.

## Materials and post
Very light grain, light vignette (25%). No paper texture, no light effects.

## Font tendencies
Chinese in Noto Sans SC 900 (main words) / 500 (small text); English and digits in Anton (OFL, a condensed heavy face); notes in Smiley Sans (italic feel). No handwriting, typing or printed-original layers.

## Component looks
| Component | Look |
|---|---|
| Annotation / highlight | A red-orange block brushed from the left all the way across, under the text, with the text in white (`mark: 'block'`). **White on yellow is unreadable**, so the block is red-orange |
| Stamp / marker | A solid yellow slab + heavy black text, tilted 4°, flung in and landing (`stamp: 'slab'`) |
| Big number | Big yellow Anton, jumping on change (zoom punch), only between real values |
| Bubble / panel | Outline-free flat blocks (reused from flat-geometric) |
| Character | A two-tone flat mascot |

## Motion feel [ours] implemented in engine/vc; samples reviewed by the decision-maker
- Main words **fling in** (`entrance: 'slam'`): 6 frames from 1.9× down to 0.94, 2 frames rebounding to 1, a landing shake (0.15 s decay), then pinned.
- Small words **slide in** (`entrance: 'slide'`): 4 frames from 40 px to the left into place.
- Signature transitions: **fill-zoom** (rush into a shape whose color = the next screen's background), **bands** (three diagonal color bands in relay). Parameters and measurements in ../design/camera-transitions.md, "Transitions in the shared components".
- **bands is intense**: max frame-to-frame jump 112 (slide-push is only 19–21) — use it sparingly, only for the fastest section changes.

## How characters are drawn
A flat two-tone mascot; in this style the character is supporting cast and the words are the stars.

## Scenes it can draw
Samples: info cards. Suggested: vertical lists, the first 3 seconds, opinion-video punchlines.

## Samples (2026-10-07)
[Empty scene](samples/kinetic-1-scene.jpg) · [Text roles R1–R10](samples/kinetic-2-roles.jpg) · [Character](samples/kinetic-3-character.jpg). Regenerate: `node engine/vc/samples.mjs kinetic`; transition demo `engine/vc/transitions.html?style=kinetic`.

## Pitfalls
- When flinging in, words first scale up to 1.9×; leave enough room around the layout, or big words go off frame or cover other elements.
