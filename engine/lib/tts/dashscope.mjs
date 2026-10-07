// 阿里百炼(DashScope)通义千问 TTS。2026-10-08 实测:qwen3-tts-flash 返回 output.audio.url(24kHz 单声道 16 位 WAV,链接有时效)。
// 不支持调语速 ⇒ atempo;不返回时间戳 ⇒ whisper 对齐。下载链接是带签名的临时地址,不落盘、不进日志。
import { toPcm } from '../audio.mjs';
export const nativeSpeed = false;
export async function synth(text, v, key) {
  const base = (v.baseUrl || 'https://dashscope.aliyuncs.com').replace(/\/$/, '');
  const body = { model: v.model || 'qwen3-tts-flash', input: { text, voice: v.voice || 'Cherry', ...(v.languageType ? { language_type: v.languageType } : {}) } };
  const r = await fetch(base + '/api/v1/services/aigc/multimodal-generation/generation', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 300)}`), { status: r.status });
  const d = await r.json(), url = d.output?.audio?.url;
  if (!url) throw new Error('没有音频链接:' + JSON.stringify(d).slice(0, 300));
  const a = await fetch(url);
  if (!a.ok) throw Object.assign(new Error(`下载音频 HTTP ${a.status}`), { status: a.status });
  return { pcm: toPcm(Buffer.from(await a.arrayBuffer())), usage: d.usage };
}
