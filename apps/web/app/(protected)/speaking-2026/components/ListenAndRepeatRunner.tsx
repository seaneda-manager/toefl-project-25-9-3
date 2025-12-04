// apps/web/app/(protected)/speaking-2026/components/ListenAndRepeatRunner.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export type ListenRepeatItem = {
  id: string;
  sentence: string;   // 개발 단계에서는 텍스트도 같이 보여주고,
  audioUrl?: string;  // 나중에 진짜 mp3/wav 경로 연결
};

type Props = {
  items: ListenRepeatItem[];
  mode?: "study" | "test";  // study: 재생/재시도 자유, test: 제약 가능
  repeatSeconds?: number;   // 한 문장당 말할 수 있는 시간(초)
  onComplete?: (result: { itemId: string; blob: Blob | null }[]) => void;
};

type RecordingInfo = {
  itemId: string;
  blob: Blob | null;
};

export default function ListenAndRepeatRunner({
  items,
  mode = "study",
  repeatSeconds = 10,
  onComplete,
}: Props) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const current = items[index];

  // 🔔 타이머 정리 함수
  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 🔔 녹음 정지 + Blob 저장
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // 🔔 현재 문장의 오디오 재생
  const handlePlay = () => {
    if (!current) return;

    // 오디오가 있을 때만 재생
    if (current.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(current.audioUrl);
      } else {
        audioRef.current.src = current.audioUrl;
      }

      setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);

        // test 모드라면, 오디오 끝난 후 자동 녹음 시작해도 좋고,
        // 지금은 사용자가 직접 "녹음 시작"을 누르는 방식 유지
      };

      audioRef.current.play().catch((err) => {
        console.error("Audio play error:", err);
        setIsPlaying(false);
      });
    } else {
      // audioUrl이 아직 없으면 그냥 상태만 잠깐 토글
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 500);
    }
  };

  // 🎙 녹음 시작
  const handleStartRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: "audio/webm" })
          : null;

        setRecordings((prev) => {
          const withoutCurrent = prev.filter((r) => r.itemId !== current.id);
          return [...withoutCurrent, { itemId: current.id, blob }];
        });

        setIsRecording(false);
        setTimeLeft(null);
        clearTimer();
      };

      recorder.start();
      setIsRecording(true);
      setTimeLeft(repeatSeconds);

      // ⏱ 카운트다운 시작
      clearTimer();
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev == null) return null;
          if (prev <= 1) {
            // 시간 끝 → 자동 stop
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error("getUserMedia / MediaRecorder error:", e);
      alert("마이크 권한을 확인해 주세요.");
    }
  };

  // ⏹ 강제 녹음 종료 (버튼용)
  const handleStopRecordingClick = () => {
    stopRecording();
  };

  // ▶ 다음 문장으로
  const handleNext = () => {
    stopRecording();
    clearTimer();
    setTimeLeft(null);
    setIsRecording(false);

    if (index < items.length - 1) {
      setIndex(index + 1);
    } else {
      // 마지막 문장이 끝났을 때
      if (onComplete) {
        onComplete(recordings);
      }
    }
  };

  // ◀ 이전 문장으로 (study 모드에서만)
  const handlePrev = () => {
    if (index === 0) return;
    stopRecording();
    clearTimer();
    setTimeLeft(null);
    setIsRecording(false);
    setIndex(index - 1);
  };

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearTimer();
      stopRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRecording = recordings.find((r) => r.itemId === current?.id);

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Listen and Repeat{" "}
          <span className="ml-2 text-sm text-gray-500">
            ({index + 1} / {items.length})
          </span>
        </h2>
        <span className="text-xs text-gray-500">
          모드: {mode === "study" ? "연습" : "시험"}
        </span>
      </div>

      {/* 문장 텍스트 (실제 시험에서는 안 보이지만, study 모드에서는 보이게 둘 수 있음) */}
      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-800">
        <div className="mb-1 text-xs font-semibold text-gray-500">
          Sentence (dev / study 용):
        </div>
        <p>{current.sentence}</p>
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={isPlaying}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPlaying ? "재생 중..." : "문장 듣기 ▶"}
        </button>

        {!isRecording && (
          <button
            type="button"
            onClick={handleStartRecording}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            🎤 녹음 시작
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={handleStopRecordingClick}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            ⏹ 녹음 종료
          </button>
        )}

        {timeLeft != null && (
          <span className="text-sm text-gray-700">
            남은 시간: <span className="font-mono">{timeLeft}s</span>
          </span>
        )}
      </div>

      {/* 현재 문장 녹음 미리 듣기 */}
      {currentRecording?.blob && (
        <div className="space-y-1 border-t pt-3">
          <div className="text-xs font-semibold text-gray-500">
            이번 문장 녹음 미리 듣기
          </div>
          <audio
            controls
            className="w-full"
            src={URL.createObjectURL(currentRecording.blob)}
          />
        </div>
      )}

      {/* 이전/다음 네비게이션 */}
      <div className="flex items-center justify-between border-t pt-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0 || mode === "test"}
          className="rounded px-3 py-1 text-sm text-gray-600 disabled:opacity-40"
        >
          ◀ 이전
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          {index < items.length - 1 ? "다음 문장 ▶" : "모두 완료"}
        </button>
      </div>
    </div>
  );
}
