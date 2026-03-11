"use server";

import { getSupabaseServer } from "@/lib/supabaseServer";
import { readingSetSchema } from "@/models/reading/zod";
import { z } from "zod";
import {
  toParagraphs,
  joinParagraphs,
  coerceIsCorrect,
  mergeExplanationMeta,
} from "@/lib/reading/normalize";

export type RSet = z.infer<typeof readingSetSchema>;

export type StartReadingArgs = {
  setId?: string;
  passageId?: string;
  mode?: "study" | "test" | "exam" | "practice" | "drill" | "review";
  product?: "toefl" | "lingox";
  track?: "ms" | "hs" | "junior";
  profileId?: string;
};

export type SubmitReadingArgs = {
  sessionId?: string | number;
  questionId: string;
  choiceId: string;
  passageId?: string;
  elapsedMs?: number;
};

export type FinishReadingArgs = { sessionId?: string | number };

/** ====== Content (Set/Passage/Q/A) ====== */
export async function upsertReadingSet(json: unknown) {
  const supabase = await getSupabaseServer();
  const parsed = readingSetSchema.parse(json);

  {
    const { error } = await supabase.from("reading_sets").upsert({
      id: parsed.id,
      label: parsed.label,
      source: parsed.source,
      version: parsed.version,
    });
    if (error) throw error;
  }

  {
    const { error } = await supabase
      .from("reading_passages")
      .delete()
      .eq("set_id", parsed.id);
    if (error) throw error;
  }

  for (let i = 0; i < parsed.passages.length; i++) {
    const p = parsed.passages[i];

    {
      const { error: pErr } = await supabase.from("reading_passages").insert({
        id: p.id,
        set_id: parsed.id,
        title: p.title,
        content: joinParagraphs(p.paragraphs),
        ord: i + 1,
      });
      if (pErr) throw pErr;
    }

    for (let j = 0; j < p.questions.length; j++) {
      const q = p.questions[j];
      const explanationFromMeta =
        (q.meta as any)?.explanation != null ? (q.meta as any).explanation : null;

      {
        const { error: qErr } = await supabase.from("reading_questions").insert({
          id: q.id,
          passage_id: p.id,
          number: q.number,
          type: q.type,
          stem: q.stem,
          meta: q.meta ?? {},
          explanation: explanationFromMeta,
          ord: j + 1,
        });
        if (qErr) throw qErr;
      }

      const choices = q.choices ?? [];
      for (let k = 0; k < choices.length; k++) {
        const c = choices[k];
        const { error: cErr } = await supabase.from("reading_choices").insert({
          id: c.id,
          question_id: q.id,
          text: c.text,
          is_correct: !!c.isCorrect,
          explain: null,
          ord: k + 1,
        });
        if (cErr) throw cErr;
      }
    }
  }

  return { ok: true } as const;
}

export async function loadReadingSet(setId: string): Promise<RSet | null> {
  const supabase = await getSupabaseServer();

  const { data: set, error: setErr } = await supabase
    .from("reading_sets")
    .select("*")
    .eq("id", setId)
    .single();
  if (setErr) throw setErr;

  const { data: passages, error: pErr } = await supabase
    .from("reading_passages")
    .select("*")
    .eq("set_id", setId)
    .order("ord", { ascending: true });
  if (pErr) throw pErr;

  if (!set || !passages) return null;

  const result: RSet = {
    id: set.id,
    label: set.label ?? "",
    source: set.source ?? "",
    version: set.version ?? 1,
    passages: [],
  };

  for (const p of passages) {
    const { data: qs, error: qErr } = await supabase
      .from("reading_questions")
      .select("*")
      .eq("passage_id", p.id)
      .order("ord", { ascending: true });
    if (qErr) throw qErr;

    const questions = [] as RSet["passages"][number]["questions"];

    for (const q of qs ?? []) {
      const { data: cs, error: cErr } = await supabase
        .from("reading_choices")
        .select("*")
        .eq("question_id", q.id)
        .order("ord", { ascending: true });
      if (cErr) throw cErr;

      const metaMerged = mergeExplanationMeta(q?.meta, q?.explanation, undefined);

      questions.push({
        id: String(q.id),
        number: q.number ?? 0,
        type: q.type,
        stem: q.stem ?? "",
        meta: metaMerged ?? {},
        choices: (cs ?? []).map((c: any) => ({
          id: String(c.id),
          text: c.text ?? "",
          isCorrect: coerceIsCorrect(c.is_correct),
        })),
      });
    }

    result.passages.push({
      id: String(p.id),
      title: p.title ?? "",
      paragraphs: toParagraphs(p.content),
      questions,
    });
  }

  return result;
}

