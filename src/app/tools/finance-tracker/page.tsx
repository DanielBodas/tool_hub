import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { FinanceTrackerModule } from "@/modules/finance-tracker/FinanceTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions, isToolAllowedForUser } from "@/lib/auth";

export default async function FinanceTrackerPage() {
  const toolId = "finance-tracker";
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlockedByCookie =
    cookieStore.get(`auth_tool_${toolId}`)?.value === "true";
  const isAllowedBySession = isToolAllowedForUser(session, toolId);

  if (!isUnlockedByCookie && !isAllowedBySession) {
    return (
      <ToolSecurityGate toolId={toolId} toolName="Gestor Financiero" />
    );
  }

  return (
    <ToolBaseLayout toolName="Gestor Financiero">
      <FinanceTrackerModule />
    </ToolBaseLayout>
  );
}
