# Flat illustration (id: flat-illustration)

中文:[flat-illustration.md](flat-illustration.md)

## Rendering language
The Kurzgesagt approach: no outlines, flat fills, dark sides one step darker in the same hue; layered depth (two rows of distant mountains + a mist band + midground + foreground silhouettes), directional light (rim light, glow), and one layer of paper grain over everything.
Something in the picture is always moving (stars, clouds, glints on water, trees, window lights, fireflies).

## Materials and post
Grain overlay 9% (offset changing 12 times a second), vignette, a mist band at the foot of the mountains (to separate near and far).

## Font tendencies
A crisp sans-serif display font (Smiley Sans or similar) + Noto Sans SC; a rounded face for character dialogue. (The test had no text; these are suggestions.)

## Component looks
Translucent dark rounded plates, capsule labels, white outline-free rounded bubbles.

## Motion feel
Continuous, eased; parallax scrolling; character motion continuous at 30 fps (skeleton legs).

## How characters are drawn (this style is the test bed for the character-acting module)
- Backgrounds can be detailed in pure code; **detailed characters go to image generation**.
- Four rules for image prompts: pure green background #00B140, flat fills without outlines, light direction matching the scene (rim-light color fixed), no ground or shadow; put the scene palette in the prompt.
- Relighting in code: multiply by the scene's main color → rim light (the outline minus itself offset away from the light) → warm light from local sources → an elliptical shadow under the feet → the same grain and vignette as the scene.
- Motion: see ../characters/act-pipeline.md (code skeleton legs, pose library, joins).

## Scenes it can draw
Sampled: side-scrolling landscape (landscape-scroll). Suggested: scale journeys through the cosmos / a cell, city cross-sections.

## Pitfalls
Don't put a local light source where the character stops (they get washed out, with the pole behind them).
