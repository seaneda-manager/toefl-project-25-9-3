'use client';
import { useMemo, useState } from 'react';
import PassagePane from '../components/PassagePane';
import QuestionCard from '../components/QuestionCard';
import { startReadingSession, submitReadingAnswer } from '@/app/actions/reading';
import type { Passage } from '@/app/lib/types-reading';


export default function StudyRunner({ passage }: { passage: Passage; }) {
const [sessionId, setSessionId] = useState<string | null>(null);
const [current, setCurrent] = useState(0);
const [answers, setAnswers] = useState<Record<string, string | null>>({});
const total = passage.questions.length;


// 세션을 만들어두면 노트/북마크 저장 가능
async function ensureSession() {
if (sessionId) return sessionId;
const { sessionId: id } = await startReadingSession({ passageId: passage.id, mode: 'study' });
setSessionId(id);
return id;
}


const q = useMemo(() => passage.questions[current], [passage, current]);


async function pick(choiceId: string) {
setAnswers((s) => ({ ...s, [q.id]: choiceId }));
const id = await ensureSession();
await submitReadingAnswer({ sessionId: id, questionId: q.id, choiceId, elapsedMs: 0 });
}


return (
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<PassagePane title={passage.title} content={passage.content} />
<div className="space-y-4">
<div className="flex items-center justify-between">
<div className="text-sm text-gray-500">{current + 1} / {total}</div>
<div className="space-x-2">
<button className="px-3 py-2 rounded-xl border" onClick={() => setCurrent((c) => Math.max(0, c - 1))}>&larr; Prev</button>
<button className="px-3 py-2 rounded-xl border" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>Next &rarr;</button>
</div>
</div>
<QuestionCard q={q} disabled={false} selected={answers[q.id] ?? null} onChange={pick} showFeedback={true} />
</div>
</div>
);
}