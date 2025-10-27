'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Question, Choice } from '../../../types/types-cms';

const TYPES: Question['type'][] = [
  'vocab',
  'detail',
  'negative_detail',
  'paraphrasing',
  'insertion',
  'inference',
  'purpose',
  'pronoun_ref',
  'summary',
  'organization',
];

export function QuestionForm({
  passageId,
  setId,
  initial,
  onSaved,
}: {
  passageId: string;
  setId: string;
  initial?: Partial<Question>;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<Partial<Question>>({
    number: initial?.number ?? 1,
    type: initial?.type ?? 'detail',
    stem: initial?.stem ?? '',
    explanation: initial?.explanation ?? '',
    clue_quote: initial?.clue_quote ?? '',
    order_index: initial?.order_index ?? initial?.number ?? 1,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      if (initial?.id) {
        const res = await fetch(`/api/admin/questions/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((j as any).error || 'failed');
      } else {
        const res = await fetch(`/api/admin/passages/${passageId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, set_id: setId }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((j as any).error || 'failed');
      }
      onSaved?.();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-2 border rounded-xl p-3">
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs">No.</label>
          <input
            type="number"
            className="w-full border rounded-lg px-2 py-1"
            value={form.number ?? 1}
            onChange={(e) =>
              setForm((prev: Partial<Question>) => ({
                ...prev,
                number: Number(e.target.value),
              }))
            }
          />
        </div>
        <div>
          <label className="text-xs">Type</label>
          <select
            className="w-full border rounded-lg px-2 py-1"
            value={form.type ?? 'detail'}
            onChange={(e) =>
              setForm((prev: Partial<Question>) => ({
                ...prev,
                type: e.target.value as Question['type'],
              }))
            }
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs">Order</label>
          <input
            type="number"
            className="w-full border rounded-lg px-2 py-1"
            value={form.order_index ?? form.number ?? 1}
            onChange={(e) =>
              setForm((prev: Partial<Question>) => ({
                ...prev,
                order_index: Number(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <textarea
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Stem"
        value={form.stem ?? ''}
        onChange={(e) =>
          setForm((prev: Partial<Question>) => ({ ...prev, stem: e.target.value }))
        }
      />
      <textarea
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Explanation (optional)"
        value={form.explanation ?? ''}
        onChange={(e) =>
          setForm((prev: Partial<Question>) => ({
            ...prev,
            explanation: e.target.value,
          }))
        }
      />
      <textarea
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Clue quote (optional)"
        value={form.clue_quote ?? ''}
        onChange={(e) =>
          setForm((prev: Partial<Question>) => ({
            ...prev,
            clue_quote: e.target.value,
          }))
        }
      />

      <div className="text-right">
        <button
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-60"
        >
          {initial?.id ? 'Update Question' : 'Add Question'}
        </button>
      </div>
    </form>
  );
}

export function ChoiceList({ questionId }: { questionId: string }) {
  const [rows, setRows] = useState<Choice[]>([]);
  const [text, setText] = useState('');
  const [correct, setCorrect] = useState(false);

  const load = useCallback(async () => {
    if (!questionId) return;
    const r = await fetch(`/api/admin/questions/${questionId}/choices`);
    if (!r.ok) return;
    const data = (await r.json()) as unknown;
    setRows(Array.isArray(data) ? (data as Choice[]) : []);
  }, [questionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!text.trim()) return;
    const res = await fetch(`/api/admin/questions/${questionId}/choices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        is_correct: !!correct,
        order_index: rows.length,
      }),
    });
    if (res.ok) {
      setText('');
      setCorrect(false);
      void load();
    }
  };

  const toggle = async (id: string, is_correct: boolean) => {
    const res = await fetch(`/api/admin/choices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_correct: !is_correct }),
    });
    if (res.ok) void load();
  };

  const remove = async (id: string) => {
    if (!confirm('??젣?좉퉴??')) return;
    const res = await fetch(`/api/admin/choices/${id}`, { method: 'DELETE' });
    if (res.ok) void load();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Choice text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="inline-flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={correct}
            onChange={(e) => setCorrect(e.target.checked)}
          />
          Correct
        </label>
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl border text-sm">
          Add
        </button>
      </div>

      <ul className="space-y-1">
        {rows.map((c: Choice) => (
          <li key={c.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <button
              type="button"
              onClick={() => toggle(c.id, !!c.is_correct)}
              className={`text-xs px-2 py-1 rounded ${
                c.is_correct ? 'bg-green-600 text-white' : 'bg-gray-100'
              }`}
              title={c.is_correct ? 'Mark as incorrect' : 'Mark as correct'}
            >
              {c.is_correct ? 'Correct' : 'Mark'}
            </button>
            <span className="flex-1">{c.text}</span>
            <button type="button" onClick={() => remove(c.id)} className="text-xs px-2 py-1 rounded border">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


