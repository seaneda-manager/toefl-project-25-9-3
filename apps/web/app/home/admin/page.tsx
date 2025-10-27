// apps/web/app/home/admin/page.tsx
import { redirect } from 'next/navigation';
import { getSessionAndRole } from '@/lib/authServer';
import AdminUploader from './uploader';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const { session, role } = await getSessionAndRole();
  if (!session) redirect('/auth/login?next=/home/admin');
  if (role !== 'admin') {
    // ??븷蹂??덉쑝濡??뚮젮蹂대궡湲?
    if (role === 'teacher') redirect('/home/teacher');
    redirect('/home/student');
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin Home</h1>
        <p className="opacity-75 text-sm">Manage content and tools below.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <a href="/admin/content/new/json" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">JSON Import (Form)</div>
          <p className="opacity-75 text-sm mt-1">Paste or upload schemas for Reading/Listening.</p>
        </a>

        <a href="/admin/content/new/form" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">Manual Editor</div>
          <p className="opacity-75 text-sm mt-1">Create/edit sets with UI.</p>
        </a>

        <a href="/admin/content/list" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">Content List</div>
          <p className="opacity-75 text-sm mt-1">Browse existing sets.</p>
        </a>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Quick JSON Uploader (to Storage)</h2>
        <p className="opacity-75 text-sm">
          Drops a JSON file into the <code>content</code> bucket under <code>reading/</code>. Use this to attach content quickly,
          then link it to DB later.
        </p>
        <AdminUploader />
      </section>
    </main>
  );
}


