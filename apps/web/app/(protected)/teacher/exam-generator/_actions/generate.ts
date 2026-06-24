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
    .select('id, title, passage_text')
    .in('school_name', schoolFilter)
    .eq('grade', grade)
    .eq('exam_year', examYear)
    .eq('exam_month', examMonth)
    .eq('is_published', true)
    .limit(30);

  if (error || !passages || passages.length === 0) {
    return { questions: [], error: '해당 학교/학년의 지문이 없습니다.' };
  }

  const passageList = passages
    .map((p, i) => `[${i + 1}] 제목: ${p.title || '제목없음'}\n${p.passage_text}`)
    .join('\n\n---\n\n');

  const prompt = `다음은 고등학교 내신 대비 영어 지문 ${passages.length}개입니다.
각 지문마다 수능 스타일 문제를 정확히 1문항씩 만들어 총 ${passages.length}문항을 생성하세요.

지문 목록:
${passageList}

━━━ 규칙 ━━━
- 지문 1개 → 문제 1개. 순서대로 number 1~${passages.length}.
- 문제 유형은 아래 중 하나를 지문에 맞게 선택:
  글의 목적 / 필자 주장 / 요지 / 주제 / 제목 / 내용 일치 / 내용 불일치 / 어법 / 어휘 / 빈칸 추론 / 문단 순서 / 문장 삽입 / 서술형
- question 필드에 발문 + 해당 지문 전체 텍스트를 반드시 포함 (지문 번호 참조 금지)
- 어법/어휘/빈칸/순서/삽입 문제는 지문을 변형하여 question 필드에 직접 포함
- 5지선다는 ① ② ③ ④ ⑤ 사용
- 서술형은 options 빈 배열, answer는 모범답안, explanation은 채점기준
- 발문은 한국어, 지문과 보기는 영어
- explanation은 정답 근거를 지문 인용과 함께 한국어로

━━━ 출력 형식 ━━━
반드시 JSON 배열만 응답 (다른 텍스트 없이):
[
  {
    "number": 1,
    "type": "빈칸 추론",
    "question": "다음 글의 빈칸에 들어갈 말로 가장 적절한 것은?\\n\\n[지문 전체 텍스트, 빈칸은 ______ 로 표시]",
    "options": ["① ...", "② ...", "③ ...", "④ ...", "⑤ ..."],
    "answer": "③",
    "explanation": "정답 근거..."
  }
]`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 32000,
      messages: [{ role: 'user', content: prompt }],
    });

    const msg = await stream.finalMessage();

    const textBlock = msg.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { questions: [], error: 'AI 응답이 비어있습니다.' };
    }

    const text = textBlock.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { questions: [], error: 'JSON 파싱 실패: ' + text.slice(0, 200) };
    }

    let questions: ExamQuestion[];
    try {
      questions = JSON.parse(jsonrepair(jsonMatch[0]));
    } catch {
      const raw = jsonMatch[0];
      const recovered: ExamQuestion[] = [];
      const objRe = /\{\s*"number"\s*:[\s\S]*?\}(?=\s*[,\]])/g;
      let m: RegExpExecArray | null;
      while ((m = objRe.exec(raw)) !== null) {
        try { recovered.push(JSON.parse(jsonrepair(m[0]))); } catch { /* skip */ }
      }
      if (recovered.length === 0) {
        return { questions: [], error: 'JSON 파싱 실패: ' + raw.slice(0, 300) };
      }
      questions = recovered;
    }
    return { questions };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { questions: [], error: 'AI 오류: ' + msg };
  }
}
