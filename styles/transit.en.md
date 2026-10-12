# Transit map (id: transit)

## Rendering language
A city metro map: **off-white ground**, **thick coloured lines** (14–18 px) that run **only horizontal, vertical or at 45°**, ordinary stations as white circles with black outlines, interchanges as larger heavy black rings, and **bilingual station names** (Chinese in sans-serif, English in Space Grotesk, one size smaller, grey).
Flat colour, no gradients, no shadows; rivers and seas also run only horizontal, vertical or at 45° (like the Thames on the London Underground map), in light blue.
**The metaphor is "a journey with changes"**: each step of a process = a station, a change of mechanism or medium = an interchange, the line being travelled is in colour and every other line on the network is **greyed out**. Good for "how a thing gets from A to B": a message, a parcel, electricity, food through the body, an idea becoming a product.
**Colour carries meaning**: one colour per line (orange #EF7D1A / blue #1F6DB5 / green #2A9D5C; the legend says which colour is which leg); red #D6312B only for "you are here" and quantities to watch; other lines grey #C9C6BD.

## Material and post-processing
- Backdrop `backdrop: 'transit'`: off-white plus a very faint "whole network" (a few grey lines and white-circle stations at .38 opacity) as texture only; it doesn't compete with content. Pages draw their real lines on top.
- No grain, no vignette (`vig: 0`): the clean look of a printed map.

## Font preferences
- All **sans-serif**: titles and station names Noto Sans SC 900 or 600, captions 500; English and numbers in **Space Grotesk** (700 / 500).
- Source text R5 in Noto Serif SC 500 (it's a printed original, not signage).
- No handwriting layer: R8 becomes small blue "station notice" text. Never used: handwriting, serif headlines, pixel type.

## Components
- Text entrance `wipe` (like a sign strip sliding out from the left); annotation R6 `pop`.
- Mark `route`: **a stretch of line drawn under the text**, from left to right, a station at the start and the end station lighting up when the line arrives. This is the style's signature component.
- Stamp `capsule`: a line-coloured pill with white text (like a line-number badge); counter `punch`; bubble `flat`: a black rounded sign with white text (`c.bubble`).
- Window / panel `legend`: a legend box. White with a black outline and rounded corners, a black title bar with white text like a station sign, a small line-coloured square at its left end.
- Line parts drawn by the page (still A has them): `line(points, colour)` polylines, `stop` stations, `xfer` interchanges, bilingual names, a red "you are here" pin and tag, undersea or tunnel legs (a white dashed core down the coloured line), legend, title board.

## Motion feel
- **Lines are drawn on**: a line grows from its start to its end along its route (stroke-dashoffset, steady with a slight ease-out), each station pops as the line reaches it (0.15 s); a "train" (a small rounded car carrying the thing) moves along the line and pauses at interchanges.
- The camera follows the train; one screen per leg, an interchange = a new section.
- Transitions: `slide-push` in the direction of travel.

## How characters are drawn
- Drawn in code: no people. "You" = the red pin; "the thing" = an icon in the train (a chat bubble, a parcel, food). The placeholder `mascot` is a flat orange round body.
- Generated characters: not needed. If a person is required, use a signage pictogram silhouette (single colour, no face).
- Code lighting: none.

## Scenes it can draw
Still ×1 (2026-10-12, how a message travels: your phone → cell tower → carrier hub → app server → undersea cable → their phone, the rest of the network greyed out).
Suggested: process and causal-chain explainers (parcels, power grids, the internet, supply chains), routes through the body (food → stomach → small intestine → blood → liver), "one destination, several routes" comparisons (two lines side by side, which is faster), historical routes (the Silk Road, migrations).

## Samples (2026-10-12)
[Empty scene](samples/transit-1-scene.jpg) · [Text roles R1–R10](samples/transit-2-roles.jpg) · [Character](samples/transit-3-character.jpg). Re-render: `node engine/vc/samples.mjs transit`.

## Pitfalls
- **Station names fight the lines for space**: in the first still, "运营商机房" sat on a grey line, a grey diagonal cut through "Far landing" and the train covered "Cable landing". Place names first and draw lines after; start a diagonal one station further out; park the train midway between two stations. `check-text-bounds` without `--objects` doesn't catch text on lines; add the flag.
- **Only horizontal, vertical and 45°**: one casual 30° or 60° segment and it stops looking like a metro map; even the river has to bend at 45°.
