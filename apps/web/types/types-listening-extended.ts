// apps/web/types/types-listening-extended.ts
import { z } from 'zod';

/** 매우 관대한 스키마: 과거/현재 필드명 혼용을 모두 허용 */
const ChoiceZ = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    text: z.string().optional(),
    label: z.string().optional(),
    is_correct: z.boolean().optional(),
    correct: z.boolean().optional(),
  })
  .passthrough();

const QuestionZ = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    number: z.number().int().positive().optional(),
    // 본문 필드 혼용
    prompt: z.string().optional(),
    stem: z.string().optional(),
    text: z.string().optional(),
    body: z.string().optional(),
    // 선택지 필드 혼용
    choices: z.array(ChoiceZ).optional(),
    options: z.array(ChoiceZ).optional(),
    meta: z.any().optional(),
  })
  .passthrough();

const TrackZ = z
  .object({
    id: z.union([z.string(), z.number()]),
    title: z.string().optional(),
    name: z.string().optional(),
    // 오디오/이미지 필드 혼용
    audioUrl: z.string().optional(),
    audio_url: z.string().optional(),
    audio: z.string().optional(),
    imageUrl: z.string().optional(),
    image_url: z.string().optional(),
    questions: z.array(QuestionZ).optional(),
  })
  .passthrough();

/** 최상위 리스닝 세트 */
export const ListeningSetZ = z
  .object({
    setId: z.string().optional(),
    conversation: TrackZ,
    lecture: TrackZ,
  })
  .passthrough();

export type ListeningSet = z.infer<typeof ListeningSetZ>;
