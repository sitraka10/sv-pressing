// src/pages/OrdersTab/components/PlanningIntelligent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, CalendarDays,
  Workflow, Package, Truck, Inbox, Shirt, CheckCircle2,
  AlertTriangle, Eye, MessageSquare, Droplet, Wind, RefreshCw,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Order, User } from '../types';
import { getStatusBadge, formatDate } from '../utils/format';
import { getOrderCountdown } from '../utils/sla';
import { cn } from '@/lib/utils';
import { useResponsive } from '../hooks/useResponsive';
import { isSameDay, isAfter, parseISO, format, subDays, addDays, startOfWeek, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-lg border border-slate-200 shadow-sm",
  cardHeader: "px-4 py-3 border-b border-slate-100",
  h1: "text-base font-semibold text-slate-900",
  h2: "text-sm font-semibold text-slate-900",
  label: "text-[11px] font-medium text-slate-500 uppercase tracking-wide",
  textSm: "text-xs text-slate-500",
  btn: "h-9 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-md bg-teal-700 text-sm font-medium text-white hover:bg-teal-800",
  well: "rounded-md border border-slate-200 bg-slate-50/50",
};

type Tone = "brand" | "red" | "amber" | "slate" | "violet" | "blue" | "green" | "white";
const toneClass: Record<Tone, string> = {
  brand: "bg-teal-50 text-teal-700 ring-1 ring-teal-600/10",
  red: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/10",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-slate-600/10",
  white: "bg-white ring-1 ring-slate-200", // Nampiana fotsiny (blanc)
};

const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", toneClass[tone], className)}>
    {children}
  </span>
);

/* ============================================================
   STEP META
============================================================ */
const STEP_META: Record<string, { label: string; icon: React.ElementType; tone: Tone; bar: string }> = {
  pickup:  { label: 'Ramassage',  icon: Truck,        tone: 'amber',  bar: '#f59e0b' },
  sorting: { label: 'Tri',        icon: Inbox,        tone: 'amber',  bar: '#d97706' },
  // ⚠️ Eto no novana: washing dia lasa 'white' (fotsiny) fa tsy 'blue'
  washing: { label: 'Lavage',     icon: Droplet,      tone: 'white',  bar: '#cbd5e1' },
  drying:  { label: 'Séchage',    icon: Wind,         tone: 'blue',   bar: '#0891b2' },
  ironing: { label: 'Repassage',  icon: Shirt,        tone: 'violet', bar: '#7c3aed' },
  delivery:{ label: 'Livraison',  icon: CheckCircle2, tone: 'green',  bar: '#0d9488' },
};

const STEPS_ORDER = ['pickup', 'sorting', 'washing', 'drying', 'ironing', 'delivery'] as const;
type StepKey = typeof STEPS_ORDER[number];

/* ============================================================
   TYPES
============================================================ */
interface StepBucket { orders: Order[]; late: Order[] }
type DayPlanning = Record<StepKey, StepBucket>;

interface WeekStepBucket { count: number; late: number; orders: Order[] }
interface WeekDay {
  date: Date;
  isToday: boolean;
  pickup: WeekStepBucket;
  sorting: WeekStepBucket;
  washing: WeekStepBucket;
  drying: WeekStepBucket;
  ironing: WeekStepBucket;
  delivery: WeekStepBucket;
}

interface PlanningIntelligentProps {
  orders: Order[];
  users: User[];
  onOrderClick: (order: Order) => void;
}

const emptyBucket = (): StepBucket => ({ orders: [], late: [] });
const emptyWeekBucket = (): WeekStepBucket => ({ count: 0, late: 0, orders: [] });

