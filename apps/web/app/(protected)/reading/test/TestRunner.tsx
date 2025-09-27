'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Passage } from '@/types/types-reading';
import Timer from '@/components/Timer';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import QuestionCard from '@/components/QuestionCard';

// 서버 액션 (경로만 맞춰줘)
import {
  // startReadingSession,
  submitReadingAnswer,
  finishReadingSession,
} from '@/actions/reading';

type Props = {
  passage: Passage;
  onFinish: (sessionId: string) => void;
};

// finish 액션 응답 안전타입(세션 ID가 올 수도 있고 없을 수도 있음)
type FinishRes = { ok?: boolean; sessionId?: string; id?: string };

export default function TestRunner({ passage, onFinish }: Props) {
  // 세션 시작(id는 start 액션이 있으면 서버에서 받아오고, 없으면 임시/서버에서 생성)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 사용자가 선택한 답안: { [questionId]: choiceId }
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // 타이머(필요 시 서버에서 내려주는 값으로 대체 가능)
  const TOTAL_SEC = 10 * 60;

  // 문항 정렬
  const questions = useMemo(
    () => [...(passage.questions ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [passage.questions]
  );

  // 진행률
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  // (옵션) 세션 시작 훅
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // const { sessionId } = await startReadingSession({ passageId: passage.id });
        // if (!ignore) setSessionId(sessionId);
        setSessionId((prev) => prev ?? null);
      } catch {
        // start 실패해도 진행 가능
      }
    })();
    return () => {
      ignore = true;
    };
  }, [passage.id]);

  // 답안 선택 시: 로컬 상태 업데이트 + 서버로 즉시 업서트(선택사항)
  const handleAnswer = async (qId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: choiceId }));
    try {
      await submitReadingAnswer({
        sessionId: sessionId ?? undefined, // 아직 없으면 서버에서 생성 허용
        passageId: passage.id,
        questionId: qId,
        choiceId,
      });
    } catch {
      // no-op
    }
  };

  // 수동 저장(옵션)
  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(answers).map(([qId, cId]) =>
          submitReadingAnswer({
            sessionId: sessionId ?? undefined,
            passageId: passage.id,
            questionId: qId,
            choiceId: cId,
          })
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
        passageId: passage.id,
      })) as FinishRes;

      // ⬇️ 안전하게 문자열 보장
      const sid: string = res.sessionId ?? res.id ?? sessionId ?? 'latest';
      onFinish(String(sid));
    } catch {
      onFinish(String(sessionId ?? 'latest'));
    }
  };

  return (
    <div className="space-y-4">
      {/* 섹션 헤더: 타이머 / 진행률 / 컨트롤 */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Questions</div>
          <div className="hidden sm:block w-48">
            <Progress value={progressPct} />
          </div>
          <div className="text-xs text-gray-500 sm:text-sm">
            Answered:{' '}
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

      {/* 문항 카드들 */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white shadow-soft border border-gray-100">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="text-sm text-gray-500">Question {q.number}</div>
            </div>
            <div className="p-5">
              <QuestionCard
                prompt={q.stem ?? ''} // ⬅️ string 보장
                choices={(q.choices ?? []).map((c) => ({
                  ...c,
                  label: (c as any).label ?? (c as any).text ?? '',
                }))} // 필요시 as any 제거하고 Choice 타입에 label 존재 보장
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
