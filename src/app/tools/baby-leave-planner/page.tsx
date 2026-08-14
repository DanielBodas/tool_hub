import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BabyLeavePlannerModule } from "@/modules/baby-leave-planner/BabyLeavePlannerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions, isToolAllowedForUser } from "@/lib/auth";

export default async function BabyLeavePlannerPage() {
  const toolId = "baby-leave-planner";
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlockedByCookie =
    cookieStore.get(`auth_tool_${toolId}`)?.value === "true";
  const isAllowedBySession = isToolAllowedForUser(session, toolId);

  if (!isUnlockedByCookie && !isAllowedBySession) {
    return (
      <ToolSecurityGate
        toolId={toolId}
        toolName="Permiso de Nacimiento"
      />
    );
  }

  return (
    <ToolBaseLayout
      toolName="Permiso de Nacimiento"
    >
      <BabyLeavePlannerModule />
    </ToolBaseLayout>
  );
}
