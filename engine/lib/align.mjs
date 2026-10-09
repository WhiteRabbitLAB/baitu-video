// 把稿子的每个单位(中文 = 字,英文 = 词)对到音频时间上。两条路:
//   fromTokens:接口给了时间戳 ⇒ 按顺序逐个对(与作者旧脚本同一做法;字数对不上会记进 notes)
//   whisper:接口不给 ⇒ 本机 whisper-cli 转写,再用最长公共子序列对齐;没对上的单位在前后已知时间之间均分
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { SR } from './audio.mjs';
import { stripPunct, normWord, units } from './script.mjs';
import { CACHE } from './paths.mjs';
import { readEnv } from './config.mjs';

// whisper 模型文件(单一驻地,doctor 也用它):环境变量 / 项目 .env 里的 WHISPER_MODEL → 项目 cache/whisper/ggml-medium.bin → 作者机器上的旧位置;都没有就返回项目里的默认位置(doctor 据此提示下载到哪)
export const WHISPER_MODEL_DEFAULT = path.join(CACHE, 'whisper/ggml-medium.bin');
export const WHISPER_MODEL = () => process.env.WHISPER_MODEL || readEnv().WHISPER_MODEL
  || [WHISPER_MODEL_DEFAULT, path.join(process.env.HOME || '', 'Library/Caches/vox-asr-models/ggml-medium.bin')].find(f => fs.existsSync(f)) || WHISPER_MODEL_DEFAULT;
const DIG = Object.fromEntries([...'0123456789'].map((d, i) => [d, '零一二三四五六七八九'[i]]));

// 接口时间戳 → 单位序列 [{u, a, b}](秒,已加偏移)
export function unitsFromTokens(tokens, lang, off) {
  if (lang === 'zh') return tokens.flatMap(t => [...stripPunct(t.text)].map(ch => ({ u: ch, a: t.start + off, b: t.end + off })));
  const wordLevel = tokens.some(t => t.text.trim().length > 1);
  if (wordLevel) return tokens.flatMap(t => units(t.text, 'en').map(w => ({ u: w, a: t.start + off, b: t.end + off })));
  const out = []; let cur = null;   // 逐字符 ⇒ 拼成词
  for (const t of tokens) {
    if (/\s/.test(t.text)) { if (cur) out.push(cur); cur = null; continue; }
    if (!cur) cur = { raw: '', a: t.start + off, b: t.end + off };
    cur.raw += t.text; cur.b = t.end + off;
  }
  if (cur) out.push(cur);
  return out.flatMap(w => units(w.raw, 'en').map(u => ({ u, a: w.a, b: w.b })));
}

// whisper 转写一段 PCM → 单位序列(秒,段内;off 为偏移)
export function unitsFromWhisper(pcm, lang, off) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asr-'));
  try {
    const w16 = path.join(dir, 'a.wav');
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-ar', '16000', w16], { input: pcm, maxBuffer: 1 << 30 });
    execFileSync('whisper-cli', ['-m', WHISPER_MODEL(), '-l', lang, '-np', '-ml', '1', ...(lang === 'zh' ? ['--prompt', '以下是普通话的句子,使用简体中文。'] : ['-sow'])   /* 不给提示时 whisper 常把普通话写成繁体,对不上稿子(2026-10-08 实测 edge-tts) */, '-oj', '-of', path.join(dir, 'asr'), '-f', w16], { stdio: 'ignore' });
    const segs = JSON.parse(fs.readFileSync(path.join(dir, 'asr.json'), 'utf8')).transcription;
    const out = [];
    for (const s of segs) {
      const a = s.offsets.from / 1000 + off, b = s.offsets.to / 1000 + off;
      if (lang === 'zh') {
        const chs = [...stripPunct(s.text.replace(/[0-9]/g, d => DIG[d]))];
        chs.forEach((ch, i) => out.push({ u: ch, a: a + (b - a) * i / chs.length, b: a + (b - a) * (i + 1) / chs.length }));
      } else for (const w of s.text.trim().split(/[-–—\s]+/).map(normWord).filter(Boolean)) out.push({ u: w, a, b });
    }
    return out;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 最长公共子序列:返回 A 的下标 → B 的下标(没对上 = -1)
export function lcs(A, B) {
  const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const map = new Array(n).fill(-1); let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j]) map[i++] = j++; else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return map;
}

// 稿子单位 target(字符串数组)对到听到的 heard;返回每个单位的 {a, b, ok}。没对上的在相邻已知时间之间均分。
export function alignLcs(target, heard, t0, t1) {
  const map = lcs(target, heard.map(h => h.u));
  const r = map.map(j => j >= 0 ? { a: heard[j].a, b: heard[j].b, ok: true } : { a: null, b: null, ok: false });
  for (let x = 0; x < r.length; x++) if (r[x].a == null) {
    let y = x; while (y < r.length && r[y].a == null) y++;
    const from = x ? r[x - 1].b : t0, to = y < r.length ? r[y].a : t1;
    for (let z = x; z < y; z++) { r[z].a = from + (to - from) * (z - x) / (y - x); r[z].b = from + (to - from) * (z - x + 1) / (y - x); }
  }
  return r;
}
