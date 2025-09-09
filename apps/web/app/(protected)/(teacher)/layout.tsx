// (teacher) 그룹: 로그인 + teacher 역할 가드
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
    // 선생님 전용 영역 → 학생이면 대시보드로
    redirect("/dashboard");
  }

  return <>{children}</>;
}
