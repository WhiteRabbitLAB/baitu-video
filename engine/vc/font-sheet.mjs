// 字体样张:node .claude/skills/explainer-video/engine/vc/font-sheet.mjs → .claude/skills/explainer-video/design/font-samples/2026-10-new-sources.jpg
// 1) 把 font-sheet.html 用到的字从 cache/fonts-cand 的候选字体里子集化到 cache/vc-font-sheet/(原样,不改轮廓);
//    中文字体再用 engine/tools/check-winding.py 查「同向内轮廓」(洞会被填实)。它报出来的字要在样张上肉眼核:
//    笔画落在框里的字(直、真、面)几何上和缺陷长得一样,只有渲染出来才分得清。阳性对照:站酷小薇原版的「回」。
// 2) 截整页。字体没加载上就报错。
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT as ROOT, SKILL, ENGINE } from '../lib/paths.mjs';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const C = path.join(ROOT, 'cache/fonts-cand'), OUT = path.join(ROOT, 'cache/vc-font-sheet'), PY = path.join(ROOT, 'cache/venv-fonts/bin');
const DEST = path.join(SKILL, 'design/font-samples');
const FONTS = [   // [族名, 文件, 中文?, 字重]
  ['LXGW Marker Gothic', 'LXGWMarkerGothic-Regular.ttf', 1], ['Fusion Pixel 12', 'FusionPixel12-zh_hans.ttf', 1],
  ['Noto Serif TC', 'NotoSerifTC[wght].ttf', 1, '200 900'], ['I.Ming', 'I.Ming-8.10.ttf', 1],
  ['Fredericka the Great', 'FrederickatheGreat-Regular.ttf'], ['Cabin Sketch', 'CabinSketch-Bold.ttf', 0, 700],
  ['Playfair Display', 'PlayfairDisplay[wght].ttf', 0, '400 900'], ['UnifrakturMaguntia', 'UnifrakturMaguntia-Book.ttf'],
  ['Press Start 2P', 'PressStart2P-Regular.ttf'], ['Silkscreen', 'Silkscreen-Regular.ttf'], ['Monoton', 'Monoton-Regular.ttf'],
  ['Neonderthaw', 'Neonderthaw-Regular.ttf'], ['IM Fell English', 'IMFeENrm28P.ttf'],
  ['XiaoWei Raw', 'ZCOOLXiaoWei.ttf', 1],
  ['Xiaolai', 'Xiaolai.ttf', 1], ['Long Cang', 'LongCang.ttf', 1], ['Jason Handwriting 1', 'JasonHandwriting1.ttf', 1],   // 粉笔手写对比
  ['Gochi Hand', 'GochiHand-Regular.ttf'], ['Patrick Hand', 'PatrickHand-Regular.ttf'], ['Architects Daughter', 'ArchitectsDaughter-Regular.ttf'],   // 阳性对照:未修的站酷小薇,「回」应渲染成实心块
];
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(DEST, { recursive: true });
const html = fs.readFileSync(path.join(HERE, 'font-sheet.html'), 'utf8').replace(/<[^>]+>/g, ' ');
const chars = [...new Set([...html].filter(c => c.codePointAt(0) >= 32))].join('') + Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const cf = path.join(OUT, 'chars.txt'); fs.writeFileSync(cf, chars);
let css = '/* 由 engine/vc/font-sheet.mjs 生成(样张用,不进仓库) */\n';
for (const [fam, f, zh, wt] of FONTS) {
  const o = path.join(OUT, f.replace(/\W+/g, '') + '.woff2');
  if (zh) console.log(fam.padEnd(20), execFileSync(path.join(PY, 'python'), [path.join(ENGINE, 'engine/tools/check-winding.py'), path.join(C, f), chars]).toString().trim());
  execFileSync(path.join(PY, 'pyftsubset'), [path.join(C, f), `--text-file=${cf}`, '--flavor=woff2', `--output-file=${o}`, '--layout-features=*', '--no-hinting']);
  css += `@font-face{font-family:'${fam}';src:url(./${path.basename(o)}) format('woff2');font-display:block${wt ? ';font-weight:' + wt : ''}}\n`;
}
fs.writeFileSync(path.join(OUT, 'fonts.css'), css);
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
await p.goto(new URL('font-sheet.html', import.meta.url).href);
const rep = await p.evaluate(() => window.sheetReady);
const bad = Object.entries(rep).filter(([, n]) => n <= 0);
if (bad.length) throw new Error('字体没加载上:' + JSON.stringify(bad));
const png = path.join(OUT, 'sheet.png');
await p.screenshot({ path: png, fullPage: true });
await b.close();
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '3', path.join(DEST, '2026-10-new-sources.jpg')]);
fs.unlinkSync(png);
console.log('→', path.join(DEST, '2026-10-new-sources.jpg'));
