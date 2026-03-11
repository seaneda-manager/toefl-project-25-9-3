// apps/web/app/(protected)/home/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePortalPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // (protected)여도 안전빵
  if (!user) redirect("/auth/login?next=/home");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">
            K-PRIME Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose which program you want to run right now.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/toefl/home"
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md"
          >
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100">
              UPDATED-TOEFL
            </div>
            <h2 className="mt-3 text-2xl font-bold text-emerald-950 group-hover:text-emerald-900">
              Enter UPDATED-TOEFL
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Reading · Listening · Speaking · Writing and reports
            </p>
            <p className="mt-5 text-sm font-semibold text-emerald-800">Open →</p>
          </Link>

          <Link
            href="/lingox/home"
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md"
          >
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100">
              Lingo-X
            </div>
            <h2 className="mt-3 text-2xl font-bold text-emerald-950 group-hover:text-emerald-900">
              Enter Lingo-X
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Vocabulary missions · Academy workflow · Admin tools
            </p>
            <p className="mt-5 text-sm font-semibold text-emerald-800">Open →</p>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Tip</p>
          <p className="mt-1">
            /toefl and /lingox are separate entrances now. We will migrate pages gradually.
          </p>
        </div>
      </div>
    </main>
  );
}