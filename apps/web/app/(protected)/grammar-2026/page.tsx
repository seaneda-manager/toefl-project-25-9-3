import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { MOCK_GRAMMAR_UNITS_LIST } from "@/models/grammar/mock";

const LEVEL_LABEL: Record<string, string> = {
  all: "전체", ms: "중등", hs: "고등", toefl: "TOEFL",
};

export const dynamic = "force-dynamic";

export default async function Grammar2026Page() {
  let units: { id: string; label_ko: string; label_en: string; level: string; order_index: number; status: string }[] = MOCK_GRAMMAR_UNITS_LIST;

  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("grammar_2026_units")
      .select("id, label_ko, label_en, level, order_index, status")
      .order("order_index");
    if (!error && data && data.length > 0) units = data;
  } catch {}

  const publishedCount = units.filter((u) => u.status === "published").length;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">LEXiOX-Gram</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">문법 챕터</h1>
        <p className="text-sm text-gray-400">순서대로 학습하면 가장 효과적입니다.</p>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-indigo-700">전체 진행률</p>
          <p className="text-xs text-indigo-400">{publishedCount} / {units.length} 챕터</p>
        </div>
        <div className="w-full bg-indigo-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
            style={{ width: units.length > 0 ? `${(publishedCount / units.length) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="space-y-2.5">
        {units.map((unit, i) => {
          const isPublished = unit.status === "published";
          return (
            <Link key={unit.id}
              href={isPublished ? `/grammar-2026/${unit.id}` : "#"}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition group
                ${isPublished
                  ? "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer"
                  : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition
                ${isPublished
                  ? "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-500 group-hover:text-white"
                  : "bg-gray-200 text-gray-400"}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{unit.label_ko}</p>
                <p className="text-xs text-gray-400 mt-0.5">{unit.label_en}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {LEVEL_LABEL[unit.level] ?? unit.level}
                </span>
                {!isPublished && (
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">준비중</span>
                )}
                {isPublished && (
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
