// apps/web/app/(protected)/admin/vocab/import/_client/WisewordCsvImporter.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  importWisewordWordsAndCreateSetFromJsonText,
  importWisewordWordsFromJsonText,
  type ImportWisewordWordsAndCreateSetFromJsonTextInput,
  type ImportWisewordWordsFromJsonTextInput,
  type ImportWisewordCsvActionResult,
} from "../wiseword-actions";

type Props = {
  initialSlug?: string;
  initialTitle?: string;
  initialDescription?: string;
};

function clean(s: any) {
  return String(s ?? "").trim();
}

const JSON_SHAPE = "[{...}, {...}]";

export default function WisewordCsvImporter({
  initialSlug = "",
  initialTitle = "",
  initialDescription = "",
}: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState<"WORDS" | "SET" | null>(null);
  const [result, setResult] = useState<ImportWisewordCsvActionResult | null>(null);

  const canImportWords = useMemo(() => {
    const t = clean(jsonText);
    return t.startsWith("[") || t.startsWith("{");
  }, [jsonText]);

  const canImportSet = useMemo(() => {
    return canImportWords && !!clean(slug);
  }, [canImportWords, slug]);

  async function doImportWordsOnly() {
    setResult(null);
    setBusy("WORDS");
    try {
      const input: ImportWisewordWordsFromJsonTextInput = { jsonText };
      const r = await importWisewordWordsFromJsonText(input);
      setResult(r);
    } finally {
      setBusy(null);
    }
  }

  async function doImportAndCreateSet() {
    setResult(null);
    setBusy("SET");
    try {
      const input: ImportWisewordWordsAndCreateSetFromJsonTextInput = {
        slug: clean(slug),
        title: clean(title) || null,
        description: clean(description) || null,
        jsonText,
      };
      const r = await importWisewordWordsAndCreateSetFromJsonText(input);
      setResult(r);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-xs font-semibold text-slate-500">Wiseword Import</div>
        <div className="mt-1 text-lg font-semibold text-slate-900">CSV → JSON → DB</div>
        <div className="mt-2 text-sm text-slate-600">
          아래 JSON 칸에는 <span className="font-mono">{JSON_SHAPE}</span> 형태로 붙여넣으면 됨.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold text-slate-600">slug (required for set)</div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. neungyul-derivation-day01"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neungyul Derivation Day 01"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">description</div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="optional"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-600">JSON rows</div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`Example:
[
  {
    "text": "retire",
    "lemma": "retire",
    "pos": "verb",
    "meanings_ko": ["은퇴하다"],
    "meanings_en_simple": ["to stop working permanently"],
    "examples_easy": "He will retire next year.",
    "synonyms_en_simple": ["quit", "leave"]
  }
]`}
            className="mt-1 h-64 w-full rounded-xl border p-3 font-mono text-[12px]"
          />
          <div className="mt-2 text-xs text-slate-500">
            팁: CSV 파서 완전복구 전에, JSON 인젝션 루트부터 살려두면 회복 속도가 미친 듯이 빨라짐.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          <button
            onClick={doImportWordsOnly}
            disabled={!canImportWords || busy !== null}
            className="rounded-xl border bg-white py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            {busy === "WORDS" ? "Importing..." : "Import Words Only"}
          </button>
          <button
            onClick={doImportAndCreateSet}
            disabled={!canImportSet || busy !== null}
            className="rounded-xl bg-black py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "SET" ? "Importing..." : "Import + Create/Replace Set"}
          </button>
        </div>
      </div>

      {result ? (
        <div className={`rounded-2xl border p-5 ${result.ok ? "bg-emerald-50" : "bg-rose-50"}`}>
          <div className={`font-semibold ${result.ok ? "text-emerald-900" : "text-rose-900"}`}>
            {result.ok ? "OK" : "FAILED"}
          </div>

          <div className="mt-2 text-sm text-slate-800">
            {"setId" in result && (result as any).setId ? (
              <div>
                setId: <span className="font-mono">{(result as any).setId}</span>
              </div>
            ) : null}
            {"insertedWords" in result ? <div>insertedWords: {(result as any).insertedWords}</div> : null}
            {"existingWords" in result ? <div>existingWords: {(result as any).existingWords}</div> : null}
            {"insertedSetItems" in result ? <div>insertedSetItems: {(result as any).insertedSetItems}</div> : null}
            {"totalRows" in result ? <div>totalRows: {(result as any).totalRows}</div> : null}
            {"skippedRows" in result ? <div>skippedRows: {(result as any).skippedRows}</div> : null}
          </div>

          {"error" in result && (result as any).error ? (
            <div className="mt-2 text-sm text-rose-800">
              error: <span className="font-mono">{(result as any).error}</span>
            </div>
          ) : null}

          {"errors" in result && Array.isArray((result as any).errors) && (result as any).errors.length ? (
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-700">errors</div>
              <pre className="mt-1 max-h-64 overflow-auto rounded-xl border bg-white p-2 text-[11px] text-slate-700">
                {JSON.stringify((result as any).errors, null, 2)}
              </pre>
            </div>
          ) : null}

          {"diag" in result && (result as any).diag ? (
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-700">diag</div>
              <pre className="mt-1 max-h-64 overflow-auto rounded-xl border bg-white p-2 text-[11px] text-slate-700">
                {JSON.stringify((result as any).diag, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
