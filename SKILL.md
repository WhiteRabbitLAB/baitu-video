---
name: baitu-video
description: 用代码做讲解视频的完整方法,不限话题(科普、AI 用法、历史、评测……):选题→事实表→文案与台词检查→配音字幕→按「片型 × 场景 × 画风」做画面(字体与对话框随场景走,可选生图角色表演)→渲染混音→封面竖版→验收。含片型库、场景库、画风库、设计库(字体/色板/组件/动效)与频道配置,均留新增口子。用户说「做新一期」「换个场景/画风」「加一种片型/场景/画风」「做角色动画段」时使用。
---

# 讲解视频制作

English: [SKILL.en.md](SKILL.en.md)

不限话题。目前沉淀自作者的两个频道:营养科普(10 部)和 AI 用法(6 部 + 一部 17 分钟通史长片),片型、场景、画风都写成了与话题无关的形式,两边的案例互相可借。

## 用之前先知道:skill 是地板,不是天花板
规矩分三种分量:**硬规矩**(事实、安全、平台、决策者决定,必须守)、**能力边界**(当时的模型做不到才定的,标了日期,模型变强就重测放开)、**默认值**(参数、模板、骨架——起点不是上限,能做得更好就做,留痕对比)。详见 [principles.md](principles.md) 开头。
不要因为文档写了某个参数就放弃更好的做法,也不要因为文档没写就不做。

## 使用者入口:四个问题

1. **你想做什么?**(科普讲解 / 故事纪实 / 教学教程 / 评测对比 / 观点表达 / 清单盘点 / 资讯速览)
2. **什么行业?**(健康营养 / 科技 AI / 人文历史艺术 / 自然科学 / 社科心理法律 / 财经商业 / 教育学习 / 职场技能 / 生活)
3. **想要什么感觉?**(看画风缩略图选)
4. **发在哪些平台?**(横版平台:YouTube、B 站、公众号视频等;竖版平台:抖音、视频号竖屏、小红书等)→ **只出对应画幅**:只选横版平台就只出横版,只选竖版平台就只出竖版,都选就两样一起做(决策者 2026-10-07)。竖版按竖屏重新排版,不从横版裁。

→ 从 [catalog/](catalog/README.md) 查推荐组合。每个组合标了状态:✅ 可做(有成片)、🧪 需测试(能做但没出过样片)、⛔ 暂不可做(要真人出镜、实拍或授权素材)。
热门参考作品能不能转成我们的模板:[catalog/references.md](catalog/references.md)。画风会长期增加:[styles/ROADMAP.md](styles/ROADMAP.md)。

## 内部结构:四层 + 设计库

使用者按「目的 × 行业 × 感觉」选;库的内部按下面四层存,互相独立,所以任何一层都能单独替换(自定义)。


| 层 | 管什么 | 例 | 库 |
|---|---|---|---|
| **片型** | 讲什么、怎么讲(叙事骨架) | 真实实验纪实、故事引出方法 + 实测、场景攻略 | [formats/](formats/INDEX.md) |
| **场景** | 画面是个什么世界;里面有哪些书写来源、组件、贯穿元素 | 档案桌、策略游戏、科技终端、画作展签 | [scenes/](scenes/INDEX.md) |
| **画风** | 怎么画:线、面、光、材质、动效手感、人物怎么画 | 纸面拟物、扁平几何、科技深色界面 | [styles/](styles/INDEX.md) |
| **频道配置** | 只属于某个频道的设定:吉祥物、字幕规格、配音、平台规矩、决策者偏好、工具链命令 | [填好的示例](profiles/example/channel.md) | [profiles/](profiles/README.md) |

场景和画风共用一个**设计库**([design/](design/)):字体目录(按书写来源)、色板、组件、动效与材质、**运镜与转场库**(每个参数标出处:实测 / 一手 / 我们 / 待测)。
画面里的字按「文字角色」([text-roles.md](text-roles.md))归类:**换场景或画风时,字体、承载物(对话框、纸条、面板)、出场方式整套跟着换**;字幕和章节进度条属于频道配置,不跟着换。
需要角色表演时,加上角色模块([characters/](characters/INDEX.md)):生图当美术,代码当引擎。

## 引擎
能直接跑的示例期(中英两种配音、横竖两种画幅):[examples/sky-demo](examples/sky-demo/README.md)。
做片子用的命令、共享画面组件和检查工具都在 [engine/](engine/README.md)。第一次用先在项目根目录跑自检:`node .claude/skills/baitu-video/engine/cli.mjs doctor`。

## 先读什么

| 要做的事 | 读 |
|---|---|
| 第一次在一个项目里用 | 按 [engine/README.md](engine/README.md)「开始」五步走:`explainer.json` → 把 [profiles/_template/](profiles/_template/) 整个复制成**你项目里的** `profiles/<你的频道>/`(别放进 skill 目录,升级会被覆盖),填 channel / voice / preferences 三个文件;写法看 [profiles/example/](profiles/example/)(兔子与偏好是作者私有,不授权使用) |
| 从零做一期 | [pipeline.md](pipeline.md) + [principles.md](principles.md) + 本频道配置 |
| 选片型 / 场景 / 画风 | 先走 [catalog/](catalog/README.md) 四个问题;再看三个库的 INDEX |
| 画面上的字怎么定 | [text-roles.md](text-roles.md) → 场景文件的书写来源表 → [design/fonts.md](design/fonts.md) |
| 镜头之间、姿势之间怎么接 | [transitions.md](transitions.md) + 运镜与转场库 [design/camera-transitions.md](design/camera-transitions.md)(参数都有参考出处) |
| 角色表演 | [characters/act-pipeline.md](characters/act-pipeline.md) |
| 交付前 | [acceptance.md](acceptance.md) |

## 留口子:每个库都能长

| 要加 | 做法 |
|---|---|
| 片型 | 复制 `formats/_template.md`;写叙事骨架、必备镜头、衔接偏好;样片验证后登记 |
| 场景 | 复制 `scenes/_template.md`;**书写来源 → R1–R10 填齐**、贯穿元素、组件;样片验证后登记 |
| 画风 | 复制 `styles/_template.md`;**必写人物在这个画风里怎么画**;用已有场景 + 角色出样张后登记 |
| 字体 / 色板 / 组件 / 动效 | 在 `design/` 对应文件加一行(字体必须可商用) |
| 角色 | 按 `characters/act-pipeline.md` 定稿后登记 |
| 频道 | 复制 `profiles/_template/` 文件夹(三个文件:频道 / 配音 / 偏好) |

每做完一期,把新踩的坑写回对应文件。

## 状态与未验证

待办清单(按建议顺序编号):`TODO.md`(作者的内部记录,开源版里没有;公开的画风路线图见 [styles/ROADMAP.md](styles/ROADMAP.md))。


- 场景和画风在库里是分开的;往期页面是「一期一个大 HTML」,两者写在一起。**常用组件已抽成可换画风的共享代码 `engine/vc/`**(组件只认文字角色,外观由 `styles.js` 提供,10 种画风各一套,缩略图见 [styles/INDEX.md](styles/INDEX.md));已有一部正片(N10)整片用它做。
- 未验证:同一场景换画风实拍;多画风混剪;两个以上角色同框;角色口型对配音;角色表演进正片。
- 按 AI 用法频道的稿子、交接文档、字体表整理的片型(story-method-test、howto-guide、product-review、timeline-epic)和场景(terminal-tech、field-notebook、gallery-wall)还没在新片里用过;gallery-wall 的画面页已删,它的字体表整表是推断。
