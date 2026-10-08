// 竖版「版面居中」检查:内容是不是偏上 / 偏下 / 偏左右,画面中间有没有大块空着
//   node .claude/skills/baitu-video/engine/tools/check-vert-balance.mjs <页面?参数> <内容区上沿> <内容区下沿> [时刻 …] [--shots 目录]
//   例:node .claude/skills/baitu-video/engine/tools/check-vert-balance.mjs "video/lesson-03.html?render&vert" 360 1530 20 48 66
// 约定:页面把每个镜头的内容包在 <g id="vcontent"> 里(标题栏、字幕不算内容)。
// 量所有可见叶子元素的合并边框,报:上下留白、左右留白、内容中心离内容区中心偏多少。
// 记一处「偏」(退出码 1)的条件:上下留白少的一边不到多的一边的 0.6 倍,或内容中心纵向偏 >35px、横向偏 >40px。
// 反例(2026-10-07 N10 第一版竖版):上留 44 / 下留 123,决策者看着「素材靠上」——容差按这个定,要能把它报出来。只是提示,最终靠肉眼看截图。
import { chromium } from 'playwright';
import path from 'node:path';
const args = process.argv.slice(2), si = args.indexOf('--shots'), SHOTS = si >= 0 ? args.splice(si, 2)[1] : null;
const [page, top, bot, ...ts] = args;
if (!page || !top || !bot) { console.error('用法:node .claude/skills/baitu-video/engine/tools/check-vert-balance.mjs <页面?参数> <内容区上沿> <内容区下沿> [时刻 …] [--shots 目录]'); process.exit(2); }
import { PROJECT as ROOT } from '../lib/paths.mjs';
const [file, query = ''] = page.split('?');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
await p.goto('file://' + path.join(ROOT, file) + (query ? '?' + query : ''));
await p.evaluate(() => window.fontsReady);
const A = +top, Z = +bot, CY = (A + Z) / 2, W = 1080;
let bad = 0;
for (const t of (ts.length ? ts : ['0']).map(Number)) {
  await p.evaluate(t => window.vertFrame(t), t);
  const r = await p.evaluate(() => {
    const g = document.getElementById('vcontent'); if (!g) return null;
    let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    g.querySelectorAll('*').forEach(e => {
      if (e.children.length && e.tagName !== 'text') return;
      if (['defs', 'clipPath', 'mask', 'linearGradient', 'radialGradient', 'stop', 'filter'].some(n => e.closest(n))) return;
      const q = e.getBoundingClientRect(); if (q.width < 1 || q.height < 1) return;
      let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const a = x.getAttribute('opacity'); if (a != null) o *= +a; o *= +getComputedStyle(x).opacity; }
      if (o < .05) return;
      L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom);
    });
    return [L, T, R, B].map(Math.round);
  });
  if (!r) { console.log(`t=${t}:页面没有 <g id="vcontent">`); bad++; continue; }
  const [L, T, R, B] = r, dy = Math.round((T + B) / 2 - CY), dx = Math.round((L + R) / 2 - W / 2);
  const gt = T - A, gb = Z - B, ratio = Math.min(gt, gb) / Math.max(gt, gb, 1);
  const off = ratio < .6 || Math.abs(dy) > 35 || Math.abs(dx) > 40;
  if (off) bad++;
  console.log(`t=${t}:内容 y ${T}–${B}(上留 ${T - A} / 下留 ${Z - B})x ${L}–${R}(左 ${L} / 右 ${W - R})纵偏 ${dy > 0 ? '下' : '上'} ${Math.abs(dy)}px 横偏 ${dx > 0 ? '右' : '左'} ${Math.abs(dx)}px${off ? '  ← 偏' : ''}`);
  if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `vb-${t}.png`) });
}
await b.close();
console.log(bad ? `有 ${bad} 处偏移,看截图再调` : '居中:全部在容差内');
process.exit(bad ? 1 : 0);
