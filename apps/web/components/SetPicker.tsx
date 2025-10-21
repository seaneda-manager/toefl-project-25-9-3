// apps/web/app/(protected)/listening/page.tsx
export const dynamic = 'force-dynamic';

import { getSupabaseServer } from '@/lib/supabaseServer';
import SetPicker from '@/components/listening/SetPicker';

type AvailSet = { id: string; tpo: number; title: string };

export default async function Page() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // (protected)??ê±°ì˜ ?????†ì?ë§??ˆì „?¥ì¹˜
    return <div className="p-6">Please sign in.</div>;
  }

  // ??RPC ê¶Œì¥ (?ˆì‹œ)
  // const { data: sets, error } = await supabase
  //   .rpc<AvailSet[]>('listening_available_sets', { p_user_id: user.id });

  // ??ë·?ì¡°ì¸ ì§ì ‘ (?„ì¬ ë¡œì§ ? ì?)
  const { data: sets, error } = await supabase
    .from('v_user_listening_sets')
    .select('id,tpo,title')
    .eq('user_id', user.id)
    .eq('downloaded', true)
    .order('tpo', { ascending: true }) as unknown as { data: AvailSet[] | null, error: any };

  if (error) {
    return <div className="p-6 text-red-600">Load error: {error.message}</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Listening</h1>
      {(!sets || sets.length === 0) ? (
        <>
          <p className="text-sm text-neutral-600">
            ?¤ìš´ë¡œë“œ??TPOê°€ ?†ìŠµ?ˆë‹¤. ë¨¼ì? ?ë£Œë¥??¤ìš´ë¡œë“œ?˜ì„¸??
          </p>
        </>
      ) : (
        <SetPicker sets={sets} />
      )}
      <p className="text-xs text-neutral-500">
        ëª©ë¡?ëŠ” ?¤ìš´ë¡œë“œ ?„ë£Œ???Œì°¨ë§??œì‹œ?©ë‹ˆ??
      </p>
    </div>
  );
}
