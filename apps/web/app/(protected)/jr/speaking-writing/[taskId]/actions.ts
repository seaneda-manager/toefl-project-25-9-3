"use server";

import { getServiceSupabase } from "@/lib/supabase/service";
import { getUser } from "@/lib/supabase/auth";

export async function submitSpeakingWritingAction(input: {
  taskId: string;
  writingText?: string;
  audioUrl?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { ok: false, error: "Unauthorized" };
    }

    const supabase = getServiceSupabase();
    const result = await supabase
      .from("jr_speaking_writing_submissions")
      .insert([
        {
          task_id: input.taskId,
          student_id: user.id,
          writing_text: input.writingText,
          audio_url: input.audioUrl,
          submitted_at: new Date().toISOString(),
        },
      ]);

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (e: any) {
    console.error("Failed to submit speaking/writing:", e);
    return { ok: false, error: e?.message };
  }
}
