'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Updated Speaking 모듈 허브 페이지
 * - Drill / Review / Practice 세 가지 학습 경로
 * - 진행 상황 추적
 * - 통계 대시보드
 */

export default function UpdatedSpeakingPage() {
  const modules = [
    {
      title: '🎮 Drill 모듈',
      description: '취약한 발음을 집중적으로 훈련하세요.',
      details: [
        'Stress (강세) 훈련',
        'Phoneme (음소) 훈련',
        'Fluency (유창성) 훈련',
        'Vocabulary (어휘) 훈련',
      ],
      href: '/protected/updated-speaking/drill',
      color: 'from-blue-600 to-blue-700',
      emoji: '🔊',
    },
    {
      title: '📊 Review 모듈',
      description: '녹음한 음성을 분석하고 오류를 파악하세요.',
      details: [
        'Waveform Sync로 발음 비교',
        '오류 유형별 분석',
        '취약점 추천 드릴',
        '학습 계획 제안',
      ],
      href: '/protected/updated-speaking/review',
      color: 'from-purple-600 to-purple-700',
      emoji: '🔍',
    },
    {
      title: '🏋️ Practice 모듈',
      description: '실제 TOEFL 시험과 동일한 환경에서 연습하세요.',
      details: [
        'Task 1-4 전체 구성',
        '정확한 카운트다운 (45~60초)',
        '자동 녹음 및 저장',
        'Study / Test 모드 선택',
      ],
      href: '/protected/updated-speaking/practice',
      color: 'from-red-600 to-red-700',
      emoji: '🎯',
    },
  ];

  const learningPath = [
    {
      step: 1,
      title: 'Drill로 기초 다지기',
      description:
        '취약한 음소나 강세를 집중적으로 반복 훈련. 적응형 난이도로 실력에 맞게 진행.',
      time: '10-20분/회',
    },
    {
      step: 2,
      title: 'Review로 오류 분석',
      description:
        'Waveform Sync로 자신의 발음과 원어민 발음을 비교. 오류를 시각화해서 파악.',
      time: '5-10분/회',
    },
    {
      step: 3,
      title: 'Practice로 실전 경험',
      description:
        '전체 4 Task를 시험 환경에서 완료. 정확한 시간 제한과 자동 녹음.',
      time: '11분 + 분석',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            🎤 Updated TOEFL Speaking 2026
          </h1>
          <p className="text-slate-300 text-lg">
            Drill → Review → Practice로 완벽한 발음을 익히세요.
          </p>
        </div>

        {/* 학습 경로 흐름도 */}
        <div className="mb-12 bg-slate-700/20 border border-slate-600 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-8">
            📚 추천 학습 경로
          </h2>
          <div className="space-y-4">
            {learningPath.map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600">
                    <span className="text-white font-bold text-xl">
                      {item.step}
                    </span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-sm mb-2">
                    {item.description}
                  </p>
                  <div className="text-xs text-slate-400">
                    ⏱️ {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 세 가지 모듈 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group"
            >
              <div
                className={`bg-gradient-to-br ${module.color} rounded-lg p-6 h-full hover:shadow-lg transition transform hover:scale-105`}
              >
                <div className="text-4xl mb-3">{module.emoji}</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {module.title}
                </h2>
                <p className="text-white/90 text-sm mb-4">
                  {module.description}
                </p>

                {/* 세부 기능 */}
                <div className="bg-white/20 rounded p-4 mb-4">
                  <ul className="space-y-2">
                    {module.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-white/90">
                        ✓ {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center text-white/80 group-hover:text-white transition">
                  <span className="text-sm font-semibold">시작하기</span>
                  <span className="ml-2">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-400">1,450</div>
            <div className="text-sm text-slate-400 mt-2">현재 Elo Rating</div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-400">12</div>
            <div className="text-sm text-slate-400 mt-2">
              완료한 Drill 세션
            </div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-400">68%</div>
            <div className="text-sm text-slate-400 mt-2">전체 성공률</div>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400">3</div>
            <div className="text-sm text-slate-400 mt-2">
              완료한 Practice 세션
            </div>
          </div>
        </div>

        {/* 자주 묻는 질문 */}
        <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            ❓ 자주 묻는 질문
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">
                Q: Drill과 Practice의 차이점은?
              </h3>
              <p className="text-slate-300 text-sm">
                A: Drill은 특정 발음(강세, 음소 등)을 집중 훈련하는 것이고,
                Practice는 전체 4개 Task를 시험 환경에서 완료하는 것입니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Q: Review 모듈에서 무엇을 배우나요?
              </h3>
              <p className="text-slate-300 text-sm">
                A: Waveform Sync로 자신의 음성과 원어민 음성을 비교하며 오류를
                파악합니다. 시각적으로 강세, 음절, 발음 등을 분석할 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Q: Elo 레이팅은 어떻게 작동하나요?
              </h3>
              <p className="text-slate-300 text-sm">
                A: 체스 기반의 Elo 레이팅 시스템을 사용합니다. 정답하면
                +16점, 오답하면 -16점이 변합니다. 난이도에 따라 조정됩니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Q: Study 모드와 Test 모드의 차이는?
              </h3>
              <p className="text-slate-300 text-sm">
                A: Study 모드는 자유롭게 일시정지하고 재시도할 수 있지만, Test
                모드는 시험 조건과 동일하게 자동 진행되고 일시정지할 수 없습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
