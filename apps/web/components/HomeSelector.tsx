'use client';
import { useEffect, useState } from 'react';
export default function HomeSelector({ onStart, onTeacher }:{ onStart:(v:{tpo:string,section:string,mode:string})=>void; onTeacher:(v:{section:string})=>void }){
  const [tpo,setTpo]=useState('TPO 1');
  const [section,setSection]=useState<'reading'|'listening'|'speaking'|'writing'>('reading');
  const [mode,setMode]=useState<'study'|'test'>('study');
  useEffect(()=>{ const s=localStorage.getItem('home_prefs'); if(s){ try{const p=JSON.parse(s); p.tpo&&setTpo(p.tpo); p.section&&setSection(p.section); p.mode&&setMode(p.mode);}catch{} } },[]);
  useEffect(()=>{ localStorage.setItem('home_prefs', JSON.stringify({tpo,section,mode})); },[tpo,section,mode]);
  return (
    <div style={{maxWidth:720,margin:'40px auto',padding:20,border:'1px solid #e5e7eb',borderRadius:12,background:'#fff'}}>
      <h2>Home</h2>
      <div style={{display:'grid',gap:12}}>
        <div>
          <label><strong>TPO SET</strong></label>
          <select value={tpo} onChange={e=>setTpo(e.target.value)}>{Array.from({length:60}).map((_,i)=>`TPO ${i+1}`).map(x=> <option key={x} value={x}>{x}</option>)}</select>
        </div>
        <div>
          <label><strong>SECTION</strong></label>
          {['reading','listening','speaking','writing'].map(s=> (
            <label key={s} style={{marginRight:12}}>
              <input type='radio' name='section' value={s} checked={section===s} onChange={()=>setSection(s as any)} /> {s}
            </label>
          ))}
        </div>
        <div>
          <label><strong>MODE</strong></label>
          {['study','test'].map(m=> (
            <label key={m} style={{marginRight:12}}>
              <input type='radio' name='mode' value={m} checked={mode===m} onChange={()=>setMode(m as any)} /> {m}
            </label>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>onStart({tpo,section,mode})}>Start</button>
          <button onClick={()=>onTeacher({section})}>Teacher Mode</button>
        </div>
      </div>
    </div>
  );
}
