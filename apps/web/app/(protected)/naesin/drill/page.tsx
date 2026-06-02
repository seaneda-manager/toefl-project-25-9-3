'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import NaesinDrillShell from "@/components/naesin/drill/NaesinDrillShell";
import { MOCK_NAESIN_PASSAGE } from "@/components/naesin/drill/mock";
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function NaesinDrillPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const saveStage = useCallback(async (stage: string, passageId: string) => {
    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('lexiox_jr_drill_results').insert({
        student_id: user.id,
        passage_id: passageId,
        stage,
        score_pct: null,
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`스테이지 저장 실패 (${stage})`, e);
    }
  }, []);

  const handleComplete = useCallback(async (_result: { passageId: string; stages: string[] }) => {
    setDone(true);
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
        onStageComplete={saveStage}
        onComplete={handleComplete}
      />
    </main>
  );
}
