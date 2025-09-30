'use client';
import React, { useState } from 'react';

export default function ChoiceList({
  name,
  choices,
  selectedId,
  onSelect,
  negativeBadge, // Negative Detail(EXCEPT) 媛뺤“
}: {
  name: string;
  choices: { id: string; text: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  negativeBadge?: boolean;
}) {
  // 媛꾨떒 ?뚭굅 湲곕뒫(?ㅽ듃?쇱씠??
  const [strikes, setStrikes] = useState<Record<string, boolean>>({});

  const toggleStrike = (id: string) =>
    setStrikes((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-2">
      {negativeBadge && (
        <div className="inline-flex items-center text-xs rounded border border-rose-400 bg-rose-50 text-rose-700 px-2 py-0.5">
          EXCEPT
        </div>
      )}
      {choices.map((c, i) => {
        const picked = selectedId === c.id;
        const striked = strikes[c.id];
        return (
          <div
            key={c.id}
            className={[
              'rounded border p-2 flex items-start gap-2',
              picked ? 'border-black' : 'border-gray-300',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              className="mt-1"
              checked={picked}
              onChange={() => onSelect(c.id)}
            />
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <span className="font-mono">{String.fromCharCode(65 + i)}.</span>
                <p className={striked ? 'line-through text-gray-400' : ''}>{c.text}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleStrike(c.id)}
                className="mt-1 text-xs text-gray-500 underline"
              >
                {striked ? 'Undo strike' : 'Strike out'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

