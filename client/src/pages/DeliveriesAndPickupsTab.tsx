// src/pages/DeliveriesAndPickupsTab.tsx
// Version corrigée — flat & pro, sans icônes.
// Correctifs : planning relié aux ramassages de demain (lecture seule, sans doublons),
// type pickup/delivery envoyé à l'API, clé de déduplication order+type+date,
// undo/redo corrigé, charge par arrêt corrigée, coordonnées de repli stables,
// recherches séparées, garde anti double-clic / anti double-assignation.
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, isSameDay, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";

import DeliveryMap from "./DeliveryMap";
import { ANTANANARIVO_NEIGHBORHOODS } from './neighborhoods';

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  input: "h-9 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/15",
  btn: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-lg bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  well: "rounded-lg border border-slate-200 bg-slate-50/70",
  dialog: "rounded-xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
};

/* ============================================================
   HELPERS UI
============================================================ */
const Pill: React.FC<{
  tone?: "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";
  children: React.ReactNode;
}> = ({ tone = "slate", children }) => {
  const map = {
    brand: "bg-[#0B676E]/8 text-[#0B676E]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
};

const MiniKPI: React.FC<{
  title: string; value: string | number; subtitle?: string;
  tone?: "brand" | "green" | "amber" | "red" | "blue" | "purple";
}> = ({ title, value, subtitle }) => {
  const isZero = value === 0 || value === "0" || value === "0%" || value === "0.0 km";
  return (
    <div className={cn(ui.card, "p-5")}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", isZero ? "text-slate-400" : "text-slate-900")}>{value}</p>
      {subtitle && <p className="mt-1.5 text-[11.5px] text-slate-500">{subtitle}</p>}
    </div>
  );
};

const Panel: React.FC<{
  title: string; subtitle?: string; action?: React.ReactNode;
  className?: string; bodyClass?: string; children: React.ReactNode;
}> = ({ title, subtitle, action, className, bodyClass, children }) => (
  <section className={cn(ui.card, className)}>
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
    <div className={cn("p-5", bodyClass)}>{children}</div>
  </section>
);

const Pager: React.FC<{ page: number; total: number; onChange: (p: number) => void }> = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
      <p className="text-[11.5px] text-slate-500">Page {page} / {total}</p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className={ui.btn} onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>Préc.</Button>
        <Button variant="outline" size="sm" className={ui.btn} onClick={() => onChange(Math.min(total, page + 1))} disabled={page >= total}>Suiv.</Button>
      </div>
    </div>
  );
};

/* ============================================================
   TYPES
============================================================ */
interface Coords { lat: number; lng: number; }
interface RouteStopWithDisplay {
  id: number | string; clientName: string;
  type: 'pickup' | 'delivery' | 'depart' | 'retour';
  itemCount: number; estimatedArrival: string; coords: Coords;
  status: string; timeWindowStart?: string; timeWindowEnd?: string;
  priority: number; sequence: number; isVirtualStop: boolean;
}
interface RouteZone {
  id: string;
  driver: { id: number; name: string; vehicleType?: string; capacityInItems?: number; currentLoad: number; startCoords?: Coords; };
  stops: RouteStopWithDisplay[]; distanceKm: number; totalDuration: string;
  efficiencyScore: number; color: string; workloadPercentage: number;
  totalItems: number; co2Emission: number; isModified: boolean;
  startLoad: number; endLoad: number; hasReturnToBase: boolean;
}
interface OptimizationConfig {
  algorithm: string; maxRouteTime: number; balanceWorkload: boolean;
  returnToStart: boolean; avoidTraffic: boolean; maxStopsPerRoute: number;
  minStopDuration: number; respectTimeWindows: boolean; avoidTolls: boolean;
  vehicleType: string; cargoPriority: string; weatherCondition: string;
  trafficCondition: string; fuelEfficiency: number; co2Reduction: boolean;
  breakDuration: number; maxWorkingHours: number; startLocation: string;
  depotLocation?: Coords; svPressingLocation: Coords; capacityThreshold: number;
}
type TaskType = 'pickup' | 'delivery';
interface PlanningItem {
  key: string;                    // orderId|type|yyyy-MM-dd  (clé anti-doublon)
  id: string;
  source: 'delivery' | 'order';   // 'order' = ramassage prévu sur la commande, pas encore assigné
  orderId: number;
  type: TaskType;
  dateKey: string;
  date: Date;
  driverId: number | null;
  status: string;
}

/* ============================================================
   CONSTANTES
============================================================ */
const DEFAULT_CENTER: Coords = { lat: -18.91368, lng: 47.52144 };
const SV_PRESSING_LOCATION: Coords = { lat: -18.9105, lng: 47.5255 };
const COLORS = ['#0B676E','#20B2AA','#0D9488','#0891B2','#2563EB','#4F46E5','#7C3AED','#DB2777','#D97706','#DC2626','#14B8A6','#D946EF','#0EA5E9','#A855F7','#EAB308'];
const VEHICLE_TYPES: Record<string, { label: string; capacity: number; speed: number; costPerKm: number; co2PerKm: number }> = {
  motorcycle: { label: 'Moto', capacity: 150, speed: 35, costPerKm: 200, co2PerKm: 80 },
  scooter: { label: 'Scooter', capacity: 100, speed: 30, costPerKm: 150, co2PerKm: 60 },
  car: { label: 'Voiture', capacity: 300, speed: 45, costPerKm: 350, co2PerKm: 150 },
  van: { label: 'Camionnette', capacity: 500, speed: 40, costPerKm: 500, co2PerKm: 200 },
  bicycle: { label: 'Vélo', capacity: 50, speed: 15, costPerKm: 0, co2PerKm: 0 },
  truck: { label: 'Camion', capacity: 1000, speed: 35, costPerKm: 800, co2PerKm: 300 },
};
const PICKUP_STATUSES = ['to_pickup', 'pickup_late'];
const READY_STATUSES = ['ready_to_deliver', 'to_deliver'];
const DONE_STATUSES = ['delivered', 'completed'];
const ITEMS_PER_PAGE = 10;

const TASK_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Planifié', pending: 'En attente', assigned: 'Assigné', in_progress: 'En cours',
  completed: 'Terminé', failed: 'Échec', cancelled: 'Annulé',
};

/* ============================================================
   HELPERS MÉTIER (purs)
============================================================ */
const toDateKey = (value: any): string | null => {
  if (!value) return null;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return format(d, 'yyyy-MM-dd');
  } catch { return null; }
};

const getTaskOrderId = (d: any): number => Number(d?.orderId ?? d?.order_id);
const getTaskDriverId = (d: any): number | null => {
  const n = Number(d?.deliveryPersonId ?? d?.delivery_person_id);
  return Number.isFinite(n) ? n : null;
};
const getTaskDateRaw = (d: any) => d?.scheduledDate ?? d?.scheduled_date ?? d?.date;
const resolveTaskType = (d: any, order?: any): TaskType => {
  if (d?.type === 'pickup' || d?.type === 'delivery') return d.type;
  return order && PICKUP_STATUSES.includes(order.status) ? 'pickup' : 'delivery';
};

