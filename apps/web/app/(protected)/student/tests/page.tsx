// apps/web/app/(protected)/student/tests/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

type AssignmentRow = {
  id: string;
  template_id: string;
  student_id: string;
  teacher_id: string | null;
  kind: "full" | "half" | "section";
  due_at: string | null;
  expires_at: string | null;
  status: "assigned" | "in_progress" | "completed" | "expired" | "cancelled";
  created_at: string;
  template?: {
    id: string;
    label: string;
    kind: "full" | "half" | "section";
  } | null;
  sessions?: {
    id: string;
    total_score: number | null;
    section_scores: any | null;
    created_at: string;
  }[] | null;
};

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  return exp < now;
}

function daysUntil(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDue(expiresAt: string | null): string {
  if (!expiresAt) return "ê¸°í•œ ?œí•œ ?†ìŒ";
  const d = new Date(expiresAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatKind(kind: "full" | "half" | "section"): string {
  if (kind === "full") return "Full Test";
  if (kind === "half") return "Half Test";
  return "Individual";
}

function formatStatus(status: AssignmentRow["status"]): string {
  switch (status) {
    case "assigned":
      return "ë°°ì •??;
    case "in_progress":
      return "ì§„í–‰ ì¤?;
    case "completed":
      return "?„ë£Œ";
    case "expired":
      return "ë§Œë£Œ??;
    case "cancelled":
      return "ì·¨ì†Œ??;
    default:
      return status;
  }
}

export default async function StudentTestsPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // (protected ?ˆì´?„ì›ƒ?´ë¼ ?¤ì œë¡œëŠ” ?????¤ê² ì§€ë§?ë°©ì–´??
    return null;
  }

  const { data: rows, error } = await supabase
    .from("test_assignments")
    .select(
      `
      id, template_id, student_id, teacher_id, kind, due_at, expires_at, status, created_at,
      template:test_templates (
        id, label, kind
      ),
      sessions:test_sessions (
        id, total_score, section_scores, created_at
      )
    `,
    )
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load assignments", error);
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-bold">My Tests</h1>
        <p className="mt-4 text-sm text-red-600">
          ?œí—˜ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.
        </p>
      </main>
    );
  }

  // ?”§ ?¬ê¸°??Supabase ê²°ê³¼ ??AssignmentRow[]ë¡??ˆì „?˜ê²Œ ë³€??  const assignments: AssignmentRow[] = (rows ?? []).map((row: any) => {
    const tpl = Array.isArray(row.template) ? row.template[0] : row.template;

    return {
      id: String(row.id),
      template_id: String(row.template_id),
      student_id: String(row.student_id),
      teacher_id: row.teacher_id ? String(row.teacher_id) : null,
      kind: row.kind as AssignmentRow["kind"],
      due_at: row.due_at,
      expires_at: row.expires_at,
      status: row.status as AssignmentRow["status"],
      created_at: row.created_at,
      template: tpl
        ? {
            id: String(tpl.id),
            label: String(tpl.label),
            kind: tpl.kind as AssignmentRow["kind"],
          }
        : null,
      sessions: row.sessions
        ? row.sessions.map((s: any) => ({
            id: String(s.id),
            total_score: s.total_score,
            section_scores: s.section_scores,
            created_at: s.created_at,
          }))
        : null,
    };
  });

  const nowAssigned = assignments.filter(
    (a) =>
      (a.status === "assigned" || a.status === "in_progress") &&
      !isExpired(a.expires_at),
  );
  const completed = assignments.filter((a) => a.status === "completed");

  const expiringSoon = nowAssigned.filter((a) => {
    const d = daysUntil(a.expires_at);
    return d !== null && d >= 0 && d <= 3;
  });

  return (
    <main className="mx-auto space-y-6 pb-8 max-w-4xl">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">My Tests</h1>
        <p className="text-sm text-gray-600">
          ?¬ê¸°?ì„œ ? ìƒ???ëŠ” ê´€ë¦¬ì?ê²Œ ë°°ì •???œí—˜???•ì¸?˜ê³  ?‘ì‹œ????          ?ˆìŠµ?ˆë‹¤.
        </p>
      </header>

      {/* ê³?ë§Œë£Œ?˜ëŠ” ?œí—˜ ?Œë¦¼ */}
      {expiringSoon.length > 0 && (
        <section className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <div className="font-semibold text-amber-800">
            ??ê³?ë§Œë£Œ?˜ëŠ” ?œí—˜??{expiringSoon.length}ê°??ˆìŠµ?ˆë‹¤.
          </div>
          <ul className="mt-2 space-y-1 text-amber-900">
            {expiringSoon.map((a) => {
              const d = daysUntil(a.expires_at);
              return (
                <li key={a.id}>
                  ??{a.template?.label ?? "?´ë¦„ ?†ëŠ” ?œí—˜"} ??" "}
                  {d === 0
                    ? "?¤ëŠ˜ê¹Œì? ?‘ì‹œ ê°€??
                    : d !== null
                      ? `D-${d} (${formatDue(a.expires_at)}ê¹Œì?)`
                      : "ê¸°í•œ ?•ë³´ ?†ìŒ"}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Assigned ?¹ì…˜ */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Assigned</h2>
          <span className="text-xs text-gray-500">
            ?„ì§ ?‘ì‹œ?˜ì? ?Šì•˜ê±°ë‚˜ ì§„í–‰ ì¤‘ì¸ ?œí—˜
          </span>
        </div>

        {nowAssigned.length === 0 ? (
          <p className="text-sm text-gray-500">
            ?„ì¬ ë°°ì •???œí—˜???†ìŠµ?ˆë‹¤. ? ìƒ?˜ì´ ?ˆë¡œ???œí—˜??ë°°ì •?˜ë©´ ?¬ê¸°??            ?œì‹œ?©ë‹ˆ??
          </p>
        ) : (
          <div className="space-y-3">
            {nowAssigned.map((a) => {
              const d = daysUntil(a.expires_at);
              const attemptsCount = a.sessions?.length ?? 0;
              const isInProgress = a.status === "in_progress";

              const expText =
                d === null
                  ? "ê¸°í•œ ?œí•œ ?†ìŒ"
                  : d < 0
                    ? "ë§Œë£Œ??
                    : d === 0
                      ? `?¤ëŠ˜ê¹Œì? (${formatDue(a.expires_at)})`
                      : `D-${d} (${formatDue(a.expires_at)}ê¹Œì?)`;

              const expClass =
                d === null
                  ? "text-gray-500"
                  : d < 0
                    ? "text-red-600"
                    : d <= 3
                      ? "text-amber-600"
                      : "text-gray-600";

              return (
                <article
                  key={a.id}
                  className="space-y-2 rounded-md border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {a.template?.label ?? "?´ë¦„ ?†ëŠ” ?œí—˜"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatKind(a.kind)}
                        {attemptsCount > 0
                          ? ` Â· ?´ì „ ?‘ì‹œ ${attemptsCount}??
                          : ""}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {formatStatus(a.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className={expClass}>ë§Œë£Œ: {expText}</span>
                    {a.due_at && (
                      <span className="text-gray-500">
                        ê¶Œì¥ ë§ˆê°?? {formatDue(a.due_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    {/* TODO: assignment ê¸°ë°˜ ?¤ì œ ?¬ë„ˆ ?˜ì´ì§€ë¡??°ê²° */}
                    <Link
                      href={`/toefl-2026/test/full?assignmentId=${a.id}`}
                      className="inline-flex items-center rounded bg-gray-900 px-3 py-1.5 font-medium text-white hover:bg-gray-800"
                    >
                      {isInProgress ? "Continue" : "Start Test"}
                    </Link>

                    {/* ?˜ì¤‘?? ? ìƒ?˜ì—ê²??¬ë°°???”ì²­ / ì·¨ì†Œ ?”ì²­ ê°™ì? ?¡ì…˜ */}
                    {/* <button
                      type="button"
                      className="inline-flex items-center rounded border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                    >
                      ?œí—˜ ì·¨ì†Œ ?”ì²­
                    </button> */}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed ?¹ì…˜ */}
      <section className="space-y-3 border-t pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Completed</h2>
          <span className="text-xs text-gray-500">
            ?´ë? ?‘ì‹œ???œí—˜ê³??”ì•½ ?•ë³´
          </span>
        </div>

        {completed.length === 0 ? (
          <p className="text-sm text-gray-500">
            ?„ì§ ?„ë£Œ???œí—˜???†ìŠµ?ˆë‹¤.
          </p>
        ) : (
          <div className="space-y-3">
            {completed.map((a) => {
              const sessions = a.sessions ?? [];
              const latest = sessions[0]; // created_at descë¡?ê°€?¸ì™”?¤ê³  ê°€??
              const totalScore = latest?.total_score ?? null;

              return (
                <article
                  key={a.id}
                  className="space-y-2 rounded-md border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {a.template?.label ?? "?´ë¦„ ?†ëŠ” ?œí—˜"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatKind(a.kind)} Â· ?‘ì‹œ {sessions.length}??                      </p>
                    </div>
                    <span className="text-xs font-medium text-emerald-700">
                      ?„ë£Œ
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {latest ? (
                      <>
                        <span className="text-gray-600">
                          ë§ˆì?ë§??‘ì‹œ:{" "}
                          {formatDue(latest.created_at.split("T")[0])}
                        </span>
                        {totalScore !== null && (
                          <span className="font-semibold text-gray-800">
                            Score: {totalScore}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">
                        ?¸ì…˜ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    <Link
                      href={`/student/tests/${a.id}/report`}
                      className="inline-flex items-center rounded border px-3 py-1.5 text-gray-800 hover:bg-gray-50"
                    >
                      View Report
                    </Link>

                    {/* ?˜ì¤‘?? ?¬ì‘???”ì²­ */}
                    <button
                      type="button"
                      className="inline-flex items-center rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                      disabled
                    >
                      Retake Request (TODO)
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
