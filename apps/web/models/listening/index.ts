// SSOT: Listening 타입은 이 파일(models/listening)에서만 import 하세요.
export * from "@/types/types-listening";

// apps/web/models/listening/index.ts

// SSOT: Listening 타입은 여기에서만 import 하세요.

import type { LQuestion } from "@/types/types-listening";

// 기존 타입/스키마는 그대로 재사용
export * from "@/types/types-listening";

/** -----------------------------
 *  2026 iBT Listening Adaptive 구조 (beta)
 *  ----------------------------*/

/** 어떤 시험 포맷인지 (기존 vs 2026 개편) */
export type ExamEra = "ibt_legacy" | "ibt_2026";

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
