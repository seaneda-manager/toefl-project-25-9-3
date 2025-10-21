// apps/web/app/(protected)/reading/test/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { RPassage, RQuestion } from '@/types/types-reading';
import TestRunnerV2 from '@/components/reading/runner/TestRunnerV2';
import { startReadingSession } from '@/actions/readingSession';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** ---------- helpers ---------- */
type RQType = RQuestion['type'];

function normalizeType(t: unknown): RQType {
  const ok: RQType[] = [
    'vocab',
    'detail',
    'negative_detail',
    'paraphrasing',
    'inference',
    'purpose',
    'pronoun_ref',
    'insertion',
    'summary',
    'organization',
  ];
  if (t === 'single') return 'detail';
  const s = String(t);
  return (ok as unknown as string[]).includes(s) ? (s as RQType) : 'detail';
}

function rejectAfter<T = never>(ms: number, label: string): Promise<T> {
  return new Promise((_res, rej) => {
    setTimeout(() => rej(new Error(`timeout:${label} (${ms}ms)`)), ms);
  });
}
function withTimeout<T>(promiseLike: any, ms: number, label: string): Promise<T> {
  const p: Promise<T> = Promise.resolve(promiseLike);
  return Promise.race([p, rejectAfter<T>(ms, label)]);
}
type Resp<T> = { data: T; error?: any };

/** ---------- page ---------- */
export default async function Page({
  searchParams,
}: {
  searchParams?: { setId?: string };
}) {
  const setId = searchParams?.setId || 'demo-set';

  // 1) Supabase 로드 (타임아웃 + 폴백)
  let passage: RPassage | null = null;
  try {
    const supabase = await getSupabaseServer();

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

    // RPassage로 먼저 보편형 구성
    passage = {
      id: p.id,
      title: p.title ?? '',
      content: p.content ?? '',
      questions: qs.map((q: any) => ({
        id: q.id,
        number: q.number ?? 0,
        stem: q.stem ?? '',
        type: normalizeType(q.type),
        // null 가능성 정리: meta/explanation은 undefined로 치환
        meta: (q.meta as any) ?? undefined,
        explanation:
          (q.explanation as any) ??
          (q.clue_quote ? { clue_quote: q.clue_quote } : undefined),
        choices: (q.choices ?? []).map((c: any) => ({
          id: c.id,
          text: c.text ?? c.label ?? '',
          is_correct: !!c.is_correct,
          explain: (c.explain as string | null | undefined) ?? undefined,
        })),
      })) as RQuestion[],
    };
  } catch (e: any) {
    console.warn('[Reading/Test] DB load failed:', e?.message || e);
    passage = {
      // 최소 폴백 (RPassage)
      id: 'local-fallback',
      title: 'Fallback Passage',
      content:
        'This is a local fallback passage used when the database is slow or unavailable.\n\nYou can still test the runner UX.',
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
      ],
    };
  }

  // 2) 문항 유효성
  if (!passage?.questions?.length) {
    return (
      <div className="p-6">
        <div className="rounded-xl border p-4">
          현재 패시지에는 문항이 없습니다. (passage: <b>{passage?.title || 'untitled'}</b>)
        </div>
      </div>
    );
  }

  // 3) 세션 생성 (mode는 optional이므로 생략 — 서버 기본값 사용)
  let sessionId = `local-${Date.now()}`;
  try {
    const r = await startReadingSession({ setId });
    if (r?.sessionId) sessionId = r.sessionId;
  } catch {
    console.warn('[Reading/Test] startReadingSession failed, fallback to local id');
  }

  // 4) TestRunnerV2가 요구하는 "더 좁은" 타입으로 변환해 전달
  type RunnerPassage = {
    id: string;
    title: string;
    content: string;
    questions: Array<{
      id: string;
      number: number;
      type: RQType;
      stem: string;
      choices: Array<{ id: string; text: string; is_correct?: boolean; explain?: string }>;
      explanation?: string | { clue_quote?: string } | Record<string, any>;
      meta?: Record<string, any>;
    }>;
  };

  const passageForRunner: RunnerPassage = {
    id: passage.id,
    title: passage.title ?? '',
    content: passage.content ?? '',
    questions: passage.questions.map((q) => ({
      id: q.id,
      number: q.number ?? 0,
      type: q.type as RQType,
      stem: q.stem ?? '',
      choices: q.choices.map((c) => ({
        id: c.id,
        text: c.text ?? '',
        is_correct: c.is_correct,                                // optional과 호환
        explain: (c.explain as string | null | undefined) ?? undefined, // null 제거
      })),
      explanation: (q.explanation as any) ?? undefined, // null 제거
      meta: (q.meta as any) ?? undefined,               // null 제거
    })),
  };

  return (
    <div className="px-6 py-4">
      <TestRunnerV2 passage={passageForRunner} sessionId={sessionId} />
    </div>
  );
}
