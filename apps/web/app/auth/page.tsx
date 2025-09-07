'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPage(){
  const [email,setEmail]=useState('');
  const [msg,setMsg]=useState<string|null>(null);

  async function onSubmit(e:FormEvent){
    e.preventDefault();
    setMsg('재설정 메일 전송 중…');
    const redirectTo = `${location.origin}/auth/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if(error){ setMsg(error.message); return; }
    setMsg(`메일을 보냈어요. 링크를 클릭하고 새 비밀번호를 입력하세요. (리디렉트: ${redirectTo})`);
  }

  return (
    <div style={{maxWidth:420,margin:'60px auto',padding:16,border:'1px solid #e5e7eb',borderRadius:12,background:'#fff'}}>
      <h2>Reset password</h2>
      <form onSubmit={onSubmit} style={{display:'grid',gap:8}}>
        <input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <button type="submit">Send reset link</button>
      </form>
      {msg && <div style={{marginTop:12,whiteSpace:'pre-wrap'}}>{msg}</div>}
    </div>
  );
}
