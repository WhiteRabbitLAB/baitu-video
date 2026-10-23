# 共享组件(VC)

所有频道共用的画面组件。组件只认「文字角色」R1–R10,字体、颜色、承载物、出场方式全由画风提供。

| 文件 | 管什么 |
|---|---|
| `vc.js` | 组件(纯函数,返回 SVG 字符串,1920×1080 坐标,逐帧可复现) |
| `styles.js` | 画风外观表:纸面拟物 `paper-skeuo`、游戏拟物 `game-ui`、扁平几何 `flat-geometric`、扁平插画 `flat-illustration`、卡通界面 `cartoon-ui`、科技深色 `tech-ui`、白板手绘 `whiteboard`、黑底数学 `dark-math`、黑板粉笔 `chalkboard`、动态文字 `kinetic`、孔版印刷 `risograph`、热敏小票 `thermal`、星夜光点 `starlight`、体育转播 `broadcast`、8-bit 像素 `pixel`、报纸号外 `newsprint`、地铁线路图 `transit`(共 17 种,缩略图见 ../../styles/INDEX.md) |
| `demo.html` | 演示页:每个组件一行,可切换画风、中英文、时间轴 |
| `receipt.js` | 小票部件:热敏小票画风的附加模块(第 13 期整片抽出),`const rc = VC.receipt(kit, {onPrint, onFeed})`;组件见下表「小票」三行 |
| `broadcast.js` | 转播部件:体育转播画风的附加模块(第 14 期整片抽出),`const bc = VC.broadcast(kit, {onCue, onText, ledY})`;组件见下表「转播」三行 |
| `mannequin.js` | 木头关节人偶(第 21 期整片抽出):`const M = VC.mannequin`;姿势 `situp` / `standSide` / `standFront` / `seated` / `run` / `legPress` / `tennis`,画 `M.figure(J, {s, fat, heat, scan})`(脂肪层厚薄按部位、发力热光、扫描透视);道具 `racket` / `dumbbell`;每帧 `M.begin()`,`<defs>` 里放 `M.DEFS`。不画真人、不画脸,脂肪层只是示意 |
| `quiz.html` | 「观众动手」组件一屏六格(二选一 + 倒数、数轴猜数、填空、乱序字、遮挡、光点):`?style=<id>&t=秒`(默认 99 = 全部揭晓;`t=2.2` 看揭晓前) |
| `thumbs.html` / `thumbs.mjs` | 画风缩略图:同一场景只换画风;`node engine/vc/thumbs.mjs` → `.claude/skills/baitu-video/styles/thumbs/` |
| `transitions.html` / `measure-tx.mjs` | 转场演示(morph、zoom-through、slide-push、blur-push)与量转场(带线性淡化阳性对照):`node engine/vc/measure-tx.mjs paper-skeuo` |
| 字体 | `fonts.css` + `fonts/`:引擎自带的子集字体(画风表用到的全部字体,按演示页的字切);重切:`node <engine>/cli.mjs fonts-demo`。每期正片用 `fonts <期>` |
| `scene-gallery.html` / `scene-gallery.mjs` | 场景示范图:11 个场景各一帧,同一个中性题目;`node engine/vc/scene-gallery.mjs zh`(或 `en`)→ skill 的 `scenes/demo/`(场景卡顶部用的是成片截图 `scenes/thumbs/`,这里不覆盖它)|
| `shot.mjs` | 演示页截图:`node engine/vc/shot.mjs <目录> paper-skeuo,zh,7.5 tech-ui,en,2.4` |

## 在新一期里用
**最快:`node .claude/skills/baitu-video/engine/cli.mjs new <期> --style <画风>`**,生成的起步页面路径都算好了(模板 [../templates/page.html](../templates/page.html))。写镜头时照 [demo.html](demo.html) 抄——每个组件在不同画风里怎么用都在那里。
手写的话,页面在默认位置 `video/<期>.html` 时:
```html
<script src="../.claude/skills/baitu-video/engine/vc/vc.js"></script>
<script src="../.claude/skills/baitu-video/engine/vc/styles.js"></script>
<script>
const kit = VC.kit('paper-skeuo');
window.fontsReady = VC.ready(kit, [本期画面上的全部文字], ['Noto Sans SC:900']);   // 第三个参数:画风表以外还要用的字体(如字幕)。返回「族:字重 → 数量」,0 = 没加载上,渲染器会拒绝开工
function render(t) {
  kit.begin();   // 每帧开头:重置 clipPath 编号
  …
}
</script>
```
本期字体:`node <engine>/cli.mjs fonts <期>` 按页面用到的画风和真出现的字切好,页面里 `<link rel="stylesheet" href="fonts-<期>.css">`。

