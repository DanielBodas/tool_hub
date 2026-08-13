"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  RefreshCw,
  Settings,
  X,
  Info,
  Trash2,
  Edit2,
  Plus,
} from "lucide-react";

// Define TypeScript interfaces for our data structure
interface EventItem {
  date: string;
  person: string;
  type: string;
}

interface BalanceItem {
  person: string;
  type: string;
  total: number;
  frecuencia: "Diario" | "Semanal";
}

interface FestivoItem {
  date: string;
  nombre: string;
}

interface GlobalData {
  events: EventItem[];
  balances: BalanceItem[];
  festivos: FestivoItem[];
  birthDate: string | null;
}

interface LegacyData {
  birthDate?: string | null;
  events?: EventItem[];
  balances?: BalanceItem[];
  festivos?: FestivoItem[];
  holidays?: string[];
  allowances?: Array<{
    id: string;
    name?: string;
    totalDays: number | string;
    parent: "mother" | "father";
    consumptionMode: "weeks" | "days" | "all";
  }>;
  flexibleBlocks?: Array<{
    startDate: string | Date;
    endDate: string | Date;
    parent: "mother" | "father";
    allowanceId: string;
  }>;
}

// Formatting helper
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Migration Helper
function migrateData(loadedData: LegacyData | null | undefined): GlobalData {
  if (loadedData && Array.isArray(loadedData.events)) {
    return {
      birthDate: loadedData.birthDate || null,
      events: loadedData.events,
      balances: loadedData.balances || [],
      festivos: loadedData.festivos || [],
    };
  }

  const defaultBalances: BalanceItem[] = [
    { person: "Madre", type: "Permiso Nacimiento", total: 112, frecuencia: "Diario" },
    { person: "Madre", type: "Lactancia", total: 15, frecuencia: "Diario" },
    { person: "Padre", type: "Permiso Nacimiento", total: 112, frecuencia: "Diario" },
    { person: "Padre", type: "Lactancia", total: 15, frecuencia: "Diario" },
  ];

  const migrated: GlobalData = {
    birthDate: loadedData?.birthDate || null,
    events: [],
    balances: defaultBalances,
    festivos: [],
  };

  if (Array.isArray(loadedData?.holidays)) {
    migrated.festivos = loadedData.holidays.map((hStr: string) => ({
      date: hStr,
      nombre: "Festivo",
    }));
  }

  if (Array.isArray(loadedData?.allowances)) {
    migrated.balances = loadedData.allowances.map((a) => ({
      person: a.parent === "mother" ? "Madre" : "Padre",
      type: a.name || "Permiso",
      total: Number(a.totalDays) || 0,
      frecuencia: a.consumptionMode === "weeks" ? "Semanal" : "Diario",
    }));
  }

  if (Array.isArray(loadedData?.flexibleBlocks) && loadedData.birthDate) {
    const eventsList: EventItem[] = [];

    loadedData.flexibleBlocks.forEach((block) => {
      const start = new Date(block.startDate);
      const end = new Date(block.endDate);
      const person = block.parent === "mother" ? "Madre" : "Padre";

      const allowance = loadedData.allowances?.find((a) => a.id === block.allowanceId);
      const type = allowance?.name || "Permiso";

      const current = new Date(start);
      while (current <= end) {
        const dateStr = formatDateStr(current);
        eventsList.push({
          date: dateStr,
          person,
          type,
        });
        current.setDate(current.getDate() + 1);
      }
    });

    migrated.events = eventsList;
  }

  return migrated;
}

