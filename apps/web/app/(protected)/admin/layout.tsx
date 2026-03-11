// apps/web/app/(protected)/admin/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "./_components/AdminShell";
import { getSupabaseServer } from "@/lib/supabaseServer";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
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

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/content/new/json">JSON Upload</Link>
          <Link href="/reading/admin">Manual Editor</Link>
          <Link href="/admin/content/list">Content List</Link>
          <Link href="/admin/reports">Reports</Link>
          <Link href="/admin/users" className="font-medium">
            Users
          </Link>

          <Link
            href="/reading/admin"
            className="ml-4 inline-flex items-center rounded-md border px-2.5 py-1 hover:bg-gray-50"
            title="Advanced Editor (A-F choices)"
          >
            Advanced Editor (A-F)
          </Link>
        </nav>
      </header>

      <AdminShell>{children}</AdminShell>
    </div>
  );
}