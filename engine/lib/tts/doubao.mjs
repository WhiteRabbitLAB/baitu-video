// 豆包语音(火山引擎)seed-tts。契约 2026-09-28 按官方文档实读,作者的频道 10 部片实用。
//   POST https://openspeech.bytedance.com/api/v3/tts/unidirectional;单头鉴权 X-Api-Key;返回逐行 JSON(base64 PCM 块)
//   enable_subtitle ⇒ 返回字级时间戳(秒)
import crypto from 'node:crypto';
import { SR } from '../audio.mjs';
const ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

const audioParams = v => ({ format: 'pcm', sample_rate: SR, speech_rate: Math.round(((v.speed ?? 1) - 1) * 100), loudness_rate: 0 });
const EXTRA = { enable_subtitle: true };
// 缓存键与作者旧脚本逐字节相同(旧缓存继续命中,换引擎不重新花钱)
export const cacheKey = (text, v) => crypto.createHash('sha256')
  .update(JSON.stringify({ text, voice: v.voice, resource: v.resource || 'seed-tts-2.0', audio: audioParams(v), extra: EXTRA }))
  .digest('hex').slice(0, 24);
export const nativeSpeed = true;

export async function synth(text, v, key) {
  const resource = v.resource || 'seed-tts-2.0';
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'X-Api-Key': key, 'X-Api-Resource-Id': resource, 'X-Api-Request-Id': crypto.randomUUID(), 'X-Control-Require-Usage-Tokens-Return': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ req_params: { text, speaker: v.voice, audio_params: { ...audioParams(v), enable_subtitle: true } } }),
  });
  const logid = res.headers.get('x-tt-logid'), body = await res.text();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} logid=${logid} ${body.slice(0, 300)}`), { status: res.status });
  const chunks = [], sentences = []; let usage = null, finished = false, err = null;
  for (const line of body.split('\n')) {   // 官方判定顺序:code==0 且有 data = 一块音频;20000000 = 结束;其余 >0 = 失败
    if (!line.trim()) continue;
    let d; try { d = JSON.parse(line); } catch { continue; }
    if ((d.code ?? 0) === 0 && d.data) chunks.push(Buffer.from(d.data, 'base64'));
    if (d.sentence) sentences.push(d.sentence);
    if (d.usage) usage = d.usage;
    if (d.code === 20000000) { finished = true; break; }
    if ((d.code ?? 0) > 0) { err = { code: d.code, message: d.message }; break; }
  }
  if (err || !finished || !chunks.length) throw new Error(`logid=${logid} ${JSON.stringify(err || { finished, chunks: chunks.length })}`);
  const tokens = sentences.flatMap(s => (s.words || []).map(w => ({ text: w.word, start: w.startTime, end: w.endTime })));
  return { pcm: Buffer.concat(chunks), tokens, usage, meta: { logid, sentences } };
}
