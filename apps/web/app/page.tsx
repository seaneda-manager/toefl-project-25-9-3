import LandingPageClient from "@/components/landing/LandingPageClient";

export const revalidate = 60;

export default async function LandingPage() {
  let savedConfig: Record<string, unknown> | undefined;
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/landing-config`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        savedConfig = data;
      }
    }
  } catch {}

  return <LandingPageClient savedConfig={savedConfig} />;
}
