// 木头关节人偶(美术人偶):胶囊骨段 + 球关节 + 木纹明暗;可选「脂肪层」(半透明果冻,厚度按部位调)、「发力热光」、「扫描模式」(木头变蓝色透视、脂肪变亮黄)
// 用法:<script src=".../vc/mannequin.js"></script> 之后有全局 VC.mannequin(没有 VC 时挂 window.MANNEQUIN)
//   const M = VC.mannequin; 每帧 M.begin()(渐变编号归零);<defs> 里放 M.DEFS(发力热光的模糊滤镜)
//   姿势:M.standFront(x, 脚底 y, s, {armLAng, foreLAng, armRAng, foreRAng}) 正面站立;M.standSide(x, 脚底 y, s, {swing, curl, lean}) 侧面(面朝右)
//         M.situp(x, 垫面 y, k 0 躺平…1 坐起, s);M.seated(髋 x, 座面 y, s, {lean, kneeN, kneeF, arms:'grip'|'pad'}) 坐姿(器械卷腹 / 伸膝);M.run(x, 脚底 y, 相位 0…1, s) 跑步;M.legPress(髋 x, 髋 y, push 0…1, s, {plateAng}) → {J, foot, ftMin, ftMax, ang};M.tennis(x, y, k, s) → {J, racket}
//   画:M.figure(J, {s, fat:{arm, belly, back, chest, hips, thigh, shin}, heat:{…(侧面多一个 abs = 腹肌前侧)}, scan})
//         部位名可加侧别后缀:侧面 N(近)/ F(远),正面 L / R(画面左 / 右),如 heat:{thighN:1}、fat:{armR:6};不带后缀 = 两侧一样
//   道具:M.racket(r, s)、M.dumbbell(手的位置, 角度, s)
// 第 21 期(局部减脂)做的(2026-10-21):不画真人、不画脸,人偶的「脂肪层」只是示意厚薄,不代表真实比例。
(function () {
const RIG = (() => {
  const f1 = n => (+n).toFixed(1), f3 = n => (+n).toFixed(3);
  const D2R = Math.PI / 180;
  let uid = 0;
  const begin = () => { uid = 0; };
  const LIGHT = [-0.55, -0.83];               // 光从左上来
  const WOOD0 = { hi: '#FBE6BF', mid: '#E2B57C', lo: '#B07B45', edge: '#7E5631', grain: '#9A6A3A' };
  const WOODF0 = { hi: '#E9CFA2', mid: '#C99B63', lo: '#966337', edge: '#6A4628', grain: '#86592F' };
  const FAT0 = { fill: '#FFD45A', edge: '#FFE9A6', deep: '#F2B33A', op: .62 };
  const FATS = { fill: '#FFC21F', edge: '#FFF0B0', deep: '#FF9E1F', op: .92 };   // 扫描模式:脂肪更亮
  const SCAN = { hi: '#D8F3FA', mid: '#8EC3D3', lo: '#4D8396', edge: '#2B5B6C', grain: '#2B5B6C' };
  const SCANF = { hi: '#BFE3EE', mid: '#79AFC0', lo: '#406F80', edge: '#244E5C', grain: '#244E5C' };
  let FAT = FAT0;
  const norm = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; };

  // 两端半径不同的胶囊外轮廓(多边形采样,不靠 arc 标志位)
  function capPts(x1, y1, r1, x2, y2, r2, n = 12) {
    const dx = x2 - x1, dy = y2 - y1, d = Math.max(1e-3, Math.hypot(dx, dy)), ux = dx / d, uy = dy / d;
    const sa = Math.max(-0.99, Math.min(0.99, (r1 - r2) / d)), ca = Math.sqrt(1 - sa * sa);
    const nx = -uy, ny = ux;
    const thL = Math.atan2(ny * ca + uy * sa, nx * ca + ux * sa), thR = Math.atan2(-ny * ca + uy * sa, -nx * ca + ux * sa);
    const thU = Math.atan2(uy, ux);
    const pts = [];
    const d2 = norm(thU - thL);
    for (let i = 0; i <= n; i++) { const a = thL + 2 * d2 * i / n; pts.push([x2 + r2 * Math.cos(a), y2 + r2 * Math.sin(a)]); }
    const d1 = norm(thU + Math.PI - thR);
    for (let i = 0; i <= n; i++) { const a = thR + 2 * d1 * i / n; pts.push([x1 + r1 * Math.cos(a), y1 + r1 * Math.sin(a)]); }
    return pts;
  }
  const ptsD = pts => 'M' + pts.map(p => f1(p[0]) + ',' + f1(p[1])).join(' L') + ' Z';
  const capD = (a, ra, b, rb) => ptsD(capPts(a[0], a[1], ra, b[0], b[1], rb));

  // 圆柱明暗:垂直于骨段方向的线性渐变
  function cylGrad(a, b, r, W) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(1e-3, Math.hypot(dx, dy));
    let nx = -dy / d, ny = dx / d;
    if (nx * LIGHT[0] + ny * LIGHT[1] < 0) { nx = -nx; ny = -ny; }      // n 指向受光面
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, id = 'cg' + (uid++);
    return [id, `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(mx + nx * r)}" y1="${f1(my + ny * r)}" x2="${f1(mx - nx * r)}" y2="${f1(my - ny * r)}"><stop offset="0" stop-color="${W.mid}"/><stop offset=".18" stop-color="${W.hi}"/><stop offset=".5" stop-color="${W.mid}"/><stop offset=".86" stop-color="${W.lo}"/><stop offset="1" stop-color="${W.edge}"/></linearGradient>`];
  }
  function ballGrad(r, W) {
    const id = 'bg' + (uid++);
    return [id, `<radialGradient id="${id}" cx="${f3(.5 + LIGHT[0] * .28)}" cy="${f3(.5 + LIGHT[1] * .28)}" r=".75"><stop offset="0" stop-color="${W.hi}"/><stop offset=".55" stop-color="${W.mid}"/><stop offset="1" stop-color="${W.edge}"/></radialGradient>`];
  }
  // 一段木头
  function bone(a, ra, b, rb, W, grain = true) {
    const r = Math.max(ra, rb), [id, gd] = cylGrad(a, b, r, W);
    let s = gd + `<path d="${capD(a, ra, b, rb)}" fill="url(#${id})" stroke="${W.edge}" stroke-width="1.6" stroke-opacity=".55"/>`;
    if (grain) {
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(1e-3, Math.hypot(dx, dy)), ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
      for (const k of [-.38, .12, .46]) {
        const rr = (ra + rb) / 2 * k, s0 = ra * .9, s1 = d - rb * .9;
        if (s1 - s0 < 8) continue;
        const p0 = [a[0] + ux * s0 + nx * rr, a[1] + uy * s0 + ny * rr], p1 = [a[0] + ux * s1 + nx * rr, a[1] + uy * s1 + ny * rr];
        const mx = (p0[0] + p1[0]) / 2 + nx * rr * .25, my = (p0[1] + p1[1]) / 2 + ny * rr * .25;
        s += `<path d="M${f1(p0[0])},${f1(p0[1])} Q${f1(mx)},${f1(my)} ${f1(p1[0])},${f1(p1[1])}" stroke="${W.grain}" stroke-width="1.3" fill="none" opacity=".22"/>`;
      }
    }
    return s;
  }
  // 躯干块:a→b 轴,两端半宽 wa / wb,bulge 中段外鼓;p 越大越方
  function blockPts(a, b, wa, wb, bulge = 0, p = 3.2, n = 22, off = 0) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(1e-3, Math.hypot(dx, dy)), ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, h = d / 2 + off, L = [], Rr = [];
    for (let i = 0; i <= n; i++) {
      const u = -1 + 2 * i / n, k = (u + 1) / 2;
      const w = (wa + (wb - wa) * k + bulge * Math.sin(Math.PI * k) + off) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), p)), 1 / p);
      const px = cx + ux * u * h, py = cy + uy * u * h;
      L.push([px + nx * w, py + ny * w]); Rr.push([px - nx * w, py - ny * w]);
    }
    return L.concat(Rr.reverse());
  }
  function block(a, b, wa, wb, W, bulge = 0, p = 3.2) {
    const [id, gd] = cylGrad(a, b, Math.max(wa, wb) + bulge, W);
    return gd + `<path d="${ptsD(blockPts(a, b, wa, wb, bulge, p))}" fill="url(#${id})" stroke="${W.edge}" stroke-width="1.6" stroke-opacity=".55"/>`;
  }
  function fatBlock(a, b, wa, wb, th, bulge = 0, p = 3.2) {
    if (th < .6) return '';
    const d = ptsD(blockPts(a, b, wa, wb, bulge, p, 22, th));
    return `<path d="${d}" fill="${FAT.fill}" fill-opacity="${FAT.op}" stroke="${FAT.deep}" stroke-width="2" stroke-opacity=".55"/>`;
  }
  function ball(p, r, W) { const [id, gd] = ballGrad(r, W); return gd + `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(r)}" fill="url(#${id})" stroke="${W.edge}" stroke-width="1.2" stroke-opacity=".5"/>`; }
  function egg(c, rx, ry, rot, W) {
    const id = 'eg' + (uid++);
    return `<radialGradient id="${id}" cx="${f3(.5 + LIGHT[0] * .25)}" cy="${f3(.5 + LIGHT[1] * .25)}" r=".72"><stop offset="0" stop-color="${W.hi}"/><stop offset=".6" stop-color="${W.mid}"/><stop offset="1" stop-color="${W.edge}"/></radialGradient>` +
      `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${f1(rot)} ${f1(c[0])} ${f1(c[1])})" fill="url(#${id})" stroke="${W.edge}" stroke-width="1.6" stroke-opacity=".55"/>`;
  }
  // 脂肪层:比木头粗一圈的半透明果冻
  function fatCap(a, ra, b, rb, th) {
    if (th < .6) return '';
    const d = capD(a, ra + th, b, rb + th);
    return `<path d="${d}" fill="${FAT.fill}" fill-opacity="${FAT.op}" stroke="${FAT.deep}" stroke-width="2" stroke-opacity=".55"/>` +
      `<path d="${d}" fill="none" stroke="${FAT.edge}" stroke-width="${f1(Math.min(6, th * .35))}" stroke-opacity=".7" transform="translate(${f1(LIGHT[0] * 2)} ${f1(LIGHT[1] * 2)})"/>`;
  }
  function heatCap(a, ra, b, rb, k) {
    if (k < .01) return '';
    return `<path d="${capD(a, ra + 4, b, rb + 4)}" fill="#FF4A2B" opacity="${f3(.55 * k)}" filter="url(#rigHeat)"/>` +
      `<path d="${capD(a, ra * .7, b, rb * .7)}" fill="#FFB08A" opacity="${f3(.45 * k)}" style="mix-blend-mode:screen"/>`;
  }
  const DEFS = `<filter id="rigHeat" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="rigShadow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`;

  // 骨架尺寸(s=1 时约 520px 高)
  const R = { head: [34, 42], neck: 11, chest: [36, 50], abd: 27, pel: 38, uarm: [15, 12], farm: [12, 9.5], hand: 10, thigh: [21, 15], shin: [15, 10.5], foot: 9, joint: .78 };

  // J:关节表。侧面:head, neck, sh(肩), waist, hip, 近侧 elN wrN hdN knN anN toN,远侧 elF wrF hdF knF anF toF
  // 正面:head, neck, shL shR, waist, hipC, hipL hipR, elL wrL hdL, elR wrR hdR, knL anL toL, knR anR toR
  function figure(J, o = {}) {
    const s = o.s || 1, fat = o.fat || {}, heat = o.heat || {}, front = !!J.shL;
    FAT = o.scan ? FATS : FAT0;
    const WOOD = o.scan ? SCAN : WOOD0, WOODF = o.scan ? SCANF : WOODF0;
    const sc = v => v * s, F = k => sc(fat[k] ?? fat[k.replace(/[NFLR]$/, '')] ?? 0), H = k => heat[k] ?? heat[k.replace(/[NFLR]$/, '')] ?? 0;
    let fatL = '', woodL = '', heatL = '';
    const add = (layer, str) => { if (layer === 'fat') fatL += str; else if (layer === 'heat') heatL += str; else woodL += str; };
    const limb = (pts, rads, region, W, joints = true) => {
      // pts:[[x,y]…] rads:[r…],相邻成段
      let f = '', w = '', h = '';
      for (let i = 0; i < pts.length - 1; i++) {
        f += fatCap(pts[i], sc(rads[i]), pts[i + 1], sc(rads[i + 1]), F(region[i]));
        w += bone(pts[i], sc(rads[i]), pts[i + 1], sc(rads[i + 1]), W);
        h += heatCap(pts[i], sc(rads[i]), pts[i + 1], sc(rads[i + 1]), H(region[i]));
      }
      if (joints) for (let i = 1; i < pts.length - 1; i++) w += ball(pts[i], sc(rads[i]) * R.joint * 1.08, W);
      return { f, w, h };
    };
    const draw = [];   // 按远近顺序,每块自己「脂肪 → 木头 → 热光」
    const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(1e-3, Math.hypot(dx, dy)); return [dx / d, dy / d]; };
    const along = (p, u, k) => [p[0] + u[0] * k, p[1] + u[1] * k];
    const fatEl = (c, rx, ry, rot) => `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${f1(rot)} ${f1(c[0])} ${f1(c[1])})" fill="${FAT.fill}" fill-opacity="${FAT.op}" stroke="${FAT.deep}" stroke-width="2" stroke-opacity=".55"/>`;
    if (!front) {
      draw.push(limb([J.hip, J.knF, J.anF, J.toF], [R.thigh[0], R.thigh[1], R.shin[1], R.foot], ['thighF', 'shinF', 'footF'], WOODF));
      draw.push(limb([J.sh, J.elF, J.wrF, J.hdF], [R.uarm[0], R.uarm[1], R.farm[1], R.hand], ['armF', 'armF', 'handF'], WOODF));
      const tor = { f: '', w: '', h: '' };
      const u1 = unit(J.hip, J.waist), u2 = unit(J.waist, J.neck);
      let fn = [-u1[1], u1[0]]; const fx = J.front || [1, 0]; if (fn[0] * fx[0] + fn[1] * fx[1] < 0) fn = [-fn[0], -fn[1]];
      const sh2 = (p, k) => [p[0] + fn[0] * sc(k), p[1] + fn[1] * sc(k)];
      const pa = sh2(along(J.hip, u1, -sc(26)), -7), pb = sh2(along(J.waist, u1, -sc(16)), -3);
      const ca = sh2(along(J.waist, u2, sc(12)), 5), cb = sh2(along(J.neck, u2, sc(6)), 7);
      // 脂肪:屁股(后)、肚子(前)、胸背
      if (F('back') > .6) { const c = [J.hip[0] - fn[0] * sc(16) - u1[0] * sc(4), J.hip[1] - fn[1] * sc(16) - u1[1] * sc(4)]; tor.f += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(sc(30) + F('back'))}" fill="${FAT.fill}" fill-opacity="${FAT.op}" stroke="${FAT.deep}" stroke-width="2" stroke-opacity=".55"/>`; }
      tor.f += fatBlock(pa, pb, sc(33), sc(28), F('back') * .5 + F('belly') * .3, 0, 2.6);
      tor.f += fatBlock(ca, cb, sc(29), sc(43), F('chest'), sc(5), 2.4);
      if (F('belly') > .6) { const c = [J.waist[0] + fn[0] * sc(14) - u1[0] * sc(26), J.waist[1] + fn[1] * sc(14) - u1[1] * sc(26)]; tor.f += fatEl(c, sc(40) + F('belly') * .35, sc(22) + F('belly'), Math.atan2(u1[1], u1[0]) / D2R); }
      tor.w += block(pa, pb, sc(33), sc(28), WOOD, 0, 2.6);
      tor.w += ball(J.waist, sc(R.abd), WOOD);
      tor.w += block(ca, cb, sc(29), sc(43), WOOD, sc(5), 2.4);
      tor.w += bone(J.neck, sc(R.neck), J.head, sc(R.neck), WOOD, false);
      const hu = unit(J.neck, J.head);
      const hc = sh2(along(J.head, hu, sc(R.head[1]) * .5), 9);
      const tilt = (fn[0] * hu[1] - fn[1] * hu[0]) > 0 ? -16 : 16;
      tor.w += egg(hc, sc(R.head[0]), sc(R.head[1]), Math.atan2(hu[1], hu[0]) / D2R + 90 + tilt, WOOD);
      tor.h += heatCap(pa, sc(30), J.waist, sc(R.abd), H('belly'));
      tor.h += heatCap(ca, sc(28), cb, sc(38), H('chest'));
      tor.h += heatCap(sh2(along(J.waist, u1, -sc(14)), 12), sc(20), sh2(along(J.waist, u2, sc(34)), 14), sc(20), H('abs'));   // 腹肌(身体前侧)
      draw.push(tor);
      draw.push(limb([J.hip, J.knN, J.anN, J.toN], [R.thigh[0], R.thigh[1], R.shin[1], R.foot], ['thighN', 'shinN', 'footN'], WOOD));
      const arm = limb([J.sh, J.elN, J.wrN, J.hdN], [R.uarm[0], R.uarm[1], R.farm[1], R.hand], ['armN', 'armN', 'handN'], WOOD);
      arm.w = ball(J.sh, sc(R.uarm[0]) * 1.05, WOOD) + arm.w;
      draw.push(arm);
    } else {
      const legL = limb([J.hipL, J.knL, J.anL, J.toL], [R.thigh[0], R.thigh[1], R.shin[1], R.foot], ['thighL', 'shinL', 'footL'], WOOD);
      const legR = limb([J.hipR, J.knR, J.anR, J.toR], [R.thigh[0], R.thigh[1], R.shin[1], R.foot], ['thighR', 'shinR', 'footR'], WOOD);
      const armL = limb([J.shL, J.elL, J.wrL, J.hdL], [R.uarm[0], R.uarm[1], R.farm[1], R.hand], ['armL', 'armL', 'handL'], WOOD);
      const armR = limb([J.shR, J.elR, J.wrR, J.hdR], [R.uarm[0], R.uarm[1], R.farm[1], R.hand], ['armR', 'armR', 'handR'], WOOD);
      const tor = { f: '', w: '', h: '' }, x = J.hipC[0], hy = J.hipC[1];
      const pa = [x, hy + sc(36)], pb = [x, hy - sc(20)];            // 骨盆(下宽 42、上宽 50)
      const aa = [x, hy - sc(14)], ab = [x, J.waist[1] + sc(4)];       // 腹
      const ca = [x, J.waist[1] - sc(8)], cb = [x, J.neck[1] + sc(16)]; // 胸
      tor.f += fatBlock(pa, pb, sc(42), sc(50), F('hips'), 0, 2.4);
      tor.f += fatBlock(aa, ab, sc(37), sc(34), F('belly') * .55, F('belly') * .55, 2.2);
      tor.f += fatBlock(ca, cb, sc(46), sc(66), F('chest'), sc(4), 2.6);
      tor.w += block(pa, pb, sc(42), sc(50), WOOD, 0, 2.4);
      tor.w += block(aa, ab, sc(37), sc(34), WOOD, 0, 2.2);
      tor.w += ball([x, J.waist[1]], sc(R.abd) * 1.15, WOOD);
      tor.w += block(ca, cb, sc(46), sc(66), WOOD, sc(4), 2.6);
      tor.w += bone([x, J.neck[1] + sc(14)], sc(R.neck), [x, J.neck[1] - sc(24)], sc(R.neck), WOOD, false);
      tor.w += egg(J.head, sc(R.head[0]), sc(R.head[1]), 0, WOOD);
      tor.h += heatCap(aa, sc(34), ab, sc(32), H('belly'));
      armL.w = ball(J.shL, sc(R.uarm[0]) * 1.12, WOOD) + armL.w; armR.w = ball(J.shR, sc(R.uarm[0]) * 1.12, WOOD) + armR.w;
      draw.push(legL, legR, tor, armL, armR);
    }
    return draw.map(d => d.f + d.w + d.h).join('');
  }

  // ── 姿势 ──
  const P = (o, ang, len) => [o[0] + Math.cos(ang * D2R) * len, o[1] + Math.sin(ang * D2R) * len];
  // 两段 IK:从 a 出发,长 L1、L2,末端到 tgt;bend=+1/-1 选膝盖朝向
  function ik2(a, tgt, L1, L2, bend = 1) {
    const dx = tgt[0] - a[0], dy = tgt[1] - a[1]; let d = Math.hypot(dx, dy);
    d = Math.min(d, L1 + L2 - .01);
    const base = Math.atan2(dy, dx), cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const k = [a[0] + Math.cos(base - bend * A) * L1, a[1] + Math.sin(base - bend * A) * L1];
    const e = [k[0] + Math.cos(Math.atan2(tgt[1] - k[1], tgt[0] - k[0])) * L2, k[1] + Math.sin(Math.atan2(tgt[1] - k[1], tgt[0] - k[0])) * L2];
    return [k, e];
  }
  const L = { abd: 72, chest: 112, neck: 30, uarm: 108, farm: 98, hand: 30, thigh: 138, shin: 132, foot: 46, shDrop: 22 };
  // 侧面站立,面朝右
  function standSide(x, y, s = 1, o = {}) {
    const S = v => v * s, hip = [x, y - S(L.thigh + L.shin + 12)];
    const waist = P(hip, -90 + (o.lean || 0), S(L.abd)), neck = P(waist, -90 + (o.lean || 0) * 1.2, S(L.chest)), head = P(neck, -84, S(L.neck));
    const sh = P(neck, 90, S(L.shDrop));
    const sw = o.swing || 0;
    let elN = P(sh, 90 - 8 + sw * 25, S(L.uarm)), wrN = P(elN, 90 - 18 + sw * 30, S(L.farm)), hdN = P(wrN, 90 - 18 + sw * 30, S(L.hand));
    if (o.curl != null) { const fa = 80 - o.curl * 150; elN = P(sh, 96, S(L.uarm)); wrN = P(elN, fa, S(L.farm)); hdN = P(wrN, fa, S(L.hand) * .8); }
    const elF = P(sh, 90 + 6 - sw * 25, S(L.uarm)), wrF = P(elF, 90 - 8 - sw * 20, S(L.farm)), hdF = P(wrF, 90 - 8 - sw * 20, S(L.hand));
    const knN = P(hip, 90 - sw * 18, S(L.thigh)), anN = P(knN, 90 - sw * 8 + Math.max(0, sw) * 20, S(L.shin)), toN = P(anN, 0, S(L.foot));
    const knF = P(hip, 90 + sw * 18, S(L.thigh)), anF = P(knF, 90 + sw * 8 + Math.max(0, -sw) * 20, S(L.shin)), toF = P(anF, 0, S(L.foot));
    return { head, neck, sh, waist, hip, elN, wrN, hdN, elF, wrF, hdF, knN, anN, toN, knF, anF, toF, front: [1, 0] };
  }
  // 仰卧起坐:躺在垫子上,头朝左,屈膝;k = 0 躺平 … 1 坐起;手抱在胸前
  function situp(x, y, k, s = 1) {
    const S = v => v * s, hip = [x, y - S(R.pel) * .9];
    const c = k * 68;
    const waist = P(hip, 180 + c * .7, S(L.abd)), neck = P(waist, 180 + c, S(L.chest)), head = P(neck, 180 + c + 6 + k * 8, S(L.neck));
    const ua = (180 + c) * D2R, u2 = [Math.cos(ua), Math.sin(ua)], fn = [-u2[1], u2[0]];
    const at = (p, ku, kn) => [p[0] + u2[0] * S(ku) + fn[0] * S(kn), p[1] + u2[1] * S(ku) + fn[1] * S(kn)];
    const shp = at(neck, -L.shDrop, 0);
    const elN = at(waist, L.chest * .3, 46), wrN = at(neck, -10, 44), hdN = at(neck, 16, 40);
    const elF = at(waist, L.chest * .36, 40), wrF = at(neck, -16, 38), hdF = at(neck, 8, 34);
    const foot = [x + S(210), y - S(R.foot)];
    const [knN, anN] = ik2(hip, foot, S(L.thigh), S(L.shin), 1);
    const toN = P(anN, 0, S(L.foot));
    const [knF, anF] = ik2(hip, [foot[0] - S(6), foot[1]], S(L.thigh), S(L.shin), 1);
    const toF = P(anF, 0, S(L.foot));
    return { head, neck, sh: shp, waist, hip, elN, wrN, hdN, elF, wrF, hdF, knN, anN, toN, knF, anF, toF, front: fn };
  }
  // 腿举:靠背斜躺,近侧一条腿蹬踏板;push = 0 屈 … 1 蹬直;远侧腿放松
  function legPress(x, y, push, s = 1, o = {}) {
    const S = v => v * s, hip = [x, y];
    const back = -118;
    const waist = P(hip, back, S(L.abd)), neck = P(waist, back - 4, S(L.chest)), head = P(neck, back + 6, S(L.neck));
    const sh = P(neck, back + 180, S(L.shDrop));
    const elN = P(sh, 60, S(L.uarm)), wrN = P(elN, 10, S(L.farm)), hdN = P(wrN, 10, S(L.hand));
    const elF = P(sh, 70, S(L.uarm)), wrF = P(elF, 20, S(L.farm)), hdF = P(wrF, 20, S(L.hand));
    const ang = o.plateAng ?? -28, reach = S(L.thigh + L.shin) * (0.6 + .38 * push);
    const ft = P(hip, ang, reach);
    const [knN, anN] = ik2(hip, ft, S(L.thigh), S(L.shin), 1);
    const toN = P(anN, ang - 70, S(L.foot));
    const [knF, anF] = ik2(hip, [hip[0] + S(150), hip[1] + S(150)], S(L.thigh), S(L.shin), 1);
    const toF = P(anF, 0, S(L.foot));
    const ftMin = P(hip, ang, S(L.thigh + L.shin) * .6), ftMax = P(hip, ang, S(L.thigh + L.shin) * .98);
    return { J: { head, neck, sh, waist, hip, elN, wrN, hdN, elF, wrF, hdF, knN, anN, toN, knF, anF, toF, front: [1, -.3] }, foot: ft, ftMin, ftMax, ang };
  }
  // 正面站立;o.armR = {up:0–1} 右臂抬起(打网球/弯举用)
  function standFront(x, y, s = 1, o = {}) {
    const S = v => v * s, hipC = [x, y - S(L.thigh + L.shin + 14)];
    const waist = [x, hipC[1] - S(L.abd)], neck = [x, waist[1] - S(L.chest)], head = [x, neck[1] - S(L.neck + 40)];
    const shY = neck[1] + S(L.shDrop + 6), shL = [x - S(64), shY], shR = [x + S(64), shY];
    const hipL = [x - S(30), hipC[1] + S(6)], hipR = [x + S(30), hipC[1] + S(6)];
    const aL = o.armLAng ?? 98, aR = o.armRAng ?? 82;
    const elL = P(shL, aL, S(L.uarm)), wrL = P(elL, o.foreLAng ?? aL - 4, S(L.farm)), hdL = P(wrL, o.foreLAng ?? aL - 4, S(L.hand));
    const elR = P(shR, aR, S(L.uarm)), wrR = P(elR, o.foreRAng ?? aR + 4, S(L.farm)), hdR = P(wrR, o.foreRAng ?? aR + 4, S(L.hand));
    const knL = P(hipL, 93, S(L.thigh)), anL = P(knL, 90, S(L.shin)), toL = P(anL, 120, S(L.foot) * .5);
    const knR = P(hipR, 87, S(L.thigh)), anR = P(knR, 90, S(L.shin)), toR = P(anR, 60, S(L.foot) * .5);
    return { head, neck, shL, shR, waist, hipC, hipL, hipR, elL, wrL, hdL, elR, wrR, hdR, knL, anL, toL, knR, anR, toR };
  }
  // 坐姿(侧面,面朝右):髋在 (x, y) = 座面高度;lean 上身前屈角度(器械卷腹 0…40);kneeN 近侧小腿 0 垂下 … 1 伸平(伸膝);arms 'grip'(手扶座边)/ 'pad'(手抓肩前把手)
  function seated(x, y, s = 1, o = {}) {
    const S = v => v * s, hip = [x, y], ln = o.lean || 0;
    const waist = P(hip, -90 + ln * .55, S(L.abd)), neck = P(waist, -90 + ln, S(L.chest)), head = P(neck, -84 + ln * 1.1, S(L.neck));
    const sh = P(neck, 90 + ln, S(L.shDrop));
    let elN, wrN, hdN, elF, wrF, hdF;
    if (o.arms === 'pad') { elN = P(sh, 50 + ln, S(L.uarm)); wrN = P(elN, -95 + ln, S(L.farm) * .9); hdN = P(wrN, -95 + ln, S(L.hand) * .8); elF = P(sh, 58 + ln, S(L.uarm)); wrF = P(elF, -100 + ln, S(L.farm) * .9); hdF = P(wrF, -100 + ln, S(L.hand) * .8); }
    else { elN = P(sh, 100, S(L.uarm)); wrN = P(elN, 78, S(L.farm)); hdN = P(wrN, 70, S(L.hand)); elF = P(sh, 96, S(L.uarm)); wrF = P(elF, 74, S(L.farm)); hdF = P(wrF, 66, S(L.hand)); }
    const kn = (k, dx) => { const knee = P([hip[0] + S(dx), hip[1]], -4, S(L.thigh)), sa = 90 - 88 * k, an = P(knee, sa, S(L.shin)); return [knee, an, P(an, sa - 90, S(L.foot))]; };
    const [knN, anN, toN] = kn(o.kneeN || 0, 0), [knF, anF, toF] = kn(o.kneeF || 0, -6);
    return { head, neck, sh, waist, hip, elN, wrN, hdN, elF, wrF, hdF, knN, anN, toN, knF, anF, toF, front: [1, 0] };
  }
  // 跑步(侧面,面朝右):ph 0…1 一个步态周期;脚底大约落在 y
  function run(x, y, ph, s = 1) {
    const S = v => v * s, a = ph * Math.PI * 2, bob = Math.abs(Math.cos(a)) * S(8);
    const hip = [x, y - S(L.thigh + L.shin + 6) + bob];
    const waist = P(hip, -82, S(L.abd)), neck = P(waist, -80, S(L.chest)), head = P(neck, -78, S(L.neck));
    const sh = P(neck, 100, S(L.shDrop));
    const leg = q => { const ta = 90 - 29 * Math.sin(q), kb = 18 + 62 * Math.max(0, -Math.sin(q + .7)), kn = P(hip, ta, S(L.thigh)), sa = ta + kb, an = P(kn, sa, S(L.shin)); return [kn, an, P(an, sa - 95, S(L.foot))]; };
    const arm = q => { const ua = 90 + 38 * Math.sin(q), el = P(sh, ua, S(L.uarm)), fa = ua - 95, wr = P(el, fa, S(L.farm)); return [el, wr, P(wr, fa, S(L.hand) * .8)]; };
    const [knN, anN, toN] = leg(a), [knF, anF, toF] = leg(a + Math.PI), [elN, wrN, hdN] = arm(a + Math.PI), [elF, wrF, hdF] = arm(a);
    return { head, neck, sh, waist, hip, elN, wrN, hdN, elF, wrF, hdF, knN, anN, toN, knF, anF, toF, front: [1, 0] };
  }
  function tennis(x, y, k, s = 1) {
    const a = 20 + k * 190;                       // 右上臂角度:引拍在身体右下 → 挥到左上
    const fa = a + 10 - Math.sin(k * Math.PI) * 25;
    const J = standFront(x, y, s, { armRAng: a, foreRAng: fa, armLAng: 120 - k * 40, foreLAng: 110 - k * 30 });
    const ang = Math.atan2(J.hdR[1] - J.wrR[1], J.hdR[0] - J.wrR[0]);
    return { J, racket: { x: J.hdR[0], y: J.hdR[1], ang: ang * 180 / Math.PI } };
  }
  function racket(r, s = 1) {
    const c = [r.x + Math.cos(r.ang * D2R) * 150 * s, r.y + Math.sin(r.ang * D2R) * 150 * s];
    let g = `<path d="M${f1(r.x)},${f1(r.y)} L${f1(r.x + Math.cos(r.ang * D2R) * 78 * s)},${f1(r.y + Math.sin(r.ang * D2R) * 78 * s)}" stroke="#2D2D33" stroke-width="${f1(11 * s)}" stroke-linecap="round"/>`;
    g += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(70 * s)}" ry="${f1(52 * s)}" transform="rotate(${f1(r.ang)} ${f1(c[0])} ${f1(c[1])})" fill="#F2F2EA" fill-opacity=".14" stroke="#D23C3C" stroke-width="${f1(8 * s)}"/>`;
    for (let i = -3; i <= 3; i++) {
      const ux = Math.cos(r.ang * D2R), uy = Math.sin(r.ang * D2R), nx = -uy, ny = ux, w = 52 * s * Math.sqrt(1 - (i / 4) ** 2), l = 70 * s * Math.sqrt(1 - (i / 4) ** 2);
      g += `<path d="M${f1(c[0] + nx * i * 13 * s - ux * l)},${f1(c[1] + ny * i * 13 * s - uy * l)} L${f1(c[0] + nx * i * 13 * s + ux * l)},${f1(c[1] + ny * i * 13 * s + uy * l)}" stroke="#E8E4D8" stroke-width="1.5" opacity=".7"/>`;
      g += `<path d="M${f1(c[0] + ux * i * 17 * s - nx * w)},${f1(c[1] + uy * i * 17 * s - ny * w)} L${f1(c[0] + ux * i * 17 * s + nx * w)},${f1(c[1] + uy * i * 17 * s + ny * w)}" stroke="#E8E4D8" stroke-width="1.5" opacity=".7"/>`;
    }
    return g;
  }
  function dumbbell(p, ang, s = 1) {
    const ux = Math.cos(ang * D2R), uy = Math.sin(ang * D2R), nx = -uy, ny = ux, h = 34 * s;
    let g = `<path d="M${f1(p[0] - nx * h)},${f1(p[1] - ny * h)} L${f1(p[0] + nx * h)},${f1(p[1] + ny * h)}" stroke="#4A4F57" stroke-width="${f1(8 * s)}" stroke-linecap="round"/>`;
    for (const k of [-1, 1]) g += `<rect x="${f1(p[0] + nx * h * k - 14 * s)}" y="${f1(p[1] + ny * h * k - 14 * s)}" width="${f1(28 * s)}" height="${f1(28 * s)}" rx="${f1(6 * s)}" fill="#2B2E34" stroke="#5B616B" stroke-width="2" transform="rotate(${f1(ang)} ${f1(p[0] + nx * h * k)} ${f1(p[1] + ny * h * k)})"/>`;
    return g;
  }
  return { begin, figure, tennis, racket, dumbbell, DEFS, standSide, situp, legPress, standFront, seated, run, ik2, P, capD, FAT0, WOOD0 };
})();
if (typeof VC !== 'undefined') VC.mannequin = RIG; else window.MANNEQUIN = RIG;
})();
