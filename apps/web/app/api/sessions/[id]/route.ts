import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  const supabase = getSupabaseServer();
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = params;
  const { data: s, error: serr } = await supabase
    .from('study_sessions').select('id, user_id').eq('id', id).single();
  if (serr || !s || s.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', id)
    .select('finished_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, finishedAt: data.finished_at });
}
