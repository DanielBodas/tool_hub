import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BirthBetModule } from "@/modules/birth-bet/BirthBetModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";

export default async function BirthBetPage() {
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_birth-bet")?.value === "true";

  // For birth-bet, we ALWAYS require the PIN (isUnlocked) because it determines group access.
  // Session alone is not enough to know which groups to display.
  if (!isUnlocked) {
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