// Décalage stable (même commande => mêmes coordonnées de repli à chaque rendu)
const stableOffset = (id: number | string, salt: number): number => {
  const s = `${id}-${salt}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.04;
};

/* ============================================================
   PROPS
============================================================ */
interface DeliveriesAndPickupsTabProps {
  orders: any[]; users: any[]; deliveries: any[]; queryClient: QueryClient;
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export const DeliveriesAndPickupsTab: React.FC<DeliveriesAndPickupsTabProps> = ({ orders, users, deliveries, queryClient }) => {
  const { toast } = useToast();
  const safeOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const safeDeliveries = useMemo(() => (Array.isArray(deliveries) ? deliveries : []), [deliveries]);

  const orderById = useMemo(() => new Map<number, any>(safeOrders.map((o: any) => [Number(o.id), o])), [safeOrders]);
  const userById = useMemo(() => new Map<number, any>(safeUsers.map((u: any) => [Number(u.id), u])), [safeUsers]);

  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoneData, setZoneData] = useState<RouteZone[]>([]);
  const generationLockRef = useRef(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [undoStack, setUndoStack] = useState<RouteZone[][]>([]);
  const [redoStack, setRedoStack] = useState<RouteZone[][]>([]);

  const [isAssignDeliveryOpen, setIsAssignDeliveryOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isAssignPickupOpen, setIsAssignPickupOpen] = useState(false);
  const [rescheduleOrder, setRescheduleOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<any>(null);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState<any>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const [readyOrdersPage, setReadyOrdersPage] = useState(1);
  const [pickupOrdersPage, setPickupOrdersPage] = useState(1);
  const [deliveryPlanningPage, setDeliveryPlanningPage] = useState(1);
  const [selectedPlanningDriver, setSelectedPlanningDriver] = useState<string>("all");
  const [selectedPlanningWeek, setSelectedPlanningWeek] = useState<Date>(new Date());
  const [readySearch, setReadySearch] = useState('');
  const [pickupSearch, setPickupSearch] = useState('');
  const [pickupStatusFilter, setPickupStatusFilter] = useState<string>("all");

  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    algorithm: 'capacity', maxRouteTime: 8, balanceWorkload: true,
    returnToStart: true, avoidTraffic: false, maxStopsPerRoute: 15,
    minStopDuration: 10, respectTimeWindows: true, avoidTolls: false,
    vehicleType: 'car', cargoPriority: 'balanced', weatherCondition: 'normal',
    trafficCondition: 'normal', fuelEfficiency: 8.5, co2Reduction: true,
    breakDuration: 30, maxWorkingHours: 10, startLocation: 'sv_pressing',
    depotLocation: SV_PRESSING_LOCATION, svPressingLocation: SV_PRESSING_LOCATION,
    capacityThreshold: 80,
  });

  // Reset pagination du planning quand le filtre change
  useEffect(() => { setDeliveryPlanningPage(1); }, [selectedPlanningDriver, selectedPlanningWeek]);

  const deliveryPersons = useMemo(() => safeUsers.filter((u: any) => u.role === 'delivery' && u.isActive), [safeUsers]);
  const getDriverVehicle = useCallback((driver: any) => {
    const vehicleType = driver?.vehicleType || 'car';
    const vehicle = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.car;
    const capacity = Number(driver?.capacityInItems) > 0 ? Number(driver.capacityInItems) : vehicle.capacity;
    return { ...vehicle, vehicleType, capacity };
  }, []);

  /* ------------------------------------------------------------
     PLANNING UNIFIÉ : missions existantes + ramassages prévus sur les commandes
     - lecture seule : ne crée rien, ne modifie aucune commande
     - dédoublonné par commande + type + jour
  ------------------------------------------------------------ */
  const planningItems = useMemo((): PlanningItem[] => {
    const seen = new Set<string>();
    const items: PlanningItem[] = [];

    for (const d of safeDeliveries) {
      const orderId = getTaskOrderId(d);
      const dateKey = toDateKey(getTaskDateRaw(d));
      if (!Number.isFinite(orderId) || !dateKey) continue;
      const type = resolveTaskType(d, orderById.get(orderId));
      const key = `${orderId}|${type}|${dateKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        key, id: `d-${d.id ?? key}`, source: 'delivery', orderId, type, dateKey,
        date: new Date(getTaskDateRaw(d)), driverId: getTaskDriverId(d), status: d.status || 'scheduled',
      });
    }

    for (const order of safeOrders) {
      if (!PICKUP_STATUSES.includes(order.status) || !order.scheduledPickupDate) continue;
      const orderId = Number(order.id);
      const dateKey = toDateKey(order.scheduledPickupDate);
      if (!Number.isFinite(orderId) || !dateKey) continue;
      const key = `${orderId}|pickup|${dateKey}`;
      if (seen.has(key)) continue; // déjà couvert par une mission réelle
      seen.add(key);
      items.push({
        key, id: `o-${orderId}`, source: 'order', orderId, type: 'pickup', dateKey,
        date: new Date(order.scheduledPickupDate), driverId: null, status: 'unassigned',
      });
    }
    for (const order of safeOrders) {
      if (!READY_STATUSES.includes(order.status) || !order.scheduledDeliveryDate) continue;
      const orderId = Number(order.id);
      const dateKey = toDateKey(order.scheduledDeliveryDate);
      if (!Number.isFinite(orderId) || !dateKey) continue;
      const key = `${orderId}|delivery|${dateKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        key, id: `o-d-${orderId}`, source: 'order', orderId, type: 'delivery', dateKey,
        date: new Date(order.scheduledDeliveryDate), driverId: null, status: 'unassigned',
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [safeDeliveries, safeOrders, orderById]);

  const tomorrowKey = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isTodayDate = (v: any) => toDateKey(v) === todayKey;

  // Missions du jour : missions réelles d'aujourd'hui + commandes dues (ou en retard) pas encore affectées
  const todayItems = useMemo(() => {
    const realToday = new Set(planningItems.filter(i => i.source === 'delivery' && i.dateKey === todayKey).map(i => `${i.orderId}|${i.type}`));
    return planningItems.filter(i =>
      i.dateKey === todayKey ||
      (i.source === 'order' && i.dateKey < todayKey && !realToday.has(`${i.orderId}|${i.type}`))
    );
  }, [planningItems, todayKey]);
  const tomorrowPickups = useMemo(
    () => planningItems.filter(i => i.type === 'pickup' && i.dateKey === tomorrowKey),
    [planningItems, tomorrowKey]
  );

  const matchesPlanningDriver = useCallback((item: PlanningItem) => {
    if (selectedPlanningDriver === 'all') return true;
    return item.driverId !== null && item.driverId === Number(selectedPlanningDriver);
  }, [selectedPlanningDriver]);

  const weekItems = useMemo(() => {
    const weekStart = startOfWeek(selectedPlanningWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedPlanningWeek, { weekStartsOn: 1 });
    return planningItems.filter(i => i.date >= weekStart && i.date <= weekEnd && matchesPlanningDriver(i));
  }, [planningItems, selectedPlanningWeek, matchesPlanningDriver]);

  /* ------------------------------------------------------------
     Création des tâches : jamais de doublon (commande + type + jour),
     ne touche ni aux commandes ni aux missions d'un autre jour.
  ------------------------------------------------------------ */
  const findExistingTask = useCallback((orderId: number, type: TaskType, date: Date) => {
    const dateKey = toDateKey(date);
    return safeDeliveries.find((d: any) =>
      getTaskOrderId(d) === orderId &&
      toDateKey(getTaskDateRaw(d)) === dateKey &&
      resolveTaskType(d, orderById.get(orderId)) === type
    );
  }, [safeDeliveries, orderById]);

  const createGeneratedTasks = useCallback(async (routes: RouteZone[], targetDate: Date) => {
    const tasks = routes.flatMap(route => route.stops.filter(stop => !stop.isVirtualStop).map(stop => ({
      orderId: Number(stop.id), deliveryPersonId: Number(route.driver.id),
      type: (stop.type === 'pickup' ? 'pickup' : 'delivery') as TaskType,
      scheduledDate: targetDate,
      notes: `Tournee generee automatiquement - ${route.driver.name} - ${route.driver.vehicleType || 'vehicule'}`,
    })));

    const handled = new Set<string>(); // anti-doublon au sein du même lot
    let created = 0; let reassigned = 0; let skipped = 0;

    for (const task of tasks) {
      if (!Number.isFinite(task.orderId) || !Number.isFinite(task.deliveryPersonId)) continue;
      const batchKey = `${task.orderId}|${task.type}`;
      if (handled.has(batchKey)) { skipped++; continue; }
      handled.add(batchKey);

      const existing = findExistingTask(task.orderId, task.type, targetDate);
      const existingDriverId = existing ? getTaskDriverId(existing) : null;
      try {
        if (existing?.id && existingDriverId !== task.deliveryPersonId) {
          await apiRequest('PATCH', `/api/deliveries/${existing.id}`, { deliveryPersonId: task.deliveryPersonId, scheduledDate: task.scheduledDate, notes: task.notes });
          reassigned++;
        } else if (!existing?.id) {
          await apiRequest('POST', '/api/deliveries', task);
          created++;
        } else {
          skipped++;
        }
      } catch (error) { console.error('Erreur synchronisation mission automatique', task, error); }
    }
    return { created, reassigned, skipped };
  }, [findExistingTask]);

  const readyToDeliverOrders = useMemo(() => safeOrders.filter((order: any) => READY_STATUSES.includes(order.status)), [safeOrders]);
  const pickupOrders = useMemo(() => safeOrders.filter((order: any) => PICKUP_STATUSES.includes(order.status)), [safeOrders]);

  const filteredPickupOrders = useMemo(() => {
    let filtered = [...pickupOrders];
    if (pickupStatusFilter === 'today') {
      filtered = filtered.filter((order: any) => order.scheduledPickupDate && isSameDay(new Date(order.scheduledPickupDate), new Date()));
    } else if (pickupStatusFilter === 'tomorrow') {
      const tomorrow = addDays(new Date(), 1);
      filtered = filtered.filter((order: any) => order.scheduledPickupDate && isSameDay(new Date(order.scheduledPickupDate), tomorrow));
    } else if (pickupStatusFilter === 'late') {
      filtered = filtered.filter((order: any) => {
        const pickupDate = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
        return pickupDate && new Date() > pickupDate && order.status === 'pickup_late';
      });
    }
    if (pickupSearch.trim()) {
      const query = pickupSearch.toLowerCase();
      filtered = filtered.filter((order: any) => {
        const client = userById.get(Number(order.clientId));
        return order.id.toString().includes(query) || client?.fullName?.toLowerCase().includes(query);
      });
    }
    return filtered;
  }, [pickupOrders, pickupStatusFilter, pickupSearch, userById]);

  const filteredReadyOrders = useMemo(() => {
    if (!readySearch.trim()) return readyToDeliverOrders;
    const q = readySearch.toLowerCase();
    return readyToDeliverOrders.filter((o: any) => {
      const client = userById.get(Number(o.clientId));
      return o.id.toString().includes(q) || client?.fullName?.toLowerCase().includes(q);
    });
  }, [readyToDeliverOrders, readySearch, userById]);

  const getCoordsFromAddress = useCallback((address: string): Coords | null => {
    if (!address) return null;
    const addressLower = address.toLowerCase().trim();
    for (const [key, coords] of Object.entries(ANTANANARIVO_NEIGHBORHOODS)) {
      const keyLower = key.toLowerCase();
      if (addressLower.includes(keyLower) || keyLower.includes(addressLower)) return coords as Coords;
      const normalizedKey = keyLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedAddress = addressLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedAddress.includes(normalizedKey) || normalizedKey.includes(normalizedAddress)) return coords as Coords;
    }
    return null;
  }, []);

  const resolveClientCoords = useCallback((client: any, orderId: number | string): Coords => {
    const address = client?.addressDetails || client?.address || '';
    return getCoordsFromAddress(address) || getCoordsFromAddress(client?.neighborhood || '') || {
      lat: DEFAULT_CENTER.lat + stableOffset(orderId, 1),
      lng: DEFAULT_CENTER.lng + stableOffset(orderId, 2),
    };
  }, [getCoordsFromAddress]);

  const calculateDistance = useCallback((p1: Coords, p2: Coords): number => {
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // Commandes à traiter aujourd'hui (ramassages + livraisons), retards des 7 derniers jours inclus
  const dueTodayOrderIds = useMemo(() => {
    const oldest = format(addDays(new Date(), -7), 'yyyy-MM-dd');
    const isDue = (v: any) => { const k = toDateKey(v); return !!k && k <= todayKey && k >= oldest; };
    return safeOrders.filter((o: any) => {
      if (PICKUP_STATUSES.includes(o.status)) return isDue(o.scheduledPickupDate);
      if (READY_STATUSES.includes(o.status)) return isDue(o.scheduledDeliveryDate);
      return false;
    }).map((o: any) => Number(o.id));
  }, [safeOrders, todayKey]);

  // Sélection AUTOMATIQUE : tous les livreurs actifs + toutes les commandes du jour.
  // Elle reste automatique tant que l'admin ne touche pas à la sélection.
  const selectionTouchedRef = useRef(false);
  const zonesDirtyRef = useRef(false); // true = l'admin a modifié les tournées à la main
  const touchSelection = () => { selectionTouchedRef.current = true; zonesDirtyRef.current = false; };
  const applyAutoSelection = useCallback(() => {
    selectionTouchedRef.current = false;
    zonesDirtyRef.current = false;
    setSelectedDrivers(deliveryPersons);
    setSelectedOrderIds(dueTodayOrderIds);
  }, [deliveryPersons, dueTodayOrderIds]);
  useEffect(() => {
    if (selectionTouchedRef.current) return;
    setSelectedDrivers(deliveryPersons);
    setSelectedOrderIds(dueTodayOrderIds);
  }, [deliveryPersons, dueTodayOrderIds]);

  // Tournées du jour regroupées par livreur, arrêts classés du plus proche au plus lointain (depuis le pressing)
  const todayGroups = useMemo(() => {
    const byDriver = new Map<string, PlanningItem[]>();
    for (const item of todayItems) {
      const k = item.driverId !== null ? String(item.driverId) : 'none';
      byDriver.set(k, [...(byDriver.get(k) || []), item]);
    }
    const coordsOf = (item: PlanningItem): Coords | null => {
      const order = orderById.get(item.orderId);
      const client = order ? userById.get(Number(order.clientId)) : null;
      return getCoordsFromAddress(client?.addressDetails || '') || getCoordsFromAddress(client?.neighborhood || '') || null;
    };
    const sortNearest = (list: PlanningItem[]) => {
      const pending = list.map(i => ({ i, c: coordsOf(i) }));
      const located = pending.filter(p => p.c);
      const unknown = pending.filter(p => !p.c).map(p => p.i);
      const out: PlanningItem[] = [];
      let pos: Coords = SV_PRESSING_LOCATION;
      while (located.length) {
        let bi = 0, bd = Infinity;
        located.forEach((p, idx) => { const d = calculateDistance(pos, p.c as Coords); if (d < bd) { bd = d; bi = idx; } });
        const [next] = located.splice(bi, 1);
        out.push(next.i); pos = next.c as Coords;
      }
      return [...out, ...unknown];
    };
    const groups = Array.from(byDriver.entries())
      .filter(([k]) => k !== 'none')
      .map(([k, list]) => ({ driver: userById.get(Number(k)) || null, driverId: Number(k), items: sortNearest(list) }))
      .sort((a, b) => (a.driver?.fullName || '').localeCompare(b.driver?.fullName || ''));
    const unassigned = byDriver.get('none') || [];
    return { groups, unassigned };
  }, [todayItems, orderById, userById, getCoordsFromAddress, calculateDistance]);

  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
  }, []);

  const calculateCO2 = useCallback((distance: number, vehicleType: string): number => {
    const vehicle = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.car;
    return Math.round(distance * vehicle.co2PerKm);
  }, []);

  const calculateEfficiency = useCallback((stops: RouteStopWithDisplay[], distance: number): number => {
    const realStops = stops.filter(s => !s.isVirtualStop);
    if (realStops.length === 0) return 0;
    const stopsPerKm = realStops.length / Math.max(1, distance);
    return Math.min(100, Math.max(30, Math.round(stopsPerKm * 40 + 50)));
  }, []);

  const generateOptimizedRoutes = useCallback((drivers: any[], orderIds: number[], config: OptimizationConfig, silent = false): RouteZone[] => {
    const ordersToOptimize = orderIds.map(id => {
      const order = orderById.get(Number(id));
      if (!order) return null;
      const client = userById.get(Number(order.clientId));
      const isPickup = PICKUP_STATUSES.includes(order.status || '');
      const coords = getCoordsFromAddress(client?.addressDetails || '') || getCoordsFromAddress(client?.neighborhood || '') || DEFAULT_CENTER;
      return {
        id: order.id, clientName: client?.fullName || `Client ${id}`,
        type: isPickup ? 'pickup' as const : 'delivery' as const,
        itemCount: Math.max(0, Number(order.itemCount) || 0), coords,
        priority: Number(order.priority) || 1,
        timeWindowStart: isPickup ? order.pickupTimeWindowStart : order.deliveryTimeWindowStart,
        timeWindowEnd: isPickup ? order.pickupTimeWindowEnd : order.deliveryTimeWindowEnd,
        status: order.status || 'pending',
      };
    }).filter(Boolean) as any[];

    const driverCapacities = drivers.map((driver: any) => {
      const vehicle = getDriverVehicle(driver);
      const driverAddress = driver?.addressDetails || driver?.address || driver?.neighborhood || driver?.addressLine || '';
      const startCoords = getCoordsFromAddress(driverAddress) || config.svPressingLocation;
      return { ...driver, vehicleType: vehicle.vehicleType, capacity: vehicle.capacity, currentLoad: 0, startLoad: 0, stops: [] as any[], startCoords, currentPos: startCoords, totalDistance: 0, totalTime: 0, assignedWeight: 0 };
    });
    if (!ordersToOptimize.length || !driverCapacities.length) return [];

    const maxCapacity = Math.max(...driverCapacities.map(d => d.capacity));
    const impossibleOrders = ordersToOptimize.filter(o => o.itemCount > maxCapacity);
    const assignableOrders = ordersToOptimize.filter(o => o.itemCount <= maxCapacity);
    const deliveries = assignableOrders.filter(o => o.type === 'delivery').sort((a, b) => b.priority - a.priority || b.itemCount - a.itemCount);
    const pickups = assignableOrders.filter(o => o.type === 'pickup').sort((a, b) => b.priority - a.priority || b.itemCount - a.itemCount);
    const unassigned: any[] = [];

    const assignOrder = (order: any, initialDelivery: boolean) => {
      let best: any = null, bestScore = -Infinity;
      for (const driver of driverCapacities) {
        if (driver.stops.length >= config.maxStopsPerRoute) continue;
        const proposedLoad = initialDelivery ? driver.startLoad + order.itemCount : driver.currentLoad + order.itemCount;
        if (proposedLoad > driver.capacity) continue;
        const distance = calculateDistance(driver.currentPos, order.coords);
        const loadRatio = proposedLoad / Math.max(1, driver.capacity);
        const balance = driver.assignedWeight / Math.max(1, driver.capacity);
        let score = Math.max(0, 100 - distance * 12) * 0.45 + Math.max(0, 100 - loadRatio * 100) * 0.2 + Math.max(0, 100 - balance * 100) * 0.2 + order.priority * 25 * 0.15;
        if (order.timeWindowStart && config.respectTimeWindows) score += 15;
        if (order.status === 'pickup_late') score += 40;
        if (score > bestScore) { bestScore = score; best = driver; }
      }
      if (!best) return false;
      const vehicle = getDriverVehicle(best);
      const distance = calculateDistance(best.currentPos, order.coords);
      best.totalDistance += distance;
      best.totalTime += (distance / Math.max(5, vehicle.speed)) * 60 + config.minStopDuration;
      if (initialDelivery) { best.startLoad += order.itemCount; best.currentLoad = best.startLoad; }
      else best.currentLoad += order.itemCount;
      best.assignedWeight += order.itemCount;
      best.stops.push({ ...order, sequence: best.stops.length + 1, estimatedArrival: formatDuration(best.totalTime) });
      best.currentPos = order.coords;
      if (!initialDelivery && best.currentLoad / Math.max(1, best.capacity) * 100 >= config.capacityThreshold) {
        const d = calculateDistance(best.currentPos, config.svPressingLocation);
        best.totalDistance += d;
        best.totalTime += (d / Math.max(5, vehicle.speed)) * 60 + 10;
        best.currentLoad = 0;
        best.currentPos = config.svPressingLocation;
      }
      return true;
    };

    deliveries.forEach(o => { if (!assignOrder(o, true)) unassigned.push(o); });
    pickups.forEach(o => { if (!assignOrder(o, false)) unassigned.push(o); });

    const routes: RouteZone[] = [];
    for (const driver of driverCapacities) {
      if (!driver.stops.length) continue;
      const vehicle = getDriverVehicle(driver);
      const startLoad = driver.startLoad;
      const endLoad = driver.currentLoad;
      if (config.returnToStart) {
        const d = calculateDistance(driver.currentPos, config.svPressingLocation);
        driver.totalDistance += d;
        driver.totalTime += (d / Math.max(5, vehicle.speed)) * 60;
      }
      const fullStops: RouteStopWithDisplay[] = [{
        id: 'depart', clientName: `Départ du siège - ${vehicle.label}`,
        type: 'depart', itemCount: 0, estimatedArrival: `Charge initiale: ${startLoad} kg`,
        coords: config.svPressingLocation, status: 'Départ tournée', priority: 0, sequence: 0, isVirtualStop: true,
      }];
      driver.stops.forEach((stop: any, i: number) => fullStops.push({ ...stop, sequence: i + 1, isVirtualStop: false }));
      if (config.returnToStart) fullStops.push({
        id: 'retour', clientName: 'Retour au siège', type: 'retour', itemCount: 0,
        estimatedArrival: formatDuration(driver.totalTime), coords: config.svPressingLocation,
        status: endLoad === 0 ? 'Véhicule vide' : `${endLoad} kg restants`, priority: 0,
        sequence: driver.stops.length + 1, isVirtualStop: true,
      });
      routes.push({
        id: `route-${Date.now()}-${driver.id}-${Math.random().toString(36).slice(2, 11)}`,
        driver: { id: driver.id, name: driver.fullName, vehicleType: vehicle.vehicleType, capacityInItems: vehicle.capacity, currentLoad: endLoad, startCoords: driver.startCoords },
        stops: fullStops, distanceKm: Number(driver.totalDistance.toFixed(1)),
        totalDuration: formatDuration(driver.totalTime),
        efficiencyScore: calculateEfficiency(fullStops, driver.totalDistance),
        color: COLORS[routes.length % COLORS.length],
        workloadPercentage: Math.min(100, Math.round(driver.stops.length / Math.max(1, config.maxStopsPerRoute) * 100)),
        totalItems: driver.stops.reduce((sum: number, s: any) => sum + s.itemCount, 0),
        co2Emission: calculateCO2(driver.totalDistance, vehicle.vehicleType),
        isModified: false, startLoad, endLoad, hasReturnToBase: config.returnToStart,
      });
    }
    if (!silent && (impossibleOrders.length || unassigned.length)) {
      const ids = [...impossibleOrders, ...unassigned].map(o => `#${o.id}`).join(', ');
      toast({ title: 'Certaines commandes non affectées', description: `Capacité ou disponibilité insuffisante : ${ids}`, variant: 'destructive' });
    }
    return routes;
  }, [orderById, userById, getCoordsFromAddress, calculateDistance, formatDuration, calculateCO2, calculateEfficiency, getDriverVehicle, toast]);

  // Aperçu AUTOMATIQUE des tournées (aucune écriture en base) : recalculé quand la sélection change
  const autoZones = useMemo(
    () => generateOptimizedRoutes(selectedDrivers, selectedOrderIds, optimizationConfig, true),
    [selectedDrivers, selectedOrderIds, optimizationConfig, generateOptimizedRoutes]
  );
  useEffect(() => {
    if (zonesDirtyRef.current) return;
    setZoneData(autoZones);
  }, [autoZones]);

  // Livreur proposé par l'aperçu pour chaque commande (affiché tant que la mission n'est pas enregistrée)
  const suggestedDriver = useMemo(() => {
    const m = new Map<string, string>();
    zoneData.forEach(z => z.stops.forEach(st => {
      if (!st.isVirtualStop) m.set(`${Number(st.id)}|${st.type === 'pickup' ? 'pickup' : 'delivery'}`, z.driver.name);
    }));
    return m;
  }, [zoneData]);

  // ENREGISTREMENT AUTOMATIQUE : les missions du jour sans livreur reçoivent celui proposé par l'aperçu.
  // - ne crée que pour les commandes dues aujourd'hui
  // - ne touche JAMAIS une mission déjà assignée (même manuellement)
  const persistingRef = useRef(false);
  const lastPersistTryRef = useRef(0);
  useEffect(() => {
    if (persistingRef.current || zonesDirtyRef.current || zoneData.length === 0) return;
    if (Date.now() - lastPersistTryRef.current < 15000) return;
    const due = new Set(dueTodayOrderIds);
    const now = new Date();
    const work: Array<{ orderId: number; type: TaskType; driverId: number; routeName: string; vehicle?: string; existingId?: number }> = [];
    for (const route of zoneData) {
      for (const st of route.stops) {
        if (st.isVirtualStop) continue;
        const orderId = Number(st.id);
        if (!Number.isFinite(orderId) || !due.has(orderId)) continue;
        const type: TaskType = st.type === 'pickup' ? 'pickup' : 'delivery';
        const existing = findExistingTask(orderId, type, now);
        if (existing && getTaskDriverId(existing) !== null) continue; // déjà assignée
        work.push({ orderId, type, driverId: Number(route.driver.id), routeName: route.driver.name, vehicle: route.driver.vehicleType, existingId: existing?.id });
      }
    }
    if (work.length === 0) return;
    persistingRef.current = true;
    lastPersistTryRef.current = Date.now();
    (async () => {
      let ok = 0;
      for (const w of work) {
        const notes = `Affectation auto (proximité) - ${w.routeName} - ${w.vehicle || 'vehicule'}`;
        try {
          if (w.existingId) await apiRequest('PATCH', `/api/deliveries/${w.existingId}`, { deliveryPersonId: w.driverId, notes });
          else await apiRequest('POST', '/api/deliveries', { orderId: w.orderId, deliveryPersonId: w.driverId, type: w.type, scheduledDate: new Date(), notes });
          ok++;
        } catch (e) { console.error('Affectation automatique impossible', w, e); }
      }
      persistingRef.current = false;
      if (ok > 0) {
        toast({ title: 'Missions assignées automatiquement', description: `${ok} mission(s) affectée(s) au livreur le plus proche` });
        queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      }
    })();
  }, [zoneData, safeDeliveries, dueTodayOrderIds, findExistingTask, toast, queryClient]);

  const ordersForMap = useMemo((): any[] => {
    const nonDelivered = safeOrders.filter((order: any) => !DONE_STATUSES.includes(order.status));
    const filtered = dateFilter ? nonDelivered.filter((order: any) => {
      const pickupDate = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
      const deliveryDate = order.scheduledDeliveryDate ? new Date(order.scheduledDeliveryDate) : null;
      return (pickupDate && isSameDay(pickupDate, dateFilter)) || (deliveryDate && isSameDay(deliveryDate, dateFilter));
    }) : nonDelivered;
    return filtered.map((order: any) => {
      const client = userById.get(Number(order.clientId));
      const coords = resolveClientCoords(client, order.id);
      const isPickup = PICKUP_STATUSES.includes(order.status);
      return {
        id: order.id, clientName: client?.fullName || `Client ${order.id}`,
        type: isPickup ? 'pickup' : 'delivery', coords, status: order.status,
        itemCount: order.itemCount || 40,
        estimatedArrival: isPickup ? (order.pickupTimeWindowStart || '09:00') : (order.deliveryTimeWindowStart || '14:00'),
        timeWindowStart: order.pickupTimeWindowStart || order.deliveryTimeWindowStart,
        timeWindowEnd: order.pickupTimeWindowEnd || order.deliveryTimeWindowEnd,
        scheduledDate: isPickup ? order.scheduledPickupDate : order.scheduledDeliveryDate,
        priority: order.priority || 1,
      };
    });
  }, [safeOrders, userById, dateFilter, resolveClientCoords]);

  const dueTodaySet = useMemo(() => new Set(dueTodayOrderIds), [dueTodayOrderIds]);

  // Liste de sélection : respecte le filtre de date
  const allAvailableOrdersForSelection = useMemo(() => {
    return safeOrders.filter((order: any) => !DONE_STATUSES.includes(order.status))
      .filter((order: any) => {
        if (!dateFilter) return true;
        const p = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
        const d = order.scheduledDeliveryDate ? new Date(order.scheduledDeliveryDate) : null;
        return (p && isSameDay(p, dateFilter)) || (d && isSameDay(d, dateFilter));
      })
      .map((order: any) => {
        const client = userById.get(Number(order.clientId));
        const isPickup = PICKUP_STATUSES.includes(order.status);
        return {
          id: order.id, clientName: client?.fullName || `Client ${order.id}`,
          type: isPickup ? 'pickup' : 'delivery', status: order.status,
          itemCount: order.itemCount || 40,
          scheduledDate: isPickup ? order.scheduledPickupDate : order.scheduledDeliveryDate,
          priority: order.priority || 1,
          dueToday: dueTodaySet.has(Number(order.id)),
        };
      })
      .sort((a: any, b: any) => Number(b.dueToday) - Number(a.dueToday));
  }, [safeOrders, userById, dateFilter, dueTodaySet]);

  const globalStats = useMemo(() => {
    const nonDelivered = safeOrders.filter((o: any) => !DONE_STATUSES.includes(o.status));
    const pickups = nonDelivered.filter((o: any) => PICKUP_STATUSES.includes(o.status));
    const ready = nonDelivered.filter((o: any) => READY_STATUSES.includes(o.status));
    const latePickups = pickups.filter((o: any) => o.status === 'pickup_late').length;
    return {
      totalPending: nonDelivered.length,
      pickups: pickups.length,
      readyForDelivery: ready.length,
      latePickups,
      driversAvailable: deliveryPersons.length,
      routesGenerated: zoneData.length,
      totalStops: zoneData.reduce((sum, r) => sum + r.stops.filter(s => !s.isVirtualStop).length, 0),
      totalDistance: zoneData.reduce((sum, r) => sum + r.distanceKm, 0),
      avgEfficiency: zoneData.length > 0 ? Math.round(zoneData.reduce((sum, r) => sum + r.efficiencyScore, 0) / zoneData.length) : 0,
    };
  }, [safeOrders, deliveryPersons, zoneData]);

  /* ------------------------------------------------------------
     UNDO / REDO : on empile l'état AVANT modification
  ------------------------------------------------------------ */
  const pushToUndoStack = useCallback((previousZones: RouteZone[]) => {
    setUndoStack(prev => [...prev.slice(-49), previousZones.map(z => ({ ...z }))]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    zonesDirtyRef.current = true;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, zoneData.map(z => ({ ...z }))]);
    setZoneData(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, zoneData]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    zonesDirtyRef.current = true;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, zoneData.map(z => ({ ...z }))]);
    setZoneData(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, zoneData]);

  const optimizeRoutes = useCallback(async () => {
    if (generationLockRef.current) return; // anti double-clic
    if (selectedOrderIds.length === 0 || selectedDrivers.length === 0) {
      toast({ title: "Sélection requise", description: "Veuillez sélectionner des commandes et des livreurs", variant: "destructive" });
      return;
    }
    generationLockRef.current = true;
    setIsGenerating(true);
    try {
      const routes = generateOptimizedRoutes(selectedDrivers, selectedOrderIds, optimizationConfig);
      pushToUndoStack(zoneData);
      setZoneData(routes);
      const { created, reassigned, skipped } = await createGeneratedTasks(routes, new Date());
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      const totalStops = routes.reduce((sum, r) => sum + r.stops.filter(s => !s.isVirtualStop).length, 0);
      toast({
        title: "Tâches générées avec succès",
        description: `${routes.length} tournée(s) - ${totalStops} arrêt(s) · ${created} créée(s), ${reassigned} réassignée(s), ${skipped} déjà existante(s)`,
      });
    } catch (error: any) {
      toast({ title: "Erreur de génération", description: error?.message || "Impossible de générer les tâches", variant: "destructive" });
    } finally {
      generationLockRef.current = false;
      setIsGenerating(false);
    }
  }, [selectedOrderIds, selectedDrivers, optimizationConfig, toast, generateOptimizedRoutes, pushToUndoStack, zoneData, createGeneratedTasks, queryClient]);

  const assignDeliveryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deliveries', data),
    onSuccess: () => {
      toast({ title: "Assignation réussie" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setIsAssignDeliveryOpen(false);
      setIsAssignPickupOpen(false);
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  // Assignation manuelle avec garde anti-doublon (commande + type + jour)
  const submitAssignment = useCallback((target: any, type: TaskType) => {
    if (!target || !target.deliveryPersonId) {
      toast({ title: "Sélection requise", description: type === 'pickup' ? "Sélectionnez un agent" : "Sélectionnez un livreur", variant: "destructive" });
      return;
    }
    const scheduledDate: Date = target.scheduledDate || new Date();
    const existing = findExistingTask(Number(target.id), type, scheduledDate);
    if (existing) {
      toast({
        title: "Déjà planifié",
        description: `Une mission ${type === 'pickup' ? 'de ramassage' : 'de livraison'} existe déjà pour la commande #${target.id} ce jour-là.`,
        variant: "destructive",
      });
      return;
    }
    assignDeliveryMutation.mutate({
      orderId: target.id, deliveryPersonId: target.deliveryPersonId,
      type, scheduledDate, notes: target.notes || '',
    });
  }, [findExistingTask, assignDeliveryMutation, toast]);

  const [assignError, setAssignError] = useState<string | null>(null);
  const [lastAssign, setLastAssign] = useState<{ assigned: number; unassigned: number } | null>(null);
  const autoAssignMutation = useMutation({
    mutationFn: async (_silent?: boolean) => (await apiRequest('POST', '/api/deliveries/auto-assign')).json(),
    onSuccess: (data: any, silent) => {
      const sm = data?.summary || {};
      setAssignError(null);
      setLastAssign({ assigned: sm.assigned || 0, unassigned: sm.unassigned || 0 });
      if (!silent || sm.assigned > 0) {
        toast({
          title: "Affectation automatique terminée",
          description: `${sm.assigned || 0} assignée(s) · ${sm.alreadyAssigned || 0} déjà assignée(s)${sm.unassigned ? ` · ${sm.unassigned} sans livreur disponible` : ''}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error: any, silent) => {
      setAssignError(error?.message || 'Erreur inconnue');
      if (!silent) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // L'affectation est déclenchée AUTOMATIQUEMENT depuis cette page dès qu'une mission du jour n'a pas de livreur
  // (en plus du serveur qui la fait toutes les 15 minutes).
  const unassignedCountRef = useRef(0);
  const driversCountRef = useRef(0);
  const triggerAssignRef = useRef<() => void>(() => {});
  unassignedCountRef.current = todayGroups.unassigned.length;
  driversCountRef.current = deliveryPersons.length;
  triggerAssignRef.current = () => { if (!autoAssignMutation.isPending) autoAssignMutation.mutate(true); };
  useEffect(() => {
    const run = () => { if (unassignedCountRef.current > 0 && driversCountRef.current > 0) triggerAssignRef.current(); };
    const first = setTimeout(run, 1500);
    const t = setInterval(run, 60000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);

  // Rafraîchit les données chaque minute : l'affectation tourne côté serveur
  useEffect(() => {
    const t = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }, 60000);
    return () => clearInterval(t);
  }, [queryClient]);

  const updateOrderMutation = useMutation({
    mutationFn: (data: { orderId: number; updates: any }) => apiRequest("PATCH", `/api/orders/${data.orderId}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setRescheduleOrder(null);
      toast({ title: "Planification mise à jour" });
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const generateOrdersMutation = useMutation({
    mutationFn: async () => (await apiRequest('POST', '/api/orders/generate-manual')).json(),
    onSuccess: (data: any) => {
      toast({ title: "Commandes générées", description: `${data?.summary?.generated || 0} commandes` });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      setShowGenerateConfirm(false);
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const getPaginatedData = useCallback((data: any[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, []);

  const getTotalPages = useCallback((data: any[]) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)), []);

  const exportRoutes = useCallback((exportFormat: 'json' | 'csv') => {
    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(zoneData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tournees-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      let csv = 'Tournee,Livreur,Sequence,Type,Client,Articles,Arrivee\n';
      zoneData.forEach((zone, zi) => {
        zone.stops.forEach(stop => {
          csv += [`Tournee ${zi + 1}`, esc(zone.driver.name), stop.sequence, stop.type, esc(stop.clientName), stop.itemCount, esc(stop.estimatedArrival)].join(',') + '\n';
        });
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tournees-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
    toast({ title: `Export ${exportFormat.toUpperCase()} réussi` });
  }, [zoneData, toast]);

  /* ------------------------------------------------------------
     Rendu d'une ligne du planning (missions + ramassages prévus)
  ------------------------------------------------------------ */
  const renderPlanningItem = (item: PlanningItem) => {
    const order = orderById.get(item.orderId);
    const client = order ? userById.get(Number(order.clientId)) : null;
    const driver = item.driverId !== null ? userById.get(item.driverId) : null;
    const isUnassigned = item.source === 'order';
    const statusLabel = isUnassigned ? 'À assigner' : (TASK_STATUS_LABEL[item.status] || item.status);
    const tone = isUnassigned ? 'amber' : item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'slate';
    return (
      <div key={item.key} className={cn("rounded-lg border p-3", isUnassigned ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white")}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-slate-900">{item.type === 'pickup' ? 'Ramassage' : 'Livraison'} #{item.orderId}</span>
            <Pill tone={tone as any}>{statusLabel}</Pill>
          </div>
          <p className="text-[11px] text-slate-500">{format(item.date, 'EEEE dd MMMM', { locale: fr })}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
          <div><p className="text-slate-500">Client</p><p className="font-medium text-slate-800">{client?.fullName || 'Inconnu'}</p></div>
          <div><p className="text-slate-500">Adresse</p><p className="truncate">{client?.addressDetails || client?.neighborhood || '-'}</p></div>
          <div><p className="text-slate-500">Livreur</p><p className="font-medium">{driver?.fullName || 'Non assigné'}</p></div>
          <div><p className="text-slate-500">Articles</p><p className="font-medium">{order?.itemCount || 0}</p></div>
        </div>
      </div>
    );
  };

  const renderTodayRow = (item: PlanningItem, seq?: number) => {
    const order = orderById.get(item.orderId);
    const client = order ? userById.get(Number(order.clientId)) : null;
    const overdue = item.dateKey < todayKey;
    const statusLabel = item.source === 'order' ? 'À assigner' : (TASK_STATUS_LABEL[item.status] || item.status);
    return (
      <div key={item.key} className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-2.5 py-2">
        {seq !== undefined && <span className="w-5 text-center text-[11px] font-mono font-semibold text-slate-400">{seq}</span>}
        <span className={cn("w-[68px] shrink-0 text-[11px] font-semibold", item.type === 'pickup' ? "text-amber-700" : "text-emerald-700")}>{item.type === 'pickup' ? 'Ramassage' : 'Livraison'}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-slate-900">#{item.orderId} · {client?.fullName || 'Inconnu'}</p>
          <p className="truncate text-[10.5px] text-slate-500">{client?.addressDetails || client?.neighborhood || '-'} · {order?.itemCount || 0} art.</p>
        </div>
        {overdue && <Pill tone="red">En retard</Pill>}
        {item.source === 'order' && suggestedDriver.get(`${item.orderId}|${item.type}`) && <Pill tone="brand">Proposé : {suggestedDriver.get(`${item.orderId}|${item.type}`)}</Pill>}
        <Pill tone={item.source === 'order' ? 'amber' : item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'blue'}>{statusLabel}</Pill>
      </div>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniKPI title="En attente" value={globalStats.totalPending} tone="brand" />
        <MiniKPI title="Ramassages" value={globalStats.pickups} subtitle={globalStats.latePickups > 0 ? `${globalStats.latePickups} en retard` : undefined} tone="amber" />
        <MiniKPI title="À livrer" value={globalStats.readyForDelivery} tone="green" />
        <MiniKPI title="Tournées" value={globalStats.routesGenerated} tone="purple" />
        <MiniKPI title="Distance" value={`${globalStats.totalDistance.toFixed(1)} km`} tone="blue" />
        <MiniKPI title="Efficacité" value={`${globalStats.avgEfficiency}%`} tone="green" />
      </div>

      <div className="overflow-x-auto">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <TabsTrigger value="today" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <span>Aujourd'hui</span>
              {todayItems.length > 0 && <span className="ml-1 rounded bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-700">{todayItems.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="optimization" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <span>Optimisation</span>
              {zoneData.length > 0 && <span className="ml-1 rounded bg-white/25 px-1.5 text-[10px] font-semibold">{zoneData.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="ready-orders" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <span>À livrer</span>
              {readyToDeliverOrders.length > 0 && <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">{readyToDeliverOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="pickup-orders" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <span>Ramassages</span>
              {pickupOrders.length > 0 && <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">{pickupOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="planning" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <span>Planning</span>
              {tomorrowPickups.length > 0 && <span className="ml-1 rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">{tomorrowPickups.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* ==================== AUJOURD'HUI ==================== */}
          <TabsContent value="today" className="mt-4 space-y-4">
            <Panel title="Tournées d'aujourd'hui"
                   subtitle={`${format(new Date(), 'EEEE dd MMMM', { locale: fr })} · ${todayItems.length} mission(s) · ${todayGroups.groups.length} livreur(s) mobilisé(s) sur ${deliveryPersons.length} · affectation automatique par proximité`}
                   action={<Button variant="outline" className={ui.btn} onClick={() => autoAssignMutation.mutate(false)} disabled={autoAssignMutation.isPending}>
                     {autoAssignMutation.isPending ? 'Affectation…' : 'Actualiser l\'affectation'}
                   </Button>}>
              {todayItems.length === 0 ? (
                <div className="text-center py-10"><p className="text-[13px] text-slate-500">Aucune mission prévue aujourd'hui</p></div>
              ) : (
                <div className="space-y-4">
                  {todayGroups.unassigned.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-[13px] font-semibold text-amber-800">En attente d'affectation ({todayGroups.unassigned.length})</h4>
                        <p className="text-[11px] text-amber-700">
                          {autoAssignMutation.isPending ? 'Affectation en cours…' : 'Enregistrement automatique en cours…'}
                        </p>
                      </div>
                      {deliveryPersons.length === 0 && <p className="mb-2 text-[11.5px] font-medium text-red-700">Aucun livreur actif : activez au moins un livreur pour lancer l'affectation.</p>}
                      {!assignError && lastAssign && lastAssign.unassigned > 0 && <p className="mb-2 text-[11.5px] text-amber-800">{lastAssign.unassigned} mission(s) sans livreur disponible (capacité ou nombre d'arrêts maximum atteint).</p>}
                      <div className="space-y-1.5">{todayGroups.unassigned.map(i => renderTodayRow(i))}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {todayGroups.groups.map(g => {
                      const items = g.items.reduce((sum, i) => sum + (Number(orderById.get(i.orderId)?.itemCount) || 0), 0);
                      const v = getDriverVehicle(g.driver);
                      return (
                        <div key={g.driverId} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8"><AvatarFallback className="bg-[#0B676E] text-[11px] font-semibold text-white">{g.driver?.fullName?.charAt(0) || 'L'}</AvatarFallback></Avatar>
                              <div>
                                <p className="text-[13px] font-semibold text-slate-900">{g.driver?.fullName || `Livreur #${g.driverId}`}</p>
                                <p className="text-[11px] text-slate-500">{v.label} · capacité {v.capacity}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <Pill tone="brand">{g.items.length} arrêt(s)</Pill>
                              <Pill tone="slate">{items} art.</Pill>
                            </div>
                          </div>
                          <div className="space-y-1.5">{g.items.map((i, idx) => renderTodayRow(i, idx + 1))}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Panel>
          </TabsContent>

          {/* ==================== OPTIMISATION ==================== */}
          <TabsContent value="optimization" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-1 space-y-4">
                <Panel title="Livreurs" subtitle={`${selectedDrivers.length}/${deliveryPersons.length} sélectionné(s)`}
                       action={<div className="flex gap-1">
                         <button onClick={() => { touchSelection(); setSelectedDrivers([...deliveryPersons]); }} className="text-[11px] text-[#0B676E] hover:underline">Tous</button>
                         <span className="text-slate-300">/</span>
                         <button onClick={() => { touchSelection(); setSelectedDrivers([]); }} className="text-[11px] text-red-600 hover:underline">Aucun</button>
                       </div>}>
                  <ScrollArea className="h-48 -m-2">
                    {deliveryPersons.length === 0 ? (
                      <p className="text-center text-[12.5px] text-slate-500 py-6">Aucun livreur actif</p>
                    ) : (
                      <div className="space-y-1 p-2">
                        {deliveryPersons.map((driver: any) => {
                          const active = selectedDrivers.some((d: any) => d.id === driver.id);
                          const v = getDriverVehicle(driver);
                          return (
                            <button key={driver.id} onClick={() => {
                              touchSelection();
                              setSelectedDrivers((prev: any[]) => prev.some((d: any) => d.id === driver.id) ? prev.filter((d: any) => d.id !== driver.id) : [...prev, driver]);
                            }} className={cn("w-full flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors", active ? "border-[#0B676E] bg-[#0B676E]/5" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50")}>
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className={cn("text-[10px] font-semibold", active ? "bg-[#0B676E] text-white" : "bg-slate-100 text-slate-600")}>
                                  {driver.fullName?.charAt(0) || 'L'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-medium text-slate-900">{driver.fullName}</p>
                                <p className="text-[10.5px] text-slate-500">{v.label} · {v.capacity} kg</p>
                              </div>
                              <Checkbox checked={active} className="pointer-events-none" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </Panel>

                <Panel title="Commandes" subtitle={`${selectedOrderIds.length} sélectionnée(s)`}
                       action={<div className="flex gap-1">
                         <button onClick={applyAutoSelection} className="text-[11px] font-semibold text-emerald-700 hover:underline">Aujourd'hui</button>
                         <span className="text-slate-300">/</span>
                         <button onClick={() => { touchSelection(); setSelectedOrderIds(allAvailableOrdersForSelection.map(o => o.id)); }} className="text-[11px] text-[#0B676E] hover:underline">Tout</button>
                         <span className="text-slate-300">/</span>
                         <button onClick={() => { touchSelection(); setSelectedOrderIds([]); }} className="text-[11px] text-red-600 hover:underline">Effacer</button>
                       </div>}>
                  <div className="mb-3 flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn(ui.input, "justify-start text-[12px]")}>
                          {dateFilter ? format(dateFilter, 'dd/MM/yyyy') : 'Toutes dates'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
                      </PopoverContent>
                    </Popover>
                    {dateFilter && <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)} className="h-8 w-8 p-0">×</Button>}
                  </div>
                  <ScrollArea className="h-48 -m-2">
                    {allAvailableOrdersForSelection.length === 0 ? (
                      <p className="text-center text-[12.5px] text-slate-500 py-6">Aucune commande disponible</p>
                    ) : (
                      <div className="space-y-1 p-2">
                        {allAvailableOrdersForSelection.map((order: any) => {
                          const active = selectedOrderIds.includes(order.id);
                          return (
                            <button key={order.id} onClick={() => {
                              touchSelection();
                              setSelectedOrderIds((prev: number[]) => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]);
                            }} className={cn("w-full flex items-center gap-2 rounded-lg border p-2 text-left transition-colors", active ? "border-[#0B676E] bg-[#0B676E]/5" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50")}>
                              <Checkbox checked={active} className="pointer-events-none" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn("h-1.5 w-1.5 rounded-full", order.type === 'pickup' ? "bg-amber-500" : "bg-emerald-500")} />
                                  <span className="text-[11.5px] font-medium truncate">#{order.id} {order.clientName}</span>
                                </div>
                                <p className="text-[10.5px] text-slate-500 ml-3">{order.type === 'pickup' ? 'Ramassage' : 'Livraison'} · {order.itemCount} art.{order.dueToday ? ' · Aujourd\'hui' : ''}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </Panel>

                <Panel title="Paramètres" subtitle="Configuration"
                       action={<button onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} className="text-[11px] text-slate-500 hover:text-slate-700">
                         {showAdvancedOptions ? '▲' : '▼'}
                       </button>}>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-[11.5px] text-slate-600">Seuil déclenchement</Label>
                        <span className="text-[11.5px] font-semibold text-slate-900">{optimizationConfig.capacityThreshold}%</span>
                      </div>
                      <Slider value={[optimizationConfig.capacityThreshold]} onValueChange={([v]) => setOptimizationConfig(prev => ({ ...prev, capacityThreshold: v }))} min={50} max={95} step={5} />
                      <p className="mt-1 text-[10.5px] text-slate-500">Au-delà, le livreur vide au pressing</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-[11.5px] text-slate-600">Temps max / tournée</Label>
                        <span className="text-[11.5px] font-semibold text-slate-900">{optimizationConfig.maxRouteTime}h</span>
                      </div>
                      <Slider value={[optimizationConfig.maxRouteTime]} onValueChange={([v]) => setOptimizationConfig(prev => ({ ...prev, maxRouteTime: v }))} min={2} max={12} step={0.5} />
                    </div>
                    {showAdvancedOptions && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11.5px] text-slate-600">Respect fenêtres horaires</Label>
                          <Switch checked={optimizationConfig.respectTimeWindows} onCheckedChange={(v) => setOptimizationConfig(prev => ({ ...prev, respectTimeWindows: v }))} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[11.5px] text-slate-600">Retour au pressing</Label>
                          <Switch checked={optimizationConfig.returnToStart} onCheckedChange={(v) => setOptimizationConfig(prev => ({ ...prev, returnToStart: v }))} />
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>

                <div className="space-y-2">
                  <Button className={cn(ui.btnPrimary, "w-full")} onClick={optimizeRoutes} disabled={isGenerating || selectedOrderIds.length === 0 || selectedDrivers.length === 0}>
                    {isGenerating ? 'Génération…' : selectedDrivers.length === 0 ? 'Sélectionnez livreurs' : selectedOrderIds.length === 0 ? 'Sélectionnez commandes' : `Enregistrer les affectations (${selectedOrderIds.length})`}
                  </Button>
                  <p className="text-[10.5px] text-slate-500">Les tournées s'affichent automatiquement. L'enregistrement est facultatif : le serveur affecte déjà les missions du jour toutes les 15 minutes.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportRoutes('json')} disabled={zoneData.length === 0} className={ui.btn}>JSON</Button>
                    <Button variant="outline" size="sm" onClick={() => exportRoutes('csv')} disabled={zoneData.length === 0} className={ui.btn}>CSV</Button>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-3 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                      <button onClick={() => setViewMode('map')} className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium", viewMode === 'map' ? "bg-[#0B676E] text-white" : "text-slate-600 hover:bg-slate-50")}>Carte</button>
                      <button onClick={() => setViewMode('list')} className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium", viewMode === 'list' ? "bg-[#0B676E] text-white" : "text-slate-600 hover:bg-slate-50")}>Liste</button>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                      <button onClick={handleUndo} disabled={undoStack.length === 0} className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40">Annuler</button>
                      <Separator orientation="vertical" className="mx-1 h-4 my-1" />
                      <button onClick={handleRedo} disabled={redoStack.length === 0} className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40">Rétablir</button>
                    </div>
                  </div>
                  {zoneData.length > 0 && <span className="text-[11.5px] text-slate-500">{globalStats.totalStops} arrêt(s) · {globalStats.totalDistance.toFixed(1)} km</span>}
                </div>

                {viewMode === 'map' ? (
                  <div className={cn(ui.card, "overflow-hidden")}>
                    <div className="h-[600px]">
                      <DeliveryMap
                        center={DEFAULT_CENTER} zoom={13}
                        zoneData={zoneData.map(zone => {
                          const realStops = zone.stops.filter(s => !s.isVirtualStop).map(s => ({ ...s, id: typeof s.id === 'number' ? s.id : Number(s.id) }));
                          return { ...zone, driver: { ...zone.driver, color: zone.color }, route: realStops as any, orders: realStops as any };
                        })}
                        orders={ordersForMap} dateFilter={dateFilter} svPressingLocation={SV_PRESSING_LOCATION}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {zoneData.length === 0 ? (
                      <div className={cn(ui.card, "py-12 text-center")}>
                        <p className="text-[13.5px] font-semibold text-slate-800">
                          {deliveryPersons.length === 0 ? 'Aucun livreur actif' : selectedOrderIds.length === 0 ? "Aucun ramassage ni livraison prévu aujourd'hui" : 'Aucune tournée possible'}
                        </p>
                        <p className="mt-1 text-[11.5px] text-slate-500">
                          {selectedOrderIds.length === 0 ? "Les tournées s'affichent automatiquement dès qu'une commande est prévue." : 'Vérifiez la capacité des véhicules et les livreurs sélectionnés.'}
                        </p>
                      </div>
                    ) : (
                      zoneData.map((zone: RouteZone) => (
                        <div key={zone.id} className={cn(ui.card, "relative")}>
                          <div className="p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                                <div>
                                  <h3 className="text-[13.5px] font-semibold text-slate-900">{zone.driver.name}</h3>
                                  <p className="text-[11px] text-[#0B676E] font-medium">{VEHICLE_TYPES[zone.driver.vehicleType || 'car']?.label || 'Véhicule'} · capacité {zone.driver.capacityInItems} kg</p>
                                  <p className="text-[11px] text-slate-500">{zone.stops.filter(s => !s.isVirtualStop).length} arrêt(s) · {zone.distanceKm} km · {zone.totalDuration}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    <Pill tone={zone.endLoad > (zone.driver.capacityInItems || 200) * 0.8 ? "red" : "brand"}>Charge finale: {zone.endLoad}/{zone.driver.capacityInItems} kg</Pill>
                                    {zone.hasReturnToBase && <Pill tone="purple">Retour au siège</Pill>}
                                    {zone.isModified && <Pill tone="slate">Modifié</Pill>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-[10.5px] text-slate-500">Efficacité</p>
                                  <p className="text-[16px] font-semibold text-emerald-600">{zone.efficiencyScore}%</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-slate-400 hover:bg-slate-100">•••</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { zonesDirtyRef.current = true; pushToUndoStack(zoneData); setZoneData(prev => prev.filter(z => z.id !== zone.id)); }} className="text-red-600">Supprimer (affichage)</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50/60 border-b border-slate-100">
                                    {['#', 'Type', 'Client / Lieu', 'Variation', 'Charge', 'Arrivée', ''].map((h, i) => (
                                      <TableHead key={i} className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{h}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {zone.stops.map((stop, idx) => {
                                    // Charge : départ chargé des livraisons, +ramassages, -livraisons déposées
                                    let loadAfter = zone.startLoad;
                                    for (let i = 0; i <= idx; i++) {
                                      if (zone.stops[i].type === 'pickup') loadAfter += zone.stops[i].itemCount;
                                      else if (zone.stops[i].type === 'delivery') loadAfter -= zone.stops[i].itemCount;
                                    }
                                    loadAfter = Math.max(0, loadAfter);
                                    const isDepart = stop.type === 'depart';
                                    const isRetour = stop.type === 'retour';
                                    const isVirtual = stop.isVirtualStop;
                                    const typeLabel = isDepart ? 'Départ' : isRetour ? 'Retour' : stop.type === 'pickup' ? 'Ramassage' : 'Livraison';
                                    return (
                                      <TableRow key={`${stop.id}-${idx}`} className={cn("group border-b border-slate-100", isDepart && "bg-violet-50/40", isRetour && "bg-indigo-50/40", !isVirtual && "hover:bg-slate-50")}>
                                        <TableCell className="text-[11px] font-mono font-semibold text-slate-500">{isDepart ? 'D' : isRetour ? 'R' : stop.sequence}</TableCell>
                                        <TableCell><span className={cn("text-[11.5px] font-medium", isDepart ? "text-violet-700" : isRetour ? "text-indigo-700" : stop.type === 'pickup' ? "text-amber-700" : "text-emerald-700")}>{typeLabel}</span></TableCell>
                                        <TableCell className="text-[11.5px]">
                                          <span className="text-slate-700">{stop.clientName}</span>
                                          {stop.timeWindowStart && !isVirtual && <p className="text-[10px] text-slate-400">{stop.timeWindowStart} - {stop.timeWindowEnd}</p>}
                                        </TableCell>
                                        <TableCell className="text-[11.5px]">
                                          {isDepart ? <span className="text-violet-600">Début</span> : isRetour ? <span className="text-indigo-600">Fin</span> : stop.type === 'pickup' ? <span className="text-amber-600">+{stop.itemCount} kg</span> : <span className="text-emerald-600">-{stop.itemCount} kg</span>}
                                        </TableCell>
                                        <TableCell>
                                          {isVirtual ? <Pill tone="slate">{isDepart ? `Initial: ${zone.startLoad} kg` : `Restant: ${zone.endLoad} kg`}</Pill> : <Pill tone={loadAfter > (zone.driver.capacityInItems || 200) ? "red" : "brand"}>{loadAfter}/{zone.driver.capacityInItems} kg</Pill>}
                                        </TableCell>
                                        <TableCell className="text-[11.5px] text-slate-600">{stop.estimatedArrival}</TableCell>
                                        <TableCell>
                                          {!isVirtual && (
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-500 opacity-0 group-hover:opacity-100"
                                              onClick={() => {
                                                zonesDirtyRef.current = true;
                                                pushToUndoStack(zoneData);
                                                setZoneData(prev => prev.map(z => {
                                                  if (z.id !== zone.id) return z;
                                                  const newStops = z.stops.filter((_, i) => i !== idx);
                                                  return { ...z, stops: newStops, isModified: true };
                                                }));
                                              }}>×</Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                              {[
                                { l: 'Distance', v: `${zone.distanceKm} km` },
                                { l: 'CO₂', v: `${zone.co2Emission} g` },
                                { l: 'Articles', v: zone.totalItems },
                                { l: 'Charge finale', v: `${zone.endLoad}/${zone.driver.capacityInItems} kg` },
                              ].map((s, i) => (
                                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-center">
                                  <p className="text-[10px] text-slate-500">{s.l}</p>
                                  <p className="text-[12px] font-semibold text-slate-900">{s.v}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ==================== À LIVRER ==================== */}
          <TabsContent value="ready-orders" className="mt-4">
            <Panel title="Commandes prêtes pour livraison" subtitle={`${readyToDeliverOrders.length} commande(s)`}
                   action={<div className="flex items-center gap-2">
                     <Input placeholder="Rechercher…" value={readySearch}
                            onChange={(e) => { setReadySearch(e.target.value); setReadyOrdersPage(1); }}
                            className={cn(ui.input, "w-48 h-9 text-[12.5px]")} />
                     <Button variant="outline" className={ui.btn} onClick={() => setShowGenerateConfirm(true)}>Générer</Button>
                   </div>}>
              {filteredReadyOrders.length === 0 ? (
                <div className="text-center py-12"><p className="text-[13px] text-slate-500">Aucune commande prête à livrer</p></div>
              ) : (
                <>
                  <div className="space-y-2">
                    {getPaginatedData(filteredReadyOrders, readyOrdersPage).map((order: any) => {
                      const client = userById.get(Number(order.clientId));
                      const isScheduled = !!order.scheduledDeliveryDate;
                      return (
                        <div key={order.id} className={cn("rounded-lg border p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3", isScheduled ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white")}>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[13px] font-semibold text-slate-900">#{order.id}</span>
                              <Pill tone={isScheduled ? "green" : "slate"}>{isScheduled ? "Planifiée" : "En attente"}</Pill>
                              <Pill tone="slate">{order.itemCount || 0} art.</Pill>
                              {isTodayDate(order.scheduledDeliveryDate) && <Pill tone="brand">Aujourd'hui</Pill>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11.5px]">
                              <div><span className="text-slate-500">Client :</span><span className="font-medium ml-1">{client?.fullName || 'Inconnu'}</span></div>
                              <div><span className="text-slate-500">Adresse :</span><span className="ml-1">{client?.addressDetails || client?.neighborhood || '-'}</span></div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button variant="outline" size="sm" className={cn(ui.btn, "h-8 text-[11.5px]")} onClick={() => setRescheduleOrder({ ...order, dateType: 'scheduledDeliveryDate' })}>{isScheduled ? 'Modifier' : 'Planifier'}</Button>
                            <Button size="sm" className={cn(ui.btnPrimary, "h-8 text-[11.5px]")} onClick={() => { setSelectedOrderForDelivery(order); setIsAssignDeliveryOpen(true); }}>Assigner</Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}>Voir</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pager page={readyOrdersPage} total={getTotalPages(filteredReadyOrders)} onChange={setReadyOrdersPage} />
                </>
              )}
            </Panel>
          </TabsContent>

          {/* ==================== RAMASSAGES ==================== */}
          <TabsContent value="pickup-orders" className="mt-4">
            <Panel title="Planning des ramassages" subtitle={`${pickupOrders.length} ramassage(s) · ${filteredPickupOrders.length} affiché(s)`}
                   action={<div className="flex flex-wrap items-center gap-2">
                     <Input placeholder="Rechercher…" value={pickupSearch}
                            onChange={(e) => { setPickupSearch(e.target.value); setPickupOrdersPage(1); }}
                            className={cn(ui.input, "w-40 h-9 text-[12.5px]")} />
                     <Select value={pickupStatusFilter} onValueChange={(v) => { setPickupStatusFilter(v); setPickupOrdersPage(1); }}>
                       <SelectTrigger className={cn(ui.input, "w-36 h-9")}><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Tous</SelectItem>
                         <SelectItem value="today">Aujourd'hui</SelectItem>
                         <SelectItem value="tomorrow">Demain</SelectItem>
                         <SelectItem value="late">En retard</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>}>
              {filteredPickupOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[13px] text-slate-500">{pickupStatusFilter !== 'all' ? 'Aucun ramassage correspondant' : 'Aucun ramassage programmé'}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {getPaginatedData(filteredPickupOrders, pickupOrdersPage).map((order: any) => {
                      const client = userById.get(Number(order.clientId));
                      const scheduledPickup = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
                      const isDelayed = scheduledPickup && new Date() > scheduledPickup && order.status === 'pickup_late';
                      return (
                        <div key={order.id} className={cn("rounded-lg border p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3", isDelayed ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white")}>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[13px] font-semibold text-slate-900">#{order.id}</span>
                              <Pill tone={isDelayed ? "red" : scheduledPickup ? "amber" : "slate"}>{isDelayed ? 'En retard' : scheduledPickup ? `Programmé ${format(scheduledPickup, 'dd/MM')}` : 'En attente'}</Pill>
                              <Pill tone="slate">{order.itemCount || 0} art.</Pill>
                              {isTodayDate(order.scheduledPickupDate) && <Pill tone="brand">Aujourd'hui</Pill>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11.5px]">
                              <div><span className="text-slate-500">Client :</span><span className="font-medium ml-1">{client?.fullName || 'Inconnu'}</span></div>
                              <div><span className="text-slate-500">Adresse :</span><span className="ml-1">{client?.addressDetails || client?.neighborhood || '-'}</span></div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button variant="outline" size="sm" className={cn(ui.btn, "h-8 text-[11.5px]")} onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}>Détails</Button>
                            <Button variant="outline" size="sm" className={cn(ui.btn, "h-8 text-[11.5px]")} onClick={() => setRescheduleOrder({ ...order, dateType: 'scheduledPickupDate' })}>Replanifier</Button>
                            <Button size="sm" className={cn(ui.btnPrimary, "h-8 text-[11.5px] bg-amber-600 hover:bg-amber-700")} onClick={() => { setSelectedOrderForPickup(order); setIsAssignPickupOpen(true); }}>Assigner</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pager page={pickupOrdersPage} total={getTotalPages(filteredPickupOrders)} onChange={setPickupOrdersPage} />
                </>
              )}
            </Panel>
          </TabsContent>

          {/* ==================== PLANNING ==================== */}
          <TabsContent value="planning" className="mt-4 space-y-4">
            {/* Ramassages de demain — lecture seule, dédoublonnés */}
            <Panel title="Ramassages de demain"
                   subtitle={`${format(addDays(new Date(), 1), 'EEEE dd MMMM', { locale: fr })} · ${tomorrowPickups.length} ramassage(s)`}>
              {tomorrowPickups.length === 0 ? (
                <div className="text-center py-6"><p className="text-[13px] text-slate-500">Aucun ramassage prévu demain</p></div>
              ) : (
                <div className="space-y-2">{tomorrowPickups.map(renderPlanningItem)}</div>
              )}
            </Panel>

            <Panel title="Planning hebdomadaire" subtitle="Missions et ramassages prévus de la semaine"
                   action={<div className="flex flex-wrap items-center gap-2">
                     <Select value={selectedPlanningDriver} onValueChange={setSelectedPlanningDriver}>
                       <SelectTrigger className={cn(ui.input, "w-48 h-9")}><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Tous les livreurs</SelectItem>
                         {deliveryPersons.map((driver: any) => <SelectItem key={driver.id} value={driver.id.toString()}>{driver.fullName}</SelectItem>)}
                       </SelectContent>
                     </Select>
                     <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                       <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setSelectedPlanningWeek(prev => subWeeks(prev, 1))}>Préc.</Button>
                       <span className="px-2 text-[11.5px] font-medium text-slate-700">
                         {format(startOfWeek(selectedPlanningWeek, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })} – {format(endOfWeek(selectedPlanningWeek, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}
                       </span>
                       <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setSelectedPlanningWeek(prev => addWeeks(prev, 1))}>Suiv.</Button>
                     </div>
                   </div>}>
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
                  const date = addDays(startOfWeek(selectedPlanningWeek, { weekStartsOn: 1 }), index);
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const isToday = isSameDay(date, new Date());
                  const dayItems = weekItems.filter(i => i.dateKey === dateKey);
                  return (
                    <div key={dateKey} className={cn("min-h-[90px] p-2 rounded-lg border", isToday ? "border-[#0B676E] bg-[#0B676E]/5" : "border-slate-200 bg-white")}>
                      <p className={cn("text-[11px] font-semibold mb-1.5", isToday ? "text-[#0B676E]" : "text-slate-700")}>{day} {format(date, 'd')}</p>
                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map(i => (
                          <div key={i.key} className={cn("text-[10px] rounded px-1.5 py-0.5 truncate", i.type === 'pickup' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                            {i.type === 'pickup' ? 'R' : 'L'}#{i.orderId}
                          </div>
                        ))}
                        {dayItems.length > 2 && <p className="text-[9.5px] text-center text-slate-500">+{dayItems.length - 2}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {weekItems.length === 0 ? (
                <div className="text-center py-8"><p className="text-[13px] text-slate-500">Aucune mission cette semaine</p></div>
              ) : (
                <>
                  <div className="space-y-2">{getPaginatedData(weekItems, deliveryPlanningPage).map(renderPlanningItem)}</div>
                  <Pager page={deliveryPlanningPage} total={getTotalPages(weekItems)} onChange={setDeliveryPlanningPage} />
                </>
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================== MODALES ==================== */}
      <Dialog open={isAssignDeliveryOpen} onOpenChange={setIsAssignDeliveryOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-lg")}>
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">Assigner un livreur</DialogTitle>
            <DialogDescription className="text-[12.5px]">Commande #{selectedOrderForDelivery?.id} - Livraison</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-[12px] font-medium">Livreur</Label>
              <Select onValueChange={(v) => setSelectedOrderForDelivery((prev: any) => ({ ...prev, deliveryPersonId: parseInt(v) }))}>
                <SelectTrigger className={ui.input}><SelectValue placeholder="Sélectionner un livreur" /></SelectTrigger>
                <SelectContent>{deliveryPersons.map((driver: any) => <SelectItem key={driver.id} value={driver.id.toString()}>{driver.fullName} ({driver.vehicleType || 'Non spécifié'})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[12px] font-medium">Date et heure</Label>
              <Input type="datetime-local" className={ui.input} defaultValue={format(new Date(), "yyyy-MM-dd'T'08:00")} onChange={(e) => setSelectedOrderForDelivery((prev: any) => ({ ...prev, scheduledDate: e.target.value ? new Date(e.target.value) : undefined }))} />
            </div>
            <div><Label className="text-[12px] font-medium">Notes</Label>
              <Textarea placeholder="Instructions particulières…" rows={3} className={ui.input} onChange={(e) => setSelectedOrderForDelivery((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className={ui.btn} onClick={() => setIsAssignDeliveryOpen(false)}>Annuler</Button>
            <Button className={ui.btnPrimary} onClick={() => submitAssignment(selectedOrderForDelivery, 'delivery')} disabled={assignDeliveryMutation.isPending}>
              {assignDeliveryMutation.isPending ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignPickupOpen} onOpenChange={setIsAssignPickupOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-lg")}>
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">Assigner un agent de ramassage</DialogTitle>
            <DialogDescription className="text-[12.5px]">Commande #{selectedOrderForPickup?.id} - Ramassage</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-[12px] font-medium">Agent</Label>
              <Select onValueChange={(v) => setSelectedOrderForPickup((prev: any) => ({ ...prev, deliveryPersonId: parseInt(v) }))}>
                <SelectTrigger className={ui.input}><SelectValue placeholder="Sélectionner un agent" /></SelectTrigger>
                <SelectContent>{deliveryPersons.map((driver: any) => <SelectItem key={driver.id} value={driver.id.toString()}>{driver.fullName} ({driver.vehicleType || 'Non spécifié'})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[12px] font-medium">Date et heure</Label>
              <Input type="datetime-local" className={ui.input} defaultValue={format(new Date(), "yyyy-MM-dd'T'08:00")} onChange={(e) => setSelectedOrderForPickup((prev: any) => ({ ...prev, scheduledDate: e.target.value ? new Date(e.target.value) : undefined }))} />
            </div>
            <div><Label className="text-[12px] font-medium">Notes</Label>
              <Textarea placeholder="Instructions particulières…" rows={3} className={ui.input} onChange={(e) => setSelectedOrderForPickup((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className={ui.btn} onClick={() => setIsAssignPickupOpen(false)}>Annuler</Button>
            <Button className={cn(ui.btnPrimary, "bg-amber-600 hover:bg-amber-700")} onClick={() => submitAssignment(selectedOrderForPickup, 'pickup')} disabled={assignDeliveryMutation.isPending}>
              {assignDeliveryMutation.isPending ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className={cn(ui.dialog, "max-w-2xl")}>
          <DialogHeader><DialogTitle className="text-[15px] font-semibold">Détails commande #{selectedOrder?.id}</DialogTitle></DialogHeader>
          {selectedOrder && (() => {
            const client = userById.get(Number(selectedOrder.clientId));
            const isPickup = PICKUP_STATUSES.includes(selectedOrder.status);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                <div><p className="text-[10.5px] text-slate-500">Client</p><p className="text-[12.5px] font-medium">{client?.fullName || 'Inconnu'}</p></div>
                <div><p className="text-[10.5px] text-slate-500">Téléphone</p><p className="text-[12.5px]">{client?.phone || '-'}</p></div>
                <div><p className="text-[10.5px] text-slate-500">Adresse</p><p className="text-[12.5px]">{client?.addressDetails || '-'}</p></div>
                <div><p className="text-[10.5px] text-slate-500">Statut</p><Pill tone="brand">{selectedOrder.status}</Pill></div>
                <div><p className="text-[10.5px] text-slate-500">Type</p><Pill tone={isPickup ? 'amber' : 'green'}>{isPickup ? 'Ramassage' : 'Livraison'}</Pill></div>
                <div><p className="text-[10.5px] text-slate-500">Articles</p><p className="text-[12.5px] font-medium">{selectedOrder.itemCount || 0}</p></div>
                {selectedOrder.scheduledPickupDate && <div><p className="text-[10.5px] text-slate-500">Ramassage prévu</p><p className="text-[12.5px]">{format(new Date(selectedOrder.scheduledPickupDate), 'dd/MM/yyyy HH:mm', { locale: fr })}</p></div>}
                {selectedOrder.scheduledDeliveryDate && <div><p className="text-[10.5px] text-slate-500">Livraison prévue</p><p className="text-[12.5px]">{format(new Date(selectedOrder.scheduledDeliveryDate), 'dd/MM/yyyy HH:mm', { locale: fr })}</p></div>}
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" className={ui.btn} onClick={() => setIsOrderDetailsOpen(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduleOrder} onOpenChange={(open) => !open && setRescheduleOrder(null)}>
        <DialogContent className={cn(ui.dialog, "max-w-md")}>
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">Replanifier #{rescheduleOrder?.id}</DialogTitle>
            <DialogDescription className="text-[12.5px]">{rescheduleOrder?.dateType === 'scheduledPickupDate' ? 'Nouvelle date de ramassage' : 'Nouvelle date de livraison'}</DialogDescription>
          </DialogHeader>
          <div className="py-3 flex justify-center">
            <Calendar mode="single"
              selected={rescheduleOrder?.dateType === 'scheduledPickupDate' ? (rescheduleOrder?.scheduledPickupDate ? new Date(rescheduleOrder.scheduledPickupDate) : undefined) : (rescheduleOrder?.scheduledDeliveryDate ? new Date(rescheduleOrder.scheduledDeliveryDate) : undefined)}
              onSelect={(date) => {
                if (date && rescheduleOrder) {
                  const updated = { ...rescheduleOrder };
                  if (rescheduleOrder.dateType === 'scheduledPickupDate') updated.scheduledPickupDate = date;
                  else updated.scheduledDeliveryDate = date;
                  setRescheduleOrder(updated);
                }
              }} />
          </div>
          <DialogFooter>
            <Button variant="outline" className={ui.btn} onClick={() => setRescheduleOrder(null)}>Annuler</Button>
            <Button className={ui.btnPrimary} onClick={() => {
              if (!rescheduleOrder) return;
              const updates: any = {};
              if (rescheduleOrder.dateType === 'scheduledPickupDate') updates.scheduledPickupDate = rescheduleOrder.scheduledPickupDate;
              else updates.scheduledDeliveryDate = rescheduleOrder.scheduledDeliveryDate;
              if (!Object.values(updates)[0]) { toast({ title: "Aucune modification", variant: "destructive" }); return; }
              updateOrderMutation.mutate({ orderId: rescheduleOrder.id, updates });
            }} disabled={updateOrderMutation.isPending}>
              {updateOrderMutation.isPending ? 'Enregistrement…' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <DialogContent className={cn(ui.dialog, "max-w-md")}>
          <DialogHeader><DialogTitle className="text-[15px] font-semibold">Générer les commandes automatiques</DialogTitle></DialogHeader>
          <div className="py-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-[12.5px] font-semibold text-amber-800">Information</p>
              <p className="mt-1 text-[12px] text-amber-700">Cette action va générer automatiquement des commandes de test pour les 3 prochains jours. Les commandes existantes ne seront pas affectées.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className={ui.btn} onClick={() => setShowGenerateConfirm(false)} disabled={generateOrdersMutation.isPending}>Annuler</Button>
            <Button className={ui.btnPrimary} onClick={() => generateOrdersMutation.mutate()} disabled={generateOrdersMutation.isPending}>
              {generateOrdersMutation.isPending ? 'Génération…' : 'Générer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveriesAndPickupsTab;
