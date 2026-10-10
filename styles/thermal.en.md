# Thermal receipt (id: thermal)

## Rendering language
A supermarket checkout receipt: off-white thermal paper strips (#F6F3EC) with **bitmap text** (black #1D1C1A) from the print head; the **red** of two-color thermal paper (#C8312B) is kept for a few spots only.
The strips curl slightly at both sides (a faint shadow on the left and right edges) and end in a torn zigzag; barcodes, dashed separators and receipt marks like "×1" and "≈" are a ready-made layout language.
**The metaphor is a bill**: whatever the printer prints is the account the machine keeps (item lists, numbers, readings); people write on the receipt with a ballpoint, circle with a red pen, and stamp it in red. It suits topics like "the same thing, but the bill adds up differently".
**Color is meaning**: red only for "the body's bill / a quantity to watch / stamps"; everything else is black. Too much red and it stops meaning anything.
The style's default is a **light counter** (#D9D3C6, the same lightness as the receipts, so shared components stay readable wherever they sit). A **dark checkout counter** (#2A2B2E, `c.desk`) is a scene choice: the page paints it and passes `fill: c.paper` to text that sits on it (episode 13 does this).

## Materials and post
- Ink mottle: text inside components gets `vc-thermal` (fractal noise knocks out a little ink, like a print head pressing unevenly); **the paper never goes through the filter**, only the ink (episode 13 stills: putting the whole strip through it turned the paper gray).
- Strip: `kit.panel(x, y, w, h, title)` draws a receipt (drop shadow + curled-edge shading + zigzag bottom + centered title + dashed rule).
- Counter: a fine 6px checker in light or dark, `backdrop: 'counter'`.
- 1-bit pixel icons: icons on the receipt are built from square pixels (a thermal printer can only print black dots), about 7px per cell.

## Type
- **Printed by the printer** (R1–R4, R10): **Fusion Pixel 12px**. Bitmap type **must be set at multiples of 12** (24 / 36 / 48 / 72 / 96 / 144) or strokes land on half pixels and blur — the style sets `pixel: 12`, so `kit.text` / `kit.fit` snap automatically, and `fit` shrinks in steps of 12.
- **Written by people**: ballpoint notes R8 = Xiaolai (blue #24324C); red-pen markup R6 = Zhi Mang Xing (red).
- **Stamped**: R9 = Noto Sans SC 900 in red.
- **Quoted originals on photocopies** R5 = Noto Serif SC 500 (journals and press releases aren't printed on receipts).
- Subtitles and the chapter bar follow the channel profile, not the style.

## Components
- Panel (`panel: 'receipt'`): a receipt strip, bitmap title centered + a dashed rule. Windows (chat, terminal) use `bezel` (a dark machine).
- Text entrance `print`: **a line is scanned in from top to bottom, one pixel row at a time** (the print head feeding paper), linear, no easing; 0.3s per line by default (R1 0.35s, R3/R10 0.2s, `printDur`). Multi-line `textFit` prints line after line.
- Stamp `ink` (red, mottled, drops with a small shake); markup `pencil` (red pen circle, multiply); numbers `print`; bubble `note` (paper slip + tape, ballpoint text).
- Placeholder character: red body + ink outline.

## Motion
- Receipts are **printed**: new content appears as the printer feeds paper (the strip grows downward, text scans in line by line) — no fades.
- Strips can be torn, curled, stacked and flipped (the back is another bill, e.g. the ingredient list); stamps land with a shake.
- Suggested transitions: feed (a new strip pushes out of the slot and shoves the old one off frame), tear-off (the old strip is torn along the zigzag). [ours] to be added as `kit.transition` kinds.

## Characters
- Code-drawn: 1-bit pixel icons (black dots are all a thermal printer can do); the placeholder character is red with an ink outline.
- Generated characters: ask for "1-bit thermal print, black dots on off-white receipt paper, no gray", then reduce to two colors in code.
- Code relighting: none; shading only through dot density (dither grid).

## Scenes
Full video ×1 (episode 13, 2026-10-10, 6:22 landscape): a dark checkout counter + receipts. Admission slip, daily tallies, four comparison strips, an ingredient list (illustrative), dot-matrix curves / scatter (labelled "illustrative") are all receipts; approved by the decision-maker.
Suggested: bills / lists / comparisons (calories, prices, time); experiment logs printed day by day; "looks the same, adds up differently" reveals.

## Samples (2026-10-10)
[empty scene](samples/thermal-1-scene.jpg) · [text roles R1–R10](samples/thermal-2-roles.jpg) · [character](samples/thermal-3-character.jpg). Re-render: `node engine/vc/samples.mjs thermal`.

Frames from the full video (episode 13: opening + four comparison strips):

![Frames from the thermal receipt full video](samples/thermal-film.jpg)

## Pitfalls
- **Quote font family names**: `Fusion Pixel 12` contains a word starting with a digit; unquoted, the whole `font-family` is dropped and the browser silently falls back to a sans — the first samples were entirely sans while every check was green. `fontAttr` in `vc.js` now always quotes (the same bug meant chalkboard's and whiteboard's `Jason Handwriting 1` never rendered since they were added; fixed 2026-10-10). `VC.ready` now compares drawn width with the width the font should give and reports the font as unused when they differ.
- With a dark counter as the style default, shared components' ink-colored text vanished on it; hence the light default, with the dark counter left to the scene.
- The out-of-frame positive control on the stress-test page (`fit-test.html?&bad`) doesn't fire on this style: R1 is only 72px and the longest line happens to fit. To prove the check works, temporarily raise `&bad` to 96px (7 out-of-frame hits, 2026-10-10).

## Learned on the full video (episode 13)
- **Three text tiers on a receipt**: title 48, body 36, notes 24 (all multiples of 12). Keep body at 36 or more; 24 is for notes and units only.
- **Receipts invite copying the subtitles**: a list naturally takes one sentence per line, and narration lines creep in (the first acceptance run flagged 43 seconds of echo). Rewriting them as bill-style short labels ("order: random", "kcal per gram = drinks excluded", "long-term effects: unknown"), same meaning and same fact rows, brought it to 0.
- **The "tear off" transition sweeps the subtitle band**: the torn edge crosses the bottom diagonally (17 frames over subtitles in the first cut). Shot changes use a vertical push instead (the camera tilts down: the old receipt leaves upward, the new printer slot comes up from below, never crossing the subtitle band), which also reads as paper feed; this transition still lives in the page, not yet in `kit.transition`.
- **Several receipts panning together collide on `clipPath` ids**: a page's own receipt helper must reset its counter every frame, as `kit.begin()` does, or a `print` reveal clips against another receipt.
- **Measure a rotated stamp by its bounding box**: leave room between the stamp text and the inner border (at -3°, height at least 100).
- **Label illustrative graphics on screen**: dot-matrix curves and scatter follow the paper's described direction, not read values; the ingredient list is illustrative, not a real product.
