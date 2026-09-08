import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { TicketGuaranteeManagerModule } from "@/modules/ticket-guarantee-manager/TicketGuaranteeManagerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

const TOOL_ID = "ticket-guarantee-manager";
const TOOL_NAME = "Gestor de Garantías y Devoluciones";

export default async function TicketGuaranteeManagerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get(`auth_tool_${TOOL_ID}`)?.value === "true";
  const isAllowed = isUserAllowedForTool(
    TOOL_ID,
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId={TOOL_ID}
        toolName={TOOL_NAME}
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName={TOOL_NAME}>
      <TicketGuaranteeManagerModule />
    </ToolBaseLayout>
  );
}
