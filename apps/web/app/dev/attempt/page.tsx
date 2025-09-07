'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ORG_ID } from '@/lib/constants';

type Section = 'reading'|'listening'|'speaking'|'writing';

export default function Page(){
  const [attemptId,setAttemptId]=useState<string|null>(null);
  const [section,setSection]=useState<Section>('reading');
  const [setId,setSetId]=useState<string>('TPO 1');
  const [log,setLog]=useState<string[]>([]);
  const push = (s:string)=>setLog(v=>[s,...v].slice(0,50));

  const startAttempt = async ()=>{
    const user = (await supabase.auth.getUser()).data.user;
    if(!user){ alert('로그인이 필요합니다'); return; }
    const { data, error } = await supabase.from('attempts').insert({
      org_id: ORG_ID, user_id: user.id, section, set_id: setId
    }).select('id').single();
    if(error){ push('start error: '+error.message); return; }
    setAttemptId(data!.id); push(`started attempt ${data!.id}`);
  };

  async function getAnswerKey(){
    const { data, error } = await supabase
      .from('sets')
      .select('payload_json,published_at,version')
      .eq('org_id', ORG_ID).eq('section', section).eq('set_id', setId)
      .order('published_at', { ascending:false, nullsFirst:false })
      .order('version', { ascending:false })
      .limit(1);
    if(error) throw error;
    const key = data?.[0]?.payload_json?.answer_key || {};
    return key as Record<string, number[]|number>;
  }

  const saveAnswer = async (q:number, picks:number[])=>{
    if(!attemptId){ alert('먼저 Start'); return; }
    try{
      const key = await getAnswerKey();
      const correctAns = key[String(q)];
      const isCorrect = Array.isArray(correctAns)
        ? arrEq(picks, correctAns)
        : picks.length===1 && picks[0]===correctAns;
      const { error } = await supabase
        .from('answers')
        .upsert([{ attempt_id: attemptId, q_number: q, picks, correct: isCorrect, duration_ms: null }],
                { onConflict: 'attempt_id,q_number' });
      if(error) throw error;
      push(`saved q${q}: [${picks.join(',')}] ${isCorrect?'✅':'❌'}`);
    }catch(e:any){ push('save error: '+e.message); }
  };

  const computeScore = async ()=>{
    if(!attemptId) return;
    const { data, error } = await supabase.from('answers')
      .select('correct').eq('attempt_id', attemptId);
    if(error){ push(error.message); return; }
    const total = data?.length||0;
    const ok = (data||[]).filter(r=>r.correct===true).length;
    push(`SCORE: ${ok} / ${total}`);
  };

  return (
    <div style={{maxWidth:800,margin:'24px auto',padding:16,background:'#fff',border:'1px solid #e5e7eb',borderRadius:12}}>
      <h2>Attempt + Scoring Demo</h2>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <select value={section} onChange={e=>setSection(e.target.value as Section)}>
          {['reading','listening','speaking','writing'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input value={setId} onChange={e=>setSetId(e.target.value)} />
        <button onClick={startAttempt}>Start Attempt</button>
        <button onClick={computeScore} disabled={!attemptId}>Compute Score</button>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>saveAnswer(1,[2])}>Q1 pick 2</button>
        <button onClick={()=>saveAnswer(2,[1,3])}>Q2 picks 1,3</button>
        <button onClick={()=>saveAnswer(3,[])}>Q3 clear</button>
      </div>
      <pre style={{marginTop:12,whiteSpace:'pre-wrap'}}>{log.join('\n')}</pre>
      <div style={{marginTop:8,fontSize:12,color:'#6b7280'}}>※ answer_key 예: {"{\"1\":2,\"2\":[1,3]}"}</div>
    </div>
  );
}

function arrEq(a:number[], b:number[]|number){
  if(!Array.isArray(b)) return false;
  if(a.length!==b.length) return false;
  const A=[...a].sort(), B=[...b].sort();
  return A.every((v,i)=>v===B[i]);
}
