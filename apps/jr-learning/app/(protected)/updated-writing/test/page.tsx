import { getServerSupabase } from "@/lib/supabase/server";
import type { WWritingTest2026 } from "@/models/writing";
import Link from "next/link";
import WritingTestClient from "./_client/WritingTestClient";

export const dynamic = "force-dynamic";

export default async function UpdatedWritingTestPage() {
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("writing_tests")
    .select("id,label,payload")
    .eq("is_locked", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.payload) {
    return (
      <main className="mx-auto max-w-xl py-16 px-4 text-center space-y-4">
        <div className="text-4xl">✍️</div>
        <h1 className="text-lg font-bold">아직 시험이 없습니다</h1>
        <p className="text-sm text-gray-500">
          Admin에서 Writing 시험을 생성하고 Lock하면 여기에 표시됩니다.
        </p>
        <Link href="/updated-writing" className="inline-block rounded-lg border px-4 py-2 text-xs hover:bg-gray-50">
          돌아가기
        </Link>
      </main>
    );
  }

  return (
    <div className="-m-4 md:-m-6 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)]">
      <WritingTestClient test={data.payload as WWritingTest2026} testId={data.id} />
    </div>
  );
}
