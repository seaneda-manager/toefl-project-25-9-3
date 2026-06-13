"use client";

import ListeningTrackRunner from "@/components/listening/ListeningTrackRunner";
import type { LListeningTest2026 } from "@/models/listening";

export default function Listening2026TestClient({ test }: { test: LListeningTest2026 }) {
  return (
    <ListeningTrackRunner
      test={test}
      onFinish={(result) => {
        console.log("LISTENING FINISHED", result);
      }}
    />
  );
}
