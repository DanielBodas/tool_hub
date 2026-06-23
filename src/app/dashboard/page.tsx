import { tools } from "@/config/tools";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SecurityGate } from "@/components/SecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_dashboard")?.value === "true";

  if (!session && !isUnlocked) {
    return <SecurityGate />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel de Herramientas</h1>
          <p className="text-lg text-gray-600">Selecciona una de tus herramientas disponibles para comenzar.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Icon size={24} />
                  </div>
                  <ArrowUpRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{tool.description}</p>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full self-start">
                  {tool.category}
                </div>
              </Link>
            );
          })}

          <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 font-medium">¿Necesitas otra herramienta?</p>
            <button className="mt-4 text-blue-600 font-bold hover:underline">Contactar Soporte</button>
          </div>
        </div>
    </div>
  );
}
