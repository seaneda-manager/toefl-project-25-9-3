// apps/web/components/vocab/VocabWordDrillPanel.tsx
"use client";

import { useMemo, useState } from "react";
import type { VocabWordWithDrill } from "@/models/vocab-demo";
import AudioRecorder from "@/components/common/AudioRecorder";

type DrillStep = 1 | 2 | 3;

function getPrimaryDrillEntry(word: VocabWordWithDrill) {
  return word.drillEntries?.[0];
}

// ─────────────────────────────
// 메인 패널 컴포넌트
// ─────────────────────────────

type Props = {
  word: VocabWordWithDrill;
};

export default function VocabWordDrillPanel({ word }: Props) {
  const [step, setStep] = useState<DrillStep>(1);
  const entry = getPrimaryDrillEntry(word);
  const mainSense = entry?.senses[0];

  const canGoNext = step < 3;
  const canGoPrev = step > 1;

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      {/* 헤더: 단어 + 발음 + 기본 정보 */}
      <header className="border-b pb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold">{word.text}</h2>
          {word.phoneticBrE && (
            <span className="text-sm text-gray-500">{word.phoneticBrE}</span>
          )}
        </div>
        {entry && mainSense && (
          <p className="mt-1 text-sm text-gray-700">
            <span className="font-semibold">{entry.posTag}</span>{" "}
            {entry.posTag === "v" && entry.verbForms && (
              <span className="text-xs text-gray-500">
                (past: {entry.verbForms.past}, p.p:{" "}
                {entry.verbForms.pastParticiple})
              </span>
            )}
            {" — "}
            {mainSense.meaningKo}
          </p>
        )}

        {/* 단계 표시 */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span
            className={
              step === 1 ? "font-semibold text-blue-600" : "text-gray-400"
            }
          >
            1. 뜻 말하기
          </span>
          <span>·</span>
          <span
            className={
              step === 2 ? "font-semibold text-blue-600" : "text-gray-400"
            }
          >
            2. 문장 만들기
          </span>
          <span>·</span>
          <span
            className={
              step === 3 ? "font-semibold text-blue-600" : "text-gray-400"
            }
          >
            3. 콜로케이션
          </span>
        </div>
      </header>

      {/* 본문: 단계별 내용 */}
      <main className="min-h-[180px]">
        {step === 1 && <DrillStepMeaning word={word} />}
        {step === 2 && <DrillStepSentence word={word} />}
        {step === 3 && <DrillStepCollocation word={word} />}
      </main>

      {/* 네비게이션 버튼 */}
      <footer className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => canGoPrev && setStep((s) => (s - 1) as DrillStep)}
          className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          disabled={!canGoPrev}
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={() => canGoNext && setStep((s) => (s + 1) as DrillStep)}
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-40"
          disabled={!canGoNext}
        >
          다음 →
        </button>
      </footer>
    </div>
  );
}

// ─────────────────────────────
// Step 1: 뜻 말하기
// ─────────────────────────────

type StepProps = {
  word: VocabWordWithDrill;
};

