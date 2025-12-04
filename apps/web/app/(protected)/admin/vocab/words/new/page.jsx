// apps/web/app/(protected)/admin/vocab/words/new/page.tsx
import WordForm from "@/components/vocab/WordForm";
import { createWordAction } from "./actions";

export const dynamic = "force-dynamic"; // 선택사항: 캐시 걱정되면 넣기

export default function AdminVocabWordNewPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">단어 등록 (New Word)</h1>
        <p className="text-sm text-gray-600">
          LingoX / 학원 프로그램에서 사용할 단어를 새로 등록합니다.
        </p>
      </header>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        {/* ✅ 여기서 server action을 WordForm에 주입 */}
        <WordForm onSubmit={createWordAction} />
      </section>
    </main>
  );
}
