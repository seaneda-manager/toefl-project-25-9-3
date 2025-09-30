// apps/web/app/(protected)/listening/test/[setId]/page.tsx
export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

// 러너는 클라이언트 컴포넌트이므로 SSR 끄기
const ListeningTestRunner = dynamicImport(
  () => import('../ListeningTestRunner'),
  { ssr: false }
);

export default async function Page({ params }: { params: { setId: string } }) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { setId } = params;

  // ★ 유저가 해당 세트에 접근 가능한지 서버에서 가드
  const { data: row, error } = await supabase
    .from('v_user_listening_sets') // ← 너의 뷰/테이블명에 맞춰 수정
    .select('id')
    .eq('user_id', user.id)
    .eq('id', setId)
    .eq('downloaded', true)
    .single();

  if (error || !row) notFound();

  return <ListeningTestRunner initialSetId={setId} autoStart />;
}
