// components/dashboard/SidebarClient.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type Props = { role: 'student' | 'teacher' };

export default function SidebarClient({ role }: Props) {
  const pathname = usePathname();

  // 활성 경로 판정: 끝의 슬래시는 무시하고, 하위 경로도 활성 처리
  const isActive = (href: string) => {
    const clean = (s: string) => s.replace(/\/+$/, '');
    const cur = clean(pathname || '/');
    const tgt = clean(href);
    return cur === tgt || cur.startsWith(tgt + '/');
  };

  // NOTE: route group(예: (protected), (teacher))은 URL에 포함되지 않으므로
  // 실제 URL 경로로만 작성해야 합니다.
  const items = useMemo(
    () => [
      { section: 'Main', href: '/home', label: 'Home' },
      { section: 'Main', href: '/reading', label: 'Reading' },
      { section: 'Main', href: '/listening', label: 'Listening' },
      { section: 'Main', href: '/speaking', label: 'Speaking' },
      { section: 'Main', href: '/writing', label: 'Writing' },

      ...(role === 'teacher'
        ? ([
            { section: 'Teacher', href: '/teacher', label: 'Teacher Home' },
            { section: 'Teacher', href: '/teacher/students', label: 'Students' },
            { section: 'Teacher', href: '/teacher/sets', label: 'Sets' },
          ] as const)
        : []),

      { section: 'System', href: '/settings', label: 'Settings' },
    ],
    [role]
  );

  // 섹션별 그룹핑
  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const key = it.section;
      if (!map.has(key)) map.set(key, [] as any);
      map.get(key)!.push(it as any);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <nav className="py-3 text-sm">
      {groups.map(([section, list]) => (
        <div key={section} className="mb-2">
          <div className="px-4 pb-2 text-xs uppercase tracking-wide text-neutral-500">{section}</div>
          <ul>
            {list.map((it) => {
              const active = isActive(it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    prefetch
                    aria-current={active ? 'page' : undefined}
                    data-active={active ? 'true' : 'false'}
                    className={[
                      'block w-full rounded-lg px-4 py-2.5 text-left transition',
                      'hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50',
                      active ? 'bg-neutral-100 font-medium' : '',
                    ].join(' ')}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
