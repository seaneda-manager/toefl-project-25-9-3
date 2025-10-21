// apps/web/lib/readingSchemas.ts
import { z } from 'zod';

/* ─────────────────────────────────────────────────────────────────────────────
 * Atoms
 * ────────────────────────────────────────────────────────────────────────────*/
export const ChoiceZ = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  /** 정답 마킹(선택) */
  is_correct: z.boolean().optional(),
  /** 선택지 해설(선택) */
  explain: z.string().nullable().optional(),
});

/** Summary 메타 */
const SummaryMetaZ = z
  .object({
    /** Summary 문제에서 뽑아야 할 선택지 개수 (예: 2) */
    selectionCount: z.number().int().min(1),
    /** 후보 문장들(선택) */
    candidates: z.array(z.string()).optional(),
    /** 정답 인덱스들(0-based, 선택) */
    correct: z.array(z.number().int().min(0)).optional(),
  })
  .strict();

/** Insertion 메타 */
const InsertionMetaZ = z
  .object({
    /**
     * 본문 삽입 위치 정보 (예: ["A","B","C","D"] 또는 [1,2,3,4])
     * anchors를 쓰지 않고 본문에 마커를 직접 박는 방식을 쓸 땐 marker를 사용.
     * (validate.ts에서 marker 개수와 보기 개수를 비교)
     */
    anchors: z.array(z.union([z.string(), z.number()])).min(2).optional(),
    /** 정답 인덱스(0-based) */
    correctIndex: z.number().int().min(0),
    /** 본문 내 삽입 마커 텍스트 (예: '[[INS]]' / '[#]' 등). anchors가 없을 때 사용 */
    marker: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((ins, ctx) => {
    // anchors도 marker도 전혀 없으면 안 됨
    if (!ins.anchors && !ins.marker) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['anchors'],
        message: 'insertion.meta에는 anchors 또는 marker 중 하나는 있어야 합니다.',
      });
    }
    if (ins.anchors && ins.correctIndex >= ins.anchors.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctIndex'],
        message: 'correctIndex가 anchors 범위를 벗어났습니다.',
      });
    }
  });

/** 대명사 참조 메타 */
const PronounRefMetaZ = z
  .object({
    pronoun: z.string().min(1),
    referents: z.array(z.string().min(1)).min(2),
    /** 정답 인덱스(0-based) */
    correctIndex: z.number().int().min(0),
  })
  .strict()
  .superRefine((pr, ctx) => {
    if (pr.correctIndex >= pr.referents.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctIndex'],
        message: 'correctIndex가 referents 범위를 벗어났습니다.',
      });
    }
  });

/* ─────────────────────────────────────────────────────────────────────────────
 * Question
 * ────────────────────────────────────────────────────────────────────────────*/
export const QuestionZ = z
  .object({
    id: z.string().min(1),
    number: z.number().int().positive(),
    type: z.enum([
      'vocab',
      'detail',
      'negative_detail',
      'paraphrasing',
      'insertion',
      'inference',
      'purpose',
      'pronoun_ref',
      'summary',
      'organization',
    ]),
    stem: z.string().min(1),
    choices: z.array(ChoiceZ).min(2),

    /** 문항 해설(문자/JSON 아무거나 허용, 선택) */
    // z.record는 키·값 타입 모두 지정
    explanation: z.union([z.string(), z.record(z.string(), z.any())]).nullable().optional(),

    /** 메타: 유형별 서브 구조(없어도 됨). 추가 필드는 통과 */
    meta: z
      .object({
        summary: SummaryMetaZ.optional(),
        insertion: InsertionMetaZ.optional(),
        pronoun_ref: PronounRefMetaZ.optional(),
      })
      .passthrough()
      .optional(),
  })
  // Summary 제약
  .superRefine((val, ctx) => {
    if (val.type === 'summary') {
      const sm = val.meta?.summary;
      if (!sm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meta', 'summary'],
          message: 'summary.type 에서는 meta.summary.selectionCount가 필요합니다.',
        });
        return;
      }
      const sc = sm.selectionCount;
      const cand = sm.candidates ?? [];
      const cor = sm.correct ?? [];

      if (cor.length !== sc) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meta', 'summary', 'correct'],
          message: `summary.correct 개수(${cor.length})가 selectionCount(${sc})와 일치해야 합니다.`,
        });
      }
      if (cor.some((i) => i < 0 || i >= cand.length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meta', 'summary', 'correct'],
          message: 'summary.correct 인덱스가 candidates 범위를 벗어났습니다.',
        });
      }
      // candidates가 주어졌다면 선택지 최소 개수도 같이 보장(선택적으로 강화)
      if (cand.length > 0 && cand.length < sc * 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meta', 'summary', 'candidates'],
          message: `summary.candidates는 최소 ${sc * 2}개 이상이어야 합니다.`,
        });
      }
    }
  })
  // Insertion 제약(추가)
  .superRefine((val, ctx) => {
    if (val.type === 'insertion') {
      const ins = val.meta?.insertion;
      if (!ins) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meta', 'insertion'],
          message: 'insertion.type 에서는 meta.insertion이 필요합니다.',
        });
        return;
      }
      // anchors가 있으면 choices 길이와 동일하면 이상적 (스키마 레벨에선 경고만)
      if (ins.anchors && ins.anchors.length !== val.choices.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meta', 'insertion', 'anchors'],
          message: `anchors(${ins.anchors.length})와 choices(${val.choices.length}) 개수가 다릅니다.`,
        });
      }
    }
  });

/* ─────────────────────────────────────────────────────────────────────────────
 * Passage
 * ────────────────────────────────────────────────────────────────────────────*/
export const PassageZ = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1), // HTML/Plain 모두 허용
  ui: z.any().optional(),
  questions: z.array(QuestionZ).min(1),
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Set (API export name = readingSetSchema)
 * ────────────────────────────────────────────────────────────────────────────*/
export const readingSetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  source: z.string().optional(),
  version: z.number().int().positive().default(1),
  passages: z.array(PassageZ).min(1),
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Types (Zod infer)
 * ────────────────────────────────────────────────────────────────────────────*/
export type RChoice = z.infer<typeof ChoiceZ>;
export type RQuestion = z.infer<typeof QuestionZ>;
export type RPassage = z.infer<typeof PassageZ>;
export type RSet = z.infer<typeof readingSetSchema>;

/* ─────────────────────────────────────────────────────────────────────────────
 * Parser helper: 일괄 파싱 + 에러 요약
 * ────────────────────────────────────────────────────────────────────────────*/
export function parseReadingSet(input: unknown) {
  const res = readingSetSchema.safeParse(input);
  if (res.success) return { ok: true as const, data: res.data };
  const issues = res.error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
  return { ok: false as const, issues };
}
