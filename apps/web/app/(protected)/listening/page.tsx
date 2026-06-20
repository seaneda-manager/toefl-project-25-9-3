// apps/web/app/(protected)/listening/page.tsx
export const dynamic = "force-dynamic";

import { getSupabaseServer } from "@/lib/supabaseServer";
import SetPicker from "@/components/listening/SetPicker";

type AvailSet = { id: string; tpo: number; title: string };

export default async function Page() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // (protected) ?ì—­: ë¡œê·¸?¸ëœ ? ì?ë§??‘ê·¼ ê°€??  if (!user) {
    return <div className="p-6">Please sign in.</div>;
  }

  // NOTE: ?˜ì¤‘??listening_available_sets RPCë¡?êµì²´ ?ˆì •
  // const { data: sets, error } = await supabase
  //   .rpc<AvailSet[]>('listening_available_sets', { p_user_id: user.id });

  // ?„ì¬ ë¡œì§: ë·°ì—???¬ìš© ê°€?¥í•œ ?¸íŠ¸ ì¡°íšŒ
  const { data: sets, error } = await supabase
    .from("v_user_listening_sets")
    .select("id, tpo, title")
    .eq("user_id", user.id)
    .eq("downloaded", true)
    .order("tpo", { ascending: true })
    .returns<AvailSet[]>();

  if (error) {
    return <div className="p-6 text-red-600">Load error: {error.message}</div>;
  }

  return (
    <div className="mx-auto space-y-6 pb-8 max-w-2xl">
      <h1 className="text-xl font-semibold">Listening</h1>

      {!sets || sets.length === 0 ? (
        <>
          <p className="text-sm text-neutral-600">
            ?¤ìš´ë¡œë“œ??TPO ë¦¬ìŠ¤???¸íŠ¸ê°€ ?†ìŠµ?ˆë‹¤. ë¨¼ì? Admin?ì„œ ?¸íŠ¸ë¥?            ?¤ìš´ë¡œë“œ??ì£¼ì„¸??
          </p>
        </>
      ) : (
        <SetPicker sets={sets} />
      )}

      <p className="text-xs text-neutral-500">
        ëª©ë¡?ëŠ” ?¤ìš´ë¡œë“œê°€ ?„ë£Œ???¸íŠ¸ë§??œì‹œ?©ë‹ˆ??
      </p>
    </div>
  );
}
