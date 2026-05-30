// lib/hi-naesin/grammar-generator.ts
// Claude Haiku를 이용한 문법 4지선다 드릴 자동 생성

import Anthropic from '@anthropic-ai/sdk';

export type GrammarQuestion = {
  sentenceTemplate: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  grammarCategory: string;
  contextBefore?: string;
};

const getClient = () =>
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── 문장 내 문법 드릴 (동사형태 / 접속사 / 분사 등) ──────────────────
export async function generateGrammarQuestions(
  sentences: Array<{ sentenceEn: string; sentenceKo: string }>,
): Promise<Array<{ orderIndex: number; question: GrammarQuestion }>> {
  if (sentences.length === 0) return [];

  try {
    const client = getClient();

    const sentenceList = sentences
      .map((s, i) => `[${i}] EN: ${s.sentenceEn}\n    KO: ${s.sentenceKo}`)
      .join('\n');

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a Korean 내신/수능 English teacher creating grammar multiple-choice questions.

Passage sentences:
${sentenceList}

For EACH sentence, create one 4-choice grammar question targeting its most important grammar point.

Grammar categories (use EXACTLY one):
시제 | 수 일치 | 분사 | 명사절 접속사 | 부사절 접속사 | 관계사 | 도치 | 가정법 | 수량 표현 | 대명사

Rules:
- Replace ONE word or short phrase with ____
- 3 wrong options must be plausible but grammatically incorrect in context
- Explanation: 1-2 sentences in Korean explaining WHY the correct answer is right
- If a sentence has no clear grammar test point, set "skip": true

Output ONLY a valid JSON array — no markdown, no extra text:
[
  {
    "sentenceIndex": 0,
    "skip": false,
    "sentenceTemplate": "The results ____ surprising to everyone.",
    "optionA": "were",
    "optionB": "was",
    "optionC": "are",
    "optionD": "being",
    "correct": "a",
    "explanation": "주어 'The results'는 복수명사이므로 복수 동사 were가 올바릅니다.",
    "grammarCategory": "수 일치"
  }
]`,
        },
      ],
    });

    const text =
      msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const items = JSON.parse(jsonMatch[0]) as Array<{
      sentenceIndex: number;
      skip?: boolean;
      sentenceTemplate: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correct: 'a' | 'b' | 'c' | 'd';
      explanation: string;
      grammarCategory: string;
    }>;

    return items
      .filter((item) => !item.skip && item.sentenceIndex < sentences.length)
      .map((item) => ({
        orderIndex: item.sentenceIndex,
        question: {
          sentenceTemplate: item.sentenceTemplate,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correct: item.correct,
          explanation: item.explanation,
          grammarCategory: item.grammarCategory,
        },
      }));
  } catch (e) {
    console.error('[generateGrammarQuestions] error:', e);
    return [];
  }
}

// ── 연결어 드릴 (문장 간 논리 관계) ─────────────────────────────────
export async function generateConnectiveQuestions(
  sentences: Array<{ sentenceEn: string }>,
): Promise<Array<{ orderIndex: number; question: GrammarQuestion }>> {
  if (sentences.length < 2) return [];

  try {
    const client = getClient();

    const pairList = sentences
      .slice(0, -1)
      .map(
        (s, i) =>
          `[${i}→${i + 1}] BEFORE: ${s.sentenceEn}\n  AFTER:  ${sentences[i + 1].sentenceEn}`,
      )
      .join('\n\n');

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a Korean 내신/수능 English teacher creating connective word (연결어) questions.

Consecutive sentence pairs from a passage:
${pairList}

For pairs where the AFTER sentence naturally begins with (or could begin with) a discourse connective, create a 4-choice question.

Connective categories: 역접 | 인과 | 추가 | 양보 | 예시 | 순서

Rules:
- If the AFTER sentence already starts with a connective, replace it with ____
- If it doesn't, but clearly needs one, show the sentence as "____, [rest of sentence]"
- If the logical relationship is unclear or the sentence doesn't benefit from a connective, set "skip": true
- 4 options must come from DIFFERENT logical relationship types
- Explanation in Korean: state the logical relationship between the two sentences

Output ONLY a valid JSON array:
[
  {
    "pairIndex": 0,
    "skip": false,
    "contextBefore": "The experiment produced excellent results.",
    "contextAfter": "____, the team decided to publish their findings.",
    "optionA": "Therefore",
    "optionB": "However",
    "optionC": "For example",
    "optionD": "Nevertheless",
    "correct": "a",
    "explanation": "앞 문장의 좋은 결과가 뒤 문장의 발표 결정의 원인이므로 인과 관계의 Therefore가 적합합니다.",
    "grammarCategory": "연결어"
  }
]`,
        },
      ],
    });

    const text =
      msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const items = JSON.parse(jsonMatch[0]) as Array<{
      pairIndex: number;
      skip?: boolean;
      contextBefore: string;
      contextAfter: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correct: 'a' | 'b' | 'c' | 'd';
      explanation: string;
      grammarCategory: string;
    }>;

    return items
      .filter((item) => !item.skip && item.pairIndex < sentences.length - 1)
      .map((item) => ({
        orderIndex: item.pairIndex,
        question: {
          sentenceTemplate: item.contextAfter,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correct: item.correct,
          explanation: item.explanation,
          grammarCategory: item.grammarCategory,
          contextBefore: item.contextBefore,
        },
      }));
  } catch (e) {
    console.error('[generateConnectiveQuestions] error:', e);
    return [];
  }
}
