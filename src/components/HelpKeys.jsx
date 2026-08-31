import React from 'react';

export default function HelpKeys() {
  return (
    <details className="card help">
      <summary>🔑 Ключи API: где взять и как это работает</summary>
      <div className="help-body">
        <b>Где взять ключи (вставьте в «Настройки» справа — они хранятся только в localStorage этого браузера и никуда не отправляются, кроме самого провайдера):</b>
        <ul>
          <li><b>OpenAI</b> (чат, фото, TTS-голос): <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a> — ключ <code>sk-…</code>. Нужна оплата на аккаунте.</li>
          <li><b>Anthropic / Claude</b> (чат): <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a> — ключ <code>sk-ant-…</code>.</li>
          <li><b>Google Gemini</b> (чат и фото): <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> — ключ <code>AIza…</code>. Есть бесплатный тариф.</li>
          <li><b>Replicate</b> (фото на Flux и музыка MusicGen): <a href="https://replicate.com/api/tokens" target="_blank" rel="noopener">replicate.com/api/tokens</a> — токен <code>r8_…</code>. Есть бесплатные минуты.</li>
        </ul>
        <b>Команды в чате:</b>
        <ul>
          <li>«нарисуй …», «сгенерируй фото …», «изобрази …» — картинка</li>
          <li>«сделай песню …», «сгенерируй музыку …», «напиши трек …» — музыка</li>
          <li>«произнеси …», «озвучь …», «прочитай вслух …» — голос (веб-режим работает без ключей!)</li>
          <li>всё остальное — обычный разговор с LLM</li>
        </ul>
        Фото/музыка/текст генерируют модели провайдеров (OpenAI, Google, Anthropic, Replicate) — это разные модели, результат зависит от провайдера.
      </div>
    </details>
  );
}
