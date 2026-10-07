// 封面:成片页的封面模式 ?render&cover=<尺寸>-<版本>(同一套画面取一帧 + 标题),等 coverReady → 截图 <out>/cover-<尺寸>-<版本>.png
// 尺寸:16x9 = 1920×1080,3x4 = 1080×1440,9x16 = 1080×1920,1x1 = 1080×1080;另可写 宽x高 像素。
import fs from 'node:fs';
import path from 'node:path';
import { episode, chromium, openPage } from './page.mjs';
const SIZES = { '16x9': [1920, 1080], '3x4': [1080, 1440], '9x16': [1080, 1920], '1x1': [1080, 1080], '4x3': [1440, 1080] };

export async function cover(o) {
  const E = episode(o), sizes = (o.sizes || '16x9,3x4').split(','), variants = (o.variants || 'a').split(',');
  const b = await (await chromium()).launch(), log = [];
  try {
    for (const size of sizes) for (const v of variants) {
      const [W, H] = SIZES[size] || size.split('x').map(Number);
      const { p, fonts } = await openPage(b, E.url(`cover=${size}-${v}`), { width: W, height: H, ready: 'coverReady' });
      const f = path.join(E.OUT, `cover-${size}-${v}${E.suf}.png`);
      await p.screenshot({ path: f }); await p.close();
      log.push({ file: f, fonts });
    }
  } finally { await b.close(); }
  fs.writeFileSync(path.join(E.OUT, `cover-log${E.suf}.json`), JSON.stringify(log, null, 1));
  return log.map(l => l.file);
}
