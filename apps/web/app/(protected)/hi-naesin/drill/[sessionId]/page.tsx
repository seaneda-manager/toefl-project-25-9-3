import { notFound, redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  submitDrillAnswerAction,
  selfCheckDrillAction,
  nextDrillStepAction,
} from './actions';
import WritingHintReveal from './WritingHintReveal';

export const dynamic = 'force-dynamic';

type Params = Promise<{ sessionId: string }>;
type SearchParams = Promise<{ type?: string; step?: string }>;

// ── 블록 순서 (고정) ──────────────────────────────────────
const TYPE_ORDER = ['translation', 'fill_blank', 'writing', 'grammar_choice'] as const;

const DRILL_LABEL: Record<string, string> = {
  translation:    '해석',
  fill_blank:     '빈칸 넣기',
  writing:        '작문',
  summary:        '요약',
  grammar_choice: '문법',
};

const DRILL_INSTRUCTION: Record<string, string> = {
  translation:    '영어 문장을 보고 우리말로 해석하세요.',
  fill_blank:     '빈칸(____) 에 알맞은 영어 단어를 입력하세요.',
  writing:        '주어진 우리말 문장을 영어로 작문하세요.',
  summary:        '지문 내용을 바탕으로 요약문의 빈칸을 채우세요.',
  grammar_choice: '빈칸에 알맞은 답을 고르거나 연결어를 선택하세요.',
};

// ── 타입 ─────────────────────────────────────────────────

type DrillRow = {
  id: string;
  drill_type: string;
  order_index: number;
  payload: Record<string, unknown>;
};

type ResponseRow = {
  drill_id: string;
  response_text: string | null;
  response_choice: string | null;
  is_correct: boolean | null;
  score_pct: number | null;
  feedback_text: string | null;
};

type TypeInfo = { total: number; done: number; firstUnanswered: number };

type DrillProps = {
  drill: DrillRow;
  sessionId: string;
  type: string;
  step: number;
  typeTotal: number;
  nextType: string | null;
  isAnswered: boolean;
  response: ResponseRow | null;
};

// ─────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────

