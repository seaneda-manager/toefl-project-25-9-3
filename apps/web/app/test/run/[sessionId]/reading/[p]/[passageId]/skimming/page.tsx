'use client';
import RunnerLayout from '@/components/test/RunnerLayout';
import StickyTimer from '@/components/test/StickyTimer';
import QuestionPane from '@/components/test/QuestionPane';
import PassagePane from '@/components/test/PassagePane';
import { useParams } from 'next/navigation';

export default function ReadingPage(){
  const { sessionId, passageId } = useParams() as { sessionId:string; passageId:string };
  // TODO: fetch passage/questions by ids; wire submit/prev/next
  return (
    <RunnerLayout
      header={<StickyTimer section="reading" totalSec={3600} />}
      left={<QuestionPane />}
      right={<PassagePane />}
      footer={<div className="flex gap-2 w-full">
        <button>Prev</button>
        <button className="btn-primary">Submit & Next</button>
        <button className="ml-auto">End Section</button>
      </div>}
    />
  );
}