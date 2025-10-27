// apps/web/app/home/student/page.tsx
import { redirect } from 'next/navigation';
import { getSessionAndRole } from '@/lib/authServer';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage() {
  const { session, role } = await getSessionAndRole();
  if (!session) redirect('/auth/login?next=/home/student');

  // ?숈깮???꾨땶 寃쎌슦 媛곸옄???덉쑝濡?由щ떎?대젆??
  if (role === 'teacher') redirect('/home/teacher');
  if (role === 'admin') redirect('/home/admin');

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Student Home</h1>
        <p className="opacity-75 text-sm">Welcome! Choose what to practice today.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <a href="/reading/test" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">Reading ??Test Mode</div>
          <p className="opacity-75 text-sm mt-1">
            Full/section test with official-style UI. Your answers are saved to your session.
          </p>
        </a>

        <a href="/reading/study" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">Reading ??Study Mode</div>
          <p className="opacity-75 text-sm mt-1">
            Detailed explanations, clue sentences, and step-by-step review.
          </p>
        </a>

        <a href="/listening/test" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">Listening ??Test Mode</div>
          <p className="opacity-75 text-sm mt-1">
            Conversation & lecture sets with snippet/choice ordering meta.
          </p>
        </a>

        <a href="/vocab" className="block rounded-2xl border p-5 hover:bg-white/5">
          <div className="text-lg font-medium">Vocabulary</div>
          <p className="opacity-75 text-sm mt-1">
            Frequency lists, spaced repetition, and unit-based practice.
          </p>
        </a>
      </section>
    </main>
  );
}




