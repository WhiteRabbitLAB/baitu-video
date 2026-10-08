# 热门参考作品:能不能转成我们的模板

按各平台公认的头部知识创作者整理(依据:公开报道与频道介绍,**不是播放数据排名**)。
每行写:它的画面形式 → 能不能用「代码 + 生图 + 公版素材」做 → 对应我们的什么 → 还缺什么。
新看到好作品就加一行;做过一期就回来改状态。

| 参考 | 目的 / 行业 | 画面形式 | 能做吗 | 对应我们的 | 还缺什么 |
|---|---|---|---|---|---|
| 回形针 PaperClip | 科普 / 综合 | 纯动画信息图,风格高度统一,3–5 分钟 | ✅ 我们的强项 | mechanism、experiment;lab-dashboard、anatomy-diagram | 统一的频道视觉系统(共享组件) |
| Kurzgesagt | 科普 / 自然科学 | 扁平 + 渐变矢量动画,尺度穿行,画面一直在动 | 🧪 背景能做细,角色需生图 | flat-illustration、landscape-scroll | 尺度穿行场景;角色表演进正片 |
| 3Blue1Brown | 概念教学 / 数学物理 | 黑底,一个对象平滑变形成下一个,颜色 = 概念 | 🧪 代码天然适合 | concept-lesson(🧪 卡已写) | 「坐标与图形」场景 |
| TED-Ed | 故事 / 历史、科学 | 每集请不同动画师,画风各异 | 🧪 取决于画风库 | timeline-epic、spread-history | 更多画风(见 ../styles/ROADMAP.md) |
| CGP Grey | 科普 / 地理、历史、政治 | 简笔人物 + 图标 + 地图信息图 | 🧪 | info-cards、strategy-game 的地图 | 简笔角色组件 |
| Vox | 观点、科普 / 社会 | 真实资料桌面拼贴、剪报、红线、荧光笔 | ✅ 结构上已做过 | case-file、field-notebook(paper-skeuo) | 「资料拼贴」动效细化 |
| 白板手绘(RSA Animate 型) | 科普、教学 | 手在白板上边讲边画 | 🧪 | 待建:白板场景 | 线稿逐笔揭开组件 |
| 动态文字(kinetic type) | 观点、清单 | 关键词踩重音砸进来 | 🧪 容易做 | 开头 3 秒、listicle(🧪 卡已写) | 动态文字画风 |
| 故事型简笔动画(TheOdd1sOut 型) | 故事 / 生活 | 简笔角色快切 + 反应特写 | 🧪 | 角色模块 | 角色表情库 |
| 小约翰可汗 | 故事纪实 / 历史 | 大量写实影视素材拼接 + 本人配音 | ⛔ 授权素材;部分可转 | timeline-epic(画面改用公版图 + 地图 + 档案) | 公版素材检索流程 |
| 半佛仙人 | 观点 / 财经、社会 | 表情包 + 视频素材 + 犀利文案 | ⛔ 素材版权;结构可借 | 观点装进故事;kinetic type 代替表情包 | — |
| 罗翔说刑法、李永乐、毕导 | 科普、教学 | 真人出镜讲解 + 板书 / 图 | ⛔ 真人出镜;图的部分可做 | 吉祥物代替真人主持 + info-cards | — |
| 小Lin说 | 科普 / 财经 | 真人出镜 + 信息图 | ⛔ 真人;🧪 信息图部分 | 待建:财经图表场景 | 财经图表组件 |
| Veritasium、Mark Rober、「手搓万物」 | 科普 / 科学、工程 | 实拍实验、动手做 | ⛔ 实拍 | 转成 experiment(动画重述别人的实验) | — |
| 街头采访类 | 观点 / 社会 | 实拍采访 | ⛔ | — | — |

