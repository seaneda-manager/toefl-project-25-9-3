// apps/web/app/page.tsx  (?먮뒗 ?대떦 ?꾩튂???섏씠吏 ?뚯씪)
'use client';

import { useRouter } from 'next/navigation';
import HomeSelector from '@/components/HomeSelector';

export default function Page() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <HomeSelector
      onStart={({ tpo, section, mode }: { tpo: string; section: string; mode: string }) => {
        // tpo媛 ?섏뼱?ㅻ㈃ ?꾩슂 ???쇱슦?낆뿉 ?쒖슜 (?? /reading/test?tpo=xx)
        if (mode === 'study') {
          if (section === 'reading') go('/reading/study');
          else if (section === 'listening') go('/listening/study');
          else alert('Study UI 以鍮?以묒엯?덈떎.');
        } else {
          if (section === 'reading') go('/reading/test');
          else if (section === 'listening') go('/listening/test');
          else alert('Test UI 以鍮?以묒엯?덈떎.');
        }
      }}
      onTeacher={({ section }: { section: string }) => {
        if (section === 'reading') go('/teacher/reading');
        else if (section === 'listening') go('/teacher/listening');
        else alert('Teacher UI 以鍮?以묒엯?덈떎.');
      }}
    />
  );
}




