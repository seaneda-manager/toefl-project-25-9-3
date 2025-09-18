// apps/web/app/student/home/page.tsx
'use client';
import Link from 'next/link';

export default function StudentHome() {
  return (
    <main style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
      <h1>Student Home</h1>
      <p>학생 대시보드 (준비 중) 🚧</p>
      <ul style={{ listStyle: 'inside' }}>
        <li><Link href="/">메인으로</Link></li>
        <li><Link href="/teacher/reading">Reading (테스트 UI)</Link></li>
      </ul>
    </main>
  );
}
