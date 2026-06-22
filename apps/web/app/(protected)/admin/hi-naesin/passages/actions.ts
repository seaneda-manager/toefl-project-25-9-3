'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  HI_NAESIN_SOURCE_TYPES,
  HI_NAESIN_GRADES,
} from '@/models/hi-naesin';

type ActionFail = { ok: false; error: string };

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? '';
}

function numOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createHiNaesinPassageAction(
  fd: FormData,
): Promise<void> {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const sourceType = str(fd, 'source_type');
  const grade = str(fd, 'grade');
  const passageText = str(fd, 'passage_text');

  if (!HI_NAESIN_SOURCE_TYPES.includes(sourceType as never)) {
    throw new Error('출처 종류를 선택해주세요.');
  }
  if (!HI_NAESIN_GRADES.includes(grade as never)) {
    throw new Error('학년을 선택해주세요.');
  }
  if (!passageText) {
    throw new Error('지문을 입력해주세요.');
  }

  const topicTagsRaw = str(fd, 'topic_tags');
  const topicTags = topicTagsRaw
    ? topicTagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from('hi_naesin_passages')
    .insert({
      source_type:     sourceType,
      grade,
      exam_year:       numOrNull(fd, 'exam_year'),
      exam_month:      numOrNull(fd, 'exam_month'),
      question_number: numOrNull(fd, 'question_number'),
      school_name:     str(fd, 'school_name') || null,
      textbook_name:   str(fd, 'textbook_name') || null,
      unit_label:      str(fd, 'unit_label') || null,
      book_name:       str(fd, 'book_name') || null,
      book_unit:       str(fd, 'book_unit') || null,
      title:           str(fd, 'title') || null,
      passage_text:    passageText,
      translation_ko:  str(fd, 'translation_ko') || null,
      word_count:      numOrNull(fd, 'word_count'),
      topic_tags:      topicTags,
      is_published:    false,
      created_by:      user.id,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/hi-naesin/passages');
  redirect(`/admin/hi-naesin/passages/${data.id}/edit`);
}

export async function bulkUpdatePassageMetaAction(
  ids: string[],
  meta: { school_name: string | null; grade: string | null; exam_year: number | null; exam_month: number | null },
): Promise<{ ok: boolean; error?: string }> {
  if (ids.length === 0) return { ok: false, error: '선택된 지문이 없습니다.' };
  const supabase = await getServerSupabase();

  const { error } = await supabase
    .from('hi_naesin_passages')
    .update(meta)
    .in('id', ids);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/hi-naesin/passages');
  return { ok: true };
}

export async function toggleHiNaesinPassagePublishedAction(
  fd: FormData,
): Promise<void> {
  const supabase = await getServerSupabase();
  const id = str(fd, 'id');
  const isPublished = str(fd, 'is_published') === 'true';

  const { error } = await supabase
    .from('hi_naesin_passages')
    .update({ is_published: isPublished })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/hi-naesin/passages');
}
