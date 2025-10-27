// apps/web/app/(protected)/reading/test/[sessionId]/p/[passageId]/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import ReadingTestRunner from '@/components/reading/ReadingTestRunner';
import type { RPassage, RQuestion } from '@/models/reading';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RQType = RQuestion['type'];
const normalizeType = (t: unknown): RQType => {
  const ok: RQType[] = [
    'vocab','detail','negative_detail','paraphrasing','inference',
    'purpose','pronoun_ref','insertion','summary','organization'
  ];
  if (t === 'single') return 'detail'; // 구버전 호환
  return (ok as unknown as string[]).includes(String(t)) ? (t as RQType) : 'detail';
};

export default async function Page({
  params,
}: { params: { sessionId: string; passageId: string } }) {
  const supabase = await getSupabaseServer();

  // passage 로드
  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('id', params.passageId)
    .maybeSingle();

  if (pErr) return <div className="p-6 text-red-600">Passage load error: {pErr.message}</div>;
  if (!p) return <div className="p-6">Passage not found.</div>;

  // 질문/보기 로드
  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) {
    return <div className="p-6 text-red-600">Questions load error: {qErr.message}</div>;
  }

  // ✅ RPassage/RQuestion 타입에 존재하는 필드만 구성 (set_id/ui/passag e_id 제거)
  const passage: RPassage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
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
    })) as RQuestion[],
  };

  // Runner 시그니처는 프로젝트 정의에 맞춰 전달
  return (
    <ReadingTestRunner
      passage={passage}
      sessionId={params.sessionId}
      onAnswer={async () => ({ ok: true })}
      onFinish={async () => ({ ok: true })}
    />
  );
}
