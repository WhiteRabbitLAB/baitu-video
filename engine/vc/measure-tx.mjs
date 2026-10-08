// 量转场:node .claude/skills/baitu-video/engine/vc/measure-tx.mjs [画风] [--sheet 目录]
// 对 transitions.html 里每种转场,按 30fps 逐帧渲染(&still 关掉待机微动),整帧缩到 480×270 灰度,
// 算每帧的「进度」= |帧 − A| ÷ |B − A|(A = 转场前一帧,B = 转场后一帧;按像素差的均值),报:
//   5–95% 用时、到 50% 的时刻(相对转场起点)、相邻帧最大跳变(灰度差均值,和 measure_film.py 的「相邻帧跳变」同口径)。
// 口径与 A6 淡化的量法一致(design/camera-transitions.md 转场库 fade 一行)。--sheet 另存 25/50/75% 三帧拼图供肉眼核。
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2), si = args.indexOf('--sheet'), SHEET = si >= 0 ? args.splice(si, 2)[1] : null;
const STYLE = args[0] || 'paper-skeuo', FPS = 30, W = 480, H = 270;
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
const ids = (process.env.TX ? process.env.TX.split(',') : ['fade', 'slide-push', 'blur-push', 'zoom-through', 'morph', 'fill-zoom', 'bands']), out = {};   // fade = 阳性对照,理论 5–95% = 0.9 × 0.35 = 0.315s
for (const id of ids) {
  await p.goto(new URL(`transitions.html?render&still&style=${STYLE}&tx=${id}`, import.meta.url).href);
  await p.evaluate(() => window.txReady);
  const { t0, dur } = (await p.evaluate(() => window.txInfo()))[id];
  const f0 = Math.round((t0 - .2) * FPS), f1 = Math.round((t0 + dur + .2) * FPS), pngs = [];
  for (let f = f0; f <= f1; f++) { await p.evaluate(t => window.render(t), f / FPS); pngs.push(await p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } })); }
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-f', 'image2pipe', '-c:v', 'png', '-i', '-', '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { input: Buffer.concat(pngs), maxBuffer: 1 << 28 });
  const N = raw.length / (W * H), fr = i => raw.subarray(i * W * H, (i + 1) * W * H);
  const dist = (x, y) => { let s = 0; for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]); return s / x.length; };
  const A = fr(0), B = fr(N - 1), AB = dist(A, B);
  // 进度:到 A 的距离与到 B 的距离之比(两端都参照,形变 / 位移类转场中途离两边都远时也单调)
  const prog = Array.from({ length: N }, (_, i) => { const a = dist(fr(i), A), bb = dist(fr(i), B); return a / (a + bb || 1); });
  const jump = Array.from({ length: N }, (_, i) => i ? dist(fr(i), fr(i - 1)) : 0);
  const first = th => { const i = prog.findIndex(v => v >= th); return i < 0 ? null : (f0 + i) / FPS - t0; };
  const r = x => x == null ? null : +x.toFixed(3);
  out[id] = { design: { dur }, measured: { p05: r(first(.05)), p50: r(first(.5)), p95: r(first(.95)), span5to95: r(first(.95) - first(.05)), maxJump: +Math.max(...jump).toFixed(1), abDiff: +AB.toFixed(1) } };
  console.log(id.padEnd(13), JSON.stringify(out[id]));
  if (SHEET) {
    fs.mkdirSync(SHEET, { recursive: true });
    const pick = [.25, .5, .75].map(q => pngs[Math.round((t0 + dur * q) * FPS) - f0]);
    const files = pick.map((png, i) => { const f = path.join(SHEET, `${id}-${i}.png`); fs.writeFileSync(f, png); return f; });
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', '[0]scale=640:-1[a];[1]scale=640:-1[b];[2]scale=640:-1[c];[a][b][c]hstack=3', path.join(SHEET, `${STYLE}-${id}.jpg`)]);
    files.forEach(f => fs.unlinkSync(f));
  }
}
await b.close();
console.log(JSON.stringify({ style: STYLE, fps: FPS, results: out }));