export default async function HiNaesinDrillPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { sessionId } = await params;
  const { type: typeParam, step: stepStr } = await searchParams;

  const supabase = await getServerSupabase();

  // ── 세션 확인 ──────────────────────────────────────────
  const { data: session } = await supabase
    .from('hi_naesin_sessions')
    .select('id, passage_id, status')
    .eq('id', sessionId)
    .single();

  if (!session) notFound();
  if (session.status === 'submitted') {
    redirect(`/hi-naesin/drill/${sessionId}/complete`);
  }

  // ── 병렬 로드 ──────────────────────────────────────────
  const [
    { data: passageData },
    { data: allDrillsRaw },
    { data: respondedRaw },
    { data: writingDrillsRaw },
  ] = await Promise.all([
    supabase
      .from('hi_naesin_passages')
      .select('title')
      .eq('id', session.passage_id)
      .single(),
    supabase
      .from('hi_naesin_drills')
      .select('id, drill_type, order_index, payload')
      .eq('passage_id', session.passage_id)
      .order('order_index'),
    supabase
      .from('hi_naesin_drill_responses')
      .select('drill_id')
      .eq('session_id', sessionId),
    supabase
      .from('hi_naesin_drills')
      .select('id, order_index, payload')
      .eq('passage_id', session.passage_id)
      .eq('drill_type', 'writing')
      .order('order_index'),
  ]);

  const allDrills    = (allDrillsRaw ?? []) as DrillRow[];
  const respondedSet = new Set((respondedRaw ?? []).map((r) => r.drill_id));

  if (allDrills.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-neutral-500">이 지문에 등록된 Drill이 없습니다.</p>
      </main>
    );
  }

  // ── 타입별 그룹화 ──────────────────────────────────────
  const drillsByType: Record<string, DrillRow[]> = {};
  for (const d of allDrills) {
    if (!drillsByType[d.drill_type]) drillsByType[d.drill_type] = [];
    drillsByType[d.drill_type].push(d);
  }
  for (const t of Object.keys(drillsByType)) {
    drillsByType[t].sort((a, b) => a.order_index - b.order_index);
  }

  // 사용 가능한 블록 타입 (TYPE_ORDER 순)
  const availableTypes = (TYPE_ORDER as readonly string[]).filter(
    (t) => (drillsByType[t]?.length ?? 0) > 0,
  );

  // 타입별 진행 정보 (탭 표시용)
  const typeInfoMap: Record<string, TypeInfo> = {};
  for (const t of availableTypes) {
    const ds = drillsByType[t];
    const done = ds.filter((d) => respondedSet.has(d.id)).length;
    const firstUnanswered = ds.findIndex((d) => !respondedSet.has(d.id));
    typeInfoMap[t] = {
      total: ds.length,
      done,
      firstUnanswered: firstUnanswered >= 0 ? firstUnanswered : ds.length - 1,
    };
  }

  // ── 현재 블록 결정 ─────────────────────────────────────
  const currentType = availableTypes.includes(typeParam ?? '')
    ? (typeParam as string)
    : availableTypes[0];

  const currentDrills = drillsByType[currentType] ?? [];
  const typeTotal     = currentDrills.length;

  // step: 명시 없으면 첫 미완료 위치
  const step = stepStr !== undefined
    ? Math.max(0, Math.min(parseInt(stepStr, 10) || 0, typeTotal - 1))
    : typeInfoMap[currentType]?.firstUnanswered ?? 0;

  const drill = currentDrills[step];
  if (!drill) redirect(`/hi-naesin/drill/${sessionId}/complete`);

  // 다음 블록
  const currentTypeIdx = availableTypes.indexOf(currentType);
  const nextType       = availableTypes[currentTypeIdx + 1] ?? null;

  // ── 현재 드릴 응답 로드 ───────────────────────────────
  const { data: responseData } = await supabase
    .from('hi_naesin_drill_responses')
    .select('drill_id, response_text, response_choice, is_correct, score_pct, feedback_text')
    .eq('session_id', sessionId)
    .eq('drill_id', drill.id)
    .maybeSingle();

  const response   = responseData as ResponseRow | null;
  const isAnswered = response !== null;

  // ── 자기채점 / 다음 버튼 여부 ─────────────────────────
  const isSelfCheckType = currentType === 'translation' || currentType === 'writing';
  const needsSelfCheck  = isSelfCheckType && isAnswered && response?.is_correct === null;
  const showNextButton  = isSelfCheckType && isAnswered && response?.is_correct !== null;

  // ── 작문 누적 표시용 ──────────────────────────────────
  const writingDrills = (writingDrillsRaw ?? []) as Array<{
    id: string;
    order_index: number;
    payload: { answerEn: string; koPrompt: string };
  }>;
  const writingResponseMap = new Map<
    string,
    { response_text: string | null; is_correct: boolean | null; score_pct: number | null }
  >();
  if (writingDrills.length > 0) {
    const wIds = writingDrills.map((d) => d.id);
    const { data: wResp } = await supabase
      .from('hi_naesin_drill_responses')
      .select('drill_id, response_text, is_correct, score_pct')
      .eq('session_id', sessionId)
      .in('drill_id', wIds);
    for (const r of wResp ?? []) writingResponseMap.set(r.drill_id, r);
  }

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      {/* 지문 제목 */}
      <p className="text-xs text-neutral-400">{passageData?.title ?? '지문'}</p>

      {/* 블록 탭 바 */}
      <BlockTabBar
        sessionId={sessionId}
        availableTypes={availableTypes}
        currentType={currentType}
        typeInfoMap={typeInfoMap}
      />

      {/* 블록 내 진행 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">
            {DRILL_LABEL[currentType] ?? currentType}
          </span>
          <span>{step + 1} / {typeTotal}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all"
            style={{ width: `${((step + 1) / typeTotal) * 100}%` }}
          />
        </div>
        <p className="text-xs text-neutral-400">{DRILL_INSTRUCTION[currentType]}</p>
      </div>

      {/* 드릴 카드 */}
      <div className="rounded-2xl border bg-white p-6 space-y-5">
        {currentType === 'translation' && (
          <TranslationDrill
            drill={drill} sessionId={sessionId}
            type={currentType} step={step} typeTotal={typeTotal} nextType={nextType}
            isAnswered={isAnswered} response={response}
          />
        )}
        {currentType === 'fill_blank' && (
          <FillBlankDrill
            drill={drill} sessionId={sessionId}
            type={currentType} step={step} typeTotal={typeTotal} nextType={nextType}
            isAnswered={isAnswered} response={response}
          />
        )}
        {currentType === 'writing' && (
          <WritingDrill
            drill={drill} sessionId={sessionId}
            type={currentType} step={step} typeTotal={typeTotal} nextType={nextType}
            isAnswered={isAnswered} response={response}
          />
        )}
        {currentType === 'grammar_choice' && (
          <GrammarChoiceDrill
            drill={drill} sessionId={sessionId}
            type={currentType} step={step} typeTotal={typeTotal} nextType={nextType}
            isAnswered={isAnswered} response={response}
          />
        )}
      </div>

      {/* 자기 채점 버튼 (AI 채점 실패 폴백) */}
      {needsSelfCheck && (
        <div className="rounded-2xl border bg-neutral-50 p-4 space-y-3">
          <p className="text-sm font-medium text-neutral-700">내 답과 비교해보세요. 맞았나요?</p>
          <div className="flex gap-3">
            <form action={selfCheckDrillAction.bind(
              null, sessionId, drill.id, currentType, step, typeTotal, nextType, true,
            )}>
              <button type="submit" className="rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                ✓ 맞음
              </button>
            </form>
            <form action={selfCheckDrillAction.bind(
              null, sessionId, drill.id, currentType, step, typeTotal, nextType, false,
            )}>
              <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-6 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                ✗ 틀림
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 다음 버튼 */}
      {showNextButton && (
        <form action={nextDrillStepAction.bind(
          null, sessionId, currentType, step, typeTotal, nextType,
        )}>
          <button type="submit" className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800">
            {step + 1 >= typeTotal
              ? nextType
                ? `다음 블록: ${DRILL_LABEL[nextType]} →`
                : '결과 보기 →'
              : '다음 →'}
          </button>
        </form>
      )}

      {/* 작문 지문 누적 */}
      {writingDrills.length > 0 && (
        <PassageProgress
          writingDrills={writingDrills}
          writingResponseMap={writingResponseMap}
          currentDrillId={currentType === 'writing' ? drill.id : null}
        />
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────
// 블록 탭 바
// ─────────────────────────────────────────────────────────

function BlockTabBar({
  sessionId,
  availableTypes,
  currentType,
  typeInfoMap,
}: {
  sessionId: string;
  availableTypes: string[];
  currentType: string;
  typeInfoMap: Record<string, TypeInfo>;
}) {
  return (
    <div className="flex gap-1 rounded-2xl border bg-white p-1">
      {availableTypes.map((t) => {
        const info      = typeInfoMap[t];
        const isActive  = t === currentType;
        const isComplete = info.done >= info.total && info.total > 0;
        // 탭 클릭 시 첫 미완료 위치로 이동
        const href = `/hi-naesin/drill/${sessionId}?type=${t}&step=${info.firstUnanswered}`;

        return (
          <a
            key={t}
            href={href}
            className={[
              'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center transition-colors',
              isActive
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-50',
            ].join(' ')}
          >
            <span className="text-xs font-semibold leading-tight">
              {DRILL_LABEL[t] ?? t}
            </span>
            <span className={`text-[10px] leading-tight ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`}>
              {isComplete
                ? '✓'
                : `${info.done}/${info.total}`}
            </span>
          </a>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 점수 뱃지
// ─────────────────────────────────────────────────────────

function ScoreBadge({ scorePct, isCorrect }: { scorePct: number | null; isCorrect: boolean | null }) {
  if (scorePct === null || isCorrect === null) return null;
  return (
    <div className={[
      'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold',
      isCorrect
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-red-200 bg-red-50 text-red-700',
    ].join(' ')}>
      <span>{isCorrect ? '✓' : '✗'}</span>
      <span>{scorePct}점 · {isCorrect ? '정답' : '오답'}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 드릴 컴포넌트들
// ─────────────────────────────────────────────────────────

function TranslationDrill({ drill, sessionId, type, step, isAnswered, response }: DrillProps) {
  const p = drill.payload as { sentenceEn: string; answerKo: string };
  return (
    <>
      <div className="rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800">
        {p.sentenceEn}
      </div>
      {!isAnswered ? (
        <form action={submitDrillAnswerAction.bind(null, sessionId, drill.id, type, step)}>
          <input type="hidden" name="drill_type"  value="translation" />
          <input type="hidden" name="sentence_en" value={p.sentenceEn} />
          <input type="hidden" name="answer_ko"   value={p.answerKo} />
          <textarea
            name="response_text"
            rows={3}
            placeholder="한국어로 해석하세요."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
            required
          />
          <button type="submit" className="mt-3 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
            제출
          </button>
        </form>
      ) : (
        <>
          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
            <span className="text-xs font-medium text-neutral-400 block mb-1">내 답</span>
            {response?.response_text ?? '(없음)'}
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span className="text-xs font-medium text-emerald-600 block mb-1">모범 답안</span>
            {p.answerKo}
          </div>
          <ScoreBadge scorePct={response?.score_pct ?? null} isCorrect={response?.is_correct ?? null} />
          {response?.feedback_text && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600 leading-relaxed">
              {response.feedback_text}
            </div>
          )}
        </>
      )}
    </>
  );
}

function FillBlankDrill({ drill, sessionId, type, step, typeTotal, nextType, isAnswered, response }: DrillProps) {
  const p = drill.payload as {
    sentenceTemplate: string;
    answer: string;
    distractors: string[];
    sentenceKo?: string;
  };
  const isCorrect = response?.is_correct;
  return (
    <>
      <div className="rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800">
        {p.sentenceTemplate}
      </div>
      {p.sentenceKo && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs leading-relaxed text-blue-700">
          <span className="font-semibold">힌트 · </span>{p.sentenceKo}
        </div>
      )}
      {!isAnswered ? (
        <form action={submitDrillAnswerAction.bind(null, sessionId, drill.id, type, step)}>
          <input type="hidden" name="drill_type" value="fill_blank" />
          <input type="hidden" name="answer"     value={p.answer} />
          <input
            name="response_text"
            placeholder="빈칸에 들어갈 단어를 입력하세요."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
            required
          />
          <button type="submit" className="mt-3 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
            제출
          </button>
        </form>
      ) : (
        <>
          <div className={[
            'rounded-xl border p-3 text-sm',
            isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900',
          ].join(' ')}>
            <span className="text-xs font-medium block mb-1">{isCorrect ? '✓ 정답' : '✗ 오답'}</span>
            내 답: {response?.response_text}
          </div>
          {!isCorrect && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <span className="text-xs font-medium text-emerald-600 block mb-1">정답</span>
              {p.answer}
            </div>
          )}
          <form action={nextDrillStepAction.bind(null, sessionId, type, step, typeTotal, nextType)}>
            <button type="submit" className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
              {step + 1 >= typeTotal
                ? nextType ? `다음 블록: ${DRILL_LABEL[nextType]} →` : '결과 보기 →'
                : '다음 →'}
            </button>
          </form>
        </>
      )}
    </>
  );
}

function WritingDrill({ drill, sessionId, type, step, isAnswered, response }: DrillProps) {
  const p = drill.payload as {
    koPrompt: string;
    answerEn: string;
    wordCount?: number;
    hintWords?: string[];
    grammarHints?: string[];
  };
  return (
    <>
      <div className="rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
        {p.koPrompt}
      </div>
      {!isAnswered && (
        <WritingHintReveal
          answerEn={p.answerEn}
          hintWords={p.hintWords ?? []}
          grammarHints={p.grammarHints ?? []}
          wordCount={p.wordCount}
        />
      )}
      {!isAnswered ? (
        <form action={submitDrillAnswerAction.bind(null, sessionId, drill.id, type, step)}>
          <input type="hidden" name="drill_type" value="writing" />
          <input type="hidden" name="prompt_ko"  value={p.koPrompt} />
          <input type="hidden" name="answer_en"  value={p.answerEn} />
          <textarea
            name="response_text"
            rows={3}
            placeholder="영어로 작문하세요."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
            required
          />
          <button type="submit" className="mt-3 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
            제출
          </button>
        </form>
      ) : (
        <>
          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
            <span className="text-xs font-medium text-neutral-400 block mb-1">내 답</span>
            {response?.response_text ?? '(없음)'}
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span className="text-xs font-medium text-emerald-600 block mb-1">모범 답안</span>
            {p.answerEn}
          </div>
          <ScoreBadge scorePct={response?.score_pct ?? null} isCorrect={response?.is_correct ?? null} />
          {response?.feedback_text && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600 leading-relaxed">
              {response.feedback_text}
            </div>
          )}
        </>
      )}
    </>
  );
}

function GrammarChoiceDrill({ drill, sessionId, type, step, typeTotal, nextType, isAnswered, response }: DrillProps) {
  const p = drill.payload as {
    sentenceTemplate: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    optionD?: string;
    correct: 'a' | 'b' | 'c' | 'd';
    explanation?: string;
    grammarCategory?: string;
    contextBefore?: string;
  };

  const options = [
    { key: 'a' as const, label: 'A', value: p.optionA },
    { key: 'b' as const, label: 'B', value: p.optionB },
    ...(p.optionC ? [{ key: 'c' as const, label: 'C', value: p.optionC }] : []),
    ...(p.optionD ? [{ key: 'd' as const, label: 'D', value: p.optionD }] : []),
  ];

  const correctValue = options.find((o) => o.key === p.correct)?.value ?? '';
  const isCorrect    = response?.is_correct;

  return (
    <>
      {p.grammarCategory && (
        <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700">
          {p.grammarCategory}
        </span>
      )}
      {p.contextBefore && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm italic text-neutral-500 leading-relaxed">
          {p.contextBefore}
        </div>
      )}
      <div className="rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800 font-medium">
        {p.sentenceTemplate}
      </div>
      {!isAnswered ? (
        <form action={submitDrillAnswerAction.bind(null, sessionId, drill.id, type, step)}>
          <input type="hidden" name="drill_type"     value="grammar_choice" />
          <input type="hidden" name="correct_option" value={p.correct} />
          <div className={`grid gap-2 ${options.length >= 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {options.map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
              >
                <input type="radio" name="response_choice" value={opt.key} className="accent-neutral-900 shrink-0" required />
                <span className="font-bold text-neutral-400 shrink-0">{opt.label}</span>
                <span className="text-neutral-800">{opt.value}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="mt-3 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
            제출
          </button>
        </form>
      ) : (
        <>
          <div className={[
            'rounded-xl border p-3 text-sm font-semibold',
            isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700',
          ].join(' ')}>
            {isCorrect ? `✓ 정답 — ${correctValue}` : `✗ 오답 — 정답: ${correctValue}`}
          </div>
          {p.explanation && (
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-2.5 text-xs text-violet-800 leading-relaxed">
              <span className="font-semibold">해설 · </span>{p.explanation}
            </div>
          )}
          <form action={nextDrillStepAction.bind(null, sessionId, type, step, typeTotal, nextType)}>
            <button type="submit" className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">
              {step + 1 >= typeTotal
                ? nextType ? `다음 블록: ${DRILL_LABEL[nextType]} →` : '결과 보기 →'
                : '다음 →'}
            </button>
          </form>
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// 작문 지문 누적 표시
// ─────────────────────────────────────────────────────────

function scoreRing(scorePct: number | null, isCorrect: boolean | null) {
  if (isCorrect === null) return 'bg-neutral-200';
  if (scorePct === null)  return isCorrect ? 'bg-emerald-500' : 'bg-red-500';
  if (scorePct >= 80)     return 'bg-emerald-500';
  if (scorePct >= 70)     return 'bg-emerald-400';
  if (scorePct >= 50)     return 'bg-amber-400';
  return 'bg-red-500';
}

function missingWords(model: string, student: string): Set<string> {
  const sw = new Set(
    student.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter((w) => w.length >= 3),
  );
  return new Set(
    model.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter((w) => w.length >= 3 && !sw.has(w)),
  );
}

function tokenize(model: string, student: string | null) {
  const missing = student ? missingWords(model, student) : new Set<string>();
  return model.split(/(\s+)/).map((tok) => ({
    tok,
    wrong: missing.has(tok.toLowerCase().replace(/[^a-z]/g, '')),
  }));
}

function PassageProgress({
  writingDrills,
  writingResponseMap,
  currentDrillId,
}: {
  writingDrills: Array<{ id: string; order_index: number; payload: { answerEn: string; koPrompt: string } }>;
  writingResponseMap: Map<string, { response_text: string | null; is_correct: boolean | null; score_pct: number | null }>;
  currentDrillId: string | null;
}) {
  const answered = writingDrills.filter((d) => writingResponseMap.has(d.id));
  if (answered.length === 0) return null;

  return (
    <details className="group" open={false}>
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border bg-white px-4 py-3 hover:bg-neutral-50 select-none">
        <span className="text-xs font-semibold text-neutral-700">작문 진행 현황</span>
        <span className="text-xs text-neutral-400">
          {answered.length} / {writingDrills.length} 문장 완료 · 펼쳐보기 ▾
        </span>
      </summary>

      <div className="mt-2 rounded-2xl border bg-white divide-y overflow-hidden">
        {writingDrills.map((d, i) => {
          const res       = writingResponseMap.get(d.id) ?? null;
          const isCurrent = d.id === currentDrillId;
          const tokens    = res ? tokenize(d.payload.answerEn, res.response_text) : null;
          const ring      = scoreRing(res?.score_pct ?? null, res?.is_correct ?? null);

          return (
            <div key={d.id} className={`flex items-start gap-3 px-4 py-3 ${isCurrent ? 'bg-neutral-50' : ''}`}>
              <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                <span className="text-xs text-neutral-400 w-4 text-right">{i + 1}</span>
                <span className={`h-2 w-2 rounded-full shrink-0 ${ring}`} />
              </div>
              <p className="text-sm leading-relaxed text-neutral-700 flex-1">
                {isCurrent && !res ? (
                  <span className="text-neutral-300 italic">작성 중...</span>
                ) : tokens ? (
                  tokens.map(({ tok, wrong }, j) =>
                    wrong
                      ? <strong key={j} className="font-bold text-red-500">{tok}</strong>
                      : <span key={j}>{tok}</span>
                  )
                ) : (
                  <span className="text-neutral-300 italic">미제출</span>
                )}
              </p>
              {res?.score_pct !== null && res?.score_pct !== undefined && (
                <span className={`shrink-0 text-xs font-semibold ${(res.score_pct ?? 0) >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {res.score_pct}점
                </span>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
