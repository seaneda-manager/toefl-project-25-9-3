// apps/web/app/(protected)/student/page.tsx
import Link from "next/link";

type LastScore = { tpo: number; RC: number; LC: number; SPK: number; WRT: number };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentDashboardPage() {
  // --- mock ?곗씠??異뷀썑 Supabase?먯꽌 媛?몄삱 ?덉젙) ---
  const now = new Date();
  const dateLabel = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const student = {
    name: "?띻만??,
    status: "?ы븰",
    level: "Upper-Intermediate",
    target: 105,
  };

  const last3: LastScore[] = [
    { tpo: 58, RC: 27, LC: 28, SPK: 22, WRT: 25 },
    { tpo: 57, RC: 25, LC: 27, SPK: 21, WRT: 24 },
    { tpo: 56, RC: 26, LC: 26, SPK: 20, WRT: 24 },
  ];

  const teacherMemo =
    "理쒓렐 2二쇨컙 RC ?뺣떟瑜??덉젙?? LC??dictation 怨쇱젣 袁몄???吏꾪뻾 以? Speaking? ?섑뵆 ?듬? 援먯젙 ?꾨즺.";

  const tasksToday = [
    "RC: Passage 1~3 ?ㅻ떟?명듃",
    "LC: Short lecture 2??諛섎났",
    "Vocab: Day 12 ?뚯뒪??,
  ];
  const tasksPrev = ["RC: Insertion ?좏삎 6臾몄젣", "Essay: Integrated ?묒꽦", "Grammar Set #4"];

  return (
    <div className="min-h-screen bg-[rgb(15,15,18)] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-[260px_1fr] gap-6 p-6">
        {/* 醫뚯륫 ?ъ씠?쒕컮 */}
        <aside className="sticky top-6 h-[calc(100vh-3rem)] rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 text-sm font-semibold opacity-60">TOEFL Menu</div>
          <nav className="space-y-1">
            <DashLink href="/student" active>
              Dashboard
            </DashLink>
            <DashLink href="/reading/test">TPO (TEST)</DashLink>
            <DashLink href="/reading/study">TPO (STUDY)</DashLink>
            <DashLink href="/vocab">VOCAB</DashLink>
            <DashLink href="/grammar">GRAMMAR</DashLink>
            <DashLink href="/essay">ESSAY</DashLink>
            <DashLink href="/tasks">DAILY TASKS</DashLink>
          </nav>
        </aside>

        {/* 硫붿씤 */}
        <main className="space-y-6">
          {/* ?곷떒 ?붿빟 */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryItem label="Date (Year)" value={dateLabel} />
              <SummaryItem label="Name (Status)" value={`${student.name} (${student.status})`} />
              <SummaryItem label="Level" value={student.level} />
              <SummaryItem label="Target Score" value={String(student.target)} />
            </div>
          </section>

          {/* 理쒓렐 3???쒗뿕 湲곕줉 */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-lg font-semibold">?쒗뿕 湲곕줉 (理쒓렐 3??</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr>
                    <Th className="w-28"> </Th>
                    {last3.map((s) => (
                      <Th key={s.tpo}>{`TPO #${s.tpo}`}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <ScoreRow label="RC" values={last3.map((s) => s.RC)} />
                  <ScoreRow label="LC" values={last3.map((s) => s.LC)} />
                  <ScoreRow label="SPK" values={last3.map((s) => s.SPK)} />
                  <ScoreRow label="WRT" values={last3.map((s) => s.WRT)} />
                </tbody>
              </table>
            </div>
          </section>

          {/* Teacher Memo */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-lg font-semibold">Teacher Memo</h2>
            <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6">
              {teacherMemo}
            </div>
          </section>

          {/* ?쇱젙/?숈젣 (2x3) */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <Th className="w-56 text-left">Scheduled Tasks &amp; Homework</Th>
                  <Th className="text-left">
                    Today <span className="opacity-60">({dateLabel})</span>
                  </Th>
                  <Th className="text-left">Previous</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td className="align-top">
                    <div className="opacity-70">????紐⑸줉</div>
                  </Td>
                  <Td className="align-top">
                    <ul className="list-disc space-y-1 pl-5">
                      {tasksToday.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </Td>
                  <Td className="align-top">
                    <ul className="list-disc space-y-1 pl-5">
                      {tasksPrev.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </Td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ---------- tiny UI helpers ---------- */
function DashLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2 text-sm hover:bg-white/10 ${
        active ? "bg-white/10 font-semibold" : "opacity-90"
      }`}
    >
      {children}
    </Link>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-white/10 bg-black/30 px-3 py-2 font-semibold ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`border-t border-white/10 px-3 py-3 ${className}`}>{children}</td>;
}

function ScoreRow({ label, values }: { label: string; values: (string | number)[] }) {
  return (
    <tr>
      <Td className="font-semibold">{label}</Td>
      {values.map((v, i) => (
        <Td key={i}>{v}</Td>
      ))}
    </tr>
  );
}


