'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { LandingPageConfig, LandingSection, PricingTier, Testimonial } from './types';

// ── Theme ─────────────────────────────────────────────────────────
const THEME = {
  indigo: {
    dark: false,
    accent: '#4f46e5',
    accentLight: '#eef2ff',
    accentMid: '#a5b4fc',
    heroBg: '#fafafa',
    heroBorder: '#ebebeb',
    badgeText: '#4f46e5',
    badgeBg: '#eef2ff',
    navBg: '#fff',
    pageBg: '#fff',
    text: '#111',
    textMuted: '#555',
    textSub: '#888',
    border: '#e5e5e5',
    sectionAlt: '#fafafa',
    statNum: '#4f46e5',
    stepNum: '#4f46e5',
    stepNumBg: '#eef2ff',
    ctaBg: '#4f46e5',
    ctaText: '#fff',
  },
  teal: {
    dark: false,
    accent: '#0d9488',
    accentLight: '#f0fdfa',
    accentMid: '#99f6e4',
    heroBg: '#f0fdfa',
    heroBorder: '#ccfbf1',
    badgeText: '#0d9488',
    badgeBg: '#ccfbf1',
    navBg: '#fff',
    pageBg: '#fff',
    text: '#111',
    textMuted: '#555',
    textSub: '#888',
    border: '#e5e5e5',
    sectionAlt: '#fafafa',
    statNum: '#0d9488',
    stepNum: '#fff',
    stepNumBg: '#0d9488',
    ctaBg: '#0d9488',
    ctaText: '#fff',
  },
  amber: {
    dark: false,
    accent: '#f59e0b',
    accentLight: '#fffbeb',
    accentMid: '#fde68a',
    heroBg: '#fffbeb',
    heroBorder: '#fde68a',
    badgeText: '#d97706',
    badgeBg: '#fef3c7',
    navBg: '#fff',
    pageBg: '#fff',
    text: '#111',
    textMuted: '#555',
    textSub: '#888',
    border: '#e5e5e5',
    sectionAlt: '#fafafa',
    statNum: '#f59e0b',
    stepNum: '#fff',
    stepNumBg: '#f59e0b',
    ctaBg: '#f59e0b',
    ctaText: '#fff',
  },
  purple: {
    dark: true,
    accent: '#7c3aed',
    accentLight: 'rgba(167,139,250,0.15)',
    accentMid: '#a78bfa',
    heroBg: '#1e1433',
    heroBorder: 'rgba(167,139,250,0.15)',
    badgeText: '#c4b5fd',
    badgeBg: 'rgba(167,139,250,0.12)',
    navBg: '#fff',
    pageBg: '#fff',
    text: '#111',
    textMuted: '#555',
    textSub: '#888',
    border: '#e5e5e5',
    sectionAlt: '#fafafa',
    statNum: '#7c3aed',
    stepNum: '#fff',
    stepNumBg: '#7c3aed',
    ctaBg: '#1e1433',
    ctaText: '#fff',
  },
  dark: {
    dark: true,
    accent: '#7c3aed',
    accentLight: 'rgba(167,139,250,0.12)',
    accentMid: '#a78bfa',
    heroBg: '#0d0d14',
    heroBorder: 'rgba(255,255,255,0.06)',
    badgeText: '#c4b5fd',
    badgeBg: 'rgba(167,139,250,0.12)',
    navBg: '#0d0d14',
    pageBg: '#0d0d14',
    text: '#fff',
    textMuted: '#a1a1aa',
    textSub: '#71717a',
    border: 'rgba(255,255,255,0.08)',
    sectionAlt: '#0a0a10',
    statNum: '#a78bfa',
    stepNum: '#fff',
    stepNumBg: '#7c3aed',
    ctaBg: '#0a0a10',
    ctaText: '#fff',
  },
} as const;

const SKILL_COLORS = {
  read:   { bg: '#eef2ff', text: '#4f46e5' },
  listen: { bg: '#ecfdf5', text: '#059669' },
  speak:  { bg: '#fdf4ff', text: '#9333ea' },
  write:  { bg: '#fff7ed', text: '#ea580c' },
};

const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#ea580c'];

