'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState<string|null>(null);

  async function onSubmit(e:FormEvent){
    e.preventDefault();
    setMsg('계정을 생성 중…');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if(error){ setMsg(error.message); return; }
    // Confirm email을 껐으면 즉시 세션이 생김 → 홈으로
    const s = await supabase.auth.getSession();
    if(s.data.session){ location.replace('/'); return; }
    setMsg('가입 완료! 이메일 확인 후 로그인해 주세요.');
  }

  return (
    <div style={{maxWidth:420,margin:'60px auto',padding:16,border:'1px solid #e5e7eb',borderRadius:12,background:'#fff'}}>
      <h2>Create account</h2>
      <form onSubmit={onSubmit} style={{display:'grid',gap:8}}>
        <input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="password (6+ chars)" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Sign up</button>
      </form>
      {msg && <div style={{marginTop:12,whiteSpace:'pre-wrap'}}>{msg}</div>}
    </div>
  );
}
