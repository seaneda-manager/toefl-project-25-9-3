// apps/web/lib/analytics.ts
import mixpanel from 'mixpanel-browser';

// ?òÍ≤Ω Î≥Ä??Í∏∞Î∞ò?ºÎ°ú analytics ÏºúÍ≥† ?ÑÍ∏∞
export const isAnalyticsEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

// Ï¥àÍ∏∞??(?ÑÎ°ú?ïÏÖò + ENABLE_ANALYTICS=true ???åÎßå ?§Ìñâ)
export function initAnalytics() {
  if (isAnalyticsEnabled) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? '', {
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
}

// ?¥Î≤§???∏Îûò???®Ïàò
export function track(event: string, props?: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.track(event, props);
  }
}

// ?¨Ïö©??ID ?§Ï†ï
export function identify(userId: string) {
  if (isAnalyticsEnabled) {
    mixpanel.identify(userId);
  }
}

// ?¨Ïö©???çÏÑ± ?±Î°ù
export function setUserProperties(props: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.people.set(props);
  }
}

