// apps/web/actions/reading.ts
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { readingSetSchema } from '@/models/reading/zod';
import { z } from 'zod';

// Zod ??쎄텕筌띾뜄以덆겫???RSet ?????醫딅즲
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
// 雅뚯눘?? FK on delete cascade ??쇱젟 ?袁⑹뒄 (reading_passages ??questions ??choices)
export async function upsertReadingSet(json: unknown) {
  const supabase = await getSupabaseServer();

  // 1) ??쎄텕筌?野꺜筌?
  const parsed = readingSetSchema.parse(json);

  // 2) ?怨몄맄 ?紐낅뱜 upsert
  {
    const { error } = await supabase.from('reading_sets').upsert({
      id: parsed.id,
      label: parsed.label,
      source: parsed.source,
      version: parsed.version, // schema ????녿퓠 筌띿쉸???袁⑤뼎
    });
    if (error) throw error;
  }

  // 3) 疫꿸퀣??passage/??륁맄 ?紐꺿봺 ?類ｂ봺 (DB??ON DELETE CASCADE 亦낅슣??
  {
    const { error } = await supabase
      .from('reading_passages')
      .delete()
      .eq('set_id', parsed.id);
    if (error) throw error;
  }

  // 4) ???怨쀬뵠????뚯뿯
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
        // ??筌욌뜄揆 ??덇볼 ??곴퐬
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
          // ???醫뤾문筌왖 ??덇볼 ??곴퐬
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
// ??쇱젫 ?紐꾨????뵠??嚥≪뮇彛??怨뚭퍙 ?袁㏉돱筌왖???袁⑸뻻 ID筌?獄쏆꼹??
export async function startReadingSession(_args: StartReadingArgs) {
  return { ok: true, sessionId: `${Date.now()}` as string } as const;
}

export async function submitReadingAnswer(
  args: Omit<SubmitReadingArgs, 'questionId' | 'choiceId'> & {
    questionId: string | number;
    choiceId: string | number;
  },
) {
  // ??뺤쒔 ??????string??곗쨮 ?????
  const payload: SubmitReadingArgs = {
    ...args,
    questionId: String(args.questionId),
    choiceId: String(args.choiceId),
  };

  // TODO: upsert into reading_answers (?紐꾨??얜챸鍮??醫뤾문/??볦퍢)
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




