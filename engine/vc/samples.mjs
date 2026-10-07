// 画风入库三张样张(styles/ROADMAP.md「入库标准」):node .claude/skills/explainer-video/engine/vc/samples.mjs <画风 id>
//   1 空场景 = thumbs.html(信息卡片场景,同内容只换画风)
//   2 文字角色 = roles.html 全部画完的一帧(R1–R10 各一行 + 角色)
//   3 角色 = roles.html 右栏:画到一半 + 画完,左右并排(看出场方式与角色在画风里像不像贴纸)
// 输出 .claude/skills/explainer-video/styles/samples/<id>-1-scene.jpg、-2-roles.jpg、-3-character.jpg;中间 PNG 用完即删。
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const ID = process.argv[2]; if (!ID) throw new Error('用法:node .claude/skills/explainer-video/engine/vc/samples.mjs <画风 id>');
import { PROJECT as ROOT, SKILL, ENGINE } from '../lib/paths.mjs';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(SKILL, 'styles/samples'), TMP = path.join(ROOT, 'cache/vc-samples');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
const shot = async f => { const o = path.join(TMP, f); await p.screenshot({ path: o, clip: { x: 0, y: 0, width: 1920, height: 1080 } }); return o; };
const check = rep => { const bad = Object.entries(rep).filter(([, n]) => n <= 0); if (bad.length) throw new Error('字体没加载上:' + JSON.stringify(bad)); };
const jpg = (src, dst, vf) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...src.flatMap(s => ['-i', s]), ...(vf ? ['-filter_complex', vf] : []), '-q:v', '3', path.join(OUT, dst)]);

await p.goto(new URL(`thumbs.html?style=${ID}`, import.meta.url).href); check((await p.evaluate(() => window.thumbsReady))[ID]);
const s1 = await shot('s1.png');
await p.goto(new URL(`roles.html?style=${ID}`, import.meta.url).href); check(await p.evaluate(() => window.rolesReady));
const s2 = await shot('s2.png');
await p.evaluate(() => window.renderAt(4.4)); const s3a = await shot('s3a.png');
await b.close();
jpg([s1], `${ID}-1-scene.jpg`); jpg([s2], `${ID}-2-roles.jpg`);
jpg([s3a, s2], `${ID}-3-character.jpg`, '[0]crop=640:760:1240:200[a];[1]crop=640:760:1240:200[b];[a][b]hstack');
for (const f of [s1, s2, s3a]) fs.unlinkSync(f);
console.log('→', OUT, `${ID}-1/2/3`);
