// apps/web/app/(protected)/admin/users/UsersManager.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Role = 'student' | 'teacher' | 'admin';

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string | null;
};

type UsersResp = {
  items: Profile[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  total?: number;
};

export default function UsersManager() {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UsersResp>({ items: [] });
  const [draftRole, setDraftRole] = useState<Record<string, Role>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const totalLabel = useMemo(() => {
    const t = data.total ?? data.items.length;
    return t > 0 ? `Total ${t}` : '';
  }, [data.total, data.items.length]);

  const buildURL = useCallback(
    (c?: string) => {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const url = new URL('/api/admin/users', base || 'http://localhost');
      if (query.trim()) url.searchParams.set('q', query.trim());
      if (c) url.searchParams.set('cursor', c);
      return url.toString();
    },
    [query]
  );

  const fetchList = useCallback(
    async (c?: string) => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildURL(c), { cache: 'no-store', signal: ac.signal });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as UsersResp;
        setData(json);
        setCursor(c);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load users');
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [buildURL]
  );

  useEffect(() => {
    fetchList(undefined);
  }, [fetchList]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    fetchList(undefined);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchList(undefined);
      debounceRef.current = null;
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchList]);

  const applyRole = async (userId: string) => {
    const newRole = draftRole[userId];
    if (!newRole) return;

    const prev = data.items.find((it) => it.id === userId)?.role;

    setSaving((s) => ({ ...s, [userId]: true }));
    setError(null);
    setToast(null);

    setData((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === userId ? { ...it, role: newRole } : it)),
    }));

    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast('권한이 저장되었습니다.');
    } catch (e: any) {
      if (prev) {
        setData((d) => ({
          ...d,
          items: d.items.map((it) => (it.id === userId ? { ...it, role: prev } : it)),
        }));
      }
      setError(e?.message || 'Failed to set role');
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  };

  const RoleSelect = ({ user }: { user: Profile }) => {
    const value = draftRole[user.id] ?? user.role;
    return (
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`role-${user.id}`}>
          Role
        </label>
        <select
          id={`role-${user.id}`}
          className="rounded border px-2 py-1"
          value={value}
          onChange={(e) => setDraftRole((d) => ({ ...d, [user.id]: e.target.value as Role }))}
        >
          <option value="student">student</option>
          <option value="teacher">teacher</option>
          <option value="admin">admin</option>
        </select>
        <button
          className="rounded border px-3 py-1 disabled:opacity-50"
          disabled={!!saving[user.id] || value === user.role}
          onClick={() => applyRole(user.id)}
          aria-busy={!!saving[user.id]}
        >
          {saving[user.id] ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  };

  const goPrev = () => {
    if (!data.prevCursor || loading) return;
    fetchList(data.prevCursor);
  };
  const goNext = () => {
    if (!data.nextCursor || loading) return;
    fetchList(data.nextCursor);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="이름/이메일 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />
        <button className="rounded border px-4 py-2" disabled={loading}>
          Search
        </button>
      </form>

      <div aria-live="polite" className="min-h-5">
        {toast && <div className="text-sm text-green-600">{toast}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.items.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-3">
                    <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr>
                <td className="px-3 py-6" colSpan={5}>
                  No users
                </td>
              </tr>
            ) : (
              data.items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.full_name ?? '-'}</td>
                  <td className="px-3 py-2">{u.email ?? '-'}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <RoleSelect user={u} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500">{totalLabel}</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded px-3 py-1 border disabled:opacity-50"
            disabled={!data.prevCursor || loading}
            onClick={goPrev}
          >
            Prev
          </button>
          <button
            className="rounded px-3 py-1 border disabled:opacity-50"
            disabled={!data.nextCursor || loading}
            onClick={goNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
