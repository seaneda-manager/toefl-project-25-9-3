'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Passage } from '@/types/types-reading';
import Timer from '@/components/Timer';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import QuestionCard from '@/components/QuestionCard';

// ?쒕쾭 ?≪뀡 (寃쎈줈留?留욎떠以?
import {
  // startReadingSession,
  submitReadingAnswer,
  finishReadingSession,
} from '@/actions/reading';

type Props = {
  passage: Passage;
  onFinish: (sessionId: string) => void;
};

// finish ?≪뀡 ?묐떟 ?덉쟾????몄뀡 ID媛 ???섎룄 ?덇퀬 ?놁쓣 ?섎룄 ?덉쓬)
type FinishRes = { ok?: boolean; sessionId?: string; id?: string };

export default function TestRunner({ passage, onFinish }: Props) {
  // ?몄뀡 ?쒖옉(id??start ?≪뀡???덉쑝硫??쒕쾭?먯꽌 諛쏆븘?ㅺ퀬, ?놁쑝硫??꾩떆/?쒕쾭?먯꽌 ?앹꽦)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ?ъ슜?먭? ?좏깮???듭븞: { [questionId]: choiceId }
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ??대㉧(?꾩슂 ???쒕쾭?먯꽌 ?대젮二쇰뒗 媛믪쑝濡??泥?媛??
  const TOTAL_SEC = 10 * 60;

  // 臾명빆 ?뺣젹
  const questions = useMemo(
    () => [...(passage.questions ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [passage.questions]
  );

  // 吏꾪뻾瑜?
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  // (?듭뀡) ?몄뀡 ?쒖옉 ??
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // const { sessionId } = await startReadingSession({ passageId: passage.id });
        // if (!ignore) setSessionId(sessionId);
        setSessionId((prev) => prev ?? null);
      } catch {
        // start ?ㅽ뙣?대룄 吏꾪뻾 媛??
      }
    })();
    return () => {
      ignore = true;
    };
  }, [passage.id]);

  // ?듭븞 ?좏깮 ?? 濡쒖뺄 ?곹깭 ?낅뜲?댄듃 + ?쒕쾭濡?利됱떆 ?낆꽌???좏깮?ы빆)
  const handleAnswer = async (qId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: choiceId }));
    try {
      await submitReadingAnswer({
        sessionId: sessionId ?? undefined, // ?꾩쭅 ?놁쑝硫??쒕쾭?먯꽌 ?앹꽦 ?덉슜
        passageId: passage.id,
        questionId: qId,
        choiceId,
      });
    } catch {
      // no-op
    }
  };

  // ?섎룞 ????듭뀡)
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

  // 醫낅즺
  const handleFinish = async () => {
    try {
      const res = (await finishReadingSession({
        sessionId: sessionId ?? undefined,
        passageId: passage.id,
      })) as FinishRes;

      // 燧뉛툘 ?덉쟾?섍쾶 臾몄옄??蹂댁옣
      const sid: string = res.sessionId ?? res.id ?? sessionId ?? 'latest';
      onFinish(String(sid));
    } catch {
      onFinish(String(sessionId ?? 'latest'));
    }
  };

  return (
    <div className="space-y-4">
      {/* ?뱀뀡 ?ㅻ뜑: ??대㉧ / 吏꾪뻾瑜?/ 而⑦듃濡?*/}
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

      {/* 臾명빆 移대뱶??*/}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white shadow-soft border border-gray-100">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="text-sm text-gray-500">Question {q.number}</div>
            </div>
            <div className="p-5">
              <QuestionCard
                prompt={q.stem ?? ''} // 燧낉툘 string 蹂댁옣
                choices={(q.choices ?? []).map((c) => ({
                  ...c,
                  label: (c as any).label ?? (c as any).text ?? '',
                }))} // ?꾩슂??as any ?쒓굅?섍퀬 Choice ??낆뿉 label 議댁옱 蹂댁옣
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

