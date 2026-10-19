import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { SupermarketPriceTrackerModule } from "@/modules/supermarket-price-tracker/SupermarketPriceTrackerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

const TOOL_ID = "supermarket-price-tracker";

export default async function SupermarketPriceTrackerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get(`auth_tool_${TOOL_ID}`)?.value === "true";
  const isAllowed = isUserAllowedForTool(
    TOOL_ID,
    session?.user?.email,
    session?.user?.role
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId={TOOL_ID}
        toolName="Histórico de Precios y Ofertas"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Histórico de Precios y Ofertas">
      <SupermarketPriceTrackerModule />
    </ToolBaseLayout>
  );
}
