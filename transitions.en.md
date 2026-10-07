# Transition table: decide how things join before drawing them

中文:[transitions.md](transitions.md)

After the storyboard and before drawing, list the transition table; for character acting, list it before writing image prompts. Archive it with the storyboard.
(Why: in one character test the poses were generated first and the joins figured out afterwards — the prop jumped from the shoulder to the front in a single frame, and the decision-maker pointed out "you should have planned the joins first".)

## A. Between shots (explainers)

Four columns per paragraph: **what's on screen when it enters → what it leaves behind → what the next paragraph picks up from → which transition (id + parameters from the camera & transition library)**.
Transition, camera and pacing parameters default to [design/camera-transitions.md](design/camera-transitions.en.md); going outside the library or doing better is fine — note the reference or reason and compare with the default at delivery. The point is "grounded", not "library only".

| Paragraph | Enters | Leaves behind | How the next one joins | Transition id + params |
|---|---|---|---|---|
| e.g. 7 Result | Monitor full screen, three blood-draw points | Two curves + a red circle | Curves shrink back into the screen, the screen moves to the left half, a questionnaire slides into the right half (paragraph 8) | reverse zoom-through (pull out) + slide-push 0.5 s |

Joins, from best to worst:
1. **The same object becomes the next lead** (a bar grows into a big number; a curve shrinks to a corner thumbnail; a case folder opens to reveal the next document).
2. **The camera moves within the same world** (the desk slides to the next sheet; the map pans to the next province) — the "paragraph-start pan" of paper and dashboard scenes is this kind.
3. **A through-line element stays, the content changes** (an ever-present monitor, progress tag, timeline).
4. The style's signature transition (page turn, fog reveal, VHS tear).
5. Fade — only for big chapter changes, never the default.

Check: two neighbouring paragraphs never use the same kind of join; every paragraph carries at least one thing over from the previous one (a through-line element counts).

## B. Between poses (character acting)

For each pose, list the start and end state of the key parts; neighbouring images should change only one or two things:

| Join | Prop | Hands | Head / gaze | Tail / attachments | Feet | Change | Handling |
|---|---|---|---|---|---|---|---|
| Walk → stand | shoulder → shoulder | same | level → level | swinging → curled | code legs close | small | straight cut |
| Stand → surprised | same | same | level → looking up | curled → upright | same | medium | cut + a startle (code) |
| Surprised → pointing | **shoulder → front** | **holding → outstretched** | up → forward | upright → curled | same | **large** | **add in-between poses**: wind-up (swung overhead) → mid-swing |

Rules:
- **Small changes** (expression, head direction): straight cut + a settle bounce (within 0.16 s of the cut, +3.5% vertical, −2% horizontal).
- **Medium**: cut + a code action to cover it (a hop, a squash).
- **Large** (a prop changing place, a big arm move): add 1–2 in-between poses (anticipation + mid-action), or split that part into its own layer and rotate it in code.
- Image models can't draw "precise continuous motion of the same character" (measured: asked to swap legs, twice, it never did), so continuous motion (walking, running) goes to a code skeleton and image generation only provides key poses.
