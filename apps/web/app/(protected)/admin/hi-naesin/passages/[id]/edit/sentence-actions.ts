'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  splitEnglish,
  splitKorean,
  autoMatchSentences,
  extractKeyWords,
  makeBlankSentence,
  detectGrammarHints,
  countWords,
} from '@/lib/hi-naesin/sentence-splitter';
import {
  generateGrammarQuestions,
  generateConnectiveQuestions,
} from '@/lib/hi-naesin/grammar-generator';

type Ok<T extends object = object> = { ok: true } & T;
type Fail = { ok: false; error: string };

function revalidate(id: string) {
  revalidatePath(`/admin/hi-naesin/passages/${id}/edit`);
}

// ── 1단계: 문장 분리 & 자동 매칭 후 저장 ────────────────

export async function generateSentencePairsAction(
  passageId: string,
): Promise<Ok<{ count: number }> | Fail> {
  const supabase = await getServerSupabase();

  const { data: passage, error: pErr } = await supabase
    .from('hi_naesin_passages')
    .select('passage_text, translation_ko')
    .eq('id', passageId)
    .single();

  if (pErr || !passage) return { ok: false, error: '지문을 찾을 수 없습니다.' };

  const enSentences = splitEnglish(passage.passage_text);
  const koSentences = passage.translation_ko
    ? splitKorean(passage.translation_ko)
    : [];

  const pairs = autoMatchSentences(enSentences, koSentences);
  if (pairs.length === 0) return { ok: false, error: '문장을 분리할 수 없습니다.' };

  // 기존 문장 쌍 삭제 후 재생성
  await supabase
    .from('hi_naesin_passage_sentences')
    .delete()
    .eq('passage_id', passageId);

  const rows = pairs.map((p, i) => ({
    passage_id:  passageId,
    order_index: i,
    sentence_en: p.sentenceEn,
    sentence_ko: p.sentenceKo || null,
  }));

  const { error } = await supabase
    .from('hi_naesin_passage_sentences')
    .insert(rows);

  if (error) return { ok: false, error: error.message };

  revalidate(passageId);
  return { ok: true, count: rows.length };
}

// ── 2단계: 문장 쌍 수정 ─────────────────────────────────

export async function updateSentencePairAction(
  passageId: string,
  sentenceId: string,
  fd: FormData,
): Promise<Ok | Fail> {
  const supabase = await getServerSupabase();

  const sentenceEn = (fd.get('sentence_en') as string)?.trim();
  const sentenceKo = (fd.get('sentence_ko') as string)?.trim() || null;

  const { error } = await supabase
    .from('hi_naesin_passage_sentences')
    .update({ sentence_en: sentenceEn, sentence_ko: sentenceKo })
    .eq('id', sentenceId);

  if (error) return { ok: false, error: error.message };
  revalidate(passageId);
  return { ok: true };
}

// ── 3단계: 확인된 문장 쌍으로 Drill 자동 생성 ───────────

