// apps/web/app/(protected)/voca/study/page.tsx

import { getServerSupabase } from "@/lib/supabase/server";
import type { TVocaWord } from "@/models/voca";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ trackId?: string }>;

export default async function VocaStudyPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const { trackId } = await searchParams;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <main className="p-8 text-center text-red-600">로그인이 필요합니다.</main>;
  }

  // trackId가 있으면 할당받은 단어만, 없으면 모든 단어 조회
  let words: TVocaWord[] = [];
  let error: any = null;
  let track: any = null;

  if (trackId) {
    // 트랙 정보 조회
    const { data: trackData } = await supabase
      .from("vocab_tracks")
      .select("id, title")
      .eq("id", trackId)
      .single();
    track = trackData;

    // 할당받은 단어 조회
    const { data: assignments, error: assignError } = await supabase
      .from("student_vocab_assignments")
      .select("set_id")
      .eq("student_id", user.id)
      .eq("track_id", trackId)
      .is("completed_at", null);

    error = assignError;

    if (assignments && assignments.length > 0) {
      const setIds = assignments.map((a: any) => a.set_id);
      const { data: vocaData } = await supabase
        .from("voca_words")
        .select("*")
        .in("id", setIds)
        .order("created_at", { ascending: true });
      words = (vocaData ?? []) as TVocaWord[];
    }
  } else {
    // trackId 없으면 최근 단어 20개
    const { data, error: err } = await supabase
      .from("voca_words")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(20);
    words = (data ?? []) as TVocaWord[];
    error = err;
  }

  const hasError = !!error;
  const isEmpty = !hasError && words.length === 0;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {track ? `${track.title} – Study Mode` : 'VOCA – Study Mode'}
        </h1>
        <p className="text-sm text-gray-600">
          {trackId
            ? `할당받은 단어를 학습하고 있습니다.`
            : '오늘 학습할 단어, 예문, Reinforcing Passage, 그리고 Speaking/Writing 연습을 한 곳에서 진행하는 공간입니다.'}
        </p>
      </header>

      {/* 상태 메시지 (에러 / 비어있음) */}
      {hasError && (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">단어 목록을 불러오는 중 오류가 발생했습니다.</p>
          <p className="mt-1">
            나중에 다시 시도해 보거나, Supabase 콘솔에서 <code>voca_words</code>{" "}
            테이블이 제대로 생성되었는지 확인해 주세요.
          </p>
          <p className="mt-2 text-xs opacity-80">
            (개발용 디버그) {error?.message}
          </p>
        </section>
      )}

      {isEmpty && !hasError && (
        <section className="rounded-2xl border bg-white/80 p-4 text-sm text-gray-700 shadow-sm">
          <p className="font-semibold">아직 등록된 단어가 없습니다.</p>
          <p className="mt-1">
            먼저 <strong>VOCA Admin</strong>에서 단어를 추가한 뒤,
            <br />
            이 페이지에서 학습을 진행할 수 있습니다.
          </p>
        </section>
      )}

      {/* 단어 카드 리스트 */}
      {!hasError && !isEmpty && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">
            오늘의 단어 (최대 20개 샘플)
          </h2>

          <ul className="space-y-2">
            {words.map((w) => {
              const posList = typeof w.pos === 'string'
                ? w.pos.split(',').map(p => p.trim()).filter(Boolean)
                : Array.isArray(w.pos) ? w.pos : [];

              const meaningKrList = Array.isArray(w.meanings_ko) ? w.meanings_ko :
                                    (typeof w.meaning_kr === 'string'
                                      ? w.meaning_kr.split(/[,/]/).map(m => m.trim()).filter(Boolean)
                                      : []);

              const meaningEnList = Array.isArray(w.meanings_en_simple) ? w.meanings_en_simple :
                                    (typeof w.meaning_en === 'string'
                                      ? w.meaning_en.split(/[,/]/).map(m => m.trim()).filter(Boolean)
                                      : []);

              return (
              <li
                key={w.id}
                className="flex items-start justify-between rounded-xl border bg-white/80 px-4 py-3 text-sm shadow-sm"
              >
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">
                      {w.word}
                    </span>
                    <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                      Lv.{w.level}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    {meaningKrList.map((meaning, idx) => (
                      <div key={idx} className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-800">
                          {meaning}
                        </span>
                        {posList[idx] && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            {posList[idx]}
                          </span>
                        )}
                        <span className="mx-0.5 text-gray-400">/</span>
                        <span className="italic text-gray-600">
                          {meaningEnList[idx] || ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {Array.isArray(w.tags) && w.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* TODO: 아래에 Reinforcing Passage / Output Task 연결 예정 */}
    </main>
  );
}
