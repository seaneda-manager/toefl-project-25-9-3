'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Practice 세션 페이지
 * - Task 1-4 순차 진행
 * - 정확한 카운트다운 타이머
 * - 네트워크 불안정성 감지 및 자동 재개
 * - 상태 머신으로 엄격한 흐름 제어
 */

type SessionState = 'INTRO' | 'TASK_INTRO' | 'PREP' | 'SPEAKING' | 'TASK_COMPLETE' | 'COMPLETE' | 'PAUSED';
type TaskPhase = 'READING' | 'PREP_TIME' | 'SPEAKING_TIME' | 'COMPLETE';

interface TaskConfig {
  taskNum: number;
  name: string;
  description: string;
  prepSeconds: number;
  speakSeconds: number;
  hasReading: boolean;
  readingSeconds?: number;
}

const TASKS: TaskConfig[] = [
  {
    taskNum: 1,
    name: '독립적 말하기',
    description: '익숙한 주제에 대해 개인 의견 표현',
    prepSeconds: 15,
    speakSeconds: 45,
    hasReading: false,
  },
  {
    taskNum: 2,
    name: '의견 표현',
    description: '학교 상황에 대한 의견 제시',
    prepSeconds: 15,
    speakSeconds: 45,
    hasReading: false,
  },
  {
    taskNum: 3,
    name: '읽고 답변',
    description: '지문 읽고 강의 내용에 대해 답변',
    prepSeconds: 30,
    speakSeconds: 60,
    hasReading: true,
    readingSeconds: 45,
  },
  {
    taskNum: 4,
    name: '듣고 답변',
    description: '강의 들으면서 노트 작성 후 답변',
    prepSeconds: 20,
    speakSeconds: 60,
    hasReading: true,
    readingSeconds: 60,
  },
];

