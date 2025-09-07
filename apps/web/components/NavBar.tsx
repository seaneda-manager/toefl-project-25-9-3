// apps/web/components/NavBar.tsx
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { signOut } from '../app/actions/auth'; // ← ../app/actions/auth 로 변경

export default async function NavBar() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata as any)?.role as 'teacher' | 'student' | undefined;

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur sticky top-0 z-50">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-lg">TOEFL MVP</Link>
          <Link href="/reading" className="text-sm opacity-80 hover:opacity-100">Reading</Link>
          <Link href="/listening" className="text-sm opacity-80 hover:opacity-100">Listening</Link>
          <Link href="/speaking" className="text-sm opacity-80 hover:opacity-100">Speaking</Link>
          <Link href="/writing" className="text-sm opacity-80 hover:opacity-100">Writing</Link>
        </div>

        {!user ? (
          <div className="flex items-center gap-3">
            <StatusPill status="logged-out" />
            <Link href="/auth/login" className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">
              로그인
            </Link>
            <Link href="/auth/signup" className="px-3 py-1.5 rounded-lg bg-black text-white hover:opacity-90">
              학생 가입
            </Link>
            <Link href="/auth/signup-teacher" className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:opacity-90">
              교사 가입
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <StatusPill status="logged-in" />
            <div className="text-sm">
              <div className="font-medium">{user.email}</div>
              <div className="opacity-70">{role ? `Role: ${role}` : 'Role: -'}</div>
            </div>
            <form action={signOut}>
              <button type="submit" className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" aria-label="로그아웃">
                로그아웃
              </button>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
}

function StatusPill({ status }: { status: 'logged-in' | 'logged-out' }) {
  const isIn = status === 'logged-in';
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${
        isIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
      }`}
      title={isIn ? '로그인됨' : '로그인 안 됨'}
    >
      <span className={`h-2 w-2 rounded-full ${isIn ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden />
      {isIn ? '로그인됨' : '로그인 안 됨'}
    </span>
  );
}
