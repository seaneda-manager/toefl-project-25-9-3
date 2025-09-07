'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Obj = { name: string; id?: string; updated_at?: string; metadata?: any; };

export default function Page(){
  const [items,setItems]=useState<Obj[]>([]);
  const [msg,setMsg]=useState('loading...');
  const [busy,setBusy]=useState(false);

  const load = async ()=>{
    setMsg('loading...');
    const { data, error } = await supabase.storage.from('audio').list('', { limit: 100, sortBy: { column:'updated_at', order:'desc' }});
    if(error){ setMsg(error.message); return; }
    setItems(data||[]); setMsg('');
  };
  useEffect(()=>{ load(); },[]);

  const upload = async (file: File)=>{
    setBusy(true);
    const path = `uploads/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('audio').upload(path, file);
    setBusy(false);
    if(error){ alert(error.message); return; }
    await load();
  };

  const urlFor = (name:string)=> supabase.storage.from('audio').getPublicUrl(name).data.publicUrl;

  return (
    <div style={{maxWidth:900,margin:'24px auto',padding:16,background:'#fff',border:'1px solid #e5e7eb',borderRadius:12}}>
      <h2>Audio Storage</h2>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input type="file" onChange={e=>{const f=e.target.files?.[0]; if(f) upload(f);}} />
        {busy && <span>Uploading...</span>}
      </div>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:12,marginTop:12}}>
        <ul style={{margin:0,paddingLeft:16}}>
          {items.map((it,i)=>(
            <li key={i} style={{marginBottom:8}}>
              <a href={urlFor(it.name)} target="_blank" rel="noreferrer">{it.name}</a>
            </li>
          ))}
        </ul>
        <div style={{border:'1px solid #e5e7eb',borderRadius:8,padding:8}}>
          <div style={{fontSize:12,color:'#666'}}>미리듣기</div>
          <select onChange={e=>{
            const a = document.getElementById('aud') as HTMLAudioElement;
            a.src = e.target.value || '';
            a.load(); a.play().catch(()=>{});
          }}>
            <option value="">-- 선택 --</option>
            {items.filter(it=>/\.(mp3|wav|m4a|ogg)$/i.test(it.name)).map((it,i)=>(
              <option key={i} value={urlFor(it.name)}>{it.name}</option>
            ))}
          </select>
          <audio id="aud" controls style={{width:'100%',marginTop:8}} />
          <div style={{marginTop:8,fontSize:12,color:'#6b7280'}}>※ 업로드는 OWNER/교직원만 허용 (RLS). 권한 없으면 'permission denied'가 표시됩니다.</div>
        </div>
      </div>
    </div>
  );
}
