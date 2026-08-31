import React from 'react';
import { SETSPEC, SUGG } from '../config.js';

export default function SettingsPanel({ settings, update, onClearHistory }) {
  return (
    <aside className="card set-col">
      <h3>⚙️ Настройки</h3>
      <div>
        {SETSPEC.map((f, i) => {
          if (f.s) return <div className="set-group" key={'s' + i}>{f.s}</div>;
          const val = settings[f.k] != null ? settings[f.k] : '';
          let input;
          if (f.t === 'select') {
            input = (
              <select value={val} onChange={e => update(f.k, e.target.value)}>
                {f.opts.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
              </select>
            );
          } else if (f.t === 'model') {
            input = (
              <React.Fragment>
                <input type="text" value={val} placeholder={(SUGG[f.k] || []).slice(0, 2).join(' / ')}
                  list={'dl_' + f.k} onChange={e => update(f.k, e.target.value)} />
                <datalist id={'dl_' + f.k}>
                  {(SUGG[f.k] || []).map(v => <option key={v} value={v} />)}
                </datalist>
              </React.Fragment>
            );
          } else {
            input = (
              <input type={f.t === 'pass' ? 'password' : 'text'} value={val} autoComplete="off"
                onChange={e => update(f.k, e.target.value)} />
            );
          }
          return (
            <div className="set-row" key={f.k}>
              <label>{f.label}</label>
              {input}
              {f.hint ? <div className="set-note">{f.hint}</div> : null}
            </div>
          );
        })}
      </div>
      <div className="set-note">Ключи не покидают ваш браузер: запросы идут напрямую к выбранному провайдеру. Пустое поле = провайдер выключен.</div>
      <button className="btn mini" style={{ marginTop: 10 }} onClick={onClearHistory}>🗑 Очистить историю чата</button>
    </aside>
  );
}
