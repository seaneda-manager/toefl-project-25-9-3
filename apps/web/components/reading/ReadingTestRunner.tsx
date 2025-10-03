// apps/web/components/reading/ReadingTestRunner.tsx  (기존 파일에 보강)
"use client";
import { useState } from "react";
import type { RPassage, RQuestion } from "@/types/types-reading";
 import PassagePane from "./PassagePane";

export default function ReadingTestRunner({ passage, sessionId, onAnswer, onFinish }:{
  passage: RPassage;
  sessionId: string;
  onAnswer: (a:{ sessionId: string; questionId: string; choiceId: string })=>Promise<{ok:true}>;
  onFinish: (a:{ sessionId: string })=>Promise<{ok:true}>;
}){
  const qs = passage.questions as RQuestion[];
  const [idx,setIdx] = useState(0);
  const [picked,setPicked] = useState<Record<string,string>>({});
  const [viewTextSeen, setViewTextSeen] = useState<Record<string, boolean>>({});
  const [showFull, setShowFull] = useState(false);
  const q = qs[idx];

  const isSummary = q.type === 'summary';
  const canInteract = !isSummary || !!viewTextSeen[q.id];

  const next = async ()=>{
    if(!picked[q.id]) return alert('답을 선택하세요.');
    await onAnswer({ sessionId, questionId: q.id, choiceId: picked[q.id] });
    if(idx < qs.length-1) setIdx(idx+1); else { await onFinish({ sessionId }); alert('제출 완료'); }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-[calc(100vh-120px)] p-6">
      {/* 좌: 문제 */}
      <div className="flex flex-col">
        <div className="text-sm text-neutral-500">Question {q.number} / {qs.length}</div>
        <div className="flex items-center justify-between mt-2 mb-3">
          <h2 className="text-lg font-semibold">{q.stem}</h2>
          {isSummary && (
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => { setShowFull(true); setViewTextSeen(s=>({ ...s, [q.id]: true })); }}
            >
              View Text
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {q.choices.map((c)=> (
            <li key={c.id}>
              <label className={`flex gap-2 items-start border rounded-xl p-3 ${canInteract ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  disabled={!canInteract}
                  checked={picked[q.id]===c.id}
                  onChange={()=>setPicked(s=>({ ...s, [q.id]: c.id }))}
                  className="mt-1"
                />
                <span>{c.text}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex justify-between pt-4">
          <button className="px-4 py-2 rounded border" disabled={idx===0} onClick={()=>setIdx(idx-1)}>Prev</button>
          <button className="px-4 py-2 rounded border" onClick={next}>{idx<qs.length-1? 'Next':'Finish'}</button>
        </div>
      </div>

      {/* 우: 지문 */}
      <div className="h-full border rounded-2xl p-4">
        <PassagePane content={passage.content} q={q} />
      </div>

      {/* 전체 보기 모달 */}
      {showFull && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowFull(false)}>
          <div className="bg-white text-black max-w-3xl w-[90vw] max-h-[80vh] rounded-2xl p-6 overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Full Text</h3>
              <button className="px-3 py-1.5 border rounded-lg text-sm" onClick={()=>setShowFull(false)}>Close</button>
            </div>
            <div className="prose max-w-none whitespace-pre-wrap">
              {passage.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
