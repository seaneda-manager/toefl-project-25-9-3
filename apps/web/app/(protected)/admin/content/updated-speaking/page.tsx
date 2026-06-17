import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { id: string; label: string; is_locked: boolean | null; updated_at: string | null };

function fmt(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default async function SpeakingAdminListPage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("speaking_tests")
    .select("id,label,is_locked,updated_at")
    .order("updated_at", { ascending: false });

  const tests: Row[] = data ?? [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Updated Speaking – 시험 관리</h1>
          {error && <p className="mt-1 text-xs text-rose-600">{error.message}</p>}
        </div>
        <Link
          href="/admin/content/updated-speaking/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          새 시험 만들기
        </Link>
      </header>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="hidden border-b bg-gray-50 px-4 py-2 text-[11px] font-medium text-gray-500 md:grid md:grid-cols-4">
          <div>ID</div><div>Label</div><div>Updated</div><div className="text-right">상태</div>
        </div>
        {tests.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-500">
            아직 시험이 없습니다.{" "}
            <Link href="/admin/content/updated-speaking/new" className="text-orange-500 underline">새로 만들기</Link>
          </div>
        ) : (
          <div className="divide-y">
            {tests.map((t) => (
              <div key={t.id} className="px-4 py-3 text-xs hover:bg-orange-50/30 md:grid md:grid-cols-4 md:items-center">
                <div className="font-mono text-[11px] text-gray-500">{t.id.slice(0, 8)}…</div>
                <div className="font-semibold text-gray-900">{t.label}</div>
                <div className="text-gray-500">{fmt(t.updated_at)}</div>
                <div className="flex items-center justify-end gap-2">
                  {t.is_locked && (
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white">🔒 Locked</span>
                  )}
                  <Link
                    href={`/admin/content/updated-speaking/${t.id}/edit`}
                    className="rounded-lg border px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-orange-50"
                  >
                    에셋 편집
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
