'use server';

import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { getServerSupabase } from '@/lib/supabase/server';

export type ExamQuestion = {
  number: number;
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
};

export async function generateExamQuestions(
  schools: string[],
  grade: string,
  examYear: number,
  examMonth: number,
): Promise<{ questions: ExamQuestion[]; error?: string }> {
  const supabase = await getServerSupabase();

  const schoolFilter = [...new Set([...schools, '공통'])];

  const { data: passages, error } = await supabase
    .from('hi_naesin_passages')
    .select('id, title, passage_text, translation_ko, hi_naesin_assignments!inner(id)')
    .in('school_name', schoolFilter)
    .eq('grade', grade)
    .eq('exam_year', examYear)
    .eq('exam_month', examMonth)
    .eq('is_published', true)
    .limit(10);

  if (error || !passages || passages.length === 0) {
    return { questions: [], error: '해당 학교/학년의 지문이 없습니다.' };
  }

  const passageBlock = passages
    .map((p, i) =>
      `[지문 ${i + 1}] ${p.title || '제목없음'}\n${p.passage_text}`,
    )
    .join('\n\n---\n\n');

  const prompt = `다음은 고등학교 내신 대비 영어 지문들입니다. 이 지문들을 활용하여 실제 수능과 동일한 형식의 예상 문제 30문항을 만드세요.

지문:
${passageBlock}

━━━ 문제 구성 (총 30문항) ━━━
아래 유형별로 정확히 배분하세요:

[글의 목적/심경/주장] 5문항
- "다음 글의 목적으로 가장 적절한 것은?"
- "다음 글에 드러난 필자의 심경 변화로 가장 적절한 것은?"
- "다음 글에서 필자가 주장하는 바로 가장 적절한 것은?"
- "다음 글의 요지로 가장 적절한 것은?"
- "다음 글의 주제로 가장 적절한 것은?"

[내용 일치/불일치] 4문항
- "다음 글의 내용과 일치하는 것은?" / "일치하지 않는 것은?"
- 보기 ①~⑤는 지문 내용을 구체적으로 서술 (사실 확인 가능한 문장)

[어법] 5문항
- "다음 글의 밑줄 친 (A), (B), (C)의 각 괄호 안에서 어법에 맞는 표현으로 가장 적절한 것은?"
  형식: 지문에 (A)[단어1/단어2], (B)[단어1/단어2], (C)[단어1/단어2] 삽입
  보기: (A)-(B)-(C) 조합 5개
- 또는: "다음 글의 밑줄 친 ①~⑤ 중 어법상 틀린 것은?" (밑줄 번호형)

[어휘] 4문항
- "다음 글의 밑줄 친 단어의 쓰임이 적절하지 않은 것은?"
- 지문에 ①~⑤ 밑줄 표시, 하나는 문맥상 부적절한 단어로 교체

[빈칸 추론] 6문항
- "다음 글의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?" (연결어 포함)
- "다음 글의 빈칸에 들어갈 말로 가장 적절한 것은?" (핵심 개념어)
- 빈칸은 지문 내 ______로 표시

[문단 순서] 3문항
- "주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?"
- 형식: 주어진 도입부 + (A)(B)(C) 세 단락 제시
- 보기: ①(A)-(B)-(C) ②(A)-(C)-(B) ③(B)-(A)-(C) ④(B)-(C)-(A) ⑤(C)-(B)-(A)

[문장 삽입] 3문항
- "글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?"
- 지문에 ①②③④⑤ 위치 표시

[서술형] 2~3문항 (학교 내신 서술형 스타일)
- 유형 1 — 요약문 완성: "다음 글의 내용을 한 문장으로 요약할 때, 빈칸 (A)와 (B)에 들어갈 가장 적절한 단어를 본문에서 찾아 쓰시오." → 요약 문장에 (A), (B) 빈칸 제시
- 유형 2 — 영작: "다음 우리말과 일치하도록 주어진 단어를 활용하여 영어 문장을 완성하시오." → 한국어 문장 + 단어 힌트(조건) + 빈칸 영작
- 유형 3 (선택) — 내용 파악: "다음 글을 읽고, 질문에 대한 답을 본문에서 찾아 영어로 쓰시오." → 영어 질문 + 영어 답
- 서술형은 options 없음, answer는 모범 답안, explanation은 채점 기준 포함

━━━ 작성 규칙 ━━━
- 모든 지문/보기는 영어로, 발문(문제 지시문)은 한국어로
- 5지선다 보기는 반드시 ① ② ③ ④ ⑤ 기호 사용
- 해설은 정답 근거를 지문 문장 인용과 함께 한국어로 설명
- 실제 수능 EBS 연계 교재 문체와 난이도에 맞게 작성
- 각 지문을 여러 유형에 걸쳐 활용 가능

━━━ 출력 형식 ━━━
총 30문항 (객관식 27~28문항 + 서술형 2~3문항)
반드시 아래 JSON 배열로만 응답하세요 (다른 텍스트 없이):
[
  {
    "number": 1,
    "type": "글의 목적",
    "question": "발문만 작성. 지문 참조는 [지문 N]으로 표기. 변형이 필요한 경우(밑줄/빈칸/번호)만 해당 문장을 인용",
    "options": ["① ...", "② ...", "③ ...", "④ ...", "⑤ ..."],
    "answer": "③",
    "explanation": "정답 근거 설명..."
  },
  {
    "number": 29,
    "type": "서술형",
    "question": "발문 + 지문 + 요약문/조건 전체",
    "options": [],
    "answer": "(A) motivation (B) external",
    "explanation": "채점 기준: (A) 1점 — motivation 또는 동의어 허용. (B) 1점 — external 정확히 일치."
  }
]`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = await client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    });

    const msg = await stream.finalMessage();

    const textBlock = msg.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { questions: [], error: 'AI 응답이 비어있습니다.' };
    }

    // Extract JSON from response
    const text = textBlock.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { questions: [], error: 'JSON 파싱 실패: ' + text.slice(0, 200) };
    }

    let questions: ExamQuestion[];
    try {
      questions = JSON.parse(jsonrepair(jsonMatch[0]));
    } catch {
      // jsonrepair couldn't fix it — try extracting individual objects
      const raw = jsonMatch[0];
      const recovered: ExamQuestion[] = [];
      // Match each {...} block that starts with "number"
      const objRe = /\{\s*"number"\s*:[\s\S]*?\}(?=\s*[,\]])/g;
      let m: RegExpExecArray | null;
      while ((m = objRe.exec(raw)) !== null) {
        try {
          recovered.push(JSON.parse(jsonrepair(m[0])));
        } catch {
          // skip unparseable individual block
        }
      }
      if (recovered.length === 0) {
        return { questions: [], error: 'JSON 파싱 실패 (복구 불가): ' + raw.slice(0, 300) };
      }
      questions = recovered;
    }
    return { questions };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { questions: [], error: 'AI 오류: ' + msg };
  }
}
