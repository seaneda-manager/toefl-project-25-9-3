'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  return (
    // ✅ 화면 전체를 100vh로, 중앙 정렬
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-semibold mb-6">로그인</h1>

        {/* 학생 / 선생님 */}
        <div className="flex items-center gap-6 mb-5">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-blue-600"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            <span>학생</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-blue-600"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            <span>선생님</span>
          </label>
        </div>

        {/* ✅ 무조건 그리드로 강제 (왼쪽: 아이디/비번 수직, 오른쪽: 버튼) */}
        <form
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px',
            gridTemplateRows: 'auto auto',
            gap: '12px',
            alignItems: 'stretch',
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          {/* 아이디 */}
          <input
            name="id"
            placeholder="아이디"
            autoComplete="username"
            className="border rounded-lg px-4 py-3 w-full"
          />

          {/* 로그인 버튼 (2칸 높이) */}
          <button
            type="submit"
            style={{ gridRow: '1 / span 2', gridColumn: '2', height: '100%' }}
            className="bg-blue-600 text-white font-semibold rounded-lg px-6 hover:bg-blue-700 active:bg-blue-800 transition"
          >
            로그인
          </button>

          {/* 비밀번호 */}
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            className="border rounded-lg px-4 py-3 w-full"
          />
        </form>

        {/* 아이디 저장 */}
        <div className="mt-4 flex items-center gap-2">
          <input id="saveId" type="checkbox" className="accent-blue-600" />
          <label htmlFor="saveId">아이디 저장</label>
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 text-gray-600 flex gap-3 text-sm">
          <a href="#" className="hover:underline">아이디 찾기</a><span>|</span>
          <a href="#" className="hover:underline">비밀번호 찾기</a><span>|</span>
          <a href="#" className="hover:underline">회원가입</a>
        </div>
      </div>
    </div>
  );
}