## 组件
| 组件 | 调用 | 角色 | 画风决定什么 |
|---|---|---|---|
| 每帧底子 | `kit.begin()`(每帧第一句);`<defs>${kit.defs()}</defs>`;`kit.backdrop(x, y, w, h)` | — | 纸纹 / 黑板 / 白板 / 深色底等,滤镜与渐变都在 defs 里 |
| 字幕 | `kit.subtitle(t, SUBS, {font,size,y,fill,stroke,strokeWidth,box,maxW})` | 频道统一 | 不随画风;规格写在频道配置;超过 maxW(竖版传 960)自动折两行 |
| 段首横移 | `kit.panGroup(t, [第 2 段起点, …], [镜头1, 镜头2, …])`,每个镜头是 `t => SVG` | — | 不随画风 |
| 一笔笔画出来 | `kit.sketch(路径 d 或数组, t, t0, 时长, {color,width,pen})`;手抖线 `VC.wobblyLine(x1,y1,x2,y2,种子,幅度)`、`VC.wobblyEllipse(cx,cy,rx,ry,种子,幅度,收尾)` | — | 白板 / 黑板的线稿;`pen:true` 画笔跟着笔尖 |
| 排线(暗面) | `kit.hatch(x, y, w, h, t, t0, 时长, {clip,color,gap,width,opacity})` | — | 白板 / 黑板 |
| 占位角色 | `kit.mascot(x, 脚底 y, t, t0)` | — | 圆身子 + 头顶小芽,画法跟画风走;换成你自己的吉祥物 |
| 角色文字(手写 / 打字机 / 淡入 / 弹出) | `kit.text(role, s, x, y, t, t0, {anchor,size,fill})` | 任一 R | 出场方式:纸面 R8 手写、科技 R8 等宽逐字打出(没有手写层) |
| 放得下的文字(自动缩字号 + 折行) | `kit.textFit(role, s, x, y, maxW, t, t0, {maxLines,min,size,lh,balance})`;只要结果用 `kit.fit(role, s, maxW, 同参数)` → `{size, lines, ok, lh}` | 任一 R | 同 `text` |
| 批注 | `kit.mark(x, y, w, h, t, t0)` | R6 | 红铅笔圈(正片叠底)/ 辉光下划线 / 荧光笔(先画再写字) |
| 印章 | `kit.stamp(lines, cx, cy, t, t0, {rot,color})` | R9 | 油墨斑驳 + 落下震动 / 状态胶囊 / 粗描边贴纸 |
| 数字 | `kit.counter([[t,v],…], x, y, t, {fmt,unit})` | R4 | 印刷 + 红线 / 辉光 / 粗描边 + 跳一下 |
| 气泡 | `kit.bubble(s, x, y, t, t0, {side,t1,maxW})` | R7 | 纸条胶带 / 圆角卡片 / 粗描边气泡 |
| AI 对话框 | `kit.chat(x, y, w, h, [{who,text,t0}], t, {title})` | R7 | 窗口外框与气泡配色 |
| 终端窗口 | `kit.terminal(x, y, w, h, [{cmd,t0}/{out,t0}], t)` | 命令与输出 | 机壳屏 / 深色窗口 / 粗描边窗口 |
| 章节进度条 | `kit.chapterBar(t, [{name,start,end}])` | 频道统一 | 只取强调色 |
| 段首横移 | `VC.pan(t, starts)` / `kit.panGroup(t, starts, [fn])` | — | 不随画风;默认 1.2s + 运动模糊 |
| 转场 | `kit.transition(id, t, t0, A, B, 参数)`;id = `roller`(滚筒刮过:前沿左边新、右边旧,`{band,x0,x1}`)/ `slide-push` / `blur-push` / `zoom-through`(`{cx,cy,r0}`)/ `morph`(`{from,to}` 路径 + 颜色)/ `fade` | — | slide-push 的领路竖条取强调色;zoom-through 的开口底子取画风底 |
| 油墨分版(孔版印刷) | `kit.ink('b'\|'p', 内容, {grain:'strong'\|'light'\|'none'})`;网点填充 `kit.tone('b', 0–1)`;页面 `<defs>${kit.defs({frame})}</defs>`(颗粒按帧号换位) | — | 只在 `riso` 画风里有网点与颗粒;其他画风里 `tone` 返回实色、`ink` 只做正片叠底 |
| 形变 | `VC.morphPath(dA, dB, k)`、`VC.shape.rect / circle` | — | 任意两条闭合路径插值 |
| 小票(附加模块 `receipt.js`) | `rc.build(t, x, w, [{t0, h, d:(t, y) => SVG}], {top, lead, pad, slot})` 边打边长的小票;行:`rc.hd`(标题)/ `ln` / `row2`(左右两栏)/ `ctr` / `dashed`(虚线);零件 `rc.slot`(出纸口)/ `strip`(纸条)/ `rule`;`onPrint(t0, 字数)` / `onFeed(t0)` 给音效登记 | R1 标题 48 · R2 正文 36 · R3 注释 24 | 纸条随行数长出来,字被纸裁住,墨迹滤镜只套字;裁剪区编号随 `kit.begin()` 归零(几张小票同帧横移不撞 id)。别的画风也能用:纸取 `c.paper`(没有就 `c.card`),不加卷边阴影和墨迹 |
| 1 位像素图、条码、点阵图 | `rc.sprite(名字或行数组, x, y, px)`、`rc.sprites([名字…], x, y, px)`(图库 `VC.receipt.SPRITES`:19 个食物 / 物件,`'#'` = 一个点);`rc.barcode(x, y, w, h, seed)`、`rc.dotBar`(网点条)、`rc.dotCurve(x, y, w, h, [[横坐标, 0–1]…], fill, 粗点, xMax)`、`rc.dotScatter(x, y, w, h, t, t0, 往上?)` | — | 热敏打印机只会打点:图标、曲线都由方点组成;按论文描述画的走向要在画面上标「示意」 |
| 走纸转场 | `rc.feed(t, t0, A, B, {dur: .9, under})` | — | 镜头往下摇:旧画面往上出画、新画面从下面上来(`under` 垫台面,只铺在新画面那一屏里,不盖旧画面);不像「撕下」那样斜着扫过字幕带 |
| 转播:球场与包装条(附加模块 `broadcast.js`) | `bc.pitch()` 草皮、`bc.led(t, 字, t0, 色)` 场边 LED 板(换广告 = 从左往右点亮 0.6s)、`bc.tab(cx, y, 字, t, t0, {anchor,w,size,fill,ink})` 时间标签、`bc.head(t, t0, 标签, 标题)`、`bc.refBar(cx, y, 字, t, t0, {w,label})` 裁判条、`bc.infoRow(x, y, w, 标签, 字, t, t0)` 信息条、`bc.steps(t, t0, [项…], 当前)` 编号步骤条、`bc.chip` / `pill` / `pills` 小胶囊、`bc.wipe(t, t0, x, y, w, h, SVG)` 任意一块擦出来 | R2 包装字 · R3 小字 | 包装条从左往右擦出来(expoOut),不弹(编号步骤条是淡入);裁剪区编号随 `kit.begin()` 归零。`onCue(种类, t0)` 登记音效:swish 擦入 / ding 裁判 / buzz LED / push + tick 漏斗 / tx 字擦入;`onText(字)` 收画面字给 `VC.ready`;`bc.text` = 带这两个钩子的 `kit.text` |
| 转播:比分 | `bc.scoreboard(x, y, w, h, 主队, 客队, t, {scoreAt,scoreIn,scoreSize,nameSize})`(队 = `{name, col, sub, score}`)、`bc.miniBoard({x,y,w,tab,home,away,scores,sub,ref,t0,tScore,tRef,note}, t)` 小比分板(两个时间点并排)、`bc.team(字, 色, x, y, 字号, anchor)` 斜体队名、`bc.fixture(x, y, A, B, 色A, 色B, t, t0, 划掉时刻)` 对阵行 | R4 比分(Anton)· R2 队名 | 中文没有真斜体,队名整组 `skewX(-10)`;比分是两组平均值。**不显著只写「不显著」,不写「打平」** |
| 转播:漏斗、结果行、点阵 | `bc.funnel(cx, y, w, 标签, 人数, t, t0, 色)` 选拔漏斗一级、`bc.result(y, 赛区, t0, [[字,t0]…], [结果,t0], 色, [注,t0], t)` 其他赛区结果行、`bc.tip(y, 编号, 字, 小字, t, t0, t1, 色)` 建议行、`bc.dots({x,y,n,keep}, t, t0, t1)` 人点阵(`VC.broadcast.pick(n, 留下, 种子)` 固定种子挑人) | R2 · R3 · R4 | 人数变少用点阵变暗,不滚数字。别的画风也能用:板子取 `c.navy`(没有就用转播的深蓝一套,不退到浅色的 `c.surface` / `c.card`),板上的普通字白色、次要字浅灰,比分用队色,比分板上的队名白色、对阵行的队名用队色(画风没有 `c.home` / `c.away` 时用转播的橙 / 蓝);画布用 `{W, H}` 传,LED 板默认离底 290,两侧广告字放不下时只排中间一遍 |
| 发光的线 | `kit.glow(路径 d 或数组, t, t0, 时长, {col, w, k, hot, tip})` | — | 宽辉光 + 中辉光 + 线 + 可选白芯;时长 > 0 时按长度画出,笔尖带一颗亮点。星夜光点的线稿(食物、天平、数轴、山脊)都用它;带 `data-over` |
| 光点 / 飘尘 | `kit.orb(x, y, r, {k, col})`;`kit.particles(t, {n, x, y, w, h, speed, seed})` | — | 光点默认取 `c.glow`;都带 `data-over`,检查器不算「字压素材」。星夜光点画风的主角,任何画风都能用 |
| 光笔 | `const pen = kit.lightpen(segs, {col, w, hot, cams, follow, headOut})`;每帧 `pen.stars(t)`、`pen.render(t)`;`pen.S(x, y, t)` 世界 → 画面,`pen.at(i, k)`、`pen.head(t)` | — | 一支光笔一笔画到底:世界坐标里的长路径分段画出,段与段之间自动顺切线接上(`jump:true` = 提笔),笔头是白芯 + 光晕 + 横向镜头光,笔头后一截发白;镜头按关键帧走或跟着笔头(`follow`),线宽与辉光在画面坐标里恒定;`stars` 是随镜头视差移动的星空 + 虚化光斑。世界坐标里的标签由页面在碰到边距前淡掉(字不出画)。样片 `video/lightpen-demo.html` |
| 观众动手:倒数 | `kit.countdown(x, y, t, t0, {n:3, r, label})` | R2 数字 / R10 | 一圈细环 n 秒走完;问完问题、配音停顿时放(`narration.json` 的 `gapAfter` 留出几秒) |
| 观众动手:二选一 | `kit.choice([{x,y,w,h,label,tag,inner:t=>SVG}], t, {t0, gap, tReveal, pick})` | R2 标签 / R10 角标 | 框 = 画风的窗口造型;揭晓时选中项描边 + 辉光(强调色),其余变暗 |
| 观众动手:数轴猜数 | `kit.numberLine(x, y, w, lo, hi, t, {t0, ticks, unit, label, guesses:[{v,t}], answer:{v,from,t}, answerSize})` | R10 刻度 / R4 答案 | 光点从 from 滑到答案(1.2s),落地后答案数字亮起;**数字只出现真实值,不滚中间数** |
| 观众动手:填空 | `kit.blank(前半句, 答案, x, y, t, {t0, tFill, role, size})` | 任一 R(默认 R1) | 空(下划线)闪着,观众先接上;tFill 时答案用强调色落进空里 |
| 观众动手:乱序字 | `kit.scramble(乱序串, 正确串, x, y, t, {t0, tFix, dur, role})` | 任一 R(默认 R2) | 先读乱的(观众会发现照样读得懂),再沿小弧线归位;两串必须是同一组字 |
| 观众动手:遮挡 | `kit.mask(句子, [被盖的字的下标], x, y, t, {t0, tReveal, role, color})` | 任一 R(默认 R2) | 色块完全盖住字(带 `data-over`),揭晓时逐个收掉 |

