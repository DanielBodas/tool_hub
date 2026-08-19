import { getTools } from "@/config/tools";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isToolVisibleForUser } from "@/lib/toolAccess";
import DashboardStore from "./DashboardStore";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_dashboard")?.value === "true";

  if (!session && !isUnlocked) {
    redirect("/login");
  }

  const allTools = await getTools();

  // Filter tools so that users without access only see tools configured as visible without access
  const visibleTools = allTools.filter((tool) =>
    isToolVisibleForUser(
      tool.id,
      session?.user?.email,
      session?.user?.role,
      cookieStore,
    ),
  );

  // Map tools to serializable props to avoid passing Lucide Icon functions to the Client Component
  const serializedTools = visibleTools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    href: tool.href,
  }));

  return (
    <div className="flex-grow flex flex-col bg-background">
      <DashboardStore tools={serializedTools} />
    </div>
  );
}
