import { getUserAndProfile } from "@/lib/getUserAndProfile";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JrReadingContentPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") redirect("/login");

  const supabase = await getSupabaseServer();
  const { data: passages } = await supabase
    .from("jr_reading_passages")
    .select("id, title, difficulty, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white p-4">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reading 지문 관리</h1>
            <p className="text-slate-600 mt-1">Jr. Reading 학습용 지문을 생성/편집합니다</p>
          </div>
          <Link
            href="/admin/jr/content/reading/new"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
          >
            + 새 지문
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">제목</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">난이도</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">생성일</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900">작업</th>
              </tr>
            </thead>
            <tbody>
              {passages && passages.length > 0 ? (
                passages.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className={`px-2 py-1 text-xs rounded font-semibold ${
                        p.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : p.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {p.difficulty === "easy" ? "쉬움" : p.difficulty === "medium" ? "중간" : "어려움"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <Link
                        href={`/admin/jr/content/reading/${p.id}`}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        편집
                      </Link>
                      <button className="text-red-600 hover:text-red-700 font-semibold">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    지문이 없습니다
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
