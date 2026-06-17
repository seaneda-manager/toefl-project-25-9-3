// apps/web/models/speaking-2026.ts
// Speaking 2026 SSOT

export type SpeakingTaskType2026 = "listen_repeat" | "interview";

// ── Task 1: 듣고 따라말하기 ────────────────────────────────────────
// 특정 상황(situation)에서 여러 문장을 듣고 하나씩 따라 말하기
// 순서: [문장 음성] → beep → [학생 말하기] → beep(종료) → 다음 문장

export type ListenRepeatSentence = {
  id: string;
  text: string;          // TTS 또는 음성 파일에 쓸 텍스트
  audioUrl?: string;     // 실제 음성 파일 (나중에 연결)
  speakingSeconds: number; // 학생에게 주어지는 말하기 시간(초)
};

export interface SpeakingTaskListenRepeat2026 {
  id: string;
  type: "listen_repeat";
  situation: string;              // e.g. "laundry room", "computer lab"
  situationDescription?: string;  // 상황 설명 (1-2문장)
  sentences: ListenRepeatSentence[];
}

// ── Task 2: 인터뷰 ────────────────────────────────────────────────
// 5~6개 질문, 각 45초 답변
// 순서: [질문 음성] → beep → [학생 말하기 45초] → beep(종료) → 다음 질문

export type InterviewQuestion = {
  id: string;
  text: string;          // 질문 텍스트
  audioUrl?: string;     // 실제 음성 파일 (나중에 연결)
  topic?: string;        // 주제 태그 (e.g. "education", "technology")
  speakingSeconds: number; // 말하기 시간(초), 기본 45
};

export interface SpeakingTaskInterview2026 {
  id: string;
  type: "interview";
  questions: InterviewQuestion[];
}

export type SpeakingTask2026 =
  | SpeakingTaskListenRepeat2026
  | SpeakingTaskInterview2026;

export interface SpeakingTest2026 {
  id: string;
  label: string;
  tasks: SpeakingTask2026[];
}
