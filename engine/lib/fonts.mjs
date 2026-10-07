// 字体子集化:按画面上真正出现的字,把用到的字体切成小 woff2 + 一份 CSS。
//   fonts-demo        → engine/vc/fonts/ + vc/fonts.css(共享组件的演示页、缩略图、样张用;引擎自带,不依赖项目文件)
//   fonts <期>        → <页面目录>/fonts-<期>/ + fonts-<期>.css(页面 <link> 它);字 = brief 文件夹里的文字 + 页面 + 画风表,字体 = 页面用到的画风 + 页面里直接写的族名
// 源文件按 engine/fonts.json 下载到 <项目>/cache/fonts-src/(第一次用要联网);可变字体按需要的字重切成静态字重。
// 需要 Python 的 fontTools + brotli:有 cache/venv-fonts 就用它;否则用系统 python3;再不行用 uv 临时装。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { ENGINE, PROJECT, CACHE } from './paths.mjs';
import { loadChannel, fill } from './config.mjs';

const CATALOG = JSON.parse(fs.readFileSync(path.join(ENGINE, 'fonts.json'), 'utf8')).fonts;
const SRC = path.join(CACHE, 'fonts-src'), LEGACY = path.join(CACHE, 'fonts-cand');
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') + ',。:;?!“”‘’、—…·()《》×→✓▍›「」';

