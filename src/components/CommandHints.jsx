import React from 'react';

const HINTS = [
  ['💬 спросите что угодно', 'Расскажи про '],
  ['🖼 нарисуй …', 'нарисуй '],
  ['🎵 сделай песню …', 'сделай песню '],
  ['🔊 произнеси …', 'произнеси ']
];

export default function CommandHints({ onPick }) {
  return (
    <div className="hints">
      {HINTS.map(h => (
        <span key={h[1]} className="chip" onClick={() => onPick(h[1])}>{h[0]}</span>
      ))}
    </div>
  );
}
