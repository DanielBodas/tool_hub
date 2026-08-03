import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { StorageOrganizerModule } from "@/modules/storage-organizer/StorageOrganizerModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function StorageOrganizerPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_storage-organizer")?.value === "true";

  if (!session && !isUnlocked) {
    return (
      <ToolSecurityGate toolId="storage-organizer" toolName="Organizador de Trastero" />
    );
  }

  return (
    <ToolBaseLayout toolName="Organizador de Trastero">
      <StorageOrganizerModule />
    </ToolBaseLayout>
  );
}
