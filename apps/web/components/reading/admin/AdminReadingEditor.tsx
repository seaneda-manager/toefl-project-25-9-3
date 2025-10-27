// apps/web/components/reading/admin/AdminReadingEditor.tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// ?ㅽ궎留?寃쎈줈 二쇱쓽(?쒕쾭/?대씪?댁뼵?몄뿉???숈씪 import ?ъ슜)
import { readingSetSchema } from '@/models/reading/zod';

import type { RSet, RQuestion, RChoice, RPassage } from '@/models/reading/zod';
type RQType = RQuestion['type'];

type Props = {
  initialJson: string;
  defaultSetId: string;
  // ?쒕쾭?먯꽌 ?대젮以 ?≪뀡 (Client?먯꽌 吏곸젒 import 湲덉?)
  onSave: (fd: FormData) => Promise<{ ok: true; id: string }>;
};

type LintIssue = { level: 'error' | 'warn'; where: string; msg: string };

/* ------------------------------ util ------------------------------ */
function splitParagraphs(content: string, mode: 'auto' | 'blankline' | 'html' = 'auto') {
  if (!content) return [];
  if (mode === 'html') {
    return content
      .split(/<\/p>|<\/div>/i)
      .map((s) => s.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
  }
  // default: ??以?怨듬갚 湲곗?
  return content.split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean);
}

/** meta ?덉쟾 ?묎렐???꾪빐 any ?섑띁 ?앹꽦 */
function metaView(q: RQuestion) {
  const m = (q.meta ?? {}) as any;
  return {
    summary: (m.summary ?? {}) as {
      candidates?: string[];
      correct?: number[];
      selectionCount?: number;
    },
    insertion: (m.insertion ?? {}) as {
      anchors?: (string | number)[];
      correctIndex?: number;
    },
    pronoun_ref: (m.pronoun_ref ?? {}) as {
      pronoun?: string;
      referents?: string[];
      correctIndex?: number;
    },
    paragraph_highlight: (m.paragraph_highlight ?? {}) as {
      paragraphs?: number[];
    },
  };
}

function lintReadingSet(set: RSet): LintIssue[] {
  const issues: LintIssue[] = [];
  const p0 = set.passages[0];
  if (!p0) {
    issues.push({ level: 'error', where: 'set.passages', msg: '理쒖냼 1媛?passage ?꾩슂' });
    return issues;
  }
  const paras = splitParagraphs(p0.content, (p0.ui as any)?.paragraphSplit ?? 'auto');

  (p0.questions || []).forEach((q, qi) => {
    const where = `Q${q.number}(${q.type})`;
    const m = metaView(q);

    // 踰덊샇 ?곗냽??寃쎄퀬)
    if (q.number !== qi + 1) {
      issues.push({
        level: 'warn',
        where,
        msg: `臾명빆 踰덊샇媛 ?곗냽?곸씠吏 ?딆쓬: 湲곕? ${qi + 1}, ?꾩옱 ${q.number}`,
      });
    }

    // 蹂닿린
    if (!q.choices?.length) issues.push({ level: 'error', where, msg: '蹂닿린 ?놁쓬' });
    q.choices?.forEach((c, ci) => {
      if (!c.text?.trim()) issues.push({ level: 'warn', where, msg: `蹂닿린 #${ci + 1} ?띿뒪???놁쓬` });
    });

    // ?좏삎蹂?泥댄겕
    if (q.type === 'summary') {
      const cand = m.summary.candidates ?? [];
      const cor = m.summary.correct ?? [];
      const sel = Number.isFinite(m.summary.selectionCount)
        ? (m.summary.selectionCount as number)
        : NaN;

      if (cand.length === 0) issues.push({ level: 'error', where, msg: 'summary.candidates 鍮꾩뼱 ?덉쓬' });
      if (!Number.isFinite(sel) || sel < 1)
        issues.push({ level: 'error', where, msg: 'summary.selectionCount 媛믪씠 ?좏슚?섏? ?딆쓬' });
      if (cor.length !== sel)
        issues.push({
          level: 'error',
          where,
          msg: `summary.correct 媛쒖닔(${cor.length}) ??selectionCount(${Number.isNaN(sel) ? 'NaN' : sel})`,
        });
      if (cor.some((i) => i < 0 || i >= cand.length))
        issues.push({ level: 'error', where, msg: 'summary.correct ?몃뜳??踰붿쐞 珥덇낵' });
    } else if (q.type === 'insertion') {
      const ins = m.insertion;
      const anchorsLen = ins.anchors?.length ?? 0;
      if (!anchorsLen) issues.push({ level: 'error', where, msg: 'insertion.anchors 鍮꾩뼱 ?덉쓬' });
      if (ins && (ins.correctIndex! < 0 || ins.correctIndex! >= anchorsLen)) {
        issues.push({ level: 'error', where, msg: 'insertion.correctIndex 踰붿쐞 珥덇낵' });
      }
    } else if (q.type === 'pronoun_ref') {
      const pr = m.pronoun_ref;
      if (!pr?.pronoun) issues.push({ level: 'warn', where, msg: 'pronoun_ref.pronoun 鍮꾩뼱 ?덉쓬' });
      const refLen = pr?.referents?.length ?? 0;
      if (!refLen) issues.push({ level: 'error', where, msg: 'pronoun_ref.referents 鍮꾩뼱 ?덉쓬' });
      if (pr && (pr.correctIndex! < 0 || pr.correctIndex! >= refLen)) {
        issues.push({ level: 'error', where, msg: 'pronoun_ref.correctIndex 踰붿쐞 珥덇낵' });
      }
    }

    // ?섏씠?쇱씠???몃뜳??踰붿쐞
    const ph = m.paragraph_highlight.paragraphs ?? [];
    if (ph.some((i) => i < 0 || i >= paras.length)) {
      issues.push({
        level: 'error',
        where,
        msg: `paragraph_highlight ?몃뜳??踰붿쐞 珥덇낵 (臾몃떒 ??${paras.length})`,
      });
    }

    // summary ???좏삎: ?뺣떟 ?뺥솗??1媛?
    if (q.type !== 'summary') {
      const cs = (q.choices || []).filter((c) => c.is_correct);
      if (cs.length !== 1) {
        issues.push({ level: 'error', where, msg: `?뺣떟 媛쒖닔 ${cs.length}媛?1媛쒖뿬????` });
      }
    }
  });

  return issues;
}

