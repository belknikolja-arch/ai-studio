// ИИ-Студия v1.1 — проверки детерминированного ядра (npm test → node --test tests/)
import test from 'node:test';
import assert from 'node:assert/strict';

import { INTENTS, matchCmd, stripCmd, routeIntent } from '../src/core/intents.js';
import { sysPrompt, openAIChatBody, anthropicChatBody, geminiChatBody, replicateCreateBody, replicateDone, parseReplicateOutput, dataUrlOf } from '../src/core/providers.js';
import { trimHistory } from '../src/core/history.js';
import { pickVoiceName, looksRU } from '../src/core/voices.js';

const V = [
  { name: 'Google русский', lang: 'ru-RU' },
  { name: 'Samantha', lang: 'en-US' }
];
const histAI = [
  { role: 'system', content: 'sys' },
  { role: 'user', content: 'привет' },
  { role: 'ai', content: 'здравствуйте' }
];

/* ── намерения / маршрутизация ── */
test('INTENTS: три списка команд (image/music/voice), chat — фолбэк', () => {
  assert.ok(INTENTS.image.length > 5);
  assert.ok(INTENTS.music.length > 5);
  assert.ok(INTENTS.voice.length > 3);
  assert.ok(!('chat' in INTENTS)); // chat — фолбэк routeIntent
});
test('matchCmd: "нарисуй кота"', () => assert.equal(matchCmd('нарисуй кота', INTENTS.image), 'нарисуй'));
test('matchCmd: "draw a cat" (EN)', () => assert.equal(matchCmd('draw a cat', INTENTS.image), 'draw'));
test('matchCmd: "speak hello" (EN, слово целиком)', () => assert.equal(matchCmd('speak hello', INTENTS.voice), 'speak'));
test('matchCmd: "отрисуй контур" не ловит "нарисуй"', () => assert.equal(matchCmd('отрисуй контур', INTENTS.image), null));
test('routeIntent: фото (RU, без команды — с командой)', () => assert.equal(routeIntent('нарисуй кота в космосе').kind, 'image'));
test('routeIntent: фото (REGISTR): "НАРИСУЙ кота"', () => assert.equal(routeIntent('НАРИСУЙ кота').kind, 'image'));
test('routeIntent: фото "Сгенерируй фото города"', () => assert.equal(routeIntent('Сгенерируй фото города').kind, 'image'));
test('routeIntent: фото "изобрази дракона"', () => assert.equal(routeIntent('изобрази дракона').kind, 'image'));
test('routeIntent: музыка "сделай песню про лето"', () => assert.equal(routeIntent('сделай песню про лето').kind, 'music'));
test('routeIntent: музыка "сгенерируй музыку в стиле эмбиент"', () => assert.equal(routeIntent('сгенерируй музыку в стиле эмбиент').kind, 'music'));
test('routeIntent: музыка "напиши трек про космос"', () => assert.equal(routeIntent('напиши трек про космос').kind, 'music'));
test('routeIntent: голос "произнеси это предложение"', () => assert.equal(routeIntent('произнеси это предложение').kind, 'voice'));
test('routeIntent: голос "озвучь фразу"', () => assert.equal(routeIntent('озвучь фразу').kind, 'voice'));
test('routeIntent: голос "прочитай вслух сказку"', () => assert.equal(routeIntent('прочитай вслух сказку').kind, 'voice'));
test('routeIntent: обычный вопрос → chat', () => assert.equal(routeIntent('почему небо синее?').kind, 'chat'));
test('routeIntent: приоритет фото над музыкой', () => assert.equal(routeIntent('сгенерируй фото и сделай песню').kind, 'image'));
test('routeIntent: пустая строка → chat', () => {
  const r = routeIntent('');
  assert.equal(r.kind, 'chat');
  assert.equal(r.prompt, '');
});
test('routeIntent: prompt без команды "нарисуй котика"', () => assert.equal(routeIntent('нарисуй котика').prompt, 'котика'));
test('routeIntent: voice prompt "произнеси: Привет, мир!"', () => assert.equal(routeIntent('произнеси: Привет, мир!').prompt, 'Привет, мир!'));

/* ── stripCmd ── */
test('stripCmd: снимает двойные кавычки', () => assert.equal(stripCmd('нарисуй "закат над морем"', 'нарисуй'), 'закат над морем'));
test('stripCmd: снимает «кавычки-ёлочки»', () => assert.equal(stripCmd('озвучь «привет»', 'озвучь'), 'привет'));
test('stripCmd: двоеточие — "сделай песню: про дождь"', () => assert.equal(stripCmd('сделай песню: про дождь', 'сделай песню'), 'про дождь'));
test('stripCmd: fallback — целое предложение', () => assert.equal(stripCmd('произнеси', 'произнеси'), 'произнеси'));
test('stripCmd: чужая команда не режется', () => assert.equal(stripCmd('музыкально про что-то', 'музык'), 'музыкально про что-то'));

/* ── системный промпт ── */
test('sysPrompt: префикс "Ты — "', () => assert.ok(sysPrompt().indexOf('Ты — ') === 0));
test('sysPrompt: упоминает 4 функции', () => {
  const p = sysPrompt();
  assert.ok(p.indexOf('ИИ-Студия') !== -1);
  assert.ok(p.indexOf('нарисуй') !== -1);
  assert.ok(p.indexOf('музык') !== -1);
  assert.ok(p.indexOf('произнеси') !== -1);
});

