/* ============================================================
   ЧИСТОЕ ЯДРО: история сообщений (без DOM) — тестируется в Node
   ============================================================ */
export function trimHistory(h, max) {
  max = max || 40;
  let out = (h || []).slice(-max);
  let media = 0;
  out = out.filter(m => {
    if (m && m.src && String(m.src).indexOf('data:') === 0) { media++; return media <= 6; }
    return true;
  });
  return out;
}
