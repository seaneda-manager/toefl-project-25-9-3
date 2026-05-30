import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase/server';
import { toggleHiNaesinPassagePublishedAction } from './actions';
import { sourceTypeLabel, gradeLabel } from '@/models/hi-naesin';
import type { HiNaesinPassageRow } from '@/models/hi-naesin';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  source_type?: string;
  grade?: string;
  q?: string;
}>;

export default async function HiNaesinPassageListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await getServerSupabase();

  let query = supabase
    .from('hi_naesin_passages')
    .select(
      'id, source_type, grade, exam_year, exam_month, question_number, school_name, textbook_name, unit_label, book_name, book_unit, title, passage_text, translation_ko, word_count, topic_tags, is_published, created_at, updated_at',
    )
    .order('updated_at', { ascending: false });

  if (sp.source_type) query = query.eq('source_type', sp.source_type);
  if (sp.grade) query = query.eq('grade', sp.grade);
  if (sp.q) query = query.ilike('title', `%${sp.q}%`);

  const { data, error } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          불러오기 실패: {error.message}
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as HiNaesinPassageRow[];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / 고등내신
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">지문 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">
            고등 내신 지문 라이브러리 — 모의고사 · 교과서 · 외부교재
          </p>
        </div>
        <Link
          href="/admin/hi-naesin/passages/new"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 self-start"
        >
          + 새 지문 등록
        </Link>
      </header>

      {/* 필터 */}
      <section className="rounded-2xl border bg-white p-4">
        <form className="flex flex-wrap gap-3">
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="제목 검색"
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          />
          <select
            name="source_type"
            defaultValue={sp.source_type ?? ''}
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          >
            <option value="">전체 출처</option>
            <option value="mock_exam">모의고사</option>
            <option value="textbook">교과서</option>
            <option value="external_book">외부교재</option>
          </select>
          <select
            name="grade"
            defaultValue={sp.grade ?? ''}
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          >
            <option value="">전체 학년</option>
            <option value="H1">고1</option>
            <option value="H2">고2</option>
            <option value="H3">고3</option>
          </select>
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            적용
          </button>
        </form>
      </section>

      {/* 목록 */}
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">
          지문 {rows.length}개
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>제목 / 정보</th>
                <th>출처</th>
                <th>학년</th>
                <th>Drill</th>
                <th>변형문제</th>
                <th>공개</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hint = buildHint(row);
                return (
                  <tr key={row.id} className="border-t [&>td]:px-4 [&>td]:py-3">
                    <td>
                      <div className="font-medium text-neutral-900">
                        {row.title ?? '(제목 없음)'}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>
                    </td>
                    <td>{sourceTypeLabel(row.source_type as never)}</td>
                    <td>{gradeLabel(row.grade as never)}</td>
                    <td>
                      <span className="text-xs text-neutral-400">—</span>
                    </td>
                    <td>
                      <span className="text-xs text-neutral-400">—</span>
                    </td>
                    <td>
                      <form action={toggleHiNaesinPassagePublishedAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input
                          type="hidden"
                          name="is_published"
                          value={String(!row.is_published)}
                        />
                        <button
                          type="submit"
                          className={[
                            'rounded-full border px-3 py-1 text-xs',
                            row.is_published
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-neutral-300 bg-neutral-50 text-neutral-600',
                          ].join(' ')}
                        >
                          {row.is_published ? '공개' : '비공개'}
                        </button>
                      </form>
                    </td>
                    <td>
                      <Link
                        href={`/admin/hi-naesin/passages/${row.id}/edit`}
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        편집
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-neutral-500"
                  >
                    등록된 지문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function buildHint(row: HiNaesinPassageRow): string {
  if (row.source_type === 'mock_exam') {
    const parts = [
      row.exam_year,
      row.exam_month ? `${row.exam_month}월` : null,
      row.question_number ? `${row.question_number}번` : null,
    ].filter(Boolean);
    return parts.join(' ') || '모의고사';
  }
  if (row.source_type === 'textbook') {
    return [row.school_name, row.textbook_name, row.unit_label]
      .filter(Boolean)
      .join(' / ') || '교과서';
  }
  return [row.book_name, row.book_unit].filter(Boolean).join(' / ') || '외부교재';
}
