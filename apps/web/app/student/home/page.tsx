// apps/web/app/student/home/page.tsx
'use client';
import Link from 'next/link';

export default function StudentHome() {
  return (
    <main style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
      <h1>Student Home</h1>
      <p>?숈깮 ??쒕낫??(以鍮?以? ?슙</p>
      <ul style={{ listStyle: 'inside' }}>
        <li><Link href="/">硫붿씤?쇰줈</Link></li>
        <li><Link href="/teacher/reading">Reading (?뚯뒪??UI)</Link></li>
      </ul>
    </main>
  );
}

