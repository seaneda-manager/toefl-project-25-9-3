// apps/web/components/HomeSelector.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Section = 'reading' | 'listening' | 'speaking' | 'writing';
type Mode = 'study' | 'test';

type StartPayload = { tpo: string; section: string; mode: string };
type TeacherPayload = { section: string };

export default function HomeSelector({
  onStart,
  onTeacher,
}: {
  onStart: (v: StartPayload) => void;
  onTeacher: (v: TeacherPayload) => void;
}) {
  // ---- 초기값을 렌더 시 한 번만 계산(이펙트에서 setState 금지) ----
  const [prefs, setPrefs] = useState<{
    tpo: string;
    section: Section;
    mode: Mode;
  }>(() => {
    if (typeof window === 'undefined') {
      return { tpo: 'TPO 1', section: 'reading', mode: 'study' };
    }
    const raw = window.localStorage.getItem('home_prefs');
    if (!raw) return { tpo: 'TPO 1', section: 'reading', mode: 'study' };
    try {
      const p = JSON.parse(raw) as Partial<{
        tpo: string;
        section: Section;
        mode: Mode;
      }>;
      return {
        tpo: p.tpo || 'TPO 1',
        section: (p.section as Section) || 'reading',
        mode: (p.mode as Mode) || 'study',
      };
    } catch {
      return { tpo: 'TPO 1', section: 'reading', mode: 'study' };
    }
  });

  // ---- 변경사항만 저장 (이펙트에서 setState 호출 없음) ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('home_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const tpoOptions = useMemo(
    () => Array.from({ length: 60 }, (_, i) => `TPO ${i + 1}`),
    []
  );

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: 20,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <h2>Home</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label>
            <strong>TPO SET</strong>
          </label>
          <select
            value={prefs.tpo}
            onChange={(e) => setPrefs((p) => ({ ...p, tpo: e.target.value }))}
          >
            {tpoOptions.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            <strong>SECTION</strong>
          </label>
          {(['reading', 'listening', 'speaking', 'writing'] as Section[]).map(
            (s) => (
              <label key={s} style={{ marginRight: 12 }}>
                <input
                  type="radio"
                  name="section"
                  value={s}
                  checked={prefs.section === s}
                  onChange={() => setPrefs((p) => ({ ...p, section: s }))}
                />{' '}
                {s}
              </label>
            )
          )}
        </div>

        <div>
          <label>
            <strong>MODE</strong>
          </label>
          {(['study', 'test'] as Mode[]).map((m) => (
            <label key={m} style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={prefs.mode === m}
                onChange={() => setPrefs((p) => ({ ...p, mode: m }))}
              />{' '}
              {m}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() =>
              onStart({
                tpo: prefs.tpo,
                section: prefs.section,
                mode: prefs.mode,
              })
            }
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => onTeacher({ section: prefs.section })}
          >
            Teacher Mode
          </button>
        </div>
      </div>
    </div>
  );
}
