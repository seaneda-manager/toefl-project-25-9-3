// normalized utf8
// apps/web/app/student/home/page.tsx
'use client';
import Link from 'next/link';

export default function StudentHome() {
  return (
    <main style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
      <h1>Student Home</h1>
      <p>?�생 ?�?�보??(준�?�? ?��</p>
      <ul style={{ listStyle: 'inside' }}>
        <li><Link href="/">메인?�로</Link></li>
        <li><Link href="/teacher/reading">Reading (?�스??UI)</Link></li>
      </ul>
    </main>
  );
}

