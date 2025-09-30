'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';

export type RoleFlags = {
  isTeacher: boolean;
  isAdmin?: boolean;
  canProduce?: boolean;
};

export async function requireTeacher(): Promise<RoleFlags> {
  const supabase = getSupabaseServer(); // ?대씪?댁뼵??媛앹껜
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error('Unauthorized: not signed in');

  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_admin, can_produce')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  const isTeacher = data?.role === 'teacher' || !!data?.is_admin;
  if (!isTeacher) throw new Error('Forbidden: teacher role required');

  return {
    isTeacher,
    isAdmin: !!data?.is_admin,
    canProduce: data?.can_produce ?? true,
  };
}

