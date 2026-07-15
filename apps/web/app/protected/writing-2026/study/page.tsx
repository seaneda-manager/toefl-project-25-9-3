// apps/web/app/(protected)/writing-2026/study/page.tsx
export const dynamic = "force-dynamic";

import { getSupabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function Writing2026StudyPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Please sign in.</div>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold">Writing 2026 – Study Mode</h1>

      <p className="text-sm text-gray-600">
        Here you’ll practice the **three new 2026 Writing task types** through
        guided study, explanations, templates, and model responses.
      </p>

      <p className="text-sm text-neutral-500">
        Practice passages and tasks will appear here soon.
      </p>

      <div className="rounded-lg border p-4 bg-white shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Want to try the demo test?</h2>
        <Link
          href="/writing-2026/test"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-neutral-50 transition"
        >
          Go to Test Mode →
        </Link>
      </div>
    </main>
  );
}
