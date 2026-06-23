import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";

export default function ToolOnePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:underline mb-8 gap-2">
        <ArrowLeft size={16} /> Volver al Panel
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
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
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-bold mb-2">Función A</h3>
              <p className="text-sm text-gray-500">Descripción de la funcionalidad A de esta herramienta.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-bold mb-2">Función B</h3>
              <p className="text-sm text-gray-500">Descripción de la funcionalidad B de esta herramienta.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
