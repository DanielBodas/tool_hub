"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Utensils,
  ShoppingCart,
  BookOpen,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Sparkles,
  Calendar,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Package,
  Layers,
  ChefHat,
  Apple,
  Beef,
  Milk,
  Wheat,
  Snowflake,
  Baby,
  Sparkle,
  HelpCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  X
} from "lucide-react";

// Supermarket Aisles / Categories
export const AISLES = [
  { id: "Frutas & Verduras", name: "Frutas & Verduras", icon: Apple, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "Carnes & Pescados", name: "Carnes & Pescados", icon: Beef, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { id: "Lácteos & Huevos", name: "Lácteos & Huevos", icon: Milk, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "Despensa & Cereales", name: "Despensa & Cereales", icon: Wheat, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  { id: "Congelados", name: "Congelados", icon: Snowflake, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { id: "Bebé & Infantil", name: "Bebé & Infantil", icon: Baby, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  { id: "Limpieza & Hogar", name: "Limpieza & Hogar", icon: Sparkle, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { id: "Otros", name: "Otros", icon: Package, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
];

export interface RecipeIngredient {
  name: string;
  quantity?: string;
  aisle: string;
}

export interface Dish {
  id: string;
  name: string;
  category: "Desayuno" | "Comida" | "Cena" | "Merienda" | "Otro";
  prepTime?: string;
  ingredients: RecipeIngredient[];
  isCustom?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  aisle: string;
  bought: boolean;
  sourceMeal?: string;
}

export const DAYS_OF_WEEK = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const MEAL_SLOTS = [
  { id: "desayuno", label: "Desayuno", icon: "☕" },
  { id: "comida", label: "Comida", icon: "🍲" },
  { id: "merienda", label: "Merienda", icon: "🍏" },
  { id: "cena", label: "Cena", icon: "🌙" },
];

export const DEFAULT_DISHES: Dish[] = [
  {
    id: "dish-1",
    name: "Lentejas caseras con verduras",
    category: "Comida",
    prepTime: "35 min",
    ingredients: [
      { name: "Lentejas pardinas", quantity: "250g", aisle: "Despensa & Cereales" },
      { name: "Zanahorias", quantity: "2 uds", aisle: "Frutas & Verduras" },
      { name: "Patata", quantity: "1 ud", aisle: "Frutas & Verduras" },
      { name: "Cebolla", quantity: "1 ud", aisle: "Frutas & Verduras" },
      { name: "Chorizo dulce", quantity: "1 ud", aisle: "Carnes & Pescados" },
      { name: "Laurel", quantity: "2 hojas", aisle: "Despensa & Cereales" },
    ],
  },
  {
    id: "dish-2",
    name: "Pollo al horno con patatas",
    category: "Comida",
    prepTime: "45 min",
    ingredients: [
      { name: "Muslos de pollo", quantity: "4 uds", aisle: "Carnes & Pescados" },
      { name: "Patatas grandes", quantity: "3 uds", aisle: "Frutas & Verduras" },
      { name: "Ajos", quantity: "3 dientes", aisle: "Frutas & Verduras" },
      { name: "Limón", quantity: "1 ud", aisle: "Frutas & Verduras" },
    ],
  },
  {
    id: "dish-3",
    name: "Tortilla de patatas tradicional",
    category: "Cena",
    prepTime: "25 min",
    ingredients: [
      { name: "Huevos grandes", quantity: "6 uds", aisle: "Lácteos & Huevos" },
      { name: "Patatas para freír", quantity: "4 uds", aisle: "Frutas & Verduras" },
      { name: "Cebolla dulce", quantity: "1 ud", aisle: "Frutas & Verduras" },
      { name: "Aceite de oliva virgen extra", quantity: "1 botella", aisle: "Despensa & Cereales" },
    ],
  },
  {
    id: "dish-4",
    name: "Puré de verduras y pavo (Bebé / Infantil)",
    category: "Comida",
    prepTime: "20 min",
    ingredients: [
      { name: "Calabacín", quantity: "1 ud", aisle: "Frutas & Verduras" },
      { name: "Zanahoria", quantity: "2 uds", aisle: "Frutas & Verduras" },
      { name: "Patata", quantity: "1 ud", aisle: "Frutas & Verduras" },
      { name: "Pechuga de pavo", quantity: "150g", aisle: "Carnes & Pescados" },
    ],
  },
  {
    id: "dish-5",
    name: "Salmón a la plancha con brócoli",
    category: "Cena",
    prepTime: "15 min",
    ingredients: [
      { name: "Lomos de salmón fresco", quantity: "2 uds", aisle: "Carnes & Pescados" },
      { name: "Brócoli", quantity: "1 ud", aisle: "Frutas & Verduras" },
      { name: "Salsa de soja", quantity: "1 bote", aisle: "Despensa & Cereales" },
    ],
  },
  {
    id: "dish-6",
    name: "Macarrones a la boloñesa",
    category: "Comida",
    prepTime: "20 min",
    ingredients: [
      { name: "Macarrones", quantity: "300g", aisle: "Despensa & Cereales" },
      { name: "Carne picada mixta", quantity: "300g", aisle: "Carnes & Pescados" },
      { name: "Tomate frito casero", quantity: "1 bote", aisle: "Despensa & Cereales" },
      { name: "Queso rallado", quantity: "1 paquete", aisle: "Lácteos & Huevos" },
    ],
  },
  {
    id: "dish-7",
    name: "Ensalada César con pollo",
    category: "Cena",
    prepTime: "15 min",
    ingredients: [
      { name: "Lechuga romana", quantity: "1 bolsa", aisle: "Frutas & Verduras" },
      { name: "Pechuga de pollo", quantity: "200g", aisle: "Carnes & Pescados" },
      { name: "Picatostes de pan", quantity: "1 bolsa", aisle: "Despensa & Cereales" },
      { name: "Salsa César", quantity: "1 bote", aisle: "Despensa & Cereales" },
      { name: "Queso Parmesano", quantity: "50g", aisle: "Lácteos & Huevos" },
    ],
  },
  {
    id: "dish-8",
    name: "Arroz a la cubana express",
    category: "Comida",
    prepTime: "15 min",
    ingredients: [
      { name: "Arroz redondo", quantity: "250g", aisle: "Despensa & Cereales" },
      { name: "Huevos", quantity: "2 uds", aisle: "Lácteos & Huevos" },
      { name: "Plátanos de Canarias", quantity: "2 uds", aisle: "Frutas & Verduras" },
      { name: "Tomate frito", quantity: "1 bote", aisle: "Despensa & Cereales" },
    ],
  },
  {
    id: "dish-9",
    name: "Crema de calabacín fina",
    category: "Cena",
    prepTime: "20 min",
    ingredients: [
      { name: "Calabacines verdes", quantity: "2 uds", aisle: "Frutas & Verduras" },
      { name: "Quesitos en porciones", quantity: "4 uds", aisle: "Lácteos & Huevos" },
      { name: "Cebolla", quantity: "1 ud", aisle: "Frutas & Verduras" },
    ],
  },
  {
    id: "dish-10",
    name: "Tostadas con aguacate y huevo poyado",
    category: "Desayuno",
    prepTime: "10 min",
    ingredients: [
      { name: "Pan de molde integral", quantity: "1 paquete", aisle: "Despensa & Cereales" },
      { name: "Aguacates maduros", quantity: "2 uds", aisle: "Frutas & Verduras" },
      { name: "Huevos", quantity: "2 uds", aisle: "Lácteos & Huevos" },
    ],
  },
  {
    id: "dish-11",
    name: "Yogur natural con fruta y avena",
    category: "Merienda",
    prepTime: "5 min",
    ingredients: [
      { name: "Yogur natural griego", quantity: "2 uds", aisle: "Lácteos & Huevos" },
      { name: "Copos de avena", quantity: "1 bolsa", aisle: "Despensa & Cereales" },
      { name: "Fresas / Arándanos", quantity: "1 tarrina", aisle: "Frutas & Verduras" },
    ],
  },
];

export function MealPlannerModule() {
  const [activeTab, setActiveTab] = useState<"menu" | "shopping" | "dishes">("menu");

  // State
  const [menu, setMenu] = useState<Record<string, { dishId?: string; customTitle?: string }>>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [dishes, setDishes] = useState<Dish[]>(DEFAULT_DISHES);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & UI Controls
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; slot: string } | null>(null);
  const [customMealInput, setCustomMealInput] = useState("");
  const [shoppingFilter, setShoppingFilter] = useState<"all" | "pending" | "bought">("all");
  const [selectedAisleFilter, setSelectedAisleFilter] = useState<string>("ALL");

  // Quick Add Shopping Item Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemAisle, setNewItemAisle] = useState("Frutas & Verduras");

  // Custom Dish Creator Modal State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishCategory, setNewDishCategory] = useState<"Desayuno" | "Comida" | "Cena" | "Merienda" | "Otro">("Comida");
  const [newDishPrepTime, setNewDishPrepTime] = useState("20 min");
  const [newDishIngredients, setNewDishIngredients] = useState<RecipeIngredient[]>([
    { name: "", quantity: "", aisle: "Frutas & Verduras" },
  ]);

  // Load Initial Data from API or LocalStorage
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/meal-planner");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.menu) setMenu(data.menu);
            if (data.shoppingList) setShoppingList(data.shoppingList);
            if (data.dishes && data.dishes.length > 0) setDishes(data.dishes);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch from API, falling back to localStorage", e);
      }

      // Fallback to localStorage
      try {
        const savedMenu = localStorage.getItem("meal_planner_menu");
        const savedList = localStorage.getItem("meal_planner_shopping");
        const savedDishes = localStorage.getItem("meal_planner_dishes");

        if (savedMenu && isMounted) setMenu(JSON.parse(savedMenu));
        if (savedList && isMounted) setShoppingList(JSON.parse(savedList));
        if (savedDishes && isMounted) setDishes(JSON.parse(savedDishes));
      } catch (e) {
        console.error("Error reading localStorage", e);
      }

      if (isMounted) setIsLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to API & LocalStorage
  const saveData = async (
    updatedMenu?: Record<string, { dishId?: string; customTitle?: string }>,
    updatedList?: ShoppingItem[],
    updatedDishes?: Dish[]
  ) => {
    const finalMenu = updatedMenu !== undefined ? updatedMenu : menu;
    const finalList = updatedList !== undefined ? updatedList : shoppingList;
    const finalDishes = updatedDishes !== undefined ? updatedDishes : dishes;

    // LocalStorage sync
    try {
      localStorage.setItem("meal_planner_menu", JSON.stringify(finalMenu));
      localStorage.setItem("meal_planner_shopping", JSON.stringify(finalList));
      localStorage.setItem("meal_planner_dishes", JSON.stringify(finalDishes));
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }

    // API sync
    try {
      await fetch("/api/meal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu: finalMenu,
          shoppingList: finalList,
          dishes: finalDishes,
        }),
      });
    } catch (e) {
      console.warn("API sync error", e);
    }
  };

  // Assign Dish or Custom Meal to Day/Slot
  const handleAssignMeal = (dishId?: string, customTitle?: string) => {
    if (!selectedSlot) return;
    const key = `${selectedSlot.day}_${selectedSlot.slot}`;
    const updatedMenu = { ...menu };

    if (!dishId && !customTitle) {
      delete updatedMenu[key];
    } else {
      updatedMenu[key] = { dishId, customTitle };
    }

    setMenu(updatedMenu);
    setSelectedSlot(null);
    setCustomMealInput("");
    saveData(updatedMenu);
  };

  // Randomize Menu Generator for the week
  const handleGenerateRandomMenu = () => {
    if (!confirm("¿Deseas generar sugerencias automáticas de comidas para toda la semana?")) return;

    const newMenu: Record<string, { dishId?: string; customTitle?: string }> = {};

    DAYS_OF_WEEK.forEach((day) => {
      MEAL_SLOTS.forEach((slot) => {
        const matchingDishes = dishes.filter(
          (d) => d.category.toLowerCase() === slot.label.toLowerCase() || d.category === "Otro"
        );

        if (matchingDishes.length > 0) {
          const randomIndex = Math.floor(Math.random() * matchingDishes.length);
          newMenu[`${day}_${slot.id}`] = { dishId: matchingDishes[randomIndex].id };
        } else if (dishes.length > 0) {
          const randomIndex = Math.floor(Math.random() * dishes.length);
          newMenu[`${day}_${slot.id}`] = { dishId: dishes[randomIndex].id };
        }
      });
    });

    setMenu(newMenu);
    saveData(newMenu);
  };

  // Clear entire week's menu
  const handleClearWeek = () => {
    if (!confirm("¿Seguro que quieres borrar el menú de toda la semana?")) return;
    setMenu({});
    saveData({});
  };

  // Auto-Generate Shopping List from Active Menu Meals
  const handleGenerateShoppingListFromMenu = () => {
    const newItemsMap: Record<string, ShoppingItem> = {};

    // Keep existing manually added items that are NOT auto-generated
    shoppingList.forEach((item) => {
      if (!item.sourceMeal) {
        newItemsMap[item.id] = item;
      }
    });

    // Iterate through assigned meals in menu
    Object.entries(menu).forEach(([key, val]) => {
      if (!val) return;
      const [day, slot] = key.split("_");
      const slotObj = MEAL_SLOTS.find((s) => s.id === slot);
      const mealTag = `${day} (${slotObj?.label || slot})`;

      if (val.dishId) {
        const dish = dishes.find((d) => d.id === val.dishId);
        if (dish && dish.ingredients) {
          dish.ingredients.forEach((ing) => {
            const itemId = `ing_${ing.name.toLowerCase().trim().replace(/\s+/g, "_")}`;
            if (newItemsMap[itemId]) {
              // Combine quantities if existing
              newItemsMap[itemId].quantity = `${newItemsMap[itemId].quantity || ""} + ${ing.quantity || ""}`.trim();
            } else {
              newItemsMap[itemId] = {
                id: itemId,
                name: ing.name,
                quantity: ing.quantity,
                aisle: ing.aisle || "Otros",
                bought: false,
                sourceMeal: mealTag,
              };
            }
          });
        }
      }
    });

    const updatedList = Object.values(newItemsMap);
    setShoppingList(updatedList);
    saveData(undefined, updatedList);
    setActiveTab("shopping");
  };

  // Add Manual Shopping Item
  const handleAddShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: `manual_${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQty.trim() || undefined,
      aisle: newItemAisle,
      bought: false,
    };

    const updated = [newItem, ...shoppingList];
    setShoppingList(updated);
    setNewItemName("");
    setNewItemQty("");
    saveData(undefined, updated);
  };

  // Toggle Item Bought Status
  const handleToggleBought = (id: string) => {
    const updated = shoppingList.map((item) =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );
    setShoppingList(updated);
    saveData(undefined, updated);
  };

  // Delete Single Shopping Item
  const handleDeleteShoppingItem = (id: string) => {
    const updated = shoppingList.filter((item) => item.id !== id);
    setShoppingList(updated);
    saveData(undefined, updated);
  };

  // Clear Completed (Bought) Items
  const handleClearBoughtItems = () => {
    const updated = shoppingList.filter((item) => !item.bought);
    setShoppingList(updated);
    saveData(undefined, updated);
  };

  // Clear Entire Shopping List
  const handleClearAllShoppingList = () => {
    if (!confirm("¿Borrar toda la lista de la compra?")) return;
    setShoppingList([]);
    saveData(undefined, []);
  };

  // Handle Create Custom Dish
  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const validIngredients = newDishIngredients.filter((ing) => ing.name.trim().length > 0);

    const newDish: Dish = {
      id: `custom_${Date.now()}`,
      name: newDishName.trim(),
      category: newDishCategory,
      prepTime: newDishPrepTime.trim() || "15 min",
      ingredients: validIngredients,
      isCustom: true,
    };

    const updated = [...dishes, newDish];
    setDishes(updated);
    setShowAddDishModal(false);
    setNewDishName("");
    setNewDishIngredients([{ name: "", quantity: "", aisle: "Frutas & Verduras" }]);
    saveData(undefined, undefined, updated);
  };

  // Delete Custom Dish
  const handleDeleteDish = (id: string) => {
    if (!confirm("¿Borrar este plato de tu recetario?")) return;
    const updated = dishes.filter((d) => d.id !== id);
    setDishes(updated);
    saveData(undefined, undefined, updated);
  };

  // Derived Shopping List Stats
  const totalShoppingItems = shoppingList.length;
  const boughtItemsCount = shoppingList.filter((i) => i.bought).length;
  const shoppingProgress = totalShoppingItems > 0 ? Math.round((boughtItemsCount / totalShoppingItems) * 100) : 0;

  // Filtered Shopping Items
  const filteredShoppingList = useMemo(() => {
    return shoppingList.filter((item) => {
      if (shoppingFilter === "pending" && item.bought) return false;
      if (shoppingFilter === "bought" && !item.bought) return false;
      if (selectedAisleFilter !== "ALL" && item.aisle !== selectedAisleFilter) return false;
      return true;
    });
  }, [shoppingList, shoppingFilter, selectedAisleFilter]);

  // Group Shopping Items by Aisle
  const groupedShoppingList = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};

    AISLES.forEach((aisle) => {
      groups[aisle.id] = [];
    });

    filteredShoppingList.forEach((item) => {
      const aisle = item.aisle || "Otros";
      if (!groups[aisle]) groups[aisle] = [];
      groups[aisle].push(item);
    });

    return groups;
  }, [filteredShoppingList]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs font-bold text-muted-foreground">Cargando Menú y Lista de la Compra...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* -------------------- HEADER ACTIONS & NAVIGATION TABS -------------------- */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Utensils size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                Menú Semanal & Compra
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Organiza las comidas del día a día y genera tu lista de la compra por pasillos
              </p>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div className="grid grid-cols-3 bg-muted p-1 rounded-xl w-full sm:w-auto text-xs font-black">
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "menu"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar size={14} className="text-amber-500" />
              <span>Menú</span>
            </button>

            <button
              onClick={() => setActiveTab("shopping")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === "shopping"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingCart size={14} className="text-emerald-500" />
              <span>Compra</span>
              {totalShoppingItems - boughtItemsCount > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {totalShoppingItems - boughtItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("dishes")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "dishes"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen size={14} className="text-indigo-500" />
              <span>Recetario</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WEEKLY MENU SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          {/* CONTROL BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card border border-border/70 p-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <ChefHat size={15} className="text-amber-500" />
                Planificación de la Semana
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleGenerateShoppingListFromMenu}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <ShoppingCart size={13} />
                <span>Generar Lista de la Compra</span>
              </button>

              <button
                onClick={handleGenerateRandomMenu}
                title="Generar menú sugerido aleatorio"
                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl border border-amber-500/20 transition-all flex items-center gap-1"
              >
                <Sparkles size={13} />
                <span className="hidden sm:inline">Sugerir Menú</span>
              </button>

              <button
                onClick={handleClearWeek}
                title="Limpiar menú semanal"
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* WEEKLY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const isWeekend = day === "Sábado" || day === "Domingo";

              return (
                <div
                  key={day}
                  className={`bg-card border rounded-2xl p-2.5 flex flex-col justify-between transition-all ${
                    isWeekend
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                    <span className="text-xs font-black text-foreground uppercase tracking-wide">
                      {day}
                    </span>
                    {isWeekend && (
                      <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md">
                        Finde
                      </span>
                    )}
                  </div>

                  {/* MEAL SLOTS */}
                  <div className="space-y-2 flex-1">
                    {MEAL_SLOTS.map((slot) => {
                      const key = `${day}_${slot.id}`;
                      const assigned = menu[key];
                      const dish = assigned?.dishId ? dishes.find((d) => d.id === assigned.dishId) : null;
                      const title = dish ? dish.name : assigned?.customTitle;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot({ day, slot: slot.id })}
                          className={`p-2 rounded-xl border cursor-pointer transition-all hover:border-primary/50 group relative ${
                            title
                              ? "bg-primary/5 border-primary/20 text-foreground"
                              : "bg-muted/30 border-dashed border-border/70 hover:bg-muted/60"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-extrabold mb-1">
                            <span className="flex items-center gap-1">
                              <span>{slot.icon}</span> {slot.label}
                            </span>
                            {title && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = { ...menu };
                                  delete updated[key];
                                  setMenu(updated);
                                  saveData(updated);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-500 transition-all"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>

                          {title ? (
                            <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight">
                              {title}
                            </p>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic flex items-center gap-1">
                              <Plus size={10} /> Añadir plato
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHOPPING LIST (LISTA DE LA COMPRA) */}
      {/* ========================================================================= */}
      {activeTab === "shopping" && (
        <div className="space-y-4">
          {/* QUICK ADD FORM & STATS BANNER */}
          <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-3">
            {/* PROGRESS BAR */}
            {totalShoppingItems > 0 && (
              <div className="space-y-1.5 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Progreso de Compra
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {boughtItemsCount} de {totalShoppingItems} comprados ({shoppingProgress}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${shoppingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* QUICK ADD ITEM FORM */}
            <form onSubmit={handleAddShoppingItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Ej. Leche entera, Pan de molde, Tomates..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Cant. (ej. 2L, 1kg, 1 pack)"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={newItemAisle}
                  onChange={(e) => setNewItemAisle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                >
                  {AISLES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full h-full py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* FILTERS & CLEAR ACTIONS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card border border-border/70 p-2.5 rounded-xl">
            {/* STATUS FILTERS */}
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setShoppingFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  shoppingFilter === "all" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                Todos ({totalShoppingItems})
              </button>
              <button
                onClick={() => setShoppingFilter("pending")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  shoppingFilter === "pending" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                Pendientes ({totalShoppingItems - boughtItemsCount})
              </button>
              <button
                onClick={() => setShoppingFilter("bought")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  shoppingFilter === "bought" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                Comprados ({boughtItemsCount})
              </button>
            </div>

            {/* AISLE SELECTOR FILTER */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
              <button
                onClick={() => setSelectedAisleFilter("ALL")}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                  selectedAisleFilter === "ALL"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos los pasillos
              </button>
              {AISLES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAisleFilter(a.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                    selectedAisleFilter === a.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-1.5 ml-auto">
              {boughtItemsCount > 0 && (
                <button
                  onClick={handleClearBoughtItems}
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded-xl border border-emerald-500/20 transition-all flex items-center gap-1"
                >
                  <Check size={12} />
                  <span>Limpiar Comprados</span>
                </button>
              )}
              {totalShoppingItems > 0 && (
                <button
                  onClick={handleClearAllShoppingList}
                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-all"
                  title="Vaciar lista de la compra"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* GROUPED BY AISLE LIST */}
          {filteredShoppingList.length > 0 ? (
            <div className="space-y-3">
              {AISLES.map((aisle) => {
                const items = groupedShoppingList[aisle.id] || [];
                if (items.length === 0) return null;

                const AisleIcon = aisle.icon;

                return (
                  <div key={aisle.id} className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-2xs">
                    {/* AISLE HEADER */}
                    <div className="px-3.5 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-lg border ${aisle.color}`}>
                          <AisleIcon size={14} />
                        </span>
                        <h4 className="text-xs font-black text-foreground">{aisle.name}</h4>
                      </div>
                      <span className="text-[10px] font-extrabold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {items.length} {items.length === 1 ? "artículo" : "artículos"}
                      </span>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="divide-y divide-border/40">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleBought(item.id)}
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition-all cursor-pointer hover:bg-muted/40 ${
                            item.bought ? "bg-muted/20 opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBought(item.id);
                              }}
                              className={`p-1 rounded-md transition-all ${
                                item.bought
                                  ? "text-emerald-500 bg-emerald-500/10"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {item.bought ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs font-bold block truncate ${
                                  item.bought ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.sourceMeal && (
                                <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md inline-block mt-0.5">
                                  Menú: {item.sourceMeal}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.quantity && (
                              <span className="text-[10px] font-extrabold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                                {item.quantity}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShoppingItem(item.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-card/40 rounded-2xl border border-dashed border-border text-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <h4 className="text-xs font-black text-foreground">Tu lista de la compra está vacía</h4>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                Añade artículos manualmente arriba o genera la lista automáticamente desde tu menú semanal.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DISHES / RECIPES CATALOG */}
      {/* ========================================================================= */}
      {activeTab === "dishes" && (
        <div className="space-y-4">
          {/* CONTROL BAR */}
          <div className="flex items-center justify-between gap-2 bg-card border border-border/70 p-2.5 rounded-xl">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <BookOpen size={15} className="text-indigo-500" />
              Recetario y Banco de Platos ({dishes.length})
            </span>

            <button
              onClick={() => setShowAddDishModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Añadir Plato</span>
            </button>
          </div>

          {/* DISH CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-card border border-border/80 rounded-2xl p-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-2xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-black text-foreground group-hover:text-indigo-500 transition-colors">
                      {dish.name}
                    </h4>
                    {dish.isCustom && (
                      <button
                        onClick={() => handleDeleteDish(dish.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-all shrink-0"
                        title="Borrar plato"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-1.5 py-0.2 rounded-md">
                      {dish.category}
                    </span>
                    {dish.prepTime && (
                      <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <Clock size={9} /> {dish.prepTime}
                      </span>
                    )}
                  </div>

                  {/* INGREDIENTS PREVIEW */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-muted-foreground block uppercase">
                      Ingredientes ({dish.ingredients.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dish.ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40"
                        >
                          {ing.name} {ing.quantity ? `(${ing.quantity})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN DISH TO MEAL SLOT */}
      {/* ========================================================================= */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-4 space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Utensils size={16} className="text-amber-500" />
                Asignar comida para {selectedSlot.day} ({MEAL_SLOTS.find((s) => s.id === selectedSlot.slot)?.label})
              </h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* CUSTOM TITLE INPUT */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-foreground block">
                O escribe algo personalizado:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Cenar fuera, Sobras de ayer..."
                  value={customMealInput}
                  onChange={(e) => setCustomMealInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold"
                />
                <button
                  onClick={() => handleAssignMeal(undefined, customMealInput)}
                  disabled={!customMealInput.trim()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-2 text-[10px] font-black uppercase text-muted-foreground">
                O elige de tu recetario
              </span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            {/* DISH PICKER LIST */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => handleAssignMeal(dish.id)}
                  className="p-2.5 rounded-xl border border-border/60 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-black text-foreground">{dish.name}</h4>
                    <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.2 rounded-md">
                      {dish.category}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              ))}
            </div>

            {/* CLEAR SLOT BUTTON */}
            <div className="pt-2 border-t border-border/60">
              <button
                onClick={() => handleAssignMeal(undefined, undefined)}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl transition-all"
              >
                Dejar casilla vacía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM DISH TO RECIPES */}
      {/* ========================================================================= */}
      {showAddDishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <form
            onSubmit={handleCreateDish}
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-4 space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <ChefHat size={16} className="text-indigo-500" />
                Crear Nuevo Plato / Receta
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* DISH NAME */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-foreground block">
                Nombre del Plato:
              </label>
              <input
                type="text"
                placeholder="Ej. Paella de marisco, Crema de verduras..."
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* CATEGORY */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-foreground block">
                  Categoría:
                </label>
                <select
                  value={newDishCategory}
                  onChange={(e) => setNewDishCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold"
                >
                  <option value="Desayuno">Desayuno</option>
                  <option value="Comida">Comida</option>
                  <option value="Cena">Cena</option>
                  <option value="Merienda">Merienda</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* PREP TIME */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-foreground block">
                  Tiempo de Prep.:
                </label>
                <input
                  type="text"
                  placeholder="Ej. 20 min"
                  value={newDishPrepTime}
                  onChange={(e) => setNewDishPrepTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            {/* INGREDIENTS EDITOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-foreground block">
                  Ingredientes (para lista de la compra):
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewDishIngredients([
                      ...newDishIngredients,
                      { name: "", quantity: "", aisle: "Frutas & Verduras" },
                    ])
                  }
                  className="text-[10px] font-black text-indigo-500 hover:underline flex items-center gap-0.5"
                >
                  <Plus size={12} /> Añadir ingrediente
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {newDishIngredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="Nombre ingrediente"
                      value={ing.name}
                      onChange={(e) => {
                        const updated = [...newDishIngredients];
                        updated[idx].name = e.target.value;
                        setNewDishIngredients(updated);
                      }}
                      className="col-span-5 px-2 py-1 bg-card border border-border rounded-lg text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Cantidad (ej. 200g)"
                      value={ing.quantity || ""}
                      onChange={(e) => {
                        const updated = [...newDishIngredients];
                        updated[idx].quantity = e.target.value;
                        setNewDishIngredients(updated);
                      }}
                      className="col-span-3 px-2 py-1 bg-card border border-border rounded-lg text-xs font-semibold"
                    />
                    <select
                      value={ing.aisle}
                      onChange={(e) => {
                        const updated = [...newDishIngredients];
                        updated[idx].aisle = e.target.value;
                        setNewDishIngredients(updated);
                      }}
                      className="col-span-3 px-1 py-1 bg-card border border-border rounded-lg text-[10px] font-semibold"
                    >
                      {AISLES.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = newDishIngredients.filter((_, i) => i !== idx);
                        setNewDishIngredients(updated);
                      }}
                      className="col-span-1 text-rose-500 hover:text-rose-600 flex justify-center"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                className="px-3 py-1.5 bg-muted text-muted-foreground font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Guardar Plato
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
