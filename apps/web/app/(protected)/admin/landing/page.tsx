'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { PAGE_DEFAULTS } from '@/components/landing/defaults';
import type { LandingPageConfig, LandingSection, PricingTier, Testimonial } from '@/components/landing/types';
import LandingRenderer from '@/components/landing/LandingRenderer';

function PreviewPanel({ config }: { config: LandingPageConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setScale(el.clientWidth / 1280);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex-1 overflow-hidden border-l border-neutral-200 bg-neutral-100 relative">
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
        <div style={{ width: 1280, transformOrigin: 'top left', transform: `scale(${scale})`, height: `${100 / scale}%` }}>
          <div style={{ pointerEvents: 'none' }}>
            <LandingRenderer config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGES = [
  { key: 'toefl',  label: 'TOEFL',  emoji: '🎓', url: '/toefl' },
  { key: 'naesin', label: '내신',    emoji: '📚', url: '/naesin' },
  { key: 'jr',     label: 'JR.',     emoji: '🌟', url: '/jr' },
  { key: 'voca',   label: 'VOCA',    emoji: '✨', url: '/voca' },
  { key: 'arcade', label: 'Arcade',  emoji: '🎮', url: '/arcade' },
] as const;

type PageKey = (typeof PAGES)[number]['key'];

const inp = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';
const ta  = (rows = 3) => `w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y`;
const lbl = 'block text-xs font-medium text-neutral-500 mb-1';
const card = 'rounded-xl border border-neutral-200 bg-white p-5 space-y-3';
const secHead = 'text-sm font-semibold text-neutral-800 pb-1 border-b border-neutral-100';

export default function LandingAdminPage() {
  const [activePage, setActivePage] = useState<PageKey>('toefl');
  const [configs, setConfigs] = useState<Record<string, LandingPageConfig>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const cfg = configs[activePage] ?? PAGE_DEFAULTS[activePage];

  const setCfg = useCallback((patch: Partial<LandingPageConfig> | ((prev: LandingPageConfig) => LandingPageConfig)) => {
    setConfigs(prev => {
      const current = prev[activePage] ?? PAGE_DEFAULTS[activePage];
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      return { ...prev, [activePage]: next };
    });
  }, [activePage]);

  // Load config for active page
  useEffect(() => {
    if (configs[activePage]) return;
    setLoading(true);
    fetch(`/api/admin/landing?page=${activePage}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setConfigs(prev => ({ ...prev, [activePage]: data as LandingPageConfig }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activePage]);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/landing?page=${activePage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus({ msg: '저장 완료 ✅', ok: true });
    } catch (e: any) {
      setStatus({ msg: e?.message || '저장 실패', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (patch: Partial<LandingPageConfig['hero']>) =>
    setCfg(p => ({ ...p, hero: { ...p.hero, ...patch } }));

  const updateNav = (patch: Partial<LandingPageConfig['nav']>) =>
    setCfg(p => ({ ...p, nav: { ...p.nav, ...patch } }));

  const updateStat = (i: number, patch: Partial<{ value: string; label: string }>) =>
    setCfg(p => {
      const stats = [...p.stats];
      stats[i] = { ...stats[i], ...patch };
      return { ...p, stats };
    });

  const updateSection = (si: number, patch: Partial<LandingSection>) =>
    setCfg(p => {
      const sections = [...p.sections];
      sections[si] = { ...sections[si], ...patch };
      return { ...p, sections };
    });

  const updateSectionItem = (si: number, ii: number, patch: Partial<LandingSection['items'][0]>) =>
    setCfg(p => {
      const sections = [...p.sections];
      const items = [...sections[si].items];
      items[ii] = { ...items[ii], ...patch };
      sections[si] = { ...sections[si], items };
      return { ...p, sections };
    });

  const updateTestimonial = (i: number, patch: Partial<Testimonial>) =>
    setCfg(p => {
      const items = [...p.testimonials.items];
      items[i] = { ...items[i], ...patch };
      return { ...p, testimonials: { ...p.testimonials, items } };
    });

  const updateTier = (i: number, patch: Partial<PricingTier>) =>
    setCfg(p => {
      const tiers = [...p.pricing.tiers];
      tiers[i] = { ...tiers[i], ...patch };
      return { ...p, pricing: { ...p.pricing, tiers } };
    });

  const updateCta = (patch: Partial<LandingPageConfig['cta']>) =>
    setCfg(p => ({ ...p, cta: { ...p.cta, ...patch } }));

  const pageInfo = PAGES.find(p => p.key === activePage)!;

  return (
    <div className="flex h-full flex-col overflow-hidden -m-4 md:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/LEXiOX.png" alt="LEXiOX" width={120} height={48} style={{ height: 40, width: 'auto' }} unoptimized />
          <h1 className="text-lg font-semibold text-neutral-800">Landing Page Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-sm ${status.ok ? 'text-green-600' : 'text-red-600'}`}>{status.msg}</span>
          )}
          <button onClick={() => setShowPreview(v => !v)}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 border-b border-neutral-200 bg-neutral-50 px-5 py-2 shrink-0">
        {PAGES.map(p => (
          <button key={p.key} onClick={() => setActivePage(p.key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition ${activePage === p.key ? 'bg-white shadow-sm text-neutral-900 border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'}`}>
            <span>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor panel */}
        <div className={`overflow-y-auto p-5 space-y-5 ${showPreview ? 'w-[480px] shrink-0' : 'flex-1'}`}>

      {loading && <div className="py-8 text-center text-sm text-neutral-400">로딩 중…</div>}

      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* NAV */}
            <div className={card}>
              <p className={secHead}>네비게이션</p>
              <div>
                <label className={lbl}>링크 (쉼표로 구분)</label>
                <input className={inp} value={cfg.nav.links.join(', ')}
                  onChange={e => updateNav({ links: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </div>
              <div>
                <label className={lbl}>CTA 버튼</label>
                <input className={inp} value={cfg.nav.cta} onChange={e => updateNav({ cta: e.target.value })} />
              </div>
            </div>

            {/* HERO */}
            <div className={card}>
              <p className={secHead}>히어로</p>
              <div>
                <label className={lbl}>뱃지</label>
                <input className={inp} value={cfg.hero.badge} onChange={e => updateHero({ badge: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>제목</label>
                <input className={inp} value={cfg.hero.title} onChange={e => updateHero({ title: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>제목 강조 (색상)</label>
                <input className={inp} value={cfg.hero.titleEm} onChange={e => updateHero({ titleEm: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>본문</label>
                <textarea className={ta(3)} value={cfg.hero.body} onChange={e => updateHero({ body: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>CTA 메인</label>
                  <input className={inp} value={cfg.hero.ctaPrimary} onChange={e => updateHero({ ctaPrimary: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>CTA 서브</label>
                  <input className={inp} value={cfg.hero.ctaSecondary ?? ''} onChange={e => updateHero({ ctaSecondary: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>소셜 증명</label>
                <input className={inp} value={cfg.hero.socialProof ?? ''} onChange={e => updateHero({ socialProof: e.target.value })} />
              </div>
              {cfg.hero.socialCount !== undefined && (
                <div>
                  <label className={lbl}>소셜 숫자</label>
                  <input className={inp} value={cfg.hero.socialCount} onChange={e => updateHero({ socialCount: e.target.value })} />
                </div>
              )}
            </div>

            {/* STATS */}
            <div className={card}>
              <p className={secHead}>통계 스트립</p>
              {cfg.stats.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input className={inp} value={s.value} placeholder="값" onChange={e => updateStat(i, { value: e.target.value })} />
                  <input className={inp} value={s.label} placeholder="설명" onChange={e => updateStat(i, { label: e.target.value })} />
                </div>
              ))}
            </div>

            {/* CTA BANNER */}
            <div className={card}>
              <p className={secHead}>하단 CTA 배너</p>
              <div>
                <label className={lbl}>제목</label>
                <input className={inp} value={cfg.cta.heading} onChange={e => updateCta({ heading: e.target.value })} />
              </div>
              {cfg.cta.headingEm !== undefined && (
                <div>
                  <label className={lbl}>제목 강조</label>
                  <input className={inp} value={cfg.cta.headingEm} onChange={e => updateCta({ headingEm: e.target.value })} />
                </div>
              )}
              <div>
                <label className={lbl}>본문</label>
                <input className={inp} value={cfg.cta.body} onChange={e => updateCta({ body: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>버튼 1</label>
                  <input className={inp} value={cfg.cta.button} onChange={e => updateCta({ button: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>버튼 2 (선택)</label>
                  <input className={inp} value={cfg.cta.button2 ?? ''} onChange={e => updateCta({ button2: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">

            {/* SECTIONS */}
            {cfg.sections.map((sec, si) => (
              <div key={sec.id} className={card}>
                <p className={secHead}>섹션: {sec.badge}</p>
                <div>
                  <label className={lbl}>뱃지</label>
                  <input className={inp} value={sec.badge} onChange={e => updateSection(si, { badge: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>제목</label>
                  <input className={inp} value={sec.heading} onChange={e => updateSection(si, { heading: e.target.value })} />
                </div>
                {sec.body !== undefined && (
                  <div>
                    <label className={lbl}>설명</label>
                    <textarea className={ta(2)} value={sec.body} onChange={e => updateSection(si, { body: e.target.value })} />
                  </div>
                )}
                <div className="space-y-3 border-t border-neutral-100 pt-3">
                  {sec.items.map((item, ii) => (
                    <div key={ii} className="rounded-lg bg-neutral-50 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input className="w-12 rounded border border-neutral-200 px-2 py-1 text-sm text-center" value={item.icon ?? ''} placeholder="🎯"
                          onChange={e => updateSectionItem(si, ii, { icon: e.target.value })} />
                        <input className={inp} value={item.title} placeholder="제목"
                          onChange={e => updateSectionItem(si, ii, { title: e.target.value })} />
                      </div>
                      <textarea className={ta(2)} value={item.body} placeholder="본문"
                        onChange={e => updateSectionItem(si, ii, { body: e.target.value })} />
                      {item.tag !== undefined && (
                        <input className={inp} value={item.tag} placeholder="태그"
                          onChange={e => updateSectionItem(si, ii, { tag: e.target.value })} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* TESTIMONIALS */}
            <div className={card}>
              <p className={secHead}>후기</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>뱃지</label>
                  <input className={inp} value={cfg.testimonials.badge}
                    onChange={e => setCfg(p => ({ ...p, testimonials: { ...p.testimonials, badge: e.target.value } }))} />
                </div>
                <div>
                  <label className={lbl}>제목</label>
                  <input className={inp} value={cfg.testimonials.heading}
                    onChange={e => setCfg(p => ({ ...p, testimonials: { ...p.testimonials, heading: e.target.value } }))} />
                </div>
              </div>
              {cfg.testimonials.items.map((t, i) => (
                <div key={i} className="rounded-lg bg-neutral-50 p-3 space-y-2 border-t border-neutral-100 pt-3 first:border-0">
                  <textarea className={ta(2)} value={t.quote} placeholder="후기 내용"
                    onChange={e => updateTestimonial(i, { quote: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className={inp} value={t.initials} placeholder="이니셜"
                      onChange={e => updateTestimonial(i, { initials: e.target.value })} />
                    <input className={inp} value={t.name} placeholder="이름"
                      onChange={e => updateTestimonial(i, { name: e.target.value })} />
                    <input className={inp} value={t.detail} placeholder="소개"
                      onChange={e => updateTestimonial(i, { detail: e.target.value })} />
                  </div>
                  <input className={inp} value={t.stat ?? ''} placeholder="성과 (예: 85 → 107점)"
                    onChange={e => updateTestimonial(i, { stat: e.target.value })} />
                </div>
              ))}
            </div>

            {/* PRICING */}
            <div className={card}>
              <p className={secHead}>요금제</p>
              <div>
                <label className={lbl}>뱃지</label>
                <input className={inp} value={cfg.pricing.badge}
                  onChange={e => setCfg(p => ({ ...p, pricing: { ...p.pricing, badge: e.target.value } }))} />
              </div>
              <div>
                <label className={lbl}>제목</label>
                <input className={inp} value={cfg.pricing.heading}
                  onChange={e => setCfg(p => ({ ...p, pricing: { ...p.pricing, heading: e.target.value } }))} />
              </div>
              {cfg.pricing.tiers.map((tier, i) => (
                <div key={i} className={`rounded-lg p-3 space-y-2 ${tier.featured ? 'bg-indigo-50 border border-indigo-200' : 'bg-neutral-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-neutral-600">{tier.featured ? '⭐ ' : ''}{tier.name}</span>
                    <label className="flex items-center gap-1 text-xs text-neutral-500 ml-auto">
                      <input type="checkbox" checked={tier.featured} onChange={e => updateTier(i, { featured: e.target.checked })} />
                      추천
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input className={inp} value={tier.name} placeholder="이름" onChange={e => updateTier(i, { name: e.target.value })} />
                    <input className={inp} value={tier.price} placeholder="가격" onChange={e => updateTier(i, { price: e.target.value })} />
                    <input className={inp} value={tier.per} placeholder="단위" onChange={e => updateTier(i, { per: e.target.value })} />
                  </div>
                  <input className={inp} value={tier.desc} placeholder="설명" onChange={e => updateTier(i, { desc: e.target.value })} />
                  <textarea className={ta(3)} value={tier.features.join('\n')} placeholder="혜택 (한 줄 = 1개)"
                    onChange={e => updateTier(i, { features: e.target.value.split('\n').filter(Boolean) })} />
                  <input className={inp} value={tier.cta} placeholder="버튼 텍스트" onChange={e => updateTier(i, { cta: e.target.value })} />
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

          {/* Save bottom */}
          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-200">
            <button onClick={handleSave} disabled={saving || loading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <PreviewPanel config={cfg} />
        )}

      </div>
    </div>
  );
}
