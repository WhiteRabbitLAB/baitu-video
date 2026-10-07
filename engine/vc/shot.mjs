// 演示页截图:node .claude/skills/explainer-video/engine/vc/shot.mjs <输出目录> 画风,语言,秒 …   例:node .claude/skills/explainer-video/engine/vc/shot.mjs /tmp/x paper-skeuo,zh,7.5 tech-ui,en,2.4
// 每张是整页(九行);字体没加载上会打印 FONT MISSING。
import { chromium } from 'playwright';
const [,, out, ...specs] = process.argv;   // spec = style,lang,t
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1000 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message)); p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
await p.goto(new URL('demo.html?render', import.meta.url).href);
await p.evaluate(() => window.demoReady);
for (const s of specs) {
  const [st, lang, t] = s.split(',');
  await p.evaluate(([st, lang]) => window.setStyle(st, lang), [st, lang]);
  const fr = await p.evaluate(() => window.fontsReady);
  const bad = Object.entries(fr).filter(([, n]) => n <= 0); if (bad.length) console.log('FONT MISSING', st, JSON.stringify(bad));
  await p.evaluate(t => window.render(t), +t);
  await p.screenshot({ path: `${out}/${st}-${lang}-${t}.png`, fullPage: true });
  console.log('ok', s);
}
await b.close();
