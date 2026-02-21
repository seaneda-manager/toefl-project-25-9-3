// apps/web/app/(protected)/vocab/session/actions.ts
"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { SessionWord, VocabExample, VocabCollocation } from "@/models/vocab/SessionWord";
import type { WordFormRowLike } from "@/lib/vocab/drill/buildBlockDrillTasksV1";

export type LoadSessionWordsActionInput = {
  /** Optional: force a specific setId (debug / admin / shortcut) */
  setId?: string | null;
};

export type LoadSessionWordsActionResult =
  | {
      ok: true;
      userId: string;
      academyStudentId: string | null;
      assignmentId: string | null;
      setId: string;
      assignedAt: string | null;
      words: SessionWord[];

      wordFormsByWordId?: Record<string, WordFormRowLike>;
      wordExamplesByWordId?: Record<string, any>;
      wordCollocationsByWordId?: Record<string, any>;

      note?: string;
      diag?: any;
    }
  | {
      ok: false;
      userId?: string;
      academyStudentId?: string | null;
      assignmentId?: string | null;
      setId?: string | null;
      assignedAt?: string | null;

      words?: SessionWord[];
      error?: string;
      note?: string;
      diag?: any;

      wordFormsByWordId?: Record<string, WordFormRowLike>;
      wordExamplesByWordId?: Record<string, any>;
      wordCollocationsByWordId?: Record<string, any>;
    };

function cleanStr(v: unknown): string {
  return String(v ?? "").trim();
}

function toErrMsg(e: any): string {
  return cleanStr(e?.message ?? e?.error_description ?? e?.hint ?? e ?? "unknown error");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** ✅ KST local date (YYYY-MM-DD) to match available_at(date) expectation */
function todayISO_KST(): string {
  const k = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = k.getUTCFullYear();
  const m = pad2(k.getUTCMonth() + 1);
  const d = pad2(k.getUTCDate());
  return `${y}-${m}-${d}`;
}

function isUuidLike(s: unknown): boolean {
  const t = cleanStr(s);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t);
}

function uniqKeepOrder(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const v = cleanStr(x);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normalizeStringArray(v: any): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(cleanStr).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    return s
      .split(/\s*(?:\/|,|;|\||·|\n)\s*/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function pickDate(row: any): string | null {
  return cleanStr(row?.assigned_at) || cleanStr(row?.available_at) || cleanStr(row?.created_at) || null;
}

function sortLinkRows(rows: any[]): any[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const ao =
      (typeof a?.sort_order === "number" ? a.sort_order : null) ??
      (typeof a?.order_no === "number" ? a.order_no : null) ??
      null;
    const bo =
      (typeof b?.sort_order === "number" ? b.sort_order : null) ??
      (typeof b?.order_no === "number" ? b.order_no : null) ??
      null;

    if (ao != null && bo != null) return ao - bo;
    if (ao != null) return -1;
    if (bo != null) return 1;

    const ac = String(a?.created_at ?? "");
    const bc = String(b?.created_at ?? "");
    if (ac && bc) return ac.localeCompare(bc);
    return 0;
  });
  return copy;
}

function reorderByIds<T extends { id?: string; word_id?: string }>(rows: T[], ids: string[]) {
  const map = new Map<string, T>();
  for (const r of rows) {
    const id = cleanStr((r as any)?.id ?? (r as any)?.word_id ?? "");
    if (id) map.set(id, r);
  }
  return ids.map((id) => map.get(id)).filter(Boolean) as T[];
}

const WORD_FORMS_SELECT = [
  "word_id",
  "lemma",
  "base_pos",
  "noun_form",
  "adj_form",
  "adv_form",
  "ed_adj_form",
  "verb_3rd",
  "verb_past",
  "verb_pp",
  "verb_ing",
  "noun_meaning_ko",
  "adj_meaning_ko",
  "adv_meaning_ko",
  "ed_adj_meaning_ko",
  "created_at",
  "updated_at",
].join(",");

