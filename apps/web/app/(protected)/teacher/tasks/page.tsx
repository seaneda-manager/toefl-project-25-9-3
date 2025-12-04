// apps/web/app/(protected)/teacher/tasks/page.tsx
import {
  CheckCircle2,
  Circle,
  RefreshCcw,
  Plus,
  Filter,
  CalendarDays,
} from "lucide-react";

import type { Task, TaskStatus } from "@/components/teacher/mock-tasks";
import { mockTasks } from "@/components/teacher/mock-tasks";

export const dynamic = "force-dynamic";

export default function TeacherTasksPage() {
  const pending = mockTasks.filter((t) => t.status === "pending");
  const overdue = mockTasks.filter((t) => t.status === "overdue");
  const done = mockTasks.filter((t) => t.status === "done");

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">할 일 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            학부모 상담, 채점, 과제, 수업 준비 등 선생님 업무를 한 곳에서 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5" />
            필터
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <CalendarDays className="h-3.5 w-3.5" />
            기간 선택
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" />
            새 할 일
          </button>
        </div>
      </header>

      {/* 요약 카드 */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="진행 중"
          value={`${pending.length}개`}
          description="오늘/이번 주에 처리해야 할 일"
        />
        <SummaryCard
          label="지연됨"
          value={`${overdue.length}개`}
          description="기한이 지난 일 (재스케줄 필요)"
          tone="warning"
        />
        <SummaryCard
          label="완료"
          value={`${done.length}개`}
          description="최근 완료한 업무"
          tone="success"
        />
      </section>

      {/* 메인 그리드 */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* 왼쪽: 오늘/지연/완료 요약 */}
        <div className="space-y-4 lg:col-span-1">
          <TaskSection title="오늘/이번 주 할 일" tasks={[...pending]} />
          <TaskSection
            title="지연 · 재스케줄 필요"
            tasks={[...overdue]}
            variant="warning"
          />
          <TaskSection
            title="최근 완료"
            tasks={[...done]}
            variant="success"
            compact
          />
        </div>

        {/* 오른쪽: 전체 리스트 + 카테고리/학생별 묶음 */}
        <div className="space-y-4 lg:col-span-2">
          <AllTasksTable tasks={mockTasks} />

          <div className="grid gap-4 md:grid-cols-2">
            <TaskGroupCard
              title="채점 관련 할 일"
              tasks={mockTasks.filter((t) => t.category === "채점")}
            />
            <TaskGroupCard
              title="상담 · 관리 업무"
              tasks={mockTasks.filter(
                (t) => t.category === "상담" || t.category === "관리",
              )}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================
 *  Summary Card
 * =======================*/

function SummaryCard(props: {
  label: string;
  value: string;
  description?: string;
  tone?: "default" | "warning" | "success";
}) {
  const { label, value, description, tone = "default" } = props;

  const borderClass =
    tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "success"
      ? "border-emerald-300 bg-emerald-50"
      : "border-gray-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${borderClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

/* =========================
 *  Task Section
 * =======================*/

function TaskSection(props: {
  title: string;
  tasks: Task[];
  variant?: "default" | "warning" | "success";
  compact?: boolean;
}) {
  const { title, tasks, variant = "default", compact } = props;

  const headerTone =
    variant === "warning"
      ? "text-amber-700"
      : variant === "success"
      ? "text-emerald-700"
      : "text-gray-900";

  const icon =
    variant === "warning" ? (
      <RefreshCcw className="h-4 w-4 text-amber-600" />
    ) : variant === "success" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    ) : (
      <Circle className="h-4 w-4 text-gray-500" />
    );

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className={`flex items-center gap-2 text-sm font-semibold ${headerTone}`}>
          {icon}
          <span>{title}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-gray-500">해당되는 할 일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-start justify-between rounded-lg border px-3 py-2 ${
                variant === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : variant === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">{t.label}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {t.studentName ? `학생: ${t.studentName} · ` : ""}
                  {t.category} · {t.dueDisplay}
                </p>
              </div>
              {!compact && (
                <button className="ml-2 rounded-full border bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50">
                  상태 변경
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================
 *  All Tasks Table
 * =======================*/

function AllTasksTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">전체 할 일 목록</h2>
        <p className="text-[11px] text-gray-500">
          상태, 카테고리, 학생 기준으로 나중에 필터를 추가할 수 있습니다.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-[11px] text-gray-500">
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">할 일</th>
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2">학생</th>
              <th className="px-3 py-2">기한</th>
              <th className="px-3 py-2 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-3 py-2 align-top">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-gray-800">
                  {t.label}
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-gray-600">
                  {t.category}
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-gray-600">
                  {t.studentName ?? "-"}
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-gray-600">
                  {t.dueDisplay}
                </td>
                <td className="px-3 py-2 align-top text-right">
                  <button className="rounded-full border bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50">
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================
 *  Status Badge
 * =======================*/

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        완료
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        <RefreshCcw className="h-3 w-3" />
        지연
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
      <Circle className="h-3 w-3" />
      진행 중
    </span>
  );
}

/* =========================
 *  Task Group Card
 * =======================*/

function TaskGroupCard({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-500">해당 카테고리의 할 일이 없습니다.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between text-[11px]">
              <span className="line-clamp-1 text-gray-800">{t.label}</span>
              <span className="text-[10px] text-gray-500">{t.dueDisplay}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
