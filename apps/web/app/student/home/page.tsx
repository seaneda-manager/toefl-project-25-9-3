// apps/web/app/student/home/page.tsx
'use client';
import Link from 'next/link';

export default function StudentHome() {
  return (
    <main style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
      <h1>Student Home</h1>
      <p>?™ìƒ ?€?œë³´??(ì¤€ë¹?ì¤? ?š§</p>
      <ul style={{ listStyle: 'inside' }}>
        <li><Link href="/">ë©”ì¸?¼ë¡œ</Link></li>
        <li><Link href="/teacher/reading">Reading (?ŒìŠ¤??UI)</Link></li>
      </ul>
    </main>
  );
}

