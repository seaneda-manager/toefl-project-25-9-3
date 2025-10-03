'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readingSetSchema } from '@/lib/readingSchema';
import type { RSet, RQuestion, RChoice, RQType } from '@/types/types-reading';

type Props = {
  initialJson: string;
  defaultSetId: string;
  // 서버에서 내려준 액션 (Client에서 직접 import 금지)
  onSave: (fd: FormData) => Promise<{ ok: true; id: string }>;
};

type LintIssue = { level: 'error' | 'warn'; where: string; msg: string };

// ---- util: passage 단락 분리 & 린트 ----
function splitParagraphs(content: string, mode: 'auto' | 'blankline' | 'html' = 'auto') {
  if (!content) return [];
  if (mode === 'html') {
    return content
      .split(/<\/p>|<\/div>/i)
      .map((s) => s.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
  }
  // default: 빈 줄 기준
  return content.split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean);
}

function lintReadingSet(set: RSet): LintIssue[] {
  const issues: LintIssue[] = [];
  const p0 = set.passages[0];
  if (!p0) {
    issues.push({ level: 'error', where: 'set.passages', msg: '최소 1개 passage 필요' });
    return issues;
  }
  const paras = splitParagraphs(p0.content, (p0.ui?.paragraphSplit as any) ?? 'auto');

  (p0.questions || []).forEach((q, qi) => {
    const where = `Q${q.number}(${q.type})`;

    // 번호 연속성(경고)
    if (q.number !== qi + 1) {
      issues.push({
        level: 'warn',
        where,
        msg: `문항 번호가 연속적이지 않음: 기대 ${qi + 1}, 현재 ${q.number}`,
      });
    }

    // 보기
    if (!q.choices?.length) issues.push({ level: 'error', where, msg: '보기 없음' });
    q.choices?.forEach((c, ci) => {
      if (!c.text?.trim()) issues.push({ level: 'warn', where, msg: `보기 #${ci + 1} 빈 텍스트` });
    });

    // 유형별 체크
    if (q.type === 'summary') {
      const s = q.meta?.summary;
      const cand = s?.candidates ?? [];
      const cor = s?.correct ?? [];
      const sel = Number.isFinite(s?.selectionCount) ? (s!.selectionCount as number) : NaN;
      if (cand.length === 0) issues.push({ level: 'error', where, msg: 'summary.candidates 비어있음' });
      if (!Number.isFinite(sel) || sel < 1)
        issues.push({ level: 'error', where, msg: 'summary.selectionCount 유효하지 않음' });
      if (cor.length !== sel)
        issues.push({
          level: 'error',
          where,
          msg: `summary.correct 개수(${cor.length}) ≠ selectionCount(${sel || 'NaN'})`,
        });
      if (cor.some((i) => i < 0 || i >= cand.length))
        issues.push({ level: 'error', where, msg: 'summary.correct 인덱스 범위 초과' });
    } else if (q.type === 'insertion') {
      const ins = q.meta?.insertion;
      if (!ins?.anchors?.length)
        issues.push({ level: 'error', where, msg: 'insertion.anchors 비어있음' });
      if (ins && (ins.correctIndex! < 0 || ins.correctIndex! >= ins.anchors.length)) {
        issues.push({ level: 'error', where, msg: 'insertion.correctIndex 범위 초과' });
      }
    } else if (q.type === 'pronoun_ref') {
      const pr = q.meta?.pronoun_ref;
      if (!pr?.pronoun) issues.push({ level: 'warn', where, msg: 'pronoun_ref.pronoun 비어있음' });
      if (!pr?.referents?.length)
        issues.push({ level: 'error', where, msg: 'pronoun_ref.referents 비어있음' });
      if (pr && (pr.correctIndex! < 0 || pr.correctIndex! >= pr.referents.length)) {
        issues.push({ level: 'error', where, msg: 'pronoun_ref.correctIndex 범위 초과' });
      }
    }

    // 하이라이트 범위
    const ph = q.meta?.paragraph_highlight?.paragraphs ?? [];
    if (ph.some((i) => i < 0 || i >= paras.length)) {
      issues.push({
        level: 'error',
        where,
        msg: `paragraph_highlight 인덱스 범위 초과 (단락수 ${paras.length})`,
      });
    }

    // summary 외 유형: 정답 정확히 1개
    if (q.type !== 'summary') {
      const cs = (q.choices || []).filter((c) => c.is_correct);
      if (cs.length !== 1) {
        issues.push({ level: 'error', where, msg: `정답 개수 ${cs.length}개 (1개여야 함)` });
      }
    }
  });

  return issues;
}

