"use client";
import { useState } from "react";

export default function JsonUploadPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    setBusy(true);
    try {
      const payload = JSON.parse(text); // { passage: { title, content, questions: [...] } }
      const res = await fetch("/api/admin/content/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Import failed");
      alert("Import OK");
    } catch (e: any) {
      alert(e?.message || "Invalid JSON");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Reading JSON Upload</h3>
      <textarea
        className="w-full h-80 border rounded p-2 font-mono text-sm"
        placeholder='{"passage":{...}}'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="px-3 py-1.5 rounded border"
        onClick={onUpload}
        disabled={busy}
      >
        {busy ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
