'use client';

import { useMemo, useState } from 'react';

type RChoice = { id: string; text: string; is_correct: boolean };
type RQuestion = { id: string; number: number; stem: string; choices: RChoice[] };
type RPassage = { id: string; title: string; content: string; questions: RQuestion[] };

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

function newChoice(i: number): RChoice {
  return { id: uuid(), text: '', is_correct: i === 0 };
}
function newQuestion(n: number): RQuestion {
  return { id: uuid(), number: n, stem: '', choices: [0, 1, 2, 3].map(newChoice) };
}

export default function ReadingEditorPage() {
  const [model, setModel] = useState<RPassage>({
    id: '',
    title: '',
    content: '',
    questions: [newQuestion(1)],
  });

  const total = model.questions.length;

  // validation
  const issues = useMemo(() => {
    const out: string[] = [];
    if (!model.title.trim()) out.push('Please enter a title.');
    if (!model.content.trim()) out.push('Please enter the passage content.');
    model.questions.forEach((q, i) => {
      if (!q.stem.trim()) out.push(`Q${i + 1}: Please enter the question stem.`);
      if (q.choices.length < 2) out.push(`Q${i + 1}: At least 2 choices are required.`);
      const correctCnt = q.choices.filter((c) => c.is_correct).length;
      if (correctCnt !== 1) out.push(`Q${i + 1}: Exactly one correct answer is required.`);
      q.choices.forEach((c, ci) => {
        if (!c.text.trim()) out.push(`Q${i + 1} Choice ${String.fromCharCode(65 + ci)}: Please enter the choice text.`);
      });
    });
    return out;
  }, [model]);

  const canSave = issues.length === 0;

  const answerKey = useMemo(() => {
    const m: Record<string, string> = {};
    for (const q of model.questions) {
      const c = q.choices.find((x) => x.is_correct);
      if (c) m[q.id] = c.id;
    }
    return m;
  }, [model]);

  const addQ = () =>
    setModel((p) => ({ ...p, questions: [...p.questions, newQuestion(p.questions.length + 1)] }));

  const rmQ = (qi: number) =>
    setModel((p) => {
      if (p.questions.length <= 1) return p; // keep at least 1 question
      const qs = p.questions.slice();
      qs.splice(qi, 1);
      qs.forEach((q, i) => (q.number = i + 1));
      return { ...p, questions: qs };
    });

  const setQ = (qi: number, patch: Partial<RQuestion>) =>
    setModel((p) => {
      const qs = p.questions.slice();
      qs[qi] = { ...qs[qi], ...patch };
      return { ...p, questions: qs };
    });

  const setC = (qi: number, ci: number, patch: Partial<RChoice>) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.slice();
      ch[ci] = { ...ch[ci], ...patch };
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  const toggleCorrect = (qi: number, ci: number) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.map((c, i) => ({ ...c, is_correct: i === ci }));
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  const addChoice = (qi: number) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.slice();
      if (ch.length >= 6) return p; // max 6 choices
      ch.push({ id: uuid(), text: '', is_correct: false });
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  const rmChoice = (qi: number, ci: number) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.slice();
      if (ch.length <= 2) return p; // keep at least 2 choices
      const removed = ch.splice(ci, 1)[0];
      // if removed was correct and none is correct now, set first as correct
      if (removed.is_correct && !ch.some((c) => c.is_correct)) ch[0].is_correct = true;
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  async function saveDraft() {
    if (!canSave) {
      alert('Cannot save: please fix the issues.');
      return;
    }
    // TODO: connect to route handler to upsert
    console.log('[SAVE DRAFT]', model);
    alert('Temp save complete (console logged). Connect API next.');
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Reading Editor</h3>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded border"
            onClick={() => setModel({ id: '', title: '', content: '', questions: [newQuestion(1)] })}
          >
            New
          </button>
          <button
            className="px-3 py-1.5 rounded border"
            onClick={saveDraft}
            disabled={!canSave}
            aria-disabled={!canSave}
            title={canSave ? 'Save draft' : 'Fix issues before saving'}
          >
            Save draft
          </button>
        </div>
      </header>

      {issues.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
          <div className="font-medium mb-1">Please check the following:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {issues.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-2">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Title"
          value={model.title}
          onChange={(e) => setModel((m) => ({ ...m, title: e.target.value }))}
        />
        <textarea
          className="w-full rounded border px-3 py-2 h-40"
          placeholder="Passage content"
          value={model.content}
          onChange={(e) => setModel((m) => ({ ...m, content: e.target.value }))}
        />
      </section>

      <section className="space-y-4">
        {model.questions.map((q, qi) => (
          <div key={q.id} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Q{q.number}</div>
              <div className="space-x-2">
                <button className="px-2 py-1 rounded border" onClick={() => rmQ(qi)} disabled={total <= 1}>
                  Remove
                </button>
                <button className="px-2 py-1 rounded border" onClick={() => addChoice(qi)}>
                  + Choice
                </button>
              </div>
            </div>

            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Question stem"
              value={q.stem}
              onChange={(e) => setQ(qi, { stem: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {q.choices.map((c, ci) => (
                <div
                  key={c.id}
                  className={[
                    'rounded border p-2 flex items-center gap-2',
                    c.is_correct ? 'border-green-500 bg-green-50' : 'border-gray-300',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={c.is_correct}
                    onChange={() => toggleCorrect(qi, ci)}
                    title="Mark as correct"
                  />
                  <input
                    className="flex-1 rounded border px-2 py-1"
                    placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                    value={c.text}
                    onChange={(e) => setC(qi, ci, { text: e.target.value })}
                  />
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => rmChoice(qi, ci)}
                    disabled={q.choices.length <= 2}
                    title="Remove choice"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="px-3 py-1.5 rounded border" onClick={addQ}>
          + Add question
        </button>
      </section>

      <footer className="text-sm text-gray-600">
        Answer key: {Object.values(answerKey).filter(Boolean).length} of {total} set
      </footer>
    </div>
  );
}


