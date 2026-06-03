// lib/naesin/passageDocToNaesinPassage.ts
// PassageAuthoringDocument (DB) → NaesinPassage (드릴 런타임)

import type {
  PassageAuthoringDocument,
  StructureAuthoring,
  TranslationAuthoring,
  CompositionAuthoring,
  SentenceFunctionAuthoring,
} from "@/components/naesin/authoring/passage_authoring_schema_v1";

import type {
  NaesinPassage,
  NaesinParagraph,
  NaesinSentence,
  SentenceStructureAnswer,
  TranslationAnswer,
  SentenceFunctionAnswer,
  CompositionAnswer,
  SentenceOrderItem,
} from "@/components/naesin/drill/types";

function toStructureAnswer(
  s: StructureAuthoring | undefined,
): SentenceStructureAnswer | undefined {
  if (!s) return undefined;
  const hasAny =
    s.subjectAccepted?.length ||
    s.verbAccepted?.length ||
    s.objectAccepted?.length ||
    s.complementAccepted?.length ||
    s.modifiers?.length;
  if (!hasAny) return undefined;

  return {
    subject: s.subjectAccepted?.length ? { accepted: s.subjectAccepted } : undefined,
    verb: s.verbAccepted?.length ? { accepted: s.verbAccepted } : undefined,
    object: s.objectAccepted?.length ? { accepted: s.objectAccepted } : undefined,
    complement: s.complementAccepted?.length ? { accepted: s.complementAccepted } : undefined,
    modifiers: s.modifiers?.map((m) => ({
      span: m.span,
      target: m.target ?? "",
      type: m.type as any,
      subtype: m.subtype as any,
      targetType: m.targetType as any,
    })),
  };
}

function toTranslationAnswer(
  t: TranslationAuthoring | undefined,
): TranslationAnswer | undefined {
  if (!t?.referenceKo) return undefined;
  return {
    referenceKo: t.referenceKo,
    acceptableKeywords: t.acceptableKeywords ?? [],
    notes: t.notes,
    chunks: t.chunks?.map((c) => ({
      id: c.id,
      sourceSpan: c.sourceSpan,
      leadKo: c.hintKo ?? "",
      acceptableAnswers: c.acceptableAnswers,
    })),
  };
}

function toCompositionAnswer(
  c: CompositionAuthoring | undefined,
): CompositionAnswer | undefined {
  if (!c?.referenceSentence) return undefined;
  return {
    promptKo: c.koreanChunks.join(" / "),
    referenceEn: c.referenceSentence,
    chunks: c.koreanChunks.map((text, i) => ({ id: `chunk-${i}`, text })),
    notes: [],
  };
}

function toFunctionAnswer(
  f: SentenceFunctionAuthoring | undefined,
): SentenceFunctionAnswer | undefined {
  if (!f?.correct) return undefined;
  return {
    correct: f.correct,
    accepted: f.accepted,
    explanation: f.explanation,
    clue: f.clue,
  };
}

function toSentenceOrderItems(
  items: PassageAuthoringDocument["workout"]["sentenceOrderItems"],
): SentenceOrderItem[] | undefined {
  if (!items?.length) return undefined;
  return items.map((item) => ({
    id: item.id,
    mode: "unit_order" as const,
    title: item.title,
    instructions: item.instructions,
    anchorBlock: item.fixedLead
      ? { id: item.fixedLead.id, text: item.fixedLead.text }
      : undefined,
    shuffledBlocks: item.reorderUnits.map((u) => ({ id: u.id, text: u.text })),
    correctOrder: item.correctOrder,
    clue: item.explanation?.koreanHint,
    explanation: item.explanation?.summary,
  }));
}

export function passageDocToNaesinPassage(
  doc: PassageAuthoringDocument,
): NaesinPassage {
  const { core, workout } = doc;

  const structureMap = new Map<string, StructureAuthoring>(
    (workout.structureAnalysis ?? []).map((s) => [s.sentenceId, s]),
  );
  const translationMap = new Map<string, TranslationAuthoring>(
    (workout.translation ?? []).map((t) => [t.sentenceId, t]),
  );
  const compositionMap = new Map<string, CompositionAuthoring>(
    (workout.composition ?? []).map((c) => [c.sentenceId, c]),
  );
  const functionMap = new Map<string, SentenceFunctionAuthoring>(
    (workout.sentenceFunctions ?? []).map((f) => [f.sentenceId, f]),
  );

  const sentenceTextMap = new Map(core.sentences.map((s) => [s.id, s.text]));

  const paragraphs: NaesinParagraph[] = core.paragraphs.map((para) => {
    const sentences: NaesinSentence[] = para.sentenceIds.map((sid) => ({
      id: sid,
      text: sentenceTextMap.get(sid) ?? sid,
      structureAnswer: toStructureAnswer(structureMap.get(sid)),
      translationAnswer: toTranslationAnswer(translationMap.get(sid)),
      sentenceFunctionAnswer: toFunctionAnswer(functionMap.get(sid)),
      compositionAnswer: toCompositionAnswer(compositionMap.get(sid)),
    }));

    return {
      id: para.id,
      label: para.label,
      text: para.rawText,
      sentences,
    };
  });

  return {
    id: core.id,
    title: core.title,
    sourceLabel: core.meta?.sourceLabel ?? undefined,
    paragraphs,
    sentenceOrderItems: toSentenceOrderItems(workout.sentenceOrderItems),
  };
}

/** DB row(payload JSON) → NaesinPassage. payload = { core, workout, variants } */
export function payloadToNaesinPassage(payload: unknown): NaesinPassage | null {
  try {
    const p = payload as any;
    const doc: PassageAuthoringDocument = {
      core: p?.core,
      workout: p?.workout ?? { enabledStages: [] },
      variants: p?.variants ?? [],
    };
    if (!doc.core?.id || !Array.isArray(doc.core?.sentences)) return null;
    return passageDocToNaesinPassage(doc);
  } catch {
    return null;
  }
}
