"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  Camera,
  Trash2,
  Edit2,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Bell,
  BellOff,
  Store,
  Tag,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Upload,
  Info,
  Clock,
  Euro,
  FileText,
} from "lucide-react";
import {
  TicketItem,
  TicketCategory,
  TicketStatusFilter,
} from "./types";
import { INITIAL_TICKETS } from "./initialData";

const CATEGORIES: TicketCategory[] = [
  "Electrónica",
  "Electrodomésticos",
  "Informática",
  "Hogar y Cocina",
  "Moda y Calzado",
  "Deportes",
  "Bebé y Niños",
  "Bricolaje y Jardín",
  "Otros",
];

export function TicketGuaranteeManagerModule() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<TicketStatusFilter>("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketItem | null>(null);
  const [viewingTicket, setViewingTicket] = useState<TicketItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<TicketItem>>({
    productName: "",
    store: "",
    category: "Electrónica",
    price: undefined,
    purchaseDate: new Date().toISOString().split("T")[0],
    hasReturnPolicy: true,
    returnExpirationDate: "",
    hasGuarantee: true,
    guaranteeExpirationDate: "",
    reminderEnabled: true,
    reminderWeeksBefore: 2,
    ticketImageUrl: "",
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Tickets from API or localStorage
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/ticket-guarantee-manager");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.tickets && Array.isArray(data.tickets)) {
            setTickets(data.tickets);
            localStorage.setItem("ticket_manager_data", JSON.stringify(data.tickets));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch tickets from API, using fallback", err);
      }

      // Fallback
      if (isMounted) {
        const local = localStorage.getItem("ticket_manager_data");
        if (local) {
          try {
            setTickets(JSON.parse(local));
          } catch {
            setTickets(INITIAL_TICKETS);
          }
        } else {
          setTickets(INITIAL_TICKETS);
        }
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to API & LocalStorage
  const saveTicketsState = async (updatedTickets: TicketItem[], ticketToSave?: TicketItem) => {
    setTickets(updatedTickets);
    localStorage.setItem("ticket_manager_data", JSON.stringify(updatedTickets));

    try {
      if (ticketToSave) {
        await fetch("/api/ticket-guarantee-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "save_ticket", ticket: ticketToSave }),
        });
      } else {
        await fetch("/api/ticket-guarantee-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "sync_all", payload: updatedTickets }),
        });
      }
    } catch (e) {
      console.warn("Failed to save to server, saved locally", e);
    }
  };

  // Auto calculate default expiration dates when purchase date or toggles change
  const handlePurchaseDateChange = (dateStr: string) => {
    const baseDate = new Date(dateStr);
    if (isNaN(baseDate.getTime())) {
      setFormData((prev) => ({ ...prev, purchaseDate: dateStr }));
      return;
    }

    // Default +30 days for return
    const returnDate = new Date(baseDate);
    returnDate.setDate(returnDate.getDate() + 30);

    // Default +3 years for guarantee (legal standard in Spain/EU)
    const guaranteeDate = new Date(baseDate);
    guaranteeDate.setFullYear(guaranteeDate.getFullYear() + 3);

    setFormData((prev) => ({
      ...prev,
      purchaseDate: dateStr,
      returnExpirationDate: prev.returnExpirationDate || returnDate.toISOString().split("T")[0],
      guaranteeExpirationDate: prev.guaranteeExpirationDate || guaranteeDate.toISOString().split("T")[0],
    }));
  };

  // File Upload & Canvas Compression to Data URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setFormData((prev) => ({ ...prev, ticketImageUrl: compressedDataUrl }));
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Add / Edit Modal
  const openModalForNew = () => {
    const today = new Date().toISOString().split("T")[0];
    const defaultReturn = new Date();
    defaultReturn.setDate(defaultReturn.getDate() + 30);
    const defaultGuarantee = new Date();
    defaultGuarantee.setFullYear(defaultGuarantee.getFullYear() + 3);

    setEditingTicket(null);
    setFormData({
      productName: "",
      store: "",
      category: "Electrónica",
      price: undefined,
      purchaseDate: today,
      hasReturnPolicy: true,
      returnExpirationDate: defaultReturn.toISOString().split("T")[0],
      hasGuarantee: true,
      guaranteeExpirationDate: defaultGuarantee.toISOString().split("T")[0],
      reminderEnabled: true,
      reminderWeeksBefore: 2,
      ticketImageUrl: "",
      notes: "",
    });
    setShowAddModal(true);
  };

  const openModalForEdit = (ticket: TicketItem) => {
    setEditingTicket(ticket);
    setFormData({ ...ticket });
    setShowAddModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.purchaseDate) return;

    const newTicket: TicketItem = {
      id: editingTicket ? editingTicket.id : crypto.randomUUID(),
      productName: formData.productName.trim(),
      store: formData.store?.trim() || "Tienda general",
      category: (formData.category as TicketCategory) || "Otros",
      price: formData.price ? Number(formData.price) : undefined,
      purchaseDate: formData.purchaseDate,
      hasReturnPolicy: !!formData.hasReturnPolicy,
      returnExpirationDate: formData.hasReturnPolicy ? formData.returnExpirationDate : undefined,
      hasGuarantee: !!formData.hasGuarantee,
      guaranteeExpirationDate: formData.hasGuarantee ? formData.guaranteeExpirationDate : undefined,
      reminderEnabled: !!formData.reminderEnabled,
      reminderWeeksBefore: Number(formData.reminderWeeksBefore || 2),
      ticketImageUrl: formData.ticketImageUrl || "",
      notes: formData.notes?.trim() || "",
      createdAt: editingTicket ? editingTicket.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedList: TicketItem[];
    if (editingTicket) {
      updatedList = tickets.map((t) => (t.id === editingTicket.id ? newTicket : t));
    } else {
      updatedList = [newTicket, ...tickets];
    }

    saveTicketsState(updatedList, newTicket);
    setShowAddModal(false);
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este ticket?")) return;
    const updated = tickets.filter((t) => t.id !== id);
    setTickets(updated);
    localStorage.setItem("ticket_manager_data", JSON.stringify(updated));

    try {
      await fetch(`/api/ticket-guarantee-manager?id=${id}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Failed to delete on server", e);
    }
  };

  // Helper date calculations
  const getDaysDiff = (targetDateStr?: string) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Status helper for items
  const getItemStatus = (ticket: TicketItem) => {
    const returnDays = ticket.hasReturnPolicy ? getDaysDiff(ticket.returnExpirationDate) : null;
    const guaranteeDays = ticket.hasGuarantee ? getDaysDiff(ticket.guaranteeExpirationDate) : null;

    const reminderDays = ticket.reminderWeeksBefore * 7;

    const isReturnActive = returnDays !== null && returnDays >= 0;
    const isGuaranteeActive = guaranteeDays !== null && guaranteeDays >= 0;

    const isReturnExpiringSoon = isReturnActive && returnDays <= reminderDays;
    const isGuaranteeExpiringSoon = isGuaranteeActive && guaranteeDays <= reminderDays;

    const isExpiringSoon = isReturnExpiringSoon || isGuaranteeExpiringSoon;
    const isExpired = (!isReturnActive && ticket.hasReturnPolicy) && (!isGuaranteeActive && ticket.hasGuarantee);

    return {
      returnDays,
      guaranteeDays,
      isReturnActive,
      isGuaranteeActive,
      isExpiringSoon,
      isExpired,
    };
  };

  // Computed KPIs & Filtering
  const stats = useMemo(() => {
    let activeReturns = 0;
    let activeGuarantees = 0;
    let expiringSoon = 0;

    tickets.forEach((t) => {
      const status = getItemStatus(t);
      if (status.isReturnActive) activeReturns++;
      if (status.isGuaranteeActive) activeGuarantees++;
      if (status.isExpiringSoon) expiringSoon++;
    });

    return {
      total: tickets.length,
      activeReturns,
      activeGuarantees,
      expiringSoon,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Category filter
      if (selectedCategory !== "all" && t.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.productName.toLowerCase().includes(q);
        const matchesStore = t.store.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesStore && !matchesNotes) return false;
      }

      // Status Filter
      const status = getItemStatus(t);
      if (selectedStatusFilter === "return_active" && !status.isReturnActive) return false;
      if (selectedStatusFilter === "guarantee_active" && !status.isGuaranteeActive) return false;
      if (selectedStatusFilter === "expiring_soon" && !status.isExpiringSoon) return false;
      if (selectedStatusFilter === "expired" && !status.isExpired) return false;

      return true;
    });
  }, [tickets, selectedCategory, searchQuery, selectedStatusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Cargando gestor de tickets y garantías...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-card border border-border/60 rounded-xl p-3 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Total Tickets
            </p>
            <p className="text-lg font-black text-foreground">{stats.total}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-3 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <RotateCcw size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Devolución Activa
            </p>
            <p className="text-lg font-black text-foreground">{stats.activeReturns}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-3 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Garantía Vigente
            </p>
            <p className="text-lg font-black text-foreground">{stats.activeGuarantees}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-3 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Próximos a Vencer
            </p>
            <p className="text-lg font-black text-foreground">{stats.expiringSoon}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category, Status Filter & Add Action */}
      <div className="bg-card border border-border/60 rounded-2xl p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por producto, tienda o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* New Ticket Button */}
          <button
            onClick={openModalForNew}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Añadir Ticket</span>
          </button>
        </div>

        {/* Filter Badges & Category Select */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
          {/* Segmented Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
            {[
              { id: "all", label: "Todos" },
              { id: "return_active", label: "Devolución activa" },
              { id: "guarantee_active", label: "Garantía vigente" },
              { id: "expiring_soon", label: "Por vencer ⚠️" },
              { id: "expired", label: "Expirados" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusFilter(tab.id as TicketStatusFilter)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatusFilter === tab.id
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 ml-auto">
            <Tag size={13} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-muted/50 border border-border/60 rounded-md px-2 py-1 text-[11px] font-medium text-foreground focus:outline-hidden"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Grid / List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">No se encontraron tickets</p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Prueba cambiando los filtros de búsqueda o añade tu primer ticket digitalizado.
            </p>
          </div>
          <button
            onClick={openModalForNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Digitalizar Nuevo Ticket</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTickets.map((ticket) => {
            const status = getItemStatus(ticket);

            return (
              <div
                key={ticket.id}
                className="bg-card border border-border/60 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-primary/40 transition gap-3 relative group"
              >
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground mb-1">
                        {ticket.category}
                      </span>
                      <h3 className="text-sm font-extrabold text-foreground leading-snug truncate">
                        {ticket.productName}
                      </h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {ticket.ticketImageUrl && (
                        <button
                          onClick={() => setViewingTicket(ticket)}
                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition cursor-pointer"
                          title="Ver foto del ticket"
                        >
                          <Camera size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => openModalForEdit(ticket)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                        title="Editar ticket"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                        title="Eliminar ticket"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Store & Price & Purchase Date */}
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-[11px] mt-1.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Store size={12} className="shrink-0" />
                      <span className="truncate">{ticket.store}</span>
                    </span>
                    {ticket.price !== undefined && (
                      <span className="flex items-center gap-0.5 font-bold text-foreground">
                        <Euro size={11} className="shrink-0" />
                        {ticket.price.toFixed(2)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="shrink-0" />
                      {ticket.purchaseDate}
                    </span>
                  </div>
                </div>

                {/* Expiration Details Box */}
                <div className="space-y-1.5 bg-muted/40 border border-border/40 rounded-lg p-2.5">
                  {/* Return Expiration */}
                  {ticket.hasReturnPolicy ? (
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5 font-medium shrink-0">
                        <RotateCcw size={12} className="text-emerald-500" />
                        <span>Devolución:</span>
                      </div>
                      <div className="text-right truncate">
                        {status.returnDays !== null ? (
                          status.returnDays >= 0 ? (
                            <span
                              className={`font-bold ${
                                status.returnDays <= ticket.reminderWeeksBefore * 7
                                  ? "text-amber-600 dark:text-amber-400 animate-pulse"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {status.returnDays === 0
                                ? "¡Hoy último día!"
                                : `${status.returnDays}d restantes`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground line-through">
                              Expirada ({ticket.returnExpirationDate})
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Guarantee Expiration */}
                  {ticket.hasGuarantee ? (
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5 font-medium shrink-0">
                        <ShieldCheck size={12} className="text-blue-500" />
                        <span>Garantía:</span>
                      </div>
                      <div className="text-right truncate">
                        {status.guaranteeDays !== null ? (
                          status.guaranteeDays >= 0 ? (
                            <span
                              className={`font-bold ${
                                status.guaranteeDays <= ticket.reminderWeeksBefore * 7
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {status.guaranteeDays === 0
                                ? "¡Vence hoy!"
                                : `${status.guaranteeDays}d restantes`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground line-through">
                              Finalizada ({ticket.guaranteeExpirationDate})
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Footer notes & Reminder badge */}
                <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/30 gap-2">
                  <span className="truncate max-w-[70%]" title={ticket.notes}>
                    {ticket.notes || "Sin notas adicionales"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 font-medium">
                    {ticket.reminderEnabled ? (
                      <span
                        className="inline-flex items-center gap-1 text-primary"
                        title={`Aviso ${ticket.reminderWeeksBefore} sem. antes`}
                      >
                        <Bell size={11} />
                        <span>{ticket.reminderWeeksBefore}s</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground opacity-60">
                        <BellOff size={11} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT TICKET */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden my-auto flex flex-col max-h-[90dvh]">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FileText size={16} />
                </div>
                <h2 className="text-sm font-extrabold text-foreground">
                  {editingTicket ? "Editar Ticket" : "Nuevo Ticket Digitalizado"}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-4 space-y-3.5 overflow-y-auto min-h-0 flex-1">
              {/* Product Name & Store */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    Producto / Nombre <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. TV OLED 55 pulgadas"
                    value={formData.productName || ""}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    Tienda / Establecimiento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Amazon, MediaMarkt..."
                    value={formData.store || ""}
                    onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Category, Price, Purchase Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Categoría</label>
                  <select
                    value={formData.category || "Electrónica"}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                    className="w-full px-2.5 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-xs text-foreground focus:outline-hidden"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    Fecha Compra <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate || ""}
                    onChange={(e) => handlePurchaseDateChange(e.target.value)}
                    className="w-full px-2 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Return Policy Config */}
              <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.hasReturnPolicy}
                      onChange={(e) => setFormData({ ...formData, hasReturnPolicy: e.target.checked })}
                      className="rounded-xs border-border text-primary focus:ring-primary"
                    />
                    <RotateCcw size={14} className="text-emerald-500" />
                    <span>Período de Devolución</span>
                  </label>
                </div>

                {formData.hasReturnPolicy && (
                  <div className="pt-1 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                        Límite Devolución
                      </label>
                      <input
                        type="date"
                        value={formData.returnExpirationDate || ""}
                        onChange={(e) => setFormData({ ...formData, returnExpirationDate: e.target.value })}
                        className="w-full px-2 py-1 bg-background border border-border/80 rounded-md text-xs text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Guarantee Config */}
              <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.hasGuarantee}
                      onChange={(e) => setFormData({ ...formData, hasGuarantee: e.target.checked })}
                      className="rounded-xs border-border text-primary focus:ring-primary"
                    />
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span>Garantía Legal / Comercial</span>
                  </label>
                </div>

                {formData.hasGuarantee && (
                  <div className="pt-1 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                        Expiración Garantía
                      </label>
                      <input
                        type="date"
                        value={formData.guaranteeExpirationDate || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, guaranteeExpirationDate: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-background border border-border/80 rounded-md text-xs text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reminder Settings */}
              <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.reminderEnabled}
                      onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                      className="rounded-xs border-border text-primary focus:ring-primary"
                    />
                    <Bell size={14} className="text-primary" />
                    <span>Recordatorio de Vencimiento</span>
                  </label>
                </div>

                {formData.reminderEnabled && (
                  <div className="pt-1 pl-6 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">Avisar</span>
                    <select
                      value={formData.reminderWeeksBefore || 2}
                      onChange={(e) =>
                        setFormData({ ...formData, reminderWeeksBefore: Number(e.target.value) })
                      }
                      className="px-2 py-1 bg-background border border-border/80 rounded-md text-xs text-foreground"
                    >
                      <option value={1}>1 semana antes</option>
                      <option value={2}>2 semanas antes</option>
                      <option value={3}>3 semanas antes</option>
                      <option value={4}>1 mes antes</option>
                    </select>
                    <span className="text-muted-foreground font-medium">de expirar</span>
                  </div>
                )}
              </div>

              {/* Digitalized Ticket Image Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>Foto del Ticket Digitalizado</span>
                  {formData.ticketImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ticketImageUrl: "" })}
                      className="text-[10px] text-destructive hover:underline"
                    >
                      Quitar Foto
                    </button>
                  )}
                </label>

                {formData.ticketImageUrl ? (
                  <div className="relative border border-border rounded-xl overflow-hidden max-h-48 bg-black/5 flex items-center justify-center p-2">
                    <img
                      src={formData.ticketImageUrl}
                      alt="Ticket"
                      className="max-h-44 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer transition bg-muted/20 hover:bg-muted/40 space-y-1"
                  >
                    <Upload size={20} className="mx-auto text-muted-foreground" />
                    <p className="text-xs font-bold text-foreground">
                      Haz clic para subir o hacer foto al ticket
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Formatos soportados: JPG, PNG, WEBP (se optimizará automáticamente)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Notas Adicionales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de embalaje, número de serie, ubicación de la caja..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted font-medium text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition cursor-pointer"
                >
                  {editingTicket ? "Guardar Cambios" : "Guardar Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL TICKET IMAGE */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  {viewingTicket.productName}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {viewingTicket.store} • {viewingTicket.purchaseDate}
                </p>
              </div>
              <button
                onClick={() => setViewingTicket(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/10">
              {viewingTicket.ticketImageUrl ? (
                <img
                  src={viewingTicket.ticketImageUrl}
                  alt={viewingTicket.productName}
                  className="max-h-[70dvh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <p className="text-muted-foreground text-xs">No hay foto disponible para este ticket.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
