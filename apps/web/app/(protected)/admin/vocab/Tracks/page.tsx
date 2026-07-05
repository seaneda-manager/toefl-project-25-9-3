// apps/web/app/(protected)/admin/vocab/Tracks/page.tsx
import TrackAssignClient from "./_client/TrackAssignClient";
import GroupAssignClient from "./_client/GroupAssignClient";
import { listAcademyStudentsAction, listVocabTracksAction } from "./actions";

export default async function AdminVocabTracksAssignPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tab = searchParams?.tab === "group" ? "group" : "single";

  let studentsRes: any = { ok: false, error: "Loading..." };
  let tracksRes: any = { ok: false, error: "Loading..." };

  try {
    [studentsRes, tracksRes] = await Promise.all([
      listAcademyStudentsAction(),
      listVocabTracksAction(),
    ]);
  } catch (e: any) {
    console.error("[AdminVocabTracksAssignPage] Load error:", e);
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <h2 className="text-lg font-bold text-red-900 mb-2">❌ 데이터 로드 실패</h2>
          <p className="text-sm text-red-800 mb-2">{e?.message ?? "Unknown error"}</p>
          <p className="text-xs text-red-700">페이지를 새로고침하거나 나중에 다시 시도하세요.</p>
        </div>
      </div>
    );
  }

  const students = studentsRes.ok ? studentsRes.rows : [];
  const tracks = tracksRes.ok ? tracksRes.rows : [];
  const studentsError = "error" in studentsRes ? studentsRes.error : null;
  const tracksError = "error" in tracksRes ? tracksRes.error : null;

  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-xl font-extrabold">Vocab Tracks · 배포</div>
        <div className="mt-1 text-sm text-slate-600">
          학생별 Track 플랜 생성 · 큐 관리 · 그룹 배포
        </div>

        {studentsError || tracksError ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {studentsError && <div>students: {studentsError}</div>}
            {tracksError && <div>tracks: {tracksError}</div>}
          </div>
        ) : null}

        {/* 탭 */}
        <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          <a
            href="?tab=single"
            className={[
              "rounded-lg px-5 py-2 text-sm font-extrabold transition-colors",
              tab === "single" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            개인 배포
          </a>
          <a
            href="?tab=group"
            className={[
              "rounded-lg px-5 py-2 text-sm font-extrabold transition-colors",
              tab === "group" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            그룹 배포
          </a>
        </div>
      </div>

      {tab === "single" ? (
        <TrackAssignClient initialStudents={students} initialTracks={tracks} />
      ) : (
        <GroupAssignClient initialStudents={students} initialTracks={tracks} />
      )}
    </div>
  );
}
