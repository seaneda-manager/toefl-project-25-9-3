// apps/web/app/(protected)/admin/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Row = {
  passage_id: string;
  title: string;
  answers: number;
  correct: number;
  accuracy: number; // %
  avg_ms: number | null;
};
type Resp = {
  summary: { passages: number; sessions: number; users: number; answers: number; accuracy: number; };
  list: Row[];
};

export default function ReportsPage(){
  const [data,setData]=useState<Resp|null>(null);
  const [err,setErr]=useState<string|null>(null);
  const load=async()=>{
    setErr(null);
    const res=await fetch('/api/admin/reports/reading',{cache:'no-store'});
    if(!res.ok){ setErr(await res.text()); return; }
    setData(await res.json());
  };
  useEffect(()=>{ load(); },[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reading Reports</h1>
        <p className="text-sm text-muted-foreground">ì§€ë¬¸ë³„ ?‘ë‹µ???•ë‹µë¥??‰ê· ?œê°„</p>
      </div>

      {data && (
        <div className="grid sm:grid-cols-4 gap-3">
          <KPI label="Passages" value={data.summary.passages} />
          <KPI label="Sessions" value={data.summary.sessions} />
          <KPI label="Users" value={data.summary.users} />
          <KPI label="Accuracy" value={`${data.summary.accuracy}%`} />
        </div>
      )}
      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Passage</th>
              <th className="text-left px-3 py-2">Answers</th>
              <th className="text-left px-3 py-2">Correct</th>
              <th className="text-left px-3 py-2">Accuracy</th>
              <th className="text-left px-3 py-2">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {(data?.list??[]).map(r=>(
              <tr key={r.passage_id} className="border-t">
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.answers}</td>
                <td className="px-3 py-2">{r.correct}</td>
                <td className="px-3 py-2">{r.accuracy}%</td>
                <td className="px-3 py-2">{r.avg_ms!==null? `${Math.round(r.avg_ms/1000)}s` : '-'}</td>
              </tr>
            ))}
            {(data?.list?.length??0)===0 && (
              <tr><td className="px-3 py-6" colSpan={5}>?°ì´???†ìŒ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({label, value}:{label:string; value:any}){
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
