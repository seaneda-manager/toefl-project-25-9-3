// apps/web/app/(protected)/admin/content/new/page.tsx
import { redirect } from "next/navigation";

export default function AdminContentNewPage() {
  redirect("/admin/content/new/json");
}
