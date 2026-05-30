// apps/web/app/(protected)/admin/results/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StudentTaskStatus = "todo" | "in_progress" | "done";
type StudentTaskPriority = "low" | "medium" | "high";
type TrackKey = "voca" | "naesin" | "toefl" | "junior" | "unknown";

type RawStudentTask = {
  id: string;
  student_id: string;
  teacher_id: string | null;
  title: string | null;
  description: string | null;
  status: StudentTaskStatus;
  priority: StudentTaskPriority;
  kind: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  start_at: string | null;
  due_at: string | null;
  payload_json: unknown;
};

type TaskRowView = {
  id: string;
  studentId: string;
  studentLabel: string;
  studentMeta: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: StudentTaskStatus;
  priority: StudentTaskPriority;
  kind: string | null;
  track: TrackKey;
  dueLabel: string | null;
  completedLabel: string | null;
  createdLabel: string | null;
};

type TrackSummary = {
  track: TrackKey;
  label: string;
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  studentCount: number;
};

const STATUS_META: Record<StudentTaskStatus, { label: string; tone: string }> = {
  todo: {
    label: "할 일",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  },
  in_progress: {
    label: "진행 중",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  done: {
    label: "완료",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

const PRIORITY_META: Record<StudentTaskPriority, { label: string; tone: string }> = {
  low: {
    label: "낮음",
    tone: "border-slate-200 bg-white text-slate-600",
  },
  medium: {
    label: "보통",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  high: {
    label: "높음",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

const TRACK_META: Record<TrackKey, { label: string; tone: string }> = {
  voca: {
    label: "VOCA",
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  naesin: {
    label: "NAESIN",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  toefl: {
    label: "TOEFL",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  junior: {
    label: "JUNIOR",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  unknown: {
    label: "UNKNOWN",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

const TRACK_ORDER: TrackKey[] = ["voca", "naesin", "junior", "toefl", "unknown"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function shortStudentLabel(studentId: string) {
  return `학생 ${studentId.slice(0, 8)}`;
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
    hour12: false,
  }).format(d);
}

function inferTrack(kind: string | null, payloadJson: unknown): TrackKey {
  const payload = isRecord(payloadJson) ? payloadJson : null;
  const spec = payload && isRecord(payload.spec) ? payload.spec : null;

  const rawKind = asString(kind)?.toUpperCase();
  const specKind = asString(spec?.kind)?.toUpperCase();
  const program = asString(spec?.program)?.toLowerCase();
  const track = asString(spec?.track)?.toLowerCase();

  if (rawKind === "LINGO_VOCAB" || specKind === "LINGO_VOCAB") return "voca";
  if (rawKind === "NAESIN" || specKind === "NAESIN" || program === "naesin" || track === "naesin") {
    return "naesin";
  }
  if (rawKind === "TOEFL" || specKind === "TOEFL" || program === "toefl" || track === "toefl") {
    return "toefl";
  }
  if (rawKind === "JUNIOR" || specKind === "JUNIOR" || program === "junior" || track === "junior") {
    return "junior";
  }

  return "unknown";
}

function buildTitle(task: RawStudentTask) {
  const payload = isRecord(task.payload_json) ? task.payload_json : null;
  const spec = payload && isRecord(payload.spec) ? payload.spec : null;
  const chapter = spec && isRecord(spec.chapter) ? spec.chapter : null;

  const curriculumLabel = asString(spec?.curriculumLabel);
  const chapterLabel = asString(chapter?.label);
  const packageId = asString(spec?.packageId);

  const title =
    [curriculumLabel, chapterLabel].filter(Boolean).join(" · ") ||
    task.title ||
    "학생 과제";

  const subtitle =
    [packageId, chapterLabel].filter(Boolean).join(" · ") ||
    asString(task.kind);

  return { title, subtitle: subtitle || null };
}

function parseTask(task: RawStudentTask, studentName: string | null): TaskRowView {
  const titleInfo = buildTitle(task);
  const fallback = shortStudentLabel(task.student_id);

  return {
    id: task.id,
    studentId: task.student_id,
    studentLabel: studentName || fallback,
    studentMeta: studentName ? fallback : null,
    title: titleInfo.title,
    subtitle: titleInfo.subtitle,
    description: task.description,
    status: task.status,
    priority: task.priority,
    kind: task.kind,
    track: inferTrack(task.kind, task.payload_json),
    dueLabel: formatDateTime(task.due_at ?? task.due_date),
    completedLabel: formatDateTime(task.completed_at),
    createdLabel: formatDateTime(task.created_at),
  };
}

async function resolveStudentNameMap(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  studentIds: string[]
) {
  const ids = Array.from(new Set(studentIds.filter(Boolean)));
  const nameMap = new Map<string, string>();

  if (ids.length === 0) return nameMap;

  // 1) student_tasks.student_id = academy_students.id
  {
    const { data, error } = await supabase
      .from("academy_students")
      .select("id, full_name, display_name, email, login_id")
      .in("id", ids);

    if (!error && data) {
      for (const raw of data as Record<string, unknown>[]) {
        const id = asString(raw.id);
        if (!id) continue;

        const label =
          asString(raw.full_name) ||
          asString(raw.display_name) ||
          asString(raw.email) ||
          asString(raw.login_id) ||
          null;

        if (label) {
          nameMap.set(id, label);
        }
      }
    }
  }

  // 2) fallback: academy_students.profile_id / user_id / auth_user_id -> profiles
  const unresolved = ids.filter((id) => !nameMap.has(id));

  if (unresolved.length > 0) {
    const { data: academyRows, error: academyErr } = await supabase
      .from("academy_students")
      .select("id, profile_id, user_id, auth_user_id")
      .in("id", unresolved);

    if (!academyErr && academyRows) {
      const profileIds = Array.from(
        new Set(
          (academyRows as Record<string, unknown>[])
            .flatMap((row) => [
              asString(row.profile_id),
              asString(row.user_id),
              asString(row.auth_user_id),
            ])
            .filter((v): v is string => !!v)
        )
      );

      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, full_name, name, email")
          .in("id", profileIds);

        if (!profilesErr && profilesData) {
          const profileMap = new Map<string, string>();

          for (const raw of profilesData as Record<string, unknown>[]) {
            const id = asString(raw.id);
            if (!id) continue;

            const label =
              asString(raw.full_name) ||
              asString(raw.name) ||
              asString(raw.email) ||
              null;

            if (label) {
              profileMap.set(id, label);
            }
          }

          for (const row of academyRows as Record<string, unknown>[]) {
            const academyId = asString(row.id);
            if (!academyId || nameMap.has(academyId)) continue;

            const linkedProfileId =
              asString(row.profile_id) ||
              asString(row.user_id) ||
              asString(row.auth_user_id) ||
              null;

            if (!linkedProfileId) continue;

            const linkedLabel = profileMap.get(linkedProfileId);
            if (linkedLabel) {
              nameMap.set(academyId, linkedLabel);
            }
          }
        }
      }
    }
  }

  return nameMap;
}

function buildTrackSummaries(rows: TaskRowView[]): TrackSummary[] {
  const base = new Map<
    TrackKey,
    {
      total: number;
      todo: number;
      inProgress: number;
      done: number;
      students: Set<string>;
    }
  >();

  for (const track of TRACK_ORDER) {
    base.set(track, {
      total: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      students: new Set<string>(),
    });
  }

  for (const row of rows) {
    const bucket = base.get(row.track);
    if (!bucket) continue;

    bucket.total += 1;
    bucket.students.add(row.studentId);

    if (row.status === "todo") bucket.todo += 1;
    if (row.status === "in_progress") bucket.inProgress += 1;
    if (row.status === "done") bucket.done += 1;
  }

  return TRACK_ORDER.map((track) => {
    const bucket = base.get(track)!;
    return {
      track,
      label: TRACK_META[track].label,
      total: bucket.total,
      todo: bucket.todo,
      inProgress: bucket.inProgress,
      done: bucket.done,
      studentCount: bucket.students.size,
    };
  }).filter((item) => item.total > 0 || item.track !== "unknown");
}

function StatusColumn({
  status,
  items,
}: {
  status: StudentTaskStatus;
  items: TaskRowView[];
}) {
  const meta = STATUS_META[status];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
            {meta.label}
          </span>
          <span className="text-sm font-semibold text-slate-500">{items.length}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          표시할 항목이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const priority = PRIORITY_META[item.priority];
            const trackMeta = TRACK_META[item.track];

            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${trackMeta.tone}`}
                  >
                    {trackMeta.label}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priority.tone}`}
                  >
                    우선순위 {priority.label}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">{item.studentLabel}</p>
                  {item.studentMeta ? (
                    <p className="text-[11px] text-slate-400">{item.studentMeta}</p>
                  ) : null}

                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>

                  {item.subtitle ? (
                    <p className="text-sm font-medium text-slate-600">{item.subtitle}</p>
                  ) : null}

                  {item.description ? (
                    <p className="text-sm text-slate-500">{item.description}</p>
                  ) : null}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {item.createdLabel ? <p>생성 {item.createdLabel}</p> : null}
                  {item.dueLabel ? <p>마감 {item.dueLabel}</p> : null}
                  {status === "done" && item.completedLabel ? <p>완료 {item.completedLabel}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function AdminResultsPage() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Results</h1>
          <p className="mt-2 text-sm text-slate-500">로그인이 필요합니다.</p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("student_tasks")
    .select(
      "id, student_id, teacher_id, title, description, status, priority, kind, due_date, completed_at, created_at, updated_at, start_at, due_at, payload_json"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  const rawTasks = (data ?? []) as RawStudentTask[];
  const studentIds = rawTasks.map((task) => task.student_id);
  const studentNameMap = await resolveStudentNameMap(supabase, studentIds);

  const rows = rawTasks.map((task) => parseTask(task, studentNameMap.get(task.student_id) ?? null));

  const grouped: Record<StudentTaskStatus, TaskRowView[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const row of rows) {
    grouped[row.status].push(row);
  }

  const todoCount = grouped.todo.length;
  const progressCount = grouped.in_progress.length;
  const doneCount = grouped.done.length;
  const uniqueStudents = new Set(rows.map((r) => r.studentId)).size;
  const trackSummaries = buildTrackSummaries(rows);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-700">Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Results Board</h1>
            <p className="mt-2 text-sm text-slate-500">
              현재는 점수 테이블 대신 student_tasks 기준으로 학생별 결과 운영 현황을 표시합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/tasks"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              학생 과제 보기
            </Link>
            <Link
              href="/admin/content"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              콘텐츠 관리
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            student_tasks 조회 중 오류가 발생했습니다: {error.message}
          </div>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">전체 task</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">학생 수</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{uniqueStudents}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">할 일</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{todoCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">진행 중</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{progressCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">완료</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{doneCount}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {trackSummaries.map((summary) => {
          const trackMeta = TRACK_META[summary.track];

          return (
            <div key={summary.track} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">Track Summary</p>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${trackMeta.tone}`}
                >
                  {summary.label}
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">{summary.total}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-400">학생</p>
                  <p className="mt-1 font-semibold text-slate-800">{summary.studentCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-400">완료</p>
                  <p className="mt-1 font-semibold text-slate-800">{summary.done}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-400">할 일</p>
                  <p className="mt-1 font-semibold text-slate-800">{summary.todo}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-400">진행 중</p>
                  <p className="mt-1 font-semibold text-slate-800">{summary.inProgress}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <StatusColumn status="todo" items={grouped.todo} />
        <StatusColumn status="in_progress" items={grouped.in_progress} />
        <StatusColumn status="done" items={grouped.done} />
      </section>
    </main>
  );
}
