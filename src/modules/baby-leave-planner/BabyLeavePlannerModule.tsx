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
  const [holidayMode, setHolidayMode] = useState(false);
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

  const toggleHoliday = (day: Date) => {
    const dateStr = formatDate(day);
    if (holidays.includes(dateStr)) {
      setHolidays(holidays.filter(h => h !== dateStr));
    } else {
      setHolidays([...holidays, dateStr].sort());
    }
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
      <div key={`${date.getFullYear()}-${date.getMonth()}`} className="space-y-4 bg-gray-50/50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
        {showHeader && (
          <h3 className="text-center font-black capitalize text-gray-800 dark:text-gray-200 text-sm tracking-tight">{date.toLocaleDateString('es-ES', { month: 'long' })}</h3>
        )}
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase py-1">{d}</div>
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

            let bgColor = "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-50 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-800 transition-all cursor-pointer";
            if (isSelected) bgColor = "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500 dark:border-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/50 z-10 scale-105";
            else if (isBoth) bgColor = "bg-gradient-to-br from-pink-400 to-blue-400 text-white shadow-sm ring-1 ring-white/20";
            else if (isMother) bgColor = "bg-pink-500 text-white shadow-sm ring-1 ring-white/20";
            else if (isFather) bgColor = "bg-blue-500 text-white shadow-sm ring-1 ring-white/20";
            else if (holiday) bgColor = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold border-amber-200 dark:border-amber-800";
            else if (isWeekend) bgColor = "bg-gray-50 dark:bg-gray-800 text-gray-200 dark:text-gray-600";

            return (
              <button
                key={day.toISOString()}
                onClick={() => holidayMode ? toggleHoliday(day) : setSelectedDay(day)}
                className={`aspect-square flex items-center justify-center text-[11px] rounded-lg font-black relative group transition-all duration-200 ${bgColor}`}
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
    <div className="relative min-h-screen pb-20 md:pb-0 bg-white dark:bg-gray-950 transition-colors duration-300">

      <div className="flex justify-between items-center mb-8 px-4 md:px-0">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <Baby className="text-blue-600" size={32} />
          <span className="tracking-tight">Leave Planner</span>
        </h1>
        {/* Only show top buttons on Desktop, mobile uses bottom nav */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
            className={`p-3 rounded-2xl border transition-all active:scale-95 ${leftDrawerOpen ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            title="Gestión Madre"
          >
            <User size={24} className="text-pink-500" />
          </button>
          <button
            onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
            className={`p-3 rounded-2xl border transition-all active:scale-95 ${rightDrawerOpen ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            title="Gestión Padre"
          >
            <User size={24} className="text-blue-500" />
          </button>
          <button
            onClick={() => { setShowSettings(!showSettings); setHolidayMode(false); }}
            className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSettings ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            title="Configuración de Nacimiento"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Side Drawer Madre (Desktop & Mobile) - Always from Left */}
      <div className={`fixed inset-y-0 left-0 w-[85%] md:w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-100 dark:border-gray-800 p-6 overflow-y-auto
        ${(leftDrawerOpen || (mobileTab === 'mother')) ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold flex items-center gap-2 text-pink-600">
            <User size={20} />
            Gestión Madre
          </h3>
          <button
            onClick={() => { setLeftDrawerOpen(false); if (mobileTab === 'mother') setMobileTab('calendar'); }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Configuración Permisos</h4>
            <button onClick={() => addAllowance('mother')} className="text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 p-1 rounded-lg transition">
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {allowances.filter(a => a.parent === 'mother').map(a => (
              <div key={a.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-800/30">
                {editingAllowance === a.id ? (
                  <div className="space-y-3">
                    <input
                      className="text-xs font-bold w-full border-b border-pink-200 dark:border-pink-800 focus:border-pink-500 outline-none bg-transparent py-1 text-gray-900 dark:text-white"
                      value={a.name}
                      onChange={e => updateAllowance(a.id, { name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 dark:text-gray-500 block uppercase font-bold">Días Totales</label>
                        <input
                          type="number"
                          className="w-full border-b border-gray-100 dark:border-gray-800 text-xs py-1 bg-transparent text-gray-900 dark:text-white"
                          value={a.totalDays}
                          onChange={e => updateAllowance(a.id, { totalDays: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 dark:text-gray-500 block uppercase font-bold">Modo</label>
                        <select
                          className="w-full text-xs bg-transparent py-1 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
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
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{a.name}</span>
                          <button onClick={() => setEditingAllowance(a.id)} className="text-gray-400 dark:text-gray-500 hover:text-pink-500"><Edit2 size={12} /></button>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 mb-1">
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(a.totalDays / 7)} sem` : `${a.totalDays} d`}</span>
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(getUsedDays(a.id) / 7)} / ${Math.floor(a.totalDays / 7)} sem` : `${getUsedDays(a.id)} / ${a.totalDays} d`}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
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

          <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
            <button
              onClick={() => togglePeriods('mother')}
              className="w-full flex justify-between items-center mb-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Periodos Planificados</h4>
              {expandedPeriods.mother ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`space-y-3 transition-all duration-300 overflow-hidden ${expandedPeriods.mother ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {allBlocks.filter(b => b.parent === 'mother').map(b => (
                <div key={b.id} className="p-3 bg-pink-50/30 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800">
                  <div className="flex justify-between text-[10px] font-bold text-pink-700 dark:text-pink-300 mb-1">
                    <span>{allowances.find(al => al.id === b.allowanceId)?.name}{b.id.startsWith('mandatory-') ? ' (Obligatorio)' : ''}</span>
                    <span>
                      {allowances.find(al => al.id === b.allowanceId)?.consumptionMode === 'weeks'
                        ? `${Math.floor(countEffectiveLeaveDays(b.startDate, b.endDate, holidays) / 7)} sem`
                        : `${countEffectiveLeaveDays(b.startDate, b.endDate, holidays)} d`
                      }
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(b.startDate)} al {formatDate(b.endDate)}</p>
                  {!b.id.startsWith('mandatory-') && (
                    <button onClick={() => removeBlock(b.id)} className="mt-2 text-[9px] text-red-500 hover:underline">Eliminar</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side Drawer Padre (Desktop & Mobile) - Always from Right */}
      <div className={`fixed inset-y-0 right-0 w-[85%] md:w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 dark:border-gray-800 p-6 overflow-y-auto
        ${(rightDrawerOpen || (mobileTab === 'father')) ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => { setRightDrawerOpen(false); if (mobileTab === 'father') setMobileTab('calendar'); }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
            <button onClick={() => addAllowance('father')} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded-lg transition">
              <Plus size={16} />
            </button>
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Configuración Permisos</h4>
          </div>

          <div className="space-y-4">
            {allowances.filter(a => a.parent === 'father').map(a => (
              <div key={a.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-800/30">
                {editingAllowance === a.id ? (
                  <div className="space-y-3">
                    <input
                      className="text-xs font-bold w-full border-b border-blue-200 dark:border-blue-800 focus:border-blue-500 outline-none bg-transparent py-1 text-right text-gray-900 dark:text-white"
                      value={a.name}
                      onChange={e => updateAllowance(a.id, { name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 dark:text-gray-500 block uppercase font-bold text-right">Modo</label>
                        <select
                          className="w-full text-xs bg-transparent py-1 border-b border-gray-100 dark:border-gray-800 text-right text-gray-900 dark:text-white"
                          value={a.consumptionMode}
                          onChange={e => updateAllowance(a.id, { consumptionMode: e.target.value as ConsumptionMode })}
                        >
                          <option value="days">Días</option>
                          <option value="weeks">Semanas</option>
                          <option value="all">Bloque</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 dark:text-gray-500 block uppercase font-bold text-right">Días Totales</label>
                        <input
                          type="number"
                          className="w-full border-b border-gray-100 dark:border-gray-800 text-xs py-1 bg-transparent text-right text-gray-900 dark:text-white"
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
                          <button onClick={() => setEditingAllowance(a.id)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500"><Edit2 size={12} /></button>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{a.name}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 mb-1">
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(getUsedDays(a.id) / 7)} / ${Math.floor(a.totalDays / 7)} sem` : `${getUsedDays(a.id)} / ${a.totalDays} d`}</span>
                          <span>{a.consumptionMode === 'weeks' ? `${Math.floor(a.totalDays / 7)} sem` : `${a.totalDays} d`}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
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

          <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
            <button
              onClick={() => togglePeriods('father')}
              className="w-full flex justify-between items-center mb-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Periodos Planificados</h4>
              {expandedPeriods.father ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`space-y-3 transition-all duration-300 overflow-hidden ${expandedPeriods.father ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {allBlocks.filter(b => b.parent === 'father').map(b => (
                <div key={b.id} className="p-3 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                    <span>
                      {allowances.find(al => al.id === b.allowanceId)?.consumptionMode === 'weeks'
                        ? `${Math.floor(countEffectiveLeaveDays(b.startDate, b.endDate, holidays) / 7)} sem`
                        : `${countEffectiveLeaveDays(b.startDate, b.endDate, holidays)} d`
                      }
                    </span>
                    <span>{allowances.find(al => al.id === b.allowanceId)?.name}{b.id.startsWith('mandatory-') ? ' (Obligatorio)' : ''}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(b.startDate)} al {formatDate(b.endDate)}</p>
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
          <button
            onClick={() => { setShowSettings(false); setMobileTab('calendar'); }}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition"
          >
            <ChevronLeft size={20} />
            Volver al Calendario
          </button>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Settings size={20} className="text-gray-500 dark:text-gray-400" />
              Datos Generales
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Festivos de Empresa</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  <button onClick={handleAddHoliday} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                    <Plus size={24} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {holidays.map(h => (
                    <span key={h} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
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
          <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-0">
            <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
                    <CalendarIcon size={28} className="text-blue-600" />
                    <span className="hidden xs:inline">Calendario</span>
                  </h2>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition ${viewMode === 'month' ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      MES
                    </button>
                    <button
                      onClick={() => setViewMode('year')}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition ${viewMode === 'year' ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      AÑO
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  {/* Mode Toggle: Normal vs Holiday */}
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full md:w-auto">
                    <button
                      onClick={() => setHolidayMode(false)}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 ${!holidayMode ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      PLANIFICAR
                    </button>
                    <button
                      onClick={() => { setHolidayMode(true); setSelectedDay(null); setShowSettings(false); }}
                      className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 ${holidayMode ? 'bg-amber-100 dark:bg-amber-900/40 shadow-sm text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      GESTIÓN FESTIVOS
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 w-full md:w-auto justify-between md:justify-start text-gray-900 dark:text-white">
                    <button onClick={() => changeMonth(viewMode === 'month' ? -1 : -12)} className="p-3 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-xl transition bg-white/50 dark:bg-transparent"><ChevronLeft size={24} className="text-gray-500 dark:text-gray-400" /></button>
                    <span className="font-black min-w-[140px] text-center capitalize text-sm md:text-base tracking-tight">
                      {viewMode === 'month'
                        ? viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                        : viewDate.getFullYear()}
                    </span>
                    <button onClick={() => changeMonth(viewMode === 'month' ? 1 : 12)} className="p-3 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-xl transition bg-white/50 dark:bg-transparent"><ChevronRight size={24} className="text-gray-500 dark:text-gray-400" /></button>
                  </div>
                </div>
              </div>

              {viewMode === 'month' ? (
                <div className="grid grid-cols-7 gap-3 md:gap-4">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase py-3">{d}</div>)}
                  {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                  {daysInMonth.map(day => {
                    const status = getLeaveStatus(day, allBlocks);
                    const holiday = isHoliday(day, holidays);
                    const isBoth = status.mother && status.father;
                    const isMother = status.mother;
                    const isFather = status.father;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    const isSelected = selectedDay && isSameDay(day, selectedDay);

                    let bgColor = "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer";
                    if (isSelected) bgColor = "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900/50 z-10 scale-105";
                    else if (isBoth) bgColor = "bg-gradient-to-br from-pink-400 to-blue-400 text-white shadow-sm ring-1 ring-white/20";
                    else if (isMother) bgColor = "bg-pink-500 text-white shadow-sm ring-1 ring-white/20";
                    else if (isFather) bgColor = "bg-blue-500 text-white shadow-sm ring-1 ring-white/20";
                    else if (holiday) bgColor = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold border-amber-200 dark:border-amber-800";
                    else if (isWeekend) bgColor = "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600";

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => holidayMode ? toggleHoliday(day) : setSelectedDay(day)}
                        className={`aspect-square flex items-center justify-center text-lg md:text-2xl rounded-2xl md:rounded-3xl font-black relative group transition-all duration-200 active:scale-90 ${bgColor}`}
                      >
                        {day.getDate()}
                        {!holidayMode && !isBoth && !isMother && !isFather && !holiday && !isWeekend && !isSelected && (
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-2xl md:rounded-3xl transition-colors flex items-center justify-center">
                            <Plus size={16} className="opacity-0 group-hover:opacity-100 text-blue-500" />
                          </div>
                        )}
                        {holidayMode && !holiday && (
                          <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-2xl md:rounded-3xl transition-colors flex items-center justify-center border-2 border-dashed border-transparent hover:border-amber-400">
                            <Plus size={20} className="opacity-0 group-hover:opacity-100 text-amber-500" />
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
                <div className="fixed inset-x-0 bottom-24 md:relative md:bottom-0 md:mt-8 p-6 md:p-5 bg-white dark:bg-gray-900 border-t md:border border-gray-200 dark:border-gray-800 shadow-2xl md:shadow-none animate-in slide-in-from-bottom md:slide-in-from-top duration-300 z-40 md:rounded-[2rem]">
                  <div className="flex flex-col gap-6">
                    {/* Header + Actions */}
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 md:border-none pb-4 md:pb-0">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl">{formatDate(selectedDay).split('-').reverse().slice(0,2).join('/')}</span>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl text-white">
                          <button
                            onClick={() => setAssignmentParent('mother')}
                            className={`px-5 py-2 text-xs font-black rounded-lg transition ${assignmentParent === 'mother' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500'}`}
                          >
                            MAMÁ
                          </button>
                          <button
                            onClick={() => setAssignmentParent('father')}
                            className={`px-5 py-2 text-xs font-black rounded-lg transition ${assignmentParent === 'father' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500'}`}
                          >
                            PAPÁ
                          </button>
                        </div>
                      </div>
                      <button onClick={() => setSelectedDay(null)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition">
                        <Trash2 size={24} />
                      </button>
                    </div>

                    {/* Allowance Selection (Scrollable Bar) */}
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
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
                            className={`whitespace-nowrap px-6 py-4 rounded-2xl text-sm font-black border transition-all active:scale-95 flex items-center gap-3 ${
                              disabled
                                ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 grayscale'
                                : assignmentParent === 'mother'
                                  ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/40 shadow-sm'
                                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-sm'
                            }`}
                          >
                            {a.name}
                            <span className="opacity-50 text-[10px] bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                              {a.consumptionMode === 'weeks' ? 'sem' : 'd'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest justify-center md:justify-start text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-pink-500 rounded-md"></div> Madre</div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-blue-500 rounded-md"></div> Padre</div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-gradient-to-br from-pink-400 to-blue-400 rounded-md"></div> Ambos</div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-md"></div> Festivo</div>
              </div>
            </div>
          </div>

        </div>
      )}
      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 flex justify-around items-center p-5 pb-8 z-[60] md:hidden">
        <button
          onClick={() => { setMobileTab('mother'); setShowSettings(false); setLeftDrawerOpen(false); setRightDrawerOpen(false); setHolidayMode(false); }}
          className={`flex flex-col items-center gap-2 p-3 flex-1 transition-all active:scale-90 ${mobileTab === 'mother' ? 'text-pink-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <User size={28} />
          <span className="text-[11px] font-black uppercase tracking-tighter">MAMÁ</span>
        </button>
        <button
          onClick={() => { setMobileTab('calendar'); setShowSettings(false); setLeftDrawerOpen(false); setRightDrawerOpen(false); setHolidayMode(false); }}
          className={`flex flex-col items-center gap-2 p-3 flex-1 transition-all active:scale-90 ${mobileTab === 'calendar' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <CalendarIcon size={28} />
          <span className="text-[11px] font-black uppercase tracking-tighter">CALENDARIO</span>
        </button>
        <button
          onClick={() => { setMobileTab('father'); setShowSettings(false); setLeftDrawerOpen(false); setRightDrawerOpen(false); setHolidayMode(false); }}
          className={`flex flex-col items-center gap-2 p-3 flex-1 transition-all active:scale-90 ${mobileTab === 'father' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <User size={28} />
          <span className="text-[11px] font-black uppercase tracking-tighter">PAPÁ</span>
        </button>
        <button
          onClick={() => { setMobileTab('settings'); setShowSettings(true); setLeftDrawerOpen(false); setRightDrawerOpen(false); setHolidayMode(false); }}
          className={`flex flex-col items-center gap-2 p-3 flex-1 transition-all active:scale-90 ${mobileTab === 'settings' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Settings size={28} />
          <span className="text-[11px] font-black uppercase tracking-tighter">AJUSTES</span>
        </button>
      </div>
    </div>
  );
}
