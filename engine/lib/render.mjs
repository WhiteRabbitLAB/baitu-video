// 导出画面:无头 Chromium 逐帧调用 render(t) 截图 → 每路直接管道进 ffmpeg 出分段 → 无损拼接。
// 同时(整片模式):按页面的 renderSfx 离线渲染音效 sfx.wav。不落 PNG 帧文件;帧序号由清单 + 各段 ffprobe 帧数双重核对。
// --ranges 0-5.6,19.2-34.4:只导出这几段(样片),配音按同样的段裁出,直接出 <out>/proto.mp4。
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { wavFromPcm } from './audio.mjs';
import { episode, chromium, openPage, staleFontChars } from './page.mjs';

const FPS = 30;
const ffprobeFrames = f => +execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f]).toString().trim();

export async function render(o) {
  const E = episode(o), { OUT, TMP, suf } = E;
  const stale = await staleFontChars(o);
  if (stale?.length) throw new Error(`页面或稿子加了 ${stale.length} 个字体子集里没有的字(${stale.slice(0, 12).join('')}…),它们会悄悄回退成别的字体。先重跑 fonts ${o.ep}`);
  const W = o.width || 1920, H = o.height || 1080, WORKERS = o.workers || 6;
  fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const tl = JSON.parse(fs.readFileSync(path.join(OUT, `timeline${suf}.json`), 'utf8'));
  const ranges = o.ranges ? o.ranges.split(',').map(r => r.split('-').map(Number)) : null;
  const TIMES = ranges ? ranges.flatMap(([a, b]) => Array.from({ length: Math.round((b - a) * FPS) }, (_, i) => a + i / FPS))
    : Array.from({ length: o.limit ?? Math.round(tl.duration * FPS) }, (_, i) => i / FPS);
  const N = TIMES.length;
  const log = { startedAt: new Date().toISOString(), workers: WORKERS, fps: FPS, size: [W, H], fonts: [] };
  const C = await chromium(), browsers = [];
  const open = async () => { const b = await C.launch(); browsers.push(b); const { p, fonts } = await openPage(b, E.url(), { width: W, height: H }); log.fonts.push(fonts); return p; };
  console.log(`总帧数 ${N}`);

  if (!ranges && !o.limit) {   // 音效
    const p = await open();
    if (await p.evaluate(() => typeof window.renderSfx === 'function')) {
      const r = await p.evaluate(() => window.renderSfx(48000));
      fs.writeFileSync(path.join(OUT, `sfx${suf}.wav`), wavFromPcm(Buffer.from(r.b64, 'base64'), r.sampleRate));
      log.sfx = { sampleRate: r.sampleRate, samples: r.samples, seconds: r.samples / r.sampleRate, peak: r.peak, cues: r.cues };
    } else log.sfx = 'none(页面没有 renderSfx)';
    await p.close();
  }

  const per = Math.ceil(N / WORKERS);
  const segs = Array.from({ length: WORKERS }, (_, k) => [k * per, Math.min(N, (k + 1) * per)]).filter(([a, b]) => a < b);
  const t0 = Date.now(); let done = 0;
  await Promise.all(segs.map(async ([a, b], k) => {
    const p = await open();
    const seg = path.join(TMP, `seg${k}.mp4`), man = [];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
    for (let i = a; i < b; i++) {
      await p.evaluate(t => window.render(t), TIMES[i]);
      const png = await p.screenshot({ type: 'png' });
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
      man.push(i);
      if (++done % 300 === 0) console.log(`${done}/${N} 帧  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await closed; await p.close();
    fs.writeFileSync(path.join(TMP, `seg${k}.frames.json`), JSON.stringify({ range: [a, b], frames: man }));
  }));
  await Promise.all(browsers.map(b => b.close()));
  log.renderSeconds = (Date.now() - t0) / 1000;

  const all = [], segCheck = [];
  segs.forEach((_, k) => {
    const m = JSON.parse(fs.readFileSync(path.join(TMP, `seg${k}.frames.json`), 'utf8'));
    all.push(...m.frames);
    const n = ffprobeFrames(path.join(TMP, `seg${k}.mp4`));
    segCheck.push({ seg: k, range: m.range, manifest: m.frames.length, encoded: n, ok: n === m.frames.length });
  });
  const sorted = [...all].sort((x, y) => x - y), dup = sorted.length - new Set(sorted).size;
  let firstMismatch = null; for (let i = 0; i < N; i++) if (sorted[i] !== i) { firstMismatch = i; break; }
  log.frameCheck = { expected: N, got: all.length, duplicates: dup, firstMismatch, contiguous: !dup && all.length === N && firstMismatch == null, segments: segCheck };
  const logFile = path.join(OUT, ranges ? `proto-log${suf}.json` : `render-log${suf}.json`);
  if (!log.frameCheck.contiguous || segCheck.some(s => !s.ok)) { fs.writeFileSync(logFile, JSON.stringify(log, null, 1)); throw new Error('帧序号核对失败,见 ' + logFile); }

  fs.writeFileSync(path.join(TMP, 'concat.txt'), segs.map((_, k) => `file 'seg${k}.mp4'`).join('\n'));
  const video = path.join(TMP, `video${suf}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(TMP, 'concat.txt'), '-c', 'copy', video]);
  segs.forEach((_, k) => { fs.rmSync(path.join(TMP, `seg${k}.mp4`)); fs.rmSync(path.join(TMP, `seg${k}.frames.json`)); });
  fs.rmSync(path.join(TMP, 'concat.txt'));
  fs.writeFileSync(logFile, JSON.stringify(log, null, 1));

  if (ranges) {   // 样片:配音按同样的段裁出拼上
    const parts = ranges.map(([a, b], i) => `[0:a]atrim=${a}:${(a + Math.round((b - a) * FPS) / FPS).toFixed(4)},asetpts=PTS-STARTPTS[a${i}];`).join('');
    const out = path.join(OUT, `proto${suf}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(OUT, `narration${suf}.wav`), '-i', video, '-filter_complex', `${parts}${ranges.map((_, i) => `[a${i}]`).join('')}concat=n=${ranges.length}:v=0:a=1[a]`,
      '-map', '1:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
    fs.rmSync(video);
    return { proto: out, frames: N, seconds: log.renderSeconds };
  }
  return { video, frames: N, seconds: log.renderSeconds, sfx: log.sfx?.seconds ?? log.sfx };
}
