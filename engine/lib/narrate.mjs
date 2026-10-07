// 配音:按 voice.md 选的服务,每段整段一次合成(保留模型自己的段内停顿),对齐出每句、每个分句的起止。
// 段与段之间:剪掉每段首尾自带静音,补 pauses.para 秒。某段被接口以「太长」拒绝(或超过 maxChars)⇒ 在最靠近中间的句末拆开,拼接处补 0.4s(写进 notes)。
// 产物:<out>/narration[.lang].wav、timeline[.lang].json(第一种语言不带后缀)。
// 每期设定 <brief>/narration[.lang].json(可选):
//   { "sectionAfter": [3, 7], "sectionGap": 1.2,   第 3、7 段之后是大段落分界,停顿 1.2s(其余段间用 pauses.para)
//     "verbatimParas": [1, 5] }                     这几段改用「逐字朗读」提示(正文像指令时,Gemini 等会当指令执行、不念出来)
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT } from './paths.mjs';
import { loadChannel, loadVoice, fill } from './config.mjs';
import { PROVIDERS } from './providers.mjs';
import { SR, wavFromPcm, trimPcm } from './audio.mjs';
import { loadSentences, units, clauses } from './script.mjs';
import { synthesize } from './tts/index.mjs';
import { unitsFromTokens, unitsFromWhisper, alignLcs } from './align.mjs';

const SPLIT_GAP = 0.4;
const TOO_LONG = /too large|size|length|limit|长度|过长|too long/i;

