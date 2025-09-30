'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TeacherTopTabs() {
  const pathname = usePathname();
  const active: 'admin' | 'content' = pathname.includes('/teacher/admin') ? 'admin' : 'content';

  const Tab = ({
    href,
    label,
    isActive,
  }: {
    href: string;
    label: string;
    isActive: boolean;
  }) => (
    <Link
      href={href}
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-sm border',
        isActive ? 'bg-black text-white border-black' : 'bg-white border-gray-300',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );

  return (
    <nav className="flex items-center gap-2">
      <Tab href="/teacher/admin" label="Administration" isActive={active === 'admin'} />
      <Tab href="/teacher/content" label="Contents Production" isActive={active === 'content'} />
    </nav>
  );
}

