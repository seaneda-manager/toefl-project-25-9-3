// apps/web/app/(protected)/(teacher)/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import TeacherTopTabs from '@/components/teacher/TeacherTopTabs';
import { requireTeacher } from '@/lib/auth/requireTeacher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  // ?쒕쾭?먯꽌 沅뚰븳 ?뺤씤 (誘몄씤利?沅뚰븳?놁쓬? 由щ떎?대젆??
  try {
    await requireTeacher();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e ?? '');
    if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
      redirect('/auth/login');
    }
    redirect('/auth/forbidden');
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


