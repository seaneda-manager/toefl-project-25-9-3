// apps/web/lib/auth/requireTeacher.ts
'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';

export type RoleFlags = {
  isTeacher: boolean;
  isAdmin: boolean;
  /** 肄섑뀗痢??쒖옉 沅뚰븳(?놁쑝硫?湲곕낯 true濡?泥섎━) */
  canProduce: boolean;
};

type ProfileRow = {
  role: 'student' | 'teacher' | 'admin' | null;
  is_admin: boolean | null;
  can_produce: boolean | null;
};

export async function requireTeacher(): Promise<RoleFlags> {
  const supabase = await getSupabaseServer(); // ??await

  // 1) ?몄쬆 ?뺤씤
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error('Unauthorized: not signed in');

  // 2) ?꾨줈??議고쉶
  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_admin, can_produce')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  const row = (data ?? null) as ProfileRow | null;
  const isAdmin = !!row?.is_admin || row?.role === 'admin';
  const isTeacher = isAdmin || row?.role === 'teacher';

  if (!isTeacher) throw new Error('Forbidden: teacher role required');

  return {
    isTeacher: true,
    isAdmin,
    canProduce: row?.can_produce ?? true,
  };
}


