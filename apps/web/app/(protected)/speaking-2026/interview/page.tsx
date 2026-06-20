// apps/web/app/(protected)/speaking_2026/interview/page.tsx
"use client";

import InterviewRunner, {
  InterviewQuestion,
} from "../components/InterviewRunner";

const demoQuestions: InterviewQuestion[] = [
  {
    id: "q1",
    question:
      "Do you prefer to study alone or with other people? Explain your preference.",
    answerSeconds: 20,
  },
  {
    id: "q2",
    question:
      "Tell me about a time when you had to solve a problem quickly. What did you do?",
    answerSeconds: 20,
  },
  {
    id: "q3",
    question:
      "Do you agree or disagree that smartphones make life easier? Give reasons and examples.",
    answerSeconds: 20,
  },
  {
    id: "q4",
    question:
      "What kind of job would you like to have in the future, and why?",
    answerSeconds: 20,
  },
];

export default function SpeakingInterviewPage() {
  return (
    <main className="mx-auto space-y-6 pb-8 max-w-3xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Speaking 2026 ??Task 2: Take an Interview (?°ìŠµ)
        </h1>
        <p className="text-sm text-gray-600">
          ?¤ì œ ?œí—˜ì²˜ëŸ¼, ì§ˆë¬¸???£ê³  ê³§ë°”ë¡??µí•˜???¸í„°ë·??•ì‹ ?°ìŠµ?…ë‹ˆ??
          ì§€ê¸ˆì? ê°œë°œ/?™ìŠµ?©ìœ¼ë¡?ì§ˆë¬¸ ?ìŠ¤?¸ë„ ?¨ê»˜ ?œê³µ?˜ê³  ?ˆìŠµ?ˆë‹¤.
        </p>
      </header>

      <InterviewRunner
        questions={demoQuestions}
        mode="study"
        defaultAnswerSeconds={20}
        autoStartAfterAudio={false} // ì§ˆë¬¸ ?¤ì? ??ì§ì ‘ ?¹ìŒ ?œì‘ ?ŒëŸ¬???˜ê³ ,
        onComplete={(results) => {
          console.log("Interview complete:", results);
        }}
      />
    </main>
  );
}
