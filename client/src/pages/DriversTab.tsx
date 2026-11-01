// client/src/pages/DriversTab.tsx
// Interface livreurs — flat, pro, bleu principal, boutons uniformes.
import React, { useState, useEffect, useMemo } from "react";
import { useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeighborhoodCombobox } from './NeighborhoodCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInMinutes, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============ DESIGN SYSTEM ============
const ui = {
  card: "bg-white rounded-xl border border-slate-200/80 shadow-sm",
  input: "h-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all",
  btn: "h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors",
  btnPrimary: "h-8 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors",
  btnGhost: "h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors",
  dialog: "rounded-xl border border-slate-200 bg-white shadow-2xl",
  well: "rounded-lg border border-slate-200/70 bg-slate-50/50",
  sectionTitle: "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
};

type Tone = "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";

const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => {
  const map: Record<Tone, string> = {
    brand: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-1 ring-red-100",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    slate: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", map[tone], className)}>{children}</span>;
};

const MiniKPI: React.FC<{
  title: string; value: string | number; subtitle?: string;
  trend?: { dir: 'up' | 'down'; label: string } | null;
  tone?: "brand" | "green" | "amber" | "red" | "blue" | "purple";
  progress?: number; progressLabel?: string;
}> = ({ title, value, subtitle, trend, tone = "brand", progress, progressLabel }) => {
  const isZero = value === 0 || value === "0" || value === "0%";
  const toneColors = {
    brand: "bg-blue-600",
    green: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    purple: "bg-violet-500",
  };
  return (
    <div className={cn(ui.card, "p-5 transition-shadow hover:shadow-md")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-medium text-slate-500">{title}</p>
          <p className={cn("mt-2 text-[26px] font-semibold tabular-nums leading-none", isZero ? "text-slate-300" : "text-slate-900")}>{value}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        {trend && <span className={cn("inline-flex items-center gap-0.5 font-semibold", trend.dir === 'up' ? "text-emerald-600" : "text-red-600")}>{trend.dir === 'up' ? '↑ ' : '↓ '}{trend.label}</span>}
        {subtitle && <span className="text-slate-500">{subtitle}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10.5px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full transition-all", toneColors[tone])} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ============ INTERFACES ============
interface User {
  id: number; username: string; fullName: string; email: string; phone: string;
  phone2?: string; address?: string; neighborhood?: string; addressDetails?: string;
  role: string; isActive: boolean; createdAt: string; updatedAt: string;
  capacityInItems?: number; vehicleType?: string; preferredZones?: string[]; avatarColor?: string;
}
interface Delivery {
  id: number; orderId: number; deliveryPersonId: number;
  type: 'pickup' | 'delivery';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  scheduledDate?: string; completedDate?: string; notes?: string;
  createdAt: string; updatedAt: string; estimatedDuration?: number;
  actualDuration?: number; distance?: number;
}
interface Order { id: number; clientId: number; totalAmount: number; status: string; createdAt: string; items: Array<{ id: number; name: string; quantity: number }>; }

interface DriversTabProps {
  users: User[]; deliveries: Delivery[]; orders: Order[];
  queryClient: QueryClient; toast: ReturnType<typeof useToast>['toast'];
  toggleUserStatusMutation?: ReturnType<typeof useMutation>;
  createDriverMutation?: ReturnType<typeof useMutation>;
  editDriverMutation?: ReturnType<typeof useMutation>;
}

// ============ CONSTANTES ============
const AVATAR_COLORS = [
  "bg-slate-800", "bg-blue-600", "bg-emerald-600", "bg-amber-600",
  "bg-red-600", "bg-violet-600", "bg-slate-600", "bg-cyan-600"
];
const VEHICLE_TYPES = {
  motorcycle: { label: "Moto", capacity: 150, speed: 40 },
  scooter: { label: "Scooter", capacity: 100, speed: 35 },
  car: { label: "Voiture", capacity: 300, speed: 50 },
  van: { label: "Camionnette", capacity: 500, speed: 45 },
  bicycle: { label: "Vélo", capacity: 50, speed: 15 },
  truck: { label: "Camion", capacity: 1000, speed: 35 }
} as const;

const PREFERRED_ZONES_OPTIONS = [
  "Antananarivo Centre", "Analakely", "67 Ha", "Ambohidratrimo",
  "Ivato", "Andraharo", "Ankazobe", "Behoririka"
];

const validateVehicleType = (vehicleType: string | undefined): keyof typeof VEHICLE_TYPES => {
  if (!vehicleType) return "motorcycle";
  const validTypes = Object.keys(VEHICLE_TYPES) as Array<keyof typeof VEHICLE_TYPES>;
  return validTypes.includes(vehicleType as any) ? vehicleType as keyof typeof VEHICLE_TYPES : "motorcycle";
};

// ============ COMPOSANT PRINCIPAL ============
export const DriversTab: React.FC<DriversTabProps> = ({
  users, deliveries, orders, queryClient, toast,
  toggleUserStatusMutation, createDriverMutation, editDriverMutation,
}) => {
  // ----- états -----
  const [isNewDriverOpen, setIsNewDriverOpen] = useState(false);
  const [newDriverData, setNewDriverData] = useState<any>({});
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const [isDriverDetailsOpen, setIsDriverDetailsOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
  const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);
  const [driverHistoryData, setDriverHistoryData] = useState<any>(null);
  const [editDriverData, setEditDriverData] = useState<any>({
    id: 0, username: "", fullName: "", email: "", phone: "", phone2: "",
    neighborhood: "", addressDetails: "", password: "", capacityInItems: 200,
    vehicleType: "motorcycle", preferredZones: []
  });
  const [filterActive, setFilterActive] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [driversPerPage, setDriversPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ----- mutations -----
  const defaultEditDriverMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("PATCH", `/api/users/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); }
  });
  const defaultCreateDriverMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/users", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); }
  });
  const effectiveEditDriverMutation = editDriverMutation || defaultEditDriverMutation;
  const effectiveCreateDriverMutation = createDriverMutation || defaultCreateDriverMutation;

  // ----- calculs -----
  const calculateDriverStats = (driver: User) => {
    const driverDeliveries = deliveries.filter((d: Delivery) => d.deliveryPersonId === driver.id);
    if (driverDeliveries.length === 0) return { totalDeliveries: 0, completedDeliveries: 0, inProgressDeliveries: 0, pendingDeliveries: 0, failedDeliveries: 0, successRate: 0, performanceScore: 0, avgDeliveryTime: 0, satisfactionRate: 0, totalDistance: 0, avgSpeed: 0, monthlyDeliveries: 0, revenueGenerated: 0 };
    const completedDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "completed");
    const inProgressDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "in_progress");
    const pendingDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "pending" || d.status === "assigned");
    const failedDeliveries = driverDeliveries.filter((d: Delivery) => d.status === "failed");
    const successRate = Math.round((completedDeliveries.length / driverDeliveries.length) * 100);
    const performanceScore = successRate >= 95 ? 5 : successRate >= 90 ? 4.5 : successRate >= 85 ? 4 : successRate >= 80 ? 3.5 : successRate >= 75 ? 3 : successRate >= 70 ? 2.5 : successRate >= 60 ? 2 : 1;
    let totalDeliveryTime = 0; let countWithTime = 0;
    completedDeliveries.forEach(delivery => {
      if (delivery.scheduledDate && delivery.completedDate) {
        const duration = differenceInMinutes(parseISO(delivery.completedDate), parseISO(delivery.scheduledDate));
        if (duration > 0) { totalDeliveryTime += duration; countWithTime++; }
      }
    });
    const avgDeliveryTime = countWithTime > 0 ? Math.round(totalDeliveryTime / countWithTime) : 45;
    const totalDistance = driverDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0);
    const totalHours = totalDeliveryTime / 60;
    const avgSpeed = totalHours > 0 ? Math.round(totalDistance / totalHours) : 25;
    const now = new Date();
    const monthlyDeliveries = driverDeliveries.filter(d => d.completedDate && isWithinInterval(parseISO(d.completedDate), { start: startOfMonth(now), end: endOfMonth(now) })).length;
    let revenueGenerated = 0;
    completedDeliveries.forEach(delivery => {
      const order = orders.find(o => o.id === delivery.orderId);
      if (order) revenueGenerated += order.totalAmount * 0.1;
    });
    const satisfactionRate = Math.min(100, successRate + Math.floor(Math.random() * 15));
    return { totalDeliveries: driverDeliveries.length, completedDeliveries: completedDeliveries.length, inProgressDeliveries: inProgressDeliveries.length, pendingDeliveries: pendingDeliveries.length, failedDeliveries: failedDeliveries.length, successRate, performanceScore, avgDeliveryTime, satisfactionRate, totalDistance, avgSpeed, monthlyDeliveries, revenueGenerated };
  };

  const deliveryPersons = useMemo(() => {
    return users.filter((user: User) => user.role === "delivery").map((driver, index) => {
      const validVehicleType = validateVehicleType(driver.vehicleType);
      const vehicleInfo = VEHICLE_TYPES[validVehicleType];
      return { ...driver, vehicleType: validVehicleType, vehicleLabel: vehicleInfo.label, capacityInItems: driver.capacityInItems || vehicleInfo.capacity, avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length] };
    });
  }, [users]);

  const globalStats = useMemo(() => {
    const totalDrivers = deliveryPersons.length;
    const activeDrivers = deliveryPersons.filter(d => d.isActive).length;
    const now = new Date();
    const monthlyDeliveries = deliveries.filter(d => d.completedDate && isWithinInterval(parseISO(d.completedDate), { start: startOfMonth(now), end: endOfMonth(now) }));
    const completedDeliveries = deliveries.filter(d => d.status === "completed");
    const inProgressDeliveries = deliveries.filter(d => d.status === "in_progress");
    const pendingDeliveries = deliveries.filter(d => d.status === "pending" || d.status === "assigned");
    const failedDeliveries = deliveries.filter(d => d.status === "failed");
    const successRate = deliveries.length > 0 ? Math.round((completedDeliveries.length / deliveries.length) * 100) : 0;
    let totalDeliveryTime = 0; let countWithTime = 0;
    completedDeliveries.forEach(delivery => {
      if (delivery.scheduledDate && delivery.completedDate) {
        const duration = differenceInMinutes(parseISO(delivery.completedDate), parseISO(delivery.scheduledDate));
        if (duration > 0) { totalDeliveryTime += duration; countWithTime++; }
      }
    });
    const avgDeliveryTime = countWithTime > 0 ? Math.round(totalDeliveryTime / countWithTime) : 45;
    const vehicleDistribution = deliveryPersons.reduce((acc, driver) => {
      const vehicle = driver.vehicleType || "unknown";
      acc[vehicle] = (acc[vehicle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { totalDrivers, activeDrivers, totalDeliveries: deliveries.length, monthlyDeliveries: monthlyDeliveries.length, completedDeliveries: completedDeliveries.length, inProgressDeliveries: inProgressDeliveries.length, pendingDeliveries: pendingDeliveries.length, failedDeliveries: failedDeliveries.length, successRate, avgDeliveryTime, vehicleDistribution, activeRate: totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0 };
  }, [deliveryPersons, deliveries]);

  const filteredDrivers = useMemo(() => {
    let filtered = deliveryPersons;
    if (filterActive === "all" || filterActive === "active") filtered = deliveryPersons.filter(driver => driver.isActive === true);
    else if (filterActive === "inactive") filtered = deliveryPersons.filter(driver => driver.isActive === false);
    else if (filterActive === "all_include_inactive") filtered = deliveryPersons;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(driver =>
        driver.fullName.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query) ||
        (driver.neighborhood && driver.neighborhood.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [deliveryPersons, filterActive, searchQuery]);

  const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);
  const currentDrivers = filteredDrivers.slice((currentPage - 1) * driversPerPage, currentPage * driversPerPage);

  useEffect(() => { setCurrentPage(1); }, [filterActive, searchQuery]);

  // ----- helpers -----
  const updateLocalDriverData = (driverId: number, updates: Partial<User>) => {
    queryClient.setQueryData(["users"], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((user: User) => user.id === driverId ? { ...user, ...updates } : user);
    });
  };

  const getInitials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'NN';

  // ----- actions -----
  const handleAddNewDriver = () => {
    setNewDriverData({ capacityInItems: 200, preferredZones: [], vehicleType: "motorcycle", password: `driver${Date.now().toString().slice(-6)}` });
    setIsNewDriverOpen(true);
  };

  const handleSubmitNewDriver = () => {
    if (!newDriverData.fullName || !newDriverData.email || !newDriverData.phone) {
      toast({ title: "Champs requis", description: "Veuillez remplir au moins le nom complet, l'email et le téléphone.", variant: "destructive" });
      return;
    }
    const baseUsername = newDriverData.username || newDriverData.email.split('@')[0];
    const uniqueUsername = `${baseUsername}_${Date.now().toString().slice(-6)}`;
    const validVehicleType = validateVehicleType(newDriverData.vehicleType);
    const vehicleInfo = VEHICLE_TYPES[validVehicleType];
    const driverDataToSend = { ...newDriverData, username: uniqueUsername, role: "delivery", isActive: true, capacityInItems: newDriverData.capacityInItems || vehicleInfo.capacity, vehicleType: validVehicleType };
    effectiveCreateDriverMutation.mutate(driverDataToSend, {
      onSuccess: (response: any) => {
        updateLocalDriverData(response.id, { ...driverDataToSend, id: response.id });
        setNewDriverData({}); setIsNewDriverOpen(false);
        toast({ title: "Livreur créé", description: `${newDriverData.fullName} a été ajouté avec succès.` });
      },
      onError: (error: any) => {
        toast({ title: "Erreur de création", description: error.message || "Échec de la création du livreur.", variant: "destructive" });
      }
    });
  };

  const handleEditDriver = (driver: User) => {
    const validVehicleType = validateVehicleType(driver.vehicleType);
    setEditDriverData({
      id: driver.id, username: driver.username, fullName: driver.fullName, email: driver.email,
      phone: driver.phone, phone2: driver.phone2 || "", neighborhood: driver.neighborhood || "",
      addressDetails: driver.addressDetails || "", capacityInItems: driver.capacityInItems || 200,
      vehicleType: validVehicleType, preferredZones: driver.preferredZones || [], password: ""
    });
    setIsEditDriverOpen(true);
  };

  const handleSubmitEditDriver = () => {
    if (!editDriverData.fullName || !editDriverData.email || !editDriverData.phone) {
      toast({ title: "Champs requis", description: "Nom complet, email et téléphone sont obligatoires.", variant: "destructive" });
      return;
    }
    const validVehicleType = validateVehicleType(editDriverData.vehicleType);
    const updateData = {
      id: editDriverData.id, fullName: editDriverData.fullName, email: editDriverData.email,
      phone: editDriverData.phone, phone2: editDriverData.phone2 || null,
      neighborhood: editDriverData.neighborhood || null, addressDetails: editDriverData.addressDetails || null,
      capacityInItems: editDriverData.capacityInItems || 200, vehicleType: validVehicleType,
      preferredZones: editDriverData.preferredZones || [],
      ...(editDriverData.password && { password: editDriverData.password })
    };
    effectiveEditDriverMutation.mutate(updateData, {
      onSuccess: () => {
        updateLocalDriverData(editDriverData.id, updateData);
        setIsEditDriverOpen(false);
        setEditDriverData({});
        toast({ title: "Livreur modifié", description: "Les informations ont été mises à jour." });
      },
      onError: (error: any) => {
        toast({ title: "Erreur de modification", description: error.message || "Échec de la mise à jour.", variant: "destructive" });
      }
    });
  };

  const handleViewDriverDetails = (driver: User) => { setSelectedDriver(driver); setIsDriverDetailsOpen(true); };
  const handleViewDriverHistory = (driver: User) => {
    const driverSpecificDeliveries = deliveries.filter(d => d.deliveryPersonId === driver.id);
    setDriverHistoryData({ driver, deliveries: driverSpecificDeliveries });
    setIsDriverHistoryOpen(true);
  };
  const handleToggleDriverStatus = (driver: User) => {
    const newStatus = !driver.isActive;
    updateLocalDriverData(driver.id, { isActive: newStatus });
    effectiveEditDriverMutation.mutate({ id: driver.id, isActive: newStatus }, {
      onSuccess: () => { toast({ title: newStatus ? "Livreur activé" : "Livreur désactivé", description: `${driver.fullName} a été ${newStatus ? 'activé' : 'désactivé'}.` }); },
      onError: (error: any) => {
        updateLocalDriverData(driver.id, { isActive: !newStatus });
        toast({ title: "Erreur", description: error.message || "Impossible de modifier le statut.", variant: "destructive" });
      }
    });
  };

  const activeCount = deliveryPersons.filter(d => d.isActive).length;
  const inactiveCount = deliveryPersons.filter(d => !d.isActive).length;
  const totalCount = deliveryPersons.length;

  // ============ RENDU ============
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className={cn(ui.card, "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-5")}>
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Équipe de livraison</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Gérez vos livreurs et suivez leurs performances</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Input placeholder="Rechercher…" className={cn(ui.input, "text-[12.5px]")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={cn(ui.btn, "gap-1.5")}>Filtre</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-lg border-slate-200 w-56">
              <DropdownMenuLabel className="text-[11px] text-slate-500">Filtrer par statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterActive("all")} className="text-[12px]">
                Tous les livreurs <span className="ml-auto text-slate-400">{activeCount}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterActive("active")} className="text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />Actifs <span className="ml-auto text-slate-400">{activeCount}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterActive("inactive")} className="text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />Inactifs <span className="ml-auto text-slate-400">{inactiveCount}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterActive("all_include_inactive")} className="text-[12px] text-slate-500">
                Tout voir <span className="ml-auto text-slate-400">{totalCount}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddNewDriver} className={cn(ui.btnPrimary, "gap-1.5")}>
            Nouveau livreur
          </Button>
        </div>
      </div>

      {/* KPI GLOBAUX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniKPI title="Livreurs actifs" value={`${globalStats.activeDrivers}/${globalStats.totalDrivers}`} subtitle={`${globalStats.activeRate}% de l'équipe`} tone="brand" progress={globalStats.activeRate} progressLabel="Taux d'activité" />
        <MiniKPI title="Taux de réussite" value={`${globalStats.successRate}%`} subtitle={`${globalStats.completedDeliveries} livraisons terminées`} tone={globalStats.successRate >= 90 ? "green" : globalStats.successRate >= 70 ? "amber" : "red"} />
        <MiniKPI title="Livraisons du mois" value={globalStats.monthlyDeliveries} subtitle={`${globalStats.totalDeliveries} au total`} tone="purple" />
        <MiniKPI title="Temps moyen" value={`${globalStats.avgDeliveryTime} min`} subtitle="Par livraison" tone="amber" />
      </div>

      {/* PARC DE VÉHICULES */}
      {Object.keys(globalStats.vehicleDistribution).length > 0 && (
        <div className={ui.card}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <h3 className="text-[13.5px] font-semibold text-slate-900">Parc de véhicules</h3>
              <span className="text-[11.5px] text-slate-500">Répartition dans l'équipe</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(globalStats.vehicleDistribution).map(([vehicle, count]) => {
                const vehicleInfo = VEHICLE_TYPES[vehicle as keyof typeof VEHICLE_TYPES];
                return (
                  <div key={vehicle} className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50">
                    <p className="text-[18px] font-semibold text-slate-900 tabular-nums leading-none">{count}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{vehicleInfo?.label || vehicle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BARRE D'OUTILS */}
      <div className={cn(ui.card, "p-3 flex flex-wrap items-center justify-between gap-3")}>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button onClick={() => setViewMode("grid")} className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors", viewMode === "grid" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50")}>
              Grille
            </button>
            <button onClick={() => setViewMode("list")} className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors", viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50")}>
              Liste
            </button>
          </div>
          <span className="text-[11.5px] text-slate-500">
            <span className="font-medium text-emerald-600">{activeCount}</span> actifs • <span className="font-medium text-slate-500">{inactiveCount}</span> inactifs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={driversPerPage.toString()} onValueChange={(v) => { setDriversPerPage(parseInt(v)); setCurrentPage(1); }}>
            <SelectTrigger className={cn(ui.input, "w-[80px] h-8 text-[12px]")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className={cn(ui.btn, "h-8 px-2 text-[11px]")} onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* CONTENU : GRILLE / LISTE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={ui.card}>
              <div className="p-5"><Skeleton className="h-44 w-full rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : filteredDrivers.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDrivers.map((driver) => (
              <DriverGridCard key={driver.id} driver={driver} stats={calculateDriverStats(driver)} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {currentDrivers.map((driver) => (
              <DriverListItem key={driver.id} driver={driver} stats={calculateDriverStats(driver)} />
            ))}
          </div>
        )
      ) : (
        <div className={cn(ui.card, "p-12 text-center")}>
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
            {searchQuery ? "Aucun résultat" : filterActive === "all" || filterActive === "active" ? "Aucun livreur actif" : filterActive === "inactive" ? "Aucun livreur inactif" : "Aucun livreur enregistré"}
          </h3>
          <p className="text-[12px] text-slate-500 mb-4">
            {searchQuery ? "Aucun livreur ne correspond à votre recherche." : filterActive === "all" || filterActive === "active" ? "Tous les livreurs sont inactifs." : filterActive === "inactive" ? "Tous les livreurs sont actifs." : "Commencez par ajouter votre premier livreur."}
          </p>
          {searchQuery ? (
            <Button variant="outline" className={ui.btn} onClick={() => setSearchQuery("")}>Effacer</Button>
          ) : (
            <Button onClick={handleAddNewDriver} className={cn(ui.btnPrimary, "gap-1.5")}>
              Ajouter un livreur
            </Button>
          )}
        </div>
      )}

      <PaginationControls />

      {/* DIALOG NOUVEAU LIVREUR */}
      <Dialog open={isNewDriverOpen} onOpenChange={setIsNewDriverOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-slate-900">Nouveau livreur</DialogTitle>
            <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">Remplissez les informations pour ajouter un livreur.</DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="personal" className="w-full">
              <div className="px-5 pt-4">
                <TabsList className="grid w-full grid-cols-2 p-1 rounded-lg border border-slate-200 bg-slate-50">
                  <TabsTrigger value="personal" className="rounded-md text-[12px] py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Informations</TabsTrigger>
                  <TabsTrigger value="professional" className="rounded-md text-[12px] py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Professionnel</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="personal" className="space-y-3 px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px] text-slate-700">Nom complet <span className="text-red-500">*</span></Label>
                    <Input className={ui.input} placeholder="Nom et prénom" value={newDriverData.fullName || ""} onChange={(e) => setNewDriverData({ ...newDriverData, fullName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px] text-slate-700">Email <span className="text-red-500">*</span></Label>
                    <Input type="email" className={ui.input} placeholder="email@exemple.com" value={newDriverData.email || ""} onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px] text-slate-700">Téléphone <span className="text-red-500">*</span></Label>
                    <Input className={ui.input} placeholder="+261 32 00 000 00" value={newDriverData.phone || ""} onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px] text-slate-700">Nom d'utilisateur</Label>
                    <Input className={ui.input} placeholder="Généré automatiquement" value={newDriverData.username || ""} onChange={(e) => setNewDriverData({ ...newDriverData, username: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11.5px] text-slate-700">Quartier <span className="text-red-500">*</span></Label>
                  <NeighborhoodCombobox value={newDriverData.neighborhood || ""} onSelect={(n) => setNewDriverData({ ...newDriverData, neighborhood: n })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11.5px] text-slate-700">Complément d'adresse</Label>
                  <Input className={ui.input} placeholder="Lot, rue, bâtiment..." value={newDriverData.addressDetails || ""} onChange={(e) => setNewDriverData({ ...newDriverData, addressDetails: e.target.value })} />
                </div>
              </TabsContent>
              <TabsContent value="professional" className="space-y-3 px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px] text-slate-700">Véhicule <span className="text-red-500">*</span></Label>
                    <Select value={newDriverData.vehicleType || "motorcycle"} onValueChange={(value) => {
                      const validValue = validateVehicleType(value);
                      const vehicleInfo = VEHICLE_TYPES[validValue];
                      setNewDriverData({ ...newDriverData, vehicleType: validValue, capacityInItems: vehicleInfo.capacity });
                    }}>
                      <SelectTrigger className={ui.input}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(VEHICLE_TYPES).map(([value, data]) => (
                          <SelectItem key={value} value={value}>{data.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px] text-slate-700">Capacité (articles)</Label>
                    <Input type="number" className={ui.input} value={newDriverData.capacityInItems || VEHICLE_TYPES[validateVehicleType(newDriverData.vehicleType)].capacity} onChange={(e) => setNewDriverData({ ...newDriverData, capacityInItems: parseInt(e.target.value) || 200 })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11.5px] text-slate-700">Mot de passe <span className="text-red-500">*</span></Label>
                  <Input type="password" className={ui.input} value={newDriverData.password || ""} onChange={(e) => setNewDriverData({ ...newDriverData, password: e.target.value })} />
                </div>
                <div className={cn(ui.well, "p-3 text-[11.5px] text-slate-500")}>
                  <p>Le livreur sera automatiquement activé après création.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" className={ui.btn} onClick={() => setIsNewDriverOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitNewDriver} disabled={effectiveCreateDriverMutation.isPending} className={cn(ui.btnPrimary, "gap-1.5")}>
              {effectiveCreateDriverMutation.isPending ? "Création…" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DÉTAILS LIVREUR */}
      <Dialog open={isDriverDetailsOpen} onOpenChange={setIsDriverDetailsOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
          {selectedDriver && (
            <>
              <div className="shrink-0 border-b border-slate-200 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", selectedDriver.avatarColor)}>
                      <span className="text-white font-semibold text-base">{getInitials(selectedDriver.fullName)}</span>
                      {selectedDriver.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-[15px] font-semibold text-slate-900">{selectedDriver.fullName}</DialogTitle>
                      <DialogDescription className="flex flex-wrap items-center gap-1 text-[11.5px] text-slate-500">
                        <span>#{selectedDriver.id}</span><span>•</span>
                        <span className="truncate max-w-[200px]">{selectedDriver.email}</span>
                      </DialogDescription>
                    </div>
                  </div>
                  <Pill tone={selectedDriver.isActive ? "brand" : "slate"}>{selectedDriver.isActive ? 'Actif' : 'Inactif'}</Pill>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="overview" className="w-full">
                  <div className="px-5 pt-4">
                    <TabsList className="grid w-full grid-cols-3 p-1 rounded-lg border border-slate-200 bg-slate-50">
                      <TabsTrigger value="overview" className="rounded-md text-[12px] py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Aperçu</TabsTrigger>
                      <TabsTrigger value="stats" className="rounded-md text-[12px] py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Statistiques</TabsTrigger>
                      <TabsTrigger value="missions" className="rounded-md text-[12px] py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Missions</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="overview" className="space-y-3 px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={cn(ui.well, "p-4")}>
                        <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Informations personnelles</h4>
                        <div className="space-y-2.5 text-[12.5px]">
                          <div><p className="text-[10.5px] text-slate-500">Téléphone</p><p className="font-medium text-slate-900">{selectedDriver.phone}</p></div>
                          {selectedDriver.phone2 && <div><p className="text-[10.5px] text-slate-500">Téléphone 2</p><p className="font-medium text-slate-900">{selectedDriver.phone2}</p></div>}
                          <div><p className="text-[10.5px] text-slate-500">Adresse</p><p className="font-medium text-slate-900 break-words">{selectedDriver.addressDetails ? `${selectedDriver.addressDetails}, ` : ''}{selectedDriver.neighborhood || 'Non spécifiée'}</p></div>
                        </div>
                      </div>
                      <div className={cn(ui.well, "p-4")}>
                        <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Informations professionnelles</h4>
                        <div className="space-y-2.5 text-[12.5px]">
                          <div><p className="text-[10.5px] text-slate-500">Véhicule</p><p className="font-medium text-slate-900">{VEHICLE_TYPES[selectedDriver.vehicleType as keyof typeof VEHICLE_TYPES]?.label || "Non spécifié"}</p></div>
                          <div><p className="text-[10.5px] text-slate-500">Capacité</p><p className="font-medium text-slate-900">{selectedDriver.capacityInItems || 200} articles</p></div>
                          <div><p className="text-[10.5px] text-slate-500">Zones préférées</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedDriver.preferredZones?.map((zone, i) => <Pill key={i} tone="brand">{zone}</Pill>) || <span className="text-[11.5px] text-slate-500">Aucune zone</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={cn(ui.well, "p-4")}>
                      <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Statut du compte</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                        <div><p className="text-[10.5px] text-slate-500 mb-1">Statut</p><Pill tone={selectedDriver.isActive ? "brand" : "slate"}>{selectedDriver.isActive ? 'Actif' : 'Inactif'}</Pill></div>
                        <div><p className="text-[10.5px] text-slate-500 mb-1">Inscrit le</p><p className="font-medium text-slate-900">{format(new Date(selectedDriver.createdAt), "dd MMMM yyyy", { locale: fr })}</p></div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="stats" className="space-y-3 px-5 py-4">
                    {(() => {
                      const stats = calculateDriverStats(selectedDriver);
                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200/60"><p className="text-[18px] font-semibold text-blue-700 tabular-nums">{stats.totalDeliveries}</p><p className="text-[10.5px] text-blue-700">Total missions</p></div>
                            <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200/60"><p className="text-[18px] font-semibold text-emerald-700 tabular-nums">{stats.successRate}%</p><p className="text-[10.5px] text-emerald-600">Succès</p></div>
                            <div className="text-center p-3 rounded-lg bg-violet-50 border border-violet-200/60"><p className="text-[18px] font-semibold text-violet-700 tabular-nums">{stats.monthlyDeliveries}</p><p className="text-[10.5px] text-violet-600">Ce mois</p></div>
                            <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200/60"><p className="text-[18px] font-semibold text-amber-700 tabular-nums">{stats.avgDeliveryTime}min</p><p className="text-[10.5px] text-amber-600">Temps moyen</p></div>
                          </div>
                          <div className={cn(ui.well, "p-4 space-y-3")}>
                            <div>
                              <p className="text-[10.5px] text-slate-500 mb-1.5">Performance globale</p>
                              <div className="flex flex-wrap items-center justify-between">
                                <span className="text-[14px] font-semibold text-slate-900">{stats.performanceScore.toFixed(1)}/5</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div><p className="text-[10.5px] text-slate-500">Distance totale</p><p className="text-[16px] font-semibold text-slate-900">{stats.totalDistance} km</p></div>
                              <div><p className="text-[10.5px] text-slate-500">Revenu estimé</p><p className="text-[16px] font-semibold text-slate-900">{stats.revenueGenerated.toFixed(2)} €</p></div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </TabsContent>
                  <TabsContent value="missions" className="space-y-2 px-5 py-4">
                    {deliveries.filter(d => d.deliveryPersonId === selectedDriver.id).slice(0, 5).map((delivery) => {
                      const order = orders.find(o => o.id === delivery.orderId);
                      const client = order ? users.find(u => u.id === order.clientId) : null;
                      return (
                        <div key={delivery.id} className={cn(ui.card, "p-3")}>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <div><p className="font-medium text-[12.5px] text-slate-900">Commande #{order?.id || 'N/A'}</p><p className="text-[11px] text-slate-500">Client: {client?.fullName || 'Inconnu'}</p></div>
                            <Pill tone={delivery.status === "completed" ? "green" : delivery.status === "failed" ? "red" : "amber"}>
                              {delivery.status === "completed" ? "Terminée" : delivery.status === "in_progress" ? "En cours" : delivery.status === "failed" ? "Échec" : delivery.status}
                            </Pill>
                          </div>
                          <div className="text-[11.5px] text-slate-600">{delivery.type === 'pickup' ? 'Ramassage' : 'Livraison'} • {delivery.scheduledDate && `Programmé: ${format(new Date(delivery.scheduledDate), "dd/MM HH:mm", { locale: fr })}`}</div>
                        </div>
                      );
                    })}
                    <Button variant="outline" className={cn(ui.btn, "w-full gap-1.5")} onClick={() => { handleViewDriverHistory(selectedDriver); setIsDriverDetailsOpen(false); }}>
                      Voir tout l'historique ({deliveries.filter(d => d.deliveryPersonId === selectedDriver.id).length})
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-wrap gap-2 justify-end">
                <Button variant="outline" className={cn(ui.btn, selectedDriver.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50")} onClick={() => handleToggleDriverStatus(selectedDriver)} disabled={effectiveEditDriverMutation.isPending}>
                  {selectedDriver.isActive ? "Désactiver" : "Activer"}
                </Button>
                <Button variant="outline" className={cn(ui.btn, "gap-1.5")} onClick={() => { handleEditDriver(selectedDriver); setIsDriverDetailsOpen(false); }}>
                  Modifier
                </Button>
                <Button className={cn(ui.btnPrimary, "gap-1.5")} onClick={() => window.open(`tel:${selectedDriver.phone}`, '_self')}>
                  Appeler
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIT — REFONTE */}
      <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[680px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
          {editDriverData && (
            <>
              <div className="shrink-0 border-b border-slate-200 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-11 w-11 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-[14px]">
                    {getInitials(editDriverData.fullName || "?")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-[15px] font-semibold text-slate-900">Modifier le livreur</DialogTitle>
                    <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">Mettez à jour les informations du profil et du véhicule.</DialogDescription>
                  </div>
                  {selectedDriver && <Pill tone={selectedDriver.isActive ? "brand" : "slate"}>{selectedDriver.isActive ? "Actif" : "Inactif"}</Pill>}
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitEditDriver(); }} className="flex-1 overflow-y-auto flex flex-col">
                <div className="space-y-5 px-5 py-5">
                  {/* IDENTITÉ */}
                  <div className="space-y-3">
                    <span className={ui.sectionTitle}>Identité</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Nom complet <span className="text-red-500">*</span></Label>
                        <Input className={ui.input} value={editDriverData.fullName || ""} onChange={(e) => setEditDriverData({ ...editDriverData, fullName: e.target.value })} placeholder="Nom et prénom" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Nom d'utilisateur</Label>
                        <Input className={ui.input} value={editDriverData.username || ""} onChange={(e) => setEditDriverData({ ...editDriverData, username: e.target.value })} placeholder="jean.rakoto" />
                      </div>
                    </div>
                  </div>

                  {/* CONTACT */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className={ui.sectionTitle}>Contact</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Email <span className="text-red-500">*</span></Label>
                        <Input type="email" className={ui.input} value={editDriverData.email || ""} onChange={(e) => setEditDriverData({ ...editDriverData, email: e.target.value })} placeholder="email@exemple.com" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Téléphone <span className="text-red-500">*</span></Label>
                        <Input className={ui.input} value={editDriverData.phone || ""} onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })} placeholder="+261 32 00 000 00" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Téléphone 2</Label>
                        <Input className={ui.input} value={editDriverData.phone2 || ""} onChange={(e) => setEditDriverData({ ...editDriverData, phone2: e.target.value })} placeholder="Optionnel" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Quartier</Label>
                        <NeighborhoodCombobox value={editDriverData.neighborhood || ""} onSelect={(n) => setEditDriverData({ ...editDriverData, neighborhood: n })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11.5px] text-slate-700">Complément d'adresse</Label>
                      <Input className={ui.input} value={editDriverData.addressDetails || ""} onChange={(e) => setEditDriverData({ ...editDriverData, addressDetails: e.target.value })} placeholder="Lot, rue, bâtiment..." />
                    </div>
                  </div>

                  {/* VÉHICULE */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className={ui.sectionTitle}>Véhicule</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Type de véhicule <span className="text-red-500">*</span></Label>
                        <Select value={editDriverData.vehicleType || "motorcycle"} onValueChange={(value) => {
                          const validValue = validateVehicleType(value);
                          const info = VEHICLE_TYPES[validValue];
                          setEditDriverData({ ...editDriverData, vehicleType: validValue, capacityInItems: info.capacity });
                        }}>
                          <SelectTrigger className={ui.input}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(VEHICLE_TYPES).map(([value, data]) => (
                              <SelectItem key={value} value={value}>{data.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11.5px] text-slate-700">Capacité (articles)</Label>
                        <Input type="number" className={ui.input} value={editDriverData.capacityInItems || 200} onChange={(e) => setEditDriverData({ ...editDriverData, capacityInItems: parseInt(e.target.value) || 200 })} />
                      </div>
                    </div>
                    <div className={cn(ui.well, "flex items-center justify-between p-2.5 text-[11.5px]")}>
                      <span className="text-slate-500">Capacité recommandée</span>
                      <span className="font-medium text-slate-700">{VEHICLE_TYPES[validateVehicleType(editDriverData.vehicleType)]?.capacity} articles</span>
                    </div>
                  </div>

                  {/* SÉCURITÉ */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className={ui.sectionTitle}>Sécurité</span>
                    <div className="space-y-1.5">
                      <Label className="text-[11.5px] text-slate-700">
                        Nouveau mot de passe <span className="text-[10px] font-normal text-slate-400 ml-1">(laisser vide pour ne pas changer)</span>
                      </Label>
                      <Input type="password" className={ui.input} value={editDriverData.password || ""} onChange={(e) => setEditDriverData({ ...editDriverData, password: e.target.value })} placeholder="••••••••" />
                    </div>
                  </div>

                  {/* ZONES */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className={ui.sectionTitle}>Zones préférées</span>
                      <span className="text-[10.5px] text-slate-400">{(editDriverData.preferredZones || []).length} sélectionnée(s)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PREFERRED_ZONES_OPTIONS.map((zone) => {
                        const isSelected = editDriverData.preferredZones?.includes(zone);
                        return (
                          <button key={zone} type="button" onClick={() => {
                            const zones = editDriverData.preferredZones || [];
                            setEditDriverData({ ...editDriverData, preferredZones: isSelected ? zones.filter((z: string) => z !== zone) : [...zones, zone] });
                          }}
                            className={cn("flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-[11.5px] text-left transition-colors",
                              isSelected ? "border-blue-300 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                            <span className="truncate">{zone}</span>
                            <span className={cn("shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] font-bold",
                              isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white text-transparent")}>✓</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* FOOTER sticky */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsEditDriverOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={effectiveEditDriverMutation.isPending} className={cn(ui.btnPrimary, "gap-1.5 min-w-[120px]")}>
                    {effectiveEditDriverMutation.isPending ? "Sauvegarde…" : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG HISTORIQUE */}
      <Dialog open={isDriverHistoryOpen} onOpenChange={setIsDriverHistoryOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[800px] max-h-[80vh] overflow-hidden p-0 flex flex-col")}>
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-[15px] font-semibold text-slate-900">Historique des missions</DialogTitle>
            <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">
              {driverHistoryData?.driver?.fullName} • {driverHistoryData?.deliveries?.length || 0} missions
            </DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {driverHistoryData?.deliveries && driverHistoryData.deliveries.length > 0 ? (
              driverHistoryData.deliveries.map((delivery: Delivery) => {
                const order = orders.find(o => o.id === delivery.orderId);
                const client = order ? users.find(u => u.id === order.clientId) : null;
                return (
                  <div key={delivery.id} className={cn(ui.card, "p-3")}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div><p className="font-medium text-[12.5px] text-slate-900">Commande #{order?.id || 'N/A'}</p><p className="text-[11px] text-slate-500">Client: {client?.fullName || 'Inconnu'}</p></div>
                      <Pill tone={delivery.status === "completed" ? "green" : delivery.status === "failed" ? "red" : "amber"}>
                        {delivery.status === "completed" ? "Terminée" : delivery.status === "in_progress" ? "En cours" : delivery.status === "failed" ? "Échec" : delivery.status}
                      </Pill>
                    </div>
                    <div className="text-[11.5px] text-slate-600">{delivery.type === 'pickup' ? 'Ramassage' : 'Livraison'} • {delivery.scheduledDate && `Programmé: ${format(new Date(delivery.scheduledDate), "dd/MM/yyyy HH:mm", { locale: fr })}`}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-[12.5px]">Aucun historique de missions</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ============ SOUS-COMPOSANTS ============
  function PaginationControls() {
    if (totalPages <= 1) return null;
    return (
      <div className={cn(ui.card, "p-4 flex flex-col sm:flex-row items-center justify-between gap-3")}>
        <p className="text-[12px] text-slate-500 order-2 sm:order-1">
          Affichage de {(currentPage - 1) * driversPerPage + 1} à {Math.min(currentPage * driversPerPage, filteredDrivers.length)} sur <span className="font-medium text-slate-700">{filteredDrivers.length}</span> livreur(s)
        </p>
        <div className="flex flex-wrap items-center gap-1.5 order-1 sm:order-2">
          <Button variant="outline" size="sm" className={ui.btn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Préc.</Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return <Button key={pageNum} size="sm" className={cn("w-8", currentPage === pageNum ? ui.btnPrimary : ui.btn)} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>;
          })}
          <Button variant="outline" size="sm" className={ui.btn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suiv.</Button>
        </div>
      </div>
    );
  }

  function DriverGridCard({ driver, stats }: { driver: User; stats: ReturnType<typeof calculateDriverStats> }) {
    return (
      <div className={cn(ui.card, "relative cursor-pointer transition-all hover:border-blue-200 hover:shadow-md group")} onClick={() => handleViewDriverDetails(driver)}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", driver.avatarColor)}>
                <span className="text-white font-semibold text-base">{getInitials(driver.fullName)}</span>
                {driver.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 text-[13.5px] truncate group-hover:text-blue-700 transition-colors">{driver.fullName}</h3>
                <p className="text-[11.5px] text-slate-500 truncate max-w-[150px]">{driver.email}</p>
              </div>
            </div>
            <Pill tone={driver.isActive ? "brand" : "slate"}>{driver.isActive ? 'Actif' : 'Inactif'}</Pill>
          </div>
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center text-[12px] p-2 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <span className="truncate text-slate-700">{driver.phone}</span>
            </div>
            <div className="flex items-center text-[12px] p-2 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <span className="truncate text-slate-700">{driver.neighborhood || 'Non spécifié'}</span>
            </div>
            <div className="flex items-center text-[12px] p-2 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <span className="truncate text-slate-700">{VEHICLE_TYPES[driver.vehicleType as keyof typeof VEHICLE_TYPES]?.label || 'Véhicule'} • {driver.capacityInItems} articles</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200/60"><p className="text-[15px] font-semibold text-blue-700 tabular-nums">{stats.totalDeliveries}</p><p className="text-[10px] text-blue-700">Missions</p></div>
            <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200/60"><p className="text-[15px] font-semibold text-emerald-700 tabular-nums">{stats.successRate}%</p><p className="text-[10px] text-emerald-600">Succès</p></div>
            <div className="text-center p-2 rounded-lg bg-violet-50 border border-violet-200/60"><p className="text-[15px] font-semibold text-violet-700 tabular-nums">{stats.monthlyDeliveries}</p><p className="text-[10px] text-violet-600">Mois</p></div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-[10.5px] text-slate-500 mb-1">
              <span>Performance</span>
              <span className="font-medium text-slate-700">{Math.round(stats.performanceScore * 2)}/10</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(stats.performanceScore * 20, 100)}%` }} />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className={cn(ui.btn, "flex-1")} onClick={(e) => { e.stopPropagation(); handleEditDriver(driver); }} aria-label="Éditer">
              Éditer
            </Button>
            <Button size="sm" variant="outline" className={cn(ui.btn, "flex-1")} onClick={(e) => { e.stopPropagation(); if (driver.phone) window.open(`tel:${driver.phone}`, '_self'); }} aria-label="Appeler">
              Appeler
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className={ui.btn} onClick={(e) => e.stopPropagation()}>•••</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-slate-200">
                <DropdownMenuItem onClick={() => handleViewDriverDetails(driver)}>Voir profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewDriverHistory(driver)}>Historique</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleDriverStatus(driver)} className={driver.isActive ? "text-red-600" : "text-emerald-600"}>
                  {driver.isActive ? "Désactiver" : "Activer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  function DriverListItem({ driver, stats }: { driver: User; stats: ReturnType<typeof calculateDriverStats> }) {
    return (
      <div className={cn(ui.card, "p-4 cursor-pointer transition-all hover:border-blue-200 hover:shadow-sm group")} onClick={() => handleViewDriverDetails(driver)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("relative w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", driver.avatarColor)}>
              <span className="text-white font-semibold text-sm">{getInitials(driver.fullName)}</span>
              {driver.isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 text-[13px] group-hover:text-blue-700 transition-colors">{driver.fullName}</span>
                <Pill tone={driver.isActive ? "brand" : "slate"}>{driver.isActive ? 'Actif' : 'Inactif'}</Pill>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500 mt-0.5">
                <span className="truncate max-w-[150px]">{driver.email}</span>
                <span>•</span><span>{driver.phone}</span>
                <span>•</span><span>{VEHICLE_TYPES[driver.vehicleType as keyof typeof VEHICLE_TYPES]?.label || 'Véhicule'}</span>
                <span>•</span><span className="font-medium text-blue-700">{stats.totalDeliveries} missions</span>
                <span>•</span><span className="font-medium text-emerald-600">{stats.successRate}% succès</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="outline" className={ui.btn} onClick={(e) => { e.stopPropagation(); handleEditDriver(driver); }} aria-label="Éditer">
              Éditer
            </Button>
            <Button size="sm" variant="outline" className={ui.btn} onClick={(e) => { e.stopPropagation(); if (driver.phone) window.open(`tel:${driver.phone}`, '_self'); }} aria-label="Appeler">
              Appeler
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className={ui.btn} onClick={(e) => e.stopPropagation()}>•••</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-slate-200">
                <DropdownMenuItem onClick={() => handleViewDriverDetails(driver)}>Voir profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewDriverHistory(driver)}>Historique</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleDriverStatus(driver)} className={driver.isActive ? "text-red-600" : "text-emerald-600"}>
                  {driver.isActive ? "Désactiver" : "Activer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }
};

export default DriversTab;