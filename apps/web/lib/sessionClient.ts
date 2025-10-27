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

/** 蹂댄렪 UUID ?앹꽦湲?(釉뚮씪?곗?/?몃뱶 紐⑤몢 ??? */
const makeUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    // Web Crypto媛 ?녿뒗 ?섍꼍???鍮꾪븳 ?대갚
    const rand = Math.random().toString(36).slice(2);
    const now = Date.now().toString(36);
    return `sid-${now}-${rand}`;
  } catch {
    return `sid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
};

/** 濡쒖뺄 ?꾩떆 ??μ냼 ?ㅻ뱾 */
const LS_KEY = 'sessionClient:answers';
const LS_QUEUE = 'sessionClient:pending'; // ?ㅽ듃?뚰겕 ?ㅽ뙣 ???ъ쟾????

/** 濡쒖뺄?ㅽ넗由ъ? ?쎄린/?곌린 (SSR ?덉쟾) */
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

/** ?ъ쟾???먯뿉 異붽? */
function enqueuePending(item: { url: string; method: string; body: any }) {
  const q = readLocal<any[]>(LS_QUEUE, []);
  q.push({ ...item, ts: Date.now() });
  writeLocal(LS_QUEUE, q);
}

/** (踰좎뒪?몄뿉?ы듃) ?섏씠吏 濡쒕뱶???볦씤 ?먮? 鍮꾩슦怨??띠쓣 ???몄텧 媛??*/
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
      if (!res.ok) rest.push(it); // ?ㅽ뙣??寃껊쭔 ?④?
    } catch {
      rest.push(it);
    }
  }
  writeLocal(LS_QUEUE, rest);
}

/**
 * ?몄뀡 ?쒖옉
 * - ?곗꽑 ?쒕쾭 ?몄텧(/api/sessions)
 * - ?ㅽ뙣 ??濡쒖뺄濡??대갚
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
      // 濡쒖뺄?먮룄 誘몃윭 ???由щ럭/?붾쾭洹몄슜)
      const store = readLocal<Record<string, any>>(LS_KEY, {});
      store[sessionId] = { section, mode, startedAt, answers: [] as SubmitAnswerArgs[] };
      writeLocal(LS_KEY, store);
      return { sessionId, startedAt };
    }
    // ?ㅽ듃?뚰겕/?쒕쾭 ?ㅽ뙣 ???대갚
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

    // ?섏쨷???쒕쾭濡??섍린湲??꾪븳 ???좏깮)
    enqueuePending({
      url: '/api/sessions',
      method: 'POST',
      body: { section, mode, _clientTempId: sessionId },
    });

    return { sessionId, startedAt };
  }
}

/**
 * ?듭븞 ?꾩넚
 * - ?쒕쾭 ?몄텧(/api/sessions/answer)
 * - ?ㅽ뙣 ??濡쒖뺄 ?꾩쟻 + ?ъ쟾?????곸옱
 */
export async function submitAnswer({
  sessionId,
  questionId,
  choiceId,
  meta,
}: SubmitAnswerArgs): Promise<SubmitAnswerResp> {
  // 濡쒖뺄 誘몃윭(??긽 湲곕줉)
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
      // ?ㅽ뙣 ???먯뿉 ?곸옱
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
 * ?몄뀡 醫낅즺
 * - ?쒕쾭 ?몄텧(/api/sessions/[id]/finish)
 * - ?ㅽ뙣 ??濡쒖뺄 ?쒖떆 + ?ъ쟾?????곸옱
 */
export async function finishSession({
  sessionId,
}: FinishSessionArgs): Promise<FinishSessionResp> {
  const finishedAt = new Date().toISOString();

  // 濡쒖뺄 誘몃윭
  const store = readLocal<Record<string, any>>(LS_KEY, {});
  if (!store[sessionId]) store[sessionId] = {};
  store[sessionId].finishedAt = finishedAt;
  writeLocal(LS_KEY, store);

  try {
    const res = await fetch(`/api/sessions/${sessionId}/finish`, { method: 'POST' });
    if (res.ok) {
      const data = (await res.json()) as FinishSessionResp;
      // ?쒕쾭 ?쒓컙???ㅻ? ???덉쑝誘濡??쒕쾭媛??곗꽑
      if (data?.finishedAt) {
        const s2 = readLocal<Record<string, any>>(LS_KEY, {});
        if (s2[sessionId]) {
          s2[sessionId].finishedAt = data.finishedAt;
          writeLocal(LS_KEY, s2);
        }
      }
      return { ok: true, finishedAt: data?.finishedAt ?? finishedAt };
    }
    // ?ㅽ뙣 ?????곸옱
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




