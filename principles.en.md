# Production principles (general)

中文:[principles.md](principles.md)

## Read first: the three weights of a rule (don't let the skill dumb the model down)
Rules in this skill carry different weights; work out which kind you're looking at before applying it:

| Weight | What it is | How to treat it | Examples |
|---|---|---|---|
| **Hard rule** | Facts, safety, platform rules, copyright, decisions the decision-maker has explicitly made | Always follow; models getting stronger doesn't lift it | Only verified facts; no URLs on Douyin; no likenesses of real people; no AI images on thumbnails |
| **Capability limit** | A limit set because "the model / tool couldn't do it at the time" | Dated; **re-test** whenever a stronger model or tool arrives, then lift or rewrite it | Image models can't draw alternating legs consistently (2026-10); detailed characters drawn purely in code look crude (2026-10) |
| **Default** | Parameters, templates, skeletons, transition durations, font pairings | **A starting point, not a cap**: if the model can do better, do it, write down why, and compare side by side with the default once at delivery | Transition 0.85 s cubicInOut; 13-paragraph narrative; the R1–R10 font mapping |

How to tell: ask "what happens if this isn't followed?" — something goes wrong, breaks a rule, or overrides the decision-maker ⇒ hard rule; only "we couldn't do it before" ⇒ capability limit; only "this is what we usually do" ⇒ default.
- Templates and parameter tables are **a floor, not a ceiling**: they guarantee a minimum level and never stop you from doing better.
- Going beyond a default needs no prior approval, but leave a record: in the episode's storyboard or acceptance notes (what was different, why, the comparison). If it really is better ⇒ come back and update the default.
- For situations the docs don't cover, use the model's own judgment; don't skip something because "the skill didn't say".

Distilled from a dozen-plus videos across the author's two channels; not tied to any channel. Your channel's own rules go in profiles/.

## Content
- Every number and every quoted line in narration and on screen must trace to a "verified" row in the fact sheet; if it doesn't, delete it or mark it "inference / rhetoric".
- Separate objective measurement from self-report, correlation from causation, large samples from small experiments; the limits themselves make good content.
- Check viral numbers against primary sources. Family records and legends are reported as such, never upgraded to settled fact.
- Don't tell viewers about the production's internal iterations (old version, before vs after).

## Packaging
- **First 3 seconds**: the best-looking frame + the most counter-intuitive line, in big type over the picture; frame 0 is already the finished picture — no intro, no typing animation, no warm-up.
- Titles talk about the viewer, not the subject; title and thumbnail should each answer "what does this have to do with me?"
- Key text must be readable on a vertical phone screen; make a vertical cut only when a vertical platform is chosen (60–90 s, one point), re-laid out for vertical, never cropped from landscape (pipeline.md §9).
- Thumbnails star a real object, with text as the visual lead; avoid AI thumbnail clichés (glowing text on black, tilted cards, arrows).

## Visuals
- **Choose fonts by writing source** (text-roles.md, design/fonts.md); one source, one font, throughout the video.
- Keep the picture crisp: no SVG displacement-jitter filters (the fuzzy edges look blurry).
- Number animations show only real values — no flashing intermediate or out-of-range values.
- Curves without real data are drawn as schematic shapes with a permanent "schematic" label.
- Something in the scene should always be moving (design/motion.md); otherwise it becomes "transitions between pictures".
- A scene should carry the whole video; design how paragraphs join before drawing them (transitions.md).
- Long videos (> 3 min) keep a chapter progress bar at the bottom; chapters come from the same source as the publish notes.
- No likenesses of real people (use name tags, numbers, empty seats); maps are schematic, no borders.

## Real tests and demonstrations
- "How to use X" content must include a real test; pre-register it, don't move the goalposts afterwards, and report honestly if it differs from what you expected.
- A demonstration result must itself be good (good-looking, correct), or it undercuts the whole point.
- Comparisons change one variable; archive all raw material.

## Characters
- Detailed characters go to image generation, motion goes to code (characters/act-pipeline.md). [Capability limit 2026-10: characters drawn purely in code look crude]
- Image models can't draw continuous motion (alternating legs while walking); use a code skeleton for continuous motion. [Capability limit 2026-10: re-test leg alternation with any new image model]
- List the pose-transition table before generating images.

## Process
- Sample (1–2 paragraphs) before the full video; show the decision-maker 1–3 stills before committing to a style.
- Audit the script before narration, and have a reviewer who didn't write it go over it again.
- Every checker (acceptance script, probe) first proves itself with a positive control before you trust the 0 it reports.
- Delete the intermediate files you created and no longer need after each step; check free disk space before long jobs.
