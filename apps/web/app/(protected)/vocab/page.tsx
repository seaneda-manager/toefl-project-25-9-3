// apps/web/app/(protected)/vocab/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function toISODateLocal(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default async function VocabHomePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const todayISO = toISODateLocal(new Date());

  // ── 1. 내신 단어 stats ──────────────────────────────────────────
  const { data: hiAssignments } = await supabase
    .from('hi_naesin_assignments')
    .select('passage_id')
    .eq('student_id', user.id);

  const assignedPassageIds = [...new Set((hiAssignments ?? []).map((a) => a.passage_id))];

  let naesin = { total: 0, studied: 0, correct: 0, wrong: 0 };

  if (assignedPassageIds.length > 0) {
    const { data: drills } = await supabase
      .from('hi_naesin_drills')
      .select('id')
      .eq('drill_type', 'vocab')
      .in('passage_id', assignedPassageIds);

    const drillIds = (drills ?? []).map((d) => d.id);
    naesin.total = drillIds.length;

    if (drillIds.length > 0) {
      const { data: responses } = await supabase
        .from('hi_naesin_drill_responses')
        .select('drill_id, is_correct')
        .in('drill_id', drillIds);

      // latest response per drill_id (responses returned oldest→newest; reverse for latest-first)
      const responseMap = new Map<string, boolean>();
      for (const r of (responses ?? []).reverse()) {
        if (!responseMap.has(r.drill_id)) {
          responseMap.set(r.drill_id, r.is_correct ?? false);
        }
      }
      naesin.studied = responseMap.size;
      for (const [, correct] of responseMap) {
        if (correct) naesin.correct++;
        else         naesin.wrong++;
      }
    }
  }

  const naesinAccuracy = naesin.studied > 0
    ? Math.round((naesin.correct / naesin.studied) * 100)
    : null;

  // ── 2. 단어장 plans ──────────────────────────────────────────────
  // academy_students.id via profile_id = user.id (also try auth_user_id)
  let academyStudentId: string | undefined;

  const { data: acByProfile } = await supabase
    .from('academy_students')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  academyStudentId = (acByProfile as any)?.id ?? undefined;

  if (!academyStudentId) {
    const { data: acByAuth } = await supabase
      .from('academy_students')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    academyStudentId = (acByAuth as any)?.id ?? undefined;
  }

  type PlanCard = {
    id: string;
    trackId: string;
    trackTitle: string;
    totalDays: number;
    cursor: number;
    isPaused: boolean;
    todayCount: number;
  };

  let plans: PlanCard[] = [];

  if (academyStudentId) {
    const { data: planRows } = await supabase
      .from('student_vocab_plans')
      .select('id, track_id, cursor_day_index, is_paused')
      .eq('student_id', academyStudentId)
      .eq('is_enabled', true)
      .order('created_at', { ascending: true });

    if ((planRows ?? []).length > 0) {
      const trackIds = (planRows ?? []).map((p: any) => p.track_id as string);

      const [{ data: tracks }, { data: todayAsg }] = await Promise.all([
        supabase
          .from('vocab_tracks')
          .select('id, title, total_days')
          .in('id', trackIds),

        supabase
          .from('student_vocab_assignments')
          .select('track_id')
          .eq('student_id', academyStudentId)
          .in('track_id', trackIds)
          .lte('available_at', todayISO)
          .is('completed_at', null),
      ]);

      const trackMap = new Map((tracks ?? []).map((t: any) => [t.id as string, t]));

      const todayByTrack = new Map<string, number>();
      for (const r of (todayAsg ?? [])) {
        const tid = String(r.track_id);
        todayByTrack.set(tid, (todayByTrack.get(tid) ?? 0) + 1);
      }

      plans = (planRows ?? []).map((p: any) => {
        const track  = trackMap.get(p.track_id as string) as any;
        const total  = track?.total_days ?? 0;
        const cursor = p.cursor_day_index ?? 1;
        return {
          id:         p.id,
          trackId:    p.track_id,
          trackTitle: track?.title ?? '(단어장)',
          totalDays:  total,
          cursor:     cursor,
          isPaused:   Boolean(p.is_paused),
          todayCount: todayByTrack.get(p.track_id as string) ?? 0,
        };
      });
    }
  }

  return (
    <main className="space-y-8">
      {/* 헤더 */}
      <header>
        <h1 className="text-xl font-bold text-neutral-900">단어 학습</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          내신 단어와 단어장을 한눈에 확인하세요
        </p>
      </header>

      {/* ── 내신 단어 ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">내신 단어</h2>
          {assignedPassageIds.length > 0 && (
            <Link
              href="/hi-naesin/vocab"
              className="text-xs text-emerald-600 hover:underline"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {assignedPassageIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-400">
            배정된 내신 지문이 없습니다.{' '}
            <Link href="/hi-naesin" className="underline">드릴 목록으로</Link>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniStat label="전체 단어"  value={`${naesin.total}개`} />
              <MiniStat
                label="학습 완료"
                value={`${naesin.studied}개`}
                sub={naesin.total > 0
                  ? `${Math.round((naesin.studied / naesin.total) * 100)}%`
                  : undefined}
              />
              <MiniStat
                label="정답률"
                value={naesinAccuracy != null ? `${naesinAccuracy}%` : '—'}
              />
              <MiniStat
                label="오답"
                value={`${naesin.wrong}개`}
                red={naesin.wrong > 0}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {naesin.wrong > 0 && (
                <Link
                  href="/hi-naesin/vocab?filter=wrong"
                  className="rounded-xl border border-red-200 px-4 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  오답 복습
                </Link>
              )}
              {naesin.total - naesin.studied > 0 && (
                <Link
                  href="/hi-naesin/vocab?filter=unstudied"
                  className="rounded-xl border px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  미학습 보기
                </Link>
              )}
              <Link
                href="/hi-naesin/vocab"
                className="rounded-xl border px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                전체 단어 보기
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 단어장 ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">단어장</h2>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-400">
            배정된 단어장이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const progressPct = plan.totalDays > 0
                ? Math.min(Math.round((plan.cursor / plan.totalDays) * 100), 100)
                : 0;

              return (
                <div key={plan.id} className="rounded-2xl border bg-white p-5 space-y-3">
                  {/* 제목 + 상태 */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-800 leading-snug">
                      {plan.trackTitle}
                    </p>
                    {plan.isPaused ? (
                      <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-400">
                        일시정지
                      </span>
                    ) : plan.todayCount > 0 ? (
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        오늘 학습 가능
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500">
                        대기중
                      </span>
                    )}
                  </div>

                  {/* 진도 바 */}
                  {plan.totalDays > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-neutral-400">
                        <span>Day {plan.cursor} / {plan.totalDays}</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-100">
                        <div
                          className="h-1.5 rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 시작 버튼 */}
                  {!plan.isPaused && plan.todayCount > 0 ? (
                    <Link
                      href="/vocab/session"
                      className="block rounded-xl bg-emerald-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      오늘 학습 시작
                    </Link>
                  ) : !plan.isPaused ? (
                    <p className="text-[11px] text-neutral-400 text-center">
                      다음 학습일에 새 단어가 열립니다
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 구동사 ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">구동사</h2>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] text-neutral-400">
            준비 중
          </span>
        </div>

        <div className="rounded-2xl border border-dashed bg-neutral-50/60 p-8 text-center space-y-1.5">
          <p className="text-sm font-medium text-neutral-500">구동사 학습 (Phrasal Verbs)</p>
          <p className="text-xs text-neutral-400">
            get up, look into, take off… 문맥 기반 구동사 드릴이 곧 추가됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}

// ── 서브 컴포넌트 ───────────────────────────────────────────────────
function MiniStat({
  label, value, sub, red,
}: {
  label: string;
  value: string;
  sub?: string;
  red?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${red ? 'text-red-500' : 'text-neutral-900'}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-neutral-400">{sub}</p>}
    </div>
  );
}
