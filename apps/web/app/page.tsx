// apps/web/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Left Logo */}
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
                K-PRIME
              </div>
              <div className="text-sm text-slate-500">SEEK TRUTH. MASTER LEARNING.</div>
            </div>
          </div>

          {/* Center Menu */}
          <nav className="hidden items-center gap-7 text-lg font-medium text-slate-700 md:flex">
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

          {/* Right Auth + Product Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/toefl"
              className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-slate-50 md:inline-flex"
            >
              UPDATED-TOEFL
            </Link>
            <Link
              href="/lingox"
              className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-slate-50 md:inline-flex"
            >
              Lingo-X
            </Link>

            <Link
              href="/auth/login"
              className="hidden text-lg font-medium text-slate-700 hover:text-emerald-800 md:inline-block"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-emerald-900 px-6 py-3 text-lg font-semibold text-emerald-50 hover:bg-emerald-800"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-24 md:flex-row md:items-center md:py-28">
          {/* Left Text */}
          <div className="flex-1 space-y-6">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              TOEFL · ACADEMY PLATFORM
            </p>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-emerald-900">
              One platform,
              <br />
              two engines.
              <br />
              <span className="text-emerald-700">UPDATED-TOEFL and Lingo-X.</span>
            </h1>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-700">
              K-PRIME runs two focused programs side by side.
              Enter the TOEFL test engine, or jump into Lingo-X for daily vocab missions
              and academy workflows.
            </p>

            {/* Product Entry CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/toefl"
                className="rounded-full bg-emerald-900 px-7 py-3 text-base font-semibold text-emerald-50 hover:bg-emerald-800"
              >
                Enter UPDATED-TOEFL
              </Link>
              <Link
                href="/lingox"
                className="rounded-full border border-slate-400 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                Enter Lingo-X
              </Link>
              <Link
                href="/home"
                className="rounded-full border border-slate-200 bg-white px-7 py-3 text-base font-semibold text-emerald-900 hover:bg-slate-50"
              >
                Portal (Logged-in)
              </Link>
            </div>

            {/* Role Signup CTAs */}
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

          {/* Right Card */}
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
                  UPDATED-TOEFL for test practice, Lingo-X for daily vocab systems and academy ops.
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <Link
                    href="/toefl"
                    className="rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
                  >
                    Go to UPDATED-TOEFL
                  </Link>
                  <Link
                    href="/lingox"
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-slate-50"
                  >
                    Go to Lingo-X
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section
        id="programs"
        className="mx-auto max-w-6xl space-y-8 px-4 py-18 md:py-20"
      >
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Programs for every learner
          </h2>
          <p className="mt-1 text-base text-slate-600">
            Two programs, one account. Pick a lane, or run both.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "UPDATED-TOEFL",
              desc: "Adaptive Reading and Listening practice with clear analytics.",
              href: "/toefl",
              tag: "TOEFL",
            },
            {
              title: "Lingo-X Vocabulary",
              desc: "Daily missions: synonyms, word forms, blanks, collocations.",
              href: "/lingox",
              tag: "LINGO-X",
            },
            {
              title: "Mock Tests",
              desc: "Timed sets, auto scoring, teacher-friendly reports.",
              href: "/toefl/home",
              tag: "TOEFL",
            },
            {
              title: "Academy Dashboard",
              desc: "Assign, track, analyze. Fast operations for 학원 teachers.",
              href: "/lingox/home",
              tag: "LINGO-X",
            },
            {
              title: "Grammar and Structure",
              desc: "Structured training for middle and high school learners.",
              href: "/toefl/home",
              tag: "TOEFL",
            },
            {
              title: "Vocabulary Missions (Advanced)",
              desc: "Spaced repetition, weak-word queue, and perk-based rhythm.",
              href: "/lingox/home",
              tag: "LINGO-X",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
            >
              <div>
                <div className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-slate-200">
                  {item.tag}
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
              <Link
                href={item.href}
                className="mt-4 w-fit text-sm font-semibold text-emerald-800 hover:text-emerald-900"
              >
                Enter →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Teachers */}
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
              Assign sets, see results, and focus on coaching.
              Use UPDATED-TOEFL for test practice and Lingo-X for vocab systems and daily flow.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-base text-slate-600">
              <li>Reports by skill, passage, and question type</li>
              <li>Auto-graded Reading and Listening with explanations</li>
              <li>Homework tracking and class dashboards</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/toefl"
                className="inline-flex rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
              >
                UPDATED-TOEFL
              </Link>
              <Link
                href="/lingox"
                className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-slate-50"
              >
                Lingo-X
              </Link>
            </div>
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
                  See weak areas, then assign targeted practice in one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learners */}
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
              Practice test skills in UPDATED-TOEFL, and build daily vocab power in Lingo-X.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-base text-slate-600">
              <li>Adaptive difficulty stays just above comfort zone</li>
              <li>Instant explanations in clear, student-friendly English</li>
              <li>Daily rhythm with missions and progress tracking</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/toefl"
                className="inline-flex rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
              >
                Start UPDATED-TOEFL
              </Link>
              <Link
                href="/lingox"
                className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-slate-50"
              >
                Start Lingo-X
              </Link>
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                TODAY&apos;S MISSION
              </p>
              <p className="mt-3 text-sm text-slate-800">
                Complete 1 set in UPDATED-TOEFL and 1 mission in Lingo-X.
              </p>
              <p className="mt-3 text-xs text-slate-600">
                Keep your streak alive and build momentum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section
        id="stories"
        className="border-y border-slate-100 bg-slate-50 py-18 md:py-20"
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xl italic text-slate-800 md:text-2xl">
            “I used to guess my way through TOEFL Reading. With K-PRIME, I can
            finally see <span className="font-semibold">why</span> I got each
            question wrong and what to fix next.”
          </p>
          <p className="mt-4 text-sm font-semibold tracking-[0.18em] text-slate-500">
            JIHO · HIGH SCHOOL STUDENT
          </p>
        </div>
      </section>

      {/* Join */}
      <section id="join" className="mx-auto max-w-6xl px-4 py-18 md:py-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Join K-PRIME today
            </h2>
            <p className="text-base text-slate-600">
              One account. Two programs. Start small, scale fast.
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

      {/* Footer */}
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
                <li>UPDATED-TOEFL</li>
                <li>Lingo-X Vocabulary</li>
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