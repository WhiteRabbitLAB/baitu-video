# Motion and materials

中文:[motion.md](motion.md)

Camera, transition and pacing parameters (with sources) are in [camera-transitions.md](camera-transitions.en.md); this file covers text entrances, materials and small loops inside a scene.

## Text entrances
- **Handwriting** (fountain pen, ballpoint, brush, marker): laid out character by character (using the font's real advance widths); each character gets small fixed-seed irregularities — angle ±2°, vertical ±3% of size, size ±4%, ink ±15% (×1.4 jitter in the case-file style looks more human); each character wipes in left to right, a line written at an even pace by character count. **No SVG displacement filters** (the fuzzy edges look blurry).
- **Typewriter**: each character appears instantly with random ink density, a few slightly high or low; with a typing sound.
- **Red-pen annotation**: drawn stroke by stroke; multiply.
- **Stamp**: one downward hit + a mottled-ink mask + a slight shake.
- **Numbers**: rolling / ticking **shows only real values**, never flashing intermediate or out-of-range values.
- **Pop** (bubbles, labels): a slight overshoot and settle.
- **Fade + rise** (flat): opacity + moving up 12–20 px.

## Camera
- **Paragraph-start pan**: move across the same desk / wall to the next area (the default join for paper and dashboard scenes).
- **Push in / pull back**: push in on the area being discussed, pull back to the full view afterwards (UI scenes).
- **Zoom punch**: a slight scale bounce at the cut, on the beat.
- **Parallax scroll**: layers scroll at different rates, driven by "distance travelled" rather than time (so it can stop).

## Things that keep moving in a scene (to avoid "transitions between pictures")
Every scene needs at least 2–4 small loops: light flecks, grain, instrument curves, fog, fireflies, window lights, paper gently rising and falling… taken from the scene's own motifs.

## Materials
| Material | How | Used in |
|---|---|---|
| Paper / kraft paper | Drawn pixel by pixel on a canvas once, then reused | Paper skeuomorphic |
| Film / paper grain | A pre-generated noise texture, overlay 6–9%, offset changing 12 times a second | Almost every style |
| Vignette | A radial gradient darkening the edges | Almost every style |
| Ink overprint | Multiply | Red pen, file-red printing, stamps |
| Desk lamp / window light | A lighting gradient multiplied over everything | Paper skeuomorphic |
| Gold-edged panel | Gradient stroke + inner shadow | Game skeuomorphic |
| Halftone (Risograph) | 21 dot patterns per ink, 7 px grid, blue at 15°, pink at 75°; `kit.tone(ink, level)` | Risograph |
| Ink plates + misregistration | One group per ink, multiplied; the pink plate is offset a fixed (3,-2) px, **no per-frame jitter**; `kit.ink(ink, content)` | Risograph |
| Print grain | Paper-colored specks over the ink (not holes in the paper), re-seeded 12×/s; strong for fills, light for text | Risograph |

## Mechanism animations (the picture acts out a process)
- **Bioaccumulation particles**: each unit of "mercury" is a pink dot with its own host chain (water → small fish → mid fish → big fish); when prey is eaten it slides straight into the predator's mouth and shrinks away, and each of its dots flies to a fixed spot inside the predator (one random body coordinate per dot per host, reproducible frame by frame). For "the longer it lives", new dots pop up one by one inside the big fish + an age counter. A "schematic · not measured" tag stays in the corner, followed straight away by measured data (episode 11: an FDA-mean dot matrix, one dot = 0.01 mg/kg). [Ours] episode 11.
- **Tear the label**: a zig-zag paper strip covers the real name; when torn it curls from its top-left corner + rises + fades (gone by 0.35–0.65 of the move, before it can leave the frame), then the real (Latin) name shows. [Ours] episode 11.
- **Flip the package**: squash horizontally to 0 and expand again (front in the first half, back in the second), with the key line on the back brushed with a highlighter. [Ours] episode 11.

## Adding
For a new motion or material write: how it's done, parameters, which style it's for, the reference implementation.
