// 新建一期:稿子模板 + 每期设定 + 起步页面(组件路径按你的目录自动算好)。已有的文件不覆盖。
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE, PROJECT } from './paths.mjs';
import { loadChannel, loadVoice, fill } from './config.mjs';
import { styleFonts } from './fonts.mjs';

export function newEpisode({ ep, channel, style = 'whiteboard' }) {
  const ch = loadChannel(channel), lang = Object.keys(loadVoice(ch.dir).voices)[0];
  if (!styleFonts()[style]) throw new Error(`没有画风「${style}」;可选:${Object.keys(styleFonts()).join('、')}`);
  const brief = path.join(PROJECT, fill(ch.paths.brief, ep)), page = path.join(PROJECT, fill(ch.paths.page, ep));
  const made = [], kept = [];
  const put = (f, text) => { if (fs.existsSync(f)) return kept.push(path.relative(PROJECT, f)); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); made.push(path.relative(PROJECT, f)); };
  put(path.join(brief, `script.${lang}.txt`), lang === 'zh'
    ? '这是第一段的第一句,换成你的稿子。这是第二句:冒号和破折号也会切句。\n\n空一行就是新的一段。每段整段合成一次配音。\n'
    : 'This is the first sentence of paragraph one. Replace it with your script.\n\nA blank line starts a new paragraph. Each paragraph is synthesized in one request.\n');
  // 事实表:accept 的第 14 项要它(每条有出处、没有「待核」)
  const facts = ch.paths?.facts ? path.join(PROJECT, fill(ch.paths.facts, ep)) : path.join(brief, 'facts.md');   // 和 accept 第 14 项找的是同一个位置
  put(facts, lang === 'zh'
    ? '# 事实表\n\n每条一行。出处写真查到的(链接、书名 + 页码、论文);凭记忆写的标「待核」,查实前不许进稿。状态:已核 / 待核 / 不说(不说的从稿子里删掉)。\n\n| # | 说法 | 出处 | 状态 |\n|---|---|---|---|\n| 1 | 换成稿子里的第一条事实 | 换成真实出处 | 待核 |\n'
    : '# Fact sheet\n\nOne row per claim. Sources must be ones you actually checked (link, book + page, paper); anything written from memory is "unverified" and stays out of the script until checked. Status: verified / unverified / cut (cut claims are removed from the script).\n\n| # | Claim | Source | Status |\n|---|---|---|---|\n| 1 | Replace with the first fact in your script | Replace with a real source | unverified |\n');
  if (lang === 'zh') put(path.join(brief, 'subtitles.json'), JSON.stringify({ conversions: [], keep: [], breaks: {} }, null, 2) + '\n');
  const vc = path.relative(path.dirname(page), path.join(ENGINE, 'vc')).split(path.sep).join('/');
  put(page, fs.readFileSync(path.join(ENGINE, 'templates/page.html'), 'utf8').replaceAll('{{EP}}', ep).replaceAll('{{VC}}', vc).replaceAll('{{STYLE}}', style));
  return { made, kept, next: [`先填事实表 ${path.relative(PROJECT, facts)}(出处要真查过;accept 会查)`, `改稿子 ${path.relative(PROJECT, path.join(brief, `script.${lang}.txt`))}(空行分段;句子在 。?;: —— 处切开)`, `narrate ${ep} → subs ${ep} → fonts ${ep} → shot ${ep} 3 8 → render ${ep} → mix ${ep} → accept ${ep}`] };
}
