// apps/web/app/(protected)/admin/demo/page.tsx
import HomeSelector from "@/components/HomeSelector";

export default function AdminDemoPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">TOEFL iBT 2026 – Admin Demo Launcher</h1>
      <p className="mb-4 text-sm text-neutral-600">
        TPO 세트, 섹션, 모드를 선택해서 데모 러너를 테스트할 수 있는 관리자 전용 페이지입니다.
      </p>
      <HomeSelector />
    </main>
  );
}
