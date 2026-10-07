// 混音 + 合成成片
//  配音:两遍 loudnorm 到 -16 LUFS(TP -1.5);音效:积分响度对齐到「配音 − 8 LU」= -24 LUFS
//  背景音乐:<brief>/bgm.mp3 存在才加(-24dB,人声出现时 sidechaincompress 压低);不存在就不加
//  总线:amix(不自动归一)→ 再两遍 loudnorm 到 -16 LUFS → 48kHz 立体声;AAC 进 mp4
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { episode } from './page.mjs';

const ff = args => execFileSync('ffmpeg', ['-hide_banner', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
const ffErr = args => { const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 64 << 20 }); if (r.status !== 0) throw new Error(r.stderr.slice(-800)); return r.stderr; };
const lastJson = r => JSON.parse(r.slice(r.lastIndexOf('{'), r.lastIndexOf('}') + 1));
const loudnormJson = (file, target) => lastJson(ffErr(['-hide_banner', '-i', file, '-af', `loudnorm=I=${target}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']));
function norm2(inFile, outFile, target, extra = []) {
  const m = loudnormJson(inFile, target);
  const af = `loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
  return { pass1: m, pass2: lastJson(ffErr(['-hide_banner', '-y', '-i', inFile, '-af', af, '-ar', '48000', ...extra, outFile])) };
}
export const ebur = file => { const r = ffErr(['-hide_banner', '-nostats', '-i', file, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']); return r.slice(r.lastIndexOf('Summary:')); };

export function mix(o) {
  const { OUT, TMP, suf, brief, ep } = episode(o);
  const video = path.join(TMP, `video${suf}.mp4`);
  if (!fs.existsSync(video)) throw new Error('先跑 render(缺 ' + video + ')');
  const rep = {};
  rep.narration = norm2(path.join(OUT, `narration${suf}.wav`), path.join(TMP, 'narr16.wav'), -16);
  const inputs = ['-i', path.join(TMP, 'narr16.wav')], mixIn = ['[0:a]'];
  const sfx = path.join(OUT, `sfx${suf}.wav`);
  if (fs.existsSync(sfx)) {
    const m = loudnormJson(sfx, -24), gain = -24 - +m.input_i;
    ff(['-i', sfx, '-af', `volume=${gain.toFixed(2)}dB`, '-ar', '48000', path.join(TMP, 'sfx24.wav')]);
    rep.sfx = { measuredI: +m.input_i, appliedGainDb: +gain.toFixed(2), targetI: -24 };
    inputs.push('-i', path.join(TMP, 'sfx24.wav')); mixIn.push('[1:a]');
  } else rep.sfx = 'none';
  const bgm = path.join(brief, 'bgm.mp3');
  let filter;
  if (fs.existsSync(bgm)) {
    const bi = mixIn.length; inputs.push('-stream_loop', '-1', '-i', bgm);
    filter = `[0:a]asplit=2[v][sc];[${bi}:a]volume=-24dB,aresample=48000[b];[b][sc]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=400[bd];[v]${mixIn.slice(1).join('')}[bd]amix=inputs=${mixIn.length + 1}:normalize=0:duration=first[m]`;
    rep.bgm = 'present';
  } else { filter = `${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=first[m]`; rep.bgm = 'absent(没有 bgm.mp3,不加背景音乐)'; }
  ff([...inputs, '-filter_complex', filter, '-map', '[m]', '-ac', '2', '-ar', '48000', path.join(TMP, 'mix-pre.wav')]);
  rep.master = norm2(path.join(TMP, 'mix-pre.wav'), path.join(TMP, `mix${suf}.wav`), -16, ['-ac', '2']);
  const mp4 = path.join(OUT, `${ep}${suf}.mp4`);
  ff(['-i', video, '-i', path.join(TMP, `mix${suf}.wav`), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', mp4]);
  ff(['-i', path.join(TMP, `mix${suf}.wav`), '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', path.join(OUT, `${ep}${suf}-audio.m4a`)]);
  for (const f of ['narr16.wav', 'sfx24.wav', 'mix-pre.wav']) fs.rmSync(path.join(TMP, f), { force: true });
  rep.ebur128_final = ebur(mp4);
  fs.writeFileSync(path.join(OUT, `mix-log${suf}.json`), JSON.stringify(rep, null, 1));
  return { mp4, narrationOut: rep.narration.pass2.output_i, sfx: rep.sfx, bgm: rep.bgm, masterOut: rep.master.pass2.output_i };
}
