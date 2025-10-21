'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ListeningTrack, LQuestion } from '@/app/types/types-listening';
import type { Mode as QuestionMode } from '@/types/listening'; // 화면 컴포넌트가 기대하는 Mode
import LAudioScreen from '@/app/(protected)/listening/test/components/LAudioScreen';
import LQuestionScreen from '@/app/(protected)/listening/test/components/LQuestionScreen';
import {
  startListeningSessionClient as startListeningSession,
  submitListeningAnswerClient as submitListeningAnswer,
  finishListeningSessionClient as finishListeningSession,
} from '@/lib/client/listeningApi';

type LoadedSet = {
  setId: string;
  conversation: ListeningTrack & { title?: string; imageUrl?: string };
  lecture: ListeningTrack & { title?: string; imageUrl?: string };
};

type Screen = 'idle' | 'conv_play' | 'conv_qna' | 'lect_play' | 'lect_qna' | 'done';

/** UI에서만 쓰는 모드(별칭 포함) */
type UIMode = 'p' | 't' | 'r' | 'test' | 'study';

/** API가 받는 모드(정확히 이 셋만 허용) */
type ApiMode = 'p' | 't' | 'r';

type Props = {
  initialSetId?: string;
  debug?: boolean;
  autoStart?: boolean;
};

/** UI 모드 → API 모드 */
const toApiMode = (m: UIMode): ApiMode => {
  if (m === 'test') return 't';
  if (m === 'study') return 'p';
  return m; // 'p' | 't' | 'r'
};

/** UI 모드 → 화면 컴포넌트가 기대하는 Mode로 변환 */
const toQuestionMode = (m: UIMode): QuestionMode => {
  const v = m === 'test' ? 't' : m === 'study' ? 'p' : m; // 'p'|'t'|'r'
  return v as unknown as QuestionMode;
};

