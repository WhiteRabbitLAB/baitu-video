// Azure 语音(REST)。按官方文档接入,**本项目没有密钥,未实测**。区域写在 voice 设定的 region(或环境变量 AZURE_SPEECH_REGION)。
// REST 不返回时间戳 ⇒ whisper 对齐。voice 例:zh-CN-YunxiNeural、en-US-GuyNeural。
import { toPcm } from '../audio.mjs';
export const nativeSpeed = true;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export async function synth(text, v, key) {
  const region = v.region || process.env.AZURE_SPEECH_REGION;
  if (!region) throw new Error('Azure 要在 voice 设定里写 region(或设 AZURE_SPEECH_REGION)');
  const voice = v.voice || 'zh-CN-YunxiNeural', lang = voice.split('-').slice(0, 2).join('-');
  const rate = v.speed && v.speed !== 1 ? `<prosody rate="${Math.round((v.speed - 1) * 100)}%">${esc(text)}</prosody>` : esc(text);
  const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${voice}">${rate}</voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'raw-24khz-16bit-mono-pcm', 'User-Agent': 'explainer-engine' }, body: ssml });
  const b = Buffer.from(await r.arrayBuffer());
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${b.toString().slice(0, 300)}`), { status: r.status });
  return { pcm: toPcm(b, { rate: 24000 }) };
}
