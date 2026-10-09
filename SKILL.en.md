# Making explainer videos

中文:[SKILL.md](SKILL.md)

Any topic. This method was distilled from the author's two channels — nutrition science (11 videos) and practical AI (6 videos plus a 17-minute history feature). Formats, scenes and styles are written so they don't depend on the topic; cases from either channel carry over to the other.

## Read this first: the skill is a floor, not a ceiling
Rules come in three weights: **hard rules** (facts, safety, platform rules, the decision-maker's calls — always follow), **capability limits** (set because a model couldn't do something at the time; dated, re-test and lift them when models improve), and **defaults** (parameters, templates, skeletons — a starting point, not a cap; do better when you can and leave a record of the comparison). See the top of [principles.md](principles.en.md).
Don't give up a better approach because the docs list a parameter, and don't skip something just because the docs don't mention it.

## Entry point: four questions

1. **What do you want to make?** (science explainer / true story / tutorial / review & comparison / opinion / list / news roundup)
2. **What field?** (health & nutrition / tech & AI / humanities, history & art / natural science / social science, psychology & law / finance & business / education / workplace skills / lifestyle)
3. **What feel?** (pick from the style thumbnails)
4. **Which platforms?** (landscape: YouTube, Bilibili, WeChat Channels landscape…; vertical: Douyin, WeChat Channels vertical, Xiaohongshu…) → **make only the matching aspect ratio**: landscape platforms only ⇒ landscape only; vertical only ⇒ vertical only; both ⇒ both (decision-maker, 2026-10-07). The vertical cut is re-laid out for a vertical screen, never cropped from landscape.

→ Look up recommended combinations in [catalog/](catalog/README.en.md). Each is marked: ✅ doable (a finished video exists), 🧪 needs testing (doable but no sample yet), ⛔ not doable for now (needs on-camera people, live footage or licensed material).
Whether popular reference works can become our templates: [catalog/references.md](catalog/references.en.md). Styles keep growing: [styles/ROADMAP.md](styles/ROADMAP.en.md).

## Inside: four layers + a design library

Users choose by "purpose × field × feel"; internally the library is stored in four independent layers, so any layer can be swapped (customized) on its own.

| Layer | Governs | Examples | Library |
|---|---|---|---|
| **Format** | What to say and how (narrative skeleton) | true-experiment story, story → method → test, how-to guide | [formats/](formats/INDEX.en.md) |
| **Scene** | What world the picture is; which writing sources, components and through-line elements it has | case-file desk, strategy game, tech terminal, gallery labels | [scenes/](scenes/INDEX.en.md) |
| **Style** | How it's drawn: line, fill, light, material, motion feel, how characters are drawn | paper skeuomorphic, flat geometric, dark tech UI | [styles/](styles/INDEX.en.md) |
| **Channel profile** | Settings that belong to one channel only: mascot, subtitle spec, narration, platform rules, decision-maker preferences, toolchain | [filled-in example](profiles/example/channel.en.md) | [profiles/](profiles/README.md) |

Scenes and styles share a **design library** ([design/](design/)): fonts (by writing source), palettes, components, motion & materials, and the **camera & transition library** (every parameter cites its source: measured / primary source / ours / to be measured).
On-screen text is classified by **text role** ([text-roles.md](text-roles.en.md)): **when you change scene or style, the font, the carrier (speech bubble, note, panel) and the entrance all change together**; subtitles and the chapter progress bar belong to the channel profile and don't change.
For character acting, add the character module ([characters/](characters/INDEX.en.md)): image generation does the art, code does the engine.

## Engine
A runnable example episode (Chinese and English narration, landscape and vertical): [examples/sky-demo](examples/sky-demo/README.md).
The commands, shared visual components and check tools all live in [engine/](engine/README.en.md). First time: run the self-check from your project root: `node .claude/skills/baitu-video/engine/cli.mjs doctor`.

## What to read

| Task | Read |
|---|---|
| First use in a project | Follow the five steps in [engine/README.en.md](engine/README.en.md) "Getting started": `explainer.json` → copy [profiles/_template/](profiles/_template/) to `profiles/<your-channel>/` **in your project** (not inside the skill folder — updates would overwrite it) and fill in channel / voice / preferences; see [profiles/example/](profiles/example/) for how it reads (the rabbit and the preferences are the author's private property, not licensed for use) |
| Making an episode from scratch | [pipeline.md](pipeline.en.md) + [principles.md](principles.en.md) + your channel profile |
| Choosing format / scene / style | The four questions in [catalog/](catalog/README.en.md) first; then the three library INDEX pages |
| Deciding on-screen text | [text-roles.md](text-roles.en.md) → the scene's writing-source table → [design/fonts.md](design/fonts.en.md) |
| Writing the page, calling components (hand-drawn lines, hatching, stamps, bubbles, transitions…) | The component table in [engine/vc/README.en.md](engine/vc/README.en.md) + the demo page `engine/vc/demo.html`; composition and "don't repeat the subtitles on screen" are in [principles.md](principles.en.md) § Visuals. No need to read the `vc.js` source |
| Joining shots and poses | [transitions.md](transitions.en.md) + the camera & transition library [design/camera-transitions.md](design/camera-transitions.en.md) (every parameter has a reference) |
| Character acting | [characters/act-pipeline.md](characters/act-pipeline.en.md) |
| Before delivery | [acceptance.md](acceptance.en.md) |

## Room to grow: every library can be extended

| To add | How |
|---|---|
| A format | Copy `formats/_template.md`; write the narrative skeleton, required shots, transition preferences; register it after a sample proves it |
| A scene | Copy `scenes/_template.md`; **fill in writing source → R1–R10**, through-line elements, components; register after a sample |
| A style | Copy `styles/_template.md`; **you must write how characters are drawn in this style**; register after samples with an existing scene + a character |
| Font / palette / component / motion | Add a row to the matching file in `design/` (fonts must be licensed for commercial use) |
| A character | Register after finalizing per `characters/act-pipeline.md` |
| A channel | Copy the `profiles/_template/` folder (three files: channel / voice / preferences) |

After every episode, write what you learned back into the matching file.

## Status and what's unverified

The to-do list (`TODO.md`) is the author's internal record and isn't in the open-source release; the public style roadmap is [styles/ROADMAP.md](styles/ROADMAP.en.md).

- Scenes and styles are separate in the library; older episode pages were "one big HTML per episode" with both mixed together. **Common components are now shared, style-swappable code in `engine/vc/`** (components only know text roles; looks come from `styles.js`, one set for each of 11 styles; thumbnails in [styles/INDEX.md](styles/INDEX.en.md)); one finished video (N10) was built entirely with it.
- Unverified: the same scene in a different style in a real video; mixing several styles in one cut; two or more characters in one shot; lip-sync to narration; character acting in a finished video.
- Formats compiled from the AI channel's scripts, handover notes and font tables (story-method-test, howto-guide, product-review, timeline-epic) and scenes (terminal-tech, field-notebook, gallery-wall) haven't been used in a new video yet; gallery-wall's page was deleted, so its font table is entirely inferred.
