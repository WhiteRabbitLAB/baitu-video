# Camera and transition library

中文:[camera-transitions.md](camera-transitions.md)

Goal: camera moves, transitions and pacing must all have **a reference, a number and a source** — no going by feel. Not reaching the reference's level at first is fine, but every parameter must say where it came from and how far it is from the reference.

## Rules
Every parameter here is a **default** (see ../principles.md, "the three weights of a rule"): a starting point backed by a reference, not a cap. If the model can do better camera work or transitions, do it, note the reference or reason, and compare side by side with the library default at delivery; if it really is better, come back and update the library.

1. In the storyboard's transition table (../transitions.md), each transition names **this library's id + parameters** as the starting point; to go outside the library, note the reference or reason (no need to add it first). Once used and proven, add it.
2. Every number carries its source:
   - [Measured] we measured it frame by frame from a reference video or our own video with the method below (title and date stated)
   - [Primary] official docs / the author's own words / a standard
   - [Ours] the value we actually used in a finished video
   - [Default] someone recommends it but there's no primary source and we can't measure it — usable; when unsure take the stated conservative value
   - [To measure] a provisional value with no reference yet — measure it before its next use; if it truly can't be measured, put it under "Can't measure", with why and how
3. Before delivery, measure your own video the same way (shot length, transition durations, still share) next to the references and record the gaps in acceptance.

## Breaking down a reference video (our method)
Tools: `../engine/tools/measure_film.py` (whole video), `engine/vc/measure-tx.mjs` (a single transition); steps:
1. **Physical parameters**: frame rate and duration from ffprobe; use the original highest-bitrate file, not a screen recording. Frame numbers are the shared language.
2. **Overview**: a 4 fps contact sheet (with seconds) + key frames per segment.
3. **Find transitions**: shrink to 192×108 grayscale and compute the mean difference between neighbouring frames; sudden jumps are picture changes (criteria and thresholds in `measure_film.py`). If start intervals are integer multiples of a constant ⇒ there's a beat grid.
4. **Mechanism**: for each transition, from 2 frames before its start, every 2 frames, over 0.5 s, lay out a 15-cell contact sheet — the mechanism is only visible here.
5. **Motion within a shot**: for each still interval, take the per-pixel maximum frame difference as a heat map and report the share of moving area. Skip this and you end up with "transitions between pictures".
6. **Camera easing**: take the displacement curve of a camera move and fit the easing (sineInOut / cubic-bezier / spring).

Record the results in the tables below, marked [Measured] with the source title.

**Measuring your own whole video**: `../engine/tools/measure_film.py` (the whole-video version of steps 3 and 5, streaming, no contact sheets): still share, picture-update intervals, full-screen changes, frame-to-frame jumps; record them under "Our own videos, measured". For transition mechanisms or easing fits, still cut windows out per steps 4 and 6.

## Pacing: shot length

| Grammar | Shot length | Source |
|---|---|---|
| Ours · N9 dashboard | 13 walls, wall length 6.1 / 14.0 / **15.0** / 20.7 / 33.5 s (min / quartile / median / quartile / max), 2–10 sentences per wall, median 5; within a wall the picture updates every 1.7 s (median) | [Ours · measured] N9 (2026-10-07) |
| Reference films (3b1b, Kurzgesagt, Vox, whiteboard, launch events, financial charts) | Not measured yet; measure with `measure_film.py` and add | [To measure] |
| Ours · A6 paper | 28 scenes, 3.3 / 9.8 / **13.3** / 18.5 / 41.4 s each, 1–13 sentences per scene, median 4; within a scene the picture updates every 3.2 s (median) | [Ours · measured] A6 (2026-10-07) |

## Camera moves

| Move | Parameters | Source |
|---|---|---|
| Paragraph-start pan | 0.85 s (starting 0.6 s before the paragraph, landing 0.25 s after), cubicInOut, one full screen; measured peak speed 216–224 px/frame (1080p, about 11.7% of the frame width per frame, no motion blur), matching the theoretical peak of 226 | [Ours] N8, N9; peak speed [Ours · measured] N9 |
| Paragraph-start pan (shared-component default) | 1.2 s + horizontal motion blur (`VC.pan`; for the old feel pass `{dur:.85, blur:false}`) | [Ours] engine/vc, used in N10, approved by the decision-maker |
| Very slow push-in over the whole video | 1 → 1.035 | [Ours] N8 |
| Slow push within each wall | 1 → 1.03, linear, over the wall's duration | [Ours] N9 source |
| No camera movement | A6 has no camera moves at all, only scene cross-fades | [Ours · measured] A6 |

