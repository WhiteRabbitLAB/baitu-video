// 开源导出:按白名单把 skill 复制到一个目录(开源仓库的工作区),再扫一遍频道痕迹当门禁 —— 扫到就判失败,不许发布。
//   node .claude/skills/baitu-video/engine/tools/export.mjs <目标目录>
// 排除:TODO.md(内部过程记录)、examples 里跑出来的产物、profiles/ 下除 _template / example / README.md 以外的文件夹(作者自己的频道)、.DS_Store。
// 门禁:通用规则(本机绝对路径)+ 私有词表 export-private.json(期号、片名与题材专名、频道名、私有路径);每条先跑阳性对照。
// 例外写在各条规则里;NOTICE、LICENSE、字体许可证原文不扫。
import fs from 'node:fs';
import path from 'node:path';

const SKILL = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dest = process.argv[2];
if (!dest) { console.error('用法:node export.mjs <目标目录>'); process.exit(2); }
const DEST = path.resolve(dest);
if (DEST.startsWith(SKILL)) { console.error('目标目录不能在 skill 里面'); process.exit(2); }

const PRIVATE_DIR = /^profiles\/(?!_template\/|example\/|README\.md$)[^/]+/;
const EXAMPLE_OUT = /^examples\/[^/]+\/(out|cache|node_modules)\/|^examples\/[^/]+\/video\/(data-|fonts-)/;   // 示例期跑出来的产物(同示例的 .gitignore)
const skip = rel => rel === 'TODO.md' || rel === 'engine/tools/export-private.json' || PRIVATE_DIR.test(rel) || EXAMPLE_OUT.test(rel) || path.basename(rel) === '.DS_Store';

// 门禁规则:[名字, 正则, 例外文件(正则)]。通用规则写在这里;作者私有的词表(片名、题材、频道名)放 export-private.json,
// 它和本脚本同目录、不随导出发布——否则「要藏的词」本身就被公开了。别人用这个脚本时,照它的格式写自己的私有词表。
const PRIV_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'export-private.json');
const RULES = [['本机绝对路径', /\/(Users|home)\/[^/\s]+\//, null]], POSITIVE = { '本机绝对路径': 'cd /' + 'Users/someone/project' };   // 拼出来,免得这行自己触发门禁
if (fs.existsSync(PRIV_FILE)) {
  const P = JSON.parse(fs.readFileSync(PRIV_FILE, 'utf8'));
  for (const [name, re, flags, except] of P.rules) RULES.push([name, new RegExp(re, flags), except ? new RegExp(except) : null]);
  Object.assign(POSITIVE, P.positive);
} else console.log('(没有 export-private.json,只跑通用规则)');
const TEXT = /\.(md|mjs|js|html|json|py|css|txt)$/;

// 阳性对照:每条规则必须能抓到一个坏样本,否则这条门禁本身失效
for (const [name, re] of RULES) if (!re.test(POSITIVE[name] || '')) { console.error(`门禁失效:「${name}」抓不到阳性对照`); process.exit(3); }

const files = [];
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name), rel = path.relative(SKILL, p); if (skip(rel + (e.isDirectory() ? '/' : ''))) continue; if (e.isDirectory()) walk(p); else files.push(rel); } };
walk(SKILL);

const hits = [];
for (const rel of files) {
  if (!TEXT.test(rel) || /^(LICENSE|NOTICE\.md)$/.test(rel) || /LICENSES\//.test(rel)) continue;
  const buf = fs.readFileSync(path.join(SKILL, rel));
  if (buf.includes(0)) { hits.push(`${rel}: 含 NUL 字节`); continue; }
  buf.toString('utf8').split('\n').forEach((line, i) => {
    for (const [name, re, except] of RULES) if (re.test(line) && !(except && except.test(rel))) hits.push(`${rel}:${i + 1} 【${name}】 ${line.trim().slice(0, 90)}`);
  });
}
if (hits.length) { console.error(`❌ 门禁不过:${hits.length} 处\n` + hits.join('\n')); process.exit(1); }

// 目标已是 git 仓库(开源仓库的工作区)⇒ 只清空 .git 以外的东西,保留提交历史
if (fs.existsSync(path.join(DEST, '.git'))) { for (const e of fs.readdirSync(DEST)) if (e !== '.git') fs.rmSync(path.join(DEST, e), { recursive: true, force: true }); }
else fs.rmSync(DEST, { recursive: true, force: true });
// 改名(可选,写在 export-private.json 的 rename):开源版的 skill 名与安装目录和本地不同时,导出时替换文本文件里的这个词
const RENAME = fs.existsSync(PRIV_FILE) ? JSON.parse(fs.readFileSync(PRIV_FILE, 'utf8')).rename : null;
for (const rel of files) {
  const to = path.join(DEST, rel); fs.mkdirSync(path.dirname(to), { recursive: true });
  if (RENAME && TEXT.test(rel)) fs.writeFileSync(to, fs.readFileSync(path.join(SKILL, rel), 'utf8').replaceAll(RENAME.from, RENAME.to));
  else fs.copyFileSync(path.join(SKILL, rel), to);
}

// 导出后:Markdown 相对链接都要能打开
const broken = [];
for (const rel of files.filter(f => f.endsWith('.md'))) for (const m of fs.readFileSync(path.join(DEST, rel), 'utf8').matchAll(/\]\(([^)#\s]+)/g)) {
  if (/^https?:/.test(m[1])) continue;
  if (!fs.existsSync(path.resolve(path.dirname(path.join(DEST, rel)), m[1]))) broken.push(`${rel} → ${m[1]}`);
}
if (broken.length) { console.error(`❌ 导出后有 ${broken.length} 个链接打不开(多半指向了被排除的私有文件)\n` + broken.join('\n')); process.exit(1); }
console.log(`✅ 导出 ${files.length} 个文件到 ${DEST};门禁 ${RULES.length} 条全过(阳性对照均命中);链接全部能打开`);
