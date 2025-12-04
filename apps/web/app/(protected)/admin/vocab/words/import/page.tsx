// apps/web/app/(protected)/admin/vocab/words/import/page.tsx
import { redirect } from "next/navigation";
import { importWordsFromJsonForm } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminVocabWordsImportPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">단어 Bulk Import (JSON)</h1>
        <p className="text-sm text-gray-600">
          WordCreatePayload[] 형태의 JSON 배열을 붙여넣고 한 번에 단어를 등록합니다.
        </p>
      </header>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <form
          action={async (formData) => {
            "use server";
            const result = await importWordsFromJsonForm(formData);

            console.log("VOCAB IMPORT RESULT", result);

            // 간단하게는 성공/실패에 따라 콘솔 + alert
            // (나중에 toast / result 페이지로 개선 가능)
            if (!result.ok) {
              // 실패해도 redirect는 시켜주고, 콘솔에서 상세 확인
              throw new Error(
                `Import 실패: total=${result.total}, success=${result.successCount}, failures=${result.failureCount}`,
              );
            }

            // 성공 시 리스트 페이지로 돌려보내기 (경로는 상황에 맞게 수정)
            redirect("/(protected)/admin/vocab/words");
          }}
          className="space-y-4"
        >
          <label className="block text-sm font-medium text-gray-700">
            JSON 배열
          </label>
          <textarea
            name="jsonText"
            rows={16}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
            placeholder={`예시:

[
  {
    "text": "abandon",
    "lemma": "abandon",
    "pos": "v.",
    "is_function_word": false,
    "meanings_ko": ["버리다", "포기하다"],
    "meanings_en_simple": ["to leave completely", "to give up completely"],
    "examples_easy": ["He abandoned the car on the road."],
    "examples_normal": [],
    "derived_terms": ["abandonment"],
    "difficulty": 3,
    "frequency_score": 0.75,
    "notes": "",
    "gradeBands": ["K7_9", "K10_12"],
    "sources": [],
    "semanticTagIds": [],
    "grammarHints": []
  }
]`}
          />

          <p className="text-xs text-gray-500">
            ⚠️ JSON이 유효하지 않으면 import가 실패합니다. 한 번에 수십~수백 개까지 올릴 수
            있습니다.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="reset"
              className="rounded-md border px-4 py-2 text-sm text-gray-700"
            >
              초기화
            </button>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Import 실행
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