/* ------------------------------ component ------------------------------ */
export default function AdminReadingEditor({ initialJson, defaultSetId, onSave }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'json' | 'form'>('json');
  const [text, setText] = useState(initialJson);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // schema ??RSet 蹂??寃쎄퀬 TS2352 諛⑹?: unknown 寃쎌쑀)
  const parsed: RSet | null = useMemo(() => {
    try {
      const obj = JSON.parse(text);
      const z = readingSetSchema.parse(obj) as unknown as RSet;
      return z;
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
      setMsg('??JSON valid.');
    } catch (e: any) {
      setMsg(null);
      setErr(e?.message || 'Invalid JSON.');
    }
  }, [text]);

  const deepCheck = useCallback(() => {
    try {
      const obj = JSON.parse(text);
      const ok = readingSetSchema.parse(obj) as unknown as RSet;
      const issues = lintReadingSet(ok);
      if (issues.length === 0) setMsg('??Deep Check: 臾몄젣 ?놁쓬');
      else {
        const lines = issues.map((i) => `${i.level.toUpperCase()} | ${i.where} | ${i.msg}`).join('\n');
        setErr(`Deep Check 寃곌낵\n${lines}`);
      }
    } catch (e: any) {
      setErr('Deep Check ?ㅽ뙣: ' + (e?.message || 'invalid json'));
    }
  }, [text]);

  const save = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMsg(null);
      setErr(null);
      try {
        // ?좏슚??誘몃━ ?뺤씤
        const obj = JSON.parse(text);
        readingSetSchema.parse(obj);

        const fd = new FormData();
        fd.set('json', JSON.stringify(obj));
        const r = await onSave(fd);
        setMsg(`??Saved: ${r.id}`);
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

      {/* ?≪뀡??*/}
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

      {/* JSON ?몄쭛湲?*/}
      {tab === 'json' && (
        <form onSubmit={save} className="space-y-3">
          <textarea
            className="h-[60vh] w-full rounded-xl border p-3 font-mono text-sm"
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

      {/* FORM ?먮뵒??MVP) */}
      {tab === 'form' &&
        (parsed ? (
          <FormEditor parsed={parsed} setText={setText} />
        ) : (
          <div className="text-sm text-red-400">
            JSON???좏슚?댁빞 Form ?몄쭛湲곕? ?ъ슜?????덉뼱?? 癒쇱? JSON ??뿉??Validate ?댁＜?몄슂.
          </div>
        ))}
    </div>
  );
}

/* ------------------------------ Helpers ------------------------------ */
function makeMinimalSet(id: string): RSet {
  return {
    id,
    label: 'New Reading Set',
    source: '',
    // schema??number ???レ옄濡?愿由?
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

/* ------------------------------ Simple Form Editor (MVP) ------------------------------ */
function FormEditor({ parsed, setText }: { parsed: RSet; setText: (s: string) => void }) {
  const [draft, setDraft] = useState<RSet>(parsed);

  const sync = () => setText(JSON.stringify(draft, null, 2));

  const setPassageField = (k: keyof RSet['passages'][number], v: any, idx = 0) => {
    setDraft((prev) => ({
      ...prev,
      passages: prev.passages.map((p, i) => (i === idx ? { ...p, [k]: v } : p)),
    }));
  };

  const addQuestion = () => {
    const p0 = draft.passages[0];
    const q: RQuestion = {
      id: crypto.randomUUID(),
      number: (p0?.questions?.length ?? 0) + 1,
      type: 'detail',
      stem: 'Write the stem...',
      choices: [
        { id: crypto.randomUUID(), text: 'Choice A' },
        { id: crypto.randomUUID(), text: 'Choice B' },
        { id: crypto.randomUUID(), text: 'Choice C' },
        { id: crypto.randomUUID(), text: 'Choice D' },
      ],
      meta: {},
    };
    setDraft((prev) => ({
      ...prev,
      passages: prev.passages.map((p, i) =>
        i === 0 ? { ...p, questions: [...(p.questions || []), q] } : p
      ),
    }));
  };

  const updateQuestion = (i: number, patch: Partial<RQuestion>) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    qs[i] = { ...qs[i], ...patch };
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  const setCorrect = (qi: number, ci: number) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.choices = q.choices.map((c, i) => ({ ...c, is_correct: i === ci }));
    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  const setChoiceText = (qi: number, ci: number, text: string) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.choices = q.choices.map((c, i) => (i === ci ? { ...c, text } : c));
    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  const addChoice = (qi: number) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    q.choices = [...q.choices, { id: crypto.randomUUID(), text: 'New choice' } as RChoice];
    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  const setType = (qi: number, t: RQType) => updateQuestion(qi, { type: t });

  // ---- ?좏삎蹂?硫뷀? (?붿빟/?쒖닠/?紐낆궗 ?? ----

  // summary: selectionCount留?諛붽퓭??candidates/correct ?좎?
  const setSummarySelection = (qi: number, n: number) => {
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    const prev = metaView(q).summary;

    q.meta = {
      ...(q.meta || {}),
      summary: {
        candidates: Array.isArray(prev.candidates) ? prev.candidates : [],
        correct: Array.isArray(prev.correct) ? prev.correct : [],
        selectionCount: Math.max(1, Number.isFinite(n) ? n : 2),
      },
    };

    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  // ?붿빟 臾몄옣 ?몄쭛 (以꾨컮轅??먮뒗 | 援щ텇)
  const setSummaryCandidates = (qi: number, raw: string) => {
    const candidates = raw
      .split(/\r?\n|\|/g)
      .map((s) => s.trim())
      .filter(Boolean);

    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    const m = metaView(q);
    const prevSel = Number(m.summary.selectionCount ?? 2) || 2;

    q.meta = {
      ...(q.meta || {}),
      summary: {
        candidates,
        correct: Array.isArray(m.summary.correct) ? m.summary.correct : [],
        selectionCount: Math.max(1, prevSel),
      },
    };

    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  // ?뺣떟 ?몃뜳???몄쭛 (1-based ?낅젰 ??0-based ???
  const setSummaryCorrect = (qi: number, raw: string) => {
    const correct = raw
      .split(/\D+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => Math.max(0, (parseInt(v, 10) || 0) - 1));

    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    const m = metaView(q);
    const prevCandidates = Array.isArray(m.summary.candidates) ? m.summary.candidates : [];
    const prevSel = Number(m.summary.selectionCount ?? 2) || 2;

    q.meta = {
      ...(q.meta || {}),
      summary: {
        candidates: prevCandidates,
        correct,
        selectionCount: Math.max(1, prevSel),
      },
    };

    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  // insertion
  const setInsertionAnchors = (qi: number, anchorsCsv: string) => {
    const anchors = anchorsCsv.split('|').map((s) => s.trim()).filter(Boolean);
    const p0 = draft.passages[0];
    const qs = p0.questions.slice();
    const q = { ...qs[qi] };
    const m = metaView(q);
    q.meta = {
      ...(q.meta || {}),
      insertion: {
        ...m.insertion,
        anchors,
        correctIndex: m.insertion.correctIndex ?? 0,
      },
    };
    qs[qi] = q;
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
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
    setDraft((prev) => ({ ...prev, passages: [{ ...p0, questions: qs }] }));
  };

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-neutral-500">Set Label</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={draft.label}
            onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Source</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={draft.source || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, source: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Version</label>
            {/* number濡?愿由??ㅽ궎留??쇱튂) */}
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={String(draft.version ?? 1)}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, version: Number(e.target.value || 1) }))
              }
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
        {(draft.passages[0]?.questions || []).map((q, qi) => {
          const m = metaView(q);
          return (
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

              {/* ?좏삎蹂?硫뷀? (MVP) */}
              {q.type === 'summary' && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">selectionCount</span>
                    <input
                      type="number"
                      className="w-20 rounded border px-2 py-1"
                      value={m.summary.selectionCount ?? 2}
                      onChange={(e) => setSummarySelection(qi, Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-neutral-500">
                      candidates (以꾨컮轅??먮뒗 <code>|</code> 援щ텇)
                    </div>
                    <textarea
                      className="w-full rounded border px-3 py-2 font-mono"
                      rows={4}
                      value={(m.summary.candidates || []).join('\n')}
                      onChange={(e) => setSummaryCandidates(qi, e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-neutral-500">
                      correct (?뺣떟 ?몃뜳??1-based, ?? <code>1|3|4</code>)
                    </div>
                    <input
                      className="w-full rounded border px-3 py-2 font-mono"
                      value={(m.summary.correct || []).map((i) => i + 1).join('|')}
                      onChange={(e) => setSummaryCorrect(qi, e.target.value)}
                    />
                  </div>
                </div>
              )}

              {q.type === 'insertion' && (
                <div className="mt-2 text-sm">
                  <div className="mb-1 text-neutral-500">
                    anchors (<code>|</code> 援щ텇)
                  </div>
                  <input
                    className="w-full rounded border px-3 py-2"
                    placeholder="ex) [A] | [B] | [C] | [D]"
                    value={(m.insertion.anchors || []).join(' | ')}
                    onChange={(e) => setInsertionAnchors(qi, e.target.value)}
                  />
                </div>
              )}

              {q.type === 'pronoun_ref' && (
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                  <input
                    className="rounded border px-3 py-2"
                    placeholder="pronoun (it / they ...)"
                    value={m.pronoun_ref.pronoun || ''}
                    onChange={(e) =>
                      setPronounRef(
                        qi,
                        e.target.value,
                        (m.pronoun_ref.referents || []).join(' | '),
                        m.pronoun_ref.correctIndex ?? 0
                      )
                    }
                  />
                  <input
                    className="rounded border px-3 py-2 md:col-span-2"
                    placeholder="referents ( | 援щ텇 )"
                    value={(m.pronoun_ref.referents || []).join(' | ')}
                    onChange={(e) =>
                      setPronounRef(
                        qi,
                        m.pronoun_ref.pronoun || '',
                        e.target.value,
                        m.pronoun_ref.correctIndex ?? 0
                      )
                    }
                  />
                </div>
              )}

              <div className="mt-3">
                <div className="mb-1 text-sm text-neutral-500">Choices</div>
                <ul className="space-y-2">
                  {q.choices.map((c, ci) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded border px-3 py-2"
                        value={c.text}
                        onChange={(e) => setChoiceText(qi, ci, e.target.value)}
                      />
                      <label className="flex items-center gap-1 text-sm">
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
          );
        })}
      </div>

      <div className="flex gap-2">
        <button className="rounded border px-3 py-2" onClick={sync}>
          Apply to JSON
        </button>
        <div className="text-xs text-neutral-500">
          Apply瑜??뚮윭??JSON ??뿉 諛섏쁺?쇱슂
        </div>
      </div>
    </div>
  );
}


