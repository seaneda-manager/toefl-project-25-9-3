// apps/web/lib/analytics.ts
import mixpanel from 'mixpanel-browser';

// ?섍꼍 蹂??湲곕컲?쇰줈 analytics 耳쒓퀬 ?꾧린
export const isAnalyticsEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

// 珥덇린??(?꾨줈?뺤뀡 + ENABLE_ANALYTICS=true ???뚮쭔 ?ㅽ뻾)
export function initAnalytics() {
  if (isAnalyticsEnabled) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? '', {
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
}

// ?대깽???몃옒???⑥닔
export function track(event: string, props?: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.track(event, props);
  }
}

// ?ъ슜??ID ?ㅼ젙
export function identify(userId: string) {
  if (isAnalyticsEnabled) {
    mixpanel.identify(userId);
  }
}

// ?ъ슜???띿꽦 ?깅줉
export function setUserProperties(props: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.people.set(props);
  }
}

