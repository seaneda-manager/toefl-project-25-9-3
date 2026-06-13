"use client";

import { useRouter } from "next/navigation";
import WritingTestRunner from "@/components/writing/WritingTestRunner";
import type { WWritingTest2026 } from "@/models/writing";

export default function WritingTestClient({ test, testId }: { test: WWritingTest2026; testId: string }) {
  const router = useRouter();

  async function handleFinish(answers: Record<string, string>) {
    try {
      const res = await fetch("/api/writing/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, answers }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/student/review/writing/${data.sessionId}`);
      }
    } catch {
      // 저장 실패해도 테스트 완료 화면은 그대로 둠
    }
  }

  return (
    <WritingTestRunner
      test={test}
      onFinish={handleFinish}
    />
  );
}
