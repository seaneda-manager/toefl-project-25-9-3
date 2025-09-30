'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Mode } from '@/types/listening';
import type { ListeningTrack, LQuestion } from '@/app/types/types-listening';
import LAudioScreen from '@/app/(protected)/listening/test/components/LAudioScreen';
import LQuestionScreen from '@/app/(protected)/listening/test/components/LQuestionScreen';
import { startListeningSession, submitListeningAnswer, finishListeningSession } from '@/actions/listening';

type LoadedSet = {
  setId: string;
  conversation: ListeningTrack & { title?: string; imageUrl?: string };
  lecture: ListeningTrack & { title?: string; imageUrl?: string };
};

type Screen = 'idle' | 'conv_play' | 'conv_qna' | 'lect_play' | 'lect_qna' | 'done';

export default function ListeningTestRunner() {
  const router = useRouter();

  const [trackSetId, setTrackSetId] = useState('demo-set');
  const [mode, setMode] = useState<Mode>('t'); // 'p' | 't' | 'r' | 'test' | 'study'
  const [sessionId, setSessionId] = useState<string>('');
  const [setData, setSetData] = useState<LoadedSet | null>(null);
  const [screen, setScreen] = useState<Screen>('idle');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 세트 로드
  const loadSet = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/listeningSet?id=${encodeURIComponent(trackSetId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load set (${res.status})`);
      const data = (await res.json()) as LoadedSet;
      setSetData(data);
      setQIndex(0);
      setAnswers({});
      setScreen('idle');
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [trackSetId]);

  useEffect(() => { void loadSet(); }, [loadSet]);

  // 현재 섹션 문항
  const convQs = useMemo(() => setData?.conversation.questions ?? [], [setData]);
  const lectQs = useMemo(() => setData?.lecture.questions ?? [], [setData]);
  const isConvQna = screen === 'conv_qna';
  const isLectQna = screen === 'lect_qna';
  const activeQs: LQuestion[] = isConvQna ? convQs : isLectQna ? lectQs : [];
  const q = activeQs[qIndex];

  // 세션 시작 (기존 세션 있으면 종료 후 새로 생성)
  const startSession = useCallback(async () => {
    if (!setData) return;
    setLoading(true); setErr(null);
    try {
      if (sessionId) await finishListeningSession({ sessionId });
      const m = (mode === 'test' ? 't' : mode === 'study' ? 'p' : mode) as 'p' | 't' | 'r';
      const { sessionId: sid } = await startListeningSession({ setId: setData.setId, mode: m });
      setSessionId(sid);
      setQIndex(0);
      setAnswers({});
      if (convQs.length === 0) setScreen('lect_play');
      else setScreen('conv_play');
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [setData, mode, sessionId, convQs.length]);

  // 선택 저장 + 서버 전송
  const onChoose = useCallback(async (qid: string, cid?: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (!cid) delete next[qid]; else next[qid] = cid;
      return next;
    });
    if (sessionId) {
      await submitListeningAnswer({ sessionId, questionId: qid, choiceId: cid });
    }
  }, [sessionId]);

  // 네비게이션
  const nextFromAudio = useCallback(() => {
    setQIndex(0);
    setScreen((s) => {
      if (s === 'conv_play') return convQs.length > 0 ? 'conv_qna' : (lectQs.length > 0 ? 'lect_play' : 'done');
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
      if (screen === 'conv_qna') { setQIndex(0); setScreen(lectQs.length > 0 ? 'lect_play' : 'done'); }
      else if (screen === 'lect_qna') { setScreen('done'); }
    }
  }, [activeQs.length, qIndex, screen, lectQs.length]);

  const gotoPrevQ = useCallback(() => {
    if (!activeQs.length) return;
    if (qIndex > 0) setQIndex((i) => i - 1);
  }, [activeQs.length, qIndex]);

  // 종료 → 리뷰 이동
  const finish = useCallback(async () => {
    if (!sessionId) return;
    try {
      await finishListeningSession({ sessionId });
    } finally {
      router.push(`/(protected)/listening/review?sessionId=${sessionId}`);
    }
  }, [sessionId, router]);

  // 타이틀/이미지
  const convTitle = setData?.conversation.title ?? 'Conversation';
  const convImage = setData?.conversation.imageUrl;
  const lectTitle = setData?.lecture.title ?? 'Lecture';
  const lectImage = setData?.lecture.imageUrl;

  const canStart = !!setData && !loading;

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-xl font-semibold">Listening Test Runner</h1>

      {/* 컨트롤 바 */}
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
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="p">p (practice)</option>
            <option value="t">t (test)</option>
            <option value="r">r (review)</option>
            <option value="test">test (alias=t)</option>
            <option value="study">study (alias=p)</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            className="px-4 py-2 rounded border"
            onClick={loadSet}
            disabled={loading}
          >
            Reload Set
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

      {err && <p className="text-sm text-red-600">Error: {err}</p>}

      {/* 안내 */}
      {!sessionId && screen === 'idle' && (
        <div className="rounded-xl border p-6 text-sm text-neutral-600">
          세트를 불러온 뒤 <b>Start</b>를 누르면 세션이 생성되고 대화(Conversation)부터 시작합니다.
        </div>
      )}

      {/* 러너 화면 */}
      {setData && sessionId && (
        <>
          {screen === 'conv_play' && (
            <LAudioScreen
              title={convTitle}
              imageUrl={convImage}
              audioUrl={setData.conversation.audioUrl}
              onEnded={nextFromAudio}
              onNext={nextFromAudio}
              sessionId={sessionId}
              trackId={setData.conversation.id}
              mode={mode}
            />
          )}

          {screen === 'conv_qna' && q && (
            <LQuestionScreen
              mode={mode}
              question={q}
              chosen={answers[q.id]}
              onChoose={onChoose}
              onNext={gotoNextQ}
              onPrev={gotoPrevQ}
              sessionId={sessionId}
              trackId={setData.conversation.id}
            />
          )}

          {screen === 'lect_play' && (
            <LAudioScreen
              title={lectTitle}
              imageUrl={lectImage}
              audioUrl={setData.lecture.audioUrl}
              onEnded={nextFromAudio}
              onNext={nextFromAudio}
              sessionId={sessionId}
              trackId={setData.lecture.id}
              mode={mode}
            />
          )}

          {screen === 'lect_qna' && q && (
            <LQuestionScreen
              mode={mode}
              question={q}
              chosen={answers[q.id]}
              onChoose={onChoose}
              onNext={gotoNextQ}
              onPrev={gotoPrevQ}
              sessionId={sessionId}
              trackId={setData.lecture.id}
            />
          )}

          {screen === 'done' && (
            <div className="rounded-xl border p-6 text-center">
              <p className="mb-3 text-lg font-semibold">Section Complete</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  className="px-4 py-2 rounded border"
                  onClick={() => { setScreen(convQs.length > 0 ? 'conv_play' : (lectQs.length > 0 ? 'lect_play' : 'done')); setQIndex(0); }}
                >
                  Replay
                </button>
                <button className="px-4 py-2 rounded bg-black text-white" onClick={finish}>
                  Finish & Review
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
