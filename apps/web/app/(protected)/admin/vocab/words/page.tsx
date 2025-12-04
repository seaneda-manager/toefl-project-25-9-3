// apps/web/app/(protected)/admin/vocab/words/new/page.tsx

import WordForm from "@/components/vocab/WordForm";

export default function AdminVocabWordNewPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          LingoX – 새 단어 추가
        </h1>
        <p className="text-sm text-gray-600">
          초등~고등, 수능/모고/토플 단어들을 SSOT에 하나씩 쌓는 Admin 화면입니다.
          (영영/국어/예문/학년대/출처/문법힌트까지 한 번에 입력)
        </p>
      </header>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <WordForm />
      </section>
    </main>
  );
}
