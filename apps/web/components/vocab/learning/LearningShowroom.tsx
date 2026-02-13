// apps/web/components/vocab/learning/LearningShowroom.tsx
"use client";

import { useMemo, useState } from "react";

type AnyFn = (...args: any[]) => any;

type Props = {
  // flexible inputs (LearningRunner implementations vary)
  word?: any;
  words?: any[];
  index?: number;

  // flexible callbacks
  onNext?: AnyFn;
  onDone?: AnyFn;
  onFinish?: AnyFn;
  onContinue?: AnyFn;

  // optional UI controls
  title?: string;
  subtitle?: string;
  showDebug?: boolean;
};

function pickText(w: any): string {
  return (
    String(w?.text ?? "").trim() ||
    String(w?.lemma ?? "").trim() ||
    String(w?.word ?? "").trim() ||
    ""
  );
}

function pickMeaning(w: any): string {
  const en = w?.meanings_en_simple;
  const ko = w?.meanings_ko;

  if (Array.isArray(en) && en.length) return String(en[0] ?? "");
  if (typeof en === "string" && en.trim()) return en;

  if (Array.isArray(ko) && ko.length) return String(ko[0] ?? "");
  if (typeof ko === "string" && ko.trim()) return ko;

  return "";
}

function pickSynonyms(w: any): string {
  const s = w?.synonyms_en_simple ?? w?.synonyms ?? w?.synonyms_en;
  if (Array.isArray(s)) return s.filter(Boolean).slice(0, 3).join("; ");
  if (typeof s === "string") return s.trim();
  return "";
}

function pickExample(w: any): string {
  const ex = w?.examples_easy ?? w?.example_en ?? w?.example;
  if (Array.isArray(ex) && ex.length) return String(ex[0] ?? "");
  if (typeof ex === "string") return ex.trim();
  return "";
}

export default function LearningShowroom(props: Props) {
  const { words, index, word } = props;

  const current = useMemo(() => {
    if (word) return word;
    if (Array.isArray(words) && words.length) {
      const i = typeof index === "number" ? index : 0;
      return words[Math.max(0, Math.min(i, words.length - 1))];
    }
    return null;
  }, [word, words, index]);

  const text = useMemo(() => pickText(current), [current]);
  const meaning = useMemo(() => pickMeaning(current), [current]);
  const synonyms = useMemo(() => pickSynonyms(current), [current]);
  const example = useMemo(() => pickExample(current), [current]);

  const [reveal, setReveal] = useState(false);

  const go =
    props.onNext ?? props.onContinue ?? props.onDone ?? props.onFinish ?? null;

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-4 py-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">
              {props.title ?? "Learning"}
            </div>
            <div className="text-xs text-slate-500">
              {props.subtitle ?? "Look, recall, and move on."}
            </div>
          </div>

          {Array.isArray(words) && words.length ? (
            <div className="text-xs text-slate-500">
              {(typeof index === "number" ? index + 1 : 1)}/{words.length}
            </div>
          ) : null}
        </div>

        {!current ? (
          <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            No learning word provided. (LearningShowroom is rendering OK)
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Word</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {text || "(no text)"}
              </div>
            </div>

            <div className="mt-3 rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500">
                  Meaning / Synonyms / Example
                </div>
                <button
                  className="rounded-lg border px-3 py-1 text-xs"
                  onClick={() => setReveal((v) => !v)}
                >
                  {reveal ? "Hide" : "Reveal"}
                </button>
              </div>

              {reveal ? (
                <div className="mt-3 space-y-2 text-sm text-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      Meaning
                    </div>
                    <div className="mt-1">{meaning || "(no meaning)"}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      Synonyms
                    </div>
                    <div className="mt-1">{synonyms || "(no synonyms)"}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      Example
                    </div>
                    <div className="mt-1">{example || "(no example)"}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600">
                  Tap <span className="font-semibold">Reveal</span> when ready.
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="w-full rounded-xl border py-3 text-sm"
            onClick={() => setReveal(true)}
          >
            Reveal
          </button>

          <button
            className="w-full rounded-xl bg-black py-3 text-sm text-white"
            onClick={() => go?.()}
          >
            Next
          </button>
        </div>

        {props.showDebug ? (
          <pre className="mt-4 overflow-auto rounded-xl border bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(
              {
                hasWord: Boolean(word),
                wordsLen: Array.isArray(words) ? words.length : 0,
                index,
                pickedText: text,
                pickedMeaning: meaning,
              },
              null,
              2,
            )}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