export default function ListeningTestRunner({
  initialSetId = 'demo-set',
  debug = false,
  autoStart = false,
}: Props) {
  const router = useRouter();

  const [trackSetId, setTrackSetId] = useState(initialSetId);
  const [mode, setMode] = useState<UIMode>('t'); // UI 모드 ('test'|'study' 포함)
  const [sessionId, setSessionId] = useState<string>('');
  const [loadedSet, setLoadedSet] = useState<LoadedSet | null>(null);
  const [screen, setScreen] = useState<Screen>('idle');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingSet, setLoadingSet] = useState(false);

  useEffect(() => {
    setTrackSetId(initialSetId);
  }, [initialSetId]);

  const loadSet = useCallback(async () => {
    setLoadingSet(true);
    setErr(null);
    try {
      const res = await fetch(`/api/listeningSet?id=${encodeURIComponent(trackSetId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load set (${res.status})`);
      const data = (await res.json()) as LoadedSet;
      setLoadedSet(data);
      setQIndex(0);
      setAnswers({});
      setScreen('idle');
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setLoadedSet(null);
    } finally {
      setLoadingSet(false);
    }
  }, [trackSetId]);

  useEffect(() => {
    void loadSet();
  }, [loadSet]);

  useEffect(() => {
    if (autoStart && loadedSet && !sessionId && !loading) {
      void (async () => {
        await startSession();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, loadedSet, sessionId, loading]);

  const convQs = useMemo(() => loadedSet?.conversation.questions ?? [], [loadedSet]);
  const lectQs = useMemo(() => loadedSet?.lecture.questions ?? [], [loadedSet]);
  const isConvQna = screen === 'conv_qna';
  const isLectQna = screen === 'lect_qna';
  const activeQs: LQuestion[] = isConvQna ? convQs : isLectQna ? lectQs : [];
  const q = activeQs[qIndex];

  // 세션 시작
  const startSession = useCallback(async () => {
    if (!loadedSet) return;
    setLoading(true);
    setErr(null);
    try {
      if (sessionId) await finishListeningSession({ sessionId });

      const m: ApiMode = toApiMode(mode); // 'p' | 't' | 'r'
      const { sessionId: sid } = await startListeningSession({ setId: loadedSet.setId, mode: m });
      setSessionId(sid);
      setQIndex(0);
      setAnswers({});
      setScreen(convQs.length === 0 ? 'lect_play' : 'conv_play');
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [loadedSet, mode, sessionId, convQs.length]);

  // 선택 & 서버 제출
  const onChoose = useCallback(
    async (qid: string, cid?: string) => {
      setAnswers((prev) => {
        const next = { ...prev };
        if (!cid) delete next[qid];
        else next[qid] = cid;
        return next;
      });
      if (sessionId) {
        await submitListeningAnswer({ sessionId, questionId: qid, choiceId: cid });
      }
    },
    [sessionId]
  );

  // 오디오 끝나면 다음 화면으로
  const nextFromAudio = useCallback(() => {
    setQIndex(0);
    setScreen((s) => {
      if (s === 'conv_play') return convQs.length > 0 ? 'conv_qna' : lectQs.length > 0 ? 'lect_play' : 'done';
      if (s === 'lect_play') return lectQs.length > 0 ? 'lect_qna' : 'done';
      return s;
    });
  }, [convQs.length, lectQs.length]);

  const gotoNextQ = useCallback(() => {
    if (!activeQs.length) {
      if (screen === 'conv_qna') setScreen(lectQs.length > 0 ? 'lect_play' : 'done');
      else if (screen === 'lect_qna') setScreen('done');
      return;
    }
    if (qIndex < activeQs.length - 1) setQIndex((i) => i + 1);
    else {
      if (screen === 'conv_qna') {
        setQIndex(0);
        setScreen(lectQs.length > 0 ? 'lect_play' : 'done');
      } else if (screen === 'lect_qna') {
        setScreen('done');
      }
    }
  }, [activeQs.length, qIndex, screen, lectQs.length]);

  const gotoPrevQ = useCallback(() => {
    if (!activeQs.length) return;
    if (qIndex > 0) setQIndex((i) => i - 1);
  }, [activeQs.length, qIndex]);

  const finish = useCallback(async () => {
    if (!sessionId) return;
    try {
      await finishListeningSession({ sessionId });
    } finally {
      router.push(`/listening/review?sessionId=${sessionId}`);
    }
  }, [sessionId, router]);

  const convTitle = loadedSet?.conversation.title ?? 'Conversation';
  const convImage = loadedSet?.conversation.imageUrl;
  const lectTitle = loadedSet?.lecture.title ?? 'Lecture';
  const lectImage = loadedSet?.lecture.imageUrl;

  const canStart = !!loadedSet && !loading;

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-xl font-semibold">Listening Test Runner</h1>

      {debug ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="block md:col-span-2">
            <span className="text-sm">Track Set ID</span>
            <input
              className="w-full border rounded p-2"
              value={trackSetId}
              onChange={(e) => setTrackSetId(e.target.value)}
              placeholder="e.g. demo-set"
            />
          </label>
          <label className="block">
            <span className="text-sm">Mode</span>
            <select
              className="w-full border rounded p-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as UIMode)}
            >
              <option value="p">p (practice)</option>
              <option value="t">t (test)</option>
              <option value="r">r (review)</option>
              <option value="test">test (alias=t)</option>
              <option value="study">study (alias=p)</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="px-4 py-2 rounded border" onClick={loadSet} disabled={loadingSet || loading}>
              {loadingSet ? 'Loading…' : 'Reload Set'}
            </button>
            <button
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              onClick={startSession}
              disabled={!canStart}
              title="Create session & start Conversation"
            >
              {loading ? 'Starting…' : 'Start'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm text-neutral-700">
          <div>
            TPO Set: <b>{trackSetId}</b> {loadingSet ? '(Loading...)' : loadedSet ? '' : '(Not available)'}
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden md:block">
              <span className="mr-2">Mode</span>
              <select
                className="border rounded p-1"
                value={mode}
                onChange={(e) => setMode(e.target.value as UIMode)}
              >
                <option value="t">test</option>
                <option value="p">practice</option>
                <option value="r">review</option>
              </select>
            </label>
            {!autoStart && (
              <button
                className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
                onClick={startSession}
                disabled={!canStart}
              >
                {loading ? 'Starting…' : 'Start'}
              </button>
            )}
          </div>
        </div>
      )}

      {err && <p className="text-sm text-red-600">Error: {err}</p>}

      {!sessionId && screen === 'idle' && (
        <div className="rounded-xl border p-6 text-sm text-neutral-600">
          {loadedSet ? (
            <>
              세트가 로드되었습니다. <b>Start</b>를 누르면 세션이 생성되고 대화(Conversation)부터 시작합니다.
            </>
          ) : (
            <>이 세트를 불러오지 못했습니다. (다운로드/권한 확인 필요)</>
          )}
        </div>
      )}

      {loadedSet && sessionId && (
        <>
          {screen === 'conv_play' && (
            <LAudioScreen
              title={convTitle}
              imageUrl={convImage}
              audioUrl={loadedSet.conversation.audioUrl}
              onEnded={nextFromAudio}
              onNext={nextFromAudio}
              sessionId={sessionId}
              trackId={loadedSet.conversation.id}
              mode={toQuestionMode(mode)}   /* 화면용 Mode로 전달 */
            />
          )}

          {screen === 'conv_qna' && q && (
            <LQuestionScreen
              mode={toQuestionMode(mode)}               /* 화면용 Mode로 전달 */
              question={q}
              index={qIndex}                            /* ✅ 전달 */
              total={activeQs.length}                   /* ✅ 전달 */
              selectedChoiceId={answers[q.id]}          /* ✅ 이름 정합 */
              onChooseAction={(qid: string, cid?: string) => { void onChoose(qid, cid); }}  /* ✅ 타입 명시 */
              onNextAction={gotoNextQ}
              onPrevAction={gotoPrevQ}
              sessionId={sessionId}
              trackId={loadedSet.conversation.id}
            />
          )}

          {screen === 'lect_play' && (
            <LAudioScreen
              title={lectTitle}
              imageUrl={lectImage}
              audioUrl={loadedSet.lecture.audioUrl}
              onEnded={nextFromAudio}
              onNext={nextFromAudio}
              sessionId={sessionId}
              trackId={loadedSet.lecture.id}
              mode={toQuestionMode(mode)}   /* 화면용 Mode로 전달 */
            />
          )}

          {screen === 'lect_qna' && q && (
            <LQuestionScreen
              mode={toQuestionMode(mode)}               /* 화면용 Mode로 전달 */
              question={q}
              index={qIndex}                            /* ✅ 전달 */
              total={activeQs.length}                   /* ✅ 전달 */
              selectedChoiceId={answers[q.id]}          /* ✅ 이름 정합 */
              onChooseAction={(qid: string, cid?: string) => { void onChoose(qid, cid); }}  /* ✅ 타입 명시 */
              onNextAction={gotoNextQ}
              onPrevAction={gotoPrevQ}
              sessionId={sessionId}
              trackId={loadedSet.lecture.id}
            />
          )}

          {screen === 'done' && (
            <div className="rounded-xl border p-6 text-center">
              <p className="mb-3 text-lg font-semibold">Section Complete</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  className="px-4 py-2 rounded border"
                  onClick={() => {
                    setScreen(convQs.length > 0 ? 'conv_play' : lectQs.length > 0 ? 'lect_play' : 'done');
                    setQIndex(0);
                  }}
                >
                  Replay
                </button>
                <button className="px-4 py-2 rounded bg-black text-white" onClick={finish}>
                  Finish & Review
                </button>
              </div>
              <div className="mt-3 text-xs text-neutral-500">session: {sessionId}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
