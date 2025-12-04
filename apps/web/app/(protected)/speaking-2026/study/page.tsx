// apps/web/app/(protected)/speaking-2026/study/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import SpeakingRunner2026 from "@/components/speaking/SpeakingRunner2026";

// 🔹 간단 데모용 Speaking 테스트 (타입은 any로 느슨하게)
const demoSpeakingTest2026: any = {
  meta: {
    id: "speaking-2026-demo",
    label: "TOEFL iBT 2026 – Speaking Demo",
  },
  tasks: [
    {
      id: "task1",
      type: "independent",
      prompt:
        "Do you agree or disagree with the following statement? It is better to study alone than to study with a group of students. Use details and examples to support your opinion.",
      preparationSeconds: 15,
      speakingSeconds: 45,
    },
    {
      id: "task2",
      type: "integrated_read_listen_speak",
      prompt:
        "The reading and listening describe a change at the university and students’ opinions about it. Summarize the change and explain the man’s opinion about it and the reasons he gives.",
      preparationSeconds: 30,
      speakingSeconds: 60,
    },
  ],
};

export default function Speaking2026StudyPage() {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // SpeakingRunner2026 onFinish 시그니처:
  // (result: any) => { ok: true } | Promise<{ ok: true }>
  const handleFinish = async (result: any) => {
    setSaveMessage(null);

    try {
      const testId = result?.testId ?? "speaking-2026-demo";

      const tasks: any[] = Array.isArray(result?.tasks)
        ? result.tasks
        : [];

      for (const task of tasks) {
        const script: string = String(task.script ?? "").trim();
        if (!script) continue;

        const taskId: string = String(task.taskId ?? "task1");
        const prompt: string | undefined =
          typeof task.prompt === "string" ? task.prompt : undefined;

        // 대략적인 문장/단어 수
        const sentences = script
          .split(/[.!?]+/)
          .filter((s) => s.trim()).length;
        const words = script.split(/\s+/).filter((w) => w.trim()).length;

        await fetch("/api/speaking-2026/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            taskId,
            script,
            prompt,
            mode: "study",
            approxSentences: sentences,
            approxWords: words,
            meta: {
              source: "speaking-2026-study",
            },
          }),
        });
      }

      setSaveMessage("스피킹 연습 결과가 저장되었습니다. 👍");
    } catch (e) {
      console.error("Failed to save speaking_results_2026", e);
      setSaveMessage("저장 중 오류가 발생했습니다.");
    }

    // ✅ Runner가 기대하는 리턴값
    return { ok: true as const };
  };

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">TOEFL iBT 2026 – Speaking Practice</h1>
      <p className="text-xs text-gray-600">
        연습이 끝나면, 각 Task의 스크립트가 Supabase에 저장됩니다.
      </p>

      <SpeakingRunner2026
        test={demoSpeakingTest2026}
        onFinish={handleFinish}
      />

      {saveMessage && (
        <p className="text-xs text-emerald-700">{saveMessage}</p>
      )}

      {/* 🔊 추가: 실제 마이크 녹음 연습 블록 + 업로드 */}
      <SpeakingAudioPractice />
    </main>
  );
}

// ─────────────────────────────
// Speaking 녹음 연습 섹션
// ─────────────────────────────

function SpeakingAudioPractice() {
  const promptFromTask1: string =
    (demoSpeakingTest2026?.tasks?.[0]?.prompt as string) ??
    "Talk about a familiar topic for 45 seconds.";

  return (
    <section className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-xs">
      <h2 className="text-sm font-semibold text-gray-800">
        🎙 추가 Speaking 녹음 연습 (Demo)
      </h2>
      <p className="text-[11px] text-gray-600">
        실제 TOEFL Task 1 스타일 문제를 보고, 브라우저에서 바로 녹음/재생하고,
        원하면 Supabase Storage에 업로드까지 하는 연습 구역입니다.
      </p>

      <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3">
        <p className="text-[11px] font-semibold text-blue-800">
          Example Prompt
        </p>
        <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-blue-900">
          {promptFromTask1}
        </p>
      </div>

      <SimpleAudioRecorder
        label="Task 1 – 말하기 녹음 연습"
        testId="speaking-2026-demo"
        taskId="task1-extra"
      />
    </section>
  );
}

// ─────────────────────────────
// Audio Recorder + 업로드
// ─────────────────────────────

type SimpleAudioRecorderProps = {
  label?: string;
  testId?: string;
  taskId?: string;
};

type RecordingStatus = "idle" | "recording" | "finished";

function SimpleAudioRecorder({
  label,
  testId,
  taskId,
}: SimpleAudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      setUploadMsg(null);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg("이 브라우저에서는 마이크 녹음을 지원하지 않습니다.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        setStatus("finished");
      };

      recorder.start();
      setStatus("recording");
    } catch (err) {
      console.error("Audio recording error:", err);
      setErrorMsg("마이크 접근을 허용했는지 확인해 주세요.");
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      setUploadMsg("먼저 녹음을 완료해 주세요.");
      return;
    }

    setIsUploading(true);
    setUploadMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "speaking.webm");
      if (testId) formData.append("testId", testId);
      if (taskId) formData.append("taskId", taskId);

      const res = await fetch("/api/speaking-2026/upload-audio", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Upload error:", json);
        setUploadMsg(`업로드 실패: ${json.error ?? "알 수 없는 오류"}`);
        return;
      }

      setUploadMsg(
        "업로드 성공! (이제 Teacher Dashboard에서 이 경로를 리포트에 연결할 수 있어요.)",
      );
      console.log("Upload success:", json);
    } catch (err) {
      console.error("Upload exception:", err);
      setUploadMsg("네트워크 오류로 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold text-gray-800">
        {label ?? "Speaking 녹음"}
      </p>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={startRecording}
          disabled={status === "recording"}
          className={`rounded-full px-4 py-1.5 font-semibold ${
            status === "recording"
              ? "cursor-not-allowed bg-red-200 text-red-500"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {status === "recording" ? "녹음 중..." : "녹음 시작"}
        </button>

        <button
          type="button"
          onClick={stopRecording}
          disabled={status !== "recording"}
          className={`rounded-full px-4 py-1.5 font-semibold ${
            status !== "recording"
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "bg-gray-700 text-white hover:bg-gray-800"
          }`}
        >
          녹음 종료
        </button>

        <span className="text-[10px] text-gray-500">
          상태:{" "}
          {status === "idle"
            ? "대기"
            : status === "recording"
            ? "녹음 중"
            : "녹음 완료"}
        </span>
      </div>

      {audioUrl && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] text-gray-600">▶ 녹음된 음성 듣기</p>
          <audio className="w-full" controls src={audioUrl} />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={uploadAudio}
          disabled={!audioBlob || isUploading}
          className={`rounded-full px-4 py-1.5 font-semibold ${
            !audioBlob || isUploading
              ? "cursor-not-allowed bg-indigo-200 text-indigo-500"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isUploading ? "업로드 중..." : "Supabase에 업로드"}
        </button>

        {uploadMsg && (
          <span className="text-[10px] text-indigo-800">
            {uploadMsg}
          </span>
        )}
      </div>

      {errorMsg && (
        <p className="text-[10px] text-red-600">{errorMsg}</p>
      )}

      <p className="text-[10px] text-gray-400">
        * 업로드된 파일은 Supabase Storage의 <code>speaking-audio</code>{" "}
        버킷에 저장됩니다. 다음 단계에서는 이 경로를{" "}
        <code>speaking_results_2026</code> 또는 별도 테이블에 연결해서
        리포트에 표시하면 돼요.
      </p>
    </div>
  );
}