async function trySelectManyIn(
  client: any,
  table: string,
  select: string,
  inCol: string,
  inValues: string[],
) {
  try {
    const { data, error } = await client.from(table).select(select).in(inCol, inValues);
    if (error) return { ok: false as const, error };
    return { ok: true as const, rows: Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok: false as const, error: e };
  }
}

/* ----------------------------
 * examples / collocations parsing (robust)
 * --------------------------- */

function splitExamples(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => cleanStr(x)).filter(Boolean);
  if (typeof v === "string") {
    const s = cleanStr(v);
    if (!s) return [];
    const byNewline = s.split(/\r?\n+/).map(cleanStr).filter(Boolean);
    if (byNewline.length > 1) return byNewline;

    const byBar = s.split(/\s*\|\s*/g).map(cleanStr).filter(Boolean);
    if (byBar.length > 1) return byBar;

    const bySemi = s.split(/\s*;\s*/g).map(cleanStr).filter(Boolean);
    if (bySemi.length > 1) return bySemi;

    return [s];
  }
  return [];
}

function uniqKeepOrderExamples(arr: VocabExample[]): VocabExample[] {
  const out: VocabExample[] = [];
  const seen = new Set<string>();
  for (const ex of arr) {
    const en = cleanStr(ex?.en);
    const ko = cleanStr(ex?.ko ?? "");
    if (!en) continue;
    const k = `${en.toLowerCase()}|${ko.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ en, ko: ko || null });
  }
  return out;
}

function extractExamplesFromRow(row: any): VocabExample[] {
  if (!row) return [];

  const direct = row.examples ?? row.vocab_examples ?? null;
  if (Array.isArray(direct) && direct.length > 0) {
    const mapped = direct
      .map((x: any) => {
        const en = cleanStr(x?.en ?? x?.sentence_en ?? x?.example_en ?? x);
        const ko = cleanStr(x?.ko ?? x?.sentence_ko ?? x?.example_ko ?? "");
        if (!en) return null;
        return { en, ko: ko || null } as VocabExample;
      })
      .filter(Boolean) as VocabExample[];
    if (mapped.length) return uniqKeepOrderExamples(mapped);
  }

  const enCandidates = [row.examples_easy, row.examples_en, row.example_en, row.example, row.examples];
  const koCandidates = [row.examples_ko, row.example_ko];

  let ens: string[] = [];
  for (const c of enCandidates) {
    const arr = splitExamples(c);
    if (arr.length) {
      ens = arr;
      break;
    }
  }

  let kos: string[] = [];
  for (const c of koCandidates) {
    const arr = splitExamples(c);
    if (arr.length) {
      kos = arr;
      break;
    }
  }

  if (ens.length === 0) return [];

  const out: VocabExample[] = [];
  for (let i = 0; i < ens.length; i++) {
    const en = cleanStr(ens[i]);
    if (!en) continue;
    const ko = kos[i] ? cleanStr(kos[i]) : "";
    out.push({ en, ko: ko || null });
  }
  return uniqKeepOrderExamples(out);
}

function hashId(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function uniqKeepOrderCollocations(arr: VocabCollocation[]): VocabCollocation[] {
  const out: VocabCollocation[] = [];
  const seen = new Set<string>();
  for (const c of arr ?? []) {
    const base = cleanStr((c as any)?.base);
    const right = cleanStr((c as any)?.right);
    if (!base || !right) continue;
    const k = `${base.toLowerCase()}|${right.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      id: cleanStr((c as any)?.id) || hashId(k),
      base,
      right,
      meaning_ko: (c as any)?.meaning_ko ?? null,
      source: (c as any)?.source ?? "db",
    } as any);
  }
  return out;
}

