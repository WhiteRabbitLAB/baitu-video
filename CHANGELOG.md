# Changelog / 更新说明

## 2026-10-23

### Fixes / 修复
- **Short subtitle with no pause after it** (`engine/lib/subs.mjs`): a one-clause sentence such as "The authors wrote:" that runs straight into the next sentence came out at 0.78 s and failed the 0.83 s minimum, because the existing fix only borrows the pause *after* a cue. Such a cue now borrows from the pause before it, taken from the tail of the previous cue: it starts no earlier than 0.05 s after the previous sentence ends, and the previous cue stays at least 0.83 s. Only a failing cue and the one before it change. Checked on episode 22: only that boundary moved, from 151.318 s to 151.268 s.
  **后面没有停顿的短字幕**(`engine/lib/subs.mjs`):「作者的原话是:」这种一句话、紧接着下一句说的,字幕只有 0.78 秒,不够 0.83 秒;原来的补救只会往后借停顿。现在往前借上一条字幕尾巴里的停顿:最早到上一句说完后 0.05 秒,上一条也不许因此短于 0.83 秒。只动原本不合格的那条和它前一条;第 22 期实测只有这一处交界从 151.318 秒挪到 151.268 秒。

## 2026-10-22

### Changes / 改动
- **Bandwidth-saving footage screening** (`design/live-footage.md`, new `engine/tools/pxcache.py` + `engine/tools/pxledger.py`): screening used to sample frames from remote 4K originals with ffmpeg, which opened ~11,000 outbound connections in an hour. Now: platform preview images first (~15 KB each), each clip id fetched once and cached across episodes, 640-wide copy only when previews aren't enough, 1920 only for clips actually used, never the 4K original; at most 2 transfers, one retry, a per-batch budget counted from received bytes. `pxcache.py` is the only network exit and refuses to hand a remote URL to ffmpeg; `pxledger.py` prints an episode's totals.
  **实拍素材省流筛选**:以前的筛选让 ffmpeg 直接对远程 4K 原片抽帧,一小时约 1.1 万次外网连接。现在先看平台预览图(约 15KB 一张),同一编号只下一次、跨期缓存,预览图不够看才下 640 宽,确定采用才下 1920,不下 4K 原片;最多 2 路并发、失败重试一次、每批按实收字节记账设预算。`pxcache.py` 是唯一网络出口、拒绝把远程地址交给 ffmpeg;`pxledger.py` 出一期的总账。
- **Fetch only what the render uses** (`pxcache.prefix()`, `design/live-footage.md` items 6–7): download the 1280 rendition (720 for vertical) instead of 1920 when frames are extracted at 1280×720, and, since Pexels mp4s are fragmented, fetch only the fragments covering the seconds a shot uses (HTTP Range; incomplete tail trimmed; resumable). Measured: one clip needed 5 s → 7.5 MB instead of 27 MB (1280) / 48.8 MB (1920).
  **只下渲染用得到的**:帧按 1280×720 抽时下 1280 档(竖片 720)而不是 1920;Pexels 的 mp4 是分片格式,只按镜头用到的秒数下前面几段(HTTP Range,裁掉不完整尾段,能续传)。实测一条:要 5 秒,下 7.5MB,而整条 1280 档 27MB、1920 档 48.8MB。
- **Harbours outside the OSM coastline** (`design/live-footage.md`): OSM's coastline can cut straight across a harbour mouth, leaving the harbour as inland water; build the water from the `natural=water` relations too, or the harbour draws as land.
  **港湾不在 OSM 海岸线里**:海岸线可能在港口两个岬角之间直接横过去,港湾算内陆水体;要把 `natural=water` 关系也拼进水面,否则港湾画成陆地。

## 2026-10-21

### New / 新增
- **Wooden mannequin** (`engine/vc/mannequin.js`, from the episode 21 full video): jointed wooden figure with poses (sit-up, standing front / side, seated, run, leg press, tennis), an optional see-through fat layer whose thickness is set per body region, an effort glow and a blue "scan" mode; props racket and dumbbell. No real people, no faces.
  **木头关节人偶**(`engine/vc/mannequin.js`,第 21 期整片抽出):仰卧起坐、正面 / 侧面站、坐姿、跑步、蹬腿、网球等姿势,可选半透明脂肪层(按部位调厚薄)、发力热光、蓝色扫描透视;道具球拍、哑铃。不画真人、不画脸。

