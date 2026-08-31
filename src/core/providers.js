/* ============================================================
   ЧИСТОЕ ЯДРО: тела запросов к провайдерам + парсинг Replicate
   (без DOM, без fetch) — тестируется в Node
   ============================================================ */
export function sysPrompt() {
  return 'Ты — «ИИ-Студия», дружелюбный ассистент в одном окне: болтаешь, помогаешь, подсказываешь. У тебя есть команды-возможности (пользователь активирует их в начале фразы): «нарисуй …» / «сгенерируй фото …» — картинка; «сделай песню …» / «сгенерируй музыку …» — музыкальный трек; «произнеси …» / «озвучь …» — озвучка голосом. Если пользователь хочет картинку, музыку или голос, но пишет без команды — мягко предложи точную формулировку. Отвечай на языке пользователя, кратко и по делу.';
}

export function openAIChatBody(model, messages) {
  return {
    model: model,
    temperature: 0.7,
    messages: (messages || []).map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: String(m.content) }))
  };
}

export function anthropicChatBody(model, messages) {
  const msgs = messages || [];
  const sys = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const rest = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: String(m.content) }));
  const b = { model: model, max_tokens: 2048, messages: rest };
  if (sys) b.system = sys;
  return b;
}

export function geminiChatBody(model, messages) {
  const msgs = messages || [];
  const sys = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const contents = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: String(m.content) }] }));
  const b = { contents: contents };
  if (sys) b.systemInstruction = { parts: [{ text: sys }] };
  return b;
}

export function replicateCreateBody(input) {
  return { input: input || {} };
}

export function replicateDone(status) {
  return status === 'succeeded' || status === 'failed' || status === 'canceled';
}

export function parseReplicateOutput(o) {
  if (o == null) return null;
  if (typeof o === 'string') return o;
  if (Array.isArray(o)) return o.length ? parseReplicateOutput(o[o.length - 1]) : null;
  if (typeof o === 'object') {
    if (typeof o.file === 'string') return o.file;
    if (typeof o.audio === 'string') return o.audio;
    for (const k of ['url', 'image', 'audio', 'output']) if (typeof o[k] === 'string') return o[k];
    if (Array.isArray(o.output)) return parseReplicateOutput(o.output);
  }
  return null;
}

export function dataUrlOf(b64, mime) {
  return 'data:' + (mime || 'image/png') + ';base64,' + b64;
}