/* ── тела запросов: OpenAI ── */
test('openAI: модель', () => assert.equal(openAIChatBody('gpt-4o-mini', histAI).model, 'gpt-4o-mini'));
test('openAI: system отдельным сообщением', () => {
  const b = openAIChatBody('gpt-4o-mini', histAI);
  assert.equal(b.messages[0].role, 'system');
  assert.equal(b.messages[0].content, 'sys');
});
test('openAI: ai→assistant', () => assert.equal(openAIChatBody('gpt-4o-mini', histAI).messages[2].role, 'assistant'));
test('openAI: temperature 0.7', () => assert.equal(openAIChatBody('gpt-4o-mini', histAI).temperature, 0.7));
test('openAI: без system — чистое', () => assert.equal(openAIChatBody('gpt-4o-mini', [{ role: 'user', content: 'x' }]).messages[0].role, 'user'));

/* ── Anthropic ── */
test('anthropic: system вынесен в поле system', () => assert.equal(anthropicChatBody('claude-sonnet-4-20250514', histAI).system, 'sys'));
test('anthropic: messages только user/assistant', () => {
  assert.ok(anthropicChatBody('claude-sonnet-4-20250514', histAI).messages.every(m => m.role === 'user' || m.role === 'assistant'));
});
test('anthropic: модель + max_tokens 2048', () => {
  const b = anthropicChatBody('claude-sonnet-4-20250514', histAI);
  assert.equal(b.model, 'claude-sonnet-4-20250514');
  assert.equal(b.max_tokens, 2048);
});

/* ── Gemini ── */
test('gemini: systemInstruction', () => assert.equal(geminiChatBody('gemini-2.5-flash', histAI).systemInstruction.parts[0].text, 'sys'));
test('gemini: contents — user', () => assert.equal(geminiChatBody('gemini-2.5-flash', histAI).contents[0].role, 'user'));
test('gemini: ai→model', () => assert.equal(geminiChatBody('gemini-2.5-flash', histAI).contents[1].role, 'model'));

/* ── Replicate ── */
test('replicateCreateBody: input', () => assert.equal(replicateCreateBody({ prompt: 'закат' }).input.prompt, 'закат'));
test('replicateDone: succeeded = терминал', () => assert.equal(replicateDone('succeeded'), true));
test('replicateDone: failed = терминал', () => assert.equal(replicateDone('failed'), true));
test('replicateDone: canceled = терминал', () => assert.equal(replicateDone('canceled'), true));
test('replicateDone: running = нет', () => assert.equal(replicateDone('running'), false));
test('parseReplicate: строка', () => assert.equal(parseReplicateOutput('https://x/a.mp3'), 'https://x/a.mp3'));
test('parseReplicate: массив (последний)', () => assert.equal(parseReplicateOutput(['https://x/a.mp3']), 'https://x/a.mp3'));
test('parseReplicate: {file}', () => assert.equal(parseReplicateOutput({ file: 'https://x/a.png' }), 'https://x/a.png'));
test('parseReplicate: {url}', () => assert.equal(parseReplicateOutput({ url: 'https://x/a.mp3' }), 'https://x/a.mp3'));
test('parseReplicate: {output: []}', () => assert.equal(parseReplicateOutput({ output: ['https://x/a.mp3'] }), 'https://x/a.mp3'));
test('parseReplicate: null → null', () => assert.equal(parseReplicateOutput(null), null));

/* ── история ── */
test('trimHistory: ≤40', () => {
  const many = [];
  for (let i = 0; i < 60; i++) many.push({ role: 'user', kind: 'text', text: 'м' + i });
  assert.equal(trimHistory(many, 40).length, 40);
});
test('trimHistory: оставляет хвост', () => {
  const many = [];
  for (let i = 0; i < 60; i++) many.push({ role: 'user', kind: 'text', text: 'м' + i });
  assert.equal(trimHistory(many, 40)[0].text, 'м20');
});
test('trimHistory: data: медиа ≤6', () => {
  const big = 'data:image/png;base64,AAAA';
  const list = [];
  for (let i = 0; i < 7; i++) list.push({ role: 'ai', kind: 'image', src: big, text: 'i' + i });
  assert.equal(trimHistory(list, 40).filter(m => m.src).length, 6);
});

/* ── dataUrlOf ── */
test('dataUrlOf: data:image/png по умолчанию', () => assert.equal(dataUrlOf('abc'), 'data:image/png;base64,abc'));
test('dataUrlOf: свой mime (mp3)', () => assert.equal(dataUrlOf('abc', 'audio/mpeg'), 'data:audio/mpeg;base64,abc'));

/* ── голоса ── */
test('pickVoiceName: ru-RU в списке', () => assert.equal(pickVoiceName(V, 'ru'), 'Google русский'));
test('pickVoiceName: en', () => assert.equal(pickVoiceName(V, 'en'), 'Samantha'));
test('pickVoiceName: пустой список → ""', () => assert.equal(pickVoiceName([], 'ru'), ''));
test('looksRU: кириллица', () => assert.equal(looksRU('привет, как дела?'), true));
test('looksRU: латиница → false', () => assert.equal(looksRU('hello world'), false));
