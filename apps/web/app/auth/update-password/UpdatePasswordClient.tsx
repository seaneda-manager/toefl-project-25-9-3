// normalized utf8
"use client";

import { useEffect, useMemo, useState } from "react";
// NOTE: ������ Ŭ���̾�Ʈ���� ����� Supabase �ν��Ͻ�
import { supabase } from "@/lib/supabaseClient";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function UpdatePasswordClient() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("code")) {
      supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
    }
  }, []);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (password !== confirm) return false;
    if (!PASSWORD_RULE.test(password)) return false;
    return true;
  }, [loading, password, confirm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!PASSWORD_RULE.test(password)) {
      setErr("8�� �̻�, �����ڿ� ���ڸ� ��� �����ؾ� �մϴ�.");
      return;
    }
    if (password !== confirm) {
      setErr("�� ��й�ȣ�� Ȯ�� ��й�ȣ�� ��ġ���� �ʽ��ϴ�.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("��й�ȣ�� ����Ǿ����ϴ�. ��� �� Ȩ���� �̵��մϴ�.");
      setPassword("");
      setConfirm("");

      setTimeout(() => {
        if (typeof window !== "undefined") window.location.href = "/";
      }, 1200);
    } catch (e: any) {
      setErr(e?.message ?? "��й�ȣ ���� �� ������ �߻��߽��ϴ�.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">��й�ȣ ����</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="pw" className="block text-sm mb-1">
            �� ��й�ȣ
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8�� �̻�, ����+���� ����"
            required
          />
        </div>

        <div>
          <label htmlFor="pw2" className="block text-sm mb-1">
            �� ��й�ȣ Ȯ��
          </label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="�ٽ� �� �� �Է�"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md border px-3 py-2 disabled:opacity-50"
        >
          {loading ? "���� �ߡ�" : "��й�ȣ ����"}
        </button>

        {msg && (
          <p role="status" className="text-green-600 text-sm">
            {msg}
          </p>
        )}
        {err && (
          <p role="alert" className="text-red-600 text-sm">
            {err}
          </p>
        )}
      </form>
    </main>
  );
}
