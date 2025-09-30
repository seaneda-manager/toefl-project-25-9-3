/* ?: apps/web/app/auth/update-password/page.tsx */
import { redirect } from 'next/navigation';
import { updatePassword } from '@/actions/auth';
import type { ActionState } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default function UpdatePasswordPage() {
  async function updateAction(formData: FormData) {
    'use server';
    const r = await updatePassword(formData);

    const mapped: ActionState = r.ok
      ? { ok: true, error: null }
      : { ok: false, error: r.error ?? 'Unknown error' };

    if (mapped.ok) {
      redirect('/?password=updated');
    }
    redirect(`/auth/update-password?error=${encodeURIComponent(mapped.error ?? 'Unknown error')}`);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Update Password</h1>
      <form action={updateAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">New Password</label>
          <input name="password" type="password" required minLength={6} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <button type="submit" className="rounded px-4 py-2 border">
          Update
        </button>
      </form>
    </main>
  );
}

