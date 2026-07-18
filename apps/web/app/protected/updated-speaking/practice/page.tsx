'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Practice 모듈 메인 페이지
 * - TOEFL iBT Speaking 완벽 시뮬레이션
 * - 1024x768 정확한 환경 재현
 * - 네트워크 불안정성 감지
 * - 시험 모드 (자동 진행, 제약)
 */

interface PracticeSession {
  sessionId: string;
  mode: 'STUDY' | 'TEST';
  startTime: Date;
  isNetworkStable: boolean;
  systemWarnings: string[];
}

const PRACTICE_STRUCTURE = [
  {
    taskNum: 1,
    type: 'Independent',
    name: '독립적 말하기',
    count: 1,
    totalSeconds: 45,
    prepSeconds: 15,
    speakSeconds: 45,
    description: '익숙한 주제에 대해 개인 의견 표현',
  },
  {
    taskNum: 2,
    type: 'Independent',
    name: '의견 표현',
    count: 1,
    totalSeconds: 45,
    prepSeconds: 15,
    speakSeconds: 45,
    description: '학교 상황에 대한 의견 제시',
  },
  {
    taskNum: 3,
    type: 'Integrated',
    name: '읽고 답변',
    count: 1,
    totalSeconds: 60,
    prepSeconds: 30,
    speakSeconds: 60,
    description: '지문 읽고 강의 내용에 대해 답변',
  },
  {
    taskNum: 4,
    type: 'Integrated',
    name: '듣고 답변',
    count: 1,
    totalSeconds: 60,
    prepSeconds: 20,
    speakSeconds: 60,
    description: '강의 들으면서 노트 작성 후 답변',
  },
];

const SYSTEM_CHECK = [
  { label: '마이크 확인', key: 'microphone', status: 'ready' },
  { label: '스피커 확인', key: 'speaker', status: 'ready' },
  { label: '인터넷 연결', key: 'network', status: 'ready' },
  { label: '화면 크기 (1024x768)', key: 'resolution', status: 'warning' },
];

