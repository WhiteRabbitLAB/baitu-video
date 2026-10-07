# Channel profile: <channel / series name>

The fixed settings of one channel. Everything else in the skill is generic; **anything that belongs to this channel only goes in this folder**.
New user: copy the whole `_template/` folder to `profiles/<your-channel>/` and fill in the three files. See [../example/](../example/) for how a filled-in profile reads.

| File | What it holds |
|---|---|
| `channel.md` (this file) | Channel, characters, house visuals, toolchain, platform rules |
| [voice.md](voice.en.md) | Narration: which TTS service, which voice, speed, where the key lives |
| [preferences.md](preferences.en.md) | Decision-maker preferences: likes and rejections, one per line, dated |

## Channel
- Platforms (which landscape / vertical platforms), audience, topic direction and bar.
- Who the decision-maker is (who reviews samples, who signs off).

## Mascot / recurring character (optional — delete this section if you have none)
- Reference sheet (path, kept in this folder's `assets/`), rejected designs, the character's role in each scene.
- How it is made (drawn in code / generated parts / sprites).
- **Use your own character.** The rabbit in `example/` is the author's private character and is not licensed for any use (see ../example/LICENSE.md).

## House visuals (stay the same when scene or style changes)
- Subtitles: font, size, color, stroke / backing box, max characters per line, number formatting rules. A good start: Noto Sans SC 900 (`Noto Sans SC:900`), 52 px, white with a 10 px black stroke, baseline y=1040; ≤ 20 CJK characters per line (≤ 42 for English). Draw them with `kit.subtitle(t, SUBS, {font, size})` — the starter page from `new` already does.
- Chapter progress bar: when it appears, position, look.
- Brand palette, end card, corner badges.

## Toolchain (this channel's implementation)
Step-by-step commands, one per step of ../../pipeline.md; the page contract (which functions the renderer calls on the page).

## Platform rules
- What each platform forbids (URLs, maps, likenesses, copyrighted audio…) and where the rule came from.

## Past episodes (optional)
| Ep | Title | Format | Scene | Style | Result |
|---|---|---|---|---|---|