export const PlanningIntelligentComponent: React.FC<PlanningIntelligentProps> = ({
  orders, users, onOrderClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [ordersForStep, setOrdersForStep] = useState<Order[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [now, setNow] = useState(new Date());
  const { isMobile } = useResponsive();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ---- Planning du jour ---- */
  const todaysPlanning = useMemo<DayPlanning>(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const planning: DayPlanning = {
      pickup: emptyBucket(),
      sorting: emptyBucket(),
      washing: emptyBucket(),
      drying: emptyBucket(),
      ironing: emptyBucket(),
      delivery: emptyBucket(),
    };

    const stepMapping: Partial<Record<Order['status'], StepKey>> = {
      to_sort: 'sorting',
      to_wash: 'washing',
      to_dry: 'drying',
      to_iron: 'ironing',
      ready_to_deliver: 'delivery',
    };

    orders.forEach((order) => {
      if (order.status === 'delivered') return;

      if (order.scheduledPickupDate && isValid(parseISO(order.scheduledPickupDate))) {
        const pickupDate = parseISO(order.scheduledPickupDate);
        if (isSameDay(pickupDate, today)) {
          const late = isAfter(now, pickupDate);
          (late ? planning.pickup.late : planning.pickup.orders).push(order);
        }
      }

      if (order.scheduledDeliveryDate && isValid(parseISO(order.scheduledDeliveryDate))) {
        const deliveryDate = parseISO(order.scheduledDeliveryDate);
        if (isSameDay(deliveryDate, today)) {
          const late = isAfter(now, deliveryDate);
          (late ? planning.delivery.late : planning.delivery.orders).push(order);
        }
      }

      const stepKey = stepMapping[order.status];
      if (stepKey) {
        const countdown = getOrderCountdown(order, now);
        (countdown?.isLate ? planning[stepKey].late : planning[stepKey].orders).push(order);
      }
    });

    return planning;
  }, [orders, now]);

  /* ---- Planning de la semaine ---- */
  const weeklyPlanning = useMemo<WeekDay[]>(() => {
    const weeks: Record<string, WeekDay> = {};
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      weeks[dateKey] = {
        date,
        isToday: isSameDay(date, now),
        pickup: emptyWeekBucket(),
        sorting: emptyWeekBucket(),
        washing: emptyWeekBucket(),
        drying: emptyWeekBucket(),
        ironing: emptyWeekBucket(),
        delivery: emptyWeekBucket(),
      };
    }

    const stepMapping: Partial<Record<Order['status'], StepKey>> = {
      to_sort: 'sorting',
      to_wash: 'washing',
      to_dry: 'drying',
      to_iron: 'ironing',
      ready_to_deliver: 'delivery',
    };

    orders.forEach((order) => {
      if (order.status === 'delivered') return;

      if (order.scheduledPickupDate && isValid(parseISO(order.scheduledPickupDate))) {
        const d = parseISO(order.scheduledPickupDate);
        const k = format(d, 'yyyy-MM-dd');
        if (weeks[k]) {
          weeks[k].pickup.count++;
          if (isAfter(now, d)) weeks[k].pickup.late++;
          weeks[k].pickup.orders.push(order);
        }
      }

      if (order.scheduledDeliveryDate && isValid(parseISO(order.scheduledDeliveryDate))) {
        const d = parseISO(order.scheduledDeliveryDate);
        const k = format(d, 'yyyy-MM-dd');
        if (weeks[k]) {
          weeks[k].delivery.count++;
          if (isAfter(now, d)) weeks[k].delivery.late++;
          weeks[k].delivery.orders.push(order);
        }
      }

      const stepKey = stepMapping[order.status];
      if (stepKey) {
        const todayKey = format(now, 'yyyy-MM-dd');
        if (weeks[todayKey]) {
          weeks[todayKey][stepKey].count++;
          const c = getOrderCountdown(order, now);
          if (c?.isLate) weeks[todayKey][stepKey].late++;
          weeks[todayKey][stepKey].orders.push(order);
        }
      }
    });

    return Object.values(weeks);
  }, [orders, currentDate, now]);

  /* ---- Navigation ---- */
  const goToPrevious = () => {
    if (viewMode === 'day') {
      const d = subDays(selectedDate || currentDate, 1);
      setSelectedDate(d); setCurrentDate(d);
    } else {
      setCurrentDate(subDays(currentDate, 7));
    }
  };
  const goToNext = () => {
    if (viewMode === 'day') {
      const d = addDays(selectedDate || currentDate, 1);
      setSelectedDate(d); setCurrentDate(d);
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };
  const goToToday = () => {
    const t = new Date();
    setCurrentDate(t);
    if (viewMode === 'day') setSelectedDate(t);
  };

  const handleStepClick = (stepKey: string, list: Order[]) => {
    setSelectedStep(stepKey);
    setOrdersForStep(list);
    setDetailsDialogOpen(true);
  };

  /* ---- KPI totaux ---- */
  const totals = useMemo(() => {
    let onTime = 0, late = 0, total = 0;
    STEPS_ORDER.forEach((k) => {
      const d = todaysPlanning[k];
      onTime += d.orders.length;
      late += d.late.length;
      total += d.orders.length + d.late.length;
    });
    return { onTime, late, total };
  }, [todaysPlanning]);

  /* ============================================================
     DAY VIEW
  ============================================================ */
  const renderDayView = () => {
    const displayDate = selectedDate || currentDate;

    return (
      <div className="space-y-3">
        {/* Bandeau date */}
        <div className={cn(ui.card, "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3")}>
          <div>
            <p className={ui.label}>Planning du jour</p>
            <h2 className="text-base font-semibold text-slate-900 mt-1 capitalize">
              {format(displayDate, "EEEE d MMMM yyyy", { locale: fr })}
            </h2>
            <p className={cn(ui.textSm, "mt-0.5")}>
              {totals.total} commande{totals.total !== 1 ? 's' : ''} prévue{totals.total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="brand" className="font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              {totals.onTime} à temps
            </Pill>
            <Pill tone={totals.late > 0 ? "red" : "slate"} className={totals.late > 0 ? "font-semibold" : ""}>
              {totals.late} en retard
            </Pill>
          </div>
        </div>

        {/* Étapes — TSY MISY ICÔNE INTODY */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STEPS_ORDER.map((key) => {
            const meta = STEP_META[key];
            const data = todaysPlanning[key];
            const total = data.orders.length + data.late.length;
            const late = data.late.length;
            const pct = totals.total > 0 ? (total / totals.total) * 100 : 0;

            return (
              <motion.button
                key={key}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStepClick(meta.label, [...data.orders, ...data.late])}
                className={cn(
                  ui.card,
                  "p-3.5 text-left transition-shadow hover:shadow-md flex flex-col justify-between",
                  late > 0 && "ring-1 ring-red-300"
                )}
              >
                <div>
                  <div className="flex items-center justify-end mb-2 h-8">
                    {late > 0 && (
                      <span className="inline-flex items-center justify-center rounded-md bg-red-100 text-red-700 ring-1 ring-red-600/20 px-2 py-1 text-[11px] font-semibold">
                        {late}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{total}</p>
                  <p className={cn(ui.textSm, "mt-0.5 truncate")}>{meta.label}</p>
                </div>
                {total > 0 && (
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.bar }} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Résumé 2 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={cn(ui.card, "p-4")}>
            <p className={ui.label}>Dans les temps</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{totals.onTime}</p>
            <p className={cn(ui.textSm, "mt-0.5")}>commandes selon planning</p>
          </div>
          <div className={cn(ui.card, "p-4", totals.late > 0 && "ring-1 ring-red-300")}>
            <p className={ui.label}>En retard</p>
            <p className={cn("text-2xl font-bold mt-2 tabular-nums", totals.late > 0 ? "text-red-600" : "text-slate-900")}>
              {totals.late}
            </p>
            <p className={cn(ui.textSm, "mt-0.5")}>nécessitant attention</p>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     WEEK VIEW
  ============================================================ */
  const renderWeekView = () => {
    const weekLabel = format(weeklyPlanning[0]?.date || currentDate, "dd MMMM", { locale: fr });

    if (isMobile) {
      return (
        <div className="space-y-3">
          <div className={cn(ui.card, "p-4")}>
            <p className={ui.label}>Semaine du</p>
            <h2 className="text-base font-semibold text-slate-900 mt-1 capitalize">{weekLabel}</h2>
            <p className={cn(ui.textSm, "mt-0.5")}>Planning prévisionnel des commandes</p>
          </div>

          {weeklyPlanning.map((day, idx) => (
            <div key={idx} className={cn(ui.card, "overflow-hidden", day.isToday && "ring-1 ring-teal-600/20")}>
              <div className={cn("px-4 py-2.5 border-b border-slate-100 flex items-center justify-between", day.isToday && "bg-teal-50/40")}>
                <div>
                  <p className={cn("text-sm font-semibold capitalize", day.isToday ? "text-teal-700" : "text-slate-800")}>
                    {format(day.date, "EEEE d MMMM", { locale: fr })}
                  </p>
                  {day.isToday && <p className="text-[10px] text-teal-700 font-medium">Aujourd'hui</p>}
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {STEPS_ORDER.map((key) => {
                  const meta = STEP_META[key];
                  const data = day[key];
                  const total = data?.count || 0;
                  const late = data?.late || 0;
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5 transition-colors",
                        total > 0 && "cursor-pointer hover:bg-slate-50"
                      )}
                      onClick={() => total > 0 && data?.orders && handleStepClick(meta.label, data.orders)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">{meta.label}</span>
                      </div>
                      {total > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Pill tone={late > 0 ? "red" : "brand"} className="font-semibold">
                            {total}
                          </Pill>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <Legend />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className={cn(ui.card, "p-4")}>
          <p className={ui.label}>Semaine du</p>
          <h2 className="text-base font-semibold text-slate-900 mt-1 capitalize">{weekLabel}</h2>
          <p className={cn(ui.textSm, "mt-0.5")}>Planning prévisionnel des commandes</p>
        </div>

        <div className={cn(ui.card, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Étape
                  </th>
                  {weeklyPlanning.map((day, idx) => (
                    <th key={idx} className={cn("px-3 py-3 text-center", day.isToday && "bg-teal-50/40")}>
                      <div className={cn("text-[11px] font-medium uppercase tracking-wide", day.isToday ? "text-teal-700" : "text-slate-500")}>
                        {format(day.date, "EEE", { locale: fr })}
                      </div>
                      <div className={cn("text-lg font-bold tabular-nums", day.isToday ? "text-teal-700" : "text-slate-700")}>
                        {format(day.date, "d")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STEPS_ORDER.map((key) => {
                  const meta = STEP_META[key];
                  return (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-700">{meta.label}</span>
                        </div>
                      </td>
                      {weeklyPlanning.map((day, idx) => {
                        const data = day[key];
                        const total = data?.count || 0;
                        const late = data?.late || 0;
                        return (
                          <td key={idx} className={cn("px-3 py-2.5 text-center", day.isToday && "bg-teal-50/20")}>
                            {total > 0 ? (
                              <button
                                onClick={() => data?.orders && handleStepClick(meta.label, data.orders)}
                                className="inline-flex flex-col items-center hover:opacity-80"
                              >
                                <Pill tone={late > 0 ? "red" : "brand"} className="font-semibold">
                                  {total}
                                </Pill>
                                {late > 0 && <span className="text-[10px] text-red-600 mt-0.5 font-medium">{late} retard{late > 1 ? 's' : ''}</span>}
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
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
        <Legend />
      </div>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-teal-50 ring-1 ring-teal-600/10 flex items-center justify-center">
            <Workflow className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h2 className={ui.h1}>Planning opérationnel</h2>
            <p className={cn(ui.textSm, "mt-0.5")}>Suivi des commandes par étape</p>
          </div>
        </div>

        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={cn("h-8 px-3 text-xs gap-1.5", viewMode === 'day' ? ui.btnPrimary : "text-slate-600 hover:bg-slate-50")}
          >
            <Calendar className="h-3.5 w-3.5" />
            Jour
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn("h-8 px-3 text-xs gap-1.5", viewMode === 'week' ? ui.btnPrimary : "text-slate-600 hover:bg-slate-50")}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Semaine
          </Button>
        </div>
      </div>

      {/* Navigation date */}
      <div className={cn(ui.card, "p-2 mb-4")}>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={goToPrevious} className={cn(ui.btn, "gap-1.5")}>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{viewMode === 'week' ? 'Semaine précédente' : 'Jour précédent'}</span>
            <span className="sm:hidden">Précédent</span>
          </Button>

          <Button variant="outline" size="sm" onClick={goToToday} className={cn(ui.btn, "gap-1.5 font-medium")}>
            <RefreshCw className="h-3.5 w-3.5" />
            Aujourd'hui
          </Button>

          <Button variant="ghost" size="sm" onClick={goToNext} className={cn(ui.btn, "gap-1.5")}>
            <span className="hidden sm:inline">{viewMode === 'week' ? 'Semaine suivante' : 'Jour suivant'}</span>
            <span className="sm:hidden">Suivant</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'week' ? renderWeekView() : renderDayView()}
        </motion.div>
      </AnimatePresence>

      {/* Dialog détails */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col w-[95vw] sm:w-full p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="h-7 w-7 rounded-md bg-teal-50 ring-1 ring-teal-600/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-teal-700" />
              </div>
              Commandes — {selectedStep}
            </DialogTitle>
            <DialogDescription className={ui.textSm}>
              {ordersForStep.length} commande{ordersForStep.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-3">
              {ordersForStep.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Boxes className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Aucune commande</p>
                  <p className={cn(ui.textSm, "mt-1")}>Aucune commande pour cette étape</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ordersForStep.map((order, idx) => {
                    const client = users.find((u) => u.id === order.clientId);
                    const isLate = getOrderCountdown(order, now)?.isLate || false;
                    return (
                      <motion.button
                        key={order.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => { onOrderClick(order); setDetailsDialogOpen(false); }}
                        className={cn(
                          ui.card,
                          "w-full text-left p-3 transition-shadow hover:shadow-md border-l-2",
                          isLate ? "border-l-red-500" : "border-l-teal-500"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm text-slate-900">#{order.id}</span>
                              {getStatusBadge(order.status, isLate)}
                              {isLate && (
                                <Pill tone="red" className="font-semibold">
                                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  En retard
                                </Pill>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{client?.fullName || 'Client inconnu'}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Boxes className="h-3 w-3" />
                                {order.itemCount || '?'} articles
                              </span>
                              {order.scheduledPickupDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Ramassage : {formatDate(order.scheduledPickupDate, "dd/MM")}
                                </span>
                              )}
                              {order.scheduledDeliveryDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  Livraison : {formatDate(order.scheduledDeliveryDate, "dd/MM")}
                                </span>
                              )}
                            </div>
                            {order.specialInstructions && (
                              <div className={cn(ui.well, "mt-2 p-2 text-[11px] text-amber-700 bg-amber-50/50 border-amber-200 flex items-start gap-1.5")}>
                                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="break-words">{order.specialInstructions}</span>
                              </div>
                            )}
                          </div>
                          <div className="h-7 w-7 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ============================================================
   LÉGENDE
============================================================ */
const Legend: React.FC = () => (
  <div className={cn(ui.card, "p-3 flex flex-wrap items-center gap-3")}>
    <span className={cn(ui.label, "w-full sm:w-auto")}>Légende</span>
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
      <span className="h-2 w-2 rounded-full bg-teal-600" /> Dans les temps
    </span>
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
      <span className="h-2 w-2 rounded-full bg-red-500" /> En retard
    </span>
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
      <span className="h-2 w-2 rounded-full bg-slate-300" /> Aucune commande
    </span>
  </div>
);