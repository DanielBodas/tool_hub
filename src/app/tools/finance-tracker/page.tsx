import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { FinanceTrackerModule } from "@/modules/finance-tracker/FinanceTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

export default async function FinanceTrackerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_finance-tracker")?.value === "true";
  const isAllowed = isUserAllowedForTool(
    "finance-tracker",
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId="finance-tracker"
        toolName="Gestor Financiero"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Gestor Financiero">
      <FinanceTrackerModule />
    </ToolBaseLayout>
  );
}
