// 验收:每项把判据、原始输出写进 <out>/acceptance/<序号>-<名>.txt,汇总写 summary.md。有 FAIL ⇒ 退出码 1。
// 判据来源见 skill 的 acceptance.md。每个探针先证自己有效(阳性对照),否则它报的 0 不算数。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { PROJECT, ENGINE } from './paths.mjs';
import { loadVoice, readEnv, fill } from './config.mjs';
import { PROVIDERS } from './providers.mjs';
import { episode } from './page.mjs';
import { ebur } from './mix.mjs';
import { SR, pcmOfWav } from './audio.mjs';
import { loadSentences, stripPunct, units, clauses } from './script.mjs';
import { unitsFromWhisper, lcs } from './align.mjs';

const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();

export async function accept(o) {
  const E = episode(o), { OUT, suf, ep, lang, ch, brief } = E;
  const A = path.join(OUT, 'acceptance' + suf); fs.mkdirSync(A, { recursive: true });
  const rows = [];
  const item = (n, name, status, summary, raw) => { rows.push({ n, name, status, summary }); fs.writeFileSync(path.join(A, `${n}-${name}.txt`), `# ${name}:${status}\n# ${summary}\n\n${raw}\n`); };
  const mp4 = path.join(OUT, `${ep}${suf}.mp4`), narr = path.join(OUT, `narration${suf}.wav`), srt = path.join(OUT, `${ep}${suf}.srt`);
  const tl = JSON.parse(fs.readFileSync(path.join(OUT, `timeline${suf}.json`), 'utf8'));
  const scriptFile = [path.join(brief, `script.${lang}.txt`), path.join(brief, lang === 'en' ? 'script-en.txt' : 'script.txt')].find(f => fs.existsSync(f));

  // 1 密钥没有泄进产物与仓库(只报次数;阳性对照 = .env 里必须数到)
  {
    const env = readEnv(), v = loadVoice(ch.dir).voices[lang], name = v.keyEnv || PROVIDERS[v.provider].keyEnv, key = name && (env[name] || process.env[name]);
    if (!key) item(1, '密钥', 'INFO', `这个配音服务不用密钥,或密钥不在 .env(${name || '无'})`, '');
    else {
      const count = f => { try { const b = fs.readFileSync(f); let n = 0, i = -1; while ((i = b.indexOf(key, i + 1)) >= 0) n++; return n; } catch { return 0; } };
      const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
      const outHits = walk(OUT).reduce((s, f) => s + count(f), 0);
      let tracked = [], ignored = 'git 不可用';
      try { tracked = execFileSync('git', ['-C', PROJECT, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean).map(f => path.join(PROJECT, f)); ignored = spawnSync('git', ['-C', PROJECT, 'check-ignore', '-q', '.env']).status === 0 ? '是' : '否'; } catch {}
      const repoHits = tracked.reduce((s, f) => s + count(f), 0), ctl = count(path.join(PROJECT, '.env')) + (process.env[name] === key ? 1 : 0);
      const ok = ctl > 0 && outHits === 0 && repoHits === 0 && ignored !== '否';
      item(1, '密钥', ctl === 0 ? 'BROKEN' : ok ? 'PASS' : 'FAIL', `产物里 ${outHits} 次、git 跟踪文件里 ${repoHits} 次;.env 被 git 忽略:${ignored}`, `密钥变量 ${name},长度 ${key.length}(不打印值)\n阳性对照:同一计数器在 .env / 环境变量里数到 ${ctl} 次(应 ≥ 1)\n产物目录 ${OUT}:${outHits}\ngit 跟踪的 ${tracked.length} 个文件:${repoHits}`);
    }
  }
  // 2 成片时长与配音一致
  if (fs.existsSync(mp4)) { const a = dur(mp4), b = dur(narr), d = Math.abs(a - b); item(2, '时长', d <= 0.3 ? 'PASS' : 'FAIL', `成片 ${a.toFixed(3)}s,配音 ${b.toFixed(3)}s,差 ${d.toFixed(3)}s(上限 0.3)`, execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,duration', '-of', 'default', mp4]).toString()); }
  else item(2, '时长', 'FAIL', '没有成片 ' + mp4, '');
  // 3 响度 -16 LUFS ±1,真峰值 ≤ -1 dBTP
  if (fs.existsSync(mp4)) { const s = ebur(mp4), I = +(s.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1], P = +(s.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1]; item(3, '响度', Math.abs(I + 16) <= 1 && P <= -1 ? 'PASS' : 'FAIL', `积分响度 ${I} LUFS(目标 -16 ±1),真峰值 ${P} dBTP(≤ -1)`, s); }
  // 4 字幕与稿子逐句一致(中文:按本期转换表反转回中文、去标点后比对)
  {
    const cues = fs.readFileSync(srt, 'utf8').trim().split(/\n\n+/).map(b => b.split('\n').slice(2).join(' '));
    const sents = loadSentences(scriptFile, lang);
    let back;
    if (lang === 'zh') {
      const cfgF = path.join(brief, `subtitles${suf}.json`), conv = fs.existsSync(cfgF) ? JSON.parse(fs.readFileSync(cfgF, 'utf8')).conversions || [] : [];
      const rev = conv.map(([k, v]) => [v.replace(/\s+/g, ''), k]).sort((a, b) => b[0].length - a[0].length);
      back = s => { s = s.replace(/\s+/g, ''); let out = '', i = 0; while (i < s.length) { const h = rev.find(([k]) => s.startsWith(k, i)); if (h) { out += h[1]; i += h[0].length; } else out += s[i++]; } return stripPunct(out); };
    } else back = s => units(s.replace(/[“”]/g, '"').replace(/’/g, "'"), 'en').join(' ');
    const whole = back(cues.join(lang === 'zh' ? '' : ' ')), script = lang === 'zh' ? stripPunct(sents.map(s => s.text).join('')) : units(sents.map(s => s.text).join(' '), 'en').join(' ');
    let i = 0; while (i < whole.length && whole[i] === script[i]) i++;
    item(4, '字幕一致', whole === script ? 'PASS' : 'FAIL', whole === script ? `${cues.length} 条字幕拼回去与稿子逐字一致` : `第 ${i} 字处不一致:稿「${script.slice(i, i + 15)}」 幕「${whole.slice(i, i + 15)}」`, `字幕 ${whole.length} 单位,稿子 ${script.length} 单位`);
  }
  // 5 字幕时长与阅读速度(Netflix:每条 ≥ 5/6s、≤ 7s、≤ 9 字/s)
  { const r = spawnSync('python3', [path.join(ENGINE, 'tools/check_sub_timing.py'), srt], { encoding: 'utf8' }); item(5, '字幕时长', r.status === 0 ? 'PASS' : 'FAIL', (r.stdout.trim().split('\n').pop() || r.stderr.trim()), r.stdout + r.stderr); }
  // 6 字体:渲染时每个页面的字体都加载上了
  {
    const logs = [`render-log${suf}.json`, `cover-log${suf}.json`].map(f => path.join(OUT, f)).filter(f => fs.existsSync(f));
    const { fontsOk, staleFontChars } = await import('./page.mjs');
    const stale = await staleFontChars(o);
    const fonts = logs.flatMap(f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return (j.fonts || j.map(c => c.fonts)).map(x => ({ f: path.basename(f), ok: fontsOk(x), x })); });
    const okAll = fonts.length && fonts.every(x => x.ok) && !stale?.length;
    item(6, '字体', okAll ? 'PASS' : 'FAIL', (fonts.length ? `${fonts.length} 个页面,${fonts.filter(x => !x.ok).length} 个没加载全` : '没有 render-log / cover-log') + (stale == null ? ';没有 fonts 记录(没用引擎切字体)' : stale.length ? `;页面多了 ${stale.length} 个没切进子集的字,重跑 fonts` : ';子集覆盖页面全部的字'), fonts.map(x => `${x.f} ${x.ok ? 'ok' : 'MISSING'} ${JSON.stringify(x.x)}`).join('\n') + (stale?.length ? `\n子集里缺:${stale.join('')}` : ''));
  }
  // 7 空帧:每 2 秒抽一帧,缩成 64×36 灰度算方差,列最低 5 帧(给人看,不自动判)
  if (fs.existsSync(mp4)) {
    const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', mp4, '-vf', 'fps=1/2,scale=64:36,format=gray', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 30 });
    const n = raw.length / (64 * 36), vs = [];
    for (let k = 0; k < n; k++) { const f = raw.subarray(k * 2304, (k + 1) * 2304); const m = f.reduce((a, x) => a + x, 0) / 2304; vs.push({ t: k * 2, v: +(f.reduce((a, x) => a + (x - m) ** 2, 0) / 2304).toFixed(1) }); }
    vs.sort((a, b) => a.v - b.v);
    item(7, '空帧', vs[0].v < 1 ? 'LOOK' : 'INFO', `抽 ${n} 帧,方差最低 t=${vs[0].t}s(${vs[0].v});方差 < 1 = 几乎纯色,要人看一眼`, vs.slice(0, 5).map(x => `t=${x.t}s variance=${x.v}`).join('\n'));
  }
  // 8 漏读:whisper 独立听写整条配音,逐分句比对(命中 < 50% = 疑似漏读);接口起点与听写起点差 > 0.8s = 漂移(只报)
  {
    // 按段听写(整条几分钟一次听写,whisper 的时间戳会越往后漂越远,2026-10-08 实测一部 4.5 分钟的片子漂到 2s)
    const pcm = pcmOfWav(fs.readFileSync(narr));
    const heard = tl.paragraphs.flatMap(p => { const a = Math.max(0, p.start - 0.3), b = p.end + 0.3; return unitsFromWhisper(pcm.subarray(Math.round(a * SR) * 2, Math.round(b * SR) * 2), lang, a); });
    const parts = tl.sentences.flatMap(s => s.parts.map((p, i) => ({ label: `${s.id}.${i}`, text: p.text, api: p.start })));
    const target = [], owner = [];
    parts.forEach((p, pi) => units(p.text, lang).forEach(u => { target.push(u); owner.push(pi); }));
    const map = lcs(target, heard.map(h => h.u));
    const rows8 = parts.map((p, pi) => { const idx = owner.map((o, i) => o === pi ? i : -1).filter(i => i >= 0), hit = idx.filter(i => map[i] >= 0); return { ...p, n: idx.length, hit: hit.length, asr: hit.length ? heard[map[hit[0]]].a : null }; });
    // 人听过、确认念了的(同音字被听错之类)登记在 <brief>/accept.json 的 heardOk:{"p12s6.1": "原因"};它们只记录,不判失败
    const accF = path.join(brief, `accept${suf}.json`), heardOk = fs.existsSync(accF) ? JSON.parse(fs.readFileSync(accF, 'utf8')).heardOk || {} : {};
    const miss0 = rows8.filter(r => r.n && r.hit / r.n < 0.5), miss = miss0.filter(r => !heardOk[r.label]), known = miss0.filter(r => heardOk[r.label]), drift = rows8.filter(r => r.asr != null && Math.abs(r.api - r.asr) > 0.8);
    const total = map.filter(j => j >= 0).length;
    item(8, '漏读', miss.length ? 'FAIL' : 'PASS', `听写对上 ${total}/${target.length};疑似漏读 ${miss.length} 处${known.length ? `(另有 ${known.length} 处人已确认,见 accept.json)` : ''},漂移 ${drift.length} 处(只记录)`, [...miss.map(r => `MISSING ${r.label} ${r.hit}/${r.n}「${r.text}」(人听一遍:确认念了就登记进 accept.json 的 heardOk)`), ...known.map(r => `已确认 ${r.label}「${r.text}」:${heardOk[r.label]}`), ...drift.map(r => `DRIFT ${r.label} 接口 ${r.api.toFixed(2)} 听写 ${r.asr.toFixed(2)}「${r.text}」`)].join('\n'));
  }
  // 9 出声:每段首句的起点应紧跟静音之后出声(接口时间戳 < 0.1s;whisper 对齐 < 0.3s)
  {
    const pcm = pcmOfWav(fs.readFileSync(narr)), win = Math.round(SR * 0.01);
    const onset = (t0, t1) => { for (let i = Math.max(0, Math.round(t0 * SR)); i < Math.round(t1 * SR); i += win) { let e = 0; for (let k = i; k < i + win; k++) { const x = pcm.readInt16LE(k * 2); e += x * x; } if (Math.sqrt(e / win) > 500) return i / SR; } return null; };
    const lim = tl.method === 'api-timestamps' ? 0.1 : 0.3;
    const lines = tl.paragraphs.map(p => { const s = tl.sentences.find(x => x.para === p.para), on = onset(p.start - 0.5, p.start + 3); return { p: p.para, s: s.start, on, d: on == null ? Infinity : s.start - on }; });
    const worst = Math.max(...lines.map(l => Math.abs(l.d)));
    item(9, '出声', worst < lim ? 'PASS' : 'FAIL', `每段首句起点与音频出声时刻最大差 ${worst.toFixed(3)}s(上限 ${lim})`, lines.map(l => `第 ${l.p} 段 起点 ${l.s.toFixed(3)} 出声 ${l.on?.toFixed(3)} 差 ${l.d.toFixed(3)}`).join('\n'));
  }
  // 10 竖版 / 封面文字不出画、不叠字
  {
    const chk = path.join(ENGINE, 'tools/check-text-bounds.mjs'), rel = path.relative(PROJECT, E.page), outs = [];
    // 竖版与竖封面必须过;横版封面只给人看(acceptance.md:竖版成片、竖封面必跑)
    const run = (q, w, h, ts = []) => { const r = spawnSync('node', [chk, `${rel}?render${suf ? '&lang=' + lang : ''}&${q}`, w, h, ...ts], { cwd: PROJECT, encoding: 'utf8' }); outs.push({ q, ok: r.status === 0, must: +h > +w, text: r.stdout + r.stderr }); };
    for (const f of fs.readdirSync(OUT).filter(f => /^cover-(\w+)-(\w+)\.png$/.test(f))) { const [, size, v] = f.match(/^cover-(\w+)-(\w+)\.png$/); const [w, h] = { '16x9': [1920, 1080], '3x4': [1080, 1440], '9x16': [1080, 1920], '1x1': [1080, 1080], '4x3': [1440, 1080] }[size] || []; if (w) run(`cover=${size}-${v}`, w, h); }
    const vcfg = path.join(brief, `vertical${suf}.json`);
    if (fs.existsSync(vcfg)) { const ts = []; for (let t = 0; t < tl.duration; t += 5) ts.push(t.toFixed(1)); run('vert', 1080, 1920, ts); }
    const st = !outs.length ? 'INFO' : outs.some(x => x.must && !x.ok) ? 'FAIL' : outs.some(x => !x.ok) ? 'LOOK' : 'PASS';
    item(10, '文字出画', st, outs.length ? outs.map(x => `${x.q}:${x.ok ? '合格' : x.must ? '不合格' : '贴边,看一眼'}`).join(';') : '没有封面和竖版', outs.map(x => `## ${x.q}\n${x.text}`).join('\n'));
  }
  // 11 网址:稿子、字幕、发布文案里不出现网址(多个平台会限流)
  {
    const files = [scriptFile, srt, path.join(OUT, 'publish.md')].filter(f => f && fs.existsSync(f));
    const re = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|io|ai|cn|gov|edu)\b)/ig, banned = ch.bannedWords || [];
    const hits = files.flatMap(f => fs.readFileSync(f, 'utf8').split('\n').flatMap((l, i) => [...(l.match(re) || []), ...banned.filter(w => l.includes(w))].map(m => `${path.basename(f)}:${i + 1} ${m}`)));
    const ctl = re.test('x https://a.com y') ? 1 : 0; re.lastIndex = 0;
    item(11, '网址', ctl !== 1 ? 'BROKEN' : hits.length ? 'FAIL' : 'PASS', `${files.length} 个文件,命中 ${hits.length} 处${banned.length ? `(含频道禁用词 ${banned.length} 个)` : ''}`, `阳性对照:「x https://a.com y」${ctl ? '命中' : '没命中(探针失效)'}\n` + hits.join('\n'));
  }
  rows.sort((a, b) => a.n - b.n);
  fs.writeFileSync(path.join(A, 'summary.md'), `# ${ep}${suf} 验收\n\n| # | 项 | 结果 | 摘要 |\n|---|---|---|---|\n` + rows.map(r => `| ${r.n} | ${r.name} | ${r.status} | ${r.summary.replace(/\|/g, '/')} |`).join('\n') + '\n\nPASS = 过;FAIL = 不过;LOOK = 要人看一眼;INFO = 只记录;BROKEN = 探针自己失效,结果不算数。\n');
  return rows;
}
