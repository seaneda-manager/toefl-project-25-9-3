// apps/web/app/(protected)/listening/study/ListeningStudyRunner.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LTimer from '@/components/LTimer';
import {
  startListeningSession,
  submitListeningAnswer,
  finishListeningSession,
} from '@/actions/listening';
import type { ListeningTrack, LQuestion } from '@/types/types-listening';
import { isChoiceCorrect } from '@/types/types-listening';

import TopBar from '@/components/test/TopBar';
import AudioPanel from '@/components/test/AudioPanel';

type Props = {
  track: ListeningTrack | undefined;
  onFinish?: (sessionId: string) => void;
};

// ??LChoice 蹂꾩묶: LQuestion??choices ?먯냼 ??낆쓣 ?덉쟾?섍쾶 異붿텧
type LChoice = NonNullable<LQuestion['choices']>[number];

export default function ListeningStudyRunner({ track, onFinish }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [showCorrect, setShowCorrect] = useState<boolean>(true);
  const [showTimer, setShowTimer] = useState<boolean>(true);
  const [startErr, setStartErr] = useState<string | null>(null);

  // 臾몄젣 諛곗뿴
  const qs: LQuestion[] = useMemo(() => track?.questions ?? [], [track]);
  const total: number = qs.length;
  const q: LQuestion | undefined = total > 0 ? qs[current] : undefined;
  const qKey: string = q ? String(q.id) : '';

  // ?몃뜳??蹂댁젙
  const clamp = useCallback(
    (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1)),
    [total]
  );

  // 珥앸Ц??蹂?????꾩옱 ?몃뜳??蹂댁젙
  useEffect(() => {
    if (total === 0) {
      setCurrent(0);
      return;
    }
    if (current >= total) setCurrent(total - 1);
    if (current < 0) setCurrent(0);
  }, [total, current]);

  // ?몃옓 蹂寃????곹깭 珥덇린??
  useEffect(() => {
    setCurrent(0);
    setAnswers({});
    setShowTimer(true);
  }, [track]);

  // 以묐났 ?쒖옉 諛⑹?
  const startedForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!track?.id) return;
    if (startedForIdRef.current === track.id) return;
    (async () => {
      try {
        setStartErr(null);
        const { sessionId: sid } = await startListeningSession({
          setId: (track as any).setId ?? track.id,
          mode: 'p', // practice
        });
        setSessionId(sid);
        startedForIdRef.current = track.id;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to start session';
        setStartErr(msg);
      }
    })();
  }, [track?.id, track]);

  const pick = useCallback(
    async (choiceId: string) => {
      if (!q) return;
      const key = String(q.id);
      setAnswers((s) => ({ ...s, [key]: choiceId }));
      if (!sessionId) return;

      try {
        await submitListeningAnswer({
          sessionId,
          questionId: key,
          choiceId,
        });
      } catch {
        // ?ㅽ뙣?대룄 UI???숆??곸쑝濡??좎? (?꾩슂 ???곸쐞?먯꽌 ?щ룞湲고솕)
      }
    },
    [q, sessionId]
  );

  const guardedGo = useCallback(
    (to: number) => {
      if (total === 0) return;
      setCurrent(clamp(to));
    },
    [clamp, total]
  );

  const finish = useCallback(async () => {
    if (!sessionId) return;
    try {
      await finishListeningSession({ sessionId });
    } finally {
      onFinish?.(sessionId);
    }
  }, [onFinish, sessionId]);

  const answeredByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    qs.forEach((qq, i) => {
      map[i] = answers[String(qq.id)] != null;
    });
    return map;
  }, [qs, answers]);

  const answeredCount = useMemo(
    () => Object.values(answeredByIndex).filter(Boolean).length,
    [answeredByIndex]
  );
  const progressPct = Math.round((answeredCount / Math.max(1, total)) * 100);

  if (!track) {
    return (
      <div className="p-6 text-center text-gray-600">
        ?몃옓??遺덈윭?ㅼ? 紐삵뻽嫄곕굹 ?좏깮?섏? ?딆븯?듬땲??
      </div>
    );
  }
  if (total === 0) {
    return <div className="p-6 text-center text-gray-600">臾명빆???놁뒿?덈떎.</div>;
  }

  const choiceLabel = (i: number) => String.fromCharCode(65 + i);
  const limitSec = track.timeLimitSec ?? track.durationSec ?? 600;

  return (
    <div className="space-y-3">
      {/* 吏꾪뻾??諛?*/}
      <div className="h-1 overflow-hidden rounded bg-gray-200" aria-hidden>
        <div className="h-1 bg-black" style={{ width: `${progressPct}%` }} />
      </div>

      {/* ?곷떒 諛?*/}
      <TopBar
        mode="study"
        section="listening"
        qIndex={current}
        total={total}
        onBack={() => guardedGo(current - 1)}
        onNext={() => (current < total - 1 ? guardedGo(current + 1) : finish())}
        onPause={() => {}}
        onReview={() => {}}
        onToggleTime={() => setShowTimer((v) => !v)}
        showTime={showTimer}
      />

      {/* ?몄뀡 ?쒖옉 ?먮윭 */}
      {startErr && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ?몄뀡 ?쒖옉 ?ㅽ뙣: {startErr}
        </div>
      )}

      {/* 2???덉씠?꾩썐 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        {/* 醫뚯륫 ?⑤꼸 */}
        <div className="lg:sticky lg:top-4 lg:max-h=[calc(100vh-5rem)] lg:overflow-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Listening (Study){' '}
              <span className="text-sm text-gray-500">#{track.id}</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border px-3 py-1.5 text-sm"
                onClick={() => setShowCorrect((v) => !v)}
                aria-pressed={showCorrect}
                title="?뺣떟 ?쒓린 ?좉?"
              >
                {showCorrect ? '?뺣떟 ?④린湲? : '?뺣떟 蹂댁씠湲?}
              </button>
              {showTimer && (
                <LTimer key={track.id} seconds={limitSec} onExpire={finish} />
              )}
            </div>
          </div>

          {/* ?ㅻ뵒???⑤꼸 */}
          <div className="mt-4">
            <AudioPanel key={track.id} src={track.audioUrl} allowSeek allowSpeed />
          </div>

          {/* ?듭븞 媛쒖닔 */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {answeredCount}/{total} answered
            </span>
          </div>

          {/* ?섎쾭 ?⑤뱶 */}
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => guardedGo(i)}
                className={[
                  'h-10 w-10 rounded-md border text-sm',
                  i === current ? 'border-black bg-black text-white' : 'bg-white',
                  answeredByIndex[i] ? 'border-green-500' : 'border-gray-300',
                ].join(' ')}
                aria-current={i === current ? 'page' : undefined}
                aria-label={`Go to question ${i + 1}`}
                title={`Question ${qs[i]?.number ?? i + 1}`}
              >
                {qs[i]?.number ?? i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* ?곗륫: 臾몄젣/?좎? */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {(q?.number ?? current + 1)} / {total}{' '}
              {answers[qKey] ? '' : '誘몄쓳??}
            </div>
            <div className="space-x-2">
              <button
                type="button"
                className="rounded border px-3 py-2"
                onClick={() => guardedGo(current - 1)}
                disabled={current <= 0}
              >
                ? Prev
              </button>
              {current < total - 1 ? (
                <button
                  type="button"
                  className="rounded border px-3 py-2"
                  onClick={() => guardedGo(current + 1)}
                >
                  Next ??
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded border bg-white/10 px-3 py-2"
                  onClick={finish}
                  disabled={!sessionId}
                  title={sessionId ? undefined : '?몄뀡 ?쒖옉 ?湲?以?}
                >
                  Finish
                </button>
              )}
            </div>
          </div>

          {q ? (
            <div className="space-y-3 rounded border p-4">
              <div className="font-medium">{q.prompt}</div>
              <div className="space-y-2">
                {q.choices?.map((c: LChoice, idx: number) => {
                  const selected = answers[qKey] === c.id;
                  const correct = isChoiceCorrect(q, c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${qKey}`}
                        checked={selected}
                        onChange={() => pick(c.id)}
                      />
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{choiceLabel(idx)}.</span>
                        <span>{c.text}</span>
                        {showCorrect && correct ? (
                          <span
                            className="inline-flex items-center rounded border px-2 py-0.5 text-xs"
                            aria-label="?뺣떟"
                            title="?뺣떟"
                          >
                            ??
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded bg-amber-50 p-4 text-amber-800">
              ?꾩옱 ?쒖떆??臾몄젣媛 ?놁뒿?덈떎.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


