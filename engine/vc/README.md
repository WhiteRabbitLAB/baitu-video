# 共享组件(VC)

所有频道共用的画面组件。组件只认「文字角色」R1–R10,字体、颜色、承载物、出场方式全由画风提供。

| 文件 | 管什么 |
|---|---|
| `vc.js` | 组件(纯函数,返回 SVG 字符串,1920×1080 坐标,逐帧可复现) |
| `styles.js` | 画风外观表:纸面拟物 `paper-skeuo`、游戏拟物 `game-ui`、扁平几何 `flat-geometric`、扁平插画 `flat-illustration`、卡通界面 `cartoon-ui`、科技深色 `tech-ui`、白板手绘 `whiteboard`、黑底数学 `dark-math`、黑板粉笔 `chalkboard`、动态文字 `kinetic`(共 10 种,缩略图见 ../../styles/INDEX.md) |
| `demo.html` | 演示页:每个组件一行,可切换画风、中英文、时间轴 |
| `thumbs.html` / `thumbs.mjs` | 画风缩略图:同一场景只换画风;`node engine/vc/thumbs.mjs` → `.claude/skills/explainer-video/styles/thumbs/` |
| `transitions.html` / `measure-tx.mjs` | 转场演示(morph、zoom-through、slide-push、blur-push)与量转场(带线性淡化阳性对照):`node engine/vc/measure-tx.mjs paper-skeuo` |
| 字体 | `fonts.css` + `fonts/`:引擎自带的子集字体(画风表用到的全部字体,按演示页的字切);重切:`node <engine>/cli.mjs fonts-demo`。每期正片用 `fonts <期>` |
| `scene-gallery.html` / `scene-gallery.mjs` | 场景示范图:11 个场景各一帧,同一个中性题目;`node engine/vc/scene-gallery.mjs zh`(或 `en`)→ skill 的 `scenes/demo/`(场景卡顶部用的是成片截图 `scenes/thumbs/`,这里不覆盖它)|
| `shot.mjs` | 演示页截图:`node engine/vc/shot.mjs <目录> paper-skeuo,zh,7.5 tech-ui,en,2.4` |

## 在新一期里用
**最快:`node .claude/skills/explainer-video/engine/cli.mjs new <期> --style <画风>`**,生成的起步页面路径都算好了(模板 [../templates/page.html](../templates/page.html))。写镜头时照 [demo.html](demo.html) 抄——每个组件在不同画风里怎么用都在那里。
手写的话,页面在默认位置 `video/<期>.html` 时:
```html
<script src="../.claude/skills/explainer-video/engine/vc/vc.js"></script>
<script src="../.claude/skills/explainer-video/engine/vc/styles.js"></script>
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
| 转场 | `kit.transition(id, t, t0, A, B, 参数)`;id = `slide-push` / `blur-push` / `zoom-through`(`{cx,cy,r0}`)/ `morph`(`{from,to}` 路径 + 颜色)/ `fade` | — | slide-push 的领路竖条取强调色;zoom-through 的开口底子取画风底 |
| 形变 | `VC.morphPath(dA, dB, k)`、`VC.shape.rect / circle` | — | 任意两条闭合路径插值 |

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
- **压测页 `fit-test.html`**:一组「不友好输入」(超长标题、中英混排、带标点长句、长数字),`?style=&w=&h=` 换画风画幅;对照开关 `&bad`(不用 fit,应报出画)、`&overlap`(故意叠字,应报叠字)。改了排版相关代码,10 种画风 × 横竖屏都跑一遍 `engine/tools/check-text-bounds.mjs`,全 0 才算过(2026-10-07 实测全 0)。

## 正片实战(第一部用这套组件的正片,2026-10-07)
第一次用这套组件做整片(12 个镜头,paper-skeuo 外观)。可以照着抄的做法:
- **字体**:那期当时用的是旧脚本 + 项目里的整套字体;新一期用引擎的 `fonts <期>`(族名与 `styles.js` 一致,自动只切用到的)。
- **镜头表 + 转场**:`SHOTS = [{ fn, p, tx }]`,转场在段首前开始;`pan`、`flip`(病历夹翻页)是页面里自己写的,其余直接 `kit.transition(...)`。形变要给两个镜头各一个「去掉那个对象」的版本(`shot3(t, { no: 1 })`)。
- **音效自己登记**:页面里包一层 `ty / hd / mk / st / dr`(打字、手写、批注、盖章、纸片落下),被调用时往表里记一条;生成音效时把每个镜头按「全部画完」调用一遍就得到完整节点表,画面改了音效自动跟着变。
- **导出前**:`fontsReady` 直接用 `VC.ready` 的返回值;字体用引擎的 `fonts <期>` 切,页面用到的画风的字体会全部注册,所以不会出现「没用到的族报 0」误判。(那期是旧做法:自己拼了一个只含本期字体的 `faces` 对象。)

踩过的坑:
- 封面 / 竖版的就绪代码如果写在 `fontsReady` 前面,`await window.fontsReady` 等到的是 undefined,随后字体就绪时的 `render(0)` 会把封面画面盖掉 ⇒ 先 `while (!window.fontsReady) await …` 再画。
- 用写文件工具写 `'\uFF1A'` 这类转义,落盘时会被换成字符本身;之后用脚本替换要按实际字符匹配(结果仍是全角,没坏)。
- 有些字体对简体字画的是繁体字形(龙藏体「时」→「時」,见 design/fonts.md);新字体先出样张放大看。
