// apps/web/app/(protected)/admin/vocab/sets/actions.ts
"use server";

import { getServerSupabase } from "@/lib/supabase/server";

async function getUserOrThrow(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  return data.user;
}

export async function assignSetsToStudentsAction(params: {
  setIds: string[];
  studentIds: string[];
}): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await getServerSupabase();
    await getUserOrThrow(supabase);

    if (!params.setIds.length || !params.studentIds.length) {
      return { ok: false, message: "setIds와 studentIds가 필요합니다" };
    }

    // 각 학생의 할당 목록에 세트들을 추가
    // 학생이 이미 가진 세트는 유지하고, 새로운 세트만 추가
    const results = [];

    for (const studentId of params.studentIds) {
      for (const setId of params.setIds) {
        console.log(`[assignSets] Creating assignment: student=${studentId}, set=${setId}`);

        // student_vocab_assignments 테이블에 레코드 추가
        const { error } = await supabase
          .from("student_vocab_assignments")
          .insert({
            student_id: studentId,
            vocab_set_id: setId,
          });

        if (error) {
          console.error(`[assignSets] Failed for student ${studentId}, set ${setId}:`, {
            code: error.code,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
          });
          results.push({ studentId, setId, ok: false, error: error.message });
        } else {
          console.log(`[assignSets] Successfully assigned set ${setId} to student ${studentId}`);
          results.push({ studentId, setId, ok: true });
        }
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.filter((r) => !r.ok).length;

    if (failCount > 0) {
      return {
        ok: false,
        message: `일부 학생 배정 실패: ${successCount}명 성공, ${failCount}명 실패`,
      };
    }

    return {
      ok: true,
      message: `✅ ${params.setIds.length}개 세트를 ${params.studentIds.length}명에게 배정했습니다`,
    };
  } catch (e: any) {
    return { ok: false, message: `오류: ${e?.message ?? "Unknown error"}` };
  }
}
