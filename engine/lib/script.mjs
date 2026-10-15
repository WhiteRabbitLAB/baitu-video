// 稿子切句(单一驻地):配音、时间轴、字幕都从这里取句子。段 = 空行分隔。
//   中文:在 。?;(全/半角)处切,另在 :(全/半角)与 —— 处切。
//   英文:在 . ? ! 后(可带右引号)、下一句以大写 / 数字 / 引号开头处切。
import fs from 'node:fs';

const END_ZH = /([。？?；;：:]|——)/;
export function splitZh(p) {
  const out = []; let buf = '';
  for (const part of p.split(END_ZH)) {
    if (!part) continue;
    buf += part;
    if (END_ZH.test(part) && part.match(END_ZH)[0] === part) { out.push(buf); buf = ''; }
  }
  if (buf) out.push(buf);
  // 句末标点后面紧跟的右引号 / 右括号归上一句(「……？」不能把「」」切到下一句开头;第 17 期实测)
  for (let i = 1; i < out.length; i++) {
    const m = out[i].match(/^[」』”’）)]+/);
    if (m) { out[i - 1] += m[0]; out[i] = out[i].slice(m[0].length); }
  }
  return out.filter(Boolean);
}
export const splitEn = p => p.split(/(?<=[.?!]["”]?)\s+(?=["“A-Z0-9])/).map(s => s.trim()).filter(Boolean);

export function loadSentences(file, lang = 'zh') {
  const raw = fs.readFileSync(file, 'utf8');
  const paras = raw.split(/\n\s*\n/).map(p => lang === 'zh' ? p.replace(/\s+/g, '') : p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  paras.forEach((p, pi) => {
    const sents = lang === 'zh' ? splitZh(p) : splitEn(p);
    sents.forEach((s, si) => out.push({ id: `p${pi + 1}s${si + 1}`, para: pi + 1, idx: si + 1, text: s, lastInPara: si === sents.length - 1 }));
  });
  return out;
}

// 比对用的单位:中文按字(去标点),英文按词(小写、去标点;连字符拆开)
export const stripPunct = t => t.replace(/[\s,，。？?；;：:、"“”「」‘’—\-!！()（）《》]/g, '');
export const normWord = w => w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']/g, '');
export const units = (text, lang) => lang === 'zh' ? [...stripPunct(text)] : text.split(/[\s—–-]+/).map(normWord).filter(Boolean);
// 分句(逗号、顿号处):供画面节点与字幕断行挂靠
export const clauses = (text, lang) => lang === 'zh' ? [...text.matchAll(/[^,，、]+[,，、]?/g)].map(m => m[0]) : [...text.matchAll(/[^,;:]+[,;:]?/g)].map(m => m[0]).filter(s => s.trim());
