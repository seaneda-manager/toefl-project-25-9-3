'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'p' | 't' | 'r'; // practice / test / review
export type PlayEntry = { trackId: string; mode: Mode; playedAt: number };

const BASE_KEY = 'listening_play_history';
const LEGACY_KEY = 'listening_play_history_session'; // ?ˆì „ sessionStorage ???ˆë‹¤ë©?

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

  // ì´ˆê¸° ë¡œë“œ + (1?? ?ˆê±°??ë§ˆì´ê·¸ë ˆ?´ì…˜
  useEffect(() => {
    if (!hasWindow()) return;

    // 1) localStorage ë¡œë“œ
    const local = safeParse<PlayEntry[]>(
      window.localStorage.getItem(storageKey),
      []
    );

    // 2) sessionStorage(?ˆê±°?? ?ˆìœ¼ë©?ë³‘í•© ???œê±°
    const legacyRaw = window.sessionStorage.getItem(LEGACY_KEY);
    const legacy = safeParse<PlayEntry[]>(legacyRaw, []);

    let merged = local;
    if (legacy.length > 0) {
      const exists = new Set(local.map(e => `${e.trackId}|${e.mode}|${e.playedAt}`));
      const add = legacy.filter(e => !exists.has(`${e.trackId}|${e.mode}|${e.playedAt}`));
      merged = [...local, ...add].sort((a, b) => a.playedAt - b.playedAt);
      // ?¸ì…˜?¤í† ë¦¬ì???ì¹˜ì?
      window.sessionStorage.removeItem(LEGACY_KEY);
      // ë³‘í•©ë³??€??
      window.localStorage.setItem(storageKey, JSON.stringify(merged));
    }

    setHistory(merged);
    loadedRef.current = true;
  }, [storageKey]);

  // ì¶”ê?(?€??+ ?íƒœ?…ë°?´íŠ¸)
  const addPlay = useCallback((entry: Omit<PlayEntry, 'playedAt'>) => {
    if (!hasWindow()) return;
    const newEntry: PlayEntry = { ...entry, playedAt: Date.now() };
    setHistory(prev => {
      const next = [...prev, newEntry];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  // ?¸ë™ë³?ë§ˆì?ë§??¬ìƒ ëª¨ë“œ/?œê°
  const getLastPlay = useCallback((trackId: string) => {
    let last: PlayEntry | undefined;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].trackId === trackId) { last = history[i]; break; }
    }
    return last;
  }, [history]);

  // ?„ì²´ ë¦¬ì…‹(?”ë²„ê·??ŒìŠ¤?¸ìš©)
  const clearHistory = useCallback(() => {
    if (!hasWindow()) return;
    window.localStorage.removeItem(storageKey);
    setHistory([]);
  }, [storageKey]);

  return { history, addPlay, getLastPlay, clearHistory, ready: loadedRef.current };
}

