/* ============================================================
   СЛОЙ API: живые вызовы провайдеров (только браузер: fetch, speechSynthesis)
   ============================================================ */
import { getSet } from '../config.js';
import { sysPrompt, openAIChatBody, anthropicChatBody, geminiChatBody, replicateCreateBody, replicateDone, parseReplicateOutput, dataUrlOf } from '../core/providers.js';
import { pickVoiceName, looksRU } from '../core/voices.js';

async function shortErr(res) {
  try { const t = await res.text(); return t.slice(0, 300); }
  catch (e) { return 'ошибка сети'; }
}

function requireKey(name) {
  const s = getSet();
  const k = (s['key_' + name] || '').trim();
  if (!k) throw new Error('Нужен ключ «' + name + '». Вставьте его в «Настройки» (справа) — где взять: блок «🔑 Ключи API» под чатом.');
  return k;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- чат ---------- */
async function callOpenAIChat(msgs) {
  const s = getSet(); const k = requireKey('openai');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k },
    body: JSON.stringify(openAIChatBody(s.chatModel || 'gpt-4o-mini', msgs))
  });
  if (!res.ok) throw new Error('OpenAI ' + res.status + ': ' + (await shortErr(res)));
  const d = await res.json();
  return d.choices && d.choices[0] && d.choices[0].message ? String(d.choices[0].message.content || '') : '(пустой ответ)';
}

async function callAnthropicChat(msgs) {
  const s = getSet(); const k = requireKey('anthropic');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify(anthropicChatBody(s.chatModel || 'claude-sonnet-4-20250514', msgs))
  });
  if (!res.ok) throw new Error('Anthropic ' + res.status + ': ' + (await shortErr(res)));
  const d = await res.json();
  return d.content && d.content.length ? d.content.map(p => p.text || '').join('') : '(пустой ответ)';
}

async function callGeminiChat(msgs) {
  const s = getSet(); const k = requireKey('gemini');
  const model = s.chatModel || 'gemini-2.5-flash';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': k },
    body: JSON.stringify(geminiChatBody(model, msgs))
  });
  if (!res.ok) throw new Error('Gemini ' + res.status + ': ' + (await shortErr(res)));
  const d = await res.json();
  const c = d.candidates && d.candidates[0];
  if (!c) throw new Error('Gemini: кандидат пуст (возможна блокировка безопасности)');
  return (c.content && c.content.parts ? c.content.parts.map(p => p.text || '').join('') : '(пустой ответ)');
}

export async function chatCall(history) {
  const s = getSet();
  const msgs = [{ role: 'system', content: sysPrompt() }].concat(history);
  if (s.chatProv === 'anthropic') return await callAnthropicChat(msgs);
  if (s.chatProv === 'gemini') return await callGeminiChat(msgs);
  return await callOpenAIChat(msgs);
}

/* ---------- Replicate (фото и музыка) ---------- */
export async function replicateCall(model, input) {
  const s = getSet(); const k = requireKey('replicate');
  let res = await fetch('https://api.replicate.com/v1/models/' + encodeURIComponent(model) + '/predictions', {
    method: 'POST',
    headers: { 'Authorization': 'Token ' + k, 'Content-Type': 'application/json' },
    body: JSON.stringify(replicateCreateBody(input))
  });
  if (!res.ok) throw new Error('Replicate ' + res.status + ': ' + (await shortErr(res)));
  let p = await res.json();
  const t0 = Date.now();
  while (!replicateDone(p.status)) {
    if (Date.now() - t0 > 300000) throw new Error('Replicate: таймаут 5 минут. Попробуйте ещё раз или выберите другую модель.');
    await sleep(2500);
    res = await fetch(p.urls && p.urls.get, { headers: { 'Authorization': 'Token ' + k } });
    if (!res.ok) throw new Error('Replicate: не удалось опросить статус (' + res.status + ')');
    p = await res.json();
  }
  if (p.status !== 'succeeded') throw new Error('Replicate: ' + ((p.failure || p.status || 'сбой').toString().slice(0, 300)));
  const url = parseReplicateOutput(p.output);
  if (!url) throw new Error('Replicate: не нашёл файл результата в ответе');
  return url;
}

