import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { FinanceTrackerModule } from "@/modules/finance-tracker/FinanceTrackerModule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isToolAllowed } from "@/lib/security";
import { redirect } from "next/navigation";

export default async function FinanceTrackerPage() {
  const session = await getServerSession(authOptions);
  const toolId = "finance-tracker";
  const toolName = "Gestor Financiero";

  if (!session) {
    redirect("/login");
  }

  if (!isToolAllowed(toolId, session)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permiso para acceder a esta herramienta.</p>
        </div>
      </div>
    );
  }

  return (
    <ToolBaseLayout toolId={toolId} toolName={toolName}>
      <FinanceTrackerModule />
    </ToolBaseLayout>
  );
}
