"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Stage = "exchanging" | "ready" | "done" | "error";

export default function UpdatePasswordPage() {
  const [stage, setStage] = useState<Stage>("exchanging");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(location.href);

        // 0) 쿼리 에러(만료 등) → 바로 에러 화면
        const qErr = url.searchParams.get("error");
        const qErrCode = url.searchParams.get("error_code");
        const qErrDesc = url.searchParams.get("error_description");
        if (qErr || qErrCode) {
          history.replaceState({}, "", `${location.origin}${location.pathname}`);
          const friendly =
            qErrCode === "otp_expired"
              ? "재설정 링크가 만료되었어요. 새 링크를 다시 받아주세요."
              : "링크가 유효하지 않습니다. 새 링크를 다시 받아주세요.";
          setErr(qErrDesc ? `${friendly} (${decodeURIComponent(qErrDesc)})` : friendly);
          setStage("error");
          return;
        }

        // 1) 해시 토큰(implicit) 우선 처리
        const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
        if (hash) {
          const h = new URLSearchParams(hash);
          const type = h.get("type");
          const access_token = h.get("access_token");
          const refresh_token = h.get("refresh_token");
          if (type === "recovery" && access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            history.replaceState({}, "", `${location.origin}${location.pathname}`);
            setStage("ready");
            return;
          }
        }

        // 2) (옵션) PKCE 코드가 왔으면 시도하되, verifier 오류면 안내만
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (String(error.message).toLowerCase().includes("verifier")) {
              setErr(
                "링크 형식이 맞지 않아 실패했어요. 비밀번호 재설정 링크를 다시 받아 같은 브라우저에서 열어주세요."
              );
              setStage("error");
              return;
            }
            throw error;
          }
          history.replaceState({}, "", `${location.origin}${location.pathname}`);
          setStage("ready");
          return;
        }

        // 3) 이미 세션 있으면 통과
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStage("ready");
          return;
        }

        // 4) 여기까지면 세션 없음
        setErr("세션이 없습니다. 재설정 링크를 다시 받아 같은 브라우저에서 열어주세요.");
        setStage("error");
      } catch (e: any) {
        setErr(e?.message ?? "링크 검증 중 오류가 발생했습니다.");
        setStage("error");
      }
    };

    run();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (pw.length < 6) return setErr("비밀번호는 6자 이상이어야 합니다.");
    if (pw !== pw2) return setErr("비밀번호가 일치하지 않습니다.");

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg("비밀번호가 변경되었습니다. 로그인해 주세요.");
      setStage("done");
    } catch (e: any) {
      setErr(e?.message ?? "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">비밀번호 변경</h1>

      {stage === "exchanging" && (
        <p className="text-sm text-gray-600">링크 검증 중...</p>
      )}

      {stage === "error" && (
        <div className="space-y-3">
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <p className="text-sm">
            <Link href="/auth/forgot-password" className="underline">
              재설정 링크 다시 받기
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            링크는 일정 시간 안에만 유효하고, 한 번 사용하면 만료됩니다. 반드시 같은 브라우저에서 열어주세요.
          </p>
        </div>
      )}

      {stage === "ready" && (
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
              disabled={loading || stage !== "ready"}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition"
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50 active:bg-gray-100 transition"
            >
              로그인으로
            </Link>
          </div>
        </form>
      )}

      {stage === "done" && (
        <div className="space-y-4">
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          <Link href="/auth/login" className="underline">
            로그인 화면으로 이동
          </Link>
        </div>
      )}
    </main>
  );
}