/* ---------- фото ---------- */
async function imageOpenAI(prompt) {
  const s = getSet(); const k = requireKey('openai');
  const body = { model: s.imgModelOpenai || 'gpt-image-1', prompt: prompt, size: s.imgSize || '1024x1024', response_format: 'b64_json' };
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('OpenAI images ' + res.status + ': ' + (await shortErr(res)));
  const d = await res.json();
  const it = d.data && d.data[0];
  if (it && it.b64_json) return { src: dataUrlOf(it.b64_json, 'image/png'), external: null };
  if (it && it.url) return { src: it.url, external: it.url };
  throw new Error('OpenAI images: в ответе нет b64/url (проверьте модель)');
}

async function imageGemini(prompt) {
  const s = getSet(); const k = requireKey('gemini');
  const model = s.imgModelGemini || 'gemini-2.5-flash-image';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': k },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!res.ok) throw new Error('Gemini images ' + res.status + ': ' + (await shortErr(res)));
  const d = await res.json();
  const c = d.candidates && d.candidates[0];
  const parts = (c && c.content && c.content.parts) || [];
  const ip = parts.find(p => p.inlineData && p.inlineData.data);
  if (ip) return { src: 'data:' + (ip.inlineData.mimeType || 'image/png') + ';base64,' + ip.inlineData.data, external: null };
  const txt = parts.filter(p => p.text).map(p => p.text).join(' ');
  throw new Error('Gemini не выдал изображение' + (txt ? ': ' + txt.slice(0, 200) : ' (проверьте модель/ключ)'));
}

export async function imageCall(prompt) {
  const s = getSet();
  if (s.imgProv === 'gemini') return await imageGemini(prompt);
  if (s.imgProv === 'replicate') {
    const u = await replicateCall(s.imgModelReplicate || 'black-forest-labs/flux-1.1-pro', { prompt: prompt });
    return { src: u, external: u };
  }
  return await imageOpenAI(prompt);
}

/* ---------- музыка ---------- */
export async function musicCall(prompt) {
  const s = getSet();
  const dur = Number(s.musicDur || 30);
  const u = await replicateCall(s.musicModel || 'meta/musicgen-large', { prompt: prompt, duration: Math.min(30, Math.max(5, dur)) });
  return { src: u, external: u };
}

/* ---------- голос ---------- */
export function webSpeak(text, lang) {
  const syn = window.speechSynthesis;
  if (!syn) throw new Error('Браузер не поддерживает озвучку (speechSynthesis)');
  const u = new SpeechSynthesisUtterance(String(text || '').slice(0, 2000));
  u.lang = (lang === 'ru' ? 'ru-RU' : 'en-US');
  let vs = [];
  try { vs = syn.getVoices(); } catch (e) { /* ignore */ }
  const name = pickVoiceName(vs, lang);
  if (name) {
    const v = vs.find(x => x.name === name);
    if (v) u.voice = v;
  }
  u.rate = 1;
  syn.cancel();
  syn.speak(u);
}

export async function voiceCall(prompt) {
  const s = getSet();
  if (s.voiceMode === 'openai') {
    const k = requireKey('openai');
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k },
      body: JSON.stringify({ model: 'tts-1', voice: s.ttsVoice || 'alloy', input: String(prompt).slice(0, 4000), response_format: 'mp3' })
    });
    if (!res.ok) throw new Error('OpenAI TTS ' + res.status + ': ' + (await shortErr(res)));
    const buf = await res.arrayBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
    return { src: url, web: false };
  }
  webSpeak(prompt, looksRU(prompt) ? 'ru' : 'en');
  return { src: null, web: true };
}
