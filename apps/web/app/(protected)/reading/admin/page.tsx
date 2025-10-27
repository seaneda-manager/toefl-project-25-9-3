// apps/web/app/(protected)/reading/admin/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import { readingSetSchema } from '@/models/reading/zod';
import { loadReadingSet, upsertReadingSet } from '@/actions/reading';
import AdminReadingEditor from '@/components/reading/admin/AdminReadingEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Search = { setId?: string };

export default async function Page({ searchParams }: { searchParams?: Search }) {
  const setId = searchParams?.setId || 'demo-set';

  // ?λ뜃由?嚥≪뮆諭?(??곸몵筌????ⓥ몿爰?
  const initial = await loadReadingSet(setId);
  const initialJson = initial
    ? JSON.stringify(initial, null, 2)
    : JSON.stringify(
        {
          id: setId,
          label: 'New Reading Set',
          source: '',
          version: 1,
          passages: [
            {
              id: crypto.randomUUID(),
              title: 'Untitled Passage',
              content: 'Write your passage here...',
              ui: { paragraphSplit: 'auto' },
              questions: [],
            },
          ],
        },
        null,
        2
      );

  // ??뺤쒔 ??る? ????뽱뀱嚥?????(????癒?퐣 筌욊낯??import 疫뀀뜆? ??prop??곗쨮 ?袁⑤뼎)
  async function saveAction(formData: FormData) {
    'use server';
    const raw = String(formData.get('json') || '');
    const parsed = readingSetSchema.parse(JSON.parse(raw));
    await upsertReadingSet(parsed);
    return { ok: true as const, id: parsed.id };
  }

  return (
    <div className="px-6 py-5 space-y-4">
      <h1 className="text-2xl font-bold">Reading Admin</h1>
      <AdminReadingEditor
        initialJson={initialJson}
        defaultSetId={setId}
        onSave={saveAction}
      />
    </div>
  );
}