export async function narrate({ ep, channel, lang, out, paras: only }) {
  const ch = loadChannel(channel), voices = loadVoice(ch.dir).voices;
  lang = lang || Object.keys(voices)[0];
  const v = voices[lang];
  if (!v) throw new Error(`voice.md 里没有 ${lang} 的配音设定`);
  const first = lang === Object.keys(voices)[0], suf = first ? '' : '.' + lang;
  const brief = path.join(PROJECT, fill(ch.paths.brief, ep));
  const scriptFile = [path.join(brief, `script.${lang}.txt`), path.join(brief, lang === 'en' ? 'script-en.txt' : 'script.txt')].find(f => fs.existsSync(f));
  if (!scriptFile) throw new Error(`没找到稿子:${brief}/script.${lang}.txt`);
  const OUT = out ? path.resolve(out) : path.join(PROJECT, fill(ch.paths.out, ep));
  const P = { leadIn: 0.5, para: 0.6, tail: 3, ...v.pauses };
  const ncfgF = path.join(brief, `narration${suf}.json`), NC = fs.existsSync(ncfgF) ? JSON.parse(fs.readFileSync(ncfgF, 'utf8')) : {};
  const VERBATIM = 'Read the following passage aloud exactly as written, every single word including the first sentence, in the same voice and tone:';
  const all = loadSentences(scriptFile, lang);
  const stats = {}, notes = [];
  const buf = []; let n = 0;
  const push = pcm => { buf.push(pcm); n += pcm.length / 2; };
  const sil = sec => push(Buffer.alloc(Math.round(sec * SR) * 2));
  const joinText = ss => ss.map(s => s.text).join(lang === 'zh' ? '' : ' ');

  async function synthPara(p, sents) {
    const text = joinText(sents);
    const vp = (NC.verbatimParas || []).includes(p) ? { ...v, style: v.styleVerbatim || VERBATIM } : v;
    const split = async why => {
      let best = -1, bestD = 1e9, acc = 0;
      sents.forEach((s, i) => { acc += s.text.length; if (/[。.!?！？]$/.test(s.text) && i < sents.length - 1 && Math.abs(acc - text.length / 2) < bestD) { bestD = Math.abs(acc - text.length / 2); best = i; } });
      if (best < 0) throw new Error(`第 ${p} 段太长且找不到句末可拆:${why}`);
      notes.push(`第 ${p} 段${why},在 ${sents[best].id}「${sents[best].text}」之后拆成两次请求,拼接处补 ${SPLIT_GAP}s`);
      const a = await synthPara(p, sents.slice(0, best + 1)), b = await synthPara(p, sents.slice(best + 1));
      b[0].gapBefore = SPLIT_GAP;
      return [...a, ...b];
    };
    if (v.maxChars && text.length > v.maxChars) return split(`超过 maxChars ${v.maxChars}`);
    try { return [{ ...(await synthesize(text, vp, stats)), gapBefore: 0 }]; }
    catch (e) { if (!TOO_LONG.test(e.message)) throw e; return split(`超限(${e.message.slice(0, 120)})`); }
  }

  const useTokens = PROVIDERS[v.provider].timestamps;
  sil(P.leadIn);
  const timeline = [], paraInfo = [];
  const NP = Math.max(...all.map(s => s.para));
  for (let p = 1; p <= NP; p++) {
    if (only && !only.includes(p)) continue;
    const sents = all.filter(s => s.para === p);
    if (p > 1 && (!only || only.indexOf(p) > 0)) sil((NC.sectionAfter || []).includes(p - 1) ? (NC.sectionGap ?? 1.2) : P.para);
    const pieces = await synthPara(p, sents);
    const paraStart = n / SR;
    let heard = [];
    pieces.forEach((pc, k) => {
      if (k) sil(pc.gapBefore);
      const t = trimPcm(pc.pcm, -40, 0.04);
      const lead = (t.byteOffset - pc.pcm.byteOffset) / 2 / SR;
      if (useTokens && pc.tokens?.length) heard = heard.concat(unitsFromTokens(pc.tokens, lang, n / SR - lead));
      else heard = heard.concat(unitsFromWhisper(t, lang, n / SR));
      push(t);
    });
    const target = sents.flatMap(s => units(s.text, lang));
    let times;
    if (useTokens && pieces.every(pc => pc.tokens?.length)) {   // 按顺序逐个对(旧做法)
      times = target.map((u, i) => heard[i] ? { a: heard[i].a, b: heard[i].b, ok: heard[i].u === u } : { a: NaN, b: NaN, ok: false });
      if (heard.length !== target.length) notes.push(`第 ${p} 段:接口时间戳单位数 ${heard.length} ≠ 原文 ${target.length}`);
    } else times = alignLcs(target, heard, paraStart, n / SR);
    let k = 0;
    for (const s of sents) {
      const us = units(s.text, lang), got = times.slice(k, k + us.length);
      const match = useTokens ? heard.slice(k, k + us.length).map(h => h.u).join('|') === us.join('|') : got.every(g => g.ok);
      const parts = []; let ci = 0;
      for (const c of clauses(s.text, lang)) {
        const m = units(c, lang).length; if (!m) continue;
        const seg = got.slice(ci, ci + m); ci += m;
        parts.push({ text: c, start: +seg[0].a.toFixed(3), end: +seg.at(-1).b.toFixed(3) });
      }
      const row = { id: s.id, para: p, idx: s.idx, text: s.text, start: +(got[0]?.a ?? NaN).toFixed(3), end: +(got.at(-1)?.b ?? NaN).toFixed(3), match };
      if (!match) row[useTokens ? 'got' : 'missing'] = useTokens ? heard.slice(k, k + us.length).map(h => h.u).join(lang === 'zh' ? '' : ' ') : us.filter((_, i) => !got[i].ok).join(lang === 'zh' ? '' : ' ');
      if (lang !== 'zh') {   // 英文字幕按原文的词(含标点)断行,要每个词的起止
        let wi = 0;
        row.tokens = s.text.split(/\s+/).filter(Boolean).map(t => { const m = units(t, lang).length, g = got.slice(wi, wi + m); wi += m; return g.length ? { t, a: +g[0].a.toFixed(3), b: +g.at(-1).b.toFixed(3) } : { t, a: null, b: null }; });
        row.tokens.forEach((t, i, arr) => { if (t.a == null) { const prev = arr[i - 1]; t.a = t.b = prev ? prev.b : row.start; } });
      }
      timeline.push({ ...row, parts });
      k += us.length;
    }
    paraInfo.push({ para: p, start: +paraStart.toFixed(3), end: +(n / SR).toFixed(3), duration: +(n / SR - paraStart).toFixed(3), requests: pieces.length });
  }
  sil(P.tail);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `narration${suf}.wav`), wavFromPcm(Buffer.concat(buf)));
  const duration = +(n / SR).toFixed(3);
  const unmatched = timeline.filter(s => !s.match).length;
  fs.writeFileSync(path.join(OUT, `timeline${suf}.json`), JSON.stringify({
    method: useTokens ? 'api-timestamps' : 'whisper', provider: v.provider, voice: v.voice, lang, sampleRate: SR,
    leadIn: P.leadIn, paraGap: P.para, tail: P.tail, ...(NC.sectionAfter ? { sectionAfter: NC.sectionAfter, sectionGap: NC.sectionGap ?? 1.2 } : {}), duration, paragraphs: paraInfo, notes, sentences: timeline,
  }, null, 1));
  return { duration, stats, notes, unmatched, sentences: timeline.length, out: OUT };
}
