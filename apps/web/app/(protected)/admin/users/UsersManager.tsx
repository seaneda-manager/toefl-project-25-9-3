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

const ROLE_LABEL: Record<Role, string> = {
  student: '학생',
  teacher: '선생님',
  admin: '관리자',
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  student: 'bg-blue-50 text-blue-700 ring-blue-100',
  teacher: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  admin: 'bg-amber-50 text-amber-800 ring-amber-100',
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
    return t > 0 ? `Total ${t} users` : '';
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

  // 검색어 변경 시 300ms 디바운스
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

    // 낙관적 업데이트
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
      // 실패 시 롤백
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
          className="rounded border px-2 py-1 text-xs"
          value={value}
          onChange={(e) => setDraftRole((d) => ({ ...d, [user.id]: e.target.value as Role }))}
        >
          <option value="student">학생 (student)</option>
          <option value="teacher">선생님 (teacher)</option>
          <option value="admin">관리자 (admin)</option>
        </select>
        <button
          className="rounded border px-3 py-1 text-xs disabled:opacity-50"
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
      {/* 검색 영역 */}
      <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
        <input
          className="min-w-[200px] flex-1 rounded border px-3 py-2 text-sm"
          placeholder="이름 / 이메일 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />
        <button
          type="submit"
          className="rounded border px-4 py-2 text-sm disabled:opacity-60"
          disabled={loading}
        >
          Search
        </button>
      </form>

      {/* 토스트 / 에러 */}
      <div aria-live="polite" className="min-h-5 text-xs">
        {toast && <div className="text-green-600">{toast}</div>}
        {error && <div className="text-red-600 whitespace-pre-wrap">{error}</div>}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">User</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">Email</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">Role</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">Created</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">
                Change Role
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && data.items.length === 0 ? (
              // 스켈레톤 로딩
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
                <td className="px-3 py-6 text-center text-sm text-neutral-500" colSpan={5}>
                  No users
                </td>
              </tr>
            ) : (
              data.items.map((u) => {
                const roleBadgeClass = ROLE_BADGE_CLASS[u.role];
                return (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-800">
                          {u.full_name ?? '-'}
                        </span>
                        <span className="text-xs text-neutral-500 truncate max-w-[220px]">
                          {u.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-sm text-neutral-800">{u.email ?? '-'}</span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                          roleBadgeClass,
                        ].join(' ')}
                      >
                        {ROLE_LABEL[u.role]} <span className="ml-1 text-[10px] opacity-70">
                          ({u.role})
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-neutral-600">
                        {u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <RoleSelect user={u} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 + 총 개수 */}
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <div>{totalLabel}</div>
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
