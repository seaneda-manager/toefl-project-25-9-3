// apps/web/app/(protected)/vocab/drill/page.tsx
"use client";

import { useMemo, useState } from "react";
import { demoVocabWords, type VocabWordWithDrill } from "@/models/vocab-demo";
import AudioRecorder from "@/components/common/AudioRecorder";

type Phase = "FLASH" | "READING" | "DRILL" | "SUMMARY";

const PHASE_ORDER: Phase[] = ["FLASH", "READING", "DRILL", "SUMMARY"];

export default function VocabDrillPage() {
  const [phase, setPhase] = useState<Phase>("FLASH");

  // 데모용: 오늘 단어 / 지난 단어 간단 분리
  const todayWords: VocabWordWithDrill[] = useMemo(
    () => demoVocabWords.slice(0, 2),
    [],
  );
  const yesterdayWords: VocabWordWithDrill[] = useMemo(
    () => demoVocabWords.slice(2, 3),
    [],
  );
  const allWords: VocabWordWithDrill[] = useMemo(
    () => [...todayWords, ...yesterdayWords],
    [todayWords, yesterdayWords],
  );

  const goNextPhase = () => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx < 0 || idx === PHASE_ORDER.length - 1) return;
    setPhase(PHASE_ORDER[idx + 1]);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">VOCA Drill – Homework Flow</h1>
        <p className="text-xs text-gray-500">
          A → B → C 순서로 오늘 단어를 리딩/드릴/말하기/쓰기까지 연결하는
          연습 흐름입니다.
        </p>
      </header>

      <PhaseIndicator current={phase} />

      {phase === "FLASH" && (
        <DrillFlashSection
          todayWords={todayWords}
          yesterdayWords={yesterdayWords}
          onNext={goNextPhase}
        />
      )}

      {phase === "READING" && (
        <DrillReadingSection words={allWords} onNext={goNextPhase} />
      )}

      {phase === "DRILL" && (
        <DrillMainDrillSection
          todayWords={todayWords}
          yesterdayWords={yesterdayWords}
          onNext={goNextPhase}
        />
      )}

      {phase === "SUMMARY" && <DrillSummarySection />}
    </main>
  );
}

// ─────────────────────────────
// 상단 단계 표시 (A / B / C)
// ─────────────────────────────

type PhaseIndicatorProps = {
  current: Phase;
};

