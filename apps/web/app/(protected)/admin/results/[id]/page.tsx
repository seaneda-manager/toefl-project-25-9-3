import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ResultDetail = {
  id: string;
  assignmentTitle: string;
  studentLabel: string;
  track: "naesin" | "junior" | "toefl";
  section: "reading" | "listening" | "speaking" | "writing" | "grammar" | "vocab";
  status: "completed" | "in_progress" | "not_started";
  score: string;
  submittedAt: string;
  weakLabels: string[];
  answers: {
    number: number;
    status: "correct" | "wrong";
    userAnswer: string;
    correctAnswer: string;
  }[];
};

const resultMap: Record<string, ResultDetail> = {
  res_001: {
    id: "res_001",
    assignmentTitle: "송도고1-1 중간 범위 A",
    studentLabel: "student_001",
    track: "naesin",
    section: "reading",
    status: "completed",
    score: "84",
    submittedAt: "2026-03-14 10:22",
    weakLabels: ["근거 찾기 약함", "문장 구조 약함"],
    answers: [
      { number: 1, status: "correct", userAnswer: "2", correctAnswer: "2" },
      { number: 2, status: "wrong", userAnswer: "3", correctAnswer: "1" },
      { number: 3, status: "correct", userAnswer: "4", correctAnswer: "4" },
      { number: 4, status: "wrong", userAnswer: "1", correctAnswer: "2" },
    ],
  },
  res_002: {
    id: "res_002",
    assignmentTitle: "Junior Reading Passage 01",
    studentLabel: "student_002",
    track: "junior",
    section: "reading",
    status: "in_progress",
    score: "-",
    submittedAt: "-",
    weakLabels: ["진행중"],
    answers: [],
  },
  res_003: {
    id: "res_003",
    assignmentTitle: "TOEFL Reading Drill Set 01",
    studentLabel: "student_003",
    track: "toefl",
    section: "reading",
    status: "completed",
    score: "92",
    submittedAt: "2026-03-13 18:40",
    weakLabels: ["어휘 약점 소폭"],
    answers: [
      { number: 1, status: "correct", userAnswer: "1", correctAnswer: "1" },
      { number: 2, status: "correct", userAnswer: "3", correctAnswer: "3" },
      { number: 3, status: "correct", userAnswer: "2", correctAnswer: "2" },
    ],
  },
};

function trackLabel(track: ResultDetail["track"]) {
  switch (track) {
    case "naesin":
      return "내신";
    case "junior":
      return "주니어";
    case "toefl":
      return "TOEFL";
    default:
      return track;
  }
}

function sectionLabel(section: ResultDetail["section"]) {
  switch (section) {
    case "reading":
      return "리딩";
    case "listening":
      return "리스닝";
    case "speaking":
      return "스피킹";
    case "writing":
      return "라이팅";
    case "grammar":
      return "문법";
    case "vocab":
      return "보카";
    default:
      return section;
  }
}

function statusLabel(status: ResultDetail["status"]) {
  switch (status) {
    case "completed":
      return "완료";
    case "in_progress":
      return "진행중";
    case "not_started":
      return "미시작";
    default:
      return status;
  }
}

function statusBadgeClass(status: ResultDetail["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "not_started":
      return "border-neutral-300 bg-neutral-50 text-neutral-700";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-700";
  }
}

function answerBadgeClass(status: "correct" | "wrong") {
  switch (status) {
    case "correct":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "wrong":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-700";
  }
}

export const dynamic = "force-dynamic";

export default async function AdminResultDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = resultMap[id];

  if (!result) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="rounded-2xl border bg-white px-4 py-10 text-center text-sm text-neutral-500">
          해당 결과를 찾을 수 없습니다.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Admin / Results / Detail
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {result.assignmentTitle}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                result.status,
              )}`}
            >
              {statusLabel(result.status)}
            </span>
          </div>

          <p className="text-sm text-neutral-500">
            {result.studentLabel} · {trackLabel(result.track)} · {sectionLabel(result.section)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/results"
            className="rounded-xl border px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            결과 보드
          </Link>
          <Link
            href="/reading/review"
            className="rounded-xl border px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            리뷰 보기
          </Link>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">학생</div>
          <div className="mt-2 text-lg font-semibold text-neutral-900">{result.studentLabel}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">점수</div>
          <div className="mt-2 text-lg font-semibold text-neutral-900">{result.score}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">제출 시각</div>
          <div className="mt-2 text-lg font-semibold text-neutral-900">{result.submittedAt}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">약점 라벨</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.weakLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border px-2.5 py-1 text-xs text-neutral-700"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">
          문항별 결과
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>문항</th>
                <th>상태</th>
                <th>학생 답</th>
                <th>정답</th>
              </tr>
            </thead>
            <tbody>
              {result.answers.map((answer) => (
                <tr key={answer.number} className="border-t [&>td]:px-4 [&>td]:py-3">
                  <td className="font-medium text-neutral-900">{answer.number}</td>
                  <td>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${answerBadgeClass(
                        answer.status,
                      )}`}
                    >
                      {answer.status === "correct" ? "정답" : "오답"}
                    </span>
                  </td>
                  <td className="text-neutral-700">{answer.userAnswer}</td>
                  <td className="text-neutral-700">{answer.correctAnswer}</td>
                </tr>
              ))}

              {result.answers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                    아직 제출된 답안이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
