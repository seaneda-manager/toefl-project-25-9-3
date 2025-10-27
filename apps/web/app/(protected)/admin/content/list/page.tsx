'use client';

import { useCallback, useEffect, useState } from 'react';

type Choice = { id: string; text: string; is_correct: boolean };
type Question = {
  id: string;
  number: number;
  type:
    | 'vocab' | 'detail' | 'negative_detail' | 'paraphrasing'
    | 'insertion' | 'inference' | 'purpose' | 'pronoun_ref'
    | 'summary' | 'organization';
  stem: string;
  explanation?: string | null;
  clue_quote?: string | null;
  choices: Choice[];
};
type Passage = {
  id: string;
  set_id: string;
  title: string;
  content: string; // HTML
  questions: Question[];
  stats?: { answers: number };
};

export default function ContentListPage() {
  const [items, setItems] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // entity id

  // 紐⑸줉 遺덈윭?ㅺ린 (荑쇰━ ?몄옄 諛섏쁺)
  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/admin/reading/list', window.location.origin);
      if (query) url.searchParams.set('q', query);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { items: Passage[] };
      setItems(json.items);
    } catch (e: any) {
      setError(e?.message ?? 'failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  // 留덉슫????1??濡쒕뱶
  useEffect(() => {
    void load();
  }, [load]);

  const savePassage = async (p: Passage) => {
    setBusy(p.id);
    setToast(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/reading/passage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, title: p.title, content: p.content, set_id: p.set_id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast('吏臾몄씠 ??λ릺?덉뒿?덈떎.');
      await load(q);
    } catch (e: any) {
      setError(e?.message ?? 'save failed');
    } finally {
      setBusy(null);
    }
  };

  const deletePassage = async (id: string) => {
    if (!confirm('?뺣쭚 ??젣?좉퉴?? (?덉쟾?섏? ?딆? 寃쎌슦 ??젣媛 李⑤떒?섎ŉ, ?꾩뭅?대툕濡??꾪솚?????덉뒿?덈떎)')) return;
    setBusy(id);
    setToast(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/reading/passage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast('吏臾몄씠 ??젣(?먮뒗 ?꾩뭅?대툕)?섏뿀?듬땲??');
      await load(q);
    } catch (e: any) {
      setError(e?.message ?? 'delete failed');
    } finally {
      setBusy(null);
    }
  };

  const saveQuestion = async (qitem: Question) => {
    setBusy(qitem.id);
    setToast(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/reading/question', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qitem),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast(`Q${qitem.number} ????꾨즺`);
      await load(q);
    } catch (e: any) {
      setError(e?.message ?? 'save failed');
    } finally {
      setBusy(null);
    }
  };

  const deleteQuestion = async (qid: string) => {
    if (!confirm('?대떦 臾명빆????젣?좉퉴?? (?덉쟾 ?μ튂媛 ?덉쑝硫?李⑤떒?????덉뒿?덈떎)')) return;
    setBusy(qid);
    setToast(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/reading/question', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qid }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast('臾명빆 ??젣 ?꾨즺');
      await load(q);
    } catch (e: any) {
      setError(e?.message ?? 'delete failed');
    } finally {
      setBusy(null);
    }
  };

  const saveChoice = async (qid: string, c: Choice) => {
    setBusy(c.id);
    setToast(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/reading/choice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...c, question_id: qid }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast('?좎? ????꾨즺');
      await load(q);
    } catch (e: any) {
      setError(e?.message ?? 'save failed');
    } finally {
      setBusy(null);
    }
  };

  const deleteChoice = async (cid: string) => {
    if (!confirm('???좎?瑜???젣?좉퉴??')) return;
    setBusy(cid);
    setToast(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/reading/choice', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cid }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast('?좎? ??젣 ?꾨즺');
      await load(q);
    } catch (e: any) {
      setError(e?.message ?? 'delete failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="?쒕ぉ/?명듃 寃??
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load(q);
          }}
        />
        <button
          className="border rounded px-4 py-2"
          onClick={() => void load(q)}
        >
          寃??
        </button>
      </div>

      {toast && <div className="text-green-600 text-sm">{toast}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>肄섑뀗痢좉? ?놁뒿?덈떎</div>
      ) : (
        <div className="space-y-6">
          {items.map((p) => (
            <div key={p.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  set: <b>{p.set_id}</b> 쨌 passageId: {p.id} 쨌 answers: {p.stats?.answers ?? 0}
                </div>
                <div className="flex gap-2">
                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => void savePassage(p)}
                    disabled={busy === p.id}
                  >
                    {busy === p.id ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="border rounded px-3 py-1"
                    onClick={() => void deletePassage(p.id)}
                    disabled={busy === p.id}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <input
                  className="border rounded px-3 py-2"
                  value={p.title}
                  onChange={(e) =>
                    setItems((arr) => arr.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))
                  }
                />
                <textarea
                  className="border rounded px-3 py-2 min-h-[120px]"
                  value={p.content}
                  onChange={(e) =>
                    setItems((arr) => arr.map((x) => (x.id === p.id ? { ...x, content: e.target.value } : x)))
                  }
                  placeholder="HTML content"
                />
              </div>

              <div className="mt-4 space-y-4">
                {p.questions.map((qn) => (
                  <div key={qn.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Q{qn.number} 쨌 {qn.type}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="border rounded px-3 py-1"
                          onClick={() => void saveQuestion(qn)}
                          disabled={busy === qn.id}
                        >
                          {busy === qn.id ? 'Saving...' : 'Save Q'}
                        </button>
                        <button
                          className="border rounded px-3 py-1"
                          onClick={() => void deleteQuestion(qn.id)}
                          disabled={busy === qn.id}
                        >
                          Delete Q
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 mt-2">
                      <div className="flex gap-2">
                        <input
                          className="border rounded px-2 py-1 w-24"
                          type="number"
                          value={qn.number}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id !== p.id
                                  ? x
                                  : {
                                      ...x,
                                      questions: x.questions.map((qq) =>
                                        qq.id === qn.id ? { ...qq, number: Number(e.target.value) } : qq
                                      ),
                                    }
                              )
                            )
                          }
                        />
                        <select
                          className="border rounded px-2 py-1"
                          value={qn.type}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id !== p.id
                                  ? x
                                  : {
                                      ...x,
                                      questions: x.questions.map((qq) =>
                                        qq.id === qn.id ? { ...qq, type: e.target.value as Question['type'] } : qq
                                      ),
                                    }
                              )
                            )
                          }
                        >
                          {[
                            'vocab',
                            'detail',
                            'negative_detail',
                            'paraphrasing',
                            'insertion',
                            'inference',
                            'purpose',
                            'pronoun_ref',
                            'summary',
                            'organization',
                          ].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <textarea
                        className="border rounded px-2 py-1"
                        value={qn.stem}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x) =>
                              x.id !== p.id
                                ? x
                                : {
                                    ...x,
                                    questions: x.questions.map((qq) =>
                                      qq.id === qn.id ? { ...qq, stem: e.target.value } : qq
                                    ),
                                  }
                            )
                          )
                        }
                        placeholder="stem"
                      />
                      <input
                        className="border rounded px-2 py-1"
                        value={qn.explanation ?? ''}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x) =>
                              x.id !== p.id
                                ? x
                                : {
                                    ...x,
                                    questions: x.questions.map((qq) =>
                                      qq.id === qn.id ? { ...qq, explanation: e.target.value } : qq
                                    ),
                                  }
                            )
                          )
                        }
                        placeholder="explanation"
                      />
                      <input
                        className="border rounded px-2 py-1"
                        value={qn.clue_quote ?? ''}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x) =>
                              x.id !== p.id
                                ? x
                                : {
                                    ...x,
                                    questions: x.questions.map((qq) =>
                                      qq.id === qn.id ? { ...qq, clue_quote: e.target.value } : qq
                                    ),
                                  }
                            )
                          )
                        }
                        placeholder="clue_quote"
                      />

                      <div className="space-y-2">
                        {qn.choices.map((ch) => (
                          <div key={ch.id} className="flex items-center gap-2">
                            <input
                              className="border rounded px-2 py-1 flex-1"
                              value={ch.text}
                              onChange={(e) =>
                                setItems((arr) =>
                                  arr.map((x) =>
                                    x.id !== p.id
                                      ? x
                                      : {
                                          ...x,
                                          questions: x.questions.map((qq) =>
                                            qq.id !== qn.id
                                              ? qq
                                              : {
                                                  ...qq,
                                                  choices: qq.choices.map((cc) =>
                                                    cc.id === ch.id ? { ...cc, text: e.target.value } : cc
                                                  ),
                                                }
                                          ),
                                        }
                                  )
                                )
                              }
                            />
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={!!ch.is_correct}
                                onChange={(e) =>
                                  setItems((arr) =>
                                    arr.map((x) =>
                                      x.id !== p.id
                                        ? x
                                        : {
                                            ...x,
                                            questions: x.questions.map((qq) =>
                                              qq.id !== qn.id
                                                ? qq
                                                : {
                                                    ...qq,
                                                    choices: qq.choices.map((cc) =>
                                                      cc.id === ch.id ? { ...cc, is_correct: e.target.checked } : cc
                                                    ),
                                                  }
                                            ),
                                          }
                                    )
                                  )
                                }
                              />
                              correct
                            </label>
                            <button
                              className="border rounded px-2 py-1"
                              onClick={() => void saveChoice(qn.id, ch)}
                              disabled={busy === ch.id}
                            >
                              Save
                            </button>
                            <button
                              className="border rounded px-2 py-1"
                              onClick={() => void deleteChoice(ch.id)}
                              disabled={busy === ch.id}
                            >
                              Del
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




