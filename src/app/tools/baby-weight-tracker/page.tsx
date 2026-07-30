import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BabyWeightTrackerModule } from "@/modules/baby-weight-tracker/BabyWeightTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function BabyWeightTrackerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-weight-tracker")?.value === "true";

  if (!session && !isUnlocked) {
    return (
      <ToolSecurityGate
        toolId="baby-weight-tracker"
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
