# baitu-video

**Make explainer videos with code — any topic, any of 12 visual styles, narrated, subtitled, rendered and checked by one engine.**
A [Claude Code](https://claude.com/claude-code) skill: the method (formats, scenes, styles, a design library) plus the engine that turns a script into a finished MP4.

中文说明:[README.zh.md](README.zh.md)

![A whiteboard-style sample being drawn stroke by stroke](docs/demo-whiteboard.gif)

*"Why is the sky blue?" — the runnable example in [examples/sky-demo](examples/sky-demo/README.md), whiteboard style, free edge-tts voice; first 10 seconds.*

## Chinese and English · landscape and vertical
One page, one timeline: `?lang=en` switches to the English narration, subtitles and on-screen text; `vertFrame(t)` re-lays the same drawing for a 1080×1920 vertical cut (re-laid out, never cropped). Subtitles wrap automatically on narrow screens.

![Chinese and English landscape](docs/zh-en-landscape.jpg)

![Vertical cut](docs/vertical.jpg)

The whole example — both languages, both orientations — runs from [examples/sky-demo](examples/sky-demo/README.md) with no API key.

## Twelve styles, one scene
The same scene and content with only the style layer swapped — switching style is one line (`VC.kit('whiteboard')`).

![Twelve styles side by side](styles/thumbs/_all.jpg)

paper skeuomorphic · game UI · flat geometric · flat illustration · cartoon UI · dark tech · whiteboard · dark math · chalkboard · kinetic type · risograph · thermal receipt — details in [styles/INDEX.en.md](styles/INDEX.en.md).

**New: thermal receipt** (`thermal`) — off-white thermal paper strips, bitmap text printed line by line, black and red only; the metaphor is a bill, made for "looks the same, adds up differently" comparisons. Two frames from a full video made with it (6 minutes, landscape):

![Frames from a full video in the thermal receipt style](styles/samples/thermal-film.jpg)

## Scene templates
Twelve ready-made visual worlds, each with its own writing sources, components and signature moves. Below: screenshots from finished videos the author made with eleven of them (most are Chinese-language videos):

![Scene templates](scenes/thumbs/_all.en.jpg)

case files · 1944 lab desk · data dashboard · strategy game · anatomy diagram · editing desk · info cards · side-scrolling landscape · tech terminal · paper lab notes + screen dialog · paintings and labels · deep-sea section — details in [scenes/INDEX.en.md](scenes/INDEX.en.md); simpler demo frames on one neutral topic are in [scenes/demo/](scenes/demo/_all.en.jpg). Narrative formats (true-experiment story, scenario guide, concept lesson, versus, list…) are in [formats/INDEX.en.md](formats/INDEX.en.md).

## How it works
A video is chosen by four questions — **what** (explainer, true story, tutorial, comparison…), **which field**, **what feel**, **which platforms** — and built from four independent layers:

| Layer | Decides | Library |
|---|---|---|
| Format | The narrative skeleton (12 formats: true-experiment story, story → method → test, scenario guide, concept lesson, versus, list…) | [formats/](formats/INDEX.en.md) |
| Scene | The visual world and its writing sources (case files, lab desk, strategy game, terminal, whiteboard…) | [scenes/](scenes/INDEX.en.md) |
| Style | How it's drawn (12 styles) | [styles/](styles/INDEX.en.md) |
| Channel profile | Your channel's own settings: voice, subtitles, platform rules, preferences | [profiles/](profiles/README.md) |

The page is plain HTML/SVG where `render(t)` draws the frame for time `t`; the engine renders it frame by frame with headless Chromium and hands everything else — narration, subtitles, mixing, thumbnails, vertical cut, acceptance — to one CLI.

## Requirements
Only tested on macOS. On Linux, installing the same tools with your distro's package manager should work but is **untested**; Windows is untried. After installing, run `node .claude/skills/baitu-video/engine/cli.mjs doctor` in your project root — it checks each item and tells you how to fix whatever is missing.

| What | Needed? | For | Install (macOS) |
|---|---|---|---|
| Node ≥ 18 | required | the engine itself | `brew install node` |
| Playwright + Chromium | required | frame rendering, screenshots, checks | in your project: `npm init -y && npm i -D playwright && npx playwright install chromium` |
| ffmpeg (with ffprobe, libx264, loudnorm) | required | encoding, mixing, loudness | `brew install ffmpeg` |
| python3 | required | the "subtitle duration" acceptance check (standard library only) | ships with macOS, or `brew install python` |
| uv | required for the free edge-tts voice; recommended otherwise | the engine runs `uvx edge-tts` on the fly (no global install); also used to fetch fontTools / pypinyin when missing | `brew install uv` |
| whisper-cli + model file | recommended; required if your TTS provider gives no timestamps | the "missed lines" acceptance check; aligns subtitles for providers without timestamps | `brew install whisper-cpp`; model below |
| fontTools + brotli | recommended | per-episode font subsetting (`fonts` command) | `pip install fonttools brotli`, or nothing if uv is installed |
| numpy | optional | the pacing tools `measure_film.py`, `measure_fades.py` | `pip install numpy` |

**Whisper model** (medium, about 1.5 GB):
```bash
mkdir -p cache/whisper
curl -L -o cache/whisper/ggml-medium.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
```
The engine finds it at `cache/whisper/ggml-medium.bin` in your project; anywhere else, set `WHISPER_MODEL=<path>` in the project's `.env`.

TTS API keys go in `.env` at the project root (variable names per provider are in `engine/lib/providers.mjs`; the default edge-tts needs no key).

## Quick start
In your project (install the required items under "Requirements" first):
```bash
git clone https://github.com/WhiteRabbitLAB/baitu-video .claude/skills/baitu-video
npm init -y && npm i -D playwright && npx playwright install chromium
E=.claude/skills/baitu-video/engine/cli.mjs

# 1. project config + your channel profile (kept in YOUR project, not inside the skill)
cp .claude/skills/baitu-video/engine/explainer.example.json explainer.json
mkdir -p profiles && cp -r .claude/skills/baitu-video/profiles/_template profiles/my-channel
node $E doctor                        # checks everything; ❌ must be fixed

# 2. a new episode
node $E new lesson1 --style whiteboard   # script template + starter page
#    write brief/lesson1/script.zh.txt (blank line = new paragraph), then:
node $E narrate lesson1                  # voice + timeline (free edge-tts by default)
node $E subs lesson1                     # subtitles
node $E fonts lesson1                    # subset fonts for this page
node $E shot lesson1 3 8                 # look at two frames
node $E render lesson1 && node $E mix lesson1
node $E accept lesson1                   # 14 acceptance checks → out/lesson1/acceptance/summary.md
```
Or just ask Claude Code to "make an explainer video about …" — the skill tells it how. Full walkthrough: [engine/README.en.md](engine/README.en.md) · pipeline: [pipeline.en.md](pipeline.en.md).

## Narration providers
Pick one in `profiles/<channel>/voice.md`; providers without timestamps are aligned automatically with whisper.

| Provider | Status |
|---|---|
| Doubao (Volcengine), MiniMax, Alibaba Model Studio (Qwen TTS), OpenAI TTS, Gemini TTS, edge-tts (free) | tested 2026-10-08 |
| ElevenLabs, Azure Speech, Fish Audio | wired up from official docs, **untested** (no keys) — run `engine/tools/tts-probe.mjs` first, and PRs welcome |

## Which model and effort to use
Tested 2026-10-09: 45 runs — Claude Haiku 5.5, Sonnet 5.5 and Opus 5.5, each at effort low / medium / high / xhigh / max, on three tasks (a 30 s whiteboard explainer, a 45 s case-file story, a 45 s strategy-game map with route animation). Every run started from an empty folder with only this skill installed (`claude -p --model … --effort …`) and **every run produced a finished video**. Quality is a 1–5 score given by Claude (Opus 5.5) from each video's frame contact sheet.

| Use | Model · effort | Quality | Avg cost | Avg time |
|---|---|---|---|---|
| **Default** | **Opus 5.5 · high** | 4.2 | $4.45 | 18 min |
| On a budget | Sonnet 5.5 · high, or Opus 5.5 · medium | 3.8 | $2.5–2.7 | 13 min |
| Best result | Opus 5.5 · xhigh (looks up primary sources, richer props) | 4.5 | $8.91 | 29 min |

- **Not worth it**: `max` on any model (same quality as xhigh, ~60% more cost, about twice the time); Haiku 5.5 at any effort (≤ 2.3 — it finishes, but frames are sparse; prompts over 100K tokens are billed at 5×, so Haiku max averaged $1.55 — more than Sonnet low at $0.59); Sonnet low / medium (works, plain).
- Opus high matches Sonnet xhigh (4.2) at ~15% lower cost and 10 minutes faster.
- Caveats: one run per cell and one scorer, so neighbouring rows may swap on a rerun; costs are the API list-price estimates Claude Code reports (on a subscription they come out of your quota instead). This is a capability boundary dated 2026-10-09 — re-test when new models ship.

## What's verified, honestly
- The engine reproduces a published 4.5-minute video **frame-for-frame and sample-for-sample** from its source (render, mix, subtitles, thumbnails).
- A fresh agent with no context made a working sample from an empty folder using only these docs; every snag it reported was fixed. On 2026-10-09, 45 such cold starts across three models and five effort levels all produced a finished video (see above).
- Not yet verified: switching style mid-video, two characters in one shot, lip-sync, character acting in a finished video. Formats marked 🧪 have a skeleton but no sample yet.

## License
- Code and docs: [MIT](LICENSE).
- `profiles/example/` — the rabbit mascot and the decision-maker preferences — is the author's private material, **all rights reserved, no license granted**. It's there only to show what a filled-in profile looks like; make your own character.
- Bundled subset fonts: each under its own license (SIL OFL 1.1 / Apache 2.0), texts in [engine/vc/fonts/LICENSES/](engine/vc/fonts/LICENSES/README.md).
- Details: [NOTICE.md](NOTICE.md).
