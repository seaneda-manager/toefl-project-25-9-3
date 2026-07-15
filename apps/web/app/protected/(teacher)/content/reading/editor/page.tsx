"use client";

import { useMemo, useState } from "react";

type RChoice = {
  id?: string;
  text: string;
  is_correct: boolean;
  order_no: number;
};
type RQuestion = {
  id?: string;
  number: number;
  stem: string;
  choices: RChoice[];
};
type RPassage = {
  id?: string;
  title: string;
  content: string;
  questions: RQuestion[];
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

function newChoice(i: number): RChoice {
  return { id: undefined, text: "", is_correct: i === 0, order_no: i + 1 };
}
function newQuestion(n: number): RQuestion {
  return {
    id: undefined,
    number: n,
    stem: "",
    choices: [0, 1, 2, 3].map(newChoice),
  };
}

export default function ReadingEditorPage() {
  const [model, setModel] = useState<RPassage>({
    id: undefined,
    title: "",
    content: "",
    questions: [newQuestion(1)],
  });
  const [busy, setBusy] = useState(false);

  const total = model.questions.length;

  // validation
  const issues = useMemo(() => {
    const out: string[] = [];
    if (!model.title.trim()) out.push("Please enter a title.");
    if (!model.content.trim()) out.push("Please enter the passage content.");
    model.questions.forEach((q, i) => {
      if (!q.stem.trim())
        out.push(`Q${i + 1}: Please enter the question stem.`);
      if (q.choices.length < 2)
        out.push(`Q${i + 1}: At least 2 choices are required.`);
      const correctCnt = q.choices.filter((c) => c.is_correct).length;
      if (correctCnt < 1 || correctCnt > 3)
        out.push(
          `Q${i + 1}: The number of correct answers must be between 1 and 3.`
        );
      // order_no 연속성 체크
      const ord = [...q.choices.map((c) => c.order_no)].sort((a, b) => a - b);
      if (!ord.every((v, j) => v === j + 1))
        out.push(`Q${i + 1}: choice order must be 1..N without gaps.`);
      q.choices.forEach((c, ci) => {
        if (!c.text.trim())
          out.push(
            `Q${i + 1} Choice ${String.fromCharCode(
              65 + ci
            )}: Please enter the choice text.`
          );
      });
    });
    return out;
  }, [model]);

  const canSave = issues.length === 0;

  const answerKey = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const q of model.questions) {
      const cs = q.choices.filter((x) => x.is_correct && q.id && x.id);
      if (cs.length && q.id) m[q.id] = cs.map((x) => x.id!) as string[];
    }
    return m;
  }, [model]);

  const addQ = () =>
    setModel((p) => ({
      ...p,
      questions: [...p.questions, newQuestion(p.questions.length + 1)],
    }));

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

  // ✅ 다중 정답(최대 3개) 토글
  const toggleCorrect = (qi: number, ci: number) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.slice();

      const next = !ch[ci].is_correct;
      if (next) {
        const currentCnt = ch.filter((c) => c.is_correct).length;
        if (currentCnt >= 3) {
          // 최대 3개 제한
          return p;
        }
      }
      ch[ci] = { ...ch[ci], is_correct: next };
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  const addChoice = (qi: number) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.slice();
      if (ch.length >= 6) return p; // max 6 choices
      ch.push({
        id: undefined,
        text: "",
        is_correct: false,
        order_no: ch.length + 1,
      });
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  const rmChoice = (qi: number, ci: number) =>
    setModel((p) => {
      const qs = p.questions.slice();
      const ch = qs[qi].choices.slice();
      if (ch.length <= 2) return p; // keep at least 2 choices
      const removed = ch.splice(ci, 1)[0];
      // reindex order_no 1..N
      ch.forEach((c, i) => (c.order_no = i + 1));
      // (선택) 모두 해제되어도 저장 검증에서 잡아주므로 자동 보정은 생략
      qs[qi] = { ...qs[qi], choices: ch };
      return { ...p, questions: qs };
    });

  async function saveDraft() {
    if (!canSave) {
      alert("Cannot save: please fix the issues.");
      return;
    }
    setBusy(true);
    try {
      // 서버 스키마에 맞춰 payload 구성
      const payload: { passage: RPassage } = {
        passage: {
          id: model.id,
          title: model.title,
          content: model.content,
          questions: model.questions.map((q) => ({
            id: q.id,
            number: q.number,
            stem: q.stem,
            choices: q.choices.map((c, idx) => ({
              id: c.id,
              text: c.text,
              is_correct: c.is_correct,
              order_no: idx + 1, // 안전하게 순번 보정
            })),
          })),
        },
      };

      const res = await fetch("/api/teacher/reading/editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      alert("Saved!");
      if (data?.result?.passage_id) {
        setModel((m) => ({ ...m, id: data.result.passage_id as string }));
      }
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Reading Editor (A–F, up to 3 correct)
        </h3>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded border"
            onClick={() =>
              setModel({
                id: undefined,
                title: "",
                content: "",
                questions: [newQuestion(1)],
              })
            }
            disabled={busy}
          >
            New
          </button>
          <button
            className="px-3 py-1.5 rounded border"
            onClick={saveDraft}
            disabled={!canSave || busy}
            aria-disabled={!canSave || busy}
            title={canSave ? "Save draft" : "Fix issues before saving"}
          >
            {busy ? "Saving…" : "Save draft"}
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
        {model.questions.map((q, qi) => {
          const correctCount = q.choices.filter((c) => c.is_correct).length;
          return (
            <div
              key={q.id ?? `q-${qi}`}
              className="rounded-xl border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Q{q.number}
                  <span className="ml-2 text-xs rounded px-1.5 py-0.5 border">
                    {correctCount}/3 correct
                  </span>
                </div>
                <div className="space-x-2">
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => rmQ(qi)}
                    disabled={total <= 1 || busy}
                  >
                    Remove
                  </button>
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => addChoice(qi)}
                    disabled={busy}
                  >
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
                    key={c.id ?? `c-${ci}`}
                    className={[
                      "rounded border p-2 flex items-center gap-2",
                      c.is_correct
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300",
                    ].join(" ")}
                  >
                    <span className="w-6 shrink-0 text-xs font-semibold text-gray-500">
                      {String.fromCharCode(65 + ci)}
                    </span>
                    {/* ✅ 다중정답: checkbox */}
                    <input
                      type="checkbox"
                      name={`correct-${q.number}`}
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
                      disabled={q.choices.length <= 2 || busy}
                      title="Remove choice"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button
          className="px-3 py-1.5 rounded border"
          onClick={addQ}
          disabled={busy}
        >
          + Add question
        </button>
      </section>

      <footer className="text-sm text-gray-600">
        Answer key set for {Object.values(answerKey).filter(Boolean).length} of{" "}
        {total}
      </footer>
    </div>
  );
}
