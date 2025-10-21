import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

async function guardAdmin() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, status: 401 as const };
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return { supabase, status: 403 as const };
  return { supabase, status: 200 as const };
}

export async function PATCH(req: NextRequest) {
  const g = await guardAdmin();
  if (g.status !== 200) return NextResponse.json({ error: 'forbidden' }, { status: g.status });

  const body = await req.json();
  const { id, title, content, set_id } = body;
  if (!id || !title || !content || !set_id) {
    return NextResponse.json({ error: 'id,title,content,set_id required' }, { status: 400 });
  }

  const { error } = await g.supabase
    .from('reading_passages')
    .update({ title, content, set_id })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const g = await guardAdmin();
  if (g.status !== 200) return NextResponse.json({ error: 'forbidden' }, { status: g.status });

  const body = await req.json();
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // ?µì•ˆ ì¡´ìž¬ ?¬ë? ì²´í¬
  const { count } = await g.supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('passage_id', id);

  if ((count ?? 0) > 0) {
    // ?˜ë“œ ?? œ ?€???„ì¹´?´ë¸Œ
    const { error } = await g.supabase
      .from('reading_passages')
      .update({ set_id: `archived:${Date.now()}` })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, archived: true });
  }

  // ?˜ë“œ ?? œ(?ì‹ë¶€??
  const { data: qs } = await g.supabase
    .from('reading_questions')
    .select('id')
    .eq('passage_id', id);
  const qids = (qs ?? []).map(r => r.id);
  if (qids.length) {
    await g.supabase.from('reading_choices').delete().in('question_id', qids);
    await g.supabase.from('reading_questions').delete().in('id', qids);
  }
  const { error } = await g.supabase.from('reading_passages').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
