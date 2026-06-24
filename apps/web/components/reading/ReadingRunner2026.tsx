// apps/web/components/reading/ReadingRunner2026.tsx
"use client";

import { useMemo, useState } from "react";
import ReadingTestLayout2026 from "./ReadingTestLayout2026";
import type {
  RReadingTest2026,
  RReadingModule,
  RCompleteWordsItem,
  RDailyLifeItem,
  RAcademicPassageItem,
  RReadingItem,
} from "@/models/reading";

// ── 문제 유형 정의 ───────────────────────────────────────────
const Q_TYPES: { value: string; label: string; color: string; hint: string }[] = [
  { value: 'vocab',             label: '어휘',         color: 'bg-violet-100 text-violet-700',  hint: '단어/표현의 의미를 문맥으로 파악' },
  { value: 'detail',            label: '세부사항',     color: 'bg-sky-100 text-sky-700',        hint: '지문에 직접 언급된 사실 확인' },
  { value: 'negative_detail',   label: '세부사항(부정)', color: 'bg-sky-100 text-sky-700',     hint: '언급되지 않은/틀린 내용 찾기' },
  { value: 'inference',         label: '추론',         color: 'bg-amber-100 text-amber-700',   hint: '직접 언급은 없지만 논리적으로 이끌어냄' },
  { value: 'purpose',           label: '수사적 목적',  color: 'bg-rose-100 text-rose-700',     hint: '저자가 특정 정보를 쓴 이유' },
  { value: 'reference',         label: '지시어',       color: 'bg-teal-100 text-teal-700',     hint: '대명사/지시어가 가리키는 것' },
  { value: 'sentence_simplify', label: '문장 단순화',  color: 'bg-indigo-100 text-indigo-700', hint: '문장을 같은 의미로 단순화' },
  { value: 'paraphrasing',      label: '패러프레이징', color: 'bg-indigo-100 text-indigo-700', hint: '다른 표현으로 같은 의미' },
  { value: 'insert_sentence',   label: '문장 삽입',    color: 'bg-orange-100 text-orange-700', hint: '주어진 문장이 들어갈 위치' },
  { value: 'summary',           label: '요약',         color: 'bg-emerald-100 text-emerald-700', hint: '전체 지문의 핵심 요지' },
  { value: 'organization',      label: '구성',         color: 'bg-neutral-100 text-neutral-600', hint: '지문의 논리적 구조' },
];

const Q_TYPE_MAP = Object.fromEntries(Q_TYPES.map((t) => [t.value, t]));

// reflect 단계를 보여줄 유형
const REFLECT_TYPES = new Set([
  'vocab','detail','negative_detail','inference','purpose',
  'reference','sentence_simplify','paraphrasing',
]);

// ── 레벨별 설정 ──────────────────────────────────────────────
// basic:    유형 보기를 정답 포함 3개로 좁혀줌, evidence에 단락 번호 표시
// standard: 유형 전체 보기, evidence 4개
// advanced: 유형 전체 보기, evidence 4개 + 오답 이유까지 설명 요구 (추후)
export type StudyLevel = 'basic' | 'standard' | 'advanced';

