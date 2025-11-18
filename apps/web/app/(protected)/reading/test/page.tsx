// apps/web/app/(protected)/reading/test/page.tsx
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { RPassage, RQuestion } from '@/models/reading';
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
          <div className="rounded-xl border p-4">Passage가 없습니다. (setId=<b>{setId}</b>)</div>
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

    // paragraphs 우선, 없으면 content를 빈 줄 기준으로 분해
    const paragraphs: string[] = Array.isArray((p as any)?.paragraphs)
      ? (p as any).paragraphs
      : typeof (p as any)?.content === 'string' && (p as any).content.length
      ? String((p as any).content).split(/\r?\n\r?\n+/g)
      : [];

    // RPassage 변환 (SSOT)
    passage = {
      id: p.id,
      title: p.title ?? '',
      paragraphs,
      questions: qs.map((q: any) => {
        const metaRaw =
          typeof q.meta === 'string'
            ? (() => {
                try {
                  return JSON.parse(q.meta);
                } catch {
                  return undefined;
                }
              })()
            : q.meta ?? undefined;

        // explanation/clue_quote는 meta로 흡수
        const meta =
          metaRaw || q.explanation || q.clue_quote
            ? {
                ...(metaRaw ?? {}),
                ...(q.explanation ? { explanation: String(q.explanation) } : {}),
                ...(q.clue_quote ? { clue_quote: String(q.clue_quote) } : {}),
              }
            : undefined;

        const choices = (q.choices ?? []).map((c: any) => ({
          id: c.id,
          text: c.text ?? c.label ?? '',
          isCorrect: (c as any).isCorrect ?? !!c.is_correct, // 레거시 호환
        }));

        return {
          id: q.id,
          number: q.number ?? 0,
          stem: q.stem ?? '',
          type: normalizeType(q.type),
          meta,
          choices,
        } as RQuestion;
      }),
    };
  } catch (e: any) {
    console.warn('[Reading/Test] DB load failed:', e?.message || e);
    passage = {
      // 최소 폴백 (RPassage)
      id: 'local-fallback',
      title: 'Fallback Passage',
      paragraphs: [
        'This is a local fallback passage used when the database is slow or unavailable.',
        'You can still test the runner UX.',
      ],
      questions: [
        {
          id: 'q1',
          number: 1,
          type: 'detail',
          stem: 'According to the fallback passage, what is its purpose?',
          choices: [
            { id: 'c1', text: 'To test the runner UX', isCorrect: true },
            { id: 'c2', text: 'To measure network bandwidth' },
            { id: 'c3', text: 'To replace the real database' },
            { id: 'c4', text: 'To disable the app' },
          ],
        } as RQuestion,
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

  // 3) 세션 생성 (실패 시 로컬 폴백)
  let sessionId = `local-${Date.now()}`;
  try {
    const r = await startReadingSession({ setId });
    if (r?.sessionId) sessionId = r.sessionId;
  } catch {
    console.warn('[Reading/Test] startReadingSession failed, fallback to local id');
  }

  // 4) TestRunnerV2는 RPassage를 직접 받음
  return (
    <div className="px-6 py-4">
      <TestRunnerV2 passage={passage} sessionId={sessionId} />
    </div>
  );
}
