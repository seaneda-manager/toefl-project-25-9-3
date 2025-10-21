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
  // published ?°ì„ , ?†ìœ¼ë©?ìµœì‹  version
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

/** ?ˆê±°??UI??payload ì£¼ì…(ë²”ìš©). ?ˆê±°?œì—???´ë²¤?¸ë? ?¤ìœ¼ë©?ë°”ë¡œ ë°›ì„ ???ˆìŒ.
 *  window.addEventListener('toefl:payload', (e) => { const {section, set_id, payload} = (e as CustomEvent).detail; ... });
 *  ?„ìš”?˜ë©´ window.YourInitFn?.(payload) ê°™ì´ ?¹ì • ì§„ì…?ë„ ?¬ê¸°???¸ì¶œ ê°€??
 */
export function injectLegacyPayload(row: SetRow) {
  (window as any).__LEGACY_SET__ = row;
  window.dispatchEvent(new CustomEvent('toefl:payload', {
    detail: { section: row.section, set_id: row.set_id, version: row.version, payload: row.payload_json }
  }));

  // ?ˆê±°??ì´ˆê¸°??ì§„ì…?ì´ ?ˆë‹¤ë©?ì£¼ì„ ?´ì œ?´ì„œ ?¸ì¶œ?˜ì„¸??
  // if (row.section === 'reading') (window as any).initReadingStudy?.(row.payload_json);
  // if (row.section === 'listening') (window as any).initListeningStudy?.(row.payload_json);
}