export default function AdminReadingEditor({ initialJson, defaultSetId, onSave }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'json' | 'form'>('json');
  const [text, setText] = useState(initialJson);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const parsed: RSet | null = useMemo(() => {
    try {
      const obj = JSON.parse(text);
      return readingSetSchema.parse(obj) as RSet;
    } catch {
      return null;
    }
  }, [text]);

  const setId = parsed?.id ?? defaultSetId;

  const validate = useCallback(() => {
    try {
      const obj = JSON.parse(text);
      readingSetSchema.parse(obj);
      setErr(null);
      setMsg('✅ JSON valid.');
    } catch (e: any) {
      setMsg(null);
      setErr(e?.message || 'Invalid JSON.');
    }
  }, [text]);

  const deepCheck = useCallback(() => {
    try {
      const obj = JSON.parse(text);
      const ok = readingSetSchema.parse(obj) as RSet;
      const issues = lintReadingSet(ok);
      if (issues.length === 0) setMsg('✅ Deep Check: 문제 없음');
      else {
        const lines = issues.map((i) => `${i.level.toUpperCase()} | ${i.where} | ${i.msg}`).join('\n');
        setErr(`Deep Check 결과\n${lines}`);
      }
    } catch (e: any) {
      setErr('Deep Check 실패: ' + (e?.message || 'invalid json'));
    }
  }, [text]);

  const save = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMsg(null);
      setErr(null);
      try {
        // 유효성 미리 확인
        const obj = JSON.parse(text);
        readingSetSchema.parse(obj);

        const fd = new FormData();
        fd.set('json', JSON.stringify(obj));
        const r = await onSave(fd);
        setMsg(`✅ Saved: ${r.id}`);
        // 저장 후 같은 setId로 유지
        router.replace(`/reading/admin?setId=${encodeURIComponent(r.id)}`);
      } catch (e: any) {
        setErr(e?.message || 'Save failed.');
      }
    },
    [text, onSave, router]
  );

  const openTest = useCallback(() => {
    window.open(
      `/reading/test?setId=${encodeURIComponent(setId)}&mode=test&debug=1`,
      '_blank',
      'width=1200,height=800'
    );
  }, [setId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">
          Set ID: <b>{setId}</b>
        </div>
        <div className="flex gap-2">
          <button
            className={`rounded border px-3 py-1 ${tab === 'json' ? 'bg-white/10' : ''}`}
            onClick={() => setTab('json')}
          >
            JSON
          </button>
          <button
            className={`rounded border px-3 py-1 ${tab === 'form' ? 'bg-white/10' : ''}`}
            onClick={() => setTab('form')}
          >
            Form (beta)
          </button>
        </div>
      </div>

      {/* 액션바 */}
      <div className="flex flex-wrap gap-2">
        <button className="rounded border px-3 py-1" onClick={validate}>
          Validate
        </button>
        <button className="rounded border px-3 py-1" onClick={deepCheck}>
          Deep Check
        </button>
        <button className="rounded border px-3 py-1" onClick={openTest}>
          Open Test Window
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-green-300">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300 whitespace-pre-wrap">
          {err}
        </div>
      )}

      {/* JSON 탭 */}
      {tab === 'json' && (
        <form onSubmit={save} className="space-y-3">
          <textarea
            className="w-full h-[60vh] rounded-xl border p-3 font-mono text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded border px-4 py-2">
              Save
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2"
              onClick={() => setText(JSON.stringify(makeMinimalSet(setId), null, 2))}
            >
              New minimal template
            </button>
          </div>
        </form>
      )}

      {/* FORM 탭 — 공통 + 유형별 (MVP) */}
      {tab === 'form' &&
        (parsed ? (
          <FormEditor parsed={parsed} setText={setText} />
        ) : (
          <div className="text-sm text-red-400">
            JSON이 유효해야 Form 편집을 사용할 수 있어요. 먼저 JSON 탭에서 Validate 해주세요.
          </div>
        ))}
    </div>
  );
}

/** ---------- Helpers ---------- */
function makeMinimalSet(id: string): RSet {
  return {
    id,
    label: 'New Reading Set',
    source: '',
    version: 1,
    passages: [
      {
        id: crypto.randomUUID(),
        title: 'Untitled Passage',
        content: 'Write your passage here...',
        ui: { paragraphSplit: 'auto' },
        questions: [],
      },
    ],
  };
}

