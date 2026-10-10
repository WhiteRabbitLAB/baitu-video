# Changelog / 更新说明

## 2026-10-10

### New / 新增
- **Thermal receipt style** (`thermal`, 12th style): off-white thermal paper strips, bitmap text printed line by line (the `print` entrance scans each line top to bottom like a print head), black + red only — the metaphor is a bill. Receipt panels (curl shadow, torn zigzag edge, centered title + dashed rule), a checkout-counter backdrop, an ink-mottle filter on text only (never the paper). Bitmap sizes snap to multiples of 12 (`pixel: 12`); `fit` shrinks one 12px step at a time. Three sample frames, a thumbnail, and frames from a full video in the README. Used for a full video.
  **热敏小票画风**(`thermal`,第 12 种):米白热敏纸条、点阵字逐行打出(`print` 出场像打印头一样从上往下扫)、只用黑和红,比喻是「账」。小票面板(卷边阴影、撕口锯齿、居中标题 + 虚线)、收银台面底子、只给字的墨迹斑驳(纸面不进滤镜)。点阵字号自动吸附 12 的倍数,`fit` 一档 12px 往下缩。三张样张、缩略图,README 配了整片截图。已做过一部整片。
- Font: **Fusion Pixel 12** (OFL) registered in `fonts.json`.
  字体:`fonts.json` 登记缝合像素 Fusion Pixel 12(OFL)。

### Fixes / 修复
- **Font family names are now quoted** in every SVG `font-family`. Unquoted, a family name with a word starting with a digit (`Fusion Pixel 12`, `Jason Handwriting 1`) makes the whole declaration invalid and the browser silently falls back to a default sans — so the chalkboard and whiteboard styles never actually showed their handwriting font since they were added. Their sample frames and thumbnails are re-rendered.
  **SVG 的 font-family 族名统一加引号**:族名里有以数字开头的词时,不加引号整条作废、浏览器静默换默认黑体——黑板粉笔、白板手绘从入库起手写字体就没生效。样张与缩略图已重出。
- **`VC.ready` now checks the font is really drawn**: it compares the width the SVG actually draws with the width the font should give; a mismatch over 2% counts the font as not loaded and the renderer refuses to start. (Loaded ≠ used: the counter used to stay green through the bug above.)
  **`VC.ready` 现在核对字体真画上了**:比较 SVG 实际画出的宽度和这个字体应有的宽度,差 2% 以上记为没加载,渲染器拒绝开工(「加载到」不等于「画面用上了」,上面那个 bug 期间计数一直是绿的)。

### Tools / 工具
- `check-echo --all` lists every second where on-screen text repeats the subtitle (default still shows the first 8) — handy while rewriting labels.
  `check-echo --all` 列出全部「画面抄字幕」的秒(默认仍只列前 8 条),整改时用。
- README: style count, scene count (deep-sea section) and acceptance count (14) brought up to date.
  README:画风数、场景数(补上深海剖面)、验收项数(14)改成最新。

## 2026-10-09

### New / 新增
- **Risograph style** (`risograph`, 11th style): two overprinted inks (blue + fluorescent pink), halftone, grain, print margins — pink is reserved for the one thing to watch. New components `kit.ink` / `kit.tone`, a `roller` transition (the print drum sweeps across: new frame on the left of the edge, old on the right), riso panels / bubbles / mascot, three sample frames and an updated thumbnail wall. Used for a full video.
  **孔版印刷画风**(`risograph`,第 11 种):蓝 + 荧光粉两版叠印、网点、颗粒、印刷白边,粉色只给「要警惕的那一样」。新组件 `kit.ink` / `kit.tone`、`roller` 滚筒转场(前沿左边新画面、右边旧画面)、孔版面板 / 气泡 / 吉祥物,三张样张,缩略图墙重出。已做过一部整片。
- **Deep-sea section scene** (`deep-sea-section`): a vertical seawater section with a depth ruler; the camera dives with the narration and each creature sits at its real depth. Motion library adds bioaccumulation particles, tear-off labels and flip-the-pack.
  **深海剖面场景**:竖向海水剖面 + 深度尺,镜头随讲解下潜,每种生物在真实深度。动效库加生物富集粒子、撕标签、翻包装。
- **Which model and effort to use** — README section from 45 cold-start runs (Haiku / Sonnet / Opus 5.5 × five effort levels × three tasks; every run produced a video). Default: **Opus 5.5 · high**; budget: Sonnet 5.5 · high or Opus 5.5 · medium; best: Opus 5.5 · xhigh. `max` and Haiku aren't worth it.
  **用哪个模型、哪一档**:README 新增一节,来自 45 次冷启动实测(三个模型 × 五档思考 × 三个任务,全部出片)。首选 Opus 5.5 · high;省钱用 Sonnet 5.5 · high 或 Opus 5.5 · medium;要最好用 Opus 5.5 · xhigh;max 和 Haiku 不划算。
