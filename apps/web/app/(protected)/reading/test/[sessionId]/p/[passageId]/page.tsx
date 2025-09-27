// apps/web/app/(protected)/reading/test/[sessionId]/p/[passageId]/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import ReadingTestRunner from '@/app/(protected)/reading/test/ReadingTestRunner';

// 도메인 타입 (Runner가 기대하는 타입)
import type {
  Passage as ReadingPassage,
  Question as ReadingQuestion,
} from '@/app/types/types-reading';

// 소스 타입 (DB/RPC에서 가져오는 테스트 타입)
import type {
  Passage as TestPassage,
  Question as TestQuestion,
} from '@/app/types/test';

/** ─────────────────────────────────────────────────────────────
 *  어댑터: TestPassage → ReadingPassage
 *  - Question.type 이 없으면 기본값 'detail' 부여 (규칙 필요시 수정)
 *  - prompt 없으면 stem → text → title 순으로 보강
 *  - title/text도 안전하게 보강
 *  ───────────────────────────────────────────────────────────── */
function adaptQuestion(q: TestQuestion): ReadingQuestion {
  const anyQ = q as any;

  const prompt: string =
    anyQ.prompt ??
    anyQ.stem ??
    anyQ.text ??
    anyQ.title ??
    '';

  return {
    ...anyQ,
    type: anyQ.type ?? anyQ.qtype ?? 'detail',
    prompt,
  } as ReadingQuestion;
}

function adaptPassage(p: TestPassage): ReadingPassage {
  const anyP = p as any;

  return {
    ...anyP,
    questions: (anyP.questions ?? []).map((q: TestQuestion) => adaptQuestion(q)),
    title: anyP.title ?? anyP.name ?? anyP.passage_title ?? '',
    text: anyP.text ?? anyP.content ?? anyP.body ?? '',
  } as ReadingPassage;
}

export default async function ReadingPlayPage({
  params,
}: {
  params: { sessionId: string; passageId: string };
}) {
  const supabase = getSupabaseServer();

  const sessionId = params.sessionId;
  const passageId = Number(params.passageId);

  // 실제 프로젝트의 RPC/쿼리에 맞게 함수명/파라미터 조정
  const { data: testPassage, error } = await supabase
    .rpc('reading_get_test_passage', { passage_id: passageId })
    .returns<unknown>()
    .single();

  if (error || !testPassage) {
    // 폴백(Mock)
    const mock: TestPassage = {
      id: passageId,
      title: 'Mock Passage',
      text:
        'This is a mock passage used as a fallback when the RPC returns nothing.',
      questions: [
        {
          id: 1,
          stem: 'According to paragraph 1, what is the main reason ...?',
          choices: [
            { id: 'A', text: 'Reason A' },
            { id: 'B', text: 'Reason B' },
            { id: 'C', text: 'Reason C' },
            { id: 'D', text: 'Reason D' },
          ],
          answer: 'B',
        } as unknown as TestQuestion,
      ],
    } as unknown as TestPassage;

    const readingPassage = adaptPassage(mock);

    return (
      <ReadingTestRunner
        sessionId={sessionId}
        passage={readingPassage}
        // ❌ mode prop 제거 (Runner가 받지 않음)
      />
    );
  }

  const readingPassage = adaptPassage(testPassage as TestPassage);

  return (
    <ReadingTestRunner
      sessionId={sessionId}
      passage={readingPassage}
      // ❌ mode prop 제거
    />
  );
}
