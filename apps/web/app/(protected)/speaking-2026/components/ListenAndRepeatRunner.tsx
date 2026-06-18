"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type ListenRepeatItem = {
  id: string;
  sentence: string;
  audioUrl?: string;
  speakingSeconds?: number;
  imageUrl?: string;
  region?: { x: number; y: number; w: number; h: number };
};

type Phase = "idle" | "listening" | "prepare" | "recording" | "done";

type Props = {
  items: ListenRepeatItem[];
  globalImageUrl?: string;
  mode?: "study" | "test";
  totalQuestionOffset?: number; // 전체 시험에서 이 섹션이 시작하는 문항 번호 (기본 1)
  totalQuestions?: number;
  onComplete?: (result: { itemId: string; blob: Blob | null }[]) => void;
};

// 오디오 beep 생성 (Web Audio API)
function playBeep(ctx: AudioContext, freq = 880, duration = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Waveform visualizer
function WaveformBar({ isActive, volume }: { isActive: boolean; volume: number }) {
  const bars = Array.from({ length: 24 });
  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ width: 400, height: 80 }}>
      {bars.map((_, i) => {
        const seed = Math.sin(i * 2.5) * 0.5 + 0.5;
        const h = isActive ? Math.max(4, seed * volume * 60 + 4) : 4;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              width: 10,
              height: h,
              backgroundColor: isActive ? "#D9383A" : "#CBD5E1",
            }}
          />
        );
      })}
    </div>
  );
}

