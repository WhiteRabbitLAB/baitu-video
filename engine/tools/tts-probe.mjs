// 配音服务探针:接新服务 / 换中转 / 换音色前先跑一次(最便宜的一句话)。
//   node .claude/skills/baitu-video/engine/tools/tts-probe.mjs '{"provider":"minimax","voice":"male-qn-qingse"}' [zh|en]
// 报:时长、接口给没给时间戳、whisper 听写回来的字和原文对上多少。只打印布尔与数字,不打印密钥。
import { synthesize } from '../lib/tts/index.mjs';
import { unitsFromWhisper, lcs } from '../lib/align.mjs';
import { units } from '../lib/script.mjs';
import { SR } from '../lib/audio.mjs';
const v = JSON.parse(process.argv[2]), lang = process.argv[3] || 'zh';
const TEXT = { zh: '一九二八年,两个人走进纽约的一家医院,只吃肉过了一整年。', en: 'In nineteen twenty-eight, two men checked into a New York hospital and ate nothing but meat for a year.' }[lang];
const t0 = Date.now();
const { pcm, tokens } = await synthesize(TEXT, v, {});
const target = units(TEXT, lang), heard = unitsFromWhisper(pcm, lang, 0);
const hit = lcs(target, heard.map(h => h.u)).filter(j => j >= 0).length;
console.log(JSON.stringify({ provider: v.provider, voice: v.voice, seconds: +(pcm.length / 2 / SR).toFixed(2), apiTimestamps: !!tokens?.length, whisperMatch: `${hit}/${target.length}`, ms: Date.now() - t0 }));
process.exitCode = hit / target.length >= 0.8 ? 0 : 1;
