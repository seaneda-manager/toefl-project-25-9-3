// apps/web/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// ── Types (랜딩 편집기와 동일) ─────────────────────────────────
type HeroConfig = {
  subtitle: string;
  title: string;
  body: string;
  titleColor: string;
  highlightColor: string;
  fontFamily: "serif" | "sans";
};
type ProgramItem = { id: string; title: string; desc: string };
type RoleSection = { title: string; heading: string; body: string; bullets: string[] };
type StorySection = { quote: string; author: string; meta: string };
type JoinSection = { heading: string; body: string };
type LandingConfig = {
  hero: HeroConfig;
  heroLogo: { url: string };
  programs: ProgramItem[];
  teachers: RoleSection;
  learners: RoleSection;
  story: StorySection;
  join: JoinSection;
};

const DEFAULT_CONFIG: LandingConfig = {
  hero: {
    subtitle: "TOEFL · ACADEMY PLATFORM",
    title: "One platform,\ntwo engines.\nUPDATED-TOEFL and LEXiOX.",
    body: "LEXiOX runs two focused programs side by side. Enter the TOEFL test engine, or jump into LEXiOX for daily vocab missions and academy workflows.",
    titleColor: "#022c22",
    highlightColor: "#047857",
    fontFamily: "serif",
  },
  heroLogo: { url: "/LEXiOX.png" },
  programs: [
    { id: "p1", title: "UPDATED-TOEFL", desc: "Adaptive Reading & Listening, plus Speaking & Writing practice sets." },
    { id: "p2", title: "Grammar & Structure", desc: "3-month intensive course for middle & high school learners." },
    { id: "p3", title: "Mock Tests", desc: "Full-length timed tests with teacher-friendly reports." },
  ],
  teachers: {
    title: "TEACHERS",
    heading: "Differentiate your classroom and engage every student.",
    body: "Assign sets, see results, and focus on coaching.",
    bullets: [
      "Instant reports by skill, passage, and question type",
      "Auto-graded Reading & Listening with detailed explanations",
      "Homework tracking and class dashboards",
    ],
  },
  learners: {
    title: "LEARNERS AND STUDENTS",
    heading: "You can learn anything.",
    body: "Build solid understanding in reading, listening, speaking, and writing.",
    bullets: [
      "Adaptive difficulty that stays just above your comfort zone",
      "Instant explanations in clear, student-friendly English",
      "Daily rhythm with missions and progress tracking",
    ],
  },
  story: {
    quote: "I used to guess my way through TOEFL Reading. With LEXiOX, I can finally see why I got each question wrong—and what to fix next.",
    author: "JIHO · HIGH SCHOOL STUDENT",
    meta: "",
  },
  join: {
    heading: "Join LEXiOX today",
    body: "One account. Two programs. Start small, scale fast.",
  },
};

async function getLandingConfig(): Promise<LandingConfig> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return DEFAULT_CONFIG;

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "landing_home_v1")
      .maybeSingle();

    if (data?.value && typeof data.value === "object") {
      return { ...DEFAULT_CONFIG, ...(data.value as Partial<LandingConfig>) };
    }
  } catch (e) {
    console.error("[LandingPage] config load failed", e);
  }
  return DEFAULT_CONFIG;
}

export const revalidate = 60; // 1분 캐시

