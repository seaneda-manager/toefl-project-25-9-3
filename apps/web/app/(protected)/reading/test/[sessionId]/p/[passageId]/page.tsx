// apps/web/app/(protected)/reading/test/[sessionId]/p/[passageId]/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import ReadingTestRunner from '@/app/(protected)/reading/test/ReadingTestRunner';

// ?꾨찓?????(Runner媛 湲곕??섎뒗 ???
import type {
  Passage as ReadingPassage,
  Question as ReadingQuestion,
} from '@/types/types-reading';

// ?뚯뒪 ???(DB/RPC?먯꽌 媛?몄삤???뚯뒪?????
import type {
  Passage as TestPassage,
  Question as TestQuestion,
} from '@/app/types/test';

/** ?????????????????????????????????????????????????????????????
 *  ?대뙌?? TestPassage ??ReadingPassage
 *  - Question.type ???놁쑝硫?湲곕낯媛?'detail' 遺??(洹쒖튃 ?꾩슂???섏젙)
 *  - prompt ?놁쑝硫?stem ??text ??title ?쒖쑝濡?蹂닿컯
 *  - title/text???덉쟾?섍쾶 蹂닿컯
 *  ????????????????????????????????????????????????????????????? */
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

  // ?ㅼ젣 ?꾨줈?앺듃??RPC/荑쇰━??留욊쾶 ?⑥닔紐??뚮씪誘명꽣 議곗젙
  const { data: testPassage, error } = await supabase
    .rpc('reading_get_test_passage', { passage_id: passageId })
    .returns<unknown>()
    .single();

  if (error || !testPassage) {
    // ?대갚(Mock)
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
        // ??mode prop ?쒓굅 (Runner媛 諛쏆? ?딆쓬)
      />
    );
  }

  const readingPassage = adaptPassage(testPassage as TestPassage);

  return (
    <ReadingTestRunner
      sessionId={sessionId}
      passage={readingPassage}
      // ??mode prop ?쒓굅
    />
  );
}

