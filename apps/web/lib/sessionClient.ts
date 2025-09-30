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

/** 보편 UUID 생성기 (브라우저/노드 모두 대응) */
const makeUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    // Web Crypto가 없는 환경을 대비한 폴백
    const rand = Math.random().toString(36).slice(2);
    const now = Date.now().toString(36);
    return `sid-${now}-${rand}`;
  } catch {
    return `sid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
};

/** 로컬 임시 저장소 키들 */
const LS_KEY = 'sessionClient:answers';
const LS_QUEUE = 'sessionClient:pending'; // 네트워크 실패 시 재전송 큐

/** 로컬스토리지 읽기/쓰기 (SSR 안전) */
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

/** 재전송 큐에 추가 */
function enqueuePending(item: { url: string; method: string; body: any }) {
  const q = readLocal<any[]>(LS_QUEUE, []);
  q.push({ ...item, ts: Date.now() });
  writeLocal(LS_QUEUE, q);
}

/** (베스트에포트) 페이지 로드시 쌓인 큐를 비우고 싶을 때 호출 가능 */
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
      if (!res.ok) rest.push(it); // 실패한 것만 남김
    } catch {
      rest.push(it);
    }
  }
  writeLocal(LS_QUEUE, rest);
}

/**
 * 세션 시작
 * - 우선 서버 호출(/api/sessions)
 * - 실패 시 로컬로 폴백
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
      // 로컬에도 미러 저장(리뷰/디버그용)
      const store = readLocal<Record<string, any>>(LS_KEY, {});
      store[sessionId] = { section, mode, startedAt, answers: [] as SubmitAnswerArgs[] };
      writeLocal(LS_KEY, store);
      return { sessionId, startedAt };
    }
    // 네트워크/서버 실패 → 폴백
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

    // 나중에 서버로 넘기기 위한 큐(선택)
    enqueuePending({
      url: '/api/sessions',
      method: 'POST',
      body: { section, mode, _clientTempId: sessionId },
    });

    return { sessionId, startedAt };
  }
}

/**
 * 답안 전송
 * - 서버 호출(/api/sessions/answer)
 * - 실패 시 로컬 누적 + 재전송 큐 적재
 */
export async function submitAnswer({
  sessionId,
  questionId,
  choiceId,
  meta,
}: SubmitAnswerArgs): Promise<SubmitAnswerResp> {
  // 로컬 미러(항상 기록)
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
      // 실패 시 큐에 적재
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
 * 세션 종료
 * - 서버 호출(/api/sessions/[id]/finish)
 * - 실패 시 로컬 표시 + 재전송 큐 적재
 */
export async function finishSession({
  sessionId,
}: FinishSessionArgs): Promise<FinishSessionResp> {
  const finishedAt = new Date().toISOString();

  // 로컬 미러
  const store = readLocal<Record<string, any>>(LS_KEY, {});
  if (!store[sessionId]) store[sessionId] = {};
  store[sessionId].finishedAt = finishedAt;
  writeLocal(LS_KEY, store);

  try {
    const res = await fetch(`/api/sessions/${sessionId}/finish`, { method: 'POST' });
    if (res.ok) {
      const data = (await res.json()) as FinishSessionResp;
      // 서버 시간이 다를 수 있으므로 서버값 우선
      if (data?.finishedAt) {
        const s2 = readLocal<Record<string, any>>(LS_KEY, {});
        if (s2[sessionId]) {
          s2[sessionId].finishedAt = data.finishedAt;
          writeLocal(LS_KEY, s2);
        }
      }
      return { ok: true, finishedAt: data?.finishedAt ?? finishedAt };
    }
    // 실패 시 큐 적재
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
