// (teacher) 洹몃９: 濡쒓렇??+ teacher ??븷 媛??
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined;
  if (role !== "teacher") {
    // ?좎깮???꾩슜 ?곸뿭 ???숈깮?대㈃ ??쒕낫?쒕줈
    redirect("/dashboard");
  }

  return <>{children}</>;
}
