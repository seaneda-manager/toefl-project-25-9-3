// apps/web/app/(protected)/admin/content/new/[tab]/_client/ReadingEditorClient.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReadingEditorClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reading/admin");
  }, [router]);

  return (
    <div className="rounded border p-4 text-sm text-gray-500">
      Opening Reading Admin...
    </div>
  );
}