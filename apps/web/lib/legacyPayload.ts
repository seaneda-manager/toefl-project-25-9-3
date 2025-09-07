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
  // published 우선, 없으면 최신 version
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

/** 레거시 UI에 payload 주입(범용). 레거시에서 이벤트를 들으면 바로 받을 수 있음.
 *  window.addEventListener('toefl:payload', (e) => { const {section, set_id, payload} = (e as CustomEvent).detail; ... });
 *  필요하면 window.YourInitFn?.(payload) 같이 특정 진입점도 여기서 호출 가능.
 */
export function injectLegacyPayload(row: SetRow) {
  (window as any).__LEGACY_SET__ = row;
  window.dispatchEvent(new CustomEvent('toefl:payload', {
    detail: { section: row.section, set_id: row.set_id, version: row.version, payload: row.payload_json }
  }));

  // 레거시 초기화 진입점이 있다면 주석 해제해서 호출하세요:
  // if (row.section === 'reading') (window as any).initReadingStudy?.(row.payload_json);
  // if (row.section === 'listening') (window as any).initListeningStudy?.(row.payload_json);
}
