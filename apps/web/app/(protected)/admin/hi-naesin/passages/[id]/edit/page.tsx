import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  sourceTypeLabel, gradeLabel,
  drillTypeLabel, HI_NAESIN_DRILL_TYPES,
  variantTypeLabel, defaultStem, HI_NAESIN_VARIANT_TYPES,
} from '@/models/hi-naesin';
import type {
  HiNaesinPassageRow, HiNaesinDrillRow,
  HiNaesinVariantQuestionRow, HiNaesinVariantChoiceRow,
} from '@/models/hi-naesin';
import {
  updateHiNaesinPassageAction,
  addHiNaesinDrillAction,
  deleteHiNaesinDrillAction,
  addHiNaesinVariantQuestionAction,
  deleteHiNaesinVariantQuestionAction,
  saveHiNaesinVariantChoicesAction,
} from './actions';
import {
  generateSentencePairsAction,
  updateSentencePairAction,
  generateDrillsFromSentencesAction,
} from './sentence-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string }>;

export default async function HiNaesinPassageEditPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tab = 'passage' } = await searchParams;
  const supabase = await getServerSupabase();

  const questionIds = (
    await supabase
      .from('hi_naesin_variant_questions')
      .select('id')
      .eq('passage_id', id)
  ).data?.map((q) => q.id) ?? [];

  const [
    { data: passageData },
    { data: drillsData },
    { data: questionsData },
    { data: choicesData },
    { data: sentencesData },
  ] = await Promise.all([
    supabase.from('hi_naesin_passages').select('*').eq('id', id).single(),
    supabase.from('hi_naesin_drills').select('*').eq('passage_id', id).order('drill_type').order('order_index'),
    supabase.from('hi_naesin_variant_questions').select('*').eq('passage_id', id).order('order_index'),
    questionIds.length > 0
      ? supabase.from('hi_naesin_variant_choices').select('*').in('question_id', questionIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('hi_naesin_passage_sentences').select('*').eq('passage_id', id).order('order_index'),
  ]);

  if (!passageData) notFound();

  const passage = passageData as HiNaesinPassageRow;
  const drills = (drillsData ?? []) as HiNaesinDrillRow[];
  const questions = (questionsData ?? []) as HiNaesinVariantQuestionRow[];
  const choices = (choicesData ?? []) as HiNaesinVariantChoiceRow[];
  const sentences = (sentencesData ?? []) as Array<{
    id: string; order_index: number; sentence_en: string; sentence_ko: string | null;
  }>;

  const choicesByQuestion: Record<string, HiNaesinVariantChoiceRow[]> = {};
  for (const c of choices) {
    if (!choicesByQuestion[c.question_id]) choicesByQuestion[c.question_id] = [];
    choicesByQuestion[c.question_id].push(c);
  }

  const tabs = [
    { key: 'passage', label: '지문 정보' },
    { key: 'sentences', label: `문장 매칭 (${sentences.length})` },
    { key: 'drill', label: `Drill (${drills.length})` },
    { key: 'variant', label: `변형문제 (${questions.length})` },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-6 py-8">
      {/* 헤더 */}
      <header className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / 고등내신 / 지문 편집
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {passage.title ?? '(제목 없음)'}
          </h1>
          <div className="mt-1 flex gap-2 text-xs text-neutral-500">
            <span>{sourceTypeLabel(passage.source_type as never)}</span>
            <span>·</span>
            <span>{gradeLabel(passage.grade as never)}</span>
            <span>·</span>
            <span>{passage.is_published ? '공개' : '비공개'}</span>
          </div>
        </div>
        <Link
          href="/admin/hi-naesin/passages"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          목록으로
        </Link>
      </header>

      {/* 탭 */}
      <nav className="flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/hi-naesin/passages/${id}/edit?tab=${t.key}`}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
              tab === t.key
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* ── 탭: 지문 정보 ── */}
      {tab === 'passage' && (
        <form
          action={updateHiNaesinPassageAction.bind(null, id)}
          className="space-y-4 rounded-2xl border bg-white p-5"
        >
          <Field label="제목" name="title" defaultValue={passage.title ?? ''} />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">지문 원문 *</label>
            <textarea
              name="passage_text"
              required
              rows={10}
              defaultValue={passage.passage_text}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">전체 해석</label>
            <textarea
              name="translation_ko"
              rows={6}
              defaultValue={passage.translation_ko ?? ''}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
            />
          </div>

          <Field
            label="토픽 태그 (쉼표 구분)"
            name="topic_tags"
            defaultValue={(passage.topic_tags ?? []).join(', ')}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-neutral-900 px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              저장
            </button>
          </div>
        </form>
      )}

      {/* ── 탭: 문장 매칭 ── */}
      {tab === 'sentences' && (
        <div className="space-y-4">
          {/* 실행 버튼 */}
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4">
            <form action={generateSentencePairsAction.bind(null, id)}>
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                1단계: 문장 분리 & 자동 매칭
              </button>
            </form>

            {sentences.length > 0 && (
              <form action={generateDrillsFromSentencesAction.bind(null, id)}>
                <button
                  type="submit"
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  2단계: Drill + 문법 + 지문배열 자동 생성
                </button>
              </form>
            )}

            {sentences.length > 0 && (
              <span className="text-xs text-neutral-500">
                {sentences.length}문장 매칭됨
              </span>
            )}
          </section>

          <p className="text-xs text-neutral-500 px-1">
            매칭이 틀린 경우 한국어 칸을 직접 수정하세요. 수정 후 2단계 실행하면 반영됩니다.
          </p>

          {/* 문장 쌍 목록 */}
          {sentences.length > 0 && (
            <section className="overflow-hidden rounded-2xl border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left">
                  <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-xs [&>th]:font-medium [&>th]:text-neutral-500">
                    <th className="w-6">#</th>
                    <th>영어</th>
                    <th>한국어</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {sentences.map((s) => (
                    <tr key={s.id} className="border-t align-top">
                      <td className="px-4 py-2 text-xs text-neutral-400">{s.order_index + 1}</td>
                      <td className="px-4 py-2">
                        <p className="text-sm text-neutral-800 leading-relaxed">{s.sentence_en}</p>
                      </td>
                      <td className="px-4 py-2">
                        <form action={updateSentencePairAction.bind(null, id, s.id)}>
                          <input type="hidden" name="sentence_en" value={s.sentence_en} />
                          <div className="flex gap-2">
                            <input
                              name="sentence_ko"
                              defaultValue={s.sentence_ko ?? ''}
                              placeholder="한국어 해석"
                              className="w-full rounded-lg border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-neutral-300"
                            />
                            <button
                              type="submit"
                              className="shrink-0 rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50"
                            >
                              저장
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {sentences.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-neutral-400">
              1단계 버튼을 눌러 문장을 분리하세요.
            </div>
          )}
        </div>
      )}

      {/* ── 탭: Drill ── */}
      {tab === 'drill' && (
        <div className="space-y-4">
          {/* 기존 드릴 목록 */}
          {drills.length > 0 && (
            <section className="space-y-2">
              {drills.map((drill) => (
                <div key={drill.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900">
                      {drillTypeLabel(drill.drill_type as never)}
                      <span className="ml-2 text-xs text-neutral-400">#{drill.order_index}</span>
                    </span>
                    <form action={deleteHiNaesinDrillAction.bind(null, id, drill.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
                    {JSON.stringify(drill.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </section>
          )}

          {/* Drill 추가 */}
          <section className="rounded-2xl border bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900">Drill 추가</h2>
            <form action={addHiNaesinDrillAction.bind(null, id)} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">Drill 종류</label>
                <select
                  name="drill_type"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                >
                  {HI_NAESIN_DRILL_TYPES.map((t) => (
                    <option key={t} value={t}>{drillTypeLabel(t)}</option>
                  ))}
                </select>
              </div>

              <DrillPayloadGuide />

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">
                  Payload (JSON)
                </label>
                <textarea
                  name="payload_json"
                  rows={8}
                  placeholder='{"sentenceEn": "...", "answerKo": "..."}'
                  className="w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                추가
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── 탭: 변형문제 ── */}
      {tab === 'variant' && (
        <div className="space-y-4">
          {/* 기존 변형문제 목록 */}
          {questions.map((q) => {
            const qChoices = (choicesByQuestion[q.id] ?? []).sort(
              (a, b) => a.order_index - b.order_index,
            );
            return (
              <div key={q.id} className="rounded-2xl border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-900">
                    {variantTypeLabel(q.question_type as never)}
                  </span>
                  <form action={deleteHiNaesinVariantQuestionAction.bind(null, id, q.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </form>
                </div>

                <div className="text-xs text-neutral-500">
                  {q.stem ?? defaultStem(q.question_type as never)}
                </div>

                <pre className="overflow-x-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
                  {JSON.stringify(q.payload, null, 2)}
                </pre>

                {/* 보기 입력 */}
                <form
                  action={saveHiNaesinVariantChoicesAction.bind(null, id, q.id)}
                  className="space-y-2 border-t pt-3"
                >
                  <div className="text-xs font-medium text-neutral-600">보기 (5지선다)</div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const existing = qChoices.find((c) => c.order_index === i);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 text-xs text-neutral-400">①②③④⑤'[i-1]</span>
                        <input
                          name={`choice_${i}`}
                          defaultValue={existing?.text ?? ''}
                          placeholder={`보기 ${i}`}
                          className="flex-1 rounded-xl border px-3 py-1.5 text-sm outline-none"
                        />
                        <label className="flex items-center gap-1 text-xs text-neutral-500">
                          <input
                            type="radio"
                            name="correct"
                            value={String(i)}
                            defaultChecked={existing?.is_correct ?? false}
                          />
                          정답
                        </label>
                      </div>
                    );
                  })}
                  <button
                    type="submit"
                    className="rounded-xl border px-4 py-1.5 text-xs hover:bg-neutral-50"
                  >
                    보기 저장
                  </button>
                </form>
              </div>
            );
          })}

          {/* 변형문제 추가 */}
          <section className="rounded-2xl border bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900">변형문제 추가</h2>
            <form
              action={addHiNaesinVariantQuestionAction.bind(null, id)}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">문제 종류</label>
                <select
                  name="question_type"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                >
                  {HI_NAESIN_VARIANT_TYPES.map((t) => (
                    <option key={t} value={t}>{variantTypeLabel(t)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">
                  지시문 (비워두면 기본값 사용)
                </label>
                <input
                  name="stem"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                />
              </div>

              <VariantPayloadGuide />

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">
                  Payload (JSON)
                </label>
                <textarea
                  name="payload_json"
                  rows={8}
                  placeholder="{}"
                  className="w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">해설 (선택)</label>
                <textarea
                  name="explanation"
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-y"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                추가
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function Field({
  label, name, defaultValue, placeholder,
}: {
  label: string; name: string; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-600">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
      />
    </div>
  );
}

function DrillPayloadGuide() {
  return (
    <details className="rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-600">
      <summary className="cursor-pointer font-medium">Payload 형식 가이드</summary>
      <div className="mt-2 space-y-2">
        <div><strong>해석:</strong> {`{"sentenceEn": "...", "answerKo": "..."}`}</div>
        <div><strong>빈칸 넣기:</strong> {`{"sentenceTemplate": "The ____ fox", "answer": "quick", "distractors": ["slow","brown","red"]}`}</div>
        <div><strong>작문:</strong> {`{"koPrompt": "빠른 여우가...", "answerEn": "The quick fox..."}`}</div>
        <div><strong>요약:</strong> {`{"template": "A ____ (A) animal...", "blanks": [{"answer":"quick","distractors":["slow"]}]}`}</div>
        <div><strong>문법 고르기:</strong> {`{"sentenceTemplate": "She [go/goes] daily.", "optionA": "go", "optionB": "goes", "correct": "b"}`}</div>
      </div>
    </details>
  );
}

function VariantPayloadGuide() {
  return (
    <details className="rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-600">
      <summary className="cursor-pointer font-medium">Payload 형식 가이드</summary>
      <div className="mt-2 space-y-2">
        <div><strong>지문 배열:</strong> {`{"fixedSegment":{"text":"..."},"segments":[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."}],"correctOrder":["B","A","C"]}`}</div>
        <div><strong>빈칸 추론(단어/문장):</strong> {`{"markedPassage": "The ____ of the story..."}`}</div>
        <div><strong>어울리지 않는 문장:</strong> {`{"numberedPassage": "① ... ② ... ③ ...", "irrelevantIndex": 3}`}</div>
        <div><strong>요약 빈칸:</strong> {`{"summaryTemplate": "A (A) animal...", "blankLabels": ["(A)","(B)"]}`}</div>
        <div><strong>Fact / Negative Fact:</strong> {`{}`} (보기만 입력)</div>
      </div>
    </details>
  );
}
