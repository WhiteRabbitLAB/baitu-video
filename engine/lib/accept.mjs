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
import { pinyinOf } from './pinyin.mjs';

// 出声时刻:在 [t0, t1) 里找「先有 ≥0.1s 静音、随后第一次响起」的位置(10ms 一窗,RMS > 500 算响)。
// 只找第一个响窗会误判:窗口开头还带着上一段的尾音时,它直接返回窗口起点(矩阵实测两期固定报 0.500s,即 t0 本身)。
export function onsetOf(pcm, t0, t1, quietNeed = 10) {
  const win = Math.round(SR * 0.01), n = pcm.length / 2;
  let quiet = t0 <= 0 ? quietNeed : 0;   // 文件开头本身算静音
  for (let i = Math.max(0, Math.round(t0 * SR)); i + win <= Math.min(n, Math.round(t1 * SR)); i += win) {
    let e = 0; for (let k = i; k < i + win; k++) { const x = pcm.readInt16LE(k * 2); e += x * x; }
    if (Math.sqrt(e / win) > 500) { if (quiet >= quietNeed) return i / SR; quiet = 0; } else quiet++;
  }
  return null;
}

// 事实表解析:markdown 里每一张表单独看,表头同时有「出处 / source」和「状态 / status」两列的才算事实表
export function checkFacts(text) {
  const blocks = []; let cur = null;
  for (const l of text.split('\n')) { if (/^\s*\|/.test(l)) { if (!cur) blocks.push(cur = []); cur.push(l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); } else cur = null; }
  const body = [], todo = [], cut = [], nosrc = []; let tables = 0;
  for (const b of blocks) {
    const H = b[0], si = H.findIndex(c => /出处|source/i.test(c)), ti = H.findIndex(c => /状态|status/i.test(c));
    if (si < 0 || ti < 0) continue; tables++;
    const noteCols = H.map((c, i) => /出处|source|状态|status|备注|note/i.test(c) ? i : -1).filter(i => i >= 0);   // 「说法」列本身可能带「不说」二字,不看它;出处列(常兼作备注)只认开头写「不说 / 不进稿」,免得来源标题里带这两个字被当成已删
    for (const r of b.slice(1)) {
      if (r.every(c => /^:?-+:?$/.test(c)) || !r.some(Boolean)) continue;
      body.push(r);
      const st = (r[ti] || '').trim(), neg = /(未|不|没|not\s*)(删|cut|drop)/i;
      if ((/^(不说|不进稿|已删|删|cut|drop|leave out)/i.test(st) && !neg.test(st)) || noteCols.some(i => i === si ? /^(不说|不进稿|not in the script)/i.test(r[i] || '') : /(^|[^未不没])(不说|不进稿)|not in the script/i.test(r[i] || ''))) { cut.push(r); continue; }
      if (/待核|未核|unverified|to verify|todo/i.test(st)) todo.push(r);
      if (!r[si] || /^(—|-|无|none|n\/a|待补|换成真实出处|replace with a real source)$/i.test(r[si])) nosrc.push(r);
    }
  }
  return { tables, body, todo, cut, nosrc, ok: tables > 0 && body.length > 0 && !nosrc.length };
}

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
    // 中文按「比对键」比:数字(阿拉伯 / 中文数字)一律记作 #,汉字换成无声调拼音。
    // 2026-10-09 模型矩阵实测(45 条片子 13 条报漏读):误报几乎全是「1747 ↔ 一七四七」和同音字(麦加→卖家、稀硫酸→西柳酸),不是真漏读。
    let keyOf = u => u, how = '按字比对';
    if (lang === 'zh') {
      const NUM = /^[0-9０-９〇零一二三四五六七八九十百千万两]$/, uniq = [...new Set([...target, ...heard.map(h => h.u), '麦', '卖'])], py = pinyinOf(uniq);
      if (py) { const m = new Map(uniq.map((c, i) => [c, py[i]])); if (m.get('麦') !== m.get('卖')) how = 'BROKEN'; else { keyOf = u => NUM.test(u) ? '#' : m.get(u) || u; how = '按拼音比对(同音字算对上),数字记作同一类'; } }
      else keyOf = u => /^[0-9０-９〇零一二三四五六七八九十百千万两]$/.test(u) ? '#' : u, how = '按字比对(没有 pypinyin,也没有 uv;同音字会误报),数字记作同一类';
    }
    // 连续的数字只留第一个当「一个数」(100000 ↔ 十万 长度不同);后面的跟着第一个算命中
    const squeeze = (keys, own) => { const idx = []; keys.forEach((k, i) => { if (!(k === '#' && i > 0 && keys[i - 1] === '#' && (!own || own[i] === own[i - 1]))) idx.push(i); }); return idx; };   // 不跨分句合并
    const tk = target.map(keyOf), hk = heard.map(h => keyOf(h.u)), ti8 = squeeze(tk, owner), hi8 = squeeze(hk);
    const m2 = lcs(ti8.map(i => tk[i]), hi8.map(j => hk[j])), map = new Array(target.length).fill(-1);
    ti8.forEach((i, n) => { map[i] = m2[n] >= 0 ? hi8[m2[n]] : -1; });
    for (let i = 1; i < map.length; i++) if (tk[i] === '#' && tk[i - 1] === '#' && owner[i] === owner[i - 1]) map[i] = map[i - 1];
    const rows8 = parts.map((p, pi) => { const idx = owner.map((o, i) => o === pi ? i : -1).filter(i => i >= 0), hit = idx.filter(i => map[i] >= 0); return { ...p, n: idx.length, hit: hit.length, asr: hit.length ? heard[map[hit[0]]].a : null }; });
    // 人听过、确认念了的(同音字被听错之类)登记在 <brief>/accept.json 的 heardOk:{"p12s6.1": "原因"};它们只记录,不判失败
    const accF = path.join(brief, `accept${suf}.json`), heardOk = fs.existsSync(accF) ? JSON.parse(fs.readFileSync(accF, 'utf8')).heardOk || {} : {};
    const miss0 = rows8.filter(r => r.n && r.hit / r.n < 0.5), miss = miss0.filter(r => !heardOk[r.label]), known = miss0.filter(r => heardOk[r.label]), drift = rows8.filter(r => r.asr != null && Math.abs(r.api - r.asr) > 0.8);
    const total = map.filter(j => j >= 0).length;
    item(8, '漏读', how === 'BROKEN' ? 'BROKEN' : miss.length ? 'FAIL' : 'PASS', how === 'BROKEN' ? '拼音探针自检失败(「麦」「卖」没转成同一个拼音),结果不算数' : `听写对上 ${total}/${target.length};疑似漏读 ${miss.length} 处${known.length ? `(另有 ${known.length} 处人已确认,见 accept.json)` : ''},漂移 ${drift.length} 处(只记录);${how}`, [`比对方式:${how}`,...miss.map(r => `MISSING ${r.label} ${r.hit}/${r.n}「${r.text}」(人听一遍:确认念了就登记进 accept.json 的 heardOk)`), ...known.map(r => `已确认 ${r.label}「${r.text}」:${heardOk[r.label]}`), ...drift.map(r => `DRIFT ${r.label} 接口 ${r.api.toFixed(2)} 听写 ${r.asr.toFixed(2)}「${r.text}」`)].join('\n'));
  }
  // 9 出声:每段首句的起点应紧跟静音之后出声(接口时间戳 < 0.1s;whisper 对齐 < 0.3s)
  {
    const pcm = pcmOfWav(fs.readFileSync(narr));
    const onset = (t0, t1) => onsetOf(pcm, t0, t1);
    const lim = tl.method === 'api-timestamps' ? 0.1 : 0.3;
    const lines = tl.paragraphs.map(p => { const s = tl.sentences.find(x => x.para === p.para), on = onset(p.start - 0.5, p.start + 3); return { p: p.para, s: s.start, on, d: on == null ? Infinity : s.start - on }; });
    const worst = Math.max(...lines.map(l => Math.abs(l.d)));
    item(9, '出声', worst < lim ? 'PASS' : 'FAIL', `每段首句起点与音频出声时刻最大差 ${worst.toFixed(3)}s(上限 ${lim})`, lines.map(l => `第 ${l.p} 段 起点 ${l.s.toFixed(3)} 出声 ${l.on?.toFixed(3)} 差 ${l.d.toFixed(3)}`).join('\n'));
  }
  // 10 竖版 / 封面 / 正片(页面声明 window.CHECK 时)文字不出画、不叠字、不和素材互压
  {
    const chk = path.join(ENGINE, 'tools/check-text-bounds.mjs'), rel = path.relative(PROJECT, E.page), outs = [];
    // 竖版与竖封面必须过;横版封面只给人看(acceptance.md:竖版成片、竖封面必跑)
    const run = (q, w, h, ts = []) => { const main = q === ''; const r = spawnSync('node', [chk, `${rel}?render${suf ? '&lang=' + lang : ''}${q ? '&' + q : ''}`, w, h, ...ts], { cwd: PROJECT, encoding: 'utf8', maxBuffer: 64 << 20 }); outs.push({ q: main ? '正片逐帧' : q, ok: r.status === 0, must: main || +h > +w, text: r.stdout + r.stderr }); };
    for (const f of fs.readdirSync(OUT).filter(f => /^cover-(\w+)-(\w+)\.png$/.test(f))) { const [, size, v] = f.match(/^cover-(\w+)-(\w+)\.png$/); const [w, h] = { '16x9': [1920, 1080], '3x4': [1080, 1440], '9x16': [1080, 1920], '1x1': [1080, 1080], '4x3': [1440, 1080] }[size] || []; if (w) run(`cover=${size}-${v}`, w, h); }
    // 正片:页面声明了 window.CHECK(画面框等),就逐 0.1 秒扫整片的出画 / 叠字 / 字和素材互压(第 11 期起;owner 2026-10-09:压字的低级问题不许反复出现)
    if (/window\.CHECK\s*=/.test(fs.readFileSync(E.page, 'utf8'))) run('', 1920, 1080, ['--scan', `0-${(tl.duration - .05).toFixed(2)}:0.1`]);
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
  // 12 画面占比:画面里有东西的地方太少(只提醒人看,不判失败)。阈值按 2026-10-09 的 45 条矩阵成片校准:空的片子中位数 6–25%,好的 33–98%(白板本来就留白多)
  if (fs.existsSync(mp4)) {
    const r = spawnSync('node', [path.join(ENGINE, 'tools/check-fill.mjs'), mp4, '--json'], { encoding: 'utf8' });
    if (r.status !== 0) item(12, '画面占比', 'BROKEN', (r.stderr || '').trim().split('\n').pop(), r.stdout + r.stderr);
    else { const j = JSON.parse(r.stdout), look = j.median < .25 || j.lowShare >= .4;
      item(12, '画面占比', look ? 'LOOK' : 'PASS', `占比中位数 ${Math.round(j.median * 100)}%,占比 < 20% 的帧 ${Math.round(j.lowShare * 100)}%${look ? ';画面偏空,对照 principles.md「构图」看一眼' : ''}`, `阳性对照(半黑半白)测出 ${j.control}\n最空的帧:\n` + j.lowest.map(x => `t=${x.t}s ${Math.round(x.f * 100)}%`).join('\n')); }
  }
  // 13 画面复述字幕:画面上的字把正在念的那句原样再写一遍(只提醒)
  {
    const rel = path.relative(PROJECT, E.page), r = spawnSync('node', [path.join(ENGINE, 'tools/check-echo.mjs'), `${rel}?render${suf ? '&lang=' + lang : ''}`, String(tl.duration), '--lang', lang, '--json'], { cwd: PROJECT, encoding: 'utf8', maxBuffer: 64 << 20 });
    let j = null; try { j = JSON.parse(r.stdout.trim().split('\n').pop()); } catch {}
    if (!j || j.broken || r.status !== 0) item(13, '画面复述', 'BROKEN', !j ? '检查没跑起来' : j.broken ? `探针读不到字幕(${j.control}),结果不算数` : `检查进程报错退出(${r.status}),多半是页面报错(PAGEERROR),结果不算数`, r.stdout + r.stderr);
    else item(13, '画面复述', j.hits >= j.seconds * .1 && j.hits > 0 ? 'LOOK' : 'PASS', `${j.seconds} 秒有字幕,${j.hits} 秒画面在原样抄字幕(连续 ≥ ${lang === 'en' ? '7 个词' : '10 字'})${j.hits >= j.seconds * .1 && j.hits > 0 ? ';画面该画旁白说不清的东西,别再写一遍字幕' : ''}`, `阳性对照:${j.control}\n` + j.examples.map(h => `t=${h.t}s 画面「${h.echo}」 ← 字幕「${h.cue}」`).join('\n'));
  }
  // 14 事实表:必须有;除「不说」外每条有出处(FAIL);还有「待核」⇒ LOOK:事实表里常留着没用上的线索(第 10、11 期各一条),是否进了稿得人对一眼。位置默认 <brief>/facts.md,频道可在 explainer.json 的 paths.facts 改
  {
    const ff = ch.paths?.facts ? path.join(PROJECT, fill(ch.paths.facts, ep)) : path.join(brief, 'facts.md');
    if (!fs.existsSync(ff)) item(14, '事实表', 'FAIL', `没有事实表 ${path.relative(PROJECT, ff)}(pipeline.md 第 1 步;new 会建模板)`, '');
    else { const f = checkFacts(fs.readFileSync(ff, 'utf8'));
      if (!f.tables) item(14, '事实表', 'FAIL', `${path.relative(PROJECT, ff)} 里没找到带「出处」「状态」两列的表格`, '');
      else item(14, '事实表', !f.ok ? 'FAIL' : f.todo.length ? 'LOOK' : 'PASS', `${f.body.length} 条(${f.tables} 张表);待核 ${f.todo.length} 条,缺出处 ${f.nosrc.length} 条,标「不说」${f.cut.length} 条${f.todo.length ? ';待核的逐条确认没进稿(进了稿就去查实)' : ''}`, [`文件:${path.relative(PROJECT, ff)}`, ...f.todo.map(r => `待核:${r.join(' | ')}`), ...f.nosrc.map(r => `缺出处:${r.join(' | ')}`)].join('\n')); }
  }
  rows.sort((a, b) => a.n - b.n);
  fs.writeFileSync(path.join(A, 'summary.md'), `# ${ep}${suf} 验收\n\n| # | 项 | 结果 | 摘要 |\n|---|---|---|---|\n` + rows.map(r => `| ${r.n} | ${r.name} | ${r.status} | ${r.summary.replace(/\|/g, '/')} |`).join('\n') + '\n\nPASS = 过;FAIL = 不过;LOOK = 要人看一眼;INFO = 只记录;BROKEN = 探针自己失效,结果不算数。\n');
  return rows;
}
