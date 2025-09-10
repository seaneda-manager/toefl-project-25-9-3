import { getSupabaseServer } from '@/app/lib/supabaseServer';
import TestRunner from './TestRunner';
import type { Passage, Question, Choice } from '@/app/lib/types-reading';


export default async function Page() {
const supabase = getSupabaseServer();
// 임시로 가장 최근 passage 1개 로드 (원하면 쿼리스트링/선택 UI 연결)
const { data: p } = await supabase.from('reading_passages').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
if (!p) return <div>Passage가 없습니다.</div>;
const { data: qs } = await supabase
.from('reading_questions')
.select('*, choices:reading_choices(*)')
.eq('passage_id', p.id)
.order('number', { ascending: true });


const passage: Passage = {
id: p.id,
title: p.title,
content: p.content,
questions: (qs ?? []).map((q: any) => ({
id: q.id,
number: q.number,
stem: q.stem,
type: (q.type as 'single'|'summary') ?? 'single',
explanation: q.explanation,
clue_quote: q.clue_quote,
choices: (q.choices ?? []).map((c: any) => ({ id: c.id, label: c.label, text: c.text, is_correct: c.is_correct })) as Choice[],
})) as Question[],
};


return <TestRunner passage={passage} />;
}