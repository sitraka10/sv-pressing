// components/PlanningIntelligent.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  Droplet,
  Wind,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  CalendarDays,
  Loader2,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Brain,
  Mic,
  Layers,
  ArrowRight,
  Clock4,
  AlertOctagon,
  CheckCircle,
  Circle,
  XCircle,
  Flame,
  Thermometer,
  Snowflake,
  Sun,
  Moon,
  Users,
  MessageSquare,
  Phone,
  MapPin,
  UserCircle,
  Building2,
  Mail
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, differenceInHours, parseISO, isAfter, isBefore, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============ INTERFACES ============
interface Order {
  id: number;
  clientId: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  statusChangedAt?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  itemCount?: number;
  specialInstructions?: string;
  clientName?: string;
  clientPhone?: string;
  clientNeighborhood?: string;
  clientEmail?: string;
}

interface PlanningDay {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  metrics: {
    pickup: { total: number; late: number; onTime: number; predicted: number };
    sorting: { total: number; late: number; onTime: number; predicted: number };
    washing: { total: number; late: number; onTime: number; predicted: number };
    drying: { total: number; late: number; onTime: number; predicted: number };
    ironing: { total: number; late: number; onTime: number; predicted: number };
    delivery: { total: number; late: number; onTime: number; predicted: number };
  };
  alerts: PlanningAlert[];
  loadLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface PlanningAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  count: number;
  action?: string;
}

interface PlanningOrder {
  order: Order;
  step: string;
  expectedDate: Date;
  isLate: boolean;
  riskScore: number;
  timeRemaining: string;
  priority: 'high' | 'medium' | 'low';
}

interface PlanningIntelligentProps {
  orders: Order[];
  users: any[];
  deliveries: any[];
  onOrderClick: (order: Order) => void;
  onStatusChange?: (orderId: number, newStatus: string) => void;
}

// ============ CONSTANTES ============
const WORKFLOW_STEPS_NEW = [
  { key: 'pickup', label: 'Ramassage', icon: Truck, color: 'orange', sla: 8, status: 'to_pickup' },
  { key: 'sorting', label: 'Tri', icon: Package, color: 'yellow', sla: 4, status: 'to_sort' },
  { key: 'washing', label: 'Lavage', icon: Droplet, color: 'blue', sla: 6, status: 'to_wash' },
  { key: 'drying', label: 'Séchage', icon: Wind, color: 'cyan', sla: 4, status: 'to_dry' },
  { key: 'ironing', label: 'Repassage', icon: Gauge, color: 'purple', sla: 5, status: 'to_iron' },
  { key: 'delivery', label: 'Livraison', icon: CheckCircle2, color: 'green', sla: 8, status: 'to_deliver' }
];

const STEP_COLORS = {
  pickup: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dark: 'bg-orange-500' },
  sorting: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dark: 'bg-yellow-500' },
  washing: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dark: 'bg-blue-500' },
  drying: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dark: 'bg-cyan-500' },
  ironing: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dark: 'bg-purple-500' },
  delivery: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dark: 'bg-green-500' }
};

// ============ FONCTIONS UTILITAIRES ============
const getOrderRiskScore = (order: Order, now: Date): number => {
  let riskScore = 0;
  
  // Retard SLA
  if (order.status === 'to_pickup' && order.scheduledPickupDate) {
    const pickupDate = parseISO(order.scheduledPickupDate);
    const hoursLate = differenceInHours(now, pickupDate);
    if (hoursLate > 0) riskScore += Math.min(50, hoursLate * 5);
  }
  
  if (order.status === 'to_deliver' && order.scheduledDeliveryDate) {
    const deliveryDate = parseISO(order.scheduledDeliveryDate);
    const hoursLate = differenceInHours(now, deliveryDate);
    if (hoursLate > 0) riskScore += Math.min(50, hoursLate * 5);
  }
  
  // Temps passé dans l'étape actuelle
  if (order.statusChangedAt || order.updatedAt) {
    const stepStart = parseISO(order.statusChangedAt || order.updatedAt || order.createdAt);
    const hoursInStep = differenceInHours(now, stepStart);
    const step = WORKFLOW_STEPS_NEW.find(s => s.status === order.status);
    if (step && hoursInStep > step.sla) {
      riskScore += Math.min(30, (hoursInStep - step.sla) * 3);
    }
  }
  
  // Volume d'articles
  if (order.itemCount && order.itemCount > 30) riskScore += 10;
  if (order.itemCount && order.itemCount > 50) riskScore += 15;
  
  return Math.min(100, riskScore);
};

