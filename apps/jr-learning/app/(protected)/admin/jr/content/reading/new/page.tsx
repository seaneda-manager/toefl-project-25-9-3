import { getUserAndProfile } from "@/lib/getUserAndProfile";
import { redirect } from "next/navigation";
import ReadingEditorClient from "../_components/ReadingEditorClient";

export default async function NewReadingPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") redirect("/login");

  return <ReadingEditorClient />;
}
