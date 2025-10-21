// apps/web/actions/listening.ts (예시 위치; 현재 파일 위치 유지 가능)
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import type { Mode } from '@/types/consume-play';
// 필요 시 짧은/긴 표기 변환을 원한다면 아래 주석 해제 후 사용
// import { canonicalMode } from '@/types/consume-play';

export type StartListeningSessionArgs = {
  setId: string;
  /** 'p' | 't' | 'r' 또는 consume-play의 Mode 타입 */
  mode: Mode;
};

export async function startListeningSession(
  { setId, mode }: StartListeningSessionArgs
): Promise<{ sessionId: string }> {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  if (!user) throw new Error('Not authenticated');

  // DB가 'p'|'t'|'r'을 기대하면 그대로 저장,
  // 'study'|'test'|'review'를 원하면 canonicalMode(mode) 사용
  // const normalized = canonicalMode(mode) as any;

  const { data, error } = await supabase
    .from('listening_sessions')
    .insert({ user_id: user.id, set_id: setId, mode /*: normalized*/ })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { sessionId: data.id as string };
}

export type SubmitListeningAnswerArgs = {
  sessionId: string;
  questionId: string;
  choiceId?: string;
};

export async function submitListeningAnswer(
  { sessionId, questionId, choiceId }: SubmitListeningAnswerArgs
): Promise<{ ok: true }> {
  const supabase = await getSupabaseServer();

  // 미선택(삭제)
  if (!choiceId) {
    const { error } = await supabase
      .from('listening_answers')
      .delete()
      .eq('session_id', sessionId)
      .eq('question_id', questionId);

    if (error) throw new Error(error.message);
    return { ok: true };
  }

  // 선택/갱신(upsert)
  const { error } = await supabase
    .from('listening_answers')
    .upsert(
      { session_id: sessionId, question_id: questionId, choice_id: choiceId },
      { onConflict: 'session_id,question_id' }
    );

  if (error) throw new Error(error.message);
  return { ok: true };
}

export type FinishListeningSessionArgs = { sessionId: string };

export async function finishListeningSession(
  { sessionId }: FinishListeningSessionArgs
): Promise<{ ok: true }> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('listening_sessions')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);
  return { ok: true };
}
