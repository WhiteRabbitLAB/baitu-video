# Example channel profile: a nutrition-science channel

> **This is an example of what a filled-in profile looks like.** Copy the structure and wording freely; **the rabbit and the preferences in this folder are the author's private property and are not licensed for any use** — see [LICENSE.md](LICENSE.md). Copy [../_template/](../_template/) and fill in your own.

## Channel
- Nutrition science explainers, in Chinese. Every episode starts by asking where it will be published (landscape: YouTube / long-video platforms; vertical: Douyin) and only the matching aspect ratio is made; the vertical cut is re-laid out for a vertical screen, never cropped from landscape (../../pipeline.md §0, §9).
- Decision-maker: the channel owner. Full production only after they review a sample (segments 1–2) and say "go"; agree on the style before drawing anything.
- The channel's three tests: an interesting story / useful to the viewer / real substance. Not "a lot of explaining followed by a weak payoff".

## Mascot: the rabbit (author's private character — example only)
- Reference sheet `assets/bunny/review-light.png` (six angles; outfit follows the black apron in `bunny-apron.png`; six poses `pose-1…6.png`): round head, two tall oval black eyes set low, no nose / mouth / blush, capsule-to-pear body, thin arms.
- Rejected: square head facing front, one-eyed pure profile, a snout and nose, hand-written SVG traced from the sheet (proportions off), enlarged black pupils for surprise (looks like a ghost), hard-edged highlights.
  → **The "rejected" list is the part most worth copying**: log every design the decision-maker turns down, and it won't happen again.
- Implementation: geometry drawn in code (radial-gradient shading); the role changes with the scene: detective (case file), advisor (strategy game), lab assistant (lab, dashboard).

## House visuals
- Subtitles: Source Han Sans weight 900, 52 px, white with black stroke; ≤ 20 characters per line (spaces excluded); mid-sentence commas become spaces, sentence-final punctuation is dropped except question marks; only numbers with a unit are converted to digits, others stay in Chinese (one conversion table per episode, approved by the decision-maker).
- Chapter progress bar: required for anything over 3 minutes; pinned to the bottom, split by chapter, current chapter highlighted, fills with progress; chapters come from the same source as the publish notes; stays clear of the subtitle area.
- Brand palette (macaron): #E4ECE3, cream #FBF6EC, yolk #F2C14E, pink #F3B2B0, leaf #8DBF8B, mint #A8D8C5, wheat #D9B98C, ink #1F1C1A.

## Toolchain
With the engine: `new` → `narrate` → `subs` → `fonts` → `render --ranges` (sample) → `render` → `mix` → `cover` → (vertical platforms only) `vertical` → `accept` → `clean`; see ../../engine/README.en.md.
One command per step of ../../pipeline.md. Page contract (what the renderer relies on): `window.render(t)` (a pure function of time), `DUR`, `CUES`, `renderSfx`, `fontsReady`, `FONTS`; thumbnail `coverReady`; vertical `vertFrame(t)`.

## Platform rules
- Douyin: no URLs, and no words like "official site / website / blog / launch page", in visuals, narration, subtitles, description or thumbnail (we were actually throttled for it); cite organizations by name. Grep before delivery.
- Maps are schematic, provinces labeled by name only, no administrative or national borders; no real-person likenesses; no self-harm details in scripts; no original audio from trending memes (throttling / copyright) — imitate with your own TTS voice instead.

Narration: [voice.en.md](voice.en.md). Decision-maker preferences: [preferences.en.md](preferences.en.md).
