import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const supabase = getSupabaseServer();
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { section, mode } = await req.json();
  if (!['reading','listening'].includes(section) || !['study','exam','review'].includes(mode)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: user.id, section, mode })
    .select('id, started_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessionId: data.id, startedAt: data.started_at });
}
