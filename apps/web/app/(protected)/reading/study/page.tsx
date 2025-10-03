// apps/web/app/(protected)/reading/study/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer'
import StudyRunner from './StudyRunner'
import type { RPassage, RQType } from '@/types/types-reading'

export default async function Page() {
  const supabase = await getSupabaseServer()

  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .order('ord', { ascending: false }) // created_at 컬럼 없음 → ord로 최신 추정
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

  // RQType 정규화: 레거시 'single' → 'detail' 등
  const normalizeType = (t: any): RQType => {
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
    ]
    if (t === 'single') return 'detail'
    return allowed.includes(t) ? (t as RQType) : 'detail'
  }

  const passage: RPassage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
    questions: (qs ?? []).map((q: any) => ({
      id: q.id,
      number: q.number ?? 0,
      stem: q.stem ?? '',
      type: normalizeType(q.type),
      // meta/explanation은 있으면 그대로, clue_quote는 explanation 안으로 흡수
      meta: q.meta ?? undefined,
      explanation: q.explanation
        ? q.explanation
        : q.clue_quote
        ? { clue_quote: q.clue_quote }
        : undefined,
      // RChoice 규격: id/text/(is_correct|explain)
      choices: (q.choices ?? []).map((c: any) => ({
        id: c.id,
        text: c.text ?? c.label ?? '', // 레거시 label 대비
        is_correct: !!c.is_correct,
        explain: c.explain ?? undefined,
      })),
    })),
    ui: p.ui ?? { paragraphSplit: 'auto' },
  }

  return <StudyRunner passage={passage} />
}
