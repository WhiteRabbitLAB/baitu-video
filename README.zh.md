# baitu-video

**用代码做讲解视频:任何话题、12 种画风,配音、字幕、渲染、验收由一个引擎跑完。**
一个 [Claude Code](https://claude.com/claude-code) skill:方法(片型、场景、画风、设计库)加上把稿子变成成片 MP4 的引擎。

English: [README.md](README.md)

![白板画风的样片,一笔笔画出来](docs/demo-whiteboard.gif)

*「为什么天是蓝的」:能直接跑的示例期 [examples/sky-demo](examples/sky-demo/README.md),白板画风,免费的 edge-tts 配音;截的是前 10 秒。*

## 中文和英文 · 横版和竖版
同一个页面、同一条时间轴:加 `?lang=en` 就换成英文配音、英文字幕和英文画面字;`vertFrame(t)` 把同一套画法按 1080×1920 重新排一遍,做竖版(是重排,不是裁切)。字幕在窄屏上自动折行。

![中英横版](docs/zh-en-landscape.jpg)

![竖版](docs/vertical.jpg)

整个示例(两种语言、两种画幅)在 [examples/sky-demo](examples/sky-demo/README.md),不要任何密钥就能跑。

## 十二种画风,同一个场景
同一个场景、同一段内容,只换画风层——换画风只改一行(`VC.kit('whiteboard')`)。

![十二种画风并排](styles/thumbs/_all.jpg)

纸面拟物 · 游戏界面 · 扁平几何 · 扁平插画 · 卡通界面 · 科技深色 · 白板手绘 · 黑底数学 · 黑板粉笔 · 动态文字 · 孔版印刷 · 热敏小票 —— 详见 [styles/INDEX.md](styles/INDEX.md)。

**新画风:热敏小票**(`thermal`)—— 米白热敏纸条、点阵字一行一行打出来、只用黑和红两色,比喻是「账」:适合「表面一样、算下来不一样」的对比题。下图是用它做的一部整片(6 分钟横版)里的两帧:

![热敏小票画风的成片截图](styles/samples/thermal-film.jpg)

## 场景模板
12 个现成的画面世界,各有自己的书写来源、组件和签名动作。下图是作者用其中 11 个做的成片截图:

![场景模板](scenes/thumbs/_all.jpg)

档案案卷 · 1944 实验桌 · 数据看板 · 策略游戏 · 解剖图解 · 剪辑台 · 信息卡片 · 横版风景 · 科技终端 · 纸面记录 + 屏幕对话框 · 画作与展签 · 深海剖面 —— 详见 [scenes/INDEX.md](scenes/INDEX.md);同一个中性题目的简化示范帧在 [scenes/demo/](scenes/demo/_all.jpg)。叙事片型(真实实验纪实、场景攻略、概念教学、A vs B、清单……)见 [formats/INDEX.md](formats/INDEX.md)。

## 怎么运作
做一期先回答四个问题——**做什么**(科普、故事纪实、教程、对比评测……)、**什么行业**、**什么感觉**、**发哪些平台**——再由四个互相独立的层拼起来:

| 层 | 决定什么 | 库 |
|---|---|---|
| 片型 | 叙事骨架(12 种:真实实验纪实、故事引出方法 + 实测、场景攻略、概念教学、A vs B、清单……) | [formats/](formats/INDEX.md) |
| 场景 | 画面是个什么世界、里面谁在用什么写字(档案、实验桌、策略游戏、终端、白板……) | [scenes/](scenes/INDEX.md) |
| 画风 | 怎么画(12 种) | [styles/](styles/INDEX.md) |
| 频道配置 | 只属于你频道的设定:配音、字幕、平台规矩、偏好 | [profiles/](profiles/README.md) |

画面就是普通的 HTML/SVG 页面,`render(t)` 画出第 t 秒的那一帧;引擎用无头 Chromium 逐帧渲染,配音、字幕、混音、封面、竖版、验收都交给同一个命令行。

## 环境依赖
作者只在 macOS 上跑过;Linux 用发行版的包管理器装同名工具应该可以,**没有实测**;Windows 没试过。装完在项目根目录跑 `node .claude/skills/baitu-video/engine/cli.mjs doctor`,它会逐项查,缺什么直接告诉你怎么装。

| 东西 | 必须? | 用来做什么 | 怎么装(macOS) |
|---|---|---|---|
| Node ≥ 18 | 必须 | 引擎本身 | `brew install node` |
| Playwright + Chromium | 必须 | 逐帧渲染画面、截图、检查 | 在项目里 `npm init -y && npm i -D playwright && npx playwright install chromium` |
| ffmpeg(含 ffprobe,要有 libx264、loudnorm) | 必须 | 合成视频、混音、响度 | `brew install ffmpeg` |
| python3 | 必须 | 验收「字幕时长」一项(只用标准库) | macOS 自带;或 `brew install python` |
| uv | 用免费配音 edge-tts 时必须;其余推荐 | 引擎用 `uvx edge-tts` 临时跑配音,不用全局装;缺 fontTools / pypinyin 时也靠它临时装 | `brew install uv` |
| whisper-cli + 模型文件 | 推荐;配音服务不给时间戳时必须 | 验收「漏读」;没有时间戳的配音靠它对齐字幕 | `brew install whisper-cpp`;模型见下 |
| fontTools + brotli | 推荐 | 每期字体子集化(`fonts` 命令) | `pip install fonttools brotli`,或装了 uv 就不用管 |
| numpy | 可选 | 量成片节奏的 `measure_film.py`、`measure_fades.py` | `pip install numpy` |

**whisper 模型**(约 1.5 GB,用的是 medium):
```bash
mkdir -p cache/whisper
curl -L -o cache/whisper/ggml-medium.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
```
放在项目的 `cache/whisper/ggml-medium.bin` 引擎会自己找到;放别处就在项目的 `.env` 里写 `WHISPER_MODEL=模型路径`。

配音服务的密钥写进项目根目录的 `.env`(各家的变量名见 `engine/lib/providers.mjs`;默认的 edge-tts 不要密钥)。

## 快速开始
在你的项目里(先装好上面「环境依赖」里的必须项):
```bash
git clone https://github.com/WhiteRabbitLAB/baitu-video .claude/skills/baitu-video
npm init -y && npm i -D playwright && npx playwright install chromium
E=.claude/skills/baitu-video/engine/cli.mjs

# 1. 项目配置 + 你的频道配置(放在你自己的项目里,不放进 skill 目录)
cp .claude/skills/baitu-video/engine/explainer.example.json explainer.json
mkdir -p profiles && cp -r .claude/skills/baitu-video/profiles/_template profiles/my-channel
node $E doctor                        # 自检;❌ 必须先解决

# 2. 新建一期
node $E new lesson1 --style whiteboard   # 稿子模板 + 起步页面
#    写 brief/lesson1/script.zh.txt(空一行 = 新的一段),然后:
node $E narrate lesson1                  # 配音 + 时间轴(默认免费的 edge-tts)
node $E subs lesson1                     # 字幕
node $E fonts lesson1                    # 按页面切字体
node $E shot lesson1 3 8                 # 截两帧看看
node $E render lesson1 && node $E mix lesson1
node $E accept lesson1                   # 14 项验收 → out/lesson1/acceptance/summary.md
```
也可以直接跟 Claude Code 说「做一期讲 …… 的讲解视频」,skill 会告诉它怎么做。完整步骤:[engine/README.md](engine/README.md) · 流程:[pipeline.md](pipeline.md)。

## 配音服务
在 `profiles/<频道>/voice.md` 里选;接口不给时间戳的,引擎自动用 whisper 对齐。

| 服务 | 状态 |
|---|---|
| 豆包(火山引擎)、MiniMax、阿里百炼(通义 TTS)、OpenAI TTS、Gemini TTS、edge-tts(免费) | 2026-10-08 实测 |
| ElevenLabs、Azure 语音、Fish Audio | 按官方文档接入,**没有实测**(作者没有密钥)——用前先跑 `engine/tools/tts-probe.mjs`,欢迎提交实测结果 |

## 用哪个模型、哪一档
2026-10-09 实测 45 组:Claude Haiku 5.5、Sonnet 5.5、Opus 5.5 各开 low / medium / high / xhigh / max 五档思考,跑三个任务(30 秒白板科普、45 秒档案案卷故事、45 秒策略游戏地图 + 传播路线动画)。每组都从只装了本 skill 的空文件夹开始(`claude -p --model … --effort …`),**每一组都出了成片**。质量是 Claude(Opus 5.5)看每条成片的抽帧总览打的 1–5 分。

| 用途 | 模型 · 档位 | 质量 | 平均花费 | 平均耗时 |
|---|---|---|---|---|
| **日常首选** | **Opus 5.5 · high** | 4.2 | $4.45 | 18 分钟 |
| 预算紧 | Sonnet 5.5 · high,或 Opus 5.5 · medium | 3.8 | $2.5–2.7 | 13 分钟 |
| 要最好 | Opus 5.5 · xhigh(会找一手资料,道具更丰富) | 4.5 | $8.91 | 29 分钟 |

- **不划算**:任何模型的 max(和 xhigh 一样的质量,贵六成、慢一倍);任何一档的 Haiku 5.5(最高 2.3 分,能做完但画面空;单次请求超过 10 万 token 按五倍计价,所以 Haiku max 平均 $1.55,比 Sonnet low 的 $0.59 还贵);Sonnet low / medium(能用,但平)。
- Opus high 和 Sonnet xhigh 同为 4.2 分,便宜约 15%、快 10 分钟。
- 保留:每格只跑 1 次、只有一个打分者,相邻两行重跑可能换位;花费是 Claude Code 按 API 定价估的(订阅用户是扣额度)。这是 2026-10-09 的能力边界,出新模型就重测。

## 验证到哪一步(如实说)
- 引擎能把一部已发布的 4.5 分钟成片从源文件重新做出来,**画面逐帧相同、声音逐采样相同**(渲染、混音、字幕、封面)。
- 一个没有任何上下文的代理只靠这些文档,在空文件夹里做出了样片;它报的每个障碍都已修掉。2026-10-09 又在三个模型、五档思考下冷启动了 45 次,全部出了成片(见上一节)。
- 还没验证:片中换画风、两个角色同框、口型对配音、角色表演进正片。标 🧪 的片型有骨架、还没出过样片。

## 授权
- 代码与文档:[MIT](LICENSE)。
- `profiles/example/`(兔子吉祥物、决策者偏好)是作者私有素材,**保留所有权利,不授权任何使用**;放在这里只为示范频道配置怎么写,请做你自己的角色。
- 引擎自带的子集字体:各按自己的许可(SIL OFL 1.1 / Apache 2.0),原文在 [engine/vc/fonts/LICENSES/](engine/vc/fonts/LICENSES/README.md)。
- 详见 [NOTICE.md](NOTICE.md)。
