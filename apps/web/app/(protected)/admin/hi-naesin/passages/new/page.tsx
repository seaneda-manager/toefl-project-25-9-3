import Link from 'next/link';
import { createHiNaesinPassageAction } from '../actions';

export const dynamic = 'force-dynamic';

export default function HiNaesinPassageNewPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / 고등내신 / 지문
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">새 지문 등록</h1>
        </div>
        <Link
          href="/admin/hi-naesin/passages"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          목록으로
        </Link>
      </header>

      <form action={createHiNaesinPassageAction} className="space-y-6">
        {/* ── 분류 ── */}
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">분류</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="출처 종류 *" name="source_type" as="select">
              <option value="">선택</option>
              <option value="mock_exam">모의고사</option>
              <option value="textbook">교과서</option>
              <option value="external_book">외부교재</option>
            </Field>

            <Field label="학년 *" name="grade" as="select">
              <option value="">선택</option>
              <option value="H1">고1</option>
              <option value="H2">고2</option>
              <option value="H3">고3</option>
            </Field>
          </div>

          {/* 모의고사 */}
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-700">
              모의고사 정보
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="연도" name="exam_year" placeholder="예: 2025" />
              <Field label="월" name="exam_month" placeholder="예: 9" />
              <Field label="원문제 번호" name="question_number" placeholder="예: 34" />
            </div>
          </details>

          {/* 교과서 */}
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-700">
              교과서 정보
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="학교명" name="school_name" placeholder="예: 한국고등학교" />
              <Field label="교과서명" name="textbook_name" placeholder="예: 천재 (이재영)" />
              <Field label="단원" name="unit_label" placeholder="예: Lesson 3" />
            </div>
          </details>

          {/* 외부교재 */}
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-700">
              외부교재 정보
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="교재명" name="book_name" placeholder="예: 자이스토리 고2" />
              <Field label="단원/번호" name="book_unit" placeholder="예: Part 2 - 15번" />
            </div>
          </details>
        </section>

        {/* ── 지문 본문 ── */}
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">지문</h2>

          <Field label="제목 (선택)" name="title" placeholder="예: The Power of Habit" />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">
              지문 원문 *
            </label>
            <textarea
              name="passage_text"
              required
              rows={10}
              placeholder="영어 지문을 붙여넣으세요."
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">
              전체 해석 (선택)
            </label>
            <textarea
              name="translation_ko"
              rows={6}
              placeholder="지문 전체 한국어 해석을 입력하세요."
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="단어 수 (선택)" name="word_count" placeholder="예: 180" />
            <Field
              label="토픽 태그 (쉼표 구분)"
              name="topic_tags"
              placeholder="예: environment, technology"
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/hi-naesin/passages"
            className="rounded-xl border px-5 py-2 text-sm hover:bg-neutral-50"
          >
            취소
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-neutral-900 px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            저장 후 편집 계속
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  as,
  children,
}: {
  label: string;
  name: string;
  placeholder?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
}) {
  if (as === 'select') {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-neutral-600">{label}</label>
        <select
          name={name}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
        >
          {children}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-600">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
      />
    </div>
  );
}
