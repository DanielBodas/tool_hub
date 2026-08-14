import { getTools } from "@/config/tools";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardStore from "./DashboardStore";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_dashboard")?.value === "true";

  if (!session && !isUnlocked) {
    redirect("/login");
  }

  const tools = await getTools();

  // Map tools to serializable props to avoid passing Lucide Icon functions to the Client Component
  const serializedTools = tools.map((tool) => ({
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
