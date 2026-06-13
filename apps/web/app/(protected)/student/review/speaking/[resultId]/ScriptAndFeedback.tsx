"use client";

import { useState } from "react";
import ScriptEditor from "./ScriptEditor";
import AiFeedbackPanel from "./AiFeedbackPanel";

export default function ScriptAndFeedback({
  resultId,
  initialScript,
  approxWords,
  approxSentences,
  initialFeedback,
}: {
  resultId: string;
  initialScript: string | null;
  approxWords?: number | null;
  approxSentences?: number | null;
  initialFeedback?: string | null;
}) {
  const [scriptChanged, setScriptChanged] = useState(false);

  return (
    <>
      <ScriptEditor
        resultId={resultId}
        initialScript={initialScript}
        approxWords={approxWords}
        approxSentences={approxSentences}
        onScriptChanged={() => setScriptChanged(true)}
      />
      {initialScript && (
        <AiFeedbackPanel
          resultId={resultId}
          initialFeedback={initialFeedback}
          scriptChanged={scriptChanged}
        />
      )}
    </>
  );
}