## 规矩
- **数字只在真实值之间变化**:`counter` 的每个 key 都必须是事实表里的值;按位滚动、缓出无过冲,任何一帧都不会整串出现 key 以外的数。
- 测宽用 canvas 实测(字体加载完之后),中文字走 `zh` 字体、其余走 `en` 字体;中文语境里的 —…“” 走中文字体。
- 段首横移默认 1.2s(Vox 中位 1.29s),比 N8/N9 的 0.85s 慢,并加横向运动模糊;要复刻旧手感传 `{dur:.85, blur:false}`。
- 信息面板 `kit.panel(x, y, w, h, 标题)`:画风可用 `carriers.panel` 单独给造型(纸面拟物 = 一张纸),没给就用窗口造型。
- 一页里只放一种画风的 SVG:`vc-*` 的 defs id 是固定的,多种画风同页会串(缩略图并排页因此用 iframe)。
- 加画风:在 `styles.js` 复制一套;承载物先从已有 kind 里挑,要新造型就在 `vc.js` 对应组件加一个 kind 分支。
- 旧片(N1–N9、A1–A6)没有改用这套组件,仍是各自的大 HTML。
- **长度不固定的字一律用 `textFit`**:标题、封面字、从数据来的标签、竖版里的任何一句。它按真实字宽缩字号(默认最多两行、最小 0.6 倍),`ok=false` 会在控制台告警——这时改字或改版面,别硬塞。
- **折行规矩(`wrap` / `fit` / 气泡 / 对话框共用)**:中文按词断(浏览器分词 `Intl.Segmenter`),「第 114 卷」这类「第 + 数字 + 量词」不拆;句读和右引号不放行首,左引号不放行尾。两行时在词边界里挑断点:两行接近、第一行不短于第二行、优先断在逗号 / 冒号 / 空格后、不断在引号括号里。
- **压测页 `fit-test.html`**:一组「不友好输入」(超长标题、中英混排、带标点长句、长数字),`?style=&w=&h=` 换画风画幅;对照开关 `&bad`(不用 fit,应报出画)、`&overlap`(故意叠字,应报叠字)。改了排版相关代码,12 种画风 × 横竖屏都跑一遍 `engine/tools/check-text-bounds.mjs`,全 0 才算过(2026-10-07 实测全 0;2026-10-10 加热敏小票后 24 组全 0)。**阳性对照要真打到这个画风上**:某画风字号偏小时 `&bad` 可能恰好不出画(热敏小票 R1 72px 就是),临时把 `&bad` 的字号提到 96 再跑。

