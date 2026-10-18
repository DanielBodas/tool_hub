import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { PadelRankingTrackerModule } from "@/modules/padel-ranking-tracker/PadelRankingTrackerModule";

export default function PadelRankingTrackerPage() {
  return (
    <ToolBaseLayout toolName="Padel Ranking & RACE Tracker">
      <PadelRankingTrackerModule />
    </ToolBaseLayout>
  );
}
