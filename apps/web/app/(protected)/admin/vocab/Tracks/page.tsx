// apps/web/app/(protected)/admin/vocab/tracks/page.tsx
import TracksAssignClient from "./_client/TracksAssignClient";
import { listAcademyStudentsAction, listVocabTracksAction } from "./actions";

export default async function AdminVocabTracksAssignPage() {
  const studentsRes = await listAcademyStudentsAction();
  const tracksRes = await listVocabTracksAction();

  const students = studentsRes.ok ? studentsRes.rows : [];
  const tracks = tracksRes.ok ? tracksRes.rows : [];

  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-xl font-extrabold">Vocab Tracks · Assign</div>
        <div className="mt-1 text-sm text-slate-600">
          학생별 Track Plan 생성/조회/큐 관리 (create plan → auto queue cock → manual assign/cancel)
        </div>

        {(!studentsRes.ok || !tracksRes.ok) ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-bold">⚠️ Load warning</div>
            {!studentsRes.ok ? <div className="mt-1">students: {studentsRes.error}</div> : null}
            {!tracksRes.ok ? <div className="mt-1">tracks: {tracksRes.error}</div> : null}
          </div>
        ) : null}
      </div>

      <TracksAssignClient initialStudents={students} initialTracks={tracks} />
    </div>
  );
}
