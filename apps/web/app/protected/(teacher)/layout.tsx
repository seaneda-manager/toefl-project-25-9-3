// apps/web/app/(protected)/(teacher)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireTeacherOrAdmin } from "@/lib/auth/requireTeacher";
import TeacherTopTabs from "@/components/teacher/TeacherTopTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await requireTeacherOrAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e ?? "");
    if (msg.includes("401")) redirect("/auth/login");
    redirect("/auth/forbidden");
  }
  return (
    <div className="mx-auto max-w-6xl px-6 py-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teacher Mode</h1>
        <TeacherTopTabs />
      </header>
      {children}
    </div>
  );
}