export async function generateDrillsFromSentencesAction(
  passageId: string,
): Promise<Ok<{ translationCount: number; writingCount: number; fillBlankCount: number; grammarChoiceCount: number }> | Fail> {
  const supabase = await getServerSupabase();

  const { data: sentences, error: sErr } = await supabase
    .from('hi_naesin_passage_sentences')
    .select('*')
    .eq('passage_id', passageId)
    .order('order_index');

  if (sErr) return { ok: false, error: sErr.message };
  if (!sentences || sentences.length === 0) {
    return { ok: false, error: '먼저 문장 분리를 실행해주세요.' };
  }

  // 기존 자동생성 드릴 삭제
  await supabase
    .from('hi_naesin_drills')
    .delete()
    .eq('passage_id', passageId)
    .in('drill_type', ['translation', 'writing', 'fill_blank', 'grammar_choice']);

  const translationDrills: object[] = [];
  const writingDrills:     object[] = [];
  const fillBlankDrills:   object[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const { sentence_en, sentence_ko } = sentences[i];
    if (!sentence_en) continue;

    // 해석 드릴
    translationDrills.push({
      passage_id:   passageId,
      drill_type:   'translation',
      order_index:  i,
      payload:      { sentenceEn: sentence_en, answerKo: sentence_ko ?? '' },
      is_published: false,
    });

    // 작문 드릴 (한→영, 해석이 있을 때만)
    if (sentence_ko) {
      const grammarHints = detectGrammarHints(sentence_en);
      const hintWords    = extractKeyWords(sentence_en, 3);
      writingDrills.push({
        passage_id:   passageId,
        drill_type:   'writing',
        order_index:  i,
        payload: {
          koPrompt:      sentence_ko,
          answerEn:      sentence_en,
          acceptableAnswers: [],
          wordCount:     countWords(sentence_en),
          hintWords,
          grammarHints,
        },
        is_published: false,
      });
    }

    // 빈칸 넣기 (문장당 최대 2개, 핵심 단어 기반)
    const keywords = extractKeyWords(sentence_en, 2);
    for (const keyword of keywords) {
      const template = makeBlankSentence(sentence_en, keyword);
      if (template) {
        fillBlankDrills.push({
          passage_id:   passageId,
          drill_type:   'fill_blank',
          order_index:  i,
          payload: {
            sentenceTemplate: template,
            answer:     keyword,
            distractors: [],
            sentenceKo: sentence_ko ?? '',
          },
          is_published: false,
        });
      }
    }
  }

  // 기본 드릴 먼저 저장
  const baseInserts = [
    supabase.from('hi_naesin_drills').insert(translationDrills),
    supabase.from('hi_naesin_drills').insert(writingDrills),
    supabase.from('hi_naesin_drills').insert(fillBlankDrills),
  ].filter((_, i) =>
    [translationDrills, writingDrills, fillBlankDrills][i].length > 0,
  );

  const baseResults = await Promise.all(baseInserts);
  const firstError = baseResults.find((r) => r.error);
  if (firstError?.error) return { ok: false, error: firstError.error.message };

  // ── AI 문법 드릴 생성 (grammar_choice) ──────────────────
  const sentenceInputs = sentences
    .filter((s) => s.sentence_en)
    .map((s) => ({ sentenceEn: s.sentence_en, sentenceKo: s.sentence_ko ?? '' }));

  const [grammarResults, connectiveResults] = await Promise.all([
    generateGrammarQuestions(sentenceInputs),
    generateConnectiveQuestions(sentenceInputs),
  ]);

  const grammarChoiceDrills: object[] = [
    ...grammarResults.map(({ orderIndex, question }) => ({
      passage_id:   passageId,
      drill_type:   'grammar_choice',
      order_index:  orderIndex,
      payload:      question,
      is_published: false,
    })),
    ...connectiveResults.map(({ orderIndex, question }) => ({
      passage_id:   passageId,
      drill_type:   'grammar_choice',
      order_index:  orderIndex,
      payload:      question,
      is_published: false,
    })),
  ];

  if (grammarChoiceDrills.length > 0) {
    const { error: gErr } = await supabase
      .from('hi_naesin_drills')
      .insert(grammarChoiceDrills);
    if (gErr) console.error('[generateDrillsFromSentencesAction] grammar_choice insert error:', gErr.message);
  }

  // 지문 배열 변형문제 자동 생성
  await generateTextOrderingVariant(supabase, passageId, sentences);

  revalidate(passageId);
  return {
    ok: true,
    translationCount:  translationDrills.length,
    writingCount:      writingDrills.length,
    fillBlankCount:    fillBlankDrills.length,
    grammarChoiceCount: grammarChoiceDrills.length,
  };
}

// 지문 배열 변형문제 자동 생성 (4등분)
async function generateTextOrderingVariant(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').getServerSupabase>>,
  passageId: string,
  sentences: Array<{ sentence_en: string }>,
) {
  const total = sentences.length;
  if (total < 4) return;

  const chunkSize = Math.floor(total / 4);
  const getText = (start: number, end: number) =>
    sentences
      .slice(start, end)
      .map((s) => s.sentence_en)
      .join(' ');

  const seg0 = getText(0, chunkSize);                    // 주어지는 첫 단락
  const segA = getText(chunkSize, chunkSize * 2);
  const segB = getText(chunkSize * 2, chunkSize * 3);
  const segC = getText(chunkSize * 3, total);

  const payload = {
    fixedSegment: { text: seg0 },
    segments: [
      { id: 'A', text: segA },
      { id: 'B', text: segB },
      { id: 'C', text: segC },
    ],
    correctOrder: ['A', 'B', 'C'],
  };

  // 기존 text_ordering 삭제 후 재생성
  await supabase
    .from('hi_naesin_variant_questions')
    .delete()
    .eq('passage_id', passageId)
    .eq('question_type', 'text_ordering');

  await supabase.from('hi_naesin_variant_questions').insert({
    passage_id:    passageId,
    question_type: 'text_ordering',
    order_index:   0,
    payload,
    is_published:  false,
  });
}
