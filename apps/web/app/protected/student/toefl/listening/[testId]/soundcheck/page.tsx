'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SoundCheckPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [phase, setPhase] = useState<'mic-test' | 'speaker-test' | 'volume-check' | 'ready'>('mic-test');
  const [micReady, setMicReady] = useState(false);
  const [speakerReady, setSpeakerReady] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(50);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicReady(true);
      setPhase('speaker-test');
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const playTestSound = async () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // 1000Hz 톤 생성 (1초)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime((volumeLevel / 100) * 0.3, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.type = 'sine';

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);

    setSpeakerReady(true);
    setTimeout(() => setPhase('volume-check'), 1000);
  };

  const startExam = () => {
    setPhase('ready');
    setTimeout(() => {
      router.push(`/student/toefl/listening/${testId}/module1`);
    }, 1500);
  };

  return (
    <main className="flex h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-900">🎧 사운드 체크</h1>
          <p className="text-sm text-gray-500">시험 시작 전 오디오 장치를 확인해주세요</p>
        </header>

        <div className="space-y-6">
          {/* 마이크 테스트 */}
          <div className={`rounded-lg border-2 p-6 transition ${micReady ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <span className={`text-xl ${micReady ? '✅' : '🎤'}`}</span>
              마이크 테스트
            </h2>
            <p className="mb-4 text-xs text-gray-600">마이크에 대고 말씀해주세요</p>
            {!micReady ? (
              <button
                onClick={startMicTest}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                마이크 테스트 시작
              </button>
            ) : (
              <p className="text-sm font-medium text-emerald-700">✓ 마이크 준비 완료</p>
            )}
          </div>

          {/* 스피커 테스트 */}
          <div
            className={`rounded-lg border-2 p-6 transition ${
              speakerReady ? 'border-emerald-300 bg-emerald-50' : micReady ? 'border-gray-200' : 'border-gray-100 opacity-50'
            }`}
          >
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <span className={`text-xl ${speakerReady ? '✅' : '🔊'}`}</span>
              스피커 테스트
            </h2>
            <p className="mb-4 text-xs text-gray-600">음성이 들리는지 확인해주세요</p>
            {!speakerReady && micReady ? (
              <button
                onClick={playTestSound}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                테스트 음성 재생
              </button>
            ) : speakerReady ? (
              <p className="text-sm font-medium text-emerald-700">✓ 스피커 준비 완료</p>
            ) : (
              <p className="text-xs text-gray-400">먼저 마이크를 테스트해주세요</p>
            )}
          </div>

          {/* 볼륨 조절 */}
          {speakerReady && phase === 'volume-check' && (
            <div className="rounded-lg border-2 border-gray-200 p-6">
              <h2 className="mb-3 font-semibold text-gray-900">🔊 볼륨 조절</h2>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumeLevel}
                  onChange={(e) => setVolumeLevel(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-center text-sm text-gray-600">{volumeLevel}%</p>
              </div>
            </div>
          )}

          {/* 준비 완료 */}
          {phase === 'volume-check' && (
            <button
              onClick={startExam}
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              🚀 시험 시작
            </button>
          )}

          {phase === 'ready' && (
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-700">준비 완료! 시험을 시작합니다...</p>
            </div>
          )}
        </div>

        <footer className="border-t pt-4 text-center">
          <Link href={`/student/toefl/listening`} className="text-xs text-gray-500 hover:text-gray-700">
            ← 돌아가기
          </Link>
        </footer>
      </div>
    </main>
  );
}
