// apps/web/app/auth/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErr("이메일을 올바르게 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      // 이메일로 비밀번호 재설정 링크 발송
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      });
      if (error) throw error;

      setMsg("재설정 링크를 이메일로 보냈어요. 메일함을 확인해주세요!");
      setEmail("");
    } catch (e: any) {
      setErr(e?.message ?? "메일 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">비밀번호 재설정</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm mb-1">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border px-3 py-2 disabled:opacity-50"
        >
          {loading ? "전송 중..." : "재설정 링크 보내기"}
        </button>

        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}
