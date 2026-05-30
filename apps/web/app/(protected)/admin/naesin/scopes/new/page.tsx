import Link from "next/link";
import { createNaesinScopeAction } from "../actions";

export const dynamic = "force-dynamic";

export default function AdminNaesinScopesNewPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / Naesin / Scopes
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            새 시험 범위 만들기
          </h1>
        </div>

        <Link
          href="/admin/naesin/scopes"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          목록으로
        </Link>
      </header>

      <form
        action={createNaesinScopeAction}
        className="space-y-6 rounded-2xl border bg-white p-5"
      >
        <section className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="school_level"
            name="school_level"
            required
            options={["middle", "high"]}
          />
          <Field label="school_name" name="school_name" required />
          <Field
            label="academic_year"
            name="academic_year"
            required
            defaultValue={String(new Date().getFullYear())}
          />
          <Field label="grade" name="grade" required placeholder="예: 고1 / 중2" />
          <Field label="semester" name="semester" required placeholder="예: 1학기" />
          <SelectField
            label="exam_type"
            name="exam_type"
            required
            options={["midterm", "final", "monthly_exam", "practice"]}
          />
          <Field label="title" name="title" required placeholder="범위 제목" />
          <Field label="start_date" name="start_date" placeholder="YYYY-MM-DD" />
          <Field label="end_date" name="end_date" placeholder="YYYY-MM-DD" />
        </section>

        <section>
          <TextAreaField
            label="memo"
            name="memo"
            placeholder="시험 범위 메모"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="is_active"
            name="is_active"
            required
            options={["true", "false"]}
            defaultValue="true"
          />
        </section>

        <div className="rounded-xl border border-dashed p-4 text-sm text-neutral-500">
          다음 단계에서 여기에 content 검색 → scope item 추가 UI를 붙인다.
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            저장
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <textarea
        name={name}
        placeholder={placeholder}
        className="min-h-[100px] w-full rounded-xl border px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  required,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={`${name}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
