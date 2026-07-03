import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { BirthCalendarModule } from "@/modules/birth-calendar/BirthCalendarModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function BirthCalendarPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_birth-calendar")?.value === "true";

  if (!session && !isUnlocked) {
    return (
      <ToolSecurityGate
        toolId="birth-calendar"
        toolName="Calendario de Nacimiento"
      />
    );
  }

  return (
    <ToolBaseLayout
      toolId="birth-calendar"
      toolName="Calendario de Nacimiento"
    >
      <BirthCalendarModule />
    </ToolBaseLayout>
  );
}
