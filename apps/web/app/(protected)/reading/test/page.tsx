// apps/web/app/(protected)/reading/test/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { RPassage, RQType } from '@/types/types-reading';
import TestRunnerV2 from '@/components/reading/runner/TestRunnerV2';
import { startReadingSession } from '@/actions/readingSession'; // ✅ 세션 생성만 서버에서

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** ---------- helpers ---------- */
function normalizeType(t: any): RQType {
  const ok: RQType[] = [
    'vocab','detail','negative_detail','paraphrasing','inference',
    'purpose','pronoun_ref','insertion','summary','organization',
  ];
  if (t === 'single') return 'detail';
  return ok.includes(t) ? (t as RQType) : 'detail';
}

function rejectAfter<T = never>(ms: number, label: string): Promise<T> {
  return new Promise((_res, rej) => {
    setTimeout(() => rej(new Error(`timeout:${label} (${ms}ms)`)), ms);
  });
}
// 어떤 thenable/builder라도 Promise로 승격 후 race
function withTimeout<T>(promiseLike: any, ms: number, label: string): Promise<T> {
  const p: Promise<T> = Promise.resolve(promiseLike);
  return Promise.race([p, rejectAfter<T>(ms, label)]);
}
type Resp<T> = { data: T; error?: any };

// 로컬 폴백 패시지 (DB 실패해도 화면은 뜨게)
function localFallbackPassage(): RPassage {
  return {
    id: 'local-fallback',
    title: 'Fallback Passage',
    content:
      'This is a local fallback passage used when the database is slow or unavailable.\n\nYou can still test the runner UX.',
    ui: { paragraphSplit: 'blankline' },
    questions: [
      {
        id: 'q1',
        number: 1,
        type: 'detail',
        stem: 'According to the fallback passage, what is its purpose?',
        choices: [
          { id: 'c1', text: 'To test the runner UX', is_correct: true },
          { id: 'c2', text: 'To measure network bandwidth' },
          { id: 'c3', text: 'To replace the real database' },
          { id: 'c4', text: 'To disable the app' },
        ],
      },
      {
        id: 'q2',
        number: 2,
        type: 'paraphrasing',
        stem: 'Which choice best restates the highlighted idea?',
        meta: { paragraph_highlight: { paragraphs: [0] } },
        choices: [
          { id: 'd1', text: 'It is a temporary local content.', is_correct: true },
          { id: 'd2', text: 'It is a full TPO dataset.' },
          { id: 'd3', text: 'It disables the reading module.' },
          { id: 'd4', text: 'It stores answers permanently.' },
        ],
      },
    ],
  };
}

/** ---------- page ---------- */
export default async function Page({
  searchParams,
}: { searchParams?: { setId?: string } }) {
  const setId = searchParams?.setId || 'demo-set';

  // 1) Supabase 로드 (타임아웃 + 폴백)
  let passage: RPassage | null = null;
  try {
    const supabase = await getSupabaseServer();

    // 최신 passage
    const respP = await withTimeout<Resp<any>>(
      supabase
        .from('reading_passages')
        .select('*')
        .eq('set_id', setId)
        .order('ord', { ascending: false })
        .limit(1)
        .maybeSingle(),
      4000,
      'select:reading_passages'
    );
    const p = respP.data;

    if (!p) {
      return (
        <div className="p-6">
          <div className="rounded-xl border p-4">
            Passage가 없습니다. (setId=<b>{setId}</b>)
          </div>
        </div>
      );
    }

    // 문항 + 선택지
    const respQs = await withTimeout<Resp<any[]>>(
      supabase
        .from('reading_questions')
        .select('*, choices:reading_choices(*)')
        .eq('passage_id', p.id)
        .order('number', { ascending: true }),
      4000,
      'select:reading_questions+choices'
    );
    const qs = respQs.data ?? [];

    passage = {
      id: p.id,
      title: p.title ?? '',
      content: p.content ?? '',
      ui: p.ui ?? { paragraphSplit: 'auto' },
      questions: qs.map((q: any) => ({
        id: q.id,
        number: q.number ?? 0,
        stem: q.stem ?? '',
        type: normalizeType(q.type),
        meta: q.meta ?? undefined,
        explanation:
          q.explanation ?? (q.clue_quote ? { clue_quote: q.clue_quote } : undefined),
        choices: (q.choices ?? []).map((c: any) => ({
          id: c.id,
          text: c.text ?? '',
          is_correct: !!c.is_correct,
          explain: c.explain ?? undefined,
        })),
      })),
    };
  } catch (e: any) {
    console.warn('[Reading/Test] DB load failed, using local fallback:', e?.message || e);
    passage = localFallbackPassage();
  }

  // 2) 문항 없으면 가드
  if (!passage?.questions?.length) {
    return (
      <div className="p-6">
        <div className="rounded-xl border p-4">
          이 패시지에는 문항이 없습니다. (passage: <b>{passage?.title || 'untitled'}</b>)
        </div>
      </div>
    );
  }

  // 3) 세션 생성 (실패 시 로컬 폴백)
  let sessionId = `local-${Date.now()}`;
  try {
    const r = await startReadingSession({ setId, mode: 'test' });
    if (r?.sessionId) sessionId = r.sessionId;
  } catch (e) {
    console.warn('[Reading/Test] startReadingSession failed, fallback to local id');
  }

  return (
    <div className="px-6 py-4">
      {/* ✅ 함수 props(onAnswer/onFinish) 전달 제거 */}
      <TestRunnerV2 passage={passage} sessionId={sessionId} />
    </div>
  );
}
