import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BabyLeavePlannerModule } from "@/modules/baby-leave-planner/BabyLeavePlannerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function BabyLeavePlannerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_tool_baby-leave-planner")?.value === "true";

  if (!session && !isUnlocked) {
    return <ToolSecurityGate toolId="baby-leave-planner" toolName="Permiso de Nacimiento" />;
  }

  return (
    <ToolBaseLayout toolId="baby-leave-planner" toolName="Permiso de Nacimiento">
      <BabyLeavePlannerModule />
    </ToolBaseLayout>
  );
}
