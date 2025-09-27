// apps/web/actions/reading.ts
'use server';

import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabaseServer';

const SubmitSchema = z.object({
  sessionId: z.coerce.number(),   // bigint ↔ number
  questionId: z.string().min(1),
  choiceId: z.string().min(1),
  elapsedMs: z.number().int().nonnegative().optional(),
});

const StartSchema = z.object({
  passageId: z.string().min(1),
  mode: z.enum(['test', 'study']).default('test'),
});

const FinishSchema = z.object({
  sessionId: z.coerce.number(),
});

export async function startReadingSession(input: unknown) {
  const { passageId, mode } = StartSchema.parse(input);
  const supabase = getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const { data: existing, error: selErr } = await supabase
    .from('reading_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('passage_id', passageId)
    .is('finished_at', null)
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return { sessionId: existing.id as number };

  const { data, error } = await supabase
    .from('reading_sessions')
    .insert({ user_id: user.id, passage_id: passageId, mode })
    .select('id')
    .single();

  if (error) throw error;
  return { sessionId: data!.id as number };
}

export async function submitReadingAnswer(input: unknown) {
  const { sessionId, questionId, choiceId, elapsedMs } = SubmitSchema.parse(input);
  const supabase = getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const { error } = await supabase
    .from('reading_attempt_items')
    .upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        selected_choice_id: choiceId,
        ...(typeof elapsedMs === 'number' ? { elapsed_ms: elapsedMs } : {}),
      },
      { onConflict: 'session_id,question_id', ignoreDuplicates: false }
    );

  if (error) throw error;
  return { ok: true };
}

export async function finishReadingSession(input: unknown) {
  const { sessionId } = FinishSchema.parse(input);
  const supabase = getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const { error } = await supabase
    .from('reading_sessions')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
  return { ok: true };
}
