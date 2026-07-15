import { getUserAndProfile } from "@/lib/getUserAndProfile";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JrGrammarContentPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") redirect("/login");

  const supabase = await getSupabaseServer();
  const { data: chapters } = await supabase
    .from("jr_grammar_chapters")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white p-4">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Grammar 단원 관리</h1>
            <p className="text-slate-600 mt-1">문법 단원을 생성/편집합니다</p>
          </div>
          <Link
            href="/admin/jr/content/grammar/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            + 새 단원
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">제목</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">생성일</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900">작업</th>
              </tr>
            </thead>
            <tbody>
              {chapters && chapters.length > 0 ? (
                chapters.map((c) => (
                  <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{c.title}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(c.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <Link href={`/admin/jr/content/grammar/${c.id}`} className="text-blue-600 hover:text-blue-700 font-semibold">
                        편집
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    단원이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
