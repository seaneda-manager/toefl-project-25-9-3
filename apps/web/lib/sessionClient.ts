// apps/web/lib/sessionClient.ts

export type Section = 'reading' | 'listening';
export type Mode = 'study' | 'exam' | 'review';

type SubmitMeta = Record<string, unknown>;

export type StartSessionArgs = {
  section: Section;
  mode: Mode;
};

export type SubmitAnswerArgs = {
  sessionId: string;
  questionId: string;
  choiceId: string;
  meta?: SubmitMeta;
};

export type FinishSessionArgs = {
  sessionId: string;
};

export type StartSessionResp = { sessionId: string; startedAt: string };
export type SubmitAnswerResp = { ok: true };
export type FinishSessionResp = { ok: true; finishedAt: string };

/** ë³´í¸ UUID ?ì„±ê¸?(ë¸Œë¼?°ì?/?¸ë“œ ëª¨ë‘ ?€?? */
const makeUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    // Web Cryptoê°€ ?†ëŠ” ?˜ê²½???€ë¹„í•œ ?´ë°±
    const rand = Math.random().toString(36).slice(2);
    const now = Date.now().toString(36);
    return `sid-${now}-${rand}`;
  } catch {
    return `sid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
};

/** ë¡œì»¬ ?„ì‹œ ?€?¥ì†Œ ?¤ë“¤ */
const LS_KEY = 'sessionClient:answers';
const LS_QUEUE = 'sessionClient:pending'; // ?¤íŠ¸?Œí¬ ?¤íŒ¨ ???¬ì „????

/** ë¡œì»¬?¤í† ë¦¬ì? ?½ê¸°/?°ê¸° (SSR ?ˆì „) */
const readLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeLocal = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

/** ?¬ì „???ì— ì¶”ê? */
function enqueuePending(item: { url: string; method: string; body: any }) {
  const q = readLocal<any[]>(LS_QUEUE, []);
  q.push({ ...item, ts: Date.now() });
  writeLocal(LS_QUEUE, q);
}

/** (ë² ìŠ¤?¸ì—?¬íŠ¸) ?˜ì´ì§€ ë¡œë“œ???“ì¸ ?ë? ë¹„ìš°ê³??¶ì„ ???¸ì¶œ ê°€??*/
export async function flushPendingSilently() {
  const q = readLocal<any[]>(LS_QUEUE, []);
  if (!q.length) return;
  const rest: any[] = [];
  for (const it of q) {
    try {
      const res = await fetch(it.url, {
        method: it.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(it.body),
      });
      if (!res.ok) rest.push(it); // ?¤íŒ¨??ê²ƒë§Œ ?¨ê?
    } catch {
      rest.push(it);
    }
  }
  writeLocal(LS_QUEUE, rest);
}

/**
 * ?¸ì…˜ ?œì‘
 * - ?°ì„  ?œë²„ ?¸ì¶œ(/api/sessions)
 * - ?¤íŒ¨ ??ë¡œì»¬ë¡??´ë°±
 */
export async function startSession({
  section,
  mode,
}: StartSessionArgs): Promise<StartSessionResp> {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ section, mode }),
    });
    if (res.ok) {
      const { sessionId, startedAt } = (await res.json()) as StartSessionResp;
      // ë¡œì»¬?ë„ ë¯¸ëŸ¬ ?€??ë¦¬ë·°/?”ë²„ê·¸ìš©)
      const store = readLocal<Record<string, any>>(LS_KEY, {});
      store[sessionId] = { section, mode, startedAt, answers: [] as SubmitAnswerArgs[] };
      writeLocal(LS_KEY, store);
      return { sessionId, startedAt };
    }
    // ?¤íŠ¸?Œí¬/?œë²„ ?¤íŒ¨ ???´ë°±
    throw new Error(`startSession http ${res.status}`);
  } catch {
    const sessionId = makeUUID();
    const startedAt = new Date().toISOString();
    const store = readLocal<Record<string, any>>(LS_KEY, {});
    store[sessionId] = {
      section,
      mode,
      startedAt,
      answers: [] as SubmitAnswerArgs[],
      _offline: true,
    };
    writeLocal(LS_KEY, store);

    // ?˜ì¤‘???œë²„ë¡??˜ê¸°ê¸??„í•œ ??? íƒ)
    enqueuePending({
      url: '/api/sessions',
      method: 'POST',
      body: { section, mode, _clientTempId: sessionId },
    });

    return { sessionId, startedAt };
  }
}

/**
 * ?µì•ˆ ?„ì†¡
 * - ?œë²„ ?¸ì¶œ(/api/sessions/answer)
 * - ?¤íŒ¨ ??ë¡œì»¬ ?„ì  + ?¬ì „?????ì¬
 */
export async function submitAnswer({
  sessionId,
  questionId,
  choiceId,
  meta,
}: SubmitAnswerArgs): Promise<SubmitAnswerResp> {
  // ë¡œì»¬ ë¯¸ëŸ¬(??ƒ ê¸°ë¡)
  const store = readLocal<Record<string, any>>(LS_KEY, {});
  if (!store[sessionId]) {
    store[sessionId] = { startedAt: new Date().toISOString(), answers: [] as SubmitAnswerArgs[], _orphan: true };
  }
  store[sessionId].answers ||= [];
  store[sessionId].answers.push({ sessionId, questionId, choiceId, meta });
  writeLocal(LS_KEY, store);

  try {
    const res = await fetch('/api/sessions/answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId, choiceId, meta }),
    });
    if (!res.ok) {
      // ?¤íŒ¨ ???ì— ?ì¬
      enqueuePending({
        url: '/api/sessions/answer',
        method: 'POST',
        body: { sessionId, questionId, choiceId, meta },
      });
    }
  } catch {
    enqueuePending({
      url: '/api/sessions/answer',
      method: 'POST',
      body: { sessionId, questionId, choiceId, meta },
    });
  }

  return { ok: true };
}

/**
 * ?¸ì…˜ ì¢…ë£Œ
 * - ?œë²„ ?¸ì¶œ(/api/sessions/[id]/finish)
 * - ?¤íŒ¨ ??ë¡œì»¬ ?œì‹œ + ?¬ì „?????ì¬
 */
export async function finishSession({
  sessionId,
}: FinishSessionArgs): Promise<FinishSessionResp> {
  const finishedAt = new Date().toISOString();

  // ë¡œì»¬ ë¯¸ëŸ¬
  const store = readLocal<Record<string, any>>(LS_KEY, {});
  if (!store[sessionId]) store[sessionId] = {};
  store[sessionId].finishedAt = finishedAt;
  writeLocal(LS_KEY, store);

  try {
    const res = await fetch(`/api/sessions/${sessionId}/finish`, { method: 'POST' });
    if (res.ok) {
      const data = (await res.json()) as FinishSessionResp;
      // ?œë²„ ?œê°„???¤ë? ???ˆìœ¼ë¯€ë¡??œë²„ê°??°ì„ 
      if (data?.finishedAt) {
        const s2 = readLocal<Record<string, any>>(LS_KEY, {});
        if (s2[sessionId]) {
          s2[sessionId].finishedAt = data.finishedAt;
          writeLocal(LS_KEY, s2);
        }
      }
      return { ok: true, finishedAt: data?.finishedAt ?? finishedAt };
    }
    // ?¤íŒ¨ ?????ì¬
    enqueuePending({
      url: `/api/sessions/${sessionId}/finish`,
      method: 'POST',
      body: {},
    });
    return { ok: true, finishedAt };
  } catch {
    enqueuePending({
      url: `/api/sessions/${sessionId}/finish`,
      method: 'POST',
      body: {},
    });
    return { ok: true, finishedAt };
  }
}
