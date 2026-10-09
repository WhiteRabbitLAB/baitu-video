# Production pipeline

中文:[pipeline.md](pipeline.md)

Each step says what to do, what it produces, and what to watch for. All commands are in the engine ([engine/README.en.md](engine/README.en.md)); run `node .claude/skills/baitu-video/engine/cli.mjs <command> <ep>` from your project root:
narration `narrate` → subtitles `subs` → sample `render --ranges` → full `render` → `mix` → `cover` → (vertical platforms only) `vertical` → `accept` → `clean`.
Your channel's own rules live in the channel profile (`profiles/<channel>/`).

## 0. Topic
- **Ask which platforms first → that decides the aspect ratio** (hard rule, decision-maker 2026-10-07): landscape platforms get landscape (16:9 video + 16:9 / 3:4 thumbnails), vertical platforms get vertical (9:16 video + vertical thumbnail), both ⇒ both; nothing that wasn't chosen.
- Give the decision-maker 3–4 candidates, each with: a one-line hook, the story line, the takeaway, the risks (hard-to-verify facts / platform-sensitive).
- Check them against the topic bar and preferences in the channel profile; see which format in formats/ fits.

## 1. Fact sheet (required; acceptance item 14 checks it)
- Write it in `<brief>/facts.md` (`new` creates a template); a four-column table: # / Claim / Source / Status.
- Sources must be ones you actually checked this time (link, book + page, paper); look things up online when you can. Anything written from memory is "unverified" and stays out of the script until checked; "cut" claims are removed from the script.
- Each row: claim / source (primary first) / status "verified · unverified · cut" ("to verify" / "leave out" also accepted).
- Mark platform-risky content "not in the script" right here.

## 2. Script
- Follow the format's skeleton (formats/<id>.md); clear paragraphs; the conclusion comes first, within 3 seconds.
- The script goes in `<brief>/script.<lang>.txt` (e.g. `brief/lesson-01/script.zh.txt`; `new <ep>` creates a template). **A blank line = a new paragraph** (each paragraph is narrated in one request, with a pause between paragraphs). Chinese is split into sentences at 。?; (full / half width), : and ——; English after . ? ! — colons and dashes also start a new sentence, so watch out for very short fragments.
- The sentence-splitting rule is defined in one place only (engine `lib/script.mjs`; narration, timeline and subtitles all take sentences from it).

