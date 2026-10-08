# 引擎 / Engine

不管什么行业、什么画风,做片子都走这一套。skill 的文档讲「怎么做」,这里是「用什么做」。
English: [README.en.md](README.en.md)

## 三个目录
| 名字 | 是什么 |
|---|---|
| **引擎**(本文件夹) | 命令行、共享画面组件 `vc/`、检查工具 `tools/` |
| **skill**(上一级) | 方法文档、画风样张、频道配置 `profiles/` |
| **项目**(你运行命令的目录) | 稿子、页面、产物、缓存、`.env`、`explainer.json` |

## 开始(五步)
1. **项目配置**:在项目根目录放一份 `explainer.json`(照 [explainer.example.json](explainer.example.json)),写上频道名和文件位置。
2. **频道配置**:把 skill 的 `profiles/_template/` 整个复制成**你项目里的** `profiles/<频道名>/`(`explainer.json` 里 `"profile": "<频道名>"`)。别放进 skill 目录——升级 skill 会被覆盖。填 channel / voice / preferences;`voice.md` 里的 json 代码块是引擎读的配音设定,默认是免费的 edge-tts。
3. **自检**:
   ```
   node .claude/skills/baitu-video/engine/cli.mjs doctor
   ```
   查 Node、Playwright、ffmpeg、whisper、字体子集化工具、组件字体、项目配置、频道配置、每种语言的配音密钥(只报有没有,不打印值)、磁盘。❌ 必须先解决,⚠️ 是提醒。没装 Playwright:`npm init -y && npm i -D playwright && npx playwright install chromium`。
4. **新建一期**:`new <期> --style <画风>` 建好稿子模板 `brief/<期>/script.zh.txt`、`subtitles.json` 和起步页面 `video/<期>.html`(组件路径自动算好)。
5. **写稿 → 出片**:稿子空一行分段;然后 `narrate` → `subs` → 改页面 → `fonts` → `shot` 看几帧 → `render` → `mix` → `accept`。

## 页面契约(渲染器只认这些)
| 接口 | 必需? | 说明 |
|---|---|---|
| `window.render(t)` | 必需 | 只由时间 t(秒)决定画面;同一个 t 永远同一帧 |
| `window.fontsReady` | 必需 | Promise;resolve 的对象里数字都要 > 0(`VC.ready` 的返回值就是「族:字重 → 加载到的数量」)。有 0 就判字体没加载上,渲染不开工 |
| `window.renderSfx(sampleRate)` | 可选 | 离线渲染音效 → `{b64, sampleRate, samples, peak, cues}`;没有就不加音效 |
| `window.coverReady` | 可选 | `?cover=<尺寸>-<版本>` 时的封面模式(`cover` 命令用) |
| `window.vertFrame(t, e)` | 可选 | `?vert` 时的竖版画面(1080×1920),e = 尾卡进度 0–1(`vertical` 命令用) |

渲染器用 `file://…/<期>.html?render` 打开页面;第二种语言加 `&lang=en`。页面要引 `data-<期>.js`(`subs` 生成:`window.TL` 时间轴、`window.SUBS` 字幕)和 `fonts-<期>.css`(`fonts` 生成)。字幕要页面自己画:`kit.subtitle(t, SUBS, {font, size})`。完整的最小页面见 [templates/page.html](templates/page.html)。

## 命令
| 命令 | 做什么 | 状态 |
|---|---|---|
| `doctor` | 自检 | ✅ |
| `new <期>` | 新建一期:稿子模板、`subtitles.json`、起步页面 | ✅ |
| `narrate <期>` | 配音 + 时间轴:按 voice.md 选服务,每段整段合成;接口给时间戳就直接用,不给就 whisper 对齐。产物 `narration.wav`、`timeline.json`(第二种语言带 `.en` 后缀) | ✅ |
| `subs <期>` | 字幕 `.srt` + 页面数据文件(`window.TL`、`window.SUBS`);每期设定 `<brief>/subtitles.json`(数字转换表、要保留中文的说法、人工断点) | ✅ |
| `render <期>` | 逐帧导出画面 + 音效;`--ranges 0-5,20-30` 只出样片 `proto.mp4`(带配音) | ✅ |
| `mix <期>` | 混音(配音 -16、音效 -24、可选背景音乐)+ 合成 `<期>.mp4` | ✅ |
| `cover <期>` | 封面(`--sizes 16x9,3x4`,`--variants a,b`) | ✅ |
| `vertical <期>` | 竖版;每期设定 `<brief>/vertical.json`(从主片截哪几段) | ✅ |
| `shot <期> t1 t2 …` | 按时刻截图(`--vert` 截竖版) | ✅ |
| `accept <期>` | 验收 11 项 → `acceptance/summary.md`;人确认过的例外登记在 `<brief>/accept.json` | ✅ |
| `fonts <期>` | 这一期页面的字体子集化:按稿子和页面里真出现的字切,源字体按 `fonts.json` 自动下载;另有 `fonts-demo` 重切引擎自带的组件字体 | ✅ |
| `clean` | 删渲染中间文件 | ✅ |

## 配音服务的实测状态
ElevenLabs、Azure、Fish Audio 是按官方文档接入的,作者没有这三家的密钥,**没有实测**。用之前先跑探针 `tools/tts-probe.mjs`;如果接口对不上,改 `lib/tts/<服务>.mjs`。实测通过后,欢迎把 `lib/providers.mjs` 里的 `status` 改成 `tested` 并写上日期,提交回来。

## 目录
| 路径 | 内容 |
|---|---|
| `cli.mjs` | 命令入口 |
| `lib/paths.mjs` | 三个根目录(单一驻地) |
| `lib/config.mjs` | 读 `explainer.json`、频道配置、`voice.md` 的 json、`.env` |
| `lib/providers.mjs` | 配音服务登记表(9 家,含实测状态) |
| `lib/tts/` | 每家配音服务一个文件 |
| `lib/align.mjs` | 时间对齐(接口时间戳 / whisper) |
| `lib/narrate.mjs`、`lib/subs.mjs` | 配音、字幕 |
| `fonts.json` | 字体目录:每个字体的下载地址与授权(单一驻地) |
| `lib/doctor.mjs` | 自检 |
| `vc/` | 共享画面组件(说明见 [vc/README.md](vc/README.md)) |
| `tools/` | 检查与测量:文字出画 / 叠字、竖版居中、字体轮廓方向、成片节奏、淡化、字幕时长 |
