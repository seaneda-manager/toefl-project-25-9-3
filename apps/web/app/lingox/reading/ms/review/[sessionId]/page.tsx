// apps/web/app/lingox/reading/ms/review/[sessionId]/page.tsx
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default function Page({ params }: { params: { sessionId: string } }) {
  redirect(`/reading/review/${encodeURIComponent(params.sessionId)}?profileId=lingox_ms`);
}