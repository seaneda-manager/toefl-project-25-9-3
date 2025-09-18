// apps/web/app/(protected)/reading/study/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer'
import StudyRunner from './StudyRunner'
import type { Passage, Question, Choice } from '@/types/types-reading'

export default async function Page() {
  const supabase = getSupabaseServer()

  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pErr) {
    return <div>에러: {pErr.message}</div>
  }
  if (!p) {
    return <div>Passage가 없습니다.</div>
  }

  const { data: qs } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true })

  const passage: Passage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
    questions: (qs ?? []).map((q: any) => ({
      id: q.id,
      number: q.number,
      stem: q.stem,
      type: (q.type as 'single' | 'summary') ?? 'single',
      explanation: q.explanation ?? undefined,
      clue_quote: q.clue_quote ?? undefined,
      choices: (q.choices ?? []).map((c: any) => ({
        id: c.id,
        label: c.label ?? undefined,
        text: c.text,
        // Remove is_correct if present
      })),
    })),
  }

  return <StudyRunner passage={passage} />
}
