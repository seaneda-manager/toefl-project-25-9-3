// apps/web/app/page.tsx
import LandingPageClient from "@/components/landing/LandingPageClient";

export const revalidate = 60;

export default function LandingPage() {
  return <LandingPageClient />;
}
