import { getUserAndProfile } from "@/lib/getUserAndProfile";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JrListeningContentPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white p-4">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Listening 음성 관리</h1>
            <p className="text-slate-600 mt-1">오디오 파일과 문제를 관리합니다</p>
          </div>
          <Link
            href="/admin/jr/content/listening/new"
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
          >
            + 새 세션
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-center py-12 text-slate-500">
          아직 음성이 없습니다
        </div>
      </div>
    </main>
  );
}