/** ---------- Simple Form Editor (MVP) ---------- */
function FormEditor({ parsed, setText }: { parsed: RSet; setText: (s: string) => void }) {
  const [draft, setDraft] = useState<RSet>(parsed);

  const sync = () => setText(JSON.stringify(draft, null, 2));

  const setPassageField = (k: keyof RSet['passages'][number], v: any, idx = 0) => {
    const next = { ...draft };
    next.passages = draft.passages.map((p, i) => (i === idx ? { ...p, [k]: v } : p));
    setDraft(next);
  };

  const addQuestion = () => {
    const q: RQuestion = {
      id: crypto.randomUUID(),
      number: (draft.passages[0]?.questions?.length ?? 0) + 1,
      type: 'detail',
      stem: 'Write the stem…',
      choices: [
        { id: crypto.randomUUID(), text: 'Choice A' },
        { id: crypto.randomUUID(), text: 'Choice B' },
        { id: crypto.randomUUID(), text: 'Choice C' },
        { id: crypto.randomUUID(), text: 'Choice D' },
      ],
      meta: {},
    };
    const next = { ...draft };
    next.passages = draft.passages.map((p, i) =>
      i === 0 ? { ...p, questions: [...(p.questions || []), q] } : p
    );
    setDraft(next);
  };

  const updateQuestion = (i: number, patch: Partial<RQuestion>) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    qs[i] = { ...qs[i], ...patch };
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  const setCorrect = (qi: number, ci: number) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.choices = q.choices.map((c, i) => ({ ...c, is_correct: i === ci }));
    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  const setChoiceText = (qi: number, ci: number, text: string) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.choices = q.choices.map((c, i) => (i === ci ? { ...c, text } : c));
    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  const addChoice = (qi: number) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.choices = [...q.choices, { id: crypto.randomUUID(), text: 'New choice' } as RChoice];
    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  const setType = (qi: number, t: RQType) => updateQuestion(qi, { type: t });

  // ---- 유형별 메타 (요약/인서션/대명사 등) ----

  // ✅ summary: selectionCount만 바꿔도 candidates/correct를 항상 채워서 타입 에러 방지
  const setSummarySelection = (qi: number, n: number) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };

    const prev = (q.meta?.summary ?? {}) as {
      candidates?: string[];
      correct?: number[];
      selectionCount?: number;
    };

    q.meta = {
      ...(q.meta || {}),
      summary: {
        candidates: Array.isArray(prev.candidates) ? prev.candidates : [],
        correct: Array.isArray(prev.correct) ? prev.correct : [],
        selectionCount: Math.max(1, Number.isFinite(n) ? n : 2),
      },
    };

    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  // 후보 문장 편집 (줄바꿈 또는 | 구분)
  const setSummaryCandidates = (qi: number, raw: string) => {
    const candidates = raw
      .split(/\r?\n|\|/g)
      .map((s) => s.trim())
      .filter(Boolean);

    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    const prevSel = Number(q.meta?.summary?.selectionCount ?? 2) || 2;

    q.meta = {
      ...(q.meta || {}),
      summary: {
        candidates,
        correct: Array.isArray(q.meta?.summary?.correct) ? q.meta!.summary!.correct! : [],
        selectionCount: Math.max(1, prevSel),
      },
    };

    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  // 정답 인덱스 편집 (1-based 입력 → 0-based로 저장)
  const setSummaryCorrect = (qi: number, raw: string) => {
    const correct = raw
      .split(/\D+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => Math.max(0, (parseInt(v, 10) || 0) - 1));

    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };

    const prevCandidates = Array.isArray(q.meta?.summary?.candidates)
      ? q.meta!.summary!.candidates!
      : [];
    const prevSel = Number(q.meta?.summary?.selectionCount ?? 2) || 2;

    q.meta = {
      ...(q.meta || {}),
      summary: {
        candidates: prevCandidates,
        correct,
        selectionCount: Math.max(1, prevSel),
      },
    };

    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  // insertion
  const setInsertionAnchors = (qi: number, anchorsCsv: string) => {
    const anchors = anchorsCsv.split('|').map((s) => s.trim()).filter(Boolean);
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.meta = {
      ...(q.meta || {}),
      insertion: {
        ...(q.meta?.insertion || {}),
        anchors,
        correctIndex: q.meta?.insertion?.correctIndex ?? 0,
      },
    };
    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  // pronoun_ref
  const setPronounRef = (
    qi: number,
    pronoun: string,
    referentsCsv: string,
    correctIndex: number
  ) => {
    const referents = referentsCsv.split('|').map((s) => s.trim()).filter(Boolean);
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.meta = {
      ...(q.meta || {}),
      pronoun_ref: {
        pronoun,
        referents,
        correctIndex: Math.max(0, correctIndex | 0),
      },
    };
    qs[qi] = q;
    setDraft({ ...draft, passages: [{ ...p0, questions: qs }] });
  };

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-neutral-500">Set Label</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Source</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={draft.source || ''}
              onChange={(e) => setDraft({ ...draft, source: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Version</label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={draft.version ?? 1}
              onChange={(e) => setDraft({ ...draft, version: Number(e.target.value) || 1 })}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-neutral-500">Passage Title</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={draft.passages[0]?.title || ''}
            onChange={(e) => setPassageField('title', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-neutral-500">Passage Content</label>
          <textarea
            className="mt-1 h-40 w-full rounded border px-3 py-2 font-mono text-sm"
            value={draft.passages[0]?.content || ''}
            onChange={(e) => setPassageField('content', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Questions</h3>
        <button className="rounded border px-3 py-1" onClick={addQuestion}>
          + Add Question
        </button>
      </div>

      <div className="space-y-4">
        {(draft.passages[0]?.questions || []).map((q, qi) => (
          <div key={q.id} className="rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="text-sm text-neutral-500">Q{q.number}</div>
              <select
                className="rounded border px-2 py-1"
                value={q.type}
                onChange={(e) => setType(qi, e.target.value as RQType)}
              >
                {[
                  'vocab',
                  'detail',
                  'negative_detail',
                  'paraphrasing',
                  'inference',
                  'purpose',
                  'pronoun_ref',
                  'insertion',
                  'summary',
                  'organization',
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <input
              className="mt-2 w-full rounded border px-3 py-2"
              value={q.stem}
              onChange={(e) => updateQuestion(qi, { stem: e.target.value })}
            />

            {/* 유형별 메타 (MVP) */}
            {q.type === 'summary' && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">selectionCount</span>
                  <input
                    type="number"
                    className="w-20 rounded border px-2 py-1"
                    value={q.meta?.summary?.selectionCount ?? 2}
                    onChange={(e) => setSummarySelection(qi, Number(e.target.value))}
                  />
                </div>
                <div>
                  <div className="text-neutral-500 mb-1">candidates (줄바꿈 또는 | 로 구분)</div>
                  <textarea
                    className="w-full rounded border px-3 py-2 font-mono"
                    rows={4}
                    value={(q.meta?.summary?.candidates || []).join('\n')}
                    onChange={(e) => setSummaryCandidates(qi, e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-neutral-500 mb-1">correct (정답 인덱스 1-based, 예: 1|3|4)</div>
                  <input
                    className="w-full rounded border px-3 py-2 font-mono"
                    value={(q.meta?.summary?.correct || []).map((i) => i + 1).join('|')}
                    onChange={(e) => setSummaryCorrect(qi, e.target.value)}
                  />
                </div>
              </div>
            )}

            {q.type === 'insertion' && (
              <div className="mt-2 text-sm">
                <div className="text-neutral-500 mb-1">anchors ( | 로 구분 )</div>
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="ex) [A] | [B] | [C] | [D]"
                  value={(q.meta?.insertion?.anchors || []).join(' | ')}
                  onChange={(e) => setInsertionAnchors(qi, e.target.value)}
                />
              </div>
            )}

            {q.type === 'pronoun_ref' && (
              <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
                <input
                  className="rounded border px-3 py-2"
                  placeholder="pronoun (it / they ...)"
                  value={q.meta?.pronoun_ref?.pronoun || ''}
                  onChange={(e) =>
                    setPronounRef(
                      qi,
                      e.target.value,
                      (q.meta?.pronoun_ref?.referents || []).join(' | '),
                      q.meta?.pronoun_ref?.correctIndex ?? 0
                    )
                  }
                />
                <input
                  className="rounded border px-3 py-2 md:col-span-2"
                  placeholder="referents ( | 로 구분 )"
                  value={(q.meta?.pronoun_ref?.referents || []).join(' | ')}
                  onChange={(e) =>
                    setPronounRef(
                      qi,
                      q.meta?.pronoun_ref?.pronoun || '',
                      e.target.value,
                      q.meta?.pronoun_ref?.correctIndex ?? 0
                    )
                  }
                />
              </div>
            )}

            <div className="mt-3">
              <div className="text-sm text-neutral-500 mb-1">Choices</div>
              <ul className="space-y-2">
                {q.choices.map((c, ci) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded border px-3 py-2"
                      value={c.text}
                      onChange={(e) => setChoiceText(qi, ci, e.target.value)}
                    />
                    <label className="text-sm flex items-center gap-1">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={!!c.is_correct}
                        onChange={() => setCorrect(qi, ci)}
                      />
                      correct
                    </label>
                  </li>
                ))}
              </ul>
              <button className="mt-2 rounded border px-3 py-1" onClick={() => addChoice(qi)}>
                + Add choice
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="rounded border px-3 py-2" onClick={sync}>
          Apply to JSON
        </button>
        <div className="text-xs text-neutral-500">※ Apply를 누르면 JSON 탭에 반영되어 저장 가능</div>
      </div>
    </div>
  );
}
