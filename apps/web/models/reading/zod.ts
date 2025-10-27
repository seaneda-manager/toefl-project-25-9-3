// apps/web/models/reading/zod.ts
import { z } from 'zod';

/** -----------------------------
 *  Question type (SSOT)
 *  ----------------------------*/
export const READING_QTYPES = [
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
] as const;

export const qTypeEnum = z.enum(READING_QTYPES);

/** -----------------------------
 *  Choice
 *  ----------------------------*/
export const readingChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, 'choice.text is required'),
  isCorrect: z.boolean().optional(), // summary 외엔 1개만 true, summary는 무시
});
export type RChoice = z.infer<typeof readingChoiceSchema>;

/** -----------------------------
 *  Meta per type (loosely typed)
 *  ----------------------------*/
// summary
const summaryMetaSchema = z.object({
  candidates: z.array(z.string()).default([]),
  correct: z.array(z.number().int().nonnegative()).default([]), // 0-based indices
  selectionCount: z.number().int().positive().default(2),
});

// insertion
const insertionMetaSchema = z.object({
  anchors: z.array(z.union([z.string(), z.number()])).default([]),
  correctIndex: z.number().int().nonnegative().optional(),
});

// pronoun_ref
const pronounRefMetaSchema = z.object({
  pronoun: z.string().optional(),
  referents: z.array(z.string()).default([]),
  correctIndex: z.number().int().nonnegative().optional(),
});

// paragraph_highlight
const paragraphHighlightMetaSchema = z.object({
  paragraphs: z.array(z.number().int().nonnegative()).default([]),
});

// 전체 meta 컨테이너 (유형별 서브키를 선택적으로 보유)
export const readingMetaSchema = z.object({
  summary: summaryMetaSchema.optional(),
  insertion: insertionMetaSchema.optional(),
  pronoun_ref: pronounRefMetaSchema.optional(),
  paragraph_highlight: paragraphHighlightMetaSchema.optional(),
}).passthrough(); // 유연성 확보

/** -----------------------------
 *  Question
 *  ----------------------------*/
export const readingQuestionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  type: qTypeEnum,
  stem: z.string().min(1, 'stem is required'),
  choices: z.array(readingChoiceSchema).min(1, 'at least 1 choice'),
  meta: readingMetaSchema.optional(),
});
export type RQuestion = z.infer<typeof readingQuestionSchema>;

/** -----------------------------
 *  Passage
 *  ----------------------------*/
export const readingPassageSchema = z.object({
  id: z.string().min(1),
  title: z.string().default(''),
  paragraphs: z.array(z.string().min(1)).min(1, 'at least 1 paragraph'),
  questions: z.array(readingQuestionSchema).default([]),
});
export type RPassage = z.infer<typeof readingPassageSchema>;

/** -----------------------------
 *  Reading Set (SSOT 루트)
 *  ----------------------------*/
export const readingSetSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(''),
  source: z.string().default(''),
  version: z.number().int().nonnegative().default(1),
  passages: z.array(readingPassageSchema).min(1, 'at least 1 passage'),
});
export type RSet = z.infer<typeof readingSetSchema>;
