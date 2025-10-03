// apps/web/app/login/page.tsx
import Link from "next/link";
import { Noto_Sans_KR } from "next/font/google";
import LoginForm from "@/components/auth/LoginForm";

const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700", "900"] });

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <div className={`min-h-screen bg-[rgb(15,15,18)] text-white ${noto.className}`}>
      {/* 얇은 상단 바 */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgb(20,20,24)]/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* K-Prime 로고 (이미지 경로 교체) */}
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80">
              <img src="/logos/k-prime.svg" alt="K-Prime" className="h-6 w-auto" />
              <span className="hidden sm:inline text-sm font-semibold">K-Prime</span>
            </Link>
            {/* Pier Academy 로고 버튼 */}
            <Link href="https://pier.academy" className="inline-flex items-center gap-2 hover:opacity-80">
              <img src="/logos/pier-academy.svg" alt="Pier Academy" className="h-6 w-auto" />
              <span className="hidden sm:inline text-sm font-semibold">Pier Academy</span>
            </Link>
          </div>

          <nav className="flex items-center gap-3 text-sm">
            <Link href="/support" className="rounded px-2 py-1 hover:bg-white/10">
              고객센터
            </Link>
            <Link href="/level-test" className="rounded px-2 py-1 hover:bg-white/10">
              레벨테스트
            </Link>
            <Link href="/signup" className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20">
              회원가입
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* 좌측 상단 큰 한글 '로그인' */}
        <h1 className="text-[30px] font-extrabold tracking-tight">로그인</h1>

        {/* 중앙 레이아웃 */}
        <section className="mx-auto mt-10 grid max-w-4xl grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* 중앙 영역: Student / Teacher / Admin 탭 + 폼 */}
          <div className="col-span-1 md:col-span-2">
            <LoginForm />
          </div>
        </section>
      </main>
    </div>
  );
}