## Element motion

| Move | Parameters | Source |
|---|---|---|
| Default easing (concept videos) | smooth = 6t⁵−15t⁴+10t³ (zero velocity and acceleration at both ends); linear only for writing and constant rotation | [Primary] manimgl source `rate_func = smooth` |
| Kinetic type | Main words fling in: 6 frames from 1.9× down to 0.94, 2 frames rebounding to 1, a landing shake, then pinned; small words slide in: 4 frames from 40 px left | [Ours] engine/vc `entrance: 'slam' / 'slide'`, kinetic-type samples reviewed by the decision-maker |
| Everything else (pop overshoot, stagger, counting, red circles, blinks…) | Whatever the `engine/vc` components actually use (see engine/vc/README.md); measure yourself when comparing with references (not yet) | [Ours] |

## Transition library

| id | What it looks like | Parameters | When to use | Source | Done by us |
|---|---|---|---|---|---|
| morph | The last frame of one shot = the first frame of the next; the old object morphs into the new one | smooth easing | concept explanations | [Ours · measured] measure-tx | yes (demo, `engine/vc`; 0.9 s) |
| zoom-through | The camera pushes in exponentially around an object (zoom = Z^e); the object becomes an opening revealing the new picture | zoom ≥ 1100/r0; the new picture's subject settles only after e>0.55 | going from a detail into the next level | [Ours · measured] measure-tx | yes (demo, `engine/vc`; 1.2 s smooth) |
| fill-zoom | Rush into a shape on the previous screen whose color = the next screen's background | first 55% expoIn up to 30×, last 45% expoOut from 1.25 back to 1 | kinetic type, lists | [Ours · measured] measure-tx | yes (demo, `engine/vc`; total 0.7 s, our choice) |
| bands | Three diagonal color bands sweep across in relay, the last one being the new background | 0.5 s expoInOut, staggered 12% | fast section changes | [Ours · measured] measure-tx | yes (demo, `engine/vc`) |
| slide-push | A new panel pushes in, the old one pushes out, led by a brand-color bar | 0.5 s cubic-bezier(.7,0,.2,1) | chart / panel page changes | [Ours · measured] measure-tx | yes (demo, `engine/vc`) |
| blur-push | The old picture shrinks to 0.92 + 24 px blur + fade out; the new one lands from 1.06 with blur to 1.0 | 0.55 s ease; a heavily blurred 1.08× copy of the old picture underneath prevents black edges | launch-event, tech | [Ours · measured] measure-tx | yes (demo, `engine/vc`) |
| cut | Hard cut | on the breath between two sentences, subtitles changing on the same frame | default for narration | [Ours] N10 | yes |
| pan-next | Pan across the same desk / wall to the next area | 0.85 s cubicInOut; peak ≈ 224 px/frame | paragraph starts in paper and dashboard scenes | [Ours] N8/N9; peak speed [Ours · measured] | yes |
| fog-reveal | Fog lifts hex by hex | each hex scales from 0 to 1 (back easing 0.45 s, overshooting to 112% at 0.25 s) + a gold edge flash fading over 0.8 s; the reveal front moves about 520 px/s (map coordinates, 111 px hexes ⇒ about 4.7 hexes/s), advancing along a sea route / outward from a city / along a river; a sound every 6 hexes | map spread | [Ours · source] N5/N7 (same parameters). **No reference value possible**: needs game footage (Civilization's fog reveal), which we don't have and can't download (see "Can't measure") | yes |
| fade | Cross-fade | Reference: [Primary] 3b1b's manimgl `FadeIn / FadeOut` default 1.0 s, smooth easing (source `DEFAULT_ANIMATION_RUN_TIME = 1.0`, `rate_func = smooth`); fades in human-made videos not yet measured (see "Can't measure"); similar AI-generated videos [Measured]: a "history of AI" piece had 51 picture changes and 0 fades (all motion transitions); a Chinese Git explainer had 10 fades at 0.37 s linear; our A6: old scene fading out while the new one fades in, 0.35 s **linear**, starting 0.4 s before the paragraph | only for big chapter changes, never the default | [Ours · measured] A6: all 27 scene changes used it; 14 fitted as linear with 5–95% in 0.30–0.33 s, the rest overlapped with new elements entering and look like 0.4–0.6 s | yes |

### Transitions in the shared components (measured 2026-10-07)
Code: `kit.transition(id, t, t0, A, B, params)` (`engine/vc/vc.js`), demo page `engine/vc/transitions.html`, measurement `node engine/vc/measure-tx.mjs <style>`.
Method: frame by frame (30 fps), "progress = distance to A ÷ (distance to A + distance to B)" (mean grayscale pixel difference), reading the 5–95% time, the time of 50% (from the transition start), and the maximum frame-to-frame jump.
**Positive control**: a linear 0.35 s fade, theoretical 5–95% = 0.315 s and 50% = 0.175 s; measured 0.30 s / 0.20 s, the same in all three styles, within 1 frame (0.033 s) ⇒ the method is trustworthy.

| id | Design | Measured 5–95% | 50% time | Max frame-to-frame jump | Notes |
|---|---|---|---|---|---|
| slide-push | 0.5 s cubic-bezier(.7,0,.2,1) | 0.47 s | 0.33 s (slow start, fast finish, done in the second half) | 19–21 | Matches the 0.5 s design |
| blur-push | 0.55 s CSS ease | 0.47–0.50 s | 0.13–0.17 s (the new picture is readable very early) | 1–3 | Matches the 0.55 s design; a soft transition, jumps far below a hard cut |
| zoom-through | 1.2 s smooth, zoom = Z^e | 1.07–1.10 s | 0.87–1.0 s (exponential push, most change at the end) | 3–17 (higher the more the opening contrasts with the background) | 1.2 s is our choice, used in N10 |
| morph | 0.9 s smooth | 0.57–0.67 s | 0.57–0.6 s | 2 | smooth easing; old elements leave in the first 45%, new ones enter in the last 45%, only the shape changes in between |
| fill-zoom | 0.7 s: first 55% expoIn to 30×, last 45% new picture 1.25 → 1 expoOut | 0.23 s | 0.33 s (change concentrated at the final rush) | 35 | High jump, strong impact |
| bands | 0.5 s expoInOut, three bands staggered 12% | 0.40 s | 0.33 s | **112** | **Very high jump**: bright full-screen bands sweeping across are intense — use sparingly, only for the fastest section changes |

Measured in three styles (paper skeuomorphic, dark tech, cartoon UI), differences within 1–2 frames, so the table gives ranges. fill-zoom and bands were measured in the kinetic-type style, with the same-batch positive control at 0.30 s passing, 2026-10-07.
Usage notes: zoom-through's opening is a circle but the picture is a rectangle, so the new picture's background extends three screens outward; for morph, neither shot A nor B **draws** the morphing object — the `from / to` parameters (path + color) draw it; a background shared by both shots goes outside them, so it doesn't fade out and in (otherwise black shows midway).

## Sound and picture

| Rule | Source |
|---|---|
| Picture early rather than late, at most 1 frame early; A/V sync tolerance: sound leading ≤ 40 ms, lagging ≤ 60 ms | [Primary] EBU R37 |
| Transitions go in the breath between two sentences, not mid-sentence | [Ours] N10's transition table |
| Subtitles must be readable: adults ≤ 9 characters/s (children ≤ 7); each cue ≥ 5/6 s (0.83 s), ≤ 7 s. Checked with `engine/tools/check_sub_timing.py` | [Primary] Netflix Simplified Chinese subtitle guidelines + general guidelines (checked 2026-10-07). Our 13 videos [Measured]: median reading speed 4.7 characters/s, none over 9; but 36 of 1352 cues (2.7%) were shorter than 0.83 s, almost all 2–4-character fragments ("enough", "round one"), the shortest 0.14 s in A2 |
| Key on-screen words (not subtitles) stay at least 0.83 s | [Ours · default] borrowing the subtitles' 0.83 s minimum |

### Can't measure (2026-10-07)
- **Fade durations in human-made videos, Civilization's fog reveal**: YouTube downloads require sign-in (yt-dlp: "Sign in to confirm you're not a bot"), Bilibili returns 412, and we have no game footage.
  The method is ready: with a video file, run `uv run engine/tools/measure_fades.py video.mp4`. It fits each picture change as "a blend of the previous and next frames"; a small residual means a fade, reporting the 5–95% time and the easing shape (mid-section slope ratio: linear ≈ 1, smooth ≈ 1.5–1.9).
  Positive control passed: A6 gave 28 fades, median 0.333 s (designed 0.35 s linear, theoretical 0.315 s), mid-slope ratio 1.02 (= linear).
  To fill this in, ask the decision-maker for one or two reference video files (one each from 3Blue1Brown, Kurzgesagt, TED-Ed is enough), or permission to download with browser cookies.

## Our own videos, measured (2026-10-07)
Measured: nutrition N9 (dashboard walls, 232 s) and AI A6 (paper, 407 s), with `../engine/tools/measure_film.py`. Only the picture area (top 82%, excluding the always-moving subtitles and progress bar). Reference films haven't been measured the same way yet; a column will be added once we do.

| Metric | N9 | A6 |
|---|---|---|
| Share of time with no movement within 0.5 s | **17.8%** | **61.4%** |
| Share of identical neighbouring frames | 75% | 83% |
| Stretches with no movement ≥ 3 s / longest | 1 / 9.7 s (at 13.2 s) | **35** / 9.4 s (at 336.7 s) |
| Median interval between picture updates (>1% change within 0.4 s) | 1.7 s (30 per minute) | 3.2 s (14.5 per minute) |
| Longest gap without updates / gaps over 5 s | 10.5 s / 3 | 14.4 s / **24** |
| Sentences per shot / scene | median 5 (one wall) | median 4 (one scene) |
| Median shot / scene length | 15.0 s | 13.3 s |
| How shots change | all 12 the same pan, 0.85 s cubicInOut, peak 224 px/frame | all 27 a 0.35 s linear cross-fade, no camera moves |
| Frame-to-frame jump (max mean grayscale difference) | 28.1, all at pan peaks; no hard cuts | 5.4; no hard cuts |

**Three problems this shows** (from our own data and viewing alone)
1. **Too much stillness (especially A6).** In A6, six-tenths of the time nothing moves within 0.5 s, with 35 stretches of no movement ≥ 3 s; N9 gets that down to 17.8% with a slow push on every wall, yet 75% of neighbouring frames are still identical. Both are "long takes that freeze after things enter" — it feels like flipping slides.
2. **Shots change too slowly, each carrying too many sentences.** A median 4–5 sentences, 13–15 s per wall / scene; within an A6 scene the picture changes only every 3.2 s (median), with 24 gaps over 5 s and the longest 14.4 s — viewers can only listen there.
3. **One-note transitions.** N9's 12 wall changes are the same pan, a full screen in 0.85 s with no motion blur, a bit abrupt; A6's 27 scene changes are all linear fades, while this library says "fades only for big chapter changes, never the default" — and A6 has no camera move at all.

**Measured unreliably, left out of the table**
- The **easing shape** of N9's pan: with phase correlation the wall's grid is a periodic texture and aliases; across 12 pans the total displacement came out at only 1100–1600 px (should be 1920), and the four easing fits couldn't be told apart. Trust the source (cubicInOut) for easing and only the peak speed from measurement. Measuring it properly needs another method (e.g. tracking a single element on the wall).
- 3 of A6's scene changes weren't detected by the ">15% full-frame change" rule (111.6 / 242.2 / 367.4 s): checked visually — text page to text page, only 7–8% of pixels changed. Not a broken detector; those changes are just small. Shot lengths come from the source's scene table.

## Our gaps (next steps)
- The shared components now have morph, zoom-through, fill-zoom, bands, slide-push and blur-push (demos measured); N10 used morph, zoom-through, slide-push, blur-push, cut, flip and pan.
- Fixes for the three problems above (defaults — compare side by side in the next video): idle micro-motion after things enter (float / breathe / blink); about 2 sentences per shot, or keep the shot but add a camera move every 2 sentences; choose scene changes from the transition library by format, keeping fades for chapter changes; pans use the shared component's 1.2 s + motion blur.

## Adding an entry
1. Find a reference work (title + timestamp).
2. Measure its parameters with the method above; if you can't, mark it [To measure] and say how to measure it.
3. Add it to the right table; transitions must say "when to use".
4. After using it in a finished video, set "done by us" to "yes" and note the gap to the reference.
