"use client";

import WritingTestRunner from "@/components/writing/WritingTestRunner";
import type { WWritingTest2026 } from "@/models/writing";

export default function WritingTestClient({ test }: { test: WWritingTest2026 }) {
  return (
    <WritingTestRunner
      test={test}
      onFinish={(answers) => {
        console.log("WRITING FINISHED", answers);
      }}
    />
  );
}
