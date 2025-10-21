// apps/web/app/(protected)/reading/admin/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import { readingSetSchema } from '@/lib/readingSchema';
import { loadReadingSet, upsertReadingSet } from '@/actions/reading';
import AdminReadingEditor from '@/components/reading/admin/AdminReadingEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Search = { setId?: string };

export default async function Page({ searchParams }: { searchParams?: Search }) {
  const setId = searchParams?.setId || 'demo-set';

  // ì´ˆê¸° ë¡œë“œ (?†ìœ¼ë©?ë¹?ê³¨ê²©)
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

  // ?œë²„ ?¡ì…˜: ???œì¶œë¡??€??(?´ë¼?ì„œ ì§ì ‘ import ê¸ˆì? ??prop?¼ë¡œ ?„ë‹¬)
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
