// 时间轴 → 字幕(画面烧录与 .srt 共用同一份)+ 页面数据文件(window.TL、window.SUBS)。
// 中文规则:每行 ≤ maxChars 字(不计空格,默认 20);句中逗号换空格、顿号保留;句末 。;:—— 去掉、问号保留;
//   数字只按本期转换表转(conversions),表外一律保留中文;keep 里的说法断言原样出现;某个分句仍超长时用 breaks 里的人工断点。
// 英文规则:每行 ≤ maxChars 字符(默认 42);优先在 , ; : — ? 后断,其次各行均衡;原文一字不改(直引号换弯引号)。
// 每条字幕至少 5/6 秒(Netflix 一手):同一句里某行不够长,就把下一行推迟出现,前提是推迟后下一行也够长。
// 每期设定放 <brief>/subtitles.json(可选):{ "conversions": [["一九二八年","1928 年"]], "keep": ["两个人"], "breaks": {"原分句": "前半|后半"} }
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT } from './paths.mjs';
import { loadChannel, loadVoice, fill } from './config.mjs';
import { stripPunct } from './script.mjs';

const vlen = s => s.replace(/\s/g, '').length;
const MIN_CUE = 5 / 6 + 0.002;

function zhCues(tl, cfg, MAX, convLog) {
  const map = (cfg.conversions || []).slice().sort((a, b) => b[0].length - a[0].length);
  const spaceDigits = s => s.replace(/([0-9])(?=[一-鿿])/g, '$1 ').replace(/([一-鿿])(?=[0-9])/g, '$1 ').replace(/ {2,}/g, ' ');
  const convert = (text, id) => {
    let out = '', i = 0;
    while (i < text.length) { const hit = map.find(([k]) => text.startsWith(k, i)); if (hit) { out += hit[1]; convLog?.push({ id, from: hit[0], to: hit[1] }); i += hit[0].length; } else out += text[i++]; }
    return spaceDigits(out);
  };
  const BREAKS = cfg.breaks || {};
  const cues = [], S = tl.sentences;
  S.forEach((s, si) => {
    const clauses = []; let cur = null;
    s.parts.forEach((p, pi) => {
      const last = pi === s.parts.length - 1;
      let raw = p.text.replace(/[,，]$/, '');
      if (last) raw = raw.replace(/(——|[。；;：:])$/, '').replace(/[?？]$/, '？');
      if (!cur) { cur = { subs: [], start: p.start, end: p.end }; clauses.push(cur); }
      cur.subs.push({ raw, start: p.start, end: p.end, words: [...stripPunct(p.text)].length });
      cur.end = p.end;
      if (!/、$/.test(p.text)) cur = null;
    });
    const disp = t => convert(t.replace(/"([^"]*)"/g, '“$1”').replace(/"/g, '”'), s.id);
    const units = [];
    for (const c of clauses) {
      const whole = c.subs.map(x => x.raw).join('');
      if (vlen(convert(whole)) <= MAX) { units.push({ text: disp(whole), start: c.start }); continue; }
      for (const x of c.subs) {
        const plain = x.raw.replace(/、$/, ''), key = plain.replace(/["“”]/g, '');
        if (vlen(convert(plain)) <= MAX || !BREAKS[key]) { units.push({ text: disp(plain), start: x.start, cont: true }); continue; }
        let acc = 0;
        for (const pc of BREAKS[key].split('|')) { units.push({ text: disp(pc), start: x.start + (x.end - x.start) * acc / x.words, cont: true }); acc += [...stripPunct(pc)].length; }
      }
    }
    const n = units.length, join = (i, j) => units.slice(i, j).map(u => u.text).join(' ');
    const best = Array(n + 1).fill(null); best[0] = { lines: 0, cost: 0, prev: -1 };
    for (let j = 1; j <= n; j++) for (let i = 0; i < j; i++) {
      if (!best[i]) continue; const L = vlen(join(i, j)); if (L > MAX) continue;
      const cand = { lines: best[i].lines + 1, cost: best[i].cost + (MAX - L) ** 2, prev: i };
      if (!best[j] || cand.lines < best[j].lines || (cand.lines === best[j].lines && cand.cost < best[j].cost)) best[j] = cand;
    }
    if (!best[n]) throw new Error(`${s.id}「${s.text}」有一段超过 ${MAX} 字又没有人工断点:在 subtitles.json 的 breaks 里加一条`);
    const cuts = []; for (let j = n; j > 0; j = best[j].prev) cuts.unshift([best[j].prev, j]);
    const lines = cuts.map(([i, j]) => ({ text: join(i, j), start: units[i].start }));
    for (let k = 0; k + 1 < lines.length; k++) {
      const st = k ? lines[k].start : s.start, nextEnd = lines[k + 2]?.start ?? s.end;
      if (lines[k + 1].start - st < MIN_CUE && nextEnd - (st + MIN_CUE) >= MIN_CUE) lines[k + 1].start = st + MIN_CUE;
    }
    lines.forEach((l, k) => {
      const next = lines[k + 1], nextSentStart = S[si + 1]?.start ?? s.end + 1.5;
      let end = next ? next.start : Math.min(nextSentStart, s.end + 0.4);
      if (!next && nextSentStart - end < 0.35) end = nextSentStart;
      cues.push({ id: s.id, para: s.para, start: +(k ? l.start : s.start).toFixed(3), end: +end.toFixed(3), text: l.text.trim() });
    });
  });
  return cues;
}

