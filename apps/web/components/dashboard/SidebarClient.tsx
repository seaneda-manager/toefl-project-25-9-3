'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Role    = 'student' | 'teacher' | 'admin';
type Program = 'gap' | 'toefl' | 'lingx' | null;
type Props   = { role: Role; program?: Program };

// ── Section type: all section keys used across roles ─────────────
type NavSection =
  // Admin
  | 'Admin' | 'Lingo-X TOEFL' | 'Lingo-X Naesin' | 'Lingo-X Junior'
  | 'Lingo-X Voca' | 'Content' | 'Teacher Tools'
  // Teacher (Korean)
  | '콘텐츠' | '학생 관리'
  // Student — program-specific
  | '내신' | '어휘' | '숙제'   // lingx
  | '학습' | '내 현황'          // toefl / gap
  | '내 학습' | '학습 콘텐츠'   // unassigned (legacy)
  // Shared
  | '설정';

type NavItem = {
  section: NavSection;
  label: string;
  href?: string;
  disabled?: boolean;
};

// Shown only to admin / teacher / unassigned students
const LEGACY_ITEMS = [
  { href: '/reading',   label: 'Reading (Legacy)' },
  { href: '/listening', label: 'Listening (Legacy)' },
  { href: '/speaking',  label: 'Speaking (Legacy)' },
  { href: '/writing',   label: 'Writing (Legacy)' },
];

// ── Helpers ───────────────────────────────────────────────────────
function normalizePath(s: string | null | undefined) {
  if (!s) return '/';
  let clean = s.split('?')[0];
  if (!clean.startsWith('/')) clean = '/' + clean;
  clean = clean.replace(/\/\([^/]+\)/g, '');
  clean = clean.replace(/\/+$/, '');
  if (!clean) clean = '/';
  return clean;
}

function collapsedLabel(section: string) {
  const map: Record<string, string> = {
    // Admin
    Admin: 'A', 'Lingo-X TOEFL': 'TF', 'Lingo-X Naesin': 'N',
    'Lingo-X Junior': 'J', 'Lingo-X Voca': 'V', Content: 'C', 'Teacher Tools': 'TT',
    // Teacher
    '콘텐츠': '콘', '학생 관리': '관',
    // Student
    '내신': '내', '어휘': '어', '숙제': '숙', '학습': '학', '내 현황': '현',
    '내 학습': '나', '학습 콘텐츠': '콘',
    // Shared
    '설정': '설',
  };
  return map[section] ?? section.slice(0, 1);
}

