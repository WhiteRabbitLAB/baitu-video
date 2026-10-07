// 打开成片页(页面契约见 SKILL / channel.md):window.render(t) 只由时间决定;fontsReady / coverReady 是 Promise。
// 字体判定(通用):返回值里每个布尔字段都要是 true;有 faces 时每个字体族至少加载了一个分片。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PROJECT } from './paths.mjs';
import { loadChannel, loadVoice, fill } from './config.mjs';

export async function chromium() {
  const req = createRequire(path.join(PROJECT, 'package.json'));
  const m = await import(req.resolve('playwright'));
  return m.chromium || m.default.chromium;
}

// 认三种写法:布尔字段(都要 true)、VC.ready 的「族:字重 → face 数」数字(都要 > 0)、faces 对象(每个 loaded > 0)
export function fontsOk(f) {
  if (!f || typeof f !== 'object') return false;
  const vals = Object.values(f);
  return vals.filter(v => typeof v === 'boolean').every(Boolean) && vals.filter(v => typeof v === 'number').every(n => n > 0)
    && (!f.faces || Object.values(f.faces).every(x => x.loaded > 0));
}
// 页面改过、字体没重切:子集里没有的字会悄悄回退成别的字体。返回缺的字(没有 fonts 记录时返回 null)
export async function staleFontChars(o) {
  const { episodeChars, manifestPath } = await import('./fonts.mjs');
  const mf = manifestPath(o);
  if (!fs.existsSync(mf)) return null;
  const had = new Set(JSON.parse(fs.readFileSync(mf, 'utf8')).chars);
  return [...episodeChars(o)].filter(c => !had.has(c));
}

// 一期的路径与页面地址
export function episode({ ep, channel, lang, out }) {
  const ch = loadChannel(channel), langs = Object.keys(loadVoice(ch.dir).voices);
  lang = lang || langs[0];
  const suf = lang === langs[0] ? '' : '.' + lang;
  const OUT = out ? path.resolve(out) : path.join(PROJECT, fill(ch.paths.out, ep));
  const page = path.join(PROJECT, fill(ch.paths.page, ep));
  if (!fs.existsSync(page)) throw new Error(`没有成片页 ${page}`);
  const url = q => 'file://' + page + '?render' + (suf ? '&lang=' + lang : '') + (q ? '&' + q : '');
  return { ch, ep, lang, suf, OUT, page, url, brief: path.join(PROJECT, fill(ch.paths.brief, ep)), TMP: path.join(PROJECT, 'cache/render') };
}

export async function openPage(browser, url, { width = 1920, height = 1080, ready = 'fontsReady' } = {}) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(url);
  const fonts = await p.evaluate(r => window[r], ready);
  if (errors.length) throw new Error('页面报错:' + errors[0]);
  if (!fontsOk(fonts)) throw new Error('字体没有全部加载:' + JSON.stringify(fonts));
  p.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exitCode = 5; });
  return { p, fonts };
}
