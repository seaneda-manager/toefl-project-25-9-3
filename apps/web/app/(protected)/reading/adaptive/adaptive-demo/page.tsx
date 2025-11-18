"use client";

import ReadingAdaptiveRunner from "@/components/reading/ReadingAdaptiveRunner2026";
import { adaptiveReadingTest2026 } from "./demo-data";

export default function AdaptiveDemoPage() {
  return (
    <main className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-xl font-bold">Adaptive Reading Demo Page</h1>

      <ReadingAdaptiveRunner
        test={adaptiveReadingTest2026}
        onFinish={(r) => {
          console.log("FINISHED", r);
        }}
      />
    </main>
  );
}
