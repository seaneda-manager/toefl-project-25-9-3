'use client';
import { supabase } from './supabaseClient';
import { ORG_ID } from './constants';

type SetRow = {
  id: string;
  section: 'reading'|'listening';
  set_id: string;
  title: string | null;
  version: number;
  payload_json: any;
  published_at: string | null;
};

export async function fetchBestSet(section: 'reading'|'listening'): Promise<SetRow | null> {
  // published ?곗꽑, ?놁쑝硫?理쒖떊 version
  const { data, error } = await supabase
    .from('sets')
    .select('id, section, set_id, title, version, payload_json, published_at')
    .eq('org_id', ORG_ID)
    .eq('section', section)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('version', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data && data[0]) ?? null;
}

/** ?덇굅??UI??payload 二쇱엯(踰붿슜). ?덇굅?쒖뿉???대깽?몃? ?ㅼ쑝硫?諛붾줈 諛쏆쓣 ???덉쓬.
 *  window.addEventListener('toefl:payload', (e) => { const {section, set_id, payload} = (e as CustomEvent).detail; ... });
 *  ?꾩슂?섎㈃ window.YourInitFn?.(payload) 媛숈씠 ?뱀젙 吏꾩엯?먮룄 ?ш린???몄텧 媛??
 */
export function injectLegacyPayload(row: SetRow) {
  (window as any).__LEGACY_SET__ = row;
  window.dispatchEvent(new CustomEvent('toefl:payload', {
    detail: { section: row.section, set_id: row.set_id, version: row.version, payload: row.payload_json }
  }));

  // ?덇굅??珥덇린??吏꾩엯?먯씠 ?덈떎硫?二쇱꽍 ?댁젣?댁꽌 ?몄텧?섏꽭??
  // if (row.section === 'reading') (window as any).initReadingStudy?.(row.payload_json);
  // if (row.section === 'listening') (window as any).initListeningStudy?.(row.payload_json);
}





