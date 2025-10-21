// apps/web/app/page.tsx  (또는 해당 위치의 페이지 파일)
'use client';

import { useRouter } from 'next/navigation';
import HomeSelector from '@/components/HomeSelector';

export default function Page() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <HomeSelector
      onStart={({ tpo, section, mode }: { tpo: string; section: string; mode: string }) => {
        // tpo가 넘어오면 필요 시 라우팅에 활용 (예: /reading/test?tpo=xx)
        if (mode === 'study') {
          if (section === 'reading') go('/reading/study');
          else if (section === 'listening') go('/listening/study');
          else alert('Study UI 준비 중입니다.');
        } else {
          if (section === 'reading') go('/reading/test');
          else if (section === 'listening') go('/listening/test');
          else alert('Test UI 준비 중입니다.');
        }
      }}
      onTeacher={({ section }: { section: string }) => {
        if (section === 'reading') go('/teacher/reading');
        else if (section === 'listening') go('/teacher/listening');
        else alert('Teacher UI 준비 중입니다.');
      }}
    />
  );
}
