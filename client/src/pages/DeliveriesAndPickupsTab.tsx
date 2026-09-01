
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Package, Truck, MapPin, Loader2, Calendar as CalendarIcon,
  AlertTriangle, CheckCircle, Settings, Brain, Route,
  Users, Download, Target, RefreshCw,
  ChevronDown, ChevronUp, List, Map, Search, X, Eye,
  ArrowLeft, ArrowRight, Star, MoveUp, MoveDown, Trash2, Copy,
  MoreHorizontal, Undo2, Redo2,
  Home, Flag, Navigation, Bike, Car, Bus, Truck as TruckIcon
} from "lucide-react";
import { format, isSameDay, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";

import DeliveryMap from "./DeliveryMap";
import { ANTANANARIVO_NEIGHBORHOODS } from './neighborhoods';

// ============================================================
// STYLES NEOMORPHIQUES
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
  table: "rounded-2xl overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
};

// ==================== TYPES ====================
interface Coords {
  lat: number;
  lng: number;
}

interface RouteStopWithDisplay {
  id: number | string;
  clientName: string;
  type: 'pickup' | 'delivery' | 'depart' | 'retour';
  itemCount: number;
  estimatedArrival: string;
  coords: Coords;
  status: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  priority: number;
  sequence: number;
  isVirtualStop: boolean;
}

interface RouteZone {
  id: string;
  driver: {
    id: number;
    name: string;
    vehicleType?: string;
    capacityInItems?: number;
    currentLoad: number;
    startCoords?: Coords;
  };
  stops: RouteStopWithDisplay[];
  distanceKm: number;
  totalDuration: string;
  efficiencyScore: number;
  color: string;
  workloadPercentage: number;
  totalItems: number;
  co2Emission: number;
  isModified: boolean;
  startLoad: number;
  endLoad: number;
  hasReturnToBase: boolean;
}

interface OptimizationConfig {
  algorithm: string;
  maxRouteTime: number;
  balanceWorkload: boolean;
  returnToStart: boolean;
  avoidTraffic: boolean;
  maxStopsPerRoute: number;
  minStopDuration: number;
  respectTimeWindows: boolean;
  avoidTolls: boolean;
  vehicleType: string;
  cargoPriority: string;
  weatherCondition: string;
  trafficCondition: string;
  fuelEfficiency: number;
  co2Reduction: boolean;
  breakDuration: number;
  maxWorkingHours: number;
  startLocation: string;
  depotLocation?: Coords;
  svPressingLocation: Coords;
  capacityThreshold: number;
}

// ==================== CONSTANTES ====================
const DEFAULT_CENTER: Coords = { lat: -18.91368, lng: 47.52144 };
const SV_PRESSING_LOCATION: Coords = { lat: -18.9105, lng: 47.5255 };

const COLORS = [
  '#0B676E', '#20B2AA', '#0D9488', '#0891B2', '#2563EB',
  '#4F46E5', '#7C3AED', '#DB2777', '#D97706', '#DC2626',
  '#14B8A6', '#D946EF', '#0EA5E9', '#A855F7', '#EAB308',
];

const VEHICLE_TYPES: Record<string, { label: string; capacity: number; speed: number; costPerKm: number; co2PerKm: number; icon: any }> = {
  motorcycle: { label: 'Moto', capacity: 150, speed: 35, costPerKm: 200, co2PerKm: 80, icon: Bike },
  scooter: { label: 'Scooter', capacity: 100, speed: 30, costPerKm: 150, co2PerKm: 60, icon: Bike },
  car: { label: 'Voiture', capacity: 300, speed: 45, costPerKm: 350, co2PerKm: 150, icon: Car },
  van: { label: 'Camionnette', capacity: 500, speed: 40, costPerKm: 500, co2PerKm: 200, icon: Bus },
  bicycle: { label: 'Vélo', capacity: 50, speed: 15, costPerKm: 0, co2PerKm: 0, icon: Bike },
  truck: { label: 'Camion', capacity: 1000, speed: 35, costPerKm: 800, co2PerKm: 300, icon: TruckIcon },
};

// ==================== INTERFACE PROPS ====================
interface DeliveriesAndPickupsTabProps {
  orders: any[];
  users: any[];
  deliveries: any[];
  queryClient: QueryClient;
}

