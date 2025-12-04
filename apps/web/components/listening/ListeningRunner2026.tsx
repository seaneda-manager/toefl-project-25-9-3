// apps/web/components/listening/ListeningRunner2026.tsx
"use client";

type Props = {
  test: any;
  onFinish?: (result: any) => { ok: true } | Promise<{ ok: true }>;
};

export default function ListeningRunner2026({ test, onFinish }: Props) {
  return (
    <div className="rounded border border-dashed p-4 text-sm text-gray-500">
      ListeningRunner2026 placeholder – 나중에 진짜 리스닝 러너로 교체 예정
    </div>
  );
}
