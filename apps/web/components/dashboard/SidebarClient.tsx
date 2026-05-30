'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Role = 'student' | 'teacher' | 'admin';
type Props = { role: Role };

type NavSection =
  | 'Student'
  | 'Main'
  | 'Teacher'
  | 'System'
  | 'Admin'
  | 'Lingo-X TOEFL'
  | 'Lingo-X Naesin'
  | 'Lingo-X Junior'
  | 'Lingo-X Voca'
  | 'Content'
  | 'Teacher Tools';

type NavItem = {
  section: NavSection;
  label: string;
  href?: string;
  disabled?: boolean;
};

const LEGACY_ITEMS = [
  { href: '/reading', label: 'Reading (Legacy)' },
  { href: '/listening', label: 'Listening (Legacy)' },
  { href: '/speaking', label: 'Speaking (Legacy)' },
  { href: '/writing', label: 'Writing (Legacy)' },
];

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

function getCollapsedSectionLabel(section: string) {
  const map: Record<string, string> = {
    Student: 'S',
    Main: 'M',
    Teacher: 'T',
    System: 'Sys',
    Admin: 'A',
    'Lingo-X TOEFL': 'TF',
    'Lingo-X Naesin': 'N',
    'Lingo-X Junior': 'J',
    'Lingo-X Voca': 'V',
    Content: 'C',
    'Teacher Tools': 'TT',
  };

  return map[section] ?? section.slice(0, 1);
}

