"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Trophy,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  X
} from "lucide-react";

interface Bet {
  _id?: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export function BirthBetModule() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [inputGroupId, setInputGroupId] = useState("");
  const [bets, setBets] = useState<Bet[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize group from localStorage
  useEffect(() => {
    const savedGroup = localStorage.getItem("birth_bet_group");
    if (savedGroup) {
      setGroupId(savedGroup);
    }
  }, []);

  // Fetch bets when groupId changes
  useEffect(() => {
    if (groupId) {
      fetchBets();
      localStorage.setItem("birth_bet_group", groupId);
    }
  }, [groupId]);

  const fetchBets = async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/birth-bet?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setBets(data);
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputGroupId.trim()) {
      setGroupId(inputGroupId.trim());
    }
  };

  const handleCreateGroup = () => {
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGroupId(newId);
  };

  const handleAddBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !selectedDate || !newName) return;

    try {
      const res = await fetch("/api/birth-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          name: newName,
          date: selectedDate,
          time: newTime,
        }),
      });

      if (res.ok) {
        setNewName("");
        setIsModalOpen(false);
        fetchBets();
      }
    } catch (error) {
      console.error("Error adding bet:", error);
    }
  };

  // Calendar logic
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const betsByDate = useMemo(() => {
    const map: Record<string, Bet[]> = {};
    bets.forEach((bet) => {
      if (!map[bet.date]) map[bet.date] = [];
      map[bet.date].push(bet);
    });
    return map;
  }, [bets]);

  const getDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  if (!groupId) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-card rounded-3xl border border-border shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-primary/10 text-primary rounded-2xl mb-2">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Porra de Nacimiento</h2>
          <p className="text-muted-foreground">Únete a un grupo o crea uno nuevo para empezar a apostar.</p>
        </div>

        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-foreground ml-1">Código del Grupo</label>
            <input
              type="text"
              placeholder="Ej: AB1234"
              className="w-full mt-1 px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
              value={inputGroupId}
              onChange={(e) => setInputGroupId(e.target.value)}
            />
          </div>
          <button className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity">
            Entrar al Grupo
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">O también</span>
          </div>
        </div>

        <button
          onClick={handleCreateGroup}
          className="w-full py-3 bg-muted text-foreground font-bold rounded-xl border border-border hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Crear Nuevo Grupo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Porra de Nacimiento</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} />
              <span>Grupo: <span className="font-mono font-bold text-primary">{groupId}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.removeItem("birth_bet_group");
              setGroupId(null);
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Salir
          </button>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
              className="p-1.5 hover:bg-card rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 font-bold text-sm min-w-[120px] text-center">
              {viewDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
              className="p-1.5 hover:bg-card rounded-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
              <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px]">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-border/50 bg-muted/20" />;

              const dateStr = getDateStr(date);
              const dayBets = betsByDate[dateStr] || [];
              const isToday = getDateStr(new Date()) === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setIsModalOpen(true);
                  }}
                  className={`relative p-2 border-b border-r border-border/50 text-left transition-all hover:bg-primary/5 group ${isToday ? "bg-primary/5" : ""}`}
                >
                  <span className={`text-sm font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {date.getDate()}
                  </span>

                  {dayBets.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayBets.slice(0, 2).map((bet, i) => (
                        <div key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md truncate font-medium">
                          {bet.name}
                        </div>
                      ))}
                      {dayBets.length > 2 && (
                        <div className="text-[9px] text-muted-foreground pl-1">
                          + {dayBets.length - 2} más
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-primary text-primary-foreground rounded-full">
                      <Plus size={12} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Recent Bets */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock size={18} className="text-primary" />
            <h3 className="font-bold">Apuestas Recientes</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {bets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay apuestas aún.</p>
                <p className="text-xs">¡Sé el primero en participar!</p>
              </div>
            ) : (
              [...bets].reverse().map((bet, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-border transition-colors group">
                  <div className="p-2 bg-background rounded-xl text-primary">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{bet.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(bet.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} • {bet.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary" />
              Apostar para el {selectedDate && new Date(selectedDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
            </h3>

            <form onSubmit={handleAddBet} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground ml-1">Tu Nombre</label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="¿Quién eres?"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground ml-1">Hora Estimada</label>
                <input
                  required
                  type="time"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <button className="w-full mt-4 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                Confirmar Apuesta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
