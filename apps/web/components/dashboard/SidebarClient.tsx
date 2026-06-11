'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

type Role    = 'student' | 'teacher' | 'admin';
type Program = 'gap' | 'toefl' | 'lexiox' | null;
type Props   = { role: Role; program?: Program };

// ── Section type: all section keys used across roles ─────────────
type NavSection =
  // Admin
  | '대시보드' | 'TOEFL' | '내신관리' | 'Jr.' | '어휘관리' | '선생님 도구' | '시스템'
  // Teacher
  | '콘텐츠' | '학생 관리'
  // Student — program-specific
  | '내신' | 'Hi-내신' | '어휘' | '숙제'   // lingx
  | '학습' | '내 현황'          // toefl / gap
  | '내 학습' | '학습 콘텐츠'   // unassigned (legacy)
  // Shared
  | '설정';

// ── 한/영 섹션 라벨 매핑 ─────────────────────────────────────────
const SECTION_EN: Record<NavSection, string> = {
  '대시보드': 'Dashboard',
  'TOEFL': 'TOEFL',
  '내신관리': 'Naesin',
  'Jr.': 'Jr.',
  '어휘관리': 'Vocab',
  '콘텐츠': 'Content',

  '선생님 도구': 'Teacher',
  '시스템': 'System',
  '학생 관리': 'Students',
  '내신': 'Naesin',
  'Hi-내신': 'Hi-Naesin',
  '어휘': 'Vocab',
  '숙제': 'Homework',
  '학습': 'Study',
  '내 현황': 'My Progress',
  '내 학습': 'My Learning',
  '학습 콘텐츠': 'Content',
  '설정': 'Settings',
};

// ── Admin section → group label (for visual grouping) ────────────
const SECTION_GROUP: Record<string, string> = {
  'TOEFL':       'CONTENT',
  '내신관리':    'CONTENT',
  'Jr.':         'CONTENT',
  '어휘관리':    'CONTENT',
  '선생님 도구': 'TEACHER',
  '시스템':      'SYSTEM',
};

type SkillColor = 'reading' | 'listening' | 'speaking' | 'writing';

type NavItem = {
  section: NavSection;
  label: string;
  href?: string;
  disabled?: boolean;
  skill?: SkillColor;
};

// Shown only to admin / teacher / unassigned students
const LEGACY_ITEMS = [
  { href: '/admin/content/new?kind=reading',    label: 'Reading 세트 추가' },
  { href: '/admin/content/list?kind=reading',   label: 'Reading 세트 목록' },
  { href: '/admin/content/new?kind=listening',  label: 'Listening 세트 추가' },
  { href: '/admin/content/list?kind=listening', label: 'Listening 세트 목록' },
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
    '대시보드': 'D', 'TOEFL': 'TF', '내신관리': 'N',
    'Jr.': 'Jr', '어휘관리': 'V', '콘텐츠 허브': '콘', '선생님 도구': 'T', '시스템': 'S',
    '학생 관리': '관',
    '내신': '내', 'Hi-내신': 'Hi', '어휘': '어', '숙제': '숙', '학습': '학', '내 현황': '현',
    '내 학습': '나', '학습 콘텐츠': '콘',
    '설정': '설',
  };
  return map[section] ?? section.slice(0, 1);
}

// ── Section color themes ─────────────────────────────────────────
type SectionTheme = {
  header: string;       // 섹션 헤더 텍스트 색
  active: string;       // 활성 아이템 border+bg+text
  hover: string;        // hover 상태
  chevron: string;      // 활성 chevron 색
  dot: string;          // collapsed 활성 dot 색
};

