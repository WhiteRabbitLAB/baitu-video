// 「素材」检查(第 17 期起;决策者 2026-10-15:素材提前出来、素材互相重叠、素材出格 —— 「这种问题不应该出现」)
//   node .claude/skills/baitu-video/engine/tools/check-objects.mjs <页面相对路径?参数> <宽> <高> [--scan 起-止:步长] [--min-area 100] [--early 0.3] [--margin 0]
//   例:node .claude/skills/baitu-video/engine/tools/check-objects.mjs "video/N17.html?render" 1920 1080 --scan 0-343:0.1
// 文字的出画 / 叠字 / 字压素材由 check-text-bounds 管;这里管「东西」本身。页面约定:
//   · data-obj="名字":一件素材(一张纸连同纸上的字、一个瓶子、一个杯子)。放在另一件素材上的东西(纸上的印章、托盘里的苹果)
//     嵌在它的 data-obj 里面 —— 嵌套 = 故意放在上面,不算互压;并排的两件必须分开,不许压。
//   · data-say="原句片段":这件东西(或这串字)讲的是哪句话。要等配音念到这几个字(允许提前 --early 秒)才许出现在画面上。
//   · data-scene:开场就该在的布景(桌上的本子、标题条),不挂台词;报告里逐条列出,人看一眼。
//   · 阴影、横线、装饰加 data-over(和 check-text-bounds 一样),不算素材的形状。
// 查三件事(页面有 window.inTransition(t) 且为 true 的时刻跳过:镜头移动、东西正在落下):
//   ① 素材出画:一件素材的外框一部分在画面里、一部分在画面外(或离边不到 --margin)。整件在画面外 = 看不见,不算。
//   ② 素材互压:两件不嵌套的素材,在两者外框相交处按网格采样,真形状(isPointInFill / isPointInStroke;字按字框)同时盖住的面积 > --min-area 平方像素。
//   ③ 提前出现:带 data-say 的东西第一次可见的时刻,早于配音念到那几个字的时刻 --early 秒以上;画面上看得见的素材 / 字,
//      自己和祖先都没有 data-say 也没有 data-scene ⇒「没挂台词」(说不清它该什么时候出来,就是会提前出来的那种)。
//   ⑤ 标记图形(data-over)不是免检:单独摆着的箭头 / 线 / 印章压到素材或压到字要报(横穿字中线 ≥ 60% 的划掉、荧光笔除外);
//      嵌在素材里、自己带字的标记(印章、标签)整个要落在素材上。data-over 只表示「可以压在字上」,印章、箭头这类独立的东西别标它。
//   ④ 字出纸边:写在某件素材里的字,字框四边要整个落在这件素材上;不属于任何素材的字,不许骑在素材边上(一半在纸上一半在桌上)。
//   页面 console.warn(如「AT 没找到」)也算问题。
//   出现一帧就报。有问题退出码 1。念到的时刻从 window.TL(引擎 subs 生成的时间轴)里找:含这几个字的分句,按字的位置线性插值。
import { chromium } from 'playwright';
import path from 'node:path';
import { PROJECT as ROOT } from '../lib/paths.mjs';
const args = process.argv.slice(2);
const take = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? args.splice(i, 2)[1] : d; };
const SCAN = take('scan'), MIN_AREA = +take('min-area', 100), EARLY = +take('early', .3), MARGIN = +take('margin', 0);
const [page, W, H, ...ts] = args;
if (!page || !W || !H) { console.error('用法:node .claude/skills/baitu-video/engine/tools/check-objects.mjs <页面?参数> <宽> <高> [时刻 …] [--scan 起-止:步长] [--min-area 100] [--early 0.3] [--margin 0]'); process.exit(2); }
const [file, query = ''] = page.split('?');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: +W, height: +H } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
const warns = new Set();   // 页面 console.warn(如「AT 没找到」= 锚点丢了,那件东西整片不出现)一律算问题
p.on('console', m => { if (m.type() === 'warning') warns.add(m.text()); });
await p.goto('file://' + (path.isAbsolute(file) ? file : path.join(ROOT, file)) + (query ? '?' + query : ''));
await p.evaluate(() => window.fontsReady);
let times = ts.length ? ts.map(Number) : [0];
if (SCAN) { const [, a, z, st] = SCAN.match(/^([\d.]+)-([\d.]+):([\d.]+)$/) || []; if (!st) throw new Error('--scan 写成 起-止:步长,如 0-205:0.1'); times = []; for (let t = +a; t <= +z + 1e-9; t += +st) times.push(+t.toFixed(3)); }

