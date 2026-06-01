import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── 커리큘럼 라벨 ──────────────────────────────────────────────
type CurriculumKey = "toefl" | "gap" | "lingx_jr" | "lingx_ms" | "lingx_hs" | "unknown";

type CurriculumMeta = {
  key: CurriculumKey;
  label: string;
  sub: string;
  badge: string;       // Tailwind classes for the badge
  accentBg: string;    // card bg gradient
  accentText: string;  // accent text color
};

const CURRICULUM: Record<CurriculumKey, CurriculumMeta> = {
  toefl: {
    key: "toefl",
    label: "TOEFL",
    sub: "Lingo-X TOEFL Program",
    badge: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    accentBg: "from-sky-50 to-white",
    accentText: "text-sky-700",
  },
  gap: {
    key: "gap",
    label: "GAP",
    sub: "Lingo-X GAP Program",
    badge: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
    accentBg: "from-indigo-50 to-white",
    accentText: "text-indigo-700",
  },
  lingx_jr: {
    key: "lingx_jr",
    label: "LingX 주니어",
    sub: "Lingo-X Junior Program",
    badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    accentBg: "from-amber-50 to-white",
    accentText: "text-amber-700",
  },
  lingx_ms: {
    key: "lingx_ms",
    label: "LingX 중학",
    sub: "Lingo-X 중학 Program",
    badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    accentBg: "from-emerald-50 to-white",
    accentText: "text-emerald-700",
  },
  lingx_hs: {
    key: "lingx_hs",
    label: "LingX 고등",
    sub: "Lingo-X 고등 Program",
    badge: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    accentBg: "from-violet-50 to-white",
    accentText: "text-violet-700",
  },
  unknown: {
    key: "unknown",
    label: "Lingo-X",
    sub: "Lingo-X Learning Platform",
    badge: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
    accentBg: "from-neutral-50 to-white",
    accentText: "text-neutral-600",
  },
};

function deriveCurriculum(
  program: string | null | undefined,
  gradeBand: string | null | undefined,
): CurriculumMeta {
  const p = program?.toLowerCase() ?? "";
  if (p === "toefl") return CURRICULUM.toefl;
  if (p === "gap")   return CURRICULUM.gap;
  if (p === "lingx") {
    const gb = gradeBand ?? "";
    if (gb === "K10_12" || gb === "POST_K12") return CURRICULUM.lingx_hs;
    if (gb === "K7_9")                        return CURRICULUM.lingx_ms;
    return CURRICULUM.lingx_jr;
  }
  return CURRICULUM.unknown;
}

