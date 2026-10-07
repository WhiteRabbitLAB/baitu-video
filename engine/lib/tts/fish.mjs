// Fish Audio。按官方文档接入(POST https://api.fish.audio/v1/tts,JSON 请求),**本项目没有密钥,未实测**。
// voice 填模型的 reference_id;不返回时间戳 ⇒ whisper 对齐;不支持调语速 ⇒ atempo。
import { toPcm } from '../audio.mjs';
export const nativeSpeed = false;
export async function synth(text, v, key) {
  const body = { text, format: 'wav', ...(v.voice ? { reference_id: v.voice } : {}) };
  const r = await fetch('https://api.fish.audio/v1/tts', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(v.model ? { model: v.model } : {}) }, body: JSON.stringify(body) });
  const b = Buffer.from(await r.arrayBuffer());
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${b.toString().slice(0, 300)}`), { status: r.status });
  return { pcm: toPcm(b) };
}
