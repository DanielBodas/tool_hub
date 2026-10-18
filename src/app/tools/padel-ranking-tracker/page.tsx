import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { PadelRankingTrackerModule } from "@/modules/padel-ranking-tracker/PadelRankingTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

export default async function PadelRankingTrackerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_padel-ranking-tracker")?.value === "true";
  const isAllowed = isUserAllowedForTool(
    "padel-ranking-tracker",
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId="padel-ranking-tracker"
        toolName="Padel Ranking & RACE Tracker"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Padel Ranking & RACE Tracker">
      <PadelRankingTrackerModule />
    </ToolBaseLayout>
  );
}
