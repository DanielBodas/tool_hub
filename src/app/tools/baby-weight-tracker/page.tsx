import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BabyWeightTrackerModule } from "@/modules/baby-weight-tracker/BabyWeightTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions, isToolAllowedForUser } from "@/lib/auth";

export default async function BabyWeightTrackerPage() {
  const toolId = "baby-weight-tracker";
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlockedByCookie =
    cookieStore.get(`auth_tool_${toolId}`)?.value === "true";
  const isAllowedBySession = isToolAllowedForUser(session, toolId);

  if (!isUnlockedByCookie && !isAllowedBySession) {
    return (
      <ToolSecurityGate
        toolId={toolId}
        toolName="Seguimiento de Peso"
      />
    );
  }

  return (
    <ToolBaseLayout
      toolName="Seguimiento de Peso"
    >
      <BabyWeightTrackerModule />
    </ToolBaseLayout>
  );
}
