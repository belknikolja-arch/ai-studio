import React, { useEffect, useRef, useState } from 'react';
import { routeIntent } from './core/intents.js';
import { chatCall, imageCall, musicCall, voiceCall } from './api/index.js';
import { useSettings } from './hooks/useSettings.js';
import { useHistory } from './hooks/useHistory.js';
import Message from './components/Message.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import CommandHints from './components/CommandHints.jsx';
import HelpKeys from './components/HelpKeys.jsx';

const THEME_KEY = 'aiStudioTheme';
const LABELS = { chat: 'Думаю…', image: 'Генерирую фото (до минуты)…', music: 'Пишу музыку (1–5 минут)…', voice: 'Готовлю голос…' };

export default function App() {
  const [settings, update] = useSettings();
  const { msgs, push, replaceById, clear } = useHistory();
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { return 'dark'; } });
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const boxRef = useRef(null);
  const inpRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [msgs]);

  /* приветствие при пустой истории (один раз, даже в StrictMode) */
  const welcomeRef = useRef(false);
  useEffect(() => {
    if (welcomeRef.current) return;
    welcomeRef.current = true;
    if (msgs.length) return;
    const hasAnyKey = !!(settings.key_openai || settings.key_anthropic || settings.key_gemini || settings.key_replicate);
    const t = hasAnyKey
      ? 'Привет! Я — ИИ-Студия. Умею болтать, рисовать, писать музыку и говорить. Примеры: «нарисуй кота-астронавта», «сделай песню про дождливый вечер в стиле lo-fi», «произнеси: Добро пожаловать!».'
      : 'Привет! Я — ИИ-Студия. Умею болтать, рисовать, писать музыку и говорить. Сейчас ключей API нет — зато сразу можно попробовать «произнеси: Привет!» (веб-озвучка браузера, ключи не нужны). Остальное: вставьте ключи в «Настройки» справа (где взять — в блоке «🔑 Ключи API» под чатом).';
    push({ role: 'ai', kind: 'text', text: t });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (busy) return;
    const val = text.trim();
    if (!val) return;
    const r = routeIntent(val);
    setText('');
    push({ role: 'user', kind: 'text', text: val });
    const pid = push({ role: 'ai', kind: 'pending', label: LABELS[r.kind] });
    setBusy(true);
    try {
      if (r.kind === 'chat') {
        const hist = msgs.filter(m => (m.role === 'user' || m.role === 'ai') && m.kind === 'text' && (m.text || '').trim())
          .slice(-10).map(m => ({ role: m.role, content: m.text.slice(0, 4000) }));
        const reply = await chatCall(hist);
        replaceById(pid, { id: 'r' + Date.now(), role: 'ai', kind: 'text', text: reply, ts: Date.now() });
      } else if (r.kind === 'image') {
        const res = await imageCall(r.prompt);
        replaceById(pid, { id: 'r' + Date.now(), role: 'ai', kind: 'image', text: r.prompt, src: res.src, external: res.external, ts: Date.now() });
      } else if (r.kind === 'music') {
        const res = await musicCall(r.prompt);
        replaceById(pid, { id: 'r' + Date.now(), role: 'ai', kind: 'music', text: r.prompt, src: res.src, external: res.external, ts: Date.now() });
      } else {
        const res = await voiceCall(r.prompt);
        replaceById(pid, { id: 'r' + Date.now(), role: 'ai', kind: 'voice', text: r.prompt, src: res.src || null, ts: Date.now() });
      }
    } catch (err) {
      replaceById(pid, { id: 'r' + Date.now(), role: 'ai', kind: 'error', text: String((err && err.message) || err), ts: Date.now() });
    }
    setBusy(false);
  }

  return (
    <div className="wrap">
      <div className="head-row">
        <div>
          <h1>🎛 ИИ-Студия <span className="badge">v1.1 • React + Vite</span></h1>
          <p className="sub">Один чат на всё: текстовые ответы, генерация фото, музыка и голос. Напишите «нарисуй …», «сделай песню …» или «произнеси …» — остальное разберётся само.</p>
        </div>
        <button className="btn theme-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '🌙 Тёмная' : '☀️ Светлая'}
        </button>
      </div>

      <div className="cols">
        <div>
          <div className="card chat-card">
            <div className="msgs" ref={boxRef}>
              {msgs.map(m => <Message key={m.id} m={m} />)}
            </div>
            <div className="inrow">
              <textarea
                id="inp"
                ref={inpRef}
                value={text}
                rows={2}
                placeholder="Спросите что-нибудь — или «нарисуй …», «сделай песню …», «произнеси …» (Enter — отправить, Shift+Enter — перенос)"
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button className="btn primary" onClick={send} disabled={busy}>{busy ? '…' : 'Отправить'}</button>
            </div>
            <CommandHints onPick={prefix => { setText(prefix); if (inpRef.current) inpRef.current.focus(); }} />
          </div>
          <HelpKeys />
        </div>

        <SettingsPanel
          settings={settings}
          update={update}
          onClearHistory={() => {
            if (!msgs.length) return;
            if (window.confirm('Очистить историю чата?')) clear();
          }}
        />
      </div>

      <footer>ИИ-Студия v1.1 • React + Vite, без сервера. Данные: ключи и история — только в localStorage вашего браузера. Сгенерированный контент — продукт сторонних моделей (OpenAI / Anthropic / Google / Replicate).</footer>
    </div>
  );
}
