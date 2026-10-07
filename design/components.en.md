# Component catalog

中文:[components.md](components.md)

Reusable visual parts. Each entry says which text role (../text-roles.md) it carries, how it looks in each style, and where it was first implemented.
The "first implemented" column only says which episode a component came from (those pages were cleaned up on 2026-10-07 — don't look for them); to use one, use the shared components in `engine/vc`; for anything missing, build it from the description below and add it to the shared components.

**Shared code (since 2026-10-07)**: handwriting letter by letter, typewriter, R6 annotations, stamps, rolling numbers, bubbles, AI dialog, terminal window, chapter progress bar, paragraph-start pan and subtitles live in `engine/vc/` (see `engine/vc/README.md`, demo page `engine/vc/demo.html`). New episodes should use them first; the "first implemented" column is where they were extracted from. Not yet in the shared code: sticky notes / notebook, quote card, instrument screen, timeline, map, charts, chapter card, comparison wall, photo + caption.

| Component | Carries | Paper skeuomorphic | Game skeuomorphic | Flat | Cartoon UI | First implemented |
|---|---|---|---|---|---|---|
| Dialog / bubble | R7 character dialogue | Paper note | Gold-framed portrait + dark dialog | Outline-free rounded bubble | Thick-outline bubble | N5 advisor box, N9 bubble |
| Sticky note / notebook | R8 handwritten note | Paper texture + shadow + pin | — | Color-block card | — | N8 modern sticky note, N9 notebook |
| Stamp / number tag / hang tag | R9 | Mottled ink, stamped down | Achievement bar, unit flag | Capsule label | Beat triangle | N4 stamp, N5 achievement bar |
| Quote card | R5 primary source | Journal page, typescript + highlighter | "Moment in history" card (vertical woodblock + red-ink marks) | Quote card | Left "original" panel + highlighter | N4, N5, N3 |
| Big number / counter | R4 | Typed, then circled in red | Resource counter | Big type over the picture | Slider | N8, N5, N3 |
| Instrument screen | R3/R4 + curves | Dark monitor (curves drawn over time) | — | — | — | N9 |
| Timeline | Years, process | Graph paper | Turn count | Bar | Multi-track editing timeline | N3, N9 |
| Map | Place names (R8), spread | Parchment antique map | Hex terrain + fog | Schematic color blocks | — | N5, N7 |
| Charts | Chart labels | Isotype pictograms | — | Flat bars / rings | Card charts | N8, N1 |
| Chapter card / progress tag | R2 | Typed progress tag | Turn banner | Chapter card | Small chapter tag top left | N8, N5, N6, N1 |
| Chapter progress bar | Chapter names | Channel-wide, color from the scene | ← | ← | ← | N9 |
| "Schematic" label | R10 | Typed label | Translucent corner label | Gray text | Translucent | N9 |
| AI / chat dialog | R7 (what the machine says) | A screen placed on the paper, white bubbles | — | Rounded card | Thick-outline bubble | A6 (typed letter by letter, there from the first frame) |
| Terminal window | Commands and output | — | — | — | — | A1, A2 (our own style, not imitating real products) |
| Comparison wall | Several generations under the same conditions | Photos pinned to a wall / exhibition wall | — | Grid cards | — | A5 (prompts archived verbatim) |
| Photo + caption | R3/R10 | Old photo + printed caption (with the real year) | — | — | — | A6 |

## Adding a component
Add a row describing its look in at least two styles; once built, add the implementation path.
