export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function Page({ params }: { params: { sessionId: string } }) {
  redirect(`/reading/review/${encodeURIComponent(params.sessionId)}?profileId=toefl_review`);
}