export default function SidebarClient({ role }: Props) {
  const pathnameRaw = usePathname() || '/';
  const pathname = normalizePath(pathnameRaw);

  const [collapsed, setCollapsed] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (role === 'admin') {
      return {
        Admin: true,
        'Lingo-X TOEFL': true,
        'Lingo-X Naesin': true,
        'Lingo-X Junior': true,
        'Lingo-X Voca': true,
        Content: true,
        'Teacher Tools': true,
        System: true,
      };
    }

    if (role === 'teacher') {
      return {
        Main: true,
        Teacher: true,
        System: true,
      };
    }

    return {
      Student: true,
      Main: true,
      System: true,
    };
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;

    const cur = pathname;
    const tgt = normalizePath(href);

    if ((cur === '/' || cur === '') && tgt === '/home') return true;
    if (cur === tgt) return true;
    if (cur.startsWith(tgt + '/')) return true;
    if (cur !== '/' && tgt !== '/' && cur.endsWith(tgt)) return true;

    return false;
  };

  const isExamRoute = useMemo(() => {
    const p = normalizePath(pathnameRaw);
    const examPattern = /(study|test|adaptive-demo|demo)/;

    return (
      (/\/reading-2026\//.test(p) && examPattern.test(p)) ||
      (/\/listening-2026\//.test(p) && examPattern.test(p)) ||
      (/\/speaking-2026\//.test(p) && examPattern.test(p)) ||
      (/\/writing-2026\//.test(p) && examPattern.test(p)) ||
      (/\/voca\//.test(p) && examPattern.test(p))
    );
  }, [pathnameRaw]);

  const items = useMemo<NavItem[]>(() => {
    if (role === 'admin') {
      return [
        { section: 'Admin', href: '/admin', label: 'Admin Home' },

        {
          section: 'Lingo-X TOEFL',
          href: '/admin/content/reading-2026/new',
          label: 'Reading 2026 Editor',
        },
        {
          section: 'Lingo-X TOEFL',
          href: '/admin/content/listening-2026/new',
          label: 'Listening 2026 Editor',
        },
        {
          section: 'Lingo-X TOEFL',
          href: '/admin/content/writing-2026/new',
          label: 'Writing 2026 Editor',
        },

        { section: 'Lingo-X Naesin', href: '/admin/naesin', label: '내신 허브' },
        {
          section: 'Lingo-X Naesin',
          href: '/admin/naesin/scopes',
          label: '시험 범위 관리',
        },
        {
          section: 'Lingo-X Naesin',
          href: '/admin/naesin/scopes/new',
          label: '새 범위 만들기',
        },

        { section: 'Lingo-X Junior', label: 'Junior Hub (soon)', disabled: true },
        { section: 'Lingo-X Junior', label: 'Junior Content (soon)', disabled: true },

        { section: 'Lingo-X Voca', href: '/voca/admin', label: 'VOCA Admin' },

        {
          section: 'Content',
          href: '/admin/content/new?kind=reading',
          label: 'New Reading Set',
        },
        {
          section: 'Content',
          href: '/admin/content/list?kind=reading',
          label: 'Reading Set List',
        },
        {
          section: 'Content',
          href: '/admin/content/new?kind=listening',
          label: 'New Listening Set',
        },
        {
          section: 'Content',
          href: '/admin/content/list?kind=listening',
          label: 'Listening Set List',
        },

        { section: 'Teacher Tools', href: '/teacher/home', label: 'Teacher Home' },
        { section: 'Teacher Tools', href: '/teacher/tasks', label: '할 일 관리' },
        { section: 'Teacher Tools', href: '/teacher/students', label: '학생 관리' },
        {
          section: 'Teacher Tools',
          href: '/teacher/home-mock',
          label: 'Teacher Home (Mock)',
        },

        { section: 'System', href: '/admin/landing', label: 'Landing Editor' },
        { section: 'System', href: '/settings', label: 'Settings' },
      ];
    }

    if (role === 'teacher') {
      return [
        { section: 'Main', href: '/home', label: 'Home' },
        { section: 'Main', href: '/voca/study', label: 'VOCA – Study' },

        { section: 'Teacher', href: '/teacher/home', label: 'Teacher Home' },
        { section: 'Teacher', href: '/teacher/tasks', label: '할 일 관리' },
        { section: 'Teacher', href: '/teacher/students', label: '학생 관리' },
        { section: 'Teacher', href: '/teacher/home-mock', label: 'Teacher Home (Mock)' },

        { section: 'System', href: '/settings', label: 'Settings' },
      ];
    }

    return [
      { section: 'Student', href: '/student', label: 'Student Home' },
      { section: 'Student', href: '/student/tests', label: 'My Tests' },
      { section: 'Student', href: '/student/review', label: 'Review' },
      { section: 'Student', href: '/student/progress', label: 'Progress' },
      { section: 'Student', href: '/student/homework', label: 'Homework' },

      { section: 'Main', href: '/home', label: 'Home' },
      { section: 'Main', href: '/reading-2026/study', label: 'Reading 2026 – Study' },
      { section: 'Main', href: '/listening-2026/study', label: 'Listening 2026 – Study' },
      { section: 'Main', href: '/speaking-2026/study', label: 'Speaking 2026 – Study' },
      { section: 'Main', href: '/writing-2026/study', label: 'Writing 2026 – Study' },
      { section: 'Main', href: '/voca/study', label: 'VOCA – Study' },

      { section: 'System', href: '/settings', label: 'Settings' },
    ];
  }, [role]);

  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const it of items) {
      const key = it.section;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()] as [string, NavItem[]][];
  }, [items]);

  useEffect(() => {
    const handler = () => setCollapsed((v) => !v);
    document.addEventListener('toggle-sidebar', handler);
    return () => document.removeEventListener('toggle-sidebar', handler);
  }, []);

  useEffect(() => {
    if (isExamRoute) {
      setCollapsed(true);
    }
  }, [isExamRoute]);

  const widthClass = collapsed
    ? isExamRoute
      ? 'w-0 border-0'
      : 'w-14'
    : 'w-64';

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
                  !collapsed ? 'rounded-md py-2 -mx-1 hover:bg-emerald-50' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    collapsed
                      ? 'text-[11px] font-semibold text-emerald-800'
                      : 'text-sm font-semibold text-emerald-900',
                  ].join(' ')}
                >
                  {collapsed ? getCollapsedSectionLabel(section) : section}
                </span>
                {!collapsed && (
                  <span className="text-base text-emerald-800">
                    {open ? '▴' : '▾'}
                  </span>
                )}
              </button>

              {showItems && (
                <ul>
                  {list.map((it, itemIdx) => {
                    const active = isActive(it.href);

                    if (it.disabled || !it.href) {
                      return (
                        <li key={`${section}-${it.label}-${itemIdx}`}>
                          <div
                            className={[
                              'flex items-center rounded-lg px-4 py-2.5 text-left text-sm',
                              collapsed ? 'justify-center' : 'justify-between',
                              'border-l-2 border-transparent text-neutral-400',
                            ].join(' ')}
                          >
                            {!collapsed && (
                              <>
                                <span className="truncate">{it.label}</span>
                                <span className="text-[10px] text-neutral-300">soon</span>
                              </>
                            )}

                            {collapsed && (
                              <span
                                aria-hidden
                                className="h-1.5 w-6 rounded-full bg-neutral-200"
                              />
                            )}
                          </div>
                        </li>
                      );
                    }

                    const linkClasses = [
                      'group flex items-center rounded-lg px-4 py-2.5 text-left text-sm transition',
                      'hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70',
                      collapsed ? 'justify-center' : 'justify-between',
                      'border-l-2',
                      active
                        ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-600'
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

        <div className="mt-6 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setLegacyOpen((v) => !v)}
            className={[
              'flex w-full items-center justify-between rounded-lg px-4 py-2',
              'text-sm font-semibold text-emerald-900',
              'transition hover:bg-emerald-50',
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
                    ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-600'
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
