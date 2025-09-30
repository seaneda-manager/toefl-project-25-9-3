import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

type Body = {
  sessionId?: string;
  questionId?: string | number;
  choiceId?: string | number;
  meta?: Record<string, unknown>;
  // 선택: 문제별 소요시간(ms) 같은 추가 필드가 있다면 meta로 받거나 확장하세요.
  // elapsedMs?: number;
};

export async function POST(req: Request) {
  const supabase = getSupabaseServer();

  // 1) 인증
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2) 입력 파싱/검증
  const body = (await req.json()) as Body;
  const sessionId = String(body.sessionId ?? '');
  const questionId = String(body.questionId ?? '');
  const choiceId   = String(body.choiceId ?? '');
  const meta       = body.meta ?? null;

  if (!sessionId || !questionId || !choiceId) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // 3) 세션 소유 확인 (RLS가 있어도 명시 확인 권장)
  const { data: s, error: serr } = await supabase
    .from('study_sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .single();

  if (serr || !s || s.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 4) 업서트 (중복 문항 답변 시 덮어쓰기)
  //   - 사전 준비: DB에 고유 제약 및 컬럼 추가 권장
  //     alter table public.study_answers
  //       add constraint if not exists uq_answers_unique unique(session_id, question_id);
  //     alter table public.study_answers
  //       add column if not exists updated_at timestamptz;
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('study_answers')
    .upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        choice_id: choiceId,
        meta,
        updated_at: nowIso,
      },
      { onConflict: 'session_id,question_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