export default async function LandingPage() {
  const config = await getLandingConfig();
  const titleLines = config.hero.title.split("\n");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LEXiOX.png" alt="LEXiOX" className="h-10 w-auto" />
          </div>

          <nav className="hidden items-center gap-7 text-base font-medium text-slate-700 md:flex">
            <a href="#programs" className="hover:text-emerald-800">Programs</a>
            <a href="#teachers" className="hover:text-emerald-800">For Teachers</a>
            <a href="#learners" className="hover:text-emerald-800">For Students</a>
            <a href="#stories" className="hover:text-emerald-800">Stories</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden text-base font-medium text-slate-700 hover:text-emerald-800 md:inline-block">
              Log in
            </Link>
            <Link href="/auth/signup" className="rounded-full bg-emerald-900 px-5 py-2.5 text-base font-semibold text-emerald-50 hover:bg-emerald-800">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-24 md:flex-row md:items-center md:py-28">
          <div className="flex-1 space-y-6">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              {config.hero.subtitle}
            </p>
            <h1
              className={`text-5xl font-extrabold leading-tight tracking-tight ${config.hero.fontFamily === "serif" ? "font-serif" : "font-sans"}`}
              style={{ color: config.hero.titleColor }}
            >
              {titleLines.map((line, i) => (
                <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>
              ))}
            </h1>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-700">
              {config.hero.body}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/auth/signup?role=student" className="rounded-full bg-emerald-900 px-7 py-3 text-base font-semibold text-emerald-50 hover:bg-emerald-800">
                학생으로 시작하기
              </Link>
              <Link href="/auth/signup?role=teacher" className="rounded-full border border-slate-400 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100">
                선생님으로 시작하기
              </Link>
              <Link href="/auth/login" className="rounded-full border border-slate-200 bg-white px-7 py-3 text-base font-semibold text-emerald-900 hover:bg-slate-50">
                로그인
              </Link>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-300/60">
              <div className="flex flex-col items-center gap-5 text-center">
                <Image
                  src={config.heroLogo.url || "/LEXiOX.png"}
                  alt="LEXiOX"
                  width={200}
                  height={80}
                  className="h-20 w-auto object-contain"
                  unoptimized={true}
                />
                <p className="text-sm text-slate-700">{config.hero.body}</p>
                <div className="mt-2 flex flex-col gap-2 w-full">
                  <Link href="/auth/signup" className="rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-800">
                    시작하기
                  </Link>
                  <Link href="/auth/login" className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-slate-50">
                    로그인
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="mx-auto max-w-6xl space-y-8 px-4 py-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Programs for every learner</h2>
          <p className="mt-1 text-base text-slate-600">Two programs, one account. Pick a lane, or run both.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.programs.map((item) => (
            <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Teachers */}
      <section id="teachers" className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{config.teachers.title}</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{config.teachers.heading}</h2>
            <p className="text-base text-slate-600">{config.teachers.body}</p>
            <ul className="list-disc space-y-1 pl-5 text-base text-slate-600">
              {config.teachers.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">CLASS SNAPSHOT</p>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div>
                  <div className="flex justify-between mb-1"><span>Reading – Inference</span><span>68%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-200"><div className="h-1.5 w-2/3 rounded-full bg-emerald-600" /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>Listening – Detail</span><span>74%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-200"><div className="h-1.5 w-3/4 rounded-full bg-emerald-500" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learners */}
      <section id="learners" className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{config.learners.title}</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{config.learners.heading}</h2>
            <p className="text-base text-slate-600">{config.learners.body}</p>
            <ul className="list-disc space-y-1 pl-5 text-base text-slate-600">
              {config.learners.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">TODAY&apos;S MISSION</p>
              <p className="mt-3 text-sm text-slate-800">Complete 1 set in UPDATED-TOEFL and 1 mission in LEXiOX.</p>
              <p className="mt-3 text-xs text-slate-600">Keep your streak alive and build momentum.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="stories" className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xl italic text-slate-800 md:text-2xl">"{config.story.quote}"</p>
          <p className="mt-4 text-sm font-semibold tracking-[0.18em] text-slate-500">{config.story.author}</p>
        </div>
      </section>

      {/* Join */}
      <section id="join" className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{config.join.heading}</h2>
            <p className="text-base text-slate-600">{config.join.body}</p>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <Link href="/auth/signup?role=student" className="rounded-full bg-emerald-900 px-6 py-3 text-center text-sm font-semibold text-emerald-50 hover:bg-emerald-800">학생</Link>
            <Link href="/auth/signup?role=teacher" className="rounded-full bg-emerald-100 px-6 py-3 text-center text-sm font-semibold text-emerald-900 hover:bg-emerald-200">선생님</Link>
            <Link href="/auth/signup?role=parent" className="rounded-full bg-emerald-50 px-6 py-3 text-center text-sm font-semibold text-emerald-900 hover:bg-emerald-100">학부모</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 py-10 text-emerald-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:justify-between">
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LEXiOX.png" alt="LEXiOX" className="h-9 w-auto brightness-0 invert" />
            <p className="max-w-sm text-sm text-emerald-100/80">
              To seek truth, master learning, and make high-quality English education accessible for every motivated learner.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <div>
              <p className="mb-2 font-semibold">About</p>
              <ul className="space-y-1 text-emerald-100/80"><li>Our story</li><li>For academies</li></ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Programs</p>
              <ul className="space-y-1 text-emerald-100/80"><li>UPDATED-TOEFL</li><li>LEXiOX Jr.</li><li>Hi-내신</li></ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Contact</p>
              <ul className="space-y-1 text-emerald-100/80"><li>Help center</li><li>Partnerships</li></ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 text-sm text-emerald-200/80">
          © {new Date().getFullYear()} LEXiOX. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
