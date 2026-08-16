import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BabyLeavePlannerModule } from "@/modules/baby-leave-planner/BabyLeavePlannerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

export default async function BabyLeavePlannerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-leave-planner")?.value === "true";
  const isAllowed = isUserAllowedForTool(
    "baby-leave-planner",
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId="baby-leave-planner"
        toolName="Permiso de Nacimiento"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Permiso de Nacimiento">
      <BabyLeavePlannerModule />
    </ToolBaseLayout>
  );
}
