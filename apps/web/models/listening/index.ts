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

/** 2026 Listening에서 지원할 Task 타입 (레거시 포함) */
export type ListeningTaskKind =
  | "short_response"
  | "conversation"
  | "announcement"
  | "academic_talk"
  // ── 2026 Updated TOEFL 신유형 ──
  | "academic_lecture"    // 기초 학술 강의 (4문항/세트, 60~90초)
  | "campus_audio_log";   // 캠퍼스 안내방송/팟캐스트 (2문항/세트, 30~45초)

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

// ─────────────────────────────────────────────────────────────────────────────
// Updated TOEFL Listening 2026 — 선형(Linear) 구조 (비적응형)
// ─────────────────────────────────────────────────────────────────────────────

/** 문항 선택지 (multi-select 대응: isCorrect 배열 위치로 판별) */
export interface LChoice2026 {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** 문항 (4지선다 또는 다중선택) */
export interface LQuestion2026 {
  id: string;
  number: number;
  type: "main_topic" | "detail" | "function" | "inference" | "attitude" | "multi_select" | "table";
  stem: string;
  choices: LChoice2026[];
  /** 정답 인덱스 배열 (단일선택은 length 1, 다중선택은 length 2+) */
  correctIndices: number[];
  /** 다중선택 시 선택해야 할 개수 (기본 1) */
  selectCount?: number;
}

/** 세트 하나 (오디오 1개 + 문항 N개) */
export interface LListeningTrack2026 {
  id: string;
  taskKind: "conversation" | "academic_lecture" | "campus_audio_log";
  title?: string;
  /** 오디오 파일 URL (실제 테스트용) */
  audioUrl: string;
  /** 리스닝 화면에 보여줄 컨텍스트 이미지 URL */
  illustrationUrl?: string;
  /** 실제 오디오 재생 시간(초) — 프로그레스바 계산용 */
  audioSeconds?: number;
  /** 스크립트 (study 모드 / 관리자 검토용) */
  transcript?: string;
  questions: LQuestion2026[];
  /** 문제 풀이 전체 제한 시간(초) — 기본 300 */
  testingSeconds?: number;
}

/** Updated TOEFL Listening 선형 시험 */
export interface LListeningTest2026Linear {
  meta: LListeningTestMeta;
  tracks: LListeningTrack2026[];
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
