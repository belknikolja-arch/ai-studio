/* ============================================================
   ЧИСТОЕ ЯДРО: выбор голоса / определение языка — тестируется в Node
   ============================================================ */
export function pickVoiceName(voices, lang) {
  const list = Array.isArray(voices) ? voices : [];
  const pref = (lang || 'en').toLowerCase().indexOf('ru') === 0 ? 'ru' : 'en';
  const hit = list.find(v => (v.lang || '').toLowerCase().indexOf(pref) === 0);
  return hit ? hit.name : (list.length ? list[0].name : '');
}

export function looksRU(t) {
  return /[а-яА-ЯёЁ]/.test(t || '');
}
