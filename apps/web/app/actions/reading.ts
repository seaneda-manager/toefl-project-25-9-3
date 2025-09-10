'use server';


import { getSupabaseServer } from '@/app/lib/supabaseServer';
import { revalidatePath } from 'next/cache';


export async function startReadingSession({ passageId, mode }: { passageId: string; mode: 'test' | 'study'; }) {
const supabase = getSupabaseServer();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('로그인이 필요합니다.');


const { data, error } = await supabase
.from('reading_sessions')
.insert({ user_id: user.id, passage_id: passageId, mode })
.select('id')
.single();
if (error) throw error;
return { sessionId: data.id as string };
}


export async function submitReadingAnswer(input: { sessionId: string; questionId: string; choiceId: string | null; elapsedMs?: number; }) {
const supabase = getSupabaseServer();
const { error } = await supabase
.from('reading_attempts')
.upsert({
session_id: input.sessionId,
question_id: input.questionId,
choice_id: input.choiceId,
elapsed_ms: input.elapsedMs ?? 0,
}, { onConflict: 'session_id,question_id' });
if (error) throw error;
}


export async function finishReadingSession({ sessionId }: { sessionId: string }) {
const supabase = getSupabaseServer();
const { error } = await supabase
.from('reading_sessions')
.update({ finished_at: new Date().toISOString() })
.eq('id', sessionId);
if (error) throw error;
}


export async function toggleReadingBookmark({ sessionId, questionId }: { sessionId: string; questionId: string; }) {
const supabase = getSupabaseServer();
const { data } = await supabase
.from('reading_bookmarks')
.select('id')
.eq('session_id', sessionId)
.eq('question_id', questionId)
.maybeSingle();
if (data?.id) {
await supabase.from('reading_bookmarks').delete().eq('id', data.id);
return { bookmarked: false };
} else {
const { error } = await supabase.from('reading_bookmarks').insert({ session_id: sessionId, question_id: questionId });
if (error) throw error;
return { bookmarked: true };
}
}


export async function saveReadingNote({ sessionId, questionId, content }: { sessionId: string; questionId: string; content: string; }) {
const supabase = getSupabaseServer();
const { error } = await supabase.from('reading_notes').insert({ session_id: sessionId, question_id: questionId, content });
if (error) throw error;
}