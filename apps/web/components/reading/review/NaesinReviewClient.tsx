"use client";

import { useMemo, useState } from "react";

export type NaesinReviewQuestion = {
  id: string;
  passageId: string;
  numberLabel: string;
  type: string;
  stem: string;
  isCorrect: boolean;
  selectedChoiceTexts: string[];
  correctChoiceTexts: string[];
  explanation?: string;
  officialEvidence: string[];
};

export type NaesinReviewPassage = {
  id: string;
  title: string;
  text: string;
  questions: NaesinReviewQuestion[];
};

export type NaesinReviewData = {
  sessionId: string;
  setId: string;
  setTitle: string;
  scoreRaw?: number | null;
  scorePercent?: number | null;
  submittedAt?: string | null;
  analyticsSnapshot?: Record<string, unknown> | null;
  passages: NaesinReviewPassage[];
};

type Props = {
  data: NaesinReviewData;
};

type TabKey = "summary" | "evidence" | "words" | "analysis" | "vocab";

type SentenceAnalysisState = {
  translation?: string;
  subject?: string;
  verb?: string;
  object?: string;
  complement?: string;
  modifier?: string;
};

export default function NaesinReviewClient({ data }: Props) {
  const [tab, setTab] = useState<TabKey>("summary");

  const allQuestions = useMemo(
    () =>
      data.passages.flatMap((passage) =>
        passage.questions.map((question) => ({
          ...question,
          passageTitle: passage.title,
          passageText: passage.text,
        })),
      ),
    [data.passages],
  );

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    allQuestions[0]?.id ?? "",
  );

  const activeQuestion =
    allQuestions.find((question) => question.id === activeQuestionId) ??
    allQuestions[0];

  const activePassage =
    data.passages.find((passage) => passage.id === activeQuestion?.passageId) ??
    data.passages[0];

  const [unknownWordsByPassage, setUnknownWordsByPassage] = useState<
    Record<string, string[]>
  >({});

  const [pickedEvidenceByQuestion, setPickedEvidenceByQuestion] = useState<
    Record<string, string[]>
  >({});

  const [analysisByQuestion, setAnalysisByQuestion] = useState<
    Record<string, SentenceAnalysisState>
  >({});

  const activePassageSentences = useMemo(
    () => splitIntoSentences(activePassage?.text ?? ""),
    [activePassage?.text],
  );

  const activePassageWords = useMemo(
    () => extractUniqueWords(activePassage?.text ?? ""),
    [activePassage?.text],
  );

  const pickedEvidence = pickedEvidenceByQuestion[activeQuestion?.id ?? ""] ?? [];
  const unknownWords = unknownWordsByPassage[activePassage?.id ?? ""] ?? [];

  const vocabItems = useMemo(() => {
    return data.passages.flatMap((passage) => {
      const selectedWords = unknownWordsByPassage[passage.id] ?? [];
      return selectedWords.map((word) => {
        const sentence = findSentenceForWord(passage.text, word);
        return {
          passageId: passage.id,
          word,
          sentence,
          cloze: sentence
            ? sentence.replace(
              new RegExp(`\\b${escapeRegExp(word)}\\b`, "i"),
              "_____",
            )
            : `_____`,
        };
      });
    });
  }, [data.passages, unknownWordsByPassage]);

  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabInput, setVocabInput] = useState("");
  const [vocabResult, setVocabResult] = useState<"idle" | "correct" | "wrong">(
    "idle",
  );

  const activeVocab = vocabItems[vocabIndex];

  function toggleUnknownWord(word: string) {
    if (!activePassage) return;

    setUnknownWordsByPassage((prev) => {
      const current = prev[activePassage.id] ?? [];
      const exists = current.includes(word);
      return {
        ...prev,
        [activePassage.id]: exists
          ? current.filter((item) => item !== word)
          : [...current, word],
      };
    });
  }

  function toggleEvidence(sentence: string) {
    if (!activeQuestion) return;

    setPickedEvidenceByQuestion((prev) => {
      const current = prev[activeQuestion.id] ?? [];
      const exists = current.includes(sentence);
      return {
        ...prev,
        [activeQuestion.id]: exists
          ? current.filter((item) => item !== sentence)
          : [...current, sentence],
      };
    });
  }

  function updateAnalysisField(
    field: keyof SentenceAnalysisState,
    value: string,
  ) {
    if (!activeQuestion) return;

    setAnalysisByQuestion((prev) => ({
      ...prev,
      [activeQuestion.id]: {
        ...(prev[activeQuestion.id] ?? {}),
        [field]: value,
      },
    }));
  }

  function checkVocab() {
    if (!activeVocab) return;
    const ok =
      normalizeWord(vocabInput) === normalizeWord(activeVocab.word);
    setVocabResult(ok ? "correct" : "wrong");
  }

  function goNextVocab() {
    setVocabIndex((prev) => Math.min(prev + 1, Math.max(0, vocabItems.length - 1)));
    setVocabInput("");
    setVocabResult("idle");
  }

  function goPrevVocab() {
    setVocabIndex((prev) => Math.max(prev - 1, 0));
    setVocabInput("");
    setVocabResult("idle");
  }

  const activeAnalysis = analysisByQuestion[activeQuestion?.id ?? ""] ?? {};
  const officialEvidence = activeQuestion?.officialEvidence ?? [];
  const evidenceMatched =
    officialEvidence.length > 0 &&
    pickedEvidence.some((picked) =>
      officialEvidence.some((official) => normalizeSentence(official) === normalizeSentence(picked)),
    );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Lingo-X Naesin Review
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {data.setTitle}
            </h1>
            <div className="mt-1 text-sm text-neutral-500">
              sessionId: {data.sessionId}
            </div>
          </div>

          <div className="grid min-w-[260px] grid-cols-3 gap-3">
            <SummaryCard
              label="Score"
              value={
                typeof data.scorePercent === "number"
                  ? `${data.scorePercent}%`
                  : "-"
              }
            />
            <SummaryCard
              label="Raw"
              value={
                typeof data.scoreRaw === "number" ? String(data.scoreRaw) : "-"
              }
            />
            <SummaryCard
              label="Submitted"
              value={fmtDate(data.submittedAt)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton tab={tab} value="summary" onClick={setTab}>
          Summary
        </TabButton>
        <TabButton tab={tab} value="evidence" onClick={setTab}>
          Evidence
        </TabButton>
        <TabButton tab={tab} value="words" onClick={setTab}>
          Unknown Words
        </TabButton>
        <TabButton tab={tab} value="analysis" onClick={setTab}>
          Sentence Analysis
        </TabButton>
        <TabButton tab={tab} value="vocab" onClick={setTab}>
          Vocab Test
        </TabButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-neutral-900">
            Questions
          </div>
          <div className="space-y-2">
            {allQuestions.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setActiveQuestionId(question.id)}
                className={[
                  "w-full rounded-xl border px-3 py-3 text-left text-sm",
                  activeQuestion?.id === question.id
                    ? "border-black bg-black text-white"
                    : "hover:bg-neutral-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {question.numberLabel}. {question.type}
                  </span>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      question.isCorrect
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-red-500/15 text-red-700",
                    ].join(" ")}
                  >
                    {question.isCorrect ? "Correct" : "Wrong"}
                  </span>
                </div>
                <div className="mt-1 line-clamp-2 text-xs opacity-80">
                  {question.stem}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          {tab === "summary" && (
            <div className="space-y-4">
              <Panel title="Overall">
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="Set" value={data.setTitle} />
                  <InfoRow label="Session" value={data.sessionId} />
                  <InfoRow
                    label="Score"
                    value={
                      typeof data.scorePercent === "number"
                        ? `${data.scorePercent}%`
                        : "-"
                    }
                  />
                  <InfoRow
                    label="Raw"
                    value={
                      typeof data.scoreRaw === "number"
                        ? String(data.scoreRaw)
                        : "-"
                    }
                  />
                </div>
              </Panel>

              <Panel title="Weak Spots">
                <div className="space-y-2 text-sm">
                  <div>
                    Wrong questions:{" "}
                    <b>{allQuestions.filter((q) => !q.isCorrect).length}</b>
                  </div>
                  <div>
                    Unknown words selected: <b>{countSelectedWords(unknownWordsByPassage)}</b>
                  </div>
                  <div>
                    Evidence matched:{" "}
                    <b>
                      {
                        Object.values(pickedEvidenceByQuestion).filter(
                          (pickedList, idx) => {
                            const q = allQuestions[idx];
                            if (!q) return false;
                            return pickedList.some((picked) =>
                              q.officialEvidence.some(
                                (official) =>
                                  normalizeSentence(official) ===
                                  normalizeSentence(picked),
                              ),
                            );
                          },
                        ).length
                      }
                    </b>
                  </div>
                </div>
              </Panel>

              <Panel title="Question Snapshot">
                {activeQuestion ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-neutral-500">
                        Question
                      </div>
                      <div className="mt-1">{activeQuestion.stem}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-500">
                        Your Answer
                      </div>
                      <div className="mt-1">
                        {activeQuestion.selectedChoiceTexts.join(", ") || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-500">
                        Correct Answer
                      </div>
                      <div className="mt-1">
                        {activeQuestion.correctChoiceTexts.join(", ") || "-"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">
                    No question loaded.
                  </div>
                )}
              </Panel>
            </div>
          )}

          {tab === "evidence" && activeQuestion && activePassage && (
            <div className="space-y-4">
              <Panel title="Question / Official Evidence">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">
                      Question
                    </div>
                    <div className="mt-1">{activeQuestion.stem}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-neutral-500">
                      Official Evidence
                    </div>
                    <div className="mt-2 space-y-2">
                      {officialEvidence.length > 0 ? (
                        officialEvidence.map((sentence, index) => (
                          <div
                            key={`${sentence}_${index}`}
                            className="rounded-lg border bg-emerald-50 px-3 py-2"
                          >
                            {sentence}
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-500">
                          No official evidence stored yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Pick the Evidence"
                right={
                  <div
                    className={[
                      "rounded-full px-2 py-1 text-xs",
                      evidenceMatched
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-amber-500/15 text-amber-700",
                    ].join(" ")}
                  >
                    {evidenceMatched ? "Matched" : "Not matched yet"}
                  </div>
                }
              >
                <div className="space-y-2">
                  {activePassageSentences.map((sentence, index) => {
                    const selected = pickedEvidence.includes(sentence);
                    const official = officialEvidence.some(
                      (item) =>
                        normalizeSentence(item) === normalizeSentence(sentence),
                    );

                    return (
                      <button
                        key={`${index}_${sentence.slice(0, 18)}`}
                        type="button"
                        onClick={() => toggleEvidence(sentence)}
                        className={[
                          "block w-full rounded-xl border px-3 py-3 text-left text-sm",
                          selected ? "border-black bg-black text-white" : "",
                          official && !selected
                            ? "border-emerald-300 bg-emerald-50"
                            : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{sentence}</span>
                          {official ? (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700">
                              official
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>
          )}

          {tab === "words" && activePassage && (
            <div className="space-y-4">
              <Panel title="Highlight Unknown Words">
                <div className="mb-3 text-sm text-neutral-600">
                  Passage: <b>{activePassage.title || "Untitled Passage"}</b>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {unknownWords.length > 0 ? (
                    unknownWords.map((word) => (
                      <span
                        key={word}
                        className="rounded-full border bg-amber-50 px-3 py-1 text-sm"
                      >
                        {word}
                      </span>
                    ))
                  ) : (
                    <div className="text-sm text-neutral-500">
                      No unknown words selected yet.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {activePassageWords.map((word) => {
                    const selected = unknownWords.includes(word);
                    return (
                      <button
                        key={word}
                        type="button"
                        onClick={() => toggleUnknownWord(word)}
                        className={[
                          "rounded-full border px-3 py-1 text-sm",
                          selected
                            ? "border-amber-400 bg-amber-400/20"
                            : "hover:bg-neutral-50",
                        ].join(" ")}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>
          )}

          {tab === "analysis" && activeQuestion && activePassage && (
            <div className="space-y-4">
              <Panel title="Evidence / Difficult Sentence">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">
                      Target Sentence
                    </div>
                    <div className="mt-1 rounded-lg border bg-neutral-50 px-3 py-2">
                      {officialEvidence[0] ??
                        pickDifficultSentence(activePassage.text) ??
                        "No target sentence found."}
                    </div>
                  </div>

                  {activeQuestion.explanation ? (
                    <div>
                      <div className="text-xs font-semibold text-neutral-500">
                        Explanation
                      </div>
                      <div className="mt-1 rounded-lg border bg-neutral-50 px-3 py-2">
                        {activeQuestion.explanation}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Panel>

              <Panel title="Translation / S-V-O-C Analysis">
                <div className="grid gap-4">
                  <FieldBlock
                    label="Translation"
                    value={activeAnalysis.translation ?? ""}
                    onChange={(value) => updateAnalysisField("translation", value)}
                    textarea
                  />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FieldBlock
                      label="S"
                      value={activeAnalysis.subject ?? ""}
                      onChange={(value) => updateAnalysisField("subject", value)}
                    />
                    <FieldBlock
                      label="V"
                      value={activeAnalysis.verb ?? ""}
                      onChange={(value) => updateAnalysisField("verb", value)}
                    />
                    <FieldBlock
                      label="O"
                      value={activeAnalysis.object ?? ""}
                      onChange={(value) => updateAnalysisField("object", value)}
                    />
                    <FieldBlock
                      label="C"
                      value={activeAnalysis.complement ?? ""}
                      onChange={(value) =>
                        updateAnalysisField("complement", value)
                      }
                    />
                    <FieldBlock
                      label="M / Modifier"
                      value={activeAnalysis.modifier ?? ""}
                      onChange={(value) => updateAnalysisField("modifier", value)}
                    />
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {tab === "vocab" && (
            <div className="space-y-4">
              <Panel title="Vocab Testing">
                {activeVocab ? (
                  <div className="space-y-4">
                    <div className="text-sm text-neutral-600">
                      {vocabIndex + 1} / {vocabItems.length}
                    </div>

                    <div className="rounded-xl border bg-neutral-50 px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Fill the blank
                      </div>
                      <div className="mt-2 text-lg font-medium text-neutral-900">
                        {activeVocab.cloze}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={vocabInput}
                        onChange={(e) => setVocabInput(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 outline-none"
                        placeholder="Type the missing word"
                      />
                      <button
                        type="button"
                        onClick={checkVocab}
                        className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
                      >
                        Check
                      </button>
                    </div>

                    {vocabResult !== "idle" && (
                      <div
                        className={[
                          "rounded-lg px-3 py-2 text-sm",
                          vocabResult === "correct"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-red-200 bg-red-50 text-red-700",
                        ].join(" ")}
                      >
                        {vocabResult === "correct"
                          ? "Correct"
                          : `Wrong. Answer: ${activeVocab.word}`}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={goPrevVocab}
                        disabled={vocabIndex <= 0}
                        className="rounded-xl border px-4 py-2 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={goNextVocab}
                        disabled={vocabIndex >= vocabItems.length - 1}
                        className="rounded-xl border px-4 py-2 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">
                    먼저 Unknown Words 탭에서 모르는 단어를 선택해.
                  </div>
                )}
              </Panel>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-neutral-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-neutral-50 px-3 py-2 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-neutral-900">{value}</div>
    </div>
  );
}

function TabButton({
  tab,
  value,
  onClick,
  children,
}: {
  tab: TabKey;
  value: TabKey;
  onClick: (value: TabKey) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "rounded-full border px-4 py-2 text-sm",
        tab === value ? "border-black bg-black text-white" : "hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function FieldBlock({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[110px] w-full rounded-xl border px-3 py-2 outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 outline-none"
        />
      )}
    </div>
  );
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractUniqueWords(text: string): string[] {
  const matches = text.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const map = new Map<string, string>();

  for (const word of matches) {
    const normalized = normalizeWord(word);
    if (!map.has(normalized)) {
      map.set(normalized, word);
    }
  }

  return [...map.values()];
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function normalizeSentence(sentence: string): string {
  return sentence.replace(/\s+/g, " ").trim().toLowerCase();
}

function countSelectedWords(map: Record<string, string[]>) {
  return Object.values(map).reduce((sum, list) => sum + list.length, 0);
}

function findSentenceForWord(text: string, word: string): string | undefined {
  const sentences = splitIntoSentences(text);
  return sentences.find((sentence) =>
    new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(sentence),
  );
}

function pickDifficultSentence(text: string): string | undefined {
  const sentences = splitIntoSentences(text);
  return (
    sentences.find((sentence) => sentence.length >= 90) ??
    sentences.find((sentence) => /,|;|:/.test(sentence)) ??
    sentences[0]
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function fmtDate(value?: string | null): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
