# Popular reference works: can they become our templates?

中文:[references.md](references.md)

Compiled from creators widely recognized as leaders on each platform (based on public coverage and channel descriptions, **not a ranking by views**).
Each row: its visual form → can it be made with "code + image generation + public-domain material" → what it maps to for us → what's missing.
Add a row when you find a good work; update the status after making an episode.

| Reference | Purpose / field | Visual form | Doable? | Maps to | Missing |
|---|---|---|---|---|---|
| Huixingzhen (PaperClip) | Explainer / general | Pure animated infographics, a highly unified style, 3–5 min | ✅ our strength | mechanism, experiment; lab-dashboard, anatomy-diagram | A unified channel visual system (shared components) |
| Kurzgesagt | Explainer / natural science | Flat + gradient vector animation, scale journeys, always moving | 🧪 backgrounds can be detailed; characters need image generation | flat-illustration, landscape-scroll | Scale-journey scene; character acting in a finished video |
| 3Blue1Brown | Concept lesson / math & physics | Black background, one object smoothly morphs into the next, color = concept | 🧪 a natural fit for code | concept-lesson (🧪 card written) | A "coordinates & graphs" scene |
| TED-Ed | Story / history, science | A different animator each episode, varied styles | 🧪 depends on the style library | timeline-epic, spread-history | More styles (see ../styles/ROADMAP.md) |
| CGP Grey | Explainer / geography, history, politics | Stick figures + icons + map infographics | 🧪 | info-cards, strategy-game maps | A stick-figure character component |
| Vox | Opinion, explainer / society | Real documents collaged on a desk, clippings, red lines, highlighter | ✅ done structurally | case-file, field-notebook (paper-skeuo) | Refining "document collage" motion |
| Whiteboard (RSA Animate type) | Explainer, teaching | A hand drawing on a whiteboard while talking | 🧪 | To build: whiteboard scene | Stroke-by-stroke line-art reveal component |
| Kinetic type | Opinion, list | Keywords slam in on the beat | 🧪 easy | First 3 seconds, listicle (🧪 card written) | Kinetic-type style |
| Story stick-figure animation (TheOdd1sOut type) | Story / lifestyle | Simple characters, fast cuts + reaction close-ups | 🧪 | Character module | A character expression library |
| Xiaoyuehan Kehan | True story / history | Lots of realistic film footage + his own voice | ⛔ licensed footage; partly convertible | timeline-epic (visuals become public-domain images + maps + archives) | A public-domain material search workflow |
| Banfo Xianren | Opinion / finance, society | Memes + video footage + sharp copy | ⛔ footage copyright; structure borrowable | Put the opinion inside a story; kinetic type instead of memes | — |
| Luo Xiang, Li Yongle, Bidao | Explainer, teaching | Presenter on camera + board / graphics | ⛔ on camera; the graphics part is doable | A mascot instead of a human host + info-cards | — |
| Xiao Lin Shuo | Explainer / finance | Presenter on camera + infographics | ⛔ presenter; 🧪 infographics | To build: financial chart scene | Financial chart components |
| Veritasium, Mark Rober, "build everything by hand" creators | Explainer / science, engineering | Filmed experiments, hands-on builds | ⛔ live footage | Convert to experiment (animated retelling of someone else's experiment) | — |
| Street interviews | Opinion / society | Filmed interviews | ⛔ | — | — |

## References for code-generated animation (prompt-motion.com, viewed 2026-10-07)
[prompt-motion.com](https://prompt-motion.com/) collects 230 animations written as code by Claude Opus 5.5, with prompts; about 80% are product promos and motion portfolios (15–20 s showpieces), a different genre from explainers.
The table below lists what's useful to us. Each was viewed as 8 still frames only; **transition durations and easing were not measured** — measure them with the method in ../design/camera-transitions.md before using them. Entry page = `https://prompt-motion.com/<entry>`.

| Entry | Visual form | Maps to | How to borrow |
|---|---|---|---|
| twoclipping-5cba86 "Shape morphing through UI states" | One shape turns into a player, slider, switch, button, data card — no cuts | morph transition (now in the engine) | The morph template: the previous shot's main shape becomes the next shot's |
| ik-builds-b8bdcf "Paper-style product launch film" | Paper style; a small ball with a trail runs through the whole film, stitching scenes together | Through-line element + transition | Give each episode one through-line object (a ball, a pen tip, a number) that leads into the next shot, instead of a single pan |
| tak3sh8-be5012 "Replica symmetry breaking whiteboard" | Whiteboard frame, a marker icon following the stroke, diagonal hatching, three pen colors, a final "the whole story on one board" | Whiteboard style (high priority on the roadmap) | The sample standard for that style |
| linearuncle-5d2bae "Explaining the derivative" (Manim, Chinese) | Black coordinate system, secants approaching the tangent, a magnifier straightening the curve | concept-lesson format, dark-math style | Skeleton: intuitive question → step-by-step approach → example → leave a question |
| kloss-xyz-fe0c31 "History of AI timeline" | A permanent time scale on top + current-year marker; a huge faint year behind; one dedicated graphic per era (dialog, comparison bars, attention arcs) | timeline-epic | Make the time scale a permanent component; one kind of graphic per era, no repeats |
| emollick-8661a8 "Recursion explained in genres" | Each level in a different style (terminal, 8-bit, documentary, kids' show, film noir, trailer), a "call stack" label on top showing the level | Style switching as a format selling point | Switch style per chapter (engine/vc styles.js can already do this); a top label shows the current "level / chapter" |
| nikolajankovic-ce4ff4 "DeFi Saver stop-motion explainer" | Hand-drawn frame by frame (pencil lines, thermometer, candlesticks), captions on masking-tape strips | A sketch variant of paper-skeuo | Looser line art + boiling lines (redraw every 2 frames); subtitles stay to the channel spec |
| x4b47x-9cc84f "Shadow theatre home story" | Paper-cut shadow puppets, vertical 9:16, a stage-curtain frame | Roadmap "shadow puppets", vertical Douyin | Starting point for a shadow-puppet style; the curtain frame suits vertical |
| yunn260414-60d996 "What is Git" (Chinese) | Dark-blue cards + terminal window + bottom subtitles | terminal-tech | Baseline: little motion, slideshow-like — we should beat it on camera moves and joins |
| parkerrex-1a54fe "Token bucket rate limiter" | Prompt: canvas only, each frame a pure function of time, easy frame-by-frame capture | Our render(t) architecture | Confirms the approach; nothing new |

**Not usable as references**: realistic 3D (blueoctopusai "First & 10", rebutonepress's black-hole story — Three.js rendering, beyond the pure-2D route); particle / fluid showpieces (no narrative).
**Promo films**: most of the site is product promos; try that genre after the explainer workflow is stable (decision-maker, 2026-10-07) — these entries will be a ready reference pool.

How to measure each reference's camera moves, transitions and pacing, and the numbers: [../design/camera-transitions.md](../design/camera-transitions.en.md).

## Priorities from this table
1. Our strength is the **Huixingzhen / Vox approach** (pure animated infographics, document collage) — working; keep refining.
2. Most worth adding: the **3Blue1Brown approach** (concept lessons) and the **Kurzgesagt approach** (scale journeys + characters): a natural fit for code, needed in both education and natural science.
3. On-camera presenters, live footage and licensed material are out of reach; **borrow their narrative structure and replace the visuals with what we can make**.

## Sources
- Bilibili's knowledge section and its categories: [36Kr](https://www.36kr.com/p/742403663274887), [PEdaily](https://news.pedaily.cn/202006/455980.shtml)
- Leading knowledge creators and the share of general-knowledge content: [Toutiao](https://www.toutiao.com/zixun/7507411167116691456/), [36Kr](https://www.36kr.com/p/1725129342977)
- Douyin knowledge trends (2025 report): [Jiemian](https://www.jiemian.com/article/7351025.html)
- Huixingzhen's and Banfo's forms: [Digitaling](https://www.digitaling.com/articles/261029.html)
- Kurzgesagt, 3Blue1Brown, TED-Ed, CGP Grey: [vidpros](https://vidpros.com/9-best-youtube-channels-for-baitu-videos-on-tough-topics)
