// apps/web/app/(protected)/speaking-2026/study/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import SpeakingRunner2026 from "@/components/speaking/SpeakingRunner2026";

// ?”¹ ê°„ë‹¨ ?°ëª¨??Speaking ?ŒìŠ¤??(?€?…ì? anyë¡??ìŠ¨?˜ê²Œ)
const demoSpeakingTest2026: any = {
  meta: {
    id: "speaking-2026-demo",
    label: "TOEFL iBT 2026 ??Speaking Demo",
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
        "The reading and listening describe a change at the university and students??opinions about it. Summarize the change and explain the man?™s opinion about it and the reasons he gives.",
      preparationSeconds: 30,
      speakingSeconds: 60,
    },
  ],
};

export default function Speaking2026StudyPage() {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // SpeakingRunner2026 onFinish ?œê·¸?ˆì²˜:
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

        // ?€?µì ??ë¬¸ì¥/?¨ì–´ ??        const sentences = script
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

      setSaveMessage("?¤í”¼???°ìŠµ ê²°ê³¼ê°€ ?€?¥ë˜?ˆìŠµ?ˆë‹¤. ?‘");
    } catch (e) {
      console.error("Failed to save speaking_results_2026", e);
      setSaveMessage("?€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }

    // ??Runnerê°€ ê¸°ë??˜ëŠ” ë¦¬í„´ê°?    return { ok: true as const };
  };

  return (
    <main className="mx-auto space-y-6 pb-8 max-w-4xl">
      <h1 className="text-xl font-bold">TOEFL iBT 2026 ??Speaking Practice</h1>
      <p className="text-xs text-gray-600">
        ?°ìŠµ???ë‚˜ë©? ê°?Task???¤í¬ë¦½íŠ¸ê°€ Supabase???€?¥ë©?ˆë‹¤.
      </p>

      <SpeakingRunner2026
        test={demoSpeakingTest2026}
        onFinish={handleFinish}
      />

      {saveMessage && (
        <p className="text-xs text-emerald-700">{saveMessage}</p>
      )}

      {/* ?”Š ì¶”ê?: ?¤ì œ ë§ˆì´???¹ìŒ ?°ìŠµ ë¸”ë¡ + ?…ë¡œ??*/}
      <SpeakingAudioPractice />
    </main>
  );
}

// ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
// Speaking ?¹ìŒ ?°ìŠµ ?¹ì…˜
// ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

function SpeakingAudioPractice() {
  const promptFromTask1: string =
    (demoSpeakingTest2026?.tasks?.[0]?.prompt as string) ??
    "Talk about a familiar topic for 45 seconds.";

  return (
    <section className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-xs">
      <h2 className="text-sm font-semibold text-gray-800">
        ?™ ì¶”ê? Speaking ?¹ìŒ ?°ìŠµ (Demo)
      </h2>
      <p className="text-[11px] text-gray-600">
        ?¤ì œ TOEFL Task 1 ?¤í???ë¬¸ì œë¥?ë³´ê³ , ë¸Œë¼?°ì??ì„œ ë°”ë¡œ ?¹ìŒ/?¬ìƒ?˜ê³ ,
        ?í•˜ë©?Supabase Storage???…ë¡œ?œê¹Œì§€ ?˜ëŠ” ?°ìŠµ êµ¬ì—­?…ë‹ˆ??
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
        label="Task 1 ??ë§í•˜ê¸??¹ìŒ ?°ìŠµ"
        testId="speaking-2026-demo"
        taskId="task1-extra"
      />
    </section>
  );
}

// ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
// Audio Recorder + ?…ë¡œ??// ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

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
        setErrorMsg("??ë¸Œë¼?°ì??ì„œ??ë§ˆì´???¹ìŒ??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
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
      setErrorMsg("ë§ˆì´???‘ê·¼???ˆìš©?ˆëŠ”ì§€ ?•ì¸??ì£¼ì„¸??");
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
      setUploadMsg("ë¨¼ì? ?¹ìŒ???„ë£Œ??ì£¼ì„¸??");
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
        setUploadMsg(`?…ë¡œ???¤íŒ¨: ${json.error ?? "?????†ëŠ” ?¤ë¥˜"}`);
        return;
      }

      setUploadMsg(
        "?…ë¡œ???±ê³µ! (?´ì œ Teacher Dashboard?ì„œ ??ê²½ë¡œë¥?ë¦¬í¬?¸ì— ?°ê²°?????ˆì–´??)",
      );
      console.log("Upload success:", json);
    } catch (err) {
      console.error("Upload exception:", err);
      setUploadMsg("?¤íŠ¸?Œí¬ ?¤ë¥˜ë¡??…ë¡œ?œì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold text-gray-800">
        {label ?? "Speaking ?¹ìŒ"}
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
          {status === "recording" ? "?¹ìŒ ì¤?.." : "?¹ìŒ ?œì‘"}
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
          ?¹ìŒ ì¢…ë£Œ
        </button>

        <span className="text-[10px] text-gray-500">
          ?íƒœ:{" "}
          {status === "idle"
            ? "?€ê¸?
            : status === "recording"
            ? "?¹ìŒ ì¤?
            : "?¹ìŒ ?„ë£Œ"}
        </span>
      </div>

      {audioUrl && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] text-gray-600">???¹ìŒ???Œì„± ?£ê¸°</p>
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
          {isUploading ? "?…ë¡œ??ì¤?.." : "Supabase???…ë¡œ??}
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
        * ?…ë¡œ?œëœ ?Œì¼?€ Supabase Storage??<code>speaking-audio</code>{" "}
        ë²„í‚·???€?¥ë©?ˆë‹¤. ?¤ìŒ ?¨ê³„?ì„œ????ê²½ë¡œë¥?" "}
        <code>speaking_results_2026</code> ?ëŠ” ë³„ë„ ?Œì´ë¸”ì— ?°ê²°?´ì„œ
        ë¦¬í¬?¸ì— ?œì‹œ?˜ë©´ ?¼ìš”.
      </p>
    </div>
  );
}
