// apps/web/app/(protected)/admin/content/list/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  set_id: string | null;
  title: string | null;
  updated_at: string | null;
  questions_count?: number | null;
};

export default async function AdminContentListPage() {
  const supabase = await getServerSupabase();

  let rows: Row[] = [];
  let errorMsg: string | null = null;

  const a = await supabase
    .from("reading_passages")
    .select(`
      id,
      set_id,
      title,
      updated_at,
      reading_questions:reading_questions(count)
    `)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!a.error && a.data) {
    rows = (a.data as any[]).map((r) => ({
      id: r.id,
      set_id: r.set_id ?? null,
      title: r.title ?? "",
      updated_at: r.updated_at ?? null,
      questions_count:
        typeof r.reading_questions?.[0]?.count === "number"
          ? r.reading_questions[0].count
          : null,
    }));
  } else {
    const b = await supabase
      .from("reading_passages")
      .select("id, set_id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (!b.error && b.data) {
      rows = b.data.map((r) => ({
        id: (r as any).id,
        set_id: (r as any).set_id ?? null,
        title: (r as any).title ?? "",
        updated_at: (r as any).updated_at ?? null,
        questions_count: null,
      }));
    } else {
      errorMsg = a.error?.message || b.error?.message || "Query failed";
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Content List (Reading)</h1>
        <Link
          href="/reading/admin"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          title="Open Advanced Reading Editor"
        >
          New in Advanced Editor
        </Link>
      </header>

      {errorMsg ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="mb-1 font-medium">Could not load the list.</div>
          <div className="opacity-75">{errorMsg}</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded border p-6 text-sm text-gray-600">
          No reading passages found yet. Use the button above to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Set / ID</th>
                <th className="p-2 text-left">Questions</th>
                <th className="p-2 text-left">Updated</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const editorSetId = r.set_id ?? r.id;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.title || "(Untitled)"}</td>
                    <td className="p-2">
                      {(r.set_id ?? "(no-set)") + " / " + r.id.slice(0, 8)}
                    </td>
                    <td className="p-2">
                      {typeof r.questions_count === "number"
                        ? r.questions_count
                        : "-"}
                    </td>
                    <td className="p-2">
                      {r.updated_at
                        ? new Date(r.updated_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-2 text-right">
                      <Link
                        href={`/reading/admin?setId=${encodeURIComponent(
                          editorSetId
                        )}`}
                        className="rounded border px-2 py-1 hover:bg-gray-50"
                        title="Edit in Advanced Editor"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}