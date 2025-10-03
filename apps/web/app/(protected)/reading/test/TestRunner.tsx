'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RPassage, RChoice } from '@/types/types-reading';
import Timer from '@/components/Timer';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import QuestionCard from '@/components/QuestionCard';

import { submitReadingAnswer, finishReadingSession } from '@/actions/reading';

type Props = {
  passage: RPassage;
  onFinish: (sessionId: string) => void;
};

type FinishRes = { ok?: boolean; sessionId?: string; id?: string };

export default function TestRunner({ passage, onFinish }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // 제한시간(초)
  const TOTAL_SEC = 10 * 60;

  // 문항 정렬(번호 기준)
  const questions = useMemo(
    () => [...(passage?.questions ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [passage?.questions]
  );

  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  // 임시 세션 ID 생성(실제 세션 붙이기 전)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!ignore) setSessionId((prev) => prev ?? `local-${Date.now()}`);
      } catch {
        // no-op
      }
    })();
    return () => {
      ignore = true;
    };
  }, [passage.id]);

  // 단일 답안 저장
  const handleAnswer = async (qId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: choiceId }));
    try {
      await submitReadingAnswer({
        sessionId: sessionId ?? undefined,
        questionId: String(qId),
        choiceId: String(choiceId),
      } as any);
    } catch {
      // no-op
    }
  };

  // 임시 저장(모든 답 한번에 업서트)
  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(answers).map(([qId, cId]) =>
          submitReadingAnswer({
            sessionId: sessionId ?? undefined,
            questionId: String(qId),
            choiceId: String(cId),
          } as any)
        )
      );
    } catch {
      // no-op
    }
  };

  // 종료
  const handleFinish = async () => {
    try {
      const res = (await finishReadingSession({
        sessionId: sessionId ?? undefined,
      } as any)) as FinishRes;

      const sid: string = res?.sessionId ?? res?.id ?? sessionId ?? 'latest';
      onFinish(String(sid));
    } catch {
      onFinish(String(sessionId ?? 'latest'));
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단: 진행률/타이머/버튼 */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Questions</div>
          <div className="hidden w-48 sm:block">
            <Progress value={progressPct} />
          </div>
          <div className="text-xs text-gray-500 sm:text-sm">
            Answered{' '}
            <span className="tabular-nums">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Timer totalSec={TOTAL_SEC} onTimeUp={handleFinish} />
          <Button variant="outline" onClick={handleSave}>
            Save
          </Button>
          <Button onClick={handleFinish}>Finish</Button>
        </div>
      </div>

      {/* 문항 카드 */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl border border-gray-100 bg-white shadow-soft">
            <div className="border-b border-gray-100 px-5 pb-3 pt-5">
              <div className="text-sm text-gray-500">Question {q.number}</div>
            </div>
            <div className="p-5">
              <QuestionCard
                prompt={q.stem ?? ''}
                choices={(q.choices ?? []).map((c: RChoice) => ({
                  ...c,
                  // UI 컴포넌트 호환을 위해 label 보정
                  label: (c as any).label ?? c.text ?? '',
                }))}
                selected={answers[q.id] ?? null}
                onAnswer={(choiceId) => handleAnswer(q.id, choiceId)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
