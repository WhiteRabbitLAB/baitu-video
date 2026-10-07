// 讲解视频共享组件(VC)。所有频道共用。
// 约定(与各期页面一致):render(t) 只由时间决定;组件都是纯函数,返回 SVG 字符串,坐标系 1920×1080。
// 组件只认「文字角色」R1–R10(.claude/skills/explainer-video/text-roles.md);字体、颜色、承载物、出场方式全由画风提供(styles.js)。
// 用法:<script src="…/engine/vc/vc.js"></script><script src="…/engine/vc/styles.js"></script>
//       const kit = VC.kit('paper-skeuo');  await VC.ready(kit, [本期全部文字]);  每帧开头 kit.begin();
// file:// 下 ES module 会被 CORS 拦,所以用普通脚本 + 全局 VC。
(function () {
  'use strict';
  const VC = window.VC = window.VC || {};
  VC.styles = VC.styles || {};

  // ---------- 小工具 ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a));
  const ease = {
    inOut: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
    out: k => 1 - Math.pow(1 - k, 3),
    back: k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f1 = v => (+v).toFixed(1), f2 = v => (+v).toFixed(2), f3 = v => (+v).toFixed(3);
  // 固定种子哈希 → [0,1),逐帧可复现
  function h2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  const strSeed = s => ([...String(s)].reduce((a, c) => (Math.imul(a, 31) + c.codePointAt(0)) | 0, 7) >>> 0) % 9973;
  const hasCJK = s => /[⺀-鿿豈-﫿＀-￯]/.test(s);
  // 中文语境里的全角化标点(破折号、省略号、弯引号)也走中文字体
  const ZH_PUNCT = new Set(['—', '…', '“', '”', '‘', '’', '·']);
  const isZh = (c, zhCtx) => c.codePointAt(0) >= 0x2e80 || (zhCtx && ZH_PUNCT.has(c));
  // CSS cubic-bezier(x1,y1,x2,y2):牛顿法解 x→t,再求 y
  function bezier(x1, y1, x2, y2) {
    const bx = t => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3, by = t => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
    return x => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 12; i++) { const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t, e = bx(t) - x; if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break; t = clamp(t - e / d); }
      return by(t);
    };
  }
  ease.smooth = k => k * k * k * (k * (6 * k - 15) + 10);
  ease.expoIn = k => k <= 0 ? 0 : Math.pow(2, 10 * k - 10);
  ease.expoOut = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
  ease.expoInOut = k => k <= 0 ? 0 : k >= 1 ? 1 : k < .5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2;   // 两端速度、加速度都为 0(概念类默认,3b1b)
  ease.css = bezier(.25, .1, .25, 1);                        // CSS ease
  ease.push = bezier(.7, 0, .2, 1);                          // slide-push
  Object.assign(VC, { clamp, lerp, seg, ease, esc, h2, strSeed, hasCJK, bezier });

  // ---------- 路径形变:两条闭合路径各取 n 个等距点,对齐起点后逐点插值 ----------
  let SAMPLER = null; const SAMPLES = new Map();
  function samplePath(d, n) {
    const key = n + '|' + d; if (SAMPLES.has(key)) return SAMPLES.get(key);
    if (!SAMPLER) { const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('width', 0); sv.setAttribute('height', 0); sv.style.position = 'absolute'; SAMPLER = document.createElementNS('http://www.w3.org/2000/svg', 'path'); sv.appendChild(SAMPLER); document.body.appendChild(sv); }
    SAMPLER.setAttribute('d', d);
    const L = SAMPLER.getTotalLength(), pts = [];
    for (let i = 0; i < n; i++) { const p = SAMPLER.getPointAtLength(L * i / n); pts.push([p.x, p.y]); }
    const area = pts.reduce((a, p, i) => { const q = pts[(i + 1) % n]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
    if (area < 0) pts.reverse();   // 统一绕向,免得形变时翻面
    SAMPLES.set(key, pts); return pts;
  }
  function alignTo(A, B) {   // 找让 B 的点序和 A 最接近的起点
    const n = A.length; let best = 0, bd = Infinity;
    for (let o = 0; o < n; o++) { let d = 0; for (let i = 0; i < n; i += 4) { const b = B[(i + o) % n]; d += (A[i][0] - b[0]) ** 2 + (A[i][1] - b[1]) ** 2; } if (d < bd) { bd = d; best = o; } }
    return A.map((_, i) => B[(i + best) % n]);
  }
  VC.morphPath = function (dA, dB, k, n = 120) {
    const A = samplePath(dA, n), B = alignTo(A, samplePath(dB, n));
    return 'M' + A.map((a, i) => `${f1(lerp(a[0], B[i][0], k))},${f1(lerp(a[1], B[i][1], k))}`).join(' L') + 'Z';
  };
  VC.lerpColor = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], k)).toString(16).padStart(2, '0')).join(''); };
  // 常用形状 → 路径
  VC.shape = {
    rect: (x, y, w, h, r = 0) => { r = Math.min(r, w / 2, h / 2); return `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`; },
    circle: (cx, cy, r) => `M${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy} A${r},${r} 0 1 1 ${cx + r},${cy} Z`,
  };

  // ---------- 手绘线(白板 / 草稿):固定种子抖动,首尾略出头,像马克笔一笔画成 ----------
  function wob(pts, seed, amp, close) {   // 折点 → 平滑路径(二次贝塞尔过中点)
    const P = pts.map((p, i) => [p[0] + (h2(i, seed, 21) - .5) * 2 * amp, p[1] + (h2(i, seed, 22) - .5) * 2 * amp]);
    let d = `M${f1(P[0][0])},${f1(P[0][1])}`;
    for (let i = 1; i < P.length - 1; i++) { const m = [(P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2]; d += ` Q${f1(P[i][0])},${f1(P[i][1])} ${f1(m[0])},${f1(m[1])}`; }
    const L = P[P.length - 1]; d += ` L${f1(L[0])},${f1(L[1])}`;
    return d;
  }
  VC.wobblyLine = (x1, y1, x2, y2, seed = 1, amp = 2.5) => {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 60)), pts = [];
    for (let i = 0; i <= n; i++) pts.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]);
    return wob(pts, seed, amp);
  };
  VC.wobblyRect = (x, y, w, h, seed = 1, amp = 3) => {   // 从左上角起一笔绕回来,收尾越过起点一点
    const pts = [], step = 70, edge = (ax, ay, bx, by) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step)); for (let i = 0; i < n; i++) pts.push([lerp(ax, bx, i / n), lerp(ay, by, i / n)]); };
    edge(x, y, x + w, y); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
    pts.push([x + 22, y - 3]);
    return wob(pts, seed, amp);
  };
  VC.wobblyEllipse = (cx, cy, rx, ry, seed = 1, amp = 3, turns = 1.08) => {
    const pts = [], n = 28;
    for (let i = 0; i <= n * turns; i++) { const a = -2.4 + i / n * Math.PI * 2, r = 1 + (i / n) * .05; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    return wob(pts, seed, amp);
  };
  // 路径上取点 + 切线角(给笔尖跟随用)
  const LEN = new Map();
  VC.pathPoint = (d, k) => {
    if (!SAMPLER) samplePath('M0,0 L1,1', 2);
    SAMPLER.setAttribute('d', d);
    let L = LEN.get(d); if (L === undefined) { L = SAMPLER.getTotalLength(); LEN.set(d, L); }
    const a = SAMPLER.getPointAtLength(L * clamp(k)), b = SAMPLER.getPointAtLength(Math.min(L, L * clamp(k) + 2));
    return { x: a.x, y: a.y, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI, len: L };
  };

  // ---------- 字体与测宽 ----------
  // 字体写法 'Noto Serif SC:900';测宽用 canvas measureText(真实字宽,字体加载完后才准 ⇒ VC.ready 之后清缓存)
  const fontOf = spec => { const [fam, w = '400'] = String(spec).split(':'); return { fam, w }; };
  const fontAttr = spec => { const f = fontOf(spec); return `font-family="${f.fam}, Noto Sans SC, sans-serif" font-weight="${f.w}"`; };
  const ctx = document.createElement('canvas').getContext('2d');
  const MC = new Map();
  function adv(c, spec) {
    const key = spec + '|' + c; let w = MC.get(key);
    if (w === undefined) { const f = fontOf(spec); ctx.font = `${f.w} 100px "${f.fam}"`; w = ctx.measureText(c).width / 100; MC.set(key, w); }
    return w;
  }
  VC.fontAttr = fontAttr;
  VC.textW = (s, spec, size) => [...String(s)].reduce((a, c) => a + adv(c, spec), 0) * size;
  VC.clearMeasure = () => MC.clear();

  // 等字体加载完:按画风用到的每个字体 × 本页全部文字触发加载(分片字体按 unicode-range 只下需要的片)
  VC.ready = async function (kit, texts = [], extra = []) {   // extra:画风表以外还要用的字体,如字幕 'Noto Sans SC:900'
    const sample = [...new Set([...texts.join('') + '0123456789,.:%-+ ▍›$✓'])].join('');
    const specs = new Set();
    Object.values(kit.S.roles).forEach(r => Object.values(r).forEach(v => { if (typeof v === 'string' && /:\d{3}$/.test(v)) specs.add(v); }));
    Object.values(kit.S.mono || {}).forEach(v => specs.add(v));
    specs.add(kit.S.bar.font);
    extra.forEach(x => specs.add(x));
    const res = {};
    await Promise.all([...specs].filter(Boolean).map(async spec => {
      const f = fontOf(spec);
      try { const got = await document.fonts.load(`${f.w} 40px "${f.fam}"`, sample); res[spec] = got.length; } catch (e) { res[spec] = -1; }
    }));
    await document.fonts.ready;
    MC.clear();
    return res;   // 每个字体加载到的 face 数;0 = 没加载上(页面应报错,别静默用替代字体)
  };

  // ---------- 噪声贴图(纸纹 / 颗粒),整页只生成一次 ----------
  let NOISE = null;
  function noiseURL() {
    if (NOISE) return NOISE;
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'), im = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = (h2(x, y, 11) * .6 + h2(x >> 2, y >> 2, 12) * .4) * 255, i = (y * N + x) * 4;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return NOISE = c.toDataURL('image/png');
  }

  // ---------- 镜头:段首横移(纯函数,不依赖画风) ----------
  // starts = 每次横移「到位」所对的段首时间;横移在段首前 dur×lead 开始。默认 1.2s(Vox 中位 1.29s,
  // 见 design/camera-transitions.md「差距」第 3 条);N8/N9 用的是 0.85s,要复刻旧片手感传 dur:.85。
  VC.pan = function (t, starts, { width = 1920, dur = 1.2, lead = .7, fps = 30, blurPerPx = .08, blurMax = 14 } = {}) {
    let x = 0, v = 0;
    starts.forEach(s => {
      const a = s - dur * lead, k = seg(t, a, a + dur);
      x += ease.inOut(k) * width;
      if (k > 0 && k < 1) v += (k < .5 ? 12 * k * k : 3 * Math.pow(-2 * k + 2, 2)) * width / dur / fps;
    });
    return { x, i: Math.round(x / width), speed: v, blur: Math.min(blurMax, v * blurPerPx) };   // speed: px/帧
  };

  // =====================================================================
  // kit:绑定一种画风
  // =====================================================================
  VC.kit = function (styleId, { lang = 'zh' } = {}) {
    const S = VC.styles[styleId];
    if (!S) throw new Error('没有这个画风:' + styleId);
    let UID = 0;
    const id = p => `vc${p}${UID++}`;
    const R = r => { const x = S.roles[r]; if (!x) throw new Error(`画风 ${styleId} 没给角色 ${r}`); return x; };

    // 一行字排版:逐字给出位置、宽度、字体(中文字用 zh 字体,其余用 en 字体)
    function layout(s, role, size, ls = 0) {
      const r = typeof role === 'string' ? R(role) : role, zhCtx = hasCJK(s);
      const out = []; let x = 0;
      for (const c of [...String(s)]) {
        const spec = isZh(c, zhCtx) ? r.zh : r.en, w = adv(c, spec) * size + ls;
        out.push({ c, x, w, spec }); x += w;
      }
      return { g: out, w: x };
    }
    const width = (role, s, size) => layout(s, role, size ?? R(role).size).w;
    const ax = (x, w, anchor) => anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;

    // 折行:按词(中文用浏览器分词 Intl.Segmenter,避免「一年 / 肉」这种把词拆开);单个词比框还宽才按字拆
    const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('zh', { granularity: 'word' }) : null;
    const units = s => {
      const u = hasCJK(s) && SEG ? [...SEG.segment(s)].map(x => x.segment) : hasCJK(s) ? [...s] : s.split(/(\s+)/);
      // 「第 114 卷」「第 3 周」:「第 + 数字 + 量词」是一个整体,不拆
      for (let i = 0; i < u.length; i++) {
        if (!/第$/.test(u[i])) continue;
        let j = i + 1; if (/^\s+$/.test(u[j] || '')) j++;
        if (!/^\d/.test(u[j] || '')) continue;
        let k = j + 1; if (/^\s+$/.test(u[k] || '') && /^[\u4e00-\u9fff]$/.test(u[k + 1] || '')) k += 2; else if (/^[\u4e00-\u9fff]$/.test(u[k] || '')) k++;
        u.splice(i, k - i, u.slice(i, k).join(''));
      }
      return u;
    };
    function wrap(s, role, size, maxW) {
      const lines = []; let line = '';
      const parts = units(s).flatMap(p => layout(p, role, size).w > maxW ? [...p] : [p]);
      for (const p of parts) {
        const cand = line + p;
        if (line && layout(cand.trimEnd(), role, size).w > maxW) { lines.push(line.trimEnd()); line = p.trimStart(); } else line = cand;
      }
      if (line.trim()) lines.push(line.trimEnd());
      // 避头尾:句读、右引号括号不放行首,左引号括号不放行尾 —— 从上一行借最后一个字下来(会比 maxW 窄,不会更宽)
      const NO_HEAD = /^[，。、！？；：,.!?;:」』）》〉】”’…—·]/, NO_TAIL = /[「『（《〈【“‘]$/;
      for (let i = 1; i < lines.length; i++) {
        let a = [...lines[i - 1]], b = lines[i];
        while (a.length > 1 && (NO_HEAD.test(b) || NO_TAIL.test(a.join('')))) b = a.pop() + b;
        lines[i - 1] = a.join(''); lines[i] = b;
      }
      return lines;
    }

    // 放得下才算数:从 size 往下缩,直到折行后 ≤ maxLines 行、且每一行量过都 ≤ maxW(按真实字宽,不靠估)。
    // balance:行数定了以后找最窄的折法,让几行长短接近(不出现「一长行 + 孤零零两个字」)。
    // 返回 { size, lines, ok, lh };ok=false 表示缩到 min 倍还放不下 —— 要改字或改版面,别硬塞。
    function fit(role, s, maxW, o = {}) {
      const base = o.size || R(role).size, maxLines = o.maxLines ?? 2, min = o.min ?? .6, lhK = o.lh ?? 1.25;
      const fits = (sz, ls) => ls.length <= maxLines && ls.every(l => width(role, l, sz) <= maxW + .5);
      let size = base, lines = wrap(s, role, size, maxW), ok = fits(size, lines);
      while (!ok && size * .95 >= base * min) { size *= .95; lines = wrap(s, role, size, maxW); ok = fits(size, lines); }
      if (ok && lines.length === 2 && o.balance !== false) {
        // 两行:在词边界里挑断点 —— 两行越接近越好;第一行比第二行短要扣分(头轻脚重);断在标点 / 空格后加分(读着顺)
        const u = units(s), total = width(role, s, size); let best = null;
        for (let i = 1; i < u.length; i++) {
          const a = u.slice(0, i).join('').trimEnd(), b = u.slice(i).join('').trimStart();
          if (!fits(size, [a, b]) || /^[，。、！？；：,.!?;:」』）》”’…—·]/.test(b) || /[「『（《“‘]$/.test(a)) continue;
          const wa = width(role, a, size), wb = width(role, b, size);
          const open = (a.match(/[「『（《“(]/g) || []).length - (a.match(/[」』）》”)]/g) || []).length;   // 断在引号 / 括号里面:读着断气
          const cost = Math.max(wa, wb) + (wb > wa ? (wb - wa) * .5 : 0) - (/[，、：；,:;·\s]$/.test(u[i - 1]) ? total * .12 : 0) + (open > 0 ? total * .2 : 0);
          if (!best || cost < best.cost) best = { cost, lines: [a, b] };
        }
        if (best) lines = best.lines;
      } else if (ok && lines.length > 2 && o.balance !== false) {
        let lo = maxW * .4, hi = maxW;
        for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (wrap(s, role, size, m).length <= lines.length) hi = m; else lo = m; }
        const bal = wrap(s, role, size, hi); if (bal.length === lines.length && fits(size, bal)) lines = bal;
      }
      if (!ok && typeof console !== 'undefined') console.warn(`[vc.fit] 缩到 ${min} 倍还放不下(${maxW}px、${maxLines} 行):${s}`);
      return { size, lines, ok, lh: size * lhK };
    }
    // 画出 fit 的结果:y 是第一行基线;多行逐行接着出场(手写 / 打字类入场下一行等上一行写完)
    function textFit(role, s, x, y, maxW, t, t0 = -1e9, o = {}) {
      const f = fit(role, s, maxW, o); let tt = t0;
      return f.lines.map((l, i) => { const out = text(role, l, x, y + i * f.lh, t, tt, { ...o, size: f.size }); tt += dur(role, l); return out; }).join('');
    }

    // 角色的书写速度(字 / 秒);英文按字母,约为中文 2.2 倍
    const cps = (r, s) => hasCJK(s) ? (r.cps || 10) : (r.cpsEn || (r.cps || 10) * 2.2);
    const dur = (role, s) => { const r = R(role), n = [...s].filter(c => c !== ' ').length; return r.entrance === 'hand' || r.entrance === 'type' || r.entrance === 'write' ? n / cps(r, s) : .45; };

    // ---------- 出场方式 ----------
    // 手写:每字固定种子的微小不规则(角度 ±2°、上下 ±3%、大小 ±4%、墨色 ±15%,× r.jit),逐字左→右擦出,一行匀速
    function handRun(s, x, y, t, t0, d, r, size, fill, anchor) {
      if (t < t0) return '';
      const seed = strSeed(s) + 3, L = layout(s, r, size), x0 = ax(x, L.w, anchor), J = r.jit ?? 1;
      const blend = r.blend ? ` style="mix-blend-mode:${r.blend}"` : '';
      if (!hasCJK(s)) {   // 英文连笔:整行排字(保留字距),按宽度一路擦出
        const k = seg(t, t0, t0 + d), cid = id('h'), rot = (h2(1, seed, 2) - .5) * 1.6 * J;
        return `<clipPath id="${cid}"><rect x="${f1(x0 - size * .3)}" y="${f1(y - size * 1.3)}" width="${f1((L.w + size * .6) * k)}" height="${f1(size * 1.8)}"/></clipPath>
          <text clip-path="url(#${cid})" x="${f1(x0)}" y="${f1(y)}" transform="rotate(${f2(rot)},${f1(x0)},${f1(y)})" ${fontAttr(r.en)} font-size="${size}" fill="${fill}"${blend}>${esc(s)}</text>`;
      }
      const n = L.g.filter(g => g.c !== ' ').length, per = d / Math.max(1, n); let k0 = 0, out = '';
      L.g.forEach((g, i) => {
        if (g.c === ' ') return;
        const k = clamp((t - t0 - k0 * per) / per); k0++;
        if (k <= 0) return;
        const sc = 1 + (h2(i, seed, 1) - .5) * .08 * J, rot = (h2(i, seed, 2) - .5) * 4 * J, dy = (h2(i, seed, 3) - .5) * size * .06 * J, op = .85 + (h2(i, seed, 4) - .5) * .3 * J;
        const cx = x0 + g.x, cid = id('h');
        out += `<clipPath id="${cid}"><rect x="${f1(cx - size * .2)}" y="${f1(y - size * 1.2)}" width="${f1((g.w + size * .4) * k)}" height="${f1(size * 1.6)}"/></clipPath>
          <text clip-path="url(#${cid})" x="${f1(cx + g.w / 2)}" y="${f1(y + dy)}" text-anchor="middle" transform="rotate(${f2(rot)},${f1(cx + g.w / 2)},${f1(y - size * .35)})" ${fontAttr(g.spec)} font-size="${f1(size * sc)}" fill="${fill}" opacity="${f2(clamp(op))}"${blend}>${esc(g.c)}</text>`;
      });
      return out;
    }
    // 打字机:逐字瞬间出现;r.ink = 墨色深浅随机幅度,r.jit = 上下错位;r.cursor = 打字时带光标
    function typeRun(s, x, y, t, t0, d, r, size, fill, anchor) {
      if (t < t0) return '';
      const seed = strSeed(s), L = layout(s, r, size), x0 = ax(x, L.w, anchor), cs = L.g;
      const n = d <= 0 ? cs.length : Math.min(cs.length, Math.floor(seg(t, t0, t0 + d) * cs.length + 1e-6) + 1);
      let out = '';
      for (let i = 0; i < n; i++) {
        const g = cs[i]; if (g.c === ' ') continue;
        const dy = (h2(i, seed, 7) - .5) * size * (r.jit || 0), op = 1 - h2(i, seed, 9) * (r.ink || 0);
        out += `<text x="${f1(x0 + g.x)}" y="${f1(y + dy)}" ${fontAttr(g.spec)} font-size="${size}" fill="${fill}"${op < 1 ? ` opacity="${f2(op)}"` : ''}>${esc(g.c)}</text>`;
      }
      if (r.cursor) {
        const typing = n < cs.length, on = typing || Math.floor((t - t0 - d) * 2.2) % 2 === 0;
        if (on && t < t0 + d + (r.cursorHold ?? 1.6)) { const cx = x0 + (n < cs.length ? cs[n].x : L.w) + 2; out += `<rect x="${f1(cx)}" y="${f1(y - size * .82)}" width="${f1(size * .5)}" height="${f1(size * .98)}" fill="${r.cursorFill || fill}" opacity=".85"/>`; }
      }
      return out;
    }
    // Manim 的 Write:每个字先描轮廓、再填满、最后收掉描边;字与字错开(lag)
    function writeRun(s, x, y, t, t0, d, r, size, fill, anchor) {
      if (t < t0) return '';
      const L = layout(s, r, size), x0 = ax(x, L.w, anchor), cs = L.g.filter(g => g.c !== ' '), n = cs.length;
      const per = d / Math.max(1, n), span = Math.min(.9, Math.max(.35, per * 3)), DL = size * 9;
      return cs.map((g, i) => {
        const k = seg(t, t0 + i * per * .8, t0 + i * per * .8 + span); if (k <= 0) return '';
        const sk = Math.min(1, k * 1.6), fo = seg(k, .45, .9), so = 1 - seg(k, .85, 1);
        return `<text x="${f1(x0 + g.x)}" y="${f1(y)}" ${fontAttr(g.spec)} font-size="${size}" fill="${fill}" fill-opacity="${f2(fo)}"${so > 0 ? ` stroke="${fill}" stroke-width="${f1(Math.max(1, size * .025))}" stroke-opacity="${f2(so)}" stroke-dasharray="${f1(DL)}" stroke-dashoffset="${f1(DL * (1 - sk))}"` : ''}>${esc(g.c)}</text>`;
      }).join('');
    }
    const staticRun = (s, x, y, r, size, fill, anchor, extra = '') => {
      const L = layout(s, r, size), x0 = ax(x, L.w, anchor);
      // 中英混排逐段输出,保证各自字体
      let out = '', buf = '', bx = 0, spec = null;
      const flush = () => { if (buf) out += `<text x="${f1(x0 + bx)}" y="${f1(y)}" ${fontAttr(spec)} font-size="${size}" fill="${fill}" style="white-space:pre"${r.stroke ? ` stroke="${r.stroke}" stroke-width="${f1(size * (r.strokeW || .12))}" stroke-linejoin="round" paint-order="stroke fill"` : ''} ${extra}>${esc(buf)}</text>`; buf = ''; };
      L.g.forEach(g => { if (g.spec !== spec) { flush(); spec = g.spec; bx = g.x; } buf += g.c; });
      flush(); return out;
    };

    // 角色文字:出场方式由画风决定(手写 / 打字 / 淡入上滑 / 弹出 / 静态)
    function text(role, s, x, y, t, t0 = -1e9, o = {}) {
      const r = R(role), size = o.size || r.size, fill = o.fill || r.fill, anchor = o.anchor || 'start';
      const ent = o.entrance || r.entrance || 'static', d = o.dur ?? dur(role, s);
      if (t < t0) return '';
      if (ent === 'hand') return handRun(s, x, y, t, t0, d, r, size, fill, anchor);
      if (ent === 'type') return typeRun(s, x, y, t, t0, d, r, size, fill, anchor);
      if (ent === 'write') return writeRun(s, x, y, t, t0, d, r, size, fill, anchor);
      const body = staticRun(s, x, y, r, size, fill, anchor);
      if (ent === 'slam' || ent === 'slide') {   // 动态文字【我们】:主词甩入 6 帧 + 2 帧过冲,小词滑入 4 帧;落地后钉住不动
        const w = width(role, s, size), cx = ax(x, w, anchor) + w / 2, cy = y - size * .35;
        if (ent === 'slide') { const k = ease.out(seg(t, t0, t0 + 4 / 30)); return `<g opacity="${f3(k)}" transform="translate(${f1(-40 * (1 - k))},0)">${body}</g>`; }
        const k1 = seg(t, t0, t0 + 6 / 30), k2 = seg(t, t0 + 6 / 30, t0 + 8 / 30);
        const sc = k1 < 1 ? lerp(1.9, .94, k1 * k1) : lerp(.94, 1, ease.out(k2));
        const sh = Math.max(0, 1 - (t - t0 - 6 / 30) / .15) * (t > t0 + 6 / 30 ? 1 : 0), jx = (h2(Math.floor(t * 60), 3, 7) - .5) * 10 * sh, jy = (h2(Math.floor(t * 60), 4, 7) - .5) * 10 * sh;   // 落地震一下
        return `<g opacity="${f3(clamp(k1 * 2.5))}" transform="translate(${f1(cx + jx)},${f1(cy + jy)}) scale(${f3(sc)}) translate(${f1(-cx)},${f1(-cy)})">${body}</g>`;
      }
      if (ent === 'fadeUp') { const k = ease.out(seg(t, t0, t0 + .45)); return `<g opacity="${f3(k)}" transform="translate(0,${f1(16 * (1 - k))})">${body}</g>`; }
      if (ent === 'pop') { const k = seg(t, t0, t0 + .4), w = width(role, s, size), cx = ax(x, w, anchor) + w / 2; return `<g opacity="${f3(clamp(k * 3))}" transform="translate(${f1(cx)},${f1(y)}) scale(${f3(Math.max(.001, ease.back(k)))}) translate(${f1(-cx)},${f1(-y)})">${body}</g>`; }
      return body;
    }

    // ---------- R6 批注:圈 / 划重点 ----------
    // box = 被批注的那段字的外框(左上 x,y,宽 w,高 h);画风决定是红铅笔圈、辉光下划线还是马克笔
    function mark(x, y, w, h, t, t0, o = {}) {
      const k = seg(t, t0, t0 + (o.dur || .6)); if (k <= 0) return '';
      const kind = S.carriers.mark, col = o.color || S.c.mark || S.c.accent, seed = o.seed || 3;
      if (kind === 'pencil') {   // 两遍叠出铅笔的毛,正片叠底
        const cx = x + w / 2, cy = y + h / 2, rx = w / 2 + 10, ry = h / 2 + 12, pts = [], N = 70, span = 2 * Math.PI * 1.12;
        for (let i = 0; i <= N * k; i++) { const a = -2.2 + span * i / N, rr = 1 + Math.sin(a * 3 + seed) * .03 + (i / N) * .06; pts.push(`${f1(cx + Math.cos(a) * rx * rr)},${f1(cy + Math.sin(a) * ry * rr)}`); }
        const d = 'M' + pts.join(' L');
        return `<g style="mix-blend-mode:multiply" fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke-width="5" opacity=".85"/><path d="${d}" stroke-width="2.2" opacity=".5" transform="translate(1.5,-1.2)"/></g>`;
      }
      if (kind === 'block') {   // 动态文字:强调色块从左一刷到底(压在字下面,调用方先画它)
        const ww = (w + 24) * ease.expoOut(seg(t, t0, t0 + .18));
        return `<rect x="${f1(x - 12)}" y="${f1(y - 4)}" width="${f1(ww)}" height="${f1(h + 8)}" fill="${S.c.blockFill || S.c.marker || col}"/>`;
      }
      if (kind === 'ring') {   // 粉笔 / 马克笔一笔画的圈(不叠底,深色板上也看得见)
        return sketch(VC.wobblyEllipse(x + w / 2, y + h / 2, w / 2 + 16, h / 2 + 14, seed, 2.5, 1.1), t, t0, o.dur || .6, { color: col, width: 5, pen: false });
      }
      if (kind === 'box') {   // Manim 的 SurroundingRectangle:黄色矩形一笔画出
        return sketch(VC.shape.rect(x - 10, y - 6, w + 20, h + 12, 4), t, t0, o.dur || .6, { color: col, width: 4, pen: false });
      }
      if (kind === 'glow') {   // 下划线从左扫到右 + 辉光
        const ww = w * ease.out(k);
        return `<rect x="${f1(x)}" y="${f1(y + h + 6)}" width="${f1(ww)}" height="5" rx="2" fill="${col}" filter="url(#vc-glow)"/><rect x="${f1(x)}" y="${f1(y + h + 6)}" width="${f1(ww)}" height="5" rx="2" fill="${S.c.glow || col}"/>`;
      }
      // marker:荧光笔压在字下面(调用方先画 mark 再画字),略斜、两头不齐
      const ww = (w + 16) * ease.out(k);
      return `<path d="M${f1(x - 8)},${f1(y + h * .38)} l${f1(ww)},-4 l0,${f1(h * .62)} l${f1(-ww)},4 Z" fill="${S.c.marker || col}" opacity=".75"/>`;
    }

    // ---------- R9 印章 / 标记物 ----------
    // lines:一行或多行字;落下时间 t0
    function stamp(lines, cx, cy, t, t0, o = {}) {
      if (t < t0) return '';
      lines = [].concat(lines);
      const r = R('R9'), size = o.size || r.size, col = o.color || r.fill, kind = S.carriers.stamp, rot = o.rot ?? -6;
      const lw = Math.max(...lines.map(s => width('R9', s, size) + s.length * size * .06)), lh = size * 1.18;
      const w = o.w || lw + size * 1.6, h = o.h || lines.length * lh + size * .9;
      const body = (fill) => lines.map((s, i) => staticRun(s, 0, (i - (lines.length - 1) / 2) * lh + size * .36, r, size, fill, 'middle', `letter-spacing="${f1(size * .06)}"`)).join('');
      if (kind === 'ink') {   // 落下一下 + 油墨斑驳 + 轻微震动(落地后 0.25s 衰减)
        const k = seg(t, t0, t0 + .14), sc = lerp(1.35, 1, ease.out(k)), sh = t > t0 + .14 ? Math.max(0, 1 - (t - t0 - .14) / .25) : 0;
        const jx = (h2(Math.floor(t * 60), 1, 5) - .5) * 6 * sh, jy = (h2(Math.floor(t * 60), 2, 5) - .5) * 6 * sh;
        return `<g transform="translate(${f1(cx + jx)},${f1(cy + jy)}) rotate(${rot}) scale(${f3(sc)})" opacity="${f2(k * .9)}" style="mix-blend-mode:multiply"><g filter="url(#vc-mottle)">
          <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="10" fill="none" stroke="${col}" stroke-width="9"/>
          <rect x="${f1(-w / 2 + 14)}" y="${f1(-h / 2 + 14)}" width="${f1(w - 28)}" height="${f1(h - 28)}" rx="5" fill="none" stroke="${col}" stroke-width="3"/>${body(col)}</g></g>`;
      }
      if (kind === 'chip') {   // 状态胶囊:从左往右展开 + 一次闪亮
        const k = ease.out(seg(t, t0, t0 + .3)), fl = 1 - seg(t, t0 + .3, t0 + .9), cid = id('c');
        return `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${o.rot ?? 0})"><clipPath id="${cid}"><rect x="${f1(-w / 2 - 20)}" y="${f1(-h / 2 - 20)}" width="${f1((w + 40) * k)}" height="${f1(h + 40)}"/></clipPath><g clip-path="url(#${cid})">
          <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${col}" opacity="${f2(.14 + .3 * fl)}" filter="url(#vc-glow)"/>
          <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${S.c.surface}" stroke="${col}" stroke-width="3"/>
          <circle cx="${f1(-w / 2 + h / 2)}" cy="0" r="${f1(size * .18)}" fill="${col}"/>${body(col)}</g></g>`;
      }
      if (kind === 'achievement') {   // 成就条:金边深色横条从上方落下 + 一道金色扫光 + 菱形徽记
        const k = ease.out(seg(t, t0, t0 + .35)), sw = seg(t, t0 + .3, t0 + 1), cid = id('a'), W = w + h, X = -W / 2;
        return `<g transform="translate(${f1(cx)},${f1(cy - (1 - k) * 60)})" opacity="${f2(k)}">
          <rect x="${f1(X + 4)}" y="${f1(-h / 2 + 8)}" width="${f1(W)}" height="${f1(h)}" rx="8" fill="#000" opacity=".45" filter="url(#vc-soft)"/>
          <rect x="${f1(X)}" y="${f1(-h / 2)}" width="${f1(W)}" height="${f1(h)}" rx="8" fill="${S.c.panel}" stroke="url(#vc-gold)" stroke-width="4"/>
          <rect x="${f1(X + 6)}" y="${f1(-h / 2 + 6)}" width="${f1(W - 12)}" height="${f1(h - 12)}" rx="5" fill="none" stroke="${S.c.gold}" stroke-opacity=".35" stroke-width="1.5"/>
          <path d="M${f1(X + h * .5)},${f1(-h * .3)} l${f1(h * .3)},${f1(h * .3)} l${f1(-h * .3)},${f1(h * .3)} l${f1(-h * .3)},${f1(-h * .3)}Z" fill="url(#vc-gold)"/>
          <g transform="translate(${f1(h * .45)},0)">${body(col)}</g>
          <clipPath id="${cid}"><rect x="${f1(X)}" y="${f1(-h / 2)}" width="${f1(W)}" height="${f1(h)}" rx="8"/></clipPath>
          ${sw > 0 && sw < 1 ? `<rect clip-path="url(#${cid})" x="${f1(X - 80 + (W + 160) * sw)}" y="${f1(-h / 2)}" width="60" height="${f1(h)}" fill="#fff" opacity=".35" transform="skewX(-20)"/>` : ''}</g>`;
      }
      if (kind === 'capsule') {   // 胶囊标签:无描边色块,淡入上滑
        const k = ease.out(seg(t, t0, t0 + .4));
        return `<g transform="translate(${f1(cx)},${f1(cy + 16 * (1 - k))}) rotate(${o.rot != null ? o.rot * .5 : 0})" opacity="${f2(k)}">
          <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${o.fill || S.c.marker}"/>${body(col)}</g>`;
      }
      if (kind === 'slab') {   // 动态文字:实心色板 + 粗字,甩入落地(同 slam 节奏)
        const k1 = seg(t, t0, t0 + 6 / 30), k2 = seg(t, t0 + 6 / 30, t0 + 8 / 30), sc = k1 < 1 ? lerp(1.9, .94, k1 * k1) : lerp(.94, 1, ease.out(k2));
        return `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${o.rot ?? -4}) scale(${f3(sc)})" opacity="${f3(clamp(k1 * 2.5))}"><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" fill="${o.fill || S.c.marker}"/>${body(S.c.slabTxt || S.c.ink)}</g>`;
      }
      if (kind === 'box') {   // 字先「书写」出来,再画一圈细矩形框住
        return `<g transform="translate(${f1(cx)},${f1(cy)})">${lines.map((s2, i) => writeRun(s2, 0, (i - (lines.length - 1) / 2) * lh + size * .36, t, t0, .4, r, size, col, 'middle')).join('')}${sketch(VC.shape.rect(-w / 2, -h / 2, w, h, 6), t, t0 + .35, .6, { color: col, width: 3.5, pen: false })}</g>`;
      }
      if (kind === 'circled') {   // 白板:先写字,再用马克笔一笔圈起来(歪框)
        const seedS = strSeed(lines.join('')), dR = VC.wobblyRect(-w / 2, -h / 2, w, h, seedS, 4);
        return `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${(rot * .4).toFixed(2)})"><g opacity="${f2(clamp(seg(t, t0, t0 + .2) * 2))}">${body(col)}</g>${sketch(dR, t, t0 + .25, .55, { color: col, width: 6 })}</g>`;
      }
      // sticker:粗描边贴纸,回弹落下
      const k = seg(t, t0, t0 + .45), sc = Math.max(.001, ease.back(k));
      return `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${rot}) scale(${f3(sc)})" opacity="${f2(clamp(k * 3))}">
        <rect x="${f1(-w / 2 + 6)}" y="${f1(-h / 2 + 8)}" width="${f1(w)}" height="${f1(h)}" rx="22" fill="${S.c.ink}"/>
        <rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="22" fill="${o.fill || S.c.yolk}" stroke="${S.c.ink}" stroke-width="${S.c.lw}"/>${body(col)}</g>`;
    }

    // ---------- R4 数字:只在真实值之间变化 ----------
    // keys = [[时间, 值], …]:每个值都必须是真实数据;两值之间按位滚动(旧位移出、新位移入,缓出无过冲),
    // 任何一帧都不会出现 keys 以外的完整数值,也不会越界。
    function counter(keys, x, y, t, o = {}) {
      if (!keys.length || t < keys[0][0]) return '';
      const r = R('R4'), size = o.size || r.size, fill = o.fill || r.fill, fmt = o.fmt || (v => String(v)), rd = o.roll ?? .5, anchor = o.anchor || 'start';
      let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
      const nw = fmt(keys[i][1]), od = i > 0 ? fmt(keys[i - 1][1]) : nw, k = i > 0 ? ease.out(seg(t, keys[i][0], keys[i][0] + rd)) : 1;
      const dir = i > 0 && keys[i][1] < keys[i - 1][1] ? -1 : 1;   // 变大:新数字从下往上进;变小:从上往下
      const len = Math.max(nw.length, od.length), A = nw.padStart(len, ' '), B = od.padStart(len, ' ');
      const dw = Math.max(...'0123456789'.split('').map(c => adv(c, r.en))) * size;   // 等宽数位,滚动时不抖
      const cw = c => /\d/.test(c) ? dw : c === ' ' ? 0 : adv(c, isZh(c) ? r.zh : r.en) * size;
      const cols = [...A].map((c, j) => Math.max(cw(c), cw(B[j])));
      const tw = cols.reduce((a, b) => a + b, 0), unitW = o.unit ? width('R3', ' ' + o.unit, size * .38) : 0;
      const x0 = ax(x, tw + unitW, anchor), kind = S.carriers.counter;
      const appear = seg(t, keys[0][0], keys[0][0] + .35);
      const chg = i > 0 ? 1 - seg(t, keys[i][0], keys[i][0] + .7) : 0;   // 变化后的强调,0.7s 衰减
      const strokeA = kind === 'outline' ? ` stroke="${S.c.ink}" stroke-width="${f1(size * .1)}" stroke-linejoin="round" paint-order="stroke fill"` : '';
      const glyph = (c, gx, gy, op, col) => c === ' ' ? '' : `<text x="${f1(gx)}" y="${f1(gy)}" text-anchor="middle" ${fontAttr(isZh(c) ? r.zh : r.en)} font-size="${size}" fill="${col}" opacity="${f2(op)}"${strokeA}>${esc(c)}</text>`;
      const col = (kind === 'glow' || kind === 'resource') && chg > 0 ? (kind === 'resource' ? S.c.gold : S.c.glow || fill) : fill;
      let out = '', cx = x0;
      const cid = id('n');
      out += `<clipPath id="${cid}"><rect x="${f1(x0 - 10)}" y="${f1(y - size * .8)}" width="${f1(tw + 20)}" height="${f1(size * .92)}"/></clipPath><g clip-path="url(#${cid})">`;
      [...A].forEach((a, j) => {
        const b = B[j], mid = cx + cols[j] / 2, travel = size * .92;   // 一个字高:窗口里永远只看到旧位滑出、新位滑入
        if (a === b || k >= 1) out += glyph(a, mid, y, 1, col);
        else { out += glyph(b, mid, y - dir * k * travel, 1 - k, col); out += glyph(a, mid, y + dir * (1 - k) * travel, k, col); }
        cx += cols[j];
      });
      out += '</g>';
      if (o.unit) out += staticRun(' ' + o.unit, x0 + tw, y, R('R3'), size * .38, o.unitFill || R('R3').fill, 'start');
      // 画风装饰
      let pre = '';
      if (kind === 'glow') pre = `<g filter="url(#vc-glow)" opacity="${f2(.35 + .5 * chg)}">${out}</g>`;
      if (kind === 'print' && chg > 0) pre = `<rect x="${f1(x0 - 12)}" y="${f1(y + size * .2)}" width="${f1(tw + 24)}" height="6" fill="${S.c.accent}" opacity="${f2(chg * .8)}" style="mix-blend-mode:multiply"/>`;
      if (kind === 'resource' && chg > 0) { const rr = size * (.4 + 1.2 * (1 - chg)); pre = `<circle cx="${f1(x0 + tw / 2)}" cy="${f1(y - size * .35)}" r="${f1(rr)}" fill="none" stroke="${S.c.gold}" stroke-width="4" opacity="${f2(chg)}"/>`; }
      const zp = (kind === 'outline' || kind === 'punch') && chg > 0 ? 1 + .07 * Math.sin(Math.PI * seg(t, keys[i][0], keys[i][0] + .3)) : 1;   // zoom punch(只放大字形,不改值)
      const sc = Math.max(.001, ease.out(appear)) * zp, ox = x0 + tw / 2, oy = y - size * .35;
      return `<g opacity="${f2(appear)}" transform="translate(${f1(ox)},${f1(oy)}) scale(${f3(sc)}) translate(${f1(-ox)},${f1(-oy)})">${pre}${out}</g>`;
    }

    // ---------- R7 气泡 / 对话框 ----------
    // (x,y) = 尾巴尖(说话的人那边);o.side = 1 往右长 / -1 往左长;o.t1 = 收起时间
    function bubble(s, x, y, t, t0, o = {}) {
      const t1 = o.t1 ?? 1e9; if (t < t0 || t > t1) return '';
      const r = R('R7'), size = o.size || r.size, side = o.side || 1, kind = S.carriers.bubble;
      const lines = wrap(s, 'R7', size, o.maxW || 760), lh = size * 1.32;
      const tw = Math.max(...lines.map(l => width('R7', l, size))), pad = size * .7, w = tw + pad * 2, h = lines.length * lh + pad * 1.15;
      const kin = seg(t, t0, t0 + .4), kout = seg(t, t1 - .25, t1);
      const bx = side > 0 ? -w * .18 : -w * .82, by = -h - 26;   // 气泡框左上(相对尾巴尖)
      const txt = lines.map((l, i) => staticRun(l, bx + pad, by + pad * .62 + size * .9 + i * lh, r, size, r.fill, 'start')).join('');
      if (kind === 'note') {   // 纸条:投影 + 纸色 + 胶带,从下方滑入并转正
        const k = ease.out(kin), rot = lerp(side * 6, side * -1.5, k), dy = (1 - k) * 40;
        return `<g transform="translate(${f1(x)},${f1(y + dy)}) rotate(${f2(rot)})" opacity="${f2(clamp(kin * 2.5) * (1 - kout))}">
          <rect x="${f1(bx + 4)}" y="${f1(by + 10)}" width="${f1(w)}" height="${f1(h)}" fill="#000" opacity=".3" filter="url(#vc-soft)"/>
          <rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" rx="2" fill="${S.c.note}"/><rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" fill="url(#vc-grain)" opacity=".16" style="mix-blend-mode:multiply"/>
          <rect x="${f1(bx + w / 2 - 50)}" y="${f1(by - 16)}" width="100" height="30" fill="${S.c.tape}" opacity=".75" transform="rotate(-3,${f1(bx + w / 2)},${f1(by)})"/>${txt}</g>`;
      }
      if (kind === 'card') {   // 圆角卡片 + 左侧强调条,淡入上滑
        const k = ease.out(kin);
        return `<g transform="translate(${f1(x)},${f1(y + 18 * (1 - k))})" opacity="${f2(k * (1 - kout))}">
          <rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" rx="14" fill="${S.c.surface}" stroke="${S.c.edge}" stroke-width="2"/>
          <rect x="${f1(bx)}" y="${f1(by + 14)}" width="5" height="${f1(h - 28)}" rx="2" fill="${S.c.accent}" filter="url(#vc-glow)"/><rect x="${f1(bx)}" y="${f1(by + 14)}" width="5" height="${f1(h - 28)}" rx="2" fill="${S.c.accent}"/>
          <path d="M-12,${f1(by + h - 1)} L0,-8 L12,${f1(by + h - 1)}" fill="${S.c.surface}" stroke="${S.c.edge}" stroke-width="2"/><rect x="-13" y="${f1(by + h - 3)}" width="26" height="4" fill="${S.c.surface}"/>${txt}</g>`;
      }
      if (kind === 'advisor') {   // 顾问对话框:深色面板 + 金边,从下方滑入
        const k = ease.out(kin);
        return `<g transform="translate(${f1(x)},${f1(y + 30 * (1 - k))})" opacity="${f2(k * (1 - kout))}">
          <rect x="${f1(bx + 4)}" y="${f1(by + 10)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="#000" opacity=".45" filter="url(#vc-soft)"/>
          <rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="${S.c.panel}" stroke="url(#vc-gold)" stroke-width="4"/>
          <path d="M-14,${f1(by + h - 2)} L0,-6 L14,${f1(by + h - 2)}" fill="${S.c.panel}" stroke="${S.c.gold}" stroke-width="3" stroke-linejoin="round"/><rect x="-16" y="${f1(by + h - 7)}" width="32" height="6" fill="${S.c.panel}"/>${txt}</g>`;
      }
      if (kind === 'flat') {   // 无描边圆角气泡,淡入 + 轻微放大
        const k = ease.out(kin), sc = lerp(.92, 1, k);
        return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f3(sc * (1 - kout * .2))})" opacity="${f2(k * (1 - kout))}">
          <rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(Math.min(28, h / 2))}" fill="${S.c.bubble || '#fff'}"/>
          <path d="M-16,${f1(by + h - 1)} L0,-6 L16,${f1(by + h - 1)}Z" fill="${S.c.bubble || '#fff'}"/>${txt}</g>`;
      }
      if (kind === 'line') {   // 细白线圆角气泡 + 尾巴,一笔画出,字再写出来(3b1b π 小人的气泡)
        const dB = [VC.shape.rect(bx, by, w, h, 24), `M-16,${f1(by + h)} L0,-6 L16,${f1(by + h)}`];
        return `<g transform="translate(${f1(x)},${f1(y)})" opacity="${f2(1 - kout)}"><rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" rx="24" fill="${S.c.bg}" opacity="${f2(seg(t, t0, t0 + .3) * .9)}"/>${sketch(dB, t, t0, .45, { color: S.c.text, width: 3, pen: false })}<g opacity="${f2(seg(t, t0 + .35, t0 + .6))}">${txt}</g></g>`;
      }
      if (kind === 'sketch') {   // 白板:手画的框 + 尾巴先画出来,字再出现
        const seedB = strSeed(s), dB = [VC.wobblyRect(bx, by, w, h, seedB, 3.5), VC.wobblyLine(-14, by + h + 2, 0, -6, seedB + 1, 1.5) + ' ' + VC.wobblyLine(0, -6, 14, by + h + 2, seedB + 2, 1.5).replace('M', 'L')];
        return `<g transform="translate(${f1(x)},${f1(y)})" opacity="${f2(1 - kout)}">${sketch(dB, t, t0, .45, { color: S.c.ink, width: 4.5, pen: false })}<g opacity="${f2(seg(t, t0 + .35, t0 + .6))}">${txt}</g></g>`;
      }
      // outline:白底粗描边气泡 + 尾巴,从尾巴尖回弹弹出
      const sc = Math.max(.001, ease.back(kin)) * (1 - kout * .3), lw = S.c.lw;
      return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f3(sc)})" opacity="${f2(clamp(kin * 3) * (1 - kout))}">
        <rect x="${f1(bx)}" y="${f1(by)}" width="${f1(w)}" height="${f1(h)}" rx="22" fill="#fff" stroke="${S.c.ink}" stroke-width="${lw}"/>
        <path d="M-16,${f1(by + h - 2)} L0,-4 L16,${f1(by + h - 2)}" fill="#fff" stroke="${S.c.ink}" stroke-width="${lw}" stroke-linejoin="round"/><rect x="-18" y="${f1(by + h - lw - 4)}" width="36" height="${lw + 4}" fill="#fff"/>${txt}</g>`;
    }

    // ---------- 窗口外框(AI 对话框、终端共用) ----------
    function frame(x, y, w, h, title, kind, dark) {
      const c = S.c;
      if (kind === 'bezel') {   // 纸面上的一台设备:深色机壳 + 屏幕
        const scr = dark ? c.screen : '#FBF8F1';
        return `<rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 36}" rx="26" fill="#000" opacity=".3" filter="url(#vc-soft)" transform="translate(5,12)"/>
          <rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 36}" rx="26" fill="${c.bezel}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${scr}"/>
          <text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" ${fontAttr(S.mono.en)} font-size="22" fill="${dark ? c.scrTxt : c.muted}">${esc(title)}</text>
          <path d="M${x} ${y + 54} H${x + w}" stroke="${dark ? c.scrGrid : '#E3DACA'}" stroke-width="2"/>`;
      }
      if (kind === 'win') {   // 科技深色窗口:标题栏 + 三个灰点 + 外辉光
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${c.accent}" opacity=".16" filter="url(#vc-soft)"/>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${c.win}" stroke="${c.edge}" stroke-width="2"/>
          <path d="M${x + 15} ${y + 1} H${x + w - 15} a14 14 0 0 1 14 14 V${y + 54} H${x + 1} V${y + 15} a14 14 0 0 1 14 -14Z" fill="${c.surface}"/><path d="M${x + 1} ${y + 54} H${x + w - 1}" stroke="${c.edge}" stroke-width="2"/>
          ${[0, 1, 2].map(i => `<circle cx="${x + 32 + i * 28}" cy="${y + 27}" r="7" fill="${c.dot}"/>`).join('')}
          <text x="${x + w / 2}" y="${y + 35}" text-anchor="middle" ${fontAttr(S.mono.en)} font-size="22" fill="${c.muted}">${esc(title)}</text>`;
      }
      if (kind === 'line') {   // 细灰线圆角框,标题小字在左上
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${dark ? (c.term || '#000') : (c.card || 'none')}" stroke="${c.line}" stroke-width="2.5"/>
          ${title ? staticRun(title, x + 28, y + 40, R('R3'), 24, c.muted, 'start') : ''}`;
      }
      if (kind === 'sketch') {   // 白板:手画的框,标题手写在框上沿,下面一条手画线
        const sd = strSeed(title) + x;
        return `<path d="${VC.wobblyRect(x, y, w, h, sd, 3.5)}" fill="${dark ? 'none' : 'none'}" stroke="${c.ink}" stroke-width="4.5" stroke-linecap="round"/>
          ${title ? staticRun(title, x + 28, y + 42, R('R2'), 30, c.ink, 'start') + `<path d="${VC.wobblyLine(x + 24, y + 58, x + Math.min(w - 24, 28 + layout(title, R('R2'), 30).w + 30), y + 58, sd + 3, 1.5)}" stroke="${c.blue || c.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>` : ''}`;
      }
      if (kind === 'sheet') {   // 一张纸:投影 + 纸色 + 纸纹 + 打字标题
        return `<rect x="${x + 5}" y="${y + 12}" width="${w}" height="${h}" fill="#000" opacity=".3" filter="url(#vc-soft)"/>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c.note}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-grain)" opacity=".14" style="mix-blend-mode:multiply"/>
          ${staticRun(title, x + 44, y + 56, R('R5'), 28, c.muted, 'start')}
          <path d="M${x + 44} ${y + 74} H${x + w - 44}" stroke="${c.accent}" stroke-opacity=".5" stroke-width="2"/>`;
      }
      if (kind === 'gold') {   // 游戏面板:深色底 + 金色渐变描边 + 内细线,标题用游戏标题字
        return `<rect x="${x + 6}" y="${y + 14}" width="${w}" height="${h}" rx="10" fill="#000" opacity=".5" filter="url(#vc-soft)"/>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${dark ? c.term : c.panel}" stroke="url(#vc-gold)" stroke-width="4"/>
          <rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" rx="6" fill="none" stroke="${c.gold}" stroke-opacity=".3" stroke-width="1.5"/>
          <path d="M${x + 20} ${y + 54} H${x + w - 20}" stroke="url(#vc-gold)" stroke-width="2"/>
          <text x="${x + w / 2}" y="${y + 38}" text-anchor="middle" ${fontAttr(S.roles.R2.zh)} font-size="26" fill="${c.gold}">${esc(title)}</text>`;
      }
      if (kind === 'flat' || kind === 'plate') {   // 扁平:无描边双色块(标题条深一档);plate:半透明深色牌
        const body = kind === 'plate' ? `fill="${c.plate}" opacity="${c.plateA ?? .62}"` : `fill="${dark ? c.term : c.card}"`;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" ${body}/>
          <path d="M${x + 18} ${y} H${x + w - 18} a18 18 0 0 1 18 18 V${y + 54} H${x} V${y + 18} a18 18 0 0 1 18 -18Z" fill="${kind === 'plate' ? '#000' : c.cardD}" opacity="${kind === 'plate' ? .25 : 1}"/>
          <text x="${x + 28}" y="${y + 37}" ${fontAttr(S.roles.R2.zh)} font-size="26" fill="${c.title || c.text}">${esc(title)}</text>`;
      }
      // outline:粗描边圆角窗口,马卡龙色标题栏
      return `<rect x="${x + 7}" y="${y + 9}" width="${w}" height="${h}" rx="22" fill="${c.ink}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${dark ? c.term : '#fff'}" stroke="${c.ink}" stroke-width="${c.lw}"/>
        <path d="M${x + 22} ${y} H${x + w - 22} a22 22 0 0 1 22 22 V${y + 54} H${x} V${y + 22} a22 22 0 0 1 22 -22Z" fill="${dark ? c.lilac : c.sky}" stroke="${c.ink}" stroke-width="${c.lw}"/>
        ${[c.pink, c.yolk, c.mint].map((f, i) => `<circle cx="${x + 34 + i * 30}" cy="${y + 27}" r="9" fill="${f}" stroke="${c.ink}" stroke-width="3"/>`).join('')}
        <text x="${x + w / 2}" y="${y + 37}" text-anchor="middle" ${fontAttr(S.roles.R2.zh)} font-size="26" fill="${c.ink}">${esc(title)}</text>`;
    }

    // ---------- AI / 聊天对话框(R7:机器说的话) ----------
    // msgs = [{who:'user'|'ai', text, t0}];用户消息整条弹出,AI 消息逐字打出带光标;版面按全文预排,打字时不跳
    function chat(x, y, w, h, msgs, t, o = {}) {
      const c = S.c, kind = S.carriers.window, size = o.size || 30, lh = size * 1.45, pad = 22, top = 54 + 22, maxW = w * .74;
      const bubbleSpec = { zh: S.roles.R7.zhUI || 'Noto Sans SC:500', en: S.roles.R7.enUI || S.roles.R3.en };
      const cid = id('ch');
      let out = frame(x, y, w, h, o.title || 'chat', kind, false) + `<clipPath id="${cid}"><rect x="${x}" y="${y + 56}" width="${w}" height="${h - 58}"/></clipPath>`;
      // 先排版:每条消息高度、出现进度
      let cy = 0; const items = msgs.map(m => {
        const lines = wrap(m.text, bubbleSpec, size, maxW - pad * 2), bh = lines.length * lh + pad * 1.1;
        const bw = Math.max(...lines.map(l => layout(l, bubbleSpec, size).w)) + pad * 2;
        const k = seg(t, m.t0, m.t0 + .35), it = { m, lines, bh, bw, y: cy, k }; cy += bh + 18; return it;
      });
      // 自动滚动:已出现内容超过窗口高度就往上推(随出现进度平滑)
      let shown = 0; items.forEach(it => { if (it.k > 0) shown = it.y + it.bh * ease.out(it.k); });
      const scroll = Math.max(0, shown - (h - top - 20));
      out += `<g clip-path="url(#${cid})"><g transform="translate(0,${f1(-scroll)})">`;
      items.forEach(it => {
        if (it.k <= 0) return;
        const user = it.m.who === 'user', bx = user ? x + w - pad - it.bw : x + pad, by = y + top + it.y;
        const fill = user ? c.chatU : c.chatA, stroke = kind === 'outline' ? c.ink : kind === 'win' ? (user ? c.accent : c.edge) : kind === 'gold' ? c.gold : (user ? '#D6C8A8' : '#E3DCCB');
        const sw = kind === 'outline' ? 4 : kind === 'flat' || kind === 'plate' ? 0 : 2, txtCol = c.chatTxt || (kind === 'win' ? c.text : '#24302A');
        const k = user ? ease.back(it.k) : ease.out(it.k), ox = user ? bx + it.bw : bx;
        let inner = `<rect x="${f1(bx)}" y="${f1(by)}" width="${f1(it.bw)}" height="${f1(it.bh)}" rx="${kind === 'outline' ? 20 : 16}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
        if (user) inner += it.lines.map((l, i) => staticRun(l, bx + pad, by + pad * .55 + size + i * lh, bubbleSpec, size, txtCol, 'start')).join('');
        else {   // AI:逐字打出,跨行接着打
          const cpsA = o.cps || (hasCJK(it.m.text) ? 16 : 38); let tt = it.m.t0 + .2;
          it.lines.forEach((l, i) => {
            const d = [...l].length / cpsA, last = i === it.lines.length - 1;
            inner += typeRun(l, bx + pad, by + pad * .55 + size + i * lh, t, tt, d, { ...bubbleSpec, cursor: t < tt + d || (last && t < tt + d + 1.2), cursorHold: last ? 1.2 : 0, cursorFill: c.accent }, size, txtCol, 'start');
            tt += d;
          });
        }
        out += `<g opacity="${f2(clamp(it.k * 3))}" transform="translate(${f1(ox)},${f1(by)}) scale(${f3(Math.max(.001, k))}) translate(${f1(-ox)},${f1(-by)})">${inner}</g>`;
      });
      return out + '</g></g>';
    }

    // ---------- 终端窗口(命令与输出;自己的风格,不仿真实产品) ----------
    // lines = [{cmd, t0} | {out, t0, col?}];命令逐字打出,输出整行出现
    function terminal(x, y, w, h, lines, t, o = {}) {
      const c = S.c, kind = S.carriers.window, size = o.size || 30, lh = size * 1.5, spec = { zh: S.mono.zh, en: S.mono.en };
      const txt = kind === 'bezel' ? c.scrTxt : kind === 'win' ? c.text : c.termTxt, pr = kind === 'bezel' ? c.scrHi : kind === 'win' ? c.accent : c.termHi || c.yolk;
      let out = frame(x, y, w, h, o.title || 'terminal', kind, true), cy = y + 54 + 26 + size, lastEnd = -1e9, lastX = x + 32, lastY = cy;
      lines.forEach(L => {
        if (t < L.t0) return;
        if (L.cmd != null) {
          const pw = layout('› ', spec, size).w, d = [...L.cmd].length / (o.cps || 16);
          out += staticRun('›', x + 32, cy, spec, size, pr, 'start') + typeRun(L.cmd, x + 32 + pw, cy, t, L.t0, d, { ...spec }, size, txt, 'start');
          lastEnd = L.t0 + d; lastX = x + 32 + pw + layout([...L.cmd].slice(0, Math.min([...L.cmd].length, Math.floor(seg(t, L.t0, L.t0 + d) * [...L.cmd].length + 1))).join(''), spec, size).w; lastY = cy;
        } else {
          const k = seg(t, L.t0, L.t0 + .15);
          out += `<g opacity="${f2(k)}">${staticRun(L.out, x + 32, cy, spec, size, L.col ? c[L.col] || L.col : (kind === 'win' ? c.muted : txt), 'start')}</g>`;
          lastEnd = L.t0; lastX = x + 32; lastY = cy + lh;
        }
        cy += lh;
      });
      // 光标:打字时常亮,停下后闪烁
      const on = t < lastEnd + .05 || Math.floor((t - lastEnd) * 2) % 2 === 0;
      if (on) out += `<rect x="${f1(lastX + 4)}" y="${f1(lastY - size * .82)}" width="${f1(size * .55)}" height="${f1(size)}" fill="${pr}" opacity=".85"/>`;
      return out;
    }

    // ---------- 章节进度条(频道统一;颜色取画风的强调色) ----------
    function chapterBar(t, chapters, o = {}) {
      const total = o.total ?? chapters[chapters.length - 1].end, L = o.x ?? 40, Rr = L + (o.w ?? 1840), Y = o.y ?? 1058, gap = 8, FS = o.size || 22;
      const span = Rr - L - gap * (chapters.length - 1), font = S.bar.font, ink = S.bar.ink, acc = S.bar.accent;
      const out = o.shade === false ? [] : [`<rect x="0" y="${Y - 42}" width="1920" height="64" fill="url(#vc-barShade)"/>`], labs = [];
      let x = L;
      chapters.forEach((ch, i) => {
        const w = span * (ch.end - ch.start) / total, cur = t >= ch.start && t < ch.end, done = t >= ch.end, k = cur ? seg(t, ch.start, ch.end) : done ? 1 : 0;
        out.push(`<rect x="${f1(x)}" y="${Y}" width="${f1(w)}" height="8" rx="4" fill="${S.bar.track}" opacity=".32"/>`);
        if (k > 0) out.push(`<rect x="${f1(x)}" y="${Y}" width="${f1(w * k)}" height="8" rx="4" fill="${cur ? acc : S.bar.track}" opacity="${cur ? 1 : .75}"/>`);
        const s = `${i + 1} ${ch.name}`; labs.push({ x: x + 2, w: layout(s, { zh: font, en: font }, FS).w, seg: w, s, cur }); x += w + gap;
      });
      const cur = labs.find(l => l.cur);
      labs.forEach(l => {   // 放不下、或和当前章节标签重叠的就不写
        if (!l.cur && (l.w > l.seg - 6 || (cur && l.x < cur.x + cur.w + 12 && cur.x < l.x + l.w + 12))) return;
        out.push(`<text x="${f1(l.x)}" y="${Y - 10}" font-family="${fontOf(font).fam}, sans-serif" font-weight="${l.cur ? 900 : 500}" font-size="${FS}" fill="${S.bar.text}" opacity="${l.cur ? 1 : .62}" stroke="${ink}" stroke-width="5" stroke-linejoin="round" paint-order="stroke fill">${esc(l.s)}</text>`);
      });
      return out.join('');
    }

    // ---------- 段首横移:把一排面板按 VC.pan 平移,移动时加横向运动模糊 ----------
    // panels = [fn(t) → 面板内容 SVG],每块宽 o.width;只画在视野里的块
    function panGroup(t, starts, panels, o = {}) {
      const W = o.width || 1920, p = VC.pan(t, starts, { ...o, width: W }), bid = id('mb');
      const blur = o.blur === false ? 0 : p.blur;
      let inner = '';
      panels.forEach((fn, i) => { if (Math.abs(i * W - p.x) < W) inner += `<g transform="translate(${i * W},0)">${fn(t)}</g>`; });
      const flt = blur > .3 ? `<filter id="${bid}" x="-5%" y="0" width="110%" height="100%"><feGaussianBlur stdDeviation="${f1(blur)},0"/></filter>` : '';
      return `${flt}<g transform="translate(${f1(-p.x)},0)"${flt ? ` filter="url(#${bid})"` : ''}>${inner}</g>`;
    }

    // ---------- 手绘:逐笔画出(笔尖跟一支马克笔)、排线填色 ----------
    // d 可以是一条或多条路径(数组按顺序一笔接一笔,总时长 dur 按长度分);o.pen = false 不画笔
    function sketch(d, t, t0, dur, o = {}) {
      const ds = [].concat(d); if (t < t0) return '';
      const col = o.color || S.c.ink, w = o.width || 6, lens = ds.map(x => VC.pathPoint(x, 0).len), tot = lens.reduce((a, b) => a + b, 0);
      const k = seg(t, t0, t0 + dur) * tot; let acc = 0, out = '', tip = null;
      ds.forEach((x, i) => {
        const kk = clamp((k - acc) / lens[i]); acc += lens[i];
        if (kk <= 0) return;
        out += `<path d="${x}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f3(1 - kk)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.opacity ? ` opacity="${o.opacity}"` : ''}/>`;
        if (kk < 1) tip = VC.pathPoint(x, kk);
      });
      if (tip && o.pen !== false && t < t0 + dur) out += marker(tip.x, tip.y, col);
      return out;
    }
    // 马克笔:笔尖在 (x,y),笔身朝右下 35°;笔帽颜色 = 墨色
    function marker(x, y, col) {
      if (S.tool === 'chalk') return `<g transform="translate(${f1(x)},${f1(y)}) rotate(-35)"><rect x="0" y="-9" width="70" height="18" rx="8" fill="${col}" opacity=".95"/><rect x="0" y="-9" width="70" height="18" rx="8" fill="url(#vc-grain)" opacity=".35" style="mix-blend-mode:multiply"/></g>`;   // 一截粉笔
      return `<g transform="translate(${f1(x)},${f1(y)}) rotate(-35)"><g transform="translate(0,0)">
        <path d="M0,0 L18,-7 L18,7 Z" fill="${col}"/><rect x="18" y="-11" width="22" height="22" rx="3" fill="#E6E6E2" stroke="#9AA0A6" stroke-width="2"/>
        <rect x="40" y="-14" width="110" height="28" rx="8" fill="#FAFAF8" stroke="#9AA0A6" stroke-width="2"/><rect x="118" y="-15" width="40" height="30" rx="8" fill="${col}"/>
        <rect x="60" y="-6" width="40" height="5" rx="2" fill="${col}" opacity=".5"/></g></g>`;
    }
    // 排线:斜线一条条画进框里(或任意路径 o.clip 里)
    function hatch(x, y, w, h, t, t0, dur, o = {}) {
      if (t < t0) return '';
      const gap = o.gap || 14, col = o.color || S.c.ink, cid = id('ht'), n = Math.ceil((w + h) / gap), k = seg(t, t0, t0 + dur) * n;
      let lines = '';
      for (let i = 0; i < n && i < k; i++) { const a = x + i * gap, jit = (h2(i, 7, 31) - .5) * 4; lines += `<path d="M${f1(a + jit)},${f1(y - 4)} L${f1(a - h + jit)},${f1(y + h + 4)}" stroke="${col}" stroke-width="${o.width || 2.5}" stroke-linecap="round" opacity="${o.opacity ?? .7}"/>`; }
      return `<clipPath id="${cid}">${o.clip ? `<path d="${o.clip}"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`}</clipPath><g clip-path="url(#${cid})">${lines}</g>`;
    }

    // ---------- 占位角色(画风样张用的统一角色):圆身子 + 头顶一棵小芽 + 眼睛;画法跟画风走 ----------
    // 故意不做成任何动物:频道吉祥物属于各频道自己(profiles/),共享组件只给一个中性占位。
    const sproutD = (x, top) => [
      `M${x},${top + 6} Q${x + 2},${top - 18} ${x + 4},${top - 40}`,
      `M${x + 4},${top - 40} Q${x - 22},${top - 74} ${x - 50},${top - 52} Q${x - 22},${top - 30} ${x + 4},${top - 40} Z`,
      `M${x + 4},${top - 40} Q${x + 34},${top - 84} ${x + 62},${top - 60} Q${x + 34},${top - 32} ${x + 4},${top - 40} Z`];
    // 白板(bubble = sketch):线稿一笔笔画出来,右半边排线当暗面;t0 = 开始画的时间
    function mascot(x, feet, t = 1e9, t0 = -1e9) {
      const c = S.c, b = S.carriers.bubble, r = 92, cy = feet - r, body = c.marker || c.accent || c.yolk;
      if (b === 'sketch') {
        const sd = 17, head = VC.wobblyEllipse(x, cy, r, r, sd, 2.5, 1.04), [stem, leafL, leafR] = sproutD(x, cy - r);
        const eyes = [VC.wobblyLine(x - 31, cy - 20, x - 29, cy - 4, 5, .5), VC.wobblyLine(x + 29, cy - 20, x + 31, cy - 4, 6, .5)];
        const mouth = `M${x - 16},${cy + 22} Q${x},${cy + 36} ${x + 16},${cy + 22}`;
        return sketch([head, stem, leafL, leafR], t, t0, 1.4, { color: c.ink, width: 5 })
          + hatch(x, cy - r, r + 4, 2 * r, t, t0 + 1.4, .5, { clip: head, color: c.ink, gap: 13, opacity: .45 })
          + sketch([...eyes, mouth], t, t0 + 1.9, .45, { color: c.ink, width: 7 });
      }
      if (b === 'line') {   // 3b1b π 小人的画法:蓝深色实心身子、无描边,大白眼 + 黑瞳孔(看向左上的气泡)
        const bd = c.pi || c.accent, eye = (ex) => `<ellipse cx="${ex}" cy="${cy - 18}" rx="20" ry="24" fill="#fff"/><circle cx="${ex - 7}" cy="${cy - 24}" r="10" fill="#000"/><circle cx="${ex - 10}" cy="${cy - 28}" r="3" fill="#fff"/>`;
        const [st, lL, lR] = sproutD(x, cy - r), sprout = `<path d="${st}" fill="none" stroke="${bd}" stroke-width="8" stroke-linecap="round"/><path d="${lL}" fill="${bd}"/><path d="${lR}" fill="${bd}"/>`;
        return `${sprout}<circle cx="${x}" cy="${cy}" r="${r}" fill="${bd}"/>${eye(x - 26)}${eye(x + 26)}<path d="M${x - 18},${cy + 30} Q${x},${cy + 42} ${x + 18},${cy + 30}" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>`;
      }
      const stroke = b === 'outline' ? ` stroke="${c.ink}" stroke-width="${c.lw}"` : b === 'note' ? ` stroke="${c.ink}" stroke-width="3"` : '';
      const shade = b === 'flat' ? `<path d="M${x},${cy - r} A${r},${r} 0 0 1 ${x},${cy + r} Z" fill="#000" opacity=".14"/>` : '';
      const rim = b === 'advisor' ? `<circle cx="${x}" cy="${cy}" r="${r + 6}" fill="none" stroke="url(#vc-gold)" stroke-width="6"/>`
        : b === 'card' ? `<circle cx="${x}" cy="${cy}" r="${r + 4}" fill="none" stroke="${c.glow}" stroke-width="4" filter="url(#vc-glow)"/>` : '';
      const [st, lL, lR] = sproutD(x, cy - r), leaf = body;
      const sprout = `<path d="${st}" fill="none" stroke="${c.ink}" stroke-width="6" stroke-linecap="round"/><path d="${lL}" fill="${leaf}"${stroke}/><path d="${lR}" fill="${leaf}"${stroke}/>`;
      return `<ellipse cx="${x}" cy="${feet + 6}" rx="${r * .9}" ry="14" fill="#000" opacity=".25"/>${sprout}
        <circle cx="${x}" cy="${cy}" r="${r}" fill="${body}"${stroke}/>${shade}${rim}
        <circle cx="${x - 30}" cy="${cy - 12}" r="9" fill="${c.ink}"/><circle cx="${x + 30}" cy="${cy - 12}" r="9" fill="${c.ink}"/>
        <path d="M${x - 14},${cy + 22} Q${x},${cy + 32} ${x + 14},${cy + 22}" fill="none" stroke="${c.ink}" stroke-width="5" stroke-linecap="round"/>`;
    }

    // ---------- 字幕:按 subs 生成的 window.SUBS 画当前那一条(频道统一的规格,不随画风换) ----------
    // o:{ font:'Noto Sans SC:900', size:52, y:1040(最后一行基线), x:960, fill:'#fff', stroke:'#000', strokeWidth:10, box:false(true = 半透明黑底条),
    //     maxW(一行最宽,默认 1800;竖版传 960)}——超宽就在最靠中间的空格处折成两行,还超就整体缩字号
    function subtitle(t, cues, o = {}) {
      const cue = (cues || []).find(c => t >= c.start && t < c.end);
      if (!cue) return '';
      const font = o.font || 'Noto Sans SC:900', x = o.x ?? 960, y = o.y ?? 1040, maxW = o.maxW ?? 1800;
      let size = o.size || 52, lines = [cue.text];
      if (VC.textW(cue.text, font, size) > maxW) {
        const sp = [...cue.text.matchAll(/ /g)].map(m => m.index), mid = cue.text.length / 2;
        const cut = sp.length ? sp.reduce((a, b) => Math.abs(b - mid) < Math.abs(a - mid) ? b : a) : Math.round(mid);
        lines = [cue.text.slice(0, cut).trim(), cue.text.slice(cut).trim()];
        const widest = Math.max(...lines.map(l => VC.textW(l, font, size)));
        if (widest > maxW) size *= maxW / widest;
      }
      const lh = size * 1.25, stroke = o.box ? '' : ` stroke="${o.stroke || '#000'}" stroke-width="${o.strokeWidth ?? 10}" stroke-linejoin="round" paint-order="stroke"`;
      let out = '';
      lines.forEach((l, i) => {
        const ly = y - (lines.length - 1 - i) * lh;
        if (o.box) { const w = VC.textW(l, font, size); out += `<rect x="${x - w / 2 - size * .4}" y="${ly - size * 1.05}" width="${w + size * .8}" height="${size * 1.45}" rx="${size * .2}" fill="#000" opacity=".55"/>`; }
        out += `<text x="${x}" y="${ly}" text-anchor="middle" ${VC.fontAttr(font)} font-size="${size}" fill="${o.fill || '#fff'}"${stroke}>${VC.esc(l)}</text>`;
      });
      return out;
    }

    // ---------- 转场:A、B 是两个镜头的画面函数 fn(t) → 整屏 SVG ----------
    // 参数默认取 design/camera-transitions.md 转场库(出处见那张表);t0 = 转场开始。
    const TX_DUR = { 'slide-push': .5, 'blur-push': .55, 'zoom-through': 1.2, morph: .9, fade: .35, 'fill-zoom': .7, bands: .5 };
    const scaleAt = (cx, cy, s, inner) => `<g transform="translate(${f1(cx)},${f1(cy)}) scale(${f3(s)}) translate(${f1(-cx)},${f1(-cy)})">${inner}</g>`;
    const blurG = (b, inner, op = 1) => {
      if (op <= 0) return '';
      if (b < .3) return op < 1 ? `<g opacity="${f3(op)}">${inner}</g>` : inner;
      const fid = id('bl');
      return `<filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${f1(b)}"/></filter><g filter="url(#${fid})"${op < 1 ? ` opacity="${f3(op)}"` : ''}>${inner}</g>`;
    };
    function transition(kind, t, t0, A, B, o = {}) {
      const d = o.dur ?? TX_DUR[kind], p = seg(t, t0, t0 + d);
      if (kind === 'morph') {   // A、B 都不画那个形变的对象;它由 o.from / o.to 画
        const k = ease.smooth(p), fr = o.from, to = o.to;
        const shape = `<path d="${p <= 0 ? fr.d : p >= 1 ? to.d : VC.morphPath(fr.d, to.d, k)}" fill="${VC.lerpColor(fr.fill, to.fill, k)}"${fr.stroke ? ` stroke="${fr.stroke}" stroke-width="${fr.sw || 4}"` : ''}/>`;
        if (p <= 0) return shape + A(t);   // 形状在下,两镜头的字可以压在它上面
        if (p >= 1) return shape + B(t);
        const ka = 1 - ease.out(seg(p, 0, .45)), kb = ease.out(seg(p, .55, 1));   // 旧镜头其余元素先退场,新镜头的后进场
        return (o.base ? o.base(t) : '') + shape + blurG(0, A(t), ka) + blurG(0, B(t), kb);
      }
      if (p <= 0) return A(t);
      if (p >= 1) return B(t);
      if (kind === 'fade') return A(t) + blurG(0, B(t), o.linear === false ? ease.inOut(p) : p);   // 线性交叉淡化(A6 的做法);量转场时当阳性对照
      if (kind === 'fill-zoom') {   // 冲进上一屏的某个形(它的颜色 = 下一屏底色):前 55% expoIn 放大到 30 倍,后 45% B 从 1.25 expoOut 落回 1
        const { cx = 960, cy = 540 } = o;
        if (p < .55) { const z = lerp(1, 30, ease.expoIn(p / .55)); return `<g transform="translate(${f1(cx)},${f1(cy)}) scale(${f3(z)}) translate(${f1(-cx)},${f1(-cy)})">${A(t)}</g>`; }
        return scaleAt(960, 540, lerp(1.25, 1, ease.expoOut((p - .55) / .45)), B(t));
      }
      if (kind === 'bands') {   // 三条斜切色带接力扫过,最后一条 = 新底色;0.5s expoInOut,错开 12%
        const cols = o.colors || [S.c.accent, S.c.marker || S.c.text, S.c.bg], last = Math.max(0, ...cols.map((_, i) => seg(p, i * .12, i * .12 + .76)));
        const band = (k, col) => { const x0 = lerp(-2600, 0, ease.expoInOut(k)); return `<path d="M${f1(x0)},0 H${f1(x0 + 2300)} L${f1(x0 + 2600)},1080 H${f1(x0 + 300)} Z" fill="${col}"/>`; };
        const k3 = seg(p, .24, 1), cover = ease.expoInOut(k3) >= .999;
        return (cover ? B(t) : A(t)) + (cover ? '' : cols.map((c2, i) => band(seg(p, i * .12, i * .12 + .76), c2)).join(''));
      }
      if (kind === 'slide-push') {   // 新面板推入、旧面板推出,品牌色竖条领路;cubic-bezier(.7,0,.2,1)
        const k = ease.push(p), W = 1920, bw = o.bar ?? 28, x = W * (1 - k);
        return `<g transform="translate(${f1(x - W)},0)">${A(t)}</g><g transform="translate(${f1(x)},0)">${B(t)}</g>
          <rect x="${f1(x - bw)}" y="0" width="${bw}" height="1080" fill="${o.color || S.c.accent}"/>`;
      }
      if (kind === 'blur-push') {   // 旧:缩到 .92 + 模糊 24 + 淡出;新:1.06 带模糊落到 1;底下垫 1.08 的重模糊旧画面防黑边。CSS ease
        const k = ease.css(p);
        return blurG(40, scaleAt(960, 540, 1.08, A(t)))
          + blurG(24 * k, scaleAt(960, 540, lerp(1, .92, k), A(t)), 1 - k)
          + blurG(24 * (1 - k), scaleAt(960, 540, lerp(1.06, 1, k), B(t)), k);
      }
      if (kind === 'zoom-through') {   // 相机绕 (cx,cy) 半径 r0 的物体指数推近,zoom = Z^e;物体变开口,露出 B
        const { cx, cy, r0 } = o, Z = Math.max(o.Z || 0, 1100 / r0 * 1.05), e = ease.smooth(p), z = Math.pow(Z, e);
        const px = lerp(cx, 960, e), py = lerp(cy, 540, e), cid = id('zt'), sb = z / Z, R = r0 * z;
        const camA = `<g transform="translate(${f1(px)},${f1(py)}) scale(${f3(z)}) translate(${f1(-cx)},${f1(-cy)})">${A(t)}</g>`;
        const camB = `<g transform="translate(${f1(px)},${f1(py)}) scale(${(+sb).toFixed(5)}) translate(-960,-540)">${backdrop(-1920, -1080, 5760, 3240)}${B(t)}</g>`;   // 开口是圆、画面是矩形:底子往外铺三屏,开口里不露上一镜
        const fade = clamp(e / .12);   // 开口刚出现时 B 很小,先淡入
        return camA + `<clipPath id="${cid}"><circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(R)}"/></clipPath><g clip-path="url(#${cid})" opacity="${f3(fade)}">${camB}</g>`;
      }
      throw new Error('没有这个转场:' + kind);
    }

    // ---------- 公共 defs 与底子 ----------
    function defs() {
      return `<filter id="vc-soft" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="9"/></filter>
        <filter id="vc-glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="vc-smudge" filterUnits="userSpaceOnUse" x="-200" y="-200" width="2320" height="1480"><feGaussianBlur stdDeviation="22"/></filter>
        <filter id="vc-chalk" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="4" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
        <filter id="vc-mottle" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="7" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.95" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
        <pattern id="vc-grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${noiseURL()}" width="256" height="256"/></pattern>
        <linearGradient id="vc-barShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${S.bar.shade ?? .38}"/></linearGradient>
        <radialGradient id="vc-vig" cx=".5" cy=".5" r=".78"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${S.vig ?? .25}"/></radialGradient>
        <pattern id="vc-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0 H0 V48" fill="none" stroke="${S.c.line || '#000'}" stroke-width="1"/></pattern>
        <linearGradient id="vc-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.c.goldL || '#F6E3A1'}"/><stop offset=".5" stop-color="${S.c.gold || '#D4A846'}"/><stop offset="1" stop-color="${S.c.goldD || '#8A6420'}"/></linearGradient>
        <pattern id="vc-hex" width="60" height="104" patternUnits="userSpaceOnUse"><path d="M30 0 L60 17 V52 L30 69 L0 52 V17Z M30 69 V104" fill="none" stroke="${S.c.line || '#000'}" stroke-width="1.2"/></pattern>
        <linearGradient id="vc-sky" x1="0" y1="0" x2="0" y2="1">${(S.c.sky3 || ['#000', '#000', '#000']).map((col, i) => `<stop offset="${[0, .62, 1][i]}" stop-color="${col}"/>`).join('')}</linearGradient>
        <linearGradient id="vc-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.c.fog || '#fff'}" stop-opacity="0"/><stop offset=".55" stop-color="${S.c.fog || '#fff'}" stop-opacity=".32"/><stop offset="1" stop-color="${S.c.fog || '#fff'}" stop-opacity="0"/></linearGradient>
        <radialGradient id="vc-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${S.c.sun || '#fff'}" stop-opacity=".9"/><stop offset="1" stop-color="${S.c.sun || '#fff'}" stop-opacity="0"/></radialGradient>
        <pattern id="vc-dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="2.4" fill="${S.c.dots || '#000'}"/></pattern>`;
    }
    // 底子:画风的「桌面 / 屏幕 / 纸」(场景可以盖掉它,演示页用)
    function backdrop(x, y, w, h) {
      const c = S.c, b = S.carriers.backdrop;
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.bg}"/>`;
      if (b === 'paper') s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-grain)" opacity=".22" style="mix-blend-mode:multiply"/>`;
      if (b === 'grid') s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-grid)" opacity=".5"/>`;
      if (b === 'dots') s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-dots)" opacity=".5"/>`;
      if (b === 'game') s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-hex)" opacity=".35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-vig)"/>`;
      if (b === 'solid') s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-grain)" opacity=".06" style="mix-blend-mode:overlay"/>`;
      if (b === 'chalkboard') {   // 黑板:深绿板 + 颗粒 + 板擦擦过的灰白痕;整屏时加木框
        s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.bg}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-grain)" opacity=".1" style="mix-blend-mode:screen"/>`
          + [0, 1, 2, 3, 4].map(i => `<path d="${VC.wobblyLine(x + w * (.05 + h2(i, 3, 51) * .5), y + h * (.15 + h2(i, 4, 51) * .7), x + w * (.4 + h2(i, 5, 51) * .55), y + h * (.1 + h2(i, 6, 51) * .8), i + 19, 10)}" stroke="#FFFFFF" stroke-width="${60 + i * 18}" opacity=".04" fill="none" stroke-linecap="round" filter="url(#vc-smudge)"/>`).join('');
        if (w >= 1920 && h >= 1080) s += `<rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" fill="none" stroke="#6B4A2E" stroke-width="18"/><rect x="${x + 18}" y="${y + 18}" width="${w - 36}" height="${h - 36}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`;
      }
      if (b === 'whiteboard') {   // 白板:近白底 + 擦过没擦干净的淡痕;整屏时加一圈铝框
        s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.bg}"/>`
          + [0, 1, 2, 3].map(i => `<path d="${VC.wobblyLine(x + w * (.1 + h2(i, 3, 41) * .6), y + h * (.2 + h2(i, 4, 41) * .6), x + w * (.3 + h2(i, 5, 41) * .6), y + h * (.15 + h2(i, 6, 41) * .7), i + 9, 6)}" stroke="#8C949C" stroke-width="${14 + i * 5}" opacity=".022" fill="none" stroke-linecap="round"/>`).join('');
        if (w >= 1920 && h >= 1080) s += `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="none" stroke="#B9C0C6" stroke-width="12"/><rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" fill="none" stroke="#DDE1E4" stroke-width="2"/>`;
      }
      if (b === 'landscape') {   // 多层景深:天空渐变、太阳光晕、远山两排、雾带、近景山丘;最后一层颗粒
        const X = v => f1(x + v * w), Y = v => f1(y + v * h), ridge = (base, amp, seed, n = 9) => {
          let d = `M${X(0)},${Y(1)} L${X(0)},${Y(base)}`;
          for (let i = 1; i <= n; i++) d += ` L${X(i / n)},${Y(base - amp * (.35 + .65 * h2(i, seed, 3)) * (i % 2 ? 1 : .45))}`;
          return d + ` L${X(1)},${Y(1)}Z`;
        };
        s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-sky)"/>
          <circle cx="${X(.72)}" cy="${Y(.5)}" r="${f1(h * .42)}" fill="url(#vc-sun)"/><circle cx="${X(.72)}" cy="${Y(.5)}" r="${f1(h * .07)}" fill="${c.sun}"/>
          <path d="${ridge(.62, .2, 1, 11)}" fill="${c.far}"/><path d="${ridge(.7, .16, 2, 8)}" fill="${c.mid}"/>
          <rect x="${x}" y="${Y(.58)}" width="${w}" height="${f1(h * .26)}" fill="url(#vc-fog)"/>
          <path d="M${X(0)},${Y(1)} L${X(0)},${Y(.84)} Q${X(.3)},${Y(.74)} ${X(.6)},${Y(.86)} T${X(1)},${Y(.82)} L${X(1)},${Y(1)}Z" fill="${c.near}"/>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vc-grain)" opacity=".09" style="mix-blend-mode:overlay"/>`;
      }
      return s;
    }

    // 粉笔画风:对外导出的组件统一套粉笔颗粒滤镜(内部互相调用不重复套;章节进度条是频道统一的,不套)
    const ck = fn => S.chalk ? (...a) => { const v = fn(...a); return v ? `<g filter="url(#vc-chalk)">${v}</g>` : v; } : fn;
    return {
      S, lang, begin: () => { UID = 0; }, R, layout, width, wrap, fit, dur, markUnder: ['marker', 'block'].includes(S.carriers.mark),   // 这两种批注要压在字下面
      panel: ck((x, y, w, h, title = '', dark = false) => frame(x, y, w, h, title, S.carriers.panel || S.carriers.window, dark)),   // 信息面板;画风可单独给 panel 造型
      transition, subtitle, txDur: k => TX_DUR[k], sketch: ck(sketch), hatch: ck(hatch), marker, mascot: ck(mascot),
      text: ck(text), textFit: ck(textFit), mark: ck(mark), stamp: ck(stamp), counter: ck(counter), bubble: ck(bubble), chat: ck(chat), terminal: ck(terminal), chapterBar, panGroup, defs, backdrop,
    };
  };
})();
