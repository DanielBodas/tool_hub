import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BabyWeightTrackerModule } from "@/modules/baby-weight-tracker/BabyWeightTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

export default async function BabyWeightTrackerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-weight-tracker")?.value === "true";
  const isAllowed = isUserAllowedForTool(
    "baby-weight-tracker",
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId="baby-weight-tracker"
        toolName="Seguimiento de Peso"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Seguimiento de Peso">
      <BabyWeightTrackerModule />
    </ToolBaseLayout>
  );
}
