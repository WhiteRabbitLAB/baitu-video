# Sports broadcast (id: broadcast)

## Rendering language
TV sports-broadcast graphics: a **night stadium** (deep navy-black, blurred crowd dots, a row of floodlights along the top) + **broadcast graphics** (navy scoreboard, yellow clock tab, white referee bar, pitch-side LED ad board) + a strip of grass at the bottom.
Flat fills, no outlines, 6–14px corners; a faint highlight on the top half of the scoreboard, one team-colored bar on each side.
**The metaphor is "a match"**: two groups = two teams, results = the score, the statistical verdict = the referee bar, the funder = a pitch-side sponsor ad, other studies = "other fixtures", caveats = "post-match review". Suits head-to-head trials where A and B end up close.
**Color carries meaning**: one color per team (`c.home` orange #FF7A2F / `c.away` blue #3D8BFF; a third team on the page can use `c.red`); **yellow #FFD23F is only for broadcast graphics** (clock tab, referee, sponsor board, emphasis); everything else white / gray.
**Keep the metaphor honest (hard rule)**: a non-significant result is written "not significant / no winner called", **never "a draw / a tie"** — not significant does not prove the two are the same; the score is each group's average, not "who won".

## Materials and post
- Backdrop `backdrop: 'stadium'`: crowd dots in the top half only (fading downward, the bottom half is left for content), a few small floodlight points along the top edge, vignette. The grass and the LED board are not part of the backdrop; `bc.pitch()` / `bc.led()` draw them (episode 14: LED board at y=790, grass from 870 to the bottom, subtitles sit on the grass; `ledY` is adjustable).
- No grain, no paper texture; the LED board gets a 12px vertical pixel grid (opacity .025).

## Typefaces
- Broadcast graphics (R1 R2 R6 R9): **Noto Sans SC 900**. Team names use the same face with a whole-group `skewX(-10)` as italics (CJK fonts have no true italic).
- Scores and big numbers R4: **Anton** (condensed, bold); CJK units still go through Noto Sans SC.
- Small labels R3 R7 R10: Noto Sans SC 500.
- Quotes R5 (from papers, press releases): Noto Serif SC 500 — that is print, not broadcast graphics.
- No handwriting layer: R8 becomes small yellow text wiped in.

## What the components look like
- Text entrance `wipe`: revealed by a mask from the left while sliding 24px right into place, 0.35s expoOut (R3 / R10 0.3s).
- Stamp `slab` (solid yellow plate + bold navy text, thrown in); mark `box` (thin yellow frame); numbers `punch` (small jump on change); bubble `card` (rounded navy card + yellow left bar); window `win`; panel `flat`.
- Broadcast parts live in the add-on module `engine/vc/broadcast.js` (pulled out of the episode-14 full film, 2026-10-11): `const bc = VC.broadcast(kit, {onCue, onText, ledY})`. Grass `pitch`, LED sponsor board `led`, clock `tab`, referee bar `refBar`, info strip `infoRow` (yellow label block + navy bar), numbered `steps`, `scoreboard`, small `miniBoard`, italic team name `team`, fixture row `fixture` (a crossed-out match gets a red line), selection `funnel`, other-fixtures `result` row, advice `tip` row, people `dots` grid (493 → 220 dimming). Usage in the three "broadcast" rows of engine/vc/README.en.md. Episode 14's page now uses it: 617 frames (every 0.6 s) and both covers are pixel-identical, and the 167 sound cues are unchanged.

## Motion
- Graphics are **wiped in** (a left-to-right mask), never faded or bounced; changing the LED ad = the whole board lights up left to right in 0.6s.
- Between shots `slide-push` (a yellow bar leads, like a director switching boards), 0.5s, starting 0.3s before the paragraph.
- Numbers only move between real values (`counter`); falling head counts are shown by dimming a dot grid, not by rolling digits.

## People
- In code: no people; groups are "teams" (name plate + team color bar), head counts are dot grids.
- Generated characters: if needed, constrain with "TV sports broadcast graphics, flat navy panels, no logos, no real team names" — no real teams, leagues or sponsor marks.
- Code lighting: none.

## Scenes it can draw
Full film ×1 (episode 14, 2026-10-11, 6:10 landscape): final scoreboard, event card, selection funnel, team rule cards, a 104-week fixture bar, trend curve (schematic), two scoreboards at two time points, an off-field experiment, three post-match review screens (sponsor board / people dot grid / fixture list), the WHO "referee panel", other fixtures, a label close-up, tactics board, three team plates.
Suggested: trials comparing two practices / foods / tools head-to-head; topics where "who paid" must be clear (the sponsor board is the natural place); round-ups of several studies ("other fixtures").

## Samples (2026-10-11)
[Empty scene](samples/broadcast-1-scene.jpg) · [Text roles R1–R10](samples/broadcast-2-roles.jpg) · [Character](samples/broadcast-3-character.jpg). Regenerate: `node engine/vc/samples.mjs broadcast`.

## Pitfalls
- **Crowd dots over the whole screen are too busy**: the first version spread dots everywhere with radius-70 gray floodlight discs behind the text; now dots stay in the top half and fade downward, floodlights are small points on the top edge.
- **Two graphics at the same y shared a clipPath id**: page parts first derived ids from the y coordinate, so the two side-by-side referee bars (week 52 / week 104) collided. Use a per-frame counter reset at the start of each frame (same idea as `kit.begin()`).
- **When one shot hands over between two contents, exit first, then enter**: the curve fading out and the scoreboards fading in overlapped for 0.3s and the checker reported overlapping text.
- **For wiped-in team plates, put the text inside the same mask**: otherwise the frame is still wiping while the text is already fully visible, and the checker reports "text sitting on the edge of a shape".
- **Short labels must not copy the subtitle**: a whole sentence on screen is an echo; label-style phrases cut the echo from 25 s to 3 s (the rest is a quoted line from the press release).
