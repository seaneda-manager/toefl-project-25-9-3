// apps/web/models/listening/index.ts

// SSOT: Listening 타입은 여기(models/listening)에서만 import 하세요.
// 기존 레거시 타입/스키마는 그대로 재사용
import type { LQuestion } from "@/types/types-listening";
export * from "@/types/types-listening";

/** -----------------------------
 *  2026 iBT Listening Adaptive 구조 (beta)
 *  ----------------------------*/

/** 어떤 시험 포맷인지 (기존 vs 2026 개편) */
export type ExamEra = "ibt_legacy" | "ibt_2026";
// 읽기 ExamEra와 헷갈리지 않게 alias 하나 더
export type LExamEra = ExamEra;

/** Runner나 대시보드에서 쓸 최소 메타 정보 */
export interface LListeningTestMeta {
  id: string;
  label: string;
  examEra: ExamEra;
  source?: string | null;
}

/** 2026 Listening에서 지원할 Task 타입 */
export type ListeningTaskKind =
  | "short_response" // Listen and Choose a Response
  | "conversation"
  | "announcement"
  | "academic_talk";

/** 공통 베이스 (stage, 난이도 등) */
export interface LBaseItem {
  id: string;
  taskKind: ListeningTaskKind;
  stage: 1 | 2;
  audioUrl: string;
  title?: string; // UI에서 보여줄 짧은 제목 (옵션)
  transcript?: string; // study 모드에서만 보여줄 스크립트
  questions: LQuestion[]; // 기존 질문 타입 재사용
  difficulty?: "easy" | "core" | "hard";
}

/** ETS multistage 구조: Stage 1 / Stage 2 모듈 */
export interface LListeningModule {
  id: string;
  stage: 1 | 2;
  items: LBaseItem[];
  isPretest?: boolean; // 점수에 안 들어가는 pretest 아이템 표시용 (나중 확장)
}

/** 2026 형식 전체 Listening 세트 (Runner에서 바로 사용 가능) */
export interface LListeningTest2026 {
  meta: LListeningTestMeta; // examEra === 'ibt_2026' 여야 함
  modules: [LListeningModule, LListeningModule]; // [Stage1, Stage2]
}

/* ------------------------------------
 * Helpers
 * ------------------------------------*/

/** 모듈 단위 점수 계산 (choices 안의 isCorrect / is_correct 둘 다 지원) */
export function computeListeningModuleScore(
  module: LListeningModule,
  answers: Record<string, string>
): { correct: number; total: number } {
  let correct = 0;
  let total = 0;

  for (const item of module.items) {
    for (const q of item.questions) {
      total += 1;
      const user = answers[q.id];

      const choice = (q.choices ?? []).find((c: any) => {
        // 타입 보호를 느슨하게 해둠 (레거시 호환)
        return c.isCorrect === true || c.is_correct === true;
      });

      if (user && choice && user === (choice as any).id) {
        correct += 1;
      }
    }
  }

  return { correct, total };
}