const getExpectedStepDate = (order: Order, stepKey: string, now: Date): Date | null => {
  const stepIndex = WORKFLOW_STEPS_NEW.findIndex(s => s.key === stepKey);
  if (stepIndex === -1) return null;
  
  const currentStepIndex = WORKFLOW_STEPS_NEW.findIndex(s => s.status === order.status);
  if (currentStepIndex === -1) return null;
  
  if (stepIndex <= currentStepIndex) {
    // Déjà passé
    return null;
  }
  
  // Calcul du temps estimé
  let estimatedDate = parseISO(order.createdAt);
  for (let i = 0; i <= stepIndex; i++) {
    const step = WORKFLOW_STEPS_NEW[i];
    let stepDuration = step.sla;
    
    // Ajustement selon le volume
    if (order.itemCount && order.itemCount > 30) stepDuration *= 1.2;
    if (order.itemCount && order.itemCount > 50) stepDuration *= 1.4;
    
    if (i <= currentStepIndex) {
      // Étape déjà passée : utiliser temps réel si disponible
      if (order.actualDeliveryDate && step.key === 'delivery') {
        // Déjà livré
        return null;
      }
    } else {
      estimatedDate = addHours(estimatedDate, stepDuration);
    }
  }
  
  return estimatedDate;
};

const isOrderLateForStep = (order: Order, stepKey: string, now: Date): boolean => {
  const expectedDate = getExpectedStepDate(order, stepKey, now);
  if (!expectedDate) return false;
  return isAfter(now, expectedDate);
};

