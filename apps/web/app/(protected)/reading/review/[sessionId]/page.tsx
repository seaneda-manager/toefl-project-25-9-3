import { getSupabaseServer } from '@/app/lib/supabaseServer';
import ReviewRow from '../../components/ReviewRow';


export default async function Page({ params }: { params: { sessionId: string } }) {
const supabase = getSupabaseServer();
const sessionId = params.sessionId;


const { data: session } = await supabase
.from('reading_sessions')
.select('id, passage_id, mode, started_at, finished_at')
.eq('id', sessionId)
.maybeSingle();
if (!session) return <div>세션을 찾을 수 없습니다.</div>;


const { data: passage } = await supabase
.from('reading_passages')
.select('*')
.eq('id', session.passage_id)
.maybeSingle();


const { data: qs } = await supabase
.from('reading_questions')
.select('*, choices:reading_choices(*), attempts:reading_attempts(choice_id)')
.eq('passage_id', session.passage_id)
.order('number', { ascending: true });


return (
<div className="space-y-6">
<header className="flex items-center justify-between">
<div>
<h1 className="text-xl font-semibold">Review — {passage?.title}</h1>
<div className="text-sm text-gray-500">mode: {session.mode} · started: {new Date(session.started_at).toLocaleString()} {session.finished_at ? `· finished: ${new Date(session.finished_at).toLocaleString()}` : ''}</div>
</div>
</header>


<div className="grid gap-4">
{(qs ?? []).map((q: any) => (
<ReviewRow
key={q.id}
q={{
id: q.id,
number: q.number,
stem: q.stem,
type: q.type,
explanation: q.explanation,
clue_quote: q.clue_quote,
choices: (q.choices ?? []).map((c: any) => ({ id: c.id, label: c.label, text: c.text, is_correct: c.is_correct }))
}}
picked={q.attempts?.[0]?.choice_id ?? null}
/>
))}
</div>
</div>
);
}