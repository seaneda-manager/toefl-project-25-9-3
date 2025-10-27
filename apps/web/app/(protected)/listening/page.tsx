// apps/web/app/(protected)/listening/page.tsx
export const dynamic = 'force-dynamic';

import { getSupabaseServer } from '@/lib/supabaseServer';
import SetPicker from '@/components/listening/SetPicker';

type AvailSet = { id: string; tpo: number; title: string };

export default async function Page() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // (protected) ?꾨옒吏留??뱀떆 鍮꾨줈洹몄씤 ?묎렐 ???덈궡
  if (!user) {
    return <div className="p-6">Please sign in.</div>;
  }

  // NOTE: ?ㅼ젣 ?댁쁺?먯꽌??RPC媛 ??沅뚯옣??(?? listening_available_sets)
  // const { data: sets, error } = await supabase
  //   .rpc<AvailSet[]>('listening_available_sets', { p_user_id: user.id });

  // ?꾩옱 濡쒖쭅 ?좎?: 酉곗뿉??吏곸젒 議고쉶
  const { data: sets, error } = await supabase
    .from('v_user_listening_sets')
    .select('id, tpo, title')
    .eq('user_id', user.id)
    .eq('downloaded', true)
    .order('tpo', { ascending: true })
    .returns<AvailSet[]>();

  if (error) {
    return <div className="p-6 text-red-600">Load error: {error.message}</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Listening</h1>

      {!sets || sets.length === 0 ? (
        <>
          <p className="text-sm text-neutral-600">
            ?ㅼ슫濡쒕뱶??TPO ?명듃媛 ?놁뒿?덈떎. 癒쇱? ?먮즺瑜??ㅼ슫濡쒕뱶??二쇱꽭??
          </p>
        </>
      ) : (
        <SetPicker sets={sets} />
      )}

      <p className="text-xs text-neutral-500">
        紐⑸줉? ?ㅼ슫濡쒕뱶???먮즺留??쒖떆?⑸땲??
      </p>
    </div>
  );
}


