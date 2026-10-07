// 合成一段文本:按服务分发 + 缓存 + 重试 + 日志。返回 { pcm(24k 单声道 s16), tokens?(接口给的时间戳,秒) }。
// 缓存键 = 服务 + 设定 + 文本;改语速但服务不支持原生调速时,缓存的是原始音频,变速在缓存之后做(改语速不重新花钱)。
// 日志不记密钥、不记带签名的下载链接。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CACHE } from '../paths.mjs';
import { PROVIDERS, loadProvider } from '../providers.mjs';
import { readEnv } from '../config.mjs';
import { wavFromPcm, pcmOfWav, atempo } from '../audio.mjs';

const DIR = path.join(CACHE, 'tts'), LOG = path.join(CACHE, 'tts-log.jsonl');
const RETRY = s => s == null || s === 429 || s >= 500;

export function keyFor(v) {
  const p = PROVIDERS[v.provider];
  const name = v.keyEnv || p.keyEnv;
  if (!name) return null;
  const k = process.env[name] || readEnv()[name];
  if (!k) throw new Error(`${p.name} 的密钥 ${name} 没设(写进项目的 .env)`);
  return k;
}

export async function synthesize(text, v, stats = {}) {
  const p = PROVIDERS[v.provider];
  if (!p) throw new Error(`不认识的配音服务「${v.provider}」;可选:${Object.keys(PROVIDERS).join('、')}`);
  const mod = await loadProvider(v.provider);
  const legacy = !!mod.cacheKey;   // 豆包沿用旧缓存文件名与格式
  const k = legacy ? mod.cacheKey(text, v) : v.provider + '-' + crypto.createHash('sha256').update(JSON.stringify({ text, v: { ...v, ...(mod.nativeSpeed ? {} : { speed: undefined }) } })).digest('hex').slice(0, 24);
  const wav = path.join(DIR, k + '.wav'), meta = path.join(DIR, k + '.json');
  let pcm, tokens = null;
  if (fs.existsSync(wav)) {
    stats.hits = (stats.hits || 0) + 1;
    pcm = pcmOfWav(fs.readFileSync(wav));
    const m = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : {};
    tokens = m.tokens || (m.sentences ? m.sentences.flatMap(s => (s.words || []).map(w => ({ text: w.word, start: w.startTime, end: w.endTime }))) : null);
  } else {
    const key = keyFor(v);
    let r, err, delay = 2000;
    for (let attempt = 0; attempt <= 3; attempt++) {
      try { r = await mod.synth(text, v, key); err = null; } catch (e) { err = e; }
      fs.mkdirSync(DIR, { recursive: true });
      fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), provider: v.provider, voice: v.voice, attempt, ok: !err, err: err?.message?.slice(0, 300), chars: text.length, usage: r?.usage }) + '\n');
      if (!err || !RETRY(err.status)) break;
      await new Promise(z => setTimeout(z, delay)); delay *= 2;
    }
    if (err) throw Object.assign(new Error(`${p.name} 合成失败:「${text.slice(0, 30)}…」 ${err.message}`), { status: err.status });
    pcm = r.pcm; tokens = r.tokens || null;
    fs.writeFileSync(wav, wavFromPcm(pcm));
    fs.writeFileSync(meta, JSON.stringify(legacy ? { text, usage: r.usage, ...r.meta } : { provider: v.provider, voice: v.voice, text, tokens, usage: r.usage }));
    stats.calls = (stats.calls || 0) + 1; stats.chars = (stats.chars || 0) + text.length;
  }
  if (!mod.nativeSpeed && v.speed && v.speed !== 1) { pcm = atempo(pcm, v.speed); tokens = tokens && tokens.map(t => ({ ...t, start: t.start / v.speed, end: t.end / v.speed })); }
  return { pcm, tokens };
}
