"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Baby,
  Plus,
  Trash2,
  User,
  Settings,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit2
} from "lucide-react";
import {
  LeaveBlock,
  Allowance,
  ConsumptionMode,
  addDays,
  formatDate,
  calculateEndDate,
  countEffectiveLeaveDays,
  getDaysInMonth,
  getLeaveStatus,
  isHoliday
} from "./leaveUtils";

export function BabyLeavePlannerModule() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [flexibleBlocks, setFlexibleBlocks] = useState<LeaveBlock[]>([]);

  const [allowances, setAllowances] = useState<Allowance[]>([
    { id: 'birth-mother', name: 'Permiso Nacimiento', totalDays: 112, parent: 'mother', consumptionMode: 'weeks' },
    { id: 'birth-father', name: 'Permiso Nacimiento', totalDays: 112, parent: 'father', consumptionMode: 'weeks' }
  ]);

  const [editingAllowance, setEditingAllowance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'calendar'>('config');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const birthDateObj = useMemo(() => birthDate ? new Date(birthDate) : null, [birthDate]);
  const birthWeekday = birthDateObj ? birthDateObj.getDay() : null;

  // Derive all blocks including mandatory ones
  const allBlocks = useMemo(() => {
    const blocks = [...flexibleBlocks];
    if (birthDateObj) {
      const motherMandatory: LeaveBlock = {
        id: 'mandatory-mother',
        allowanceId: 'birth-mother',
        startDate: birthDateObj,
        endDate: calculateEndDate(birthDateObj, 42),
        parent: 'mother'
      };
      const fatherMandatory: LeaveBlock = {
        id: 'mandatory-father',
        allowanceId: 'birth-father',
        startDate: birthDateObj,
        endDate: calculateEndDate(birthDateObj, 42),
        parent: 'father'
      };
      return [motherMandatory, fatherMandatory, ...blocks];
    }
    return blocks;
  }, [flexibleBlocks, birthDateObj]);

  const getUsedDays = (allowanceId: string) => {
    return allBlocks
      .filter(b => b.allowanceId === allowanceId)
      .reduce((acc, b) => acc + countEffectiveLeaveDays(b.startDate, b.endDate, holidays), 0);
  };

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday].sort());
      setNewHoliday("");
    }
  };

  const removeHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const addAllowance = (parent: 'mother' | 'father') => {
    const newAl: Allowance = {
      id: crypto.randomUUID(),
      name: 'Nuevo Permiso',
      totalDays: 1,
      parent,
      consumptionMode: 'days'
    };
    setAllowances([...allowances, newAl]);
    setEditingAllowance(newAl.id);
  };

  const updateAllowance = (id: string, updates: Partial<Allowance>) => {
    setAllowances(allowances.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAllowance = (id: string) => {
    setAllowances(allowances.filter(a => a.id !== id));
    setFlexibleBlocks(flexibleBlocks.filter(b => b.allowanceId !== id));
  };

  const addBlock = (allowance: Allowance) => {
    if (!birthDateObj) return;

    const used = getUsedDays(allowance.id);
    if (used >= allowance.totalDays) return;

    let daysToTake = 1;
    if (allowance.consumptionMode === 'weeks') daysToTake = 7;
    if (allowance.consumptionMode === 'all') daysToTake = allowance.totalDays - used;

    const lastBlock = [...allBlocks].filter(b => b.parent === allowance.parent).sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
    const baseDate = lastBlock ? addDays(lastBlock.endDate, 1) : birthDateObj;

    const newBlock: LeaveBlock = {
      id: crypto.randomUUID(),
      allowanceId: allowance.id,
      startDate: baseDate,
      endDate: calculateEndDate(baseDate, daysToTake),
      parent: allowance.parent
    };

    setFlexibleBlocks([...flexibleBlocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setFlexibleBlocks(flexibleBlocks.filter(b => b.id !== id));
  };

  const updateBlockDate = (id: string, dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;

    setFlexibleBlocks(flexibleBlocks.map(b => {
      if (b.id === id) {
        const diff = Math.ceil(Math.abs(b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          ...b,
          startDate: date,
          endDate: calculateEndDate(date, diff)
        };
      }
      return b;
    }));
  };

  const checkOverlap = (block: LeaveBlock) => {
    return allBlocks.some(other => {
      if (other.id === block.id || other.parent !== block.parent) return false;
      return block.startDate <= other.endDate && block.endDate >= other.startDate;
    });
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDayWeekday = daysInMonth[0].getDay();
  const adjustedFirstDay = (firstDayWeekday + 6) % 7;
  const paddingDays = Array.from({ length: adjustedFirstDay });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Baby className="text-blue-600" size={36} />
            Planificador de Permisos
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Gestiona tus permisos y vacaciones de forma sencilla y visual.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            Configuración
          </div>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} />
            Calendario y Planes
          </div>
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings size={20} className="text-gray-500" />
                Datos Generales
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Festivos de Empresa</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                    <button onClick={handleAddHoliday} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                      <Plus size={24} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {holidays.map(h => (
                      <span key={h} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                        {h}
                        <button onClick={() => removeHoliday(h)} className="hover:text-red-600"><Trash2 size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {(['mother', 'father'] as const).map((p) => (
              <div key={p} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2 capitalize text-lg">
                    <User size={20} className={p === 'mother' ? 'text-pink-500' : 'text-blue-500'} />
                    Permisos {p === 'mother' ? 'Madre' : 'Padre'}
                  </h3>
                  <button onClick={() => addAllowance(p)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> Añadir
                  </button>
                </div>
                <div className="space-y-4">
                  {allowances.filter(a => a.parent === p).map(a => (
                    <div key={a.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors bg-gray-50/30">
                      {editingAllowance === a.id ? (
                        <div className="space-y-3">
                          <input
                            className="text-sm font-bold w-full border-b border-blue-200 focus:border-blue-500 outline-none bg-transparent py-1"
                            value={a.name}
                            onChange={e => updateAllowance(a.id, { name: e.target.value })}
                            placeholder="Nombre del permiso"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-gray-400 block uppercase font-bold mb-1">Días Totales</label>
                              <input
                                type="number"
                                className="w-full border-b border-gray-200 text-sm py-1 bg-transparent"
                                value={a.totalDays}
                                onChange={e => updateAllowance(a.id, { totalDays: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block uppercase font-bold mb-1">Modo de Uso</label>
                              <select
                                className="w-full text-sm bg-transparent py-1 border-b border-gray-200"
                                value={a.consumptionMode}
                                onChange={e => updateAllowance(a.id, { consumptionMode: e.target.value as ConsumptionMode })}
                              >
                                <option value="days">Día a día</option>
                                <option value="weeks">Semanas (7d)</option>
                                <option value="all">Todo junto</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => deleteAllowance(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                            <button onClick={() => setEditingAllowance(null)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-700 transition">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{a.totalDays} días • {a.consumptionMode === 'weeks' ? 'Semanal' : a.consumptionMode === 'all' ? 'Bloque único' : 'Flexibilidad total'}</p>
                            <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                              <div
                                className={`h-full ${p === 'mother' ? 'bg-pink-400' : 'bg-blue-400'} transition-all duration-500`}
                                style={{ width: `${Math.min(100, (getUsedDays(a.id) / a.totalDays) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-1.5">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Progreso</span>
                              <span className="text-[10px] text-gray-600 font-bold">{getUsedDays(a.id)} / {a.totalDays} d</span>
                            </div>
                          </div>
                          <button onClick={() => setEditingAllowance(a.id)} className="ml-4 text-gray-400 hover:text-blue-500 p-1 hover:bg-blue-50 rounded-lg transition"><Edit2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon size={20} className="text-blue-600" /> Calendario Visual</h2>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition"><ChevronLeft size={20} /></button>
                  <span className="font-extrabold text-gray-900 min-w-[140px] text-center capitalize text-sm">{viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition"><ChevronRight size={20} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">{d}</div>)}
                {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                {daysInMonth.map(day => {
                  const status = getLeaveStatus(day, allBlocks);
                  const holiday = isHoliday(day, holidays);
                  const isBoth = status.mother && status.father;
                  const isMother = status.mother;
                  const isFather = status.father;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  let bgColor = "bg-white text-gray-700 border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer";
                  if (isBoth) bgColor = "bg-gradient-to-br from-pink-400 to-blue-400 text-white shadow-sm ring-1 ring-white/20";
                  else if (isMother) bgColor = "bg-pink-500 text-white shadow-sm ring-1 ring-white/20";
                  else if (isFather) bgColor = "bg-blue-500 text-white shadow-sm ring-1 ring-white/20";
                  else if (holiday) bgColor = "bg-amber-100 text-amber-700 font-bold border-amber-200";
                  else if (isWeekend) bgColor = "bg-gray-50 text-gray-300";

                  return (
                  <button
                      key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square flex items-center justify-center text-xs md:text-sm rounded-xl font-medium relative group ${bgColor}`}
                    >
                      {day.getDate()}
                    {!isBoth && !isMother && !isFather && !holiday && !isWeekend && (
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-xl transition-colors flex items-center justify-center">
                        <Plus size={12} className="opacity-0 group-hover:opacity-100 text-blue-500" />
                      </div>
                    )}
                  </button>
                  );
                })}
              </div>
              {selectedDay && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <CalendarIcon size={16} className="text-blue-600" />
                      Asignar día: {formatDate(selectedDay)}
                    </h3>
                    <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(['mother', 'father'] as const).map(p => (
                      <div key={p} className="space-y-2">
                        <p className="text-[10px] font-extrabold uppercase text-gray-400 px-1">{p === 'mother' ? 'Madre' : 'Padre'}</p>
                        <div className="flex flex-wrap gap-2">
                          {allowances.filter(a => a.parent === p).map(a => {
                            const used = getUsedDays(a.id);
                            const disabled = used >= a.totalDays;
                            return (
                              <button
                                key={a.id}
                                disabled={disabled}
                                onClick={() => {
                                  const newBlock: LeaveBlock = {
                                    id: crypto.randomUUID(),
                                    allowanceId: a.id,
                                    startDate: selectedDay,
                                    endDate: selectedDay,
                                    parent: p
                                  };
                                  setFlexibleBlocks([...flexibleBlocks, newBlock]);
                                  setSelectedDay(null);
                                }}
                                className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition shadow-sm border ${
                                  disabled
                                    ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : p === 'mother'
                                      ? 'bg-white text-pink-600 border-pink-100 hover:bg-pink-50'
                                      : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                                }`}
                              >
                                {a.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider justify-center md:justify-start">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500 rounded-sm"></div> Madre</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Padre</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gradient-to-br from-pink-400 to-blue-400 rounded-sm"></div> Ambos</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-sm"></div> Festivo</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(['mother', 'father'] as const).map((p) => (
              <div key={p} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className={`p-4 border-b ${p === 'mother' ? 'bg-pink-50 border-pink-100' : 'bg-blue-50 border-blue-100'} flex justify-between items-center`}>
                  <h3 className={`font-bold flex items-center gap-2 ${p === 'mother' ? 'text-pink-800' : 'text-blue-800'}`}>
                    <User size={16} />
                    Plan {p === 'mother' ? 'Madre' : 'Padre'}
                  </h3>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {allowances.filter(a => a.parent === p).map(a => (
                      <button
                        key={a.id}
                        onClick={() => addBlock(a)}
                        title={`Añadir bloque de ${a.name}`}
                        className={`text-[9px] px-2 py-1 rounded-lg font-extrabold transition shadow-sm ${p === 'mother' ? 'bg-white text-pink-600 hover:bg-pink-100' : 'bg-white text-blue-600 hover:bg-blue-100'}`}
                      >
                        + {a.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {allBlocks.filter(b => b.parent === p).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-400 font-medium">No hay periodos planificados</p>
                    </div>
                  )}
                  {allBlocks.filter(b => b.parent === p).map(b => {
                    const al = allowances.find(a => a.id === b.allowanceId);
                    const overlaps = checkOverlap(b);
                    const isBirthAllowance = b.allowanceId.startsWith('birth-');
                    const isWrongWeekday = isBirthAllowance && birthWeekday !== null && b.startDate.getDay() !== birthWeekday;

                    return (
                      <div key={b.id} className={`p-3 border rounded-xl transition-all ${overlaps ? 'border-red-300 bg-red-50 shadow-inner' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-tighter">{al?.name || 'Permiso'}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-white border border-gray-100 px-1.5 py-0.5 rounded-md text-gray-600 font-bold shadow-sm">
                              {countEffectiveLeaveDays(b.startDate, b.endDate, holidays)} días
                            </span>
                            {!b.id.startsWith('mandatory-') && (
                              <button onClick={() => removeBlock(b.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </div>
                        <input
                          type="date"
                          value={formatDate(b.startDate)}
                          onChange={(e) => updateBlockDate(b.id, e.target.value)}
                          className={`text-sm font-bold w-full bg-transparent outline-none ${b.id.startsWith('mandatory-') ? 'text-gray-400' : 'text-gray-800 focus:text-blue-600'}`}
                          disabled={b.id.startsWith('mandatory-')}
                        />
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                          <p className="text-[10px] text-gray-400 font-medium italic">Termina el {formatDate(b.endDate)}</p>
                          {isWrongWeekday && (
                            <div className="text-amber-600 flex items-center gap-1 text-[9px] font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              <AlertTriangle size={10} /> DÍA ERRÓNEO
                            </div>
                          )}
                        </div>
                        {overlaps && <p className="text-[9px] text-red-600 font-black mt-2 flex items-center gap-1 animate-pulse"><AlertTriangle size={10} /> SOLAPAMIENTO DETECTADO</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
