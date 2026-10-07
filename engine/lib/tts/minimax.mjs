// MiniMax(t2a_v2)。2026-10-08 实测:speech-02-hd 非流式返回 data.audio = 十六进制 PCM;
// subtitle_enable 只给整句级时间戳(一句一条)⇒ 不够逐字,按「不给时间戳」处理,用 whisper 对齐。
// 国内 https://api.minimaxi.com;海外账号把 baseUrl 改成 https://api.minimax.io
import { toPcm } from '../audio.mjs';
export const nativeSpeed = true;
export async function synth(text, v, key) {
  const base = (v.baseUrl || 'https://api.minimaxi.com').replace(/\/$/, '');
  const body = { model: v.model || 'speech-02-hd', text, stream: false, voice_setting: { voice_id: v.voice || 'male-qn-qingse', speed: v.speed ?? 1 }, audio_setting: { sample_rate: 24000, format: 'pcm', channel: 1 } };
  const r = await fetch(base + '/v1/t2a_v2', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 300)}`), { status: r.status });
  const d = await r.json();
  if (d.base_resp?.status_code !== 0 || !d.data?.audio) throw new Error(`MiniMax ${JSON.stringify(d.base_resp)}`);
  return { pcm: toPcm(Buffer.from(d.data.audio, 'hex'), { rate: 24000 }), usage: d.extra_info?.usage_characters };
}
