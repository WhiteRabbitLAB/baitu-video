# Concept lesson (id: concept-lesson) 🧪

中文:[concept-lesson.md](concept-lesson.md)

## In one line
Teach an abstract concept (derivatives, compound interest, probability, attention…) starting from one concrete intuitive question, "approaching" the definition step by step; viewers take away a mental picture they can explain themselves.

## Topic signals
- The concept can be carried by **one shape that changes** (a curve, blocks, a grid, a row of dots); every step of the explanation is that shape changing a little.
- There's an intuitive question viewers would really ask ("how fast is it going at this instant? 0 ÷ 0?").
- Counter-examples: concepts that only exist as wording and can't be drawn (legal text, pure history); "who invented it" is timeline-epic or evolution.

## Narrative skeleton (references: 3Blue1Brown; prompt-motion "Explaining the derivative")
| Paragraph | Role | Typical content | Share |
|---|---|---|---|
| 1 | Hook: a question you can't answer, with a picture from frame 0 | A car + speedometer: "what is the speed at this instant?" | 5% |
| 2 | Try the naive way and hit a contradiction | distance ÷ time over an instant ⇒ 0 ÷ 0 | 10% |
| 3 | Step back: an approximation we can compute | Average speed = slope of a secant | 15% |
| 4 | Approach: make the approximation better step by step (the main visual) | Δt from 1 → 0.1 → 0.001, the secant turns into the tangent, the table's numbers approach 2 | 20% |
| 5 | Name it: this is X | "This limit is called the derivative" | 5% |
| 6 | Look again from another angle (a second mental picture) | The derivative function = recording the slope at every point; under a magnifier the curve becomes straight | 20% |
| 7 | A worked example | The derivative of f(x) = x² | 10% |
| 8 | The takeaway + a question to leave | "What happens to a quantity whose derivative is always 0?" — answer in the comments | 15% |

## Required shots / through-line elements
- **One shape that stars in the whole video** (that curve in the coordinate system, that row of blocks): every paragraph is a change to it, no new pictures.
- Numbers only change between **really computed values** (table rows appear one by one, no rolling through intermediate values — the R4 rule).
- Color = concept: the same quantity keeps the same color all video (secant orange, tangent yellow), text and graphic matching.
- Pacing: default animation 1.0 s (the manimgl default), pauses between animations, finish one idea before changing shot; the reference films' exact timings haven't been measured by us yet.

## Transition preferences
**Mostly morph**: the previous step's shape becomes the next one's (secant into tangent, curve magnified into a line), smooth easing; use **zoom-through** to enter a detail (the magnifier part).
No pans, no fades; the whole video barely cuts, moving forward through shape changes. Parameters in ../design/camera-transitions.md.

## Fact and platform risks
- The math / definition won't be wrong, but **plain-language versions overreach easily** ("the derivative is speed" holds only in one kind of case); mark each metaphor's limits in the script.
- Every worked-example number is really computed and recomputed at acceptance.
- Douyin: formulas must be big, one expression per screen.

## Suitable scenes
Worth trying: dark-math (3b1b-style), whiteboard (prompt-motion "Replica symmetry breaking whiteboard"), info-cards.

## Cases
None yet (🧪). References: prompt-motion `linearuncle-5d2bae` (Manim, Chinese, 7′37″); the whole 3Blue1Brown catalogue.
