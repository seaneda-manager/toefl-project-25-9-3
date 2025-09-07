// apps/web/lib/analytics.ts
import mixpanel from 'mixpanel-browser';

// 환경 변수 기반으로 analytics 켜고 끄기
export const isAnalyticsEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

// 초기화 (프로덕션 + ENABLE_ANALYTICS=true 일 때만 실행)
export function initAnalytics() {
  if (isAnalyticsEnabled) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? '', {
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
}

// 이벤트 트래킹 함수
export function track(event: string, props?: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.track(event, props);
  }
}

// 사용자 ID 설정
export function identify(userId: string) {
  if (isAnalyticsEnabled) {
    mixpanel.identify(userId);
  }
}

// 사용자 속성 등록
export function setUserProperties(props: Record<string, any>) {
  if (isAnalyticsEnabled) {
    mixpanel.people.set(props);
  }
}
