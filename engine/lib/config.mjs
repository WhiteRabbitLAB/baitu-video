// 读项目配置 explainer.json、频道配置文件夹、配音设定。
// explainer.json(放在项目根目录)例:
// {
//   "channels": {
//     "my-channel": {
//       "profile": "my-channel",            // 频道配置文件夹:<项目>/profiles/my-channel/(推荐),或 skill 的 profiles/,或相对项目根目录的路径
//       "paths": { "brief": "brief/{ep}", "out": "out/{ep}", "page": "video/{ep}.html" }
//     }
//   }
// }
// 第一个频道是默认频道;命令行用 --channel <名字> 换。
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, SKILL } from './paths.mjs';

export const CONFIG_FILE = path.join(PROJECT, 'explainer.json');
export const DEFAULT_PATHS = { brief: 'brief/{ep}', out: 'out/{ep}', page: 'video/{ep}.html' };

export function loadProject() {
  if (!fs.existsSync(CONFIG_FILE)) throw new Error(`没有找到 ${CONFIG_FILE}(复制 engine/explainer.example.json 改名为 explainer.json)`);
  const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  if (!cfg.channels || !Object.keys(cfg.channels).length) throw new Error('explainer.json 里没有 channels');
  return cfg;
}

// 频道配置的位置,按顺序找:<项目>/profiles/<名>(推荐:放在你自己的项目里,升级 skill 不会被覆盖)→ <skill>/profiles/<名> → <项目>/<名>(写成相对路径时)
export const profileCandidates = profile => [path.join(PROJECT, 'profiles', profile), path.join(SKILL, 'profiles', profile), path.resolve(PROJECT, profile)];
export function profileDir(profile) {
  const c = profileCandidates(profile);
  return c.find(d => fs.existsSync(path.join(d, 'channel.md'))) || c.find(d => fs.existsSync(d)) || c[0];
}

export function loadChannel(name) {
  const cfg = loadProject();
  const id = name || Object.keys(cfg.channels)[0];
  const ch = cfg.channels[id];
  if (!ch) throw new Error(`explainer.json 里没有频道 ${id};有:${Object.keys(cfg.channels).join('、')}`);
  return { id, ...ch, paths: { ...DEFAULT_PATHS, ...ch.paths }, dir: profileDir(ch.profile || id) };
}

// voice.md 里第一个 ```json 代码块就是给引擎读的配音设定(人读的说明写在代码块外面)。
export function loadVoice(dir) {
  const f = path.join(dir, 'voice.md');
  if (!fs.existsSync(f)) throw new Error(`缺 ${f}`);
  const m = fs.readFileSync(f, 'utf8').match(/```json\n([\s\S]*?)```/);
  if (!m) throw new Error(`${f} 里没有 \`\`\`json 代码块(引擎读的配音设定)`);
  const v = JSON.parse(m[1]);
  if (!v.voices || !Object.keys(v.voices).length) throw new Error(`${f} 的 json 里没有 voices`);
  return v;
}

// 只读 .env 进内存,不打印值。返回 { 变量名: 值 }。
export function readEnv() {
  const f = path.join(PROJECT, '.env');
  const out = {};
  if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
export const hasKey = name => !!(process.env[name] || readEnv()[name]);

export const fill = (tpl, ep) => tpl.replaceAll('{ep}', ep);
