import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { Globe } from "lucide-react";

export default function ToolTwoPage() {
  return (
    <ToolBaseLayout toolId="tool-two" toolName="Herramienta Dos">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
          <Globe size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Herramienta Dos</h1>
          <p className="text-gray-500">Categoría: Web</p>
        </div>
      </div>

      <div className="border-t pt-8">
        <p className="text-gray-600 mb-6">
          Esta es una página de ejemplo para la Herramienta Dos. Ideal para herramientas basadas en servicios web o APIs.
        </p>

        <div className="space-y-4">
          <div className="p-4 border border-gray-100 rounded-lg bg-green-50/30">
            <h4 className="font-semibold text-green-800">Estado del Servicio</h4>
            <p className="text-sm text-green-600">Todos los sistemas operativos.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold mb-2">Consola de Herramienta</h3>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs">
              $ tool-two --status
              <br />
              Checking connections... OK
              <br />
              Ready to process data.
            </div>
          </div>
        </div>
      </div>
    </ToolBaseLayout>
  );
}
