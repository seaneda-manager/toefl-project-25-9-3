// app/(protected)/reading/test/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import ClientRunner from './ClientRunner';
import type { Passage, Question, Choice } from '@/types/types-reading';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function splitParagraphs(content?: string): string[] {
  if (!content) return [];
  // 빈 줄 기준 분리 + 트림
  return content
    .split(/\n{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function Page() {
  const supabase = getSupabaseServer();

  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) {
    return <div className="p-6 text-red-600">에러: {pErr.message}</div>;
  }
  if (!p) {
    return <div className="p-6">Passage가 없습니다.</div>;
  }

  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) {
    return <div className="p-6 text-red-600">문항 로드 에러: {qErr.message}</div>;
  }

  const passage: Passage = {
    id: p.id,
    title: p.title,
    content: p.content,
    questions: (qs ?? []).map((q: any): Question => ({
      id: q.id,
      number: q.number,
      stem: q.stem,
      type: (q.type as Question['type']) ?? 'single',
      explanation: q.explanation ?? '',
      clue_quote: q.clue_quote ?? '',
      choices: (q.choices ?? []).map((c: any): Choice => ({
        id: c.id,
        label: c.text ?? c.label ?? '',
        text: c.text ?? '',
        is_correct: Boolean(c.is_correct),
      })),
    })),
  };

  // 필요하면 단락 배열도 넘겨서 사용
  // const paragraphs = splitParagraphs(passage.content);

  return (
    <div className="px-6 py-4">
      <ClientRunner passage={passage} />
      {/* <ClientRunner passage={passage} paragraphs={paragraphs} /> */}
    </div>
  );
}

