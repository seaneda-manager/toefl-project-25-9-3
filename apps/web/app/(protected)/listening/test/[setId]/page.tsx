// apps/web/app/(protected)/listening/test/[setId]/page.tsx
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import ClientRunner from './ClientRunner';

export default async function Page({ params }: { params: { setId: string } }) {
  const supabase = await getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { setId } = params;

  // 접근 가드: 유저가 해당 세트를 다운로드한 경우에만 통과
  const { data: row, error } = await supabase
    .from('v_user_listening_sets')
    .select('id, downloaded')
    .eq('user_id', user.id)
    .eq('id', setId)
    .eq('downloaded', true)
    .maybeSingle();

  if (error || !row) notFound();

  return <ClientRunner setId={setId} />;
}
