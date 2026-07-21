import { getTools } from "@/config/tools";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Plus } from "lucide-react";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_dashboard")?.value === "true";

  if (!session && !isUnlocked) {
    redirect("/login");
  }

  const tools = await getTools();

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles size={12} /> ToolHub Platform
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Panel de Herramientas
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Selecciona una herramienta para acceder a su espacio de trabajo dedicado.
          </p>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative bg-card hover:bg-muted/40 p-6 rounded-3xl border border-border/80 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div>
                <div className="flex justify-between items-start mb-5">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-xs">
                    <Icon size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <ArrowUpRight
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                      size={18}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-6 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {tool.category}
                </span>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                  Abrir herramienta &rarr;
                </span>
              </div>
            </Link>
          );
        })}

        {/* Add Tool Placeholder Card */}
        <div className="p-6 rounded-3xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-center bg-card/20 hover:bg-card/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Plus size={24} />
          </div>
          <h4 className="font-bold text-foreground mb-1">
            ¿Quieres añadir una miniherramienta?
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            Añade un nuevo módulo en <code className="text-primary font-mono text-[11px]">src/modules/&lt;nombre&gt;</code> y aparecerá aquí automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