// ==================== COMPOSANT PRINCIPAL ====================
export const DeliveriesAndPickupsTab: React.FC<DeliveriesAndPickupsTabProps> = ({
  orders,
  users,
  deliveries,
  queryClient,
}) => {
  const { toast } = useToast();

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoneData, setZoneData] = useState<RouteZone[]>([]);
  const autoGenerationSignatureRef = useRef<string | null>(null);
  const autoGenerationInProgressRef = useRef(false);
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
  const ITEMS_PER_PAGE = 10;
  
  const [selectedPlanningDriver, setSelectedPlanningDriver] = useState<string>("all");
  const [selectedPlanningWeek, setSelectedPlanningWeek] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupStatusFilter, setPickupStatusFilter] = useState<string>("all");

  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    algorithm: 'capacity',
    maxRouteTime: 8,
    balanceWorkload: true,
    returnToStart: true,
    avoidTraffic: false,
    maxStopsPerRoute: 15,
    minStopDuration: 10,
    respectTimeWindows: true,
    avoidTolls: false,
    vehicleType: 'car',
    cargoPriority: 'balanced',
    weatherCondition: 'normal',
    trafficCondition: 'normal',
    fuelEfficiency: 8.5,
    co2Reduction: true,
    breakDuration: 30,
    maxWorkingHours: 10,
    startLocation: 'sv_pressing',
    depotLocation: SV_PRESSING_LOCATION,
    svPressingLocation: SV_PRESSING_LOCATION,
    capacityThreshold: 80,
  });

  const deliveryPersons = useMemo(() => 
    safeUsers.filter((u: any) => u.role === 'delivery' && u.isActive),
    [safeUsers]
  );

  const getDriverVehicle = useCallback((driver: any) => {
    const vehicleType = driver?.vehicleType || 'car';
    const vehicle = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.car;
    const capacity = Number(driver?.capacityInItems) > 0 ? Number(driver.capacityInItems) : vehicle.capacity;
    return { ...vehicle, vehicleType, capacity };
  }, []);

  const getVehicleLabel = useCallback((driver: any) => {
    const vehicle = getDriverVehicle(driver);
    return `${vehicle.label} (${vehicle.capacity} kg)`;
  }, [getDriverVehicle]);

  const createGeneratedTasks = useCallback(async (routes: RouteZone[], targetDate: Date) => {
    const targetDateKey = format(targetDate, 'yyyy-MM-dd');

    const existingForDate = safeDeliveries.filter((d: any) => {
      const dDate = d?.scheduledDate || d?.scheduled_date || d?.date;
      if (!dDate) return false;
      try {
        return format(new Date(dDate), 'yyyy-MM-dd') === targetDateKey;
      } catch {
        return false;
      }
    });

    const existingByOrder = new globalThis.Map<number, any>();
    existingForDate.forEach((d: any) => {
      const orderId = Number(d?.orderId ?? d?.order_id);
      if (Number.isFinite(orderId)) existingByOrder.set(orderId, d);
    });

    const tasks = routes.flatMap(route =>
      route.stops
        .filter(stop => !stop.isVirtualStop)
        .map(stop => ({
          orderId: Number(stop.id),
          deliveryPersonId: Number(route.driver.id),
          scheduledDate: targetDate,
          notes: `Tournee generee automatiquement - ${route.driver.name} - ${route.driver.vehicleType || 'vehicule'}`,
        }))
    );

    let created = 0;
    let reassigned = 0;

    for (const task of tasks) {
      if (!Number.isFinite(task.orderId) || !Number.isFinite(task.deliveryPersonId)) continue;

      const existing = existingByOrder.get(task.orderId);
      const existingDriverId = Number(
        existing?.deliveryPersonId ?? existing?.delivery_person_id
      );

      try {
        if (existing?.id && existingDriverId !== task.deliveryPersonId) {
          await apiRequest('PATCH', `/api/deliveries/${existing.id}`, {
            deliveryPersonId: task.deliveryPersonId,
            scheduledDate: task.scheduledDate,
            notes: task.notes,
          });
          reassigned++;
        } else if (!existing?.id) {
          await apiRequest('POST', '/api/deliveries', task);
          created++;
        }
      } catch (error) {
        console.error('Erreur synchronisation mission automatique', task, error);
      }
    }

    return { created, reassigned };
  }, [safeDeliveries]);

  const readyToDeliverOrders = useMemo(() => {
    return safeOrders.filter((order: any) => 
      ['ready_to_deliver', 'to_deliver'].includes(order.status)
    );
  }, [safeOrders]);

  const pickupOrders = useMemo(() => {
    return safeOrders.filter((order: any) => 
      ['to_pickup', 'pickup_late'].includes(order.status)
    );
  }, [safeOrders]);

  const filteredPickupOrders = useMemo(() => {
    let filtered = [...pickupOrders];
    
    if (pickupStatusFilter === 'today') {
      filtered = filtered.filter((order: any) => {
        const pickupDate = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
        return pickupDate && isSameDay(pickupDate, new Date());
      });
    } else if (pickupStatusFilter === 'tomorrow') {
      const tomorrow = addDays(new Date(), 1);
      filtered = filtered.filter((order: any) => {
        const pickupDate = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
        return pickupDate && isSameDay(pickupDate, tomorrow);
      });
    } else if (pickupStatusFilter === 'late') {
      filtered = filtered.filter((order: any) => {
        const pickupDate = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
        return pickupDate && new Date() > pickupDate && order.status === 'pickup_late';
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order: any) => {
        const client = safeUsers.find((u: any) => u.id === order.clientId);
        return (
          order.id.toString().includes(query) ||
          (client?.fullName?.toLowerCase().includes(query))
        );
      });
    }
    
    return filtered;
  }, [pickupOrders, pickupStatusFilter, searchQuery, safeUsers]);

  const getCoordsFromAddress = useCallback((address: string): Coords | null => {
    if (!address) return null;
    const addressLower = address.toLowerCase().trim();
    
    for (const [key, coords] of Object.entries(ANTANANARIVO_NEIGHBORHOODS)) {
      const keyLower = key.toLowerCase();
      if (addressLower.includes(keyLower) || keyLower.includes(addressLower)) {
        return coords as Coords;
      }
      
      const normalizedKey = keyLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedAddress = addressLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (normalizedAddress.includes(normalizedKey) || normalizedKey.includes(normalizedAddress)) {
        return coords as Coords;
      }
    }
    return null;
  }, []);

  const calculateDistance = useCallback((point1: Coords, point2: Coords): number => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  }, []);

  const calculateCO2 = useCallback((distance: number, vehicleType: string): number => {
    const vehicle = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.car;
    return Math.round(distance * vehicle.co2PerKm);
  }, []);

  const calculateEfficiency = useCallback((stops: RouteStopWithDisplay[], distance: number): number => {
    const realStops = stops.filter(s => !s.isVirtualStop);
    if (realStops.length === 0) return 0;
    const stopsPerKm = realStops.length / Math.max(1, distance);
    const score = stopsPerKm * 40 + 50;
    return Math.min(100, Math.max(30, Math.round(score)));
  }, []);

  const calculateScore = useCallback((
    order: any,
    currentPos: Coords,
    currentLoad: number,
    driverCapacity: number,
    currentTime: Date,
    config: OptimizationConfig
  ): number => {
    let score = 0;
    
    const distance = calculateDistance(currentPos, order.coords);
    const distanceScore = Math.max(0, 100 - (distance * 10));
    score += distanceScore * 0.4;
    
    const loadPercentage = (currentLoad / driverCapacity) * 100;
    let typeScore = 50;
    
    if (order.type === 'pickup') {
      if (loadPercentage < 40) typeScore = 90;
      else if (loadPercentage > 75) typeScore = 20;
      else typeScore = 60;
    } else {
      if (loadPercentage > 70) typeScore = 90;
      else if (loadPercentage < 30) typeScore = 30;
      else typeScore = 60;
    }
    score += typeScore * 0.3;
    
    let timeScore = 50;
    if (order.timeWindowStart && order.timeWindowEnd && config.respectTimeWindows) {
      const [startHour, startMin] = order.timeWindowStart.split(':').map(Number);
      const [endHour, endMin] = order.timeWindowEnd.split(':').map(Number);
      const windowStart = new Date(currentTime);
      windowStart.setHours(startHour, startMin, 0);
      const windowEnd = new Date(currentTime);
      windowEnd.setHours(endHour, endMin, 0);
      
      if (currentTime < windowStart) {
        const waitMinutes = (windowStart.getTime() - currentTime.getTime()) / 60000;
        timeScore = Math.max(0, 100 - (waitMinutes / 5));
      } else if (currentTime > windowEnd) {
        const lateMinutes = (currentTime.getTime() - windowEnd.getTime()) / 60000;
        timeScore = Math.max(0, 50 - (lateMinutes / 2));
      } else {
        timeScore = 100;
      }
    }
    score += timeScore * 0.2;
    
    let priorityScore = 50;
    if (order.priority >= 3) priorityScore = 100;
    else if (order.priority === 2) priorityScore = 75;
    else priorityScore = 50;
    score += priorityScore * 0.1;
    
    if (order.status === 'pickup_late') {
      score += 20;
    }
    
    return score;
  }, [calculateDistance]);

  const generateOptimizedRoutes = useCallback((
    drivers: any[],
    orderIds: number[],
    config: OptimizationConfig
  ): RouteZone[] => {
    const ordersToOptimize = orderIds.map(id => {
      const order = safeOrders.find((o: any) => o.id === id);
      if (!order) return null;
      const client = safeUsers.find((u: any) => u.id === order.clientId);
      const isPickup = ['to_pickup', 'pickup_late'].includes(order.status || '');
      let coords = getCoordsFromAddress(client?.addressDetails || '') || getCoordsFromAddress(client?.neighborhood || '') || DEFAULT_CENTER;
      return {
        id: order.id,
        clientName: client?.fullName || `Client ${id}`,
        type: isPickup ? 'pickup' as const : 'delivery' as const,
        itemCount: Math.max(0, Number(order.itemCount) || 0),
        coords,
        priority: Number(order.priority) || 1,
        timeWindowStart: isPickup ? order.pickupTimeWindowStart : order.deliveryTimeWindowStart,
        timeWindowEnd: isPickup ? order.pickupTimeWindowEnd : order.deliveryTimeWindowEnd,
        status: order.status || 'pending',
      };
    }).filter(Boolean) as any[];

    const driverCapacities = drivers.map((driver: any) => {
      const vehicle = getDriverVehicle(driver);
      const driverAddress =
        driver?.addressDetails ||
        driver?.address ||
        driver?.neighborhood ||
        driver?.addressLine ||
        '';
      const startCoords =
        getCoordsFromAddress(driverAddress) ||
        config.svPressingLocation;

      return {
        ...driver,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        currentLoad: 0,
        startLoad: 0,
        stops: [] as any[],
        startCoords,
        currentPos: startCoords,
        totalDistance: 0,
        totalTime: 0,
        assignedWeight: 0,
      };
    });
    if (!ordersToOptimize.length || !driverCapacities.length) return [];

    const maxCapacity = Math.max(...driverCapacities.map(d => d.capacity));
    const impossibleOrders = ordersToOptimize.filter(o => o.itemCount > maxCapacity);
    const assignableOrders = ordersToOptimize.filter(o => o.itemCount <= maxCapacity);
    const deliveries = assignableOrders.filter(o => o.type === 'delivery').sort((a,b) => b.priority-a.priority || b.itemCount-a.itemCount);
    const pickups = assignableOrders.filter(o => o.type === 'pickup').sort((a,b) => b.priority-a.priority || b.itemCount-a.itemCount);
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
        let score = Math.max(0,100-distance*12)*0.45 + Math.max(0,100-loadRatio*100)*0.2 + Math.max(0,100-balance*100)*0.2 + order.priority*25*0.15;
        if (order.timeWindowStart && config.respectTimeWindows) score += 15;
        if (order.status === 'pickup_late') score += 40;
        if (score > bestScore) { bestScore = score; best = driver; }
      }
      if (!best) return false;
      const vehicle = getDriverVehicle(best);
      const distance = calculateDistance(best.currentPos, order.coords);
      best.totalDistance += distance;
      best.totalTime += (distance / Math.max(5, vehicle.speed))*60 + config.minStopDuration;
      if (initialDelivery) { best.startLoad += order.itemCount; best.currentLoad = best.startLoad; }
      else best.currentLoad += order.itemCount;
      best.assignedWeight += order.itemCount;
      best.stops.push({ ...order, sequence: best.stops.length + 1, estimatedArrival: formatDuration(best.totalTime) });
      best.currentPos = order.coords;
      if (!initialDelivery && best.currentLoad / Math.max(1,best.capacity) * 100 >= config.capacityThreshold) {
        const d = calculateDistance(best.currentPos, config.svPressingLocation);
        best.totalDistance += d;
        best.totalTime += (d / Math.max(5,vehicle.speed))*60 + 10;
        best.currentLoad = 0;
        best.currentPos = config.svPressingLocation;
      }
      return true;
    };

    deliveries.forEach(o => { if (!assignOrder(o,true)) unassigned.push(o); });
    pickups.forEach(o => { if (!assignOrder(o,false)) unassigned.push(o); });

    const routes: RouteZone[] = [];
    for (const driver of driverCapacities) {
      if (!driver.stops.length) continue;
      const vehicle = getDriverVehicle(driver);
      const startLoad = driver.startLoad;
      const endLoad = driver.currentLoad;
      if (config.returnToStart) {
        const d = calculateDistance(driver.currentPos, config.svPressingLocation);
        driver.totalDistance += d;
        driver.totalTime += (d / Math.max(5,vehicle.speed))*60;
      }
      const fullStops: RouteStopWithDisplay[] = [{ id:'depart', clientName:`Départ du siège - ${vehicle.label}`, type:'depart', itemCount:0, estimatedArrival:`Charge initiale: ${startLoad} kg`, coords:config.svPressingLocation, status:'Départ tournée', priority:0, sequence:0, isVirtualStop:true }];
      driver.stops.forEach((stop:any,i:number) => fullStops.push({ ...stop, sequence:i+1, isVirtualStop:false }));
      if (config.returnToStart) fullStops.push({ id:'retour', clientName:'Retour au siège', type:'retour', itemCount:0, estimatedArrival:formatDuration(driver.totalTime), coords:config.svPressingLocation, status:endLoad===0?'Véhicule vide':`${endLoad} kg restants`, priority:0, sequence:driver.stops.length+1, isVirtualStop:true });
      routes.push({ id:`route-${Date.now()}-${driver.id}-${Math.random().toString(36).substr(2,9)}`, driver:{id:driver.id,name:driver.fullName,vehicleType:vehicle.vehicleType,capacityInItems:vehicle.capacity,currentLoad:endLoad,startCoords:driver.startCoords}, stops:fullStops, distanceKm:Number(driver.totalDistance.toFixed(1)), totalDuration:formatDuration(driver.totalTime), efficiencyScore:calculateEfficiency(fullStops,driver.totalDistance), color:COLORS[routes.length%COLORS.length], workloadPercentage:Math.min(100,Math.round(driver.stops.length/Math.max(1,config.maxStopsPerRoute)*100)), totalItems:driver.stops.reduce((sum:number,s:any)=>sum+s.itemCount,0), co2Emission:calculateCO2(driver.totalDistance,vehicle.vehicleType), isModified:false, startLoad, endLoad, hasReturnToBase:config.returnToStart });
    }
    if (impossibleOrders.length || unassigned.length) {
      const ids=[...impossibleOrders,...unassigned].map(o=>`#${o.id}`).join(', ');
      toast({title:'Certaines commandes non affectées',description:`Capacité ou disponibilité insuffisante : ${ids}`,variant:'destructive'});
    }
    return routes;
  }, [safeOrders,safeUsers,getCoordsFromAddress,calculateDistance,formatDuration,calculateCO2,calculateEfficiency,getDriverVehicle,toast]);

  const ordersForMap = useMemo((): any[] => {
    const nonDelivered = safeOrders.filter((order: any) => 
      !['delivered', 'completed'].includes(order.status)
    );

    const filtered = dateFilter 
      ? nonDelivered.filter((order: any) => {
          const pickupDate = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
          const deliveryDate = order.scheduledDeliveryDate ? new Date(order.scheduledDeliveryDate) : null;
          return (pickupDate && isSameDay(pickupDate, dateFilter)) || 
                 (deliveryDate && isSameDay(deliveryDate, dateFilter));
        })
      : nonDelivered;

    return filtered.map((order: any) => {
      const client = safeUsers.find((u: any) => u.id === order.clientId);
      const address = client?.addressDetails || client?.address || '';
      let coords = getCoordsFromAddress(address) || getCoordsFromAddress(client?.neighborhood || '');
      
      if (!coords) {
        const randomOffset = () => (Math.random() - 0.5) * 0.04;
        coords = { lat: DEFAULT_CENTER.lat + randomOffset(), lng: DEFAULT_CENTER.lng + randomOffset() };
      }

      const isPickup = ['to_pickup', 'pickup_late'].includes(order.status);

      return {
        id: order.id,
        clientName: client?.fullName || `Client ${order.id}`,
        type: isPickup ? 'pickup' : 'delivery',
        coords,
        status: order.status,
        itemCount: order.itemCount || 40,
        estimatedArrival: isPickup 
          ? (order.pickupTimeWindowStart || '09:00') 
          : (order.deliveryTimeWindowStart || '14:00'),
        timeWindowStart: order.pickupTimeWindowStart || order.deliveryTimeWindowStart,
        timeWindowEnd: order.pickupTimeWindowEnd || order.deliveryTimeWindowEnd,
        scheduledDate: isPickup ? order.scheduledPickupDate : order.scheduledDeliveryDate,
        priority: order.priority || 1,
      };
    });
  }, [safeOrders, safeUsers, dateFilter, getCoordsFromAddress]);

  const allAvailableOrdersForSelection = useMemo(() => {
    return safeOrders
      .filter((order: any) => !['delivered', 'completed'].includes(order.status))
      .map((order: any) => {
        const client = safeUsers.find((u: any) => u.id === order.clientId);
        const address = client?.addressDetails || client?.address || '';
        let coords = getCoordsFromAddress(address) || getCoordsFromAddress(client?.neighborhood || '');
        if (!coords) {
          const randomOffset = () => (Math.random() - 0.5) * 0.04;
          coords = { lat: DEFAULT_CENTER.lat + randomOffset(), lng: DEFAULT_CENTER.lng + randomOffset() };
        }
        const isPickup = ['to_pickup', 'pickup_late'].includes(order.status);
        return {
          id: order.id,
          clientName: client?.fullName || `Client ${order.id}`,
          type: isPickup ? 'pickup' : 'delivery',
          coords,
          status: order.status,
          itemCount: order.itemCount || 40,
          scheduledDate: isPickup ? order.scheduledPickupDate : order.scheduledDeliveryDate,
          priority: order.priority || 1,
        };
      });
  }, [safeOrders, safeUsers, getCoordsFromAddress]);

  // ============================================================
  // PLANIFICATION AUTOMATIQUE QUOTIDIENNE
  // ============================================================
  // La planification est générée sans sélection manuelle : tous les
  // livreurs actifs et toutes les commandes du jour sont pris en compte.
  // Si une nouvelle commande arrive dans la journée, la signature change
  // et le plan est recalculé automatiquement.
  useEffect(() => {
    let cancelled = false;

    const runAutomaticPlanning = async () => {
      const targetDate = dateFilter || new Date();
      const targetDateKey = format(targetDate, 'yyyy-MM-dd');

      if (
        autoGenerationInProgressRef.current ||
        deliveryPersons.length === 0
      ) {
        return;
      }

      const todayOrders = allAvailableOrdersForSelection.filter((order: any) => {
        if (!order.scheduledDate) return false;
        return isSameDay(new Date(order.scheduledDate), targetDate);
      });

      const orderSignature = todayOrders
        .map((order: any) => `${order.id}:${order.type}:${order.itemCount}`)
        .sort()
        .join('|');
      const driverSignature = deliveryPersons
        .map((driver: any) => `${driver.id}:${driver.addressDetails || driver.address || driver.neighborhood || ''}`)
        .sort()
        .join('|');
      const signature = `${targetDateKey}::${driverSignature}::${orderSignature}`;

      if (autoGenerationSignatureRef.current === signature) return;

      if (todayOrders.length === 0) {
        if (!cancelled) {
          setZoneData([]);
          autoGenerationSignatureRef.current = signature;
        }
        return;
      }

      autoGenerationInProgressRef.current = true;

      try {
        const driverList = [...deliveryPersons];
        const orderIds = todayOrders
          .map((order: any) => Number(order.id))
          .filter(Number.isFinite);

        const routes = generateOptimizedRoutes(
          driverList,
          orderIds,
          optimizationConfig
        );

        if (cancelled) return;

        setSelectedDrivers(driverList);
        setSelectedOrderIds(orderIds);
        setZoneData(routes);

        const result = await createGeneratedTasks(routes, targetDate);

        if (!cancelled) {
          autoGenerationSignatureRef.current = signature;
          queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

          if (result.created > 0 || result.reassigned > 0) {
            toast({
              title: '🤖 Planification automatique terminée',
              description: `${result.created} mission(s) créée(s) et ${result.reassigned} réaffectée(s) pour le ${format(targetDate, 'dd/MM/yyyy')}.`,
            });
          }
        }
      } catch (error) {
        console.error('Erreur planification automatique:', error);
      } finally {
        autoGenerationInProgressRef.current = false;
      }
    };

    runAutomaticPlanning();

    return () => {
      cancelled = true;
    };
  }, [
    dateFilter,
    deliveryPersons,
    allAvailableOrdersForSelection,
    generateOptimizedRoutes,
    optimizationConfig,
    createGeneratedTasks,
    queryClient,
    toast,
  ]);

  const globalStats = useMemo(() => {
    const nonDelivered = safeOrders.filter((o: any) => !['delivered', 'completed'].includes(o.status));
    const pickups = nonDelivered.filter((o: any) => ['to_pickup', 'pickup_late'].includes(o.status));
    const ready = nonDelivered.filter((o: any) => ['ready_to_deliver', 'to_deliver'].includes(o.status));
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
      avgEfficiency: zoneData.length > 0 
        ? Math.round(zoneData.reduce((sum, r) => sum + r.efficiencyScore, 0) / zoneData.length)
        : 0,
    };
  }, [safeOrders, deliveryPersons, zoneData]);

  const pushToUndoStack = useCallback((currentZones: RouteZone[]) => {
    setUndoStack(prev => [...prev.slice(-49), currentZones.map(z => ({...z}))]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, zoneData.map(z => ({...z}))]);
    setZoneData(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, zoneData]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, zoneData.map(z => ({...z}))]);
    setZoneData(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, zoneData]);

  const optimizeRoutes = useCallback(async () => {
    if (selectedOrderIds.length === 0 || selectedDrivers.length === 0) {
      toast({ title: "Sélection requise", description: "Veuillez sélectionner des commandes et des livreurs", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const routes = generateOptimizedRoutes(selectedDrivers, selectedOrderIds, optimizationConfig);
      pushToUndoStack(routes);
      setZoneData(routes);
      const createdTasks = await createGeneratedTasks(routes, new Date());
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      const totalStops = routes.reduce((sum,r) => sum + r.stops.filter(s => !s.isVirtualStop).length, 0);
      toast({ title: "Tâches générées avec succès", description: `${routes.length} tournée(s) - ${totalStops} arrêt(s) - ${createdTasks} tâche(s) enregistrée(s)` });
    } catch (error: any) {
      toast({ title: "Erreur de génération", description: error?.message || "Impossible de générer les tâches", variant: "destructive" });
    } finally { setIsGenerating(false); }
  }, [selectedOrderIds,selectedDrivers,optimizationConfig,toast,generateOptimizedRoutes,pushToUndoStack,createGeneratedTasks,queryClient]);

  const assignDeliveryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deliveries', data),
    onSuccess: () => {
      toast({ title: "Assignation reussie" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setIsAssignDeliveryOpen(false);
      setIsAssignPickupOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: { orderId: number; updates: any }) => 
      apiRequest("PATCH", `/api/orders/${data.orderId}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setRescheduleOrder(null);
      toast({ title: "Planification mise a jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const generateOrdersMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/orders/generate-manual'),
    onSuccess: (data: any) => {
      toast({ title: "Commandes generees", description: `${data.summary?.generated || 0} commandes` });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      setShowGenerateConfirm(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const getPaginatedData = useCallback((data: any[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, []);

  const getTotalPages = useCallback((data: any[]) => Math.ceil(data.length / ITEMS_PER_PAGE), []);

  const exportRoutes = useCallback((exportFormat: 'json' | 'csv') => {
    if (exportFormat === 'json') {
      const dataStr = JSON.stringify(zoneData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournees-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'csv') {
      let csv = 'Tournee,Livreur,Sequence,Type,Client,Articles,Arrivee\n';
      zoneData.forEach((zone, zi) => {
        zone.stops.forEach(stop => {
          csv += `Tournee ${zi + 1},${zone.driver.name},${stop.sequence},${stop.type === 'depart' ? 'DEPART' : stop.type === 'retour' ? 'RETOUR' : stop.type},${stop.clientName},${stop.itemCount},${stop.estimatedArrival}\n`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournees-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast({ title: `Export ${exportFormat.toUpperCase()} reussi` });
  }, [zoneData, toast]);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 bg-[#eef2f5] min-h-screen">

      {/* ==========================================================
          STATISTIQUES NEOMORPHIQUES
      ========================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={NEO.card}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">En attente</p>
                <p className="text-xl font-bold text-slate-900">{globalStats.totalPending}</p>
              </div>
              <div className="p-2 bg-[#0B676E]/10 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Package className="h-5 w-5 text-[#0B676E]" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Ramassages</p>
                <p className="text-xl font-bold text-slate-900">{globalStats.pickups}</p>
                {globalStats.latePickups > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs mt-1">
                    {globalStats.latePickups} retard
                  </Badge>
                )}
              </div>
              <div className="p-2 bg-orange-100/30 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">A livrer</p>
                <p className="text-xl font-bold text-slate-900">{globalStats.readyForDelivery}</p>
              </div>
              <div className="p-2 bg-emerald-100/30 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Tournees</p>
                <p className="text-xl font-bold text-slate-900">{globalStats.routesGenerated}</p>
              </div>
              <div className="p-2 bg-purple-100/30 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Route className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Distance</p>
                <p className="text-xl font-bold text-slate-900">{globalStats.totalDistance.toFixed(1)} km</p>
              </div>
              <div className="p-2 bg-indigo-100/30 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Efficacite</p>
                <p className="text-xl font-bold text-slate-900">{globalStats.avgEfficiency}%</p>
              </div>
              <div className="p-2 bg-teal-100/30 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Target className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          ONGLETS NEOMORPHIQUES
      ========================================================== */}
      <Tabs defaultValue="optimization" className="w-full">
        <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-2 lg:grid-cols-4 p-1 rounded-2xl")}>
          <TabsTrigger value="optimization" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
            <Route className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Optimisation
            {zoneData.length > 0 && <Badge className="ml-1 sm:ml-2 bg-[#0B676E] text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">{zoneData.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ready-orders" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            A livrer
            {readyToDeliverOrders.length > 0 && <Badge className="ml-1 sm:ml-2 bg-[#0B676E] text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">{readyToDeliverOrders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="pickup-orders" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Ramassages
            {pickupOrders.length > 0 && <Badge className="ml-1 sm:ml-2 bg-[#0B676E] text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">{pickupOrders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="planning" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Planning
          </TabsTrigger>
        </TabsList>

        {/* Onglet Optimisation */}
        <TabsContent value="optimization" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Panneau de contrôle néomorphique */}
            <div className="xl:col-span-1 space-y-4">
              {/* Sélection livreurs */}
              <div className={NEO.card}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-[#0B676E]" />
                    <div className="flex-1"><h3 className="text-sm font-medium text-slate-700">Livreurs ({selectedDrivers.length}/{deliveryPersons.length})</h3><p className="text-xs text-slate-400 mt-0.5">Tous les livreurs actifs peuvent être sélectionnés</p></div><div className="flex gap-1"><Button variant="ghost" size="sm" className="h-6 text-xs text-[#0B676E]" onClick={() => setSelectedDrivers([...deliveryPersons])}>Tous</Button><Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={() => setSelectedDrivers([])}>Aucun</Button></div>
                  </div>
                  <ScrollArea className="h-48">
                    {deliveryPersons.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">Aucun livreur actif</div>
                    ) : (
                      deliveryPersons.map((driver: any) => (
                        <div
                          key={driver.id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                            selectedDrivers.some((d: any) => d.id === driver.id) ? "bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]" : "hover:bg-white/10"
                          )}
                          onClick={() => {
                            setSelectedDrivers((prev: any[]) =>
                              prev.some((d: any) => d.id === driver.id)
                                ? prev.filter((d: any) => d.id !== driver.id)
                                : [...prev, driver]
                            );
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-[#0B676E]/10 text-[#0B676E]">{driver.fullName?.charAt(0) || 'L'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-800">{driver.fullName}</span>
                              <span className="text-xs text-slate-500">
                                {getVehicleLabel(driver)}
                              </span>
                            </div>
                          </div>
                          <Checkbox checked={selectedDrivers.some((d: any) => d.id === driver.id)} className="pointer-events-none" />
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              </div>

              {/* Sélection commandes */}
              <div className={NEO.card}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#0B676E]" />
                      <h3 className="text-sm font-medium text-slate-700">Commandes ({selectedOrderIds.length})</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-xs h-6 text-[#0B676E]" onClick={() => setSelectedOrderIds(allAvailableOrdersForSelection.map(o => o.id))}>
                        Tout
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-6 text-red-500" onClick={() => setSelectedOrderIds([])}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs border-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <CalendarIcon className="h-3 w-3 mr-2 text-[#0B676E]" />
                            {dateFilter ? format(dateFilter, 'dd/MM/yyyy') : 'Toutes dates'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                          <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className="bg-[#eef2f5] rounded-2xl" />
                        </PopoverContent>
                      </Popover>
                      {dateFilter && (
                        <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)} className="h-8 w-8 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-48">
                    {allAvailableOrdersForSelection.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        {dateFilter ? `Aucune commande pour le ${format(dateFilter, 'dd/MM/yyyy')}` : 'Aucune commande disponible'}
                      </div>
                    ) : (
                      allAvailableOrdersForSelection.map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedOrderIds((prev: number[]) =>
                              prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                            );
                          }}
                        >
                          <Checkbox checked={selectedOrderIds.includes(order.id)} className="pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-1.5 h-1.5 rounded-full", order.type === 'pickup' ? "bg-orange-500" : "bg-emerald-500")} />
                              <span className="text-xs font-medium truncate text-slate-800">#{order.id} {order.clientName}</span>
                              {order.type === 'pickup' && (
                                <Badge className="bg-orange-100 text-orange-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs">+{order.itemCount}</Badge>
                              )}
                              {order.type === 'delivery' && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs">-{order.itemCount}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 ml-3.5">
                              {order.type === 'pickup' ? 'Ramassage' : 'Livraison'} | {order.itemCount} art.
                              {order.priority >= 3 && <span className="ml-2 text-red-500">Priorite haute</span>}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              </div>

              {/* Paramètres */}
              <div className={NEO.card}>
                <div className="p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-[#0B676E]" />
                      <h3 className="text-sm font-medium text-slate-700">Parametres</h3>
                    </div>
                    {showAdvancedOptions ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className="space-y-3 mt-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-600">Seuil declenchement SV Pressing</Label>
                        <span className="text-xs font-medium text-slate-800">{optimizationConfig.capacityThreshold}%</span>
                      </div>
                      <Slider 
                        value={[optimizationConfig.capacityThreshold]} 
                        onValueChange={([v]) => setOptimizationConfig(prev => ({ ...prev, capacityThreshold: v }))} 
                        min={50} 
                        max={95} 
                        step={5} 
                        className="mt-1" 
                      />
                      <p className="text-xs text-slate-400 mt-1">Au-dela, le livreur vide au pressing</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-600">Temps max/tournee</Label>
                        <span className="text-xs font-medium text-slate-800">{optimizationConfig.maxRouteTime}h</span>
                      </div>
                      <Slider value={[optimizationConfig.maxRouteTime]} onValueChange={([v]) => setOptimizationConfig(prev => ({ ...prev, maxRouteTime: v }))} min={2} max={12} step={0.5} className="mt-1" />
                    </div>
                    {showAdvancedOptions && (
                      <div className="space-y-3 pt-3 border-t border-white/40">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-600">Respect fenetres horaires</Label>
                          <Switch checked={optimizationConfig.respectTimeWindows} onCheckedChange={(v) => setOptimizationConfig(prev => ({ ...prev, respectTimeWindows: v }))} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-600">Retour au SV Pressing</Label>
                          <Switch checked={optimizationConfig.returnToStart} onCheckedChange={(v) => setOptimizationConfig(prev => ({ ...prev, returnToStart: v }))} />
                        </div>
                        <div className="p-3 rounded-2xl bg-white/40 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"><p className="text-xs font-medium text-slate-700">Véhicule et capacité</p><p className="text-xs text-slate-500 mt-1">La capacité est calculée automatiquement selon le véhicule de chaque livreur.</p></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons action néomorphiques */}
              <div className="space-y-2">
                <Button className={NEO.buttonPrimary + " w-full"} onClick={optimizeRoutes} disabled={isGenerating || selectedOrderIds.length === 0 || selectedDrivers.length === 0} size="lg">
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                  {selectedDrivers.length === 0 ? 'Selectionnez livreurs' : selectedOrderIds.length === 0 ? 'Selectionnez commandes' : `Générer les tâches (${selectedOrderIds.length} cmd)`}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className={NEO.button} onClick={() => exportRoutes('json')} disabled={zoneData.length === 0}>
                    <Download className="h-3 w-3 mr-1" /> JSON
                  </Button>
                  <Button variant="outline" size="sm" className={NEO.button} onClick={() => exportRoutes('csv')} disabled={zoneData.length === 0}>
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Zone principale - VUE LISTE AVEC DÉPART ET RETOUR */}
            <div className="xl:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(NEO.card, "p-1 flex")}>
                    <Button variant={viewMode === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('map')} className={cn("rounded-r-none", viewMode === 'map' && NEO.buttonPrimary)}>
                      <Map className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Carte
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className={cn("rounded-l-none", viewMode === 'list' && NEO.buttonPrimary)}>
                      <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Liste
                    </Button>
                  </div>
                  <div className={cn(NEO.card, "p-1 flex")}>
                    <Button variant="ghost" size="sm" onClick={handleUndo} disabled={undoStack.length === 0} className="rounded-r-none">
                      <Undo2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm" onClick={handleRedo} disabled={redoStack.length === 0} className="rounded-l-none">
                      <Redo2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
                {zoneData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      {globalStats.totalStops} arrets reels | {globalStats.totalDistance.toFixed(1)} km
                    </span>
                  </div>
                )}
              </div>

              {viewMode === 'map' ? (
                <div className={NEO.card}>
                  <div className="p-0">
                    <div className="h-[600px] rounded-2xl overflow-hidden">
                      <DeliveryMap
                        center={DEFAULT_CENTER}
                        zoom={13}
                        zoneData={zoneData.map(zone => {
                          const realStops = zone.stops
                            .filter(s => !s.isVirtualStop)
                            .map(s => ({
                              ...s,
                              id: typeof s.id === 'number' ? s.id : Number(s.id),
                            }));

                          return {
                            ...zone,
                            driver: {
                              ...zone.driver,
                              color: zone.color,
                            },
                            route: realStops as any,
                            orders: realStops as any,
                          };
                        })}
                        orders={ordersForMap}
                        dateFilter={dateFilter}
                        svPressingLocation={SV_PRESSING_LOCATION}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {zoneData.length === 0 ? (
                    <div className={NEO.card}>
                      <div className="h-[300px] flex items-center justify-center p-6">
                        <div className="text-center">
                          <Route className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                          <p className="font-medium text-slate-600">Aucune tournee generee</p>
                          <p className="text-sm text-slate-500">Selectionnez des commandes et des livreurs puis lancez l'optimisation</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    zoneData.map((zone: RouteZone) => (
                      <div key={zone.id} className={cn(NEO.card, "border-l-4")} style={{ borderLeftColor: zone.color }}>
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]" style={{ backgroundColor: zone.color }} />
                              <div>
                                <h3 className="font-semibold text-slate-800">{zone.driver.name}</h3><p className="text-xs font-medium text-[#0B676E]">{VEHICLE_TYPES[zone.driver.vehicleType || 'car']?.label || 'Véhicule'} · capacité {zone.driver.capacityInItems} kg</p>
                                <p className="text-xs text-slate-500">
                                  {zone.stops.filter(s => !s.isVirtualStop).length} arrets reels | {zone.distanceKm} km | {zone.totalDuration}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge className={cn(
                                    "text-xs border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                    zone.driver.currentLoad > (zone.driver.capacityInItems || 200) * 0.8 ? "bg-red-100 text-red-700" : "bg-[#0B676E]/10 text-[#0B676E]"
                                  )}>
                                    Charge finale: {zone.driver.currentLoad}/{zone.driver.capacityInItems} kg
                                  </Badge>
                                  {zone.hasReturnToBase && (
                                    <Badge className="bg-purple-100 text-purple-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs">
                                      Retour au siege inclus
                                    </Badge>
                                  )}
                                  {zone.isModified && <Badge variant="outline" className="text-xs">Modifie</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-2">
                                <p className="text-xs text-slate-500">Efficacite</p>
                                <p className="text-lg font-bold text-emerald-600">{zone.efficiencyScore}%</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className={NEO.button + " h-8 w-8 p-0"}>
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                  <DropdownMenuItem onClick={() => setZoneData(prev => prev.filter(z => z.id !== zone.id))} className="text-red-600 rounded-xl focus:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <div className={NEO.table}>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-white/10">
                                    <TableHead className="w-8 text-xs text-slate-600 font-semibold">#</TableHead>
                                    <TableHead className="text-xs text-slate-600 font-semibold">Type</TableHead>
                                    <TableHead className="text-xs text-slate-600 font-semibold">Client / Lieu</TableHead>
                                    <TableHead className="text-xs text-slate-600 font-semibold">Variation</TableHead>
                                    <TableHead className="text-xs text-slate-600 font-semibold">Charge véhicule</TableHead>
                                    <TableHead className="text-xs text-slate-600 font-semibold">Arrivee</TableHead>
                                    <TableHead className="w-20 text-xs text-slate-600 font-semibold">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {zone.stops.map((stop: RouteStopWithDisplay, idx: number) => {
                                    let loadAfter = 0;
                                    for (let i = 0; i <= idx; i++) {
                                      const s = zone.stops[i];
                                      if (s.type === 'pickup') loadAfter += s.itemCount;
                                      else if (s.type === 'delivery') loadAfter -= s.itemCount;
                                    }
                                    
                                    const isVirtual = stop.isVirtualStop;
                                    const isDepart = stop.type === 'depart';
                                    const isRetour = stop.type === 'retour';
                                    
                                    let bgColor = '';
                                    let typeLabel = '';
                                    let IconComponent = null;
                                    
                                    if (isDepart) {
                                      bgColor = 'bg-purple-50/50';
                                      typeLabel = 'DEPART';
                                      IconComponent = Home;
                                    } else if (isRetour) {
                                      bgColor = 'bg-indigo-50/50';
                                      typeLabel = 'RETOUR';
                                      IconComponent = Flag;
                                    } else if (stop.type === 'pickup') {
                                      bgColor = 'bg-orange-50/50';
                                      typeLabel = 'Ramassage';
                                      IconComponent = Package;
                                    } else {
                                      bgColor = 'bg-emerald-50/50';
                                      typeLabel = 'Livraison';
                                      IconComponent = Truck;
                                    }
                                    
                                    return (
                                      <TableRow key={`${stop.id}-${idx}`} className={cn("group border-b border-white/20", bgColor)}>
                                        <TableCell className="text-xs font-mono font-bold">
                                          {isDepart ? '🏁' : isRetour ? '🏆' : stop.sequence}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-1">
                                            {IconComponent && <IconComponent className={cn(
                                              "h-3 w-3",
                                              isDepart ? "text-purple-600" : isRetour ? "text-indigo-600" : stop.type === 'pickup' ? "text-orange-600" : "text-emerald-600"
                                            )} />}
                                            <span className={cn(
                                              "text-xs font-medium",
                                              isDepart ? "text-purple-700" : isRetour ? "text-indigo-700" : stop.type === 'pickup' ? "text-orange-700" : "text-emerald-700"
                                            )}>
                                              {typeLabel}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {isDepart || isRetour ? (
                                            <div className="flex items-center gap-1">
                                              <Navigation className="h-3 w-3 text-purple-500" />
                                              <span className="font-medium text-slate-800">{stop.clientName}</span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-700">{stop.clientName}</span>
                                          )}
                                          {stop.timeWindowStart && !isVirtual && (
                                            <div className="text-xs text-slate-400">
                                              {stop.timeWindowStart} - {stop.timeWindowEnd}
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {isDepart ? (
                                            <span className="text-purple-600 font-medium">Debut tournee</span>
                                          ) : isRetour ? (
                                            <span className="text-indigo-600 font-medium">Fin tournee</span>
                                          ) : stop.type === 'pickup' ? (
                                            <span className="text-orange-600 font-medium">+{stop.itemCount} kg</span>
                                          ) : (
                                            <span className="text-emerald-600 font-medium">-{stop.itemCount} kg</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {isVirtual ? (
                                            <Badge variant="outline" className="text-xs border-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                              {isDepart ? `Charge initiale: ${zone.startLoad} kg` : `Charge restante: ${zone.endLoad} kg`}
                                            </Badge>
                                          ) : (
                                            <Badge className={cn(
                                              "text-xs border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                              loadAfter > (zone.driver.capacityInItems || 200) ? "bg-red-100 text-red-700" : "bg-[#0B676E]/10 text-[#0B676E]"
                                            )}>
                                              {loadAfter} / {zone.driver.capacityInItems} kg
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600">
                                          {stop.estimatedArrival}
                                        </TableCell>
                                        <TableCell>
                                          {!isVirtual && (
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                                              onClick={() => {
                                                const realStopIndex = zone.stops.findIndex(s => s.id === stop.id && !s.isVirtualStop);
                                                if (realStopIndex !== -1) {
                                                  setZoneData(prev => prev.map(z => {
                                                    if (z.id !== zone.id) return z;
                                                    const newStops = [...z.stops];
                                                    newStops.splice(realStopIndex, 1);
                                                    return { ...z, stops: newStops, isModified: true };
                                                  }));
                                                }
                                              }}>
                                              <X className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/40">
                            <div className="text-center p-2 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-xs text-slate-500">Distance totale</p>
                              <p className="font-bold text-sm text-slate-800">{zone.distanceKm} km</p>
                            </div>
                            <div className="text-center p-2 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-xs text-slate-500">CO2</p>
                              <p className="font-bold text-sm text-slate-800">{zone.co2Emission} g</p>
                            </div>
                            <div className="text-center p-2 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-xs text-slate-500">Articles traites</p>
                              <p className="font-bold text-sm text-slate-800">{zone.totalItems}</p>
                            </div>
                            <div className="text-center p-2 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-xs text-slate-500">Charge finale</p>
                              <p className="font-bold text-sm text-slate-800">{zone.endLoad} / {zone.driver.capacityInItems} kg</p>
                            </div>
                          </div>
                          
                          {zone.hasReturnToBase && (
                            <div className="mt-3 p-2 bg-purple-50 rounded-2xl flex items-center justify-center gap-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <Navigation className="h-4 w-4 text-purple-600" />
                              <span className="text-xs text-purple-700 font-medium">
                                Retour au siege SV Pressing - Dechargement des {zone.endLoad} kg restants
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Onglet A livrer */}
        <TabsContent value="ready-orders" className="space-y-4 mt-4">
          <div className={NEO.card}>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Commandes pretes pour livraison</h3>
                  </div>
                  <p className="text-sm text-slate-500">{readyToDeliverOrders.length} commande(s)</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input 
                    placeholder="Rechercher..." 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setReadyOrdersPage(1); }} 
                    className={cn(NEO.input, "w-40 sm:w-48")} 
                  />
                  <Button variant="outline" className={NEO.button} onClick={() => setShowGenerateConfirm(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Generer
                  </Button>
                </div>
              </div>

              {(() => {
                const filtered = readyToDeliverOrders.filter((o: any) => {
                  if (!searchQuery) return true;
                  const client = safeUsers.find((u: any) => u.id === o.clientId);
                  return (o.id.toString().includes(searchQuery) || client?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()));
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="font-medium text-slate-600">Aucune commande prete a livrer</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="space-y-3">
                      {getPaginatedData(filtered, readyOrdersPage).map((order: any) => {
                        const client = safeUsers.find((u: any) => u.id === order.clientId);
                        const isScheduled = !!order.scheduledDeliveryDate;
                        return (
                          <div key={order.id} className={cn(
                            "p-4 rounded-2xl border transition-colors",
                            isScheduled ? "border-emerald-200 bg-emerald-50/30" : NEO.card
                          )}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  <span className="font-bold text-lg text-slate-900">#{order.id}</span>
                                  <Badge className={cn(
                                    "border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                    isScheduled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {isScheduled ? "Planifiee" : "En attente"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">{order.itemCount || 0} art.</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-slate-500">Client:</span><span className="font-medium ml-1 text-slate-800">{client?.fullName || 'Inconnu'}</span></div>
                                  <div><span className="text-slate-500">Adresse:</span><span className="ml-1 text-slate-700">{client?.addressDetails || client?.neighborhood || '-'}</span></div>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm" className={NEO.button} onClick={() => setRescheduleOrder({ ...order, dateType: 'scheduledDeliveryDate' })}>
                                  <CalendarIcon className="h-4 w-4 mr-2" /> {isScheduled ? "Modifier" : "Planifier"}
                                </Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" onClick={() => { setSelectedOrderForDelivery(order); setIsAssignDeliveryOpen(true); }}>
                                  <Truck className="h-4 w-4 mr-2" /> Assigner
                                </Button>
                                <Button variant="ghost" size="sm" className={NEO.button} onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {getTotalPages(filtered) > 1 && (
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/40">
                        <p className="text-sm text-slate-500">Page {readyOrdersPage} sur {getTotalPages(filtered)}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className={NEO.button} onClick={() => setReadyOrdersPage(p => Math.max(1, p - 1))} disabled={readyOrdersPage === 1}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Precedent
                          </Button>
                          <Button variant="outline" size="sm" className={NEO.button} onClick={() => setReadyOrdersPage(p => Math.min(getTotalPages(filtered), p + 1))} disabled={readyOrdersPage === getTotalPages(filtered)}>
                            Suivant <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Ramassages */}
        <TabsContent value="pickup-orders" className="space-y-4 mt-4">
          <div className={NEO.card}>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Planning des ramassages</h3>
                  </div>
                  <p className="text-sm text-slate-500">{pickupOrders.length} ramassage(s) - {filteredPickupOrders.length} affiche(s)</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input 
                    placeholder="Rechercher..." 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setPickupOrdersPage(1); }} 
                    className={cn(NEO.input, "w-40 sm:w-48")} 
                  />
                  <Select value={pickupStatusFilter} onValueChange={(v) => { setPickupStatusFilter(v); setPickupOrdersPage(1); }}>
                    <SelectTrigger className={cn(NEO.input, "w-40")}>
                      <SelectValue placeholder="Filtrer..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="tomorrow">Demain</SelectItem>
                      <SelectItem value="late">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredPickupOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="font-medium text-slate-600">
                    {pickupStatusFilter !== 'all' ? 'Aucun ramassage correspondant au filtre' : 'Aucun ramassage programme'}
                  </p>
                  {pickupStatusFilter !== 'all' && (
                    <Button variant="link" onClick={() => setPickupStatusFilter('all')} className="mt-2 text-[#0B676E]">
                      Reinitialiser le filtre
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {getPaginatedData(filteredPickupOrders, pickupOrdersPage).map((order: any) => {
                      const client = safeUsers.find((u: any) => u.id === order.clientId);
                      const scheduledPickup = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : null;
                      const isDelayed = scheduledPickup && new Date() > scheduledPickup && order.status === 'pickup_late';
                      return (
                        <div key={order.id} className={cn(
                          "p-4 rounded-2xl border transition-colors",
                          isDelayed ? "border-red-200 bg-red-50/30" : NEO.card
                        )}>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="font-bold text-lg text-slate-900">#{order.id}</span>
                                <Badge className={cn(
                                  "border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                  isDelayed ? "bg-red-100 text-red-700" : scheduledPickup ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                                )}>
                                  {isDelayed ? 'En retard' : (scheduledPickup ? `Programme: ${format(scheduledPickup, 'dd/MM')}` : 'En attente')}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">{order.itemCount || 0} art.</Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div><span className="text-slate-500">Client:</span><span className="font-medium ml-1 text-slate-800">{client?.fullName || 'Inconnu'}</span></div>
                                <div><span className="text-slate-500">Adresse:</span><span className="ml-1 text-slate-700">{client?.addressDetails || client?.neighborhood || '-'}</span></div>
                                {scheduledPickup && (
                                  <div><span className="text-slate-500">Date:</span><span className="font-medium ml-1 text-slate-800">{format(scheduledPickup, 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
                                )}
                                {order.pickupTimeWindowStart && (
                                  <div><span className="text-slate-500">Fenetre:</span><span className="ml-1 text-slate-700">{order.pickupTimeWindowStart} - {order.pickupTimeWindowEnd}</span></div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" size="sm" className={NEO.button} onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" /> Details
                              </Button>
                              <Button variant="outline" size="sm" className={NEO.button} onClick={() => setRescheduleOrder({ ...order, dateType: 'scheduledPickupDate' })}>
                                <CalendarIcon className="h-4 w-4 mr-2" /> Replanifier
                              </Button>
                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" onClick={() => { setSelectedOrderForPickup(order); setIsAssignPickupOpen(true); }}>
                                <Truck className="h-4 w-4 mr-2" /> Assigner
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {getTotalPages(filteredPickupOrders) > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/40">
                      <p className="text-sm text-slate-500">Page {pickupOrdersPage} sur {getTotalPages(filteredPickupOrders)}</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className={NEO.button} onClick={() => setPickupOrdersPage(p => Math.max(1, p - 1))} disabled={pickupOrdersPage === 1}>
                          <ArrowLeft className="h-4 w-4 mr-1" /> Precedent
                        </Button>
                        <Button variant="outline" size="sm" className={NEO.button} onClick={() => setPickupOrdersPage(p => Math.min(getTotalPages(filteredPickupOrders), p + 1))} disabled={pickupOrdersPage === getTotalPages(filteredPickupOrders)}>
                          Suivant <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Planning */}
        <TabsContent value="planning" className="space-y-4 mt-4">
          <div className={NEO.card}>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-[#0B676E]" />
                    <h3 className="text-lg font-semibold text-slate-800">Planning hebdomadaire</h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={selectedPlanningDriver} onValueChange={setSelectedPlanningDriver}>
                    <SelectTrigger className={cn(NEO.input, "w-48")}>
                      <SelectValue placeholder="Tous les livreurs" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                      <SelectItem value="all">Tous les livreurs</SelectItem>
                      {deliveryPersons.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>{driver.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className={cn(NEO.card, "p-1 flex items-center gap-1")}>
                    <Button variant="ghost" size="sm" className={NEO.button} onClick={() => setSelectedPlanningWeek(prev => subWeeks(prev, 1))}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[180px] text-center text-slate-700">
                      {format(startOfWeek(selectedPlanningWeek, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })}
                      {' - '}
                      {format(endOfWeek(selectedPlanningWeek, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <Button variant="ghost" size="sm" className={NEO.button} onClick={() => setSelectedPlanningWeek(prev => addWeeks(prev, 1))}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
                  const date = addDays(startOfWeek(selectedPlanningWeek, { weekStartsOn: 1 }), index);
                  const isToday = isSameDay(date, new Date());
                  const dayDeliveries = safeDeliveries.filter((d: any) => d.scheduledDate && isSameDay(new Date(d.scheduledDate), date));
                  const filtered = selectedPlanningDriver === "all" ? dayDeliveries : dayDeliveries.filter((d: any) => d.deliveryPersonId === parseInt(selectedPlanningDriver));

                  return (
                    <div key={format(date, 'yyyy-MM-dd')} className={cn(
                      "min-h-[100px] p-2 rounded-2xl border-2",
                      isToday ? "border-[#0B676E] bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]" : "border-white/40 bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                    )}>
                      <div className={cn(
                        "text-sm font-semibold mb-2",
                        isToday ? "text-[#0B676E]" : "text-slate-700"
                      )}>
                        {format(date, 'd')}
                        {isToday && <span className="text-xs block text-[#0B676E]">Aujourd'hui</span>}
                      </div>
                      <div className="space-y-1">
                        {filtered.slice(0, 3).map((d: any) => (
                          <div key={d.id} className={cn(
                            "text-xs p-1 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
                            d.type === 'pickup' ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"
                          )}>
                            <div className="font-medium truncate">
                              {d.type === 'pickup' ? 'Ramassage' : 'Livraison'} #{d.orderId}
                            </div>
                          </div>
                        ))}
                        {filtered.length > 3 && <div className="text-xs text-center text-slate-500">+{filtered.length - 3}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-800">Missions de la semaine</h3>
                {(() => {
                  const weekStart = startOfWeek(selectedPlanningWeek, { weekStartsOn: 1 });
                  const weekEnd = endOfWeek(selectedPlanningWeek, { weekStartsOn: 1 });
                  const weekDeliveries = safeDeliveries.filter((d: any) => {
                    if (!d.scheduledDate) return false;
                    const date = new Date(d.scheduledDate);
                    return date >= weekStart && date <= weekEnd;
                  }).filter((d: any) => selectedPlanningDriver === "all" || d.deliveryPersonId === parseInt(selectedPlanningDriver));

                  if (weekDeliveries.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Aucune mission cette semaine</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="space-y-3">
                        {getPaginatedData(weekDeliveries, deliveryPlanningPage).map((delivery: any) => {
                          const order = safeOrders.find((o: any) => o.id === delivery.orderId);
                          const client = order ? safeUsers.find((u: any) => u.id === order.clientId) : null;
                          const driver = safeUsers.find((u: any) => u.id === delivery.deliveryPersonId);
                          return (
                            <div key={delivery.id} className={NEO.card}>
                              <div className="p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-slate-800">{delivery.type === 'pickup' ? 'Ramassage' : 'Livraison'} #{delivery.orderId}</span>
                                    <Badge className={cn(
                                      "border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                      delivery.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                      delivery.status === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                    )}>
                                      {delivery.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-500">{format(new Date(delivery.scheduledDate), 'EEEE dd MMMM', { locale: fr })}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div><p className="text-slate-500">Client</p><p className="font-medium text-slate-800">{client?.fullName || 'Inconnu'}</p></div>
                                  <div><p className="text-slate-500">Adresse</p><p className="truncate text-slate-700">{client?.addressDetails || '-'}</p></div>
                                  <div><p className="text-slate-500">Livreur</p><p className="font-medium text-slate-800">{driver?.fullName || 'Non assigne'}</p></div>
                                  <div><p className="text-slate-500">Articles</p><p className="font-medium text-slate-800">{order?.itemCount || 0}</p></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {getTotalPages(weekDeliveries) > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/40">
                          <p className="text-sm text-slate-500">Page {deliveryPlanningPage} sur {getTotalPages(weekDeliveries)}</p>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className={NEO.button} onClick={() => setDeliveryPlanningPage(p => Math.max(1, p - 1))} disabled={deliveryPlanningPage === 1}>
                              <ArrowLeft className="h-4 w-4 mr-1" /> Precedent
                            </Button>
                            <Button variant="outline" size="sm" className={NEO.button} onClick={() => setDeliveryPlanningPage(p => Math.min(getTotalPages(weekDeliveries), p + 1))} disabled={deliveryPlanningPage === getTotalPages(weekDeliveries)}>
                              Suivant <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ==========================================================
          MODALES NEOMORPHIQUES
      ========================================================== */}

      {/* Modal Assigner Livraison */}
      <Dialog open={isAssignDeliveryOpen} onOpenChange={setIsAssignDeliveryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Assigner un livreur (Livraison)</DialogTitle>
            <DialogDescription className="text-slate-500">Commande #{selectedOrderForDelivery?.id} - Type: Livraison</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700">Livreur</Label>
              <Select onValueChange={(v) => setSelectedOrderForDelivery((prev: any) => ({ ...prev, deliveryPersonId: parseInt(v) }))}>
                <SelectTrigger className={NEO.input}>
                  <SelectValue placeholder="Selectionner un livreur" />
                </SelectTrigger>
                <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                  {deliveryPersons.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>{driver.fullName} ({driver.vehicleType || 'Non specifie'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Date et heure</Label>
              <Input type="datetime-local" className={NEO.input} defaultValue={format(new Date(), "yyyy-MM-dd'T'08:00")} onChange={(e) => setSelectedOrderForDelivery((prev: any) => ({ ...prev, scheduledDate: new Date(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-slate-700">Notes</Label>
              <Textarea placeholder="Instructions particulieres..." rows={3} className={NEO.input} onChange={(e) => setSelectedOrderForDelivery((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className={NEO.button} onClick={() => setIsAssignDeliveryOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" onClick={() => {
              if (selectedOrderForDelivery && selectedOrderForDelivery.deliveryPersonId) {
                assignDeliveryMutation.mutate({
                  orderId: selectedOrderForDelivery.id,
                  deliveryPersonId: selectedOrderForDelivery.deliveryPersonId,
                  type: 'delivery',
                  scheduledDate: selectedOrderForDelivery.scheduledDate || new Date(),
                  notes: selectedOrderForDelivery.notes || '',
                });
              } else {
                toast({ title: "Selection requise", description: "Veuillez selectionner un livreur", variant: "destructive" });
              }
            }} disabled={assignDeliveryMutation.isPending}>
              {assignDeliveryMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Assigner Ramassage */}
      <Dialog open={isAssignPickupOpen} onOpenChange={setIsAssignPickupOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Assigner un agent de ramassage</DialogTitle>
            <DialogDescription className="text-slate-500">Commande #{selectedOrderForPickup?.id} - Type: Ramassage</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700">Agent</Label>
              <Select onValueChange={(v) => setSelectedOrderForPickup((prev: any) => ({ ...prev, deliveryPersonId: parseInt(v) }))}>
                <SelectTrigger className={NEO.input}>
                  <SelectValue placeholder="Selectionner un agent" />
                </SelectTrigger>
                <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                  {deliveryPersons.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>{driver.fullName} ({driver.vehicleType || 'Non specifie'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Date et heure</Label>
              <Input type="datetime-local" className={NEO.input} defaultValue={format(new Date(), "yyyy-MM-dd'T'08:00")} onChange={(e) => setSelectedOrderForPickup((prev: any) => ({ ...prev, scheduledDate: new Date(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-slate-700">Notes</Label>
              <Textarea placeholder="Instructions particulieres..." rows={3} className={NEO.input} onChange={(e) => setSelectedOrderForPickup((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className={NEO.button} onClick={() => setIsAssignPickupOpen(false)}>Annuler</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" onClick={() => {
              if (selectedOrderForPickup && selectedOrderForPickup.deliveryPersonId) {
                assignDeliveryMutation.mutate({
                  orderId: selectedOrderForPickup.id,
                  deliveryPersonId: selectedOrderForPickup.deliveryPersonId,
                  type: 'pickup',
                  scheduledDate: selectedOrderForPickup.scheduledDate || new Date(),
                  notes: selectedOrderForPickup.notes || '',
                });
              } else {
                toast({ title: "Selection requise", description: "Veuillez selectionner un agent", variant: "destructive" });
              }
            }} disabled={assignDeliveryMutation.isPending}>
              {assignDeliveryMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Détails Commande */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Details commande #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {(() => {
                const client = safeUsers.find((u: any) => u.id === selectedOrder.clientId);
                const isPickup = ['to_pickup', 'pickup_late'].includes(selectedOrder.status);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#eef2f5] p-4 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <div><p className="text-slate-500 text-sm">Client</p><p className="font-medium text-slate-800">{client?.fullName || 'Inconnu'}</p></div>
                    <div><p className="text-slate-500 text-sm">Telephone</p><p className="text-slate-700">{client?.phone || '-'}</p></div>
                    <div><p className="text-slate-500 text-sm">Adresse</p><p className="text-slate-700">{client?.addressDetails || '-'}</p></div>
                    <div><p className="text-slate-500 text-sm">Statut</p><Badge className="border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">{selectedOrder.status}</Badge></div>
                    <div><p className="text-slate-500 text-sm">Type</p><Badge className={cn("border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]", isPickup ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700")}>{isPickup ? 'Ramassage' : 'Livraison'}</Badge></div>
                    <div><p className="text-slate-500 text-sm">Articles</p><p className="font-medium text-slate-800">{selectedOrder.itemCount || 0}</p></div>
                    {selectedOrder.scheduledPickupDate && (
                      <div><p className="text-slate-500 text-sm">Ramassage prevu</p><p className="text-slate-700">{format(new Date(selectedOrder.scheduledPickupDate), 'dd/MM/yyyy HH:mm', { locale: fr })}</p></div>
                    )}
                    {selectedOrder.scheduledDeliveryDate && (
                      <div><p className="text-slate-500 text-sm">Livraison prevue</p><p className="text-slate-700">{format(new Date(selectedOrder.scheduledDeliveryDate), 'dd/MM/yyyy HH:mm', { locale: fr })}</p></div>
                    )}
                    <div><p className="text-slate-500 text-sm">Cree le</p><p className="text-slate-700">{format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</p></div>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className={NEO.button} onClick={() => setIsOrderDetailsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Replanification */}
      <Dialog open={!!rescheduleOrder} onOpenChange={(open) => !open && setRescheduleOrder(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Replanifier commande #{rescheduleOrder?.id}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {rescheduleOrder?.dateType === 'scheduledPickupDate' ? 'Nouvelle date de ramassage' : 'Nouvelle date de livraison'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <Calendar
              mode="single"
              selected={rescheduleOrder?.dateType === 'scheduledPickupDate' 
                ? (rescheduleOrder?.scheduledPickupDate ? new Date(rescheduleOrder.scheduledPickupDate) : undefined) 
                : (rescheduleOrder?.scheduledDeliveryDate ? new Date(rescheduleOrder.scheduledDeliveryDate) : undefined)
              }
              onSelect={(date) => { 
                if (date && rescheduleOrder) {
                  const updated = { ...rescheduleOrder };
                  if (rescheduleOrder.dateType === 'scheduledPickupDate') {
                    updated.scheduledPickupDate = date;
                  } else {
                    updated.scheduledDeliveryDate = date;
                  }
                  setRescheduleOrder(updated);
                }
              }}
              className="bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff] border-0"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className={NEO.button} onClick={() => setRescheduleOrder(null)}>Annuler</Button>
            <Button className={NEO.buttonPrimary} onClick={() => {
              if (!rescheduleOrder) return;
              const updates: any = {};
              if (rescheduleOrder.dateType === 'scheduledPickupDate') {
                updates.scheduledPickupDate = rescheduleOrder.scheduledPickupDate;
              } else {
                updates.scheduledDeliveryDate = rescheduleOrder.scheduledDeliveryDate;
              }
              if (Object.keys(updates).length === 0) {
                toast({ title: "Aucune modification", variant: "destructive" });
                return;
              }
              updateOrderMutation.mutate({ orderId: rescheduleOrder.id, updates });
            }} disabled={updateOrderMutation.isPending}>
              {updateOrderMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Génération */}
      <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Generer les commandes automatiques</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Information</p>
              </div>
              <p className="text-sm text-amber-700 mt-2">
                Cette action va generer automatiquement des commandes de test pour les 3 prochains jours.
                Les commandes existantes ne seront pas affectees.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className={NEO.button} onClick={() => setShowGenerateConfirm(false)} disabled={generateOrdersMutation.isPending}>Annuler</Button>
            <Button className={NEO.buttonPrimary} onClick={() => generateOrdersMutation.mutate()} disabled={generateOrdersMutation.isPending}>
              {generateOrdersMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Generer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveriesAndPickupsTab;