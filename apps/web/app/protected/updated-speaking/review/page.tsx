'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDrillStore } from '../drill/_hooks/useDrillStore';
import { WaveformSync } from './_components/WaveformSync';

/**
 * Review 모듈 페이지
 * - 이전 세션의 결과 분석
 * - Waveform Sync로 오류 위치 파악
 * - 취약점별 추천 드릴
 */

interface SessionReview {
  sessionId: string;
  drillType: string;
  successRate: number;
  totalItems: number;
  correctAnswers: number;
  errorSummary: Record<string, number>;
  recommendations: Array<{
    drillType: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  }>;
}

const generateMockReviewData = (): SessionReview => {
  return {
    sessionId: 'drill_mock_001',
    drillType: 'STRESS',
    successRate: 65,
    totalItems: 10,
    correctAnswers: 6,
    errorSummary: {
      '2nd syllable stress': 4,
      'stress timing': 2,
      'vowel reduction': 3,
    },
    recommendations: [
      {
        drillType: 'STRESS',
        priority: 'HIGH',
        reason: '2음절 강세 위치를 놓치는 경향 (40%)',
      },
      {
        drillType: 'PHONEME',
        priority: 'MEDIUM',
        reason: '모음 감소(schwa) 표현 부족',
      },
      {
        drillType: 'FLUENCY',
        priority: 'LOW',
        reason: '음절 간 간격이 긴 경우 있음',
      },
    ],
  };
};

export default function ReviewPage() {
  const router = useRouter();
  const { currentSession } = useDrillStore();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const reviewData = useMemo(() => generateMockReviewData(), []);

  const tabs = [
    { label: '📊 분석', id: 'analysis' },
    { label: '🎙️ Waveform', id: 'waveform' },
    { label: '🎯 추천 드릴', id: 'recommendations' },
  ];

  // 더미 오류 맵 데이터
  const errorMap = [
    {
      timeStart: 0.2,
      timeEnd: 0.5,
      errorType: '2nd syllable stress',
      severity: 'HIGH' as const,
    },
    {
      timeStart: 1.2,
      timeEnd: 1.5,
      errorType: 'stress timing',
      severity: 'MEDIUM' as const,
    },
  ];

  // 더미 타임스탬프 데이터
  const timestamps = [
    { word: 'en', start: 0.0, end: 0.2 },
    { word: 'VAIR', start: 0.2, end: 0.5 },
    { word: 'on', start: 0.5, end: 0.7 },
    { word: 'mul', start: 0.7, end: 0.9 },
    { word: 'tul', start: 0.9, end: 1.1 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition mb-4"
          >
            ← 돌아가기
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            📊 세션 분석 (Review)
          </h1>
          <p className="text-slate-300">
            {reviewData.drillType} 드릴 결과를 분석하고 추천받으세요.
          </p>
        </div>

        {/* 주요 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {reviewData.correctAnswers}/{reviewData.totalItems}
            </div>
            <div className="text-sm text-slate-400 mt-2">정답/총문제</div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {reviewData.successRate}%
            </div>
            <div className="text-sm text-slate-400 mt-2">성공률</div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {Object.keys(reviewData.errorSummary).length}
            </div>
            <div className="text-sm text-slate-400 mt-2">오류 유형</div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-400">
              {reviewData.totalItems - reviewData.correctAnswers}
            </div>
            <div className="text-sm text-slate-400 mt-2">오답</div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 bg-slate-800 rounded-lg p-2">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTabIndex(idx)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedTabIndex === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 1: 분석 */}
        {selectedTabIndex === 0 && (
          <div className="space-y-6">
            <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">📈 오류 분석</h3>
              <div className="space-y-3">
                {Object.entries(reviewData.errorSummary).map(
                  ([errorType, count]) => {
                    const severity =
                      count >= 3 ? 'HIGH' : count >= 2 ? 'MEDIUM' : 'LOW';
                    const bgColor =
                      severity === 'HIGH'
                        ? 'bg-red-500/20'
                        : severity === 'MEDIUM'
                          ? 'bg-yellow-500/20'
                          : 'bg-blue-500/20';
                    const borderColor =
                      severity === 'HIGH'
                        ? 'border-red-400'
                        : severity === 'MEDIUM'
                          ? 'border-yellow-400'
                          : 'border-blue-400';

                    return (
                      <button
                        key={errorType}
                        onClick={() =>
                          setExpandedError(
                            expandedError === errorType ? null : errorType
                          )
                        }
                        className={`
                          w-full p-4 rounded-lg text-left transition border
                          ${bgColor} ${borderColor}
                          hover:opacity-80
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {errorType}
                            </p>
                            <p className="text-sm text-slate-300 mt-1">
                              발생 횟수: {count}회
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                              {((count / reviewData.totalItems) * 100).toFixed(
                                0
                              )}
                              %
                            </div>
                            <div className="text-xs text-slate-400">
                              {severity === 'HIGH'
                                ? '높음'
                                : severity === 'MEDIUM'
                                  ? '중간'
                                  : '낮음'}
                            </div>
                          </div>
                        </div>

                        {/* 확장 상세 */}
                        {expandedError === errorType && (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <div className="bg-slate-800/50 p-3 rounded text-sm space-y-2">
                              <p className="text-slate-300">
                                💡 {errorType}란 무엇인가요?
                              </p>
                              <p className="text-slate-400">
                                {errorType === '2nd syllable stress'
                                  ? '단어의 두 번째 음절에 강세를 주지 못하는 오류입니다.'
                                  : errorType === 'stress timing'
                                    ? '강세를 주는 타이밍이 부자연스러운 오류입니다.'
                                    : '모음이 약해지거나 사라지는 현상을 놓치는 오류입니다.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: Waveform Sync */}
        {selectedTabIndex === 1 && (
          <div className="space-y-6">
            <WaveformSync
              originalAudioUrl="/audio/environmental-original.mp3"
              userAudioUrl="/audio/environmental-user.mp3"
              errorMap={errorMap}
              transcript="environmental"
              timestamps={timestamps}
            />

            {/* 분석 설명 */}
            <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                📝 분석 가이드
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="text-red-400 font-bold">높음</div>
                  <p className="text-slate-300">
                    발음에 심각한 오류가 있어 의사소통에 방해가 될 수 있습니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="text-yellow-400 font-bold">중간</div>
                  <p className="text-slate-300">
                    명확하지 않은 부분이 있으나 개선 가능합니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="text-blue-400 font-bold">낮음</div>
                  <p className="text-slate-300">
                    거의 완벽하나 세밀한 개선의 여지가 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 추천 드릴 */}
        {selectedTabIndex === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🎯 추천 액션 플랜
              </h3>
              <div className="space-y-3">
                {reviewData.recommendations.map((rec, idx) => {
                  const priorityColor =
                    rec.priority === 'HIGH'
                      ? 'bg-red-500/20 border-red-400'
                      : rec.priority === 'MEDIUM'
                        ? 'bg-yellow-500/20 border-yellow-400'
                        : 'bg-blue-500/20 border-blue-400';

                  const drillEmoji =
                    rec.drillType === 'STRESS'
                      ? '🔊'
                      : rec.drillType === 'PHONEME'
                        ? '🗣️'
                        : rec.drillType === 'FLUENCY'
                          ? '⚡'
                          : '📚';

                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${priorityColor}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white mb-1">
                            {drillEmoji} {rec.drillType} 드릴
                          </h4>
                          <p className="text-sm text-slate-300 mb-2">
                            {rec.reason}
                          </p>
                          <div className="flex gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                rec.priority === 'HIGH'
                                  ? 'bg-red-600 text-red-100'
                                  : rec.priority === 'MEDIUM'
                                    ? 'bg-yellow-600 text-yellow-100'
                                    : 'bg-blue-600 text-blue-100'
                              }`}
                            >
                              {rec.priority === 'HIGH'
                                ? '우선순위: 높음'
                                : rec.priority === 'MEDIUM'
                                  ? '우선순위: 중간'
                                  : '우선순위: 낮음'}
                            </span>
                          </div>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap">
                          시작 →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 스터디 플랜 */}
              <div className="mt-6 pt-6 border-t border-slate-600">
                <h4 className="font-semibold text-white mb-3">
                  📅 추천 학습 계획
                </h4>
                <div className="bg-slate-800/50 p-4 rounded text-sm space-y-2">
                  <p className="text-slate-300">
                    1️⃣ <strong>내일</strong> - HIGH 우선순위 드릴 반복 (15분)
                  </p>
                  <p className="text-slate-300">
                    2️⃣ <strong>3일 후</strong> - MEDIUM 우선순위 드릴 시작
                  </p>
                  <p className="text-slate-300">
                    3️⃣ <strong>1주일 후</strong> - 이전 오답만 Spaced
                    Repetition
                  </p>
                  <p className="text-slate-300">
                    4️⃣ <strong>2주일 후</strong> - Practice 모듈로 전체 실전
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 행동 버튼 */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => router.push('/updated-speaking/drill')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            🎮 추천 드릴로 이동
          </button>
          <button
            onClick={() => router.push('/updated-speaking/practice')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
          >
            🏋️ 실전 연습
          </button>
        </div>
      </div>
    </div>
  );
}
