"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Baby,
  Plus,
  Trash2,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  LeaveBlock,
  Allowance,
  ConsumptionMode,
  isSameDay,
  formatDate,
  calculateEndDate,
  countEffectiveLeaveDays,
  getDaysInMonth,
  getLeaveStatus,
  isHoliday
} from "./leaveUtils";

export function BabyLeavePlannerModule() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [birthDate, setBirthDate] = useState<string>("");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [flexibleBlocks, setFlexibleBlocks] = useState<LeaveBlock[]>([]);

  const [allowances, setAllowances] = useState<Allowance[]>([
    { id: 'birth-mother', name: 'Permiso Nacimiento', totalDays: 133, parent: 'mother', consumptionMode: 'weeks' },
    { id: 'birth-father', name: 'Permiso Nacimiento', totalDays: 133, parent: 'father', consumptionMode: 'weeks' }
  ]);

  const [editingAllowance, setEditingAllowance] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [assignmentParent, setAssignmentParent] = useState<'mother' | 'father'>('mother');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [mobileTab, setMobileTab] = useState<'calendar' | 'mother' | 'father' | 'settings'>('calendar');
  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({ mother: false, father: false });

  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  // Fetch initial data
  useEffect(() => {
    fetch("/api/baby-leave-planner")
      .then((res) => res.json())
      .then((data) => {
        if (data.birthDate) setBirthDate(data.birthDate);
        if (data.holidays) setHolidays(data.holidays);
        if (data.allowances) setAllowances(data.allowances);
        if (data.flexibleBlocks) {
          // Convert string dates back to Date objects
          const blocks = data.flexibleBlocks.map((b: { id: string; allowanceId: string; startDate: string; endDate: string; parent: 'mother' | 'father' }) => ({
            ...b,
            startDate: new Date(b.startDate),
            endDate: new Date(b.endDate),
          }));
          setFlexibleBlocks(blocks);
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setIsLoaded(true);
      });
  }, []);

  // Save data on change
  useEffect(() => {
    if (!isLoaded) return;

    const timeout = setTimeout(() => {
      fetch("/api/baby-leave-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          holidays,
          allowances,
          flexibleBlocks,
        }),
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [birthDate, holidays, allowances, flexibleBlocks, isLoaded]);

  const birthDateObj = useMemo(() => {
    if (!birthDate) return null;
    const [y, m, d] = birthDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [birthDate]);

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

  const removeBlock = (id: string) => {
    setFlexibleBlocks(flexibleBlocks.filter(b => b.id !== id));
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDayWeekday = daysInMonth[0].getDay();
  const adjustedFirstDay = (firstDayWeekday + 6) % 7;
  const paddingDays = Array.from({ length: adjustedFirstDay });

  const renderMonth = (date: Date, showHeader = true) => {
    const days = getDaysInMonth(date.getFullYear(), date.getMonth());
    const firstDay = (days[0].getDay() + 6) % 7;
    const padding = Array.from({ length: firstDay });

    return (
      <div key={`${date.getFullYear()}-${date.getMonth()}`} className="space-y-4">
        {showHeader && (
          <h3 className="text-center font-bold capitalize text-gray-700">{date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
        )}
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[8px] font-bold text-gray-400 uppercase py-1">{d}</div>
          ))}
          {padding.map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const status = getLeaveStatus(day, allBlocks);
            const holiday = isHoliday(day, holidays);
            const isBoth = status.mother && status.father;
            const isMother = status.mother;
            const isFather = status.father;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            let bgColor = "bg-white text-gray-700 border border-gray-50 hover:border-blue-100 transition-all cursor-pointer";
            if (isSelected) bgColor = "bg-blue-50 text-blue-700 border-blue-500 ring-1 ring-blue-100 z-10 scale-105";
            else if (isBoth) bgColor = "bg-gradient-to-br from-pink-400 to-blue-400 text-white shadow-sm ring-1 ring-white/20";
            else if (isMother) bgColor = "bg-pink-500 text-white shadow-sm ring-1 ring-white/20";
            else if (isFather) bgColor = "bg-blue-500 text-white shadow-sm ring-1 ring-white/20";
            else if (holiday) bgColor = "bg-amber-100 text-amber-700 font-bold border-amber-200";
            else if (isWeekend) bgColor = "bg-gray-50 text-gray-200";

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square flex items-center justify-center text-[10px] md:text-xs rounded-lg font-bold relative group transition-all duration-200 ${bgColor}`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const togglePeriods = (parent: 'mother' | 'father') => {
    setExpandedPeriods(prev => ({ ...prev, [parent]: !prev[parent] }));
  };

  return (
    <div className="relative min-h-screen pb-20 md:pb-0">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Baby className="text-blue-600" size={28} />
          <span>Leave Planner</span>
        </h1>
        {/* Only show top buttons on Desktop, mobile uses bottom nav */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
            className={`p-2 rounded-xl border transition-colors ${leftDrawerOpen ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            title="Gestión Madre"
          >
            <User size={20} className="text-pink-500" />
          </button>
          <button
            onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
            className={`p-2 rounded-xl border transition-colors ${rightDrawerOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            title="Gestión Padre"
          >
            <User size={20} className="text-blue-500" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border transition-colors ${showSettings ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            title="Ajustes"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Side Drawer Madre (Desktop) / Tab (Mobile) */}
      <div className={`fixed inset-y-0 left-0 w-full md:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-100 p-6 overflow-y-auto
        ${(leftDrawerOpen || (mobileTab === 'mother')) ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold flex items-center gap-2 text-pink-600">
            <User size={20} />
            Gestión Madre
          </h3>
          <button
            onClick={() => { setLeftDrawerOpen(false); if (mobileTab === 'mother') setMobileTab('calendar'); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuración Permisos</h4>
            <button onClick={() => addAllowance('mother')} className="text-pink-600 hover:bg-pink-50 p-1 rounded-lg transition">
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {allowances.filter(a => a.parent === 'mother').map(a => (
              <div key={a.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/30">
                {editingAllowance === a.id ? (
                  <div className="space-y-3">
                    <input
                      className="text-xs font-bold w-full border-b border-pink-200 focus:border-pink-500 outline-none bg-transparent py-1"
                      value={a.name}
                      onChange={e => updateAllowance(a.id, { name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block uppercase font-bold">Días Totales</label>
                        <input
                          type="number"
                          className="w-full border-b border-gray-100 text-xs py-1 bg-transparent"
                          value={a.totalDays}
                          onChange={e => updateAllowance(a.id, { totalDays: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block uppercase font-bold">Modo</label>
                        <select
                          className="w-full text-xs bg-transparent py-1 border-b border-gray-100"
                          value={a.consumptionMode}
                          onChange={e => updateAllowance(a.id, { consumptionMode: e.target.value as ConsumptionMode })}
                        >
                          <option value="days">Días</option>
                          <option value="weeks">Semanas</option>
                          <option value="all">Bloque</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => deleteAllowance(a.id)} className="text-red-500 p-1"><Trash2 size={14}/></button>
                      <button onClick={() => setEditingAllowance(null)} className="bg-pink-600 text-white px-2 py-1 rounded text-[10px] font-bold">OK</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-700">{a.name}</span>
                          <button onClick={() => setEditingAllowance(a.id)} className="text-gray-400 hover:text-pink-500"><Edit2 size={12} /></button>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(a.totalDays / 7)} sem` : `${a.totalDays} d`}</span>
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(getUsedDays(a.id) / 7)} / ${Math.floor(a.totalDays / 7)} sem` : `${getUsedDays(a.id)} / ${a.totalDays} d`}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pink-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, (getUsedDays(a.id) / a.totalDays) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-50">
            <button
              onClick={() => togglePeriods('mother')}
              className="w-full flex justify-between items-center mb-4 text-gray-400 hover:text-gray-600"
            >
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Periodos Planificados</h4>
              {expandedPeriods.mother ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`space-y-3 transition-all duration-300 overflow-hidden ${expandedPeriods.mother ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {allBlocks.filter(b => b.parent === 'mother').map(b => (
                <div key={b.id} className="p-3 bg-pink-50/30 rounded-xl border border-pink-100">
                  <div className="flex justify-between text-[10px] font-bold text-pink-700 mb-1">
                    <span>{allowances.find(al => al.id === b.allowanceId)?.name}{b.id.startsWith('mandatory-') ? ' (Obligatorio)' : ''}</span>
                    <span>
                      {allowances.find(al => al.id === b.allowanceId)?.consumptionMode === 'weeks'
                        ? `${Math.floor(countEffectiveLeaveDays(b.startDate, b.endDate, holidays) / 7)} sem`
                        : `${countEffectiveLeaveDays(b.startDate, b.endDate, holidays)} d`
                      }
                    </span>
                  </div>
                  <p className="text-xs font-medium">{formatDate(b.startDate)} al {formatDate(b.endDate)}</p>
                  {!b.id.startsWith('mandatory-') && (
                    <button onClick={() => removeBlock(b.id)} className="mt-2 text-[9px] text-red-500 hover:underline">Eliminar</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side Drawer Padre (Desktop) / Tab (Mobile) */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 p-6 overflow-y-auto
        ${(rightDrawerOpen || (mobileTab === 'father')) ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => { setRightDrawerOpen(false); if (mobileTab === 'father') setMobileTab('calendar'); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={24} />
          </button>
          <h3 className="font-extrabold flex items-center gap-2 text-blue-600">
            Gestión Padre
            <User size={20} />
          </h3>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button onClick={() => addAllowance('father')} className="text-blue-600 hover:bg-blue-50 p-1 rounded-lg transition">
              <Plus size={16} />
            </button>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuración Permisos</h4>
          </div>

          <div className="space-y-4">
            {allowances.filter(a => a.parent === 'father').map(a => (
              <div key={a.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/30">
                {editingAllowance === a.id ? (
                  <div className="space-y-3">
                    <input
                      className="text-xs font-bold w-full border-b border-blue-200 focus:border-blue-500 outline-none bg-transparent py-1 text-right"
                      value={a.name}
                      onChange={e => updateAllowance(a.id, { name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block uppercase font-bold text-right">Modo</label>
                        <select
                          className="w-full text-xs bg-transparent py-1 border-b border-gray-100 text-right"
                          value={a.consumptionMode}
                          onChange={e => updateAllowance(a.id, { consumptionMode: e.target.value as ConsumptionMode })}
                        >
                          <option value="days">Días</option>
                          <option value="weeks">Semanas</option>
                          <option value="all">Bloque</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block uppercase font-bold text-right">Días Totales</label>
                        <input
                          type="number"
                          className="w-full border-b border-gray-100 text-xs py-1 bg-transparent text-right"
                          value={a.totalDays}
                          onChange={e => updateAllowance(a.id, { totalDays: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-start gap-2">
                      <button onClick={() => setEditingAllowance(null)} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold">OK</button>
                      <button onClick={() => deleteAllowance(a.id)} className="text-red-500 p-1"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <button onClick={() => setEditingAllowance(a.id)} className="text-gray-400 hover:text-blue-500"><Edit2 size={12} /></button>
                          <span className="text-xs font-bold text-gray-700">{a.name}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(getUsedDays(a.id) / 7)} / ${Math.floor(a.totalDays / 7)} sem` : `${getUsedDays(a.id)} / ${a.totalDays} d`}</span>
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(a.totalDays / 7)} sem` : `${a.totalDays} d`}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 transition-all duration-500 ml-auto"
                            style={{ width: `${Math.min(100, (getUsedDays(a.id) / a.totalDays) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-50">
            <button
              onClick={() => togglePeriods('father')}
              className="w-full flex justify-between items-center mb-4 text-gray-400 hover:text-gray-600"
            >
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Periodos Planificados</h4>
              {expandedPeriods.father ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`space-y-3 transition-all duration-300 overflow-hidden ${expandedPeriods.father ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {allBlocks.filter(b => b.parent === 'father').map(b => (
                <div key={b.id} className="p-3 bg-blue-50/30 rounded-xl border border-blue-100">
                  <div className="flex justify-between text-[10px] font-bold text-blue-700 mb-1">
                    <span>
                      {allowances.find(al => al.id === b.allowanceId)?.consumptionMode === 'weeks'
                        ? `${Math.floor(countEffectiveLeaveDays(b.startDate, b.endDate, holidays) / 7)} sem`
                        : `${countEffectiveLeaveDays(b.startDate, b.endDate, holidays)} d`
                      }
                    </span>
                    <span>{allowances.find(al => al.id === b.allowanceId)?.name}{b.id.startsWith('mandatory-') ? ' (Obligatorio)' : ''}</span>
                  </div>
                  <p className="text-xs font-medium">{formatDate(b.startDate)} al {formatDate(b.endDate)}</p>
                  {!b.id.startsWith('mandatory-') && (
                    <button onClick={() => removeBlock(b.id)} className="mt-2 text-[9px] text-red-500 hover:underline">Eliminar</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(showSettings || mobileTab === 'settings') ? (
        <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300 px-4 md:px-0">
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
      ) : (
        <div className={`animate-in slide-in-from-bottom-4 duration-300 ${mobileTab !== 'calendar' ? 'hidden md:block' : ''}`}>
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarIcon size={20} className="text-blue-600" />
                    <span className="hidden xs:inline">Calendario</span>
                  </h2>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                      MES
                    </button>
                    <button
                      onClick={() => setViewMode('year')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewMode === 'year' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                      AÑO
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 w-full md:w-auto justify-between md:justify-start">
                  <button onClick={() => changeMonth(viewMode === 'month' ? -1 : -12)} className="p-3 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition bg-white/50 md:bg-transparent"><ChevronLeft size={24} className="md:w-5 md:h-5" /></button>
                  <span className="font-extrabold text-gray-900 min-w-[120px] text-center capitalize text-xs md:text-sm">
                    {viewMode === 'month'
                      ? viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                      : viewDate.getFullYear()}
                  </span>
                  <button onClick={() => changeMonth(viewMode === 'month' ? 1 : 12)} className="p-3 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition bg-white/50 md:bg-transparent"><ChevronRight size={24} className="md:w-5 md:h-5" /></button>
                </div>
                <button
                  onClick={() => { setShowSettings(!showSettings); setMobileTab('calendar'); }}
                  className={`p-2 rounded-xl border transition-colors ${showSettings ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  title="Configuración"
                >
                  <Settings size={20} />
                </button>
              </div>

              {viewMode === 'month' ? (
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

                    const isSelected = selectedDay && isSameDay(day, selectedDay);

                    let bgColor = "bg-white text-gray-700 border border-gray-100 hover:border-blue-200 transition-all cursor-pointer";
                    if (isSelected) bgColor = "bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-200 z-10 scale-105";
                    else if (isBoth) bgColor = "bg-gradient-to-br from-pink-400 to-blue-400 text-white shadow-sm ring-1 ring-white/20";
                    else if (isMother) bgColor = "bg-pink-500 text-white shadow-sm ring-1 ring-white/20";
                    else if (isFather) bgColor = "bg-blue-500 text-white shadow-sm ring-1 ring-white/20";
                    else if (holiday) bgColor = "bg-amber-100 text-amber-700 font-bold border-amber-200";
                    else if (isWeekend) bgColor = "bg-gray-50 text-gray-300";

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(day)}
                        className={`aspect-square flex items-center justify-center text-xs md:text-sm rounded-xl font-bold relative group transition-all duration-200 ${bgColor}`}
                      >
                        {day.getDate()}
                        {!isBoth && !isMother && !isFather && !holiday && !isWeekend && !isSelected && (
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-xl transition-colors flex items-center justify-center">
                            <Plus size={12} className="opacity-0 group-hover:opacity-100 text-blue-500" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthDate = new Date(viewDate.getFullYear(), i, 1);
                    return renderMonth(monthDate);
                  })}
                </div>
              )}
              {selectedDay && (
                <div className="fixed inset-x-0 bottom-16 md:relative md:bottom-0 md:mt-6 p-4 md:p-3 bg-white md:bg-gray-50 border-t md:border border-gray-200 shadow-2xl md:shadow-none animate-in slide-in-from-bottom md:slide-in-from-top duration-300 z-40 md:rounded-2xl">
                  <div className="flex flex-col gap-4">
                    {/* Header + Actions */}
                    <div className="flex justify-between items-center border-b border-gray-100 md:border-none pb-2 md:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{formatDate(selectedDay).split('-').reverse().slice(0,2).join('/')}</span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button
                            onClick={() => setAssignmentParent('mother')}
                            className={`px-3 py-1 text-[9px] font-black rounded-md transition ${assignmentParent === 'mother' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400'}`}
                          >
                            MAMÁ
                          </button>
                          <button
                            onClick={() => setAssignmentParent('father')}
                            className={`px-3 py-1 text-[9px] font-black rounded-md transition ${assignmentParent === 'father' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400'}`}
                          >
                            PAPÁ
                          </button>
                        </div>
                      </div>
                      <button onClick={() => setSelectedDay(null)} className="text-gray-300 hover:text-gray-500 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Allowance Selection (Scrollable Bar) */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {allowances.filter(a => a.parent === assignmentParent).map(a => {
                        const used = getUsedDays(a.id);
                        const disabled = used >= a.totalDays;
                        return (
                          <button
                            key={a.id}
                            disabled={disabled}
                            onClick={() => {
                              let daysToTake = 1;
                              if (a.consumptionMode === 'weeks') daysToTake = 7;
                              if (a.consumptionMode === 'all') daysToTake = a.totalDays - used;

                              const newBlock: LeaveBlock = {
                                id: crypto.randomUUID(),
                                allowanceId: a.id,
                                startDate: selectedDay,
                                endDate: calculateEndDate(selectedDay, daysToTake),
                                parent: assignmentParent
                              };
                              setFlexibleBlocks([...flexibleBlocks, newBlock]);
                              setSelectedDay(null);
                            }}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 flex items-center gap-2 ${
                              disabled
                                ? 'bg-gray-50 text-gray-300 border-gray-100 grayscale'
                                : assignmentParent === 'mother'
                                  ? 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100'
                                  : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                            }`}
                          >
                            {a.name}
                            <span className="opacity-50 text-[9px]">
                              {a.consumptionMode === 'weeks' ? 'sem' : 'd'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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

        </div>
      )}
      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center p-2 z-[60] md:hidden">
        <button
          onClick={() => { setMobileTab('mother'); setShowSettings(false); }}
          className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'mother' ? 'text-pink-600' : 'text-gray-400'}`}
        >
          <User size={20} />
          <span className="text-[9px] font-bold">MAMÁ</span>
        </button>
        <button
          onClick={() => { setMobileTab('calendar'); setShowSettings(false); }}
          className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'calendar' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <CalendarIcon size={20} />
          <span className="text-[9px] font-bold">CALENDARIO</span>
        </button>
        <button
          onClick={() => { setMobileTab('father'); setShowSettings(false); }}
          className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'father' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <User size={20} />
          <span className="text-[9px] font-bold">PAPÁ</span>
        </button>
      </div>
    </div>
  );
}