export default function PracticeSessionPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('INTRO');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskPhase, setTaskPhase] = useState<TaskPhase>('PREP_TIME');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isNetworkStable, setIsNetworkStable] = useState(true);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const currentTask = TASKS[currentTaskIndex];
  const isTestMode = true; // sessionStorage에서 가져올 수 있음

  // 네트워크 안정성 모니터링
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-store',
        });
        const wasUnstable = !isNetworkStable;
        setIsNetworkStable(response.ok);

        if (response.ok && wasUnstable) {
          setShowNetworkWarning(false);
          // 자동 재개
          if (sessionState === 'PAUSED') {
            resumeSession();
          }
        }
      } catch (error) {
        if (isNetworkStable) {
          setIsNetworkStable(false);
          setShowNetworkWarning(true);
          // 자동 일시정지
          if (sessionState !== 'PAUSED') {
            pauseSession();
          }
        }
      }
    };

    const interval = setInterval(checkNetwork, 2000);
    return () => clearInterval(interval);
  }, [isNetworkStable, sessionState]);

  // 타이머 로직
  useEffect(() => {
    if (sessionState === 'PAUSED' || sessionState === 'INTRO' || sessionState === 'COMPLETE') {
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    let initialTime = 0;
    if (taskPhase === 'PREP_TIME') {
      initialTime = currentTask.prepSeconds;
    } else if (taskPhase === 'SPEAKING_TIME') {
      initialTime = currentTask.speakSeconds;
    } else if (taskPhase === 'READING' && currentTask.readingSeconds) {
      initialTime = currentTask.readingSeconds;
    }

    setTimeRemaining(initialTime);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // 다음 단계로 진행
          if (taskPhase === 'READING') {
            setTaskPhase('PREP_TIME');
          } else if (taskPhase === 'PREP_TIME') {
            setTaskPhase('SPEAKING_TIME');
            startRecording();
          } else if (taskPhase === 'SPEAKING_TIME') {
            stopRecording();
            setTaskPhase('COMPLETE');
            setSessionState('TASK_COMPLETE');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, taskPhase, currentTask]);

  const startRecording = () => {
    setIsRecording(true);
    // 실제 MediaRecorder 시작 (더미)
  };

  const stopRecording = () => {
    setIsRecording(false);
    // 실제 MediaRecorder 종료 (더미)
  };

  const pauseSession = () => {
    setSessionState('PAUSED');
    if (timerRef.current) clearInterval(timerRef.current);
    stopRecording();
  };

  const resumeSession = () => {
    if (isNetworkStable) {
      setSessionState(sessionState === 'COMPLETE' ? 'COMPLETE' : 'TASK_INTRO');
    }
  };

  const handleNextTask = () => {
    if (currentTaskIndex < TASKS.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setTaskPhase('READING');
      setSessionState('TASK_INTRO');
    } else {
      setSessionState('COMPLETE');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getProgressPercent = () => {
    const total = currentTask.prepSeconds + currentTask.speakSeconds;
    const phaseTime =
      taskPhase === 'PREP_TIME'
        ? currentTask.prepSeconds
        : currentTask.speakSeconds;
    const elapsed = phaseTime - timeRemaining;
    return (elapsed / total) * 100;
  };

  // 화면 1: 세션 시작
  if (sessionState === 'INTRO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Practice 세션 시작
            </h1>
            <p className="text-slate-300 mb-6">
              {isTestMode
                ? 'Test 모드로 시작합니다. 시작하면 일시정지할 수 없습니다.'
                : 'Study 모드로 시작합니다. 자유롭게 일시정지할 수 있습니다.'}
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-white mb-4">🎤 마지막 확인</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✓ 마이크가 켜져 있나요?</li>
              <li>✓ 화면이 방해받지 않나요?</li>
              <li>✓ 인터넷 연결이 안정적인가요?</li>
              <li>✓ 충분한 시간이 있나요? (약 11분)</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/updated-speaking/practice')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
            >
              ← 돌아가기
            </button>
            <button
              onClick={() => {
                setSessionState('TASK_INTRO');
                setCurrentTaskIndex(0);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              시작! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 화면 2: 네트워크 오류
  if (showNetworkWarning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">📡</div>
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              네트워크 연결 끊김
            </h1>
            <p className="text-slate-300 mb-6">
              인터넷 연결이 끊어졌습니다. 연결을 복구한 후 자동으로 재개됩니다.
            </p>
          </div>

          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-8">
            <p className="text-red-100">
              ⏳ 자동 복구를 기다리는 중... (약 {(Math.random() * 10 + 5).toFixed(0)}초)
            </p>
          </div>

          <button
            onClick={() => {
              setShowNetworkWarning(false);
              resumeSession();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            연결 복구됨, 계속하기
          </button>
        </div>
      </div>
    );
  }

  // 화면 3: Task 소개
  if (sessionState === 'TASK_INTRO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-5xl mb-4">Task {currentTask.taskNum}</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentTask.name}
            </h1>
            <p className="text-slate-300 mb-6">{currentTask.description}</p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-white mb-4">⏱️ 시간 안내</h3>
            <div className="space-y-2 text-sm text-slate-300">
              {currentTask.readingSeconds && (
                <div>
                  📖 지문/강의: <strong>{currentTask.readingSeconds}초</strong>
                </div>
              )}
              <div>
                🤔 준비 시간: <strong>{currentTask.prepSeconds}초</strong>
              </div>
              <div>
                🎤 응답 시간: <strong>{currentTask.speakSeconds}초</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (currentTask.hasReading) {
                setTaskPhase('READING');
              } else {
                setTaskPhase('PREP_TIME');
              }
              setSessionState('TASK_INTRO');
              setTimeRemaining(
                currentTask.readingSeconds || currentTask.prepSeconds
              );
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            시작! 준비 시간: {currentTask.prepSeconds}초 →
          </button>
        </div>
      </div>
    );
  }

  // 화면 4: 세션 진행 (Prep/Speaking)
  if (
    sessionState === 'TASK_INTRO' ||
    sessionState === 'TASK_COMPLETE'
  ) {
    const isPrep = taskPhase === 'PREP_TIME' || taskPhase === 'READING';
    const isSpeaking = taskPhase === 'SPEAKING_TIME';
    const isComplete = taskPhase === 'COMPLETE';

    const bgGradient = isSpeaking
      ? 'from-red-900 to-red-800'
      : 'from-blue-900 to-blue-800';
    const borderColor = isSpeaking ? 'border-red-500' : 'border-blue-500';
    const timerColor = isSpeaking ? 'text-red-400' : 'text-blue-400';
    const phaseName =
      taskPhase === 'READING'
        ? '📖 지문 읽기'
        : taskPhase === 'PREP_TIME'
          ? '🤔 준비 시간'
          : '🎤 응답 시간';

    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
        {/* 헤더 */}
        <div className="bg-slate-900/50 border-b border-slate-700 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold">
                  Task {currentTask.taskNum}: {currentTask.name}
                </h2>
                <p className="text-sm text-slate-400">
                  {phaseName}
                </p>
              </div>
              {!isTestMode && (
                <button
                  onClick={pauseSession}
                  className="text-slate-400 hover:text-white transition"
                >
                  ⏸ 일시정지
                </button>
              )}
            </div>

            {/* 진행도 바 */}
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isSpeaking ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* 큰 타이머 */}
          <div className="text-center mb-12">
            <div className={`text-9xl font-bold font-mono ${timerColor} mb-6`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-slate-300 text-xl">{phaseName}</p>
          </div>

          {/* 작업 콘텐츠 */}
          <div className="bg-slate-800/50 border-2 border-slate-700 rounded-lg p-8 mb-8 min-h-96">
            {taskPhase === 'READING' && (
              <div>
                <h3 className="text-white font-semibold mb-4">
                  📖 지문을 읽으세요
                </h3>
                <div className="bg-slate-900 p-6 rounded text-slate-200 leading-relaxed">
                  <p>
                    The most important factor in learning a foreign language is
                    not the amount of time spent in the classroom, but rather
                    the quality of personal study outside the classroom. This
                    is because active engagement with the language through
                    reading, writing, and listening to authentic materials helps
                    students develop a deeper understanding of how the language
                    works.
                  </p>
                </div>
              </div>
            )}

            {taskPhase === 'PREP_TIME' && (
              <div>
                <h3 className="text-white font-semibold mb-4">
                  🤔 준비 시간
                </h3>
                <p className="text-slate-300 mb-4">
                  다음 질문에 답변할 준비를 하세요:
                </p>
                <div className="bg-slate-900 p-6 rounded text-slate-200">
                  <p className="font-semibold">
                    "What do you think is the most important factor in learning
                    a foreign language and why?"
                  </p>
                </div>
                <div className="mt-6 bg-blue-500/20 border border-blue-500 rounded p-4 text-blue-100">
                  <p>💡 준비 시간입니다. 노트를 작성하거나 답변을 계획하세요.</p>
                </div>
              </div>
            )}

            {taskPhase === 'SPEAKING_TIME' && (
              <div>
                <h3 className="text-white font-semibold mb-4">
                  🎤 응답 중입니다
                </h3>
                <div
                  className={`border-2 border-dashed rounded p-6 text-center ${
                    isRecording
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-600 bg-slate-700/20'
                  }`}
                >
                  <div className="text-4xl mb-3">
                    {isRecording ? '🔴' : '⭕'}
                  </div>
                  <p className="text-slate-300">
                    {isRecording
                      ? '녹음 중... 지금 말씀하세요.'
                      : '잠시 후 녹음이 시작됩니다.'}
                  </p>
                </div>
              </div>
            )}

            {taskPhase === 'COMPLETE' && (
              <div className="text-center">
                <div className="text-6xl mb-4">✓</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Task {currentTask.taskNum} 완료!
                </h3>
                <p className="text-slate-300">
                  {currentTaskIndex === TASKS.length - 1
                    ? '모든 Task가 완료되었습니다.'
                    : `다음 Task로 진행합니다.`}
                </p>
              </div>
            )}
          </div>

          {/* 다음 버튼 */}
          {isComplete && (
            <button
              onClick={handleNextTask}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              {currentTaskIndex === TASKS.length - 1
                ? '결과 보기 →'
                : `다음 Task →`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 화면 5: 세션 완료
  if (sessionState === 'COMPLETE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              모든 Task 완료!
            </h1>
            <p className="text-slate-300 mb-6">
              축하합니다. 전체 Practice 세션을 완료했습니다.
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-white mb-4">📊 세션 요약</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>완료한 Task:</span>
                <strong>4/4</strong>
              </div>
              <div className="flex justify-between">
                <span>총 소요 시간:</span>
                <strong>약 11분</strong>
              </div>
              <div className="flex justify-between">
                <span>녹음된 응답:</span>
                <strong>4개</strong>
              </div>
              <div className="flex justify-between">
                <span>다음 단계:</span>
                <strong>Review 분석</strong>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/updated-speaking/review')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              📊 분석 보기
            </button>
            <button
              onClick={() => router.push('/updated-speaking/practice')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
            >
              🏠 홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
