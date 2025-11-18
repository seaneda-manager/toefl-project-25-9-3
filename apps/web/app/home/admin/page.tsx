// apps/web/app/home/admin/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionAndRole } from '@/lib/authServer';
import AdminUploader from './uploader';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const { session, role } = await getSessionAndRole();

  if (!session) redirect('/auth/login?next=/home/admin');

  if (role !== 'admin') {
    // 권한 분기: 교사는 /home/teacher, 그 외는 /home/student로 안내
    if (role === 'teacher') redirect('/home/teacher');
    redirect('/home/student');
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin Home</h1>
        <p className="opacity-75 text-sm">콘텐츠와 도구를 관리하세요.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/content/new/json"
          prefetch={false}
          className="block rounded-2xl border p-5 hover:bg-white/5"
        >
          <div className="text-lg font-medium">JSON Import (Form)</div>
          <p className="opacity-75 text-sm mt-1">
            Reading/Listening 스키마를 붙여넣거나 업로드합니다.
          </p>
        </Link>

        <Link
          href="/admin/content/new/form"
          prefetch={false}
          className="block rounded-2xl border p-5 hover:bg-white/5"
        >
          <div className="text-lg font-medium">Manual Editor</div>
          <p className="opacity-75 text-sm mt-1">UI로 세트를 생성/편집합니다.</p>
        </Link>

        <Link
          href="/admin/content/list"
          prefetch={false}
          className="block rounded-2xl border p-5 hover:bg-white/5"
        >
          <div className="text-lg font-medium">Content List</div>
          <p className="opacity-75 text-sm mt-1">기존 세트를 살펴봅니다.</p>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Quick JSON Uploader (to Storage)</h2>
        <p className="opacity-75 text-sm">
          <code>content</code> 버킷의 <code>reading/</code> 경로에 JSON 파일을 업로드합니다.
          빠르게 자료를 붙여넣고 이후 DB에 연결할 수 있습니다.
        </p>
        <AdminUploader />
      </section>
    </main>
  );
}
