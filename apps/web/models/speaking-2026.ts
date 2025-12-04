// apps/web/models/speaking-2026.ts
// Speaking 2026 SSOT

export type SpeakingTaskType2026 = "repeat" | "independent" | "integrated";

export interface SpeakingTaskBase2026 {
  id: string;
  type: SpeakingTaskType2026;

  // 준비/말하기 시간 (필요할 때만 사용)
  preparationSeconds?: number;
  speakingSeconds?: number;
}

// 1) Task Type: Repeat (문장 따라 말하기)
export interface SpeakingTaskRepeat2026 extends SpeakingTaskBase2026 {
  type: "repeat";
  // 학생이 따라 말할 문장
  prompt: string;
}

// 2) Task Type: Independent (의견 말하기)
export interface SpeakingTaskIndependent2026 extends SpeakingTaskBase2026 {
  type: "independent";
  // 질문 형태의 프롬프트
  question: string;
}

// 3) Task Type: Integrated (읽기 + 듣기 + 말하기)
export interface SpeakingTaskIntegrated2026 extends SpeakingTaskBase2026 {
  type: "integrated";
  readingText: string;
  listeningText: string;
  question: string;
}

export type SpeakingTask2026 =
  | SpeakingTaskRepeat2026
  | SpeakingTaskIndependent2026
  | SpeakingTaskIntegrated2026;

export interface SpeakingTest2026 {
  id: string;
  label: string;
  tasks: SpeakingTask2026[];
}
