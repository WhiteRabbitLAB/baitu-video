# Example: "Why is the sky blue?" / 示例:为什么天是蓝的

A complete, runnable episode: whiteboard style, **Chinese and English** narration, **landscape and vertical** cuts, free edge-tts voice (no API key).
一个能直接跑的完整示例期:白板画风,**中文、英文**两种配音,**横版、竖版**两种画幅,配音用免费的 edge-tts(不要密钥)。

![zh and en landscape](../../docs/zh-en-landscape.jpg)
![vertical](../../docs/vertical.jpg)

## Run it / 跑一遍
From this folder, with Playwright installed in your project (`npm i -D playwright && npx playwright install chromium`):
在本文件夹里运行(项目里要装好 Playwright):
```bash
E=../../engine/cli.mjs
node $E doctor
node $E narrate sky && node $E subs sky                         # 中文配音 + 字幕 / Chinese voice + subtitles
node $E narrate sky --lang en && node $E subs sky --lang en     # English voice + subtitles / 英文
node $E fonts sky
node $E render sky && node $E mix sky                           # out/sky/sky.mp4
node $E vertical sky                                            # out/sky/sky-vertical.mp4 (segments in brief/sky/vertical.json)
node $E render sky --lang en && node $E mix sky --lang en       # out/sky/sky.en.mp4
node $E accept sky && node $E accept sky --lang en
```

## What's where / 文件
| File | What it shows |
|---|---|
| `explainer.json` | Project config: one channel, default paths / 项目配置 |
| `profiles/demo/voice.md` | Two languages, two edge-tts voices / 两种语言各一个音色 |
| `brief/sky/script.zh.txt`, `script.en.txt` | Scripts; blank line = new paragraph; sentence ids line up across languages / 稿子;两种语言的句子编号一一对应 |
| `brief/sky/vertical.json` | Which part of the video becomes the vertical cut / 竖版截哪一段 |
| `video/sky.html` | The page: `render(t)` for landscape, `vertFrame(t)` for vertical, `?lang=en` for English; every cue hangs on the narration timeline (`at('p1s2', 1)`), so neither language needs hand-typed seconds / 页面:横竖两套坐标共用一套画法,画面节点全挂在配音时间轴上 |
