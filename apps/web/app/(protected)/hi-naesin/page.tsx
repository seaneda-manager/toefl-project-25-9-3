import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { HI_NAESIN_DRILL_TYPES, sourceTypeLabel } from '@/models/hi-naesin';
import type { HiNaesinDrillType, HiNaesinSourceType } from '@/models/hi-naesin';
import { startHiNaesinDrillSessionAction } from './passages/actions';
import SectionGuide from '@/app/components/SectionGuide';

export const dynamic = 'force-dynamic';

// ── 드릴 타입 표시 순서 & 라벨 (고등용) ─────────────────────
const DRILL_COLS: { type: HiNaesinDrillType; label: string; short: string }[] = [
  { type: 'vocab',          label: '단어',   short: '단어' },
  { type: 'translation',    label: '해석',   short: '해석' },
  { type: 'writing',        label: '작문',   short: '작문' },
  { type: 'fill_blank',     label: '빈칸',   short: '빈칸' },
  { type: 'grammar_choice', label: '문법',   short: '문법' },
  { type: 'summary',        label: '요약',   short: '요약' },
];

type CellStatus = 'done' | 'partial' | 'empty' | 'none'; // none = 해당 드릴 없음

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

// 출처별 그룹 순서
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

  // ── 1. 시험 일정 (가장 가까운 다음 시험) ─────────────────
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

  // ── 2. 배정된 지문 ────────────────────────────────────────
  const { data: assignments } = await supabase
    .from('hi_naesin_assignments')
    .select('passage_id, due_at')
    .eq('student_id', user.id);

  const assignedIds = [...new Set((assignments ?? []).map((a: any) => a.passage_id as string))];
  if (assignedIds.length === 0) {
    return <EmptyState />;
  }

  // ── 3. 지문 기본 정보 ─────────────────────────────────────
  const { data: passages } = await supabase
    .from('hi_naesin_passages')
    .select('id, title, source_type, grade, school_name, textbook_name, unit_label, exam_year, exam_month, question_number')
    .in('id', assignedIds);

  const passageMap = new Map((passages ?? []).map((p: any) => [p.id as string, p]));

  // ── 4. 드릴 목록 (passage_id + drill_type + id) ───────────
  const { data: drills } = await supabase
    .from('hi_naesin_drills')
    .select('id, passage_id, drill_type')
    .in('passage_id', assignedIds)
    .eq('is_published', true);

  // drillId → {passageId, drillType}
  const drillMeta = new Map(
    (drills ?? []).map((d: any) => [d.id as string, {
      passageId: d.passage_id as string,
      drillType: d.drill_type as HiNaesinDrillType,
    }])
  );
  const drillIds = [...drillMeta.keys()];

  // passageId → drillType → count
  const drillCount: Record<string, Record<string, number>> = {};
  for (const d of drills ?? []) {
    const pid = (d as any).passage_id as string;
    const dt  = (d as any).drill_type as string;
    if (!drillCount[pid]) drillCount[pid] = {};
    drillCount[pid][dt] = (drillCount[pid][dt] ?? 0) + 1;
  }

  // ── 5. 학생 응답 (해당 드릴에 대한) ──────────────────────
  const { data: responses } = drillIds.length > 0
    ? await supabase
        .from('hi_naesin_drill_responses')
        .select('drill_id')
        .eq('student_id', user.id)
        .in('drill_id', drillIds)
    : { data: [] };

  // passageId → drillType → 응답 수
  const answeredCount: Record<string, Record<string, number>> = {};
  for (const r of responses ?? []) {
    const meta = drillMeta.get((r as any).drill_id as string);
    if (!meta) continue;
    const { passageId, drillType } = meta;
    if (!answeredCount[passageId]) answeredCount[passageId] = {};
    answeredCount[passageId][drillType] =
      (answeredCount[passageId][drillType] ?? 0) + 1;
  }

  // ── 6. 세션 정보 (이어하기용) ────────────────────────────
  const { data: sessions } = await supabase
    .from('hi_naesin_sessions')
    .select('id, passage_id, status')
    .eq('student_id', user.id)
    .in('passage_id', assignedIds)
    .order('started_at', { ascending: false });

  // 지문별 가장 최근 세션
  const sessionMap = new Map<string, { id: string; status: string }>();
  for (const s of sessions ?? []) {
    if (!sessionMap.has((s as any).passage_id)) {
      sessionMap.set((s as any).passage_id, {
        id:     (s as any).id,
        status: (s as any).status,
      });
    }
  }

  // ── 7. PassageProgress 조합 ───────────────────────────────
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
      title:         passage?.title ?? '(지문)',
      sourceType:    passage?.source_type ?? 'external_book',
      grade:         passage?.grade ?? '',
      sessionId:     session?.id ?? null,
      sessionStatus: session?.status ?? null,
      cols,
      totalDone,
      totalDrills,
    };
  });

  // 출처별 그룹핑
  const grouped = SOURCE_ORDER.map((src) => ({
    sourceType: src,
    items: progressList.filter((p) => p.sourceType === src),
  })).filter((g) => g.items.length > 0);

  // 분류 안 된 것도 포함
  const knownSources = new Set(SOURCE_ORDER);
  const otherItems = progressList.filter((p) => !knownSources.has(p.sourceType));
  if (otherItems.length > 0) {
    grouped.push({ sourceType: 'external_book', items: otherItems });
  }

  // ── 8. "이어하기" 타겟 — 첫 번째 미완성 지문 ─────────────
  const nextPassage =
    progressList.find(
      (p) => p.totalDrills > 0 && p.totalDone < p.totalDrills
    ) ?? null;

  // 전체 완주 여부
  const allDone = progressList.every(
    (p) => p.totalDrills === 0 || p.totalDone >= p.totalDrills
  );

  return (
    <main className="space-y-6 pb-12">

      <SectionGuide
        storageKey="guide-seen-hi-naesin"
        color="emerald"
        icon="📖"
        title="고등 내신"
        tagline="배정된 교과서 지문을 6가지 드릴로 반복해 시험을 준비합니다."
        outcomes={[
          '교과서 지문의 단어·해석·작문·빈칸·문법·요약을 드릴로 완전히 소화할 수 있다',
          '시험 출제 패턴에 맞춘 표현을 정확히 암기해 서술형·빈칸 문제에 바로 쓸 수 있다',
          'D-Day까지 체계적으로 반복해 시험 당일 자신있게 임할 수 있다',
        ]}
        steps={[
          { icon: '📋', title: '지문 배정', desc: '선생님이 배정한 지문이 아래 표에 나타납니다. 교과서·모의고사·외부 출처별로 묶여 있어요.' },
          { icon: '▶️', title: '드릴 순서', desc: '단어 → 해석 → 작문 → 빈칸 → 문법 → 요약 순으로 진행됩니다. 중간에 나가도 진도가 저장됩니다.' },
          { icon: '🔄', title: '반복 학습', desc: '1회전 완주 후 2회전을 반복할수록 기억이 굳어집니다.' },
        ]}
        progress={
          progressList.reduce((s, p) => s + p.totalDrills, 0) > 0
            ? {
                done:  progressList.reduce((s, p) => s + p.totalDone, 0),
                total: progressList.reduce((s, p) => s + p.totalDrills, 0),
                unit:  '드릴',
              }
            : undefined
        }
        nextAction={
          nextPassage
            ? {
                label: nextPassage.sessionStatus === 'started' ? `"${nextPassage.title}" 이어하기` : `"${nextPassage.title}" 시작하기`,
                href: '#drill-table',
              }
            : undefined
        }
      />

      {/* ── 상단: D-Day + 이어하기 ─────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

        {/* D-Day 카드 */}
        {nextExam ? (
          <div className={[
            'rounded-2xl border p-4 sm:w-52 shrink-0',
            dDay !== null && dDay <= 3
              ? 'border-red-200 bg-red-50'
              : dDay !== null && dDay <= 7
              ? 'border-amber-200 bg-amber-50'
              : 'border-emerald-200 bg-emerald-50',
          ].join(' ')}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              시험까지
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
                +{examRows.length - 1}개 일정 더
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-4 sm:w-52 shrink-0 flex flex-col items-center justify-center gap-1">
            <p className="text-xs text-neutral-400">시험 날짜 미설정</p>
          </div>
        )}

        {/* 이어하기 / 완주 카드 */}
        <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">고등 내신 준비</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              배정된 지문 {assignedIds.length}개 ·{' '}
              {progressList.reduce((s, p) => s + p.totalDone, 0)} /{' '}
              {progressList.reduce((s, p) => s + p.totalDrills, 0)} 드릴 완료
            </p>
          </div>

          {/* 전체 진도 바 */}
          {(() => {
            const total = progressList.reduce((s, p) => s + p.totalDrills, 0);
            const done  = progressList.reduce((s, p) => s + p.totalDone,   0);
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>1회전 진도</span>
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
              🎉 1회전 완주! 2회전 반복을 시작하세요.
            </div>
          ) : nextPassage ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-neutral-400">다음 학습</p>
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
                  {nextPassage.sessionStatus === 'started' ? '이어하기 →' : '시작하기 →'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 진도 목록 ──────────────────────────────────────── */}
      <section id="drill-table">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-3">
          지문별 진도
        </h2>

        {/* 모바일: 카드 리스트 */}
        <div className="md:hidden space-y-3">
          {grouped.map(({ sourceType: src, items }) => (
            <div key={`m-group-${src}`} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${SOURCE_BADGE[src] ?? SOURCE_BADGE.external_book}`}>
                  {sourceTypeLabel(src as HiNaesinSourceType)}
                </span>
                <span className="text-[11px] text-neutral-400">{items.length}개</span>
              </div>
              {items.map((p) => {
                const pct = p.totalDrills > 0
                  ? Math.round((p.totalDone / p.totalDrills) * 100)
                  : 0;
                const isAllDone = p.totalDrills > 0 && p.totalDone >= p.totalDrills;
                const btnLabel = isAllDone ? '다시 하기'
                  : p.sessionStatus === 'started' ? '이어하기'
                  : p.totalDone > 0 ? '계속하기'
                  : '시작하기';

                return (
                  <div
                    key={p.passageId}
                    className={`rounded-2xl border bg-white p-4 space-y-3 ${isAllDone ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 leading-snug">{p.title}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {p.grade === 'H1' ? '고1' : p.grade === 'H2' ? '고2' : p.grade === 'H3' ? '고3' : ''}
                          {isAllDone && <span className="ml-1 text-emerald-600 font-semibold">✓ 완료</span>}
                        </p>
                      </div>
                      <form action={startHiNaesinDrillSessionAction} className="shrink-0">
                        <input type="hidden" name="passage_id" value={p.passageId} />
                        <button
                          type="submit"
                          className={[
                            'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap',
                            isAllDone
                              ? 'border border-neutral-200 text-neutral-400'
                              : p.sessionStatus === 'started'
                              ? 'bg-amber-500 text-white'
                              : p.totalDone > 0
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-900 text-white',
                          ].join(' ')}
                        >
                          {btnLabel}
                        </button>
                      </form>
                    </div>

                    {/* 드릴 타입 도트 */}
                    <div className="flex gap-1.5 flex-wrap">
                      {DRILL_COLS.map((col) => {
                        const cell = p.cols[col.type];
                        if (cell.status === 'none') return null;
                        return (
                          <span
                            key={col.type}
                            className={[
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              cell.status === 'done'    ? 'bg-emerald-100 text-emerald-700' :
                              cell.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                              'bg-neutral-100 text-neutral-400',
                            ].join(' ')}
                          >
                            {col.short}{cell.status === 'partial' ? ` ${cell.answered}/${cell.total}` : cell.status === 'done' ? ' ✓' : ''}
                          </span>
                        );
                      })}
                    </div>

                    {/* 진도 바 */}
                    {p.totalDrills > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-neutral-400">
                          <span>{p.totalDone} / {p.totalDrills} 드릴</span>
                          <span className={pct === 100 ? 'text-emerald-600 font-bold' : pct > 0 ? 'text-amber-600 font-bold' : ''}>{pct > 0 ? `${pct}%` : '—'}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-100">
                          <div
                            className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 데스크탑: 테이블 */}
        <div className="hidden md:block rounded-2xl border border-neutral-200 bg-white overflow-hidden max-w-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 min-w-[140px]">
                    지문
                  </th>
                  {DRILL_COLS.map((col) => (
                    <th
                      key={col.type}
                      className="px-3 py-3 text-center text-xs font-semibold text-neutral-500 whitespace-nowrap"
                    >
                      {col.short}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-semibold text-neutral-500">
                    진도
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ sourceType: src, items }) => (
                  <React.Fragment key={`group-${src}`}>
                    <tr className="bg-neutral-50/80">
                      <td
                        colSpan={DRILL_COLS.length + 3}
                        className="px-4 py-2"
                      >
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${SOURCE_BADGE[src] ?? SOURCE_BADGE.external_book}`}>
                          {sourceTypeLabel(src as HiNaesinSourceType)}
                        </span>
                        <span className="ml-2 text-[11px] text-neutral-400">
                          {items.length}개 지문
                        </span>
                      </td>
                    </tr>

                    {items.map((p, idx) => {
                      const pct = p.totalDrills > 0
                        ? Math.round((p.totalDone / p.totalDrills) * 100)
                        : 0;
                      const isAllDone = p.totalDrills > 0 && p.totalDone >= p.totalDrills;

                      return (
                        <tr
                          key={p.passageId}
                          className={[
                            'border-b border-neutral-50 transition',
                            idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30',
                            isAllDone ? 'opacity-60' : '',
                          ].join(' ')}
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-neutral-800 line-clamp-1 min-w-[140px] max-w-[260px]">
                              {p.title}
                            </p>
                            {p.grade && (
                              <p className="text-[11px] text-neutral-400">{p.grade === 'H1' ? '고1' : p.grade === 'H2' ? '고2' : '고3'}</p>
                            )}
                            {isAllDone && (
                              <span className="text-[11px] text-emerald-600 font-semibold">✓ 완료</span>
                            )}
                          </td>

                          {DRILL_COLS.map((col) => {
                            const cell = p.cols[col.type];
                            return (
                              <td key={col.type} className="px-3 py-3 text-center">
                                <DrillCell status={cell.status} answered={cell.answered} total={cell.total} />
                              </td>
                            );
                          })}

                          <td className="px-3 py-3 text-center">
                            <span className={[
                              'text-xs font-bold',
                              pct === 100 ? 'text-emerald-600' :
                              pct > 0     ? 'text-amber-600'   :
                              'text-neutral-300',
                            ].join(' ')}>
                              {pct > 0 ? `${pct}%` : '—'}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <form action={startHiNaesinDrillSessionAction}>
                              <input type="hidden" name="passage_id" value={p.passageId} />
                              <button
                                type="submit"
                                className={[
                                  'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap',
                                  isAllDone
                                    ? 'border border-neutral-200 text-neutral-400 hover:bg-neutral-50'
                                    : p.sessionStatus === 'started'
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : p.totalDone > 0
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-neutral-900 text-white hover:bg-neutral-800',
                                ].join(' ')}
                              >
                                {isAllDone                         ? '다시 하기'
                                : p.sessionStatus === 'started'    ? '이어하기'
                                : p.totalDone > 0                  ? '계속하기'
                                : '시작하기'}
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 하단 링크 ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/hi-naesin/vocab"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          📚 내신 단어 전체
        </Link>
        <Link
          href="/hi-naesin/stats"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          📊 학습 현황
        </Link>
        <Link
          href="/hi-naesin/review"
          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs text-violet-700 hover:bg-violet-100"
        >
          직전정리
        </Link>
      </div>
    </main>
  );
}

// ── 드릴 셀 ───────────────────────────────────────────────────
function DrillCell({
  status, answered, total,
}: {
  status: CellStatus;
  answered: number;
  total: number;
}) {
  if (status === 'none') {
    return <span className="text-neutral-200 text-xs">—</span>;
  }
  if (status === 'done') {
    return (
      <span
        title={`${answered}/${total} 완료`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold"
      >
        ✓
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span
        title={`${answered}/${total} 진행 중`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold"
      >
        {answered}
      </span>
    );
  }
  // empty
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-200 text-neutral-200 text-xs">
      ○
    </span>
  );
}

// ── 배정 없을 때 ───────────────────────────────────────────────
function EmptyState() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">고등 내신 준비</h1>
      </header>
      <div className="rounded-2xl border border-dashed p-12 text-center space-y-2">
        <p className="text-sm text-neutral-400">배정된 지문이 없습니다.</p>
        <p className="text-xs text-neutral-300">선생님이 지문을 배정하면 드릴이 시작됩니다.</p>
      </div>
    </main>
  );
}
