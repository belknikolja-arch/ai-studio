/* ============================================================
   ЧИСТОЕ ЯДРО: роутинг команд (без DOM, без fetch)
   Тестируется в Node: node --test tests/
   ============================================================ */
export const INTENTS = {
  image: ['сгенерируй фото','сгенерируй изображение','сгенерируй картинку','сгенерируй рисунок','нарисуй мне','нарисуй','сделай фото','сделай картинку','сделай рисунок','создай фото','создай картинку','создай изображение','изобрази','generate photo','generate image','generate picture','make a picture','make a photo','draw'],
  music: ['сделай песню','сделай музыку','сделай трек','сделай бит','напиши песню','напиши музыку','напиши трек','сгенерируй песню','сгенерируй музыку','сгенерируй трек','создай песню','создай музыку','создай трек','make a song','make a track','generate a song','generate music','compose a song','compose a track'],
  voice: ['произнеси','озвучь','прочитай голосом','прочитай вслух','скажи голосом','read aloud','speak','say']
};

export function matchCmd(t, cmds) {
  for (const c of cmds) {
    if (c === 'say' || c === 'speak' || c === 'read aloud') {
      if (new RegExp('\\b' + c.replace(' ', '\\s+') + '\\b').test(t)) return c;
      continue;
    }
    if (t.indexOf(c) === 0 && !/[a-zа-яё]/i.test(t.charAt(c.length))) return c;
  }
  return null;
}

export function stripCmd(text, cmd) {
  const t = (text || '').trim();
  const tl = t.toLowerCase();
  if (tl.indexOf(cmd) !== 0) return t;
  if (/[a-zа-яё]/i.test(tl.charAt(cmd.length))) return t;
  let rest = t.slice(cmd.length).replace(/^[ ,;:.!?\-—]+/, '').trim();
  // снимаем обёртку в кавычки: «...», "...", '...'
  const q = rest.match(/^[«"'](.*)[»"']$/s);
  if (q) rest = q[1].trim();
  return rest || t;
}

export function routeIntent(raw) {
  const text = (raw || '').trim();
  const t = text.toLowerCase();
  const img = matchCmd(t, INTENTS.image);
  if (img) return { kind: 'image', prompt: stripCmd(text, img) };
  const mu = matchCmd(t, INTENTS.music);
  if (mu) return { kind: 'music', prompt: stripCmd(text, mu) };
  const vo = matchCmd(t, INTENTS.voice);
  if (vo) return { kind: 'voice', prompt: stripCmd(text, vo) };
  return { kind: 'chat', prompt: text };
}
