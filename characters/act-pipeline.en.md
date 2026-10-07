# Character acting: image generation for art, code for the engine

中文:[act-pipeline.md](act-pipeline.md)

Why games combine art and code so well: artists draw the assets; code only places them, swaps frames, moves joints and relights. Detailed characters drawn purely in code come out crude (five pure-code Sun Wukong samples were rejected),
so characters go to image generation and motion goes to code. The author's local test bed `game-art/` (2026-10-06/07) ran end to end; the `game-art/` files mentioned below aren't in the open-source release, but the method is written out in full.

## 1. List the motion transition table first (../transitions.md §B)
Before generating: decide which poses you need, what changes between neighbouring poses, and which in-betweens a big change needs.

## 2. Image generation (the decision-maker / an artist generates with their own tools; we write the prompts)
- Finalize an **A three-view sheet** (front / side facing right / back); use it as the reference image for everything after.
- Generate each **key pose** separately: side view facing right, feet together at 94% of the frame height, belt and hem matching the reference, the prop complete and uncropped.
- Four prompt rules: pure green background #00B140 (white clothing can't use a white background), flat fills without outlines, light direction matching the scene, no ground or shadow; include the scene palette.
- **Continuous motion like walking / running isn't done with image generation**: asked to alternate legs over the last four frames, with corrective prompts down to each frame, the model still drew the same leg forward ⇒ hand it to a code skeleton. [Capability limit 2026-10; with any new image model, re-test with the same prompt and lift this if it can alternate legs]

## 3. Keying and alignment (game-art/prep-poses.mjs, rig-prep.mjs)
- Key out the green by **flood-filling from the image edges**: only green connected to the outside goes, so green on the character (P2's mint eyes) is safe; then remove small pockets of background enclosed by arms / props by color distance < 70 from the screen green; despill a ring around the edge.
- All poses share **one scale factor** (matching the standing height to the walking frames), never per-image scaling, or the height jumps.
- Alignment: feet → the ground line; the horizontal center of the two boots → the code legs' boot center when standing.
- Cutting body parts (for walking): remove everything below the hem + trouser color near the hem; keep the color-removal rule near the hem only — wider and it eats the sleeves' shadows (caught in practice). Cut attachments like a tail separately where the cut is hidden, and rotate them around the root.

## 4. Code skeleton legs (legPose / drawLeg / hero in game-art/scene.html)
- Leg length L1+L2 = standing hip-to-ankle height: **the planted leg is straight**, hip height computed from the straight leg (inverted pendulum), taking the lower one when both feet are down ⇒ a natural bob (about 2–3% of height).
- Stance (first 60% of the cycle): the ankle moves back at the ground's speed (speed relative to the body = ground speed ⇒ no foot sliding); heel strike flattening in the first 12%; heel lifting after 72% and pushing off around the toe.
- Swing (last 40%): lift the foot and bend the knee in the first half, then lower it and kick the straightened leg forward, toes up before landing.
- The legs are half a cycle apart; the far leg's color ×0.72.
- Slowing to a stop: same cadence, stride × k (k = current speed / full speed) ⇒ both feet end up under the body; the background scrolls by the distance function `X(t)`.
- Colors sampled from the generated art; leg shapes drawn after it (bloomers, gold band, boots), slightly thicker than the generated legs so they can carry the body.

## 5. Secondary upper-body motion
Lean forward about 0.045 rad while walking + sway with each step; the tail swings half a beat behind the body; idle breathing once standing (vertical ±0.7%).

## 6. Switching poses
- Once standing, use the whole generated pose (with its own legs); at the moment of stopping the code legs are exactly straight and together, so the switch shows no seam.
- A settle bounce at the moment of switching; surprise adds a 10 px hop (0.28 s).
- Big changes need in-between poses (in the test, P2→P3 was a hard cut, and it was pointed out that "the join should have been planned").

## 7. Relighting for the scene (parameters in the style file)
Grade into the scene's light → rim light → local light sources → shadow → the same post-processing as the scene.

## 8. Acceptance
Watch consecutive frames: the planted foot stays on the ground (no sliding), legs alternate (the far leg darker), no jumps at pose switches, no green fringe when zoomed in, no green on the character keyed out.

## Known ceiling
- Poses switch, they don't tween; smoothness depends on how many in-between poses you have.
- Arms and props have no skeleton for continuous motion yet (to do it, cut the arm + prop into their own layer).
- Verified with only one character, one style, side view.
