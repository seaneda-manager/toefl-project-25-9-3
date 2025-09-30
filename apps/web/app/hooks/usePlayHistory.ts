'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'p' | 't' | 'r'; // practice / test / review
export type PlayEntry = { trackId: string; mode: Mode; playedAt: number };

const BASE_KEY = 'listening_play_history';
const LEGACY_KEY = 'listening_play_history_session'; // ?덉쟾 sessionStorage ???덈떎硫?

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

  // 珥덇린 濡쒕뱶 + (1?? ?덇굅??留덉씠洹몃젅?댁뀡
  useEffect(() => {
    if (!hasWindow()) return;

    // 1) localStorage 濡쒕뱶
    const local = safeParse<PlayEntry[]>(
      window.localStorage.getItem(storageKey),
      []
    );

    // 2) sessionStorage(?덇굅?? ?덉쑝硫?蹂묓빀 ???쒓굅
    const legacyRaw = window.sessionStorage.getItem(LEGACY_KEY);
    const legacy = safeParse<PlayEntry[]>(legacyRaw, []);

    let merged = local;
    if (legacy.length > 0) {
      const exists = new Set(local.map(e => `${e.trackId}|${e.mode}|${e.playedAt}`));
      const add = legacy.filter(e => !exists.has(`${e.trackId}|${e.mode}|${e.playedAt}`));
      merged = [...local, ...add].sort((a, b) => a.playedAt - b.playedAt);
      // ?몄뀡?ㅽ넗由ъ???移섏?
      window.sessionStorage.removeItem(LEGACY_KEY);
      // 蹂묓빀蹂????
      window.localStorage.setItem(storageKey, JSON.stringify(merged));
    }

    setHistory(merged);
    loadedRef.current = true;
  }, [storageKey]);

  // 異붽?(???+ ?곹깭?낅뜲?댄듃)
  const addPlay = useCallback((entry: Omit<PlayEntry, 'playedAt'>) => {
    if (!hasWindow()) return;
    const newEntry: PlayEntry = { ...entry, playedAt: Date.now() };
    setHistory(prev => {
      const next = [...prev, newEntry];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  // ?몃옓蹂?留덉?留??ъ깮 紐⑤뱶/?쒓컖
  const getLastPlay = useCallback((trackId: string) => {
    let last: PlayEntry | undefined;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].trackId === trackId) { last = history[i]; break; }
    }
    return last;
  }, [history]);

  // ?꾩껜 由ъ뀑(?붾쾭洹??뚯뒪?몄슜)
  const clearHistory = useCallback(() => {
    if (!hasWindow()) return;
    window.localStorage.removeItem(storageKey);
    setHistory([]);
  }, [storageKey]);

  return { history, addPlay, getLastPlay, clearHistory, ready: loadedRef.current };
}

