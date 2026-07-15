import { getUser } from "@/lib/getUserAndProfile";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JrHubPage() {
  const { user } = await getUserAndProfile();
  if (!user) redirect("/login");

  const supabase = await getSupabaseServer();

  // ?™ìƒ??? ë‹¹??ê³¼ì œ??ì¡°íšŒ
  const { data: readingSessions } = await supabase
    .from("jr_reading_sessions")
    .select("id, passage_id, stage, completed_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: grammarSessions } = await supabase
    .from("jr_grammar_sessions")
    .select("id, chapter_id, stage, completed_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: listeningSessions } = await supabase
    .from("jr_listening_sessions")
    .select("id, stage, completed_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: speakingWritingTasks } = await supabase
    .from("jr_speaking_writing_tasks")
    .select("id, task_type, prompt, due_date")
    .eq("assigned_to_student_id", user.id)
    .order("due_date", { ascending: true })
    .limit(5);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white p-4">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-bold text-slate-900">Jr. Learning</h1>
          <p className="text-slate-600 mt-1">
            ?´ì‹  ?€ë¹?4?€ ëª¨ë“ˆ: Reading Â· Grammar Â· Listening Â· Speaking & Writing
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Reading */}
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-900">?“– Reading</h2>
              <div className="text-3xl">??/div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              ?¨ì–´ ì±…ì—… Â· ë¬¸ë²• Â· ?´ì„ Â· ?´í•´ Â· ? ë¡  (5?¨ê³„)
            </p>
            {readingSessions && readingSessions.length > 0 ? (
              <div className="space-y-2">
                {readingSessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    href={`/jr/reading/${session.id}`}
                    className="block text-sm px-3 py-2 bg-emerald-50 rounded hover:bg-emerald-100 transition"
                  >
                    {session.completed_at ? "?? : "??} Session{" "}
                    {readingSessions.indexOf(session) + 1}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">? ë‹¹???¸ì…˜???†ìŠµ?ˆë‹¤</p>
            )}
          </div>

          {/* Grammar */}
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-900">?“š Grammar</h2>
              <div className="text-3xl">??/div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              ë¬¸ë²• ê°œë… ?™ìŠµ Â· ?°ìŠµ ë¬¸ì œ (2?¨ê³„)
            </p>
            {grammarSessions && grammarSessions.length > 0 ? (
              <div className="space-y-2">
                {grammarSessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    href={`/jr/grammar/${session.id}`}
                    className="block text-sm px-3 py-2 bg-blue-50 rounded hover:bg-blue-100 transition"
                  >
                    {session.completed_at ? "?? : "??} Chapter{" "}
                    {grammarSessions.indexOf(session) + 1}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">? ë‹¹???¨ì›???†ìŠµ?ˆë‹¤</p>
            )}
          </div>

          {/* Listening */}
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-900">?§ Listening</h2>
              <div className="text-3xl">??/div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              ?¸íŠ¸ Â· ë¬¸ì œ ?€??Â· ?¤í¬ë¦½íŠ¸ Â· Shadowing Â· ê³¼ì œ (5?¨ê³„)
            </p>
            {listeningSessions && listeningSessions.length > 0 ? (
              <div className="space-y-2">
                {listeningSessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    href={`/jr/listening/${session.id}`}
                    className="block text-sm px-3 py-2 bg-amber-50 rounded hover:bg-amber-100 transition"
                  >
                    {session.completed_at ? "?? : "??} Session{" "}
                    {listeningSessions.indexOf(session) + 1}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">? ë‹¹???¸ì…˜???†ìŠµ?ˆë‹¤</p>
            )}
          </div>

          {/* Speaking & Writing */}
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-900">
                ?¤ Speaking & Writing
              </h2>
              <div className="text-3xl">??/div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              ?Œì„± ?¹ìŒ ?ëŠ” ê¸€?°ê¸° ?œì¶œ
            </p>
            {speakingWritingTasks && speakingWritingTasks.length > 0 ? (
              <div className="space-y-2">
                {speakingWritingTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/jr/speaking-writing/${task.id}`}
                    className="block text-sm px-3 py-2 bg-purple-50 rounded hover:bg-purple-100 transition"
                  >
                    ??{task.task_type === "speaking" ? "?¤" : "?ï¸"} ê³¼ì œ
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">? ë‹¹??ê³¼ì œê°€ ?†ìŠµ?ˆë‹¤</p>
            )}
          </div>
        </div>

        {/* Learning Stats */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-bold text-slate-900 mb-4">?™ìŠµ ì§„ë„</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {readingSessions?.filter((s) => s.completed_at).length || 0}
              </div>
              <div className="text-xs text-slate-600">Reading ?„ë£Œ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {grammarSessions?.filter((s) => s.completed_at).length || 0}
              </div>
              <div className="text-xs text-slate-600">Grammar ?„ë£Œ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {listeningSessions?.filter((s) => s.completed_at).length || 0}
              </div>
              <div className="text-xs text-slate-600">Listening ?„ë£Œ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {speakingWritingTasks?.length || 0}
              </div>
              <div className="text-xs text-slate-600">? ë‹¹??ê³¼ì œ</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
