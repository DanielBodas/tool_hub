"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  Star,
  Heart,
  Users,
  Calendar as CalendarIcon,
  ChevronRight,
  Info,
} from "lucide-react";

interface Bet {
  _id?: string;
  date: string;
  name: string;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
}

export function BirthBetModule() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [myBets, setMyBets] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("my_birth_bets");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  const viewDate = useMemo(() => new Date(2026, 6, 1), []); // July 2026
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/birth-bet/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }, [selectedGroupId]);

  const fetchBets = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(`/api/birth-bet?groupId=${selectedGroupId}`);
      if (res.ok) {
        const data = await res.json();
        setBets(data);
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
        fetchGroups();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      const timeout = setTimeout(() => {
        fetchBets();
      }, 0);
      const interval = setInterval(fetchBets, 10000);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [fetchBets, selectedGroupId]);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [viewDate]);

  const firstDayWeekday = (daysInMonth[0].getDay() + 6) % 7;
  const paddingDays = Array.from({ length: firstDayWeekday });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleAddBet = async () => {
    if (!selectedDay || !userName.trim() || !selectedGroupId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/birth-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDate(selectedDay),
          name: userName,
          groupId: selectedGroupId,
        }),
      });

      if (res.ok) {
        const { id } = await res.json();
        if (id) {
          const newMyBets = [...myBets, id];
          setMyBets(newMyBets);
          localStorage.setItem("my_birth_bets", JSON.stringify(newMyBets));
        }
        setUserName("");
        fetchBets();
      }
    } catch (error) {
      console.error("Error adding bet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBet = async (id: string) => {
    try {
      const res = await fetch(`/api/birth-bet?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchBets();
      }
    } catch (error) {
      console.error("Error deleting bet:", error);
    }
  };

  if (groups.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <Users size={64} className="text-pink-300" />
        <h2 className="text-2xl font-bold">No tienes acceso a ningún grupo</h2>
        <p className="text-muted-foreground">
          Contacta con los padres para obtener un PIN de acceso válido.
        </p>
      </div>
    );
  }

  const selectedGroupName = groups.find((g) => g.id === selectedGroupId)?.name;

  return (
    <div className="space-y-8 relative overflow-hidden pb-12">
      {/* Decorative Icons */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-10 text-pink-300 pointer-events-none">
        <Heart size={200} fill="currentColor" />
      </div>
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 opacity-10 text-pink-300 pointer-events-none">
        <Star size={240} fill="currentColor" />
      </div>

      <div className="text-center space-y-4 relative z-10">
        <div className="flex justify-center gap-4 mb-2">
          <Heart className="text-pink-400 fill-pink-400 animate-bounce" size={24} />
          <Star className="text-pink-300 fill-pink-300 animate-pulse" size={24} />
          <Heart
            className="text-pink-400 fill-pink-400 animate-bounce"
            size={24}
            style={{ animationDelay: "0.2s" }}
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-pink-600 uppercase tracking-tighter drop-shadow-sm">
          ¿Cuándo nacerá IRENE?
        </h1>
        <div className="inline-block bg-pink-100 text-pink-700 px-6 py-2 rounded-full font-bold text-sm">
          FECHA PROBABLE DE PARTO: 15 DE JULIO DE 2026
        </div>
      </div>

      {/* Group Selector */}
      {groups.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 relative z-10">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                setSelectedGroupId(group.id);
                setIsLoading(true);
              }}
              className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-sm ${
                selectedGroupId === group.id
                  ? "bg-pink-600 text-white scale-105 shadow-pink-200"
                  : "bg-white dark:bg-gray-800 text-pink-600 hover:bg-pink-50 border border-pink-100 dark:border-pink-900"
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 text-center">
        <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] mb-2">
          Calendario Actual
        </p>
        <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-2">
          <Users size={20} className="text-pink-500" />
          {selectedGroupName}
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-pink-100 dark:border-pink-900 shadow-2xl overflow-hidden relative z-10 mx-auto max-w-5xl">
        <div className="bg-pink-500 p-4 grid grid-cols-7 text-white font-black uppercase text-[10px] md:text-xs tracking-widest shadow-md">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-pink-100 dark:bg-pink-900/30">
          {paddingDays.map((_, i) => (
            <div
              key={`pad-${i}`}
              className="bg-gray-50/50 dark:bg-gray-950/50 aspect-square"
            />
          ))}
          {daysInMonth.map((day) => {
            const dateStr = formatDate(day);
            const dayBets = bets.filter((b) => b.date === dateStr);
            const isProbable = dateStr === "2026-07-15";
            const hasBets = dayBets.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(day)}
                className={`bg-white dark:bg-gray-900 aspect-square p-1 md:p-3 flex flex-col items-center justify-center gap-1 group relative transition-all hover:z-20 hover:scale-[1.02] hover:shadow-xl ${
                  isProbable ? "bg-pink-50/30 dark:bg-pink-900/5 ring-1 ring-inset ring-pink-100 dark:ring-pink-900/50" : ""
                }`}
              >
                <span
                  className={`text-xs md:text-sm font-black transition-colors ${
                    hasBets ? "text-pink-600" : "text-muted-foreground/60"
                  }`}
                >
                  {day.getDate()}
                </span>

                {hasBets && (
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 flex items-center justify-center text-[10px] md:text-xs font-black border border-pink-200 dark:border-pink-800 shadow-sm group-hover:bg-pink-600 group-hover:text-white transition-colors">
                      {dayBets.length}
                    </div>
                  </div>
                )}

                {isProbable && !hasBets && (
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                )}

                <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/5 transition-colors pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 relative z-10">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-pink-100 border border-pink-200" />
           <span>Con apuestas</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full border-2 border-pink-400 border-dashed" />
           <span>Fecha Probable</span>
        </div>
      </div>

      {/* Day Detail View */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 text-foreground w-full max-w-lg rounded-[3rem] shadow-2xl border border-pink-100 dark:border-pink-900 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-pink-500 p-8 text-white relative">
              <button
                onClick={() => setSelectedDay(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <CalendarIcon size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">
                    {selectedDay.getDate()} DE{" "}
                    {selectedDay.toLocaleDateString("es-ES", { month: "long" })}
                  </h3>
                  <p className="text-pink-100 font-bold uppercase text-[10px] tracking-widest">
                    Grupo: {selectedGroupName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {/* Bets List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} className="text-pink-500" />
                  Apuestas para este día
                </h4>

                {bets.filter((b) => b.date === formatDate(selectedDay)).length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-medium text-muted-foreground">
                      Aún no hay apuestas para este día. ¡Sé el primero!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bets
                      .filter((b) => b.date === formatDate(selectedDay))
                      .map((bet) => (
                        <div
                          key={bet._id}
                          className="flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-2xl group/bet shadow-sm"
                        >
                          <span className="font-black text-pink-700 dark:text-pink-300 text-sm">
                            {bet.name}
                          </span>
                          {bet._id && myBets.includes(bet._id) && (
                            <button
                              onClick={() => handleDeleteBet(bet._id!)}
                              className="p-1.5 hover:bg-pink-100 dark:hover:bg-pink-800 text-pink-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Add Bet Form */}
              <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Añadir mi apuesta
                </h4>
                <div className="relative">
                  <input
                    autoFocus
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-pink-500 focus:bg-white dark:focus:bg-gray-900 rounded-[1.5rem] px-6 py-4 outline-none transition-all font-black text-lg shadow-inner"
                    placeholder="Escribe tu nombre..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBet()}
                  />
                  <button
                    disabled={isSubmitting || !userName.trim()}
                    onClick={handleAddBet}
                    className="absolute right-2 top-2 bottom-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-6 rounded-[1.2rem] transition-all shadow-lg shadow-pink-600/20 active:scale-95 flex items-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="font-black text-xs uppercase tracking-widest hidden sm:inline">
                          Apostar
                        </span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
