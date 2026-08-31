import React from 'react';
import { webSpeak } from '../api/index.js';
import { looksRU } from '../core/voices.js';

function esc(t) {
  return String(t == null ? '' : t);
}

export default function Message({ m }) {
  const cls = 'msg ' + (m.role === 'user' ? 'user' : 'ai');

  if (m.kind === 'pending') {
    return <div className={cls}><span className="kind-tag">⏳ {m.label || 'Думаю…'}</span></div>;
  }

  if (m.kind === 'image') {
    return (
      <div className={cls}>
        <span className="kind-tag">🖼 {m.role === 'user' ? 'запрос' : 'картинка'}</span>
        {m.text ? <span>{esc(m.text)}</span> : null}
        {m.src && m.src !== 'data:gone' ? (
          <React.Fragment>
            <img className="media" src={m.src} alt={m.text || 'generated'} />
            <div className="cap">
              {m.external
                ? <a href={m.external} target="_blank" rel="noopener">открыть/скачать ↗</a>
                : (String(m.src).indexOf('data:') === 0
                  ? <a href={m.src} download={'ai-studio-image-' + Date.now() + '.png'}>скачать ⬇</a>
                  : <span>(ссылка провайдера может истечь)</span>)}
            </div>
          </React.Fragment>
        ) : (
          <div className="cap">🔒 Изображение не сохраняется между перезапусками (ссылка провайдера истекла) — сгенерируйте заново.</div>
        )}
      </div>
    );
  }

  if (m.kind === 'music') {
    return (
      <div className={cls}>
        <span className="kind-tag">🎵 трек</span>
        {m.text ? <span>{esc(m.text)}</span> : null}
        {m.src && m.src !== 'data:gone'
          ? <audio controls src={m.src} />
          : <div className="cap">🔒 Аудио не сохраняется между перезапусками — сгенерируйте заново.</div>}
      </div>
    );
  }

  if (m.kind === 'voice') {
    return (
      <div className={cls}>
        <span className="kind-tag">🔊 озвучка</span>
        «{esc(m.text)}»
        <div className="row-in">
          {m.src && m.src !== 'data:gone' && String(m.src).indexOf('data:') === 0
            ? <audio controls src={m.src} />
            : <button className="btn mini" onClick={() => { try { webSpeak(m.text, looksRU(m.text) ? 'ru' : 'en'); } catch (e) { /* ignore */ } }}>▶ повторить (голос браузера)</button>}
        </div>
      </div>
    );
  }

  if (m.kind === 'error') {
    return (
      <div className={cls}>
        <span className="kind-tag">⚠️ ошибка</span>
        <div className="err">{esc(m.text)}</div>
        <div className="fix">Проверьте ключ и модель в «Настройки» (справа). Ссылки, где взять ключи — в блоке «🔑 Ключи API» под чатом.</div>
      </div>
    );
  }

  return <div className={cls}>{esc(m.text)}</div>;
}
