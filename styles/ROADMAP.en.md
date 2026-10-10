# Style roadmap (updated continuously)

中文:[ROADMAP.md](ROADMAP.md)

The style library keeps growing. This page covers three things: **candidates, the admission bar, and the update rhythm**.

## Admission bar (three samples; missing one means no admission)
1. **Empty-scene sample**: redraw one frame of an existing scene (field-notebook or info-cards suggested — fixed content makes comparison easy) in the new style.
   Tool: add a look to `engine/vc/styles.js`, then run `node engine/vc/samples.mjs <id>` — it produces all three (empty scene / R1–R10 / character) in `samples/`.
2. **Text-role sample**: one line for each of R1–R10 in this style, with fonts and carriers visible (checks that "text follows the style").
3. **Character sample**: the mascot or a generated character placed in it, relit and color-graded to the style so it doesn't look like a sticker.

All three pass the decision-maker ⇒ register in INDEX.md as "samples"; used in a finished video ⇒ "full video".
Every style gets a thumbnail in INDEX (users choose by looking, not reading); 10 exist so far (since 2026-10-07, `engine/vc/thumbs.mjs`); for a new style, add a look to `engine/vc/styles.js` and re-run.

## Candidates
Sources: popular explainers (../catalog/references.md), original works from art history, our own experiments.

| Candidate | In one line | Mainly for | Source | Doable? | Priority |
|---|---|---|---|---|---|
| Whiteboard | Line art drawn while talking, pulling back at the end to show the whole board | teaching, explainers | RSA Animate; prompt-motion tak3sh8 | ✅ three samples done (2026-10-07, [whiteboard](whiteboard.en.md)), decision-maker reviewed | high |
| Dark math | Black background, one object morphing continuously, color = concept | concept lessons | 3Blue1Brown; the manimgl source palette | ✅ three samples done (2026-10-07, [dark-math](dark-math.en.md)), decision-maker reviewed | high |
| Chalkboard | Dark green board, chalk handwriting, drawn while talking (the whiteboard's sister style) | teaching, explainers | Decision-maker request, 2026-10-07 (dark math didn't feel like a blackboard) | ✅ three samples done (2026-10-07, [chalkboard](chalkboard.en.md)), decision-maker: fine | high |
| Document collage | Clippings, photos, red string, highlighter; the camera moves over the desk like an investigative reporter | opinion, investigation | Vox | ✅ structure exists (paper-skeuo), motion to refine | medium |
| Kinetic type | The words are the actors, keywords slamming in on the beat | lists, opinion, the first 3 seconds | kinetic type works | ✅ three samples done (2026-10-07, [kinetic](kinetic.en.md)), awaiting the decision-maker | high (essential for vertical) |
| Risograph | Two overprinted plates (blue + fluorescent pink), halftone, grain, print margins | identify / classify explainers, news summaries, dot-matrix data | indie magazines and exhibition posters; decision-maker 2026-10-08 asked for "a style, template and animation we don't have yet" | ✅ three samples done (2026-10-09, [risograph](risograph.en.md)); episode 11 sample reviewed by the decision-maker: "pretty good" | high |
| Thermal receipt | Off-white thermal paper strips, bitmap text printed line by line, black + red; the metaphor is a bill | bills / lists / comparisons, day-by-day experiment logs, "looks the same, adds up differently" | checkout receipts; the decision-maker picked it on 2026-10-10 from three new-style stills (thermal receipt / isometric diorama / nutrition-label layout) | ✅ three samples done (2026-10-10, [thermal](thermal.en.md)); episode 13 full video done (approved by the decision-maker) | high |
| Stick-figure characters | Simple characters, fast cuts + reaction close-ups | stories, lifestyle | TheOdd1sOut type | 🧪 | medium |
| Launch-event glass cards | Dark bokeh background, frosted-glass cards, big numbers | reviews, finance | Product launch events | 🧪 | medium |
| Financial charts | Axes first, data grows in, only one thing labeled | finance, data | Financial media chart videos | 🧪 | medium |
| 8-bit pixel art | Low resolution pixel by pixel, a limited palette | gamified explainers, nostalgia | 8-bit game graphics | 🧪 untried | medium |
| Chinese ink / shadow puppets / Dunhuang | Traditional visuals | Chinese history and culture | Ink paintings, shadow theatre, Dunhuang murals | 🧪 untried | medium |
| Bauhaus / Constructivism / Pop | Geometric composition, halftones, thick outlines | design history, opinion | Bauhaus, Constructivist, Pop originals | 🧪 untried | low |
| Impressionism / Van Gogh / ukiyo-e | Brushstrokes filling the frame | art history | Impressionist, Van Gogh and ukiyo-e originals | 🧪 untried | low |
| Realistic oil (Rembrandt, Renaissance) | Realistic light modelling figures | art history | Rembrandt, Renaissance originals | 🧪 untried (likely hard in pure code; may need image generation) | low |

## Update rhythm
- **Every episode validates at least one new combination** (new style × existing scene, or existing style × new scene), producing the three samples along the way.
- When no video is in progress, add samples from the top of the priority list down, one at a time.
- Found a good outside work: note it in ../catalog/references.md first, judge whether it's doable, then decide whether it joins this table.

## Full steps for a new style
1. Add a row to this table (candidate).
2. Copy `_template.md` and write the style card (you must write "how characters are drawn").
3. Make the three samples → decision-maker reviews → register in INDEX.md + thumbnail.
4. Add missing fonts to ../design/fonts.md; add a column for its component looks to ../design/components.md.
