// apps/web/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────
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
    subtitle: "LEXIOX · TOEFL · ACADEMY PLATFORM",
    title: "For every Language learner,\nevery classroom.\nReal progress.\nMeasurable results.",
    body: "LEXiOX connects adaptive Language Learning platform specializing in TOEFL, SAT, ACT Prep, academy management, and real-time feedback into one place, so students, teachers, and parents can see exactly how learning grows.",
    titleColor: "#f8fafc",
    highlightColor: "#34d399",
    fontFamily: "serif",
  },
  heroLogo: { url: "/LEXiOX.png" },
  programs: [
    { id: "p1", title: "UPDATED-TOEFL, Prep & Mock TEST", desc: "Adaptive Reading & Listening, plus Speaking & Writing practice sets with real-time insight with Adaptive Feedback reports." },
    { id: "p2", title: "LEXiOX English Jr., LexiOX Naesin, LexiOX", desc: "A dedicated module for middle & high school learners." },
    { id: "p3", title: "GAP (Global Art Pathway) Curriculum", desc: "Two-month intensive to help students reach their full potential." },
  ],
  teachers: {
    title: "TEACHERS",
    heading: "Differentiate your classroom and engage every student.",
    body: "Assign TOEFL sets, see real-time results, and focus your class time on coaching—not paperwork. LEXiOX is built for academy teachers who need clarity at a glance.",
    bullets: [
      "Instant reports by skill, passage, and question type",
      "Auto-graded Reading & Listening with detailed explanations",
      "Homework tracking and class dashboards",
    ],
  },
  learners: {
    title: "LEARNERS AND STUDENTS",
    heading: "You can learn anything.",
    body: "Build solid understanding in reading, listening, speaking, and writing. Every question you answer teaches the system how to help you more.",
    bullets: [
      "Adaptive difficulty that stays just above your comfort zone",
      "Instant explanations in clear, student-friendly English",
      "Point system to keep daily practice fun and continuity",
    ],
  },
  story: {
    quote: "I used to guess my way through TOEFL Reading. With LEXiOX, I can finally see why I got each question wrong—and what to fix next.",
    author: "JIHO · HIGH SCHOOL STUDENT",
    meta: "",
  },
  join: {
    heading: "Join LEXiOX today",
    body: "Start with a single class, or roll out to your whole Academy. LEXiOX grows with your learners.",
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

export const revalidate = 60;

export default async function LandingPage() {
  const config = await getLandingConfig();
  const titleLines = config.hero.title.split("\n");

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LEXiOX.png" alt="LEXiOX" className="h-10 w-auto" />

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#programs" className="hover:text-emerald-800 transition-colors">Programs</a>
            <a href="#teachers" className="hover:text-emerald-800 transition-colors">For Teachers</a>
            <a href="#learners" className="hover:text-emerald-800 transition-colors">For Students</a>
            <a href="#stories" className="hover:text-emerald-800 transition-colors">Stories</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-800 transition-colors md:inline-block">
              Login
            </Link>
            <Link href="/auth/signup" className="rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-800 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-white flex flex-col justify-end pb-24 overflow-hidden border-b border-slate-200">
        <div className="relative mx-auto w-full max-w-7xl px-8">
          {/* eyebrow */}
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
            {config.hero.subtitle}
          </p>

          {/* big headline */}
          <h1
            className={[
              "text-5xl font-extrabold leading-[1.08] tracking-tight text-emerald-950 md:text-7xl lg:text-8xl",
              config.hero.fontFamily === "serif" ? "font-serif" : "font-sans",
            ].join(" ")}
          >
            {titleLines.map((line, i) => (
              <span key={i} className="block">
                {i === 2
                  ? <span className="text-emerald-700">{line}</span>
                  : line}
              </span>
            ))}
          </h1>

          {/* body + CTA row */}
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              {config.hero.body}
            </p>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/auth/signup?role=student"
                className="rounded-full bg-emerald-900 px-7 py-3.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-800 transition-colors"
              >
                학생으로 시작하기 →
              </Link>
              <Link
                href="/auth/signup?role=teacher"
                className="rounded-full border border-slate-300 px-7 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                선생님으로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Programs ───────────────────────────────────────── */}
      <section id="programs" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Programs</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Programs for every learner</h2>
            <p className="text-sm text-slate-500">Two programs, one account. Pick a lane, or run both.</p>
          </div>

          <div className="mt-12 grid gap-px bg-slate-200 md:grid-cols-3">
            {config.programs.map((item, i) => (
              <div key={item.id} className="group flex flex-col justify-between bg-white p-8 hover:bg-emerald-50 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-400">0{i + 1}</span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
                <div className="mt-8">
                  <span className="text-xs font-semibold text-emerald-700 group-hover:underline">자세히 보기 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teachers ───────────────────────────────────────── */}
      <section id="teachers" className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">{config.teachers.title}</p>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                {config.teachers.heading}
              </h2>
              <p className="text-base leading-relaxed text-slate-600">{config.teachers.body}</p>
              <ul className="space-y-3">
                {config.teachers.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="h-3 w-3 text-emerald-700" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* mock dashboard card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-600">CLASS SNAPSHOT</p>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Reading – Inference", pct: 68, color: "bg-emerald-500" },
                  { label: "Listening – Detail",  pct: 74, color: "bg-emerald-400" },
                  { label: "Writing – Coherence", pct: 55, color: "bg-teal-500" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                      <span>{row.label}</span><span className="font-semibold">{row.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200">
                      <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Learners ───────────────────────────────────────── */}
      <section id="learners" className="bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            {/* mock mission card */}
            <div className="order-2 md:order-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-700">TODAY&apos;S MISSION</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                Complete 1 set in UPDATED-TOEFL and 1 mission in LEXiOX.
              </p>
              <p className="mt-4 text-xs text-slate-500">Keep your streak alive and build momentum.</p>
              <div className="mt-6 flex gap-2">
                {[1,2,3,4,5].map((d) => (
                  <div key={d} className={`h-2 flex-1 rounded-full ${d <= 3 ? "bg-emerald-500" : "bg-slate-200"}`} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">3-day streak</p>
            </div>

            <div className="order-1 md:order-2 space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">{config.learners.title}</p>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                {config.learners.heading}
              </h2>
              <p className="text-base leading-relaxed text-slate-600">{config.learners.body}</p>
              <ul className="space-y-3">
                {config.learners.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="h-3 w-3 text-emerald-700" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Story / Testimonial ────────────────────────────── */}
      <section id="stories" className="bg-emerald-900 py-28">
        <div className="mx-auto max-w-4xl px-8 text-center">
          <p className="mb-10 text-4xl font-bold italic leading-snug text-emerald-50 md:text-5xl">
            &ldquo;{config.story.quote}&rdquo;
          </p>
          <div className="mx-auto h-px w-16 bg-emerald-400 mb-6" />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-200">{config.story.author}</p>
        </div>
      </section>

      {/* ── Join CTA ───────────────────────────────────────── */}
      <section id="join" className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {config.join.heading}
              </h2>
              <p className="text-base leading-relaxed text-slate-600">{config.join.body}</p>
            </div>
            <div className="flex flex-col gap-3 md:pl-12">
              <Link href="/auth/signup?role=student" className="flex items-center justify-between rounded-xl bg-emerald-900 px-7 py-4 text-sm font-semibold text-emerald-50 hover:bg-emerald-800 transition-colors">
                <span>학생</span><span>→</span>
              </Link>
              <Link href="/auth/signup?role=teacher" className="flex items-center justify-between rounded-xl border-2 border-emerald-200 px-7 py-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 transition-colors">
                <span>선생님</span><span>→</span>
              </Link>
              <Link href="/auth/signup?role=parent" className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-7 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                <span>학부모</span><span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-emerald-950 py-16 text-emerald-100">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="space-y-3 max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/LEXiOX.png" alt="LEXiOX" className="h-8 w-auto brightness-0 invert" />
              <p className="text-sm leading-relaxed text-emerald-100/70">
                To seek truth, master learning, and make high-quality English education accessible for every motivated learner.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm md:grid-cols-3">
              <div>
                <p className="mb-3 font-semibold text-emerald-100">About</p>
                <ul className="space-y-2 text-emerald-100/60"><li>Our story</li><li>For academies</li></ul>
              </div>
              <div>
                <p className="mb-3 font-semibold text-emerald-100">Programs</p>
                <ul className="space-y-2 text-emerald-100/60">
                  <li>LEXiOX-TOEFL</li><li>LEXiOX-Jr.</li>
                  <li>LEXiOX-Hi-내신</li><li>LEXiOX-내신</li>
                </ul>
              </div>
              <div>
                <p className="mb-3 font-semibold text-emerald-100">Contact</p>
                <ul className="space-y-2 text-emerald-100/60"><li>Help center</li><li>Partnerships</li></ul>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-emerald-800 pt-6 text-xs text-emerald-200/50">
            © {new Date().getFullYear()} LEXiOX. All rights reserved.
          </div>
        </div>
      </footer>

    </main>
  );
}
