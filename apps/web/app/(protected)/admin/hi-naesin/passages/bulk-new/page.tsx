import Link from 'next/link';
import { bulkCreateHiNaesinPassagesAction } from './actions';

export const dynamic = 'force-dynamic';

const EXAMPLE_MOCK = `#34
Every morning, Sarah makes a decision that seems small but carries great weight. She chooses to walk to work instead of driving, a habit she started three years ago after reading about urban sustainability.

===

#35
The relationship between language and thought has fascinated philosophers and linguists for centuries. Some argue that the language we speak shapes the way we perceive reality, while others maintain that thought exists independently of language.`;

const EXAMPLE_TEXTBOOK = `The Importance of Sleep
Sleep is not merely a period of rest but an active process essential to our physical and mental well-being. During sleep, the brain consolidates memories, repairs tissue, and regulates hormones.

===

Digital Literacy in the Modern Age
As technology becomes increasingly integrated into daily life, the ability to critically evaluate digital information has emerged as a fundamental skill for citizens of the twenty-first century.`;

export default function HiNaesinBulkNewPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / 고등내신 / 지문 일괄 등록
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">챕터별 일괄 등록</h1>
          <p className="mt-1 text-sm text-neutral-500">
            여러 지문을 <code className="rounded bg-neutral-100 px-1 font-mono text-xs">===</code> 로 구분해서 한 번에 등록합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/hi-naesin/passages/new"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            단건 등록
          </Link>
          <Link
            href="/admin/hi-naesin/passages"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            목록으로
          </Link>
        </div>
      </header>

      <form action={bulkCreateHiNaesinPassagesAction} className="space-y-6">

        {/* ── 공통 분류 ── */}
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900">공통 분류 <span className="text-neutral-400 font-normal">(모든 지문에 적용)</span></h2>

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
              모의고사 공통 정보
            </summary>
            <p className="mt-2 text-xs text-neutral-400">
              문제 번호는 각 지문 첫 줄에 <code className="rounded bg-neutral-100 px-1 font-mono">#34</code> 형태로 개별 지정하세요.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="연도" name="exam_year" placeholder="예: 2025" />
              <Field label="월" name="exam_month" placeholder="예: 9" />
            </div>
          </details>

          {/* 교과서 */}
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-700">
              교과서 공통 정보
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
              외부교재 공통 정보
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="교재명" name="book_name" placeholder="예: 자이스토리 고2" />
              <Field label="단원/번호" name="book_unit" placeholder="예: Part 2" />
            </div>
          </details>
        </section>

        {/* ── 지문 입력 ── */}
        <section className="rounded-2xl border bg-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">지문 입력</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                지문 사이를 <code className="rounded bg-neutral-100 px-1 font-mono text-xs">===</code> 로 구분하세요. 첫 줄이 짧으면 제목으로, <code className="rounded bg-neutral-100 px-1 font-mono text-xs">#34</code> 이면 문제번호로 처리됩니다.
              </p>
            </div>
          </div>

          {/* 예시 토글 */}
          <details className="rounded-xl border border-dashed p-3">
            <summary className="cursor-pointer text-xs font-medium text-neutral-500">
              입력 예시 보기
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <p className="mb-1 font-semibold text-neutral-600">모의고사</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 font-mono text-neutral-700 leading-relaxed">
                  {EXAMPLE_MOCK}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-semibold text-neutral-600">교과서</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 font-mono text-neutral-700 leading-relaxed">
                  {EXAMPLE_TEXTBOOK}
                </pre>
              </div>
            </div>
          </details>

          <textarea
            name="passages_raw"
            required
            rows={20}
            placeholder={`첫 번째 지문 내용\n\n===\n\n두 번째 지문 내용\n\n===\n\n세 번째 지문 내용`}
            className="w-full rounded-xl border px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
          />
        </section>

        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            저장 후 각 지문을 개별 편집할 수 있습니다.
          </p>
          <div className="flex gap-3">
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
              일괄 등록
            </button>
          </div>
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
