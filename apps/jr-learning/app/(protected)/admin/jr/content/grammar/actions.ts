"use server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function saveGrammarChapterAction(input: {
  title: string;
  content: string;
  level: "middle" | "high";
}) {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("jr_grammar_chapters")
      .insert([
        {
          title: input.title,
          content: input.content,
          level: input.level,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
