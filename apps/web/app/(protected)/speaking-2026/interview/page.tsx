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
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Speaking 2026 – Task 2: Take an Interview (연습)
        </h1>
        <p className="text-sm text-gray-600">
          실제 시험처럼, 질문을 듣고 곧바로 답하는 인터뷰 형식 연습입니다.
          지금은 개발/학습용으로 질문 텍스트도 함께 제공하고 있습니다.
        </p>
      </header>

      <InterviewRunner
        questions={demoQuestions}
        mode="study"
        defaultAnswerSeconds={20}
        autoStartAfterAudio={false} // 질문 들은 뒤 직접 녹음 시작 눌러도 되고,
        onComplete={(results) => {
          console.log("Interview complete:", results);
        }}
      />
    </main>
  );
}
