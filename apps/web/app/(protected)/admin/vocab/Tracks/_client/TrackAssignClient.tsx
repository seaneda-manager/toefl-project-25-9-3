// apps/web/app/(protected)/admin/vocab/tracks/_client/TracksAssignClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import type {
  StudentLite,
  TrackLite,
  AssignmentLite,
  StudentPlanLite,
  StudentBreakLite,
} from "../actions";

import {
  createStudentVocabPlanAction,
  getStudentPlanAndQueueAction,
  ensureCockedQueueAdminAction,
  assignNextSetNowAction,
  cancelStudentVocabAssignmentAction,
} from "../actions";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function WeekBtn({
  n,
  active,
  onClick,
}: {
  n: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-9 px-3 rounded-full border text-sm font-extrabold",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white",
      ].join(" ")}
      title="1=Mon ... 7=Sun"
    >
      {n}
    </button>
  );
}

export default function TracksAssignClient({
  initialStudents,
  initialTracks,
}: {
  initialStudents: StudentLite[];
  initialTracks: TrackLite[];
}) {
  const [q, setQ] = useState("");
  const students = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return initialStudents;
    return initialStudents.filter((s) => {
      const a = String(s.full_name ?? "").toLowerCase();
      const b = String(s.login_id ?? "").toLowerCase();
      const c = String(s.id ?? "").toLowerCase();
      return a.includes(k) || b.includes(k) || c.includes(k);
    });
  }, [q, initialStudents]);

  const [studentId, setStudentId] = useState<string>(students?.[0]?.id ?? "");
  const [trackId, setTrackId] = useState<string>(initialTracks?.[0]?.id ?? "");

  const [startDateISO, setStartDateISO] = useState<string>(todayISO());
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxActiveSets, setMaxActiveSets] = useState<number>(1);
  const [startDayIndex, setStartDayIndex] = useState<number>(1);
  const [cursorDayIndex, setCursorDayIndex] = useState<number | "">( "");
  const [queueSize, setQueueSize] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedReason, setPausedReason] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [plan, setPlan] = useState<StudentPlanLite | null>(null);
  const [breaks, setBreaks] = useState<StudentBreakLite[]>([]);
  const [queue, setQueue] = useState<AssignmentLite[]>([]);
  const [stats, setStats] = useState<{ todayISO?: string; unlocked?: number; total?: number; maxActive?: number }>(
    {}
  );

  function toggleWeekday(n: number) {
    setWeekdays((prev) => {
      const next = prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n];
      return next.sort((a, b) => a - b);
    });
  }

  async function loadPlan() {
    setMsg("");
    if (!studentId || !trackId) return;

    setBusy(true);
    try {
      const res = await getStudentPlanAndQueueAction({ studentId, trackId });
      if (!res.ok) {
        setMsg(`❌ ${res.error}`);
        return;
      }
      setPlan(res.plan);
      setBreaks(res.breaks ?? []);
      setQueue(res.queue ?? []);
      setStats({
        todayISO: res.todayISO,
        unlocked: res.unlockedCount,
        total: res.queueCount,
        maxActive: res.maxActive,
      });
      setMsg("✅ Loaded");
    } finally {
      setBusy(false);
    }
  }

  async function savePlan() {
    setMsg("");
    if (!studentId || !trackId) return;

    if (weekdays.length === 0) {
      setMsg("❌ weekdays must have at least 1 day");
      return;
    }

    setBusy(true);
    try {
      const res = await createStudentVocabPlanAction({
        studentId,
        trackId,
        startDateISO,
        weekdays,
        maxActiveSets,
        startDayIndex,
        cursorDayIndex: cursorDayIndex === "" ? undefined : Number(cursorDayIndex),
        isPaused,
        pausedReason: pausedReason || null,
        queueSize,
      } as any);

      setMsg("✅ Plan saved (and queue ensured)");
      await loadPlan();
      return res;
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "failed"}`);
    } finally {
      setBusy(false);
    }
  }

  async function recockQueue() {
    setMsg("");
    if (!studentId || !trackId) return;

    setBusy(true);
    try {
      const res = await ensureCockedQueueAdminAction({ studentId, trackId, queueSize });
      setMsg("✅ Queue ensured");
      await loadPlan();
      return res;
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "failed"}`);
    } finally {
      setBusy(false);
    }
  }

  async function assignNow() {
    setMsg("");
    if (!studentId || !trackId) return;

    setBusy(true);
    try {
      const res = await assignNextSetNowAction({ studentId, trackId });
      setMsg("✅ Assigned 1 set for today");
      await loadPlan();
      return res;
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "failed"}`);
    } finally {
      setBusy(false);
    }
  }

  async function cancelAssignment(assignmentId: string) {
    setMsg("");
    setBusy(true);
    try {
      const res = await cancelStudentVocabAssignmentAction({ assignmentId, queueSize });
      setMsg("✅ Canceled");
      await loadPlan();
      return res;
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "failed"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-extrabold">Assign / Plan / Queue</div>
        <div className="text-xs text-slate-500">
          {stats.todayISO ? `Today: ${stats.todayISO} · Unlocked ${stats.unlocked}/${stats.total} · Cap ${stats.maxActive}` : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs font-bold text-slate-600">Student search</div>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name / login_id / uuid"
          />
          <div className="mt-2">
            <div className="text-xs font-bold text-slate-600">Student</div>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {`${s.full_name ?? "(no name)"} · ${s.login_id ?? ""} · grade:${s.grade ?? "-"}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-slate-600">Track</div>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
          >
            {initialTracks.map((t) => (
              <option key={t.id} value={t.id}>
                {`${t.title ?? t.slug ?? t.id} · days:${t.total_days ?? "-"}`}
              </option>
            ))}
          </select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-bold text-slate-600">Start date</div>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={startDateISO}
                onChange={(e) => setStartDateISO(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600">Queue size</div>
              <input
                type="number"
                min={1}
                max={20}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={queueSize}
                onChange={(e) => setQueueSize(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs font-bold text-slate-600">Weekdays (1=Mon ... 7=Sun)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <WeekBtn key={d} n={d} active={weekdays.includes(d)} onClick={() => toggleWeekday(d)} />
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs font-bold text-slate-600">Max active</div>
              <input
                type="number"
                min={1}
                max={20}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={maxActiveSets}
                onChange={(e) => setMaxActiveSets(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600">Start day</div>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={startDayIndex}
                onChange={(e) => setStartDayIndex(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600">Cursor day</div>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={cursorDayIndex}
                onChange={(e) => setCursorDayIndex(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="(optional)"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              id="pause"
              type="checkbox"
              checked={isPaused}
              onChange={(e) => setIsPaused(e.target.checked)}
            />
            <label htmlFor="pause" className="text-sm font-bold text-slate-700">
              Pause plan
            </label>
            <input
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
              value={pausedReason}
              onChange={(e) => setPausedReason(e.target.value)}
              placeholder="paused reason (optional)"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadPlan}
          disabled={busy}
          className="h-11 px-4 rounded-2xl border font-extrabold"
        >
          Load
        </button>
        <button
          type="button"
          onClick={savePlan}
          disabled={busy}
          className="h-11 px-4 rounded-2xl bg-emerald-700 text-white font-extrabold disabled:opacity-50"
        >
          Save plan
        </button>
        <button
          type="button"
          onClick={recockQueue}
          disabled={busy}
          className="h-11 px-4 rounded-2xl bg-slate-900 text-white font-extrabold disabled:opacity-50"
        >
          Ensure queue
        </button>
        <button
          type="button"
          onClick={assignNow}
          disabled={busy}
          className="h-11 px-4 rounded-2xl border font-extrabold"
        >
          Assign 1 now
        </button>
      </div>

      {msg ? <div className="text-sm font-extrabold">{msg}</div> : null}

      {/* Plan snapshot */}
      <div className="rounded-2xl border bg-slate-50 p-4">
        <div className="text-sm font-extrabold">Current plan</div>
        <pre className="mt-2 text-xs whitespace-pre-wrap">
          {JSON.stringify(plan, null, 2)}
        </pre>
      </div>

      {/* Breaks */}
      {breaks.length ? (
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-sm font-extrabold">Breaks</div>
          <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(breaks, null, 2)}</pre>
        </div>
      ) : null}

      {/* Queue */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-extrabold">Queue (active assignments)</div>

        {queue.length === 0 ? (
          <div className="mt-2 text-sm text-slate-600">No active assignments.</div>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="border-b p-2">Day</th>
                  <th className="border-b p-2">Set</th>
                  <th className="border-b p-2">Available</th>
                  <th className="border-b p-2">Status</th>
                  <th className="border-b p-2">Started</th>
                  <th className="border-b p-2">Completed</th>
                  <th className="border-b p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border-b p-2">{r.day_index}</td>
                    <td className="border-b p-2 font-mono text-xs">{r.set_id}</td>
                    <td className="border-b p-2">{r.available_at}</td>
                    <td className="border-b p-2">{r.status}</td>
                    <td className="border-b p-2">{r.started_at ?? ""}</td>
                    <td className="border-b p-2">{r.completed_at ?? ""}</td>
                    <td className="border-b p-2">
                      <button
                        type="button"
                        disabled={busy || Boolean(r.started_at) || Boolean(r.completed_at)}
                        onClick={() => cancelAssignment(r.id)}
                        className="h-9 px-3 rounded-xl border font-extrabold disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-slate-500">
              * Cancel은 started/completed 되기 전 assignment만 가능 (actions.ts 로직 그대로)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
