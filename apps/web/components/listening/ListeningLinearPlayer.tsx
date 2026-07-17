"use client";

import { useState } from "react";
import type { LListeningTest2026 } from "@/models/listening";

type Props = {
  test: LListeningTest2026;
};

export default function ListeningLinearPlayer({ test }: Props) {
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);

  const tracks = test.tracks ?? [];
  if (tracks.length === 0) {
    return <div className="p-6 text-center text-gray-600">트랙이 없습니다.</div>;
  }

  const currentTrack = tracks[currentTrackIdx];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* 진행률 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          {currentTrackIdx + 1} / {tracks.length}
        </span>
        <div className="h-2 flex-1 mx-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-violet-600 transition-all"
            style={{ width: `${((currentTrackIdx + 1) / tracks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 현재 트랙 */}
      <div className="rounded-lg border-2 border-violet-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{currentTrack.title}</h2>
          <p className="mt-1 text-xs text-gray-500">{currentTrack.taskKind}</p>
        </div>

        {/* 트랜스크립트 */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {currentTrack.transcript}
          </p>
        </div>

        {/* 음성 플레이어 */}
        {currentTrack.audioUrl && (
          <div className="mb-6">
            <audio
              controls
              className="w-full"
              src={currentTrack.audioUrl}
              style={{ height: "40px" }}
            />
          </div>
        )}

        {/* 문제들 */}
        {currentTrack.questions && currentTrack.questions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">문제</h3>
            {currentTrack.questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm font-medium text-gray-900">
                  {idx + 1}. {q.text}
                </p>
                <div className="mt-2 space-y-2">
                  {q.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        disabled
                        className="cursor-not-allowed"
                      />
                      {choice.text}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between gap-3">
        <button
          onClick={() => setCurrentTrackIdx(Math.max(0, currentTrackIdx - 1))}
          disabled={currentTrackIdx === 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          이전
        </button>

        <div className="flex gap-2">
          {tracks.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentTrackIdx(idx)}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                idx === currentTrackIdx
                  ? "bg-violet-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentTrackIdx(Math.min(tracks.length - 1, currentTrackIdx + 1))}
          disabled={currentTrackIdx === tracks.length - 1}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
