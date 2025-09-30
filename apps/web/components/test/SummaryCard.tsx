'use client';
import React, { useMemo, useCallback } from 'react';

type Choice = { id: string; text: string };

export default function SummaryCard({
  maxSelect = 3,
  choices,
  selectedIds,
  onChange,
}: {
  maxSelect?: number;
  choices: Choice[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  // 1) 빠른 조회용 Set
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);

  // 4) 콜백 메모
  const toggle = useCallback((id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= maxSelect) return;
      onChange([...selectedIds, id]);
    }
  }, [maxSelect, onChange, selectedIds, selectedSet]);

  const removeAt = useCallback((slot: number) => {
    if (!selectedIds[slot]) return;
    onChange(selectedIds.filter((_, i) => i !== slot));
  }, [onChange, selectedIds]);

  return (
    <div className="space-y-3">
      {/* Selected slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {Array.from({ length: maxSelect }).map((_, i) => (
          <div
            key={i}
            className="rounded border p-3 min-h-[56px] flex items-center justify-between"
            role="group"
            aria-label={`Selected slot ${i + 1}`}
          >
            <span className="text-sm">
              {selectedIds[i]
                ? choices.find((c) => c.id === selectedIds[i])?.text
                : <span className="text-gray-400">Drop here (or click below)</span>}
            </span>
            {selectedIds[i] && (
              <button
                className="text-xs underline"
                onClick={() => removeAt(i)}
                aria-label={`Remove selection in slot ${i + 1}`}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Choice chips */}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const active = isSelected(c.id);
          const disabled = !active && selectedIds.length >= maxSelect;
          const title = active
            ? 'Selected — click to remove'
            : disabled
              ? 'Reached maximum selections'
              : 'Select';

          return (
            <button
              key={c.id}
              className={[
                'rounded-full border px-3 py-1 text-sm',
                active ? 'bg-black text-white border-black' : 'bg-white border-gray-300',
                disabled ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
              onClick={() => toggle(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(c.id);
                }
              }}
              disabled={disabled}
              aria-disabled={disabled}
              aria-pressed={active}
              title={title}
            >
              {c.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
