// apps/web/components/HomeSelector.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Section = 'reading' | 'listening' | 'speaking' | 'writing';
type Mode = 'study' | 'test';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'reading', label: 'Reading' },
  { id: 'listening', label: 'Listening' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'writing', label: 'Writing' },
];

export default function HomeSelector() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('reading');
  const [mode, setMode] = useState<Mode>('study');
  const [tpoSet, setTpoSet] = useState<'tpo1' | 'tpo2'>('tpo1'); // 나중에 실제 세트랑 연결

  const go = (path: string) => router.push(path);

  const handleStart = () => {
    if (mode === 'study') {
      if (section === 'reading') go('/reading-2026/study');
      else if (section === 'listening') go('/listening_2026/study');
      else if (section === 'speaking') go('/speaking_2026/listen-and-repeat');
      else if (section === 'writing') go('/writing_2026/study');
      else alert('알 수 없는 섹션입니다.');
    } else {
      if (section === 'reading') go('/reading-2026/test');
      else if (section === 'listening') go('/listening_2026/test');
      else if (section === 'speaking') alert('Speaking test UI는 준비 중입니다.');
      else if (section === 'writing') alert('Writing test UI는 준비 중입니다.');
      else alert('알 수 없는 섹션입니다.');
    }
  };

  const handleTeacherMode = () => {
    if (section === 'reading') go('/teacher/reading');
    else if (section === 'listening') go('/teacher/listening');
    else if (section === 'speaking') alert('Speaking Teacher UI는 준비 중입니다.');
    else if (section === 'writing') alert('Writing Teacher UI는 준비 중입니다.');
    else alert('알 수 없는 섹션입니다.');
  };

  return (
    <div className="flex justify-center">
      <div className="mt-10 w-full max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">TOEFL iBT 2026 – Admin Home</h1>
        <p className="mb-6 text-sm text-neutral-600">
          연습하고 싶은 영역과 모드를 선택한 뒤 <span className="font-medium">Start</span>를 눌러 주세요.
        </p>

        {/* TPO SET (지금은 형식용) */}
        <div className="mb-4 space-y-1 text-sm">
          <div className="font-medium text-neutral-800">TPO SET</div>
          <select
            className="mt-1 w-60 rounded-md border px-3 py-1.5 text-sm"
            value={tpoSet}
            onChange={(e) => setTpoSet(e.target.value as 'tpo1' | 'tpo2')}
          >
            <option value="tpo1">TPO SET 1 (Demo)</option>
            <option value="tpo2">TPO SET 2 (Demo)</option>
          </select>
        </div>

        {/* SECTION 선택 */}
        <div className="mb-4 space-y-1 text-sm">
          <div className="font-medium text-neutral-800">SECTION</div>
          <div className="flex flex-wrap gap-4">
            {SECTIONS.map((s) => (
              <label key={s.id} className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="section"
                  value={s.id}
                  checked={section === s.id}
                  onChange={() => setSection(s.id)}
                  className="h-4 w-4"
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* MODE 선택 */}
        <div className="mb-6 space-y-1 text-sm">
          <div className="font-medium text-neutral-800">MODE</div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="mode"
                value="study"
                checked={mode === 'study'}
                onChange={() => setMode('study')}
                className="h-4 w-4"
              />
              <span>Study</span>
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="mode"
                value="test"
                checked={mode === 'test'}
                onChange={() => setMode('test')}
                className="h-4 w-4"
              />
              <span>Test</span>
            </label>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Start
          </button>
          <button
            type="button"
            onClick={handleTeacherMode}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Start Teacher Mode
          </button>

          <span className="text-xs text-neutral-500">
            * Legacy 버전은 왼쪽 사이드바의 Legacy 메뉴에서 들어갈 수 있습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
