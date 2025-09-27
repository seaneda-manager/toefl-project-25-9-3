/* 풀: apps/web/app/auth/signup/page.tsx */
import { redirect } from 'next/navigation';
import { signUp } from '@/actions/auth';
import type { ActionState } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  async function signupAction(formData: FormData) {
    'use server';
    const r = await signUp(formData);

    // ✅ 항상 ActionState로 매핑 (TS2322 해결 포인트)
    const mapped: ActionState = r.ok
      ? { ok: true, error: null }
      : { ok: false, error: r.error ?? 'Unknown error' };

    if (mapped.ok) {
      redirect('/auth/login?signup=success');
    }
    // 실패 시 쿼리스트링으로 메시지 전달(간단 처리)
    redirect(`/auth/signup?error=${encodeURIComponent(mapped.error ?? 'Unknown error')}`);
  }

  // 간단한 서버 렌더 폼 (클라 상태관리 없이도 동작)
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Sign Up</h1>

      {/* 에러 메시지 쿼리 파싱은 이 파일에서 필요 시 추가 */}
      <form action={signupAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input name="password" type="password" required minLength={6} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <button type="submit" className="rounded px-4 py-2 border">
          Create Account
        </button>
      </form>
    </main>
  );
}
