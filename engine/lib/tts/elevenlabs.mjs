// ElevenLabs。按官方文档接入(/v1/text-to-speech/{voice_id}/with-timestamps,output_format=pcm_24000),**本项目没有密钥,未实测**。
// 返回逐字符时间戳 ⇒ 不用 whisper。voice 填 voice_id。
import { toPcm } from '../audio.mjs';
export const nativeSpeed = true;
export async function synth(text, v, key) {
  if (!v.voice) throw new Error('ElevenLabs 要在 voice 里填 voice_id');
  const body = { text, model_id: v.model || 'eleven_multilingual_v2', ...(v.speed && v.speed !== 1 ? { voice_settings: { speed: v.speed } } : {}) };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v.voice)}/with-timestamps?output_format=pcm_24000`, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 300)}`), { status: r.status });
  const d = await r.json(), al = d.alignment || d.normalized_alignment;
  const tokens = al ? al.characters.map((c, i) => ({ text: c, start: al.character_start_times_seconds[i], end: al.character_end_times_seconds[i] })).filter(t => t.text.trim()) : null;
  return { pcm: toPcm(Buffer.from(d.audio_base64, 'base64'), { rate: 24000 }), tokens };
}
