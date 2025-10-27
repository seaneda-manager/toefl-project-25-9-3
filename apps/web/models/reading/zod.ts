import { z } from "zod"

export const RChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  is_correct: z.boolean().optional(),
  explain: z.string().nullable().optional(),
  ord: z.number().int().optional(),
  label: z.string().optional(),
  meta: z.unknown().optional(),
})

export const RQuestionSchema = z.object({
  id: z.string(),
  passage_id: z.string().optional(),
  number: z.number().int(),
  type: z.string(),
  stem: z.string(),
  choices: z.array(RChoiceSchema),
  meta: z.any().optional(),
  explanation: z.any().optional(),
})

export const RPassageSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  text: z.string(),
  meta: z.unknown().optional(),
  questions: z.array(RQuestionSchema),
})

export const RSetSchema = z.object({
  id: z.string(),
  source: z.string().optional(),
  topic: z.string().optional(),
  passages: z.array(RPassageSchema),
  meta: z.unknown().optional(),
})
