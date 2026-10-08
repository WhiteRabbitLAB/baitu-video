#!/usr/bin/env node
// 讲解视频引擎入口。在你的项目根目录运行:
//   node .claude/skills/baitu-video/engine/cli.mjs <命令> [参数]
// 命令:
//   doctor                              自检:依赖、字体、项目配置、频道配置、配音密钥(只报有没有)
//   subs <期> [--lang zh] [--channel 名] [--out 目录] [--data 文件]   字幕 .srt + 页面数据文件(每期设定:<brief>/subtitles.json)
//   render <期> [--ranges 0-5,20-30] [--limit 帧数] [--workers 6]   导出画面(+ 音效);--ranges = 样片,直接出 proto.mp4
//   mix <期>                            混音 + 合成成片 <期>.mp4
//   cover <期> [--sizes 16x9,3x4] [--variants a,b]   封面
//   vertical <期>                       竖版(每期设定 <brief>/vertical.json)
//   shot <期> t1 t2 … [--vert] [--dir 目录]   按时刻截图
//   accept <期>                         验收,结果在 <out>/acceptance/summary.md
//   fonts <期>                          某一期页面的字体子集化(源字体按 engine/fonts.json 自动下载)
//   fonts-demo                          重切引擎自带的共享组件字体(改了画风表或演示页的字之后)
//   clean                               删渲染中间文件(cache/render)
//   通用参数:--channel 频道  --lang 语言  --out 产物目录
//   new <期> [--style whiteboard]        新建一期:稿子模板、subtitles.json、起步页面(已有文件不覆盖)
//   narrate <期> [--lang zh] [--channel 名] [--out 目录] [--paras 1,2]   配音 + 时间轴
// (配音、字幕、渲染、混音、检查等命令按 TODO O3 逐批接入)
const [cmd, ...args] = process.argv.slice(2);
const opt = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : d; };
const FLAGS = new Set(['--vert']);   // 不带值的开关
const pos = args.filter((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--') && !FLAGS.has(args[i - 1])));
const need = () => { if (!pos[0]) throw new Error(`用法:${cmd} <期>(见 cli.mjs 开头的说明)`); };
const common = () => ({ ep: pos[0], channel: opt('channel'), lang: opt('lang'), out: opt('out') });
const COMMANDS = {
  doctor: async () => (await import('./lib/doctor.mjs')).doctor(),
  subs: async () => {
    if (!pos[0]) throw new Error('用法:subs <期> [--lang zh] [--channel 名] [--out 目录] [--data 文件]');
    console.log(JSON.stringify((await import('./lib/subs.mjs')).subs({ ep: pos[0], lang: opt('lang'), channel: opt('channel'), out: opt('out'), data: opt('data') }), null, 1));
    return 0;
  },
  render: async () => { need(); console.log(JSON.stringify(await (await import('./lib/render.mjs')).render({ ...common(), ranges: opt('ranges'), limit: opt('limit') && +opt('limit'), workers: opt('workers') && +opt('workers') }), null, 1)); return 0; },
  mix: async () => { need(); console.log(JSON.stringify((await import('./lib/mix.mjs')).mix(common()), null, 1)); return 0; },
  cover: async () => { need(); console.log((await (await import('./lib/cover.mjs')).cover({ ...common(), sizes: opt('sizes'), variants: opt('variants') })).join('\n')); return 0; },
  vertical: async () => { need(); console.log(JSON.stringify(await (await import('./lib/vertical.mjs')).vertical(common()), null, 1)); return 0; },
  shot: async () => { need(); console.log((await (await import('./lib/shot.mjs')).shot({ ...common(), vert: args.includes('--vert'), dir: opt('dir') }, pos.slice(1))).join('\n')); return 0; },
  accept: async () => {
    need(); const rows = await (await import('./lib/accept.mjs')).accept(common());
    for (const r of rows) console.log(`${{ PASS: '✅', FAIL: '❌', LOOK: '👀', INFO: 'ℹ️ ', BROKEN: '⛔' }[r.status]} ${r.n}. ${r.name}:${r.summary}`);
    return rows.some(r => r.status === 'FAIL' || r.status === 'BROKEN') ? 1 : 0;
  },
  fonts: async () => { need(); console.log((await (await import('./lib/fonts.mjs')).fontsEpisode(common())).join('\n')); return 0; },
  'fonts-demo': async () => { console.log((await (await import('./lib/fonts.mjs')).fontsDemo()).join('\n')); return 0; },
  clean: async () => { const { PROJECT } = await import('./lib/paths.mjs'); const d = (await import('node:path')).join(PROJECT, 'cache/render'); (await import('node:fs')).rmSync(d, { recursive: true, force: true }); console.log('已删 ' + d); return 0; },
  new: async () => { need(); const r = (await import('./lib/new.mjs')).newEpisode({ ...common(), style: opt('style') }); console.log(`新建:${r.made.join('、') || '无'}${r.kept.length ? `\n已存在没动:${r.kept.join('、')}` : ''}\n下一步:\n  ${r.next.join('\n  ')}`); return 0; },
  narrate: async () => {
    if (!pos[0]) throw new Error('用法:narrate <期> [--lang zh] [--channel 名] [--out 目录] [--paras 1,2]');
    const r = await (await import('./lib/narrate.mjs')).narrate({ ep: pos[0], lang: opt('lang'), channel: opt('channel'), out: opt('out'), paras: opt('paras')?.split(',').map(Number) });
    console.log(JSON.stringify(r, null, 1));
    if (r.unmatched) console.log(`⚠️  ${r.unmatched} 句的配音和稿子没完全对上(常见是同音字被听错);时间轴已按前后句补齐。是不是真漏读,等 accept 的「漏读」一项判断。`);
    return 0;
  },
};
if (!cmd || !COMMANDS[cmd]) {
  console.log('用法:node .claude/skills/baitu-video/engine/cli.mjs <命令>\n命令:' + Object.keys(COMMANDS).join('、'));
  process.exit(cmd ? 2 : 0);
}
try { process.exitCode = await COMMANDS[cmd](args); } catch (e) { console.error('❌ ' + e.message); process.exitCode = 1; }