- Fonts: Long Cang and Zhuque Fangsong (both OFL) registered in `fonts.json` — the case-file scene asked for them but they couldn't be downloaded before; Cormorant Italic for Latin species names.
  字体:`fonts.json` 登记龙藏体、朱雀仿宋(OFL)——档案场景要用,之前下载不到;拉丁学名用 Cormorant 斜体。

### Acceptance / 验收
- **Skipped words (8)**: Chinese is now compared by pinyin, so homophones count as heard (麦加 / 卖家), and numerals count as one class, a run of digits as one number, never across clauses (1747 / 一七四七, 100000 / 十万). In the 45 test videos, 13 failed "skipped words", and nearly all of them were these two kinds of misrecognition; a planted unspoken sentence is still caught. Uses pypinyin (fetched on the fly with uv if missing; falls back to characters and says so).
  **漏读(第 8 项)**:中文按拼音比,同音字算对上;数字算一类、连续数字算一个数且不跨分句。45 条测试片里 13 条漏读不过几乎全是这两类误报;插一句没念过的话仍能报出来。拼音用 pypinyin(没有就 uv 临时装,都没有退回按字比并写明)。
- **Onset (9)**: onset needs ≥ 0.1 s of silence first; the previous paragraph's tail no longer reads as a fixed 0.5 s error.
  **出声(第 9 项)**:先有 ≥0.1 秒静音再响才算出声,不再把上一段的尾音报成固定 0.5 秒。
- **Main-film scan (10)**: when a page declares `window.CHECK`, every 0.1 s of the video is checked for text out of frame, text on text, and text colliding with drawn objects (by real shape, clipping included); `--frame` handles print-margin layouts.
  **正片逐帧扫(第 10 项)**:页面声明 `window.CHECK` 时,逐 0.1 秒查出画、字压字、字和素材互压(按真实形状,算裁剪);`--frame` 支持印刷白边版面。
- **New items / 新增三项**:
  - 12 **Frame fill** (`check-fill`, LOOK): how much of the frame holds something; thresholds calibrated on the 45 videos. 画面占比,提醒画面太空。
  - 13 **Subtitles repeated on screen** (`check-echo`, LOOK): on-screen text copying the narrated sentence (≥ 10 Chinese characters / 7 English words); BROKEN if the subtitle band can't be read. 画面原样抄字幕时提醒;读不到字幕判探针失效。
  - 14 **Fact sheet** (FAIL / LOOK): `<brief>/facts.md` must exist and every row except "cut" needs a source; "unverified" rows are flagged so you confirm none made it into the script. Location configurable with `paths.facts`; `new` creates the template. 事实表必须有、每条有出处;有「待核」提醒逐条确认没进稿;位置可用 `paths.facts` 改,`new` 会建模板。

### Docs / 文档
- Principles: **composition** (one subject per shot, 60–80% of the usable frame) and **don't repeat the subtitles on screen**; the fact sheet is a hard rule. 原则加「构图」「画面不复述字幕」,事实表是硬规矩。
- Pipeline / SKILL: fact-sheet format; read the component table and demo page instead of the `vc.js` source. 流程写明事实表格式;写页面先看组件表和演示页。
- edge-tts: with uv installed the engine runs `uvx edge-tts` itself — don't install it globally (that also installs `edge-playback`, which plays sound); `doctor` shows which command it will use. edge-tts 装了 uv 就不用另装,别全局装;`doctor` 会显示实际用哪条命令。
- **Requirements** section in the README (zh / en): what to install, required vs optional, macOS commands, and where to get the whisper model; Linux / Windows stated as untested. README 加「环境依赖」一节:必须 / 可选、macOS 装法、whisper 模型去哪下;Linux、Windows 如实写未实测。
- `doctor` now checks **python3** (the subtitle-duration check needs it) and numpy (optional); a missing whisper model prints the download command. The model is looked up in `WHISPER_MODEL` (environment or `.env`), then `cache/whisper/ggml-medium.bin` in the project. `doctor` 新查 python3(字幕时长验收要用)与 numpy(可选);缺 whisper 模型时直接给下载命令;模型按 `WHISPER_MODEL`(环境变量或 `.env`)→ 项目 `cache/whisper/ggml-medium.bin` 的顺序找。
- `doctor`: a channel profile missing only some of its three files now names the missing file instead of saying the whole profile can't be found. 频道配置只缺其中一两个文件时,`doctor` 直接说缺哪个,不再报「找不到频道配置」。

### Fixes / 修复
- `shot` and `vertical` no longer hang when the page throws: the browser (and ffmpeg) are closed on error. `shot` / `vertical` 页面报错时关掉浏览器(和 ffmpeg),不再挂住不退出。
- `fonts.json`: ZCOOL QingKe HuangYou and Abril Fatface registered (listed in the design library for the dashboard scene but missing from the download table). `fonts.json` 补登站酷庆科黄油体、Abril Fatface(设计库早有,下载表漏登)。
- Kinetic-type style: the highlight block no longer covers the previous character. 动态文字画风的强调色块不再压到前一个字。
- Fact sheets no longer count toward the font subset (they never appear on screen). 事实表不再算进字体子集用字。
