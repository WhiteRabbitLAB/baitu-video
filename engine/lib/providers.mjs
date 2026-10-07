// 配音服务登记表(单一驻地)。voice.md 的 json 里 provider 填这里的键。
//   keyEnv:默认从哪个环境变量 / .env 变量读密钥(voice 设定里可用 keyEnv 改);null = 不要密钥
//   timestamps:接口是否返回逐字 / 逐词时间戳;false ⇒ 用 whisper 对齐
//   status:tested = 本项目实测通过(写日期);docs = 按官方文档接入、没有密钥未实测
export const PROVIDERS = {
  doubao:     { name: '豆包语音(火山引擎)', keyEnv: 'VOLC_API_KEY',       timestamps: true,  status: 'tested', checked: '2026-10-08' },
  gemini:     { name: 'Gemini TTS',          keyEnv: 'GOOGLE_API_KEY',     timestamps: false, status: 'tested', checked: '2026-10-08' },
  openai:     { name: 'OpenAI TTS',          keyEnv: 'OPENAI_API_KEY',     timestamps: false, status: 'tested', checked: '2026-10-08' },
  minimax:    { name: 'MiniMax',             keyEnv: 'MINIMAX_API_KEY',    timestamps: false, status: 'tested', checked: '2026-10-08' },
  dashscope:  { name: '阿里百炼(通义 TTS)', keyEnv: 'DASHSCOPE_API_KEY',  timestamps: false, status: 'tested', checked: '2026-10-08' },
  'edge-tts': { name: 'edge-tts(免费)',     keyEnv: null,                 timestamps: false, status: 'tested', checked: '2026-10-08', cmd: true },
  elevenlabs: { name: 'ElevenLabs',          keyEnv: 'ELEVENLABS_API_KEY', timestamps: true,  status: 'docs' },
  azure:      { name: 'Azure 语音',          keyEnv: 'AZURE_SPEECH_KEY',   timestamps: false, status: 'docs' },
  fish:       { name: 'Fish Audio',          keyEnv: 'FISH_API_KEY',       timestamps: false, status: 'docs' },
};
export const loadProvider = id => import(`./tts/${id}.mjs`);
