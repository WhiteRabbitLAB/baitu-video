// 「文字出画 / 叠字」检查(验收:竖版成片、竖封面必跑;横版也可用)
//   node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs <页面相对路径?参数> <宽> <高> [时刻 …] [--margin 40]
//   例:node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs "video/lesson-03.html?render&vert" 1080 1920 0 5 30
//       node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs "video/lesson-03.html?render&cover=3x4-a" 1080 1440
// 做法:按给定视口打开页面;有 vert 参数时逐个时刻调 window.vertFrame(t),否则调 window.render(t);封面(cover 参数)只等 coverReady 查一次。
// 量每个可见 <text> 的实际边框(getBoundingClientRect,含所有缩放 / 平移),超出画面或离边不到安全边距的都报出来。
// 叠字:两串可见的字边框重叠面积 > 较小那串的 20% 就报(同一串字的阴影 / 描边副本 —— 字相同、位置差 <10px —— 不算)。
// 不可见的不算:祖先链上累计不透明度 < 0.05、display:none、尺寸为 0。有问题退出码 1。页面路径可以是绝对路径(测试页)。
import { chromium } from 'playwright';
import path from 'node:path';
const args = process.argv.slice(2), mi = args.indexOf('--margin'), M = mi >= 0 ? +args.splice(mi, 2)[1] : 40;
const [page, W, H, ...ts] = args;
if (!page || !W || !H) { console.error('用法:node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs <页面?参数> <宽> <高> [时刻 …] [--margin 40]'); process.exit(2); }
import { PROJECT as ROOT } from '../lib/paths.mjs';
const [file, query = ''] = page.split('?');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: +W, height: +H } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
await p.goto('file://' + (path.isAbsolute(file) ? file : path.join(ROOT, file)) + (query ? '?' + query : ''));
await p.evaluate(() => window.fontsReady);
const isCover = /(^|&)cover=/.test(query), isVert = /(^|&)vert(&|$)/.test(query);
if (isCover) await p.evaluate(() => window.coverReady);
const times = isCover ? [null] : (ts.length ? ts.map(Number) : [0]);
let bad = 0;
for (const t of times) {
  if (t !== null) await p.evaluate(([t, v]) => v ? window.vertFrame(t) : window.render(t), [t, isVert]);
  const hits = await p.evaluate(([W, H, M]) => {
    const vis = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; const a = e.getAttribute && e.getAttribute('opacity'); if (a != null) o *= +a; } return o; };
    const out = [], seen = [];
    // 一串字可能被拆成好几个 <text>(逐字手写、混排字体):同一个父节点下的合并成一串再比
    const runs = new Map();
    document.querySelectorAll('text').forEach(el => {
      const txt = el.textContent.trim(); if (!txt) return;
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
      if (vis(el) < .05) return;
      const over = [r.left < M && 'left', r.top < M && 'top', r.right > W - M && 'right', r.bottom > H - M && 'bottom'].filter(Boolean);
      if (over.length) out.push({ txt: txt.slice(0, 24), over: over.join('/'), box: [r.left, r.top, r.right, r.bottom].map(v => Math.round(v)) });
      const k = el.parentNode, q = runs.get(k);
      if (q && Math.abs(q.b - r.bottom) < r.height * .5) { q.txt += txt; q.l = Math.min(q.l, r.left); q.t = Math.min(q.t, r.top); q.r = Math.max(q.r, r.right); q.b = Math.max(q.b, r.bottom); }
      else { const n = { txt, l: r.left, t: r.top, r: r.right, b: r.bottom }; runs.set(k, n); seen.push(n); }
    });
    // 字框按字号留了上下空隙,收紧 15% 再比,免得上下两行紧排被当成叠字
    const tight = a => { const h = (a.b - a.t) * .15; return { ...a, t: a.t + h, b: a.b - h }; };
    for (let i = 0; i < seen.length; i++) for (let j = i + 1; j < seen.length; j++) {
      const a = tight(seen[i]), b = tight(seen[j]);
      const iw = Math.min(a.r, b.r) - Math.max(a.l, b.l), ih = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (iw <= 0 || ih <= 0) continue;
      if (a.txt === b.txt && Math.abs(a.l - b.l) < 10 && Math.abs(a.t - b.t) < 10) continue;
      const small = Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
      if (iw * ih > small * .2) out.push({ txt: `${a.txt.slice(0, 12)}」×「${b.txt.slice(0, 12)}`, over: '叠字', box: [Math.max(a.l, b.l), Math.max(a.t, b.t), Math.min(a.r, b.r), Math.min(a.b, b.b)].map(v => Math.round(v)) });
    }
    return out;
  }, [+W, +H, M]);
  const label = t === null ? '封面' : `t=${t}`;
  if (hits.length) { bad += hits.length; console.log(`${label}:${hits.length} 处出画 / 贴边 / 叠字`); hits.forEach(h => console.log(`  「${h.txt}」 ${h.over}  框 ${h.box.join(',')}`)); }
  else console.log(`${label}:0 处`);
}
await b.close();
console.log(bad ? `不合格:共 ${bad} 处(安全边距 ${M}px)` : `合格:0 处出画、0 处叠字(安全边距 ${M}px)`);
process.exit(bad ? 1 : 0);