const SECTION_THEME: Record<string, SectionTheme> = {
  '대시보드':     { header: 'text-slate-500',   active: 'border-slate-400   bg-slate-50   text-slate-700',   hover: 'hover:bg-slate-50   hover:text-slate-900',   chevron: 'text-slate-300',   dot: 'bg-slate-400'   },
  'TOEFL':        { header: 'text-blue-600',    active: 'border-blue-400    bg-blue-50    text-blue-700',    hover: 'hover:bg-blue-50    hover:text-blue-900',    chevron: 'text-blue-300',    dot: 'bg-blue-400'    },
  '내신관리':     { header: 'text-emerald-600', active: 'border-emerald-400 bg-emerald-50 text-emerald-700', hover: 'hover:bg-emerald-50 hover:text-emerald-900', chevron: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Jr.':          { header: 'text-orange-500',  active: 'border-orange-400  bg-orange-50  text-orange-700',  hover: 'hover:bg-orange-50  hover:text-orange-900',  chevron: 'text-orange-300',  dot: 'bg-orange-400'  },
  '어휘관리':     { header: 'text-violet-600',  active: 'border-violet-400  bg-violet-50  text-violet-700',  hover: 'hover:bg-violet-50  hover:text-violet-900',  chevron: 'text-violet-300',  dot: 'bg-violet-400'  },
  '콘텐츠':       { header: 'text-sky-600',     active: 'border-sky-400     bg-sky-50     text-sky-700',     hover: 'hover:bg-sky-50     hover:text-sky-900',     chevron: 'text-sky-300',     dot: 'bg-sky-400'     },

  '선생님 도구':  { header: 'text-amber-600',   active: 'border-amber-400   bg-amber-50   text-amber-700',   hover: 'hover:bg-amber-50   hover:text-amber-900',   chevron: 'text-amber-300',   dot: 'bg-amber-400'   },
  '시스템':       { header: 'text-slate-500',   active: 'border-slate-400   bg-slate-50   text-slate-700',   hover: 'hover:bg-slate-50   hover:text-slate-900',   chevron: 'text-slate-300',   dot: 'bg-slate-400'   },
  '학생 관리':    { header: 'text-teal-600',    active: 'border-teal-400    bg-teal-50    text-teal-700',    hover: 'hover:bg-teal-50    hover:text-teal-900',    chevron: 'text-teal-300',    dot: 'bg-teal-400'    },
  '내신':         { header: 'text-emerald-600', active: 'border-emerald-400 bg-emerald-50 text-emerald-700', hover: 'hover:bg-emerald-50 hover:text-emerald-900', chevron: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Hi-내신':      { header: 'text-cyan-600',    active: 'border-cyan-400    bg-cyan-50    text-cyan-700',    hover: 'hover:bg-cyan-50    hover:text-cyan-900',    chevron: 'text-cyan-300',    dot: 'bg-cyan-400'    },
  '어휘':         { header: 'text-violet-600',  active: 'border-violet-400  bg-violet-50  text-violet-700',  hover: 'hover:bg-violet-50  hover:text-violet-900',  chevron: 'text-violet-300',  dot: 'bg-violet-400'  },
  '숙제':         { header: 'text-rose-500',    active: 'border-rose-400    bg-rose-50    text-rose-700',    hover: 'hover:bg-rose-50    hover:text-rose-900',    chevron: 'text-rose-300',    dot: 'bg-rose-400'    },
  '설정':         { header: 'text-neutral-500', active: 'border-neutral-400 bg-neutral-50 text-neutral-700', hover: 'hover:bg-neutral-50 hover:text-neutral-900', chevron: 'text-neutral-300', dot: 'bg-neutral-400' },
};

const DEFAULT_THEME: SectionTheme = {
  header: 'text-neutral-500',
  active: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  hover:  'hover:bg-emerald-50 hover:text-neutral-900',
  chevron:'text-emerald-400',
  dot:    'bg-emerald-500',
};

function getSectionTheme(section: string): SectionTheme {
  return SECTION_THEME[section] ?? DEFAULT_THEME;
}

// ── Skill color classes ───────────────────────────────────────────
const SKILL_ACTIVE: Record<SkillColor, string> = {
  reading:   'border-blue-400   bg-blue-50   text-blue-700',
  listening: 'border-violet-400 bg-violet-50 text-violet-700',
  speaking:  'border-orange-400 bg-orange-50 text-orange-700',
  writing:   'border-teal-400   bg-teal-50   text-teal-700',
};
const SKILL_HOVER: Record<SkillColor, string> = {
  reading:   'hover:bg-blue-50/60   hover:text-blue-800',
  listening: 'hover:bg-violet-50/60 hover:text-violet-800',
  speaking:  'hover:bg-orange-50/60 hover:text-orange-800',
  writing:   'hover:bg-teal-50/60   hover:text-teal-800',
};
const SKILL_CHEVRON: Record<SkillColor, string> = {
  reading:   'text-blue-300',
  listening: 'text-violet-300',
  speaking:  'text-orange-300',
  writing:   'text-teal-300',
};
const SKILL_DOT: Record<SkillColor, string> = {
  reading:   'bg-blue-400',
  listening: 'bg-violet-400',
  speaking:  'bg-orange-400',
  writing:   'bg-teal-400',
};


// ── Component ────────────────────────────────────────────────────
export default function SidebarClient({ role, program = null }: Props) {
  const pathnameRaw = usePathname() || '/';
  const pathname    = normalizePath(pathnameRaw);
  const { lang }    = useLang();

  const [collapsed, setCollapsed]   = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  // ── Initial open-section state ──────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (role === 'admin') {
      return {
        '대시보드': true, 'TOEFL': true, '내신관리': true,
        'Jr.': true, '어휘관리': true,
        '콘텐츠 허브': true, '선생님 도구': true, '시스템': true,
      };
    }
    if (role === 'teacher') {
      return { '콘텐츠': true, '학생 관리': true, '설정': true };
    }
    return {
      '내신': true, 'Hi-내신': true, '어휘': true,
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
        { section: '대시보드' as NavSection, href: '/admin', label: '대시보드' },

        { section: 'TOEFL' as NavSection, href: '/admin/content/reading-2026',    label: 'Reading' },
        { section: 'TOEFL' as NavSection, href: '/admin/content/listening/toefl', label: 'Listening' },
        { section: 'TOEFL' as NavSection, label: 'Writing',                        disabled: true },
        { section: 'TOEFL' as NavSection, href: '/admin/content/grammar-2026',    label: 'Grammar' },

        { section: '내신관리' as NavSection, href: '/admin/naesin',               label: '고등 드릴 관리' },
        { section: '내신관리' as NavSection, href: '/admin/hi-naesin/passages',   label: '고등 지문' },
        { section: '내신관리' as NavSection, href: '/admin/middle-naesin/units',  label: '중학 단원·드릴' },

        { section: 'Jr.' as NavSection, href: '/admin/content/listening/jr', label: 'Listening' },
        { section: 'Jr.' as NavSection, href: '/admin/naesin/passages',       label: '지문 관리' },
        { section: 'Jr.' as NavSection, label: '커리큘럼',                    disabled: true },

        { section: '어휘관리' as NavSection, href: '/admin/vocab/sets',        label: '단어 책 관리' },
        { section: '어휘관리' as NavSection, href: '/admin/vocab/words',        label: '단어 목록' },
        { section: '어휘관리' as NavSection, href: '/admin/vocab/words/import', label: '단어 가져오기' },
        { section: '어휘관리' as NavSection, href: '/admin/vocab/import',       label: 'CSV 업로드' },
        { section: '어휘관리' as NavSection, href: '/admin/vocab/Tracks',       label: '트랙 배포' },
        { section: '어휘관리' as NavSection, href: '/admin/vocab/progress',     label: '학생 진행 현황' },

        { section: '선생님 도구' as NavSection, href: '/teacher/home',             label: '선생님 홈' },
        { section: '선생님 도구' as NavSection, href: '/admin/students',           label: '학생 추가/관리' },
        { section: '선생님 도구' as NavSection, href: '/teacher/tasks',            label: '할 일 관리' },
        { section: '선생님 도구' as NavSection, href: '/teacher/students',         label: '학생 현황' },
        { section: '선생님 도구' as NavSection, href: '/teacher/reports/students', label: '활동 리포트' },
        { section: '선생님 도구' as NavSection, href: '/admin/homework',           label: '숙제 채점' },
        { section: '선생님 도구' as NavSection, href: '/admin/lectures',           label: '강의 관리' },

        { section: '시스템' as NavSection, href: '/admin/perks',    label: 'Perk 관리' },
        { section: '시스템' as NavSection, href: '/admin/users',   label: '사용자/권한' },
        { section: '시스템' as NavSection, href: '/admin/landing', label: '랜딩 페이지' },
        { section: '시스템' as NavSection, href: '/admin/settings', label: '설정' },
      ];
    }

    // ── Teacher ───────────────────────────────────────────────
    if (role === 'teacher') {
      return [
        { section: '콘텐츠',  href: '/home',  label: '홈' },
        { section: '콘텐츠',  href: '/vocab', label: '단어 학습' },

        { section: '학생 관리', href: '/teacher/home',     label: '선생님 홈' },
        { section: '학생 관리', href: '/teacher/tasks',    label: '할 일 관리' },
        { section: '학생 관리', href: '/teacher/students', label: '학생 현황' },

        { section: '설정', href: '/settings', label: '설정' },
      ];
    }

    // ── Student: LEXiOX ───────────────────────────────────────
    if (program === 'lexiox') {
      return [
        { section: 'Hi-내신', href: '/hi-naesin',        label: 'Hi-내신 드릴' },
        { section: 'Hi-내신', href: '/hi-naesin/stats',  label: '학습 현황' },
        { section: 'Hi-내신', href: '/hi-naesin/review', label: '직전정리' },

        { section: '내신' as NavSection, href: '/naesin/middle', label: '중학 내신 드릴' },

        { section: '학습', href: '/listening-2026/study', label: 'Listening', skill: 'listening' as SkillColor },
        { section: '학습', href: '/grammar-2026',          label: 'Grammar' },

        { section: '어휘', href: '/vocab', label: '단어 학습' },

        { section: '숙제', href: '/student/homework', label: '숙제 채점' },
        { section: '숙제', href: '/student/lectures', label: '🎬 강의' },

        { section: '설정', href: '/student/progress', label: '포인트 히스토리' },
        { section: '설정', href: '/student/perks',    label: 'Perk 샵' },
        { section: '설정', href: '/settings',         label: '설정' },
      ];
    }

    // ── Student: TOEFL / GAP ─────────────────────────────────
    if (program === 'toefl' || program === 'gap') {
      return [
        { section: '학습', href: '/reading-2026/study',   label: 'Reading',   skill: 'reading'   as SkillColor },
        { section: '학습', href: '/listening-2026/study', label: 'Listening', skill: 'listening' as SkillColor },
        { section: '학습', href: '/speaking-2026/study',  label: 'Speaking',  skill: 'speaking'  as SkillColor },
        { section: '학습', href: '/writing-2026/study',   label: 'Writing',   skill: 'writing'   as SkillColor },
        { section: '학습', href: '/grammar-2026',          label: 'LEXiOX-Gram' },
        { section: '학습', href: '/vocab',                 label: '단어 학습' },

        { section: '내 현황', href: '/student',            label: '대시보드' },
        { section: '내 현황', href: '/student/homework',   label: '숙제 채점' },
        { section: '내 현황', href: '/student/lectures',  label: '🎬 강의' },
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
      { section: '내 학습', href: '/vocab',              label: '단어 학습' },
      { section: '내 학습', href: '/student/tests',     label: '시험 목록' },
      { section: '내 학습', href: '/student/review',    label: '복습' },
      { section: '내 학습', href: '/student/progress',  label: '진도 현황' },
      { section: '내 학습', href: '/student/homework',  label: '숙제' },
      { section: '내 학습', href: '/student/lectures',  label: '🎬 강의' },

      { section: '학습 콘텐츠', href: '/home',                  label: 'Home' },
      { section: '학습 콘텐츠', href: '/reading-2026/study',   label: 'Reading',   skill: 'reading'   as SkillColor },
      { section: '학습 콘텐츠', href: '/listening-2026/study', label: 'Listening', skill: 'listening' as SkillColor },
      { section: '학습 콘텐츠', href: '/speaking-2026/study',  label: 'Speaking',  skill: 'speaking'  as SkillColor },
      { section: '학습 콘텐츠', href: '/writing-2026/study',   label: 'Writing',   skill: 'writing'   as SkillColor },

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
      <nav className="flex-1 overflow-y-auto py-2 text-sm">
        {groups.map(([section, list], idx) => {
          const open      = openSections[section] ?? true;
          const showItems = collapsed || open;
          const theme     = getSectionTheme(section);
          const groupLabel = SECTION_GROUP[section];
          const prevGroupLabel = idx > 0 ? SECTION_GROUP[groups[idx - 1][0]] : undefined;
          const showGroupHeader = !collapsed && groupLabel && groupLabel !== prevGroupLabel;

          return (
            <div key={section} className={['', idx > 0 ? 'mt-1 border-t border-neutral-100 pt-1' : ''].join(' ')}>
              {showGroupHeader && (
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {groupLabel}
                  </span>
                </div>
              )}
              {/* Section header */}
              <button
                type="button"
                onClick={() => !collapsed && toggleSection(section)}
                className={[
                  'flex w-full items-center justify-between px-3 py-2',
                  !collapsed ? 'hover:bg-neutral-50 rounded-lg' : 'justify-center',
                ].join(' ')}
              >
                {!collapsed ? (
                  <>
                    <span className={['text-xs font-bold tracking-wide', theme.header].join(' ')}>
                      {lang === 'en' ? (SECTION_EN[section as NavSection] ?? section) : section}
                    </span>
                    <span className={['text-xs font-medium', theme.header, 'opacity-50'].join(' ')}>
                      {open ? '▴' : '▾'}
                    </span>
                  </>
                ) : (
                  <span className={['text-[10px] font-bold uppercase tracking-widest', theme.header].join(' ')}>
                    {collapsedLabel(section)}
                  </span>
                )}
              </button>

              {/* Section items */}
              {showItems && (
                <ul className="mb-1">
                  {list.map((it, itemIdx) => {
                    const active = isActive(it.href);

                    if (it.disabled || !it.href) {
                      return (
                        <li key={`${section}-${it.label}-${itemIdx}`}>
                          <div
                            className={[
                              'flex items-center rounded-lg mx-2 px-3 py-1.5 text-sm',
                              collapsed ? 'justify-center' : 'justify-between',
                              'text-neutral-300',
                            ].join(' ')}
                          >
                            {!collapsed && (
                              <>
                                <span className="truncate text-neutral-300">{it.label.replace(' (soon)', '')}</span>
                                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">Soon</span>
                              </>
                            )}
                            {collapsed && (
                              <span aria-hidden className="h-1 w-4 rounded-full bg-neutral-200" />
                            )}
                          </div>
                        </li>
                      );
                    }

                    const skillActive  = active && it.skill ? SKILL_ACTIVE[it.skill]  : '';
                    const skillHover   = !active && it.skill ? SKILL_HOVER[it.skill]   : '';
                    const linkClasses = [
                      'group flex items-center rounded-lg mx-2 px-3 py-1.5 text-sm transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70',
                      collapsed ? 'justify-center' : 'justify-between',
                      active
                        ? it.skill
                          ? `${skillActive} font-semibold`
                          : `${theme.active} font-semibold`
                        : it.skill
                          ? `text-neutral-600 ${skillHover}`
                          : `text-neutral-600 ${theme.hover}`,
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
                                    ? it.skill ? SKILL_CHEVRON[it.skill] : theme.chevron
                                    : 'text-neutral-200 group-hover:text-neutral-300',
                                ].join(' ')}
                              />
                            </>
                          )}
                          {collapsed && (
                            <span
                              aria-hidden
                              className={[
                                'h-1 w-4 rounded-full',
                                active
                                  ? it.skill ? SKILL_DOT[it.skill] : theme.dot
                                  : 'bg-neutral-200',
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
