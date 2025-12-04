// apps/web/app/(protected)/speaking_2026/components/InterviewRunner.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export type InterviewQuestion = {
  id: string;
  question: string;
  audioUrl?: string;     // 나중에 실제 질문 음성 연결 가능
  answerSeconds?: number; // 이 질문에 주어지는 답변 시간(초) - 없으면 기본값 사용
};

type RecordingResult = {
  questionId: string;
  blob: Blob | null;
};

type Props = {
  questions: InterviewQuestion[];
  mode?: "study" | "test";          // study: 뒤로 가기 허용, test: 순차만
  defaultAnswerSeconds?: number;    // 기본 답변 시간(초), ex) 20
  autoStartAfterAudio?: boolean;    // 질문 오디오 끝나면 자동 녹음 시작
  onComplete?: (results: RecordingResult[]) => void;
};

export default function InterviewRunner({
  questions,
  mode = "study",
  defaultAnswerSeconds = 20,
  autoStartAfterAudio = true,
  onComplete,
}: Props) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<RecordingResult[]>([]);
  const [finished, setFinished] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const current = questions[index];

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      const answerSeconds =
        current.answerSeconds ?? defaultAnswerSeconds ?? 20;

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
          const without = prev.filter(
            (r) => r.questionId !== current.id
          );
          return [...without, { questionId: current.id, blob }];
        });

        setIsRecording(false);
        setTimeLeft(null);
        clearTimer();
      };

      recorder.start();
      setIsRecording(true);
      setTimeLeft(answerSeconds);

      clearTimer();
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev == null) return null;
          if (prev <= 1) {
            // 시간 끝 → 자동 종료
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("마이크 권한을 확인해 주세요.");
    }
  };

  const handlePlayQuestion = () => {
    if (!current) return;

    if (current.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(current.audioUrl);
      } else {
        audioRef.current.src = current.audioUrl;
      }

      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        if (autoStartAfterAudio) {
          // 질문이 끝나면 자동 답변 녹음 시작
          void startRecording();
        }
      };

      audioRef.current
        .play()
        .then(() => {
          // playing...
        })
        .catch((err) => {
          console.error("Audio play error:", err);
          setIsPlaying(false);
        });
    } else {
      // audioUrl이 아직 없으면 텍스트만 보여주고, 바로 녹음 시작 선택 가능
      if (autoStartAfterAudio) {
        void startRecording();
      }
    }
  };

  const handleStopRecordingClick = () => {
    stopRecording();
  };

  const goNextQuestion = () => {
    stopRecording();
    clearTimer();
    setTimeLeft(null);
    setIsRecording(false);

    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      if (onComplete) {
        onComplete(recordings);
      }
    }
  };

  const goPrevQuestion = () => {
    if (mode === "test") return;
    if (index === 0) return;

    stopRecording();
    clearTimer();
    setTimeLeft(null);
    setIsRecording(false);

    setIndex(index - 1);
  };

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

  const currentRecording = recordings.find(
    (r) => r.questionId === current?.id
  );

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Take an Interview{" "}
          <span className="ml-2 text-sm text-gray-500">
            ({index + 1} / {questions.length})
          </span>
        </h2>
        <span className="text-xs text-gray-500">
          모드: {mode === "study" ? "연습" : "시험"}
        </span>
      </div>

      {/* 인터뷰 질문 텍스트 (실제 시험에서는 음성만일 수 있지만, 연습용으로 표시) */}
      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-800">
        <div className="mb-1 text-xs font-semibold text-gray-500">
          Question:
        </div>
        <p>{current.question}</p>
      </div>

      {/* 컨트롤들 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePlayQuestion}
          disabled={isPlaying}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPlaying ? "질문 재생 중..." : "질문 듣기 ▶"}
        </button>

        {!isRecording && (
          <button
            type="button"
            onClick={() => void startRecording()}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            🎤 답변 녹음 시작
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={handleStopRecordingClick}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            ⏹ 답변 녹음 종료
          </button>
        )}

        {timeLeft != null && (
          <span className="text-sm text-gray-700">
            남은 답변 시간:{" "}
            <span className="font-mono">{timeLeft}s</span>
          </span>
        )}
      </div>

      {/* 현재 질문 녹음 미리 듣기 */}
      {currentRecording?.blob && (
        <div className="space-y-1 border-t pt-3">
          <div className="text-xs font-semibold text-gray-500">
            이 질문에 대한 내 답변 (미리 듣기)
          </div>
          <audio
            controls
            className="w-full"
            src={URL.createObjectURL(currentRecording.blob)}
          />
        </div>
      )}

      {/* 네비게이션 */}
      <div className="flex items-center justify-between border-t pt-3">
        <button
          type="button"
          onClick={goPrevQuestion}
          disabled={index === 0 || mode === "test"}
          className="rounded px-3 py-1 text-sm text-gray-600 disabled:opacity-40"
        >
          ◀ 이전 질문
        </button>

        <button
          type="button"
          onClick={goNextQuestion}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          {index < questions.length - 1
            ? "다음 질문 ▶"
            : finished
            ? "다시 보기"
            : "모두 완료"}
        </button>
      </div>
    </div>
  );
}
