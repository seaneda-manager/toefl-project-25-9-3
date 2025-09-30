// apps/web/app/api/admin/listening/import/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { ListeningSetZ } from '@/app/types/types-listening-extended';

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ListeningSetZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid json', issues: parsed.error.flatten() }, { status: 422 });
  }
  const spec = parsed.data;

  const { error } = await supabase.from('listening_sets').upsert({
    id: spec.setId,
    tpo: spec.tpo ?? null,
    title: spec.title ?? null,
    locale: spec.locale ?? null,
    spec,
    created_by: user.id,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: spec.setId });
}
