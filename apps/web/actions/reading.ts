// apps/web/actions/reading.ts
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { readingSetSchema } from '@/lib/readingSchemas';
import type { RSet } from '@/types/types-reading';

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
export async function upsertReadingSet(json: unknown) {
  const supabase = await getSupabaseServer();
  const parsed = readingSetSchema.parse(json);

  await supabase.from('reading_sets').upsert({
    id: parsed.id,
    label: parsed.label,
    source: parsed.source,
    version: parsed.version,
  });

  await supabase.from('reading_passages').delete().eq('set_id', parsed.id);

  for (let i = 0; i < parsed.passages.length; i++) {
    const p = parsed.passages[i];
    await supabase.from('reading_passages').insert({
      id: p.id, set_id: parsed.id, title: p.title, content: p.content,
      ui: p.ui ?? {}, ord: i + 1,
    });

    for (let j = 0; j < p.questions.length; j++) {
      const q = p.questions[j];
      await supabase.from('reading_questions').insert({
        id: q.id, passage_id: p.id, number: q.number, type: q.type,
        stem: q.stem, meta: q.meta ?? {}, explanation: q.explanation ?? {}, ord: j + 1,
      });

      for (let k = 0; k < (q.choices?.length ?? 0); k++) {
        const c = q.choices[k];
        await supabase.from('reading_choices').insert({
          id: c.id, question_id: q.id, text: c.text, is_correct: !!c.is_correct,
          explain: c.explain ?? null, ord: k + 1,
        });
      }
    }
  }
  return { ok: true } as const;
}

export async function loadReadingSet(setId: string): Promise<RSet | null> {
  const supabase = await getSupabaseServer();
  const { data: set } = await supabase.from('reading_sets').select('*').eq('id', setId).single();
  const { data: passages } = await supabase.from('reading_passages').select('*').eq('set_id', setId).order('ord');
  if (!set || !passages) return null;

  const result: any = { ...set, passages: [] as any[] };
  for (const p of passages) {
    const { data: qs } = await supabase.from('reading_questions').select('*').eq('passage_id', p.id).order('ord');
    const Qs: any[] = [];
    for (const q of (qs || [])) {
      const { data: cs } = await supabase.from('reading_choices').select('*').eq('question_id', q.id).order('ord');
      Qs.push({ ...q, choices: cs || [] });
    }
    result.passages.push({ ...p, questions: Qs });
  }
  return result as RSet;
}

/** ====== Session Actions ====== */
export async function startReadingSession(_args: StartReadingArgs) {
  return { ok: true, sessionId: `${Date.now()}` as string } as const;
}

export async function submitReadingAnswer(
  args: Omit<SubmitReadingArgs, 'questionId' | 'choiceId'> & { questionId: string | number; choiceId: string | number },
) {
  const payload: SubmitReadingArgs = {
    ...args,
    questionId: String(args.questionId),
    choiceId: String(args.choiceId),
  };
  void payload; // TODO: upsert into reading_answers
  return { ok: true } as const;
}

export async function finishReadingSession(arg: FinishReadingArgs | string | number) {
  const sessionId =
    typeof arg === 'string' || typeof arg === 'number'
      ? String(arg)
      : (arg.sessionId ? String(arg.sessionId) : undefined);
  // TODO: mark session finished
  return { ok: true, sessionId } as const;
}