### Changes / 改动
- **Vertical-only main video** (`engine/lib/page.mjs`, render / shot / accept / check-echo): an episode that ships only vertical sets `{ "size": [1080, 1920] }` in `<brief>/page.json`; every command opens the page at that size instead of assuming 1920×1080.
  **只出竖版的正片**:每期在 `<brief>/page.json` 写 `{ "size": [1080, 1920] }`,render / shot / accept / check-echo 都按它开页面,不再写死横版 1920×1080。
- **Pronunciation respellings** (`narration.json` → `say`): pairs like `["X", "X with a space"]` change only the text sent to the voice API; subtitles and the timeline keep the script. When this changes the unit count, alignment now falls back to content matching (longest common subsequence) instead of pairing timestamps in order, which shifted everything after the respelling.
  **读法替换**(`narration.json` 的 `say`):只改送给配音接口的文字,字幕和时间轴照原稿;替换改了字数时,对齐改按内容做最长公共子序列,不再按顺序逐个对(那样替换点之后整段错位)。
- **Sentence-final short subtitle line** (`engine/lib/subs.mjs`): a last line shorter than 0.83 s borrows the pause after it, up to the start of the next sentence.
  **句尾短行**:句子最后一行不够 0.83 秒时往后借停顿,最多借到下一句开始。
- **Screen-text review before the full render** (`pipeline.md`): the review can change the narration, which re-times the whole video, so finish it before rendering.
  **画面文字复核放在整片渲染之前**:复核可能改口播,时间轴随之全变,所以先复核再渲染。
- **Live-footage pitfalls** (`design/live-footage.md`): building the sea polygon from OSM coastlines; `-v error` hides scene-cut hits (a false zero, so run a positive control first); a Commons file name is not its content (look at a contact sheet first). The English guide also gains the Pexels-redirect and vector-chart notes it was missing.
  **实拍素材的坑**:OSM 海岸线拼海面的做法;剪辑点检测加 `-v error` 会压掉命中、得到假 0(先跑阳性对照);Commons 文件名不等于内容(先拼总图看)。英文版补上之前漏译的 Pexels 跳转、矢量海图两条。

## 2026-10-16

