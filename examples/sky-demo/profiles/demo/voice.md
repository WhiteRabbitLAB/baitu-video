# 配音:示例频道

skill 不绑定任何一家语音服务。在这里写你用哪家,流水线按这里的设定合成。

## 可选的服务(引擎已接入)
| provider | 服务 | 密钥变量 | 时间戳 | 状态 | 常用字段 |
|---|---|---|---|---|---|
| `doubao` | 豆包语音(火山引擎) | `VOLC_API_KEY` | 接口给,逐字 | 实测 | `voice`(音色 ID)、`resource`(默认 seed-tts-2.0)、`speed` |
| `minimax` | MiniMax | `MINIMAX_API_KEY` | whisper 对齐 | 实测 | `voice`(voice_id)、`model`(默认 speech-02-hd)、`speed`;海外账号 `baseUrl` |
| `dashscope` | 阿里百炼(通义 TTS) | `DASHSCOPE_API_KEY` | whisper 对齐 | 实测 | `voice`(如 Cherry)、`model`(默认 qwen3-tts-flash)、`languageType` |
| `openai` | OpenAI TTS | `OPENAI_API_KEY` | whisper 对齐 | 实测(经中转) | `voice`、`model`(默认 gpt-4o-mini-tts)、`style`(语气说明)、`speed`;走中转写 `baseUrl` |
| `gemini` | Gemini TTS | `GOOGLE_API_KEY` | whisper 对齐 | 实测 | `voice`(如 Iapetus)、`model`、`style`(风格提示) |
| `edge-tts` | 微软 Edge 朗读(免费) | 不要 | whisper 对齐 | 实测 | `voice`(如 zh-CN-YunxiNeural)、`speed`;非官方接口,不保证长期可用 |
| `elevenlabs` | ElevenLabs | `ELEVENLABS_API_KEY` | 接口给,逐字符 | 按文档,未实测 | `voice`(voice_id,必填)、`model` |
| `azure` | Azure 语音 | `AZURE_SPEECH_KEY` | whisper 对齐 | 按文档,未实测 | `voice`、`region`(必填) |
| `fish` | Fish Audio | `FISH_API_KEY` | whisper 对齐 | 按文档,未实测 | `voice`(reference_id) |

通用字段:`speed`(1 = 正常;服务本身不能调速的,引擎合成后变速,不重新花钱)、`pauses`(段首 / 段间 / 片尾留白秒数)、`maxChars`(单次请求的字数上限,超了在句末拆开)、`keyEnv`(换密钥变量名)。
换服务或换音色前先跑一次探针:`node .claude/skills/baitu-video/engine/tools/tts-probe.mjs '{"provider":"minimax","voice":"male-qn-qingse"}' zh`。

## 时间戳
字幕逐字对齐要用时间戳。接口不返回时,引擎自动用 whisper 识别合成好的音频来对齐(要装 whisper-cli;自检会查)。

## 授权
音色的商用条款归语音服务方,用之前看清楚那家的条款。

## 引擎读的设定(改这里;provider 填上表第一列)

```json
{
  "voices": {
    "zh": { "provider": "edge-tts", "voice": "zh-CN-YunxiNeural", "speed": 1.0 },
    "en": { "provider": "edge-tts", "voice": "en-US-AndrewNeural", "speed": 1.0 }
  }
}
```

密钥按服务默认的变量名从 `.env` 读(豆包 `VOLC_API_KEY`、Gemini `GOOGLE_API_KEY`、OpenAI `OPENAI_API_KEY`、ElevenLabs `ELEVENLABS_API_KEY`;edge-tts 不要密钥);要换变量名就在对应语言里加 `"keyEnv"`。
