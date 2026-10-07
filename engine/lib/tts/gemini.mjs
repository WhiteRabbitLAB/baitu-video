// Gemini TTS。2026-10-04 实测(AI 评测英文版):
//  - gemini-2.5-pro-preview-tts 按「风格提示:\n正文」只念正文;返回 audio/L16 裸 PCM 24kHz(有的版本返回带头 WAV,两种都处理)
//  - 3.x flash-tts 会把风格提示当正文念出来 ⇒ 默认用 2.5 pro
//  - 提示词改不动语速 ⇒ 语速在后期 atempo;不返回时间戳 ⇒ whisper 对齐
//  - 正文本身像指令时(「Type this into…」)会被当指令不念 ⇒ voice 设定里给 styleVerbatim,该段用逐字朗读提示
import { toPcm } from '../audio.mjs';
export const nativeSpeed = false;
export async function synth(text, v, key) {
  const model = v.model || 'gemini-2.5-pro-preview-tts';
  const style = v.style || 'Narrate in a calm, warm documentary voice:';
  const body = { contents: [{ parts: [{ text: style + '\n' + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: v.voice || 'Iapetus' } } } } };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 300)}`), { status: r.status });
  const d = await r.json();
  const part = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw Object.assign(new Error('没有音频:' + JSON.stringify(d).slice(0, 300)), { status: 503 });
  const b = Buffer.from(part.inlineData.data, 'base64');
  const rate = +(part.inlineData.mimeType.match(/rate=(\d+)/) || [])[1] || 24000;
  return { pcm: b.subarray(0, 4).toString() === 'RIFF' ? toPcm(b) : toPcm(b, { rate }), usage: d.usageMetadata };
}
