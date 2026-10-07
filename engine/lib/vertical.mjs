// 竖版(只在选了竖版平台时做):成片页 ?render&vert 的 vertFrame(t, 尾卡进度) —— 竖版专用镜头,按 1080×1920 重新排版,不缩放 / 裁切横版。
// 声音从主片混音(cache/render/mix.wav)按同样的时间段裁出拼接,加尾卡静音,整体对齐 -16 LUFS。
// 每期设定 <brief>/vertical.json:
//   { "segments": [ { "from": 0, "to": "p1s5", "after": 0.3 }, { "from": "p5s1", "before": 0.25, "to": "p5s7", "after": 0.3 } ],
//     "endCard": 2.5, "name": "douyin" }
//   from / to:数字 = 秒;句 id = 该句起点(减 before)/ 终点(加 after)。
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { episode, chromium, openPage } from './page.mjs';
const FPS = 30;

export async function vertical(o) {
  const E = episode(o), { OUT, TMP, suf, brief, ep } = E;
  const cfgFile = path.join(brief, `vertical${suf}.json`);
  if (!fs.existsSync(cfgFile)) throw new Error(`缺 ${cfgFile}(写清从主片截哪几段)`);
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  const tl = JSON.parse(fs.readFileSync(path.join(OUT, `timeline${suf}.json`), 'utf8'));
  const sent = id => { const s = tl.sentences.find(x => x.id === id); if (!s) throw new Error('vertical.json 里的句子不存在:' + id); return s; };
  const SEGS = cfg.segments.map(g => [typeof g.from === 'number' ? g.from : sent(g.from).start - (g.before || 0), typeof g.to === 'number' ? g.to : sent(g.to).end + (g.after || 0)]);
  const END_CARD = cfg.endCard ?? 2.5;
  const mixWav = path.join(TMP, `mix${suf}.wav`);
  if (!fs.existsSync(mixWav)) throw new Error('先跑 mix(缺 ' + mixWav + ')');
  const b = await (await chromium()).launch();
  const { p } = await openPage(b, E.url('vert'), { width: 1080, height: 1920 });
  const frames = SEGS.flatMap(([a, z]) => Array.from({ length: Math.round((z - a) * FPS) }, (_, i) => [a + i / FPS, 0]));
  const last = SEGS.at(-1)[1];
  for (let i = 0; i < END_CARD * FPS; i++) frames.push([last, (i + 1) / (END_CARD * FPS)]);
  const vid = path.join(TMP, `vert-v${suf}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), vid], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  for (let i = 0; i < frames.length; i++) {
    await p.evaluate(([t, e]) => window.vertFrame(t, e), frames[i]);
    const png = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${i}/${frames.length}`);
  }
  ff.stdin.end(); await closed; await b.close();
  const parts = SEGS.map(([a, z], i) => `[0:a]atrim=${a.toFixed(4)}:${(a + Math.round((z - a) * FPS) / FPS).toFixed(4)},asetpts=PTS-STARTPTS[a${i}];`).join('');
  const fc = `${parts}anullsrc=r=48000:cl=stereo,atrim=0:${END_CARD}[sil];${SEGS.map((_, i) => `[a${i}]`).join('')}[sil]concat=n=${SEGS.length + 1}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]`;
  const out = path.join(OUT, `${ep}-${cfg.name || 'vertical'}${suf}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mixWav, '-i', vid, '-filter_complex', fc, '-map', '1:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  fs.rmSync(vid);
  const n = +execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out]).toString().trim();
  if (n !== frames.length) throw new Error(`竖版帧数不符:期望 ${frames.length},实际 ${n}`);
  return { out, frames: n, seconds: +(frames.length / FPS).toFixed(1) };
}
