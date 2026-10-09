// 按时刻截图(调试 / 取证 / 给决策者看样):shot <期> t1 t2 … [--vert] [--dir 目录]
import fs from 'node:fs';
import path from 'node:path';
import { episode, chromium, openPage } from './page.mjs';
export async function shot(o, times) {
  const E = episode(o), dir = path.resolve(o.dir || path.join(E.OUT, 'shots')); fs.mkdirSync(dir, { recursive: true });
  const b = await (await chromium()).launch(), files = [];
  try {   // 页面报错时也要关掉浏览器,否则进程挂着不退出(2026-10-09 实测:页面里一个未定义函数让 shot 卡了 5 分钟)
    const { p } = await openPage(b, E.url(o.vert ? 'vert' : ''), o.vert ? { width: 1080, height: 1920 } : {});
    for (const t of times) {
      await p.evaluate(([t, v]) => v ? window.vertFrame(t, 0) : window.render(t), [+t, !!o.vert]);
      const f = path.join(dir, `${o.vert ? 'v' : 'f'}-${(+t).toFixed(2)}.png`); await p.screenshot({ path: f }); files.push(f);
    }
  } finally { await b.close(); }
  return files;
}
