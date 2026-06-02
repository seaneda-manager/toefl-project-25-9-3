'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import NaesinDrillShell from "@/components/naesin/drill/NaesinDrillShell";
import { MOCK_NAESIN_PASSAGE } from "@/components/naesin/drill/mock";
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function NaesinDrillPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const handleComplete = useCallback(async (result: { passageId: string; stages: string[] }) => {
    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 스테이지별 결과 저장
      const rows = result.stages.map((stage) => ({
        student_id: user.id,
        passage_id: result.passageId,
        stage,
        score_pct: null, // 추후 스테이지별 점수 계산 추가
        completed_at: new Date().toISOString(),
      }));

      await supabase.from('lexiox_jr_drill_results').insert(rows);
      setDone(true);
    } catch (e) {
      console.error('드릴 결과 저장 실패', e);
    }
  }, []);

  if (done) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-neutral-900">드릴 완료!</h1>
        <p className="text-neutral-500">수고했어요. 결과가 저장됐습니다.</p>
        <button
          onClick={() => router.push('/naesin/drill')}
          className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          다시 하기
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
          내신 / Drill
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          내신 Drill
        </h1>
      </header>

      <NaesinDrillShell
        initialPassage={MOCK_NAESIN_PASSAGE}
        onComplete={handleComplete}
      />
    </main>
  );
}
