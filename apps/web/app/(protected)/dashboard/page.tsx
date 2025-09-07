// apps/web/app/(protected)/dashboard/page.tsx
import Link from 'next/link';

export default async function DashboardPage() {
  // ...여기 세션 가드 코드가 있다면 그대로 두고

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>로그인한 사람만 볼 수 있는 대시보드입니다.</p>

      <Link
        href="/"
        className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50"
      >
        ← Home으로 가기
      </Link>
    </main>
  );
}
