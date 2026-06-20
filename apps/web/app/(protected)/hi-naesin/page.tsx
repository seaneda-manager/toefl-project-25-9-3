import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { HI_NAESIN_DRILL_TYPES, sourceTypeLabel } from '@/models/hi-naesin';
import type { HiNaesinDrillType, HiNaesinSourceType } from '@/models/hi-naesin';
import { startHiNaesinDrillSessionAction } from './passages/actions';
import SectionGuide from '@/app/components/SectionGuide';

export const dynamic = 'force-dynamic';

// ?Ä?Ä ?úÎ¶¥ ?Ä???úÏãú ?úÏÑú & ?ºÎ≤® (Í≥†Îì±?? ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
const DRILL_COLS: { type: HiNaesinDrillType; label: string; short: string }[] = [
  { type: 'vocab',          label: '?®Ïñ¥',   short: '?®Ïñ¥' },
  { type: 'translation',    label: '?¥ÏÑù',   short: '?¥ÏÑù' },
  { type: 'writing',        label: '?ëÎ¨∏',   short: '?ëÎ¨∏' },
  { type: 'fill_blank',     label: 'ÎπàÏπ∏',   short: 'ÎπàÏπ∏' },
  { type: 'grammar_choice', label: 'Î¨∏Î≤ï',   short: 'Î¨∏Î≤ï' },
  { type: 'summary',        label: '?îÏïΩ',   short: '?îÏïΩ' },
];

type CellStatus = 'done' | 'partial' | 'empty' | 'none'; // none = ?¥Îãπ ?úÎ¶¥ ?ÜÏùå

type PassageProgress = {
  passageId:     string;
  title:         string;
  sourceType:    HiNaesinSourceType | string;
  grade:         string;
  sessionId:     string | null;
  sessionStatus: string | null;
  cols: Record<HiNaesinDrillType, {
    status:   CellStatus;
    total:    number;
    answered: number;
  }>;
  totalDone:   number;
  totalDrills: number;
};

// Ï∂úÏ≤òÎ≥?Í∑∏Î£π ?úÏÑú
const SOURCE_ORDER: string[] = ['mock_exam', 'textbook', 'external_book'];

const SOURCE_BADGE: Record<string, string> = {
  mock_exam:     'border-sky-200 bg-sky-50 text-sky-700',
  textbook:      'border-emerald-200 bg-emerald-50 text-emerald-700',
  external_book: 'border-violet-200 bg-violet-50 text-violet-700',
};

