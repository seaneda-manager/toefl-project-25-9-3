// normalized utf8
// apps/web/lib/analytics.ts
import mixpanel from 'mixpanel-browser';

// ?�경 변??기반?�로 analytics 켜고 ?�기
export const isAnalyticsEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

// 초기??(?�로?�션 + ENABLE_ANALYTICS=true ???�만 ?�행)
export function initAnalytics() {
  if (isAnalyticsEnabled) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? '', {
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
}

// ?�벤???�래???�수
export function track(event: string, props?: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.track(event, props);
  }
}

// ?�용??ID ?�정
export function identify(userId: string) {
  if (isAnalyticsEnabled) {
    mixpanel.identify(userId);
  }
}

// ?�용???�성 ?�록
export function setUserProperties(props: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.people.set(props);
  }
}

