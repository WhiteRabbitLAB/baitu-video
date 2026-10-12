# 8-bit pixel (id: pixel)

## Rendering language
8-bit game graphics: **low-resolution pixel art** (one pixel = 4 px on screen; a 480×270 logical canvas scaled ×4), a **limited palette** (about 16 colours), and a sky in a few colour bands joined by checkerboard **dithering**.
No vector outlines, no rounded corners, no gradients, no blur. Light and shade come from swapping a cell's colour (one lit patch, one dark outline cell around the shape).
**The metaphor is "a game, a level"**: an era or stage = a level ("Cretaceous · Final level"), a quantity = hit points or score, narration = an RPG dialogue box, a surprise = "!". Good for Earth history, evolution, topics about levelling up or losing something step by step, and nostalgia.
**Colour carries meaning**: yellow #FFD27A only for "the thing to look at" (score, name plate, stamp); red #E0505A for danger or loss (annotations, lost hearts); cyan #8FD3FF is a "system hint"; everything else is warm white.

## Material and post-processing
- Backdrop `backdrop: 'pixel'`: four sky bands (`c.sky`, dark blue-violet warming downwards) joined by 8 px checkerboard dithering (`vc-dither-<i>`, one per band); fixed-seed 4 px stars in the top half; at full screen, grass and dirt along the bottom 14% (the ground sits at 86% height so the mascot's feet line up).
- No grain, no vignette (`vig: 0`): real hardware output has neither.
- Pixel art drawn by the page: work on the 4 px grid (every coordinate and size a multiple of 4); draw shapes into a mask first, then add a one-cell dark outline (the still in `brief/style-explore/d.js` has a `sprite()` helper to copy).

## Font preferences
- **Every role uses Fusion Pixel 12** (one typeface for Chinese and Latin). Sizes must be multiples of 12 (`pixel: 12`; the kit snaps them: 24 / 36 / 48 / 72 / 96). At 12 × 4 = 48 a stroke is exactly one art pixel, which is the first choice.
- Never used: handwriting, serif, thin weights. This style has no paper and no pen.
- The channel subtitle can sit at the bottom as usual; closer to the style is putting narration in an RPG dialogue box (as still D does). Pick one; don't show both.

## Components
- Text entrance `type` (character by character, RPG typing); annotation R6 `blink` (on-off-on-off-on, settles after 0.4 s).
- Mark `pixbox`: four corner brackets first, then the full box, 4 px line. Stamp `pixbadge`: yellow pixel plate with stepped corners and a hard bottom-right shadow, growing in three steps (.6 → .85 → 1). Counter `punch`.
- Bubble `rpg`: dark box, a 4 px light border inset, a stepped tail, pops in two steps; a yellow ▼ blinks bottom-right when done. Window / panel `rpg`: the same box, with the title as a name plate overlapping the top-left edge.
- HUD (level name, hearts, score) in a dark strip along the top: drawn by the page; still D has one.

## Motion feel
- **Stepped, not eased**: appearing = blinking or growing in two or three steps; movement jumps by whole cells (4 px) at roughly 12 fps (round time to 1/12 s in the page before computing positions).
- Transitions: a full-screen "pixel dissolve" (8–16 px blocks flip to the next shot at random) or a cut through black. Not in the engine yet; add it in the first episode that uses the style. Meanwhile a `fade` or hard cut doesn't break the look.
- Numbers only move between real values (`counter`).

## How characters are drawn
- Drawn in code: works well. People and animals are silhouettes on the 4 px grid, with a one-cell dark outline and one lit patch (the T. rex and triceratops in still D). The placeholder `mascot` is rasterised on an 8 px grid in this style.
- Generated characters: "8-bit pixel art sprite, limited 16-color palette, 1px dark outline, no anti-aliasing, transparent background"; downscale nearest-neighbour to the logical size, scale back ×4, and snap any semi-transparent edge pixels to the palette.
- Code lighting: none. For night or firelight, swap the whole palette; don't overlay gradients.

## Scenes it can draw
Full film ×1 (2026-10-12, a 12-minute landscape film: five levels, each a group of characters lined up in time order, narration as whole sentences in the RPG dialogue box, a row of cause-coloured cells running through the film, 8-bit square-wave sound effects plus a code-generated music bed; pixel art drawn on a canvas layer, all text in SVG).
Still ×1 (2026-10-12, dinosaur extinction: banded sky, volcano, T. rex, triceratops, asteroid trail, HUD, dialogue box).
Suggested: Earth history and evolution (levels = geological periods), "health bar" topics about the body's resources, the history of technology (pixel art carries the early-video-game era with it), list topics (each item = a level).

## Samples (2026-10-12)
[Empty scene](samples/pixel-1-scene.jpg) · [Text roles R1–R10](samples/pixel-2-roles.jpg) · [Character](samples/pixel-3-character.jpg). Re-render: `node engine/vc/samples.mjs pixel`.

## Pitfalls
- **Text drawn on a canvas can't be checked**: still D draws its text on a canvas; `check-text-bounds` only sees SVG `<text>`, so its 0 is false. In a real episode all text goes through the kit (SVG); the art can be canvas or SVG squares.
- **Feet must touch the ground**: the first T. rex floated 6 pixels (24 px) above the ground and looked it at a glance. In pixel art a single cell shows.
