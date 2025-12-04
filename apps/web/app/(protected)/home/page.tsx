// apps/web/app/(protected)/home/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Role = "student" | "teacher" | "admin";

async function getRole(): Promise<Role> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "student";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "student") as Role;
  return role;
}

export default async function HomePage() {
  const role = await getRole();

  // 🔹 선생님은 바로 Teacher Home으로 보냄
  if (role === "teacher") {
    redirect("/teacher/home");
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔹 학생용 Reading 2026 결과 (최신 5개)
  let readingResults: any[] = [];
  let name: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    name = profile?.full_name ?? user.email ?? null;
  }

  if (role === "student" && user) {
    const { data } = await supabase
      .from("reading_results_2026")
      .select("id, test_id, label, total_questions, finished_at")
      .eq("user_id", user.id)
      .order("finished_at", { ascending: false })
      .limit(5);

    readingResults = data ?? [];
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      {/* 헤더 */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          TOEFL iBT 2026 – Home
        </h1>
        <p className="text-sm text-gray-600">
          {role === "student" &&
            "스케줄, 시험, 연습 모드로 바로 들어갈 수 있는 학생용 홈입니다."}
          {role === "admin" &&
            "컨텐츠, 유저, 학원 엔진 설정과 데모 러너를 관리하는 관리자용 홈입니다."}
        </p>
      </header>

      {/* 섹션 1: 빠른 이동 (학생/관리자 공용) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href="/student/tests"
            className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="font-semibold">My Tests</span>
            <span className="mt-1 text-xs text-gray-600">
              선생님/관리자가 배정한 시험을 확인하고 응시합니다.
            </span>
          </Link>

          <Link
            href="/reading-2026/study"
            className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="font-semibold">Reading 2026 – Practice</span>
            <span className="mt-1 text-xs text-gray-600">
              2026형 Reading 세트를 연습 모드로 풀어봅니다.
            </span>
          </Link>

          <Link
            href="/listening-2026/study"
            className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="font-semibold">Listening 2026 – Practice</span>
            <span className="mt-1 text-xs text-gray-600">
              리스닝 데모 세트로 실전 대비 연습을 합니다.
            </span>
          </Link>

          <Link
            href="/writing-2026/study"
            className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="font-semibold">Writing 2026 – Practice</span>
            <span className="mt-1 text-xs text-gray-600">
              새 Writing 3문항 구조를 한 곳에서 연습합니다.
            </span>
          </Link>
        </div>
      </section>

      {/* 🔹 섹션 1.5: 학생용 Reading 2026 Dashboard */}
      {role === "student" && (
        <StudentDashboard
          name={name}
          readingResults={readingResults.map((r) => ({
            id: r.id,
            test_id: r.test_id,
            label: r.label,
            total_questions: r.total_questions,
            finished_at: r.finished_at,
          }))}
        />
      )}

      {/* 섹션 2: 학원 엔진 (Admin용) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Academy Engine</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {role === "admin" && (
            <Link
              href="/teacher/home"
              className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold">Teacher Dashboard</span>
              <span className="mt-1 text-xs text-gray-600">
                반/학생 관리와 시험 배정을 위한 교사용 대시보드입니다.
              </span>
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold">Admin Panel</span>
              <span className="mt-1 text-xs text-gray-600">
                컨텐츠 업로드, 유저/클래스, 시스템 설정을 관리하는 관리자 영역입니다.
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* 섹션 3: Admin 데모 런처로 진입 */}
      {role === "admin" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">
            Admin Demo Tools
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              href="/admin/demo"
              className="flex flex-col rounded-lg border bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold">
                TOEFL iBT 2026 – Demo Launcher
              </span>
              <span className="mt-1 text-xs text-gray-600">
                예전 Admin Home에서 쓰던 TPO 세트·섹션·모드 선택 런처를 이곳에서
                실행합니다.
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Coming Soon */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Coming Soon</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-800">
              Speaking 2026 – Practice
            </div>
            <p className="mt-1">
              Speaking 데모 세트와 녹음/피드백 기능을 준비 중입니다.
            </p>
          </div>
          <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-800">
              Full TOEFL Demo
            </div>
            <p className="mt-1">
              네 영역을 한 번에 보는 Full Demo Test를 통합 러너로 제공합니다.
            </p>
          </div>
          <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-800">
              Student Progress &amp; Perks
            </div>
            <p className="mt-1">
              누적 점수, 약점 분석, 코인/뱃지 시스템을 연동할 예정입니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
