# Engine

Whatever the topic or visual style, every video goes through this one toolchain. The skill docs explain *how*; this folder is *what you run*.
中文:[README.md](README.md)

## Three directories
| Name | What it is |
|---|---|
| **Engine** (this folder) | CLI, shared visual components `vc/`, check tools `tools/` |
| **Skill** (one level up) | Method docs, style samples, channel profiles `profiles/` |
| **Project** (where you run commands) | Scripts, pages, outputs, cache, `.env`, `explainer.json` |

## Getting started (five steps)
1. **Project config**: put an `explainer.json` in your project root (see [explainer.example.json](explainer.example.json)) naming your channel and file locations.
2. **Channel profile**: copy the skill's `profiles/_template/` to `profiles/<channel>/` **in your project** (`"profile": "<channel>"` in `explainer.json`). Don't put it inside the skill folder — updating the skill would overwrite it. Fill in channel / voice / preferences; the json block in `voice.md` is what the engine reads (defaults to free edge-tts).
3. **Self-check**:
   ```
   node .claude/skills/baitu-video/engine/cli.mjs doctor
   ```
   Checks Node, Playwright, ffmpeg, whisper, the font-subsetting tool, component fonts, project config, channel profiles, the narration key for each language (present or not — values are never printed), and disk space. ❌ must be fixed first; ⚠️ is a heads-up. No Playwright yet: `npm init -y && npm i -D playwright && npx playwright install chromium`.
4. **New episode**: `new <ep> --style <style>` creates a script template `brief/<ep>/script.zh.txt`, `subtitles.json`, a starter page `video/<ep>.html` (component paths computed for you) and a fact-sheet template `brief/<ep>/facts.md` (acceptance item 14 checks it; to keep it elsewhere, add `"facts": "docs/{ep}-facts.md"` to the channel's `paths` in `explainer.json`).
5. **Script → video**: a blank line separates paragraphs; then `narrate` → `subs` → edit the page → `fonts` → `shot` a few frames → `render` → `mix` → `accept`.

## Page contract (all the renderer relies on)
| Interface | Required? | Notes |
|---|---|---|
| `window.render(t)` | yes | The frame depends only on time t (seconds); the same t always draws the same frame |
| `window.fontsReady` | yes | A Promise; every number in the resolved object must be > 0 (`VC.ready` returns "family:weight → faces loaded"). Any 0 means a font failed to load and rendering refuses to start |
| `window.renderSfx(sampleRate)` | optional | Offline sound effects → `{b64, sampleRate, samples, peak, cues}`; omit for no SFX |
| `window.coverReady` | optional | Thumbnail mode for `?cover=<size>-<variant>` (used by `cover`) |
| `window.vertFrame(t, e)` | optional | Vertical frame for `?vert` (1080×1920), e = end-card progress 0–1 (used by `vertical`) |

The renderer opens `file://…/<ep>.html?render`; a second language adds `&lang=en`. The page loads `data-<ep>.js` (from `subs`: `window.TL` timeline, `window.SUBS` subtitles) and `fonts-<ep>.css` (from `fonts`). The page draws its own subtitles: `kit.subtitle(t, SUBS, {font, size})`. A complete minimal page: [templates/page.html](templates/page.html).

## Commands
| Command | Does | Status |
|---|---|---|
| `doctor` | Self-check | ✅ |
| `new <ep>` | New episode: script template, `subtitles.json`, starter page | ✅ |
| `narrate <ep>` | Narration + timeline: provider from voice.md, one request per paragraph; uses API timestamps when given, otherwise aligns with whisper. Outputs `narration.wav`, `timeline.json` (second language gets a `.en` suffix) | ✅ |
| `subs <ep>` | Subtitles `.srt` + page data file (`window.TL`, `window.SUBS`); per-episode settings in `<brief>/subtitles.json` | ✅ |
| `render <ep>` | Frame-by-frame video + sound effects; `--ranges 0-5,20-30` renders only a sample `proto.mp4` (with narration) | ✅ |
| `mix <ep>` | Mix (narration -16, SFX -24, optional music) and mux `<ep>.mp4` | ✅ |
| `cover <ep>` | Thumbnails (`--sizes 16x9,3x4`, `--variants a,b`) | ✅ |
| `vertical <ep>` | Vertical cut; per-episode `<brief>/vertical.json` (which spans of the main video) | ✅ |
| `shot <ep> t1 t2 …` | Screenshots at given times (`--vert` for vertical) | ✅ |
| `accept <ep>` | 11 acceptance checks → `acceptance/summary.md`; human-confirmed exceptions go in `<brief>/accept.json` | ✅ |
| `fonts <ep>` | Font subsetting for one episode page: only the characters actually used; source fonts download automatically per `fonts.json`. `fonts-demo` re-cuts the engine's bundled component fonts | ✅ |
| `clean` | Delete render intermediates | ✅ |

## TTS provider test status
ElevenLabs, Azure and Fish Audio were wired up from their official docs; the author has no keys for them, so they are **untested**. Run the probe `tools/tts-probe.mjs` before relying on one; if the API doesn't match, fix `lib/tts/<provider>.mjs`. Once it works, please set its `status` to `tested` with a date in `lib/providers.mjs` and send the change back.

## Layout
| Path | Contents |
|---|---|
| `cli.mjs` | Command entry |
| `lib/paths.mjs` | The three root directories (single source) |
| `lib/config.mjs` | Reads `explainer.json`, channel profiles, the json in `voice.md`, `.env` |
| `lib/providers.mjs` | TTS provider registry (9 providers, with test status) |
| `lib/tts/` | One file per TTS provider |
| `lib/align.mjs` | Timing alignment (API timestamps / whisper) |
| `lib/narrate.mjs`, `lib/subs.mjs` | Narration, subtitles |
| `fonts.json` | Font catalog: download URL and license for every font (single source) |
| `lib/doctor.mjs` | Self-check |
| `vc/` | Shared visual components (see [vc/README.md](vc/README.en.md)) |
| `tools/` | Checks and measurements: text out of frame / overlap, vertical centering, frame fill (`check-fill`), subtitles repeated on screen (`check-echo`), glyph winding, film pacing, fades, subtitle timing |
