export async function startSession(_: { section: 'reading'|'listening'; mode: 'study'|'exam'|'review' }) {
  return { sessionId: (globalThis.crypto?.randomUUID?.() ?? `sid-${Math.random().toString(36).slice(2)}`) };
}
export async function submitAnswer(_: { sessionId: string; questionId: string; choiceId: string; meta?: any }) {
  return { ok: true };
}
export async function finishSession(_: { sessionId: string }) {
  return { ok: true };
}

