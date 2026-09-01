// src/pages/OrdersTab/components/PlanningIntelligent.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, CalendarDays,
  Workflow, Package, Truck, Inbox, Gauge, CheckCircle2,
  AlertTriangle, Eye, MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Order, User } from '../types';
import { getStatusBadge, formatDate } from '../utils/format';
import { getOrderCountdown } from '../utils/sla';
import { WORKFLOW_STEPS } from '../constants';
import { cn } from '@/lib/utils';
import { useResponsive } from '../hooks/useResponsive';
import { isSameDay, isAfter, parseISO, format, subDays, addDays, startOfWeek, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// Styles Neomorphic
const neomorphic = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
};

// Icônes spécifiques
const DropletIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
  </svg>
);

const WindIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
  </svg>
);

interface PlanningIntelligentProps {
  orders: Order[];
  users: User[];
  onOrderClick: (order: Order) => void;
}

export const PlanningIntelligentComponent: React.FC<PlanningIntelligentProps> = ({
  orders, users, onOrderClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [ordersForStep, setOrdersForStep] = useState<Order[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [now, setNow] = useState(new Date());
  const { isMobile, isDesktop } = useResponsive();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTodaysPlanning = useCallback(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const planning = {
      pickup: { orders: [] as Order[], late: [] as Order[] },
      sorting: { orders: [] as Order[], late: [] as Order[] },
      washing: { orders: [] as Order[], late: [] as Order[] },
      drying: { orders: [] as Order[], late: [] as Order[] },
      ironing: { orders: [] as Order[], late: [] as Order[] },
      delivery: { orders: [] as Order[], late: [] as Order[] }
    };

    orders.forEach(order => {
      if (order.status === 'delivered') return;

      if (order.scheduledPickupDate && isValid(parseISO(order.scheduledPickupDate))) {
        const pickupDate = parseISO(order.scheduledPickupDate);
        if (isSameDay(pickupDate, today)) {
          const isLate = isAfter(now, pickupDate);
          if (isLate) {
            planning.pickup.late.push(order);
          } else {
            planning.pickup.orders.push(order);
          }
        }
      }

      if (order.scheduledDeliveryDate && isValid(parseISO(order.scheduledDeliveryDate))) {
        const deliveryDate = parseISO(order.scheduledDeliveryDate);
        if (isSameDay(deliveryDate, today)) {
          const isLate = isAfter(now, deliveryDate);
          if (isLate) {
            planning.delivery.late.push(order);
          } else {
            planning.delivery.orders.push(order);
          }
        }
      }

      const currentStatus = order.status;
      const stepMapping: Record<string, string> = {
        'to_sort': 'sorting',
        'to_wash': 'washing',
        'to_dry': 'drying',
        'to_iron': 'ironing',
        'ready_to_deliver': 'delivery'
      };

      const stepKey = stepMapping[currentStatus];
      if (stepKey && planning[stepKey as keyof typeof planning]) {
        const countdown = getOrderCountdown(order, now);
        if (countdown?.isLate) {
          planning[stepKey as keyof typeof planning].late.push(order);
        } else {
          planning[stepKey as keyof typeof planning].orders.push(order);
        }
      }
    });

    return planning;
  }, [orders, now]);

  const getWeeklyPlanning = useCallback(() => {
    const weeks: Record<string, any> = {};
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      weeks[dateKey] = {
        date,
        isToday: isSameDay(date, now),
        pickup: { count: 0, late: 0, orders: [] },
        sorting: { count: 0, late: 0, orders: [] },
        washing: { count: 0, late: 0, orders: [] },
        drying: { count: 0, late: 0, orders: [] },
        ironing: { count: 0, late: 0, orders: [] },
        delivery: { count: 0, late: 0, orders: [] }
      };
    }

    orders.forEach(order => {
      if (order.status === 'delivered') return;

      if (order.scheduledPickupDate && isValid(parseISO(order.scheduledPickupDate))) {
        const pickupDate = parseISO(order.scheduledPickupDate);
        const dateKey = format(pickupDate, 'yyyy-MM-dd');
        if (weeks[dateKey]) {
          weeks[dateKey].pickup.count++;
          const isLatePlanning = isAfter(now, pickupDate);
          if (isLatePlanning) weeks[dateKey].pickup.late++;
          weeks[dateKey].pickup.orders.push(order);
        }
      }

      if (order.scheduledDeliveryDate && isValid(parseISO(order.scheduledDeliveryDate))) {
        const deliveryDate = parseISO(order.scheduledDeliveryDate);
        const dateKey = format(deliveryDate, 'yyyy-MM-dd');
        if (weeks[dateKey]) {
          weeks[dateKey].delivery.count++;
          const isLatePlanning = isAfter(now, deliveryDate);
          if (isLatePlanning) weeks[dateKey].delivery.late++;
          weeks[dateKey].delivery.orders.push(order);
        }
      }

      const currentStatus = order.status;
      const stepMapping: Record<string, string> = {
        'to_sort': 'sorting',
        'to_wash': 'washing',
        'to_dry': 'drying',
        'to_iron': 'ironing',
        'ready_to_deliver': 'delivery'
      };

      const stepKey = stepMapping[currentStatus];
      if (stepKey) {
        const todayKey = format(now, 'yyyy-MM-dd');
        if (weeks[todayKey]) {
          weeks[todayKey][stepKey].count++;
          const countdown = getOrderCountdown(order, now);
          if (countdown?.isLate) weeks[todayKey][stepKey].late++;
          weeks[todayKey][stepKey].orders.push(order);
        }
      }
    });

    return Object.values(weeks);
  }, [orders, currentDate, now]);

  const todaysPlanning = getTodaysPlanning();
  const weeklyPlanning = getWeeklyPlanning();

  const goToPrevious = () => {
    if (viewMode === 'day') {
      const newDate = subDays(selectedDate || currentDate, 1);
      setSelectedDate(newDate);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(subDays(currentDate, 7));
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      const newDate = addDays(selectedDate || currentDate, 1);
      setSelectedDate(newDate);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === 'day') setSelectedDate(today);
  };

  const handleStepClick = (stepKey: string, ordersList: Order[]) => {
    setSelectedStep(stepKey);
    setOrdersForStep(ordersList);
    setDetailsDialogOpen(true);
  };

  const stepColors = {
    pickup: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dark: 'bg-orange-500' },
    sorting: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dark: 'bg-yellow-500' },
    washing: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dark: 'bg-blue-500' },
    drying: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dark: 'bg-cyan-500' },
    ironing: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dark: 'bg-purple-500' },
    delivery: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dark: 'bg-green-500' }
  };

  const renderDayView = () => {
    const steps = [
      { key: 'pickup', label: 'Ramassage', icon: Truck },
      { key: 'sorting', label: 'Tri', icon: Inbox },
      { key: 'washing', label: 'Lavage', icon: DropletIcon },
      { key: 'drying', label: 'Séchage', icon: WindIcon },
      { key: 'ironing', label: 'Repassage', icon: Gauge },
      { key: 'delivery', label: 'Livraison', icon: CheckCircle2 }
    ];

    const totalOrders = steps.reduce((sum, step) => {
      const data = todaysPlanning[step.key as keyof typeof todaysPlanning];
      return sum + (data?.orders.length || 0) + (data?.late.length || 0);
    }, 0);

    const displayDate = selectedDate || currentDate;

    return (
      <div className="space-y-4">
        <div className={cn(
          neomorphic.card,
          "bg-gradient-to-br from-[#0B676E] to-teal-600 text-white p-4 sm:p-6"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">
                {format(displayDate, "EEEE d MMMM yyyy", { locale: fr })}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                {totalOrders} commande{totalOrders !== 1 ? 's' : ''} prévue{totalOrders !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge className="bg-white/20 text-white border-0 px-2 py-1 sm:px-3 sm:py-1.5 text-xs shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <Clock className="h-3 w-3 inline mr-1" />
              Mise à jour temps réel
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {steps.map(step => {
            const data = todaysPlanning[step.key as keyof typeof todaysPlanning];
            const total = (data?.orders.length || 0) + (data?.late.length || 0);
            const lateCount = data?.late.length || 0;
            const colors = stepColors[step.key as keyof typeof stepColors];
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStepClick(step.label, [...(data?.orders || []), ...(data?.late || [])])}
                className={cn(
                  neomorphic.card,
                  "p-3 sm:p-4 cursor-pointer transition-all",
                  lateCount > 0 && "ring-2 ring-red-400 ring-offset-4 ring-offset-[#eef2f5]"
                )}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={cn("p-1.5 rounded-xl", colors.bg, "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]")}>
                    <StepIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", colors.text)} />
                  </div>
                  {lateCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] sm:text-xs">
                      {lateCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xl sm:text-3xl font-bold text-gray-800">{total}</p>
                <p className="text-xs text-gray-500 mt-1">{step.label}</p>
                {total > 0 && totalOrders > 0 && (
                  <div className="mt-2 sm:mt-3">
                    <div className="h-1 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <div
                        className={cn("h-full rounded-full", colors.dark)}
                        style={{ width: `${(total / totalOrders) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={cn(neomorphic.card, "p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50")}>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span className="font-semibold text-green-800 text-sm sm:text-base">Dans les temps</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-700">
              {steps.reduce((sum, step) => {
                const data = todaysPlanning[step.key as keyof typeof todaysPlanning];
                return sum + (data?.orders.length || 0);
              }, 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 mt-1">commandes selon planning</p>
          </div>

          <div className={cn(neomorphic.card, "p-3 sm:p-4 bg-gradient-to-br from-red-50 to-orange-50")}>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="font-semibold text-red-800 text-sm sm:text-base">En retard</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-700">
              {steps.reduce((sum, step) => {
                const data = todaysPlanning[step.key as keyof typeof todaysPlanning];
                return sum + (data?.late.length || 0);
              }, 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-red-600 mt-1">commandes nécessitant attention</p>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const steps = [
      { key: 'pickup', icon: Truck, name: 'Ramassage' },
      { key: 'sorting', icon: Inbox, name: 'Tri' },
      { key: 'washing', icon: DropletIcon, name: 'Lavage' },
      { key: 'drying', icon: WindIcon, name: 'Séchage' },
      { key: 'ironing', icon: Gauge, name: 'Repassage' },
      { key: 'delivery', icon: CheckCircle2, name: 'Livraison' }
    ];

    if (isMobile) {
      return (
        <div className="space-y-4">
          <div className={cn(neomorphic.card, "bg-gradient-to-br from-[#0B676E] to-teal-600 text-white p-4")}>
            <h2 className="text-lg font-bold">
              Semaine du {format(weeklyPlanning[0]?.date || currentDate, "dd MMMM", { locale: fr })}
            </h2>
            <p className="text-white/80 text-xs mt-1">
              <Calendar className="h-3 w-3 inline mr-1" />
              Planning prévisionnel des commandes
            </p>
          </div>

          {weeklyPlanning.map((day: any, idx: number) => (
            <div key={idx} className={cn(neomorphic.card, "overflow-hidden")}>
              <div className={cn(
                "px-4 py-3 border-b border-white/40",
                day.isToday ? "bg-[#0B676E]/10" : "bg-white/20"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("font-semibold", day.isToday ? "text-[#0B676E]" : "text-gray-700")}>
                      {format(day.date, "EEEE d MMMM", { locale: fr })}
                    </p>
                    {day.isToday && <p className="text-xs text-[#0B676E]">Aujourd'hui</p>}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/30">
                {steps.map(step => {
                  const data = day[step.key];
                  const total = data?.count || 0;
                  const late = data?.late || 0;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => {
                        if (total > 0 && data?.orders) {
                          handleStepClick(step.name, data.orders);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-xl",
                          "bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                        )}>
                          <StepIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-600">{step.name}</span>
                      </div>
                      {total > 0 ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={late > 0 ? "destructive" : "secondary"}
                            className={cn(
                              "text-sm font-semibold px-2 py-1 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                              late === 0 && "bg-[#0B676E] text-white"
                            )}
                          >
                            {total}
                          </Badge>
                          {late > 0 && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className={cn(neomorphic.card, "p-3")}>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600">Dans les temps</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600">En retard</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className={cn(neomorphic.card, "bg-gradient-to-br from-[#0B676E] to-teal-600 text-white p-6")}>
          <h2 className="text-2xl font-bold">
            Semaine du {format(weeklyPlanning[0]?.date || currentDate, "dd MMMM", { locale: fr })}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            <Calendar className="h-4 w-4 inline mr-1" />
            Planning prévisionnel des commandes
          </p>
        </div>

        <div className={cn(neomorphic.card, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-white/20 backdrop-blur-sm border-b border-white/40">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Étape
                  </th>
                  {weeklyPlanning.map((day: any, idx: number) => (
                    <th key={idx} className="px-3 py-3 text-center min-w-[80px]">
                      <div className={cn(
                        "font-semibold text-sm",
                        day.isToday ? "text-[#0B676E]" : "text-gray-600"
                      )}>
                        {format(day.date, "EEE", { locale: fr })}
                      </div>
                      <div className={cn(
                        "text-lg font-bold",
                        day.isToday ? "text-[#0B676E]" : "text-gray-700"
                      )}>
                        {format(day.date, "d")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {steps.map(step => {
                  const StepIcon = step.icon;
                  return (
                    <tr key={step.key} className="border-b border-white/20 hover:bg-white/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-xl",
                            "bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                          )}>
                            <StepIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-500">{step.name}</span>
                        </div>
                      </td>
                      {weeklyPlanning.map((day: any, idx: number) => {
                        const data = day[step.key];
                        const total = data?.count || 0;
                        const late = data?.late || 0;

                        return (
                          <td
                            key={idx}
                            className="px-3 py-3 text-center cursor-pointer hover:bg-white/20 transition-colors rounded-xl"
                            onClick={() => {
                              if (total > 0 && data?.orders) {
                                handleStepClick(step.name, data.orders);
                              }
                            }}
                          >
                            {total > 0 ? (
                              <div className="flex flex-col items-center">
                                <Badge
                                  variant={late > 0 ? "destructive" : "secondary"}
                                  className={cn(
                                    "text-sm font-semibold px-2 py-1 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                    late === 0 && "bg-[#0B676E] text-white"
                                  )}
                                >
                                  {total}
                                </Badge>
                                {late > 0 && (
                                  <span className="text-xs text-red-500 mt-1">
                                    {late} retard{late > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cn(neomorphic.card, "p-4")}>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">Dans les temps</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">En retard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-600">Aucune commande</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Planning opérationnel
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            <Workflow className="h-3 w-3 inline mr-1" />
            Suivi des commandes par étape
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              viewMode === 'week' ? neomorphic.pressed : neomorphic.button,
              "text-xs sm:text-sm border-0"
            )}
          >
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Semaine
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('day')}
            className={cn(
              viewMode === 'day' ? neomorphic.pressed : neomorphic.button,
              "text-xs sm:text-sm border-0"
            )}
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Jour
          </Button>
        </div>
      </div>

      <div className={cn(neomorphic.card, "p-2 sm:p-3 mb-4")}>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={goToPrevious} className={cn(neomorphic.button, "text-xs sm:text-sm border-0")}>
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">{viewMode === 'week' ? 'Semaine précédente' : 'Jour précédent'}</span>
            <span className="sm:hidden">{viewMode === 'week' ? 'Sem.' : 'Jour'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className={cn(neomorphic.button, "font-medium text-xs sm:text-sm border-0")}
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Aujourd'hui
          </Button>

          <Button variant="ghost" size="sm" onClick={goToNext} className={cn(neomorphic.button, "text-xs sm:text-sm border-0")}>
            <span className="hidden sm:inline">{viewMode === 'week' ? 'Semaine suivante' : 'Jour suivant'}</span>
            <span className="sm:hidden">{viewMode === 'week' ? 'Sem.' : 'Jour'}</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          </Button>
        </div>
      </div>

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

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl w-[95vw] sm:w-full",
          neomorphic.glass,
          "border border-white/60"
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-800">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
              Commandes - {selectedStep}
            </DialogTitle>
            <DialogDescription>
              {ordersForStep.length} commande{ordersForStep.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {ordersForStep.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Aucune commande</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordersForStep.map((order, idx) => {
                  const client = users.find(u => u.id === order.clientId);
                  const isLate = getOrderCountdown(order, now)?.isLate || false;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        onOrderClick(order);
                        setDetailsDialogOpen(false);
                      }}
                      className={cn(
                        neomorphic.card,
                        "p-3 sm:p-4 cursor-pointer transition-all",
                        isLate ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#0B676E]"
                      )}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-xl",
                              "bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                            )}>
                              <Package className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-800 text-sm sm:text-base">Commande #{order.id}</span>
                                {getStatusBadge(order.status, isLate)}
                                {isLate && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    En retard
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {client?.fullName || 'Client inconnu'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                                <span><Package className="h-3 w-3 inline mr-1" /> {order.itemCount || '?'} articles</span>
                                {order.scheduledPickupDate && (
                                  <span><Calendar className="h-3 w-3 inline mr-1" /> Ramassage: {formatDate(order.scheduledPickupDate, "dd/MM")}</span>
                                )}
                                {order.scheduledDeliveryDate && (
                                  <span><Truck className="h-3 w-3 inline mr-1" /> Livraison: {formatDate(order.scheduledDeliveryDate, "dd/MM")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(neomorphic.button, "text-[#0B676E] border-0 flex-shrink-0")}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Détails</span>
                          </Button>
                        </div>

                        {order.specialInstructions && (
                          <div className={cn(
                            "mt-2 p-2 rounded-2xl text-xs flex items-start gap-2",
                            "bg-amber-50 text-amber-700",
                            "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                          )}>
                            <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{order.specialInstructions}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};