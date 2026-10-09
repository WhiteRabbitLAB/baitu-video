// 汉字 → 无声调拼音,给「漏读」比对用:语音识别常把同音字写错(麦加→卖家、稀硫酸→西柳酸),按字比会误报漏读。
// 用 Python 的 pypinyin:项目 venv / 系统 python3 里有就用;没有就用 uv 临时装;都不行返回 null(调用方退回按字比对,并在报告里写明)。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CACHE } from './paths.mjs';

const CODE = 'import sys,json\nfrom pypinyin import lazy_pinyin\nchars=json.load(sys.stdin)\nprint(json.dumps(lazy_pinyin(chars)))';
let runner;
function find() {
  if (runner !== undefined) return runner;
  const venv = path.join(CACHE, 'venv-fonts/bin/python');
  const cands = [...(fs.existsSync(venv) ? [[venv]] : []), ['python3'], ['uv', 'run', '-q', '--with', 'pypinyin', 'python']];
  runner = cands.find(c => spawnSync(c[0], [...c.slice(1), '-c', 'import pypinyin'], { stdio: 'ignore' }).status === 0) || null;
  return runner;
}

// chars:单字数组;返回同长的拼音数组(非汉字原样返回),没有 pypinyin 时返回 null
export function pinyinOf(chars) {
  const c = find(); if (!c) return null;
  const r = spawnSync(c[0], [...c.slice(1), '-c', CODE], { input: JSON.stringify(chars), encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) return null;
  const out = JSON.parse(r.stdout);
  return out.length === chars.length ? out : null;
}
