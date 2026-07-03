"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react";

export function BirthCalendarModule() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  const calendarData = useMemo(() => {
    const data = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const birthDate = new Date(d);

      // Calculate conception date: Birth Date - 267 days to match user image reference
      // (Jan 1st -> April 9th in a non-leap year is 267 days)
      const conceptionDate = new Date(birthDate);
      conceptionDate.setDate(birthDate.getDate() - 267);

      data.push({
        birthDate: new Date(birthDate),
        conceptionDate: new Date(conceptionDate),
        gestationWeeks: "40.0",
      });
    }
    return data;
  }, [year]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return calendarData;
    const term = searchTerm.toLowerCase();
    return calendarData.filter((item) => {
      const bStr = item.birthDate.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
      }).toLowerCase();
      const cStr = item.conceptionDate.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
      }).toLowerCase();
      return bStr.includes(term) || cStr.includes(term);
    });
  }, [calendarData, searchTerm]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    }).replace(".", "");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tabla de Referencia</h2>
            <p className="text-sm text-muted-foreground">Cálculo estimado de fecha de concepción</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-2xl">
          <button
            onClick={() => setYear(year - 1)}
            className="p-2 hover:bg-card rounded-xl transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-bold text-foreground">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            className="p-2 hover:bg-card rounded-xl transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Buscar por fecha (ej: enero, 15 may)..."
          className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  F. Prob. Parto
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">
                  Semana Gestación
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Fecha Concepción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr
                    key={item.birthDate.toISOString()}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      {formatDate(item.birthDate)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-black">
                        {item.gestationWeeks}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary group-hover:translate-x-1 transition-transform inline-block">
                      {formatDate(item.conceptionDate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium">
                    No se encontraron resultados para "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
          * Los cálculos se basan en una duración estándar de 280 días (40 semanas) desde la última regla, estimando la concepción 14 días después.
          Esta tabla usa un offset de 267 días para alinear con los estándares de referencia comunes.
        </p>
      </div>
    </div>
  );
}
