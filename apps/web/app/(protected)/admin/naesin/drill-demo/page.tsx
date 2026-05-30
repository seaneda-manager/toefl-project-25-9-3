import NaesinDrillShell from "@/components/naesin/drill/NaesinDrillShell";
import { MOCK_NAESIN_PASSAGE } from "@/components/naesin/drill/mock";

export const dynamic = "force-dynamic";

export default function StudentNaesinDrillPage() {
  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
          Student / Naesin / Drill
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Lingo-X 내신 Drill
        </h1>
      </header>

      <NaesinDrillShell initialPassage={MOCK_NAESIN_PASSAGE} />
    </main>
  );
}
