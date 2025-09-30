'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';

export type StartListeningSessionArgs = { setId: string; mode: 'p' | 't' | 'r' };
export async function startListeningSession({ setId, mode }: StartListeningSessionArgs) {
  const supabase = await getSupabaseServer(); // ✅ 클라이언트 자체
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('listening_sessions')
    .insert({ user_id: user.id, set_id: setId, mode })
    .select('id')
    .single();

  if (error) throw error;
  return { sessionId: data.id as string };
}

export type SubmitListeningAnswerArgs = { sessionId: string; questionId: string; choiceId?: string };
export async function submitListeningAnswer({ sessionId, questionId, choiceId }: SubmitListeningAnswerArgs) {
  const supabase = await getSupabaseServer(); // ✅
  if (!choiceId) {
    const { error } = await supabase
      .from('listening_answers')
      .delete()
      .eq('session_id', sessionId)
      .eq('question_id', questionId);
    if (error) throw error;
    return { ok: true };
  }

  const { error } = await supabase
    .from('listening_answers')
    .upsert(
      { session_id: sessionId, question_id: questionId, choice_id: choiceId },
      { onConflict: 'session_id,question_id' }
    );
  if (error) throw error;
  return { ok: true };
}

export type FinishListeningSessionArgs = { sessionId: string };
export async function finishListeningSession({ sessionId }: FinishListeningSessionArgs) {
  const supabase = await getSupabaseServer(); // ✅
  const { error } = await supabase
    .from('listening_sessions')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
  return { ok: true };
}