// ── Sub-components ────────────────────────────────────────────────
function SectionGrid2({ items, t }: { items: LandingSection['items']; t: typeof THEME.indigo }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 32 }}>
      {items.map((item, i) => {
        const sc = item.skillColor ? SKILL_COLORS[item.skillColor] : null;
        return (
          <div key={i} style={{ padding: 24, borderRadius: 16, border: `0.5px solid ${t.border}`, background: t.dark ? '#18181f' : '#fff' }}>
            {item.icon && <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: t.text }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65 }}>{item.body}</p>
            {item.tag && (
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6, marginTop: 10, background: sc ? sc.bg : t.accentLight, color: sc ? sc.text : t.accent }}>
                {item.tag}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionList({ items, t }: { items: LandingSection['items']; t: typeof THEME.indigo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 28 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: i < items.length - 1 ? `0.5px solid ${t.border}` : 'none', alignItems: 'flex-start' }}>
          {item.icon && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentLight, border: `0.5px solid ${t.accentMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {item.icon}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: t.text }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.65 }}>{item.body}</p>
            {item.tag && (
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6, marginTop: 8, background: t.accentLight, color: t.accent, border: `0.5px solid ${t.accentMid}` }}>
                {item.tag}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionSteps({ items, t }: { items: LandingSection['items']; t: typeof THEME.indigo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 28 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < items.length - 1 ? `0.5px solid ${t.border}` : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.stepNumBg, color: t.stepNum, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            {i + 1}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: t.text }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.65 }}>{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionPS({ items, t }: { items: LandingSection['items']; t: typeof THEME.indigo }) {
  const pairs: Array<[typeof items[0], typeof items[0]]> = [];
  for (let i = 0; i < items.length; i += 2) {
    if (items[i + 1]) pairs.push([items[i], items[i + 1]]);
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28 }}>
      {pairs.map(([prob, sol], i) => (
        <>
          <div key={`p${i}`} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{prob.badge}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#7f1d1d', marginBottom: 6 }}>{prob.title}</h3>
            <p style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.65 }}>{prob.body}</p>
          </div>
          <div key={`s${i}`} style={{ background: '#f0fdfa', border: '0.5px solid #99f6e4', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0d9488', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{sol.badge}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#134e4a', marginBottom: 6 }}>{sol.title}</h3>
            <p style={{ fontSize: 14, color: '#0f766e', lineHeight: 1.65 }}>{sol.body}</p>
          </div>
        </>
      ))}
    </div>
  );
}

function SectionAudience({ items, t }: { items: LandingSection['items']; t: typeof THEME.indigo }) {
  const colors = [
    { bg: '#fffbeb', border: '#fde68a', bullet: '#f59e0b' },
    { bg: '#f0f9ff', border: '#bae6fd', bullet: '#0891b2' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28 }}>
      {items.map((item, i) => {
        const c = colors[i % colors.length];
        const lines = item.body.split('\n').filter(Boolean);
        return (
          <div key={i} style={{ background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12, color: '#111' }}>{item.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lines.map((line, j) => (
                <li key={j} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                  <span style={{ color: c.bullet, flexShrink: 0 }}>•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Section({ sec, t }: { sec: LandingSection; t: typeof THEME.indigo }) {
  const bg = sec.alt ? t.sectionAlt : t.pageBg;
  return (
    <section style={{ padding: '72px 0', background: bg }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 48px' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.accent, letterSpacing: '1.4px', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>{sec.badge}</span>
      <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: 10, color: t.text }}>{sec.heading}</h2>
      {sec.body && <p style={{ fontSize: 16, color: t.textMuted, lineHeight: 1.75, maxWidth: 520 }}>{sec.body}</p>}
      {sec.layout === 'grid2' && <SectionGrid2 items={sec.items} t={t} />}
      {sec.layout === 'list' && <SectionList items={sec.items} t={t} />}
      {sec.layout === 'steps' && <SectionSteps items={sec.items} t={t} />}
      {sec.layout === 'ps' && <SectionPS items={sec.items} t={t} />}
      {sec.layout === 'audience' && <SectionAudience items={sec.items} t={t} />}
      </div>
    </section>
  );
}

function Testimonials({ cfg, t }: { cfg: LandingPageConfig['testimonials']; t: typeof THEME.indigo }) {
  return (
    <section style={{ padding: '72px 0', background: t.pageBg }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 48px' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.accent, letterSpacing: '1.4px', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>{cfg.badge}</span>
      <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 28, color: t.text }}>{cfg.heading}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cfg.items.map((item, i) => (
          <div key={i} style={{ background: t.dark ? '#18181f' : '#fff', border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 22 }}>
            {item.stat && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.accentLight, border: `0.5px solid ${t.accentMid}`, borderRadius: 8, padding: '5px 12px', fontSize: 13, color: t.accent, fontWeight: 600, marginBottom: 12 }}>
                {item.stat}
              </div>
            )}
            <p style={{ fontSize: 15, color: t.dark ? '#d4d4d8' : '#444', lineHeight: 1.75, marginBottom: 16 }}>"{item.quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                {item.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.name}</div>
                <div style={{ fontSize: 13, color: t.textSub }}>{item.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

function Pricing({ cfg, t }: { cfg: LandingPageConfig['pricing']; t: typeof THEME.indigo }) {
  const cols = cfg.tiers.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)';
  return (
    <section style={{ padding: '72px 0', background: t.sectionAlt }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 48px' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.accent, letterSpacing: '1.4px', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>{cfg.badge}</span>
      <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 32, color: t.text }}>{cfg.heading}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 14 }}>
        {cfg.tiers.map((tier, i) => (
          <div key={i} style={{ border: tier.featured ? `1.5px solid ${t.accent}` : `0.5px solid ${t.border}`, borderRadius: 16, padding: 26, background: t.dark ? '#18181f' : '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: tier.featured ? t.accent : t.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tier.name}{tier.featured ? ' · 가장 인기' : ''}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>
              {tier.price} <span style={{ fontSize: 14, color: t.textSub, fontWeight: 400 }}>{tier.per}</span>
            </div>
            <div style={{ fontSize: 13, color: t.textSub, marginBottom: 20 }}>{tier.desc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {tier.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: t.dark ? '#a1a1aa' : '#444' }}>
                  <span style={{ color: t.accent, flexShrink: 0, fontWeight: 600 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: tier.featured ? 'none' : `0.5px solid ${t.border}`, background: tier.featured ? t.accent : 'transparent', color: tier.featured ? '#fff' : t.dark ? '#a1a1aa' : '#333' }}>
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function LandingRenderer({ config }: { config: LandingPageConfig }) {
  const t = THEME[config.theme];

  return (
    <div style={{ background: t.pageBg, color: t.text, fontFamily: 'var(--font-sans, system-ui, sans-serif)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ borderBottom: `0.5px solid ${t.border}`, background: t.navBg, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {config.showLogo && (
              <Image src="/LEXiOX.png" alt="LEXiOX" width={90} height={36} style={{ height: 30, width: 'auto', objectFit: 'contain' }} unoptimized />
            )}
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {config.nav.links.map((link) => (
              <a key={link} href="#" style={{ fontSize: 15, color: t.dark ? '#a1a1aa' : '#555', cursor: 'pointer', textDecoration: 'none' }}>{link}</a>
            ))}
            <button style={{ background: t.accent, color: '#fff', fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>
              {config.nav.cta}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center', background: t.heroBg, borderBottom: `0.5px solid ${t.heroBorder}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.badgeBg, border: `0.5px solid ${t.accentMid}`, color: t.badgeText, fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20, marginBottom: 24 }}>
            ✨ {config.hero.badge}
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1.5px', marginBottom: 18, color: t.dark ? '#fff' : '#0a0a0a' }}>
            {config.hero.title}<br />
            <span style={{ color: t.accent }}>{config.hero.titleEm}</span>
          </h1>
          <p style={{ fontSize: 18, color: t.textMuted, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.75 }}>{config.hero.body}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ background: t.accent, color: '#fff', fontSize: 16, fontWeight: 600, padding: '15px 32px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
              {config.hero.ctaPrimary}
            </button>
            {config.hero.ctaSecondary && (
              <button style={{ background: t.dark ? 'rgba(255,255,255,0.06)' : '#fff', color: t.dark ? '#fff' : '#333', fontSize: 16, fontWeight: 600, padding: '15px 32px', borderRadius: 12, border: `1px solid ${t.border}`, cursor: 'pointer' }}>
                {config.hero.ctaSecondary}
              </button>
            )}
          </div>
          {config.hero.socialProof && (
            <div style={{ marginTop: 26, fontSize: 14, color: t.textSub }}>
              {config.hero.socialCount && <strong style={{ color: t.dark ? '#a1a1aa' : '#111' }}>{config.hero.socialCount}</strong>}{' '}
              {config.hero.socialProof}
            </div>
          )}
        </div>
      </section>

      {/* STATS STRIP */}
      <div style={{ borderBottom: `0.5px solid ${t.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {config.stats.map((s, i) => (
          <div key={i} style={{ padding: '28px 0', textAlign: 'center', borderRight: i < 3 ? `0.5px solid ${t.border}` : 'none' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: t.statNum, letterSpacing: '-1px' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: t.textSub, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
        </div>
      </div>

      {/* SECTIONS */}
      {config.sections.map((sec) => (
        <Section key={sec.id} sec={sec} t={t} />
      ))}

      {/* TESTIMONIALS */}
      <Testimonials cfg={config.testimonials} t={t} />

      {/* PRICING */}
      <Pricing cfg={config.pricing} t={t} />

      {/* CTA BANNER */}
      <div style={{ background: t.ctaBg, padding: '72px 0', textAlign: 'center', borderTop: `0.5px solid ${t.border}` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 48px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px', lineHeight: 1.25 }}>
            {config.cta.heading}
            {config.cta.headingEm && <em style={{ color: t.accentMid, fontStyle: 'normal' }}> {config.cta.headingEm}</em>}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 30, lineHeight: 1.7 }}>{config.cta.body}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ background: '#fff', color: t.accent, fontSize: 16, fontWeight: 700, padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
              {config.cta.button}
            </button>
            {config.cta.button2 && (
              <button style={{ background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 600, padding: '14px 30px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                {config.cta.button2}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: '22px 32px', borderTop: `0.5px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.pageBg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {config.showLogo && (
            <Image src="/LEXiOX.png" alt="LEXiOX" width={60} height={24} style={{ height: 20, width: 'auto', objectFit: 'contain', opacity: 0.5 }} unoptimized />
          )}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['개인정보처리방침', '이용약관', '문의'].map((link) => (
            <a key={link} href="#" style={{ fontSize: 12, color: t.textSub, textDecoration: 'none', cursor: 'pointer' }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
