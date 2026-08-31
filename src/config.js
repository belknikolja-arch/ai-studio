/* Настройки: значения по умолчанию, подсказки моделей, хранилище (localStorage) */
export const S_KEY = 'aiStudioSettings';

export const DEFAULTS = {
  chatProv: 'openai',
  chatModel: 'gpt-4o-mini',
  imgProv: 'openai',
  imgModelOpenai: 'gpt-image-1',
  imgModelGemini: 'gemini-2.5-flash-image',
  imgModelReplicate: 'black-forest-labs/flux-1.1-pro',
  imgSize: '1024x1024',
  musicModel: 'meta/musicgen-large',
  musicDur: '30',
  voiceMode: 'web',
  ttsVoice: 'alloy',
  key_openai: '',
  key_anthropic: '',
  key_gemini: '',
  key_replicate: ''
};

export const SUGG = {
  chatModel: ['gpt-4o-mini','gpt-4o','gpt-4.1-mini','gpt-4.1','claude-sonnet-4-20250514','claude-3-5-haiku-20241022','gemini-2.5-flash','gemini-2.5-pro'],
  imgModelOpenai: ['gpt-image-1','dall-e-3'],
  imgModelGemini: ['gemini-2.5-flash-image','imagen-4.0-generate-001'],
  imgModelReplicate: ['black-forest-labs/flux-1.1-pro','black-forest-labs/flux-schnell','stabilityai/sdxl'],
  musicModel: ['meta/musicgen-large','meta/musicgen','stabilityai/stable-audio-open-1.0']
};

export const SETSPEC = [
  { s: '💬 Чат (текст)' },
  { k: 'chatProv', t: 'select', label: 'Провайдер', opts: [['openai','OpenAI'],['anthropic','Anthropic (Claude)'],['gemini','Google (Gemini)']] },
  { k: 'key_openai', t: 'pass', label: 'Ключ OpenAI (sk-…)' },
  { k: 'key_anthropic', t: 'pass', label: 'Ключ Anthropic (sk-ant-…)' },
  { k: 'key_gemini', t: 'pass', label: 'Ключ Google AI (AIza…)' },
  { k: 'chatModel', t: 'model', label: 'Модель чата', hint: 'Модель зависит от провайдера. Впишите любую доступную у провайдера.' },
  { s: '🖼 Фото' },
  { k: 'imgProv', t: 'select', label: 'Провайдер фото', opts: [['openai','OpenAI'],['gemini','Google (Gemini)'],['replicate','Replicate (Flux и др.)']] },
  { k: 'imgModelOpenai', t: 'model', label: 'Модель (OpenAI)' },
  { k: 'imgModelGemini', t: 'model', label: 'Модель (Google)' },
  { k: 'imgModelReplicate', t: 'model', label: 'Модель (Replicate)' },
  { k: 'key_replicate', t: 'pass', label: 'Токен Replicate (r8_…)' },
  { k: 'imgSize', t: 'select', label: 'Размер (для OpenAI)', opts: [['1024x1024','1024 × 1024'],['1024x1792','1024 × 1792 (портрет)'],['1792x1024','1792 × 1024 (широкий)']] },
  { s: '🎵 Музыка (Replicate)' },
  { k: 'musicModel', t: 'model', label: 'Модель музыки' },
  { k: 'musicDur', t: 'select', label: 'Длина, секунд', opts: [['10','10'],['20','20'],['30','30']] },
  { s: '🔊 Голос' },
  { k: 'voiceMode', t: 'select', label: 'Режим', opts: [['web','Веб-озвучка браузера (без ключей)'],['openai','OpenAI TTS (mp3, нужен ключ OpenAI)']] },
  { k: 'ttsVoice', t: 'select', label: 'Голос OpenAI', opts: [['alloy','Alloy'],['echo','Echo'],['fable','Fable'],['onyx','Onyx'],['nova','Nova'],['shimmer','Shimmer']]}
];

export function getSet() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(S_KEY)) || {}); }
  catch (e) { return Object.assign({}, DEFAULTS); }
}

export function saveSet(s) {
  try { localStorage.setItem(S_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}
