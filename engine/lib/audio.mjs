// 音频小工具:引擎内部统一用 24kHz、单声道、16 位 PCM。
import { execFileSync } from 'node:child_process';
export const SR = 24000;

export function wavFromPcm(pcm, sr = SR) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
// 只认引擎自己写的 44 字节头 WAV
export const pcmOfWav = buf => buf.subarray(44);

// 任意格式(mp3 / wav / 其他采样率的裸 PCM)→ 24k 单声道 s16 裸 PCM。raw = { rate } 表示输入是 s16le 裸 PCM。
export function toPcm(buf, raw = null) {
  const inArgs = raw ? ['-f', 's16le', '-ar', String(raw.rate), '-ac', String(raw.channels || 1)] : [];
  return execFileSync('ffmpeg', ['-loglevel', 'error', ...inArgs, '-i', 'pipe:0', '-ar', String(SR), '-ac', '1', '-f', 's16le', 'pipe:1'], { input: buf, maxBuffer: 1 << 30 });
}

// 变速不变调(服务本身不支持调语速时用)
export function atempo(pcm, tempo) {
  if (!tempo || tempo === 1) return pcm;
  const chain = []; let t = tempo;
  while (t > 2) { chain.push('atempo=2'); t /= 2; }
  while (t < 0.5) { chain.push('atempo=0.5'); t /= 0.5; }
  chain.push(`atempo=${t}`);
  return execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-af', chain.join(','), '-f', 's16le', 'pipe:1'], { input: pcm, maxBuffer: 1 << 30 });
}

// 剪首尾静音:10ms 窗 RMS、门限 -40 dBFS,两端各留 40ms(豆包实测底噪 RMS 约 -52 dBFS)
export function trimPcm(pcm, thrDb = -40, padSec = 0.04) {
  const n = pcm.length / 2, thr = 32768 * Math.pow(10, thrDb / 20), win = Math.round(SR * 0.01);
  const loud = i => { let e = 0, c = 0; for (let k = i; k < Math.min(n, i + win); k++) { const v = pcm.readInt16LE(k * 2); e += v * v; c++; } return c && Math.sqrt(e / c) > thr; };
  let a = 0; while (a < n && !loud(a)) a += win;
  let b = n; while (b > a && !loud(Math.max(0, b - win))) b -= win;
  const pad = Math.round(padSec * SR);
  a = Math.max(0, a - pad); b = Math.min(n, b + pad);
  return pcm.subarray(a * 2, b * 2);
}