// ============ COMPOSANT PRINCIPAL ============
export const PlanningIntelligent: React.FC<PlanningIntelligentProps> = ({
  orders,
  users,
  deliveries,
  onOrderClick,
  onStatusChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [ordersForDate, setOrdersForDate] = useState<PlanningOrder[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Génération des données de planning
  const planningDays = useMemo((): PlanningDay[] => {
    const days: PlanningDay[] = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const isToday = isSameDay(date, new Date());
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Initialisation des métriques
      const metrics = {
        pickup: { total: 0, late: 0, onTime: 0, predicted: 0 },
        sorting: { total: 0, late: 0, onTime: 0, predicted: 0 },
        washing: { total: 0, late: 0, onTime: 0, predicted: 0 },
        drying: { total: 0, late: 0, onTime: 0, predicted: 0 },
        ironing: { total: 0, late: 0, onTime: 0, predicted: 0 },
        delivery: { total: 0, late: 0, onTime: 0, predicted: 0 }
      };
      
      const alerts: PlanningAlert[] = [];
      
      // Parcours des commandes
      orders.forEach(order => {
        if (order.status === 'delivered') return;
        
        WORKFLOW_STEPS_NEW.forEach(step => {
          const expectedDate = getExpectedStepDate(order, step.key, now);
          if (expectedDate && isSameDay(expectedDate, date)) {
            metrics[step.key as keyof typeof metrics].predicted++;
            
            const isLate = isOrderLateForStep(order, step.key, now);
            if (isLate) {
              metrics[step.key as keyof typeof metrics].late++;
            } else {
              metrics[step.key as keyof typeof metrics].onTime++;
            }
            
            metrics[step.key as keyof typeof metrics].total++;
          }
        });
      });
      
      // Détection des alertes
      if (metrics.pickup.late > 3) {
        alerts.push({ type: 'danger', message: 'Retards ramassage', count: metrics.pickup.late, action: 'Contacter livreurs' });
      }
      if (metrics.washing.predicted > 20) {
        alerts.push({ type: 'warning', message: 'Charge lavage élevée', count: metrics.washing.predicted, action: 'Prévoir personnel' });
      }
      if (metrics.delivery.late > 5) {
        alerts.push({ type: 'danger', message: 'Livraisons critiques', count: metrics.delivery.late, action: 'Plan B nécessaire' });
      }
      
      // Niveau de charge
      let totalLoad = 0;
      Object.values(metrics).forEach(m => { totalLoad += m.predicted; });
      let loadLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (totalLoad > 30) loadLevel = 'medium';
      if (totalLoad > 50) loadLevel = 'high';
      if (totalLoad > 80) loadLevel = 'critical';
      
      // Recommandations intelligentes
      const recommendations: string[] = [];
      if (metrics.pickup.late > 2) recommendations.push('🚚 Renforcer équipe ramassage');
      if (metrics.washing.predicted > 15) recommendations.push('🧺 Anticiper lavage intensif');
      if (metrics.delivery.late > 3) recommendations.push('📦 Réaffecter livreurs livraison');
      if (metrics.sorting.predicted > 10 && metrics.sorting.late > 2) recommendations.push('📋 Prioriser tri matinal');
      
      days.push({ date, isToday, isWeekend, metrics, alerts, loadLevel, recommendations });
    }
    
    return days;
  }, [orders, currentDate, now]);

  // Récupération des commandes pour une date et étape spécifiques
  const fetchOrdersForDateAndStep = useCallback((date: Date, stepKey: string) => {
    const ordersList: PlanningOrder[] = [];
    
    orders.forEach(order => {
      if (order.status === 'delivered') return;
      
      const expectedDate = getExpectedStepDate(order, stepKey, now);
      if (expectedDate && isSameDay(expectedDate, date)) {
        const isLate = isOrderLateForStep(order, stepKey, now);
        const riskScore = getOrderRiskScore(order, now);
        const step = WORKFLOW_STEPS_NEW.find(s => s.key === stepKey);
        
        let timeRemaining = '';
        if (expectedDate) {
          const diff = differenceInHours(expectedDate, now);
          if (diff < 0) {
            timeRemaining = `Retard ${Math.abs(diff)}h`;
          } else {
            timeRemaining = `${diff}h restantes`;
          }
        }
        
        ordersList.push({
          order: {
            ...order,
            clientName: users.find(u => u.id === order.clientId)?.fullName || 'Client inconnu',
            clientPhone: users.find(u => u.id === order.clientId)?.phone,
            clientNeighborhood: users.find(u => u.id === order.clientId)?.neighborhood,
            clientEmail: users.find(u => u.id === order.clientId)?.email
          },
          step: step?.label || stepKey,
          expectedDate,
          isLate,
          riskScore,
          timeRemaining,
          priority: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'
        });
      }
    });
    
    return ordersList.sort((a, b) => b.riskScore - a.riskScore);
  }, [orders, users, now]);

  // Mise à jour quand la séchange change
  useEffect(() => {
    if (selectedDate && selectedStep) {
      setIsLoading(true);
      const orders_ = fetchOrdersForDateAndStep(selectedDate, selectedStep);
      setOrdersForDate(orders_);
      setIsLoading(false);
    }
  }, [selectedDate, selectedStep, fetchOrdersForDateAndStep]);

  // Navigation
  const goToPrevious = () => {
    if (viewMode === 'day' && selectedDate) {
      setSelectedDate(subDays(selectedDate, 1));
      setCurrentDate(subDays(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 7));
    }
  };
  
  const goToNext = () => {
    if (viewMode === 'day' && selectedDate) {
      setSelectedDate(addDays(selectedDate, 1));
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
    if (viewMode === 'day') setSelectedDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  const handleStepClick = (stepKey: string) => {
    if (selectedDate) {
      setSelectedStep(stepKey);
      const orders_ = fetchOrdersForDateAndStep(selectedDate, stepKey);
      setOrdersForDate(orders_);
      setDetailsDialogOpen(true);
    }
  };

  const handleOrderClick = (order: PlanningOrder) => {
    setSelectedOrderDetail(order.order);
    onOrderClick(order.order);
  };

  // Rendu du planning jour (vue détaillée)
  const renderDayView = () => {
    if (!selectedDate) return null;
    
    const dayData = planningDays.find(d => isSameDay(d.date, selectedDate));
    if (!dayData) return null;
    
    return (
      <div className="space-y-4">
        {/* En-tête du jour */}
        <div className={cn(
          "rounded-2xl p-6 text-white",
          dayData.isToday ? "bg-gradient-to-r from-blue-600 to-indigo-700" : "bg-gradient-to-r from-gray-700 to-gray-800"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {dayData.isToday ? "📅 Aujourd'hui" : dayData.isWeekend ? "🌟 Week-end" : "📆 Planning prévisionnel"}
              </p>
            </div>
            <Badge className={cn(
              "px-3 py-1.5 text-sm font-semibold",
              dayData.loadLevel === 'critical' ? "bg-red-500 text-white" :
              dayData.loadLevel === 'high' ? "bg-orange-500 text-white" :
              dayData.loadLevel === 'medium' ? "bg-yellow-500 text-white" :
              "bg-green-500 text-white"
            )}>
              {dayData.loadLevel === 'critical' ? '⚠️ Charge critique' :
               dayData.loadLevel === 'high' ? '🔥 Charge élevée' :
               dayData.loadLevel === 'medium' ? '📈 Charge moyenne' :
               '✅ Charge normale'}
            </Badge>
          </div>
        </div>
        
        {/* Métriques par étape */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORKFLOW_STEPS_NEW.map(step => {
            const metrics = dayData.metrics[step.key as keyof typeof dayData.metrics];
            const colors = STEP_COLORS[step.key as keyof typeof STEP_COLORS];
            const isHighRisk = metrics.late > 3;
            
            return (
              <motion.div
                key={step.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStepClick(step.key)}
                className={cn(
                  "rounded-xl p-3 cursor-pointer transition-all border-2",
                  colors.bg,
                  colors.border,
                  isHighRisk && "ring-2 ring-red-400 ring-offset-2"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <step.icon className={cn("h-5 w-5", colors.text)} />
                  {metrics.late > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      {metrics.late} retard{metrics.late > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-800">{metrics.predicted}</p>
                <p className="text-xs text-gray-500">{step.label}</p>
                {metrics.predicted > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", colors.dark)}
                      style={{ width: `${(metrics.onTime / metrics.predicted) * 100}%` }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* Alertes du jour */}
        {dayData.alerts.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Alertes du jour</span>
            </div>
            <div className="space-y-2">
              {dayData.alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    {alert.type === 'danger' && <XCircle className="h-4 w-4 text-red-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    <span className="text-sm text-gray-700">{alert.message} ({alert.count})</span>
                  </div>
                  {alert.action && (
                    <Badge variant="outline" className="text-xs">
                      {alert.action}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommandations IA */}
        {dayData.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-indigo-800">Recommandations intelligentes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {dayData.recommendations.map((rec, idx) => (
                <Badge key={idx} className="bg-white text-indigo-700 border-indigo-200 px-3 py-1.5">
                  {rec}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendu du planning semaine (vue grille)
  const renderWeekView = () => {
    return (
      <div className="space-y-4">
        {/* Grille des jours */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {planningDays.map((day, idx) => {
            const isSelected = selectedDate && isSameDay(day.date, selectedDate);
            const totalLoad = Object.values(day.metrics).reduce((sum, m) => sum + m.predicted, 0);
            const totalLate = Object.values(day.metrics).reduce((sum, m) => sum + m.late, 0);
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleDayClick(day.date)}
                className={cn(
                  "rounded-xl p-3 cursor-pointer transition-all border-2",
                  day.isToday ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300" : "bg-white border-gray-200",
                  isSelected && "ring-2 ring-blue-500 ring-offset-2",
                  day.loadLevel === 'critical' && "border-red-300 bg-red-50/30"
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <span className={cn(
                    "text-sm font-medium",
                    day.isToday ? "text-blue-600" : "text-gray-500"
                  )}>
                    {format(day.date, "EEE", { locale: fr })}
                  </span>
                  <span className={cn(
                    "text-2xl font-bold mt-1",
                    day.isToday ? "text-blue-700" : "text-gray-700"
                  )}>
                    {format(day.date, "d")}
                  </span>
                  
                  {/* Indicateur de charge */}
                  <div className="w-full mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Charge</span>
                      <span className={cn(
                        day.loadLevel === 'critical' ? "text-red-600 font-semibold" :
                        day.loadLevel === 'high' ? "text-orange-600" :
                        day.loadLevel === 'medium' ? "text-yellow-600" :
                        "text-green-600"
                      )}>
                        {totalLoad}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          day.loadLevel === 'critical' ? "bg-red-500" :
                          day.loadLevel === 'high' ? "bg-orange-500" :
                          day.loadLevel === 'medium' ? "bg-yellow-500" :
                          "bg-green-500"
                        )}
                        style={{ width: `${Math.min(100, (totalLoad / 80) * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Indicateur de retard */}
                  {totalLate > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-medium text-red-600">{totalLate}</span>
                    </div>
                  )}
                  
                  {/* Mini indicateurs par étape */}
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {WORKFLOW_STEPS_NEW.map(step => {
                      const metrics = day.metrics[step.key as keyof typeof day.metrics];
                      if (metrics.predicted === 0) return null;
                      return (
                        <Tooltip key={step.key}>
                          <TooltipTrigger>
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                              metrics.late > 0 ? "bg-red-500 text-white" : STEP_COLORS[step.key as keyof typeof STEP_COLORS].dark.replace('bg-', 'bg-').replace('500', '200'),
                              metrics.late === 0 && "text-gray-700"
                            )}>
                              {metrics.predicted}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{step.label}: {metrics.predicted} ({metrics.late} retard{metrics.late > 1 ? 's' : ''})</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Statistiques semaine */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-gray-700">Statistiques semaine</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500">Total prévu</p>
              <p className="text-xl font-bold text-gray-800">
                {planningDays.reduce((sum, d) => sum + Object.values(d.metrics).reduce((s, m) => s + m.predicted, 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Retards estimés</p>
              <p className="text-xl font-bold text-red-600">
                {planningDays.reduce((sum, d) => sum + Object.values(d.metrics).reduce((s, m) => s + m.late, 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Jour de pointe</p>
              <p className="text-sm font-semibold text-gray-700">
                {planningDays.reduce((max, d) => 
                  Object.values(d.metrics).reduce((s, m) => s + m.predicted, 0) > 
                  Object.values(max.metrics).reduce((s, m) => s + m.predicted, 0) ? d : max
                , planningDays[0]).date.toLocaleDateString('fr-FR', { weekday: 'long' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Taux ponctualité</p>
              <p className="text-xl font-bold text-green-600">
                {Math.round((planningDays.reduce((sum, d) => sum + Object.values(d.metrics).reduce((s, m) => s + m.onTime, 0), 0) /
                  Math.max(1, planningDays.reduce((sum, d) => sum + Object.values(d.metrics).reduce((s, m) => s + m.total, 0), 0))) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-5">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Planning intelligent
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Prévisions et suivi des commandes par étape
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('week')}
                className={cn(viewMode === 'week' && "bg-blue-50 border-blue-300 text-blue-700")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Semaine
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('day')}
                className={cn(viewMode === 'day' && "bg-blue-50 border-blue-300 text-blue-700")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Jour
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {viewMode === 'week' ? 'Semaine précédente' : 'Jour précédent'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={goToToday} className="font-medium">
                Aujourd'hui
              </Button>
              
              <Button variant="ghost" size="sm" onClick={goToNext}>
                {viewMode === 'week' ? 'Semaine suivante' : 'Jour suivant'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          
          {/* Contenu principal */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === 'week' ? renderWeekView() : renderDayView()}
            </motion.div>
          </AnimatePresence>
          
          {/* Dialogue des commandes pour une étape donnée */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedStep && (
                    <>
                      {WORKFLOW_STEPS_NEW.find(s => s.key === selectedStep)?.icon &&
                        React.createElement(WORKFLOW_STEPS_NEW.find(s => s.key === selectedStep)!.icon, { className: "h-5 w-5 text-blue-600" })
                      }
                      Commandes - {WORKFLOW_STEPS_NEW.find(s => s.key === selectedStep)?.label}
                    </>
                  )}
                  {selectedDate && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {ordersForDate.length} commande{ordersForDate.length !== 1 ? 's' : ''} prévue{ordersForDate.length !== 1 ? 's' : ''}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : ordersForDate.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">Aucune commande prévue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ordersForDate.map((item, idx) => {
                      const order = item.order;
                      const colors = STEP_COLORS[selectedStep as keyof typeof STEP_COLORS] || STEP_COLORS.pickup;
                      
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleOrderClick(item)}
                          className={cn(
                            "rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md",
                            item.priority === 'high' ? "border-l-4 border-l-red-500 bg-red-50/30" :
                            item.priority === 'medium' ? "border-l-4 border-l-orange-500 bg-orange-50/30" :
                            "border-l-4 border-l-green-500"
                          )}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", colors.bg)}>
                                <Package className={cn("h-4 w-4", colors.text)} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-800">Commande #{order.id}</span>
                                  {item.isLate && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      En retard
                                    </Badge>
                                  )}
                                  {item.priority === 'high' && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.clientName || 'Client inconnu'}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                  <span>📦 {order.itemCount || '?'} articles</span>
                                  <span>⏰ {item.timeRemaining}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Risque</span>
                                  <span className={cn(
                                    "text-sm font-semibold",
                                    item.riskScore > 70 ? "text-red-600" :
                                    item.riskScore > 40 ? "text-orange-600" :
                                    "text-green-600"
                                  )}>
                                    {item.riskScore}%
                                  </span>
                                </div>
                                <Progress 
                                  value={item.riskScore} 
                                  className={cn(
                                    "h-1.5 w-24",
                                    item.riskScore > 70 ? "[&>div]:bg-red-500" :
                                    item.riskScore > 40 ? "[&>div]:bg-orange-500" :
                                    "[&>div]:bg-green-500"
                                  )}
                                />
                              </div>
                              <Button variant="ghost" size="sm" className="text-blue-600">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {order.specialInstructions && (
                            <div className="mt-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{order.specialInstructions}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PlanningIntelligent;