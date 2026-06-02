"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DrillTopBar from "@/components/naesin/drill/DrillTopBar";
import PassagePanel from "@/components/naesin/drill/PassagePanel";
import RightGuidePanel from "@/components/naesin/drill/RightGuidePanel";
import Stage1WordAnalysis from "@/components/naesin/drill/stages/Stage1WordAnalysis";
import Stage2StructureAnalysis from "@/components/naesin/drill/stages/Stage2StructureAnalysis";
import Stage3Translation from "@/components/naesin/drill/stages/Stage3Translation";
import Stage4Composition from "@/components/naesin/drill/stages/Stage4Composition";
import Stage5SentenceFunction from "@/components/naesin/drill/stages/Stage5SentenceFunction";
import Stage6SentenceOrder from "@/components/naesin/drill/stages/Stage6SentenceOrder";
import Stage7GrammarJudgment from "@/components/naesin/drill/stages/Stage7GrammarJudgment";
import Stage8ReadAloudMemory from "@/components/naesin/drill/stages/Stage8ReadAloudMemory";
import { MOCK_LEXICON, MOCK_NAESIN_PASSAGE } from "@/components/naesin/drill/mock";
import {
  DRILL_STAGE_ORDER,
  createEmptyCompositionLog,
  createEmptySentenceFunctionLog,
  createEmptySentenceOrderLog,
  createEmptyStructureLog,
  createEmptyTranslationLog,
  flattenPassageSentences,
  type AutosaveStatus,
  type DrillStage,
  type ModifierHeadLink,
  type NaesinPassage,
  type SentenceCompositionLog,
  type SentenceFunctionAnswer,
  type SentenceFunctionLog,
  type SentenceOrderLog,
  type SentenceStructureLog,
  type SentenceTranslationLog,
  type TranslationAnswer,
  type UnknownWordMark,
} from "@/components/naesin/drill/types";

type Props = {
  initialPassage?: NaesinPassage;
  onComplete?: (result: { passageId: string; stages: string[] }) => void;
  onStageComplete?: (stage: string, passageId: string) => void;
};

type StructurePart =
  | "subject"
  | "verb"
  | "object"
  | "complement"
  | "modifier";

type StructureMistakeItem = {
  id: string;
  sentenceIndex: number;
  part: StructurePart;
  studentAnswer: string;
  message: string;
};

type StructureMistakeMap = Record<number, StructureMistakeItem[]>;

type StructureWeaknessSummaryItem = {
  part: StructurePart;
  label: string;
  count: number;
  sentenceCount: number;
  severity: "low" | "medium" | "high";
  lastMessage: string;
};

type TranslationChecklistKey =
  | "subjectChecked"
  | "verbChecked"
  | "logicChecked"
  | "modifierChecked";

type TranslationChecklistState = Record<TranslationChecklistKey, boolean>;

type TranslationChunkLog = {
  chunkId: string;
  inputSuffix: string;
  attempts: number;
  isCorrect: boolean;
  revealedAnswer: boolean;
};

type Stage3TranslationLog = SentenceTranslationLog & {
  checklist?: TranslationChecklistState;
  chunkLogs?: TranslationChunkLog[];
  completed?: boolean;
};

type TranslationStatusSummary = {
  completedSentences: number;
  failSentences: number;
  revealedChunks: number;
  totalChunks: number;
};

type TranslationCurrentSnapshot = {
  checklistDone: number;
  checklistTotal: number;
  resolvedChunks: number;
  totalChunks: number;
  revealedChunks: number;
  sentenceResolved: boolean;
  statusLabel: string;
  nextAction: string;
};

type CompositionStatusSummary = {
  completedSentences: number;
  revealedSentences: number;
};

type CompositionCurrentSnapshot = {
  arrangementSelected: number;
  arrangementTotal: number;
  arrangementPassed: boolean;
  typingAttempts: number;
  completed: boolean;
  revealedReference: boolean;
  statusLabel: string;
  nextAction: string;
};

const DEFAULT_TRANSLATION_CHECKLIST: TranslationChecklistState = {
  subjectChecked: false,
  verbChecked: false,
  logicChecked: false,
  modifierChecked: false,
};

