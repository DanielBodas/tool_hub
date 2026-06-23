import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { FinanceTrackerModule } from "@/modules/finance-tracker/FinanceTrackerModule";

export default function FinanceTrackerPage() {
  return (
    <ToolBaseLayout toolId="finance-tracker" toolName="Gestor Financiero">
      <FinanceTrackerModule />
    </ToolBaseLayout>
  );
}
