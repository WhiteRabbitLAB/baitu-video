// 小票部件(热敏小票画风的附加模块;别的画风也能用,颜色取画风的 c.paper / c.ink)
// 用法:<script src=".../vc/vc.js"></script><script src=".../vc/styles.js"></script><script src=".../vc/receipt.js"></script>
//   const kit = VC.kit('thermal'), rc = VC.receipt(kit, { onPrint, onFeed });
//   每帧照常 kit.begin()(小票的裁剪区编号跟着归零,横移时两个镜头同帧也不会撞 id)。
// 第 13 期整片里抽出来的(2026-10-10):边打边长的小票、出纸口、1 位像素图标、条码、点阵曲线 / 散点 / 网点条、「走纸」竖推转场。
(function () {
  const { seg, ease, h2, clamp } = VC;
  const f1 = v => (+v).toFixed(1);

  // 1 位像素小图:'#' = 打一个黑点。热敏打印机只会打黑点,所以图标只有一种颜色;px = 每格边长(7–8 合适)
  const SPRITES = {
    sandwich: ['......##......', '.....#..#.....', '....#....#....', '...#......#...', '..#........#..', '.############.', '.#.#.#.#.#.##.', '.############.', '.#..........#.', '.############.'],
    chips: ['..####...####.', '.#....#.#....#', '.#.##.#.#.##.#', '.#....#.#....#', '..####...####.', '....####......', '...#....#.....', '...#.##.#.....', '...#....#.....', '....####......'],
    cookie: ['...######...', '..#......#..', '.#..#...#..#', '.#........##', '.#...#.....#', '.#.#....#..#', '..#......#..', '...######...'],
    cereal: ['..#.#..#.#..', '.#.#.##.#.#.', '############', '#..........#', '.#........#.', '..########..'],
    banana: ['..........##', '.........#.#', '........#..#', '.......#..#.', '.....##..#..', '...##...#...', '##....##....', '#..###......', '.##.........'],
    egg: ['...####...', '..#....#..', '.#..##..#.', '#..####..#', '#..####..#', '#...##...#', '.#......#.', '..######..'],
    cheese: ['......####', '...###...#', '###......#', '#.##..#..#', '#..#.....#', '#.....##.#', '##########'],
    berry: ['.##..##...', '#..##..#..', '#..##..#..', '.##..##.##', '...##..#..#', '..#..#.#..#', '..#..#..##.', '...##......'],
    person: ['..###..', '..###..', '...#...', '.#####.', '#.###.#', '..###..', '..#.#..', '..#.#..', '.##.##.'],
    scale: ['.........', '.#######.', '.#.###.#.', '.#.#.#.#.', '.#..#..#.', '.#######.', '#########'],
    muffin: ['...####...', '..#.#..#..', '.#..#.#..#', '##########', '.#.#.#.#.#', '.#.#.#.#.#', '..######..'],
    nut: ['....##....', '...#..#...', '..#.#..#..', '.#..#...#.', '.#...#..#.', '..#....#..', '...####...'],
    wheat: ['....#....', '...#.#...', '..#.#.#..', '...#.#...', '..#.#.#..', '...#.#...', '....#....', '....#....', '....#....'],
    clock: ['..#####..', '.#.....#.', '#...#...#', '#...#...#', '#...###.#', '#.......#', '.#.....#.', '..#####..'],
    box: ['#########', '#.......#', '#########', '#.#.#.#.#', '#.......#', '#.#.#.#.#', '#########'],
    van: ['.........######.', '########.#...#.#', '#......#.#....##', '#......##########', '#...............#', '##..##########..#', '.##............##.', '..##.........##..'],
    tube: ['.###.', '.#.#.', '.#.#.', '.###.', '.###.', '.###.', '..#..'],
    room: ['###########', '#.........#', '#.###.....#', '#.#.#..#..#', '#.###.###.#', '#......#..#', '#.....#.#.#', '###########'],
    dice: ['#######', '#.....#', '#.#.#.#', '#.....#', '#.#.#.#', '#.....#', '#######'],
  };

  VC.receipt = function (kit, opt = {}) {
    const S = kit.S, c = S.c, INK = c.ink || c.text || '#000', PAPER = c.paper || c.card || c.surface || '#fff';
    // 卷边阴影(vc-curl)和墨迹斑驳(vc-thermal)只有热敏小票画风的 defs 里有;别的画风用纯色纸条、不套滤镜
    const TH = !!S.thermal, inkG = inner => TH ? `<g filter="url(#vc-thermal)">${inner}</g>` : inner;
    const P = 'rc' + (VC.receipt.n++) + '_';   // 裁剪区 id 前缀:同一页建两个实例也不撞
    const onPrint = opt.onPrint || (() => {}), onFeed = opt.onFeed || (() => {});
    // 裁剪区编号:每帧随 kit.begin() 归零(包一层,不改 kit 的行为)
    let N = 0; const begin0 = kit.begin; kit.begin = () => { N = 0; begin0(); };

    // ---------- 纸与机器 ----------
    // 纸条:上沿 top,长 len,底边撕口锯齿;投影 + 两侧卷边阴影(vc-curl,thermal 画风的 defs 里有)
    function strip(x, w, len, top = 44) {
      let d = `M${x},${top} H${x + w} V${top + len}`; const n = Math.max(8, Math.round(w / 20));
      for (let i = 1; i <= n; i++) d += ` L${f1(x + w - i * w / n)},${f1(top + len + (i % 2 ? 12 : 0))}`;
      d += 'Z';
      return `<path d="${d}" fill="#000" opacity=".35" filter="url(#vc-soft)" transform="translate(6,12)"/><path d="${d}" fill="${PAPER}"/>${TH ? `<path d="${d}" fill="url(#vc-curl)"/>` : ''}`;
    }
    // 打印机出纸口(一条深色机壳 + 黑缝),纸条从它下面出来
    const slot = (x, w, y0 = 0) => `<rect x="${x - 30}" y="${y0}" width="${w + 60}" height="54" rx="6" fill="#18191B"/><rect x="${x - 6}" y="${y0 + 40}" width="${w + 12}" height="8" rx="4" fill="#050505"/>`;
    const rule = (x1, x2, y) => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="3" stroke-dasharray="9 7"/>`;

    // ---------- 字:打印出场;t0 < 0 = 已经打好(静态) ----------
    const pr = (role, s, x, y, t, t0, o = {}) => { onPrint(t0, s.length); return `<g>${kit.text(role, s, x, y, t, t0, { fill: INK, ...o, entrance: t0 < 0 ? 'static' : (o.entrance || 'print') })}</g>`; };
    const BODY = opt.body || 'R2', HEAD = { size: opt.headSize || 48 };   // 层级:标题 48、正文 36(R2)、注释 24(R3)
    const ln = (t, t0, L, y, s, role = BODY, o = {}) => `<g>${pr(role, s, L, y, t, t0, o)}</g>`;
    const hd = (t, t0, L, y, s, o = {}) => ln(t, t0, L, y, s, 'R1', { ...HEAD, ...o });
    const row2 = (t, t0, L, R, y, a, b, o = {}) => `<g>${pr(o.ra || BODY, a, L, y, t, t0, o.oa)}</g><g>${pr(o.rb || BODY, b, R, y, t, t0 + (o.lag ?? .08), { anchor: 'end', ...(o.ob || {}) })}</g>`;
    const ctr = (t, t0, x, w, y, s, role = BODY, o = {}) => `<g>${pr(role, s, x + w / 2, y, t, t0, { anchor: 'middle', ...o })}</g>`;
    const dashed = (L, R) => (t, y) => rule(L, R, y + 12);

    // ---------- 边打边长的小票 ----------
    // items:[{ t0, h, d:(t, y) => SVG }] —— 每一行在 t0 开始出纸(纸条长出 h),d 画这一行(y = 这一行的顶);
    // o:{ top(纸条上沿,默认 44), lead(第一行前的留白 24), pad(最后一行下面留白 26), slot(true = 画出纸口) }
    // 纸条随行数长;行内的字被纸条裁住(不会露出纸外);整组套墨迹滤镜(纸面不进滤镜)
    function build(t, x, w, items, o = {}) {
      const top = o.top ?? 44, pad = o.pad ?? 26, out = [];
      let y = top + (o.lead ?? 24), len = 0;
      items.forEach(it => {
        const k = ease.out(seg(t, it.t0 - .05, it.t0 + .3));
        if (k > 0) { len = y - top + it.h * k + pad; out.push(it.d(t, y)); }
        y += it.h;
      });
      if (items.length) onFeed(items[0].t0);
      const sl = o.slot ? slot(x, w, top - 44) : '';
      if (len <= 0) return sl;
      const id = P + (N++);
      return `${sl}${strip(x, w, len, top)}<clipPath id="${id}"><rect x="${x}" y="${top}" width="${w}" height="${f1(len + 14)}"/></clipPath><g clip-path="url(#${id})">${inkG(out.join(''))}</g>`;
    }

    // ---------- 1 位像素图、条码、点阵图 ----------
    const rows = s => typeof s === 'string' ? SPRITES[s] : s;
    const sprite = (name, x, y, px, fill = INK) => { let o = ''; rows(name).forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') o += `<rect x="${x + i * px}" y="${y + j * px}" width="${px}" height="${px}"/>`; })); return `<g fill="${fill}">${o}</g>`; };
    const spriteW = (name, px) => rows(name)[0].length * px;
    const sprites = (names, x, y, px, gap = 22) => { let s = '', sx = x; names.forEach(n => { s += sprite(n, sx, y, px); sx += spriteW(n, px) + gap; }); return s; };
    // 条码:按 seed 出一串粗细不同的竖条(装饰,不编码任何东西)
    function barcode(x, y, w, h = 50, seed = 1) {
      let s = '', bx = x, k = 0;
      while (bx < x + w - 4) { const bw = [3, 6, 3, 9, 3, 3, 6][(k * 7 + seed * 3) % 7]; s += `<rect x="${bx}" y="${y}" width="${bw}" height="${h}" fill="${INK}"/>`; bx += bw + [4, 3, 6, 3][(k + seed) % 4]; k++; }
      return s;
    }
    const bar = (x, y, w, h, fill = INK) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${h}" fill="${fill}"/>`;
    // 网点条(打印机的「灰」:隔一个点打一个)
    const dotBar = (x, y, w, h) => { let s = ''; for (let i = 0; i < w; i += 8) for (let j = 0; j < h; j += 8) if (((i + j) / 8) % 2 === 0) s += `<rect x="${f1(x + i)}" y="${f1(y + j)}" width="4" height="4" fill="${INK}"/>`; return s; };
    // 点阵曲线:pts = [[横坐标, 0–1], …],横坐标 0…xMax 映射到宽 w;solid = 粗点(主角那条),否则细点
    function dotCurve(x, y, w, h, pts, fill = INK, solid = false, xMax = 180) {
      const X = m => x + w * m / xMax, Y = v => y + h - h * v; let s = '';
      for (let i = 0; i + 1 < pts.length; i++) {
        const [a, va] = pts[i], [b, vb] = pts[i + 1], x0 = X(a), x1 = X(b), y0 = Y(va), y1 = Y(vb), L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.floor(L / 9));
        for (let k = 0; k < n; k++) { const u = k / n; s += `<rect x="${f1(x0 + (x1 - x0) * u - 3)}" y="${f1(y0 + (y1 - y0) * u - 3)}" width="${solid ? 7 : 5}" height="${solid ? 7 : 5}" fill="${fill}"/>`; }
      }
      return s;
    }
    // 点阵散点(示意走向):n 个点沿对角线排开,up = 往右上 / 否则往右下;jit 抖动幅度;从 t0 + .2 起 1 秒内逐个打出
    function dotScatter(x, y, w, h, t, t0, up, o = {}) {
      const n = o.n ?? 18, jit = o.jit ?? .32;
      let s = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${INK}" stroke-width="3"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${INK}" stroke-width="3"/>`;
      const k = seg(t, t0 + .2, t0 + 1.2);
      for (let i = 0; i < n; i++) {
        if (i / n > k) break; const u = (i + .5) / n, v = up ? u : 1 - u, j = (h2(i, up ? 3 : 5, 9) - .5) * jit;
        s += `<rect x="${f1(x + 12 + u * (w - 24) - 4)}" y="${f1(y + h - 12 - clamp(v + j, .05, .95) * (h - 24) - 4)}" width="8" height="8" fill="${INK}"/>`;
      }
      return s;
    }

    // ---------- 转场:走纸(竖推) ----------
    // 镜头往下摇:旧画面往上出画,新画面从下面上来;不斜着扫过字幕带(「撕下」转场会)。under = 新画面下面垫的台面(SVG 串)。
    // under 只铺在新画面那一屏里(裁到 0…H):台面画得比一屏大时(常见:往外多铺几屏防露边)不会盖住旧画面
    // (第 13 期页面里的初版没裁,转场 0.9 秒里旧镜头整个被台面盖掉,只剩空台面往上走,2026-10-10 复核抓出)
    const FEED_DUR = .9;
    function feed(t, t0, A, B, o = {}) {
      const d = o.dur ?? FEED_DUR, k = ease.inOut(seg(t, t0, t0 + d)), H = o.height ?? 1080;
      if (k <= 0) return A(t);
      if (k >= 1) return B(t);
      const cid = P + 'fd' + (N++), W = o.width ?? 1920;
      const under = o.under ? `<clipPath id="${cid}"><rect x="${-W}" y="0" width="${3 * W}" height="${H}"/></clipPath><g clip-path="url(#${cid})">${o.under}</g>` : '';
      return `<g transform="translate(0,${f1(-H * k)})">${A(t)}<g transform="translate(0,${H})">${under}${B(t)}</g></g>`;
    }

    return { strip, slot, rule, pr, ln, hd, row2, ctr, dashed, build, sprite, spriteW, sprites, barcode, bar, dotBar, dotCurve, dotScatter, feed, FEED_DUR, SPRITES };
  };
  VC.receipt.SPRITES = SPRITES;
  VC.receipt.n = 0;
})();
