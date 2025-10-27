// apps/web/app/login/page.tsx
import TopBar from "@/components/layout/TopBar";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* ??TopBar ?꾩닔 props ?꾨떖 */}
      <TopBar mode="test" section="reading" qIndex={0} total={0} />

      <main className="container mx-auto px-4">
        {/* ?곷떒 醫뚯륫 ?곸뿭 */}
        <div className="pt-8 pb-2">
          <h1 className="text-[30px] font-bold leading-tight">濡쒓렇??/h1>
        </div>

        {/* ?쇱쓣 ?섑룊/?섏쭅 以묒븰??媛源앷쾶 諛곗튂 */}
        <section className="py-10 md:py-12 grid place-items-center">
          <div className="w-full max-w-[720px]">
            <h2 className="text-2xl font-semibold text-center mb-5">Student Login</h2>
            <div className="flex justify-center">
              <LoginForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


