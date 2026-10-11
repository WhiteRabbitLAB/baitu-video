// 转播部件(体育转播画风的附加模块;别的画风也能用:颜色取画风的 c.navy / c.accent / c.home / c.away,画风没有 c.navy 时板子与队色用转播自己那一套)
// 用法:<script src=".../vc/vc.js"></script><script src=".../vc/styles.js"></script><script src=".../vc/broadcast.js"></script>
//   const kit = VC.kit('broadcast'), bc = VC.broadcast(kit, { onCue, onText, ledY: 790 });
//   每帧照常 kit.begin()(部件的裁剪区编号跟着归零,镜头横推时两个镜头同帧也不会撞 id)。
//   onCue(种类, t0):部件出场时登记音效(swish 包装条擦入 / ding 裁判条 / buzz LED 板换广告 / push + tick 漏斗一级 / tx 字擦入);
//   onText(字):画面上出现过的字(交给 VC.ready 测宽)。bc.text 是带这两个钩子的 kit.text,页面自己的字也可以用它。
// 第 14 期整片里抽出来的(2026-10-11):草皮、场边 LED 板、时间标签、裁判条、斜体队名、比分板、小比分板、信息条、选拔漏斗、
//   小胶囊、对阵行、其他赛区结果行、建议行、编号步骤条、人点阵。
// 比喻的分寸(画风硬规矩):统计上不显著只写「不显著」,不写「打平 / 平局」;比分是两组平均值。
(function () {
  const clamp = v => Math.max(0, Math.min(1, v)), seg = (t, a, b) => clamp((t - a) / (b - a));
  const eo = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);   // expoOut:转播包装的手感(擦出来、不弹)
  const f1 = v => (+v).toFixed(1), f3 = v => (+v).toFixed(3);

  VC.broadcast = function (kit, opt = {}) {
    const S = kit.S, c = S.c;
    // 板子永远是深色:画风没有 c.navy 时用转播的深蓝一套(不退到 c.surface / c.card —— 孔版、小票那些是浅色纸,白字会看不见)
    const OWN = !!c.navy, NAVY = c.navy || '#0D1B33', NAVY2 = c.navy2 || '#14284A', EDGE = OWN ? (c.edge || '#2A3B5E') : '#2A3B5E';
    const ACC = c.accent || '#FFD23F', MUTED = c.muted || '#AAB6CC', LEDC = c.led || '#05070B', RED = c.red || '#E5484D';
    const SOFT = OWN ? MUTED : '#AAB6CC';   // 深蓝板上的次要字(别的画风的 muted 可能是深灰)
    const HOME = c.home || '#FF7A2F', AWAY = c.away || '#3D8BFF';   // 队色压在深蓝板上,不退到画风的 c.text(浅色画风里是深色墨水)
    const ON = '#fff';   // 深蓝板上的普通字用白(比分、对阵行队名用队色):别的画风的 R2 / R4 默认是深色墨水,压在深蓝板上看不见
    const HF = S.roles.R2.zh;   // 包装字的字体(测宽用;转播画风 = 思源黑体 900)
    // 画布与场边:LED 板默认在离底 290 处(1920×1080 = y 790),草皮从 LED 板下沿铺到底;LED 字号 / 基线按板高算
    const W = opt.W || 1920, H = opt.H || 1080, LED_H = opt.ledH ?? 80, LED_Y = opt.ledY ?? H - 290, GRASS_Y = LED_Y + LED_H;
    const P = 'bc' + (VC.broadcast.n++) + '_';   // 裁剪区 id 前缀:同一页建两个实例也不撞
    const onCue = opt.onCue || (() => {}), onText = opt.onText || (() => {});
    const cue = (kind, t0) => { if (t0 > -1e8) onCue(kind, t0); };   // t0 = -1e9 表示「早就在场」,不出声
    let N = 0; const begin0 = kit.begin; kit.begin = () => { N = 0; begin0(); };
    const cid = () => P + (N++);
    const clip = (x, y, w, h, k, body) => { const id = cid(); return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${f1(w * k)}" height="${h}"/></clipPath><g clip-path="url(#${id})">${body}</g>`; };

    // ---------- 字 ----------
    // 并排独立的字各包一层 <g>(check-text-bounds 按父节点合串);擦入的字登记一声 tx
    const text = (role, s, x, y, t, t0, o) => { onText(s); if ((o?.entrance ?? S.roles[role].entrance) === 'wipe') cue('tx', t0); return `<g>${kit.text(role, s, x, y, t, t0, o)}</g>`; };
    const still = (s, x, y, size, fill, anchor = 'start') => text('R2', s, x, y, 0, -1e9, { anchor, size, fill, entrance: 'static' });
    // 斜体队名:中文字体没有真斜体,整组 skewX(-10)
    const team = (s, col, x, y, size = 44, anchor = 'start') => `<g transform="translate(${x},${y}) skewX(-10) translate(${-x},${-y})">${still(s, x, y, size, col, anchor)}</g>`;

    // ---------- 通用:淡入、擦入、卡片 ----------
    const fade = (t, t0, s, d = .4) => t < t0 ? '' : `<g opacity="${f3(eo(seg(t, t0, t0 + d)))}">${s}</g>`;
    function wipe(t, t0, x, y, w, h, s, d = .45) {   // 任意一块从左往右擦出来
      if (t < t0) return ''; cue('swish', t0);
      const k = eo(seg(t, t0, t0 + d)); if (k >= 1) return s;
      return clip(x - 4, y - 4, w + 8, h + 8, k, s);
    }
    const card = (x, y, w, h, bar) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${NAVY}" stroke="${EDGE}" stroke-width="2"/>` + (bar ? `<rect x="${x}" y="${y}" width="14" height="${h}" rx="6" fill="${bar}"/>` : '');

    // ---------- 球场 ----------
    function pitch() {   // 草皮:场边 LED 板下面一直到画面底(字幕压在草皮上)
      const id = P + 'pitch';
      let o = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.grass || '#2C7A3A'}"/><stop offset="1" stop-color="${c.grass2 || '#1F5C2B'}"/></linearGradient></defs>`;
      if (GRASS_Y >= H) return '';
      o += `<rect x="0" y="${GRASS_Y}" width="${W}" height="${H - GRASS_Y}" fill="url(#${id})"/>`;
      for (let i = 0; i < Math.round(W / 240); i++) o += `<path d="M${i * 240 + 60},${GRASS_Y} h120 l${(i - 3.5) * 30 + 15},${H - GRASS_Y} h-${120 + 30} Z" fill="#fff" opacity=".04"/>`;   // 割草条纹
      return o + (GRASS_Y + 64 <= H ? `<rect x="0" y="${GRASS_Y + 60}" width="${W}" height="4" fill="#fff" opacity=".45"/>` : '');   // 边线
    }
    // 场边 LED 广告板:msg 在 t0 时从左往右点亮 0.6s(像一块板翻到下一条广告);同一句排三遍(间距 630),两侧那两份离边不足 20 就只排中间一遍
    function led(t, msg, t0 = -1e9, col = ACC) {
      let o = `<rect x="0" y="${LED_Y}" width="${W}" height="${LED_H}" fill="${LEDC}"/><rect x="0" y="${LED_Y}" width="${W}" height="3" fill="#2a3240"/>`;
      if (LED_H > 16) for (let x = 6; x < W; x += 12) o += `<rect x="${x}" y="${LED_Y + 8}" width="2" height="${LED_H - 16}" fill="#fff" opacity=".025"/>`;   // LED 像素格(板太矮就不画)
      if (!msg || t < t0) return o;
      cue('buzz', t0);
      const k = eo(seg(t, t0, t0 + .6)), id = cid();
      o += `<clipPath id="${id}"><rect x="0" y="${LED_Y}" width="${f1(W * k)}" height="${LED_H}"/></clipPath><g clip-path="url(#${id})">`;
      const size = kit.snap(LED_H * 9 / 20), three = W / 2 + 630 + kit.width('R2', msg, size) / 2 <= W - 20;   // 按排字的口径测宽(像素画风会吸附字号、中英分字体)
      for (const x of three ? [W / 2 - 630, W / 2, W / 2 + 630] : [W / 2]) o += text('R2', msg, x, LED_Y + LED_H * 27 / 40, t, -1e9, { anchor: 'middle', size, fill: col, entrance: 'static' });
      return o + '</g>';
    }

    // ---------- 包装条 ----------
    const tabW = (s, size = 34) => VC.textW(s, HF, size) + 56;
    // 黄色时间标签 / 小标签(擦入);o.anchor 'start' = cx 是左边,o.w 定宽,o.fill / o.ink 换底色 / 字色
    function tab(cx, y, s, t, t0, o = {}) {
      if (t < t0) return ''; cue('swish', t0);
      const size = o.size || 34, w = o.w || (VC.textW(s, HF, size) + 56), h = size + 24, x = o.anchor === 'start' ? cx : cx - w / 2;
      const k = eo(seg(t, t0, t0 + .35));
      return clip(x - 2, y - 2, w + 4, h + 4, k, `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${o.fill || ACC}"/>${text('R2', s, x + w / 2, y + h / 2 + size * .36, t, -1e9, { anchor: 'middle', size, fill: o.ink || NAVY, entrance: 'static' })}`);
    }
    // 镜头标题:左上角一个标签 + 一行标题
    const head = (t, t0, tag, title, o = {}) => { const x = o.x ?? 140, y = o.y ?? 64; return tab(x, y, tag, t, t0, { anchor: 'start' }) + (title ? text('R2', title, x + tabW(tag) + 24, y + 44, t, t0 + .15, { size: 48 }) : ''); };
    // 裁判条:黄色「裁判」块 + 白条,从左擦出来(o.label 换块上的字,o.w 宽);只写判定,「不显著」不写成「打平」
    function refBar(cx, y, s, t, t0, o = {}) {
      if (t < t0) return ''; cue('ding', t0);
      const w = o.w || 800, h = 76, x = cx - w / 2, k = eo(seg(t, t0, t0 + .45));
      return clip(x - 2, y - 2, w + 4, h + 4, k, `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff"/><rect x="${x}" y="${y}" width="120" height="${h}" rx="8" fill="${ACC}"/>
    ${text('R2', o.label || '裁判', x + 60, y + 51, t, -1e9, { anchor: 'middle', size: 32, fill: NAVY, entrance: 'static' })}
    ${text('R2', s, x + 120 + (w - 120) / 2, y + 52, t, -1e9, { anchor: 'middle', size: 38, fill: NAVY, entrance: 'static' })}`);
    }
    // 信息条:黄色标签块 + 深蓝长条(下三分之一条的手感)
    function infoRow(x, y, w, label, s, t, t0) {
      if (t < t0) return ''; cue('swish', t0);
      const k = eo(seg(t, t0, t0 + .45));
      return clip(x - 2, y - 2, w + 4, 80, k, `
    <rect x="${x}" y="${y}" width="${w}" height="76" rx="8" fill="${NAVY}" stroke="${EDGE}" stroke-width="2"/><rect x="${x}" y="${y}" width="128" height="76" rx="8" fill="${ACC}"/>
    ${text('R2', label, x + 64, y + 50, t, -1e9, { anchor: 'middle', size: 30, fill: NAVY, entrance: 'static' })}
    ${text('R2', s, x + 160, y + 51, t, -1e9, { size: 36, fill: ON, entrance: 'static' })}`);
    }
    // 编号步骤条(「1 钱 · 2 人 · 3 对手」):右对齐到 o.right(默认离右边 140),cur = 当前第几项(1 起;0 = 都不亮)
    function steps(t, t0, items, cur, o = {}) {
      let out = '', x = o.right ?? W - 140; const y = o.y ?? 70, size = o.size || 30;
      for (let i = items.length - 1; i >= 0; i--) {
        const s = `${i + 1} ${items[i]}`, w = tabW(s, size), on = i + 1 === cur;
        x -= w;
        if (t >= t0) out += fade(t, t0 + i * .15, `<rect x="${x}" y="${y}" width="${w}" height="54" rx="27" fill="${on ? ACC : 'none'}" stroke="${on ? ACC : MUTED}" stroke-width="3"/>`) + text('R2', s, x + w / 2, y + 38, t, t0 + i * .15, { anchor: 'middle', size, fill: on ? NAVY : MUTED });
        x -= 16;
      }
      return out;
    }
    // 小胶囊(细框圆角):chip 黄框擦入;pill 任意颜色,pills 一排
    function chip(x, y, s, t, t0) {
      if (t < t0) return ''; cue('swish', t0);
      const w = VC.textW(s, HF, 30) + 48, k = eo(seg(t, t0, t0 + .35));
      return clip(x - 2, y - 2, w + 4, 64, k, `
    <rect x="${x}" y="${y}" width="${w}" height="60" rx="30" fill="none" stroke="${ACC}" stroke-width="3"/>${text('R2', s, x + w / 2, y + 41, t, -1e9, { anchor: 'middle', size: 30, fill: ACC, entrance: 'static' })}`);
    }
    const chipW = s => VC.textW(s, HF, 30) + 48;
    const pillW = (s, size = 30) => VC.textW(s, HF, size) + 44;
    function pill(x, y, s, t, t0, col = ACC, size = 30) {
      const w = pillW(s, size);
      return wipe(t, t0, x, y, w, 56, `<rect x="${x}" y="${y}" width="${w}" height="56" rx="28" fill="none" stroke="${col}" stroke-width="3"/>` + text('R2', s, x + w / 2, y + 39, t, -1e9, { anchor: 'middle', size, fill: col, entrance: 'static' }), .35);
    }
    function pills(x, y, list, t, col, gap = 16) { let o = '', xx = x; for (const [s, t0] of list) { o += pill(xx, y, s, t, t0, col); xx += pillW(s) + gap; } return o; }

    // ---------- 比分 ----------
    // 比分板:home / away = {name, col, sub, score}(col 不传 = 画风的主 / 客队色);o.scoreAt 让比分晚出现,o.scoreIn 比分离两边的距离,o.scoreSize / o.nameSize
    function scoreboard(x, y, w, h, home, away, t, o = {}) {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${NAVY}" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h * .5}" rx="14" fill="${NAVY2}" opacity=".6" data-over="比分板上半块的高光"/>`;
      const side = (tm, right) => {
        const bx = right ? x + w - 22 : x, tx0 = right ? x + w - 52 : x + 52, anc = right ? 'end' : 'start', col = tm.col || (right ? AWAY : HOME);
        let r = `<rect x="${bx}" y="${y}" width="22" height="${h}" fill="${col}"/>`;
        r += team(tm.name, '#fff', tx0, y + 86, o.nameSize || 56, anc);
        r += text('R3', tm.sub, tx0, y + 136, t, -1e9, { anchor: anc, entrance: 'static', size: 28, fill: SOFT });
        if (t >= (o.scoreAt ?? -1e9)) r += text('R4', tm.score, right ? x + w - (o.scoreIn ?? 400) : x + (o.scoreIn ?? 400), y + h - 34, t, -1e9, { anchor: 'middle', size: o.scoreSize || 200, fill: col });
        return r;
      };
      s += side(home, false) + side(away, true);
      return s + `<rect x="${x + w / 2 - 2}" y="${y + 50}" width="4" height="${h - 100}" fill="#fff" opacity=".2"/>`;
    }
    // 小比分板(两个时间点并排用):标签 + 两队 + 比分逐个跳出 + 裁判条 + 一行注
    //   b = {x, y, w, tab, home:{name,col}, away:{name,col}, scores:[主, 客], sub, ref, t0, tScore:[主, 客], tRef, note:[字, t0], fmt}
    function miniBoard(b, t) {
      const { x, y, w } = b; if (t < b.t0) return '';
      const hc = b.home.col || HOME, ac = b.away.col || AWAY, fmt = b.fmt || (v => v.toFixed(1));
      let o = fade(t, b.t0, `<rect x="${x}" y="${y}" width="${w}" height="300" rx="14" fill="${NAVY}" stroke="#fff" stroke-opacity=".15" stroke-width="2"/><rect x="${x}" y="${y}" width="18" height="300" fill="${hc}"/><rect x="${x + w - 18}" y="${y}" width="18" height="300" fill="${ac}"/>`);
      o += tab(x + w / 2, y - 30, b.tab, t, b.t0, { size: 30 });
      o += team(b.home.name, '#fff', x + 50, y + 82, 40) + team(b.away.name, '#fff', x + w - 50, y + 82, 40, 'end');
      if (b.sub) o += text('R3', b.sub, x + w / 2, y + 80, t, -1e9, { anchor: 'middle', size: 26, fill: SOFT, entrance: 'static' });
      if (t >= b.tScore[0]) o += `<g>${kit.counter([[b.tScore[0], b.scores[0]]], x + w * .27, y + 250, t, { size: 150, anchor: 'middle', fill: hc, fmt })}</g>`;
      if (t >= b.tScore[1]) o += `<g>${kit.counter([[b.tScore[1], b.scores[1]]], x + w * .73, y + 250, t, { size: 150, anchor: 'middle', fill: ac, fmt })}</g>`;
      o += refBar(x + w / 2, y + 330, b.ref, t, b.tRef, { w });
      if (b.note) o += text('R8', b.note[0], x + w / 2, y + 470, t, b.note[1], { anchor: 'middle', size: 32 });
      return o;
    }
    // 选拔漏斗的一级:一条横板从中间展开 + 人数(counter,千分位)+ 「人」;一级比一级窄
    function funnel(cx, y, w, label, n, t, t0, col, unit = '人') {
      if (t < t0) return ''; cue('push', t0); cue('tick', t0 + .35);
      const k = eo(seg(t, t0, t0 + .5)), ww = w * k, x = cx - w / 2, id = cid();
      return `<clipPath id="${id}"><rect x="${f1(cx - ww / 2)}" y="${y - 4}" width="${f1(ww)}" height="118"/></clipPath><g clip-path="url(#${id})">
    <rect x="${x}" y="${y}" width="${w}" height="110" rx="12" fill="${NAVY}" stroke="${col}" stroke-width="3"/><rect x="${x}" y="${y}" width="14" height="110" rx="6" fill="${col}"/>
    ${text('R2', label, x + 48, y + 72, t, -1e9, { size: 44, fill: ON, entrance: 'static' })}
    <g>${kit.counter([[t0, n]], x + w - 120, y + 88, t, { size: 88, anchor: 'end', fill: ON, fmt: v => v.toLocaleString('en-US') })}</g>
    ${text('R2', unit, x + w - 48, y + 82, t, -1e9, { anchor: 'end', size: 40, fill: SOFT, entrance: 'static' })}</g>`;
    }
    // 对阵行:A VS B;struck = 划掉的时刻(红线从左划过去,表示「没比这一场」)
    function fixture(x, y, a, b, colA = HOME, colB = AWAY, t, t0, struck, o = {}) {
      if (t < t0) return '';
      const w = o.w || 1000;
      let s = fade(t, t0, `<rect x="${x}" y="${y}" width="${w}" height="120" rx="12" fill="${NAVY}" stroke="${EDGE}" stroke-width="2"/>`);
      s += team(a, colA, x + w * .22, y + 80, 52, 'middle') + text('R4', 'VS', x + w / 2, y + 84, t, -1e9, { anchor: 'middle', size: 64, fill: SOFT }) + team(b, colB, x + w * .78, y + 80, 52, 'middle');
      if (struck != null && t >= struck) { const k = eo(seg(t, struck, struck + .4)); s += `<rect x="${x + 40}" y="${y + 56}" width="${f1((w - 80) * k)}" height="8" rx="4" fill="${RED}" data-over="划掉"/>`; }
      return s;
    }
    // 其他赛区结果行:左边赛区名,中间两行说明,右边结果(队色)+ 一行注;lines = [[字, t0]…],res / note = [字, t0]
    function result(y, name, t0, lines, res, resCol, note, t, o = {}) {
      if (t < t0) return '';
      const x = o.x ?? 140, w = o.w || W - 2 * x, R = x + w - 40;
      let s = fade(t, t0, `<rect x="${x}" y="${y}" width="${w}" height="170" rx="12" fill="${NAVY}" stroke="${EDGE}" stroke-width="2"/><rect x="${x}" y="${y}" width="230" height="170" rx="12" fill="${NAVY2}"/>`);
      s += text('R2', name, x + 115, y + 102, t, t0, { anchor: 'middle', size: 44, fill: ON });
      lines.forEach(([l, tl], i) => { s += text('R3', l, x + 270, y + 66 + i * 54, t, tl, { size: 30, fill: ON }); });
      if (res) s += text('R2', res[0], R, y + 84, t, res[1], { anchor: 'end', size: 44, fill: resCol });
      if (note) s += text('R3', note[0], R, y + 136, t, note[1], { anchor: 'end', size: 26, fill: SOFT });
      return s;
    }
    // 建议行(战术板):大号编号 + 一句 + 一行小字(t1 出现)
    function tip(y, n, s, sub, t, t0, t1, col, o = {}) {
      if (t < t0) return '';
      const x = o.x ?? 140, w = o.w || W - 2 * x;
      let r = fade(t, t0, card(x, y, w, 140, col)) + text('R4', String(n), x + 80, y + 112, t, t0, { anchor: 'middle', size: 100, fill: col });
      r += text('R2', s, x + 180, y + 66, t, t0 + .1, { size: 44, fill: ON });
      if (sub) r += text('R3', sub, x + 180, y + 116, t, t1, { size: 28, fill: SOFT });
      return r;
    }
    // 人点阵:n 个点 t0 出现,t1 起 keep 以外的点 1.2s 内变暗(「人走了」用变暗表示,不滚数字)
    //   d = {x, y, n, keep:Set(下标), cols, dx, dy, r}
    function dots(d, t, t0, t1) {
      if (t < t0) return '';
      const k = seg(t, t1, t1 + 1.2), cols = d.cols || 29, dx = d.dx || 24.8, dy = d.dy || 18.2, r = d.r || 7;
      let s = '';
      for (let i = 0; i < d.n; i++) {
        const on = d.keep.has(i), op = on ? .95 : .95 - .8 * k;
        s += `<circle cx="${f1(d.x + (i % cols) * dx)}" cy="${f1(d.y + Math.floor(i / cols) * dy)}" r="${r}" fill="${on ? '#fff' : SOFT}" opacity="${op.toFixed(2)}"/>`;
      }
      return fade(t, t0, `<g data-over="人点">${s}</g>`, .3);
    }

    return { text, team, fade, wipe, card, pitch, led, tab, tabW, head, refBar, infoRow, steps, chip, chipW, pill, pillW, pills,
      scoreboard, miniBoard, funnel, fixture, result, tip, dots, LED_Y, LED_H, GRASS_Y };
  };
  VC.broadcast.n = 0;
  // 固定种子从 n 个里挑 keep 个(人点阵里「留下来的人」);同一种子每次一样
  VC.broadcast.pick = function (n, keep, seed = 7) {
    let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const a = Array.from({ length: n }, (_, i) => [r(), i]).sort((p, q) => p[0] - q[0]);
    return new Set(a.slice(0, keep).map(p => p[1]));
  };
})();
