import { getTools } from "@/config/tools";
import { Sparkles } from "lucide-react";
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
      {/* Header Banner */}
      <div className="container mx-auto px-6 pt-10 pb-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-3">
              <Sparkles size={12} /> ToolHub Platform
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Panel de Herramientas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Accede a tus espacios de trabajo dedicados de forma rápida y organizada.
            </p>
          </div>
        </div>
      </div>

      {/* Steam-style Interactive Store App */}
      <DashboardStore tools={serializedTools} />
    </div>
  );
}
