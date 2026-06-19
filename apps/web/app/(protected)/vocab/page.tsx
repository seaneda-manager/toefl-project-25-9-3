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

  const todayPlan = plans.find((p) => !p.isPaused && p.todayCount > 0);
  const totalWords = plans.reduce((acc, p) => acc + p.todayCount, 0);

  return (
    <main
      className="-m-4 md:-m-6 min-h-full"
      style={{ background: '#1a3d30' }}
    >
      {/* ── 상단 인사 + 스트릭 ── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <p className="text-xs mb-1" style={{ color: '#5DCAA5' }}>단어 학습</p>
          <h1 className="text-2xl font-medium leading-tight" style={{ color: '#E1F5EE' }}>
            {todayPlan
              ? <>오늘도<br /><span style={{ color: '#5DCAA5' }}>{totalWords}단어</span> 정복해요</>
              : <>오늘 학습할<br /><span style={{ color: '#5DCAA5' }}>단어가 없어요</span></>
            }
          </h1>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{ background: '#153229', border: '0.5px solid #2d6652', color: '#EF9F27' }}
        >
          🔥 7일 연속
        </div>
      </header>

      {/* ── CTA 카드 ── */}
      <div className="px-5 pt-4 pb-5">
        {todayPlan ? (
          <Link href="/vocab/session" className="block rounded-2xl overflow-hidden relative"
            style={{ background: '#5DCAA5' }}>
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-30"
              style={{ background: '#9FE1CB' }} />
            <div className="absolute -left-4 -bottom-6 w-20 h-20 rounded-full opacity-20"
              style={{ background: '#1D9E75' }} />
            <div className="relative z-10 flex items-center justify-between p-6">
              <div>
                <span className="text-xs rounded-full px-2.5 py-1 font-medium inline-block mb-2"
                  style={{ background: '#085041', color: '#9FE1CB' }}>
                  {todayPlan.trackTitle}
                </span>
                <div className="text-5xl font-medium leading-none" style={{ color: '#04342C' }}>
                  {totalWords}
                </div>
                <div className="text-sm mt-1" style={{ color: '#085041' }}>오늘 학습할 단어</div>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#04342C' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4l14 8-14 8V4z" fill="#5DCAA5" />
                </svg>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#22503f', border: '0.5px solid #2d6652' }}>
            <p className="text-sm" style={{ color: '#4da88a' }}>오늘 배정된 단어가 없습니다</p>
            <p className="text-xs mt-1" style={{ color: '#3d7a63' }}>선생님이 단어장을 배정하면 여기에 표시됩니다</p>
          </div>
        )}
      </div>

      {/* ── 내신 단어 stats ── */}
      {assignedPassageIds.length > 0 && (
        <section className="px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#4da88a' }}>
              내신 단어
            </span>
            <Link href="/hi-naesin/vocab" className="text-xs" style={{ color: '#5DCAA5' }}>
              자세히 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="학습 완료" value={`${naesin.studied}`} unit="개" accent />
            <StatCard label="복습 필요" value={`${naesin.wrong}`} unit="개" danger={naesin.wrong > 0} />
            <StatCard label="정답률" value={naesinAccuracy != null ? `${naesinAccuracy}` : '—'} unit={naesinAccuracy != null ? '%' : ''} />
            <StatCard label="전체 단어" value={`${naesin.total}`} unit="개" />
          </div>
          {naesin.wrong > 0 && (
            <Link
              href="/hi-naesin/vocab?filter=wrong"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium w-full"
              style={{ background: '#22503f', border: '0.5px solid #2d6652', color: '#9FE1CB' }}
            >
              오답 복습하기
            </Link>
          )}
        </section>
      )}

      {/* ── 단어장 플랜 ── */}
      <section className="px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#4da88a' }}>
            내 단어장
          </span>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#22503f', border: '0.5px dashed #2d6652' }}>
            <p className="text-sm" style={{ color: '#4da88a' }}>배정된 단어장이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {plans.map((plan) => {
              const pct = plan.totalDays > 0
                ? Math.min(Math.round((plan.cursor / plan.totalDays) * 100), 100)
                : 0;
              const isActive = !plan.isPaused && plan.todayCount > 0;
              const circumference = 2 * Math.PI * 18;
              const offset = circumference - (pct / 100) * circumference;

              return (
                <Link
                  key={plan.id}
                  href={isActive ? '/vocab/session' : '#'}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: isActive ? '#1e4a3a' : '#22503f',
                    border: `0.5px solid ${isActive ? '#5DCAA5' : '#2d6652'}`,
                  }}
                >
                  {/* 원형 진도 */}
                  <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#2d6652" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke={isActive ? '#5DCAA5' : '#3d7a63'}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                    <text
                      x="22" y="22"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fill={isActive ? '#5DCAA5' : '#3d7a63'}
                      style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px' }}
                    >
                      {plan.cursor}
                    </text>
                  </svg>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate"
                      style={{ color: isActive ? '#C8EEE3' : '#3d7a63' }}>
                      {plan.trackTitle}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#4da88a' }}>
                      Day {plan.cursor} / {plan.totalDays}
                      {plan.isPaused ? ' · 일시정지' : plan.todayCount > 0 ? ' · 오늘 가능' : ' · 내일 오픈'}
                    </p>
                  </div>

                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M6 3l5 5-5 5" stroke={isActive ? '#5DCAA5' : '#2d6652'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label, value, unit, accent, danger,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const numColor = danger ? '#F09595' : accent ? '#5DCAA5' : '#E1F5EE';
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: accent ? '#1e4a3a' : '#22503f',
        border: `0.5px solid ${accent ? '#5DCAA5' : '#2d6652'}`,
      }}
    >
      <div className="text-2xl font-medium leading-none" style={{ color: numColor }}>
        {value}<span className="text-sm ml-0.5" style={{ color: numColor }}>{unit}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: '#4da88a' }}>{label}</div>
    </div>
  );
}
