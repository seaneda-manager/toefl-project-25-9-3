'use client';

import { useEffect, useMemo, useState } from 'react';

type Question = {
  number: number;
  type?: 'single' | 'multi' | string;
  skill?: string[];
  prompt: string;
  choices: string[];
  correct: number[];
  explanation?: string;
  evidence_sent_idx?: number[];
};

type ReadingSet = {
  set_id: string;
  sentences: string[];
  model_translation?: string[];
  questions: Question[];
};

type Stage = 'hub' | 'correct' | 'wrong' | 'retry' | 'trans';

const DEMO_SET: ReadingSet = {
  set_id: 'rd_demo',
  sentences: [
    'Many students rely on library printers for their assignments.',
    'Maintenance schedules sometimes disrupt availability.',
    'The university offers access to a computer lab on the second floor.',
    'A temporary pass can be issued at the front desk.',
  ],
  model_translation: [
    '많은 학생들이 과제 출력을 위해 도서관 프린터에 의존한다.',
    '정기 점검 때문에 이용이 중단될 때가 있다.',
    '학교는 2층 컴퓨터 실 사용을 제공한다.',
    '안내 데스크에서 임시 출입증을 발급받을 수 있다.',
  ],
  questions: [
    {
      number: 1,
      type: 'single',
      skill: ['gist'],
      prompt: 'What is the main point of the passage?',
      choices: [
        'Library printers are always available',
        'Maintenance can disrupt library printers',
        'Students cannot print on campus',
      ],
      correct: [1],
      explanation: 'The passage states maintenance can disrupt availability.',
    },
    {
      number: 2,
      type: 'multi',
      skill: ['detail'],
      prompt: 'Which TWO alternatives are suggested for printing?',
      choices: [
        'Use second-floor computer lab',
        'Ask a friend to print',
        'Get a temporary pass at the front desk',
        'Buy a personal printer',
      ],
      correct: [0, 2],
      explanation: 'The lab and a temporary pass are provided as solutions.',
      evidence_sent_idx: [2, 3],
    },
  ],
};

function lsKeyAns(setId: string) {
  return `reading_${setId}`;
}
function lsKeyTrans(setId: string) {
  return `reading_trans_${setId}`;
}

