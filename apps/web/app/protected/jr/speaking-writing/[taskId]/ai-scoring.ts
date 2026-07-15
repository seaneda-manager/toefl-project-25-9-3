"use server";

/**
 * Speaking & Writing 자동 채점 엔진
 * - Writing: 문법/어휘/조직력 평가
 * - Speaking: 발음/유창성/정확성 평가
 */

export async function scoreWritingAction(input: {
  writingText: string;
  taskPrompt: string;
  studentId: string;
}) {
  try {
    // TODO: AI 채점 통합 (Claude API)
    // - 작성 내용 분석
    // - 문법/어휘 검토
    // - 조직력/논리성 평가
    // - 피드백 생성

    const score = {
      grammar: 85,
      vocabulary: 80,
      organization: 75,
      overall: 80,
      feedback: "Good structure and vocabulary usage. Watch for comma splice in sentence 3.",
    };

    return { ok: true, score };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

export async function scoreSpeakingAction(input: {
  audioUrl: string;
  taskPrompt: string;
  studentId: string;
}) {
  try {
    // TODO: AI 채점 통합 (Whisper + Speech Analysis)
    // - 음성 텍스트 변환 (Whisper)
    // - 발음 분석
    // - 유창성 분석 (WPM, pause detection)
    // - 정확성 분석 (문법, 단어 사용)
    // - 종합 피드백 생성

    const score = {
      pronunciation: 82,
      fluency: 78,
      accuracy: 80,
      overall: 80,
      transcript: "[음성 전사 텍스트]",
      feedback: "Good pronunciation. Work on reducing filler words like 'uh' and 'um'.",
    };

    return { ok: true, score };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
