import { getUserAndProfile } from "@/lib/getUserAndProfile";
import { redirect } from "next/navigation";
import GrammarEditorClient from "../_components/GrammarEditorClient";

export default async function NewGrammarPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") redirect("/login");

  return <GrammarEditorClient />;
}