export default async function HiNaesinDashboard() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // ?Ä?Ä 1. ?úÌóò ?ºÏ†ï (Í∞Ä??Í∞ÄÍπåÏö¥ ?§Ïùå ?úÌóò) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const today = new Date().toISOString().slice(0, 10);
  const { data: examRows } = await supabase
    .from('naesin_exam_schedule')
    .select('id, exam_name, exam_date, school')
    .eq('student_id', user.id)
    .gte('exam_date', today)
    .order('exam_date', { ascending: true })
    .limit(3);

  const nextExam = examRows?.[0] ?? null;
  const dDay = nextExam
    ? Math.ceil(
        (new Date(nextExam.exam_date).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24),
      )
    : null;

  // ?Ä?Ä 2. Î∞∞Ï†ï??ÏßÄÎ¨??Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: assignments } = await supabase
    .from('hi_naesin_assignments')
    .select('passage_id, due_at')
    .eq('student_id', user.id);

  const assignedIds = [...new Set((assignments ?? []).map((a: any) => a.passage_id as string))];
  if (assignedIds.length === 0) {
    return <EmptyState />;
  }

  // ?Ä?Ä 3. ÏßÄÎ¨?Í∏∞Î≥∏ ?ïÎ≥¥ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: passages } = await supabase
    .from('hi_naesin_passages')
    .select('id, title, source_type, grade, school_name, textbook_name, unit_label, exam_year, exam_month, question_number')
    .in('id', assignedIds);

  const passageMap = new Map((passages ?? []).map((p: any) => [p.id as string, p]));

  // ?Ä?Ä 4. ?úÎ¶¥ Î™©Î°ù (passage_id + drill_type + id) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: drills } = await supabase
    .from('hi_naesin_drills')
    .select('id, passage_id, drill_type')
    .in('passage_id', assignedIds)
    .eq('is_published', true);

  // drillId ??{passageId, drillType}
  const drillMeta = new Map(
    (drills ?? []).map((d: any) => [d.id as string, {
      passageId: d.passage_id as string,
      drillType: d.drill_type as HiNaesinDrillType,
    }])
  );
  const drillIds = [...drillMeta.keys()];

  // passageId ??drillType ??count
  const drillCount: Record<string, Record<string, number>> = {};
  for (const d of drills ?? []) {
    const pid = (d as any).passage_id as string;
    const dt  = (d as any).drill_type as string;
    if (!drillCount[pid]) drillCount[pid] = {};
    drillCount[pid][dt] = (drillCount[pid][dt] ?? 0) + 1;
  }

  // ?Ä?Ä 5. ?ôÏÉù ?ëÎãµ (?¥Îãπ ?úÎ¶¥???Ä?? ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: responses } = drillIds.length > 0
    ? await supabase
        .from('hi_naesin_drill_responses')
        .select('drill_id')
        .eq('student_id', user.id)
        .in('drill_id', drillIds)
    : { data: [] };

  // passageId ??drillType ???ëÎãµ ??  const answeredCount: Record<string, Record<string, number>> = {};
  for (const r of responses ?? []) {
    const meta = drillMeta.get((r as any).drill_id as string);
    if (!meta) continue;
    const { passageId, drillType } = meta;
    if (!answeredCount[passageId]) answeredCount[passageId] = {};
    answeredCount[passageId][drillType] =
      (answeredCount[passageId][drillType] ?? 0) + 1;
  }

  // ?Ä?Ä 6. ?∏ÏÖò ?ïÎ≥¥ (?¥Ïñ¥?òÍ∏∞?? ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const { data: sessions } = await supabase
    .from('hi_naesin_sessions')
    .select('id, passage_id, status')
    .eq('student_id', user.id)
    .in('passage_id', assignedIds)
    .order('started_at', { ascending: false });

  // ÏßÄÎ¨∏Î≥Ñ Í∞Ä??ÏµúÍ∑º ?∏ÏÖò
  const sessionMap = new Map<string, { id: string; status: string }>();
  for (const s of sessions ?? []) {
    if (!sessionMap.has((s as any).passage_id)) {
      sessionMap.set((s as any).passage_id, {
        id:     (s as any).id,
        status: (s as any).status,
      });
    }
  }

  // ?Ä?Ä 7. PassageProgress Ï°∞Ìï© ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const progressList: PassageProgress[] = assignedIds.map((pid) => {
    const passage   = passageMap.get(pid) as any;
    const session   = sessionMap.get(pid) ?? null;

    const cols = {} as PassageProgress['cols'];
    let totalDone   = 0;
    let totalDrills = 0;

    for (const col of DRILL_COLS) {
      const total    = drillCount[pid]?.[col.type] ?? 0;
      const answered = answeredCount[pid]?.[col.type] ?? 0;

      totalDrills += total;
      totalDone   += Math.min(answered, total);

      cols[col.type] = {
        total,
        answered,
        status: total === 0     ? 'none'
               : answered === 0  ? 'empty'
               : answered >= total ? 'done'
               : 'partial',
      };
    }

    return {
      passageId:     pid,
      title:         passage?.title ?? '(ÏßÄÎ¨?',
      sourceType:    passage?.source_type ?? 'external_book',
      grade:         passage?.grade ?? '',
      sessionId:     session?.id ?? null,
      sessionStatus: session?.status ?? null,
      cols,
      totalDone,
      totalDrills,
    };
  });

  // Ï∂úÏ≤òÎ≥?Í∑∏Î£π??  const grouped = SOURCE_ORDER.map((src) => ({
    sourceType: src,
    items: progressList.filter((p) => p.sourceType === src),
  })).filter((g) => g.items.length > 0);

  // Î∂ÑÎ•ò ????Í≤ÉÎèÑ ?¨Ìï®
  const knownSources = new Set(SOURCE_ORDER);
  const otherItems = progressList.filter((p) => !knownSources.has(p.sourceType));
  if (otherItems.length > 0) {
    grouped.push({ sourceType: 'external_book', items: otherItems });
  }

  // ?Ä?Ä 8. "?¥Ïñ¥?òÍ∏∞" ?ÄÍ≤???Ï≤?Î≤àÏß∏ ÎØ∏ÏôÑ??ÏßÄÎ¨??Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
  const nextPassage =
    progressList.find(
      (p) => p.totalDrills > 0 && p.totalDone < p.totalDrills
    ) ?? null;

  // ?ÑÏ≤¥ ?ÑÏ£º ?¨Î?
  const allDone = progressList.every(
    (p) => p.totalDrills === 0 || p.totalDone >= p.totalDrills
  );

  return (
    <main className="mx-auto space-y-6 pb-8 max-w-4xl">

      <SectionGuide
        storageKey="guide-seen-hi-naesin"
        color="emerald"
        icon="?ìñ"
        title="Í≥†Îì± ?¥Ïã†"
        tagline="Î∞∞Ï†ï??ÍµêÍ≥º??ÏßÄÎ¨∏ÏùÑ 6Í∞ÄÏßÄ ?úÎ¶¥Î°?Î∞òÎ≥µ???úÌóò??Ï§ÄÎπÑÌï©?àÎã§."
        outcomes={[
          'ÍµêÍ≥º??ÏßÄÎ¨∏Ïùò ?®Ïñ¥¬∑?¥ÏÑù¬∑?ëÎ¨∏¬∑ÎπàÏπ∏¬∑Î¨∏Î≤ï¬∑?îÏïΩ???úÎ¶¥Î°??ÑÏ†Ñ???åÌôî?????àÎã§',
          '?úÌóò Ï∂úÏ†ú ?®ÌÑ¥??ÎßûÏ∂ò ?úÌòÑ???ïÌôï???îÍ∏∞???úÏà†?ï¬∑ÎπàÏπ?Î¨∏Ï†ú??Î∞îÎ°ú ?????àÎã§',
          'D-DayÍπåÏ? Ï≤¥Í≥Ñ?ÅÏúºÎ°?Î∞òÎ≥µ???úÌóò ?πÏùº ?êÏã†?àÍ≤å ?ÑÌï† ???àÎã§',
        ]}
        steps={[
          { icon: '?ìã', title: 'ÏßÄÎ¨?Î∞∞Ï†ï', desc: '?†ÏÉù?òÏù¥ Î∞∞Ï†ï??ÏßÄÎ¨∏Ïù¥ ?ÑÎûò ?úÏóê ?òÌ??©Îãà?? ÍµêÍ≥º?ú¬∑Î™®?òÍ≥†??∑Ïô∏Î∂Ä Ï∂úÏ≤òÎ≥ÑÎ°ú Î¨∂Ïó¨ ?àÏñ¥??' },
          { icon: '?∂Ô∏è', title: '?úÎ¶¥ ?úÏÑú', desc: '?®Ïñ¥ ???¥ÏÑù ???ëÎ¨∏ ??ÎπàÏπ∏ ??Î¨∏Î≤ï ???îÏïΩ ?úÏúºÎ°?ÏßÑÌñâ?©Îãà?? Ï§ëÍ∞Ñ???òÍ???ÏßÑÎèÑÍ∞Ä ?Ä?•Îê©?àÎã§.' },
          { icon: '?îÑ', title: 'Î∞òÎ≥µ ?ôÏäµ', desc: '1?åÏ†Ñ ?ÑÏ£º ??2?åÏ†Ñ??Î∞òÎ≥µ?†ÏàòÎ°?Í∏∞Ïñµ??Íµ≥Ïñ¥ÏßëÎãà??' },
        ]}
        progress={
          progressList.reduce((s, p) => s + p.totalDrills, 0) > 0
            ? {
                done:  progressList.reduce((s, p) => s + p.totalDone, 0),
                total: progressList.reduce((s, p) => s + p.totalDrills, 0),
                unit:  '?úÎ¶¥',
              }
            : undefined
        }
        nextAction={
          nextPassage
            ? {
                label: nextPassage.sessionStatus === 'started' ? `"${nextPassage.title}" ?¥Ïñ¥?òÍ∏∞` : `"${nextPassage.title}" ?úÏûë?òÍ∏∞`,
                href: '#drill-table',
              }
            : undefined
        }
      />

      {/* ?Ä?Ä ?ÅÎã®: D-Day + ?¥Ïñ¥?òÍ∏∞ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start max-w-3xl">

        {/* D-Day Ïπ¥Îìú */}
        {nextExam && (
          <div className={[
            'rounded-2xl border p-4 sm:w-52 shrink-0',
            dDay !== null && dDay <= 3
              ? 'border-red-200 bg-red-50'
              : dDay !== null && dDay <= 7
              ? 'border-amber-200 bg-amber-50'
              : 'border-emerald-200 bg-emerald-50',
          ].join(' ')}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              ?úÌóòÍπåÏ?
            </p>
            <p className={[
              'text-4xl font-black mt-0.5',
              dDay !== null && dDay <= 3 ? 'text-red-600'
              : dDay !== null && dDay <= 7 ? 'text-amber-600'
              : 'text-emerald-600',
            ].join(' ')}>
              D-{dDay}
            </p>
            <p className="text-xs text-neutral-600 mt-1 font-medium">
              {nextExam.exam_name}
            </p>
            {nextExam.school && (
              <p className="text-[11px] text-neutral-400">{nextExam.school}</p>
            )}
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {new Date(nextExam.exam_date).toLocaleDateString('ko-KR', {
                month: 'long', day: 'numeric', weekday: 'short',
              })}
            </p>
            {examRows && examRows.length > 1 && (
              <p className="text-[11px] text-neutral-400 mt-1">
                +{examRows.length - 1}Í∞??ºÏ†ï ??              </p>
            )}
          </div>
        )}

        {/* ?¥Ïñ¥?òÍ∏∞ / ?ÑÏ£º Ïπ¥Îìú */}
        <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Í≥†Îì± ?¥Ïã† Ï§ÄÎπ?/h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Î∞∞Ï†ï??ÏßÄÎ¨?{assignedIds.length}Í∞?¬∑{' '}
              {progressList.reduce((s, p) => s + p.totalDone, 0)} /{' '}
              {progressList.reduce((s, p) => s + p.totalDrills, 0)} ?úÎ¶¥ ?ÑÎ£å
            </p>
          </div>

          {/* ?ÑÏ≤¥ ÏßÑÎèÑ Î∞?*/}
          {(() => {
            const total = progressList.reduce((s, p) => s + p.totalDrills, 0);
            const done  = progressList.reduce((s, p) => s + p.totalDone,   0);
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>1?åÏ†Ñ ÏßÑÎèÑ</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-neutral-100">
                  <div
                    className="h-2.5 rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {allDone ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 text-center">
              ?éâ 1?åÏ†Ñ ?ÑÏ£º! 2?åÏ†Ñ Î∞òÎ≥µ???úÏûë?òÏÑ∏??
            </div>
          ) : nextPassage ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-neutral-400">?§Ïùå ?ôÏäµ</p>
                <p className="text-sm font-semibold text-neutral-800 truncate">
                  {nextPassage.title}
                </p>
              </div>
              <form action={startHiNaesinDrillSessionAction} className="shrink-0">
                <input type="hidden" name="passage_id" value={nextPassage.passageId} />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {nextPassage.sessionStatus === 'started' ? '?¥Ïñ¥?òÍ∏∞ ?? : '?úÏûë?òÍ∏∞ ??}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {/* ?Ä?Ä ÏßÑÎèÑ Î™©Î°ù ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */}
      <section id="drill-table" className="space-y-6">
        {grouped.map(({ sourceType: src, items }) => (
          <div key={src} className="space-y-3">
            {/* Ï∂úÏ≤ò Í∑∏Î£π ?§Îçî */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${SOURCE_BADGE[src] ?? SOURCE_BADGE.external_book}`}>
                {sourceTypeLabel(src as HiNaesinSourceType)}
              </span>
              <span className="text-[11px] text-neutral-400">{items.length}Í∞?ÏßÄÎ¨?/span>
            </div>

            {/* Ïπ¥Îìú Í∑∏Î¶¨??*/}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((p) => {
                const pct = p.totalDrills > 0
                  ? Math.round((p.totalDone / p.totalDrills) * 100)
                  : 0;
                const isAllDone = p.totalDrills > 0 && p.totalDone >= p.totalDrills;

                const displayTitle = p.title.replace(/^\d{4}-\d{1,2}-\d{1,2}\s+\d+\s*/, '');
                const gradeLabel = p.grade === 'H1' ? 'Í≥?' : p.grade === 'H2' ? 'Í≥?' : p.grade === 'H3' ? 'Í≥?'
                  : p.grade === 'M1' ? 'Ï§?' : p.grade === 'M2' ? 'Ï§?' : p.grade === 'M3' ? 'Ï§?' : '';

                const btnLabel = isAllDone ? '?§Ïãú ?òÍ∏∞'
                  : p.sessionStatus === 'started' ? '?¥Ïñ¥?òÍ∏∞ ??
                  : p.totalDone > 0 ? 'Í≥ÑÏÜç?òÍ∏∞ ??
                  : '?úÏûë?òÍ∏∞ ??;

                return (
                  <div
                    key={p.passageId}
                    className={[
                      'flex flex-col rounded-2xl border bg-white p-5 gap-3 transition',
                      isAllDone ? 'opacity-50' : 'hover:border-neutral-300 hover:shadow-sm',
                    ].join(' ')}
                  >
                    {/* ?ÅÎã®: Î©îÌ? + Î≤ÑÌäº */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {gradeLabel && (
                          <span className="text-[11px] font-semibold text-neutral-400">{gradeLabel}</span>
                        )}
                        {isAllDone && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">?ÑÎ£å</span>
                        )}
                      </div>
                      <form action={startHiNaesinDrillSessionAction} className="shrink-0">
                        <input type="hidden" name="passage_id" value={p.passageId} />
                        <button
                          type="submit"
                          className={[
                            'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition',
                            isAllDone
                              ? 'border border-neutral-200 text-neutral-400 hover:bg-neutral-50'
                              : p.sessionStatus === 'started'
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : p.totalDone > 0
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-neutral-900 text-white hover:bg-neutral-800',
                          ].join(' ')}
                        >
                          {btnLabel}
                        </button>
                      </form>
                    </div>

                    {/* ?úÎ™© */}
                    <p className="text-sm font-semibold leading-snug text-neutral-800 flex-1">
                      {displayTitle}
                    </p>

                    {/* ?úÎ¶¥ Ïπ?*/}
                    <div className="flex flex-wrap gap-1">
                      {DRILL_COLS.map((col) => {
                        const cell = p.cols[col.type];
                        if (cell.status === 'none') return null;
                        return (
                          <span
                            key={col.type}
                            className={[
                              'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                              cell.status === 'done'    ? 'bg-emerald-100 text-emerald-700' :
                              cell.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                              'bg-neutral-100 text-neutral-400',
                            ].join(' ')}
                          >
                            {col.short}{cell.status === 'done' ? ' ?? : cell.status === 'partial' ? ` ${cell.answered}/${cell.total}` : ''}
                          </span>
                        );
                      })}
                    </div>

                    {/* ÏßÑÎèÑ Î∞?*/}
                    {p.totalDrills > 0 && (
                      <div className="space-y-1">
                        <div className="h-1 w-full rounded-full bg-neutral-100">
                          <div
                            className={`h-1 rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className={[
                          'text-[10px] text-right',
                          pct === 100 ? 'text-emerald-500 font-semibold' : pct > 0 ? 'text-amber-500' : 'text-neutral-300',
                        ].join(' ')}>
                          {pct > 0 ? `${pct}%` : 'ÎØ∏Ïãú??}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ?Ä?Ä ?òÎã® ÎßÅÌÅ¨ ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/hi-naesin/vocab"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          ?ìö ?¥Ïã† ?®Ïñ¥ ?ÑÏ≤¥
        </Link>
        <Link
          href="/hi-naesin/stats"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          ?ìä ?ôÏäµ ?ÑÌô©
        </Link>
        <Link
          href="/hi-naesin/review"
          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs text-violet-700 hover:bg-violet-100"
        >
          ÏßÅÏ†Ñ?ïÎ¶¨
        </Link>
      </div>
    </main>
  );
}


// ?Ä?Ä Î∞∞Ï†ï ?ÜÏùÑ ???Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
function EmptyState() {
  return (
    <main className="mx-auto space-y-6 pb-8 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Í≥†Îì± ?¥Ïã† Ï§ÄÎπ?/h1>
      </header>
      <div className="rounded-2xl border border-dashed p-12 text-center space-y-2">
        <p className="text-sm text-neutral-400">Î∞∞Ï†ï??ÏßÄÎ¨∏Ïù¥ ?ÜÏäµ?àÎã§.</p>
        <p className="text-xs text-neutral-300">?†ÏÉù?òÏù¥ ÏßÄÎ¨∏ÏùÑ Î∞∞Ï†ï?òÎ©¥ ?úÎ¶¥???úÏûë?©Îãà??</p>
      </div>
    </main>
  );
}
