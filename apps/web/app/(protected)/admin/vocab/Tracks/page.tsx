// apps/web/app/(protected)/admin/vocab/Tracks/page.tsx
import TrackAssignClient from "./_client/TrackAssignClient";
import { listAcademyStudentsAction, listVocabTracksAction } from "./actions";

export default async function AdminVocabTracksAssignPage() {
  const [studentsRes, tracksRes] = await Promise.all([
    listAcademyStudentsAction(),
    listVocabTracksAction(),
  ]);

  const students = studentsRes.ok ? studentsRes.rows : [];
  const tracks = tracksRes.ok ? tracksRes.rows : [];

  // ✅ robust narrowing (works even if ok is boolean-widened)
  const studentsError = "error" in studentsRes ? studentsRes.error : null;
  const tracksError = "error" in tracksRes ? tracksRes.error : null;

  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-xl font-extrabold">Vocab Tracks · Assign</div>
        <div className="mt-1 text-sm text-slate-600">
          학생별 Track Plan 생성/조회/큐 관리 (create plan → auto queue cock → manual
          assign/cancel)
        </div>

        {studentsError || tracksError ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-bold">⚠️ Load warning</div>
            {studentsError ? <div className="mt-1">students: {studentsError}</div> : null}
            {tracksError ? <div className="mt-1">tracks: {tracksError}</div> : null}
          </div>
        ) : null}
      </div>

      <TrackAssignClient initialStudents={students} initialTracks={tracks} />
    </div>
  );
}
