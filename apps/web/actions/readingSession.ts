// apps/web/app/(protected)/reading/actions/readingSession.ts (예시 경로)
// 실제 위치에 맞게 파일 경로는 유지하세요.
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';

type Mode = 'study' | 'test';

function asNullIfEmpty(v: string | undefined | null) {
  const s = (v ?? '').trim();
  return s.length ? s : null;
}

/**
 * 세션 시작
 */
export async function startReadingSession(args: { setId?: string; passageId?: string; mode?: Mode }) {
  const supabase = await getSupabaseServer();

  // 사용자 인증 (RLS를 위해 필수)
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return { ok: false as const, error: 'unauthorized' };
  }

  const mode: Mode = args.mode ?? 'test';
  const setId = asNullIfEmpty(args.setId);
  const passageId = asNullIfEmpty(args.passageId);

  // 최소 setId는 있어야 집계/리뷰 가능
  if (!setId) {
    return { ok: false as const, error: 'setId required' };
  }

  const row = {
    user_id: auth.user.id,
    set_id: setId,
    mode,
    // passageId가 있을 경우 첫 진입 지점으로 메타에 기록
    meta: passageId ? { passageId } : {},
  };

  const { data, error } = await supabase
    .from('reading_sessions')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, sessionId: data!.id as string };
}

/**
 * 답안 제출 (upsert)
 */
export async function submitReadingAnswer(args: {
  sessionId: string;
  questionId: string;
  /** 기본 단일선택. 요약문항 등은 직렬화 문자열을 서버에서 파싱할 수도 있음 */
  choiceId: string;       
  /** 필요 시 사용: 경과시간, 그룹핑 등 확장 메타에 활용 가능 */
  passageId?: string;     
  elapsedMs?: number;
}) {
  const supabase = await getSupabaseServer();

  const sessionId = asNullIfEmpty(args.sessionId);
  const questionId = asNullIfEmpty(args.questionId);
  // 빈 문자열은 null로 저장(무응답)
  const choiceId = asNullIfEmpty(args.choiceId);
  const elapsedMs = Number.isFinite(args.elapsedMs)
    ? Math.max(0, Math.trunc(args.elapsedMs as number))
    : null;

  if (!sessionId || !questionId) {
    return { ok: false as const, error: 'sessionId & questionId required' };
  }

  const { error } = await supabase.from('reading_answers').upsert({
    session_id: sessionId,
    question_id: questionId,
    choice_id: choiceId,   // null 허용(무응답)
    elapsed_ms: elapsedMs, // 이전 문항 기준 경과시간 등으로 기록
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

/**
 * 세션 종료 (finished_at 설정)
 */
export async function finishReadingSession(args: { sessionId: string }) {
  const supabase = await getSupabaseServer();

  const sessionId = asNullIfEmpty(args.sessionId);
  if (!sessionId) return { ok: false as const, error: 'sessionId required' };

  const { error } = await supabase
    .from('reading_sessions')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}
