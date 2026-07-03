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
  X,
  LogOut,
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  Info
} from "lucide-react";

interface Bet {
  _id?: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

interface GroupMetadata {
  id: string;
  name: string;
  actualBirthDate?: string;
  actualBirthTime?: string;
}

export function BirthBetModule() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupMeta, setGroupMeta] = useState<GroupMetadata | null>(null);
  const [inputGroupId, setInputGroupId] = useState("");
  const [inputGroupName, setInputGroupName] = useState("");
  const [bets, setBets] = useState<Bet[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [isLoading, setIsLoading] = useState(false);
  const [myBetIds, setMyBetIds] = useState<string[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const savedGroup = localStorage.getItem("birth_bet_group");
    const savedBets = JSON.parse(localStorage.getItem("my_birth_bets") || "[]");
    setMyBetIds(savedBets);
    if (savedGroup) {
      setGroupId(savedGroup);
    }
  }, []);

  // Fetch data when groupId changes
  useEffect(() => {
    if (groupId) {
      fetchBets();
      fetchGroupMeta();
      localStorage.setItem("birth_bet_group", groupId);

      // Polling for updates every 10 seconds
      const interval = setInterval(fetchBets, 10000);
      return () => clearInterval(interval);
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

  const fetchGroupMeta = async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/birth-bet/group?id=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupMeta(data);
      }
    } catch (error) {
      console.error("Error fetching group meta:", error);
    }
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputGroupId.trim()) {
      setGroupId(inputGroupId.trim().toUpperCase());
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGroupName.trim()) return;

    const newId = crypto.randomUUID().split("-")[0].toUpperCase();

    try {
      const res = await fetch("/api/birth-bet/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, name: inputGroupName.trim() }),
      });

      if (res.ok) {
        setGroupId(newId);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
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
        const data = await res.json();
        const updatedMyBets = [...myBetIds, data.id];
        setMyBetIds(updatedMyBets);
        localStorage.setItem("my_birth_bets", JSON.stringify(updatedMyBets));

        setNewName("");
        setIsModalOpen(false);
        fetchBets();
      }
    } catch (error) {
      console.error("Error adding bet:", error);
    }
  };

  const handleDeleteBet = async (betId: string) => {
    if (!confirm("¿Seguro que quieres borrar tu apuesta?")) return;
    try {
      const res = await fetch(`/api/birth-bet?id=${betId}`, { method: "DELETE" });
      if (res.ok) {
        const updatedMyBets = myBetIds.filter(id => id !== betId);
        setMyBetIds(updatedMyBets);
        localStorage.setItem("my_birth_bets", JSON.stringify(updatedMyBets));
        fetchBets();
      }
    } catch (error) {
      console.error("Error deleting bet:", error);
    }
  };

  // Calendar logic
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust to Monday start
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const getDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const betsByDate = useMemo(() => {
    const map: Record<string, Bet[]> = {};
    bets.forEach((bet) => {
      if (!map[bet.date]) map[bet.date] = [];
      map[bet.date].push(bet);
    });
    return map;
  }, [bets]);

  // Statistics
  const stats = useMemo(() => {
    if (bets.length === 0) return null;

    const dateCounts: Record<string, number> = {};
    bets.forEach(b => dateCounts[b.date] = (dateCounts[b.date] || 0) + 1);

    const popularDate = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0];

    // Avg time
    let totalMinutes = 0;
    bets.forEach(b => {
      const [h, m] = b.time.split(":").map(Number);
      totalMinutes += h * 60 + m;
    });
    const avgMinutes = totalMinutes / bets.length;
    const avgH = Math.floor(avgMinutes / 60);
    const avgM = Math.round(avgMinutes % 60);

    return {
      total: bets.length,
      popularDate: popularDate[0],
      popularCount: popularDate[1],
      avgTime: `${String(avgH).padStart(2, "0")}:${String(avgM).padStart(2, "0")}`
    };
  }, [bets]);

  if (!groupId) {
    return (
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Left Side - Info */}
        <div className="flex flex-col justify-center space-y-6 p-4">
          <div className="inline-flex p-4 bg-primary/10 text-primary rounded-3xl w-fit">
            <Sparkles size={40} className="animate-pulse" />
          </div>
          <h1 className="text-5xl font-black text-foreground leading-tight tracking-tight">
            La Porra de <br/><span className="text-primary">Nacimiento</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Adivina el día y la hora. Compite con tus amigos y familia en el evento más emocionante del año.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
              <CalendarIcon size={18} className="text-primary" />
              <span className="text-sm font-bold">Calendario Real</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
              <TrendingUp size={18} className="text-primary" />
              <span className="text-sm font-bold">Estadísticas</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
              <Award size={18} className="text-primary" />
              <span className="text-sm font-bold">Ranking</span>
            </div>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="space-y-6">
          <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl p-8 space-y-8 backdrop-blur-xl bg-card/80">
            {/* Create Group */}
            <div className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Plus size={22} className="text-primary" />
                Crear Nuevo Grupo
              </h3>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: Bebé de Ana & Carlos)"
                  className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  value={inputGroupName}
                  onChange={(e) => setInputGroupName(e.target.value)}
                />
                <button className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                  Crear y Empezar
                </button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-bold tracking-widest">O únete a uno</span>
              </div>
            </div>

            {/* Join Group */}
            <div className="space-y-4">
              <form onSubmit={handleJoinGroup} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código de Grupo"
                  className="flex-1 px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase font-mono font-bold"
                  value={inputGroupId}
                  onChange={(e) => setInputGroupId(e.target.value)}
                />
                <button className="px-8 py-4 bg-muted text-foreground border border-border font-black rounded-2xl hover:bg-muted/80 transition-all">
                  Entrar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-card p-8 rounded-[3rem] border border-border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Decorative background element */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

        <div className="relative flex items-center gap-6">
          <div className="p-5 bg-primary text-primary-foreground rounded-3xl shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Trophy size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              {groupMeta?.name || "Cargando..."}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
                <Users size={12} />
                <span>{bets.length} Apuestas</span>
              </div>
              <div className="text-xs font-mono font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                CODE: {groupId}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setIsStatsOpen(true)}
            className="p-4 bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all group"
            title="Estadísticas"
          >
            <TrendingUp size={24} className="group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
              className="p-2 hover:bg-card rounded-xl transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-black text-sm min-w-[140px] text-center capitalize">
              {viewDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
              className="p-2 hover:bg-card rounded-xl transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("birth_bet_group");
              setGroupId(null);
            }}
            className="flex items-center gap-2 pl-4 pr-6 py-4 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all"
          >
            <LogOut size={20} />
            <span className="hidden md:inline">Cerrar Grupo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-card rounded-[3rem] border border-border shadow-xl overflow-hidden backdrop-blur-xl">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {["Lunes", "Martes", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[160px]">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-border/30 bg-muted/10" />;

              const dateStr = getDateStr(date);
              const dayBets = betsByDate[dateStr] || [];
              const isToday = getDateStr(new Date()) === dateStr;
              const isWinner = groupMeta?.actualBirthDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setIsModalOpen(true);
                  }}
                  className={`relative p-4 border-b border-r border-border/30 text-left transition-all hover:bg-primary/[0.03] group ${isToday ? "bg-primary/[0.02]" : ""} ${isWinner ? "bg-yellow-500/10" : ""}`}
                >
                  <span className={`text-lg font-black ${isToday ? "text-primary" : "text-muted-foreground/50"} ${isWinner ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                    {date.getDate()}
                  </span>

                  {isWinner && (
                    <div className="absolute top-4 right-4 text-yellow-500">
                      <Crown size={16} className="fill-current" />
                    </div>
                  )}

                  <div className="mt-2 space-y-1.5">
                    {dayBets.slice(0, 3).map((bet, i) => {
                      const isMyBet = myBetIds.includes(bet._id || "");
                      return (
                        <div
                          key={i}
                          onClick={(e) => {
                            if (isMyBet) {
                              e.stopPropagation();
                              handleDeleteBet(bet._id!);
                            }
                          }}
                          className={`text-[10px] px-2 py-1 rounded-lg truncate font-bold flex items-center gap-1 animate-in slide-in-from-left-2 duration-300 delay-${i * 100}
                            ${isMyBet
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer hover:bg-primary/90"
                              : "bg-muted text-foreground border border-border/50"}`}
                        >
                          {isMyBet && <X size={8} className="shrink-0" />}
                          <span className="opacity-70">{bet.time}</span>
                          <span className="flex-1 truncate">{bet.name}</span>
                        </div>
                      );
                    })}
                    {dayBets.length > 3 && (
                      <div className="text-[9px] font-black text-primary pl-1 flex items-center gap-1">
                        <Plus size={10} /> {dayBets.length - 3} más
                      </div>
                    )}
                  </div>

                  {!isWinner && (
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <div className="p-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/30">
                        <Plus size={16} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Feed */}
        <div className="space-y-6">
          {/* My Info Card */}
          <div className="bg-primary text-primary-foreground rounded-[2.5rem] p-6 shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform" />
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              Tu Participación
            </h3>
            <p className="text-sm opacity-80 font-medium">Has realizado {myBetIds.length} apuestas en este grupo.</p>
            <div className="mt-4 pt-4 border-t border-primary-foreground/20">
               <button
                onClick={() => {
                  const todayStr = getDateStr(new Date());
                  setSelectedDate(todayStr);
                  setIsModalOpen(true);
                }}
                className="w-full py-3 bg-white text-primary font-black rounded-2xl hover:bg-white/90 transition-all shadow-lg"
               >
                 Apostar Ahora
               </button>
            </div>
          </div>

          <div className="bg-card rounded-[2.5rem] border border-border shadow-xl p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                <h3 className="font-black text-lg">Últimas Apuestas</h3>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {bets.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto text-muted-foreground">
                    <Info size={32} />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">¡Nadie ha apostado todavía!</p>
                </div>
              ) : (
                [...bets].reverse().map((bet, i) => {
                  const isMyBet = myBetIds.includes(bet._id || "");
                  return (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all animate-in slide-in-from-right-4 duration-500 delay-${i * 50}
                      ${isMyBet ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-transparent hover:border-border"}`}>
                      <div className={`p-2.5 rounded-xl shadow-sm ${isMyBet ? "bg-primary text-primary-foreground" : "bg-background text-primary"}`}>
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate">{bet.name}</p>
                        <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5">
                          {new Date(bet.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          <span className="opacity-30">•</span>
                          {bet.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Standard Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-card border border-border rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] p-10 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-3 text-muted-foreground hover:text-foreground rounded-2xl hover:bg-muted transition-all"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl w-fit mb-4">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-3xl font-black tracking-tight">
                Nueva Apuesta
              </h3>
              <p className="text-muted-foreground font-medium mt-1">
                Para el {selectedDate && new Date(selectedDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
              </p>
            </div>

            <form onSubmit={handleAddBet} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground ml-1">Tu Nombre o Alias</label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="Ej: Abuela Carmen"
                  className="w-full px-6 py-4 bg-muted border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-foreground ml-1">¿A qué hora nacerá?</label>
                <input
                  required
                  type="time"
                  className="w-full px-6 py-4 bg-muted border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-center text-2xl"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <button className="w-full py-5 bg-primary text-primary-foreground font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30">
                Confirmar Apuesta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsOpen && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setIsStatsOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsStatsOpen(false)}
              className="absolute top-6 right-6 p-3 text-muted-foreground hover:text-foreground rounded-2xl hover:bg-muted transition-all"
            >
              <X size={24} />
            </button>

            <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
              <TrendingUp size={32} className="text-primary" />
              Estadísticas de la Porra
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-muted/50 rounded-[2rem] border border-border/50 flex flex-col items-center text-center">
                <CalendarIcon size={32} className="text-primary mb-4" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Fecha más votada</p>
                <p className="text-2xl font-black capitalize">
                  {new Date(stats.popularDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                </p>
                <p className="text-xs font-black text-primary mt-2 bg-primary/10 px-3 py-1 rounded-full">
                  {stats.popularCount} apuestas
                </p>
              </div>

              <div className="p-8 bg-muted/50 rounded-[2rem] border border-border/50 flex flex-col items-center text-center">
                <Clock size={32} className="text-primary mb-4" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Hora Promedio</p>
                <p className="text-4xl font-black text-foreground">
                  {stats.avgTime}
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-2">Basado en {stats.total} apuestas</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-black text-lg">¿Cómo se elige el ganador?</h4>
                  <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                    El ganador será quien más se aproxime a la fecha y hora real del nacimiento.
                    Se prioriza primero el día y luego la cercanía horaria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
