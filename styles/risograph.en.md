# Risograph (id: risograph)

中文:[risograph.md](risograph.md)

## Rendering language
Indie-magazine / exhibition-poster Risograph printing: only two inks on off-white paper (#F3EEE3) — **blue (#0078BF) and fluorescent pink (#FF48B0)**; where the two plates overlap, purple appears.
No gradients, no shadows: tone comes only from **halftone dots** (7 px grid, blue at 15°, pink at 75°, 21 steps); objects are separated by paper-white gaps and ink lines.
**Color is meaning**: pink only marks "the key point / the quantity to watch" (episode 11: mercury); everything else is blue. Too much pink and it stops meaning anything.
Layout suggestion: leave a **print margin** all round (36 px frame margin, ~170 px at the bottom for subtitles and the chapter bar), like a printed page.

## Materials and post
- One plate per ink: `kit.ink('b'|'p', content)` = multiply + grain + misregistration (the pink plate is offset a fixed 3,-2 px, `misreg`). Within one plate, paper color drawn later covers ink drawn earlier ("no ink here"), so **a same-color object on a same-color background must knock the background out with paper color first**, otherwise two blues merge and you can't see the shape.
- Halftone: `fill="${kit.tone('b', .4)}"` (0–1, ≥.975 = solid).
- Grain: paper-colored specks over the ink (`vc-riso-s` for fills, `vc-riso-l` for components and text), re-seeded 12 times a second. **Text only gets the light grain.**
- Paper: base color + 5% fiber texture. No vignette.

## Font tendencies
Chinese always in **upright sans**: Noto Sans SC 900 (titles, stamps) / 500 (body, dialogue). Big numbers and condensed English titles: Anton; readouts and typed quotes: Space Mono; **Latin species names in Cormorant Italic** (biological convention, R8's `en`).
No slanted Chinese (Smiley Sans and the like): slant + grain + misregistered double print "looks noisy" (decision-maker, 2026-10-08, episode 11 sample). No handwriting layer; notes become printed type.

## Component looks
- Panel / window (`window: 'riso'`): a paper card + 4 px ink outline + pink title strip, title knocked out in paper color.
- Bubble (`bubble: 'riso'`): paper card + ink outline + pointed tail, fade-up.
- Stamp: mottled ink stamp (`stamp: 'ink'`), pink, multiply — the closest thing to Riso there is.
- Annotation: pink highlighter under the words (`mark: 'marker'`). Numbers: print + a pink rule on change (`counter: 'print'`).
- Placeholder character: blue halftone body + ink outline + pink leaves.

## Motion feel
- Print doesn't shake: **fixed misregistration, no per-frame jitter** (per-frame jitter reads as stutter, decision-maker 2026-10-08). Re-seeding the grain 12×/s is enough to feel printed.
- Transition: **roller sweep** (`kit.transition('roller', …)`, 1.1 s): a full-height band of blue ink with a pink edge sweeps left to right; **left of the leading edge is already the new shot, right of it still the old one**. Never "hard-cut the whole frame when the band reaches the middle" — it looks choppy.
- Only the opening title gets a two-color double print (blue and pink, 6 px apart); no other text is doubled.
- Stamping, tearing labels, flipping packages — handmade-print actions suit this style best.

## How to draw people
- Code-drawn: halftone fills + ink lines; good for geometric fish, objects, the placeholder character.
- Generated characters: ask for "two-color risograph print, blue and fluorescent pink only, halftone dots, no gradients, off-white paper", then re-color into the two plates in code.
- Code lighting: none; tone comes only from halftone steps.

## Scenes it can draw
Used in the episode 11 sample: deep-sea section (`../scenes/deep-sea-section.en.md`), news-summary cards, label / packaging close-ups, dot-matrix data charts.
Suggested: food, products, "identify / classify" explainers; info cards.

## Samples (2026-10-09)
[Empty scene](samples/risograph-1-scene.jpg) · [Text roles R1–R10](samples/risograph-2-roles.jpg) · [Character](samples/risograph-3-character.jpg). Regenerate: `node engine/vc/samples.mjs risograph`.

## Pitfalls
- Same-color overdraw is a union: a light-blue fish in deep-blue water "disappears" — knock out with paper first.
- Using fill-strength grain on text eats small type: components default to the light grain; put page text in a `grain:'light'` plate too.
- Text touching the frame edge must be caught by a check, not by eye (the episode 11 sample let one line through): run the out-of-frame check before delivering.
- The first version was a canvas page outside the skill doing per-pixel compositing; the browser crashed around frame 1000–1400 on export (memory pressure). It now uses the SVG components and does no compositing of its own.
- **Text and artwork overlapping** (two cases the decision-maker caught in the episode 11 film): a question line appeared while the news cards were still leaving and sat on top of them; "look at the color / look at the name" straddled the edge of the tray. Text-vs-text checks can't see this ⇒ acceptance now scans every frame for text/artwork overlap (a single frame counts), which found 5 more in the same episode; it runs automatically when the page declares `window.CHECK`. Don't let exits and entrances share the frame: finish one group's exit before the next appears.
