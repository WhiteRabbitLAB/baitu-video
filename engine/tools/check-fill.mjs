// 「画面占比」检查:画面里有东西的地方占多大(给人看,不自动判死)。
//   node .claude/skills/baitu-video/engine/tools/check-fill.mjs <成片.mp4> [--every 2] [--json]
// 做法:每 N 秒抽一帧缩到 192×108;底色 = 画面四周一圈像素的中位色(底部字幕带不算);
// 和底色差得多的像素算「有内容」;按 8×8 的格子统计,格子里 ≥ 6% 的像素有内容就算「这格有东西」。
// 有东西的格子占画面(去掉底部字幕带)的比例 = 占比。纹理底(纸、木纹)本身差别小,不算内容;摆在桌上的纸张整张算内容。
// 阳性对照:一张左半黑、右半白的合成帧必须测出约 50%,否则探针失效(退出码 3)。
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2);
const take = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const EVERY = +take('every', 2), JSON_OUT = args.includes('--json'); if (JSON_OUT) args.splice(args.indexOf('--json'), 1);
const [mp4] = args;
const W = 192, H = 108, SUB = Math.round(H * .16), CELL = 8;   // 底部 16% 是字幕带

function fillOf(px) {   // px:W*H*3 的 RGB
  const at = (x, y) => (y * W + x) * 3, ring = [];
  for (let x = 0; x < W; x++) for (const y of [0, 1, H - SUB - 2, H - SUB - 1]) ring.push(at(x, y));
  for (let y = 0; y < H - SUB; y++) for (const x of [0, 1, W - 2, W - 1]) ring.push(at(x, y));
  const med = c => { const v = ring.map(i => px[i + c]).sort((a, b) => a - b); return v[v.length >> 1]; };
  const bg = [med(0), med(1), med(2)];
  const cols = W / CELL, rows = Math.floor((H - SUB) / CELL); let full = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let n = 0;
    for (let y = r * CELL; y < (r + 1) * CELL; y++) for (let x = c * CELL; x < (c + 1) * CELL; x++) { const i = at(x, y); if (Math.max(Math.abs(px[i] - bg[0]), Math.abs(px[i + 1] - bg[1]), Math.abs(px[i + 2] - bg[2])) > 36) n++; }
    if (n >= CELL * CELL * .06) full++;
  }
  return full / (rows * cols);
}

if (mp4) {
  // 阳性对照
  const ctl = Buffer.alloc(W * H * 3, 255); for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) ctl.fill(0, (y * W + x) * 3, (y * W + x) * 3 + 3);
  const c = fillOf(ctl);
  if (Math.abs(c - .5) > .06) { console.error(`探针失效:阳性对照(半黑半白)测出 ${(c * 100).toFixed(0)}%,应约 50%`); process.exit(3); }
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', mp4, '-vf', `fps=1/${EVERY},scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 30 });
  const n = raw.length / (W * H * 3), fr = [];
  for (let k = 0; k < n; k++) fr.push({ t: k * EVERY, f: fillOf(raw.subarray(k * W * H * 3, (k + 1) * W * H * 3)) });
  const sorted = fr.map(x => x.f).sort((a, b) => a - b), median = sorted[sorted.length >> 1], low = fr.filter(x => x.f < .2).length / fr.length;
  const res = { frames: n, median: +median.toFixed(3), lowShare: +low.toFixed(3), lowest: [...fr].sort((a, b) => a.f - b.f).slice(0, 5).map(x => ({ t: x.t, f: +x.f.toFixed(3) })), control: +c.toFixed(3) };
  console.log(JSON_OUT ? JSON.stringify(res) : `抽 ${n} 帧;占比中位数 ${(median * 100).toFixed(0)}%;占比 < 20% 的帧 ${(low * 100).toFixed(0)}%;最空:${res.lowest.map(x => `t=${x.t}s ${(x.f * 100).toFixed(0)}%`).join(',')}`);
}