function extractCollocationsFromRow(row: any, baseWord: string): VocabCollocation[] {
  if (!row) return [];
  const base = cleanStr(baseWord);
  if (!base) return [];

  const direct = row.collocations ?? row.vocab_collocations ?? null;

  // array of objects
  if (Array.isArray(direct) && direct.length > 0 && typeof direct[0] === "object") {
    const mapped = direct
      .map((x: any) => {
        const b = cleanStr(x?.base ?? x?.left ?? base);
        const r = cleanStr(x?.right ?? x?.collocate ?? x?.phrase ?? "");
        if (!b || !r) return null;
        return {
          id: cleanStr(x?.id) || hashId(`${b.toLowerCase()}|${r.toLowerCase()}`),
          base: b,
          right: r,
          meaning_ko: cleanStr(x?.meaning_ko ?? "") || null,
          source: (x?.source === "auto" ? "auto" : "db") as any,
        } as VocabCollocation;
      })
      .filter(Boolean) as VocabCollocation[];

    const uniq = uniqKeepOrderCollocations(mapped);
    if (uniq.length) return uniq;
  }

  // jsonb object: {pairs/items/list: [...]}
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    const arr = (direct.pairs ?? direct.items ?? direct.list ?? null) as any;
    if (Array.isArray(arr) && arr.length > 0) {
      const mapped = arr
        .map((x: any) => {
          const b = cleanStr(x?.base ?? x?.left ?? base);
          const r = cleanStr(x?.right ?? x?.collocate ?? x?.phrase ?? "");
          if (!b || !r) return null;
          return {
            id: cleanStr(x?.id) || hashId(`${b.toLowerCase()}|${r.toLowerCase()}`),
            base: b,
            right: r,
            meaning_ko: cleanStr(x?.meaning_ko ?? "") || null,
            source: "db" as any,
          } as VocabCollocation;
        })
        .filter(Boolean) as VocabCollocation[];
      const uniq = uniqKeepOrderCollocations(mapped);
      if (uniq.length) return uniq;
    }
  }

  // string/array-of-strings
  if (typeof direct === "string" || Array.isArray(direct)) {
    const raw = Array.isArray(direct) ? direct : direct.split(/\r?\n|;/g);
    const out: VocabCollocation[] = [];
    for (const line of raw) {
      const p = cleanStr(line);
      if (!p) continue;
      // naive: "base right..."
      out.push({
        id: hashId(`${base.toLowerCase()}|${p.toLowerCase()}`),
        base,
        right: p,
        source: "db",
      } as any);
    }
    return uniqKeepOrderCollocations(out);
  }

  return [];
}

/* ----------------------------
 * Supabase clients
 * --------------------------- */

async function createAuthedServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url) throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL");
  if (!service) return null;

  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * ✅ DB-true resolver:
 * - auth userId -> academy_students.id
 * - latest OPEN assignment: student_vocab_assignments (available + not completed/canceled)
 *   fallback: vocab_set_assignments (manual)
 * - set words: vocab_set_items (SSOT)
 * - words: words_with_meaning view, fallback words table
 * - word_forms optional
 */
