'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ORG_ID } from '@/lib/constants';

type Row = {
  id: string; section:'reading'|'listening'|'speaking'|'writing';
  set_id: string; title: string; version: number; published_at: string|null; payload_json: any;
};

export default function Page(){
  const [rows,setRows]=useState<Row[]>([]);
  const [sel,setSel]=useState<{section:Row['section'], set_id:string}|null>(null);
  const [editor,setEditor]=useState<string>('{}');
  const [title,setTitle]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  const groups = useMemo(()=> {
    const g: Record<string, Row[]> = {};
    rows.forEach(r=>{
      const k = `${r.section}::${r.set_id}`; (g[k] ||= []).push(r);
    });
    Object.values(g).forEach(list=> list.sort((a,b)=>
      (b.published_at?1:0)-(a.published_at?1:0) || b.version-a.version));
    return g;
  },[rows]);

  const load = async ()=>{
    setMsg('loading...');
    const { data, error } = await supabase
      .from('sets')
      .select('id,section,set_id,title,version,payload_json,published_at')
      .eq('org_id', ORG_ID);
    if(error){ setMsg(error.message); return; }
    setRows((data as any)||[]); setMsg('');
  };
  useEffect(()=>{ load(); },[]);

  const pick = (section:Row['section'], set_id:string)=>{
    setSel({section,set_id});
    const list = groups[`${section}::${set_id}`]||[];
    const latest = list[0];
    setTitle(latest?.title ?? '');
    setEditor(JSON.stringify(latest?.payload_json ?? {}, null, 2));
  };

  const createNewVersion = async ()=>{
    if(!sel) return;
    setBusy(true);
    try{
      const list = groups[`${sel.section}::${sel.set_id}`]||[];
      const latest = list[0];
      const nextVersion = (latest?.version ?? 0) + 1;
      const payload = JSON.parse(editor||'{}');
      const { error } = await supabase.from('sets').insert({
        org_id: ORG_ID,
        section: sel.section,
        set_id: sel.set_id,
        title,
        version: nextVersion,
        payload_json: payload
      });
      if(error) throw error;
      await load();
      alert(`Saved v${nextVersion}`);
    }catch(e:any){ alert(e.message); }
    setBusy(false);
  };

  const publishVersion = async (row: Row)=>{
    setBusy(true);
    try{
      // 1) 같은 세트의 모든 퍼블리시 해제
      const { error: e1 } = await supabase
        .from('sets')
        .update({ published_at: null })
        .eq('org_id', ORG_ID).eq('section', row.section).eq('set_id', row.set_id);
      if(e1) throw e1;
      // 2) 선택 버전 퍼블리시
      const { error: e2 } = await supabase
        .from('sets')
        .update({ published_at: new Date().toISOString() })
        .eq('id', row.id);
      if(e2) throw e2;
      await load();
    }catch(e:any){ alert(e.message); }
    setBusy(false);
  };

  const createSet = async ()=>{
    const section = (prompt('SECTION (reading/listening/speaking/writing)','reading')||'reading') as Row['section'];
    const set_id = prompt('SET ID (예: TPO 1)', 'TPO 1') || 'TPO 1';
    const t = prompt('TITLE', 'New Set') || 'New Set';
    const { error } = await supabase.from('sets').insert({
      org_id: ORG_ID, section, set_id, title: t, version: 1, payload_json: {}
    });
    if(error) return alert(error.message);
    await load(); pick(section, set_id);
  };

  return (
    <div style={{maxWidth:1080,margin:'24px auto',display:'grid',gridTemplateColumns:'320px 1fr',gap:16}}>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Sets</h3>
          <button onClick={createSet}>+ New</button>
        </div>
        {msg && <div>{msg}</div>}
        <div style={{display:'grid',gap:8,marginTop:8}}>
          {Object.entries(groups).map(([k,list])=>{
            const [section,set_id] = k.split('::');
            const pub = list.find(x=>!!x.published_at);
            return (
              <div key={k} style={{border:'1px solid #e5e7eb',borderRadius:8,padding:8,background:'#fafafa'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}
                     onClick={()=>pick(section as Row['section'], set_id)}>
                  <div><strong>{section}</strong> / {set_id}</div>
                  <div style={{fontSize:12,color:'#666'}}>{pub ? `published v${pub.version}` : 'unpublished'}</div>
                </div>
                <div style={{marginTop:8,fontSize:12,color:'#444'}}>
                  {list.slice(0,3).map(x=>`v${x.version}`).join(', ')}{list.length>3?' …':''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12,minHeight:400}}>
        {!sel ? <div>좌측에서 세트를 선택하세요.</div> :
        <>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
            <h3 style={{margin:0}}>{sel.section} / {sel.set_id}</h3>
            <input style={{marginLeft:'auto'}} value={title} onChange={e=>setTitle(e.target.value)} />
            <button disabled={busy} onClick={createNewVersion}>{busy?'Saving...':'Save as New Version'}</button>
          </div>
          <div><small>payload_json (예: {"{\"answer_key\":{\"1\":2,\"2\":3}}"})</small></div>
          <textarea value={editor} onChange={e=>setEditor(e.target.value)}
            style={{width:'100%',height:420,fontFamily:'ui-monospace,Consolas',fontSize:13}} />
          <div style={{marginTop:8}}>
            <strong>Versions</strong>
            <ul>
              {(groups[`${sel.section}::${sel.set_id}`]||[]).map(r=>(
                <li key={r.id} style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span>v{r.version} {r.published_at?'(published)':''}</span>
                  <button onClick={()=>publishVersion(r)}>Publish</button>
                </li>
              ))}
            </ul>
          </div>
        </>}
      </div>
    </div>
  );
}
