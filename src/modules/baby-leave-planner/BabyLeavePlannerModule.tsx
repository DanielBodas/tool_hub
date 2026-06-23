"use client";

import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Baby, Plus, Trash2, User, Info, Settings, AlertTriangle } from "lucide-react";
import {
  LeaveBlock,
  calculateMandatoryLeave,
  addDays,
  formatDate,
  calculateEndDate,
  countEffectiveLeaveDays
} from "./leaveUtils";

export function BabyLeavePlannerModule() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [flexibleBlocks, setFlexibleBlocks] = useState<LeaveBlock[]>([]);

  const birthDateObj = useMemo(() => birthDate ? new Date(birthDate) : null, [birthDate]);
  const birthWeekday = birthDateObj ? birthDateObj.getDay() : null;

  const mandatoryMother = useMemo(() => birthDateObj ? calculateMandatoryLeave(birthDateObj, "mother") : null, [birthDateObj]);
  const mandatoryFather = useMemo(() => birthDateObj ? calculateMandatoryLeave(birthDateObj, "father") : null, [birthDateObj]);

  const usedLeaveDaysMother = useMemo(() => {
    let days = 0;
    if (mandatoryMother) {
      days += countEffectiveLeaveDays(mandatoryMother.startDate, mandatoryMother.endDate, holidays);
    }
    flexibleBlocks.filter(b => b.parent === "mother").forEach(b => {
      days += countEffectiveLeaveDays(b.startDate, b.endDate, holidays);
    });
    return days;
  }, [mandatoryMother, flexibleBlocks, holidays]);

  const usedLeaveDaysFather = useMemo(() => {
    let days = 0;
    if (mandatoryFather) {
      days += countEffectiveLeaveDays(mandatoryFather.startDate, mandatoryFather.endDate, holidays);
    }
    flexibleBlocks.filter(b => b.parent === "father").forEach(b => {
      days += countEffectiveLeaveDays(b.startDate, b.endDate, holidays);
    });
    return days;
  }, [mandatoryFather, flexibleBlocks, holidays]);

  const totalWeeksMother = Math.floor(usedLeaveDaysMother / 7);
  const totalWeeksFather = Math.floor(usedLeaveDaysFather / 7);

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday].sort());
      setNewHoliday("");
    }
  };

  const removeHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const addFlexibleBlock = (parent: "mother" | "father") => {
    if (!birthDateObj) return;

    const lastBlock = [...flexibleBlocks].filter(b => b.parent === parent).sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
    const baseDate = lastBlock ? addDays(lastBlock.endDate, 1) : addDays(birthDateObj, 6 * 7);

    const newBlock: LeaveBlock = {
      id: crypto.randomUUID(),
      startDate: baseDate,
      endDate: calculateEndDate(baseDate, 1),
      type: "flexible",
      parent
    };

    setFlexibleBlocks([...flexibleBlocks, newBlock]);
  };

  const removeFlexibleBlock = (id: string) => {
    setFlexibleBlocks(flexibleBlocks.filter(b => b.id !== id));
  };

  const updateBlockDate = (id: string, dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;

    setFlexibleBlocks(flexibleBlocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          startDate: date,
          endDate: calculateEndDate(date, 1)
        };
      }
      return b;
    }));
  };

  const checkOverlap = (block: LeaveBlock) => {
    const others = [
      ...(block.parent === 'mother' ? [mandatoryMother] : [mandatoryFather]),
      ...flexibleBlocks.filter(b => b.id !== block.id && b.parent === block.parent)
    ].filter(Boolean) as (LeaveBlock | {startDate: Date, endDate: Date})[];

    return others.some(other => {
      return block.startDate <= other.endDate && block.endDate >= other.startDate;
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Baby className="text-blue-600" size={36} />
            Planificador de Permiso
          </h1>
          <p className="text-gray-600">Calcula y gestiona los 16 semanas de permiso por nacimiento en España.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Configuration Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-gray-500" />
              Configuración Inicial
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                {birthDateObj && (
                  <p className="text-xs text-gray-500 mt-1">
                    Día de la semana: {birthDateObj.toLocaleDateString('es-ES', { weekday: 'long' })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Festivos / Vacaciones (No consumen permiso)</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  <button
                    onClick={handleAddHoliday}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {holidays.map(h => (
                    <span key={h} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                      {h}
                      <button onClick={() => removeHoliday(h)} className="hover:text-red-600">
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
              <Info size={18} /> Resumen Normativa
            </h3>
            <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
              <li><strong>6 semanas obligatorias:</strong> Inmediatamente después del parto.</li>
              <li><strong>10 semanas voluntarias:</strong> En periodos semanales, hasta los 12 meses.</li>
              <li><strong>Día de inicio:</strong> Los periodos deben empezar el mismo día de la semana que el nacimiento ({birthDateObj?.toLocaleDateString('es-ES', { weekday: 'long' }) || '...'}).</li>
              <li><strong>Festivos:</strong> Los días marcados como festivos no descuentan del total de días de permiso.</li>
            </ul>
          </div>
        </div>

        {/* Planning Section */}
        <div className="space-y-6">
          {/* Mother */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-pink-50 flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                  <User size={20} /> Madre
                </h2>
                <span className="text-xs text-pink-700 font-medium">{usedLeaveDaysMother} días útiles (~{totalWeeksMother}/16 sem)</span>
              </div>
              <button
                onClick={() => addFlexibleBlock("mother")}
                disabled={!birthDate || usedLeaveDaysMother >= 112}
                className="text-pink-700 hover:bg-pink-100 p-1 rounded-lg transition disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {!birthDate && <p className="text-sm text-gray-400 italic text-center py-4">Introduce la fecha de nacimiento</p>}

              {mandatoryMother && (
                <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-pink-700 uppercase tracking-wider">Obligatorio (6 sem)</p>
                    <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                      {countEffectiveLeaveDays(mandatoryMother.startDate, mandatoryMother.endDate, holidays)} días útiles
                    </span>
                  </div>
                  <p className="text-sm font-medium">{formatDate(mandatoryMother.startDate)} al {formatDate(mandatoryMother.endDate)}</p>
                </div>
              )}

              {flexibleBlocks.filter(b => b.parent === "mother").map((block) => {
                const effectiveDays = countEffectiveLeaveDays(block.startDate, block.endDate, holidays);
                const isWrongWeekday = birthWeekday !== null && block.startDate.getDay() !== birthWeekday;
                const overlaps = checkOverlap(block);

                return (
                  <div key={block.id} className={`p-3 border rounded-xl transition ${overlaps ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-pink-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voluntario</p>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{effectiveDays} días útiles</span>
                      </div>
                      <button onClick={() => removeFlexibleBlock(block.id)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formatDate(block.startDate)}
                      onChange={(e) => updateBlockDate(block.id, e.target.value)}
                      className="text-sm font-bold border-none p-0 focus:ring-0 w-full bg-transparent"
                    />
                    <div className="flex justify-between items-end mt-1">
                      <p className="text-xs text-gray-500 italic">Fin: {formatDate(block.endDate)}</p>
                      {isWrongWeekday && (
                        <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold" title="Debería empezar en el mismo día de la semana que el nacimiento">
                          <AlertTriangle size={12} /> Día incorrecto
                        </div>
                      )}
                    </div>
                    {overlaps && <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10} /> Solapamiento detectado</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Father */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <User size={20} /> Padre / Segundo Progenitor
                </h2>
                <span className="text-xs text-blue-700 font-medium">{usedLeaveDaysFather} días útiles (~{totalWeeksFather}/16 sem)</span>
              </div>
              <button
                onClick={() => addFlexibleBlock("father")}
                disabled={!birthDate || usedLeaveDaysFather >= 112}
                className="text-blue-700 hover:bg-blue-100 p-1 rounded-lg transition disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {!birthDate && <p className="text-sm text-gray-400 italic text-center py-4">Introduce la fecha de nacimiento</p>}

              {mandatoryFather && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Obligatorio (6 sem)</p>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {countEffectiveLeaveDays(mandatoryFather.startDate, mandatoryFather.endDate, holidays)} días útiles
                    </span>
                  </div>
                  <p className="text-sm font-medium">{formatDate(mandatoryFather.startDate)} al {formatDate(mandatoryFather.endDate)}</p>
                </div>
              )}

              {flexibleBlocks.filter(b => b.parent === "father").map((block) => {
                const effectiveDays = countEffectiveLeaveDays(block.startDate, block.endDate, holidays);
                const isWrongWeekday = birthWeekday !== null && block.startDate.getDay() !== birthWeekday;
                const overlaps = checkOverlap(block);

                return (
                  <div key={block.id} className={`p-3 border rounded-xl transition ${overlaps ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voluntario</p>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{effectiveDays} días útiles</span>
                      </div>
                      <button onClick={() => removeFlexibleBlock(block.id)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formatDate(block.startDate)}
                      onChange={(e) => updateBlockDate(block.id, e.target.value)}
                      className="text-sm font-bold border-none p-0 focus:ring-0 w-full bg-transparent"
                    />
                    <div className="flex justify-between items-end mt-1">
                      <p className="text-xs text-gray-500 italic">Fin: {formatDate(block.endDate)}</p>
                      {isWrongWeekday && (
                        <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold" title="Debería empezar en el mismo día de la semana que el nacimiento">
                          <AlertTriangle size={12} /> Día incorrecto
                        </div>
                      )}
                    </div>
                    {overlaps && <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10} /> Solapamiento detectado</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
