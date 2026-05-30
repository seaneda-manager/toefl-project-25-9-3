'use server';

import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { gradeTranslation, gradeWriting } from '@/lib/hi-naesin/translation-grader';

type Fail = { ok: false; error: string };

// ── 드릴 답변 제출 ────────────────────────────────────────
// type  = 현재 블록 타입 (translation | fill_blank | writing | grammar_choice)
// step  = 블록 내 인덱스 (0-based)
export async function submitDrillAnswerAction(
  sessionId: string,
  drillId: string,
  type: string,
  step: number,
  fd: FormData,
): Promise<Fail | void> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: '로그인 필요' };

  const drillType      = (fd.get('drill_type') as string)?.trim();
  const responseText   = (fd.get('response_text') as string)?.trim() ?? '';
  const responseChoice = (fd.get('response_choice') as string)?.trim() ?? '';

  let isCorrect:    boolean | null = null;
  let scorePct:     number  | null = null;
  let feedbackText: string  | null = null;

  if (drillType === 'fill_blank') {
    const answer = (fd.get('answer') as string)?.trim().toLowerCase();
    isCorrect = responseText.toLowerCase() === answer;

  } else if (drillType === 'grammar_choice') {
    const correct = (fd.get('correct_option') as string)?.trim();
    isCorrect = responseChoice === correct;

  } else if (drillType === 'translation') {
    const sentenceEn = (fd.get('sentence_en') as string)?.trim() ?? '';
    const answerKo   = (fd.get('answer_ko') as string)?.trim() ?? '';
    if (sentenceEn && answerKo && responseText) {
      const result = await gradeTranslation(sentenceEn, answerKo, responseText);
      if (result) {
        isCorrect    = result.isCorrect;
        scorePct     = result.scorePct;
        feedbackText = result.feedbackText;
      }
    }

  } else if (drillType === 'writing') {
    const promptKo = (fd.get('prompt_ko') as string)?.trim() ?? '';
    const answerEn = (fd.get('answer_en') as string)?.trim() ?? '';
    if (promptKo && answerEn && responseText) {
      const result = await gradeWriting(promptKo, answerEn, responseText);
      if (result) {
        isCorrect    = result.isCorrect;
        scorePct     = result.scorePct;
        feedbackText = result.feedbackText;
      }
    }
  }

  const { error } = await supabase
    .from('hi_naesin_drill_responses')
    .upsert(
      {
        session_id:      sessionId,
        drill_id:        drillId,
        response_text:   responseText || null,
        response_choice: responseChoice || null,
        is_correct:      isCorrect,
        score_pct:       scorePct,
        feedback_text:   feedbackText,
      },
      { onConflict: 'session_id,drill_id' },
    );

  if (error) return { ok: false, error: error.message };

  // 응답 존재 여부로 isAnswered 판단하므로 done 파라미터 불필요
  redirect(`/hi-naesin/drill/${sessionId}?type=${type}&step=${step}`);
}

// ── 자기 채점 폴백 ────────────────────────────────────────
export async function selfCheckDrillAction(
  sessionId: string,
  drillId: string,
  type: string,
  step: number,
  typeTotal: number,
  nextType: string | null,
  isCorrect: boolean,
): Promise<Fail | void> {
  const supabase = await getServerSupabase();

  await supabase
    .from('hi_naesin_drill_responses')
    .update({ is_correct: isCorrect })
    .eq('session_id', sessionId)
    .eq('drill_id', drillId);

  await buildNextUrl(sessionId, type, step, typeTotal, nextType);
}

// ── 다음으로 ──────────────────────────────────────────────
export async function nextDrillStepAction(
  sessionId: string,
  type: string,
  step: number,
  typeTotal: number,
  nextType: string | null,
): Promise<void> {
  await buildNextUrl(sessionId, type, step, typeTotal, nextType);
}

// ── 내부 헬퍼 ─────────────────────────────────────────────
async function buildNextUrl(
  sessionId: string,
  type: string,
  step: number,
  typeTotal: number,
  nextType: string | null,
): Promise<never> {
  const nextStep = step + 1;

  if (nextStep < typeTotal) {
    // 같은 블록 내 다음 문제
    redirect(`/hi-naesin/drill/${sessionId}?type=${type}&step=${nextStep}`);
  } else if (nextType) {
    // 다음 블록의 첫 번째 문제 (step=0, 페이지에서 미완료 위치 자동 계산)
    redirect(`/hi-naesin/drill/${sessionId}?type=${nextType}`);
  } else {
    // 모든 블록 완료
    const supabase = await getServerSupabase();
    await supabase
      .from('hi_naesin_sessions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', sessionId);
    redirect(`/hi-naesin/drill/${sessionId}/complete`);
  }
}
