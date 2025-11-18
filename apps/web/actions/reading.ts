// apps/web/actions/reading.ts
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { readingSetSchema } from '@/models/reading/zod';
import { z } from 'zod';
import {
  toParagraphs,
  joinParagraphs,
  coerceIsCorrect,
  mergeExplanationMeta,
} from '@/lib/reading/normalize';

// SSOT 기반 RSet 타입
export type RSet = z.infer<typeof readingSetSchema>;

/** ====== Types for actions ====== */
export type StartReadingArgs = { setId?: string; passageId?: string; mode?: 'study' | 'test' };
export type SubmitReadingArgs = {
  sessionId?: string | number;
  questionId: string;
  choiceId: string;
  passageId?: string;
  elapsedMs?: number;
};
export type FinishReadingArgs = { sessionId?: string | number };

/** ====== Content (Set/Passage/Q/A) ====== */
/**
 * 세트 전체 업서트
 * - SSOT: paragraphs[]를 사용
 * - DB: passages.content 텍스트 칼럼이 남아있다면 joinParagraphs(paragraphs)로 저장
 * - DB: questions.explanation 칼럼은 meta.explanation을 복제 저장(호환용)
 */
export async function upsertReadingSet(json: unknown) {
  const supabase = await getSupabaseServer();

  // 1) Zod 파싱(유효성 보장)
  const parsed = readingSetSchema.parse(json);

  // 2) 세트 메타 upsert
  {
    const { error } = await supabase.from('reading_sets').upsert({
      id: parsed.id,
      label: parsed.label,
      source: parsed.source,
      version: parsed.version,
    });
    if (error) throw error;
  }

  // 3) 기존 passage/questions/choices 제거 (FK ON DELETE CASCADE 가정)
  {
    const { error } = await supabase.from('reading_passages').delete().eq('set_id', parsed.id);
    if (error) throw error;
  }

  // 4) 새 데이터 삽입
  for (let i = 0; i < parsed.passages.length; i++) {
    const p = parsed.passages[i];

    // passages: DB content 칼럼에 paragraphs를 합쳐 저장
    {
      const { error: pErr } = await supabase.from('reading_passages').insert({
        id: p.id,
        set_id: parsed.id,
        title: p.title,
        content: joinParagraphs(p.paragraphs), // ✅ paragraphs → content 저장
        ord: i + 1,
      });
      if (pErr) throw pErr;
    }

    for (let j = 0; j < p.questions.length; j++) {
      const q = p.questions[j];
      const explanationFromMeta =
        (q.meta as any)?.explanation != null ? (q.meta as any).explanation : null;

      // questions: meta 그대로 저장, explanation 칼럼은 호환용으로 meta.explanation 복제
      {
        const { error: qErr } = await supabase.from('reading_questions').insert({
          id: q.id,
          passage_id: p.id,
          number: q.number,
          type: q.type,
          stem: q.stem,
          meta: q.meta ?? {},
          explanation: explanationFromMeta, // ✅ 호환용
          ord: j + 1,
        });
        if (qErr) throw qErr;
      }

      // choices: isCorrect로 일원화 → DB is_correct에 반영
      const choices = q.choices ?? [];
      for (let k = 0; k < choices.length; k++) {
        const c = choices[k];
        const { error: cErr } = await supabase.from('reading_choices').insert({
          id: c.id,
          question_id: q.id,
          text: c.text,
          is_correct: !!c.isCorrect, // ✅ camelCase → snake_case
          explain: null, // SSOT에 없음(과거 필드). 유지하려면 meta로 이전 필요
          ord: k + 1,
        });
        if (cErr) throw cErr;
      }
    }
  }

  return { ok: true } as const;
}

/**
 * 세트 로드 (DB → SSOT 매핑)
 * - passages.content → paragraphs 로 분해(toParagraphs)
 * - questions.meta 와 explanation 칼럼을 병합하여 meta.explanation 보장
 * - choices.is_correct → isCorrect
 */
export async function loadReadingSet(setId: string): Promise<RSet | null> {
  const supabase = await getSupabaseServer();

  const { data: set, error: setErr } = await supabase
    .from('reading_sets')
    .select('*')
    .eq('id', setId)
    .single();
  if (setErr) throw setErr;

  const { data: passages, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('set_id', setId)
    .order('ord', { ascending: true });
  if (pErr) throw pErr;

  if (!set || !passages) return null;

  const result: RSet = {
    id: set.id,
    label: set.label ?? '',
    source: set.source ?? '',
    version: set.version ?? 1,
    passages: [],
  };

  for (const p of passages) {
    const { data: qs, error: qErr } = await supabase
      .from('reading_questions')
      .select('*')
      .eq('passage_id', p.id)
      .order('ord', { ascending: true });
    if (qErr) throw qErr;

    const questions = [] as RSet['passages'][number]['questions'];

    for (const q of qs ?? []) {
      const { data: cs, error: cErr } = await supabase
        .from('reading_choices')
        .select('*')
        .eq('question_id', q.id)
        .order('ord', { ascending: true });
      if (cErr) throw cErr;

      // meta + explanation 칼럼 병합
      const metaMerged = mergeExplanationMeta(q?.meta, q?.explanation, undefined);

      questions.push({
        id: String(q.id),
        number: q.number ?? 0,
        type: q.type,
        stem: q.stem ?? '',
        meta: metaMerged ?? {},
        choices: (cs ?? []).map((c: any) => ({
          id: String(c.id),
          text: c.text ?? '',
          isCorrect: coerceIsCorrect(c.is_correct),
        })),
      });
    }

    result.passages.push({
      id: String(p.id),
      title: p.title ?? '',
      // DB content 텍스트를 paragraphs로 변환
      paragraphs: toParagraphs(p.content),
      questions,
    });
  }

  return result;
}

/** ====== Session Actions ====== */
// 세션 시작 (임시)
export async function startReadingSession(_args: StartReadingArgs) {
  return { ok: true, sessionId: `${Date.now()}` as string } as const;
}

export async function submitReadingAnswer(
  args: Omit<SubmitReadingArgs, 'questionId' | 'choiceId'> & {
    questionId: string | number;
    choiceId: string | number;
  },
) {
  // 숫자 ID들도 문자열로 정규화
  const payload: SubmitReadingArgs = {
    ...args,
    questionId: String(args.questionId),
    choiceId: String(args.choiceId),
  };

  // TODO: upsert into reading_answers
  void payload;

  return { ok: true } as const;
}

export async function finishReadingSession(arg: FinishReadingArgs | string | number) {
  const sessionId =
    typeof arg === 'string' || typeof arg === 'number'
      ? String(arg)
      : arg.sessionId
      ? String(arg.sessionId)
      : undefined;

  // TODO: mark session finished
  return { ok: true, sessionId } as const;
}
