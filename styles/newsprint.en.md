# Newsprint (id: newsprint)

## Rendering language
An old newspaper page: **newsprint** (cream #EBE3CF, fibre grain, one horizontal fold crease), **black ink plus one red**, a heavy serif headline, **thick-and-thin double rules** between sections (one thick and one thin rule on top, a thin vertical rule between columns), and every photo as a **45° halftone**.
No rounded corners, no drop shadows, no gradients (apart from the crease and the yellowed edges); hierarchy comes from rules and type size, not colour blocks.
**The metaphor is "this was the headline back then"**: historical events, reversals and corrections. **Correction notices, wire copy, extras and letters to the editor** come with the style ("what the paper said then → what was corrected later" is exactly the structure of a myth-busting topic).
**Colour carries meaning**: red #C3241B only for the "Extra" masthead, the proofreader's red pen and stamps; everything else is black ink.

## Material and post-processing
- Backdrop `backdrop: 'newsprint'`: paper colour + grain (multiply .2) + a fold crease across the middle (`vc-fold`: dark–light–dark); yellowed edges via vignette `vig: .22`.
- Halftone pattern `vc-ht-news` (9 px, 45°, black dots). For photos and illustrations see still C: draw a greyscale image on an offscreen canvas, sample it on a 45° screen, dot area proportional to darkness (radius = cell × 0.6 × √darkness).
- The whole page can be turned 0.5–1° (like a paper lying on a desk), with dark desk showing at the corners.

## Font preferences
- Headlines R1 R2, big numbers R4, stamp R9: **Noto Serif SC 900**. Body R3 R7 R10: Noto Serif SC 500.
- Source text R5: wire copy. Chinese in serif 500, Latin in **Special Elite** (teleprinter), typed out character by character with slight ink variation.
- Only two kinds of handwriting: the proofreader's red pen R6 (**Zhi Mang Xing**, red, multiply) and a reader's ballpoint note on the paper R8 (**Xiaolai**, blue-black).
- The masthead's "Extra" can use UnifrakturMaguntia (blackletter); it is page artwork, not a role.
- Never used: sans-serif headlines (they look like a web page), pixel type, neon.

## Components
- Text entrance `fadeUp`; source text `type`; red pen `hand`.
- Mark `pencil` (red pencil circle, multiply); stamp `ink` (red ink stamp that lands with a bump); counter `print` (a red rule underneath when it changes).
- Bubble `quote`: a newspaper pull quote. No box; a red vertical bar on the left, thin rules above and below, paper-coloured backing. Window / panel `column`: a column with one thick and one thin rule on top, a serif column title, a thin rule under the title, and a thin rule at the bottom.
- Page parts drawn by the page (still C has them): masthead with two ears, dateline (one line between double rules), full-width headline and deck, body columns, pull quote, a small "also" item, halftone photo with caption.

## Motion feel
- Slow and steady: text fades in, wire copy types out; no bounce, no fling. The camera **pans and pushes in** across one page (like a camera scanning the layout), one thing per screen.
- Transitions: the classic "spinning newspaper" only once at the open (it reads as dated very easily on Douyin); between sections use a page turn or a slide. Neither is in the engine yet.
- Numbers only move between real values.

## How characters are drawn
- Drawn in code: people and objects become **halftone photos** (greyscale illustration → halftone), captioned "illustration". No cartoon line art. The placeholder `mascot` has a halftone body and leaves in the one red.
- Generated characters: "black-and-white newspaper photograph, coarse 45-degree halftone, high contrast, 1960s press photo", then run your own halftone pass so the dot size matches the page. **Never** generate images that pass as real historical photos; always label them as illustrations.
- Code lighting: none; light and shade are dot size only.

## Scenes it can draw
Full film ×1 (2026-10-12, N15, a myth-busting topic, 7′30″, 19 pages). Still ×1 (2026-10-12, the 1969 Moon landing extra: masthead, dateline, full-width headline, halftone photo, wire-copy body, pull quote, "also" item).
Suggested: historical events told as documentary, "how it was reported then → how it was corrected" myth-busting, experiment documentaries (how the press covered the experiment), people stories (obituary or profile layouts).

## Samples (2026-10-12)
[Empty scene](samples/newsprint-1-scene.jpg) · [Text roles R1–R10](samples/newsprint-2-roles.jpg) · [Character](samples/newsprint-3-character.jpg). Re-render: `node engine/vc/samples.mjs newsprint`.

## Pitfalls
- **Type must be much larger than on a real newspaper** (N15, the owner after watching: "a lot of the text is too small, it doesn't feel good"). Dense small print is unreadable in a video and looks dull; the newspaper feel comes from the paper, double rules, halftone and big headlines. Minimums (the style defaults since 2026-10-12): notes R3 ≥ 42 in black ink (not grey), column heads 46, captions / sources R10 ≥ 30, red pencil R6 ≥ 64, banner headlines 110–140, key numbers ≥ 130; 4–6 lines per page, filling the 200–900 band.
- **Draw the halftone source with contrast first** (N15): if subject and background are too close in grey, the dots turn to mush. Darken the background (~#555), make subjects either very light (#f7) or very dark (#1c), and outline light objects with a 4–5px dark stroke.
- **Don't use the rolling counter for numbers** (N15): mid-roll, the checker sees two overlapping number strings. Print the old value, strike it in red pencil, and print the new value on its own line.
- **Keep stamp rotation small** (N15): at -8° the dropping stamp's inner frame grazes its own text for one frame; -4° is fine.
- **Chart bars are either to scale or labelled as illustrative** (N15 review).
- **The first halftone photo turned to mush**: with radius = cell × 0.72 × √darkness, mid-grey nearly filled the cell and neither the lander nor the astronaut could be made out. Changed to 0.6, and the source image's subjects were drawn brighter and larger (more than half the photo's height).
- **Numbers must not split across lines**: wrapping columns by character count split "11 号" into "1 / 1 号". Wrap with ASCII runs kept whole when measuring width, and no punctuation at the start of a line.
- **Don't imitate a real newspaper**: the masthead says only "号外 / Extra", never a real paper's name or layout marks.
