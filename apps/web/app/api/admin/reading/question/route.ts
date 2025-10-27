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

  const q = await req.json();
  const { id, number, type, stem, explanation, clue_quote } = q;
  if (!id || !number || !type || !stem) {
    return NextResponse.json({ error: 'id,number,type,stem required' }, { status: 400 });
  }

  const { error } = await g.supabase
    .from('reading_questions')
    .update({ number, type, stem, explanation, clue_quote })
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

  // ?듭븞 議댁옱 ?щ?(吏덈Ц ?⑥쐞)
  const { count } = await g.supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', id);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'answers exist; cannot delete question' }, { status: 409 });
  }

  await g.supabase.from('reading_choices').delete().eq('question_id', id);
  const { error } = await g.supabase.from('reading_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}




