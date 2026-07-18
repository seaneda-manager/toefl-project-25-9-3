'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Audio Check Store
 * - 마이크 레벨 측정
 * - 임계값(-20dB) 달성 시 Next 활성화
 */

export function useAudioCheck() {
  const [micLevel, setMicLevel] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const startAudioCheck = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamAudioSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      source.connect(analyser);

      const updateLevel = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 255) * 100);
        setMicLevel(normalizedLevel);

        // 임계값 체크 (대략 -20dB 이상)
        if (normalizedLevel >= 30) {
          setIsReady(true);
        } else {
          setIsReady(false);
        }

        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, []);

  const stopAudioCheck = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudioCheck();
    };
  }, [stopAudioCheck]);

  return {
    micLevel,
    isReady,
    error,
    startAudioCheck,
    stopAudioCheck,
  };
}