function DrillStepMeaning({ word }: StepProps) {
  const entry = getPrimaryDrillEntry(word);
  const mainSense = entry?.senses[0];

  return (
    <section className="space-y-3">
      <p className="text-sm text-gray-700">
        이 단어의 뜻이 뭐라고 생각해?{" "}
        <span className="font-semibold">한국어로 짧게</span> 말해봐.
      </p>

      {/* 🔊 발음 듣기 버튼 – 나중에 TTS 연결 */}
      <button
        type="button"
        className="rounded-full border px-3 py-1 text-xs text-gray-700"
      >
        🔊 발음 듣기
      </button>

      {/* 🎙 학생 음성 입력 – 기존 AudioRecorder 재사용 */}
      <div className="rounded-lg border bg-gray-50 p-3">
        <p className="mb-2 text-xs text-gray-500">여기에 말해보기</p>
        <AudioRecorder
          label="뜻 말하기 녹음"
          onRecorded={(blob) => {
            // TODO: 나중에 이 blob을 AI 채점 API로 보낼 수 있음
            console.log("RECORDING_COMPLETE (meaning-step)", blob);
          }}
        />
      </div>

      {/* 정답/설명 박스 */}
      {mainSense && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm">
          <p className="font-semibold">기본 의미</p>
          <p className="mt-1">- {mainSense.meaningKo}</p>
          {mainSense.meaningEnShort && (
            <p className="text-gray-700">- {mainSense.meaningEnShort}</p>
          )}
          {entry?.usageNoteKo && (
            <p className="mt-2 text-xs text-blue-900">
              💡 {entry.usageNoteKo}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────
// Step 2: 자기 문장 만들기
// ─────────────────────────────

function DrillStepSentence({ word }: StepProps) {
  const entry = getPrimaryDrillEntry(word);
  const mainSense = entry?.senses[0];
  const [sentence, setSentence] = useState("");

  const example = mainSense?.examples?.[0];

  return (
    <section className="space-y-3">
      <p className="text-sm text-gray-700">
        {`"${word.text}"`} 를 사용해서{" "}
        <span className="font-semibold">자신의 문장</span>을 만들어 봐.
      </p>

      <textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        placeholder={`예: I finally grasped the main idea of the story.`}
        className="h-24 w-full rounded-lg border p-2 text-sm"
      />

      {/* 나중에 AI 피드백 자리 */}
      {sentence && (
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
          <p className="font-semibold">AI 피드백 (예정)</p>
          <p className="mt-1">
            지금은 문장을 저장만 해두고, 나중에 문법/자연스러운 표현을 자동
            분석해서 보여줄 수 있어.
          </p>
        </div>
      )}

      {/* 참고 예문 */}
      {example && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs">
          <p className="font-semibold">참고 예문</p>
          <p className="mt-1 italic">"{example.sentence}"</p>
          {example.ko && (
            <p className="text-gray-600">{example.ko}</p>
          )}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────
// Step 3: Collocation 선택
// ─────────────────────────────

function buildCollocationOptions(
  entry?: VocabWordWithDrill["drillEntries"][0],
  headword?: string,
) {
  if (!entry || !entry.collocations?.length || !headword) return [];

  const correct = entry.collocations[0]; // 일단 첫 번째를 정답으로 사용
  const distractors: string[] = [];

  // 아주 단순한 가짜 보기 – 나중에 더 똑똑하게 만들 수 있음
  distractors.push(`${headword} something`);
  distractors.push(`${headword} very much`);

  const options = [
    { phrase: correct.phrase, correct: true },
    ...distractors.map((p) => ({ phrase: p, correct: false })),
  ];

  // 간단 셔플
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

function DrillStepCollocation({ word }: StepProps) {
  const entry = getPrimaryDrillEntry(word);
  const [selected, setSelected] = useState<string | null>(null);
  const options = useMemo(
    () => buildCollocationOptions(entry, word.text),
    [entry, word.text],
  );

  if (!entry || !entry.collocations?.length) {
    return (
      <p className="text-sm text-gray-500">
        이 단어에는 아직 콜로케이션 데이터가 없습니다.
      </p>
    );
  }

  const correctPhrase = entry.collocations[0];

  const selectedOption = options.find((o) => o.phrase === selected);
  const isCorrect = selectedOption?.correct;

  return (
    <section className="space-y-3">
      <p className="text-sm text-gray-700">
        {`"${word.text}"`} 와 가장 자연스럽게 어울리는 표현을 골라봐.
      </p>

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.phrase}
            type="button"
            onClick={() => setSelected(opt.phrase)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
              selected === opt.phrase
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span>{opt.phrase}</span>
            {selected === opt.phrase && (
              <span className="text-xs">
                {opt.correct ? "✅" : "❌"}
              </span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-lg bg-green-50 p-3 text-xs">
          <p className="font-semibold">
            {isCorrect ? "정답이에요! 👏" : "이번에는 아쉬웠다! 😅"}
          </p>
          <p className="mt-1">
            가장 자연스러운 표현은{" "}
            <span className="font-semibold">
              "{correctPhrase.phrase}"
            </span>{" "}
            입니다.
          </p>
          {correctPhrase.koHint && (
            <p className="text-gray-700">
              ↳ {correctPhrase.koHint}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
