# Paper skeuomorphic (id: paper-skeuo)

中文:[paper-skeuo.md](paper-skeuo.md)

## Rendering language
A real desk seen from above: paper with thickness and shadow, ink printed over paper grain, handwriting with pen pressure and irregularity, typing with uneven ribbon density. Light from a desk lamp or a window, multiplied over everything.
Everything in the frame is "a real thing placed here" — the sense of evidence comes from the objects themselves.

## Materials and post
Paper / kraft paper / graph paper (drawn pixel by pixel once, then reused), wood-grain desk, ink in multiply, desk-lamp lighting, film grain, vignette.

## Font tendencies
The style with **the richest set of writing sources**: printed Song/serif, typewriter (Chinese / English), fountain pen, red pen, ballpoint, marker can all appear — one font per source (../design/fonts.md).
UI-style sans serifs only for "instruments, charts, modern printouts".

## Component looks
Paper notes instead of speech bubbles; stamps, evidence hang tags, number cards; primary sources = a journal page / typescript + highlighter; big numbers = typed, then circled in red pen.

## Motion feel
Objects slide in, stamps come down, writing / typing letter by letter; the camera pans at paragraph starts; restrained, no bouncing.

## How characters are drawn
- No likenesses of real people: name tags, number cards, empty seats, the back of a photo.
- A code-drawn mascot can appear as "the little helper on the desk".
- Generated characters (untried): make them "a photo / paper cut-out stuck on the paper" — white cut-paper edge + soft shadow, lit by the same lamp as the desk.

## Scenes it can draw
Used in: case files (case-file), the 1944 lab desk (lab-desk-1944), the paper objects in the data dashboard (lab-dashboard), paper lab notes (field-notebook), gallery labels (gallery-wall).
Suggested: old newspapers, medical charts, handwritten recipes, lab notebooks.

## Pitfalls
Handwriting that's too neat looks like a computer font (LXGW WenKai was rejected); no SVG displacement filters for jitter.