### Fixes / 修复
- **`data-over` no longer hides things from the object check** (`engine/tools/check-objects.mjs`): `data-over` means "this graphic may sit on text", but the object check skipped such graphics entirely, so an arrow touching a number and a stamp printed past the edge of its folder both passed. Now a free-standing `data-over` graphic (arrow, line, stamp) that overlaps an object or touches text is reported — except a mark that runs across ≥ 60% of a line of text (strike-through, highlighter); text inside a `data-over` group (a stamp's words) is checked like any other text; and a stamp or label nested in an object must lie entirely on it. Marks meant to sit on a sheet (a tick on a card, strikes on a calendar) go inside that sheet's `data-obj`.
  **`data-over` 不再让东西逃过素材检查**:`data-over` 的意思是「这个图形可以压在字上」,素材检查却把它整个跳过,于是箭头擦着数字、章盖出文件夹的边都能过。现在单独摆着的 `data-over` 图形(箭头、线、印章)压到素材或碰到字都报(横穿一串字 ≥ 60% 的划掉、荧光笔除外);`data-over` 组里的字(章上的字)照常查;嵌在素材里的印章 / 标签整个要落在素材上。本来就该画在纸上的标记(卡片上的勾、日历上的划线)嵌进那张纸的 `data-obj`。
- **Thin lines can be hit**: shapes are pre-filtered by their bounding box before the exact test, but a horizontal line's box has zero height, so lines were never "hit". The box is now widened by the stroke width.
  **细线也能被测到**:精确判定前先用外框粗筛,水平线的外框高度是 0,永远「碰不到」;现在按笔画宽度放宽外框。
- **Hand review covers looks, not just correctness** (`acceptance.md`): figures drawn in code must hold together (a head attached to its body, sensible proportions) and keep clear of the paper's edge; the checks cannot judge this.
  **人眼看图要看好不好看**(`acceptance.md`):自己画的人形、示意图部件要连上、比例对、离纸边留空白 —— 检查判断不了。

## 2026-10-15

### New / 新增
- **Render stops on a missing asset** (`engine/lib/render.mjs`): an `<image>` whose file is gone does not raise an error — the page just draws an empty frame. After a footage-frame cache was deleted and a video re-rendered, every live-action shot came out as a blank card and all acceptance checks still passed. The renderer now watches failed requests and stops at the first frame that references a missing file, naming the file. Positive control: hiding one shot's frames stops the render; restoring them renders normally.
  **缺素材就停**(`engine/lib/render.mjs`):`<image>` 的文件不在时页面不报错,只画出空框。实测删了实拍抽帧缓存再渲染,整片实拍镜头全成白框,验收照样全过。现在渲染器盯着加载失败的请求,第一帧缺图就停下并报出是哪个文件。阳性对照:藏起一个镜头的帧,渲染停下;放回去正常渲染。
- **Object check** (`engine/tools/check-objects.mjs`, acceptance item 15): the text checker only ever looked at text, so a film could pass every check while a sticky note sat on two folders, a cup covered a card, a line of type ran off its paper, and numbers sat on screen seconds before the narration reached them. Pages now mark each physical thing with `data-obj` (a sheet together with what is written on it; things resting on it nest inside) and each visible element with `data-say="the words it illustrates"` or `data-scene` (set dressing that is there from the start). Every 0.1 s, outside camera moves and drops, the check reports: objects cut by the frame edge; two objects overlapping (real shapes, > 100 px²); text running off its own sheet, or loose text straddling a sheet's edge; anything visible more than 0.3 s before the narration says its words, or visible with no `data-say` / `data-scene` at all; and any page `console.warn`. Positive control: a deliberately broken copy (sticky on folders, text off a card, a line shown early, text across a sheet edge, a bad anchor) must trip all five.
  **素材检查**(`engine/tools/check-objects.mjs`,验收第 15 项):原来的检查只看字,便签压着文件夹、杯子压着卡片、字跑出纸边、数字比配音早几秒摆在画面上,都能全部通过。现在页面给每件东西标 `data-obj`(一张纸连同纸上的字;放在上面的东西嵌在里面),给看得见的元素标 `data-say="它讲的那几个字"` 或 `data-scene`(开场就在的布景)。逐 0.1 秒扫(镜头移动、东西落下时跳过):素材出画;两件素材互压(按真形状,> 100 平方像素);字出了自己那张纸、或不属于任何纸的字骑在纸边上;第一次看得见比配音念到早 0.3 秒以上,或者既没挂台词也没标布景;页面 `console.warn`。阳性对照:一份故意改坏的副本(便签压文件夹、字出纸边、提前出现、字骑纸边、错锚点)五类都必须报出来。

### Fixes / 修复
- **Timing anchors can span a comma**: pages find "when is this said" by searching the timeline, but the search ran clause by clause, so a phrase like 「第一，尽量」 that crosses a comma was never found — the page fell back to "never", and four advice notes in episode 17 never appeared. Search the whole sentence, then interpolate inside the clause where the phrase starts; `check-objects` turns the page's "anchor not found" warning into a failure.
  **定时锚点可以跨逗号**:页面按「念到哪几个字」定时,原来逐个分句找,「第一，尽量」这种跨逗号的片段永远找不到,页面退回「永不出现」——第 17 期四张建议便签整片没出来。改为在整句里找、再落到片段起点所在的分句里插值;`check-objects` 把页面的「AT 没找到」警告算作不合格。
- **Closing quotes no longer start the next sentence** (`engine/lib/script.mjs`): a line like 「……不瘦？」 used to split after the question mark, so the closing 」 opened the next subtitle. Closing quotes and brackets right after a sentence end now stay with that sentence. Audio is unaffected (each paragraph is synthesised in one call); re-run `narrate` (cached) and `subs` to refresh the timeline and subtitles.
  **右引号不再落到下一句开头**(`engine/lib/script.mjs`):「……不瘦？」原先在问号处切开,右引号「」」成了下一条字幕的开头;现在句末标点后紧跟的右引号 / 右括号归上一句。配音不受影响(每段一次合成);重跑 `narrate`(走缓存)和 `subs` 即可刷新时间轴与字幕。

## 2026-10-14

### New / 新增
- **Archive backdrop** (`design/live-footage.md`): the opposite of full-screen footage — the light-pen animation leads, and archive photos and clips sit behind it as a darkened, desaturated, cooled layer that fades in only at key moments. Each photo "develops" inside a frame the pen has just drawn; an ARCHIVE tag at the top names the source and licence, and says plainly when the footage is not of the event itself or when a demo is built from a surviving print. Includes the text-checker grouping fix (wrap each HUD text in its own group), mixing a public-domain recording into the narration track, and a louder music bed for an "epic" feel.
  **档案背景叠法**(`design/live-footage.md`):和实拍满屏相反——光笔动画为主,历史照片与实拍片段压暗、去色、偏冷当背景,只在关键时刻浮现。每张照片在光笔刚画好的框里「显影」;顶部 ARCHIVE 标签写来源和许可,不是当次事件的影像、用现存照片做的原理演示都要明说。另含:检查工具的分组坑(HUD 每块字各包一层)、把公版录音叠进配音轨、要「燃」时配乐响一些。
- **Per-gap pauses in narration** (`engine/lib/narrate.mjs`): `narration.json` can now set `gapAfter` (`{ "15": 17 }` = a 17-second pause after paragraph 15, e.g. to leave room for an archive recording) and `voice` (override the profile's voice settings for one video, such as speed).
  **配音逐段停顿**(`engine/lib/narrate.mjs`):`narration.json` 可写 `gapAfter`(`{ "15": 17 }` = 第 15 段后停 17 秒,给原声留位置)和 `voice`(本期覆盖频道配音参数,如语速)。
- **Enamel home style** (18th, `styles/enamel.md`): the family dinner table — white enamel mugs chipped to the blue iron, a red thermos, a green-painted dado, a checked tablecloth; numbers hang on enamel signs. Used for a full video. English card, thumbnail and the side-by-side grid now include it; the demo font subset adds its title font (ZCOOL QingKe HuangYou). Its stamp (R9) now defaults to enamel red — the old cream default made the shared stamp nearly invisible on the cream background.
  **搪瓷暖水瓶画风**(第 18 种,`styles/enamel.md`):爸妈家的饭桌——磕瓷露蓝的白搪瓷缸、红壳暖水瓶、绿漆墙围、格子桌布,数字挂在搪瓷标牌上;已用于一部整片。补了英文卡、缩略图和并排总图;演示字体子集加了它的标题字(站酷庆科黄油体)。印章(R9)默认改成搪瓷红——原先默认奶白,共享印章在奶白底上几乎看不见。

## 2026-10-13

### New / 新增
- **Light pen** (`kit.lightpen`): one glowing pen draws the whole piece in a single line — an outline turns into a diagram, the diagram's line turns into a chart's curve, and the camera follows the tip. Segments are joined along their tangents; the tip has a white core, a halo and a horizontal lens streak; line width and glow stay constant on screen at any zoom. Comes with a parallax starfield (`pen.stars`). New filter `vc-bloom-l` (wide, faint glow). A 37-second sample is built with the Starlight style.
  **光笔**(`kit.lightpen`):一支发光的笔一笔画到底——线稿变成示意图,示意图的线再拉成曲线,镜头跟着笔头走。段与段顺着切线自动接上;笔头是白芯 + 光晕 + 横向镜头光;镜头推拉时线宽、辉光在画面上不变。配一层随镜头视差移动的星空(`pen.stars`)。新滤镜 `vc-bloom-l`(大范围的淡辉光)。用星夜光点画风出了一段 37 秒样片。

### Changes / 改动
- **Transit map used for a full video** (an information-theory primer, about 4¾ minutes): one yes/no question = one fork, "yes" on the orange line and "no" on the blue; a binary line network, a number-line route, stations crossed out one by one, a terminus pin, a question route. The style card lists the page-level parts.
  **地铁线路图用于一部整片**(信息论入门,约 4 分 46 秒):一道是非题 = 一个岔口,「是」走橙线、「不是」走蓝线;二叉线路网、数轴线路、逐站打叉、终点定位针、问答线路。画风卡列了页面自写的部件。
- **Transit type is larger**, same lesson as newsprint: role defaults raised (notes R3 28 → 42 in black, captions R10 22 → 30, R2 52 → 60, R1 88 → 104), the `legend` heading 26 → 38.
  **地铁线路图字号调大**,与报纸号外同一个教训:角色默认字号提高(说明 R3 28 → 42 且改黑字、出处 R10 22 → 30、R2 52 → 60、R1 88 → 104),`legend` 图例牌栏题 26 → 38。

### Fixes / 修复
- The transit backdrop's faint ghost network now carries `data-over`, so `check-text-bounds --objects` no longer reports text sitting on background texture (50 false hits in one video). Lines a page draws itself are still checked.
  地铁图底子那层很淡的「整张网」加了 `data-over`,`check-text-bounds --objects` 不再把压在底纹上的字报成「字压素材」(一部片子里误报了 50 处);页面自己画的线路照样查。

## 2026-10-12

### New / 新增
- **Three new styles** (15th–17th), picked by the decision-maker from six cross-topic stills (transit map, blueprint, newsprint, 8-bit, assembly manual, shadow puppets; not tied to one channel). Each has a style card, three sample frames and a thumbnail. 8-bit pixel and newsprint have each been used for a full video (12 minutes and 7½ minutes); the README shows two frames from each. Transit map has samples only.
  **三种新画风**(第 15–17 种),决策者从六张跨题材静帧(地铁线路图、工程蓝图、报纸号外、8-bit、装配说明书、皮影;不专属某个频道)里选出。各有画风卡、三张样张、缩略图。8-bit 像素、报纸号外各已用于一部整片(12 分钟、7 分 30 秒),README 各配两帧截图;地铁线路图只有样张。
  - **8-bit pixel** (`pixel`): pixel art on a 4px grid, banded sky with checkerboard dithering (`backdrop: 'pixel'`, one `vc-dither-<i>` per band), Fusion Pixel for every role (sizes snap to 12), RPG dialogue box and window (`rpg`, stepped pop-in, blinking ▼), corner-bracket mark `pixbox`, stepped yellow badge `pixbadge`, a `blink` entrance, and a mascot rasterised on an 8px grid. The metaphor is "a level".
    **8-bit 像素**(`pixel`):4px 一格的像素画、分带天空 + 棋盘抖动(底子 `pixel`,每条带一个 `vc-dither-<i>`)、全部角色用缝合像素字(字号吸附 12)、RPG 对话框与窗口(`rpg`,分步弹出、▼ 闪)、四角括号批注 `pixbox`、台阶切角黄牌印章 `pixbadge`、出场方式 `blink`、按 8px 栅格化的吉祥物。比喻是「一关」。
  - **Newsprint** (`newsprint`): newsprint backdrop with fold crease (`backdrop: 'newsprint'`), serif headlines, wire copy typed in Special Elite, proofreader's red pen and reader's ballpoint, pull-quote bubble `quote`, column frame `column` (thick + thin rules), a 45° halftone pattern `vc-ht-news` and a halftone mascot. The metaphor is "the headline back then".
    **报纸号外**(`newsprint`):新闻纸底子 + 折痕(`newsprint`)、宋体大标题、电讯原文用 Special Elite 逐字打出、校对红笔与读者圆珠笔、引语气泡 `quote`、专栏外框 `column`(一粗一细两道线)、45° 网点图案 `vc-ht-news` 与网点吉祥物。比喻是「当年的头条」。
  - **Transit map** (`transit`): off-white with a faint ghost network that always keeps true 45° (`backdrop: 'transit'`, reference coordinates scaled uniformly), the signature `route` mark (a stretch of line drawn under the text, stations at both ends), black station-sign bubbles, a legend-box frame `legend`, line-coloured capsule stamps. The metaphor is "a journey with changes".
    **地铁线路图**(`transit`):米白底 + 很淡的整张网(底子 `transit`,按参考坐标等比缩放,斜线永远 45°)、签名部件批注 `route`(字底下画一段线路,两头是站)、黑底站牌气泡、图例牌外框 `legend`、线路色胶囊印章。比喻是「一路换乘」。
- **Newsprint type is much larger** after the decision-maker watched the full video ("a lot of the text is too small"): role defaults raised (notes R3 28 → 42 and black instead of grey, captions R10 22 → 30, red pencil R6 44 → 64, headlines R1 96 → 110, numbers R4 120 → 150), and the `column` frame's heading 34 → 46. The style card lists the minimums; real-newspaper density does not work on screen.
  **报纸号外字号整体调大**(决策者看完整片:「很多字太小」):角色默认字号提高(说明 R3 28 → 42 且改黑墨不用灰、图注 R10 22 → 30、红笔 R6 44 → 64、标题 R1 96 → 110、数字 R4 120 → 150),`column` 专栏栏题 34 → 46。画风卡写了下限:照真报纸的密度排,在视频里不成立。
- Newsprint style card pitfalls from the full video: draw the halftone source with contrast first, no rolling counter (strike the old value instead), small stamp rotation, chart bars to scale or labelled as illustrative.
  报纸号外画风卡补了整片踩的坑:网点照片先把对比度画够、数字不用滚动计数器(旧值红笔划掉)、印章转角别大、图表条要么按比例要么标示意。
- The existing 14 thumbnails re-render byte-identical after these engine additions.
  加完这些引擎改动后,原有 14 张缩略图重出逐字节相同。

## 2026-10-11

### New / 新增
- **Sports broadcast style** (`broadcast`, 14th style): a night stadium (crowd dots in the top half, small floodlight points, vignette) with TV broadcast graphics; one color per team, yellow only for graphics, Anton for scores. New `wipe` entrance (a mask reveals text from the left while it slides 24px into place) and `stadium` backdrop. The metaphor is "a match"; a non-significant result is never written as "a draw". Three sample frames and a thumbnail. Used for a full video.
  **体育转播画风**(`broadcast`,第 14 种):夜场看台(上半屏人群色点、顶边泛光灯小亮点、暗角)+ 电视包装条;两队各一色,黄只给包装,比分用 Anton。新出场方式 `wipe`(遮罩从左擦出、同时右滑 24px 落定)和底子 `stadium`。比喻是「比赛」,不显著不写成「打平」。三张样张、缩略图。已用于一部整片。
- **Broadcast parts module** `engine/vc/broadcast.js` (`VC.broadcast(kit)`): grass, pitch-side LED board, clock tab, referee bar, info strip, numbered steps, scoreboard, small scoreboard, italic team names, fixture row (crossed out in red), selection funnel, other-fixtures row, advice row, people dot grid. Sound-cue and on-screen-text hooks. Pulled out of the broadcast full video; that video's page now uses it (617 frames and both covers pixel-identical, sound cues unchanged). Works in other styles.
  **转播部件模块** `engine/vc/broadcast.js`(`VC.broadcast(kit)`):草皮、场边 LED 板、时间标签、裁判条、信息条、编号步骤条、比分板、小比分板、斜体队名、对阵行(红线划掉)、选拔漏斗、其他赛区结果行、建议行、人点阵;带音效登记和画面字收集的钩子。从体育转播整片里抽出;那部片子的页面已改用它(617 帧与两张封面逐像素相同,音效登记不变)。别的画风也能用。
- **Live-action footage in the picture** `design/live-footage.md`: existing public-domain / licensed footage (agency video libraries, Wikimedia Commons, Pexels) wired into the same page as the animation, sharing layers, transitions, subtitles and the chapter bar — which licenses to accept, sampling frames remotely before downloading, a shot table shared by the page and the extraction script, per-frame `<image>` references, inlining scene scripts before `fonts`, picking music by loudness curve when the computer must stay silent. Pitfalls: copyrighted inserts hidden behind dissolves, burned-in watermarks, camera positions the destination bans, one camera position per shot. Used for two full videos (13 and 12 minutes). SKILL / catalog capability boundary updated.
  **实拍素材进画面** `design/live-footage.md`:现成的公版 / 可商用实拍(政府机构视频库、Wikimedia Commons、Pexels)接进同一个页面,和动画共用叠层、转场、字幕、章节进度条——收哪些许可、先远程抽帧再下载、页面与抽帧脚本共用的镜头表、逐帧 `<image>` 引用、跑 `fonts` 前先把场景脚本内联、制作中不能出声时按响度曲线挑配乐。坑:藏在叠化里的有版权插画面、烧进画面的水印、目的地禁止的机位、一个镜头只用一个机位。已用于两部整片(13 分钟、12 分钟)。SKILL / catalog 能力边界同步更新。
- `mix`: background-music gain can be set per episode in `<brief>/bgm.json` (`{ "gainDb": -12 }`; default stays -24 dB) for quiet music beds.
  `mix`:背景乐增益可在 `<brief>/bgm.json` 里按期设置(`{ "gainDb": -12 }`,默认仍是 -24 dB),给本身较轻的配乐用。

### Fixes / 修复
- **`VC.ready` font probe no longer misfires**: the probe string now keeps only letters, digits and CJK characters. A leading line break (SVG drops it, canvas measures a space) flagged all 12 fonts as not drawn, and an em dash (full-width in SVG on a Chinese page, proportional in canvas) flagged Noto Serif SC.
  **`VC.ready` 字体探针不再误报**:探针串只留字母、数字、汉字。排在最前的换行(SVG 吞掉、canvas 按空格量)曾让 12 个字体全被判没画上;破折号「—」(中文页里 SVG 按全角排、canvas 按比例宽)曾让思源宋体被误判。

## 2026-10-10

### New / 新增
- **Starlight style** (`starlight`, 13th style): a near-black night sky with fixed-seed stars, glowing line art (`kit.glow`: two bloom layers + optional white core, draws on with a bright point at the tip), points of light (`kit.orb`) and drifting dust (`kit.particles`); cool blue for structure, warm gold only for the answer. Light sans type with a neon glow (`neon: true`), a `glow` entrance (blur → sharp, dark → bright). Three sample frames, a thumbnail, and frames from a 41-second sample in the README.
  **星夜光点画风**(`starlight`,第 13 种):近黑星空 + 固定种子星点,会发光的线稿(`kit.glow`:两层辉光 + 可选白芯,画的时候笔尖带一颗亮点)、光点(`kit.orb`)、飘尘(`kit.particles`);冷蓝画结构,暖金只给答案。细黑体 + 霓虹辉光(`neon: true`),出场方式 `glow`(由虚到实、由暗到亮)。三张样张、缩略图,README 配了 41 秒样片的截图。
- **Audience-participation components** (any style): `kit.choice` (two or more options, the picked one lights up on reveal), `kit.countdown` (a thin ring for the pause after a question), `kit.numberLine` (a point glides to the answer; only real values are shown), `kit.blank` (fill in the blank), `kit.scramble` (scrambled characters slide back into place), `kit.mask` (covered characters, revealed one by one). Demo page `engine/vc/quiz.html`.
  **「观众动手」组件**(任何画风都能用):二选一 `kit.choice`(揭晓时选中项亮起)、倒数 `kit.countdown`(问完问题、配音停顿时放)、数轴猜数 `kit.numberLine`(光点滑到答案,只出现真实值)、填空 `kit.blank`、乱序字 `kit.scramble`(打乱的字滑回原位)、遮挡 `kit.mask`(盖住的字逐个揭开)。演示页 `engine/vc/quiz.html`。
- **Thermal receipt style** (`thermal`, 12th style): off-white thermal paper strips, bitmap text printed line by line (the `print` entrance scans each line top to bottom like a print head), black + red only — the metaphor is a bill. Receipt panels (curl shadow, torn zigzag edge, centered title + dashed rule), a checkout-counter backdrop, an ink-mottle filter on text only (never the paper). Bitmap sizes snap to multiples of 12 (`pixel: 12`); `fit` shrinks one 12px step at a time. Three sample frames, a thumbnail, and frames from a full video in the README. Used for a full video.
  **热敏小票画风**(`thermal`,第 12 种):米白热敏纸条、点阵字逐行打出(`print` 出场像打印头一样从上往下扫)、只用黑和红,比喻是「账」。小票面板(卷边阴影、撕口锯齿、居中标题 + 虚线)、收银台面底子、只给字的墨迹斑驳(纸面不进滤镜)。点阵字号自动吸附 12 的倍数,`fit` 一档 12px 往下缩。三张样张、缩略图,README 配了整片截图。已做过一部整片。
- Font: **Fusion Pixel 12** (OFL) registered in `fonts.json`.
  字体:`fonts.json` 登记缝合像素 Fusion Pixel 12(OFL)。
- **Receipt parts module** `engine/vc/receipt.js` (`VC.receipt(kit)`): a receipt that grows line by line as it prints, printer slot, 19 one-bit pixel icons, barcode, dot-matrix curve / scatter / halftone bar, and a paper-feed transition (vertical push that never sweeps the subtitle band). Pulled out of the thermal full video; that video's page now uses it (frames byte-identical outside the transitions; the transition's backdrop is now clipped to the new frame, so the old frame no longer vanishes under it). Works in other styles with a plain paper strip.
  **小票部件模块** `engine/vc/receipt.js`(`VC.receipt(kit)`):边打边长的小票、出纸口、19 个 1 位像素图标、条码、点阵曲线 / 散点 / 网点条、走纸转场(竖推,不扫过字幕带)。从热敏小票整片里抽出;那部片子的页面已改用它(转场以外的帧逐字节相同;走纸转场的台面改为只铺新画面那一屏,旧画面不再被它盖掉)。别的画风也能用(纯色纸条)。

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
