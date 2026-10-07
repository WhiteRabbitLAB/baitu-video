# Narration example

| Item | This channel |
|---|---|
| Service | Doubao TTS (Volcengine) seed-tts-2.0 |
| Voice | "Jieshuo Xiaoming 2.0" `zh_male_jieshuoxiaoming_uranus_bigtts` (English version: Gemini TTS `gemini-2.5-pro-preview-tts`, voice Iapetus) |
| Speed | Chinese at default; English at 1.26× |
| Pauses | 0.5 s at segment start, 0.6 s between segments, 3 s at the end |
| Synthesis | One call per whole segment (sentence-by-sentence breaks the intonation) |
| Timestamps | Doubao returns per-character timestamps, used directly; Gemini doesn't, so whisper aligns it |
| Key | `.env` (never committed, never printed) |
| Cache | `cache/tts/` |
| Known quirks | Gemini treats imperative lines in the script ("Type this into…") as instructions and skips them ⇒ add a "read verbatim" hint to that segment |

Voices belong to their TTS providers; commercial use follows each provider's terms.

## Settings the engine reads

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

Keys are read from `.env` under each provider's default variable (Doubao `VOLC_API_KEY`, Gemini `GOOGLE_API_KEY`, OpenAI `OPENAI_API_KEY`, ElevenLabs `ELEVENLABS_API_KEY`; edge-tts needs none). Add `"keyEnv"` to a language to use a different variable.
