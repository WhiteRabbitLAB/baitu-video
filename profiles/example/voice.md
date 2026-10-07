# 配音示例

| 项 | 本频道 |
|---|---|
| 服务 | 豆包语音(火山引擎)seed-tts-2.0 |
| 音色 | 「解说小明 2.0」`zh_male_jieshuoxiaoming_uranus_bigtts`(英文版另用 Gemini TTS `gemini-2.5-pro-preview-tts`,音色 Iapetus) |
| 语速 | 中文默认;英文 1.26 倍 |
| 停顿 | 段首 0.5s、段间 0.6s、片尾 3s |
| 合成方式 | 每段整段一次合成(分句合成语气会断) |
| 时间戳 | 豆包返回字级时间戳,直接逐字对齐;Gemini 不返回,用 whisper 对齐 |
| 密钥 | `.env`(不进 git、不打印值) |
| 缓存 | `cache/tts/` |
| 已知坑 | Gemini 会把稿子里的祈使句(「Type this into…」)当指令不念 ⇒ 该段加逐字朗读提示 |

音色归语音服务方所有,商用按那家的条款。

## 引擎读的设定

```json
{
  "voices": {
    "zh": {
      "provider": "doubao",
      "voice": "zh_male_jieshuoxiaoming_uranus_bigtts",
      "resource": "seed-tts-2.0",
      "speed": 1.0,
      "pauses": {
        "leadIn": 0.5,
        "para": 0.6,
        "tail": 3
      }
    },
    "en": {
      "provider": "gemini",
      "voice": "Iapetus",
      "model": "gemini-2.5-pro-preview-tts",
      "style": "Narrate in a calm, low, warm documentary voice:",
      "speed": 1.26
    }
  }
}
```

密钥按服务默认的变量名从 `.env` 读(豆包 `VOLC_API_KEY`、Gemini `GOOGLE_API_KEY`、OpenAI `OPENAI_API_KEY`、ElevenLabs `ELEVENLABS_API_KEY`;edge-tts 不要密钥);要换变量名就在对应语言里加 `"keyEnv"`。
