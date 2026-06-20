import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import WeaknessAnalysisClient from './WeaknessAnalysisClient';

export const dynamic = 'force-dynamic';

// ?Ä?Ä ?ôÏ????àÎ≤® ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
function masteryLevel(pct: number): { label: string; color: string; bg: string } {
  if (pct >= 80) return { label: '?ôÏ?',    color: 'text-emerald-700', bg: 'bg-emerald-500' };
  if (pct >= 60) return { label: 'Î∂ÄÎ∂ÑÏàôÏßÄ', color: 'text-amber-700',   bg: 'bg-amber-400'   };
  return               { label: 'ÎØ∏ÏàôÏßÄ',   color: 'text-red-600',     bg: 'bg-red-400'     };
}

function pct(correct: number, total: number) {
  return total === 0 ? null : Math.round((correct / total) * 100);
}

export default async function HiNaesinStatsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // ?Ä?Ä 1. Î™®Îì† ?∏ÏÖò ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: sessions } = await supabase
    .from('hi_naesin_sessions')
    .select('id, passage_id, status, submitted_at, score_percent')
    .eq('student_id', user.id)
    .eq('session_type', 'drill');

  const submittedSessions = (sessions ?? []).filter((s) => s.status === 'submitted');
  const submittedIds      = submittedSessions.map((s) => s.id);
  const passageIds        = [...new Set(submittedSessions.map((s) => s.passage_id))];

  // ?Ä?Ä 2. Î™®Îì† drill ?ëÎãµ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: responses } = submittedIds.length > 0
    ? await supabase
        .from('hi_naesin_drill_responses')
        .select('session_id, drill_id, is_correct, score_pct')
        .in('session_id', submittedIds)
    : { data: [] };

  // ?Ä?Ä 3. Drill Î©îÌ? (?Ä??+ grammarCategory + passageId) ?Ä?Ä?Ä?Ä
  const drillIds = [...new Set((responses ?? []).map((r) => r.drill_id))];
  const { data: drills } = drillIds.length > 0
    ? await supabase
        .from('hi_naesin_drills')
        .select('id, drill_type, passage_id, payload')
        .in('id', drillIds)
    : { data: [] };

  const drillMap = new Map((drills ?? []).map((d) => [d.id, d]));

  // ?Ä?Ä 4. ÏßÄÎ¨??¥Î¶Ñ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: passages } = passageIds.length > 0
    ? await supabase
        .from('hi_naesin_passages')
        .select('id, title, grade')
        .in('id', passageIds)
    : { data: [] };
  const passageMap = new Map((passages ?? []).map((p) => [p.id, p]));

  // ?Ä?Ä 5. Î∞∞Ï†ï ?ÑÌô© ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: assignments } = await supabase
    .from('hi_naesin_assignments')
    .select('id, status')
    .eq('student_id', user.id);

  const totalAssigned   = (assignments ?? []).length;
  const doneAssigned    = (assignments ?? []).filter((a) => a.status === 'submitted').length;

  // ?Ä?Ä 6. text_ordering ?ïÎãµÎ•??Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: variantAnswers } = submittedIds.length > 0
    ? await supabase
        .from('hi_naesin_variant_answers')
        .select('is_correct, question_id, selected_order, session_id')
        .in('session_id', submittedIds)
    : { data: [] };

  const { data: variantQuestions } = (variantAnswers ?? []).length > 0
    ? await supabase
        .from('hi_naesin_variant_questions')
        .select('id, question_type, payload')
        .in('id', [...new Set((variantAnswers ?? []).map((a) => a.question_id))])
    : { data: [] };

  const vqMap     = new Map((variantQuestions ?? []).map((q) => [q.id, q]));
  const orderAnswers = (variantAnswers ?? []).filter(
    (a) => vqMap.get(a.question_id)?.question_type === 'text_ordering'
  );
  const orderCorrect = orderAnswers.filter((a) => a.is_correct).length;

  // ?Ä?Ä ÏßëÍ≥Ñ: ?úÎ¶¥ ?Ä?ÖÎ≥Ñ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  type TypeStat = { correct: number; total: number; scoreSum: number; scoreCount: number };
  const typeStats: Record<string, TypeStat> = {};

  for (const r of responses ?? []) {
    const d = drillMap.get(r.drill_id);
    if (!d) continue;
    const t = d.drill_type as string;
    if (!typeStats[t]) typeStats[t] = { correct: 0, total: 0, scoreSum: 0, scoreCount: 0 };
    typeStats[t].total++;
    if (r.is_correct === true)  typeStats[t].correct++;
    if (r.score_pct != null) {
      typeStats[t].scoreSum   += r.score_pct;
      typeStats[t].scoreCount++;
    }
  }

  // ?Ä?Ä ÏßëÍ≥Ñ: Ï∑®ÏïΩ Î¨∏Î≤ï Ïπ¥ÌÖåÍ≥†Î¶¨ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const grammarWrong: Record<string, number> = {};
  for (const r of responses ?? []) {
    if (r.is_correct !== false) continue;
    const d = drillMap.get(r.drill_id);
    if (!d || d.drill_type !== 'grammar_choice') continue;
    const cat = (d.payload as Record<string, unknown>)?.grammarCategory as string | undefined;
    if (cat) grammarWrong[cat] = (grammarWrong[cat] ?? 0) + 1;
  }
  const weakGrammar = Object.entries(grammarWrong)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ?Ä?Ä ÏßëÍ≥Ñ: ÏßÄÎ¨∏Î≥Ñ ?ôÏ????Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  // passage_id ??{ type ??{ correct, total, scoreSum, scoreCount } }
  type PassageStat = Record<string, TypeStat>;
  const passageStats: Record<string, PassageStat> = {};

  for (const r of responses ?? []) {
    const d = drillMap.get(r.drill_id);
    if (!d) continue;
    const pid = d.passage_id as string;
    const t   = d.drill_type as string;
    if (!passageStats[pid]) passageStats[pid] = {};
    if (!passageStats[pid][t]) passageStats[pid][t] = { correct: 0, total: 0, scoreSum: 0, scoreCount: 0 };
    passageStats[pid][t].total++;
    if (r.is_correct === true) passageStats[pid][t].correct++;
    if (r.score_pct != null) {
      passageStats[pid][t].scoreSum   += r.score_pct;
      passageStats[pid][t].scoreCount++;
    }
  }

  // ?ôÏ???= Î≤àÏó≠ 0.3 + ?ëÎ¨∏ 0.4 + ÎπàÏπ∏ 0.3 (?ÜÎäî ?Ä?ÖÏ? ?úÏô∏ ???¨Í?Ï§?
  function calcMastery(ps: PassageStat): number {
    type W = { key: string; weight: number };
    const weights: W[] = [
      { key: 'translation', weight: 0.3 },
      { key: 'writing',     weight: 0.4 },
      { key: 'fill_blank',  weight: 0.3 },
    ];
    let sum = 0; let totalW = 0;
    for (const { key, weight } of weights) {
      const s = ps[key];
      if (!s || s.total === 0) continue;
      const score = (s.scoreCount > 0)
        ? s.scoreSum / s.scoreCount
        : (s.correct / s.total) * 100;
      sum    += score * weight;
      totalW += weight;
    }
    return totalW === 0 ? 0 : Math.round(sum / totalW);
  }

  const passageMastery = passageIds
    .map((pid) => ({
      passage: passageMap.get(pid),
      mastery: calcMastery(passageStats[pid] ?? {}),
    }))
    .filter((x) => x.passage)
    .sort((a, b) => a.mastery - b.mastery); // ??? ??(Ï∑®ÏïΩ??Í≤?Î®ºÏ?)

  // ?Ä?Ä ?îÏïΩ Ïπ¥Îìú Í≥ÑÏÇ∞ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const totalResponses  = (responses ?? []).length;
  const correctAll      = (responses ?? []).filter((r) => r.is_correct === true).length;
  const overallAccuracy = pct(correctAll, totalResponses);

  const writingStat = typeStats['writing'];
  const writingAvg  = writingStat && writingStat.scoreCount > 0
    ? Math.round(writingStat.scoreSum / writingStat.scoreCount)
    : null;

  const DRILL_TYPE_LABELS: Record<string, string> = {
    translation:    'Î≤àÏó≠ (?¥ÏÑù)',
    writing:        '?ëÎ¨∏',
    fill_blank:     'ÎπàÏπ∏',
    vocab:          '?®Ïñ¥',
    grammar_choice: 'Î¨∏Î≤ï Í≥†Î•¥Í∏?,
  };

  return (
    <main className="mx-auto space-y-6 pb-8 max-w-2xl">
      {/* ?§Îçî */}
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-400">
            <Link href="/hi-naesin" className="hover:underline">?¥Ïã† Drill</Link> / ?ôÏäµ ?ÑÌô©
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mt-0.5">???ôÏäµ ?ÑÌô©</h1>
        </div>
        <Link
          href="/hi-naesin/review"
          className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
        >
          ÏßÅÏ†Ñ?ïÎ¶¨ ??        </Link>
      </header>

      {/* ?Ä?Ä ?îÏïΩ Ïπ¥Îìú ?Ä?Ä */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="?ÑÎ£å ÏßÄÎ¨? value={`${passageIds.length}Í∞?} />
        <StatCard label="?ÑÏ≤¥ ?ïÎãµÎ•? value={overallAccuracy != null ? `${overallAccuracy}%` : '??} />
        <StatCard
          label="Î∞∞Ï†ï ?ÑÎ£å??
          value={totalAssigned > 0 ? `${doneAssigned}/${totalAssigned}` : '??}
          sub={totalAssigned > 0 ? `${Math.round((doneAssigned / totalAssigned) * 100)}%` : undefined}
        />
        <StatCard label="?ëÎ¨∏ ?âÍ∑†" value={writingAvg != null ? `${writingAvg}?? : '??} />
      </div>

      {/* ?Ä?Ä ?úÎ¶¥ ?Ä?ÖÎ≥Ñ + Ï∑®ÏïΩ Î¨∏Î≤ï ?Ä?Ä */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* ?úÎ¶¥ ?Ä?ÖÎ≥Ñ */}
        <section className="rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-800">?úÎ¶¥ ?Ä?ÖÎ≥Ñ ?ïÎãµÎ•?/h2>
          {Object.entries(DRILL_TYPE_LABELS).map(([type, label]) => {
            const s = typeStats[type];
            if (!s || s.total === 0) return null;
            const isScore  = type === 'translation' || type === 'writing';
            const display  = isScore && s.scoreCount > 0
              ? Math.round(s.scoreSum / s.scoreCount)
              : pct(s.correct, s.total);
            if (display == null) return null;
            const bar = Math.min(display, 100);
            const barColor = display >= 80 ? 'bg-emerald-500' : display >= 60 ? 'bg-amber-400' : 'bg-red-400';
            return (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">{label}</span>
                  <span className="font-semibold text-neutral-700">
                    {display}{isScore && s.scoreCount > 0 ? '?? : '%'}
                    <span className="ml-1 text-neutral-400 font-normal">({s.total}Î¨∏Ï†ú)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100">
                  <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${bar}%` }} />
                </div>
              </div>
            );
          })}
          {Object.keys(typeStats).length === 0 && (
            <p className="text-xs text-neutral-400">?ÑÏßÅ ?ÑÎ£å???úÎ¶¥???ÜÏäµ?àÎã§.</p>
          )}
        </section>

        {/* Ï∑®ÏïΩ Î¨∏Î≤ï */}
        <section className="rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-800">Ï∑®ÏïΩ Î¨∏Î≤ï Ïπ¥ÌÖåÍ≥†Î¶¨</h2>
          {weakGrammar.length === 0 ? (
            <p className="text-xs text-neutral-400">Î¨∏Î≤ï ?§Îãµ???ÜÏäµ?àÎã§ ?ëç</p>
          ) : (
            weakGrammar.map(([cat, count]) => {
              const maxCount = weakGrammar[0][1];
              const bar = Math.round((count / maxCount) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-600">{cat}</span>
                    <span className="font-semibold text-red-500">{count}???§Îãµ</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-red-400 transition-all" style={{ width: `${bar}%` }} />
                  </div>
                </div>
              );
            })
          )}

          {/* ?úÏÑú ?åÏïÖ */}
          {orderAnswers.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <h3 className="text-xs font-semibold text-neutral-600">?? ?úÏÑú ?åÏïÖ</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">text ordering ?ïÎãµÎ•?/span>
                  <span className="font-semibold text-neutral-700">
                    {orderCorrect}/{orderAnswers.length}
                    {' '}({pct(orderCorrect, orderAnswers.length)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100">
                  <div
                    className={`h-2 rounded-full ${pct(orderCorrect, orderAnswers.length)! >= 70 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${pct(orderCorrect, orderAnswers.length)}%` }}
                  />
                </div>
                {/* ?ÄÎ¶??úÏÑú ?®ÌÑ¥ */}
                {orderAnswers.filter((a) => !a.is_correct).slice(0, 3).map((a) => {
                  const q = vqMap.get(a.question_id);
                  const correctOrder = (q?.payload as Record<string, unknown>)?.correctOrder as string[] | undefined;
                  if (!correctOrder || !a.selected_order) return null;
                  return (
                    <p key={a.question_id} className="text-[11px] text-neutral-400">
                      ????{a.selected_order.join('??)} ¬∑ ?ïÎãµ {correctOrder.join('??)}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ?Ä?Ä AI ?ΩÏ†ê Î∂ÑÏÑù ?Ä?Ä */}
      <WeaknessAnalysisClient />

      {/* ?Ä?Ä ÏßÄÎ¨∏Î≥Ñ ?ôÏ????Ä?Ä */}
      {passageMastery.length > 0 && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-800">?ìñ ÏßÄÎ¨∏Î≥Ñ ?ôÏ???/h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {passageMastery.map(({ passage, mastery }) => {
              const lv = masteryLevel(mastery);
              return (
                <div key={passage!.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={`/hi-naesin/review?passage=${passage!.id}`}
                      className="truncate font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                    >
                      {passage!.title ?? '(ÏßÄÎ¨?'}
                    </Link>
                    <span className={`ml-3 shrink-0 font-semibold ${lv.color}`}>
                      {mastery}% {lv.label}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-neutral-100">
                    <div
                      className={`h-2.5 rounded-full transition-all ${lv.bg}`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ?Ä?Ä ÏµúÍ∑º ?ôÏäµ Í∏∞Î°ù ?Ä?Ä */}
      {submittedSessions.length > 0 && (
        <section className="rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-800">ÏµúÍ∑º ?ôÏäµ Í∏∞Î°ù</h2>
          <div className="divide-y">
            {submittedSessions
              .sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''))
              .slice(0, 8)
              .map((s) => {
                const p = passageMap.get(s.passage_id);
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-neutral-800">{p?.title ?? '(ÏßÄÎ¨?'}</p>
                      <p className="text-xs text-neutral-400">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('ko-KR') : ''}
                      </p>
                    </div>
                    <Link
                      href={`/hi-naesin/drill/${s.id}/complete`}
                      className="ml-4 shrink-0 rounded-xl border px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-50"
                    >
                      Í≤∞Í≥º Î≥¥Í∏∞
                    </Link>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {submittedSessions.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-neutral-400">
          ?ÑÎ£å???úÎ¶¥???ÜÏäµ?àÎã§.{' '}
          <Link href="/hi-naesin" className="underline">?úÎ¶¥ ?úÏûë?òÍ∏∞</Link>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-800">{value}</p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}