export async function loadSessionWordsAction(
  input: LoadSessionWordsActionInput,
): Promise<LoadSessionWordsActionResult> {
  const diag: any = { steps: [] as any[] };

  try {
    const authed = await createAuthedServerClient();
    const admin = createAdminClient();
    const client = admin ?? authed;

    // 1) auth user
    const { data: userData, error: userErr } = await authed.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return {
        ok: false,
        error: "NOT_LOGGED_IN",
        note: "auth.getUser() failed or empty",
        diag: { ...diag, userErr: toErrMsg(userErr) },
      };
    }
    const userId = userData.user.id;

    const todayISO = todayISO_KST();
    diag.todayISO = todayISO;

    // 2) resolve academyStudentId (academy_students.id)
    let academyStudentId: string | null = null;

    // 2-0) if userId is already a student uuid and exists, accept
    if (isUuidLike(userId)) {
      try {
        const { data, error } = await client.from("academy_students").select("id").eq("id", userId).maybeSingle();
        diag.steps.push({ kind: "resolveAcademyStudent", by: "id", ok: !error, err: error ? toErrMsg(error) : null });
        if (!error && data?.id) academyStudentId = cleanStr(data.id) || null;
      } catch (e) {
        diag.steps.push({ kind: "resolveAcademyStudent", by: "id", ok: false, err: toErrMsg(e) });
      }
    }

    // 2-1) auth_user_id
    if (!academyStudentId) {
      try {
        const { data, error } = await client
          .from("academy_students")
          .select("id")
          .eq("auth_user_id", userId)
          .maybeSingle();

        diag.steps.push({
          kind: "resolveAcademyStudent",
          by: "auth_user_id",
          ok: !error,
          err: error ? toErrMsg(error) : null,
        });

        if (!error && data?.id) academyStudentId = cleanStr(data.id) || null;
      } catch (e) {
        diag.steps.push({ kind: "resolveAcademyStudent", by: "auth_user_id", ok: false, err: toErrMsg(e) });
      }
    }

    // 2-2) legacy: user_id / profile_id
    if (!academyStudentId) {
      const tries: Array<{ col: string; label: string }> = [
        { col: "user_id", label: "user_id" },
        { col: "profile_id", label: "profile_id" },
      ];

      for (const t of tries) {
        if (academyStudentId) break;
        try {
          const { data, error } = await client.from("academy_students").select("id").eq(t.col, userId).maybeSingle();

          diag.steps.push({
            kind: "resolveAcademyStudent",
            by: t.label,
            ok: !error,
            err: error ? toErrMsg(error) : null,
          });

          if (!error && data?.id) academyStudentId = cleanStr(data.id) || null;
        } catch (e) {
          diag.steps.push({ kind: "resolveAcademyStudent", by: t.label, ok: false, err: toErrMsg(e) });
        }
      }
    }

    // 3) resolve setId / assignment
    let resolvedSetId = cleanStr(input?.setId ?? "");
    let assignmentId: string | null = null;
    let assignedAt: string | null = null;

    if (!resolvedSetId) {
      if (!academyStudentId) {
        return {
          ok: false,
          userId,
          academyStudentId: null,
          assignmentId: null,
          setId: null,
          assignedAt: null,
          error: "SET_ID_NOT_RESOLVED",
          note:
            "academy_students row not found for this user. Check academy_students.auth_user_id mapping or pass setId explicitly.",
          diag,
        };
      }

      // A) student_vocab_assignments: OPEN + available today
      {
        const { data, error } = await client
          .from("student_vocab_assignments")
          .select("id,set_id,available_at,assigned_at,day_index,completed_at,canceled_at")
          .eq("student_id", academyStudentId)
          .is("completed_at", null)
          .is("canceled_at", null)
          .lte("available_at", todayISO)
          .order("available_at", { ascending: false })
          .order("day_index", { ascending: false })
          .order("assigned_at", { ascending: false })
          .limit(1);

        diag.steps.push({
          kind: "resolveAssignment",
          table: "student_vocab_assignments",
          ok: !error,
          err: error ? toErrMsg(error) : null,
          rows: Array.isArray(data) ? data.length : 0,
        });

        const row = Array.isArray(data) ? data[0] : null;
        if (!error && row?.set_id) {
          assignmentId = cleanStr(row.id) || null;
          resolvedSetId = cleanStr(row.set_id) || "";
          assignedAt = pickDate(row);
          diag.assignmentSource = "student_vocab_assignments(open)";
        }
      }

      // B) fallback: vocab_set_assignments (manual)
      if (!resolvedSetId) {
        const { data, error } = await client
          .from("vocab_set_assignments")
          .select("id,set_id,assigned_at")
          .eq("student_id", academyStudentId)
          .order("assigned_at", { ascending: false })
          .limit(1);

        diag.steps.push({
          kind: "resolveAssignment",
          table: "vocab_set_assignments",
          ok: !error,
          err: error ? toErrMsg(error) : null,
          rows: Array.isArray(data) ? data.length : 0,
        });

        const row = Array.isArray(data) ? data[0] : null;
        if (!error && row?.set_id) {
          assignmentId = cleanStr(row.id) || null;
          resolvedSetId = cleanStr(row.set_id) || "";
          assignedAt = pickDate(row);
          diag.assignmentSource = "vocab_set_assignments(latest)";
        }
      }

      if (!resolvedSetId) diag.assignmentSource = "none";
    } else {
      diag.assignmentSource = "forcedSetId";
    }

    if (!resolvedSetId) {
      return {
        ok: false,
        userId,
        academyStudentId,
        assignmentId,
        setId: null,
        assignedAt,
        error: "SET_ID_NOT_RESOLVED",
        note: "No setId provided and no open assignment row found.",
        diag,
      };
    }

    // 4) load word ids from vocab_set_items (SSOT)
    let wordIds: string[] = [];
    try {
      const { data, error } = await client
        .from("vocab_set_items")
        .select("set_id,word_id,sort_order,order_no,created_at")
        .eq("set_id", resolvedSetId)
        .limit(5000);

      diag.steps.push({
        kind: "loadSetWordIds",
        table: "vocab_set_items",
        ok: !error,
        err: error ? toErrMsg(error) : null,
        rows: Array.isArray(data) ? data.length : 0,
      });

      if (error) {
        return {
          ok: false,
          userId,
          academyStudentId,
          assignmentId,
          setId: resolvedSetId,
          assignedAt,
          error: "SET_WORDS_LOOKUP_FAILED",
          note: "vocab_set_items query failed.",
          diag,
        };
      }

      const sorted = sortLinkRows(Array.isArray(data) ? data : []);
      const raw = sorted.map((r: any) => cleanStr(r?.word_id)).filter(Boolean);
      wordIds = uniqKeepOrder(raw.filter((x) => isUuidLike(x)));
      diag.linkTable = "vocab_set_items";
      diag.wordIdCount = wordIds.length;
    } catch (e) {
      diag.steps.push({ kind: "loadSetWordIds", table: "vocab_set_items", ok: false, err: toErrMsg(e) });
      return {
        ok: false,
        userId,
        academyStudentId,
        assignmentId,
        setId: resolvedSetId,
        assignedAt,
        error: "SET_WORDS_LOOKUP_FAILED",
        note: toErrMsg(e),
        diag,
      };
    }

    if (wordIds.length === 0) {
      return {
        ok: false,
        userId,
        academyStudentId,
        assignmentId,
        setId: resolvedSetId,
        assignedAt,
        error: "SET_HAS_0_WORDS",
        note: "vocab_set_items returned 0 uuid word ids. Check set items data.",
        diag,
      };
    }

    // 5) resolve words (prefer words_with_meaning view)
    const preferred = await trySelectManyIn(
      client,
      "words_with_meaning",
      [
        "id",
        "text",
        "lemma",
        "pos",
        "meanings_ko",
        "meanings_en_simple",
        "examples_easy",
        "examples_normal",
        "synonyms_en_simple",
        "collocations",
        "antonyms_terms",
        "derived_terms",
        "notes",
      ].join(","),
      "id",
      wordIds,
    );

    diag.steps.push({
      kind: "resolveWords",
      table: "words_with_meaning",
      ok: preferred.ok,
      err: preferred.ok ? null : toErrMsg((preferred as any).error),
      rows: preferred.ok ? preferred.rows.length : 0,
    });

    let wordRows: any[] = [];

    if (preferred.ok && preferred.rows.length > 0) {
      wordRows = reorderByIds(preferred.rows, wordIds);
    } else {
      const fallback = await trySelectManyIn(
        client,
        "words",
        [
          "id",
          "text",
          "lemma",
          "pos",
          "meanings_ko",
          "meanings_en_simple",
          "examples_easy",
          "examples_normal",
          "synonyms_en_simple",
          "collocations",
          "antonyms_terms",
          "notes",
        ].join(","),
        "id",
        wordIds,
      );

      diag.steps.push({
        kind: "resolveWords",
        table: "words",
        ok: fallback.ok,
        err: fallback.ok ? null : toErrMsg((fallback as any).error),
        rows: fallback.ok ? fallback.rows.length : 0,
      });

      if (!fallback.ok) {
        return {
          ok: false,
          userId,
          academyStudentId,
          assignmentId,
          setId: resolvedSetId,
          assignedAt,
          error: "WORDS_LOOKUP_FAILED",
          note: "Failed to load words from words_with_meaning and words.",
          diag,
        };
      }

      wordRows = reorderByIds(fallback.rows, wordIds);
    }

    // 6) optional word_forms
    const wfMap: Record<string, WordFormRowLike> = {};
    {
      const wf = await trySelectManyIn(client, "word_forms", WORD_FORMS_SELECT, "word_id", wordIds);
      diag.steps.push({
        kind: "loadWordForms",
        table: "word_forms",
        ok: wf.ok,
        err: wf.ok ? null : toErrMsg((wf as any).error),
        rows: wf.ok ? wf.rows.length : 0,
      });

      if (wf.ok && wf.rows.length > 0) {
        for (const r of wf.rows as any[]) {
          const wid = cleanStr(r?.word_id);
          if (!wid) continue;
          wfMap[wid] = r as any;
        }
      }
    }

    // 7) build SessionWord[] + convenience maps
    const wordExamplesByWordId: Record<string, any> = {};
    const wordCollocationsByWordId: Record<string, any> = {};

    const words: SessionWord[] = wordRows
      .map((r: any) => {
        const id = cleanStr(r?.id);
        const text = cleanStr(r?.text);
        if (!id || !text) return null;

        const meanings_ko = normalizeStringArray(r?.meanings_ko);
        const synonyms = normalizeStringArray(r?.synonyms_en_simple);
        const antonyms = normalizeStringArray(r?.antonyms_terms);

        const examples = extractExamplesFromRow(r).slice(0, 3);
        const collocations = uniqKeepOrderCollocations(extractCollocationsFromRow(r, text)).slice(0, 16);

        const wf = wfMap[id];

        wordExamplesByWordId[id] = r?.examples_easy ?? r?.examples_normal ?? null;
        wordCollocationsByWordId[id] = r?.collocations ?? null;

        return {
          id,
          text,
          lemma: cleanStr(r?.lemma) || null,
          pos: cleanStr(r?.pos) || null,
          meanings_ko: meanings_ko.length ? meanings_ko : ["(뜻 미입력)"],
          // 아래 4개는 SessionWord SSOT에서 쓰는 필드들
          examples: examples.length ? examples : undefined,
          synonyms: synonyms.length ? synonyms.slice(0, 12) : undefined,
          antonyms: antonyms.length ? antonyms.slice(0, 12) : undefined,
          collocations: collocations.length ? collocations : undefined,
          // drill builder가 쓰는 보너스
          wordForm: wf ?? undefined,
          notes: cleanStr(r?.notes) || null,
        } as any;
      })
      .filter(Boolean) as SessionWord[];

    return {
      ok: true,
      userId,
      academyStudentId,
      assignmentId,
      setId: resolvedSetId,
      assignedAt,
      words,
      wordFormsByWordId: wfMap,
      wordExamplesByWordId,
      wordCollocationsByWordId,
      note: input?.setId ? "loaded via forced setId" : `loaded via ${diag.assignmentSource}`,
      diag,
    };
  } catch (e: any) {
    return {
      ok: false,
      error: "ACTION_EXCEPTION",
      note: toErrMsg(e),
      diag: { steps: diag.steps, exception: toErrMsg(e) },
    };
  }
}
