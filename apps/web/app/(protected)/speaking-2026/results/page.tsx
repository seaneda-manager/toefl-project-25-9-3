// apps/web/app/(protected)/speaking-2026/results/page.tsx
import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  test_id: string | null;
  task_id: string | null;
  mode: string | null;
  approx_sentences: number | null;
  approx_words: number | null;
  created_at: string;
};

export default async function Speaking2026ResultsPage() {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-gray-500">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??</p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("speaking_results_2026")
    .select(
      "id, test_id, task_id, mode, approx_sentences, approx_words, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("speaking_results_2026 fetch error", error);
    return (
      <main className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        <p className="text-sm text-red-600">
          Speaking ê²°ê³¼ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.
        </p>
        <details className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <summary className="cursor-pointer font-semibold">
            Supabase error (?”ë²„ê·¸ìš©)
          </summary>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </main>
    );
  }

  const rows = (data ?? []) as Row[];

  return (
    <main className="mx-auto space-y-6 pb-8 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Speaking 2026 ???°ìŠµ ê²°ê³¼</h1>
        <p className="text-xs text-gray-500">
          Speaking 2026 ?°ìŠµ(Study) ?˜ì´ì§€?ì„œ ?€?¥ëœ ?¤í¬ë¦½íŠ¸???”ì•½?…ë‹ˆ??
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <p className="text-[11px] text-gray-400">
          ?”ë²„ê·? rows = {rows.length}
        </p>

        {rows.length === 0 && (
          <p className="text-sm text-gray-500">
            ?„ì§ ?€?¥ëœ Speaking ?°ìŠµ ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤.
          </p>
        )}

        <div className="divide-y divide-gray-200">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Test:{" "}
                  <span className="font-mono text-xs text-gray-700">
                    {r.test_id}
                  </span>
                </p>
                <p className="text-[11px] text-gray-600">
                  Task ID:{" "}
                  <span className="font-mono text-[11px]">
                    {r.task_id}
                  </span>{" "}
                  Â· mode:{" "}
                  <span className="font-mono text-[11px]">
                    {r.mode ?? "study"}
                  </span>
                </p>
                <p className="text-[11px] text-gray-500">
                  ë¬¸ì¥ ???€??:{" "}
                  <span className="font-semibold text-emerald-700">
                    {r.approx_sentences ?? 0}
                  </span>{" "}
                  Â· ?¨ì–´ ???€??:{" "}
                  <span className="font-semibold text-emerald-700">
                    {r.approx_words ?? 0}
                  </span>
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(r.created_at).toLocaleString("ko-KR")}
                </p>
              </div>

              <Link
                href={`/speaking-2026/results/${r.id}`}
                className="text-xs text-emerald-700 hover:underline"
              >
                ?ì„¸????              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