export default function ListenAndRepeatRunner({
  items,
  globalImageUrl,
  mode = "test",
  totalQuestionOffset = 1,
  totalQuestions = 11,
  onComplete,
}: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [volume, setVolume] = useState(0);
  const [recordings, setRecordings] = useState<{ itemId: string; blob: Blob | null }[]>([]);
  const [nextDisabled, setNextDisabled] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const current = items[index];
  const speakingSeconds = current?.speakingSeconds ?? 10;
  const questionNumber = totalQuestionOffset + index;
  const imageUrl = current?.imageUrl ?? globalImageUrl;

  const clearTimer = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopVolumeTracker = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    setVolume(0);
  };

  const startVolumeTracker = (stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 128;
      setVolume(avg);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopVolumeTracker();
    clearTimer();
  }, []);

  const startRecording = useCallback(async () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    playBeep(audioCtxRef.current, 880, 0.15); // 시작 beep

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startVolumeTracker(stream);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: "audio/webm" }) : null;
        setRecordings((prev) => {
          const filtered = prev.filter((r) => r.itemId !== current.id);
          return [...filtered, { itemId: current.id, blob }];
        });
      };

      recorder.start();
      setPhase("recording");
      setTimeLeft(speakingSeconds);

      clearTimer();
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
            playBeep(audioCtxRef.current, 440, 0.2); // 종료 beep
            setPhase("done");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      alert("마이크 권한을 확인해 주세요.");
    }
  }, [current, speakingSeconds, stopRecording]);

  const playAudio = useCallback(() => {
    setPhase("listening");
    setNextDisabled(true);

    if (current?.audioUrl) {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = current.audioUrl;
      audioRef.current.onended = () => {
        setPhase("prepare");
        setNextDisabled(false);
        setTimeout(() => void startRecording(), 300);
      };
      audioRef.current.play().catch(() => {
        setPhase("prepare");
        setNextDisabled(false);
        void startRecording();
      });
    } else {
      // 오디오 없으면 2초 후 녹음 시작 (개발용)
      setTimeout(() => {
        setPhase("prepare");
        setNextDisabled(false);
        setTimeout(() => void startRecording(), 500);
      }, 1500);
    }
  }, [current, startRecording]);

  // 문항 전환 시 자동 재생
  useEffect(() => {
    setPhase("idle");
    setTimeLeft(0);
    setTimeout(() => playAudio(), 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleNext = () => {
    if (nextDisabled) return;
    stopRecording();
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onComplete?.(recordings);
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
      audioRef.current?.pause();
      audioCtxRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phaseText = phase === "listening" ? "Listening to prompt..."
    : phase === "prepare" ? "Prepare to repeat..."
    : phase === "recording" ? "● RECORDING"
    : phase === "done" ? "Done"
    : "Loading...";

  const phaseColor = phase === "recording" ? "#D9383A"
    : phase === "listening" ? "#1A2B4C"
    : "#333333";

  const progressPct = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh", backgroundColor: "#F4F6F9", fontFamily: "Arial, Helvetica, sans-serif" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 shrink-0" style={{ height: 60, backgroundColor: "#1A2B4C" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>Updated TOEFL iBT - Speaking</span>
        <div className="flex items-center" style={{ gap: 12 }}>
          <button className="flex items-center gap-1 rounded border border-slate-400 bg-transparent px-3 text-white" style={{ width: 90, height: 36, fontSize: 13 }}>
            🔊 Volume
          </button>
          <button className="rounded border border-slate-400 bg-transparent text-white" style={{ width: 70, height: 36, fontSize: 13 }}>
            Help
          </button>
          <button
            onClick={handleNext}
            disabled={nextDisabled || phase === "recording" || phase === "listening"}
            className="rounded font-semibold text-white disabled:opacity-40"
            style={{ width: 100, height: 36, fontSize: 13, backgroundColor: "#0073E6", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Next &gt;
          </button>
        </div>
      </header>

      {/* ── Main Body ── */}
      <main className="flex flex-1 items-center justify-center" style={{ padding: "0 60px" }}>
        <div className="flex items-center justify-center gap-8 w-full">

          {/* 좌측: Visual Card */}
          <div className="relative shrink-0 overflow-hidden rounded-lg"
            style={{ width: 800, height: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", backgroundColor: "#E2E8F0" }}>
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Site map" className="h-full w-full" style={{ objectFit: "contain" }} />
                {/* 하이라이트 영역 */}
                {current?.region && (
                  <div className="absolute pointer-events-none transition-all duration-300"
                    style={{
                      left: `${current.region.x}%`,
                      top: `${current.region.y}%`,
                      width: `${current.region.w}%`,
                      height: `${current.region.h}%`,
                      border: "3px solid #0073E6",
                      backgroundColor: "rgba(0,115,230,0.15)",
                      borderRadius: 4,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">
                이미지를 에셋 편집 페이지에서 업로드하세요
              </div>
            )}
          </div>

          {/* 우측: Status & Audio Card */}
          <div className="flex shrink-0 flex-col items-center justify-center gap-8 rounded-lg bg-white"
            style={{ width: 600, height: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>

            {/* 상태 텍스트 */}
            <p style={{ fontSize: 24, fontWeight: 700, color: phaseColor, letterSpacing: "0.01em" }}>
              {phaseText}
            </p>

            {/* Waveform */}
            <WaveformBar isActive={phase === "recording"} volume={volume} />

            {/* 카운트다운 타이머 바 */}
            <div className="space-y-2 text-center">
              {phase === "recording" && (
                <p className="font-mono text-sm" style={{ color: "#D9383A" }}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
                </p>
              )}
              <div className="overflow-hidden rounded-full" style={{ width: 450, height: 12, backgroundColor: "#EEEEEE" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 linear"
                  style={{
                    width: phase === "recording" ? `${(timeLeft / speakingSeconds) * 100}%` : phase === "done" ? "0%" : "100%",
                    backgroundColor: timeLeft <= 2 && phase === "recording" ? "#D9383A" : "#0073E6",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between shrink-0 border-t px-6"
        style={{ height: 60, backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#333333" }}>
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="overflow-hidden rounded-full" style={{ width: 240, height: 8, backgroundColor: "#E0E0E0" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: "#0073E6" }} />
        </div>
      </footer>
    </div>
  );
}
