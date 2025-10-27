// apps/web/app/(protected)/attempt-demo/page.tsx  ??寃쎈줈???먮낯??留욎떠 ?섏젙?섏꽭??
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ORG_ID } from '@/lib/constants';

type Section = 'reading' | 'listening' | 'speaking' | 'writing';

type AnswerKey = Record<string, number[] | number>;
type SetRow = { payload_json?: { answer_key?: AnswerKey } | null };

// ?좏떥: 諛곗뿴 ?뺣젹 + 以묐났 ?쒓굅
function asSortedUnique(arr: number[]) {
  return [...new Set(arr)].sort((a, b) => a - b);
}
// ?좏떥: 諛곗뿴 ?쇱튂
function arrEq(a: number[], b: number[] | number) {
  if (!Array.isArray(b)) return false;
  const A = asSortedUnique(a);
  const B = asSortedUnique(b);
  if (A.length !== B.length) return false;
  return A.every((v, i) => v === B[i]);
}

export default function Page() {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('reading');
  const [setId, setSetId] = useState<string>('TPO 1');

  // 濡쒓렇 & ?곹깭
  const [log, setLog] = useState<string[]>([]);
  const [savingQ, setSavingQ] = useState<number | null>(null);
  const [cachedKey, setCachedKey] = useState<AnswerKey | null>(null);

  const push = (s: string) => setLog((v) => [s, ...v].slice(0, 50));

  // Answer key 罹먯떛
  async function getAnswerKey(): Promise<AnswerKey> {
    if (cachedKey) return cachedKey;

    const { data, error } = (await supabase
      .from('sets')
      .select('payload_json,published_at,version')
      .eq('org_id', ORG_ID)
      .eq('section', section)
      .eq('set_id', setId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('version', { ascending: false })
      .limit(1)) as unknown as { data: SetRow[]; error: any };

    if (error) throw error;
    const key: AnswerKey = data?.[0]?.payload_json?.answer_key ?? {};
    setCachedKey(key);
    return key;
  }

  // Attempt ?쒖옉
  const startAttempt = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      push('Please log in first.');
      alert('Login required');
      return;
    }
    // ?명듃/?뱀뀡 諛붾뚯뿀?????덉쑝??罹먯떆 臾댄슚
    setCachedKey(null);

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        org_id: ORG_ID,
        user_id: user.id,
        section,
        set_id: setId,
      })
      .select('id')
      .single();

    if (error) {
      push('start error: ' + error.message);
      return;
    }
    setAttemptId(data!.id);
    push(`started attempt ${data!.id}`);
  };

  // ?듭븞 ???
  const saveAnswer = async (q: number, picks: number[]) => {
    if (!attemptId) {
      push('Please click Start first');
      alert('Please click Start first');
      return;
    }
    try {
      setSavingQ(q);

      const key = await getAnswerKey();
      const correctAns = key[String(q)];
      const isCorrect = Array.isArray(correctAns)
        ? arrEq(picks, correctAns)
        : picks.length === 1 && picks[0] === correctAns;

      const { error } = await supabase
        .from('answers')
        .upsert(
          [
            {
              attempt_id: attemptId,
              q_number: q,
              picks, // jsonb 而щ읆 沅뚯옣
              correct: isCorrect,
              duration_ms: null,
            },
          ],
          { onConflict: 'attempt_id,q_number' }
        );

      if (error) throw error;

      push(`saved q${q}: [${asSortedUnique(picks).join(', ')}] ${isCorrect ? 'Correct' : 'Wrong'}`);
    } catch (e: any) {
      push('save error: ' + (e?.message ?? String(e)));
    } finally {
      setSavingQ(null);
    }
  };

  // ?먯닔 怨꾩궛 (RPC)
  const computeScore = async () => {
    if (!attemptId) return;
    const { data, error } = await supabase.rpc('attempt_score', { attempt_id: attemptId });
    if (error) {
      push(error.message);
      return;
    }
    // RPC媛 ?⑥씪 row ?먮뒗 諛곗뿴 諛섑솚?????덉쓬 ???좎뿰 泥섎━
    const row = (Array.isArray(data) ? data[0] : data) ?? { total: 0, correct: 0 };
    push(`SCORE: ${row.correct} / ${row.total}`);
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '24px auto',
        padding: 16,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
      }}
    >
      <h2>Attempt + Scoring Demo</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <select
          value={section}
          onChange={(e) => {
            setSection(e.target.value as Section);
            setCachedKey(null); // ?뱀뀡 蹂寃???罹먯떆 臾댄슚
            setAttemptId(null); // ?뱀뀡 諛붾뚮㈃ 湲곗〈 attempt 臾댄슚
          }}
        >
          {(['reading', 'listening', 'speaking', 'writing'] as Section[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          value={setId}
          onChange={(e) => {
            setSetId(e.target.value);
            setCachedKey(null); // ?명듃 蹂寃???罹먯떆 臾댄슚
            setAttemptId(null); // ?명듃 諛붾뚮㈃ 湲곗〈 attempt 臾댄슚
          }}
        />

        <button onClick={startAttempt}>Start Attempt</button>
        <button onClick={computeScore} disabled={!attemptId}>
          Compute Score
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => saveAnswer(1, [2])} disabled={!attemptId || savingQ === 1}>
          {savingQ === 1 ? 'Saving?? : 'Q1 pick 2'}
        </button>
        <button onClick={() => saveAnswer(2, [1, 3])} disabled={!attemptId || savingQ === 2}>
          {savingQ === 2 ? 'Saving?? : 'Q2 picks 1,3'}
        </button>
        <button onClick={() => saveAnswer(3, [])} disabled={!attemptId || savingQ === 3}>
          {savingQ === 3 ? 'Saving?? : 'Q3 clear'}
        </button>
      </div>

      {/* 理쒓렐 濡쒓렇媛 ?먮윭硫?吏꾪븯寃?媛뺤“ */}
      {log[0]?.startsWith('save error:') && (
        <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 12 }}>{log[0]}</div>
      )}

      <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{log.join('\n')}</pre>

      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
        example answer_key {' '}{`{"1":2,"2":[1,3]}`}
      </div>
    </div>
  );
}


