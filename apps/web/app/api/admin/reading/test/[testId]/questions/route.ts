import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const supabase = await getServerSupabase();

    const { data, error } = await supabase
      .from("reading_tests_2026")
      .select("payload")
      .eq("id", testId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "Test not found" },
        { status: 404 }
      );
    }

    const testPayload = data.payload as any;
    const allItems = [
      ...testPayload.modules[0].items,
      ...testPayload.modules[1].items,
    ];

    // 모든 questions 추출
    const questions: Array<{
      id: string;
      stem: string;
      choices: Array<{ id: string; text: string; isCorrect?: boolean }>;
      passage?: string;
      contentHtml?: string;
      contextType?: string;
    }> = [];

    for (const item of allItems) {
      if (item.taskKind === "complete_words") {
        continue;
      } else {
        const qs = item.questions || [];
        for (const q of qs) {
          questions.push({
            id: q.id,
            stem: q.stem,
            choices: q.choices,
            passage: item.passageHtml || item.contentHtml,
            contextType: item.contextType,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      questions,
    });
  } catch (err: any) {
    console.error("[test/questions] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
