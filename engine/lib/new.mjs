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
  if (lang === 'zh') put(path.join(brief, 'subtitles.json'), JSON.stringify({ conversions: [], keep: [], breaks: {} }, null, 2) + '\n');
  const vc = path.relative(path.dirname(page), path.join(ENGINE, 'vc')).split(path.sep).join('/');
  put(page, fs.readFileSync(path.join(ENGINE, 'templates/page.html'), 'utf8').replaceAll('{{EP}}', ep).replaceAll('{{VC}}', vc).replaceAll('{{STYLE}}', style));
  return { made, kept, next: [`改稿子 ${path.relative(PROJECT, path.join(brief, `script.${lang}.txt`))}(空行分段;句子在 。?;: —— 处切开)`, `narrate ${ep} → subs ${ep} → fonts ${ep} → shot ${ep} 3 8 → render ${ep} → mix ${ep} → accept ${ep}`] };
}