// 念到某几个字的时刻(与页面里的 AT() 同一算法:整句里找,按字的位置落到分句里线性插值;找不到 = null)
const said = await p.evaluate(() => {
  const TL = window.TL; if (!TL) return null;
  window.__said = (sub, k = 0) => {
    for (const s of TL.sentences) {
      const ps = s.parts?.length ? s.parts : [s];
      let i = s.text.indexOf(sub);
      while (i >= 0) {
        if (k-- === 0) { let off = 0; for (const q of ps) { if (i < off + q.text.length) return q.start + (q.end - q.start) * (i - off) / Math.max(1, q.text.length); off += q.text.length; } }
        i = s.text.indexOf(sub, i + 1);
      }
    }
    return null;
  };
  return true;
});
if (!said) console.error('页面没有 window.TL:③ 提前出现只查「没挂台词」,不比时刻');

const issues = new Map();   // 问题键 → [时刻…]
const add = (k, t) => { if (!issues.has(k)) issues.set(k, []); issues.get(k).push(t); };
const firstSeen = new Map(), scenes = new Map();
let nObj = 0, nFrames = 0;
for (const t of times) {
  if (await p.evaluate(t => typeof window.inTransition === 'function' && window.inTransition(t), t)) continue;
  await p.evaluate(t => window.render(t), t);
  nFrames++;
  const r = await p.evaluate(([W, H, M, MIN_AREA]) => {
    const vis = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; const a = e.getAttribute && e.getAttribute('opacity'); if (a != null) o *= +a; } return o; };
    const DRAW = 'path,rect,circle,ellipse,polygon,polyline,line,text,image';
    const skip = el => el.closest('defs,clipPath,pattern,mask,filter,[data-over]');
    // 字只跳过定义区;data-over 的意思是「这个图形可以压在字上」,不是「它里面的字不用查」(印章、标签里的字照查;决策者 2026-10-15 看到印章盖出纸边)
    const skipT = el => el.closest('defs,clipPath,pattern,mask,filter');
    const objs = [...document.querySelectorAll('[data-obj]')].filter(o => vis(o) >= .05);
    const info = objs.map(o => {
      const shapes = [...o.querySelectorAll(DRAW)].filter(el => !skip(el) && el.closest('[data-obj]') === o && vis(el) >= .05).map(el => {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return { el, r, txt: el.tagName === 'text', fill: cs.fill !== 'none', stroke: cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 };
      }).filter(s => s.r.width > 0 && s.r.height > 0 && (s.txt ? s.el.textContent.trim() : (s.fill || s.stroke || s.el.tagName === 'image')));
      // 外框 = 自己和嵌在里面的素材一起(嵌套的东西放在它上面,也属于这一摞)
      const all = [...o.querySelectorAll(DRAW)].filter(el => !skip(el) && vis(el) >= .05).map(el => el.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
      const box = all.length ? { l: Math.min(...all.map(r => r.left)), t: Math.min(...all.map(r => r.top)), r: Math.max(...all.map(r => r.right)), b: Math.max(...all.map(r => r.bottom)) } : null;
      return { o, name: o.getAttribute('data-obj'), shapes, box };
    }).filter(x => x.box);
    const out = { bad: [], seen: [], scene: [], n: info.length };
    const inView = bx => bx.r > 0 && bx.l < W && bx.b > 0 && bx.t < H;
    // ① 出画
    for (const x of info) {
      if (!inView(x.box)) continue;
      const sides = [x.box.l < M && '左', x.box.t < M && '上', x.box.r > W - M && '右', x.box.b > H - M && '下'].filter(Boolean);
      if (sides.length) out.bad.push({ k: `「${x.name}」素材出画(${sides.join('/')})`, box: [x.box.l, x.box.t, x.box.r, x.box.b] });
    }
    // ② 互压
    const hit = (s, x, y) => {
      if (s.txt) { const h = (s.r.bottom - s.r.top) * .15; return x >= s.r.left && x <= s.r.right && y >= s.r.top + h && y <= s.r.bottom - h; }
      // 外框粗筛要按笔画宽度放宽:一条水平线的外框高度是 0,不放宽就永远「碰不到」(箭头擦过数字就是这样漏掉的)
      const m = s.el.getScreenCTM(); if (!m) return false;
      if (s.pad == null) s.pad = 1 + (s.stroke ? parseFloat(getComputedStyle(s.el).strokeWidth) * Math.hypot(m.a, m.b) / 2 : 0);
      if (x < s.r.left - s.pad || x > s.r.right + s.pad || y < s.r.top - s.pad || y > s.r.bottom + s.pad) return false; const q = new DOMPoint(x, y).matrixTransform(m.inverse());
      if (s.el.tagName === 'image') return true;
      return (s.fill && s.el.isPointInFill(q)) || (s.stroke && s.el.isPointInStroke(q));
    };
    for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) {
      const A = info[i], B = info[j];
      if (A.o.contains(B.o) || B.o.contains(A.o)) continue;
      const pa = A.o.parentElement?.closest('[data-obj]'); if (pa && pa.contains(B.o)) continue;   // 同一件组合素材里的几件(一摞纸、托盘里的东西)
      if (!inView(A.box) || !inView(B.box)) continue;
      const l = Math.max(A.box.l, B.box.l, 0), r = Math.min(A.box.r, B.box.r, W), t = Math.max(A.box.t, B.box.t, 0), bt = Math.min(A.box.b, B.box.b, H);
      if (r <= l || bt <= t) continue;
      const st = Math.max(4, Math.sqrt((r - l) * (bt - t) / 900));
      let n = 0;
      for (let y = t + st / 2; y < bt; y += st) for (let x = l + st / 2; x < r; x += st) if (A.shapes.some(s => hit(s, x, y)) && B.shapes.some(s => hit(s, x, y))) n++;
      if (n * st * st > MIN_AREA) out.bad.push({ k: `「${A.name}」×「${B.name}」素材互压`, box: [l, t, r, bt], area: Math.round(n * st * st) });
    }
    // ④ 字出纸边:字在某件素材里(写在这张纸上)⇒ 字框四条边上的采样点必须全落在这件素材的形状里;
    //    字不在任何素材里 ⇒ 不许一部分落在某件素材上、一部分落在外面(骑在纸边上)。字框按字自己的坐标系取(旋转的纸上也准)
    {
      const texts = [...document.querySelectorAll('text')].filter(el => el.textContent.trim() && !skipT(el) && !el.closest('[data-chrome]') && vis(el) >= .05);
      for (const el of texts) {
        const bb = el.getBBox(), m = el.getScreenCTM(); if (!m || bb.width < 1) continue;
        const ix = Math.min(3, bb.width * .1), it = bb.height * .24, ib = bb.height * .2, pts = [];
        const x0 = bb.x + ix, x1 = bb.x + bb.width - ix, y0 = bb.y + it, y1 = bb.y + bb.height - ib;
        for (let i = 0; i <= 4; i++) { const x = x0 + (x1 - x0) * i / 4; pts.push([x, y0], [x, y1]); }
        for (let i = 1; i <= 3; i++) { const y = y0 + (y1 - y0) * i / 4; pts.push([x0, y], [x1, y]); }
        const sp = pts.map(([x, y]) => { const q = new DOMPoint(x, y).matrixTransform(m); return [q.x, q.y]; });
        if (!sp.some(([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H)) continue;
        const own = el.closest('[data-obj]'), txt = el.textContent.trim().slice(0, 16);
        const box = [Math.min(...sp.map(q => q[0])), Math.min(...sp.map(q => q[1])), Math.max(...sp.map(q => q[0])), Math.max(...sp.map(q => q[1]))];
        const cov = x => sp.filter(([px, py]) => x.shapes.some(s => !s.txt && hit(s, px, py))).length;
        if (own) {
          const mine = info.filter(x => own.contains(x.o) || x.o === own);
          if (mine.some(x => x.shapes.some(s => !s.txt))) { const n = sp.filter(([px, py]) => mine.some(x => x.shapes.some(s => !s.txt && hit(s, px, py)))).length; if (n < sp.length) out.bad.push({ k: `「${txt}」出了「${own.getAttribute('data-obj')}」的纸边(${sp.length - n}/${sp.length} 点在外)`, box }); }
        }
        for (const x of info) {
          if (own && (own.contains(x.o) || x.o.contains(own) || x.o === own)) continue;
          if (x.box.r < box[0] || x.box.l > box[2] || x.box.b < box[1] || x.box.t > box[3]) continue;
          const n = cov(x); if (n > 0 && n < sp.length) out.bad.push({ k: `「${txt}」骑在「${x.name}」的边上(${n}/${sp.length} 点在素材上)`, box });
        }
      }
    }
    // ⑤ 标记图形(data-over)不是免检:
    //   a. 不属于任何素材、单独摆着的标记(箭头、线、印章……)压到素材(> 门槛面积)或压到字 ⇒ 报。
    //      横穿一串字中线 ≥ 60% 的(划掉、荧光笔)算故意压字,不报;故意叠在某件素材上的标记(纸上的勾、日历上的划线)嵌进那件素材的 data-obj 里。
    //   b. 嵌在素材里、自己带字的标记(印章、标签):整个外框(按它自己的坐标系)要落在这件素材的形状里 —— 章不许盖出纸边。
    {
      const GEOM = /^(path|rect|circle|ellipse|polygon|polyline|line)$/;
      const drawn = el => { const cs = getComputedStyle(el); return GEOM.test(el.tagName) && ((cs.fill !== 'none' && cs.fill !== 'transparent') || (cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0)); };
      const tops = [...document.querySelectorAll('[data-over]')].filter(m => !m.parentElement.closest('[data-over]') && !m.closest('defs,clipPath,pattern,mask,filter,[data-chrome]') && vis(m) >= .05);
      const textsAll = [...document.querySelectorAll('text')].filter(el => el.textContent.trim() && !skipT(el) && !el.closest('[data-chrome]') && vis(el) >= .05);
      const ptsOf = (el, inset = true) => { const bb = el.getBBox(), m = el.getScreenCTM(); if (!m || bb.width < 1) return null; const ix = inset ? Math.min(3, bb.width * .1) : 0, it = inset ? bb.height * .24 : 0, ib = inset ? bb.height * .2 : 0; const x0 = bb.x + ix, x1 = bb.x + bb.width - ix, y0 = bb.y + it, y1 = bb.y + bb.height - ib, ym = (y0 + y1) / 2; const edge = [], mid = []; for (let i = 0; i <= 4; i++) { const x = x0 + (x1 - x0) * i / 4; edge.push([x, y0], [x, y1]); mid.push([x, ym]); } for (let i = 1; i <= 3; i++) { const y = y0 + (y1 - y0) * i / 4; edge.push([x0, y], [x1, y]); } const T = ([x, y]) => { const q = new DOMPoint(x, y).matrixTransform(m); return [q.x, q.y]; }; return { edge: edge.map(T), mid: mid.map(T) }; };
      for (const mk of tops) {
        const r = mk.getBoundingClientRect(); if (r.width < 1 || r.width >= W * .9 || r.right <= 0 || r.left >= W || r.bottom <= 0 || r.top >= H) continue;
        const name = mk.getAttribute('data-over') || '标记';
        const ms = [mk, ...mk.querySelectorAll(DRAW)].filter(el => drawn(el) && vis(el) >= .05).map(el => ({ el, r: el.getBoundingClientRect(), txt: false, fill: getComputedStyle(el).fill !== 'none', stroke: getComputedStyle(el).stroke !== 'none' && parseFloat(getComputedStyle(el).strokeWidth) > 0 }));
        if (!ms.length) continue;
        const own = mk.closest('[data-obj]');
        if (own) {
          // b. 嵌在素材里、带字的标记:整个要落在素材上
          if (!mk.querySelector('text')) continue;
          const mine = info.filter(x => own.contains(x.o) || x.o === own), surf = mine.flatMap(x => x.shapes.filter(s => !s.txt && !mk.contains(s.el)));
          const p = ptsOf(mk, false); if (!p || !surf.length) continue;
          const nOut = p.edge.filter(([x, y]) => !surf.some(s => hit(s, x, y))).length;
          if (nOut) out.bad.push({ k: `「${name}」出了「${own.getAttribute('data-obj')}」的纸边(${nOut}/${p.edge.length} 点在外)`, box: [r.left, r.top, r.right, r.bottom] });
          continue;
        }
        // a1. 单独的标记压到素材
        for (const x of info) {
          if (x.box.r < r.left || x.box.l > r.right || x.box.b < r.top || x.box.t > r.bottom) continue;
          const l = Math.max(r.left, x.box.l), rr = Math.min(r.right, x.box.r), t = Math.max(r.top, x.box.t), bt = Math.min(r.bottom, x.box.b);
          const st = Math.max(3, Math.sqrt((rr - l) * (bt - t) / 900)); let n = 0;
          for (let y = t + st / 2; y < bt; y += st) for (let xx = l + st / 2; xx < rr; xx += st) if (ms.some(s => hit(s, xx, y)) && x.shapes.some(s => !s.txt && hit(s, xx, y))) n++;
          if (n * st * st > MIN_AREA) out.bad.push({ k: `「${name}」压到了「${x.name}」(${Math.round(n * st * st)} 平方像素;故意叠的就嵌进那件素材的 data-obj)`, box: [l, t, rr, bt] });
        }
        // a2. 单独的标记压到字:字框里按约 3px 的密网格采样(稀疏采样会漏掉只擦过字边的箭头尖);
        //     被压到的列 ≥ 60% = 横穿整串字(划掉、荧光笔),算故意;否则只是碰上了 ⇒ 报
        for (const el of textsAll) {
          if (mk.contains(el)) continue;
          const tr = el.getBoundingClientRect(); if (tr.right < r.left || tr.left > r.right || tr.bottom < r.top || tr.top > r.bottom) continue;
          const bb = el.getBBox(), m = el.getScreenCTM(); if (!m || bb.width < 1) continue;
          const y0 = bb.y + bb.height * .24, y1 = bb.y + bb.height * .8, cols = Math.max(8, Math.round(bb.width / 3)), rows = Math.max(4, Math.round((y1 - y0) / 3));
          let n = 0; const hitCols = new Set();
          for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) {
            const q = new DOMPoint(bb.x + bb.width * i / cols, y0 + (y1 - y0) * j / rows).matrixTransform(m);
            if (ms.some(s => hit(s, q.x, q.y))) { n++; hitCols.add(i); }
          }
          if (n && hitCols.size < (cols + 1) * .6) out.bad.push({ k: `「${name}」压到字「${el.textContent.trim().slice(0, 12)}」(${n} 个采样点)`, box: [tr.left, tr.top, tr.right, tr.bottom] });
        }
      }
    }
    // ③ 看得见的东西:挂的台词 / 布景
    const seenEls = [...objs, ...[...document.querySelectorAll('text')].filter(el => el.textContent.trim() && !skipT(el) && vis(el) >= .05)];
    for (const el of seenEls) {
      const rr = el.getBoundingClientRect(); if (!(rr.width > 0 && rr.right > 0 && rr.left < W && rr.bottom > 0 && rr.top < H)) continue;
      if (el.closest('[data-chrome]')) continue;   // 字幕、章节条
      const sayEl = el.closest('[data-say]'), sceneEl = el.closest('[data-scene]');
      const name = el.tagName === 'text' ? el.textContent.trim().slice(0, 20) : el.getAttribute('data-obj');
      if (sayEl && (!sceneEl || sayEl.contains(sceneEl) === false)) out.seen.push({ say: sayEl.getAttribute('data-say'), k: sayEl.getAttribute('data-say-k') || 0, name });
      else if (sceneEl) out.scene.push(name);
      else out.bad.push({ k: `「${name}」没挂台词(没有 data-say / data-scene)`, box: [rr.left, rr.top, rr.right, rr.bottom] });
    }
    return out;
  }, [+W, +H, MARGIN, MIN_AREA]);
  nObj = Math.max(nObj, r.n);
  for (const x of r.bad) add(x.k + (x.area ? `(${x.area} 平方像素)` : ''), { t, box: x.box.map(v => Math.round(v)) });
  for (const x of r.seen) { const key = `${x.say}#${x.k}|${x.name}`; if (!firstSeen.has(key)) firstSeen.set(key, { ...x, t }); }
  for (const nm of r.scene) if (!scenes.has(nm)) scenes.set(nm, t);
}
// ③ 比时刻
const saidT = new Map();
for (const [, x] of firstSeen) {
  const k = `${x.say}#${x.k}`;
  if (!saidT.has(k)) saidT.set(k, said ? await p.evaluate(([s, k]) => window.__said(s, +k), [x.say, x.k]) : null);
  const ts = saidT.get(k);
  if (said && ts == null) add(`data-say「${x.say}」在时间轴里找不到`, { t: x.t, box: [] });
  else if (ts != null && x.t < ts - EARLY) add(`「${x.name}」提前出现:${x.t.toFixed(1)}s 就看得见,配音 ${ts.toFixed(1)}s 才念到「${x.say}」(早 ${(ts - x.t).toFixed(1)}s)`, { t: x.t, box: [] });
}
await b.close();
let bad = 0;
const step = times.length > 1 ? times[1] - times[0] : .1;
for (const [k, arr] of issues) {
  let st = 0;
  for (let i = 1; i <= arr.length; i++) if (i === arr.length || arr[i].t - arr[i - 1].t > step * 1.5 + 1e-6) {
    const a = arr[st], z = arr[i - 1]; bad++;
    console.log(`${a.t}–${z.t}s  ${k}${a.box.length ? '  框 ' + a.box.join(',') : ''}`);
    st = i;
  }
}
for (const w of warns) { bad++; console.log(`页面警告:${w}`); }
if (!nObj) { console.log('BROKEN:页面上一件 data-obj 都没有 —— 素材没标,这项检查不算数'); process.exit(3); }
if (scenes.size) console.log(`布景(data-scene,开场就在,人看一眼):${[...scenes].map(([n, t]) => `${n}@${t.toFixed(1)}s`).join(' / ')}`);
console.log(bad ? `不合格:共 ${bad} 处(扫 ${nFrames} 帧,最多同时 ${nObj} 件素材;互压门槛 ${MIN_AREA} 平方像素,提前容差 ${EARLY}s)` : `合格:0 处素材出画、0 处素材互压、0 处提前出现(扫 ${nFrames} 帧,最多同时 ${nObj} 件素材)`);
process.exit(bad ? 1 : 0);
