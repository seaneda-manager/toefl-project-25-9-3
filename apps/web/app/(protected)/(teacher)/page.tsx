// apps/web/app/(protected)/(teacher)/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Page() {
  redirect('/teacher/content');
}
