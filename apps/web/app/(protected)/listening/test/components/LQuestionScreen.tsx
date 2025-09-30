'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { LQuestion } from '@/app/types/types-listening';
import type { Mode } from '@/types/listening';
import { consumePlay } from '@/lib/consumePlay';

export default function LQuestionScreen({
  mode, question, chosen, onChoose, onNext, onPrev,
  sessionId, trackId,
}: {
  mode: Mode;
  question: LQuestion;
  chosen?: string;
  onChoose: (qid: string, cid: string | undefined) => void;
  onNext: () => void;
  onPrev: () => void;
  sessionId: string;
  trackId?: string; // 같은 트랙 기준으로 소비
}) {
  const meta = (question as any)?.meta as
    | { autoPlaySnippetUrl?: string; revealChoicesAfterAudio?: boolean; tag?: string; allowReplayInPractice?: boolean }
    | undefined;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(!meta?.autoPlaySnippetUrl);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const gated = !!meta?.autoPlaySnippetUrl && !!meta?.revealChoicesAfterAudio;
  const canReplay = mode === 'p' && !!meta?.autoPlaySnippetUrl && (meta?.allowReplayInPractice ?? true);

  // 자동 재생: 진입 시 consume → 성공하면 play
  useEffect(() => {
    setEnded(!meta?.autoPlaySnippetUrl);
    setPlaying(false);
    setRemaining(null);
    setErr(null);

    const el = audioRef.current;
    if (!el || !meta?.autoPlaySnippetUrl) return;

    (async () => {
      try {
        const row = await consumePlay({ sessionId, trackId, mode });
        setRemaining(row.remaining);
        el.currentTime = 0;
        await el.play();
        setPlaying(true);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
        // 소비 실패 시 보기 즉시 노출
        setEnded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, meta?.autoPlaySnippetUrl]);

  useEffect(() => {
    const el = audioRef.current; if (!el) return;
    const onEnd = () => { setPlaying(false); setEnded(true); };
    el.addEventListener('ended', onEnd);
    return () => el.removeEventListener('ended', onEnd);
  }, []);

  const replay = async () => {
    const el = audioRef.current; if (!el || !meta?.autoPlaySnippetUrl) return;
    setErr(null);
    try {
      const row = await consumePlay({ sessionId, trackId, mode }); // 리플레이마다 소비
      setRemaining(row.remaining);
      el.currentTime = 0;
      await el.play();
      setPlaying(true);
      setEnded(false);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  const badge = useMemo(
    () => (meta?.tag === 'why-say-this' ? 'Why does the man say this?' : undefined),
    [meta?.tag]
  );

  return (
    <div className="mx-auto max-w-3xl w-full p-6">
      <div className="text-sm text-neutral-500 mb-2">
        {`Question ${question.number ?? ''}${badge ? ` · ${badge}` : ''}`}
      </div>

      <div className="text-base font-medium mb-4">{question.prompt}</div>

      {meta?.autoPlaySnippetUrl && (
        <div className="rounded-xl border bg-white p-4 mb-4">
          <audio ref={audioRef} src={meta.autoPlaySnippetUrl} controls className="w-full mb-2" preload="auto" />
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {playing ? 'Playing…' : ended ? 'Playback finished.' : 'Ready.'}
              {remaining !== null ? ` · Remaining: ${remaining}` : ''}
            </span>
            {canReplay && (
              <button className="rounded-md border px-3 py-1 hover:bg-neutral-50" onClick={replay}>
                Replay (consumes 1)
              </button>
            )}
          </div>
          {err && <div className="mt-2 text-xs text-red-600">Consume error: {err}</div>}
        </div>
      )}

      {(!gated || ended) ? (
        <ul className="space-y-2">
          {question.choices.map((c) => {
            const active = chosen === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onChoose(question.id, active ? undefined : c.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 hover:bg-neutral-50 ${active ? 'border-yellow-400 ring-2 ring-yellow-300' : ''}`}
                >
                  {c.text}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-sm text-neutral-400">Choices will appear after the audio.</div>
      )}

      <div className="mt-6 flex justify-between">
        <button className="rounded-xl px-4 py-2 border hover:bg-neutral-50" onClick={onPrev}>Prev</button>
        <button
          className={`rounded-2xl px-6 py-2 shadow ${chosen ? 'bg-yellow-400 hover:brightness-95' : 'bg-neutral-200 cursor-not-allowed'}`}
          onClick={onNext}
          disabled={!chosen}
        >
          Next
        </button>
      </div>
    </div>
  );
}
