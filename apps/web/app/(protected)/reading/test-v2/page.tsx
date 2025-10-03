// apps/web/app/(protected)/reading/test-v2/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { RPassage, RQType } from '@/types/types-reading';
import ClientPage from '../test/ClientPage'; // ⬅️ 우리가 만든 SkimGate+Runner 래퍼 재사용

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeType(t: any): RQType {
  const allowed: RQType[] = ['vocab','detail','negative_detail','paraphrasing','inference','purpose','pronoun_ref','insertion','summary','organization'];
  if (t === 'single') return 'detail';
  return allowed.includes(t) ? (t as RQType) : 'detail';
}

export default async function Page({ searchParams }: { searchParams: { setId?: string }}) {
  const setId = searchParams.setId || 'demo-set';
  const supabase = await getSupabaseServer();

  // 최신 passage 불러오기 (해당 setId)
  const { data: p } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('set_id', setId)
    .order('ord', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!p) return <div className="p-6">Passage 없음(setId={setId}).</div>;

  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) return <div className="p-6 text-red-600">문항 로드 에러: {qErr.message}</div>;

  const passage: RPassage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
    ui: p.ui ?? { paragraphSplit: 'auto' },
    questions: (qs ?? []).map((q: any) => ({
      id: q.id,
      number: q.number ?? 0,
      stem: q.stem ?? '',
      type: normalizeType(q.type),
      meta: q.meta ?? undefined,
      explanation: q.explanation ?? (q.clue_quote ? { clue_quote: q.clue_quote } : undefined),
      choices: (q.choices ?? []).map((c: any) => ({
        id: c.id,
        text: c.text ?? '',
        is_correct: !!c.is_correct,
        explain: c.explain ?? undefined,
      })),
    })),
  };

  return (
    <div className="px-6 py-4">
      <ClientPage passage={passage} />
    </div>
  );
}
