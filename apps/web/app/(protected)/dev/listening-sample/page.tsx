'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ConsumePlayResponse, ConsumePlayRow, Mode } from '@/types/listening';
import type { ListeningTrack, LQuestion } from '@/app/types/types-listening';
import LAudioScreen from '@/app/(protected)/listening/test/components/LAudioScreen';
import LQuestionScreen from '@/app/(protected)/listening/test/components/LQuestionScreen';
import { startListeningSession, submitListeningAnswer, finishListeningSession } from '@/actions/listening';

// 러너용 로드 타입
type LoadedSet = {
  setId: string;
  conversation: ListeningTrack & { title?: string; imageUrl?: string };
  lecture: ListeningTrack & { title?: string; imageUrl?: string };
};

type Screen = 'conv_play' | 'conv_qna' | 'lect_play' | 'lect_qna';

export default function ListeningTestRunner() {
  // ─────────────────────────────────────────────────────────────
  // 상단: Consume Tester (네가 준 코드 유지)
  // ─────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [mode, setMode] = useState<Mode>('t');
  const [result, setResult] = useState<ConsumePlayRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function consumeOnce() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/listening/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          trackId: trackId.trim() || undefined,
          mode,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as ConsumePlayResponse;
      if (!json.ok) throw new Error(json.error || 'Unknown error');
      if (!json.data || !json.data[0]) throw new Error('Empty response');
      setResult(json.data[0]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 하단: 실제 리스닝 러너(사진→오디오→문제)
  // ─────────────────────────────────────────────────────────────
  const [trackSetId, setTrackSetId] = useState('demo-set');
  const [setData, setSetData] = useState<LoadedSet | null>(null);
  const [screen, setScreen] = useState<Screen>('conv_play');
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [qIndex, setQIndex] = useState(0);
  const [loadingSet, setLoadingSet] = useState(false);
  const [runnerErr, setRunnerErr] = useState<string | null>(null);

  // 세트 로드
  useEffect(() => {
    (async () => {
      setLoadingSet(true);
      setRunnerErr(null);
      try {
        const res = await fetch(`/api/listeningSet?id=${encodeURIComponent(trackSetId)}`, { cache: 'no-store' });
        const data = (await res.json()) as LoadedSet;
        setSetData(data);
        // 화면 초기화
        setScreen('conv_play');
        setQIndex(0);
      } catch (e: any) {
        setRunnerErr(e?.message ?? String(e));
      } finally {
        setLoadingSet(false);
      }
    })();
  }, [trackSetId]);

  // 현재 섹션 & 문항
  const convQs = useMemo(() => setData?.conversation.questions ?? [], [setData]);
  const lectQs = useMemo(() => setData?.lecture.questions ?? [], [setData]);
  const isConvQna = screen === 'conv_qna';
  const isLectQna = screen === 'lect_qna';
  const activeQs: LQuestion[] = isConvQna ? convQs : isLectQna ? lectQs : [];
  const q = activeQs[qIndex];

  // 문항 선택 저장(+서버 반영)
  const onChoose = useCallback(
    async (qid: string, cid?: string) => {
      setAnswers((prev) => {
        const next = { ...prev };
        if (!cid) delete next[qid];
        else next[qid] = cid;
        return next;
      });
      if (sessionId.trim()) {
        await submitListeningAnswer({ sessionId: sessionId.trim(), questionId: qid, choiceId: cid });
      }
    },
    [sessionId]
  );

  const nextFromAudio = useCallback(() => {
    setQIndex(0);
    setScreen((s) => (s === 'conv_play' ? 'conv_qna' : s === 'lect_play' ? 'lect_qna' : s));
  }, []);

  const gotoNextQ = useCallback(() => {
    if (!activeQs.length) return;
    if (qIndex < activeQs.length - 1) setQIndex((i) => i + 1);
    else {
      if (screen === 'conv_qna') {
        setQIndex(0);
        setScreen('lect_play');
      } else if (screen === 'lect_qna') {
        // 끝: 서버에 finish (선택)
        if (sessionId.trim()) {
          void finishListeningSession({ sessionId: sessionId.trim() });
        }
        // 다시 처음으로
        setScreen('conv_play');
        setQIndex(0);
      }
    }
  }, [activeQs.length, qIndex, screen, sessionId]);

  const gotoPrevQ = useCallback(() => {
    if (!activeQs.length) return;
    if (qIndex > 0) setQIndex((i) => i - 1);
  }, [activeQs.length, qIndex]);

  // 세션 생성(원하면 사용) - 'test' → 't', 'study' → 'p' 매핑
  const createSession = useCallback(async () => {
    if (!setData) return;
    const modeForStart = (mode === 'test' ? 't' : mode === 'study' ? 'p' : mode) as 'p' | 't' | 'r';
    const { sessionId: sid } = await startListeningSession({ setId: setData.setId, mode: modeForStart });
    setSessionId(sid);
  }, [setData, mode]);

  const convTitle = setData?.conversation.title ?? 'Conversation';
  const convImage = setData?.conversation.imageUrl;
  const lectTitle = setData?.lecture.title ?? 'Lecture';
  const lectImage = setData?.lecture.imageUrl;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* ─────────────────────────── Consume Tester ─────────────────────────── */}
      <section className="max-w-xl space-y-4">
        <h1 className="text-xl font-semibold">Listening Consume Tester</h1>

        <label className="block">
          <span className="text-sm">Session ID (string)</span>
          <input
            className="w-full border rounded p-2"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="e.g. a UUID from listening_sessions.id"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Track ID (optional)</span>
            <input
              className="w-full border rounded p-2"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              placeholder="e.g. conv-1"
            />
          </label>
          <label className="block">
            <span className="text-sm">Mode</span>
            <select
              className="w-full border rounded p-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="p">p</option>
              <option value="t">t</option>
              <option value="r">r</option>
              <option value="test">test</option>
              <option value="study">study</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={consumeOnce}
            disabled={!sessionId || loading}
            title={!sessionId ? 'Enter a session ID' : 'Consume one play'}
            aria-busy={loading}
          >
            {loading ? 'Consuming…' : 'Consume 1 Play'}
          </button>

          <button
            className="px-4 py-2 rounded border"
            onClick={createSession}
            disabled={!setData}
            title="Create a new listening session (uses current set & mode)"
          >
            Start Session (server)
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">Error: {error}</p>}

        {result && (
          <div className="border rounded p-3 text-sm">
            <div>session_id: <b>{result.session_id}</b></div>
            <div>track_id: {result.track_id ?? '(null)'}</div>
            <div>mode: {result.mode}</div>
            <div>plays_allowed: {result.plays_allowed}</div>
            <div>plays_used: {result.plays_used}</div>
            <div>remaining: {result.remaining}</div>
          </div>
        )}
      </section>

      <hr className="border-neutral-200" />

      {/* ─────────────────────────── Runner (사진→오디오→문제) ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block">
              <span className="text-sm">Track Set ID</span>
              <input
                className="w-full border rounded p-2"
                value={trackSetId}
                onChange={(e) => setTrackSetId(e.target.value)}
                placeholder="e.g. demo-set"
              />
            </label>
          </div>
          <div className="text-sm text-neutral-600">
            {loadingSet ? 'Loading set…' : runnerErr ? <span className="text-red-600">Set error: {runnerErr}</span> : setData?.setId}
          </div>
        </div>

        {/* ↓↓↓↓↓ 여기 “붙여달라”던 실제 렌더 블록을 그대로 사용 ↓↓↓↓↓ */}
        {screen === 'conv_play' && setData && (
          <LAudioScreen
            title={convTitle}
            imageUrl={convImage}
            audioUrl={setData.conversation.audioUrl}
            onEnded={nextFromAudio}
            onNext={nextFromAudio}
            sessionId={sessionId!}
            trackId={setData.conversation.id}
            mode={mode}
          />
        )}

        {screen === 'conv_qna' && q && setData && (
          <LQuestionScreen
            mode={mode}
            question={q}
            chosen={answers[q.id]}
            onChoose={onChoose}
            onNext={gotoNextQ}
            onPrev={gotoPrevQ}
            sessionId={sessionId!}
            trackId={setData.conversation.id}
          />
        )}

        {screen === 'lect_play' && setData && (
          <LAudioScreen
            title={lectTitle}
            imageUrl={lectImage}
            audioUrl={setData.lecture.audioUrl}
            onEnded={nextFromAudio}
            onNext={nextFromAudio}
            sessionId={sessionId!}
            trackId={setData.lecture.id}
            mode={mode}
          />
        )}

        {screen === 'lect_qna' && q && setData && (
          <LQuestionScreen
            mode={mode}
            question={q}
            chosen={answers[q.id]}
            onChoose={onChoose}
            onNext={gotoNextQ}
            onPrev={gotoPrevQ}
            sessionId={sessionId!}
            trackId={setData.lecture.id}
          />
        )}

        {/* 러너 네비게이션(간단) */}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded border" onClick={() => setScreen('conv_play')}>Conversation</button>
          <button className="px-4 py-2 rounded border" onClick={() => setScreen('lect_play')}>Lecture</button>
          <button
            className="px-4 py-2 rounded border"
            onClick={() => sessionId.trim() && finishListeningSession({ sessionId: sessionId.trim() })}
            disabled={!sessionId.trim()}
            title="Mark session finished"
          >
            Finish Session
          </button>
        </div>
      </section>
    </div>
  );
}