// ── 수준 배지 ──────────────────────────────────────────────────
function levelBadge(level: string | null | undefined) {
  switch (level) {
    case "beginner":     return { label: "초급", cls: "bg-sky-50 text-sky-600 ring-1 ring-sky-200" };
    case "intermediate": return { label: "중급", cls: "bg-amber-50 text-amber-600 ring-1 ring-amber-200" };
    case "advanced":     return { label: "고급", cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200" };
    default:             return null;
  }
}

// ── helpers ────────────────────────────────────────────────────
async function tryResolveAcademyStudentId(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  authUserId: string,
): Promise<string | null> {
  for (const col of ["id", "auth_user_id", "user_id", "profile_id"] as const) {
    try {
      const { data } = await supabase
        .from("academy_students")
        .select("id")
        .eq(col as string, authUserId)
        .maybeSingle();
      if (data?.id) return String(data.id);
    } catch { /* ignore */ }
  }
  return null;
}

// ── Page ───────────────────────────────────────────────────────
export default async function StudentPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 1. 프로필 ────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, program, full_name, name, grade")
    .eq("id", user.id)
    .maybeSingle();

  // ── 2. 학원 학생 레코드 ──────────────────────────────────────
  const academyStudentId = await tryResolveAcademyStudentId(supabase, user.id);

  let acdStudent: {
    display_name: string | null;
    grade_band: string | null;
    level: string | null;
  } | null = null;

  if (academyStudentId) {
    const { data } = await supabase
      .from("academy_students")
      .select("display_name, grade_band, level")
      .eq("id", academyStudentId)
      .maybeSingle();
    acdStudent = data ?? null;
  }

  const program   = (profile as any)?.program as string | null ?? null;
  const gradeBand = acdStudent?.grade_band ?? null;
  const curriculum = deriveCurriculum(program, gradeBand);

  const studentName =
    acdStudent?.display_name ??
    (profile as any)?.full_name ??
    (profile as any)?.name ??
    user.email?.split("@")[0] ??
    "학생";

  const lvBadge = levelBadge(acdStudent?.level ?? null);

  // ── 3. 내신 통계 ─────────────────────────────────────────────
  // 배정된 지문 수
  const { data: naesinAssignments } = await supabase
    .from("hi_naesin_assignments")
    .select("passage_id")
    .eq("student_id", user.id);

  const assignedPassageIds = [
    ...new Set((naesinAssignments ?? []).map((a: any) => a.passage_id as string)),
  ];

  // 제출(완료)된 세션 수 (passage 기준 unique)
  let naesinDonePassages = 0;
  if (assignedPassageIds.length > 0) {
    const { data: doneSessions } = await supabase
      .from("hi_naesin_sessions")
      .select("passage_id")
      .eq("student_id", user.id)
      .eq("status", "submitted")
      .in("passage_id", assignedPassageIds);

    naesinDonePassages = new Set(
      (doneSessions ?? []).map((s: any) => s.passage_id as string),
    ).size;
  }

  // ── 4. 어휘 통계 ──────────────────────────────────────────────
  // student_vocab_plans (active)
  let vocaPlanCount = 0;
  let vocaTodayCount = 0;

  if (academyStudentId) {
    const todayISO = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    const { data: vocaPlans } = await supabase
      .from("student_vocab_plans")
      .select("id, track_id, is_paused")
      .eq("student_id", academyStudentId)
      .eq("is_enabled", true);

    vocaPlanCount = (vocaPlans ?? []).length;

    if (vocaPlanCount > 0) {
      const trackIds = (vocaPlans ?? []).map((p: any) => p.track_id as string);
      const { data: todayAsg } = await supabase
        .from("student_vocab_assignments")
        .select("id")
        .eq("student_id", academyStudentId)
        .in("track_id", trackIds)
        .lte("available_at", todayISO)
        .is("completed_at", null);
      vocaTodayCount = (todayAsg ?? []).length;
    }
  }

  // ── 5. 정규 읽기 통계 (간략) ──────────────────────────────────
  const { data: readingResults } = await supabase
    .from("reading_results_2026")
    .select("id")
    .eq("user_id", user.id);

  const readingDone = (readingResults ?? []).length;

  return (
    <main className="mx-auto max-w-3xl space-y-6 pb-12">

      {/* ── 커리큘럼 헤더 ─────────────────────────────────────── */}
      <header
        className={[
          "rounded-3xl border border-neutral-200 bg-gradient-to-br p-6 shadow-sm",
          curriculum.accentBg,
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${curriculum.badge}`}>
            {curriculum.label}
          </span>
          {lvBadge && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${lvBadge.cls}`}>
              {lvBadge.label}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          {studentName}
        </h1>
        <p className={`text-sm mt-0.5 ${curriculum.accentText}`}>
          {curriculum.sub}
        </p>
      </header>

      {/* ── 내신 ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            내신
          </h2>
          {assignedPassageIds.length > 0 && (
            <Link
              href="/hi-naesin"
              className="text-xs text-emerald-600 hover:underline"
            >
              내신 드릴 →
            </Link>
          )}
        </div>

        {assignedPassageIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-6 flex items-center justify-between">
            <p className="text-sm text-neutral-400">배정된 내신 지문이 없습니다.</p>
            <Link
              href="/hi-naesin"
              className="text-xs text-neutral-500 hover:underline"
            >
              드릴 목록 →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <NaesinStat
                label="배정 지문"
                value={`${assignedPassageIds.length}개`}
              />
              <NaesinStat
                label="학습 완료"
                value={`${naesinDonePassages}개`}
                sub={
                  assignedPassageIds.length > 0
                    ? `${Math.round((naesinDonePassages / assignedPassageIds.length) * 100)}%`
                    : undefined
                }
              />
              <NaesinStat
                label="남은 지문"
                value={`${assignedPassageIds.length - naesinDonePassages}개`}
                warn={assignedPassageIds.length - naesinDonePassages > 0}
              />
            </div>

            {/* 진행 바 */}
            {assignedPassageIds.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>전체 진도</span>
                  <span>
                    {Math.round((naesinDonePassages / assignedPassageIds.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100">
                  <div
                    className="h-2 rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.round(
                        (naesinDonePassages / assignedPassageIds.length) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/hi-naesin"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                내신 드릴 시작
              </Link>
              <Link
                href="/hi-naesin/stats"
                className="inline-flex items-center rounded-xl border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                학습 현황
              </Link>
              <Link
                href="/hi-naesin/vocab"
                className="inline-flex items-center rounded-xl border border-neutral-200 px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                내신 단어
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 정규 ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            정규
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Reading */}
          <SkillCard
            href="/reading-2026/study"
            label="Reading"
            emoji="📖"
            detail={readingDone > 0 ? `완료 ${readingDone}회` : "학습 시작하기"}
            color="sky"
          />

          {/* Grammar */}
          <SkillCard
            href="#"
            label="Grammar"
            emoji="📝"
            detail="준비 중"
            color="neutral"
            disabled
          />

          {/* Listening */}
          <SkillCard
            href="/listening-2026/study"
            label="Listening"
            emoji="🎧"
            detail="학습 시작하기"
            color="violet"
          />

          {/* Writing */}
          <SkillCard
            href="/writing-2026/study"
            label="Writing"
            emoji="✍️"
            detail="학습 시작하기"
            color="amber"
          />

          {/* Speaking */}
          <SkillCard
            href="/speaking-2026/study"
            label="Speaking"
            emoji="🎤"
            detail="학습 시작하기"
            color="rose"
          />

          {/* Voca */}
          <SkillCard
            href="/vocab"
            label="Voca"
            emoji="📚"
            detail={
              vocaPlanCount === 0
                ? "배정 없음"
                : vocaTodayCount > 0
                ? `오늘 ${vocaTodayCount}개`
                : `플랜 ${vocaPlanCount}개`
            }
            color={vocaTodayCount > 0 ? "emerald" : "neutral"}
            highlight={vocaTodayCount > 0}
          />
        </div>
      </section>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function NaesinStat({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p
        className={[
          "mt-0.5 text-xl font-bold",
          warn ? "text-amber-600" : "text-neutral-900",
        ].join(" ")}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-neutral-400">{sub}</p>}
    </div>
  );
}

type SkillColor = "sky" | "violet" | "amber" | "rose" | "emerald" | "neutral";

const COLOR_MAP: Record<
  SkillColor,
  { border: string; bg: string; hoverBg: string; label: string; detail: string }
> = {
  sky:     { border: "border-sky-200",     bg: "bg-sky-50",     hoverBg: "hover:bg-sky-50",     label: "text-sky-800",     detail: "text-sky-600"     },
  violet:  { border: "border-violet-200",  bg: "bg-violet-50",  hoverBg: "hover:bg-violet-50",  label: "text-violet-800",  detail: "text-violet-600"  },
  amber:   { border: "border-amber-200",   bg: "bg-amber-50",   hoverBg: "hover:bg-amber-50",   label: "text-amber-800",   detail: "text-amber-600"   },
  rose:    { border: "border-rose-200",    bg: "bg-rose-50",    hoverBg: "hover:bg-rose-50",    label: "text-rose-800",    detail: "text-rose-600"    },
  emerald: { border: "border-emerald-200", bg: "bg-emerald-50", hoverBg: "hover:bg-emerald-50", label: "text-emerald-800", detail: "text-emerald-600" },
  neutral: { border: "border-neutral-200", bg: "bg-neutral-50", hoverBg: "hover:bg-neutral-50", label: "text-neutral-700", detail: "text-neutral-400" },
};

function SkillCard({
  href,
  label,
  emoji,
  detail,
  color,
  disabled,
  highlight,
}: {
  href: string;
  label: string;
  emoji: string;
  detail: string;
  color: SkillColor;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const c = COLOR_MAP[color];

  if (disabled) {
    return (
      <div
        className={[
          "rounded-2xl border p-4 opacity-50",
          c.border,
          c.bg,
        ].join(" ")}
      >
        <span className="text-xl">{emoji}</span>
        <p className={`mt-2 text-sm font-semibold ${c.label}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${c.detail}`}>{detail}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={[
        "group block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
        c.border,
        highlight ? c.bg : `bg-white ${c.hoverBg}`,
      ].join(" ")}
    >
      <span className="text-xl">{emoji}</span>
      <p className={`mt-2 text-sm font-semibold ${c.label}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${c.detail}`}>{detail}</p>
    </Link>
  );
}
