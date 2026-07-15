"use server";

import { getSupabaseServer } from "@/lib/supabaseServer";

export async function saveReadingPassageAction(input: {
  title: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
}) {
  try {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from("jr_reading_passages")
      .insert([
        {
          title: input.title,
          content: input.content,
          difficulty: input.difficulty,
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

export async function updateReadingPassageAction(input: {
  id: string;
  title: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
}) {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("jr_reading_passages")
      .update({
        title: input.title,
        content: input.content,
        difficulty: input.difficulty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
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
