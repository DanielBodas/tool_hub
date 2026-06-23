import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { Calculator } from "lucide-react";

export default function ToolOnePage() {
  return (
    <ToolBaseLayout toolId="tool-one" toolName="Herramienta Uno">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
          <Calculator size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Herramienta Uno</h1>
          <p className="text-gray-500">Categoría: Productividad</p>
        </div>
      </div>

      <div className="border-t pt-8">
        <p className="text-gray-600 mb-6">
          Esta es una página de ejemplo para la Herramienta Uno. Aquí puedes implementar la funcionalidad específica de esta herramienta.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <h3 className="font-bold mb-2">Módulo A</h3>
            <p className="text-sm text-gray-500">Lógica particular de la herramienta.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <h3 className="font-bold mb-2">Módulo B</h3>
            <p className="text-sm text-gray-500">Interfaz heredada del template base.</p>
          </div>
        </div>
      </div>
    </ToolBaseLayout>
  );
}
