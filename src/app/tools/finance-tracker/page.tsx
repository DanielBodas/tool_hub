import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { FinanceTrackerModule } from "@/modules/finance-tracker/FinanceTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isToolAllowed } from "@/lib/security";

export default async function FinanceTrackerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_finance-tracker")?.value === "true";

  if (!session && !isUnlocked) {
    return (
      <ToolSecurityGate toolId="finance-tracker" toolName="Gestor Financiero" />
    );
  }

  return (
    <ToolBaseLayout toolId="finance-tracker" toolName="Gestor Financiero">
      <FinanceTrackerModule />
    </ToolBaseLayout>
  );
}
