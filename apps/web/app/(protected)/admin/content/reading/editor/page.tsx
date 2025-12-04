// apps/web/app/(protected)/admin/content/reading/editor/page.tsx
"use client";

export default function ReadingContentEditorPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">Reading 2026 – Content Editor</h1>
        <p className="text-sm text-slate-600">
          Upload or edit Reading 2026 sets. This page will later connect to the
          JSON SSOT and manual passage/question editor.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar – 나중에 set 목록 / 필터 */}
        <aside className="space-y-3 rounded-md border bg-slate-50 p-3 text-sm">
          <h2 className="text-xs font-semibold uppercase text-slate-500">
            Sets
          </h2>
          <p className="text-xs text-slate-600">
            Here you will see a list of Reading sets (adaptive / practice).
          </p>
          <button
            type="button"
            className="mt-2 w-full rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
          >
            + New Reading Set
          </button>
        </aside>

        {/* Main editor 영역 – 지금은 placeholder */}
        <section className="space-y-4 rounded-md border bg-white p-4 text-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Editor / JSON Preview
          </h2>
          <p className="text-xs text-slate-600">
            Later, this area will contain the passage editor, question editor,
            and JSON view. For now, use this as a placeholder.
          </p>

          <div className="rounded-md border bg-slate-50 p-3 text-xs font-mono text-slate-700">
            {/* 임시 JSON 예시 */}
            <pre className="whitespace-pre-wrap">
{`{
  "id": "reading-2026-sample-1",
  "label": "Sample Adaptive Reading Set",
  "modules": [...]
}`}
            </pre>
          </div>
        </section>
      </section>
    </main>
  );
}