export function python() {
  const ok = cmd => { try { execFileSync(cmd[0], [...cmd.slice(1), '-c', 'import fontTools, brotli'], { stdio: 'ignore' }); return true; } catch { return false; } };
  for (const c of [[path.join(CACHE, 'venv-fonts/bin/python')], ['python3'], ['uv', 'run', '-q', '--with', 'fonttools', '--with', 'brotli', 'python']]) if ((fs.existsSync(c[0]) || c[0] !== path.join(CACHE, 'venv-fonts/bin/python')) && ok(c)) return c;
  throw new Error('没有能用的 fontTools:pip install fonttools brotli(或装 uv)');
}
const py = (P, args) => execFileSync(P[0], [...P.slice(1), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// 画风表里每种画风用到的「族名:字重」
export function styleFonts() {
  const w = {}; vm.runInNewContext(fs.readFileSync(path.join(ENGINE, 'vc/styles.js'), 'utf8'), { window: w });
  const out = {};
  const walk = (o, acc) => { if (typeof o === 'string') { const m = o.match(/^([A-Z][\w .]*?):(\d{3})$/); if (m) acc.add(m[1] + ':' + m[2]); } else if (o && typeof o === 'object') for (const v of Object.values(o)) walk(v, acc); };
  for (const k of Object.keys(w.VC.styles)) { const a = new Set(); walk(w.VC.styles[k], a); out[k] = [...a]; }
  return out;
}

async function source(entry) {
  const legacy = path.join(LEGACY, entry.file), f = path.join(SRC, entry.file);
  if (fs.existsSync(legacy)) return legacy;   // 作者早先下载的源文件(兼容旧缓存位置)
  if (fs.existsSync(f)) return f;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  console.log(`下载 ${entry.family} …`);
  const r = await fetch(entry.url);
  if (!r.ok) throw new Error(`下载 ${entry.family} 失败:HTTP ${r.status}(${new URL(entry.url).host})`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (entry.zip) {
    const z = path.join(os.tmpdir(), 'font-' + Date.now() + '.zip'); fs.writeFileSync(z, buf);
    try { fs.writeFileSync(f, execFileSync('unzip', ['-p', z, `*${entry.zip}`], { maxBuffer: 1 << 28 })); } finally { fs.rmSync(z); }
  } else fs.writeFileSync(f, buf);
  if (fs.statSync(f).size < 10000) { fs.rmSync(f); throw new Error(`${entry.family} 下载下来不像字体文件`); }
  return f;
}

// 许可证原文随字体一起放(OFL 要求再分发时附带);没有现成文件的(清松手写体)用 OFL 1.1 正文 + 作者署名
async function writeLicenses(entries, dir) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const get = async u => { const f = path.join(SRC, 'licenses', u.replace(/\W+/g, '_')); if (!fs.existsSync(f)) { const r = await fetch(u); if (!r.ok) throw new Error(`许可证下载失败 HTTP ${r.status}:${new URL(u).host}`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, await r.text()); } return fs.readFileSync(f, 'utf8'); };
  const OFL_BODY = async () => { const t = await get('https://raw.githubusercontent.com/google/fonts/main/ofl/kalam/OFL.txt'); return t.slice(t.indexOf('This Font Software is licensed')); };
  const lines = [];
  for (const e of entries) {
    const text = e.licenseUrl ? await get(e.licenseUrl) : `${e.copyright}\n\n${await OFL_BODY()}`;
    const name = e.family.replace(/\W+/g, '') + '.txt';
    fs.writeFileSync(path.join(dir, name), text);
    lines.push(`| ${e.family} | ${e.license} | ${name} | ${e.renameTo ? `文件内部改名为「${e.renameTo}」/ renamed inside the file to "${e.renameTo}" (${e.rfn})` : '—'} |`);
  }
  fs.writeFileSync(path.join(dir, 'README.md'), `# 字体许可证 / Font licenses\n\n这些是原字体按页面用到的字切出来的子集(修改版);原字体的许可证原文在本文件夹。\nThese are subsets (modified versions) of the original fonts, cut to the characters the pages use; each original font's license text is in this folder.\n\n| 字体 Font | 许可 License | 原文 Text | 说明 Notes |\n|---|---|---|---|\n${[...new Set(lines)].join('\n')}\n`);
}

// specs:["Noto Sans SC:500", …];返回 CSS 文本
export async function subset(specs, chars, outDir, cssRel, prefix = 'f-') {
  const P = python(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-'));
  const cf = path.join(tmp, 'chars.txt'); fs.writeFileSync(cf, chars);
  fs.mkdirSync(outDir, { recursive: true });
  let css = `/* 由引擎 fonts 生成;子集字体,授权见 engine/fonts.json */\n`;
  const report = [], licenses = new Set();
  try {
    for (const spec of [...new Set(specs)].sort()) {
      const [family, wt] = spec.split(':'), weight = +wt;
      const entry = CATALOG.find(e => e.family === family && (e.weight ? e.weight === weight : true)) || CATALOG.find(e => e.family === family);
      if (!entry) { report.push(`⚠️ ${spec}:fonts.json 里没有登记,跳过`); continue; }
      let src = await source(entry);
      if (entry.variable) { const inst = path.join(tmp, `inst-${weight}-${path.basename(entry.file)}`); py(P, ['-m', 'fontTools.varLib.instancer', src, `wght=${weight}`, '-q', '-o', inst]); src = inst; }
      const out = `${prefix}${family.replace(/\W+/g, '')}-${weight}.woff2`, dest = path.join(outDir, out);
      if (entry.fixWinding) {
        const t = path.join(tmp, 'w.ttf');
        py(P, ['-m', 'fontTools.subset', src, `--text-file=${cf}`, `--output-file=${t}`, '--layout-features=*', '--no-hinting']);
        py(P, [path.join(ENGINE, 'tools/fix-winding.py'), t, dest]);
      } else py(P, ['-m', 'fontTools.subset', src, `--text-file=${cf}`, '--flavor=woff2', `--output-file=${dest}`, '--layout-features=*', '--no-hinting']);
      if (entry.renameTo) {   // 保留名称 / 商标:改动过的字体文件内部不许用原名(OFL 第 3 条)
        py(P, ['-c', `import sys\nfrom fontTools.ttLib import TTFont\nf=TTFont(sys.argv[1]);new=sys.argv[2];ps=new.replace(' ','')+'-Regular'\nfor r in f['name'].names:\n  if r.nameID in (1,16,21): r.string=new\n  elif r.nameID in (4,18): r.string=new\n  elif r.nameID in (3,6,20): r.string=ps\nf.save(sys.argv[1])`, dest, entry.renameTo]);
      }
      licenses.add(entry);
      css += `@font-face{font-family:'${family}';src:url(${cssRel}/${out}) format('woff2');font-weight:${weight};font-display:block}\n`;
      report.push(`${spec.padEnd(24)} ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  await writeLicenses([...licenses], path.join(outDir, 'LICENSES'));
  return { css, report };
}

const charsOf = text => [...new Set([...text + ASCII].filter(c => c.codePointAt(0) >= 32))].join('');

export async function fontsDemo() {
  const VCD = path.join(ENGINE, 'vc');
  let text = '';
  for (const f of ['demo.html', 'thumbs.html', 'transitions.html', 'roles.html', 'fit-test.html', 'scene-gallery.html', 'styles.js', 'vc.js']) if (fs.existsSync(path.join(VCD, f))) text += fs.readFileSync(path.join(VCD, f), 'utf8');
  const specs = Object.values(styleFonts()).flat();
  fs.rmSync(path.join(VCD, 'fonts'), { recursive: true, force: true });
  const { css, report } = await subset(specs, charsOf(text), path.join(VCD, 'fonts'), './fonts', 'vc-');
  fs.writeFileSync(path.join(VCD, 'fonts.css'), css);
  return report;
}

function episodePaths({ ep, channel }) {
  const ch = loadChannel(channel), page = path.join(PROJECT, fill(ch.paths.page, ep)), brief = path.join(PROJECT, fill(ch.paths.brief, ep));
  return { ch, page, brief, dir: path.dirname(page) };
}
export const manifestPath = o => { const { dir } = episodePaths(o); return path.join(dir, `fonts-${o.ep}.json`); };
// 这一期画面上可能出现的全部字:页面 + 画风表 + brief 文件夹里的文字 + 字幕数据
export function episodeChars(o) {
  const { page, brief, dir } = episodePaths(o);
  let text = fs.readFileSync(page, 'utf8') + fs.readFileSync(path.join(ENGINE, 'vc/styles.js'), 'utf8');
  if (fs.existsSync(brief)) for (const f of fs.readdirSync(brief)) if (/\.(txt|md|json)$/.test(f)) text += fs.readFileSync(path.join(brief, f), 'utf8');
  for (const f of fs.readdirSync(dir)) if (f.startsWith(`data-${o.ep}`) && f.endsWith('.js')) text += fs.readFileSync(path.join(dir, f), 'utf8');
  return charsOf(text);
}

export async function fontsEpisode(o) {
  const { ep } = o, { page, dir } = episodePaths(o);
  if (!fs.existsSync(page)) throw new Error('没有成片页 ' + page);
  const html = fs.readFileSync(page, 'utf8'), chars = episodeChars(o);
  const SF = styleFonts(), used = [...html.matchAll(/VC\.kit\(\s*['"]([\w-]+)['"]/g)].map(m => m[1]);
  const specs = [...used.flatMap(s => SF[s] || []), ...[...html.matchAll(/['"]([A-Z][\w .]*?):(\d{3})['"]/g)].map(m => `${m[1]}:${m[2]}`)];
  if (!specs.length) throw new Error('页面里没找到画风(VC.kit(\'画风\'))或「族名:字重」写法,不知道要切哪些字体');
  const name = `fonts-${ep}`;
  fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  const { css, report } = await subset(specs, chars, path.join(dir, name), `./${name}`, 'f-');
  fs.writeFileSync(path.join(dir, `${name}.css`), css);
  fs.writeFileSync(manifestPath(o), JSON.stringify({ note: '由引擎 fonts 生成:切子集时用到的字。页面或稿子加了字没重切,render / accept 会报。', specs: [...new Set(specs)].sort(), chars: [...chars] }));
  return [`页面里加:<link rel="stylesheet" href="${name}.css">`, `画风:${used.join('、') || '无'};字数 ${[...chars].length}`, ...report];
}
