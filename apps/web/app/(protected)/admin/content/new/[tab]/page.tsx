// apps/web/app/(protected)/admin/content/new/[tab]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAndRole } from "@/lib/authServer";
import JsonUploaderClient from "./_client/JsonUploaderClient";

export const dynamic = "force-dynamic";

type Params = { tab?: string };

export default async function AdminContentNewTabPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { session, role } = await getSessionAndRole();

  if (!session) redirect("/auth/login?next=/reading/admin");

  if (role !== "admin") {
    if (role === "teacher") redirect("/home/teacher");
    redirect("/home/student");
  }

  const { tab } = await params;
  const _tab = String(tab ?? "").toLowerCase();

  // Manual Editor 탭은 이제 SSOT editor로 바로 보냄
  if (_tab !== "json") {
    redirect("/reading/admin");
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">New Content — JSON Upload</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/reading/admin"
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="Advanced reading editor (A-F choices)"
          >
            Advanced Editor (A-F)
          </Link>
        </div>
      </header>

      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/reading/admin"
          className="text-gray-600 hover:underline"
        >
          Manual Editor
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          href="/admin/content/new/json"
          className="font-semibold underline"
        >
          JSON Import
        </Link>
      </nav>

      <section className="space-y-3 rounded border p-4">
        <p className="text-sm text-gray-700">
          Paste a JSON payload like: <code>{'{ "passage": { ... } }'}</code>
        </p>
        <JsonUploaderClient />
      </section>
    </div>
  );
}