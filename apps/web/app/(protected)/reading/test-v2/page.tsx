// apps/web/app/(protected)/reading/test-v2/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { RPassage, RQuestion } from '@/types/types-reading';
import ClientPage from '../test/ClientPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RQType = RQuestion['type'];

/** 안전한 JSON 파서: 이미 객체면 그대로, 문자열이면 try-parse, 아니면 fallback */
function safeJson<T>(val: unknown, fallback: T): T {
  if (val == null) return fallback;
  if (typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }
  return fallback;
}

/** 질문 타입 정규화 */
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
  if (t === 'single') return 'detail'; // 구버전 호환
  return (allowed as unknown as string[]).includes(String(t)) ? (t as RQType) : 'detail';
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { setId?: string };
}) {
  const setId = searchParams?.setId ?? 'demo-set';
  const supabase = await getSupabaseServer();

  // 최신 passage (해당 setId)
  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('set_id', setId)
    .order('ord', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) return <div className="p-6 text-red-600">패시지 로드 오류: {pErr.message}</div>;
  if (!p) return <div className="p-6">Passage 없음 (setId={setId}).</div>;

  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) {
    return <div className="p-6 text-red-600">문항 로드 오류: {qErr.message}</div>;
  }

  // ⚠️ RPassage/RQuestion 타입에 존재하는 필드만 구성 (set_id/ui/passag e_id 제거)
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