const PART_LABEL: Record<StructurePart, string> = {
  subject: "주어",
  verb: "동사",
  object: "목적어",
  complement: "보어",
  modifier: "수식어",
};

function normalizeWord(value: string) {
  return value.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").toLowerCase();
}

function getWeaknessSeverity(count: number): "low" | "medium" | "high" {
  if (count >= 5) return "high";
  if (count >= 3) return "medium";
  return "low";
}

export default function NaesinDrillShell({
  initialPassage = MOCK_NAESIN_PASSAGE,
  onComplete,
  onStageComplete,
}: Props) {
  const [currentStage, setCurrentStage] =
    useState<DrillStage>("word_analysis");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [unknownWords, setUnknownWords] = useState<UnknownWordMark[]>([]);
  const [structureLogs, setStructureLogs] = useState<SentenceStructureLog[]>([]);
  const [translationLogs, setTranslationLogs] = useState<Stage3TranslationLog[]>(
    [],
  );
  const [compositionLogs, setCompositionLogs] = useState<SentenceCompositionLog[]>(
    [],
  );
  const [sentenceFunctionLogs, setSentenceFunctionLogs] = useState<SentenceFunctionLog[]>(
    [],
  );
  const [currentSentenceOrderItemIndex, setCurrentSentenceOrderItemIndex] =
    useState(0);
  const [sentenceOrderLogs, setSentenceOrderLogs] = useState<SentenceOrderLog[]>(
    [],
  );
  const [structureMistakes, setStructureMistakes] =
    useState<StructureMistakeMap>({});
  const [autosaveStatus, setAutosaveStatus] =
    useState<AutosaveStatus>("idle");

  const sentences = useMemo(
    () => flattenPassageSentences(initialPassage),
    [initialPassage],
  );
  const sentenceOrderItems = useMemo(
    () => initialPassage.sentenceOrderItems ?? [],
    [initialPassage],
  );

  useEffect(() => {
    let doneTimer: ReturnType<typeof setTimeout> | undefined;

    const savingTimer = setTimeout(() => {
      setAutosaveStatus("saving");

      doneTimer = setTimeout(() => {
        setAutosaveStatus("saved");
      }, 350);
    }, 150);

    return () => {
      clearTimeout(savingTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [
    currentStage,
    currentSentenceIndex,
    unknownWords,
    structureLogs,
    translationLogs,
    compositionLogs,
    sentenceFunctionLogs,
    currentSentenceOrderItemIndex,
    sentenceOrderLogs,
    structureMistakes,
  ]);

  const moveStage = useCallback((direction: "prev" | "next") => {
    setCurrentStage((prev) => {
      const currentIndex = DRILL_STAGE_ORDER.indexOf(prev);
      const nextIndex =
        direction === "prev" ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex < 0) return prev;

      // 스테이지 완료 시 저장
      if (direction === "next") {
        onStageComplete?.(prev, initialPassage.id);
      }

      // 마지막 스테이지 이후 → 전체 완료 콜백
      if (nextIndex >= DRILL_STAGE_ORDER.length) {
        onComplete?.({
          passageId: initialPassage.id,
          stages: DRILL_STAGE_ORDER.slice(0, currentIndex + 1),
        });
        return prev;
      }

      return DRILL_STAGE_ORDER[nextIndex];
    });
  }, [onComplete, onStageComplete, initialPassage.id]);

  const goPrevSentence = useCallback(() => {
    setCurrentSentenceIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNextSentence = useCallback(() => {
    setCurrentSentenceIndex((prev) =>
      Math.min(sentences.length - 1, prev + 1),
    );
  }, [sentences.length]);

  const selectSentence = useCallback((index: number) => {
    setCurrentSentenceIndex(index);
  }, []);

  const goPrevSentenceOrderItem = useCallback(() => {
    setCurrentSentenceOrderItemIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNextSentenceOrderItem = useCallback(() => {
    setCurrentSentenceOrderItemIndex((prev) =>
      Math.min(sentenceOrderItems.length - 1, prev + 1),
    );
  }, [sentenceOrderItems.length]);

  const toggleUnknownWord = useCallback(
    (input: {
      sentenceIndex: number;
      tokenIndex: number;
      rawWord: string;
    }) => {
      const normalizedWord = normalizeWord(input.rawWord);
      if (!normalizedWord) return;

      const id = `${input.sentenceIndex}:${input.tokenIndex}:${normalizedWord}`;

      setUnknownWords((prev) => {
        const exists = prev.some((item) => item.id === id);
        if (exists) {
          return prev.filter((item) => item.id !== id);
        }

        const lexicon = MOCK_LEXICON[normalizedWord];

        return [
          ...prev,
          {
            id,
            word: input.rawWord,
            normalizedWord,
            sentenceIndex: input.sentenceIndex,
            tokenIndex: input.tokenIndex,
            checked: true,
            pos: lexicon?.pos ?? "",
            meaning: lexicon?.meaning ?? "",
          },
        ];
      });
    },
    [],
  );

  const updateUnknownWordMeta = useCallback(
    (
      id: string,
      patch: Partial<Pick<UnknownWordMark, "pos" | "meaning">>,
    ) => {
      setUnknownWords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const removeUnknownWord = useCallback((id: string) => {
    setUnknownWords((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getStructureLog = useCallback(
    (sentenceIndex: number) => {
      return (
        structureLogs.find((log) => log.sentenceIndex === sentenceIndex) ??
        createEmptyStructureLog(sentenceIndex)
      );
    },
    [structureLogs],
  );

  const updateStructureField = useCallback(
    (
      sentenceIndex: number,
      key: Exclude<keyof SentenceStructureLog, "sentenceIndex" | "modifierLinks">,
      value: string,
    ) => {
      setStructureLogs((prev) => {
        const exists = prev.find((log) => log.sentenceIndex === sentenceIndex);
        if (!exists) {
          return [
            ...prev,
            {
              ...createEmptyStructureLog(sentenceIndex),
              [key]: value,
            },
          ];
        }

        return prev.map((log) =>
          log.sentenceIndex === sentenceIndex ? { ...log, [key]: value } : log,
        );
      });
    },
    [],
  );

  const addModifierLink = useCallback((sentenceIndex: number) => {
    setStructureLogs((prev) => {
      const exists = prev.find((log) => log.sentenceIndex === sentenceIndex);
      const newLink: ModifierHeadLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        modifier: "",
        head: "",
      };

      if (!exists) {
        return [
          ...prev,
          {
            ...createEmptyStructureLog(sentenceIndex),
            modifierLinks: [newLink],
          },
        ];
      }

      return prev.map((log) =>
        log.sentenceIndex === sentenceIndex
          ? {
              ...log,
              modifierLinks: [...log.modifierLinks, newLink],
            }
          : log,
      );
    });
  }, []);

  const updateModifierLink = useCallback(
    (
      sentenceIndex: number,
      linkId: string,
      patch: Partial<Pick<ModifierHeadLink, "modifier" | "head">>,
    ) => {
      setStructureLogs((prev) =>
        prev.map((log) =>
          log.sentenceIndex === sentenceIndex
            ? {
                ...log,
                modifierLinks: log.modifierLinks.map((link) =>
                  link.id === linkId ? { ...link, ...patch } : link,
                ),
              }
            : log,
        ),
      );
    },
    [],
  );

  const removeModifierLink = useCallback(
    (sentenceIndex: number, linkId: string) => {
      setStructureLogs((prev) =>
        prev.map((log) =>
          log.sentenceIndex === sentenceIndex
            ? {
                ...log,
                modifierLinks: log.modifierLinks.filter(
                  (link) => link.id !== linkId,
                ),
              }
            : log,
        ),
      );
    },
    [],
  );

  const getTranslationLog = useCallback(
    (sentenceIndex: number) => {
      return (
        translationLogs.find((log) => log.sentenceIndex === sentenceIndex) ??
        ({
          ...createEmptyTranslationLog(sentenceIndex),
        } as Stage3TranslationLog)
      );
    },
    [translationLogs],
  );

  const patchTranslationLog = useCallback(
    (sentenceIndex: number, patch: Partial<Stage3TranslationLog>) => {
      setTranslationLogs((prev) => {
        const exists = prev.find((log) => log.sentenceIndex === sentenceIndex);
        if (!exists) {
          return [
            ...prev,
            {
              ...createEmptyTranslationLog(sentenceIndex),
              ...patch,
            } as Stage3TranslationLog,
          ];
        }

        return prev.map((log) =>
          log.sentenceIndex === sentenceIndex ? { ...log, ...patch } : log,
        );
      });
    },
    [],
  );

  const getCompositionLog = useCallback(
    (sentenceIndex: number) => {
      return (
        compositionLogs.find((log) => log.sentenceIndex === sentenceIndex) ??
        createEmptyCompositionLog(sentenceIndex)
      );
    },
    [compositionLogs],
  );

  const patchCompositionLog = useCallback(
    (sentenceIndex: number, patch: Partial<SentenceCompositionLog>) => {
      setCompositionLogs((prev) => {
        const exists = prev.find((log) => log.sentenceIndex === sentenceIndex);

        if (!exists) {
          return [
            ...prev,
            {
              ...createEmptyCompositionLog(sentenceIndex),
              ...patch,
            },
          ];
        }

        return prev.map((log) =>
          log.sentenceIndex === sentenceIndex ? { ...log, ...patch } : log,
        );
      });
    },
    [],
  );

  const getSentenceFunctionLog = useCallback(
    (sentenceIndex: number) => {
      return (
        sentenceFunctionLogs.find((log) => log.sentenceIndex === sentenceIndex) ??
        createEmptySentenceFunctionLog(sentenceIndex)
      );
    },
    [sentenceFunctionLogs],
  );

  const patchSentenceFunctionLog = useCallback(
    (sentenceIndex: number, patch: Partial<SentenceFunctionLog>) => {
      setSentenceFunctionLogs((prev) => {
        const exists = prev.find((log) => log.sentenceIndex === sentenceIndex);

        if (!exists) {
          return [
            ...prev,
            {
              ...createEmptySentenceFunctionLog(sentenceIndex),
              ...patch,
            },
          ];
        }

        return prev.map((log) =>
          log.sentenceIndex === sentenceIndex ? { ...log, ...patch } : log,
        );
      });
    },
    [],
  );

  const getSentenceOrderLog = useCallback(
    (itemIndex: number) => {
      return (
        sentenceOrderLogs.find((log) => log.itemIndex === itemIndex) ??
        createEmptySentenceOrderLog(itemIndex)
      );
    },
    [sentenceOrderLogs],
  );

  const patchSentenceOrderLog = useCallback(
    (itemIndex: number, patch: Partial<SentenceOrderLog>) => {
      setSentenceOrderLogs((prev) => {
        const exists = prev.find((log) => log.itemIndex === itemIndex);

        if (!exists) {
          return [
            ...prev,
            {
              ...createEmptySentenceOrderLog(itemIndex),
              ...patch,
            },
          ];
        }

        return prev.map((log) =>
          log.itemIndex === itemIndex ? { ...log, ...patch } : log,
        );
      });
    },
    [],
  );

  const recordStructureMistake = useCallback(
    (
      sentenceIndex: number,
      input: Omit<StructureMistakeItem, "sentenceIndex">,
    ) => {
      setStructureMistakes((prev) => {
        const current = prev[sentenceIndex] ?? [];
        const exists = current.some(
          (item) =>
            item.part === input.part &&
            item.studentAnswer === input.studentAnswer &&
            item.message === input.message,
        );

        if (exists) return prev;

        return {
          ...prev,
          [sentenceIndex]: [
            ...current,
            {
              ...input,
              sentenceIndex,
            },
          ],
        };
      });
    },
    [],
  );

  const clearStructureMistakes = useCallback((sentenceIndex: number) => {
    setStructureMistakes((prev) => ({
      ...prev,
      [sentenceIndex]: [],
    }));
  }, []);

  const currentSentence = sentences[currentSentenceIndex];
  const currentStructureLog = getStructureLog(currentSentenceIndex);
  const currentTranslationLog = getTranslationLog(currentSentenceIndex);
  const currentCompositionLog = getCompositionLog(currentSentenceIndex);
  const currentSentenceFunctionLog = getSentenceFunctionLog(currentSentenceIndex);
  const currentSentenceOrderItem =
    sentenceOrderItems[currentSentenceOrderItemIndex] ?? null;
  const currentSentenceOrderLog = getSentenceOrderLog(
    currentSentenceOrderItemIndex,
  );
  const currentStructureMistakes = structureMistakes[currentSentenceIndex] ?? [];
  const currentStructureAnswer = currentSentence?.structureAnswer ?? null;
  const currentTranslationAnswer: TranslationAnswer | null =
    currentSentence?.translationAnswer ?? null;
  const currentSentenceFunctionAnswer: SentenceFunctionAnswer | null =
    currentSentence?.sentenceFunctionAnswer ?? null;
  const currentCompositionAnswer = currentSentence?.compositionAnswer ?? null;

  const handleRecordCurrentStructureMistake = useCallback(
    (input: Omit<StructureMistakeItem, "sentenceIndex">) => {
      recordStructureMistake(currentSentenceIndex, input);
    },
    [currentSentenceIndex, recordStructureMistake],
  );

  const handleClearCurrentStructureMistakes = useCallback(() => {
    clearStructureMistakes(currentSentenceIndex);
  }, [clearStructureMistakes, currentSentenceIndex]);

  const handleUpdateCurrentStructureField = useCallback(
    (
      key: Exclude<keyof SentenceStructureLog, "sentenceIndex" | "modifierLinks">,
      value: string,
    ) => {
      updateStructureField(currentSentenceIndex, key, value);
    },
    [currentSentenceIndex, updateStructureField],
  );

  const handleAddCurrentModifierLink = useCallback(() => {
    addModifierLink(currentSentenceIndex);
  }, [addModifierLink, currentSentenceIndex]);

  const handleUpdateCurrentModifierLink = useCallback(
    (linkId: string, patch: Partial<Pick<ModifierHeadLink, "modifier" | "head">>) => {
      updateModifierLink(currentSentenceIndex, linkId, patch);
    },
    [currentSentenceIndex, updateModifierLink],
  );

  const handleRemoveCurrentModifierLink = useCallback(
    (linkId: string) => {
      removeModifierLink(currentSentenceIndex, linkId);
    },
    [currentSentenceIndex, removeModifierLink],
  );

  const handlePatchCurrentTranslationLog = useCallback(
    (patch: Partial<Stage3TranslationLog>) => {
      patchTranslationLog(currentSentenceIndex, patch);
    },
    [currentSentenceIndex, patchTranslationLog],
  );

  const handlePatchCurrentCompositionLog = useCallback(
    (patch: Partial<SentenceCompositionLog>) => {
      patchCompositionLog(currentSentenceIndex, patch);
    },
    [currentSentenceIndex, patchCompositionLog],
  );

  const handlePatchCurrentSentenceFunctionLog = useCallback(
    (patch: Partial<SentenceFunctionLog>) => {
      patchSentenceFunctionLog(currentSentenceIndex, patch);
    },
    [currentSentenceIndex, patchSentenceFunctionLog],
  );

  const handlePatchCurrentSentenceOrderLog = useCallback(
    (patch: Partial<SentenceOrderLog>) => {
      patchSentenceOrderLog(currentSentenceOrderItemIndex, patch);
    },
    [currentSentenceOrderItemIndex, patchSentenceOrderLog],
  );

  const structureWeaknessSummary = useMemo<StructureWeaknessSummaryItem[]>(() => {
    const bucket = new Map<
      StructurePart,
      {
        count: number;
        sentences: Set<number>;
        lastMessage: string;
      }
    >();

    Object.values(structureMistakes)
      .flat()
      .forEach((item) => {
        const existing = bucket.get(item.part) ?? {
          count: 0,
          sentences: new Set<number>(),
          lastMessage: "",
        };

        existing.count += 1;
        existing.sentences.add(item.sentenceIndex);
        existing.lastMessage = item.message;

        bucket.set(item.part, existing);
      });

    return (Object.keys(PART_LABEL) as StructurePart[])
      .map((part) => {
        const value = bucket.get(part);
        if (!value) return null;

        return {
          part,
          label: PART_LABEL[part],
          count: value.count,
          sentenceCount: value.sentences.size,
          severity: getWeaknessSeverity(value.count),
          lastMessage: value.lastMessage,
        };
      })
      .filter((item): item is StructureWeaknessSummaryItem => item !== null)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.sentenceCount !== a.sentenceCount) {
          return b.sentenceCount - a.sentenceCount;
        }
        return a.label.localeCompare(b.label, "ko");
      });
  }, [structureMistakes]);

  const translationStatusSummary = useMemo<TranslationStatusSummary>(() => {
    let completedSentences = 0;
    let failSentences = 0;
    let revealedChunks = 0;
    let totalChunks = 0;

    translationLogs.forEach((log) => {
      const chunkLogs = log.chunkLogs ?? [];
      const resolvedChunkCount = chunkLogs.filter(
        (item) => item.isCorrect || item.revealedAnswer,
      ).length;
      const revealedChunkCount = chunkLogs.filter(
        (item) => item.revealedAnswer,
      ).length;

      totalChunks += chunkLogs.length;
      revealedChunks += revealedChunkCount;

      if (revealedChunkCount > 0) {
        failSentences += 1;
      }

      const isResolvedSentence =
        chunkLogs.length > 0 && resolvedChunkCount === chunkLogs.length;

      if (log.completed || isResolvedSentence) {
        completedSentences += 1;
      }
    });

    return {
      completedSentences,
      failSentences,
      revealedChunks,
      totalChunks,
    };
  }, [translationLogs]);

  const translationCurrentSnapshot = useMemo<TranslationCurrentSnapshot>(() => {
    const checklist = {
      ...DEFAULT_TRANSLATION_CHECKLIST,
      ...(currentTranslationLog.checklist ?? {}),
    };

    const checklistDone = Object.values(checklist).filter(Boolean).length;
    const checklistTotal = Object.keys(DEFAULT_TRANSLATION_CHECKLIST).length;

    const chunkLogs = currentTranslationLog.chunkLogs ?? [];
    const totalChunks =
      currentTranslationAnswer?.chunks?.length && currentTranslationAnswer.chunks.length > 0
        ? currentTranslationAnswer.chunks.length
        : chunkLogs.length > 0
          ? chunkLogs.length
          : currentTranslationAnswer?.referenceKo
            ? 1
            : 0;

    const resolvedChunks = chunkLogs.filter(
      (item) => item.isCorrect || item.revealedAnswer,
    ).length;

    const revealedChunks = chunkLogs.filter(
      (item) => item.revealedAnswer,
    ).length;

    const sentenceResolved = totalChunks > 0 && resolvedChunks === totalChunks;

    let statusLabel = "체크 필요";
    let nextAction = "체크 4개를 모두 완료하세요.";

    if (checklistDone === checklistTotal && totalChunks === 0) {
      statusLabel = "청크 데이터 없음";
      nextAction = "translation chunk 데이터를 먼저 넣어야 합니다.";
    } else if (checklistDone === checklistTotal && !sentenceResolved) {
      statusLabel = revealedChunks > 0 ? "실패 포함 진행 중" : "청크 진행 중";
      nextAction = "현재 활성 청크를 입력하고 계속 진행하세요.";
    } else if (sentenceResolved) {
      statusLabel = "문장 이동 가능";
      nextAction =
        currentSentenceIndex === sentences.length - 1
          ? "상단 완료 버튼으로 마감하세요."
          : "상단 다음 문장 버튼으로 이동하세요.";
    }

    return {
      checklistDone,
      checklistTotal,
      resolvedChunks,
      totalChunks,
      revealedChunks,
      sentenceResolved,
      statusLabel,
      nextAction,
    };
  }, [
    currentSentenceIndex,
    currentTranslationAnswer,
    currentTranslationLog,
    sentences.length,
  ]);

  const compositionStatusSummary = useMemo<CompositionStatusSummary>(() => {
    let completedSentences = 0;
    let revealedSentences = 0;

    compositionLogs.forEach((log) => {
      if (log.revealedReference) {
        revealedSentences += 1;
      }

      if (log.completed || log.revealedReference) {
        completedSentences += 1;
      }
    });

    return {
      completedSentences,
      revealedSentences,
    };
  }, [compositionLogs]);

  const compositionCurrentSnapshot = useMemo<CompositionCurrentSnapshot>(() => {
    const arrangementTotal =
      currentCompositionAnswer?.chunks?.length && currentCompositionAnswer.chunks.length > 0
        ? currentCompositionAnswer.chunks.length
        : currentTranslationAnswer?.chunks?.filter((chunk) => !!chunk.sourceSpan?.trim())
            .length || 1;

    let statusLabel = "한글 청크 배열 중";
    let nextAction = "한글 생각청크를 영어 어순에 맞게 배열하세요.";

    if (currentCompositionLog.arrangementPassed && !currentCompositionLog.completed) {
      statusLabel = currentCompositionLog.revealedReference
        ? "모범문장 공개"
        : "영어 슬롯 진행 중";

      nextAction = currentCompositionLog.revealedReference
        ? currentSentenceIndex === sentences.length - 1
          ? "모범 문장을 확인하고 완료 버튼으로 마감하세요."
          : "모범 문장을 확인하고 다음 문장으로 이동하세요."
        : "영어 슬롯을 클릭/입력한 뒤 작문 확인 버튼을 누르세요.";
    }

    if (currentCompositionLog.completed) {
      statusLabel = "작문 완료";
      nextAction =
        currentSentenceIndex === sentences.length - 1
          ? "완료 버튼으로 마감하세요."
          : "다음 문장 버튼으로 이동하세요.";
    }

    return {
      arrangementSelected: currentCompositionLog.selectedChunkIds.length,
      arrangementTotal,
      arrangementPassed: currentCompositionLog.arrangementPassed,
      typingAttempts: currentCompositionLog.typingAttempts,
      completed: currentCompositionLog.completed,
      revealedReference: currentCompositionLog.revealedReference,
      statusLabel,
      nextAction,
    };
  }, [
    currentCompositionAnswer,
    currentCompositionLog,
    currentSentenceIndex,
    currentTranslationAnswer,
    sentences.length,
  ]);

  if (currentStage === "grammar_blank") {
    return (
      <div className="space-y-4">
        <DrillTopBar
          title={initialPassage.title}
          currentStage={currentStage}
          autosaveStatus={autosaveStatus}
          onPrevStage={() => moveStage("prev")}
          onNextStage={() => moveStage("next")}
        />

        <Stage7GrammarJudgment passage={initialPassage} />
      </div>
    );
  }

  if (currentStage === "read_aloud") {
    return (
      <div className="space-y-4">
        <DrillTopBar
          title={initialPassage.title}
          currentStage={currentStage}
          autosaveStatus={autosaveStatus}
          onPrevStage={() => moveStage("prev")}
          onNextStage={() => moveStage("next")}
        />

        <Stage8ReadAloudMemory passage={initialPassage} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DrillTopBar
        title={initialPassage.title}
        currentStage={currentStage}
        autosaveStatus={autosaveStatus}
        onPrevStage={() => moveStage("prev")}
        onNextStage={() => moveStage("next")}
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.2fr_0.7fr]">
        <PassagePanel
          passage={initialPassage}
          currentStage={currentStage}
          currentSentenceIndex={currentSentenceIndex}
          unknownWords={unknownWords}
          onSentenceSelect={selectSentence}
          onWordToggle={toggleUnknownWord}
        />

        <div className="min-w-0">
          {currentStage === "word_analysis" ? (
            <Stage1WordAnalysis
              unknownWords={unknownWords}
              onUpdateWordMeta={updateUnknownWordMeta}
              onRemoveWord={removeUnknownWord}
            />
          ) : null}

          {currentStage === "structure_analysis" ? (
            <Stage2StructureAnalysis
              sentenceText={currentSentence?.text ?? ""}
              answer={currentStructureAnswer}
              currentSentenceIndex={currentSentenceIndex}
              totalSentences={sentences.length}
              log={currentStructureLog}
              mistakes={currentStructureMistakes}
              onRecordMistake={handleRecordCurrentStructureMistake}
              onClearMistakes={handleClearCurrentStructureMistakes}
              onPrevSentence={goPrevSentence}
              onNextSentence={goNextSentence}
              onChangeField={handleUpdateCurrentStructureField}
              onAddModifierLink={handleAddCurrentModifierLink}
              onUpdateModifierLink={handleUpdateCurrentModifierLink}
              onRemoveModifierLink={handleRemoveCurrentModifierLink}
            />
          ) : null}

          {currentStage === "translation" ? (
            <Stage3Translation
              sentenceText={currentSentence?.text ?? ""}
              answer={currentTranslationAnswer}
              currentSentenceIndex={currentSentenceIndex}
              totalSentences={sentences.length}
              log={currentTranslationLog}
              onPrevSentence={goPrevSentence}
              onNextSentence={goNextSentence}
              onPatchLog={handlePatchCurrentTranslationLog}
            />
          ) : null}

          {currentStage === "composition" ? (
            <Stage4Composition
              sentenceText={currentSentence?.text ?? ""}
              translationAnswer={currentTranslationAnswer}
              compositionAnswer={currentCompositionAnswer}
              currentSentenceIndex={currentSentenceIndex}
              totalSentences={sentences.length}
              log={currentCompositionLog}
              onPrevSentence={goPrevSentence}
              onNextSentence={goNextSentence}
              onPatchLog={handlePatchCurrentCompositionLog}
            />
          ) : null}

          {currentStage === "sentence_function" ? (
            <Stage5SentenceFunction
              sentenceText={currentSentence?.text ?? ""}
              answer={currentSentenceFunctionAnswer}
              currentSentenceIndex={currentSentenceIndex}
              totalSentences={sentences.length}
              log={currentSentenceFunctionLog}
              onPrevSentence={goPrevSentence}
              onNextSentence={goNextSentence}
              onPatchLog={handlePatchCurrentSentenceFunctionLog}
            />
          ) : null}

          {currentStage === "sentence_order" ? (
            <Stage6SentenceOrder
              item={currentSentenceOrderItem}
              log={currentSentenceOrderLog}
              currentItemIndex={currentSentenceOrderItemIndex}
              totalItems={sentenceOrderItems.length}
              onPrevItem={goPrevSentenceOrderItem}
              onNextItem={goNextSentenceOrderItem}
              onPatchLog={handlePatchCurrentSentenceOrderLog}
            />
          ) : null}

          {![
            "word_analysis",
            "structure_analysis",
            "translation",
            "composition",
            "sentence_function",
            "sentence_order",
          ].includes(currentStage) ? (
            <div className="rounded-2xl border bg-white p-8">
              <div className="text-lg font-semibold text-neutral-900">
                {currentStage}
              </div>
              <div className="mt-2 text-sm text-neutral-500">
                이 단계는 다음 차수에서 붙입니다.
              </div>
            </div>
          ) : null}
        </div>

        <RightGuidePanel
          currentStage={currentStage}
          totalSentences={sentences.length}
          currentSentenceIndex={currentSentenceIndex}
          unknownWords={unknownWords}
          structureLogs={structureLogs}
          translationLogs={translationLogs}
          compositionLogs={compositionLogs}
          currentSentenceMistakes={currentStructureMistakes}
          structureWeaknessSummary={structureWeaknessSummary}
          translationStatusSummary={translationStatusSummary}
          translationCurrentSnapshot={translationCurrentSnapshot}
          compositionStatusSummary={compositionStatusSummary}
          compositionCurrentSnapshot={compositionCurrentSnapshot}
        />
      </div>
    </div>
  );
}
