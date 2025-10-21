// apps/web/app/(protected)/reading/study/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import StudyRunner from './StudyRunner';
import type { RPassage, RQuestion } from '@/types/types-reading';

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
  if (t === 'single') return 'detail'; // 예전 데이터 호환
  return (allowed as string[]).includes(String(t)) ? (t as RQType) : 'detail';
}

export default async function Page() {
  const supabase = await getSupabaseServer();

  // 최신 passage 1개
  const { data: p, error: pErr } = await supabase
    .from('reading_passages')
    .select('*')
    .order('ord', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) return <div>오류: {pErr.message}</div>;
  if (!p) return <div>Passage가 없습니다.</div>;

  // 관련 질문 + 보기
  const { data: qs, error: qErr } = await supabase
    .from('reading_questions')
    .select('*, choices:reading_choices(*)')
    .eq('passage_id', p.id)
    .order('number', { ascending: true });

  if (qErr) return <div>질문 로드 오류: {qErr.message}</div>;

  // RPassage 스펙에 존재하는 필드로만 구성 (ui / set_id 제거)
  const passage: RPassage = {
    id: p.id,
    title: p.title ?? '',
    content: p.content ?? '',
    questions: (qs ?? []).map((q: any) => {
      // meta / explanation은 보통 선택 필드. 프로젝트 스펙에 맞게 가벼운 보정만.
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
      } satisfies RQuestion; // ❗ RQuestion에 없는 키가 있으면 여기서 컴파일 에러로 잡힘
    }),
  };

  return <StudyRunner passage={passage} />;
}
