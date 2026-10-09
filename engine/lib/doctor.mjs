// 自检:一条命令查清「能不能开工」,缺什么直接说缺什么。只报布尔,不打印任何密钥的值。
// 退出码:有 ❌ ⇒ 1;只有 ⚠️ ⇒ 0。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { ENGINE, SKILL, PROJECT, CACHE } from './paths.mjs';
import { CONFIG_FILE, loadProject, loadChannel, loadVoice, hasKey, profileCandidates } from './config.mjs';
import { PROVIDERS } from './providers.mjs';

const rows = [];
const ok = (k, msg) => rows.push(['✅', k, msg]);
const warn = (k, msg) => rows.push(['⚠️ ', k, msg]);
const bad = (k, msg) => rows.push(['❌', k, msg]);
const run = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch { return null; } };
const which = cmd => run('which', [cmd])?.trim() || null;

export async function doctor() {
  // 1) Node
  const major = +process.versions.node.split('.')[0];
  major >= 18 ? ok('Node', process.versions.node) : bad('Node', `${process.versions.node},需要 ≥ 18`);

  // 2) Playwright + Chromium(从项目目录解析,和渲染时一致)
  try {
    const req = createRequire(path.join(PROJECT, 'package.json'));
    const m = await import(req.resolve('playwright')), chromium = m.chromium || m.default?.chromium;   // CJS 包:ESM 导入时在 default 下
    const exe = chromium.executablePath();
    fs.existsSync(exe) ? ok('Playwright', 'Chromium 已安装') : bad('Playwright', 'Chromium 没装:在项目目录跑 npx playwright install chromium');
  } catch (e) { bad('Playwright', /Cannot find/.test(e.message) ? '项目里没装:npm i -D playwright && npx playwright install chromium' : e.message.split('\n')[0]); }

  // 3) ffmpeg / ffprobe(渲染要 libx264,混音要 loudnorm)
  if (!which('ffmpeg')) bad('ffmpeg', '没装(macOS:brew install ffmpeg)');
  else {
    const enc = run('ffmpeg', ['-hide_banner', '-encoders']) || '', flt = run('ffmpeg', ['-hide_banner', '-filters']) || '';
    const miss = [!/libx264/.test(enc) && 'libx264', !/loudnorm/.test(flt) && 'loudnorm'].filter(Boolean);
    miss.length ? bad('ffmpeg', `缺 ${miss.join('、')}`) : ok('ffmpeg', (run('ffmpeg', ['-version']) || '').split('\n')[0].replace('ffmpeg version ', '').split(' ')[0]);
  }
  which('ffprobe') ? ok('ffprobe', '有') : bad('ffprobe', '没装(随 ffmpeg 一起装)');

  // 4) whisper(漏读核查;接口不给时间戳时用来对齐)—— 可选
  const { WHISPER_MODEL, WHISPER_MODEL_DEFAULT } = await import('./align.mjs'), model = WHISPER_MODEL();
  const getModel = `mkdir -p cache/whisper && curl -L -o cache/whisper/ggml-medium.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin(约 1.5 GB;或在 .env 写 WHISPER_MODEL=模型路径)`;
  if (!which('whisper-cli')) warn('whisper', '没装 whisper-cli:漏读核查跑不了;配音服务不给时间戳时也对不齐字幕(brew install whisper-cpp)');
  else fs.existsSync(model) ? ok('whisper', `whisper-cli + 模型(${model === WHISPER_MODEL_DEFAULT ? '项目 cache/whisper' : path.basename(model)})`) : warn('whisper', `有 whisper-cli,但没有模型文件:${getModel}`);

  // 4b) python3:验收「字幕时长」直接调它(只用标准库);量成片节奏的两个工具另要 numpy —— 后者可选
  if (!which('python3')) bad('python3', '没装:验收第 5 项「字幕时长」要用(macOS 自带或 brew install python)');
  else run('python3', ['-c', 'import numpy']) !== null ? ok('python3', '有(含 numpy)') : ok('python3', '有;没有 numpy:只影响量成片节奏的 measure_film.py / measure_fades.py(pip install numpy)');

  // 5) 字体子集化(fontTools + brotli)—— 可选
  try { const P = (await import('./fonts.mjs')).python(); ok('fontTools', `有(字体子集化;${P[0].includes('venv') ? '项目 venv' : P[0] === 'uv' ? 'uv 临时环境' : 'python3'})`); }
  catch { warn('fontTools', '没有:每期字体子集化做不了(pip install fonttools brotli,或装 uv)'); }

  // 6) 共享组件的字体:fonts.css 里每个文件都要找得到
  const css = path.join(ENGINE, 'vc/fonts.css');
  if (!fs.existsSync(css)) bad('组件字体', '缺 engine/vc/fonts.css');
  else {
    const urls = [...fs.readFileSync(css, 'utf8').matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/['"]/g, '').replace(/[?#].*/, ''));
    const missing = urls.filter(u => !fs.existsSync(path.resolve(path.dirname(css), u)));
    missing.length ? bad('组件字体', `${missing.length}/${urls.length} 个字体文件找不到(例:${missing[0]})`) : ok('组件字体', `${urls.length} 个文件都在`);
  }

  // 7) 项目配置 → 频道配置 → 配音设定 → 密钥(只报有没有)
  if (!fs.existsSync(CONFIG_FILE)) bad('项目配置', `没有 explainer.json(在 ${PROJECT};照 engine/explainer.example.json 写一份)`);
  else {
    let cfg; try { cfg = loadProject(); } catch (e) { bad('项目配置', e.message); }
    for (const id of Object.keys(cfg?.channels || {})) {
      const ch = loadChannel(id);
      const miss = ['channel.md', 'voice.md', 'preferences.md'].filter(f => !fs.existsSync(path.join(ch.dir, f)));
      if (miss.length === 3) { bad(`频道 ${id}`, `找不到频道配置(channel / voice / preferences)。试过:${profileCandidates(ch.profile || id).map(d => path.relative(PROJECT, d) || '.').join(' / ')}。把 skill 的 profiles/_template/ 复制到 <项目>/profiles/${ch.profile || id}/`); continue; }
      if (miss.length) { bad(`频道 ${id}`, `${path.relative(PROJECT, ch.dir) || '.'} 里缺 ${miss.join('、')}(从 skill 的 profiles/_template/ 复制过来再填)`); continue; }
      if (/<频道\/系列名>|<channel \/ series name>/.test(fs.readFileSync(path.join(ch.dir, 'channel.md'), 'utf8'))) warn(`频道 ${id}`, 'channel.md 还是模板原文:至少填上平台、字幕规格、平台规矩');
      ok(`频道 ${id}`, ch.dir.startsWith(SKILL) ? 'skill/' + path.relative(SKILL, ch.dir) : path.relative(PROJECT, ch.dir));
      let v; try { v = loadVoice(ch.dir); } catch (e) { bad(`配音 ${id}`, e.message); continue; }
      for (const [lang, cfgV] of Object.entries(v.voices)) {
        const p = PROVIDERS[cfgV.provider];
        if (!p) { bad(`配音 ${id}/${lang}`, `不认识的服务「${cfgV.provider}」;可选:${Object.keys(PROVIDERS).join('、')}`); continue; }
        const keyName = cfgV.keyEnv || p.keyEnv;
        const keyOk = !keyName || hasKey(keyName);
        const cmd = p.cmd ? (await import('./tts/edge-tts.mjs')).command() : null, cmdOk = !p.cmd || !!cmd;
        const notes = [p.timestamps ? '接口给时间戳' : '接口不给时间戳,用 whisper 对齐', p.status === 'tested' ? `实测 ${p.checked}` : '按官方文档接入、未实测,第一次用先跑 tools/tts-probe.mjs'].join(';');
        const head = `${p.name} · ${cfgV.voice || '默认音色'}`;
        if (!keyOk) bad(`配音 ${id}/${lang}`, `${head}:密钥 ${keyName} 没设(写进 .env)`);
        else if (!cmdOk) bad(`配音 ${id}/${lang}`, `${head}:没有 edge-tts 命令:装 uv 即可(引擎自动用 uvx edge-tts,不用另装;别全局装)`);
        else if (!p.timestamps && !which('whisper-cli')) bad(`配音 ${id}/${lang}`, `${head}:这家不给时间戳,要 whisper-cli 对齐字幕,但没装`);
        else if (p.status !== 'tested') warn(`配音 ${id}/${lang}`, `${head};${notes}`);
        else ok(`配音 ${id}/${lang}`, `${head};${notes}${cmd ? `;命令:${cmd.join(' ')}${cmd[0] === 'uvx' ? '(自动临时装,不用另装)' : ''}` : ''}`);
      }
    }
  }

  // 8) 磁盘(渲染中间文件要几个 GB)
  const df = run('df', ['-k', PROJECT]);
  if (df) { const gb = +df.trim().split('\n').pop().split(/\s+/)[3] / 1024 / 1024; gb < 5 ? warn('磁盘', `剩 ${gb.toFixed(1)} GB,渲染前清一清(至少留 5 GB)`) : ok('磁盘', `剩 ${gb.toFixed(0)} GB`); }

  const dw = t => [...t].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);   // 中文按两格宽对齐
  const w = Math.max(...rows.map(r => dw(r[1])));
  for (const [s, k, m] of rows) console.log(`${s} ${k}${' '.repeat(w + 2 - dw(k))}${m}`);
  const nBad = rows.filter(r => r[0] === '❌').length, nWarn = rows.filter(r => r[0].startsWith('⚠')).length;
  console.log(`\n${nBad ? `❌ ${nBad} 项必须先解决` : '✅ 可以开工'}${nWarn ? `;⚠️  ${nWarn} 项提醒` : ''}`);
  return nBad ? 1 : 0;
}
