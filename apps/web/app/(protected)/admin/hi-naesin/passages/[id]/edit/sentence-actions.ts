'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  splitEnglish,
  splitKorean,
  autoMatchSentences,
  extractKeyWords,
  makeBlankSentence,
  detectGrammarHints,
  countWords,
  parseVocabAnnotations,
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

// ── 2단계: 확인된 문장 쌍으로 기본 Drill 자동 생성 (번역/작문/빈칸/단어) ──

export async function generateDrillsFromSentencesAction(
  passageId: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const adminDb  = getServiceSupabase(); // RLS 우회 — admin 쓰기 전용

  const { data: sentences, error: sErr } = await supabase
    .from('hi_naesin_passage_sentences')
    .select('*')
    .eq('passage_id', passageId)
    .order('order_index');

  if (sErr || !sentences || sentences.length === 0) {
    redirect(`/admin/hi-naesin/passages/${passageId}/edit?tab=sentences&err=no_sentences`);
  }

  // 기존 자동생성 드릴 삭제 (service role: RLS DELETE 정책 무관하게 삭제)
  await adminDb
    .from('hi_naesin_drills')
    .delete()
    .eq('passage_id', passageId)
    .in('drill_type', ['translation', 'writing', 'fill_blank', 'grammar_choice', 'vocab']);

  const translationDrills: object[] = [];
  const writingDrills:     object[] = [];
  const fillBlankDrills:   object[] = [];

  // fill_blank은 문장당 최대 2개 → sentence index 재사용 시 unique(passage_id, drill_type, order_index) 위반
  // 전역 카운터로 고유한 order_index 보장
  let fillBlankIdx = 0;

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
    // order_index를 전역 카운터(fillBlankIdx)로 부여 → unique constraint 위반 방지
    const keywords = extractKeyWords(sentence_en, 2);
    for (const keyword of keywords) {
      const template = makeBlankSentence(sentence_en, keyword);
      if (template) {
        fillBlankDrills.push({
          passage_id:   passageId,
          drill_type:   'fill_blank',
          order_index:  fillBlankIdx++,
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

  // ── 어휘 드릴 생성 ──────────────────────────────────────
  const { data: passageFull } = await adminDb
    .from('hi_naesin_passages')
    .select('passage_text')
    .eq('id', passageId)
    .single();

  const vocabDrills: object[] = [];
  if (passageFull?.passage_text) {
    const vocabItems = parseVocabAnnotations(passageFull.passage_text);
    for (let i = 0; i < vocabItems.length; i++) {
      const { word, meaningKo } = vocabItems[i];
      // 지문에서 예문 찾기
      const exSentence = sentences.find((s) =>
        new RegExp(`\\b${word.split(' ')[0]}\\b`, 'i').test(s.sentence_en)
      );
      vocabDrills.push({
        passage_id:   passageId,
        drill_type:   'vocab',
        order_index:  i,
        payload: {
          word,
          meaningKo,
          exampleSentence: exSentence?.sentence_en ?? null,
        },
        is_published: false,
      });
    }
  }

  // 기본 드릴 저장 (비어있는 배열은 insert 제외)
  const toInsert: Array<{ label: string; rows: object[] }> = [
    { label: 'translation', rows: translationDrills },
    { label: 'writing',     rows: writingDrills     },
    { label: 'fill_blank',  rows: fillBlankDrills   },
    { label: 'vocab',       rows: vocabDrills        },
  ].filter((x) => x.rows.length > 0);

  const baseResults = await Promise.all(
    toInsert.map((x) => adminDb.from('hi_naesin_drills').insert(x.rows)),
  );

  for (let bi = 0; bi < baseResults.length; bi++) {
    if (baseResults[bi].error) {
      const errMsg = encodeURIComponent(baseResults[bi].error?.message ?? 'unknown');
      redirect(`/admin/hi-naesin/passages/${passageId}/edit?tab=sentences&err=${toInsert[bi].label}:${errMsg}`);
    }
  }

  // 지문 배열 변형문제 자동 생성
  await generateTextOrderingVariant(adminDb, passageId, sentences);

  // 결과를 URL 파라미터로 전달해 배너 표시
  const t = translationDrills.length;
  const w = writingDrills.length;
  const fb = fillBlankDrills.length;
  const v = vocabDrills.length;

  redirect(
    `/admin/hi-naesin/passages/${passageId}/edit?tab=drill&ok=2step&t=${t}&w=${w}&fb=${fb}&v=${v}`,
  );
}

// ── 3단계: AI 문법/연결어 Drill 생성 ──────────────────────

export async function generateGrammarDrillsAction(
  passageId: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const adminDb  = getServiceSupabase(); // RLS 우회 — admin 쓰기 전용

  const { data: sentences, error: sErr } = await supabase
    .from('hi_naesin_passage_sentences')
    .select('sentence_en, sentence_ko')
    .eq('passage_id', passageId)
    .order('order_index');

  if (sErr || !sentences || sentences.length === 0) {
    redirect(`/admin/hi-naesin/passages/${passageId}/edit?tab=sentences&err=no_sentences`);
  }

  // 기존 grammar_choice 삭제 (service role: RLS 우회)
  await adminDb
    .from('hi_naesin_drills')
    .delete()
    .eq('passage_id', passageId)
    .eq('drill_type', 'grammar_choice');

  const sentenceInputs = sentences
    .filter((s) => s.sentence_en)
    .map((s) => ({ sentenceEn: s.sentence_en, sentenceKo: s.sentence_ko ?? '' }));

  const [gResult, cResult] = await Promise.all([
    generateGrammarQuestions(sentenceInputs),
    generateConnectiveQuestions(sentenceInputs),
  ]);

  // redirect() MUST NOT be called inside try/catch — collect error first, redirect after
  // 'error' in x narrowing is more reliable than !x.ok for TypeScript
  if ('error' in gResult) {
    redirect(
      `/admin/hi-naesin/passages/${passageId}/edit?tab=drill&err=${encodeURIComponent('AI 오류 (문법): ' + gResult.error)}`,
    );
  }
  if ('error' in cResult) {
    redirect(
      `/admin/hi-naesin/passages/${passageId}/edit?tab=drill&err=${encodeURIComponent('AI 오류 (연결어): ' + cResult.error)}`,
    );
  }

  const grammarResults = gResult.results;
  const connectiveResults = cResult.results;

  const grammarChoiceDrills: object[] = [
    ...grammarResults.map(({ question }, idx) => ({
      passage_id:   passageId,
      drill_type:   'grammar_choice',
      order_index:  idx,
      payload:      question,
      is_published: false,
    })),
    ...connectiveResults.map(({ question }, idx) => ({
      passage_id:   passageId,
      drill_type:   'grammar_choice',
      order_index:  grammarResults.length + idx,
      payload:      question,
      is_published: false,
    })),
  ];

  let grammarCount = 0;
  if (grammarChoiceDrills.length > 0) {
    const { error: gErr } = await adminDb
      .from('hi_naesin_drills')
      .insert(grammarChoiceDrills);
    if (gErr) {
      const errMsg = encodeURIComponent(gErr.message);
      redirect(`/admin/hi-naesin/passages/${passageId}/edit?tab=drill&err=grammar_insert:${errMsg}`);
    }
    grammarCount = grammarChoiceDrills.length;
  }

  revalidate(passageId);

  const debugInfo = encodeURIComponent(
    `gr${grammarResults.length}_co${connectiveResults.length}_in${sentenceInputs.length}`,
  );
  redirect(
    `/admin/hi-naesin/passages/${passageId}/edit?tab=drill&ok=3step&g=${grammarCount}&d=${debugInfo}`,
  );
}

// 지문 배열 변형문제 자동 생성 (4등분)
async function generateTextOrderingVariant(
  adminDb: ReturnType<typeof import('@/lib/supabase/service').getServiceSupabase>,
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
  await adminDb
    .from('hi_naesin_variant_questions')
    .delete()
    .eq('passage_id', passageId)
    .eq('question_type', 'text_ordering');

  await adminDb.from('hi_naesin_variant_questions').insert({
    passage_id:    passageId,
    question_type: 'text_ordering',
    order_index:   0,
    payload,
    is_published:  false,
  });
}
