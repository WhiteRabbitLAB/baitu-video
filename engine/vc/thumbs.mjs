// 画风缩略图:node .claude/skills/baitu-video/engine/vc/thumbs.mjs → .claude/skills/baitu-video/styles/thumbs/<id>.jpg(960×540)+ _all.jpg(3×2 拼图)
// 每张 = thumbs.html?style=<id> 的 1920×1080 整帧;字体没加载上就报错退出,不出带替代字体的图。
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT as ROOT, SKILL, ENGINE } from '../lib/paths.mjs';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(SKILL, 'styles/thumbs'), TMP = path.join(ROOT, 'cache/vc-thumbs');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const ids = ['paper-skeuo', 'game-ui', 'flat-geometric', 'flat-illustration', 'cartoon-ui', 'tech-ui', 'whiteboard', 'dark-math', 'chalkboard', 'kinetic', 'risograph'];   // = styles/INDEX.md 的顺序
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
const pngs = [];
for (const id of ids) {
  await p.goto(new URL(`thumbs.html?style=${id}`, import.meta.url).href);
  const rep = await p.evaluate(() => window.thumbsReady);
  const bad = Object.entries(rep[id]).filter(([, n]) => n <= 0);
  if (bad.length) throw new Error(`${id} 字体没加载上:${JSON.stringify(bad)}`);
  const png = path.join(TMP, id + '.png');
  await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-vf', 'scale=960:540:flags=lanczos', '-q:v', '3', path.join(OUT, id + '.jpg')]);
  pngs.push(png); console.log('ok', id);
}
await b.close();
// 拼图:每行 COLS 格,每格 640×360,空格补黑
const COLS = pngs.length > 6 ? 4 : 3, n = pngs.length;
const inputs = pngs.flatMap(f => ['-i', f]);
const scaled = pngs.map((_, i) => `[${i}:v]scale=640:360:flags=lanczos[s${i}]`).join(';');
const layout = pngs.map((_, i) => `${(i % COLS) * 640}_${Math.floor(i / COLS) * 360}`).join('|');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex',
  `${scaled};${pngs.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=black[o]`, '-map', '[o]', '-q:v', '3', path.join(OUT, '_all.jpg')]);
for (const f of pngs) fs.unlinkSync(f);   // 中间 PNG 用完即删
fs.rmdirSync(TMP);
console.log('→', OUT);
