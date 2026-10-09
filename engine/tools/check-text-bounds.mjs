// 「文字出画 / 叠字」检查(验收:竖版成片、竖封面必跑;横版也可用)
//   node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs <页面相对路径?参数> <宽> <高> [时刻 …] [--margin 40]
//        [--frame x,y,w,h] [--scan 起-止:步长] [--min-run 0.3]
//   例:node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs "video/lesson-03.html?render&vert" 1080 1920 0 5 30
//       node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs "video/lesson-03.html?render&cover=3x4-a" 1080 1440
//       node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs "video/lesson-03.html?render" 1920 1080 --frame 36,36,1848,870 --scan 0-205:0.1
// 做法:按给定视口打开页面;有 vert 参数时逐个时刻调 window.vertFrame(t),否则调 window.render(t);封面(cover 参数)只等 coverReady 查一次。
// 量每个可见 <text> 的实际边框(getBoundingClientRect,含所有缩放 / 平移),超出画面或离边不到安全边距的都报出来。
// 叠字:两串可见的字边框重叠面积 > 较小那串的 20% 就报(同一串字的阴影 / 描边副本 —— 字相同、位置差 <10px —— 不算)。
// 不可见的不算:祖先链上累计不透明度 < 0.05、display:none、尺寸为 0。有问题退出码 1。页面路径可以是绝对路径(测试页)。
// --frame(印刷白边这类「画面框 + 框外留白」的版面,第 11 期起):框里的字必须整个在框里(压框边 = 出格);整块在框外的字被框裁掉、看不见,不算;
//   框下方的字(字幕、章节条)仍按画布边 + 安全边距查。叠字只在同一区里比。
// --scan:按步长逐帧扫一段时间;页面有 window.inTransition(t) 且返回 true 的时刻跳过(转场里新旧两镜头的字会被裁剪交错,框量不准)。
//   出框 / 贴边连续 ≥ --min-run 秒(默认 0.3)才报(滑入、滚出画面的一两帧不算);叠字、压字出现一帧就报(--min-run-overlap,默认 0)。
// --objects(字和素材互压,第 11 期起;--frame 时默认开):在每串字的框里取 6×3 个采样点,逐个问画面上的图形(path/rect/circle…)盖没盖住这个点
//   (isPointInFill / isPointInStroke,按真实形状,不按外框)。
//   · 图形画在字前面(在字底下)、只盖住一部分采样点 ⇒「压在素材上」(字骑在卡片、托盘、鱼的边上);全部盖住 = 字的底(卡片纸面),不算。
//   · 图形画在字后面(压在字上)、盖住任何一个采样点 ⇒「被素材压住」。
//   不算:defs / clipPath / pattern 里的、透明度 < 0.05 的、宽度 ≥ 画面 90% 的整幅底(水层、背景)、祖先或自己带 data-over 的(故意压字的划线、荧光笔、装饰点)。
//   页面可以声明 window.CHECK = { frame:[x,y,w,h], margin } —— 不传 --frame 时用它;验收会据此扫正片。
import { chromium } from 'playwright';
import path from 'node:path';
const args = process.argv.slice(2);
const take = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? args.splice(i, 2)[1] : d; };
const OBJ_FLAG = args.includes('--objects'); if (OBJ_FLAG) args.splice(args.indexOf('--objects'), 1);
let M = +take('margin', 40), FR = take('frame'), SCAN = take('scan'); const MINRUN = +take('min-run', .3), MINRUN_OV = +take('min-run-overlap', 0);   // 出框 / 贴边:滑入滑出的一两帧不算;叠字 / 压字:一帧都不放过(owner 2026-10-09:0.4 秒的压字肉眼看得见)
const [page, W, H, ...ts] = args;
if (!page || !W || !H) { console.error('用法:node .claude/skills/baitu-video/engine/tools/check-text-bounds.mjs <页面?参数> <宽> <高> [时刻 …] [--margin 40] [--frame x,y,w,h] [--scan 起-止:步长] [--min-run 0.3]'); process.exit(2); }
import { PROJECT as ROOT } from '../lib/paths.mjs';
const [file, query = ''] = page.split('?');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: +W, height: +H } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
await p.goto('file://' + (path.isAbsolute(file) ? file : path.join(ROOT, file)) + (query ? '?' + query : ''));
await p.evaluate(() => window.fontsReady);
const isCover = /(^|&)cover=/.test(query), isVert = /(^|&)vert(&|$)/.test(query);
if (isCover) await p.evaluate(() => window.coverReady);
let times = isCover ? [null] : (ts.length ? ts.map(Number) : [0]);
if (SCAN && !isCover) { const [, a, z, st] = SCAN.match(/^([\d.]+)-([\d.]+):([\d.]+)$/) || []; if (!st) throw new Error('--scan 写成 起-止:步长,如 0-205:0.1'); times = []; for (let t = +a; t <= +z + 1e-9; t += +st) times.push(+t.toFixed(3)); }
const PC = await p.evaluate(() => window.CHECK || null);
if (!FR && PC?.frame && !isCover && !isVert) FR = PC.frame.join(',');   // 封面、竖版各有自己的版面,不套正片的画面框
if (PC?.margin != null && FR && !process.argv.includes('--margin')) M = PC.margin;
const frame = FR ? FR.split(',').map(Number) : null, OBJ = OBJ_FLAG || !!frame;
let bad = 0;
const runs = new Map();   // 扫描模式:问题键 → [时刻…]
for (const t of times) {
  if (t !== null) {
    if (SCAN && await p.evaluate(t => typeof window.inTransition === 'function' && window.inTransition(t), t)) continue;
    await p.evaluate(([t, v]) => v ? window.vertFrame(t) : window.render(t), [t, isVert]);
  }
  const hits = await p.evaluate(([W, H, M, F, OBJ]) => {
    const vis = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; const a = e.getAttribute && e.getAttribute('opacity'); if (a != null) o *= +a; } return o; };
    const out = [], seen = [];
    // 框外的字:祖先里有 clip-path(画面框的裁剪)= 被裁掉看不见;没有 = 框下方的字幕、章节条
    const clipped = el => { for (let e = el.parentElement; e && e.nodeType === 1; e = e.parentElement) if (e.getAttribute('clip-path')) return true; return false; };
    const zone = (r, el) => !F ? 'all' : (r.right <= F[0] || r.left >= F[0] + F[2] || r.bottom <= F[1] || r.top >= F[1] + F[3]) ? (r.top >= F[1] + F[3] - 2 && !clipped(el) ? 'below' : 'hidden') : 'frame';
    // 一串字可能被拆成好几个 <text>(逐字手写、混排字体):同一个父节点下的合并成一串再比
    const runs = new Map();
    document.querySelectorAll('text').forEach(el => {
      const txt = el.textContent.trim(); if (!txt) return;
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
      if (vis(el) < .05) return;
      const z = zone(r, el); if (z === 'hidden') return;
      const over = z === 'frame' ? [r.left < F[0] && 'left', r.top < F[1] && 'top', r.right > F[0] + F[2] && 'right', r.bottom > F[1] + F[3] && 'bottom'].filter(Boolean).map(s => '出框' + s)
        : [r.left < M && 'left', r.top < M && 'top', r.right > W - M && 'right', r.bottom > H - M && 'bottom'].filter(Boolean);
      if (over.length) out.push({ txt: txt.slice(0, 24), over: over.join('/'), box: [r.left, r.top, r.right, r.bottom].map(v => Math.round(v)) });
      const k = el.parentNode, q = runs.get(k);
      if (q && q.z === z && Math.abs(q.b - r.bottom) < r.height * .5) { q.txt += txt; q.l = Math.min(q.l, r.left); q.t = Math.min(q.t, r.top); q.r = Math.max(q.r, r.right); q.b = Math.max(q.b, r.bottom); }
      else { const n = { txt, z, l: r.left, t: r.top, r: r.right, b: r.bottom }; runs.set(k, n); seen.push(n); }
    });
    // 字框按字号留了上下空隙,收紧 15% 再比,免得上下两行紧排被当成叠字
    const tight = a => { const h = (a.b - a.t) * .15; return { ...a, t: a.t + h, b: a.b - h }; };
    for (let i = 0; i < seen.length; i++) for (let j = i + 1; j < seen.length; j++) {
      if (seen[i].z !== seen[j].z) continue;
      const a = tight(seen[i]), b = tight(seen[j]);
      const iw = Math.min(a.r, b.r) - Math.max(a.l, b.l), ih = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (iw <= 0 || ih <= 0) continue;
      if (a.txt === b.txt && Math.abs(a.l - b.l) < 10 && Math.abs(a.t - b.t) < 10) continue;
      const small = Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
      if (iw * ih > small * .2) out.push({ txt: `${a.txt.slice(0, 12)}」×「${b.txt.slice(0, 12)}`, over: '叠字', box: [Math.max(a.l, b.l), Math.max(a.t, b.t), Math.min(a.r, b.r), Math.min(a.b, b.b)].map(v => Math.round(v)) });
    }
    // 字和素材互压
    if (OBJ) {
      const FW = F ? F[2] : W;
      const shapes = [...document.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')].filter(el => !el.closest('defs,clipPath,pattern,mask,filter,[data-over]'))
        .map(el => { const cs = getComputedStyle(el); return { el, r: el.getBoundingClientRect(), fill: cs.fill !== 'none', stroke: cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 }; })
        .filter(s => (s.fill || s.stroke) && s.r.width > 0 && s.r.width < FW * .9 && vis(s.el) >= .05);
      // 祖先上的 clip-path(只认 url(#id) 里的 path / rect / circle):被裁掉的部分不算
      const inClip = (el, x, y) => {
        for (let e = el.parentElement; e && e.nodeType === 1; e = e.parentElement) {
          const cp = e.getAttribute('clip-path'); if (!cp) continue;
          const c = document.getElementById((cp.match(/#([^)]+)/) || [])[1]); if (!c) continue;
          const m = e.getScreenCTM(); if (!m) continue; const q = new DOMPoint(x, y).matrixTransform(m.inverse());
          if (![...c.querySelectorAll('path,rect,circle,ellipse,polygon')].some(g => g.isPointInFill(q))) return false;
        }
        return true;
      };
      const textRuns = new Map();
      document.querySelectorAll('text').forEach(el => { if (!el.textContent.trim() || vis(el) < .05) return; const r = el.getBoundingClientRect(); if (r.width < 1) return; if (F && zone(r, el) !== 'frame') return; const k = el.parentNode; if (!textRuns.has(k)) textRuns.set(k, []); textRuns.get(k).push({ el, r }); });
      for (const [, els] of textRuns) {
        const txt = els.map(e => e.el.textContent).join('').trim();
        const box = { l: Math.min(...els.map(e => e.r.left)), r: Math.max(...els.map(e => e.r.right)), t: Math.min(...els.map(e => e.r.top)), b: Math.max(...els.map(e => e.r.bottom)) };
        const pts = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) pts.push([box.l + (box.r - box.l) * (.08 + .84 * i / 5), box.t + (box.b - box.t) * (.3 + .4 * j / 2)]);
        const first = els[0].el, found = new Set(), hitsS = [];
        for (let i = pts.length - 1; i >= 0; i--) if (!inClip(first, pts[i][0], pts[i][1])) pts.splice(i, 1);   // 字自己被裁掉的部分不比
        if (pts.length < 6) continue;
        for (const s of shapes) {
          if (s.r.right < box.l || s.r.left > box.r || s.r.bottom < box.t || s.r.top > box.b) continue;
          if (els.some(e => e.el.contains(s.el) || s.el.contains(e.el))) continue;
          const m = s.el.getScreenCTM(); if (!m) continue; const inv = m.inverse();
          let n = 0; for (const [x, y] of pts) { const q = new DOMPoint(x, y).matrixTransform(inv); if (((s.fill && s.el.isPointInFill(q)) || (s.stroke && s.el.isPointInStroke(q))) && inClip(s.el, x, y)) n++; }
          if (n) hitsS.push({ s, n, after: !!(first.compareDocumentPosition(s.el) & Node.DOCUMENT_POSITION_FOLLOWING) });
        }
        // 字的底 = 画在字前面、盖住全部采样点的最后一个图形;它底下的东西被它遮住了,不算
        const bg = hitsS.filter(h => !h.after && h.n === pts.length).pop();
        for (const h of hitsS) {
          if (bg && !h.after && (h.s.el.compareDocumentPosition(bg.s.el) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
          const kind = h.after ? '被素材压住' : h.n < pts.length ? '压在素材上' : null;
          if (!kind || found.has(kind)) continue; found.add(kind);
          const tag = h.s.el.tagName + (h.s.el.getAttribute('fill') ? ' fill=' + h.s.el.getAttribute('fill').slice(0, 12) : '');
          out.push({ txt: txt.slice(0, 24), over: `${kind}(${tag},${h.n}/${pts.length} 点)`, box: [box.l, box.t, box.r, box.b].map(v => Math.round(v)) });
        }
      }
    }
    return out;
  }, [+W, +H, M, frame, OBJ]);
  if (SCAN) { for (const h of hits) { const k = `「${h.txt}」 ${h.over}`; if (!runs.has(k)) runs.set(k, []); runs.get(k).push({ t, box: h.box }); } continue; }
  const label = t === null ? '封面' : `t=${t}`;
  if (hits.length) { bad += hits.length; console.log(`${label}:${hits.length} 处出画 / 贴边 / 叠字`); hits.forEach(h => console.log(`  「${h.txt}」 ${h.over}  框 ${h.box.join(',')}`)); }
  else console.log(`${label}:0 处`);
}
if (SCAN) {
  const step = times.length > 1 ? times[1] - times[0] : .1;
  for (const [k, arr] of runs) {
    let st = 0;
    for (let i = 1; i <= arr.length; i++) if (i === arr.length || arr[i].t - arr[i - 1].t > step * 1.5 + 1e-6) {
      const a = arr[st], z = arr[i - 1];
      if (z.t - a.t + step >= (/叠字|压/.test(k) ? MINRUN_OV : MINRUN)) { bad++; console.log(`${a.t}–${z.t}s  ${k}  框 ${a.box.join(',')}`); }
      st = i;
    }
  }
}
await b.close();
console.log(bad ? `不合格:共 ${bad} 处(安全边距 ${M}px${frame ? `,画面框 ${frame.join(',')}` : ''})` : `合格:0 处出画、0 处叠字(安全边距 ${M}px${frame ? `,画面框 ${frame.join(',')}` : ''})`);
process.exit(bad ? 1 : 0);