export default function ReadingStudyPage() {
  const [stage, setStage] = useState<Stage>('hub');
  const [setData, setSetData] = useState<ReadingSet>(DEMO_SET);
  const [current, setCurrent] = useState<Question | null>(null);
  const [retryOrder, setRetryOrder] = useState<number[]>([]);
  const [retryIdx, setRetryIdx] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [showModel, setShowModel] = useState(false);

  // 정/오답 판정
  const isCorrect = (q: Question, p: number[]) => {
    const a = [...(q.correct || [])].sort().join(',');
    const b = [...(p || [])].sort().join(',');
    return a === b && b !== '';
  };

  // localStorage helpers
  const savedAns = useMemo<Record<string, number[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(lsKeyAns(setData.set_id)) || '{}');
    } catch {
      return {};
    }
  }, [setData.set_id]);

  const saveAns = (m: Record<string, number[]>) => {
    localStorage.setItem(lsKeyAns(setData.set_id), JSON.stringify(m || {}));
  };

  const savedTrans = useMemo<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(lsKeyTrans(setData.set_id)) || '{}');
    } catch {
      return {};
    }
  }, [setData.set_id]);

  const saveTrans = (m: Record<string, string>) => {
    localStorage.setItem(lsKeyTrans(setData.set_id), JSON.stringify(m || {}));
  };

  // 허브 타일 클릭: 정답/오답 리스트
  const listBy = (wantCorrect: boolean) => {
    const qs = [...setData.questions].sort((a, b) => a.number - b.number);
    const filt = qs.filter((q) => isCorrect(q, savedAns[q.number]));
    if (wantCorrect) {
      setStage('correct');
      // correct 화면용 state는 별도 필요 없어서 종료
    } else {
      const wrong = qs.filter((q) => !isCorrect(q, savedAns[q.number]));
      setRetryOrder(wrong.map((w) => w.number));
      setStage('wrong');
    }
  };

  // Retry 시작
  const startRetry = (q: Question, list: Question[]) => {
    setRetryOrder(list.map((x) => x.number));
    setRetryIdx(list.findIndex((x) => x.number === q.number));
    setCurrent(q);
    setPicks([]);
    setStage('retry');
  };

  // Retry 제출
  const submitRetry = () => {
    if (!current) return;
    const map = { ...savedAns, [current.number]: picks };
    saveAns(map);
    // 간단 피드백: alert (실사용 땐 토스트/상단 메시지로 교체)
    if (isCorrect(current, picks)) alert('Correct ✔');
    else alert('Wrong ✖ — Passage/Evidence 확인해 보세요.');

    // 다음 오답으로 이동
    const nextIdx = Math.min(retryOrder.length - 1, retryIdx + 1);
    setRetryIdx(nextIdx);
    const nextQ = setData.questions.find((x) => x.number === retryOrder[nextIdx]) || null;
    setCurrent(nextQ);
    setPicks([]);
  };

  // Evidence 간단 보기(해당 문장 하이라이트 스크롤은 추후)
  const evidenceHtml = (q: Question) => {
    const H = new Set(q.evidence_sent_idx || []);
    return (setData.sentences || [])
      .map((s, i) => `<div style="padding:4px;border-radius:6px;${H.has(i) ? 'background:#fef3c7' : ''}">${i + 1}. ${s}</div>`)
      .join('');
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Reading · Study</h1>

      {stage === 'hub' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <button onClick={() => listBy(true)} className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <strong>Correct Answers</strong>
            <div className="text-sm text-gray-500">맞은 문제 목록</div>
          </button>
          <button onClick={() => listBy(false)} className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <strong>Wrong Answers</strong>
            <div className="text-sm text-gray-500">오답 리스트 → Retry</div>
          </button>
          <button onClick={() => setStage('trans')} className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <strong>Translation Practice</strong>
            <div className="text-sm text-gray-500">문장 번역 연습</div>
          </button>
        </div>
      )}

      {stage === 'correct' && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setStage('hub')} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Back</button>
          </div>
          <h2 className="font-medium mb-2">Correct Answers</h2>
          <div className="border rounded-lg divide-y">
            {[...setData.questions]
              .sort((a, b) => a.number - b.number)
              .filter((q) => isCorrect(q, savedAns[q.number]))
              .map((q) => (
                <div key={q.number} className="p-3">
                  <div className="text-sm text-gray-600">Q{q.number}</div>
                  <div className="font-medium">{q.prompt}</div>
                  <div className="text-xs text-gray-500 mt-1">{(q.skill || []).join(', ') || q.type || '-'}</div>
                </div>
              ))}
          </div>
        </section>
      )}

      {stage === 'wrong' && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setStage('hub')} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Back</button>
          </div>
          <h2 className="font-medium mb-2">Wrong Answers</h2>
          <div className="border rounded-lg divide-y">
            {[...setData.questions]
              .sort((a, b) => a.number - b.number)
              .filter((q) => !isCorrect(q, savedAns[q.number]))
              .map((q) => (
                <button
                  key={q.number}
                  className="w-full text-left p-3 hover:bg-gray-50"
                  onClick={() =>
                    startRetry(
                      q,
                      [...setData.questions].sort((a, b) => a.number - b.number).filter((x) => !isCorrect(x, savedAns[x.number])),
                    )
                  }
                >
                  <div className="text-sm text-gray-600">Q{q.number}</div>
                  <div className="font-medium">{q.prompt}</div>
                  <div className="text-xs text-gray-500 mt-1">{(q.skill || []).join(', ') || q.type || '-'}</div>
                </button>
              ))}
          </div>
        </section>
      )}

      {stage === 'retry' && current && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setStage('wrong')} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Back</button>
            <div className="text-sm text-gray-500">
              {retryIdx + 1}/{retryOrder.length}
            </div>
          </div>

          <h2 className="font-medium">Retry — Q{current.number}</h2>
          <p className="mt-2">{current.prompt}</p>

          <div className="mt-3 space-y-2">
            {current.choices.map((c, i) => {
              const multi = current.type === 'multi' || (current.correct || []).length > 1;
              const checked = picks.includes(i);
              return (
                <label key={i} className="flex items-center gap-2 border rounded-md p-2">
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={`retry_${current.number}`}
                    checked={checked}
                    onChange={(e) => {
                      if (multi) {
                        setPicks((prev) => (e.target.checked ? [...prev, i] : prev.filter((x) => x !== i)));
                      } else {
                        setPicks([i]);
                      }
                    }}
                  />
                  <span>{c}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={submitRetry}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Submit
            </button>
            <details className="ml-2">
              <summary className="cursor-pointer text-sm underline">Passage</summary>
              <div
                className="mt-2 text-sm leading-6 border rounded-md p-3"
                dangerouslySetInnerHTML={{ __html: evidenceHtml(current) }}
              />
            </details>
          </div>

          {current.explanation && (
            <p className="mt-3 text-sm text-gray-600">Explanation: {current.explanation}</p>
          )}
        </section>
      )}

      {stage === 'trans' && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setStage('hub')} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Back</button>
            <label className="text-sm flex items-center gap-2 ml-auto">
              <input type="checkbox" checked={showModel} onChange={(e) => setShowModel(e.target.checked)} />
              Show model translation
            </label>
          </div>
          <h2 className="font-medium mb-2">Translation Practice</h2>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 w-12">#</th>
                  <th className="border p-2">English</th>
                  <th className="border p-2">Korean (student)</th>
                  {showModel && <th className="border p-2">Korean (model)</th>}
                </tr>
              </thead>
              <tbody>
                {setData.sentences.map((s, i) => {
                  const id = `rsm_tr_${i}`;
                  return (
                    <tr key={i}>
                      <td className="border p-2 align-top">{i + 1}</td>
                      <td className="border p-2 align-top">{s}</td>
                      <td className="border p-2">
                        <textarea
                          className="w-full border rounded-md p-2"
                          rows={2}
                          defaultValue={savedTrans[id] || ''}
                          onChange={(e) => {
                            const m = { ...savedTrans, [id]: e.target.value };
                            saveTrans(m);
                          }}
                        />
                      </td>
                      {showModel && (
                        <td className="border p-2 align-top">
                          {setData.model_translation?.[i] || ''}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
