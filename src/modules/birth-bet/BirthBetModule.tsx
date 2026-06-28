"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Star,
  Heart,
} from "lucide-react";

interface Bet {
  _id?: string;
  date: string;
  name: string;
}

export function BirthBetModule() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [myBets, setMyBets] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
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

  const fetchBets = useCallback(async () => {
    try {
      const res = await fetch("/api/birth-bet");
      if (res.ok) {
        const data = await res.json();
        setBets(data);
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBets();
    }, 0);


    const interval = setInterval(fetchBets, 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchBets]);

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
    if (!selectedDay || !userName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/birth-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDate(selectedDay),
          name: userName,
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
        setSelectedDay(null);
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

  return (
    <div className="space-y-8 relative overflow-hidden">
      {/* Decorative Icons */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-10 text-pink-300">
        <Heart size={200} fill="currentColor" />
      </div>
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 opacity-10 text-pink-300">
        <Star size={240} fill="currentColor" />
      </div>

      <div className="text-center space-y-4 relative z-10">
        <div className="flex justify-center gap-4 mb-2">
           <Heart className="text-pink-400 fill-pink-400 animate-bounce" size={24} />
           <Star className="text-pink-300 fill-pink-300 animate-pulse" size={24} />
           <Heart className="text-pink-400 fill-pink-400 animate-bounce" size={24} style={{ animationDelay: '0.2s' }} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-pink-600 uppercase tracking-tighter drop-shadow-sm">
          ¿Cuándo nacerá IRENE?
        </h1>
        <div className="inline-block bg-pink-100 text-pink-700 px-6 py-2 rounded-full font-bold text-sm">
          FECHA PROBABLE DE PARTO: 15 DE JULIO DE 2026
        </div>
        <p className="text-muted-foreground font-medium">
          Escribe tu nombre en el día que crees que nacerá IRENE.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-pink-100 dark:border-pink-900 shadow-xl overflow-hidden">
        <div className="bg-pink-500 p-4 grid grid-cols-7 text-white font-black uppercase text-[10px] md:text-xs tracking-widest">
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-pink-100 dark:bg-pink-900/30">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="bg-white dark:bg-gray-900 aspect-square md:aspect-video" />
          ))}
          {daysInMonth.map((day) => {
            const dateStr = formatDate(day);
            const dayBets = bets.filter((b) => b.date === dateStr);
            const isProbable = dateStr === "2026-07-15";

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(day)}
                className={`bg-white dark:bg-gray-900 aspect-square md:aspect-video p-2 flex flex-col items-start gap-1 group relative transition-colors hover:bg-pink-50/50 dark:hover:bg-pink-900/10 ${isProbable ? 'bg-pink-50/30 dark:bg-pink-900/5' : ''}`}
              >
                <div className="flex justify-between w-full items-start">
                  <span className="text-xs font-bold text-muted-foreground">
                    {day.getDate()} {day.toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}
                  </span>
                  {isProbable && (
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                  )}
                </div>
                <div className="flex flex-wrap gap-1 w-full overflow-y-auto no-scrollbar max-h-full pb-6">
                  {dayBets.map((bet) => (
                    <div
                      key={bet._id}
                      className="text-[10px] md:text-sm font-black px-2 py-1 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 flex items-center gap-2 group/bet border border-pink-200 dark:border-pink-800"
                    >
                      {bet.name}
                      {bet._id && myBets.includes(bet._id) && (
                        <button
                          onClick={(e) => {
                              e.stopPropagation();
                              if(bet._id) handleDeleteBet(bet._id);
                          }}
                          className="opacity-0 group-hover/bet:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Plus size={16} className="text-pink-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground p-8 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                Apostar por el {selectedDay.getDate()} de {selectedDay.toLocaleDateString("es-ES", { month: "long" })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Tu Nombre
              </label>
              <input
                autoFocus
                className="w-full bg-muted border-2 border-transparent focus:border-pink-500 rounded-2xl px-4 py-3 outline-none transition font-bold"
                placeholder="Escribe tu nombre..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddBet()}
              />
            </div>
            <button
              disabled={isSubmitting || !userName.trim()}
              onClick={handleAddBet}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-pink-600/20 active:scale-95"
            >
              {isSubmitting ? "GUARDANDO..." : "CONFIRMAR APUESTA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
