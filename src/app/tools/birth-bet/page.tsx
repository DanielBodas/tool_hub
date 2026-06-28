import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BirthBetModule } from "@/modules/birth-bet/BirthBetModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function BirthBetPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_birth-bet")?.value === "true";

  if (!session && !isUnlocked) {
    return (
      <ToolSecurityGate
        toolId="birth-bet"
        toolName="¿Cuándo Nacerá Irene?"
      />
    );
  }

  return (
    <ToolBaseLayout
      toolId="birth-bet"
      toolName="¿Cuándo Nacerá Irene?"
    >
      <BirthBetModule />
    </ToolBaseLayout>
  );
}