/** ====== Session Actions (REAL DB, SAFE) ====== */
function supaMsg(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (typeof e?.message === "string") return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export async function startReadingSession(args: StartReadingArgs) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return { ok: false, error: supaMsg(userErr) } as const;
    if (!user) return { ok: false, error: "Not authenticated" } as const;

    let setId = args.setId ?? null;
    let passageId = args.passageId ?? null;

    if (!passageId && setId) {
      const { data: p, error } = await supabase
        .from("reading_passages")
        .select("id")
        .eq("set_id", setId)
        .order("ord", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { ok: false, error: supaMsg(error) } as const;
      if (!p?.id) return { ok: false, error: `No passage for setId=${setId}` } as const;

      passageId = String(p.id);
    }

    if (passageId && !setId) {
      const { data: p, error } = await supabase
        .from("reading_passages")
        .select("set_id")
        .eq("id", passageId)
        .maybeSingle();

      if (error) return { ok: false, error: supaMsg(error) } as const;
      setId = p?.set_id ? String(p.set_id) : null;
    }

    if (!passageId) {
      return { ok: false, error: "Missing passageId" } as const;
    }

    const { data, error } = await supabase
      .from("reading_sessions")
      .insert({
        user_id: user.id,
        set_id: setId,
        passage_id: passageId,
        mode: args.mode ?? "test",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: supaMsg(error) } as const;
    return { ok: true, sessionId: String(data.id) } as const;
  } catch (e: any) {
    return { ok: false, error: supaMsg(e) } as const;
  }
}

export async function submitReadingAnswer(
  args: Omit<SubmitReadingArgs, "questionId" | "choiceId"> & {
    questionId: string | number;
    choiceId: string | number;
  },
) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return { ok: false, error: supaMsg(userErr) } as const;
    if (!user) return { ok: false, error: "Not authenticated" } as const;

    const sessionId = args.sessionId == null ? "" : String(args.sessionId);
    if (!sessionId) return { ok: true } as const;

    const questionId = String(args.questionId);
    const raw = String(args.choiceId);

    const parts = raw.includes("|")
      ? raw.split("|").map((s) => s.trim()).filter(Boolean)
      : [raw];

    const choiceId = parts[0];

    const payload: any = {
      session_id: sessionId,
      question_id: questionId,
      passage_id: args.passageId ?? null,
      choice_id: choiceId,
      choice_ids: parts.length > 1 ? parts : null,
      elapsed_ms: typeof args.elapsedMs === "number" ? args.elapsedMs : null,
    };

    const { error } = await supabase
      .from("reading_answers")
      .upsert(payload, { onConflict: "session_id,question_id" });

    if (error) return { ok: false, error: supaMsg(error) } as const;
    return { ok: true } as const;
  } catch (e: any) {
    return { ok: false, error: supaMsg(e) } as const;
  }
}

export async function finishReadingSession(arg: FinishReadingArgs | string | number) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return { ok: false, error: supaMsg(userErr) } as const;
    if (!user) return { ok: false, error: "Not authenticated" } as const;

    const sessionId =
      typeof arg === "string" || typeof arg === "number"
        ? String(arg)
        : arg.sessionId
          ? String(arg.sessionId)
          : "";

    if (!sessionId) return { ok: true, sessionId: "" } as const;

    const { error } = await supabase
      .from("reading_sessions")
      .update({ finished_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: supaMsg(error), sessionId } as const;
    return { ok: true, sessionId } as const;
  } catch (e: any) {
    return { ok: false, error: supaMsg(e), sessionId: "" } as const;
  }
}