// edge-tts(免费,微软 Edge 朗读接口的命令行版)。通过 edge-tts 命令或 uvx edge-tts 调用。
// 不保证长期可用(非官方接口);不返回逐字时间戳 ⇒ whisper 对齐。voice 例:zh-CN-YunxiNeural、en-US-GuyNeural。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { toPcm } from '../audio.mjs';
export const nativeSpeed = true;
const has = c => { try { execFileSync('which', [c], { stdio: 'ignore' }); return true; } catch { return false; } };
export const command = () => has('edge-tts') ? ['edge-tts'] : has('uvx') ? ['uvx', 'edge-tts'] : null;
export async function synth(text, v) {
  const cmd = command();
  if (!cmd) throw new Error('没有 edge-tts:pip install edge-tts,或装 uv 后自动用 uvx edge-tts');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-')), f = path.join(dir, 'a.mp3');
  try {
    const rate = Math.round(((v.speed ?? 1) - 1) * 100);
    execFileSync(cmd[0], [...cmd.slice(1), '--voice', v.voice || 'zh-CN-YunxiNeural', `--rate=${rate >= 0 ? '+' : ''}${rate}%`, '--text', text, '--write-media', f], { stdio: ['ignore', 'ignore', 'pipe'] });
    return { pcm: toPcm(fs.readFileSync(f)) };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
