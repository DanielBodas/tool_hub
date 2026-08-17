"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  RefreshCw,
  Settings,
  X,
  Trash2,
  Edit2,
  Plus,
  ArrowUp,
  ArrowDown,
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

// Helper function to ensure balance symmetry between Madre and Padre
function syncBalancesSymmetry(balances: BalanceItem[]): BalanceItem[] {
  const result = [...balances];
  const parents: ("Madre" | "Padre")[] = ["Madre", "Padre"];

  parents.forEach((sourceParent) => {
    const targetParent: "Madre" | "Padre" = sourceParent === "Madre" ? "Padre" : "Madre";
    const sourceItems = result.filter((b) => b.person === sourceParent);

    sourceItems.forEach((sourceBal) => {
      const exists = result.some((b) => b.person === targetParent && b.type === sourceBal.type);
      if (!exists) {
        result.push({
          person: targetParent,
          type: sourceBal.type,
          total: sourceBal.total,
          frecuencia: sourceBal.frecuencia,
        });
      }
    });
  });

  return result;
}

// Migration Helper
function migrateData(loadedData: LegacyData | null | undefined): GlobalData {
  const defaultBalances: BalanceItem[] = [
    { person: "Madre", type: "Permiso Nacimiento", total: 19, frecuencia: "Semanal" },
    { person: "Madre", type: "Lactancia", total: 15, frecuencia: "Diario" },
    { person: "Padre", type: "Permiso Nacimiento", total: 19, frecuencia: "Semanal" },
    { person: "Padre", type: "Lactancia", total: 15, frecuencia: "Diario" },
  ];

  if (!loadedData) {
    return {
      birthDate: null,
      events: [],
      balances: defaultBalances,
      festivos: [],
    };
  }

  // 1. Process Balances
  let finalBalances: BalanceItem[] = [];
  if (Array.isArray(loadedData.balances) && loadedData.balances.length > 0) {
    finalBalances = loadedData.balances.map((b) => ({
      person: b.person,
      type: b.type,
      total: Number(b.total) || 0,
      frecuencia: b.frecuencia || "Diario",
    }));
  } else if (Array.isArray(loadedData.allowances) && loadedData.allowances.length > 0) {
    finalBalances = loadedData.allowances.map((a) => ({
      person: a.parent === "mother" ? "Madre" : "Padre",
      type: a.name || "Permiso",
      total: Number(a.totalDays) || 0,
      frecuencia: a.consumptionMode === "weeks" ? "Semanal" : "Diario",
    }));
  } else {
    finalBalances = defaultBalances;
  }

  // 2. Process Festivos / Holidays
  let finalFestivos: FestivoItem[] = [];
  if (Array.isArray(loadedData.festivos) && loadedData.festivos.length > 0) {
    finalFestivos = loadedData.festivos;
  } else if (Array.isArray(loadedData.holidays) && loadedData.holidays.length > 0) {
    finalFestivos = loadedData.holidays.map((hStr: string) => ({
      date: typeof hStr === "string" ? hStr : (hStr as unknown as { date: string }).date || "",
      nombre: typeof hStr === "string" ? "Festivo" : (hStr as unknown as { nombre: string }).nombre || "Festivo",
    })).filter((f) => f.date);
  }

  // 3. Process Events
  let finalEvents: EventItem[] = [];
  if (Array.isArray(loadedData.events) && loadedData.events.length > 0) {
    finalEvents = loadedData.events;
  } else if (Array.isArray(loadedData.flexibleBlocks) && loadedData.birthDate) {
    loadedData.flexibleBlocks.forEach((block) => {
      const start = new Date(block.startDate);
      const end = new Date(block.endDate);
      const person = block.parent === "mother" ? "Madre" : "Padre";
      const allowance = loadedData.allowances?.find((a) => a.id === block.allowanceId);
      const type = allowance?.name || "Permiso";

      const current = new Date(start);
      while (current <= end) {
        finalEvents.push({
          date: formatDateStr(current),
          person,
          type,
        });
        current.setDate(current.getDate() + 1);
      }
    });
  }

  return {
    birthDate: loadedData.birthDate || null,
    events: finalEvents,
    balances: finalBalances,
    festivos: finalFestivos,
  };
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

  // Custom Styled Confirmation & Alert Modal State (replaces native browser alert/confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: "Entendido",
      cancelText: "",
      isDanger: false,
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

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

  // Generation Modal State
  const [generateModal, setGenerateModal] = useState<{
    isOpen: boolean;
    person: "Madre" | "Padre";
    type: string;
  }>({
    isOpen: false,
    person: "Madre",
    type: "Permiso Nacimiento",
  });

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
      const preferredPerson = currentFilter !== "all" ? currentFilter : "Madre";
      const existingForPref = globalData.events.find(
        (e) => e.date === dateStr && e.person === preferredPerson
      );
      const existingAny = globalData.events.find((e) => e.date === dateStr);
      const existing = existingForPref || existingAny;

      if (existing) {
        setSelectedPerson(existing.person);
        setSelectedType(existing.type);
      } else {
        setSelectedPerson(preferredPerson);
        const firstBalance = globalData.balances.find((b) => b.person === preferredPerson);
        setSelectedType(firstBalance ? firstBalance.type : "");
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
        showAlert("Tipo de Permiso Requerido", "Por favor, selecciona un tipo de permiso.");
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

              // Clean previous events on that day for this specific person
              eventsList = eventsList.filter(
                (e) => !(e.date === dStr && e.person === selectedPerson)
              );
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

            // Clean previous events on that day for this specific person
            eventsList = eventsList.filter(
              (e) => !(e.date === dateStr && e.person === selectedPerson)
            );
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
          // Find if an event exists on that day for selectedPerson
          const existing = eventsList.find((e) => e.date === dateStr && e.person === selectedPerson);
          if (existing) {
            const targetBalance = prev.balances.find(
              (b) => b.person === selectedPerson && b.type === existing.type
            );
            const isSemanal = targetBalance?.frecuencia === "Semanal";

            if (isSemanal) {
              const startDate = new Date(dateStr);
              for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dStr = formatDateStr(d);

                eventsList = eventsList.filter(
                  (e) => !(e.date === dStr && e.person === selectedPerson && e.type === existing.type)
                );
              }
            } else {
              eventsList = eventsList.filter(
                (e) => !(e.date === dateStr && e.person === selectedPerson)
              );
            }
          } else {
            eventsList = eventsList.filter(
              (e) => !(e.date === dateStr && e.person === selectedPerson)
            );
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

  // Sync Balance Configuration between Madre and Padre
  const handleSyncParentsConfig = () => {
    setGlobalData((prev) => ({
      ...prev,
      balances: syncBalancesSymmetry(prev.balances),
    }));
    showAlert(
      "Configuración Sincronizada",
      "Se han igualado todos los permisos y saldos entre Madre y Padre para que ambos tengan la misma configuración."
    );
  };

  // Sidebar Inline Balance Editor Handlers (Step 1)
  const handleAddBalanceSidebar = (person: "Madre" | "Padre") => {
    const type = sidebarAddType.trim();
    const total = parseFloat(sidebarAddTotal);

    if (!type || isNaN(total) || total <= 0) {
      showAlert("Datos Incompletos", "Por favor, introduce un nombre válido y un número mayor que cero.");
      return;
    }

    // Check for duplicate
    const exists = globalData.balances.some(
      (b) => b.person === person && b.type.toLowerCase() === type.toLowerCase()
    );

    if (exists) {
      showAlert("Permiso Duplicado", "Ya existe un saldo con ese nombre para esta persona.");
      return;
    }

    const newBalance: BalanceItem = {
      person,
      type,
      total,
      frecuencia: sidebarAddFreq,
    };

    setGlobalData((prev) => {
      return {
        ...prev,
        balances: [...prev.balances, newBalance],
      };
    });

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
      showAlert("Datos Incompletos", "Por favor, introduce un nombre válido y un número mayor que cero.");
      return;
    }

    // Check for duplicate if name is being changed
    if (newType.toLowerCase() !== originalType.toLowerCase()) {
      const exists = globalData.balances.some(
        (b) => b.person === person && b.type.toLowerCase() === newType.toLowerCase()
      );
      if (exists) {
        showAlert("Permiso Duplicado", "Ya existe un saldo con ese nombre para esta persona.");
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
    setConfirmModal({
      isOpen: true,
      title: "Eliminar Permiso",
      message: `¿Estás seguro de que quieres eliminar la sección "${type}" de ${person}? Se borrarán también todos los días asignados en el calendario.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      isDanger: true,
      onConfirm: () => {
        setGlobalData((prev) => ({
          ...prev,
          balances: prev.balances.filter((b) => !(b.person === person && b.type === type)),
          events: prev.events.filter((e) => !(e.person === person && e.type === type)),
        }));
        setEditingBalanceKey(null);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
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

  // Generation Helpers for Permiso Nacimiento / Leave Weeks
  const handleAutoGenerateWeeks = (person: "Madre" | "Padre", weeksCount: number) => {
    if (!globalData.birthDate) {
      showAlert("Fecha Inexistente", "Debes configurar primero la fecha de nacimiento del bebé.");
      return;
    }

    const birthDate = new Date(globalData.birthDate);
    const targetBalance = globalData.balances.find((b) => b.person === person && b.type === "Permiso Nacimiento");
    const typeName = targetBalance?.type || "Permiso Nacimiento";

    const daysCount = weeksCount * 7;
    const newEvents: EventItem[] = [];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(birthDate);
      d.setDate(birthDate.getDate() + i);
      newEvents.push({
        date: formatDateStr(d),
        person,
        type: typeName,
      });
    }

    setGlobalData((prev) => {
      // Filter out existing events for this person and type within the date range
      const newDatesSet = new Set(newEvents.map((e) => e.date));
      const filteredExisting = prev.events.filter(
        (e) => !(e.person === person && e.type === typeName && newDatesSet.has(e.date))
      );

      return {
        ...prev,
        events: [...filteredExisting, ...newEvents].sort((a, b) => a.date.localeCompare(b.date)),
      };
    });

    setGenerateModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleManualGenerateWeeks = (person: "Madre" | "Padre", weeksCount: number) => {
    if (!globalData.birthDate) {
      showAlert("Fecha Inexistente", "Debes configurar primero la fecha de nacimiento del bebé.");
      return;
    }

    const birthDate = new Date(globalData.birthDate);
    const targetBalance = globalData.balances.find((b) => b.person === person && b.type === "Permiso Nacimiento");
    const typeName = targetBalance?.type || "Permiso Nacimiento";

    const daysCount = weeksCount * 7;
    const preselectedDates: string[] = [];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(birthDate);
      d.setDate(birthDate.getDate() + i);
      preselectedDates.push(formatDateStr(d));
    }

    setSelectedDates(preselectedDates);
    setSelectedPerson(person);
    setSelectedType(typeName);
    setGenerateModal((prev) => ({ ...prev, isOpen: false }));
    setShowAssignModal(true);
  };

  // Reorder balance card helper
  const moveBalance = (person: "Madre" | "Padre", direction: "up" | "down", indexInPerson: number) => {
    const personIndices = globalData.balances
      .map((b, idx) => (b.person === person ? idx : -1))
      .filter((idx) => idx !== -1);

    const targetIndexInPerson = direction === "up" ? indexInPerson - 1 : indexInPerson + 1;
    if (targetIndexInPerson < 0 || targetIndexInPerson >= personIndices.length) return;

    const globalIdx1 = personIndices[indexInPerson];
    const globalIdx2 = personIndices[targetIndexInPerson];

    setGlobalData((prev) => {
      const newBalances = [...prev.balances];
      const temp = newBalances[globalIdx1];
      newBalances[globalIdx1] = newBalances[globalIdx2];
      newBalances[globalIdx2] = temp;
      return {
        ...prev,
        balances: newBalances,
      };
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer flex items-center gap-1 text-xs font-extrabold border border-indigo-200/60 dark:border-indigo-800/60"
              title="Añadir permiso"
            >
              <Plus size={14} />
              <span>Añadir Permiso</span>
            </button>
          </div>
        </div>

        {/* Inline form to create a new balance */}
        {showAddForm && (
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 mb-4 animate-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Añadir Saldo</span>
              {/* Quick Preset Button for Permiso Nacimiento */}
              <button
                type="button"
                onClick={() => {
                  setSidebarAddType("Permiso Nacimiento");
                  setSidebarAddTotal("19");
                  setSidebarAddFreq("Semanal");
                }}
                className="text-[10px] font-extrabold px-2 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-700 transition cursor-pointer"
                title="Cargar ajuste predeterminado de 19 semanas (6 obligatorias + 13 flexibles)"
              >
                ✨ Preset 19 Semanas
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-extrabold mb-1 uppercase">Frecuencia</label>
                <select
                  value={sidebarAddFreq}
                  onChange={(e) => setSidebarAddFreq(e.target.value as "Diario" | "Semanal")}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="Diario">Diario</option>
                  <option value="Semanal">Semanal</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-extrabold mb-1 uppercase">Días/Semanas</label>
                <input
                  type="number"
                  placeholder="Ej. 15"
                  value={sidebarAddTotal}
                  onChange={(e) => setSidebarAddTotal(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-center"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-extrabold mb-1 uppercase">Nombre del Permiso</label>
              <input
                type="text"
                placeholder="Ej. Permiso Nacimiento"
                value={sidebarAddType}
                onChange={(e) => setSidebarAddType(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none"
                required
              />
            </div>
            <div className="flex gap-2 text-xs pt-1">
              <button
                type="button"
                className="flex-1 p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="flex-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
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

        <div className="space-y-3">
          {personBalances.map((bal, idx) => {
            const isEditing = editingBalanceKey === `${person}-${bal.type}`;

            // Calculate used days counting from globalData.events
            let usedDays = globalData.events.filter(
              (e) => e.person === bal.person && e.type === bal.type
            ).length;

            // For "Permiso Nacimiento", the 19 total weeks include the 6 mandatory weeks (42 days).
            // When birthDate is set, 42 mandatory days are auto-consumed, plus any additional scheduled events after the mandatory period.
            if (bal.type === "Permiso Nacimiento" && globalData.birthDate && mandatoryEndStr) {
              const extraEventsCount = globalData.events.filter((e) => {
                if (e.person !== bal.person || e.type !== bal.type) return false;
                return e.date > mandatoryEndStr;
              }).length;
              usedDays = 42 + extraEventsCount;
            }

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
            const isLow = (remaining <= 2 && bal.frecuencia !== "Semanal") || remaining <= 0;

            if (isEditing) {
              return (
                <div key={idx} className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Editar Permiso</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-extrabold mb-1 uppercase">Frecuencia</label>
                      <select
                        value={editFreqVal}
                        onChange={(e) => setEditFreqVal(e.target.value as "Diario" | "Semanal")}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="Diario">Diario</option>
                        <option value="Semanal">Semanal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-extrabold mb-1 uppercase">Cantidad</label>
                      <input
                        type="number"
                        value={editTotalVal}
                        onChange={(e) => setEditTotalVal(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-extrabold mb-1 uppercase">Nombre</label>
                    <input
                      type="text"
                      value={editTypeVal}
                      onChange={(e) => setEditTypeVal(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
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
              <div
                key={idx}
                className={`group relative bg-white dark:bg-slate-900 p-3.5 rounded-xl border transition-all duration-200 shadow-xs ${
                  isLow
                    ? "border-red-300 dark:border-red-900/80 bg-red-50/50 dark:bg-red-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600"
                }`}
              >
                {/* Header row: Title, Badge and Action Toolbar */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-black text-xs tracking-tight text-slate-900 dark:text-slate-100 truncate" title={bal.type}>
                      {bal.type}
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                      {bal.frecuencia}
                    </span>
                  </div>

                  {/* Sleek Action Toolbar: Reorder Up/Down, Edit, Delete */}
                  <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                    <button
                      onClick={() => moveBalance(person, "up", idx)}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition cursor-pointer"
                      title="Mover arriba"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => moveBalance(person, "down", idx)}
                      disabled={idx === personBalances.length - 1}
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition cursor-pointer"
                      title="Mover abajo"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <span className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button
                      onClick={() => startEditingBalance(person, bal.type)}
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Editar saldo"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteBalance(person, bal.type)}
                      className="p-1 rounded text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Eliminar saldo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>


                {/* Compact Metrics Row: Available vs Total/Used */}
                <div className="flex items-baseline justify-between px-2.5 py-1.5 mb-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Disponibles
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-black leading-none tabular-nums tracking-tight ${isLow ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                      {remaining}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Sleek Compact Progress bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden my-2 border border-slate-200/50 dark:border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isMom
                        ? "bg-gradient-to-r from-pink-500 to-rose-400"
                        : "bg-gradient-to-r from-sky-500 to-blue-400"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Compact Footer stats */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  <span>Usados: <strong className="text-slate-900 dark:text-slate-100 font-black">{used} {unit}</strong></span>
                  <span>Total: <strong className="text-slate-900 dark:text-slate-100 font-black">{total} {unit}</strong></span>
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
          transform: translateX(-100%);
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
          transform: translateX(100%);
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
          padding: 16px 12px;
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          background: #f8fafc;
        }
        .dark .sidebar-inner {
          background: #0b0f19;
        }

        .sidebar-handle {
          width: 44px;
          height: 84px;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 1.35rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          z-index: 2001;
          user-select: none;
          transition: width 0.2s, transform 0.2s;
        }

        #sidebar-mom .sidebar-handle {
          right: -44px;
          background: #be185d;
          border-radius: 0 16px 16px 0;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-left: none;
        }

        #sidebar-dad .sidebar-handle {
          left: -44px;
          background: #0284c7;
          border-radius: 16px 0 0 16px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-right: none;
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
          top: 3px;
          left: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          z-index: 5;
        }

        .icon-top-right {
          position: absolute;
          top: 2px;
          right: 3px;
          font-size: 0.75rem;
          line-height: 1;
          z-index: 4;
        }

        .icon-bottom-right {
          position: absolute;
          bottom: 2px;
          right: 3px;
          font-size: 0.75rem;
          line-height: 1;
          z-index: 4;
        }
        .dark .d-num {
          color: #94a3b8;
        }

        /* High contrast numbers on cells with any event */
        .day-cell-fixed.bg-mom .d-num,
        .day-cell-fixed.bg-dad .d-num,
        .day-cell-fixed.bg-both .d-num,
        .day-cell-fixed.bg-joint .d-num,
        .day-cell-fixed.bg-holiday .d-num,
        .dark .day-cell-fixed.bg-mom .d-num,
        .dark .day-cell-fixed.bg-dad .d-num,
        .dark .day-cell-fixed.bg-both .d-num,
        .dark .day-cell-fixed.bg-joint .d-num,
        .dark .day-cell-fixed.bg-holiday .d-num {
          color: #ffffff !important;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
        }

        /* Colores Celdas */
        /* MADRE: Rosa / Fucsia vivo */
        .bg-mom {
          background-color: var(--color-mom) !important;
          color: var(--text-mom) !important;
        }
        .dark .bg-mom {
          background-color: #be185d !important;
          color: #ffffff !important;
        }

        /* PADRE: Azul océano */
        .bg-dad {
          background-color: var(--color-dad) !important;
          color: var(--text-dad) !important;
        }
        .dark .bg-dad {
          background-color: #0284c7 !important;
          color: #ffffff !important;
        }

        /* AMBOS PADRES JUNTOS: Gradiente Rosa y Azul */
        .bg-both {
          background: linear-gradient(135deg, var(--color-mom) 50%, var(--color-dad) 50%) !important;
          color: #1e1b4b !important;
        }
        .dark .bg-both {
          background: linear-gradient(135deg, #be185d 50%, #0284c7 50%) !important;
          color: #ffffff !important;
        }

        /* OBLIGATORIO (CONJUNTO): Púrpura / Índigo */
        .bg-joint {
          background-color: var(--color-joint) !important;
          color: var(--text-joint) !important;
        }
        .dark .bg-joint {
          background-color: #7c3aed !important;
          color: #ffffff !important;
        }

        /* FESTIVOS: Ámbar / Dorado */
        .bg-holiday {
          background-color: #fef3c7 !important;
          color: #b45309 !important;
        }
        .dark .bg-holiday {
          background-color: #d97706 !important;
          color: #ffffff !important;
        }

        .dot-festivo {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 5px;
          height: 5px;
          background: #f59e0b;
          border-radius: 50%;
        }

        /* --- BOTÓN FLOTANTE SELECCIÓN --- */
        #floating-wrapper {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(150px);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 4px 6px 4px 8px;
          border-radius: 9999px;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.2), 0 8px 16px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(79, 70, 229, 0.2);
        }
        .dark #floating-wrapper {
          background: rgba(15, 23, 42, 0.88);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3), 0 10px 20px -8px rgba(0, 0, 0, 0.5);
        }

        #floating-wrapper.visible {
          transform: translateX(-50%) translateY(0);
        }

        .btn-float-action {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 3px 10px rgba(79, 70, 229, 0.35);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-float-action:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 5px 15px rgba(79, 70, 229, 0.45);
        }
        .btn-float-action:active {
          transform: translateY(0) scale(0.96);
        }

        .btn-float-close {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: none;
          background: rgba(241, 245, 249, 0.9);
          color: #64748b;
          font-weight: bold;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-float-close:hover {
          background: #fee2e2;
          color: #ef4444;
          transform: scale(1.1);
        }
        .dark .btn-float-close {
          background: rgba(30, 41, 59, 0.9);
          color: #94a3b8;
        }
        .dark .btn-float-close:hover {
          background: rgba(220, 38, 38, 0.2);
          color: #fca5a5;
          transform: scale(1.1);
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

        @media (prefers-color-scheme: dark) {
          .sidebar-fixed {
            background: #0f172a;
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
          }
          #sidebar-mom {
            border-right: 1px solid #1e293b;
          }
          #sidebar-dad {
            border-left: 1px solid #1e293b;
          }
          .sidebar-inner {
            background: #0b0f19;
          }
          .filter-pill-group {
            background: #1e293b;
            border-color: #334155;
          }
          .btn-filter {
            color: #94a3b8;
          }
          .btn-filter:hover {
            background: #334155;
          }
          .month-card {
            background: #1e293b;
            border-color: #334155;
          }
          .month-header {
            background: #0f172a;
            color: #f1f5f9;
            border-bottom-color: #334155;
          }
          .days-names-row {
            background: #1e293b;
            border-bottom-color: #334155;
          }
          .day-cell-fixed {
            border-right-color: #334155;
            border-bottom-color: #334155;
          }
          .day-cell-fixed.selected {
            background-color: #1e1b4b !important;
            box-shadow: inset 0 0 0 2px #6366f1;
          }
          .weekend {
            background-color: #111827;
          }
          .empty-cell {
            background: #1e293b;
          }
          .d-num {
            color: #94a3b8;
          }
          .day-cell-fixed.bg-mom .d-num,
          .day-cell-fixed.bg-dad .d-num,
          .day-cell-fixed.bg-both .d-num,
          .day-cell-fixed.bg-joint .d-num,
          .day-cell-fixed.bg-holiday .d-num {
            color: #ffffff !important;
            font-weight: 800;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
          }
          .bg-mom {
            background-color: #be185d !important;
            color: #ffffff !important;
          }
          .bg-dad {
            background-color: #0284c7 !important;
            color: #ffffff !important;
          }
          .bg-both {
            background: linear-gradient(135deg, #be185d 50%, #0284c7 50%) !important;
            color: #ffffff !important;
          }
          .bg-joint {
            background-color: #7c3aed !important;
            color: #ffffff !important;
          }
          .bg-holiday {
            background-color: #d97706 !important;
            color: #ffffff !important;
          }
          #floating-wrapper {
            background: rgba(15, 23, 42, 0.8);
            border-color: rgba(99, 102, 241, 0.25);
            box-shadow: 0 10px 35px -5px rgba(99, 102, 241, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .btn-float-close {
            background: rgba(30, 41, 59, 0.9);
            color: #94a3b8;
          }
          .btn-float-close:hover {
            background: rgba(220, 38, 38, 0.2);
            color: #fca5a5;
            transform: scale(1.1);
          }
          .sidebar-section-title {
            color: #f1f5f9;
            border-bottom-color: #1e293b;
          }
          .kpi-card-sidebar {
            background: #1e293b;
            border-color: #334155;
          }
          .kpi-card-label {
            color: #94a3b8;
          }
          .kpi-progress-wrapper {
            background: #0f172a;
          }
          .bg-danger-light {
            background: #7f1d1d !important;
            border-color: #991b1b !important;
          }
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
        {/* Sleek, Ultra-Modern Top Header */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-2.5 px-3.5 sm:px-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0 order-1">
            <span className="text-2xl">👶</span>
            <div className="flex flex-col">
              <h1 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none">
                Parental
              </h1>
              <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase leading-tight">
                Planner
              </span>
            </div>
          </div>

          {/* Baby Status Inline Pill - Responsive centered */}
          {globalData.birthDate && (
            <div className="order-3 md:order-2 w-full md:w-auto flex items-center justify-center h-8 bg-slate-100/80 dark:bg-slate-900/60 px-3.5 rounded-full gap-2 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-xs animate-pulse shrink-0">✨</span>
              <span id="display-birth-date" className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] truncate">
                {birthDateDisplay}
              </span>
              <span className="text-slate-300 dark:text-slate-600 font-light shrink-0">|</span>
              <span id="baby-weeks" className="font-black text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider shrink-0">
                {babyWeeksText}
              </span>
            </div>
          )}

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 order-2 md:order-3">
            <button
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              onClick={handleRefresh}
              title="Sincronizar"
            >
              <RefreshCw size={14} />
            </button>
            <button
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              onClick={() => setShowConfigModal(true)}
              title="Ajustes"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Sticky Filter & Festivos Capsule Bar on Scroll */}
        {globalData.birthDate && isLoaded && (
          <div className="sticky top-12 z-30 flex justify-center py-1 transition-all duration-200 pointer-events-none">
            <div className="pointer-events-auto flex items-center p-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-lg shadow-slate-900/5 gap-1.5 transition-all">
              {/* Integrated Segmented Filters */}
              <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200/80 dark:border-slate-700/80">
                <button
                  className={`h-7 px-3.5 text-[11px] font-black rounded-xl transition-all duration-200 cursor-pointer ${
                    currentFilter === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                  onClick={() => setCurrentFilter("all")}
                >
                  TODO
                </button>
                <button
                  className={`h-7 px-3.5 text-[11px] font-black rounded-xl transition-all duration-200 cursor-pointer ${
                    currentFilter === "Madre"
                      ? "bg-pink-500 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                  onClick={() => setCurrentFilter("Madre")}
                >
                  MAMÁ
                </button>
                <button
                  className={`h-7 px-3.5 text-[11px] font-black rounded-xl transition-all duration-200 cursor-pointer ${
                    currentFilter === "Padre"
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                  onClick={() => setCurrentFilter("Padre")}
                >
                  PAPÁ
                </button>
              </div>

              {/* Holiday Mode Toggle */}
              <button
                onClick={() => setHolidayMode(!holidayMode)}
                className={`h-7 px-3 text-[11px] font-black rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  holidayMode
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
                title="Activar modo festivos para marcar festivos directamente haciendo clic en el calendario"
              >
                <span>🚩</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold">{holidayMode ? "FESTIVOS: ON" : "FESTIVOS"}</span>
              </button>
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

                  // Find events on this date for Madre and Padre
                  const momEvt = globalData.events.find((e) => e.date === dateStr && e.person === "Madre");
                  const dadEvt = globalData.events.find((e) => e.date === dateStr && e.person === "Padre");
                  const festivo = globalData.festivos.find((f) => f.date === dateStr);

                  const checkTime = dateObj.getTime();
                  const [by, bm, bd] = globalData.birthDate!.split("-").map(Number);
                  const birthTime = new Date(by, bm - 1, bd).getTime();
                  let mandEndTime = 0;
                  if (mandatoryEndStr) {
                    const [mey, mem, med] = mandatoryEndStr.split("-").map(Number);
                    mandEndTime = new Date(mey, mem - 1, med).getTime();
                  }
                  const isMandatory = checkTime >= birthTime && checkTime <= mandEndTime;

                  let cssClass = "";
                  let icon = "";
                  let text = "";
                  let showDot = false;
                  let hoverInfo = `Día: ${dateStr}`;

                  // Visual Filtering rules
                  const showMom = momEvt && (currentFilter === "all" || currentFilter === "Madre");
                  const showDad = dadEvt && (currentFilter === "all" || currentFilter === "Padre");

                  let isBoth = false;
                  if (showMom && showDad) {
                    isBoth = true;
                    cssClass = "bg-both";
                    text = momEvt.type === dadEvt.type ? momEvt.type : `${momEvt.type} / ${dadEvt.type}`;
                    hoverInfo = `Madre: ${momEvt.type} | Padre: ${dadEvt.type}`;
                    if (festivo) {
                      showDot = true;
                      hoverInfo += ` | Festivo`;
                    }
                  } else if (showMom) {
                    cssClass = "bg-mom";
                    icon = "👩";
                    text = momEvt.type;
                    hoverInfo = `Madre: ${momEvt.type}`;
                    if (festivo) {
                      showDot = true;
                      hoverInfo += ` | Festivo`;
                    }
                  } else if (showDad) {
                    cssClass = "bg-dad";
                    icon = "👨";
                    text = dadEvt.type;
                    hoverInfo = `Padre: ${dadEvt.type}`;
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
                      {isBoth ? (
                        <>
                          <span className="icon-top-right">👩</span>
                          <span className="icon-bottom-right">👨</span>
                        </>
                      ) : (
                        null
                      )}
                      {showDot && <div className="dot-festivo" />}
                      <div className="cell-inner-wrapper">
                        {!isBoth && <div className="d-icon">{icon}</div>}
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

      {/* Floating Range Selection Bar - Compact & Modern Pill */}
      <div id="floating-wrapper" className={selectedDates.length > 0 ? "visible" : ""}>
        <button
          className="btn-float-close"
          onClick={clearAllSelections}
          title="Limpiar selección"
        >
          <X size={13} />
        </button>
        <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          className="btn-float-action"
          onClick={() => openModalForSelection()}
        >
          <span className="bg-white text-indigo-700 dark:bg-slate-950 dark:text-indigo-300 px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none flex items-center justify-center min-w-[16px] shadow-xs">
            {selectedDates.length}
          </span>
          <span className="text-[11px] font-black tracking-tight">Configurar Días</span>
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                  Asignar A
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  {[
                    { id: "Madre", label: "Madre", icon: "👩", activeColor: "bg-pink-500 text-white" },
                    { id: "Padre", label: "Padre", icon: "👨", activeColor: "bg-sky-500 text-white" },
                    { id: "Festivo", label: "Festivo", icon: "🚩", activeColor: "bg-amber-500 text-white" },
                  ].map((option) => {
                    const isSelected = selectedPerson === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          const val = option.id;
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
                        className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? `${option.activeColor} shadow-md scale-[1.02]`
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
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

      {/* --- GENERATE LEAVE WEEKS MODAL --- */}
      {generateModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[3500] p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm mx-auto shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>⚡</span> Generar Semanas ({generateModal.person})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Selecciona la modalidad de generación en el calendario:
                </p>
              </div>
              <button
                onClick={() => setGenerateModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Generate 6 Mandatory Weeks Auto */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    6 Semanas Obligatorias
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                    OBLIGATORIO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Genera los 42 días ininterrumpidos a partir de la fecha de nacimiento.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAutoGenerateWeeks(generateModal.person, 6)}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    ⚡ Auto Generar
                  </button>
                  <button
                    onClick={() => handleManualGenerateWeeks(generateModal.person, 6)}
                    className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ✍️ Manual
                  </button>
                </div>
              </div>

              {/* Option 2: Generate All 19 Weeks */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    19 Semanas Completas
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                    COMPLETO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Genera los 133 días ininterrumpidos desde el nacimiento (6 obligatorias + 13 flexibles del tirón).
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAutoGenerateWeeks(generateModal.person, 19)}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    ⚡ Auto Generar
                  </button>
                  <button
                    onClick={() => handleManualGenerateWeeks(generateModal.person, 19)}
                    className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ✍️ Manual
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition text-xs cursor-pointer"
                onClick={() => setGenerateModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRMATION & ALERT MODAL (Replaces browser default popups) --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[4000] p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm mx-auto shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {confirmModal.title}
              </h3>
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              {confirmModal.cancelText && (
                <button
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition text-xs cursor-pointer"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                className={`px-4 py-2 rounded-xl text-white font-bold transition text-xs shadow-xs cursor-pointer ${
                  confirmModal.isDanger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  } else {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  }
                }}
              >
                {confirmModal.confirmText || "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
