'use client';

import { useRouter } from 'next/navigation';
import HomeSelector from '@/components/HomeSelector';

export default function DashboardPage() {
  const router = useRouter();
  const go = (p: string) => router.push(p);

  return (
    <HomeSelector
      onStart={({ section, mode }: { section: string; mode: string }) => {
        if (mode === 'study') {
          if (section === 'reading') go('/reading/study');
          else if (section === 'listening') go('/listening/study');
          else alert('Study UI 以鍮꾩쨷');
        } else {
          if (section === 'reading') go('/reading/test');
          else if (section === 'listening') go('/listening/test');
          else alert('Test UI 以鍮꾩쨷');
        }
      }}
      onTeacher={({ section }: { section: string }) => {
        if (section === 'reading') go('/teacher/reading');
        else if (section === 'listening') go('/teacher/listening');
        else alert('Teacher UI 以鍮꾩쨷');
      }}
    />
  );
}





