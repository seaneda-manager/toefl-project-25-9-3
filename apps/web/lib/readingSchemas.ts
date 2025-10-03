// apps/web/lib/readingSchemas.ts
import { z } from 'zod';

export const readingSetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  source: z.string().optional(),
  version: z.number().int().positive().default(1),
  passages: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
    ui: z.any().optional(),
    questions: z.array(z.any()),
  })),
});
