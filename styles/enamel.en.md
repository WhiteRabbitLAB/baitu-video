# Enamel home (id: enamel)

The metaphor: "the table at your parents' place". It suits topics about family eating habits, the kind viewers would forward to their parents. First used in episode 16 (scalding tea, smoking and drinking, and oesophageal cancer, 2026-10-14; the decision-maker picked it from three new-style stills).

## Rendering language
- Flat fills plus one soft horizontal gradient (enamel mug bodies, the thermos shell), no black outlines; shadows are a blurred dark ellipse.
- One long wall: an off-white plaster upper wall (#ECE5D3) above a green-painted dado (#6E9B84, with a darker green line along the top); the table is a red-and-white checked plastic tablecloth (checks skewed and squashed vertically for perspective).
- Color is meaning: **enamel red** = a quantity to watch; **dado green** = calm, nothing found, advice; **dark blue** (the iron underneath, #1F2C45) = neutral explanation such as research institutions and observational studies.
- A very faint grain over the whole screen (feTurbulence, opacity .07).

## Materials and post
- Enamel: cream mug body + red rim + a dark-blue band at the base; **where the enamel has chipped, the dark-blue iron shows through** (two or three small spots) — the most recognisable detail of this style.
- Thermos: red shell + woven-bamboo texture (pattern: fine waves + vertical lines); a cork-colored stopper.
- Signs: cream base, a 9px colored border plus a thin inner line, rivets in the four corners, one chipped corner.
- Steam: a few white zigzag wisps + Gaussian blur; on the beige wall add an offset grey shadow or they fade to nothing.

## Fonts
- Large sign lettering: ZCOOL QingKe HuangYou (looks like the spray-painted lettering on enamel signs) — **short titles only**; some of its glyphs (「多」「九」) look like other characters, so anything containing them, long lines and numbers all use Noto Sans SC 900.
- Big numbers (R4) Noto Sans SC 900; explanatory text Noto Sans SC 500 (40px and up, ink color); printed survey-form text Noto Serif SC 500 typed out character by character; handwriting is Xiaolai in blue ballpoint (R8).
- Not used: calligraphy, monospaced code fonts (except electronic instrument readouts, in JetBrains Mono).
- Stamps (R9) default to enamel red on the cream background; the red badge with cream lettering is drawn by the page, which passes its own `fill`.

## What components look like
- Numbers / conclusions → enamel signs (`sign`); for emphasis the whole sign turns red with cream lettering. A sign enters by being hung from above and swinging twice (`hang`), with a "clang".
- Small conclusion badges → a red rounded enamel plaque (`badge`), dropping in from 1.6× to 1×.
- Counting units → small enamel mugs (10 mugs = one tenth each, 100 mugs = 1% each; reddened to show a share), labelled "illustrative" on screen.
- Years → a wall calendar (red header, big year; turning a page = leaves flipping upward).
- Survey forms → a wooden clipboard + a printed table + blue-ballpoint ticks.
- Comparison bars → round-ended enamel bars (a highlight along the top), length by multiple, a dashed vertical line = baseline 1.
- **Never write directly on the tablecloth** (text on red-and-white checks can't be read): always put a small cream card (`tag`) under it.

## Motion feel
- The camera pans along the wall one stop per section (stops 2300px apart, 1.25s eioCubic pan, starting 0.35s before the section); within a section only a very slight push-in (1 → 1.22).
- Changing place uses "a world inside an object": the camera pushes into a postcard on the table, and the postcard's picture is the next scene (the postcard straightens as the camera pushes, reaching 0° at full push, so the cut doesn't jump); coming out, a cloud of steam wipes across the screen with a hard cut in the middle (the frame is fully white at the steam's thickest).
- Text mostly enters by "hanging down" and a fade-up; no bouncing.

## How characters are drawn
- So far this style draws no people: crowds use enamel mugs / glass tea cups as unit icons.
- If people are needed: flat-fill silhouettes with an enamel-like highlight strip, no outlines; generated characters need "flat enamel colors, cream and red, no outlines" and a consistent shadow.

## Scenes it can draw
- Used in a full video: the long wall and dinner table at home; a tea table in Iran inside a postcard (blue eight-pointed-star tile wall darkened 60%, rug-pattern tablecloth darkened 45%, tulip-shaped tea glasses, sugar cubes, a teapot).
- Suggested: a kitchen stove, a market stall, a works canteen, an old medicine chest (all "things at home / close at hand").

## Pitfalls
- Full-coverage patterns like tiles and rugs must be darkened (60% / 45% in that video), or text on top can't be read.
- check-text-bounds doesn't understand clip-path: text that is clipped away and invisible still counts toward overlap / off-frame. After the camera pushes into "a world inside an object", stop drawing the outer world; after coming out, stop drawing the inner one.
- Size the calendar year by paper width (`min(height × .42, width × .38)`), or a four-digit year sticks out of the page.
- Put thermometer scale numbers on the left of the glass tube, inside the wooden board; on the right they stick out of the board (the checker reports "text over artwork").
