// apps/web/app/(protected)/reading/page.tsx
export const dynamic = 'force-dynamic';

import { getSupabaseServer } from '@/lib/supabaseServer';
import SetPicker from '@/components/reading/SetPicker';

type AvailSet = {
  id: string;
  title: string;
  source: string | null;
  version: number | null;
};

export default async function Page() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Please sign in.</div>;
  }

  const { data: sets, error } = await supabase
    .from('v_user_reading_sets')
    .select('id, title, source, version')
    // ?„ìš”?˜ë©´ Listeningì²˜ëŸ¼ user ?„í„°???????ˆìŒ:
    // .eq('user_id', user.id)
    // .eq('downloaded', true)
    .order('created_at', { ascending: true })
    .returns<AvailSet[]>();

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Load error: {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 pb-8 max-w-2xl">
      <h1 className="text-xl font-semibold">Reading</h1>

      {!sets || sets.length === 0 ? (
        <p className="text-sm text-neutral-600">
          ?¤ìš´ë¡œë“œ??Reading ?¸íŠ¸ê°€ ?†ìŠµ?ˆë‹¤.
        </p>
      ) : (
        <SetPicker sets={sets} />
      )}

      <p className="text-xs text-neutral-500">
        ëª©ë¡?€ ?¤ìš´ë¡œë“œ ?¬ë??€ ê´€ê³„ì—†???œì‹œ?©ë‹ˆ??
      </p>
    </div>
  );
}
