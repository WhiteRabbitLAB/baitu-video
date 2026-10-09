# Deep-sea section (id: deep-sea-section)

中文:[deep-sea-section.md](deep-sea-section.md)

## The world
A single **vertical cross-section of seawater**: the surface at the top (and whatever sits on it — say, a tray of fish from a supermarket freezer), deeper and deeper water below, down to the seabed. The camera **dives as the narration goes**, and when the story moves to "another ocean" it slides diagonally to a second water column next to the first.
Each creature sits in **its real depth range**, with a range bar beside it from shallowest to deepest — viewers see at a glance how deep it lives and how far apart two fish are.
Good for: marine life, food chains, "where does it come from" topics; it also adapts to soil layers, the atmosphere, mines — any world layered by depth / height.

**Default style**: risograph. With another style, the depth ruler, water layers, range bars and label cards stay; their look is redrawn in that style.

## Palette
Two Riso plates: blue = water, fish, ruler, all text; pink = range bars, readouts, the quantity to watch. Water steps one halftone level every 250 m, denser with depth (print-style banding, no continuous gradient).

## Writing sources → text roles
| Role | Writing source | Chinese font | English / digits | Color | Carrier | Entrance |
|---|---|---|---|---|---|---|
| R1 opening headline | big poster title | Noto Sans SC 900 | Anton | blue (one blue/pink double print at the opening) | paper | fade-up |
| R2 title / panel title | fish name on the label card | Noto Sans SC 900 | — | blue + pink overprint (fish to stress) | paper label card | slides in with the card |
| R3 UI body / label | points on the label card | Noto Sans SC 500 | Space Mono | blue | label card (short ink bar on the left) | one by one with the narration |
| R4 big number | depth readout | — | Space Mono 700 | pink | top-left readout box | changes continuously with the camera (whole 10 m only) |
| R5 primary quote | source quote (rare here) | Noto Sans SC 500 | Space Mono | blue | paper | typed |
| R6 annotation | renames, corrections | Noto Sans SC 900 | Anton | pink | stamp | stamped |
| R7 dialogue | none (nobody speaks in this world) | — | — | — | — | — |
| R8 note | Latin species name | — | Cormorant Italic | blue | second line of the label card | with the card |
| R9 stamp / marker | stamps like "renamed in 1977", "not a bass either" | Noto Sans SC 900 | Anton | pink | ink stamp | stamped |
| R10 source tag | ruler ticks, range values | — | Space Mono | blue | ruler / small paper chip | always on |
| Subtitles / progress bar | channel-wide (printed in the bottom margin) | | | | | |

## Persistent elements
- **Depth ruler**: always on the left, small ticks every 100 m, numbered ticks every 500 m; **a number is only written when it fits entirely inside the frame**.
- **Depth readout**: top left, "Depth 1,520 m", changing continuously; a small box under it names the current ocean.
- **Marine snow**: paper-colored specks drifting slowly up (faster relative to the camera while diving), so the frame never reads as a still picture.

## Components
- Water layers: halftone rectangles by depth band (only the visible bands are drawn).
- Range bar: a pink vertical bar with end caps, growing from shallowest to deepest; the value sits on a small paper chip to the bar's left.
- Label card: paper + ink outline; name / Latin name / 2–3 points that appear with the narration; **the card fades out within 40 px of the frame edge**, so a moving camera never cuts it in half.
- Fish: a parametric outline (body depth, head length, dorsal-fin groups, tail shape, barbel, teeth), facing left, tail swinging on a sine; knock out the water behind it with paper (a paper rim) first, then print the halftone, then draw the ink line.

## Mascot and characters
The mascot stays out of the water (it would steal the fish's show); if needed, it narrates from the surface beside the freezer.

## Signature moves and transitions
- **Dive**: camera keyframes hang on sentences ("further down" = start diving, arriving on the fish's name); inOut easing.
- **Cross to another ocean**: diagonal slide + dive at once ("on the other side of the world").
- **Rename tag**: a merchandise tag hangs from the fish, swings twice, then gets a "renamed" stamp.
- Into and out of this scene: the Risograph **roller sweep** (`kit.transition('roller', …)`).

## Case
A past video (the real and fake names of three fish): Pacific cod (0–900 m) / sablefish (300–2,700 m, North Pacific) / Patagonian toothfish (45–3,850 m, southern South America to Antarctica), laid out on one section at their real depths. The full video is built with the shared components (the canvas sample page from the sample stage was deleted).

## Pitfalls
- When the camera stops at the next fish, the previous fish's label card can stick at the top edge half cut off (about 10 s in the sample) ⇒ fade cards by distance to the edge, and run the out-of-frame check before delivering.
- Ruler numbers sitting on the frame edge get cut in half ⇒ only write a number when it fits entirely.
- Same-color overdraw: a blue fish in blue water disappears ⇒ knock out with paper first.
