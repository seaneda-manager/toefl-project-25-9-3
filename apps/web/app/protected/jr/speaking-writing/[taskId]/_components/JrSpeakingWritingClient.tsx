"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { submitSpeakingWritingAction } from "../actions";

type Props = {
  taskId: string;
  taskType: "speaking" | "writing" | "speaking_and_writing";
  prompt: string;
  dueDate: string;
};

export default function JrSpeakingWritingClient({
  taskId,
  taskType,
  prompt,
  dueDate,
}: Props) {
  const router = useRouter();
  const [writingText, setWritingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (taskType !== "writing" && !isRecording) {
      setError("음성을 녹음하세요");
      return;
    }
    if (taskType !== "speaking" && !writingText.trim()) {
      setError("글을 작성하세요");
      return;
    }

    const result = await submitSpeakingWritingAction({
      taskId,
      writingText: taskType !== "speaking" ? writingText : undefined,
      audioUrl: taskType !== "writing" ? "mock-audio-url" : undefined,
    });

    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(result.error || "제출 실패");
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center space-y-6">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-neutral-900">제출 완료!</h1>
        <p className="text-neutral-500">선생님이 피드백을 드릴 때까지 기다리세요.</p>
        <button
          onClick={() => router.push("/jr")}
          className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          홈으로
        </button>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white p-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {taskType === "speaking"
              ? "Speaking 과제"
              : taskType === "writing"
              ? "Writing 과제"
              : "Speaking & Writing 과제"}
          </h1>
          <p className="text-sm text-slate-600">
            마감일: {new Date(dueDate).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">문제</h2>
          <p className="text-slate-700 leading-relaxed">{prompt}</p>
        </div>

        {(taskType === "speaking" || taskType === "speaking_and_writing") && (
          <div className="bg-white rounded-lg p-6 shadow mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              🎤 음성 녹음
            </h2>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isRecording ? "⏹ 녹음 멈추기" : "⏺ 녹음 시작"}
            </button>
            {isRecording && (
              <p className="text-sm text-slate-600 mt-4 text-center">
                🔴 녹음 중...
              </p>
            )}
          </div>
        )}

        {(taskType === "writing" || taskType === "speaking_and_writing") && (
          <div className="bg-white rounded-lg p-6 shadow mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              ✍️ 글쓰기
            </h2>
            <textarea
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="답변을 작성하세요..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={8}
            />
            <p className="text-xs text-slate-500 mt-2">
              작성 글자 수: {writingText.length}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700"
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
