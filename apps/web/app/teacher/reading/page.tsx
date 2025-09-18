'use client';
import { useEffect, useRef } from 'react';

export default function TeacherReadingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onLoad = () => {
      const w = iframeRef.current?.contentWindow;
      const d = w?.document;
      if (!w || !d) return;

      // 1) 섹션 라디오값을 리딩으로 맞춰둠 (선택)
      try {
        const radio = d.querySelector<HTMLInputElement>('input[name="section"][value="reading"]');
        if (radio) radio.checked = true;
      } catch {}

      // 2) 바로 Teacher Reading 뷰를 강제로 표시 (핵심)
      try {
        d.querySelectorAll<HTMLElement>('.view').forEach(v => (v.style.display = 'none'));
        const target = d.getElementById('teacherReadingView') as HTMLElement | null;
        if (target) target.style.display = 'block';
      } catch (e) {
        console.warn('[teacher/reading] force show failed', e);
      }

      // 3) (선택) TPO pill에 표시값 동기화
      try {
        const sel = d.getElementById('tpoSelect') as HTMLSelectElement | null;
        const tpo = sel?.value || 'TPO 1';
        ['pillTpoR','pillTpoL','pillTpoS','pillTpoW','pillTpoReview'].forEach(id => {
          const el = d.getElementById(id);
          if (el) el.textContent = tpo;
        });
      } catch {}
    };

    const el = iframeRef.current;
    el?.addEventListener('load', onLoad);
    return () => el?.removeEventListener('load', onLoad);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="/legacy/teacher-combined.html"
      title="Teacher Reading (legacy)"
      style={{ width: '100%', height: '100vh', border: 0, background: '#fff' }}
    />
  );
}