const curly = s => s.replace(/"(?=\w)/g, '“').replace(/"/g, '”').replace(/'/g, '’');
function enCues(tl, MAX) {
  const cues = [], S = tl.sentences;
  S.forEach((s, si) => {
    const T = s.tokens, n = T.length;
    if (!T) throw new Error('英文时间轴缺 tokens(用引擎的 narrate 重新生成)');
    const len = (i, j) => T.slice(i, j).map(t => t.t).join(' ').length;
    const best = Array(n + 1).fill(null); best[0] = { lines: 0, cost: 0, prev: -1 };
    for (let j = 1; j <= n; j++) for (let i = 0; i < j; i++) {
      if (!best[i]) continue; const L = len(i, j); if (L > MAX && j - i > 1) continue;
      const punct = j < n && /[,;:—?]$/.test(T[j - 1].t) ? 250 : 0;
      const cand = { lines: best[i].lines + 1, cost: best[i].cost + (MAX - L) ** 2 - punct, prev: i };
      if (!best[j] || cand.lines < best[j].lines || (cand.lines === best[j].lines && cand.cost < best[j].cost)) best[j] = cand;
    }
    const cuts = []; for (let j = n; j > 0; j = best[j].prev) cuts.unshift([best[j].prev, j]);
    const st = cuts.map(([i], k) => k ? T[i].a : s.start);
    for (let k = 0; k + 1 < st.length; k++) {   // 每条至少 5/6 秒(与中文同规,2026-10-08 起)
      const nextEnd = st[k + 2] ?? s.end;
      if (st[k + 1] - st[k] < MIN_CUE && nextEnd - (st[k] + MIN_CUE) >= MIN_CUE) st[k + 1] = st[k] + MIN_CUE;
    }
    cuts.forEach(([i, j], k) => {
      const next = cuts[k + 1], nextSentStart = S[si + 1]?.start ?? s.end + 1.5;
      let end = next ? st[k + 1] : Math.min(nextSentStart, s.end + 0.4);
      if (!next && nextSentStart - end < 0.35) end = nextSentStart;
      cues.push({ id: s.id, para: s.para, start: +st[k].toFixed(3), end: +end.toFixed(3), text: curly(T.slice(i, j).map(t => t.t).join(' ')) });
    });
  });
  return cues;
}

const srtTime = t => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };

export function subs({ ep, channel, lang, out, data }) {
  const ch = loadChannel(channel), langs = Object.keys(loadVoice(ch.dir).voices);
  lang = lang || langs[0];
  const suf = lang === langs[0] ? '' : '.' + lang;
  const OUT = out ? path.resolve(out) : path.join(PROJECT, fill(ch.paths.out, ep));
  const tl = JSON.parse(fs.readFileSync(path.join(OUT, `timeline${suf}.json`), 'utf8'));
  const cfgFile = path.join(PROJECT, fill(ch.paths.brief, ep), `subtitles${suf}.json`);
  const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
  const MAX = cfg.maxChars || ch.subtitles?.maxChars?.[lang] || (lang === 'zh' ? 20 : 42);
  const convLog = [];
  const cues = lang === 'zh' ? zhCues(tl, cfg, MAX, convLog) : enCues(tl, MAX);
  const problems = [];
  if (lang === 'zh') {
    const over = cues.filter(c => vlen(c.text) > MAX); if (over.length) problems.push(`超 ${MAX} 字:${over.map(c => c.text).join(' / ')}`);
    const all = cues.map(c => c.text.replace(/\s/g, '')).join('');
    const lost = (cfg.keep || []).filter(k => !all.includes(k)); if (lost.length) problems.push(`要保留中文的说法在字幕里缺失:${lost.join('、')}`);
  }
  const bad = cues.filter((c, i) => !(c.end > c.start) || (cues[i + 1] && c.end > cues[i + 1].start + 1e-6));
  if (bad.length) problems.push(`时间不单调:${bad.slice(0, 3).map(c => c.id).join('、')}`);
  if (problems.length) throw new Error(problems.join(';'));
  fs.writeFileSync(path.join(OUT, `${ep}${suf}.srt`), cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n'));
  const dataFile = data ? path.resolve(data) : path.join(PROJECT, fill(ch.paths.data || path.join(path.dirname(ch.paths.page), 'data-{ep}.js'), ep).replace(/\.js$/, suf + '.js'));
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, `// 由引擎 subs 生成,勿手改\nwindow.TL=${JSON.stringify(tl)};\nwindow.SUBS=${JSON.stringify(cues)};\n`);
  return { cues: cues.length, longest: Math.max(...cues.map(c => lang === 'zh' ? vlen(c.text) : c.text.length)), conversions: convLog.length, srt: path.join(OUT, `${ep}${suf}.srt`), data: dataFile };
}
