// normalized utf8
// apps/web/app/student/home/page.tsx
'use client';
import Link from 'next/link';

export default function StudentHome() {
  return (
    <main style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
      <h1>Student Home</h1>
      <p>?占쎌깮 ?占?占쎈낫??(以占?占? ?占쏙옙</p>
      <ul style={{ listStyle: 'inside' }}>
        <li><Link href="/">硫붿씤?占쎈줈</Link></li>
        <li><Link href="/teacher/reading">Reading (?占쎌뒪??UI)</Link></li>
      </ul>
    </main>
  );
}



