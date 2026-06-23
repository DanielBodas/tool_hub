import Link from "next/link";
import { ArrowLeft, PiggyBank, TrendingUp, CreditCard, Wallet, PlusCircle } from "lucide-react";
import { SecurityGate } from "@/components/SecurityGate";

export default function FinanceTrackerPage() {
  return (
    <SecurityGate toolId="finance-tracker" toolName="Gestor Financiero">
      <div className="container mx-auto px-4 py-12">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:underline mb-8 gap-2">
          <ArrowLeft size={16} /> Volver al Panel
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <PiggyBank size={24} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Gestor Financiero</h1>
            </div>
            <p className="text-gray-600">Controla tu salud financiera: ahorros, inversiones y préstamos.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-sm">
            <PlusCircle size={20} /> Nueva Entrada
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Ahorros */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">+2.4%</span>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-1">Total Ahorros</h3>
            <p className="text-3xl font-bold text-gray-900">12.450,00 €</p>
          </div>

          {/* Inversiones */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">+12.8%</span>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-1">Inversiones</h3>
            <p className="text-3xl font-bold text-gray-900">45.200,00 €</p>
          </div>

          {/* Préstamos */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">-500 €/mes</span>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-1">Deuda Pendiente</h3>
            <p className="text-3xl font-bold text-gray-900">8.900,00 €</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recientes */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Movimientos Recientes</h2>
            </div>
            <div className="divide-y">
              {[
                { label: "Compra Acciones AAPL", cat: "Inversión", amount: "-1.200 €", date: "Hoy" },
                { label: "Ahorro Mensual", cat: "Ahorro", amount: "+400 €", date: "Ayer" },
                { label: "Cuota Préstamo Coche", cat: "Préstamo", amount: "-250 €", date: "15 Jun" },
              ].map((item, i) => (
                <div key={i} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                  <div>
                    <p className="font-bold text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.cat} • {item.date}</p>
                  </div>
                  <p className={`font-bold ${item.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.amount}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 text-center">
              <button className="text-blue-600 font-bold hover:underline">Ver todos los movimientos</button>
            </div>
          </div>

          {/* Resumen Inversiones */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Distribución de Inversiones</h2>
            <div className="space-y-6">
              {[
                { label: "Acciones", percent: 65, color: "bg-blue-500" },
                { label: "Cripto", percent: 20, color: "bg-purple-500" },
                { label: "Bonos", percent: 15, color: "bg-green-500" },
              ].map((asset, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{asset.label}</span>
                    <span className="text-gray-500">{asset.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${asset.color} h-2 rounded-full`} style={{ width: `${asset.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SecurityGate>
  );
}
