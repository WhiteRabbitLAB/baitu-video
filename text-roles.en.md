# Text roles: how fonts follow a scene / style change

中文:[text-roles.md](text-roles.md)

On-screen text is classified by **role**. **Every scene must give every role a mapping** (writing source → font / color / carrier / entrance), and the style then decides what those carriers look like.
Changing scene or style = swapping the whole mapping; content and shot structure stay. Each episode's font table copies the mapping from the scene file, then adds the writing sources unique to that episode.

## Standard roles (a new scene must fill in every row)

| ID | Role | What it is | Example |
|---|---|---|---|
| R1 | Opening headline | The line laid over the picture in the first 3 seconds | "Only the label is different" |
| R2 | Title / panel title | Paragraph titles, chapter cards, panel names, buttons | Turn banner, the "FILE" on a case folder |
| R3 | UI text / labels | Captions on diagrams, column names, attributes | Unit-panel attributes, monitor scale ticks |
| R4 | Big number | A number meant to be remembered | 1570 kcal, 620 / 140 |
| R5 | Primary source | The exact words of a document, book page, journal, original record | A 16th-century herbal, a 1968 letter |
| R6 | Annotation / emphasis | Circles, strike-throughs, question marks, highlighter | Red-pencil corrections, red-pen notes |
| R7 | Character dialogue | What a character says (bubble / dialog box) | The mascot advisor's lines |
| R8 | Handwritten note | Notes someone jotted down | A researcher's notebook, sticky notes |
| R9 | Stamp / marker | Stamps, number tags, hang tags, achievement badges | Evidence numbers, achievement bar |
| R10 | Source credit | Data source, "schematic" | "Source: …" |
| — | Subtitles | **Channel-wide, never change with scene / style** (spec in the channel profile) | |
| — | Chapter progress bar | **Channel-wide** (color may come from the scene) | Pinned to the bottom |

If a role really never appears in a scene, write "not used in this style" with the reason; never leave it blank.

## Four things to specify for every role
1. **Font** (Chinese and Latin/digits separately) — open-source fonts licensed for commercial use only (SIL OFL etc.), subset to the characters used.
2. **Color** (including blending, e.g. red pen in multiply).
3. **Carrier**: what it's written on (a note, a dialog box, a pixel frame, a glass card…) — the half of "dialog boxes follow the style".
4. **Entrance**: static / written stroke by stroke / typed letter by letter / pop / stamped down / rolling digits / slide in whole.

## Entrances
How handwriting, typing, red pen, stamps, numbers and pops are done: [design/motion.md](design/motion.en.md); font candidates: [design/fonts.md](design/fonts.en.md).