## 3. Script audit (required before narration)
1. Map every sentence to a fact-sheet row; delete what doesn't map, or mark it "inference / rhetoric".
2. Check every sentence for errors: repetition, subject–verb mismatch, timeline slips, exaggerated quantities.
3. Independent review (a person or model who didn't write it); record the verdict.
4. After edits, redo 1–2.

## 4. Narration and subtitles
- Narration produces the full voice track + a per-sentence timeline (every visual cue hangs off this timeline).
- Check for skipped words with independent speech recognition against the script; review every flagged item (usually homophones) and record the verdict.
- Subtitles are generated from the same timeline, to the channel profile's spec.

## 4b. Real tests (when the format needs them: story-method-test, howto-guide, …)
- Pre-register first: what you test, the control, the pass criteria, a budget cap — write it down, then run; don't move the goalposts afterwards, and label any extra test as extra.
- Archive all raw inputs and outputs; if results differ from what you expected, rewrite the script to match.
- Generation comparisons: same prompt, same conditions, change one thing; archive prompts verbatim.

## 5. Choose format, scene, style
- The format (formats/) decides the narrative; the scene (scenes/) decides the visual world and writing sources; the style (styles/) decides how it's drawn.
- Not in the library ⇒ create one from the template (SKILL.md "Room to grow").
- Before drawing, show the decision-maker 1–3 stills to choose from.

## 6. Storyboard, transition table, font table
- Storyboard: one row per paragraph (time / narration point / visuals / character); start with "the first 3 seconds"; long videos get a chapter table.
- For every shot, write down what the subject is and how big it is (principles.md § Visuals, "Composition"); on-screen text only carries what the narration can't (names, numbers, short keywords) — never the subtitle again.
- Before writing the page, read the component table [engine/vc/README.en.md](engine/vc/README.en.md) and the demo page `engine/vc/demo.html` (how every component is called in every style); no need to read the `vc.js` source.
- Transition table (transitions.md): what enters each paragraph, what it leaves behind, where the next one picks up.
- This episode's font table: copy the writing-source mapping from the scene file, add sources unique to this episode; take fonts from design/fonts.md and subset to the characters used.

## 7. Sample → full video
- The sample covers the first 1–2 paragraphs, with narration, for the decision-maker; only make the full video after they say go.
- The page decides the frame by time alone (`render(t)`), so frame-by-frame rendering is deterministic; thumbnails and the vertical cut are other modes of the same page, not separate drawings.

## 8. Export and mix
- Render frame by frame → encode; check the frame count.
- Mix: narration, sound effects and (optional) music each normalized to their loudness, then the bus normalized.

## 9. Thumbnail, vertical cut, publish notes
- Thumbnail per principles.md §Packaging; only the aspect ratios chosen in step 0.
- **Vertical (9:16 video, vertical thumbnail) must be re-laid out for a vertical screen** (hard rule, decision-maker 2026-10-07): re-place text and images for 1080×1920 in every shot and enlarge type for phones; **never shrink, crop or pan the landscape frame into the vertical one** — text falls off the frame and subjects get cut (N10's first vertical cut failed for exactly this).
  - How: write separate vertical shot functions in the page (content, time anchors and components are shared with landscape; only the layout changes). Shared components already take coordinates one by one; vertical is just another set of coordinates.
  - The vertical cut makes one point and ends by pointing to the full version; platform rules still apply (no URLs on Douyin).
  - Before delivery run the text-out-of-frame / overlap check: `node engine/tools/check-text-bounds.mjs <page?params> <width> <height> <times…>`; any text past the frame edge, inside the 40 px safe margin, or overlapping other text fails. Run it on landscape too (`--margin 0` checks only overlap and out-of-frame).
  - Text of unpredictable length (titles, thumbnail text, data labels, every vertical line) is laid out with `kit.textFit`, not by guessing widths; ask "would a longer title still fit?" — stress-test new templates / components with `engine/vc/fit-test.html`.
  - The layout should be vertically centered between "bottom of the title bar → top of the subtitles" and symmetric left–right, not hugging the title bar with a big gap below. Wrap shot content in `<g id="vcontent">` and run `node engine/tools/check-vert-balance.mjs <page?params> <content top> <content bottom> <times…> --shots <dir>`: a top/bottom margin ratio < 0.6 or a center offset > 35 px is flagged.
  - **Sample times across the whole shot, not just its end state**: when items appear top to bottom, the not-yet-complete content crowds the top half (N10's first version, decision-maker 2026-10-07: "content sits too high"). Fix: keep the group centered on "what has appeared so far", easing the whole group over 0.7 s each time a new block enters (N10's `VFOLLOW` / `vFollow`); a lone first element starts in the middle and moves aside when its partner arrives.
- Publish notes: title (with alternatives), description, chapter timestamps (same source as the progress bar), tags, thumbnail notes.

## 9b. Other language versions (when needed)
- Write the other language's script separately (not a line-by-line translation; re-run real tests in that language — results may differ), with its own script audit, narration and timeline.
- Share one page and switch with a language parameter; scenes whose length differs a lot get their own layout. Add fonts per design/fonts.md §Multi-language.
- Versions without burned-in subtitles need overlapping transitions to avoid gaps.

## 10. Acceptance → delivery
- Go through acceptance.md item by item; archive commands and raw output.
- Commit to version control after the decision-maker confirms.
- Afterwards, write what you learned back into the matching format / scene / style / design file.
