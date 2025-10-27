// apps/web/app/(protected)/reading/study/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import StudyRunner from './StudyRunner';
import type { RPassage, RQuestion } from '@/models/reading';

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
  if (t === 'single') return 'detail'; // ?덉쟾 ?곗씠???명솚
  return (allowed as string[]).includes(String(t)) ? (t as RQType) : 'detail';
}

export default async function Page() {
  const supabase = await getSupabaseServer();

  // 理쒖떊 passage 1媛?
  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .order('ord', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) return <div>?ㅻ쪟: {pErr.message}</div>;
  if (!p) return <div>Passage媛 ?놁뒿?덈떎.</div>;

  // 愿??吏덈Ц + 蹂닿린
  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) return <div>吏덈Ц 濡쒕뱶 ?ㅻ쪟: {qErr.message}</div>;

  // RPassage ?ㅽ럺??議댁옱?섎뒗 ?꾨뱶濡쒕쭔 援ъ꽦 (ui / set_id ?쒓굅)
  const passage: RPassage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
    questions: (qs ?? []).map((q: any) => {
      // meta / explanation? 蹂댄넻 ?좏깮 ?꾨뱶. ?꾨줈?앺듃 ?ㅽ럺??留욊쾶 媛踰쇱슫 蹂댁젙留?
      const meta = safeJson<NonNullable<RQuestion['meta']>>(q.meta, undefined as any);
      const explanation =
        q.explanation
          ? q.explanation
          : q.clue_quote
          ? { clue_quote: q.clue_quote }
          : undefined;

      return {
        id: q.id,
        number: q.number ?? 0,
        type: normalizeType(q.type),
        stem: q.stem ?? '',
        meta,
        explanation,
        choices: (q.choices ?? []).map((c: any) => ({
          id: c.id,
          text: c.text ?? c.label ?? '',
          is_correct: !!c.is_correct,
          explain: c.explain ?? undefined,
        })),
      } satisfies RQuestion; // ??RQuestion???녿뒗 ?ㅺ? ?덉쑝硫??ш린??而댄뙆???먮윭濡??≫옒
    }),
  };

  return <StudyRunner passage={passage} />;
}




