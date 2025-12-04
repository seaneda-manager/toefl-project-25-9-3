// apps/web/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ✅ Top Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* 왼쪽 로고 영역 */}
          <div className="flex items-center gap-4">
            <Image
              src="/k-prime-logo.png"
              alt="K-PRIME"
              width={56}
              height={56}
              className="h-14 w-14"
            />
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-[0.22em] text-emerald-900">
                {/* text-sm → text-base, 자간 살짝 증가 */}
                K-PRIME
              </div>
              <div className="text-sm text-slate-500">
                {/* text-xs → text-sm */}
                SEEK TRUTH. MASTER LEARNING.
              </div>
            </div>
          </div>

          {/* 가운데 메뉴 */}
          <nav className="hidden items-center gap-7 text-lg font-medium text-slate-700 md:flex">
            {/* text-base → text-lg, gap-6 → gap-7 */}
            <a href="#programs" className="hover:text-emerald-800">
              Programs
            </a>
            <a href="#teachers" className="hover:text-emerald-800">
              For Teachers
            </a>
            <a href="#learners" className="hover:text-emerald-800">
              For Students
            </a>
            <a href="#stories" className="hover:text-emerald-800">
              Stories
            </a>
          </nav>

          {/* 오른쪽 로그인/가입 */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="hidden text-lg font-medium text-slate-700 hover:text-emerald-800 md:inline-block"
            >
              {/* text-base → text-lg */}
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-emerald-900 px-6 py-3 text-lg font-semibold text-emerald-50 hover:bg-emerald-800"
            >
              {/* 버튼도 살짝 키움 */}
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* 1️⃣ Hero Section – The First Screen (대문화면) */}
      <section className="border-b border-slate-200 bg-white text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-24 md:flex-row md:items-center md:py-28">
          {/* 왼쪽: 텍스트 */}
          <div className="flex-1 space-y-6">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              TOEFL · ACADEMY PLATFORM
            </p>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-emerald-900">
              For every TOEFL learner,
              <br />
              every classroom.
              <br />
              <span className="text-emerald-700">
                Real progress. Measurable results.
              </span>
            </h1>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-700">
              K-PRIME connects adaptive TOEFL practice, academy management, and
              real-time feedback into one place—so students, teachers, and
              parents can see exactly how learning grows.
            </p>

            {/* CTA 버튼 3개: Learners / Teachers / Parents */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/auth/signup?role=student"
                className="rounded-full bg-emerald-600 px-7 py-3 text-base font-semibold text-white hover:bg-emerald-500"
              >
                Learners
              </Link>
              <Link
                href="/auth/signup?role=teacher"
                className="rounded-full border border-slate-400 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                Teachers
              </Link>
              <Link
                href="/auth/signup?role=parent"
                className="rounded-full border border-slate-400 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                Parents
              </Link>
            </div>

            {/* 작은 서브텍스트 */}
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold underline-offset-2 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* 오른쪽: 로고 카드 */}
          <div className="flex-1">
            <div className="relative mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-300/60">
              <div className="flex flex-col items-center gap-5 text-center">
                <Image
                  src="/k-prime-logo.png"
                  alt="K-PRIME Academy"
                  width={180}
                  height={180}
                  className="h-44 w-44 object-contain"
                />
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-600">
                  SEEK TRUTH. MASTER LEARNING.
                </p>
                <p className="text-sm text-slate-700">
                  Adaptive TOEFL engine · Academy dashboard · Student progress
                  in one integrated platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ Programs Section */}
      <section
        id="programs"
        className="mx-auto max-w-6xl space-y-8 px-4 py-18 md:py-20"
      >
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Programs for every learner
          </h2>
          <p className="mt-1 text-base text-slate-600">
            From TOEFL iBT 2026 to middle school fundamentals, build the exact
            path your students need.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "TOEFL iBT 2026",
              desc: "Adaptive Reading & Listening, plus Speaking & Writing practice sets.",
            },
            {
              title: "Grammar & Structure",
              desc: "3-month intensive course for middle & high school learners.",
            },
            {
              title: "Reading & Writing Clinic",
              desc: "Paragraph analysis, summarizing, and essay coaching.",
            },
            {
              title: "Vocabulary Missions",
              desc: "Daily quests, spaced repetition, and perk-based motivation.",
            },
            {
              title: "Mock Tests",
              desc: "Full-length timed tests with clear, teacher-friendly reports.",
            },
            {
              title: "Academy Dashboard",
              desc: "Manage classes, track progress, and assign practice in seconds.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
              <button className="mt-4 w-fit text-sm font-semibold text-emerald-800 hover:text-emerald-900">
                Learn more →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3️⃣ Teachers Section */}
      <section
        id="teachers"
        className="border-y border-slate-100 bg-slate-50 py-18 md:py-20"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              TEACHERS
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Differentiate your classroom and engage every student.
            </h2>
            <p className="text-base text-slate-600">
              Assign TOEFL sets, see real-time results, and focus your class
              time on coaching—not paperwork. K-PRIME is built for 학원
              teachers who need both depth and speed.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-base text-slate-600">
              <li>Instant reports by skill, passage, and question type</li>
              <li>Auto-graded Reading & Listening with detailed explanations</li>
              <li>Homework tracking and class dashboards</li>
            </ul>
            <Link
              href="/auth/signup?role=teacher"
              className="inline-flex rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
            >
              Teachers, start here
            </Link>
          </div>

          <div className="flex-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                CLASS SNAPSHOT
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Reading – Inference</span>
                  <span>68% accuracy</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 w-2/3 rounded-full bg-emerald-600" />
                </div>

                <div className="mt-3 flex justify-between">
                  <span>Listening – Detail</span>
                  <span>74% accuracy</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 w-3/4 rounded-full bg-emerald-500" />
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  See which skills need work, then assign targeted practice in
                  one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ Learners Section */}
      <section
        id="learners"
        className="mx-auto max-w-6xl px-4 py-18 md:py-20"
      >
        <div className="flex flex-col gap-10 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              LEARNERS AND STUDENTS
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              You can learn anything.
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Build solid understanding in reading, listening, speaking, and
              writing. Every question you answer teaches the system how to help
              you next.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-base text-slate-600">
              <li>Adaptive difficulty that stays just above your comfort zone</li>
              <li>Instant explanations in clear, student-friendly English</li>
              <li>Perk system to keep daily practice fun and motivating</li>
            </ul>
            <Link
              href="/auth/signup?role=student"
              className="mt-5 inline-flex rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
            >
              Learners, start here
            </Link>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                TODAY&apos;S MISSION
              </p>
              <p className="mt-3 text-sm text-slate-800">
                Complete 1 Reading set and review 5 incorrect questions.
              </p>
              <p className="mt-3 text-xs text-slate-600">
                Finish today&apos;s mission to earn{" "}
                <span className="font-semibold text-emerald-700">+10 Perk</span>{" "}
                and keep your streak alive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ Stories Section */}
      <section
        id="stories"
        className="border-y border-slate-100 bg-slate-50 py-18 md:py-20"
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xl italic text-slate-800 md:text-2xl">
            “I used to guess my way through TOEFL Reading. With K-PRIME, I can
            finally see <span className="font-semibold">why</span> I got each
            question wrong—and what to fix next.”
          </p>
          <p className="mt-4 text-sm font-semibold tracking-[0.18em] text-slate-500">
            JIHO · HIGH SCHOOL STUDENT
          </p>
        </div>
      </section>

      {/* 6️⃣ Join Section */}
      <section
        id="join"
        className="mx-auto max-w-6xl px-4 py-18 md:py-20"
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Join K-PRIME today
            </h2>
            <p className="text-base text-slate-600">
              Start with a single class, or roll out to your whole Academy.
              K-PRIME grows with your learners.
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <Link
              href="/auth/signup?role=student"
              className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
            >
              Learners
            </Link>
            <Link
              href="/auth/signup?role=teacher"
              className="rounded-full bg-emerald-100 px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-200"
            >
              Teachers
            </Link>
            <Link
              href="/auth/signup?role=parent"
              className="rounded-full bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              Parents
            </Link>
          </div>
        </div>
      </section>

      {/* 7️⃣ Footer */}
      <footer className="bg-emerald-950 py-10 text-emerald-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:justify-between">
          <div className="space-y-2 text-base">
            <p className="font-semibold">Our mission</p>
            <p className="max-w-sm text-sm text-emerald-100/80">
              To seek truth, master learning, and make high-quality English
              education accessible for every motivated learner.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <div>
              <p className="mb-2 font-semibold">About</p>
              <ul className="space-y-1 text-emerald-100/80">
                <li>Our story</li>
                <li>For academies</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Programs</p>
              <ul className="space-y-1 text-emerald-100/80">
                <li>TOEFL iBT 2026</li>
                <li>Grammar & Reading</li>
                <li>Mock tests</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Contact</p>
              <ul className="space-y-1 text-emerald-100/80">
                <li>Help center</li>
                <li>Partnerships</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4 text-sm text-emerald-200/80">
          © {new Date().getFullYear()} K-PRIME. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