## 代码生成动画的参考(prompt-motion.com,2026-10-07 看过)
[prompt-motion.com](https://prompt-motion.com/) 收了 230 条用 Claude Opus 5.5 写代码做的动画,附提示词;约八成是产品宣传片和动效作品集(15–20 秒炫技),和讲解片不是一路。
下表是对我们有用的,每条只抽 8 帧看过静态画面,**转场时长和缓动没量**;用到时先按 ../design/camera-transitions.md 的方法量一遍。条目页面 = `https://prompt-motion.com/<条目>`。

| 条目 | 画面形式 | 对应我们的 | 怎么借 |
|---|---|---|---|
| twoclipping-5cba86「Shape morphing through UI states」 | 一个形状一路变成播放器、滑杆、开关、按钮、数据卡,不切镜头 | 转场 morph(已进引擎) | morph 的样板:上一个镜头的主体形状直接变成下一个镜头的主体 |
| ik-builds-b8bdcf「Paper-style product launch film」 | 纸面风;一个小球带残影轨迹贯穿全片,把各场景串起来 | 贯穿元素 + 转场 | 一期设一个贯穿物件(小球、笔尖、数字),由它带出下一镜头,替代单一横移 |
| tak3sh8-be5012「Replica symmetry breaking whiteboard」 | 白板外框、马克笔图标跟着笔画走、斜线排线填色、三色笔、末屏「全部故事在一块板上」 | 白板手绘画风(ROADMAP 高优先) | 当这个画风的样张标准 |
| linearuncle-5d2bae「导数概念讲解」(Manim,中文) | 黑底坐标系、割线逼近切线、放大镜把曲线拉直 | concept-lesson 片型、黑底数学画风 | 片型骨架:直觉问题 → 逐步逼近 → 例子 → 留一个问题 |
| kloss-xyz-fe0c31「History of AI timeline」 | 顶部常驻时间刻度 + 当前年份标记;背景压巨大淡色年份;每个时代一张专属图(对话框、对比柱、注意力弧线) | timeline-epic | 时间刻度做成常驻部件;一个时代一种图,不重复 |
| emollick-8661a8「Recursion explained in genres」 | 每一层换一种画风(终端、8-bit、纪录片、儿童节目、黑色电影、预告片),顶部「调用栈」标签显示第几层 | 换画风能力当片型卖点 | 一期按章换画风(engine/vc 的 styles.js 已能做到);顶部标签显示当前「层 / 章」 |
| nikolajankovic-ce4ff4「DeFi Saver stop-motion explainer」 | 手绘逐格(铅笔线、温度计、K 线),字幕贴在胶带纸条上 | paper-skeuo 的草稿变体 | 更松的线稿 + 逐格抖动(每 2 帧换一次线);字幕仍按频道规格,不照搬 |
| x4b47x-9cc84f「Shadow theatre home story」 | 剪纸皮影,竖版 9:16,舞台帘幕边框 | ROADMAP「皮影」、抖音竖版 | 皮影画风起点;帘幕边框适合竖版 |
| yunn260414-60d996「什么是 Git」(中文) | 深蓝底卡片 + 终端窗口 + 底部字幕 | terminal-tech | 基线对照:动得少、像幻灯片——我们至少要比它多运镜和衔接 |
| parkerrex-1a54fe「Token bucket rate limiter」 | 提示词:canvas only,每帧是时间的纯函数,方便逐帧截图 | 我们的 render(t) 架构 | 印证做法;无新东西 |

**参考不了的**:3D 实景(blueoctopusai「First & 10」、rebutonepress 黑洞故事,Three.js 渲染,超出纯 2D 路线);粒子 / 流体炫技作品集(没有叙事)。
**宣传片赛道**:站上大部分是产品宣传片,本 skill 的讲解片流程稳定之后再试(决策者 2026-10-07);到时这批条目是现成的参考池。

每个参考的运镜、转场、节奏怎么量、量出来是多少,写进 [../design/camera-transitions.md](../design/camera-transitions.md)。

## 从这张表得出的优先级
1. 我们的强项是**回形针 / Vox 一路**(纯动画信息图、资料拼贴)——已跑通,继续做精。
2. 最值得补的是 **3Blue1Brown 一路**(概念教学)和 **Kurzgesagt 一路**(尺度穿行 + 角色):代码天然适合,教育、自然科学两个行业都要用。
3. 真人出镜、实拍、授权素材类做不了;**借它们的叙事结构,画面换成我们能做的**。

## 参考来源
- B 站知识区设立与分区:[36氪 · 新设知识区,B站破圈的平衡术?](https://www.36kr.com/p/742403663274887)、[投资界](https://news.pedaily.cn/202006/455980.shtml)
- 知识区头部创作者与泛知识占比:[今日头条](https://www.toutiao.com/zixun/7507411167116691456/)、[36氪](https://www.36kr.com/p/1725129342977)
- 抖音知识类热点(2025 报告):[界面新闻](https://www.jiemian.com/article/7351025.html)
- 回形针、半佛的形式:[数英](https://www.digitaling.com/articles/261029.html)
- Kurzgesagt、3Blue1Brown、TED-Ed、CGP Grey:[vidpros](https://vidpros.com/9-best-youtube-channels-for-baitu-videos-on-tough-topics)
