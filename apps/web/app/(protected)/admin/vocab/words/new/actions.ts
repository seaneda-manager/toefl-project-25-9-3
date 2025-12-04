// apps/web/app/(protected)/admin/vocab/words/new/actions.ts
"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import type { WordCreatePayload } from "@/models/vocab";

/**
 * Admin – 새 단어 생성 액션
 * words + word_grade_bands + word_sources + word_grammar_hints + word_semantic_tags
 */
export async function createWordAction(payload: WordCreatePayload) {
  const supabase = await getServerSupabase();

  // 1) words 테이블에 기본 정보 저장
  const { data: word, error: insertWordError } = await supabase
    .from("words")
    .insert({
      text: payload.text,
      lemma: payload.lemma || payload.text,
      pos: payload.pos,
      is_function_word: payload.is_function_word,
      meanings_ko: payload.meanings_ko,
      meanings_en_simple: payload.meanings_en_simple,
      examples_easy: payload.examples_easy,
      examples_normal: payload.examples_normal,
      derived_terms: payload.derived_terms,
      difficulty: payload.difficulty,
      frequency_score: payload.frequency_score,
      notes: payload.notes,
    })
    .select()
    .single();

  if (insertWordError || !word) {
    console.error(insertWordError);
    throw new Error("단어 저장 중 오류 발생 (words)");
  }

  const wordId: string = word.id as string;

  // 2) 학년대 (gradeBands → word_grade_bands)
  if (payload.gradeBands.length > 0) {
    const gradeItems = payload.gradeBands.map((band) => ({
      word_id: wordId,
      grade: band,
    }));

    const { error } = await supabase
      .from("word_grade_bands")
      .insert(gradeItems);

    if (error) {
      console.error(error);
      throw new Error("학년대 저장 중 오류 발생 (word_grade_bands)");
    }
  }

  // 3) 출처 (sources → word_sources)
  if (payload.sources.length > 0) {
    const sourceItems = payload.sources.map((s) => ({
      word_id: wordId,
      source_type: s.sourceType,
      source_label: s.sourceLabel,
      exam_year: s.examYear,
      exam_month: s.examMonth,
      exam_round: s.examRound,
      grade: s.grade,
    }));

    const { error } = await supabase
      .from("word_sources")
      .insert(sourceItems);

    if (error) {
      console.error(error);
      throw new Error("출처 저장 중 오류 발생 (word_sources)");
    }
  }

  // 4) 문법 힌트 (grammarHints → word_grammar_hints)
  if (payload.grammarHints.length > 0) {
    const grammarItems = payload.grammarHints.map((g) => ({
      word_id: wordId,
      grammar_category: g.grammarCategory,
      short_tip_ko: g.shortTipKo,
      short_tip_en: g.shortTipEn,
      wrong_example: g.wrongExample,
      right_example: g.rightExample,
      show_until_grade: g.showUntilGrade,
      sort_order: g.sortOrder ?? 0,
    }));

    const { error } = await supabase
      .from("word_grammar_hints")
      .insert(grammarItems);

    if (error) {
      console.error(error);
      throw new Error("문법 힌트 저장 중 오류 발생 (word_grammar_hints)");
    }
  }

  // 5) semantic 태그 (semanticTagIds → word_semantic_tags)
  if (payload.semanticTagIds.length > 0) {
    const tagItems = payload.semanticTagIds.map((tagId) => ({
      word_id: wordId,
      tag_id: tagId,
    }));

    const { error } = await supabase
      .from("word_semantic_tags")
      .insert(tagItems);

    if (error) {
      console.error(error);
      throw new Error("semantic 태그 저장 중 오류 발생 (word_semantic_tags)");
    }
  }

  return { success: true, id: wordId };
}
