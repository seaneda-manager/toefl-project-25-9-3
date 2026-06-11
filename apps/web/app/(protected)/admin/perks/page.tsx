import { getServerSupabase } from '@/lib/supabase/server';
import AdminPerksClient from './AdminPerksClient';

export const dynamic = 'force-dynamic';

export default async function AdminPerksPage() {
  const supabase = await getServerSupabase();

  const [{ data: catalog }, { data: redemptions }] = await Promise.all([
    supabase
      .from('perk_catalog')
      .select('*')
      .order('point_cost'),
    supabase
      .from('perk_redemptions')
      .select(`
        id, status, points_spent, requested_at, resolved_at, admin_note,
        student_id,
        perk:perk_catalog(name, perk_type)
      `)
      .order('requested_at', { ascending: false })
      .limit(100),
  ]);

  return <AdminPerksClient catalog={catalog ?? []} redemptions={redemptions ?? []} />;
}
