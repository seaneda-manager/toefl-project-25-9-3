"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { parseRawToWordEntries } from "@/lib/vocab/parseRawWords";

function cleanStr(s: unknown): string {
  return String(s ?? "").trim();
}
function normText(s: string): string {
  return cleanStr(s).toLowerCase();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// helpers: treat "empty" for json/array-ish fields
function isEmptyJsonArray(v: any): boolean {
  if (!v) return true;
  if (Array.isArray(v)) return v.length === 0;
  // supabase can return json as object/unknown
  try {
    if (typeof v === "string") {
      const t = v.trim();
      if (!t) return true;
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed.length === 0 : false;
    }
  } catch {}
  return false;
}

function asArrayOrEmpty(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

export async function importVocabWordsListAction(params: {
  raw: string;
  sourceLabel?: string | null;
  note?: string | null;
  maxItems?: number;
}) {
  const supabase = await getServerSupabase();

  const raw = String(params.raw ?? "");
  const sourceLabel = params.sourceLabel ?? null;
  const note = params.note ?? null;
  const maxItems = Math.min(Math.max(params.maxItems ?? 500, 1), 2000);

  // ✅ word + meanings_ko 함께 파싱
  const entriesAll = parseRawToWordEntries(raw);
  const entries = entriesAll.slice(0, maxItems);

  const {
    data: { user },
    error: uerr,
  } = await supabase.auth.getUser();
  if (uerr || !user) throw new Error("로그인이 필요합니다.");

  // batch 생성
  const { data: batch, error: berr } = await supabase
    .from("vocab_import_batches")
    .insert({
      created_by: user.id,
      source_label: sourceLabel,
      total_lines: entries.length,
      note,
    })
    .select("id")
    .single();

  if (berr || !batch?.id) {
    console.error(berr);
    throw new Error("import batch 생성 실패");
  }

  const batchId: string = String(batch.id);

  if (entries.length === 0) {
    await supabase
      .from("vocab_import_batches")
      .update({ inserted_count: 0, skipped_count: 0 })
      .eq("id", batchId);
    return {
      ok: true,
      batchId,
      total: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      insertedIds: [] as string[],
      updatedIds: [] as string[],
    };
  }

  // 기존 단어(text_norm) 조회
  const norms = entries.map((e) => normText(e.text)).filter(Boolean);

  type ExistingWordRow = {
    id: string;
    text_norm: string;
    meanings_ko: any;
    meanings_en_simple: any;
    examples_easy: any;
    examples_normal: any;
    derived_terms: any;
    synonyms_en_simple: any;
    notes: string | null;
  };

  const existingByNorm = new Map<string, ExistingWordRow>();

  for (const part of chunk(Array.from(new Set(norms)), 200)) {
    const { data: existingRows, error: exerr } = await supabase
      .from("words")
      .select(
        "id, text_norm, meanings_ko, meanings_en_simple, examples_easy, examples_normal, derived_terms, synonyms_en_simple, notes",
      )
      .in("text_norm", part);

    if (exerr) {
      console.error(exerr);
      throw new Error("기존 단어 조회 실패");
    }

    for (const r of (existingRows ?? []) as any[]) {
      const tn = String(r.text_norm ?? "");
      if (!tn) continue;
      existingByNorm.set(tn, {
        id: String(r.id),
        text_norm: tn,
        meanings_ko: r.meanings_ko,
        meanings_en_simple: r.meanings_en_simple,
        examples_easy: r.examples_easy,
        examples_normal: r.examples_normal,
        derived_terms: r.derived_terms,
        synonyms_en_simple: r.synonyms_en_simple,
        notes: (r.notes ?? null) as any,
      });
    }
  }

  const insertedIds: string[] = [];
  const updatedIds: string[] = [];

  let skipped = 0;
  let updated = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const text = cleanStr(entry.text);
    const text_norm = normText(text);

    if (!text_norm) {
      skipped++;
      continue;
    }

    const safeNotes =
      (sourceLabel ? `import:${sourceLabel}` : "import") + (note ? ` | ${note}` : "");

    const existing = existingByNorm.get(text_norm);

    // ✅ 이미 존재하면: "스킵"하되, 비어있는 필드만 채우는 patch update
    if (existing) {
      const patch: Record<string, any> = {};

      // meanings_ko: 기존이 비어있고, 들어온 값이 있으면 채움
      const incomingKo = Array.isArray((entry as any).meanings_ko) ? (entry as any).meanings_ko : [];
      if (isEmptyJsonArray(existing.meanings_ko) && incomingKo.length > 0) {
        patch.meanings_ko = incomingKo;
      }

      // (옵션) meanings_en_simple도 entry에 있다면 동일 로직으로 추가 가능
      const incomingEn = Array.isArray((entry as any).meanings_en_simple)
        ? (entry as any).meanings_en_simple
        : [];
      if (isEmptyJsonArray(existing.meanings_en_simple) && incomingEn.length > 0) {
        patch.meanings_en_simple = incomingEn;
      }

      // examples_easy / examples_normal
      const incomingEasy = asArrayOrEmpty((entry as any).examples_easy);
      if (isEmptyJsonArray(existing.examples_easy) && incomingEasy.length > 0) {
        patch.examples_easy = incomingEasy;
      }

      const incomingNormal = asArrayOrEmpty((entry as any).examples_normal);
      if (isEmptyJsonArray(existing.examples_normal) && incomingNormal.length > 0) {
        patch.examples_normal = incomingNormal;
      }

      // derived_terms
      const incomingDerived = asArrayOrEmpty((entry as any).derived_terms);
      if (isEmptyJsonArray(existing.derived_terms) && incomingDerived.length > 0) {
        patch.derived_terms = incomingDerived;
      }

      // synonyms_en_simple (string column일 가능성이 커서 string로만)
      const incomingSyn = cleanStr((entry as any).synonyms_en_simple);
      if ((!existing.synonyms_en_simple || String(existing.synonyms_en_simple).trim() === "") && incomingSyn) {
        patch.synonyms_en_simple = incomingSyn;
      }

      // notes: 기존 notes가 비어있으면 safeNotes 넣기 (덮어쓰지 않음)
      if (!existing.notes || !String(existing.notes).trim()) {
        patch.notes = safeNotes;
      }

      if (Object.keys(patch).length > 0) {
        const { error: uperr } = await supabase.from("words").update(patch).eq("id", existing.id);
        if (!uperr) {
          updated++;
          updatedIds.push(existing.id);
          // 메모리 맵도 갱신 (다음 entry에서 같은 단어 또 나오면 불필요 update 방지)
          existingByNorm.set(text_norm, { ...existing, ...patch } as any);
        }
      }

      // "insert"는 아니므로 skipped로 잡음
      skipped++;
      continue;
    }

    // ✅ 없으면 새로 insert (여기서만 batch_items 기록해서 Undo 안전)
    const { data: inserted, error: ierr } = await supabase
      .from("words")
      .insert({
        text,
        lemma: text,
        pos: "other",
        is_function_word: false,

        meanings_ko: Array.isArray((entry as any).meanings_ko) ? (entry as any).meanings_ko : [],
        meanings_en_simple: Array.isArray((entry as any).meanings_en_simple)
          ? (entry as any).meanings_en_simple
          : [],

        examples_easy: asArrayOrEmpty((entry as any).examples_easy),
        examples_normal: asArrayOrEmpty((entry as any).examples_normal),
        derived_terms: asArrayOrEmpty((entry as any).derived_terms),

        difficulty: (entry as any).difficulty ?? null,
        frequency_score: (entry as any).frequency_score ?? null,
        synonyms_en_simple: cleanStr((entry as any).synonyms_en_simple) || null,
        notes: safeNotes,
      })
      .select("id, text_norm")
      .single();

    if (ierr || !inserted?.id) {
      skipped++;
      continue;
    }

    const wordId = String((inserted as any).id);
    insertedIds.push(wordId);

    // ✅ undo 안전: "이번 batch로 새로 생성된 단어"만 기록
    const { error: logErr } = await supabase.from("vocab_import_batch_items").insert({
      batch_id: batchId,
      word_id: wordId,
      text_norm,
    });

    if (logErr) {
      console.error(logErr);
      throw new Error("import log 저장 실패 (vocab_import_batch_items)");
    }

    // map 갱신
    existingByNorm.set(text_norm, {
      id: wordId,
      text_norm,
      meanings_ko: Array.isArray((entry as any).meanings_ko) ? (entry as any).meanings_ko : [],
      meanings_en_simple: Array.isArray((entry as any).meanings_en_simple)
        ? (entry as any).meanings_en_simple
        : [],
      examples_easy: asArrayOrEmpty((entry as any).examples_easy),
      examples_normal: asArrayOrEmpty((entry as any).examples_normal),
      derived_terms: asArrayOrEmpty((entry as any).derived_terms),
      synonyms_en_simple: cleanStr((entry as any).synonyms_en_simple) || null,
      notes: safeNotes,
    } as any);
  }

  const inserted = insertedIds.length;

  await supabase
    .from("vocab_import_batches")
    .update({ inserted_count: inserted, skipped_count: skipped })
    .eq("id", batchId);

  return {
    ok: true,
    batchId,
    total: entries.length,
    inserted,
    updated,
    skipped,
    insertedIds,
    updatedIds,
  };
}