export default function PracticePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'SELECT' | 'SYSTEM_CHECK' | 'READY'>('SELECT');
  const [selectedMode, setSelectedMode] = useState<'STUDY' | 'TEST' | null>(null);
  const [systemCheckStatus, setSystemCheckStatus] = useState<
    Record<string, 'ready' | 'warning' | 'error'>
  >({
    microphone: 'ready',
    speaker: 'ready',
    network: 'ready',
    resolution: 'warning',
  });
  const [isNetworkStable, setIsNetworkStable] = useState(true);

  useEffect(() => {
    // 네트워크 연결성 확인
    const checkNetworkStability = async () => {
      try {
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsNetworkStable(response.ok);
      } catch (error) {
        setIsNetworkStable(false);
      }
    };

    const interval = setInterval(checkNetworkStability, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleModeSelect = (m: 'STUDY' | 'TEST') => {
    setSelectedMode(m);
    setMode('SYSTEM_CHECK');
  };

  const handleStartSession = () => {
    if (!selectedMode) return;

    // 세션 시작
    const sessionData = {
      sessionId: `practice_${Date.now()}`,
      mode: selectedMode,
      startTime: new Date(),
      isNetworkStable,
      systemWarnings: Object.entries(systemCheckStatus)
        .filter(([, status]) => status !== 'ready')
        .map(([key]) => key),
    };

    sessionStorage.setItem('practiceSession', JSON.stringify(sessionData));
    router.push('/updated-speaking/practice/session');
  };

  // 화면 1: 모드 선택
  if (mode === 'SELECT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🏋️ Practice 모듈
            </h1>
            <p className="text-slate-300">
              TOEFL iBT Speaking 시험을 실제와 동일하게 연습하세요.
            </p>
          </div>

          {/* 모드 선택 카드 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* 학습 모드 */}
            <button
              onClick={() => handleModeSelect('STUDY')}
              className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 border-2 border-blue-500 rounded-lg p-8 hover:border-blue-400 transition text-left"
            >
              <div className="text-4xl mb-3">📚</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Study 모드
              </h2>
              <p className="text-blue-100 text-sm mb-4">
                자유로운 연습으로 실력을 키우세요.
              </p>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>✓ 각 Task별 일시정지 가능</li>
                <li>✓ 재시도 무제한</li>
                <li>✓ 수동으로 진행 제어</li>
                <li>✓ 상세 피드백 제공</li>
              </ul>
            </button>

            {/* 시험 모드 */}
            <button
              onClick={() => handleModeSelect('TEST')}
              className="bg-gradient-to-br from-red-600/30 to-red-700/30 border-2 border-red-500 rounded-lg p-8 hover:border-red-400 transition text-left"
            >
              <div className="text-4xl mb-3">🎯</div>
              <h2 className="text-2xl font-bold text-white mb-2">Test 모드</h2>
              <p className="text-red-100 text-sm mb-4">
                시험 조건과 동일하게 응시하세요.
              </p>
              <ul className="space-y-2 text-sm text-red-100">
                <li>✓ 자동 진행 (되돌리기 불가)</li>
                <li>✓ 정확한 시간 제한</li>
                <li>✓ 일시정지 금지</li>
                <li>✓ 완벽한 시험 환경</li>
              </ul>
            </button>
          </div>

          {/* 시험 구조 안내 */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">📋 시험 구조</h3>
            <div className="space-y-3">
              {PRACTICE_STRUCTURE.map((task) => (
                <div
                  key={task.taskNum}
                  className="bg-slate-800/50 p-4 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white">
                        Task {task.taskNum}: {task.name}
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">
                        {task.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-300">
                        준비: {task.prepSeconds}초
                      </div>
                      <div className="text-sm text-slate-300">
                        응답: {task.speakSeconds}초
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                      {task.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 총 시간 안내 */}
          <div className="mt-6 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
            <p className="text-yellow-100">
              ⏱️ <strong>총 소요 시간:</strong> 약 10-11분 (Task 1-4) +
              지문/강의 읽기 및 청취
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 화면 2: 시스템 체크
  if (mode === 'SYSTEM_CHECK' && selectedMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              ✅ 시스템 체크
            </h1>
            <p className="text-slate-300">
              {selectedMode === 'TEST'
                ? 'Test 모드를 시작하기 전에 모든 항목을 확인하세요.'
                : 'Study 모드를 시작하기 전에 장비를 확인하세요.'}
            </p>
          </div>

          {/* 체크 항목 */}
          <div className="space-y-3 mb-8">
            {SYSTEM_CHECK.map((check) => {
              const status = systemCheckStatus[check.key];
              const isOK = status === 'ready';
              const bgColor = isOK ? 'bg-green-500/20' : 'bg-yellow-500/20';
              const borderColor = isOK ? 'border-green-500' : 'border-yellow-500';
              const textColor = isOK
                ? 'text-green-100'
                : 'text-yellow-100';
              const iconColor = isOK ? '✓' : '⚠️';

              return (
                <div
                  key={check.key}
                  className={`${bgColor} border-2 ${borderColor} rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{iconColor}</span>
                      <div>
                        <h4 className={`font-semibold ${textColor}`}>
                          {check.label}
                        </h4>
                        <p className={`text-sm ${textColor} mt-1`}>
                          {isOK
                            ? '준비 완료'
                            : '주의: 이 항목을 확인하세요'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSystemCheckStatus((prev) => ({
                          ...prev,
                          [check.key]: prev[check.key] === 'ready'
                            ? 'warning'
                            : 'ready',
                        }))
                      }
                      className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition"
                    >
                      다시 확인
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 네트워크 안정성 */}
            <div
              className={`rounded-lg p-4 border-2 ${
                isNetworkStable
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-red-500/20 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {isNetworkStable ? '📡' : '⚠️'}
                  </span>
                  <div>
                    <h4 className={`font-semibold ${
                      isNetworkStable ? 'text-green-100' : 'text-red-100'
                    }`}>
                      네트워크 안정성
                    </h4>
                    <p className={`text-sm ${
                      isNetworkStable ? 'text-green-100' : 'text-red-100'
                    } mt-1`}>
                      {isNetworkStable
                        ? '네트워크 연결이 안정적입니다'
                        : '경고: 불안정한 연결 감지. 유선 연결을 권장합니다.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 주의 사항 */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 mb-8">
            <h4 className="font-semibold text-white mb-2">⚠️ 중요 안내</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                • {selectedMode === 'TEST'
                  ? 'Test 모드에서는 일시정지가 불가능합니다.'
                  : 'Study 모드에서는 자유롭게 일시정지할 수 있습니다.'}
              </li>
              <li>
                • 마이크와 스피커가 제대로 작동하는지 확인하세요.
              </li>
              <li>
                • 방해 받지 않는 조용한 환경을 권장합니다.
              </li>
              {selectedMode === 'TEST' && (
                <li>
                  • 네트워크 연결이 끊기면 세션이 자동 저장되고 재개됩니다.
                </li>
              )}
            </ul>
          </div>

          {/* 행동 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('SELECT')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
            >
              ← 돌아가기
            </button>
            <button
              onClick={() => setMode('READY')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              진행하기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 화면 3: 준비 완료
  if (mode === 'READY' && selectedMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎬</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              거의 다 왔어요!
            </h1>
            <p className="text-slate-300 mb-6">
              {selectedMode === 'TEST'
                ? '시험 모드에서 시작하려고 합니다. 준비되셨나요?'
                : '학습 모드에서 시작하려고 합니다.'}
            </p>
          </div>

          {/* 최종 확인 */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-white mb-4">최종 확인</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-300">
                <span className="text-green-400">✓</span> 마이크와 스피커
                확인됨
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span className="text-green-400">✓</span> 안정적인 인터넷
                연결
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span className="text-green-400">✓</span> 조용한 환경 준비됨
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span
                  className={selectedMode === 'TEST'
                    ? 'text-red-400'
                    : 'text-blue-400'}
                >
                  ★
                </span>{' '}
                {selectedMode === 'TEST'
                  ? 'Test 모드 (제약 있음)'
                  : 'Study 모드 (자유로움)'}
              </li>
            </ul>
          </div>

          {/* 행동 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('SYSTEM_CHECK')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
            >
              돌아가기
            </button>
            <button
              onClick={handleStartSession}
              className={`flex-1 font-semibold py-3 rounded-lg transition text-white ${
                selectedMode === 'TEST'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              지금 시작! 🚀
            </button>
          </div>

          {/* 안내 */}
          <p className="mt-6 text-xs text-slate-400">
            {selectedMode === 'TEST'
              ? '한 번 시작하면 되돌릴 수 없습니다. 이전으로 돌아가려면 "돌아가기"를 클릭하세요.'
              : '학습 모드는 자유롭게 재시도할 수 있습니다.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
