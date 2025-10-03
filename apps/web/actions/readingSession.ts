'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';

// 세션 시작
export async function startReadingSession(args: { setId?: string; passageId?: string; mode?: 'study'|'test' }) {
  // 필요 시 DB insert로 교체 가능 (현재는 스텁)
  // const supabase = await getSupabaseServer();
  // ...
  return { ok: true, sessionId: `${Date.now()}` as string } as const;
}

// 답안 제출
export async function submitReadingAnswer(args: {
  sessionId: string;
  questionId: string;
  choiceId: string;
  passageId?: string;
  elapsedMs?: number;
}) {
  // const supabase = await getSupabaseServer();
  // TODO: upsert into reading_answers
  void args;
  return { ok: true } as const;
}

// 종료
export async function finishReadingSession(args: { sessionId: string }) {
  // const supabase = await getSupabaseServer();
  void args;
  return { ok: true } as const;
}
