// apps/web/app/(protected)/admin/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "./_components/AdminShell";
import { getSupabaseServer } from "@/lib/supabaseServer";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error: uerr,
  } = await supabase.auth.getUser();

  if (uerr) redirect("/auth/login");
  if (!user) redirect("/auth/login");

  const { data: me, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) redirect("/auth/login");
  if (me?.role !== "admin") redirect("/auth/forbidden");

  return (
    <div className="min-h-screen">
      <header className="border-b p-4 flex items-center gap-4">
        <Link href="/admin" className="font-semibold">
          Admin Dashboard
        </Link>
        <nav className="text-sm flex gap-3">
          <Link href="/admin">媛쒖슂</Link>
          <Link href="/admin/content/new/json">JSON ?낅줈??/Link>
          <Link href="/admin/content/new/form">???낅젰</Link>
          <Link href="/admin/content/list">肄섑뀗痢?愿由?/Link>
          <Link href="/admin/reports">由ы룷??/Link>
          <Link href="/admin/users" className="font-medium">
            ?ъ슜??愿由?
          </Link>
        </nav>
      </header>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}


