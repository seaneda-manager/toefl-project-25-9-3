// apps/web/app/(protected)/reading/actions/readingSession.ts (?덉떆 寃쎈줈)
// ?ㅼ젣 ?꾩튂??留욊쾶 ?뚯씪 寃쎈줈???좎??섏꽭??
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';

type Mode = 'study' | 'test';

function asNullIfEmpty(v: string | undefined | null) {
  const s = (v ?? '').trim();
  return s.length ? s : null;
}

/**
 * ?몄뀡 ?쒖옉
 */
export async function startReadingSession(args: { setId?: string; passageId?: string; mode?: Mode }) {
  const supabase = await getSupabaseServer();

  // ?ъ슜???몄쬆 (RLS瑜??꾪빐 ?꾩닔)
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return { ok: false as const, error: 'unauthorized' };
  }

  const mode: Mode = args.mode ?? 'test';
  const setId = asNullIfEmpty(args.setId);
  const passageId = asNullIfEmpty(args.passageId);

  // 理쒖냼 setId???덉뼱??吏묎퀎/由щ럭 媛??
  if (!setId) {
    return { ok: false as const, error: 'setId required' };
  }

  const row = {
    user_id: auth.user.id,
    set_id: setId,
    mode,
    // passageId媛 ?덉쓣 寃쎌슦 泥?吏꾩엯 吏?먯쑝濡?硫뷀???湲곕줉
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
 * ?듭븞 ?쒖텧 (upsert)
 */
export async function submitReadingAnswer(args: {
  sessionId: string;
  questionId: string;
  /** 湲곕낯 ?⑥씪?좏깮. ?붿빟臾명빆 ?깆? 吏곷젹??臾몄옄?댁쓣 ?쒕쾭?먯꽌 ?뚯떛???섎룄 ?덉쓬 */
  choiceId: string;       
  /** ?꾩슂 ???ъ슜: 寃쎄낵?쒓컙, 洹몃９?????뺤옣 硫뷀????쒖슜 媛??*/
  passageId?: string;     
  elapsedMs?: number;
}) {
  const supabase = await getSupabaseServer();

  const sessionId = asNullIfEmpty(args.sessionId);
  const questionId = asNullIfEmpty(args.questionId);
  // 鍮?臾몄옄?댁? null濡????臾댁쓳??
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
    choice_id: choiceId,   // null ?덉슜(臾댁쓳??
    elapsed_ms: elapsedMs, // ?댁쟾 臾명빆 湲곗? 寃쎄낵?쒓컙 ?깆쑝濡?湲곕줉
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

/**
 * ?몄뀡 醫낅즺 (finished_at ?ㅼ젙)
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