function PhaseIndicator({ current }: PhaseIndicatorProps) {
  const steps: { phase: Phase; label: string; desc: string }[] = [
    {
      phase: "FLASH",
      label: "A. Flash",
      desc: "지난/오늘 단어 깜빡이 복습",
    },
    {
      phase: "READING",
      label: "B. Reading",
      desc: "오늘 단어가 들어간 리딩",
    },
    {
      phase: "DRILL",
      label: "C. Drill",
      desc: "Voca · Speaking · Writing 숙제",
    },
    {
      phase: "SUMMARY",
      label: "완료",
      desc: "오늘 Drill 정리",
    },
  ];

  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((step, idx) => {
        const isActive = step.phase === current;
        const isDone =
          PHASE_ORDER.indexOf(step.phase) < PHASE_ORDER.indexOf(current);

        return (
          <li key={step.phase} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-full border px-3 py-1 ${
                isActive
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              <span className="text-[10px] font-semibold">
                {step.label}
              </span>
              <span className="text-[10px]">{step.desc}</span>
            </div>
            {idx < steps.length - 1 && (
              <span className="text-[10px] text-gray-300">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─────────────────────────────
// A. Flash Section – 깜빡이
// ─────────────────────────────

type DrillFlashProps = {
  todayWords: VocabWordWithDrill[];
  yesterdayWords: VocabWordWithDrill[];
  onNext: () => void;
};

function DrillFlashSection({
  todayWords,
  yesterdayWords,
  onNext,
}: DrillFlashProps) {
  const [index, setIndex] = useState(0);
  const combined = [...yesterdayWords, ...todayWords];
  const word = combined[index];

  if (!word) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
        복습할 단어가 없습니다.
      </section>
    );
  }

  const coreMeaning = word.meanings_ko[0] ?? "";
  const easySyn = word.meanings_en_simple[0] ?? "";
  const example = word.examples_easy[0] ?? "";

  const isLast = index === combined.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
    } else {
      onNext();
    }
  };

  const badgeLabel = yesterdayWords.some((w) => w.id === word.id)
    ? "어제 배운 단어"
    : "오늘 단어";

  const badgeColor = yesterdayWords.some((w) => w.id === word.id)
    ? "bg-blue-100 text-blue-700"
    : "bg-emerald-100 text-emerald-700";

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-white px-4 py-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-700">
            A. Flash – 지난 수업 + 오늘 단어 빠른 복습
          </p>
          <p className="text-[11px] text-gray-500">
            시험/Drill 전에, 단어 자체를 한 번 더 눈에 익히는 단계예요.
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-emerald-50/60 px-6 py-8 text-center">
        <div className="text-3xl font-bold tracking-tight">
          {word.text}
        </div>
        <div className="mt-2 text-sm text-gray-800">
          {coreMeaning}
          {easySyn && (
            <span className="ml-2 text-xs text-gray-500">
              ({easySyn})
            </span>
          )}
        </div>
        {example && (
          <p className="mt-4 max-w-xl rounded-xl bg-white/80 px-4 py-2 text-xs text-emerald-900">
            <span className="font-semibold">Example</span>
            <br />
            <span className="text-[11px]">{example}</span>
          </p>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="mt-6 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {isLast ? "A단계 완료 → B. Reading으로" : "다음 단어 보기 →"}
        </button>

        <p className="mt-2 text-[10px] text-gray-400">
          {index + 1} / {combined.length}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────
// B. Reading Section – 단어가 들어간 리딩
// ─────────────────────────────

type DrillReadingProps = {
  words: VocabWordWithDrill[];
  onNext: () => void;
};

function DrillReadingSection({ words, onNext }: DrillReadingProps) {
  // 데모: 단어 텍스트만 추출해서 패시지에 끼워 넣기
  const wordTexts = words.map((w) => w.text);

  const demoPassage = `Today we will read a short story that naturally uses some of your vocabulary words like ${wordTexts
    .slice(0, 3)
    .join(", ")}. Imagine you are studying in a quiet library, and you suddenly notice how each of these words appears in your textbook, your teacher's questions, and even in your own thoughts about the topic.`;

  return (
    <section className="space-y-4 rounded-2xl border border-blue-200 bg-white px-4 py-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs font-semibold text-blue-700">
          B. Reading – 오늘 단어가 실제 문맥에서 어떻게 쓰이는지 보기
        </p>
        <p className="text-[11px] text-gray-500">
          나중에는 실제 교재/Wordly Wise 스타일 패시지가 들어가고, 문제도
          추가될 자리입니다. 지금은 흐름만 잡아 둔 상태예요.
        </p>
      </header>

      <article className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm leading-relaxed text-gray-800">
        {demoPassage}
      </article>

      <div className="space-y-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs">
        <p className="text-[11px] font-semibold text-gray-700">
          (예시) Comprehension Questions
        </p>
        <ol className="ml-4 list-decimal space-y-1 text-[11px] text-gray-600">
          <li>
            In the passage, where are you studying, and what suddenly becomes
            noticeable?
          </li>
          <li>
            Why is it useful to see your vocabulary words inside a real story
            instead of just in a word list?
          </li>
        </ol>
        <p className="mt-2 text-[10px] text-gray-400">
          나중에는 여기에 지문 기반 객관식/단답형 문제가 붙고, Drill 결과와
          함께 저장될 예정입니다.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          B단계 완료 → C. Drill로
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────
// C. Drill Section – Voca / Speaking / Writing + Speaking 저장 + 녹음 업로드
// ─────────────────────────────

type DrillMainProps = {
  todayWords: VocabWordWithDrill[];
  yesterdayWords: VocabWordWithDrill[];
  onNext: () => void;
};

function DrillMainDrillSection({
  todayWords,
  yesterdayWords,
  onNext,
}: DrillMainProps) {
  const allWordTexts = [...yesterdayWords, ...todayWords].map(
    (w) => w.text,
  );

  // 🔹 Speaking 텍스트 답변 입력/저장 상태
  const [speakingScript, setSpeakingScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 🔹 녹음 업로드 상태
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadMsg, setAudioUploadMsg] = useState<string | null>(
    null,
  );
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const speakingPrompt =
    "Describe a time when studying vocabulary felt especially helpful to you. Use at least two of today's words in your answer.";
  const mustUseWords = allWordTexts.slice(0, 3); // 데모: 3개 정도 필수 단어

  const handleSaveSpeaking = async () => {
    const trimmed = speakingScript.trim();
    if (!trimmed) {
      setSaveMessage("먼저 아래 칸에 답변을 써 보세요.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/speaking-voca-drill-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: speakingPrompt,
          script: trimmed,
          mustUseWords,
          mode: "task1_voca_drill",
          meta: {
            source: "vocab_drill_C_section",
          },
        }),
      });

      if (!res.ok) {
        setSaveMessage("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setSaveMessage("저장 완료! 👌 (선생님 리포트에 반영됩니다.)");
    } catch (e) {
      console.error("Failed to save speaking_voca_drill_results", e);
      setSaveMessage("네트워크 오류로 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔹 AudioRecorder에서 받은 blob 업로드
  const handleAudioRecorded = async (blob: Blob) => {
    setAudioUploadMsg(null);
    setIsUploadingAudio(true);

    try {
      const formData = new FormData();
      formData.append("file", blob, "voca-drill-speaking.webm");
      formData.append("testId", "vocab-drill");
      formData.append("taskId", "voca-speaking-drill");

      const res = await fetch("/api/speaking-2026/upload-audio", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        console.error("Upload error:", json);
        setAudioUploadMsg(
          `업로드 실패: ${(json as any).error ?? "알 수 없는 오류"}`,
        );
        return;
      }

      setAudioUploadMsg(
        "녹음 파일 업로드 완료! 🎧 (선생님이 나중에 이 녹음을 들을 수 있어요.)",
      );

      if (
        json &&
        typeof json === "object" &&
        "publicUrl" in json &&
        typeof (json as any).publicUrl === "string"
      ) {
        setLastAudioUrl((json as any).publicUrl);
      }
    } catch (e) {
      console.error("Upload error:", e);
      setAudioUploadMsg("네트워크 오류로 업로드에 실패했습니다.");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-amber-200 bg-white px-4 py-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs font-semibold text-amber-700">
          C. Drill – Voca · Speaking · Writing Homework Flow
        </p>
        <p className="text-[11px] text-gray-500">
          여기서부터는 학생이 집에서 할 숙제/Drill 영역입니다. 실제 구현
          단계에서는 각 Drill이 별도 페이지나 워크시트와 연결될 예정이에요.
        </p>
      </header>

      {/* 1) Voca Drill */}
      <div className="space-y-2 rounded-2xl border border-gray-100 bg-amber-50/70 px-4 py-3 text-xs">
        <p className="font-semibold text-amber-900">
          1. Voca Drill (Wordly Wise 스타일)
        </p>
        <ul className="ml-4 list-disc space-y-1 text-[11px] text-amber-900">
          <li>오늘/지난 단어: {allWordTexts.join(", ")}</li>
          <li>뜻 고르기, 문장 속 빈칸 채우기, 동의어/반의어 고르기</li>
          <li>
            단어가 들어간 문장을 보고 &quot;이 단어가 아니면 문장이
            이상해지는 이유&quot;를 설명하게 만들기
          </li>
        </ul>
        <p className="mt-1 text-[10px] text-amber-800">
          → 나중에는 여기서 직접 풀 수 있는 Drill UI 또는 PDF/Worksheet
          다운로드와 연결.
        </p>
      </div>

      {/* 2) Speaking Drill + 저장 UI + 녹음기 */}
      <div className="space-y-3 rounded-2xl border border-gray-100 bg-indigo-50 px-4 py-3 text-xs">
        <p className="font-semibold text-indigo-900">
          2. Speaking Drill (TOEFL Task 느낌)
        </p>
        <p className="text-[11px] text-indigo-900">
          아래 질문에 대해 4~5문장 이상으로 대답해 보세요.{" "}
          <span className="font-semibold">
            (필수 단어: {mustUseWords.join(", ")})
          </span>
        </p>

        <p className="mt-1 rounded-lg bg-white/80 px-3 py-2 text-[11px] text-indigo-900">
          Q. {speakingPrompt}
        </p>

        <textarea
          value={speakingScript}
          onChange={(e) => setSpeakingScript(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-md border border-indigo-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="여기에 영어로 답변을 적어보세요. 나중에 녹음/AI 피드백과 연결될 수 있습니다."
        />

        {/* AudioRecorder + 업로드 */}
        <div className="mt-2 space-y-1 rounded-lg bg-indigo-100/60 px-3 py-2">
          <AudioRecorder
            label={
              isUploadingAudio
                ? "녹음 업로드 중..."
                : "음성 녹음 (선택 사항)"
            }
            onRecorded={handleAudioRecorded}
            disabled={isUploadingAudio}
          />
          {audioUploadMsg && (
            <p className="mt-1 text-[10px] text-indigo-800">
              {audioUploadMsg}
            </p>
          )}
          {lastAudioUrl && (
            <div className="mt-1 space-y-1">
              <p className="text-[10px] text-indigo-900">
                ⏯ 마지막 업로드된 녹음 미리 듣기
              </p>
              <audio controls src={lastAudioUrl} className="w-full" />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-indigo-700">
            * 텍스트 답변은 Supabase의{" "}
            <code>speaking_voca_drill_results</code>에 저장되고,
            녹음 파일은 <code>speaking-audio</code> 버킷에 업로드됩니다.
          </p>
          <button
            type="button"
            onClick={handleSaveSpeaking}
            disabled={isSaving}
            className={`rounded-full px-4 py-1.5 text-[11px] font-semibold ${
              isSaving
                ? "cursor-not-allowed bg-indigo-200 text-indigo-500"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isSaving ? "저장 중..." : "Speaking 텍스트 저장"}
          </button>
        </div>

        {saveMessage && (
          <p className="mt-1 text-[10px] text-indigo-800">
            {saveMessage}
          </p>
        )}
      </div>

      {/* 3) Writing Drill */}
      <div className="space-y-2 rounded-2xl border border-gray-100 bg-green-50 px-4 py-3 text-xs">
        <p className="font-semibold text-emerald-900">
          3. Writing Drill (단락 쓰기)
        </p>
        <ul className="ml-4 list-disc space-y-1 text-[11px] text-emerald-900">
          <li>
            오늘 단어 최소 3개를 사용해서 5문장 정도의 짧은 paragraph 쓰기
          </li>
          <li>
            예: 학교 생활 / 친구 / 취미 등 쉬운 주제에 연결해서 사용하게 하기
          </li>
          <li>나중에는 AI / 선생님 첨삭 시스템과 연결</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-700"
        >
          C단계 개요 확인 완료 → 요약 보기
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────
// SUMMARY – 오늘 Drill 정리
// ─────────────────────────────

function DrillSummarySection() {
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5 text-xs text-gray-700">
      <p className="text-sm font-semibold text-gray-800">
        오늘 VOCA Drill Flow 요약
      </p>
      <ol className="ml-4 list-decimal space-y-1">
        <li>
          A. Flash – 오늘/지난 단어를 플래시카드처럼 빠르게 한 번 더 훑어봄.
        </li>
        <li>
          B. Reading – 단어가 실제 문맥에서 어떻게 쓰이는지 짧은 패시지로
          확인.
        </li>
        <li>
          C. Drill – Voca · Speaking · Writing 숙제 구조 안내 +
          Speaking 텍스트 답변 DB 저장, 녹음 파일은 Supabase Storage에
          업로드.
        </li>
      </ol>
      <p className="mt-2 text-[11px] text-gray-500">
        다음 단계에서는, Speaking/Writing 제출 내역을 Teacher Dashboard에서
        확인하고, 첨삭/피드백과 연결하는 리포트 뷰를 만들 수 있어요.
      </p>
    </section>
  );
}
