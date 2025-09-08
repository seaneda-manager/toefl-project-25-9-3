// apps/web/app/auth/update-password/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function UpdatePasswordPage() {
  const [stage, setStage] = useState<"exchanging" | "ready" | "done" | "error">("exchanging");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const doAuth = async () => {
      try {
        const url = new URL(window.location.href);

        // 1) ?code=... (PKCE)
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // URL 정리 (?code 제거)
          window.history.replaceState({}, "", `${location.origin}${location.pathname}`);
          setStage("ready");
          return;
        }

        // 2) #access_token=...&refresh_token=...&type=recovery (해시 토큰)
        const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
        const h = new URLSearchParams(hash);
        const access_token = h.get("access_token");
        const refresh_token = h.get("refresh_token");
        const type = h.get("type");

        if (type === "recovery" && access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          // URL 정리 (#… 제거)
          window.history.replaceState({}, "", `${location.origin}${location.pathname}`);
          setStage("ready");
          return;
        }

        // 3) 이미 세션이 있으면 통과
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStage("ready");
          return;
        }

        // 4) 여기까지면 세션 없음
        setErr(
          "세션이 없습니다. 링크가 만료되었거나 브라우저가 달라졌을 수 있어요. " +
          "이메일 재설정 링크를 다시 요청하고, 같은 브라우저에서 열어주세요."
        );
        setStage("error");
      } catch (e: any) {
        setErr(e?.message ?? "링크 검증 중 오류가 발생했습니다.");
        setStage("error");
      }
    };

    doAuth();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (pw.length < 6) return setErr("비밀번호는 6자 이상이어야 합니다.");
    if (pw !== pw2) return setErr("비밀번호가 일치하지 않습니다.");

    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setErr(error.message);

    setMsg("비밀번호가 변경되었습니다. 로그인해 주세요.");
    setStage("done");
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">비밀번호 변경</h1>

      {stage === "exchanging" && <p className="text-sm text-gray-600">링크 검증 중...</p>}

      {(stage === "ready" || stage === "error") && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="pw" className="block text-sm mb-1">새 비밀번호</label>
            <input
              id="pw"
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="pw2" className="block text-sm mb-1">새 비밀번호 확인</label>
            <input
              id="pw2"
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
            />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="submit"
              disabled={stage !== "ready"}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition"
            >
              비밀번호 변경
            </button>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50 active:bg-gray-100 transition"
            >
              로그인으로
            </Link>
          </div>

          {err && (
            <>
              <p className="text-red-600 text-sm">{err}</p>
              <p className="text-sm text-gray-600">
                <Link href="/auth/forgot-password" className="underline">재설정 링크 다시 받기</Link>
              </p>
            </>
          )}

          {msg && <p className="text-green-600 text-sm">{msg}</p>}
        </form>
      )}

      {stage === "done" && (
        <div className="space-y-4">
          <p className="text-green-600 text-sm">{msg}</p>
          <Link href="/auth/login" className="underline">로그인 화면으로 이동</Link>
        </div>
      )}
    </main>
  );
}