export function BabyLeavePlannerModule() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [globalData, setGlobalData] = useState<GlobalData>({
    events: [],
    balances: [],
    festivos: [],
    birthDate: null,
  });

  // UI States
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<"all" | "Madre" | "Padre">("all");
  const [openSidebar, setOpenSidebar] = useState<"mom" | "dad" | null>(null);

  // Day Management Preferences
  const [skipNonWorkDays, setSkipNonWorkDays] = useState(true);

  // Holiday Mode Toggle
  const [holidayMode, setHolidayMode] = useState(false);

  // Sidebar Inline Balance Editing States
  const [editingBalanceKey, setEditingBalanceKey] = useState<string | null>(null); // "person-type"
  const [editTypeVal, setEditTypeVal] = useState("");
  const [editTotalVal, setEditTotalVal] = useState("");
  const [editFreqVal, setEditFreqVal] = useState<"Diario" | "Semanal">("Diario");

  // State to manage inline balance creation form in each sidebar
  const [showAddFormMom, setShowAddFormMom] = useState(false);
  const [showAddFormDad, setShowAddFormDad] = useState(false);
  const [sidebarAddType, setSidebarAddType] = useState("");
  const [sidebarAddTotal, setSidebarAddTotal] = useState("");
  const [sidebarAddFreq, setSidebarAddFreq] = useState<"Diario" | "Semanal">("Diario");

  // Modal States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>("Madre"); // "Madre" | "Padre" | "Festivo"
  const [selectedType, setSelectedType] = useState<string>("");
  const [holidayNameVal, setHolidayNameVal] = useState("Festivo");

  // Configuration Modal States (only contains birthDate now)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configBirthDate, setConfigBirthDate] = useState("");

  // Migration and Data Loading
  useEffect(() => {
    fetch("/api/baby-leave-planner")
      .then((res) => res.json())
      .then((data) => {
        const migrated = migrateData(data);
        setGlobalData(migrated);
        if (migrated.birthDate) {
          setConfigBirthDate(migrated.birthDate);
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setIsLoaded(true);
      });
  }, []);

  // Save data automatically on globalData change
  useEffect(() => {
    if (!isLoaded) return;

    const timeout = setTimeout(() => {
      fetch("/api/baby-leave-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalData),
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [globalData, isLoaded]);

  // 15-Month Calendar Generation
  const monthsData = useMemo(() => {
    if (!globalData.birthDate) return [];

    const birthDate = new Date(globalData.birthDate);
    const months = [];
    // Always start from the 1st of birthDate month
    const startIterDate = new Date(birthDate.getFullYear(), birthDate.getMonth(), 1);

    for (let i = 0; i < 15; i++) {
      const currentMonth = new Date(startIterDate.getFullYear(), startIterDate.getMonth() + i, 1);
      months.push(currentMonth);
    }
    return months;
  }, [globalData.birthDate]);

  // Mandatory End calculation (6 weeks / 42 days total starting from birthDate)
  const mandatoryEndStr = useMemo(() => {
    if (!globalData.birthDate) return null;
    const bDate = new Date(globalData.birthDate);
    const mEnd = new Date(bDate);
    mEnd.setDate(bDate.getDate() + 41);
    return formatDateStr(mEnd);
  }, [globalData.birthDate]);

  // Sidebar controls
  const toggleSidebar = (side: "mom" | "dad") => {
    setOpenSidebar((prev) => (prev === side ? null : side));
  };

  // Header helpers
  const babyWeeksText = useMemo(() => {
    if (!globalData.birthDate) return "Calculando...";
    const birth = new Date(globalData.birthDate);
    const today = new Date();

    const birthZero = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = todayZero.getTime() - birthZero.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Faltan ${Math.abs(diffDays)} días`;
    }

    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;
    return `Semana ${weeks}${remDays > 0 ? " + " + remDays + "d" : ""}`;
  }, [globalData.birthDate]);

  const birthDateDisplay = useMemo(() => {
    if (!globalData.birthDate) return "Cargando...";
    const birth = new Date(globalData.birthDate);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `Nacido el ${birth.toLocaleDateString("es-ES", options)}`;
  }, [globalData.birthDate]);

  // Double Click / Selection handlers
  const handleDateClick = (e: React.MouseEvent, dateStr: string) => {
    // If Holiday mode is active, clicking immediately toggles the holiday on that date
    if (holidayMode) {
      toggleHolidayDirectly(dateStr);
      return;
    }

    const isShift = e.shiftKey;

    if (isShift && lastClickedDate) {
      // Prevent browser text selection
      window.getSelection()?.removeAllRanges();

      const start = lastClickedDate < dateStr ? lastClickedDate : dateStr;
      const end = lastClickedDate < dateStr ? dateStr : lastClickedDate;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const curr = new Date(startDate);
      const newSelected = [...selectedDates];

      while (curr <= endDate) {
        const dStr = formatDateStr(curr);
        if (!newSelected.includes(dStr)) {
          newSelected.push(dStr);
        }
        curr.setDate(curr.getDate() + 1);
      }
      setSelectedDates(newSelected);
    } else {
      setSelectedDates((prev) => {
        const idx = prev.indexOf(dateStr);
        if (idx > -1) {
          return prev.filter((d) => d !== dateStr);
        } else {
          return [...prev, dateStr];
        }
      });
    }

    setLastClickedDate(dateStr);
  };

  const handleDateDoubleClick = (dateStr: string) => {
    // Disable double click configure modal if in holiday mode
    if (holidayMode) return;

    setSelectedDates((prev) => {
      if (!prev.includes(dateStr)) {
        return [...prev, dateStr];
      }
      return prev;
    });

    // Detect if there's an existing holiday on that day
    const existingHoliday = globalData.festivos.find((f) => f.date === dateStr);
    if (existingHoliday) {
      setSelectedPerson("Festivo");
      setHolidayNameVal(existingHoliday.nombre);
    } else {
      // Detect if there's an existing event on that day
      const existing = globalData.events.find((e) => e.date === dateStr);
      if (existing) {
        setSelectedPerson(existing.person);
        setSelectedType(existing.type);
      } else {
        setSelectedPerson("Madre");
        const firstMomBalance = globalData.balances.find((b) => b.person === "Madre");
        setSelectedType(firstMomBalance ? firstMomBalance.type : "");
      }
    }

    setShowAssignModal(true);
  };

  const toggleHolidayDirectly = (dateStr: string) => {
    setGlobalData((prev) => {
      const exists = prev.festivos.some((f) => f.date === dateStr);
      if (exists) {
        return {
          ...prev,
          festivos: prev.festivos.filter((f) => f.date !== dateStr),
        };
      } else {
        const newFest: FestivoItem = {
          date: dateStr,
          nombre: "Festivo",
        };
        return {
          ...prev,
          festivos: [...prev.festivos, newFest].sort((a, b) => a.date.localeCompare(b.date)),
        };
      }
    });
  };

  const clearAllSelections = () => {
    setSelectedDates([]);
  };

  const openModalForSelection = (dateStr?: string) => {
    const count = dateStr ? 1 : selectedDates.length;
    if (count === 0) return;

    // Prefill modal dropdowns
    setSelectedPerson("Madre");
    const firstMomBalance = globalData.balances.find((b) => b.person === "Madre");
    setSelectedType(firstMomBalance ? firstMomBalance.type : "");
    setHolidayNameVal("Festivo");

    setShowAssignModal(true);
  };

  // Dynamically filter permits for selected person
  const currentPersonPermits = useMemo(() => {
    return globalData.balances.filter((b) => b.person === selectedPerson);
  }, [globalData.balances, selectedPerson]);

  // Save/Delete Event implementation matching AppScript "saveMultipleEvents" logic
  const handleSaveEvents = () => {
    const datesToProcess = selectedDates.length > 0 ? selectedDates : (lastClickedDate ? [lastClickedDate] : []);
    if (datesToProcess.length === 0) return;

    if (selectedPerson === "Festivo") {
      // Save Holidays (Festivos)
      setGlobalData((prev) => {
        let festivosList = [...prev.festivos];
        datesToProcess.forEach((dateStr) => {
          festivosList = festivosList.filter((f) => f.date !== dateStr);
          festivosList.push({
            date: dateStr,
            nombre: holidayNameVal.trim() || "Festivo",
          });
        });
        return {
          ...prev,
          festivos: festivosList.sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
    } else {
      // Save Permits
      if (!selectedType) {
        alert("Selecciona un tipo de permiso");
        return;
      }

      // Check frequency of this permit
      const targetBalance = globalData.balances.find(
        (b) => b.person === selectedPerson && b.type === selectedType
      );
      const isSemanal = targetBalance?.frecuencia === "Semanal";

      setGlobalData((prev) => {
        let eventsList = [...prev.events];

        datesToProcess.forEach((dateStr) => {
          if (isSemanal) {
            const startDate = new Date(dateStr);
            for (let i = 0; i < 7; i++) {
              const d = new Date(startDate);
              d.setDate(startDate.getDate() + i);
              const dStr = formatDateStr(d);

              // Clean whatever existed on that day
              eventsList = eventsList.filter((e) => e.date !== dStr);
              eventsList.push({
                date: dStr,
                person: selectedPerson,
                type: selectedType,
              });
            }
          } else {
            const dObj = new Date(dateStr);
            const dayOfWeek = dObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = prev.festivos.some((f) => f.date === dateStr);

            // Skip weekends and holidays logic
            if (skipNonWorkDays && (isWeekend || isHoliday)) {
              return;
            }

            // Clean whatever existed on that day
            eventsList = eventsList.filter((e) => e.date !== dateStr);
            eventsList.push({
              date: dateStr,
              person: selectedPerson,
              type: selectedType,
            });
          }
        });

        return {
          ...prev,
          events: eventsList,
        };
      });
    }

    setSelectedDates([]);
    setShowAssignModal(false);
  };

  const handleDeleteEvents = () => {
    const datesToProcess = selectedDates.length > 0 ? selectedDates : (lastClickedDate ? [lastClickedDate] : []);
    if (datesToProcess.length === 0) return;

    if (!confirm(`¿Borrar elementos de ${datesToProcess.length} día(s)?`)) return;

    if (selectedPerson === "Festivo") {
      // Delete Holidays
      setGlobalData((prev) => ({
        ...prev,
        festivos: prev.festivos.filter((f) => !datesToProcess.includes(f.date)),
      }));
    } else {
      // Delete Permits
      setGlobalData((prev) => {
        let eventsList = [...prev.events];

        datesToProcess.forEach((dateStr) => {
          // Find if an event exists on that day
          const existing = eventsList.find((e) => e.date === dateStr);
          if (existing) {
            const targetBalance = prev.balances.find(
              (b) => b.person === existing.person && b.type === existing.type
            );
            const isSemanal = targetBalance?.frecuencia === "Semanal";

            if (isSemanal) {
              const startDate = new Date(dateStr);
              for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dStr = formatDateStr(d);

                eventsList = eventsList.filter(
                  (e) => !(e.date === dStr && e.person === existing.person && e.type === existing.type)
                );
              }
            } else {
              eventsList = eventsList.filter((e) => e.date !== dateStr);
            }
          } else {
            eventsList = eventsList.filter((e) => e.date !== dateStr);
          }
        });

        return {
          ...prev,
          events: eventsList,
        };
      });
    }

    setSelectedDates([]);
    setShowAssignModal(false);
  };

  // General Config Modal submit handlers
  const handleConfigSubmit = () => {
    if (configBirthDate) {
      setGlobalData((prev) => ({
        ...prev,
        birthDate: configBirthDate,
      }));
    }
    setShowConfigModal(false);
  };

  const saveInitialConfig = () => {
    if (configBirthDate) {
      setGlobalData((prev) => ({
        ...prev,
        birthDate: configBirthDate,
      }));
    }
  };

  // Sidebar Inline Balance Editor Handlers (Step 1)
  const handleAddBalanceSidebar = (person: "Madre" | "Padre") => {
    const type = sidebarAddType.trim();
    const total = parseFloat(sidebarAddTotal);

    if (!type || isNaN(total) || total <= 0) {
      alert("Por favor, introduce un nombre válido y un número de días/semanas mayor que cero.");
      return;
    }

    // Check for duplicate
    const exists = globalData.balances.some(
      (b) => b.person === person && b.type.toLowerCase() === type.toLowerCase()
    );

    if (exists) {
      alert("Ya existe un saldo con ese nombre para esta persona.");
      return;
    }

    const newBalance: BalanceItem = {
      person,
      type,
      total,
      frecuencia: sidebarAddFreq,
    };

    setGlobalData((prev) => ({
      ...prev,
      balances: [...prev.balances, newBalance],
    }));

    // Reset Form
    setSidebarAddType("");
    setSidebarAddTotal("");
    if (person === "Madre") setShowAddFormMom(false);
    else setShowAddFormDad(false);
  };

  const startEditingBalance = (person: string, type: string) => {
    const bal = globalData.balances.find((b) => b.person === person && b.type === type);
    if (!bal) return;

    setEditingBalanceKey(`${person}-${type}`);
    setEditTypeVal(bal.type);
    setEditTotalVal(String(bal.total));
    setEditFreqVal(bal.frecuencia);
  };

  const handleUpdateBalance = (person: string, originalType: string) => {
    const newType = editTypeVal.trim();
    const newTotal = parseFloat(editTotalVal);

    if (!newType || isNaN(newTotal) || newTotal <= 0) {
      alert("Por favor, introduce un nombre válido y un número de días/semanas mayor que cero.");
      return;
    }

    // Check for duplicate if name is being changed
    if (newType.toLowerCase() !== originalType.toLowerCase()) {
      const exists = globalData.balances.some(
        (b) => b.person === person && b.type.toLowerCase() === newType.toLowerCase()
      );
      if (exists) {
        alert("Ya existe un saldo con ese nombre para esta persona.");
        return;
      }
    }

    setGlobalData((prev) => {
      const updatedBalances = prev.balances.map((b) => {
        if (b.person === person && b.type === originalType) {
          return {
            ...b,
            type: newType,
            total: newTotal,
            frecuencia: editFreqVal,
          };
        }
        return b;
      });

      // Update associated events
      const updatedEvents = prev.events.map((e) => {
        if (e.person === person && e.type === originalType) {
          return {
            ...e,
            type: newType,
          };
        }
        return e;
      });

      return {
        ...prev,
        balances: updatedBalances,
        events: updatedEvents,
      };
    });

    setEditingBalanceKey(null);
  };

  const handleDeleteBalance = (person: string, type: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el saldo de ${type} para ${person}?`)) return;

    setGlobalData((prev) => ({
      ...prev,
      balances: prev.balances.filter((b) => !(b.person === person && b.type === type)),
      events: prev.events.filter((e) => !(e.person === person && e.type === type)),
    }));

    setEditingBalanceKey(null);
  };

  // Sync / Refresh handler
  const handleRefresh = () => {
    setIsLoaded(false);
    fetch("/api/baby-leave-planner")
      .then((res) => res.json())
      .then((data) => {
        setGlobalData(migrateData(data));
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error reloading data:", err);
        setIsLoaded(true);
      });
  };

  // Sidebar KPI & Balance Editing Render Logic (Step 1)
  const renderKPIs = (person: "Madre" | "Padre") => {
    const personBalances = globalData.balances.filter((b) => b.person === person);
    const isMom = person === "Madre";
    const showAddForm = isMom ? showAddFormMom : showAddFormDad;
    const setShowAddForm = isMom ? setShowAddFormMom : setShowAddFormDad;

    return (
      <div className="space-y-4">
        <div className="sidebar-section-title flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
          <span className="text-slate-800 dark:text-slate-100 font-extrabold flex items-center gap-2">
            {isMom ? "👩 Madre" : "👨 Padre"}
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
            title="Añadir saldo de días"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Inline form to create a new balance */}
        {showAddForm && (
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 mb-4 animate-in slide-in-from-top-4 duration-200">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Añadir Saldo</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1 uppercase">Frecuencia</label>
                <select
                  value={sidebarAddFreq}
                  onChange={(e) => setSidebarAddFreq(e.target.value as "Diario" | "Semanal")}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="Diario">Diario</option>
                  <option value="Semanal">Semanal</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 font-bold mb-1 uppercase">Días/Semanas</label>
                <input
                  type="number"
                  placeholder="Ej. 15"
                  value={sidebarAddTotal}
                  onChange={(e) => setSidebarAddTotal(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg bg-white dark:bg-slate-800 text-center"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 font-bold mb-1 uppercase">Nombre del Permiso</label>
              <input
                type="text"
                placeholder="Ej. Lactancia"
                value={sidebarAddType}
                onChange={(e) => setSidebarAddType(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg bg-white dark:bg-slate-800 outline-none"
                required
              />
            </div>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                className="flex-1 p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="flex-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                onClick={() => handleAddBalanceSidebar(person)}
              >
                Añadir
              </button>
            </div>
          </div>
        )}

        {personBalances.length === 0 && !showAddForm && (
          <div className="flex flex-col h-full justify-center items-center text-center p-8">
            <p className="text-sm font-semibold text-slate-400">No hay saldos configurados.</p>
          </div>
        )}

        <div className="space-y-4">
          {personBalances.map((bal, idx) => {
            const isEditing = editingBalanceKey === `${person}-${bal.type}`;

            // Calculate used days counting from globalData.events
            const usedDays = globalData.events.filter(
              (e) => e.person === bal.person && e.type === bal.type
            ).length;

            const total = Number(bal.total);
            let used = 0;
            let remaining = 0;
            let unit = "";

            if (bal.frecuencia === "Semanal") {
              used = parseFloat((usedDays / 7).toFixed(1));
              remaining = parseFloat((total - used).toFixed(1));
              unit = "SEM";
            } else {
              used = usedDays;
              remaining = total - used;
              unit = "DÍAS";
            }

            const percent = Math.min(100, (used / total) * 100);
            const barClass = isMom ? "bar-mom" : "bar-dad";
            const isLow = (remaining <= 2 && bal.frecuencia !== "Semanal") || remaining <= 0;

            if (isEditing) {
              return (
                <div key={idx} className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Editar Permiso</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[8px] text-slate-500 font-bold mb-1 uppercase">Frecuencia</label>
                      <select
                        value={editFreqVal}
                        onChange={(e) => setEditFreqVal(e.target.value as "Diario" | "Semanal")}
                        className="w-full p-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg bg-white dark:bg-slate-800"
                      >
                        <option value="Diario">Diario</option>
                        <option value="Semanal">Semanal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500 font-bold mb-1 uppercase">Cantidad</label>
                      <input
                        type="number"
                        value={editTotalVal}
                        onChange={(e) => setEditTotalVal(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg bg-white dark:bg-slate-800 text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-500 font-bold mb-1 uppercase">Nombre</label>
                    <input
                      type="text"
                      value={editTypeVal}
                      onChange={(e) => setEditTypeVal(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2 text-xs pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteBalance(person, bal.type)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      title="Eliminar saldo"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold"
                        onClick={() => setEditingBalanceKey(null)}
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                        onClick={() => handleUpdateBalance(person, bal.type)}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className={`kpi-card-sidebar relative group ${isLow ? "bg-danger-light" : ""}`}>
                {/* Hover inline edit trigger */}
                <button
                  onClick={() => startEditingBalance(person, bal.type)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-400 group-hover:opacity-100 opacity-0 transition-opacity duration-150 cursor-pointer"
                  title="Editar este saldo"
                >
                  <Edit2 size={12} />
                </button>

                <div className="kpi-card-header pr-6">
                  <span className="kpi-card-label truncate max-w-[130px]" title={bal.type}>
                    {bal.type}
                  </span>
                  <div className="kpi-card-remaining shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className={`remaining-value ${isLow ? "text-danger" : "text-slate-800 dark:text-slate-100"}`}>
                      {remaining}
                    </span>
                    <span className="remaining-unit">{unit} LIBRES</span>
                  </div>
                </div>

                <div className="kpi-progress-wrapper">
                  <div className={`kpi-progress-bar ${barClass}`} style={{ width: `${percent}%` }} />
                </div>

                <div className="kpi-card-footer">
                  <div className="footer-stat text-left">
                    <span>{used} {unit}</span>
                    <span>USADOS</span>
                  </div>
                  <div className="footer-stat text-right">
                    <span>{total} {unit}</span>
                    <span>TOTAL</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full text-slate-800 dark:text-slate-200 select-none">
      {/* Dynamic CSS Styling Inject */}
      <style jsx global>{`
        :root {
          --color-mom: #fce7f3;
          --text-mom: #be185d;
          --stroke-mom: #db2777;
          --color-dad: #e0f2fe;
          --text-dad: #0369a1;
          --stroke-dad: #0284c7;
          --color-joint: #f3e8ff;
          --text-joint: #7e22ce;
        }

        /* --- SIDEBARS RESPONSIVE --- */
        .sidebar-fixed {
          position: fixed;
          top: 36px; /* Offset ToolBaseLayout top bar height */
          height: calc(100vh - 36px);
          width: 85%;
          max-width: 320px;
          background: white;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
          z-index: 2000;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
        }
        .dark .sidebar-fixed {
          background: #0f172a;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
        }

        #sidebar-mom {
          left: 0;
          transform: translateX(-105%);
          border-right: 1px solid #e2e8f0;
        }
        .dark #sidebar-mom {
          border-right: 1px solid #1e293b;
        }
        #sidebar-mom.open {
          transform: translateX(0);
        }

        #sidebar-dad {
          right: 0;
          transform: translateX(105%);
          border-left: 1px solid #e2e8f0;
          flex-direction: row-reverse;
        }
        .dark #sidebar-dad {
          border-left: 1px solid #1e293b;
        }
        #sidebar-dad.open {
          transform: translateX(0);
        }

        @media (min-width: 768px) {
          .sidebar-fixed {
            width: 320px;
          }
        }

        .sidebar-inner {
          flex-grow: 1;
          padding: 30px 20px;
          overflow-y: auto;
          background: #f8fafc;
        }
        .dark .sidebar-inner {
          background: #0b0f19;
        }

        .sidebar-handle {
          width: 44px;
          height: 100px;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 1.2rem;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          z-index: 2001;
          user-select: none;
        }

        #sidebar-mom .sidebar-handle {
          right: -44px;
          background: #be185d;
          border-radius: 0 12px 12px 0;
        }

        #sidebar-dad .sidebar-handle {
          left: -44px;
          background: #0369a1;
          border-radius: 12px 0 0 12px;
        }

        /* --- BARRA DE FILTROS --- */
        .filter-bar-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          padding-top: 10px;
        }

        .filter-pill-group {
          background: white;
          padding: 5px;
          border-radius: 50px;
          display: flex;
          gap: 5px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
        }
        .dark .filter-pill-group {
          background: #1e293b;
          border-color: #334155;
        }

        .btn-filter {
          border: none;
          background: transparent;
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dark .btn-filter {
          color: #94a3b8;
        }

        .btn-filter:hover {
          background: #f1f5f9;
        }
        .dark .btn-filter:hover {
          background: #334155;
        }

        .btn-filter.active {
          background: #4f46e5;
          color: white !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        /* --- GRID DEL CALENDARIO --- */
        #calendar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
          padding-bottom: 120px;
        }

        .month-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .dark .month-card {
          background: #1e293b;
          border-color: #334155;
        }

        .month-header {
          background: #f8fafc;
          padding: 12px;
          text-align: center;
          font-weight: 800;
          text-transform: capitalize;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          font-size: 0.95rem;
        }
        .dark .month-header {
          background: #0f172a;
          color: #f1f5f9;
          border-bottom-color: #334155;
        }

        .days-names-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
        }
        .dark .days-names-row {
          background: #1e293b;
          border-bottom-color: #334155;
        }

        .day-name-label {
          text-align: center;
          font-size: 0.65rem;
          color: #94a3b8;
          padding: 8px 0;
          font-weight: 700;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 1fr;
        }

        .day-cell-fixed {
          aspect-ratio: 1/1;
          border-right: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 4px;
          overflow: hidden;
          transition: background 0.1s;
          user-select: none;
          -webkit-user-select: none;
        }
        .dark .day-cell-fixed {
          border-right-color: #334155;
          border-bottom-color: #334155;
        }

        .day-cell-fixed:nth-child(7n) {
          border-right: none;
        }

        /* ESTADOS CALENDARIO */
        .day-cell-fixed.selected {
          background-color: #eef2ff !important;
          box-shadow: inset 0 0 0 2px #4f46e5;
          z-index: 2;
        }
        .dark .day-cell-fixed.selected {
          background-color: #1e1b4b !important;
          box-shadow: inset 0 0 0 2px #6366f1;
        }

        .weekend {
          background-color: #fcfcfc;
        }
        .dark .weekend {
          background-color: #111827;
        }

        .empty-cell {
          background: #fff;
          cursor: default;
        }
        .dark .empty-cell {
          background: #1e293b;
        }

        /* Elementos internos */
        .cell-inner-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          width: 100%;
          pointer-events: none;
        }

        .d-icon {
          font-size: 0.95rem;
          line-height: 1;
          height: 18px;
          display: flex;
          align-items: center;
          margin-bottom: 1px;
        }

        .d-text {
          font-size: 0.45rem;
          font-weight: 800;
          text-transform: uppercase;
          text-align: center;
          width: 96%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          height: 10px;
          color: inherit;
          opacity: 0.9;
        }

        .d-num {
          position: absolute;
          top: 4px;
          left: 5px;
          font-size: 0.65rem;
          font-weight: 700;
          color: #cbd5e1;
        }
        .dark .d-num {
          color: #475569;
        }

        /* Colores Celdas */
        .bg-mom {
          background-color: var(--color-mom) !important;
          color: var(--text-mom) !important;
        }

        .bg-dad {
          background-color: var(--color-dad) !important;
          color: var(--text-dad) !important;
        }

        .bg-joint {
          background-color: var(--color-joint) !important;
          color: var(--text-joint) !important;
        }

        .bg-holiday {
          background-color: #fee2e2 !important;
          color: #dc2626 !important;
        }
        .dark .bg-holiday {
          background-color: #7f1d1d !important;
          color: #fca5a5 !important;
        }

        .dot-festivo {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 5px;
          height: 5px;
          background: #dc2626;
          border-radius: 50%;
        }

        /* --- BOTÓN FLOTANTE SELECCIÓN --- */
        #floating-wrapper {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%) translateY(150px);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2000;
          display: flex;
          gap: 10px;
          background: white;
          padding: 6px;
          border-radius: 50px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
        }
        .dark #floating-wrapper {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }

        #floating-wrapper.visible {
          transform: translateX(-50%) translateY(0);
        }

        .btn-float-action {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
        }

        .btn-float-close {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          font-weight: bold;
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dark .btn-float-close {
          background: #334155;
          color: #cbd5e1;
        }

        /* --- KPIs SIDEBARS STYLE --- */
        .sidebar-section-title {
          font-size: 1.1rem;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 3px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: -0.5px;
        }
        .dark .sidebar-section-title {
          color: #f1f5f9;
          border-bottom-color: #1e293b;
        }

        .kpi-card-sidebar {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .dark .kpi-card-sidebar {
          background: #1e293b;
          border-color: #334155;
        }

        .kpi-card-sidebar:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
          border-color: #4f46e5;
        }

        .kpi-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .kpi-card-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.3;
        }
        .dark .kpi-card-label {
          color: #94a3b8;
        }

        .kpi-card-remaining {
          text-align: right;
          padding: 6px 12px;
          border-radius: 12px;
        }

        .remaining-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 950;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .remaining-unit {
          font-size: 0.6rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
        }

        /* Progress Bar Base */
        .kpi-progress-wrapper {
          height: 12px;
          background: #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
          margin: 15px 0;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .dark .kpi-progress-wrapper {
          background: #0f172a;
        }

        .kpi-progress-bar {
          height: 100%;
          border-radius: 20px;
          transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        /* Glowing Gradients */
        .bar-mom {
          background: linear-gradient(90deg, #db2777, #f472b6);
          box-shadow: 0 2px 8px rgba(219, 39, 119, 0.3);
        }

        .bar-dad {
          background: linear-gradient(90deg, #0284c7, #38bdf8);
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
        }

        .kpi-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          margin-top: 5px;
        }

        .footer-stat {
          display: flex;
          flex-direction: column;
        }

        .footer-stat span:last-child {
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.6rem;
        }

        /* Danger states */
        .text-danger {
          color: #ef4444 !important;
        }

        .bg-danger-light {
          background: #fef2f2 !important;
          border-color: #fecaca !important;
        }
        .dark .bg-danger-light {
          background: #450a0a !important;
          border-color: #7f1d1d !important;
        }
      `}</style>

      {/* Synchronizing Loading overlay */}
      {!isLoaded && (
        <div id="loading" className="fixed inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-[9999]">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">Sincronizando datos...</p>
        </div>
      )}

      {/* Dual Sidebars with handles */}
      {isLoaded && (
        <>
          <aside id="sidebar-mom" className={`sidebar-fixed ${openSidebar === "mom" ? "open" : ""}`}>
            <div className="sidebar-inner">{renderKPIs("Madre")}</div>
            <div className="sidebar-handle" onClick={() => toggleSidebar("mom")}>
              👩
            </div>
          </aside>

          <aside id="sidebar-dad" className={`sidebar-fixed ${openSidebar === "dad" ? "open" : ""}`}>
            <div className="sidebar-inner">{renderKPIs("Padre")}</div>
            <div className="sidebar-handle" onClick={() => toggleSidebar("dad")}>
              👨
            </div>
          </aside>

          {/* Click outside backdrop overlay */}
          {openSidebar && (
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-xs z-[1999]"
              onClick={() => setOpenSidebar(null)}
            />
          )}
        </>
      )}

      {/* Main Container Layout */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
        {/* Header Section (from Index.html) */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">👶</span>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-none">
                Parental
              </h1>
              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase">
                Planner
              </span>
            </div>
          </div>

          {/* Baby Status Center */}
          {globalData.birthDate && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 px-5 py-2 rounded-full gap-3 border border-slate-200/50 dark:border-slate-600/50 w-full md:w-auto justify-center">
              <span className="text-base animate-pulse">✨</span>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <span id="display-birth-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {birthDateDisplay}
                </span>
                <span id="baby-weeks" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                  {babyWeeksText}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {/* Interactive Holiday Mode Toggle (Step 2) */}
            <button
              onClick={() => setHolidayMode(!holidayMode)}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition flex items-center justify-center gap-2 cursor-pointer ${
                holidayMode
                  ? "bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400"
                  : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
              title="Activar para configurar festivos haciendo clic directamente en el calendario"
            >
              🚩 MODO FESTIVOS: {holidayMode ? "ON" : "OFF"}
            </button>

            <button
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer text-slate-600 dark:text-slate-300"
              onClick={handleRefresh}
              title="Sincronizar"
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer text-slate-600 dark:text-slate-300"
              onClick={() => {
                setShowConfigModal(true);
              }}
              title="Ajustes"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Informative Banner for Shift + Click */}
        {globalData.birthDate && isLoaded && (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex items-start gap-3 text-xs text-indigo-700 dark:text-indigo-300">
            <Info size={18} className="shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <span className="font-bold text-sm block mb-0.5">💡 Truco de selección rápida:</span>
              Haz clic en un día del calendario, mantén pulsada la tecla <kbd className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-1.5 py-0.5 rounded shadow-xs font-mono font-black text-[10px]">Shift</kbd> y haz clic en otro día para seleccionar un rango completo automáticamente. Haz doble clic en cualquier celda para abrir el selector al instante.
            </div>
          </div>
        )}

        {/* Initial Setup Screen (if no birthDate is set) */}
        {!globalData.birthDate && isLoaded && (
          <div id="setup-screen" className="max-w-md mx-auto text-center bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700/80 my-12 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-slate-100">¡Bienvenida/o! ✨</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Introduce la fecha de nacimiento del bebé para comenzar a planificar:
            </p>
            <input
              type="date"
              value={configBirthDate}
              onChange={(e) => setConfigBirthDate(e.target.value)}
              className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 font-bold text-slate-700 dark:text-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
            />
            <button
              onClick={saveInitialConfig}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-xl shadow-md transition"
            >
              Comenzar
            </button>
          </div>
        )}

        {/* Main Application Workspace */}
        {globalData.birthDate && isLoaded && (
          <div id="app-content" className="space-y-6">
            {/* Filter bar */}
            <div className="filter-bar-container">
              <div className="filter-pill-group">
                <button
                  className={`btn-filter ${currentFilter === "all" ? "active" : ""}`}
                  onClick={() => setCurrentFilter("all")}
                >
                  TODO
                </button>
                <button
                  className={`btn-filter ${currentFilter === "Madre" ? "active" : ""}`}
                  onClick={() => setCurrentFilter("Madre")}
                >
                  MAMÁ
                </button>
                <button
                  className={`btn-filter ${currentFilter === "Padre" ? "active" : ""}`}
                  onClick={() => setCurrentFilter("Padre")}
                >
                  PAPÁ
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div id="calendar-grid">
              {monthsData.map((monthDate, mIdx) => {
                const year = monthDate.getFullYear();
                const month = monthDate.getMonth();
                const monthNames = [
                  "Enero",
                  "Febrero",
                  "Marzo",
                  "Abril",
                  "Mayo",
                  "Junio",
                  "Julio",
                  "Agosto",
                  "Septiembre",
                  "Octubre",
                  "Noviembre",
                  "Diciembre",
                ];
                const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

                // Compute weekday offset
                let firstDay = new Date(year, month, 1).getDay();
                if (firstDay === 0) firstDay = 7;

                // Total cells tracker to guarantee 42 cells grid
                let totalCells = 0;
                const gridCells = [];

                // Pad preceding empty cells
                for (let j = 1; j < firstDay; j++) {
                  gridCells.push(<div key={`empty-start-${j}`} className="day-cell-fixed empty-cell" />);
                  totalCells++;
                }

                // Days of the month
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateObj = new Date(year, month, d);
                  const dateStr = formatDateStr(dateObj);
                  const dayOfWeek = dateObj.getDay();

                  // Find event, holiday, mandatory statuses
                  const evt = globalData.events.find((e) => e.date === dateStr);
                  const festivo = globalData.festivos.find((f) => f.date === dateStr);

                  const checkTime = dateObj.getTime();
                  const birthTime = new Date(globalData.birthDate!).getTime();
                  const mandEnd = mandatoryEndStr ? new Date(mandatoryEndStr) : null;
                  const mandEndTime = mandEnd ? mandEnd.getTime() : 0;
                  const isMandatory = checkTime >= birthTime && checkTime <= mandEndTime;

                  let cssClass = "";
                  let icon = "";
                  let text = "";
                  let showDot = false;
                  let hoverInfo = `Día: ${dateStr}`;

                  // Visual Filtering rules
                  let isVisible = true;
                  if (evt && currentFilter !== "all" && evt.person !== currentFilter) {
                    isVisible = false;
                  }

                  if (evt && isVisible) {
                    cssClass = evt.person === "Madre" ? "bg-mom" : "bg-dad";
                    icon = evt.person === "Madre" ? "👩" : "👨";
                    text = evt.type;
                    hoverInfo = `${evt.person}: ${evt.type}`;
                    if (festivo) {
                      showDot = true;
                      hoverInfo += ` | Festivo`;
                    }
                  } else if (festivo) {
                    cssClass = "bg-holiday";
                    icon = "🚩";
                    text = festivo.nombre;
                    hoverInfo = `Festivo: ${festivo.nombre}`;
                  } else if (isMandatory) {
                    cssClass = "bg-joint";
                    icon = "👶";
                    text = "OBLIG.";
                    hoverInfo = "Periodo Obligatorio";
                  }

                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                    cssClass += " weekend";
                  }

                  const isSelected = selectedDates.includes(dateStr);

                  gridCells.push(
                    <div
                      key={`day-${d}`}
                      id={`cell-${dateStr}`}
                      className={`day-cell-fixed ${cssClass} ${isSelected ? "selected" : ""}`}
                      title={hoverInfo}
                      onClick={(e) => handleDateClick(e, dateStr)}
                      onDoubleClick={() => handleDateDoubleClick(dateStr)}
                    >
                      <span className="d-num">{d}</span>
                      {showDot && <div className="dot-festivo" />}
                      <div className="cell-inner-wrapper">
                        <div className="d-icon">{icon}</div>
                        <div className="d-text truncate px-0.5">{text}</div>
                      </div>
                    </div>
                  );
                  totalCells++;
                }

                // Pad remaining cells up to 42
                let padIdx = 0;
                while (totalCells < 42) {
                  gridCells.push(<div key={`empty-end-${padIdx}`} className="day-cell-fixed empty-cell" />);
                  totalCells++;
                  padIdx++;
                }

                return (
                  <div key={mIdx} className="month-card">
                    <div className="month-header">
                      {monthNames[month]} {year}
                    </div>
                    <div className="days-names-row">
                      {dayNames.map((n, nIdx) => (
                        <div key={nIdx} className="day-name-label">
                          {n}
                        </div>
                      ))}
                    </div>
                    <div className="days-grid">{gridCells}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Range Selection Bar (from calendar.html) */}
      <div id="floating-wrapper" className={selectedDates.length > 0 ? "visible" : ""}>
        <button className="btn-float-close cursor-pointer" onClick={clearAllSelections}>
          <X size={16} />
        </button>
        <button className="btn-float-action cursor-pointer" onClick={() => openModalForSelection()}>
          <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs font-black">
            {selectedDates.length}
          </span>
          Configurar Días
        </button>
      </div>

      {/* --- ASSIGN PERMIT MODAL (Tailwind Glassmorphic Overhaul) --- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[3000] p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                  Configurar Días
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Se configurarán {selectedDates.length} día(s)
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* List/Summary of selected dates */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Días Seleccionados
              </label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedDates.map((dStr) => {
                  const formatted = dStr.split("-").reverse().slice(0, 2).join("/");
                  return (
                    <span
                      key={dStr}
                      className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100/50 dark:border-indigo-900/50"
                    >
                      {formatted}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Asignar A
                </label>
                <select
                  value={selectedPerson}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPerson(val);
                    if (val !== "Festivo") {
                      const permits = globalData.balances.filter((b) => b.person === val);
                      if (permits.length > 0) {
                        setSelectedType(permits[0].type);
                      } else {
                        setSelectedType("");
                      }
                    }
                  }}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
                >
                  <option value="Madre">Madre 👩</option>
                  <option value="Padre">Padre 👨</option>
                  <option value="Festivo">Festivo 🚩</option>
                </select>
              </div>

              {selectedPerson === "Festivo" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Nombre del Festivo
                  </label>
                  <input
                    type="text"
                    value={holidayNameVal}
                    onChange={(e) => setHolidayNameVal(e.target.value)}
                    placeholder="Ej. Año Nuevo"
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Tipo de Permiso
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
                  >
                    {currentPersonPermits.map((p, idx) => (
                      <option key={idx} value={p.type}>
                        {p.type} {p.frecuencia === "Semanal" ? "(Semana)" : ""}
                      </option>
                    ))}
                    {currentPersonPermits.length === 0 && (
                      <option value="">No hay tipos de permisos configurados</option>
                    )}
                  </select>
                </div>
              )}

              {selectedPerson !== "Festivo" && (
                /* Omit non-working days logic checkbox */
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="skipNonWorkDays"
                    checked={skipNonWorkDays}
                    onChange={(e) => setSkipNonWorkDays(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <label
                    htmlFor="skipNonWorkDays"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                  >
                    Omitir fines de semana y festivos al guardar
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                className="px-4 py-2 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-red-500 font-bold transition text-sm cursor-pointer"
                onClick={handleDeleteEvents}
              >
                Borrar
              </button>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition text-sm cursor-pointer"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cerrar
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition text-sm shadow-xs cursor-pointer"
                  onClick={handleSaveEvents}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS / CONFIGURATION MODAL (Tailwind Overhaul) --- */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[3000] p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm mx-auto shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings size={20} className="text-slate-500 dark:text-slate-400" />
                Ajustes Generales
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab: Birth Date */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={configBirthDate}
                  onChange={(e) => setConfigBirthDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  * Al cambiar esta fecha, el calendario de 15 meses se recalculará automáticamente a partir del mes de nacimiento.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition text-sm cursor-pointer"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition text-sm shadow-xs cursor-pointer"
                  onClick={handleConfigSubmit}
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
