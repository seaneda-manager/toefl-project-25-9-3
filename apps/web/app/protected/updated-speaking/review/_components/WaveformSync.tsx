'use client';

import React, { useRef, useEffect, useState } from 'react';

/**
 * Waveform Audio Sync 컴포넌트
 * - 음성 파형 시각화
 * - 타임스탐프 클릭 → 해당 시점 재생
 * - 오류 구간 하이라이트
 */

interface WaveformSyncProps {
  originalAudioUrl: string;
  userAudioUrl: string;
  errorMap: Array<{
    timeStart: number;
    timeEnd: number;
    errorType: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  transcript: string;
  timestamps: { word: string; start: number; end: number }[];
}

export const WaveformSync: React.FC<WaveformSyncProps> = ({
  originalAudioUrl,
  userAudioUrl,
  errorMap,
  transcript,
  timestamps,
}) => {
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const userAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = userAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlay = () => {
    if (userAudioRef.current) {
      if (isPlaying) {
        userAudioRef.current.pause();
      } else {
        userAudioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleWordClick = (startTime: number) => {
    if (userAudioRef.current) {
      userAudioRef.current.currentTime = startTime;
      userAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  const getWordColor = (word: string, start: number, end: number) => {
    const error = errorMap.find((e) => e.timeStart <= start && e.timeEnd >= end);
    if (!error) return 'text-slate-300';

    switch (error.severity) {
      case 'HIGH':
        return 'bg-red-500/30 text-red-200';
      case 'MEDIUM':
        return 'bg-yellow-500/30 text-yellow-200';
      case 'LOW':
        return 'bg-blue-500/30 text-blue-200';
      default:
        return 'text-slate-300';
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-6">
      {/* 음성 재생 컨트롤 */}
      <div className="mb-6">
        <button
          onClick={handlePlay}
          className="flex items-center gap-3 text-white hover:text-blue-400 transition font-semibold mb-4"
        >
          <span className="text-2xl">{isPlaying ? '⏸' : '🔊'}</span>
          <span>{isPlaying ? '일시정지' : '재생'}</span>
        </button>

        {/* 파형 시뮬레이션 */}
        <div className="bg-slate-800 p-4 rounded mb-4">
          <div className="h-16 bg-slate-900 rounded flex items-center justify-center mb-3 overflow-hidden">
            <div className="flex items-center gap-0.5 h-full">
              {Array.from({ length: 60 }).map((_, i) => {
                const isErrorArea = errorMap.some(
                  (e) =>
                    e.timeStart <= (i / 60) * duration &&
                    e.timeEnd >= (i / 60) * duration
                );
                return (
                  <div
                    key={i}
                    className={`flex-1 h-full transition-all ${
                      i / 60 < progressPercent
                        ? isErrorArea
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: `${30 + Math.random() * 70}%`,
                      alignSelf: 'center',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* 타임 표시 */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* 스크립트 (단어별 하이라이트) */}
      <div className="bg-slate-800/50 p-4 rounded">
        <p className="text-sm text-slate-400 mb-2">📝 스크립트 (클릭하면 해당 시점 재생)</p>
        <div className="flex flex-wrap gap-2">
          {timestamps.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleWordClick(item.start)}
              className={`px-3 py-1 rounded transition text-sm ${getWordColor(
                item.word,
                item.start,
                item.end
              )}`}
            >
              {item.word}
            </button>
          ))}
        </div>
      </div>

      {/* 오류 범례 */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded text-xs">
        <p className="text-slate-400 mb-2">오류 수준:</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/50" />
            <span className="text-slate-300">높음</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/50" />
            <span className="text-slate-300">중간</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/50" />
            <span className="text-slate-300">낮음</span>
          </div>
        </div>
      </div>

      {/* 숨겨진 오디오 엘리먼트 */}
      <audio ref={originalAudioRef} src={originalAudioUrl} />
      <audio ref={userAudioRef} src={userAudioUrl} />
    </div>
  );
};
