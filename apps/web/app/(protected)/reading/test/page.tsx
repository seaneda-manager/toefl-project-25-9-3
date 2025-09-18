import { getSupabaseServer } from '@/lib/supabaseServer';
import TestRunner from './TestRunner';
import type { Passage, Question, Choice } from '@/types/types-reading';


export default async function Page() {
const supabase = getSupabaseServer();
// ?꾩떆濡?媛??理쒓렐 passage 1媛?濡쒕뱶 (?먰븯硫?荑쇰━?ㅽ듃留??좏깮 UI ?곌껐)
const { data: p } = await supabase.from('reading_passages').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
if (!p) return <div>Passage媛 ?놁뒿?덈떎.</div>;
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
