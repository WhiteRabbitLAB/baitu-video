// 「画面复述字幕」检查:画面上的字把正在念的那句原样再写一遍(字幕已经有了,画面再抄一遍 = 浪费画面)。
//   node .claude/skills/baitu-video/engine/tools/check-echo.mjs <页面相对路径?render> <时长秒> [--lang zh|en] [--every 1] [--min 10] [--json]
// 做法:逐秒调 window.render(t),收集看得见的 <text>(累计不透明度 ≥ 0.05、尺寸非 0),按 DOM 顺序拼成一串;
// 画面底部 16% 的字当字幕,不算画面字。和当前那条字幕(window.SUBS)比,去掉标点后最长公共连续片段 ≥ --min 个字(默认中文 10 字、英文 7 词)= 这一秒在复述。
// 阳性对照:有字幕的秒里,底部字幕带读到的字必须和字幕对得上(至少一半的秒);对不上 = 探针看不见字幕,结果不算数(退出码 3)。
// 标题、大字报式的关键词(短于 --min)不算复述。
// 已知局限:被 clipPath 裁掉一部分的字(手写入场写到一半)按整串算——它马上就要整句写出来,照样算复述。
import { chromium } from 'playwright';
import path from 'node:path';
import { PROJECT as ROOT } from '../lib/paths.mjs';
const args = process.argv.slice(2);
const take = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const EVERY = +take('every', 1), JSON_OUT = args.includes('--json'); if (JSON_OUT) args.splice(args.indexOf('--json'), 1);
let MIN = take('min');
const LANG_ARG = take('lang');
const [page, DUR] = args;
if (!page || !DUR) { console.error('用法:check-echo.mjs <页面?render> <时长秒> [--every 1] [--min 10] [--json]'); process.exit(2); }
const [file, query = ''] = page.split('?');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
await p.goto('file://' + (path.isAbsolute(file) ? file : path.join(ROOT, file)) + (query ? '?' + query : ''));
await p.evaluate(() => window.fontsReady);
const LANG = LANG_ARG || (/(^|&)lang=en/.test(query) ? 'en' : 'zh'), isEn = LANG === 'en'; MIN = +(MIN || (isEn ? 7 : 10));   // 关键短语标注(「彩虹的所有颜色」「every color of the rainbow」)不算复述;整句抄字幕才算
const norm = s => isEn ? s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean) : [...s.replace(/[\s\p{P}\p{S}]/gu, '')];
// 最长公共连续片段(按单位)
const lcsub = (a, b) => { let best = 0, at = 0; const dp = new Array(b.length + 1).fill(0); for (let i = 1; i <= a.length; i++) { let prev = 0; for (let j = 1; j <= b.length; j++) { const tmp = dp[j]; dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : 0; if (dp[j] > best) { best = dp[j]; at = i; } prev = tmp; } } return { len: best, text: a.slice(at - best, at).join(isEn ? ' ' : '') }; };
const hits = [], seen = { cue: 0, subOk: 0 };
for (let t = 0; t < +DUR; t += EVERY) {
  const r = await p.evaluate(t => {
    window.render(t);
    const H = innerHeight, screen = [], sub = [];
    for (const el of document.querySelectorAll('text')) {
      const s = el.textContent; if (!s || !s.trim()) continue;
      const bb = el.getBoundingClientRect(); if (!bb.width || !bb.height || bb.right <= 0 || bb.bottom <= 0 || bb.left >= innerWidth || bb.top >= H) continue;   // 画面外的不算
      let op = 1, n = el, hidden = false; while (n && n.nodeType === 1) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } op *= +cs.opacity * (n === el ? Math.max(+(cs.fillOpacity || 1) * (cs.fill === 'none' ? 0 : 1), cs.stroke && cs.stroke !== 'none' ? +(cs.strokeOpacity || 1) : 0) : 1); n = n.parentNode; }   // computed opacity 已含 opacity 属性,别再乘一次
      if (hidden || op < .05) continue;
      (bb.top > H * .84 ? sub : screen).push({ s, l: bb.left, r: bb.right, t: bb.top, h: bb.height });
    }
    const cue = (window.SUBS || []).find(c => t >= c.start && t < c.end);
    // 拼字:相邻两个文字节点之间有明显空隙或换行就补一个空格(英文按词比时要它;中文比对时空格会被去掉)
    // 两个节点都不止一个字符(英文逐词渲染)也补空格,不靠间距
    const join = a => a.reduce((o, x, i) => { const p = a[i - 1]; return o + (p && (Math.abs(x.t - p.t) > p.h * .5 || x.l - p.r > p.h * .2 || (p.s.trim().length > 1 && x.s.trim().length > 1)) ? ' ' : '') + x.s; }, '');
    return { screen: join(screen), sub: join(sub), cue: cue ? cue.text : '' };
  }, t);
  if (!r.cue) continue;
  seen.cue++;
  const c = norm(r.cue);
  if (lcsub(norm(r.sub), c).len >= Math.min(c.length, 4)) seen.subOk++;
  const m = lcsub(norm(r.screen), c);
  if (m.len >= MIN) hits.push({ t: +t.toFixed(2), cue: r.cue, echo: m.text });
}
await b.close();
const broken = seen.cue === 0 || seen.subOk < seen.cue / 2;   // 一秒字幕都没读到(页面没有 window.SUBS)也算失效,不能当 0 处复述
const res = { seconds: seen.cue, hits: hits.length, share: seen.cue ? +(hits.length / seen.cue).toFixed(3) : 0, control: `${seen.subOk}/${seen.cue} 秒在字幕带读到了字幕`, broken, examples: hits.slice(0, 8) };
console.log(JSON_OUT ? JSON.stringify(res) : `${seen.cue} 秒有字幕,其中 ${hits.length} 秒画面在复述字幕(连续 ≥ ${MIN} 个${isEn ? '词' : '字'});阳性对照:${res.control}\n` + hits.slice(0, 8).map(h => `t=${h.t}s 画面「${h.echo}」 ← 字幕「${h.cue}」`).join('\n'));
if (broken) { console.error(seen.cue ? '探针失效:字幕带读不到字幕(页面没用 kit.subtitle?),结果不算数' : '探针失效:页面没有 window.SUBS(没引 data-<期>.js?),没有字幕可比'); process.exit(3); }
