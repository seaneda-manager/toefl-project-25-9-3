// apps/web/app/(protected)/reading/test-v2/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { RPassage, RQuestion } from '@/models/reading';
import ClientPage from '../test/ClientPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RQType = RQuestion['type'];

/** ?덉쟾??JSON ?뚯꽌: ?대? 媛앹껜硫?洹몃?濡? 臾몄옄?댁씠硫?try-parse, ?꾨땲硫?fallback */
function safeJson<T>(val: unknown, fallback: T): T {
  if (val == null) return fallback;
  if (typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }
  return fallback;
}

/** 吏덈Ц ????뺢퇋??*/
function normalizeType(t: unknown): RQType {
  const allowed: RQType[] = [
    'vocab',
    'detail',
    'negative_detail',
    'paraphrasing',
    'inference',
    'purpose',
    'pronoun_ref',
    'insertion',
    'summary',
    'organization',
  ];
  if (t === 'single') return 'detail'; // 援щ쾭???명솚
  return (allowed as unknown as string[]).includes(String(t)) ? (t as RQType) : 'detail';
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { setId?: string };
}) {
  const setId = searchParams?.setId ?? 'demo-set';
  const supabase = await getSupabaseServer();

  // 理쒖떊 passage (?대떦 setId)
  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('set_id', setId)
    .order('ord', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) return <div className="p-6 text-red-600">?⑥떆吏 濡쒕뱶 ?ㅻ쪟: {pErr.message}</div>;
  if (!p) return <div className="p-6">Passage ?놁쓬 (setId={setId}).</div>;

  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) {
    return <div className="p-6 text-red-600">臾명빆 濡쒕뱶 ?ㅻ쪟: {qErr.message}</div>;
  }

  // ?좑툘 RPassage/RQuestion ??낆뿉 議댁옱?섎뒗 ?꾨뱶留?援ъ꽦 (set_id/ui/passag e_id ?쒓굅)
  const passage: RPassage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
    questions: (qs ?? []).map((q: any) => {
      const meta = safeJson<NonNullable<RQuestion['meta']>>(q.meta, undefined as any);
      const explanation =
        q.explanation ?? (q.clue_quote ? { clue_quote: q.clue_quote } : undefined);

      return {
        id: q.id,
        number: q.number ?? 0,
        stem: q.stem ?? '',
        type: normalizeType(q.type),
        meta,
        explanation,
        choices: (q.choices ?? []).map((c: any) => ({
          id: c.id,
          text: c.text ?? c.label ?? '',
          is_correct: !!c.is_correct,
          explain: c.explain ?? undefined,
        })),
      } satisfies RQuestion;
    }),
  };

  return (
    <div className="px-6 py-4">
      <ClientPage passage={passage} />
    </div>
  );
}


