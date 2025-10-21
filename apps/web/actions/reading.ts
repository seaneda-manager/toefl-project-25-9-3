// apps/web/actions/reading.ts
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { readingSetSchema } from '@/lib/readingSchemas';
import { z } from 'zod';

// Zod 스키마로부터 RSet 타입 유도
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
// 주의: FK on delete cascade 설정 필요 (reading_passages → questions → choices)
export async function upsertReadingSet(json: unknown) {
  const supabase = await getSupabaseServer();

  // 1) 스키마 검증
  const parsed = readingSetSchema.parse(json);

  // 2) 상위 세트 upsert
  {
    const { error } = await supabase.from('reading_sets').upsert({
      id: parsed.id,
      label: parsed.label,
      source: parsed.source,
      version: parsed.version, // schema 타입에 맞춰 전달
    });
    if (error) throw error;
  }

  // 3) 기존 passage/하위 트리 정리 (DB에 ON DELETE CASCADE 권장)
  {
    const { error } = await supabase
      .from('reading_passages')
      .delete()
      .eq('set_id', parsed.id);
    if (error) throw error;
  }

  // 4) 새 데이터 삽입
  for (let i = 0; i < parsed.passages.length; i++) {
    const p = parsed.passages[i];

    const { error: pErr } = await supabase.from('reading_passages').insert({
      id: p.id,
      set_id: parsed.id,
      title: p.title,
      content: p.content,
      ui: p.ui ?? {},
      ord: i + 1,
    });
    if (pErr) throw pErr;

    for (let j = 0; j < p.questions.length; j++) {
      const q = p.questions[j];

      const { error: qErr } = await supabase.from('reading_questions').insert({
        id: q.id,
        passage_id: p.id,
        number: q.number,
        type: q.type,
        stem: q.stem,
        meta: q.meta ?? {},
        // ✅ 질문 레벨 해설
        explanation: q.explanation ?? null,
        ord: j + 1,
      });
      if (qErr) throw qErr;

      const choices = q.choices ?? [];
      for (let k = 0; k < choices.length; k++) {
        const c = choices[k];
        const { error: cErr } = await supabase.from('reading_choices').insert({
          id: c.id,
          question_id: q.id,
          text: c.text,
          is_correct: !!c.is_correct,
          // ✅ 선택지 레벨 해설
          explain: c.explain ?? null,
          ord: k + 1,
        });
        if (cErr) throw cErr;
      }
    }
  }

  return { ok: true } as const;
}

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

  const result: any = { ...set, passages: [] as any[] };

  for (const p of passages) {
    const { data: qs, error: qErr } = await supabase
      .from('reading_questions')
      .select('*')
      .eq('passage_id', p.id)
      .order('ord', { ascending: true });
    if (qErr) throw qErr;

    const Qs: any[] = [];
    for (const q of qs ?? []) {
      const { data: cs, error: cErr } = await supabase
        .from('reading_choices')
        .select('*')
        .eq('question_id', q.id)
        .order('ord', { ascending: true });
      if (cErr) throw cErr;

      Qs.push({ ...q, choices: cs ?? [] });
    }
    result.passages.push({ ...p, questions: Qs });
  }

  return result as RSet;
}

/** ====== Session Actions ====== */
// 실제 세션 테이블/로직 연결 전까지는 임시 ID만 반환
export async function startReadingSession(_args: StartReadingArgs) {
  return { ok: true, sessionId: `${Date.now()}` as string } as const;
}

export async function submitReadingAnswer(
  args: Omit<SubmitReadingArgs, 'questionId' | 'choiceId'> & {
    questionId: string | number;
    choiceId: string | number;
  },
) {
  // 서버 저장 시 string으로 표준화
  const payload: SubmitReadingArgs = {
    ...args,
    questionId: String(args.questionId),
    choiceId: String(args.choiceId),
  };

  // TODO: upsert into reading_answers (세션/문항/선택/시간)
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
