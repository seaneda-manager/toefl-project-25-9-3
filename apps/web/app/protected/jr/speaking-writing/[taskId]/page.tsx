import { getServiceSupabase } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import JrSpeakingWritingClient from "./_components/JrSpeakingWritingClient";

export default async function JrSpeakingWritingPage({
  params,
}: {
  params: { taskId: string };
}) {
  const supabase = getServiceSupabase();

  const { data: task, error } = await supabase
    .from("jr_speaking_writing_tasks")
    .select("*")
    .eq("id", params.taskId)
    .single();

  if (error || !task) {
    notFound();
  }

  return (
    <JrSpeakingWritingClient
      taskId={params.taskId}
      taskType={task.task_type}
      prompt={task.prompt}
      dueDate={task.due_date}
    />
  );
}
