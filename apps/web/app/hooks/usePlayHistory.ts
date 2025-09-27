'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'p' | 't' | 'r'; // practice / test / review
export type PlayEntry = { trackId: string; mode: Mode; playedAt: number };

const BASE_KEY = 'listening_play_history';
const LEGACY_KEY = 'listening_play_history_session'; // 예전 sessionStorage 키(있다면)

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function hasWindow() { return typeof window !== 'undefined'; }

export function usePlayHistory(sessionId: string | undefined) {
  const storageKey = useMemo(
    () => (sessionId ? `${BASE_KEY}::${sessionId}` : BASE_KEY),
    [sessionId]
  );

  const [history, setHistory] = useState<PlayEntry[]>([]);
  const loadedRef = useRef(false);

  // 초기 로드 + (1회) 레거시 마이그레이션
  useEffect(() => {
    if (!hasWindow()) return;

    // 1) localStorage 로드
    const local = safeParse<PlayEntry[]>(
      window.localStorage.getItem(storageKey),
      []
    );

    // 2) sessionStorage(레거시) 있으면 병합 후 제거
    const legacyRaw = window.sessionStorage.getItem(LEGACY_KEY);
    const legacy = safeParse<PlayEntry[]>(legacyRaw, []);

    let merged = local;
    if (legacy.length > 0) {
      const exists = new Set(local.map(e => `${e.trackId}|${e.mode}|${e.playedAt}`));
      const add = legacy.filter(e => !exists.has(`${e.trackId}|${e.mode}|${e.playedAt}`));
      merged = [...local, ...add].sort((a, b) => a.playedAt - b.playedAt);
      // 세션스토리지는 치움
      window.sessionStorage.removeItem(LEGACY_KEY);
      // 병합본 저장
      window.localStorage.setItem(storageKey, JSON.stringify(merged));
    }

    setHistory(merged);
    loadedRef.current = true;
  }, [storageKey]);

  // 추가(저장 + 상태업데이트)
  const addPlay = useCallback((entry: Omit<PlayEntry, 'playedAt'>) => {
    if (!hasWindow()) return;
    const newEntry: PlayEntry = { ...entry, playedAt: Date.now() };
    setHistory(prev => {
      const next = [...prev, newEntry];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  // 트랙별 마지막 재생 모드/시각
  const getLastPlay = useCallback((trackId: string) => {
    let last: PlayEntry | undefined;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].trackId === trackId) { last = history[i]; break; }
    }
    return last;
  }, [history]);

  // 전체 리셋(디버그/테스트용)
  const clearHistory = useCallback(() => {
    if (!hasWindow()) return;
    window.localStorage.removeItem(storageKey);
    setHistory([]);
  }, [storageKey]);

  return { history, addPlay, getLastPlay, clearHistory, ready: loadedRef.current };
}
