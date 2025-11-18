// apps/web/app/(protected)/admin/content/new/[tab]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAndRole } from "@/lib/authServer";
import JsonUploaderClient from "./_client/JsonUploaderClient";
import ReadingEditorClient from "./_client/ReadingEditorClient"; // ← Manual Editor로 사용할 클라 컴포넌트

export const dynamic = "force-dynamic";

type Params = { tab?: string };

export default async function AdminContentNewTabPage({
  params,
}: {
  params: Promise<Params>; // ❗ Next 15: params는 Promise
}) {
  // 1) 서버 가드
  const { session, role } = await getSessionAndRole();
  if (!session) redirect("/auth/login?next=/admin/content/new/form");
  if (role !== "admin") {
    if (role === "teacher") redirect("/home/teacher");
    redirect("/home/student");
  }

  // 2) async params 처리
  const { tab } = await params;
  const _tab = String(tab ?? "").toLowerCase();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          New Content — {_tab === "json" ? "JSON Upload" : "Manual Editor"}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/content/reading/editor"
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="Advanced reading editor (A–F choices)"
          >
            Advanced Editor (A–F)
          </Link>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/admin/content/new/form"
          className={
            _tab === "form"
              ? "font-semibold underline"
              : "text-gray-600 hover:underline"
          }
        >
          Manual Editor
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          href="/admin/content/new/json"
          className={
            _tab === "json"
              ? "font-semibold underline"
              : "text-gray-600 hover:underline"
          }
        >
          JSON Import
        </Link>
      </nav>

      {/* 탭 콘텐츠 */}
      {_tab === "json" ? <JsonUploadPane /> : <FormPane />}
    </div>
  );
}

/** JSON 업로드 탭 */
function JsonUploadPane() {
  return (
    <section className="rounded border p-4 space-y-3">
      <p className="text-sm text-gray-700">
        Paste a JSON payload like: <code>{'{ "passage": { ... } }'}</code>
      </p>
      <JsonUploaderClient />
    </section>
  );
}

/** Manual Editor 탭: 데모 에디터(수정본)를 주 에디터로 사용 */
function FormPane() {
  return (
    <section className="space-y-4">
      <ReadingEditorClient />
    </section>
  );
}
