// apps/web/app/(protected)/listening-2026/adaptive-demo/demo-data.ts
import type { LListeningTest2026 } from "@/models/listening";

export const demoListeningTest2026: LListeningTest2026 = {
  meta: {
    id: "listening-2026-demo-1",
    label: "2026 Adaptive Listening Demo",
    examEra: "ibt_2026",
    source: "demo",
  },
  modules: [
    // ---------- Stage 1 (18문항) ----------
    {
      id: "L-mod-1",
      stage: 1,
      isPretest: false,
      items: [
        // ① Listen and Choose a Response (8문항)
        ...Array.from({ length: 8 }).map((_, i) => ({
          id: `sr-1-${i + 1}`,
          taskKind: "short_response" as const,
          stage: 1 as const,
          audioUrl: "/audio/dev/sr-1.mp3", // TODO: 실제 파일로 교체
          transcript: "", // TODO: 필요하면 Study 모드에서 사용할 스크립트
          difficulty: "core" as const,
          questions: [
            {
              id: `sr-1-${i + 1}-q1`,
              number: i + 1,
              type: "detail" as any,
              stem: "TODO: What would be the most appropriate response?",
              choices: [
                { id: "a", text: "TODO: Response A", isCorrect: false },
                { id: "b", text: "TODO: Response B", isCorrect: true },
                { id: "c", text: "TODO: Response C", isCorrect: false },
                { id: "d", text: "TODO: Response D", isCorrect: false },
              ],
            } as any,
          ],
        })),

        // ② Conversation (예: 2지문 × 2문항 = 4문항)
        {
          id: "conv-1-1",
          taskKind: "conversation",
          stage: 1,
          audioUrl: "/audio/dev/conv-1-1.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "conv-1-1-q1",
              number: 9,
              type: "detail" as any,
              stem: "TODO: What problem does the student have?",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "conv-1-1-q2",
              number: 10,
              type: "inference" as any,
              stem: "TODO: What does the professor imply?",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },
        {
          id: "conv-1-2",
          taskKind: "conversation",
          stage: 1,
          audioUrl: "/audio/dev/conv-1-2.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "conv-1-2-q1",
              number: 11,
              type: "detail" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "conv-1-2-q2",
              number: 12,
              type: "purpose" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },

        // ③ Campus Announcement (2문항)
        {
          id: "ann-1-1",
          taskKind: "announcement",
          stage: 1,
          audioUrl: "/audio/dev/announcement-1.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "ann-1-1-q1",
              number: 13,
              type: "detail" as any,
              stem: "TODO: What is the main topic of the announcement?",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "ann-1-1-q2",
              number: 14,
              type: "purpose" as any,
              stem: "TODO: Why was this announcement made?",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },

        // ④ Academic Talk / Lecture (4문항)
        {
          id: "acad-1-1",
          taskKind: "academic_talk",
          stage: 1,
          audioUrl: "/audio/dev/academic-1.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "acad-1-1-q1",
              number: 15,
              type: "detail" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "acad-1-1-q2",
              number: 16,
              type: "inference" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "acad-1-1-q3",
              number: 17,
              type: "organization" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: true },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "acad-1-1-q4",
              number: 18,
              type: "purpose" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: true },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },
      ],
    },

    // ---------- Stage 2 (16문항) ----------
    {
      id: "L-mod-2",
      stage: 2,
      isPretest: false,
      items: [
        // short_response 8문항
        ...Array.from({ length: 8 }).map((_, i) => ({
          id: `sr-2-${i + 1}`,
          taskKind: "short_response" as const,
          stage: 2 as const,
          audioUrl: "/audio/dev/sr-2.mp3",
          transcript: "",
          difficulty: "core" as const,
          questions: [
            {
              id: `sr-2-${i + 1}-q1`,
              number: i + 1,
              type: "detail" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        })),

        // conversation 1지문 × 2문항
        {
          id: "conv-2-1",
          taskKind: "conversation",
          stage: 2,
          audioUrl: "/audio/dev/conv-2-1.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "conv-2-1-q1",
              number: 9,
              type: "detail" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "conv-2-1-q2",
              number: 10,
              type: "purpose" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },

        // announcement 1지문 × 2문항
        {
          id: "ann-2-1",
          taskKind: "announcement",
          stage: 2,
          audioUrl: "/audio/dev/announcement-2.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "ann-2-1-q1",
              number: 11,
              type: "detail" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "ann-2-1-q2",
              number: 12,
              type: "purpose" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },

        // academic talk 1지문 × 4문항 (총 16)
        {
          id: "acad-2-1",
          taskKind: "academic_talk",
          stage: 2,
          audioUrl: "/audio/dev/academic-2.mp3",
          transcript: "",
          difficulty: "core",
          questions: [
            {
              id: "acad-2-1-q1",
              number: 13,
              type: "detail" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: true },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "acad-2-1-q2",
              number: 14,
              type: "inference" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: true },
                { id: "c", text: "TODO", isCorrect: false },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "acad-2-1-q3",
              number: 15,
              type: "organization" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: true },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
            {
              id: "acad-2-1-q4",
              number: 16,
              type: "purpose" as any,
              stem: "TODO",
              choices: [
                { id: "a", text: "TODO", isCorrect: false },
                { id: "b", text: "TODO", isCorrect: false },
                { id: "c", text: "TODO", isCorrect: true },
                { id: "d", text: "TODO", isCorrect: false },
              ],
            } as any,
          ],
        },
      ],
    },
  ],
};
