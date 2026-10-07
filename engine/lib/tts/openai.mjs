// OpenAI TTS(/v1/audio/speech)。2026-10-08 实测:经 OpenAI 兼容中转(apimart)gpt-4o-mini-tts 返回 audio/pcm 24kHz s16le。
// 走中转时在 voice 设定里写 baseUrl(或环境变量 OPENAI_BASE_URL)。不返回时间戳 ⇒ whisper 对齐。
import { toPcm } from '../audio.mjs';
export const nativeSpeed = true;
export async function synth(text, v, key) {
  const base = (v.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const body = { model: v.model || 'gpt-4o-mini-tts', voice: v.voice || 'alloy', input: text, response_format: 'pcm', ...(v.speed && v.speed !== 1 ? { speed: v.speed } : {}), ...(v.style ? { instructions: v.style } : {}) };
  const r = await fetch(base + '/audio/speech', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const b = Buffer.from(await r.arrayBuffer());
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${b.toString().slice(0, 300)}`), { status: r.status });
  return { pcm: toPcm(b, { rate: 24000 }) };
}
