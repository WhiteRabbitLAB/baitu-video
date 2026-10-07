# Narration: <channel / series name>

The skill is not tied to any TTS service. Say here which one you use; the pipeline synthesizes according to these settings.

## Available providers (wired into the engine)
| provider | Service | Key variable | Timestamps | Status | Common fields |
|---|---|---|---|---|---|
| `doubao` | Doubao TTS (Volcengine) | `VOLC_API_KEY` | from API, per character | tested | `voice` (voice ID), `resource` (default seed-tts-2.0), `speed` |
| `minimax` | MiniMax | `MINIMAX_API_KEY` | whisper alignment | tested | `voice` (voice_id), `model` (default speech-02-hd), `speed`; `baseUrl` for international accounts |
| `dashscope` | Alibaba Model Studio (Qwen TTS) | `DASHSCOPE_API_KEY` | whisper alignment | tested | `voice` (e.g. Cherry), `model` (default qwen3-tts-flash), `languageType` |
| `openai` | OpenAI TTS | `OPENAI_API_KEY` | whisper alignment | tested (via relay) | `voice`, `model` (default gpt-4o-mini-tts), `style` (tone instructions), `speed`; `baseUrl` for a relay |
| `gemini` | Gemini TTS | `GOOGLE_API_KEY` | whisper alignment | tested | `voice` (e.g. Iapetus), `model`, `style` (style prompt) |
| `edge-tts` | Microsoft Edge read-aloud (free) | none | whisper alignment | tested | `voice` (e.g. en-US-GuyNeural), `speed`; unofficial, may stop working |
| `elevenlabs` | ElevenLabs | `ELEVENLABS_API_KEY` | from API, per character | per docs, untested | `voice` (voice_id, required), `model` |
| `azure` | Azure Speech | `AZURE_SPEECH_KEY` | whisper alignment | per docs, untested | `voice`, `region` (required) |
| `fish` | Fish Audio | `FISH_API_KEY` | whisper alignment | per docs, untested | `voice` (reference_id) |

Common fields: `speed` (1 = normal; for services that can't change speed, the engine time-stretches after synthesis without paying again), `pauses` (silence at start / between paragraphs / at the end, in seconds), `maxChars` (per-request limit; longer paragraphs are split at a sentence end), `keyEnv` (use a different key variable).
Before switching provider or voice, run a probe: `node .claude/skills/explainer-video/engine/tools/tts-probe.mjs '{"provider":"minimax","voice":"male-qn-qingse"}' zh`.

## Timestamps
Word-level subtitle sync needs timestamps. If the API doesn't return them, the engine aligns automatically by running whisper over the synthesized audio (needs whisper-cli; the self-check verifies it).

## Licensing
Commercial-use terms for a voice belong to the TTS provider — read theirs before you publish.

## Settings the engine reads (edit here; provider: first column of the table above)

```json
{
  "voices": {
    "en": {
      "provider": "edge-tts",
      "voice": "en-US-GuyNeural",
      "speed": 1.0,
      "pauses": {
        "leadIn": 0.5,
        "para": 0.6,
        "tail": 3
      }
    }
  }
}
```

Keys are read from `.env` under each provider's default variable (Doubao `VOLC_API_KEY`, Gemini `GOOGLE_API_KEY`, OpenAI `OPENAI_API_KEY`, ElevenLabs `ELEVENLABS_API_KEY`; edge-tts needs none). Add `"keyEnv"` to a language to use a different variable.
