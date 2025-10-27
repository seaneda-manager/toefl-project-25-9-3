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

  const c = await req.json();
  const { id, question_id, text, is_correct } = c;
  if (!id || !question_id || typeof text !== 'string') {
    return NextResponse.json({ error: 'id,question_id,text required' }, { status: 400 });
  }

  // ?뺣떟? 吏덈Ц??1媛??좎?
  if (is_correct === true) {
    await g.supabase.from('reading_choices').update({ is_correct: false }).eq('question_id', question_id);
  }

  const { error } = await g.supabase
    .from('reading_choices')
    .update({ text, is_correct: !!is_correct })
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

  const { error } = await g.supabase.from('reading_choices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


