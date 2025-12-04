// components/dashboard/SidebarClient.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Role = 'student' | 'teacher' | 'admin';
type Props = { role: Role };

type NavItem = {
  section: 'Student' | 'Main' | 'Teacher' | 'System';
  href: string;
  label: string;
};

const LEGACY_ITEMS = [
  { href: '/reading', label: 'Reading (Legacy)' },
  { href: '/listening', label: 'Listening (Legacy)' },
  { href: '/speaking', label: 'Speaking (Legacy)' },
  { href: '/writing', label: 'Writing (Legacy)' },
];

// 경로 정규화: 슬래시/route group 처리
function normalizePath(s: string | null | undefined) {
  if (!s) return '/';
  let clean = s.split('?')[0];

  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  clean = clean.replace(/\/\([^/]+\)/g, '');
  clean = clean.replace(/\/+$/, '');
  if (!clean) clean = '/';

  return clean;
}

export default function SidebarClient({ role }: Props) {
  const pathnameRaw = usePathname() || '/';
  const pathname = normalizePath(pathnameRaw);

  const [collapsed, setCollapsed] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (role === 'admin') {
      return {
        Student: false,
        Main: true,
        Teacher: false,
        System: true,
      };
    }
    return {
      Student: true,
      Main: true,
      Teacher: true,
      System: true,
    };
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (href: string) => {
    const cur = pathname;
    const tgt = normalizePath(href);

    if ((cur === '/' || cur === '') && tgt === '/home') return true;
    if (cur === tgt) return true;
    if (cur.startsWith(tgt + '/')) return true;
    if (cur !== '/' && tgt !== '/' && cur.endsWith(tgt)) return true;

    return false;
  };

  // 🔍 시험 화면 여부 (-study / -test / -adaptive-demo / demo 같이)
  const isExamRoute = useMemo(() => {
    const p = normalizePath(pathnameRaw);

    const examPattern = /(study|test|adaptive-demo|demo)/;

    return (
      (/\/reading-2026\//.test(p) && examPattern.test(p)) ||
      (/\/listening-2026\//.test(p) && examPattern.test(p)) ||
      (/\/speaking-2026\//.test(p) && examPattern.test(p)) ||
      (/\/writing-2026\//.test(p) && examPattern.test(p)) ||
      // ✅ VOCA도 study/test는 시험 화면으로 취급
      (/\/voca\//.test(p) && examPattern.test(p))
    );
  }, [pathnameRaw]);

  const items = useMemo<NavItem[]>(
    () => [
      // 🔹 Student 영역 (student + admin)
      ...(role === 'student' || role === 'admin'
        ? ([
            { section: 'Student', href: '/student', label: 'Student Home' },
            { section: 'Student', href: '/student/tests', label: 'My Tests' },
            { section: 'Student', href: '/student/review', label: 'Review' },
            { section: 'Student', href: '/student/progress', label: 'Progress' },
            { section: 'Student', href: '/student/homework', label: 'Homework' },
            { section: 'Student', href: '/student/perks', label: 'Perks (soon)' },
          ] as const)
        : []),

      // 🔹 Main 공용 영역
      { section: 'Main', href: '/home', label: 'Home' },
      { section: 'Main', href: '/reading-2026/study', label: 'Reading 2026 – Study' },
      { section: 'Main', href: '/listening-2026/study', label: 'Listening 2026 – Study' },
      { section: 'Main', href: '/speaking-2026/study', label: 'Speaking 2026 – Study' },
      { section: 'Main', href: '/writing-2026/study', label: 'Writing 2026 – Study' },
      // ✅ VOCA Study 입구
      { section: 'Main', href: '/voca/study', label: 'VOCA – Study' },

      // 🔹 Teacher 영역 (teacher + admin)
      ...(role === 'teacher' || role === 'admin'
        ? ([
            { section: 'Teacher', href: '/teacher/home', label: 'Teacher Home' },
            { section: 'Teacher', href: '/teacher/tasks', label: '할 일 관리' },
            { section: 'Teacher', href: '/teacher/students', label: '학생 관리' },
            { section: 'Teacher', href: '/teacher/home-mock', label: 'Teacher Home (Mock)' },
            // ✅ VOCA Admin 입구 (경로는 /voca/admin 그대로 사용)
            { section: 'Teacher', href: '/voca/admin', label: 'VOCA Admin' },
          ] as const)
        : []),

      // 🔹 System 영역
      ...(role === 'admin'
        ? ([
            { section: 'System', href: '/admin', label: 'Admin Panel' },
            { section: 'System', href: '/admin/landing', label: 'Landing Editor' },

            // ✅ 여기부터 새 Editor 입구들
            {
              section: 'System',
              href: '/admin/content/reading-2026/new',
              label: 'Reading 2026 Editor',
            },
            {
              section: 'System',
              href: '/admin/content/listening-2026/new',
              label: 'Listening 2026 Editor',
            },
            {
              section: 'System',
              href: '/admin/content/writing-2026/new',
              label: 'Writing 2026 Editor',
            },
            // Speaking Editor 생기면 여기에 추가:
            // {
            //   section: 'System',
            //   href: '/admin/content/speaking-2026/new',
            //   label: 'Speaking 2026 Editor',
            // },

            { section: 'System', href: '/settings', label: 'Settings' },
          ] as const)
        : ([{ section: 'System', href: '/settings', label: 'Settings' }] as const)),
    ],
    [role],
  );

  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const it of items) {
      const key = it.section;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()] as [string, NavItem[]][];
  }, [items]);

  // 🔔 헤더에서 'toggle-sidebar' 이벤트 받으면 collapse 토글
  useEffect(() => {
    const handler = () => setCollapsed((v) => !v);
    document.addEventListener('toggle-sidebar', handler);
    return () => document.removeEventListener('toggle-sidebar', handler);
  }, []);

  // 📌 시험 화면 들어갈 때 최초 자동으로 접어두기
  useEffect(() => {
    if (isExamRoute) {
      setCollapsed(true);
    }
  }, [isExamRoute]);

  const widthClass = collapsed
    ? isExamRoute
      ? 'w-0 border-0'
      : 'w-14'
    : 'w-60';

  return (
    <div
      className={[
        'flex h-full flex-col bg-white transition-all duration-300',
        widthClass,
        !collapsed || !isExamRoute ? 'border-r' : '',
      ].join(' ')}
    >
      <nav className="flex-1 overflow-y-auto py-3 text-sm">
        {groups.map(([section, list], idx) => {
          const open = openSections[section] ?? true;
          const showItems = collapsed || open;

          return (
            <div
              key={section}
              className={['mb-4', idx > 0 ? 'mt-4' : ''].join(' ')}
            >
              <button
                type="button"
                onClick={() => !collapsed && toggleSection(section)}
                className={[
                  'flex w-full items-center justify-between px-4 pb-2',
                  !collapsed ? 'hover:bg-emerald-50 rounded-md py-2 -mx-1' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    collapsed
                      ? 'text-xs text-emerald-800 font-semibold'
                      : 'text-sm text-emerald-900 font-semibold',
                  ].join(' ')}
                >
                  {collapsed ? section[0] : section}
                </span>
                {!collapsed && (
                  <span className="text-base text-emerald-800">
                    {open ? '▴' : '▾'}
                  </span>
                )}
              </button>

              {showItems && (
                <ul>
                  {list.map((it) => {
                    const active = isActive(it.href);

                    const linkClasses = [
                      'group flex items-center rounded-lg px-4 py-2.5 text-left text-sm transition',
                      'hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70',
                      collapsed ? 'justify-center' : 'justify-between',
                      'border-l-2',
                      active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-600 font-semibold'
                        : 'border-transparent text-neutral-800',
                    ].join(' ');

                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          prefetch
                          aria-current={active ? 'page' : undefined}
                          data-active={active ? 'true' : 'false'}
                          className={linkClasses}
                        >
                          {/* 펼쳐진 상태 */}
                          {!collapsed && (
                            <>
                              <span className="truncate">{it.label}</span>
                              <ChevronRight
                                className={[
                                  'h-4 w-4 shrink-0 transition-colors',
                                  active
                                    ? 'text-emerald-400'
                                    : 'text-emerald-200 group-hover:text-emerald-400',
                                ].join(' ')}
                              />
                            </>
                          )}

                          {/* 접힌 상태: 작은 바만 표시 */}
                          {collapsed && (
                            <span
                              aria-hidden
                              className={[
                                'h-1.5 w-6 rounded-full',
                                active ? 'bg-emerald-500' : 'bg-neutral-300',
                              ].join(' ')}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {/* 🔹 Legacy 섹션 */}
        <div className="mt-6 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setLegacyOpen((v) => !v)}
            className={[
              'flex w-full items-center justify-between rounded-lg px-4 py-2',
              'text-sm font-semibold text-emerald-900',
              'hover:bg-emerald-50 transition',
            ].join(' ')}
          >
            <span>{collapsed ? 'L' : 'Legacy'}</span>
            {!collapsed && (
              <span className="text-base text-emerald-800">
                {legacyOpen ? '▴' : '▾'}
              </span>
            )}
          </button>

          {!collapsed && legacyOpen && (
            <ul className="mt-1">
              {LEGACY_ITEMS.map((it) => {
                const active = isActive(it.href);

                const linkClasses = [
                  'group flex items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm transition',
                  'hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70',
                  'border-l-2',
                  active
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600 font-semibold'
                    : 'border-transparent text-neutral-800',
                ].join(' ');

                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      prefetch
                      aria-current={active ? 'page' : undefined}
                      data-active={active ? 'true' : 'false'}
                      className={linkClasses}
                    >
                      <span className="truncate">{it.label}</span>
                      <ChevronRight
                        className={[
                          'h-4 w-4 shrink-0 transition-colors',
                          active
                            ? 'text-emerald-400'
                            : 'text-emerald-200 group-hover:text-emerald-400',
                        ].join(' ')}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </nav>
    </div>
  );
}
