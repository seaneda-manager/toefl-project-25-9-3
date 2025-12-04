"use client";

import ListenConversation from "@/components/listening/ListenConversation";

export default function ListeningDemoPage() {
  return (
    <ListenConversation
      title="Listen to a conversation"
      imageSrc="/sample/conversation.png"
      audioSrc="/sample/conversation.mp3"
      choices={[
        "He is confused about the schedule.",
        "She is asking for permission.",
        "They are planning a project.",
        "He is giving directions."
      ]}
      onNext={(ans) => console.log("answer:", ans)}
    />
  );
}
