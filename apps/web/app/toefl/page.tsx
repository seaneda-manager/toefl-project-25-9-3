// apps/web/app/toefl/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ToeflEntryPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/toefl/home");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100">
          UPDATED-TOEFL
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-emerald-950">
          UPDATED-TOEFL Engine
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          TOEFL practice experience separated from Lingo-X, so both can evolve fast without stepping on each other.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/auth/login?next=/toefl/home"
            className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
          >
            Log in to enter
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-slate-50"
          >
            Sign up
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Landing
          </Link>
        </div>
      </div>
    </main>
  );
}