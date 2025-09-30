// apps/web/app/api/reading/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();

    const sessionId = Number(body.sessionId);
    const questionId = Number(body.questionId);
    const choiceId = String(body.choiceId ?? '');
    const elapsedMs = body.elapsedMs !== undefined ? Number(body.elapsedMs) : null;

    if (!sessionId || !questionId || !choiceId) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields (sessionId, questionId, choiceId).' },
        { status: 400 }
      );
    }

    // ?뚯씠釉?而щ읆紐낆? ?꾨줈?앺듃 ?ㅽ궎留덉뿉 留욎떠 議곗젙?섏꽭??
    // 媛?? reading_answers(session_id, question_id, choice_id, elapsed_ms, updated_at)
    const { error } = await supabase
      .from('reading_answers')
      .upsert(
        {
          session_id: sessionId,
          question_id: questionId,
          choice_id: choiceId,
          elapsed_ms: elapsedMs,
        },
        { onConflict: 'session_id,question_id' }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

