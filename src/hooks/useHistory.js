import { useCallback, useState } from 'react';
import { trimHistory } from '../core/history.js';

const H_KEY = 'aiStudioHistory';

export function useHistory() {
  const [msgs, setMsgs] = useState(() => {
    try {
      const h = JSON.parse(localStorage.getItem(H_KEY));
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  });

  const persist = useCallback((list) => {
    let out = trimHistory(list, 40);
    try {
      localStorage.setItem(H_KEY, JSON.stringify(out));
    } catch (e) {
      // квота — убираем тяжёлые data: изображения и повторяем
      out = trimHistory(list.map(m => (m.src && String(m.src).indexOf('data:') === 0) ? Object.assign({}, m, { src: 'data:gone' }) : m), 30);
      try { localStorage.setItem(H_KEY, JSON.stringify(out)); } catch (e2) { /* ignore */ }
    }
  }, []);

  const push = useCallback((m) => {
    m.id = m.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    m.ts = Date.now();
    setMsgs(prev => {
      const next = prev.concat([m]);
      persist(next);
      return next;
    });
    return m.id;
  }, [persist]);

  const replaceById = useCallback((oldId, m) => {
    setMsgs(prev => {
      const next = prev.filter(x => x.id !== oldId).concat([m]);
      persist(next);
      return next;
    });
  }, [persist]);

  const clear = useCallback(() => {
    setMsgs([]);
    try { localStorage.removeItem(H_KEY); } catch (e) { /* ignore */ }
  }, []);

  return { msgs, push, replaceById, clear };
}
