import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { MealPlannerModule } from "@/modules/meal-planner/MealPlannerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

export default async function MealPlannerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_meal-planner")?.value === "true";
  const isAllowed = isUserAllowedForTool(
    "meal-planner",
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId="meal-planner"
        toolName="Menú Semanal y Compra"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Menú Semanal y Compra">
      <MealPlannerModule />
    </ToolBaseLayout>
  );
}
