// apps/web/app/types/types-listening-extended.ts
import { z } from 'zod';

export const EvidenceSpan = z.object({
  segmentId: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});
export type EvidenceSpan = z.infer<typeof EvidenceSpan>;

export const Clip = z.object({
  startSec: z.number().nonnegative(),
  endSec: z.number().optional(),
});
export type Clip = z.infer<typeof Clip>;

export const LChoiceZ = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean().optional(),
  explanation: z.string().optional(),
  evidence: z.array(EvidenceSpan).optional(),
});
export type LChoice = z.infer<typeof LChoiceZ>;

export const LQuestionZ = z.object({
  id: z.string(),
  number: z.number().int().optional(),
  prompt: z.string(),
  qtype: z.enum(['detail','purpose','function','inference','gist','attitude','organization']).optional(),
  clip: Clip.optional(),
  explanation: z.string().optional(),
  evidence: z.array(EvidenceSpan).optional(),
  tags: z.array(z.string()).optional(),
  choices: z.array(LChoiceZ).min(2),
});
export type LQuestion = z.infer<typeof LQuestionZ>;

export const TranscriptSegment = z.object({
  id: z.string(),
  startSec: z.number().nonnegative(),
  endSec: z.number().optional(),
  speaker: z.string().optional(),
  text: z.string(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegment>;

export const ListeningTrackZ = z.object({
  id: z.string(),
  title: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string(),
  durationSec: z.number().optional(),
  timeLimitSec: z.number().optional(),
  transcript: z.array(TranscriptSegment).optional(),
  playsAllowed: z.object({ t: z.number().optional(), p: z.number().optional(), r: z.number().optional() }).optional(),
  questions: z.array(LQuestionZ),
});
export type ListeningTrack = z.infer<typeof ListeningTrackZ>;

export const ListeningSetZ = z.object({
  setId: z.string(),         // == listening_sets.id
  tpo: z.number().optional(),
  title: z.string().optional(),
  locale: z.string().optional(),
  conversation: ListeningTrackZ,
  lecture: ListeningTrackZ,
});
export type ListeningSet = z.infer<typeof ListeningSetZ>;
