import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
export async function GET(_: Request, { params }: { params: { id: string }}) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: rows, error } = await supabase
    .from('v_session_score')
    .select('*').eq('session_id', params.id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json(rows);
}