// ── Component ────────────────────────────────────────────────────
export default function SidebarClient({ role, program = null }: Props) {
  const pathnameRaw = usePathname() || '/';
  const pathname    = normalizePath(pathnameRaw);

  const [collapsed, setCollapsed]   = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  // ── Initial open-section state ──────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (role === 'admin') {
      return {
        Admin: true, 'Lingo-X TOEFL': true, 'Lingo-X Naesin': true,
        'Lingo-X Junior': true, 'Lingo-X Voca': true,
        Content: true, 'Teacher Tools': true,
      };
    }
    if (role === 'teacher') {
      return { '콘텐츠': true, '학생 관리': true, '설정': true };
    }
    // student: open all
    return {
      '내신': true, '어휘': true,
      '학습': true, '내 현황': true,
      '내 학습': true, '학습 콘텐츠': true,
      '설정': true,
    };
  });

  const toggleSection = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // ── Active link detection ─────────────────────────────────────
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

  // ── Exam-route auto-collapse ─────────────────────────────────
  const isExamRoute = useMemo(() => {
    const p = normalizePath(pathnameRaw);
    const exam = /(study|test|adaptive-demo|demo)/;
    return (
      (/\/reading-2026\//.test(p)  && exam.test(p)) ||
      (/\/listening-2026\//.test(p) && exam.test(p)) ||
      (/\/speaking-2026\//.test(p) && exam.test(p)) ||
      (/\/writing-2026\//.test(p)  && exam.test(p)) ||
      (/\/voca\//.test(p)          && exam.test(p)) ||
      /\/hi-naesin\/drill\//.test(p)
    );
  }, [pathnameRaw]);

  // ── Nav items: per role + per program ────────────────────────
  const items = useMemo<NavItem[]>(() => {

    // ── Admin ─────────────────────────────────────────────────
    if (role === 'admin') {
      return [
        { section: 'Admin',         href: '/admin',                             label: 'Admin Home' },

        { section: 'Lingo-X TOEFL', href: '/admin/content/reading-2026/new',   label: 'Reading 2026 Editor' },
        { section: 'Lingo-X TOEFL', href: '/admin/content/listening-2026/new', label: 'Listening 2026 Editor' },
        { section: 'Lingo-X TOEFL', href: '/admin/content/writing-2026/new',   label: 'Writing 2026 Editor' },

        { section: 'Lingo-X Naesin', href: '/admin/naesin',                    label: '내신 허브' },
        { section: 'Lingo-X Naesin', href: '/admin/naesin/scopes',             label: '시험 범위 관리' },
        { section: 'Lingo-X Naesin', href: '/admin/naesin/scopes/new',         label: '새 범위 만들기' },
        { section: 'Lingo-X Naesin', href: '/admin/hi-naesin/passages',        label: 'Hi-내신 지문 목록' },
        { section: 'Lingo-X Naesin', href: '/admin/hi-naesin/passages/new',    label: 'Hi-내신 단건 등록' },
        { section: 'Lingo-X Naesin', href: '/admin/hi-naesin/passages/bulk-new', label: 'Hi-내신 챕터 일괄' },

        { section: 'Lingo-X Junior', label: 'Junior Hub (soon)',     disabled: true },
        { section: 'Lingo-X Junior', label: 'Junior Content (soon)', disabled: true },

        { section: 'Lingo-X Voca', href: '/voca/admin', label: 'VOCA Admin' },

        { section: 'Content', href: '/admin/content/new?kind=reading',  label: 'New Reading Set' },
        { section: 'Content', href: '/admin/content/list?kind=reading', label: 'Reading Set List' },
        { section: 'Content', href: '/admin/content/new?kind=listening',label: 'New Listening Set' },
        { section: 'Content', href: '/admin/content/list?kind=listening',label: 'Listening Set List' },

        { section: 'Teacher Tools', href: '/teacher/home',      label: 'Teacher Home' },
        { section: 'Teacher Tools', href: '/teacher/tasks',     label: '할 일 관리' },
        { section: 'Teacher Tools', href: '/teacher/students',  label: '학생 관리' },
        { section: 'Teacher Tools', href: '/admin/homework',    label: '📷 숙제 채점 관리' },
        { section: 'Teacher Tools', href: '/teacher/home-mock', label: 'Teacher Home (Mock)' },

        { section: 'Lingo-X TOEFL', href: '/admin/landing',    label: 'Landing Editor' },
        { section: 'Lingo-X TOEFL', href: '/settings',         label: 'Settings' },
        { section: 'Admin',         href: '/admin/users',       label: '사용자 관리' },
      ];
    }

    // ── Teacher ───────────────────────────────────────────────
    if (role === 'teacher') {
      return [
        { section: '콘텐츠',  href: '/home',        label: 'Home' },
        { section: '콘텐츠',  href: '/vocab',       label: '단어 학습' },

        { section: '학생 관리', href: '/teacher/home',      label: 'Teacher Home' },
        { section: '학생 관리', href: '/teacher/tasks',     label: '할 일 관리' },
        { section: '학생 관리', href: '/teacher/students',  label: '학생 관리' },
        { section: '학생 관리', href: '/teacher/home-mock', label: 'Teacher Home (Mock)' },

        { section: '설정', href: '/settings', label: '설정' },
      ];
    }

    // ── Student: LingX ───────────────────────────────────────
    if (program === 'lingx') {
      return [
        { section: '내신', href: '/hi-naesin',        label: '내신 드릴' },
        { section: '내신', href: '/hi-naesin/stats',  label: '학습 현황' },
        { section: '내신', href: '/hi-naesin/review', label: '직전정리' },

        { section: '어휘', href: '/vocab', label: '단어 학습' },

        { section: '숙제', href: '/student/homework', label: '숙제 채점' },

        { section: '설정', href: '/settings', label: '설정' },
      ];
    }

    // ── Student: TOEFL / GAP ─────────────────────────────────
    if (program === 'toefl' || program === 'gap') {
      return [
        { section: '학습', href: '/reading-2026/study',   label: 'Reading' },
        { section: '학습', href: '/listening-2026/study', label: 'Listening' },
        { section: '학습', href: '/speaking-2026/study',  label: 'Speaking' },
        { section: '학습', href: '/writing-2026/study',   label: 'Writing' },
        { section: '학습', href: '/vocab',                  label: '단어 학습' },

        { section: '내 현황', href: '/student',              label: '대시보드' },
        { section: '내 현황', href: '/student/homework',   label: '숙제 채점' },
        { section: '내 현황', href: '/student/tests',      label: '시험 목록' },
        { section: '내 현황', href: '/student/review',     label: '복습' },
        { section: '내 현황', href: '/student/progress',   label: '진도 현황' },

        { section: '설정', href: '/settings', label: '설정' },
      ];
    }

    // ── Student: 미지정 (기존 계정 / 하위호환) ──────────────
    return [
      { section: '내 학습', href: '/student',           label: '대시보드' },
      { section: '내 학습', href: '/hi-naesin',         label: '내신 드릴' },
      { section: '내 학습', href: '/hi-naesin/stats',   label: '학습 현황' },
      { section: '내 학습', href: '/hi-naesin/review',  label: '직전정리' },
      { section: '내 학습', href: '/vocab',               label: '단어 학습' },
      { section: '내 학습', href: '/student/tests',     label: '시험 목록' },
      { section: '내 학습', href: '/student/review',    label: '복습' },
      { section: '내 학습', href: '/student/progress',  label: '진도 현황' },
      { section: '내 학습', href: '/student/homework',  label: '숙제' },

      { section: '학습 콘텐츠', href: '/home',                  label: 'Home' },
      { section: '학습 콘텐츠', href: '/reading-2026/study',   label: 'Reading 2026' },
      { section: '학습 콘텐츠', href: '/listening-2026/study', label: 'Listening 2026' },
      { section: '학습 콘텐츠', href: '/speaking-2026/study',  label: 'Speaking 2026' },
      { section: '학습 콘텐츠', href: '/writing-2026/study',   label: 'Writing 2026' },

      { section: '설정', href: '/settings', label: '설정' },
    ];
  }, [role, program]);

  // ── Group items by section (preserves insertion order) ──────
  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const it of items) {
      if (!map.has(it.section)) map.set(it.section, []);
      map.get(it.section)!.push(it);
    }
    return [...map.entries()] as [string, NavItem[]][];
  }, [items]);

  // ── Sidebar events ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setCollapsed((v) => !v);
    document.addEventListener('toggle-sidebar', handler);
    return () => document.removeEventListener('toggle-sidebar', handler);
  }, []);

  useEffect(() => {
    if (isExamRoute) setCollapsed(true);
  }, [isExamRoute]);

  // ── Legacy visibility: hide for program-assigned students ───
  const showLegacy = role !== 'student' || program === null;

  // ── Width ─────────────────────────────────────────────────────
  const widthClass = collapsed
    ? isExamRoute ? 'w-0 border-0' : 'w-14'
    : 'w-60';

  return (
    <div
      className={[
        'flex h-full flex-col bg-white transition-all duration-300',
        widthClass,
        !collapsed || !isExamRoute ? 'border-r border-neutral-100' : '',
      ].join(' ')}
    >
      <nav className="flex-1 overflow-y-auto py-3 text-sm">
        {groups.map(([section, list], idx) => {
          const open      = openSections[section] ?? true;
          const showItems = collapsed || open;

          return (
            <div key={section} className={['mb-1', idx > 0 ? 'mt-1' : ''].join(' ')}>
              {/* Section header */}
              <button
                type="button"
                onClick={() => !collapsed && toggleSection(section)}
                className={[
                  'flex w-full items-center justify-between px-4 pb-1 pt-3',
                  !collapsed ? 'hover:bg-emerald-50/60 rounded-md' : '',
                ].join(' ')}
              >
                <span
                  className={
                    collapsed
                      ? 'text-[10px] font-bold uppercase tracking-wider text-emerald-700'
                      : 'text-[11px] font-bold uppercase tracking-wider text-neutral-400'
                  }
                >
                  {collapsed ? collapsedLabel(section) : section}
                </span>
                {!collapsed && (
                  <span className="text-[10px] text-neutral-300">
                    {open ? '▴' : '▾'}
                  </span>
                )}
              </button>

              {/* Section items */}
              {showItems && (
                <ul className="mt-0.5">
                  {list.map((it, itemIdx) => {
                    const active = isActive(it.href);

                    if (it.disabled || !it.href) {
                      return (
                        <li key={`${section}-${it.label}-${itemIdx}`}>
                          <div
                            className={[
                              'flex items-center rounded-lg px-4 py-2 text-sm',
                              collapsed ? 'justify-center' : 'justify-between',
                              'border-l-2 border-transparent text-neutral-300',
                            ].join(' ')}
                          >
                            {!collapsed && (
                              <>
                                <span className="truncate">{it.label}</span>
                                <span className="text-[10px] text-neutral-200">soon</span>
                              </>
                            )}
                            {collapsed && (
                              <span aria-hidden className="h-1 w-5 rounded-full bg-neutral-200" />
                            )}
                          </div>
                        </li>
                      );
                    }

                    const linkClasses = [
                      'group flex items-center rounded-lg px-4 py-2 text-sm transition-colors',
                      'hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70',
                      collapsed ? 'justify-center' : 'justify-between',
                      'border-l-2',
                      active
                        ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-700'
                        : 'border-transparent text-neutral-700 hover:text-neutral-900',
                    ].join(' ');

                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          prefetch
                          aria-current={active ? 'page' : undefined}
                          className={linkClasses}
                        >
                          {!collapsed && (
                            <>
                              <span className="truncate">{it.label}</span>
                              <ChevronRight
                                className={[
                                  'h-3.5 w-3.5 shrink-0 transition-colors',
                                  active
                                    ? 'text-emerald-400'
                                    : 'text-neutral-200 group-hover:text-emerald-300',
                                ].join(' ')}
                              />
                            </>
                          )}
                          {collapsed && (
                            <span
                              aria-hidden
                              className={[
                                'h-1 w-5 rounded-full',
                                active ? 'bg-emerald-500' : 'bg-neutral-200',
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

        {/* Legacy — admin / teacher / unassigned student만 */}
        {showLegacy && (
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <button
              type="button"
              onClick={() => setLegacyOpen((v) => !v)}
              className={[
                'flex w-full items-center justify-between rounded-lg px-4 py-2',
                'text-[11px] font-bold uppercase tracking-wider text-neutral-400',
                'transition hover:bg-emerald-50/60',
              ].join(' ')}
            >
              <span>{collapsed ? 'L' : 'Legacy'}</span>
              {!collapsed && (
                <span className="text-[10px] text-neutral-300">
                  {legacyOpen ? '▴' : '▾'}
                </span>
              )}
            </button>

            {!collapsed && legacyOpen && (
              <ul className="mt-0.5">
                {LEGACY_ITEMS.map((it) => {
                  const active = isActive(it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        prefetch
                        aria-current={active ? 'page' : undefined}
                        className={[
                          'group flex items-center justify-between rounded-lg px-4 py-2 text-sm transition-colors',
                          'hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70',
                          'border-l-2',
                          active
                            ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-700'
                            : 'border-transparent text-neutral-700 hover:text-neutral-900',
                        ].join(' ')}
                      >
                        <span className="truncate">{it.label}</span>
                        <ChevronRight
                          className={[
                            'h-3.5 w-3.5 shrink-0 transition-colors',
                            active ? 'text-emerald-400' : 'text-neutral-200 group-hover:text-emerald-300',
                          ].join(' ')}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