## 正片实战(第一部用这套组件的正片,2026-10-07)
第一次用这套组件做整片(12 个镜头,paper-skeuo 外观)。可以照着抄的做法:
- **字体**:那期当时用的是旧脚本 + 项目里的整套字体;新一期用引擎的 `fonts <期>`(族名与 `styles.js` 一致,自动只切用到的)。
- **镜头表 + 转场**:`SHOTS = [{ fn, p, tx }]`,转场在段首前开始;`pan`、`flip`(病历夹翻页)是页面里自己写的,其余直接 `kit.transition(...)`。形变要给两个镜头各一个「去掉那个对象」的版本(`shot3(t, { no: 1 })`)。
- **音效自己登记**:页面里包一层 `ty / hd / mk / st / dr`(打字、手写、批注、盖章、纸片落下),被调用时往表里记一条;生成音效时把每个镜头按「全部画完」调用一遍就得到完整节点表,画面改了音效自动跟着变。
- **导出前**:`fontsReady` 直接用 `VC.ready` 的返回值;字体用引擎的 `fonts <期>` 切,页面用到的画风的字体会全部注册,所以不会出现「没用到的族报 0」误判。(那期是旧做法:自己拼了一个只含本期字体的 `faces` 对象。)

踩过的坑:
- `check-text-bounds` 把同一个父节点下的 `<text>` 合成一串再量(为了逐字手写的字):并排的几串独立文字(屏上几行读数、卡片里几条)要各包一层 `<g>`,否则合成的大框会报出不存在的叠字 / 压素材。
- `zoom-through` 开口外面垫的是画风底色:页面自己画的背景,在这个转场里要铺到画面外很远;但 `pan` / `slide-push` 是两镜并排,背景铺大会让新镜头盖住旧镜头 ⇒ 只给 zoom-through 的新镜头(B,从开口里由小放大)传铺大的版本。
- 封面 / 竖版的就绪代码如果写在 `fontsReady` 前面,`await window.fontsReady` 等到的是 undefined,随后字体就绪时的 `render(0)` 会把封面画面盖掉 ⇒ 先 `while (!window.fontsReady) await …` 再画。
- 用写文件工具写 `'\uFF1A'` 这类转义,落盘时会被换成字符本身;之后用脚本替换要按实际字符匹配(结果仍是全角,没坏)。
- 有些字体对简体字画的是繁体字形(龙藏体「时」→「時」,见 design/fonts.md);新字体先出样张放大看。