// ── 유틸 ─────────────────────────────────────────────────────
function extractSentences(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return (text.match(/[^.!?]{20,}[.!?]+/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 30);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findBestSentence(sentences: string[], clue: string): number {
  const words = clue.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  let best = -1, bestScore = 0;
  for (let i = 0; i < sentences.length; i++) {
    const score = words.filter((w) => sentences[i].toLowerCase().includes(w)).length;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// ── 타입 ─────────────────────────────────────────────────────
type FlatQuestion =
  | { kind: 'complete_words';   module: RReadingModule; item: RCompleteWordsItem;   question: null }
  | { kind: 'daily_life';       module: RReadingModule; item: RDailyLifeItem;       question: any }
  | { kind: 'academic_passage'; module: RReadingModule; item: RAcademicPassageItem; question: any };

type SubStep = 'answer' | 'reflect';

type EvidenceChoice = { id: string; text: string; isCorrect: boolean };

type Props = {
  test: RReadingTest2026;
  level?: StudyLevel;
  onFinish?: (result: { answers: Record<string, unknown>; evidenceAnswers: Record<string, string>; typeAnswers: Record<string, string> }) => void;
};

export default function ReadingRunner2026({ test, level = 'standard', onFinish }: Props) {
  const [index,      setIndex]      = useState(0);
  const [subStep,    setSubStep]    = useState<SubStep>('answer');
  const [answers,    setAnswers]    = useState<Record<string, unknown>>({});
  const [evAnswers,  setEvAnswers]  = useState<Record<string, string>>({}); // qid → evidence choice id
  const [typeAnswers,setTypeAnswers]= useState<Record<string, string>>({}); // qid → chosen type

  // ── FlatQuestion 목록 ────────────────────────────────────────
  const allQuestions: FlatQuestion[] = useMemo(() => {
    const result: FlatQuestion[] = [];
    for (const mod of test.modules as RReadingModule[]) {
      for (const item of mod.items as RReadingItem[]) {
        if (item.taskKind === 'complete_words') {
          result.push({ kind: 'complete_words', module: mod, item, question: null });
        } else if (item.taskKind === 'daily_life') {
          result.push({ kind: 'daily_life', module: mod, item, question: item.questions?.[0] ?? null });
        } else if (item.taskKind === 'academic_passage') {
          for (const q of item.questions) {
            result.push({ kind: 'academic_passage', module: mod, item, question: q });
          }
        }
      }
    }
    return result;
  }, [test]);

  const total   = allQuestions.length;
  const current = allQuestions[index];

  // reflect 단계가 있는 문제인지
  const hasReflect = useMemo(() => {
    if (!current || current.kind !== 'academic_passage') return false;
    const q = current.question;
    return REFLECT_TYPES.has(q?.type ?? '');
  }, [current, index]);

  // evidence 보기 4개 (정답 1 + distractor 3)
  const evidenceChoices = useMemo((): EvidenceChoice[] => {
    if (!hasReflect || current?.kind !== 'academic_passage') return [];
    const q    = current.question;
    const clue = q?.explanation?.clue_quote as string | undefined;
    if (!clue) return [];

    const sents    = extractSentences(current.item.passageHtml ?? '');
    const clueIdx  = findBestSentence(sents, clue);
    const correctText = clueIdx >= 0 ? sents[clueIdx] : clue;

    const distractors = sents
      .filter((_, i) => i !== clueIdx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return shuffle([
      { id: 'correct', text: correctText, isCorrect: true },
      ...distractors.map((t, i) => ({ id: `d${i}`, text: t, isCorrect: false })),
    ]);
  }, [hasReflect, current, index]);

  // 레벨별 유형 보기 (basic: 정답 포함 3개로 좁힘)
  const typeChoices = useMemo(() => {
    const q = current?.kind === 'academic_passage' ? current.question : null;
    if (!q) return Q_TYPES;
    if (level === 'basic') {
      const correct = Q_TYPES.find((t) => t.value === q.type);
      const others  = Q_TYPES.filter((t) => t.value !== q.type).sort(() => Math.random() - 0.5).slice(0, 2);
      return correct ? shuffle([correct, ...others]) : Q_TYPES;
    }
    return Q_TYPES;
  }, [current, index, level]);

  const qid = current?.question?.id ?? `q-${index}`;

  // ── 네비게이션 ──────────────────────────────────────────────
  const handleNext = () => {
    if (current?.kind === 'academic_passage' && hasReflect && subStep === 'answer') {
      setSubStep('reflect');
      return;
    }
    setSubStep('answer');
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      onFinish?.({ answers, evidenceAnswers: evAnswers, typeAnswers });
    }
  };

  const handlePrev = () => {
    if (subStep === 'reflect') { setSubStep('answer'); return; }
    if (index > 0) { setIndex((i) => i - 1); setSubStep('answer'); }
  };

  const canAdvance = (() => {
    if (!current) return false;
    if (current.kind === 'academic_passage') {
      if (subStep === 'answer') return answers[qid] !== undefined;
      // reflect: 유형은 항상 골라야, evidence는 clue_quote 있을 때만
      const typeOk = !!typeAnswers[qid];
      const evOk   = evidenceChoices.length === 0 || !!evAnswers[qid];
      return typeOk && evOk;
    }
    return true;
  })();

  // ── 헤더 ────────────────────────────────────────────────────
  const isLast = index === total - 1 && (subStep === 'reflect' || !hasReflect);

  const header = (
    <>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-800">Reading</span>
        <span className="text-xs text-neutral-400">Q {index + 1} / {total}</span>
        {hasReflect && (
          <span className={[
            'text-[11px] px-2 py-0.5 rounded-full font-medium',
            subStep === 'answer'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-amber-100 text-amber-700',
          ].join(' ')}>
            {subStep === 'answer' ? '① 문제 풀기' : '② 풀이 확인'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={handlePrev} disabled={index === 0 && subStep === 'answer'}
          className="rounded-full border border-neutral-300 px-4 py-1 text-xs font-medium text-neutral-700 disabled:opacity-40">
          Back
        </button>
        <button type="button" onClick={handleNext} disabled={!canAdvance}
          className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40">
          {isLast ? 'Finish' : subStep === 'answer' && hasReflect ? '답 제출 →' : 'Next →'}
        </button>
      </div>
    </>
  );

  // ── 지문 패널 ────────────────────────────────────────────────
  const left = (() => {
    if (!current) return null;
    if (current.kind === 'complete_words') {
      return (
        <div className="space-y-4 text-sm leading-relaxed text-neutral-800">
          <p className="font-semibold">Complete the Words</p>
          <article className="prose max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: current.item.paragraphHtml }} />
        </div>
      );
    }
    if (current.kind === 'daily_life') {
      return (
        <div className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: current.item.contentHtml }} />
      );
    }
    return (
      <article className="prose max-w-none text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: (current as any).item.passageHtml }} />
    );
  })();

  // ── 문제 패널 ────────────────────────────────────────────────
  const right = (() => {
    if (!current) return null;

    // Complete Words
    if (current.kind === 'complete_words') {
      return (
        <div className="space-y-4 text-sm text-neutral-800">
          <p className="font-medium">Type the missing letters for each blank.</p>
          <div className="space-y-3">
            {(current.item.blanks ?? []).map((blank: any) => {
              const key = `${current.item.id}__blank_${blank.id ?? blank.order}`;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">
                    {blank.order}
                  </span>
                  <input type="text" value={(answers[key] as string) ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [key]: e.target.value }))}
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Type missing letters" />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const q = current.question;
    if (!q) return null;
    const typeInfo = Q_TYPE_MAP[q.type] ?? { label: q.type, color: 'bg-neutral-100 text-neutral-600' };

    // ── ① 문제 풀기 ─────────────────────────────────────────
    if (subStep === 'answer' || !hasReflect) {
      return (
        <div className="space-y-4 text-sm text-neutral-800">
          <p className="font-medium leading-relaxed">{q.stem}</p>
          {Array.isArray(q.choices) && (
            <ul className="space-y-2">
              {q.choices.map((choice: any) => {
                const cid     = choice.id ?? choice.value;
                const checked = answers[qid] === cid;
                return (
                  <li key={cid}>
                    <label className={[
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                      checked ? 'border-sky-400 bg-sky-50' : 'border-neutral-200 hover:bg-neutral-50',
                    ].join(' ')}>
                      <input type="radio" name={qid} value={cid} checked={!!checked}
                        onChange={() => setAnswers((p) => ({ ...p, [qid]: cid }))}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600" />
                      <span className="text-[13px] leading-relaxed">
                        {choice.label ?? choice.text ?? String(choice.value)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    }

    // ── ② 풀이 확인 (reflect) ────────────────────────────────
    return (
      <div className="space-y-6 text-sm text-neutral-800">

        {/* 문제 요약 */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs text-neutral-400 mb-1">내가 선택한 답</p>
          <p className="text-xs font-medium text-neutral-700 truncate">
            {q.choices?.find((c: any) => (c.id ?? c.value) === answers[qid])?.text ?? '—'}
          </p>
        </div>

        {/* 유형 고르기 */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            이 문제는 어떤 유형인가요?
          </p>
          {level === 'basic' && (
            <p className="text-[11px] text-neutral-400">힌트: {typeChoices.length}가지 중 선택</p>
          )}
          <div className="flex flex-wrap gap-2">
            {typeChoices.map((t) => {
              const selected = typeAnswers[qid] === t.value;
              return (
                <button key={t.value} type="button"
                  onClick={() => setTypeAnswers((p) => ({ ...p, [qid]: t.value }))}
                  className={[
                    'rounded-full border px-3 py-1 text-[12px] font-medium transition',
                    selected
                      ? `${t.color} border-current ring-2 ring-offset-1 ring-current/30`
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                  ].join(' ')}>
                  {t.label}
                </button>
              );
            })}
          </div>
          {/* basic: 선택 시 hint 표시 */}
          {level === 'basic' && typeAnswers[qid] && (
            <p className="text-[11px] text-neutral-500 mt-1">
              {Q_TYPE_MAP[typeAnswers[qid]]?.hint}
            </p>
          )}
        </div>

        {/* 근거 고르기 (clue_quote 있는 경우) */}
        {evidenceChoices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              정답의 근거가 된 문장을 고르세요
            </p>
            <ul className="space-y-2">
              {evidenceChoices.map((choice) => {
                const selected = evAnswers[qid] === choice.id;
                return (
                  <li key={choice.id}>
                    <label className={[
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                      selected ? 'border-amber-400 bg-amber-50' : 'border-neutral-200 hover:bg-neutral-50',
                    ].join(' ')}>
                      <input type="radio" name={`ev-${qid}`} value={choice.id} checked={selected}
                        onChange={() => setEvAnswers((p) => ({ ...p, [qid]: choice.id }))}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500" />
                      <span className="text-[12px] leading-relaxed text-neutral-700">
                        {choice.text.length > 160 ? choice.text.slice(0, 157) + '…' : choice.text}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  })();

  return <ReadingTestLayout2026 header={header} left={left} right={right} />;
}
