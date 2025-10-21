import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer();

  // ?¸ì¦ + admin ê°€??
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: me, error: perr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });
  if (me?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  // passages
  let pquery = supabase
    .from('reading_passages')
    .select('id, set_id, title, content')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (q) {
    // title ?ëŠ” set_id ê²€??
    pquery = pquery.or(`title.ilike.%${q}%,set_id.ilike.%${q}%`);
  }

  const { data: passages, error: pErr } = await pquery;
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // questions/choices ë¬¶ì–´??ê°€?¸ì˜¤ê¸?
  const ids = (passages ?? []).map((p) => p.id);
  let questions: any[] = [];
  let choices: any[] = [];

  if (ids.length) {
    const { data: qs, error: qErr } = await supabase
      .from('reading_questions')
      .select('id, passage_id, number, type, stem, explanation, clue_quote')
      .in('passage_id', ids)
      .order('number', { ascending: true });
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    questions = qs ?? [];

    const qids = (qs ?? []).map((r: any) => r.id);
    if (qids.length) {
      const { data: cs, error: cErr } = await supabase
        .from('reading_choices')
        .select('id, question_id, text, is_correct')
        .in('question_id', qids)
        .order('id', { ascending: true });
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      choices = cs ?? [];
    }
  }

  // answers ì¹´ìš´???? œ ê°€?œìš©) ??ë·°ë? ?µí•œ ì§‘ê³„ë§??¬ìš©
  const answersCount: Record<string, number> = {};
  if (ids.length) {
    const { data: ac, error: acErr } = await supabase
      .from('answers_count_by_passage')
      .select('passage_id, answers')
      .in('passage_id', ids);

    if (acErr) {
      // ë·°ê? ?†ë‹¤ë©?ì¹œì ˆ???ëŸ¬ ë°˜í™˜
      return NextResponse.json(
        { error: `answers_count_by_passage view is missing: ${acErr.message}` },
        { status: 500 }
      );
    }
    (ac ?? []).forEach((r: any) => {
      answersCount[r.passage_id] = r.answers;
    });
  }

  const items = (passages ?? []).map((p) => {
    const qs = questions
      .filter((q) => q.passage_id === p.id)
      .map((q) => ({
        ...q,
        choices: choices.filter((c) => c.question_id === q.id),
      }));

    return {
      ...p,
      questions: qs,
      stats: { answers: answersCount[p.id] ?? 0 },
    };
  });

  return NextResponse.json({ items });
}
