import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { updateNaesinScopeAction } from "../../actions";

type PageProps = {
  params: Promise<{ scopeId: string }>;
};

type NaesinScopeRow = {
  id: string;
  title: string;
  school_name: string;
  school_level: string;
  academic_year: number;
  grade: string;
  semester: string;
  exam_type: string;
  memo: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
};

export const dynamic = "force-dynamic";

export default async function AdminNaesinScopeEditPage({ params }: PageProps) {
  const { scopeId } = await params;
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("naesin_exam_scopes")
    .select(
      "id, title, school_name, school_level, academic_year, grade, semester, exam_type, memo, start_date, end_date, is_active",
    )
    .eq("id", scopeId)
    .maybeSingle();

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          시험 범위를 불러오지 못했습니다.
          <div className="mt-2 text-xs">{error.message}</div>
        </div>
      </main>
    );
  }

  if (!data) notFound();

  const scope = data as NaesinScopeRow;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / Naesin / Scope Edit
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">시험 범위 수정</h1>
          <p className="mt-1 text-sm text-neutral-500">
            학교 / 학년 / 학기 / 시험유형과 범위 제목을 수정합니다.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/admin/naesin/scopes/${scope.id}`}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            상세로
          </Link>
          <Link
            href="/admin/naesin/scopes"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            목록으로
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border bg-white p-5">
        <form action={updateNaesinScopeAction} className="space-y-5">
          <input type="hidden" name="id" value={scope.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">school level</label>
              <select
                name="school_level"
                defaultValue={scope.school_level}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              >
                <option value="middle">middle</option>
                <option value="high">high</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">학교명</label>
              <input
                name="school_name"
                defaultValue={scope.school_name}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">academic year</label>
              <input
                name="academic_year"
                type="number"
                defaultValue={scope.academic_year}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">학년</label>
              <input
                name="grade"
                defaultValue={scope.grade}
                placeholder="예: 중2 / 고1"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">학기</label>
              <input
                name="semester"
                defaultValue={scope.semester}
                placeholder="예: 1학기"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">시험유형</label>
              <select
                name="exam_type"
                defaultValue={scope.exam_type}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              >
                <option value="midterm">midterm</option>
                <option value="final">final</option>
                <option value="monthly_exam">monthly_exam</option>
                <option value="practice">practice</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">범위 제목</label>
            <input
              name="title"
              defaultValue={scope.title}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">메모</label>
            <textarea
              name="memo"
              rows={4}
              defaultValue={scope.memo ?? ""}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">시작일</label>
              <input
                name="start_date"
                type="date"
                defaultValue={scope.start_date ?? ""}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">종료일</label>
              <input
                name="end_date"
                type="date"
                defaultValue={scope.end_date ?? ""}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">활성 상태</label>
            <select
              name="is_active"
              defaultValue={String(scope.is_active ?? true)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            >
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href={`/admin/naesin/scopes/${scope.id}`}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              취소
            </Link>
            <button
              type="submit"
              className="rounded-xl border bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              저장
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
