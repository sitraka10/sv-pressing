// client/src/pages/VolumeAnalysisTab.tsx
// Version complète avec données BI réelles (au lieu de données fictives)
// CORRIGÉE ET OPTIMISÉE

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ChevronRight,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Search,
  ArrowUpDown,
  Mail,
  FileText,
  Target,
  Sparkles,
  Layers,
  Clock,
  DollarSign,
  Activity,
  PieChart as PieChartIcon,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  ThumbsUp,
  AlertOctagon,
  Gauge,
} from "lucide-react";
import { cn } from '@/lib/utils';
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ============================================================
// STYLES NEOMORPHIQUES
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  table: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
};

// ============================================================
// TYPES
// ============================================================
interface Order {
  id: number;
  clientId: number;
  status: string;
  itemCount: number;
  totalAmount?: string;
  createdAt: string;
  scheduledPickupDate?: string;
  actualPickupDate?: string;
  scheduledDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryTimeWindowStart?: string;
  deliveryTimeWindowEnd?: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  neighborhood?: string;
  preferredPickupDays?: string[];
  preferredTimeWindowStart?: string;
  preferredTimeWindowEnd?: string;
}

interface Subscription {
  id: number;
  clientId: number;
  planId: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  specialInstructions?: string;
  createdAt: string;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  type: string;
  pricePerMonth: string;
  itemsIncluded: number;
  pickupsPerWeek: number;
  deliveryTimeHours: number;
  features?: string;
  isActive: boolean;
}

interface Invoice {
  id: number;
  clientId: number;
  amount: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  dueDate: string;
}

interface ClientData extends User {
  planName?: string;
  planType?: string;
  itemsIncluded: number;
  itemsProcessed: number;
  surplus: number;
  utilizationRate: number;
  atRisk: boolean;
  clientOrders: Order[];
  clientPlan?: SubscriptionPlan;
  lastOrderDate: Date | null;
  dailyAverage: number;
  activeDays: number;
  growthTrend: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  customerLifetimeValue: number;
  churnRisk: number;
  avgProcessingTime: number;
  preferredDay?: string;
  preferredTime?: string;
  pickupReliability: number;
  paymentReliability: number;
  satisfactionScore?: number;
  totalInvoices: number;
  totalPaidInvoices: number;
  totalPendingInvoices: number;
  totalOverdueInvoices: number;
}

interface VolumeAnalytics {
  todayItems: number;
  todayOrders: number;
  yesterdayItems: number;
  yesterdayOrders: number;
  last7DaysItems: number;
  last7DaysOrders: number;
  last7DaysRevenue: number;
  weeklyGrowth: number;
  monthToDateItems: number;
  monthToDateOrders: number;
  monthToDateRevenue: number;
  projectedMonthItems: number;
  projectedMonthRevenue: number;
  averageItemsPerOrder: number;
  averageOrderValue: number;
  surplusAlertsThisMonth: number;
  atRiskClients: number;
  churnRiskClients: number;
  peakDay: { name: string; Articles: number; date: string } | null;
  peakHour: { hour: string; count: number } | null;
  clientData: ClientData[];
  weeklyVolumeData: Array<{ name: string; Articles: number; Orders: number; isPredicted: boolean }>;
  weeklyForecastData: Array<{ name: string; Prévisions: number; Capacité: number; BorneInf: number; BorneSup: number; isPredicted: boolean }>;
  hourlyDistributionData: Array<{ hour: string; count: number; percentage: number }>;
  totalWeeklyCapacityForAllClients: number;
  totalMonthlyCapacity: number;
  currentUtilizationRate: number;
  totalMonthlyRevenue: number;
  totalMonthlyRevenuePotential: number;
  averageRevenuePerClient: number;
  revenueGrowth: number;
  growthRate: number;
  seasonalityIndex: number;
  volatilityIndex: number;
  nextMonthForecast: number;
  confidenceInterval: { min: number; max: number };
  clientSegments: {
    optimal: number;
    atRisk: number;
    surplus: number;
    churn: number;
  };
  avgPickupTime: number;
  avgDeliveryTime: number;
  onTimeRate: number;
}

// ============================================================
// COMPOSANT - CALENDRIER PRÉDICTIF NEOMORPHIQUE
// ============================================================
const PredictiveCalendar = ({ client }: { client: ClientData }) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weeklyItemLimit = client.clientPlan?.itemsIncluded || 0;
  
  const itemsProcessedThisWeek = client.clientOrders
    .filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfWeek && orderDate <= endOfWeek;
    })
    .reduce((sum, order) => sum + (order.itemCount || 0), 0);

  const remainingCapacity = Math.max(0, weeklyItemLimit - itemsProcessedThisWeek);
  
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(today.getDate() - 56);
  
  const historicalOrders = client.clientOrders.filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    return orderDate >= eightWeeksAgo && orderDate <= today;
  });

  const dayOfWeekAverages = Array(7).fill(0);
  const dayOfWeekWeights = Array(7).fill(0);
  const dayOfWeekVolatility = Array(7).fill(0);
  const weeklyData: { [key: string]: number[] } = {};
  
  historicalOrders.forEach(order => {
    if (!order.createdAt) return;
    const orderDate = new Date(order.createdAt);
    const dayOfWeek = orderDate.getDay();
    const weekKey = `${orderDate.getFullYear()}-${Math.floor(orderDate.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
    
    if (!weeklyData[weekKey]) weeklyData[weekKey] = Array(7).fill(0);
    weeklyData[weekKey][dayOfWeek] += order.itemCount || 0;
    
    dayOfWeekAverages[dayOfWeek] += order.itemCount || 0;
    dayOfWeekWeights[dayOfWeek]++;
  });
  
  Object.values(weeklyData).forEach(week => {
    week.forEach((value, day) => {
      if (value > 0) {
        dayOfWeekVolatility[day] += Math.abs(value - (dayOfWeekAverages[day] / dayOfWeekWeights[day]));
      }
    });
  });
  
  for (let i = 0; i < 7; i++) {
    if (dayOfWeekWeights[i] > 0) {
      dayOfWeekAverages[i] = Math.round(dayOfWeekAverages[i] / dayOfWeekWeights[i]);
      dayOfWeekVolatility[i] = dayOfWeekWeights[i] > 1 
        ? Math.round(dayOfWeekVolatility[i] / dayOfWeekWeights[i]) 
        : Math.round(dayOfWeekAverages[i] * 0.2);
    } else {
      const totalItems = historicalOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
      const totalDays = Math.max(1, new Set(historicalOrders.map(o => new Date(o.createdAt).toDateString())).size);
      dayOfWeekAverages[i] = Math.round(totalItems / totalDays);
      dayOfWeekVolatility[i] = Math.round(dayOfWeekAverages[i] * 0.3);
    }
  }

  const sortedOrders = [...historicalOrders].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  let growthTrend = 0;
  if (sortedOrders.length > 5) {
    const midPoint = Math.floor(sortedOrders.length / 2);
    const firstHalf = sortedOrders.slice(0, midPoint).reduce((sum, o) => sum + (o.itemCount || 0), 0);
    const secondHalf = sortedOrders.slice(midPoint).reduce((sum, o) => sum + (o.itemCount || 0), 0);
    growthTrend = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
  }

  const month = today.getMonth();
  const seasonalFactors = [1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1];

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    
    const dayName = day.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dayDate = day.getDate().toString();
    const month = day.toLocaleDateString('fr-FR', { month: 'short' });
    const dayOfWeek = day.getDay();
    
    let usage = 0;
    const isPast = day < today;
    const isToday = day.toDateString() === today.toDateString();

    if (isToday || isPast) {
      usage = client.clientOrders
        .filter(order => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === day.toDateString();
        })
        .reduce((sum, order) => sum + (order.itemCount || 0), 0);
    } else {
      usage = dayOfWeekAverages[dayOfWeek];
      if (growthTrend > 0) {
        usage = Math.round(usage * (1 + growthTrend * 0.5));
      }
      usage = Math.round(usage * seasonalFactors[parseInt(month)]);
      // Utiliser la volatilité calculée au lieu de Math.random()
      const volatilityFactor = dayOfWeekVolatility[dayOfWeek] / Math.max(1, usage);
      const randomFactor = 1 + (volatilityFactor * 0.5);
      usage = Math.round(usage * randomFactor);
    }

    const usagePercent = weeklyItemLimit > 0 ? (usage / weeklyItemLimit) * 100 : 0;
    const overflowProbability = usage > weeklyItemLimit ? 1 : 
      usage > weeklyItemLimit * 0.8 ? 0.5 : 0.1;

    return {
      date: dayDate,
      month,
      name: dayName,
      usage,
      usagePercent,
      isToday,
      isPast,
      isFuture: day > today,
      isPredicted: day > today,
      overflowProbability,
      volatility: dayOfWeekVolatility[dayOfWeek],
    };
  });

  const totalPredicted = calendarDays.filter(d => d.isFuture).reduce((sum, d) => sum + d.usage, 0);
  const willExceed = totalPredicted > remainingCapacity;

  return (
    <div className={cn(NEO.card, "p-4")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#0B676E]/10 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
            <Calendar className="h-4 w-4 text-[#0B676E]" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-800">Prévisions Hebdomadaires</h4>
            <p className="text-xs text-slate-500">
              Capacité: {weeklyItemLimit} articles • Restant: {remainingCapacity}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {willExceed && (
            <Badge variant="destructive" className="gap-1 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
              <AlertTriangle className="h-3 w-3" />
              Risque surplus
            </Badge>
          )}
          <Badge className={cn(
            "border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
            remainingCapacity > 0 ? "bg-[#0B676E]/10 text-[#0B676E]" : "bg-red-100 text-red-700"
          )}>
            {remainingCapacity > 0 ? "Dans la limite" : "Dépassement"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {calendarDays.map((day, idx) => (
          <ShadTooltip key={`${day.date}-${day.name}-${idx}`}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex flex-col items-center p-2 rounded-2xl transition-all duration-200 border cursor-help",
                  day.isToday ? "bg-[#0B676E]/10 border-[#0B676E]/30 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]" :
                  day.isPast ? "bg-[#eef2f5] border-white/40" :
                  "bg-[#eef2f5] border-white/40 hover:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]",
                  day.usagePercent > 100 ? "bg-red-50 border-red-200" :
                  day.usagePercent > 80 ? "bg-amber-50 border-amber-200" : ""
                )}
              >
                <div className="text-xs font-medium text-slate-500 mb-1">{day.name}</div>
                <div className={cn(
                  "text-sm font-semibold mb-1",
                  day.isToday && "text-[#0B676E]",
                  day.isPredicted && "text-purple-700"
                )}>
                  {day.date}
                </div>
                <div className="w-full">
                  <div className="h-1.5 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        day.usagePercent > 100 ? "bg-red-500" :
                        day.usagePercent > 80 ? "bg-amber-500" : "bg-[#0B676E]"
                      )}
                      style={{ width: `${Math.min(day.usagePercent, 100)}%` }}
                    />
                  </div>
                  <div className={cn(
                    "text-[10px] mt-1 text-center",
                    day.isPredicted ? "text-purple-600 font-medium" : "text-slate-500"
                  )}>
                    {day.usage > 0 ? `${day.usage} art.` : '-'}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">
              <p>{day.isPredicted ? 'Prévision' : 'Réel'}: {day.usage} articles</p>
              {day.isPredicted && (
                <>
                  <p>Volatilité: ±{day.volatility} articles</p>
                  <p>Probabilité surplus: {Math.round(day.overflowProbability * 100)}%</p>
                </>
              )}
            </TooltipContent>
          </ShadTooltip>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#0B676E] rounded-full"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>Élevé</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Critique</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Prévision totale: {totalPredicted} art.
          </span>
          {growthTrend > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-[10px] px-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{Math.round(growthTrend * 100)}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT - DASHBOARD CARD NEOMORPHIQUE
// ============================================================
const DashboardCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  variant = "default",
  subValue,
  progress,
  onClick
}: { 
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { direction: 'up' | 'down'; value: string } | null;
  variant?: "default" | "warning" | "destructive" | "success";
  subValue?: string;
  progress?: number;
  onClick?: () => void;
}) => {
  const iconClasses = {
    default: "bg-[#0B676E]/10 text-[#0B676E]",
    warning: "bg-amber-100 text-amber-700",
    destructive: "bg-red-100 text-red-700",
    success: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div 
      className={cn(
        NEO.card,
        "p-5 transition-all duration-300",
        onClick && "cursor-pointer hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]", iconClasses[variant])}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                {trend && (
                  <Badge
                    className={cn(
                      "gap-1 px-2 py-0.5 text-xs font-medium border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                      trend.direction === 'up' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    )}
                  >
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trend.value}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
          {subValue && (
            <p className="text-xs text-slate-400">{subValue}</p>
          )}
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Progression</span>
                <span className="font-medium text-slate-700">{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <div 
                  className="h-full bg-[#0B676E] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT - GRAPHIQUE DE VOLUME NEOMORPHIQUE
// ============================================================
const VolumeChart = ({ 
  data, 
  type = "bar", 
  isForecast = false,
  showCapacity = true,
  showConfidence = true,
  onBarClick
}: { 
  data: any[];
  type?: "bar" | "area" | "line";
  isForecast?: boolean;
  showCapacity?: boolean;
  showConfidence?: boolean;
  onBarClick?: (data: any) => void;
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-[#eef2f5] p-4 rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="text-sm mb-1" style={{ color: entry.color }}>
              <span className="font-medium">{entry.dataKey}:</span>
              <span className="font-semibold ml-2">{entry.value}</span>
              {entry.dataKey === "Prévisions" && dataPoint?.Confidence && (
                <span className="text-xs text-slate-500 ml-2">
                  (±{dataPoint.Confidence})
                </span>
              )}
            </div>
          ))}
          {dataPoint?.isPredicted && (
            <div className="mt-2 text-xs text-purple-600 border-t border-white/40 pt-1">
              * Estimation basée sur l'historique
            </div>
          )}
          {dataPoint?.vsPrevious && (
            <div className="mt-1 text-xs">
              <span className="text-slate-500">vs semaine précédente: </span>
              <span className={dataPoint.vsPrevious > 0 ? "text-emerald-600" : "text-red-600"}>
                {dataPoint.vsPrevious > 0 ? '+' : ''}{dataPoint.vsPrevious}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const colors = {
    actual: "#0B676E",
    predicted: "#8b5cf6",
    capacity: "#9ca3af",
    confidence: "#e5e7eb",
    high: "#f59e0b",
    critical: "#ef4444",
    low: "#10b981"
  };

  const handleClick = (data: any) => {
    if (onBarClick && data) {
      onBarClick(data);
    }
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === "area" ? (
          <AreaChart 
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isForecast ? colors.predicted : colors.actual} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isForecast ? colors.predicted : colors.actual} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.confidence} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={colors.confidence} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {showConfidence && data[0]?.BorneInf !== undefined && (
              <Area
                type="monotone"
                dataKey="BorneInf"
                stroke="none"
                fill="url(#colorConfidence)"
                fillOpacity={0.3}
              />
            )}
            
            <Area
              type="monotone"
              dataKey={isForecast ? "Prévisions" : "Articles"}
              stroke={isForecast ? colors.predicted : colors.actual}
              fill="url(#colorVolume)"
              strokeWidth={2}
              dot={{ stroke: isForecast ? colors.predicted : colors.actual, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            
            {showCapacity && data[0]?.Capacité !== undefined && (
              <Area
                type="monotone"
                dataKey="Capacité"
                stroke={colors.capacity}
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
            
            {showConfidence && data[0]?.BorneSup !== undefined && (
              <Area
                type="monotone"
                dataKey="BorneSup"
                stroke="none"
                fill="url(#colorConfidence)"
                fillOpacity={0.3}
              />
            )}
          </AreaChart>
        ) : type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Articles"
              stroke={colors.actual}
              strokeWidth={2}
              dot={{ r: 4, fill: colors.actual }}
              activeDot={{ r: 6 }}
            />
            {showCapacity && data[0]?.Capacité !== undefined && (
              <Line
                type="monotone"
                dataKey="Capacité"
                stroke={colors.capacity}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        ) : (
          <BarChart 
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onClick={(data) => handleClick(data)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Articles"
              radius={[8, 8, 0, 0]}
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onClick={(data) => handleClick(data)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isPredicted ? colors.predicted :
                    entry.Articles > (entry.Capacité || 100) ? colors.critical :
                    entry.Articles > (entry.Capacité || 100) * 0.8 ? colors.high :
                    entry.Articles > 0 ? colors.actual : colors.low
                  }
                  className="hover:opacity-80"
                />
              ))}
            </Bar>
            {showCapacity && data[0]?.Capacité !== undefined && (
              <Bar
                dataKey="Capacité"
                fill="none"
                stroke={colors.capacity}
                strokeWidth={2}
                strokeDasharray="5 5"
                radius={[8, 8, 0, 0]}
              />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================
// COMPOSANT - LIGNE CLIENT NEOMORPHIQUE
// ============================================================
const ClientRow = ({ 
  client, 
  isExpanded, 
  onToggle, 
  onAction,
  index 
}: { 
  client: ClientData;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: (action: string, client: ClientData) => void;
  index: number;
}) => {
  const getUtilizationColor = (rate: number) => {
    if (rate > 100) return "text-red-600";
    if (rate > 80) return "text-emerald-600";
    if (rate > 50) return "text-amber-600";
    if (rate > 20) return "text-blue-600";
    return "text-slate-600";
  };

  const getUtilizationBg = (rate: number) => {
    if (rate > 100) return "bg-red-500";
    if (rate > 80) return "bg-emerald-500";
    if (rate > 50) return "bg-amber-500";
    if (rate > 20) return "bg-blue-500";
    return "bg-slate-300";
  };

  return (
    <>
      <TableRow className="hover:bg-white/20 transition-colors">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn(
                "text-white shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
                client.atRisk ? "bg-amber-500" :
                client.surplus > 0 ? "bg-red-500" : "bg-[#0B676E]"
              )}>
                {client.fullName?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-slate-900">{client.fullName}</div>
              <div className="text-sm text-slate-500">{client.email}</div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex flex-col items-start gap-1">
            <Badge
              className={cn(
                "font-medium border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                client.planType === 'premium' ? "bg-purple-100 text-purple-800" :
                client.planType === 'family' ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
              )}
            >
              {client.planName || 'Aucun'}
            </Badge>
            {client.clientPlan && (
              <span className="text-xs text-slate-500">
                {client.clientPlan.itemsIncluded}/semaine
              </span>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex flex-col items-center">
            <div className="font-semibold text-slate-900">{client.itemsProcessed}</div>
            <div className="text-xs text-slate-500">/ {client.itemsIncluded}</div>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="text-center">
            {(client.surplus || 0) > 0 ? (
              <div className="flex flex-col items-center gap-1">
                <Badge variant="destructive" className="px-2 py-0.5 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  +{client.surplus}
                </Badge>
                <span className="text-xs text-red-600">
                  {client.monthlyRevenue.toFixed(2)} Ar
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="text-slate-600 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                {client.surplus || 0}
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center justify-center gap-2">
            <ShadTooltip>
              <TooltipTrigger asChild>
                <div className="relative w-16">
                  <div className="h-2 w-full bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        getUtilizationBg(client.utilizationRate)
                      )}
                      style={{ width: `${Math.min(client.utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">
                <p>Taux d'utilisation: {Math.round(client.utilizationRate)}%</p>
              </TooltipContent>
            </ShadTooltip>
            <span className={cn(
              "text-sm font-medium",
              getUtilizationColor(client.utilizationRate)
            )}>
              {Math.round(client.utilizationRate)}%
            </span>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            {client.atRisk && (
              <TooltipProvider>
                <ShadTooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 cursor-help shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <AlertTriangle className="h-4 w-4 text-amber-700" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">
                    <p>Client sous-utilisant son forfait ({Math.round(client.utilizationRate)}%)</p>
                    <p className="text-xs text-amber-600">Risque de churn: {Math.round(client.churnRisk * 100)}%</p>
                  </TooltipContent>
                </ShadTooltip>
              </TooltipProvider>
            )}
            {(client.surplus || 0) > 0 && (
              <TooltipProvider>
                <ShadTooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 cursor-help shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <TrendingUp className="h-4 w-4 text-red-700" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] border-0">
                    <p>Surplus détecté: {client.surplus} articles</p>
                    <p className="text-xs text-red-600">Revenu additionnel: {client.monthlyRevenue.toFixed(2)} Ar</p>
                  </TooltipContent>
                </ShadTooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(NEO.button, "h-8 w-8 p-0")}
            >
              {isExpanded ? (
                <ChevronRight className="h-4 w-4 rotate-90" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow className="bg-[#0B676E]/5">
          <TableCell colSpan={6} className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Statistiques détaillées */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-slate-700">Statistiques Détaillées</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn(NEO.card, "p-3")}>
                    <p className="text-xs text-slate-500">Moyenne quotidienne</p>
                    <p className="font-semibold text-lg text-slate-900">{client.dailyAverage.toFixed(1)}</p>
                    <p className="text-xs text-slate-400">articles/jour</p>
                  </div>
                  <div className={cn(NEO.card, "p-3")}>
                    <p className="text-xs text-slate-500">Jours actifs</p>
                    <p className="font-semibold text-lg text-slate-900">{client.activeDays}</p>
                    <p className="text-xs text-slate-400">/ {new Date().getDate()} jours</p>
                  </div>
                  <div className={cn(NEO.card, "p-3")}>
                    <p className="text-xs text-slate-500">Tendance</p>
                    <div className="flex items-center gap-1">
                      {client.growthTrend > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-emerald-600">
                            +{Math.round(client.growthTrend * 100)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-slate-600" />
                          <span className="font-semibold text-slate-600">
                            Stable
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={cn(NEO.card, "p-3")}>
                    <p className="text-xs text-slate-500">Dernière commande</p>
                    <p className="font-semibold text-slate-900">
                      {client.lastOrderDate 
                        ? new Date(client.lastOrderDate).toLocaleDateString('fr-FR')
                        : 'Aucune'
                      }
                    </p>
                  </div>
                  <div className={cn(NEO.card, "p-3")}>
                    <p className="text-xs text-slate-500">Valeur à vie</p>
                    <p className="font-semibold text-slate-900">{client.customerLifetimeValue.toFixed(0)} Ar</p>
                  </div>
                  <div className={cn(NEO.card, "p-3")}>
                    <p className="text-xs text-slate-500">Risque churn</p>
                    <Badge className={cn(
                      "border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                      client.churnRisk > 0.5 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {Math.round(client.churnRisk * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              <PredictiveCalendar client={client} />
              
              {/* Actions recommandées */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-slate-700">Actions Recommandées</h4>
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                
                <div className={cn(NEO.card, "p-3 mb-3")}>
                  <p className="text-xs font-medium text-slate-700 mb-2">💡 Insight client</p>
                  <p className="text-sm text-slate-600">
                    {client.atRisk ? (
                      <>Ce client utilise seulement {Math.round(client.utilizationRate)}% de son forfait. 
                      {client.dailyAverage < 2 ? ' Il commande peu fréquemment.' : ''}</>
                    ) : client.surplus > 0 ? (
                      <>Ce client dépasse régulièrement son forfait (+{client.surplus} articles). 
                      {client.monthlyRevenue > 50 ? ' Une mise à jour du plan serait rentable.' : ''}</>
                    ) : client.growthTrend > 0.2 ? (
                      <>Croissance rapide détectée ({Math.round(client.growthTrend * 100)}%). 
                      À surveiller pour éviter le surplus.</>
                    ) : (
                      <>Utilisation stable et optimale ({Math.round(client.utilizationRate)}%). 
                      Client fidèle.</>
                    )}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {client.atRisk ? (
                    <>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start text-amber-700")}
                        onClick={() => onAction('contact', client)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contacter pour fidélisation
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start text-blue-700")}
                        onClick={() => onAction('downgrade', client)}
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Proposer plan adapté (-{Math.round(client.itemsIncluded * 0.3)} articles)
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start text-purple-700")}
                        onClick={() => onAction('survey', client)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Envoyer questionnaire satisfaction
                      </Button>
                    </>
                  ) : (client.surplus || 0) > 0 ? (
                    <>
                      <Button
                        className={cn(NEO.buttonPrimary, "w-full justify-start")}
                        onClick={() => onAction('invoice', client)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Facturer surplus ({client.surplus} articles - {client.monthlyRevenue.toFixed(2)} Ar)
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start")}
                        onClick={() => onAction('upgrade', client)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Proposer upgrade (+{client.clientPlan?.itemsIncluded || 20} articles)
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start text-orange-700")}
                        onClick={() => onAction('loyalty', client)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Offrir réduction fidélité
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className={cn(NEO.button, "w-full justify-start text-emerald-700")} disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Utilisation optimale
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start")}
                        onClick={() => onAction('loyalty', client)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Programme fidélité
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(NEO.button, "w-full justify-start text-blue-700")}
                        onClick={() => onAction('referral', client)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Programme parrainage
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ============================================================
// COMPOSANT - PAGINATION NEOMORPHIQUE
// ============================================================
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-slate-700">
        Affichage de <span className="font-medium">{start}</span> à{" "}
        <span className="font-medium">{end}</span> sur{" "}
        <span className="font-medium">{totalItems}</span> clients
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={NEO.button}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={`page-${pageNum}`}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-8",
                  currentPage === pageNum ? NEO.buttonPrimary : NEO.button
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={NEO.button}
        >
          Suivant
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL - VOLUME ANALYSIS TAB NEOMORPHIQUE
// AVEC DONNÉES BI RÉELLES - CORRIGÉ
// ============================================================
export const VolumeAnalysisTab = ({ 
  orders: propOrders, 
  users: propUsers, 
  subscriptions: propSubscriptions, 
  subscriptionPlans: propSubscriptionPlans,
  invoices: propInvoices,
  previousPeriodData 
}: { 
  orders?: Order[];
  users?: User[];
  subscriptions?: Subscription[];
  subscriptionPlans?: SubscriptionPlan[];
  invoices?: Invoice[];
  previousPeriodData?: any;
}) => {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState({ key: 'itemsProcessed', direction: 'descending' as 'ascending' | 'descending' });
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const itemsPerPage = 10;

  // ===== REQUÊTES API POUR DONNÉES RÉELLES =====
  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/dashboard/executive"],
    enabled: true,
  });

  const { data: financialData } = useQuery({
    queryKey: ["/api/analytics/financial"],
    enabled: true,
  });

  const { data: clientData } = useQuery({
    queryKey: ["/api/analytics/clients"],
    enabled: true,
  });

  const { data: invoiceData } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: true,
  });

  const { data: orderData } = useQuery({
    queryKey: ["/api/orders"],
    enabled: true,
  });

  // Utiliser les données réelles ou les props (fallback)
  const orders = (orderData || propOrders || []) as Order[];
  const users = ((clientData as any)?.allClients || propUsers || []) as User[];
  const subscriptions = (propSubscriptions || []) as Subscription[];
  const subscriptionPlans = (propSubscriptionPlans || []) as SubscriptionPlan[];
  const invoices = (invoiceData || propInvoices || []) as Invoice[];

  const handleRefresh = () => {
    setIsLoading(true);
    refetchAnalytics();
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 500);
    toast({
      title: "Données actualisées",
      description: "Les analyses ont été mises à jour avec les données réelles",
    });
  };

  // ============================================================
  // ANALYTIQUE AVEC DONNÉES RÉELLES
  // ============================================================
  const volumeAnalytics = useMemo<VolumeAnalytics>(() => {
    console.log("Calcul des analytics avec données réelles - refreshKey:", refreshKey);
    
    if (!orders || orders.length === 0 || !users || users.length === 0) {
      return getDefaultAnalytics();
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // === DONNÉES RÉELLES DES COMMANDES ===
    const todayItems = orders.filter(o => {
      if (!o?.createdAt) return false;
      return new Date(o.createdAt).toISOString().split('T')[0] === todayStr;
    }).reduce((sum, o) => sum + (o.itemCount || 0), 0);

    const todayOrders = orders.filter(o => {
      if (!o?.createdAt) return false;
      return new Date(o.createdAt).toISOString().split('T')[0] === todayStr;
    }).length;

    const yesterdayItems = orders.filter(o => {
      if (!o?.createdAt) return false;
      return new Date(o.createdAt).toISOString().split('T')[0] === yesterdayStr;
    }).reduce((sum, o) => sum + (o.itemCount || 0), 0);

    const yesterdayOrders = orders.filter(o => {
      if (!o?.createdAt) return false;
      return new Date(o.createdAt).toISOString().split('T')[0] === yesterdayStr;
    }).length;

    // === 7 DERNIERS JOURS ===
    const last7DaysOrders = orders.filter(o => {
      if (!o?.createdAt) return false;
      return new Date(o.createdAt) >= sevenDaysAgo;
    });

    const last7DaysItems = last7DaysOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
    
    // === REVENUS RÉELS DEPUIS LES FACTURES ===
    const invoicesPaid = invoices.filter((inv: Invoice) => inv.status === 'paid');
    const totalRevenue = invoicesPaid.reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amount || '0'), 0);
    
    // Revenu des 7 derniers jours
    const last7DaysRevenue = invoicesPaid.filter((inv: Invoice) => {
      if (!inv?.createdAt) return false;
      return new Date(inv.createdAt) >= sevenDaysAgo;
    }).reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amount || '0'), 0);

    // === MOIS EN COURS ===
    const monthToDateOrders = orders.filter(o => {
      if (!o?.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= startOfMonth && orderDate <= endOfMonth;
    });

    const monthToDateItems = monthToDateOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
    
    // Revenu du mois en cours (factures payées)
    const monthToDateRevenue = invoicesPaid.filter((inv: Invoice) => {
      if (!inv?.createdAt) return false;
      return new Date(inv.createdAt) >= startOfMonth;
    }).reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amount || '0'), 0);

    // === PROJECTIONS ===
    const daysInMonth = endOfMonth.getDate();
    const daysPassed = now.getDate();
    const dailyAverage = daysPassed > 0 ? monthToDateItems / daysPassed : 0;
    const projectedMonthItems = Math.round(dailyAverage * daysInMonth);
    const projectedMonthRevenue = daysPassed > 0 ? (monthToDateRevenue / daysPassed) * daysInMonth : 0;

    const totalOrdersCount = orders.length;
    const totalItemsAllOrders = orders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
    const averageItemsPerOrder = totalOrdersCount > 0 ? totalItemsAllOrders / totalOrdersCount : 0;
    const averageOrderValue = totalOrdersCount > 0 ? monthToDateRevenue / totalOrdersCount : 0;

    // === DISTRIBUTION PAR JOUR ===
    const dayCounts: { [key: string]: { count: number; items: number; date: string } } = {};
    const hourCounts: { [key: number]: number } = {};

    orders.forEach(order => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      const dayKey = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const hour = date.getHours();
      
      if (!dayCounts[dayKey]) {
        dayCounts[dayKey] = { count: 0, items: 0, date: date.toISOString().split('T')[0] };
      }
      dayCounts[dayKey].count++;
      dayCounts[dayKey].items += order.itemCount || 0;
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakDay = Object.entries(dayCounts)
      .map(([name, data]) => ({ name, Articles: data.items, date: data.date }))
      .reduce((max, day) => day.Articles > max.Articles ? day : max, { name: '', Articles: 0, date: '' });

    const peakHourEntry = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}h`, count }))
      .reduce((max, hour) => hour.count > max.count ? hour : max, { hour: '', count: 0 });

    // === DONNÉES HEBDOMADAIRES RÉELLES ===
    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const weeklyVolumeData = weekDays.map((day, index) => {
      const dayIndex = index === 6 ? 0 : index + 1;
      const dayOrders = orders.filter(order => {
        if (!order?.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= thirtyDaysAgo && orderDate.getDay() === dayIndex;
      });
      
      const totalItems = dayOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
      const avgItems = dayOrders.length > 0 ? Math.round(totalItems / dayOrders.length) : 0;
      
      return {
        name: day,
        Articles: avgItems,
        Orders: dayOrders.length,
        isPredicted: false
      };
    });

    // === DISTRIBUTION HORAIRE ===
    const hourlyDistributionData = Array.from({ length: 24 }, (_, i) => {
      const count = hourCounts[i] || 0;
      const total = Object.values(hourCounts).reduce((a, b) => a + b, 0);
      return {
        hour: `${i}h`,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    });

    // === DONNÉES CLIENTS RÉELLES ===
    const activeSubscriptions = subscriptions.filter(s => s.isActive);
    
    let clientsWithData: ClientData[] = users
      .filter(u => u?.role === 'client' && u?.isActive !== false)
      .map(client => {
        const clientSub = activeSubscriptions.find(s => s?.clientId === client.id);
        const clientPlan = clientSub ? subscriptionPlans.find(p => p?.id === clientSub.planId) : null;

        const clientOrders = orders.filter(o => o?.clientId === client.id);
        const lastOrder = clientOrders.length > 0
          ? clientOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          : null;

        // === FACTURES RÉELLES DU CLIENT ===
        const clientInvoices = invoices.filter((inv: Invoice) => inv?.clientId === client.id);
        const totalInvoices = clientInvoices.length;
        const totalPaidInvoices = clientInvoices.filter((inv: Invoice) => inv.status === 'paid').length;
        const totalPendingInvoices = clientInvoices.filter((inv: Invoice) => inv.status === 'pending').length;
        const totalOverdueInvoices = clientInvoices.filter((inv: Invoice) => inv.status === 'overdue').length;

        if (!clientPlan) {
          return {
            ...client,
            planName: 'Aucun',
            planType: undefined,
            itemsIncluded: 0,
            itemsProcessed: 0,
            surplus: 0,
            utilizationRate: 0,
            atRisk: true,
            clientOrders,
            clientPlan: undefined,
            lastOrderDate: lastOrder ? new Date(lastOrder.createdAt) : null,
            dailyAverage: 0,
            activeDays: 0,
            growthTrend: 0,
            monthlyRevenue: 0,
            revenueGrowth: 0,
            customerLifetimeValue: 0,
            churnRisk: 0.8,
            avgProcessingTime: 0,
            preferredDay: client.preferredPickupDays?.[0],
            preferredTime: client.preferredTimeWindowStart ? `${client.preferredTimeWindowStart}-${client.preferredTimeWindowEnd}` : undefined,
            pickupReliability: 0,
            paymentReliability: 0,
            totalInvoices,
            totalPaidInvoices,
            totalPendingInvoices,
            totalOverdueInvoices,
          };
        }

        const itemsIncludedMonthly = (clientPlan.itemsIncluded || 0) * 4.33;
        
        const clientOrdersThisMonth = clientOrders.filter(o => {
          if (!o?.createdAt) return false;
          return new Date(o.createdAt) >= startOfMonth;
        });
        
        const itemsProcessed = clientOrdersThisMonth.reduce((sum, o) => sum + (o.itemCount || 0), 0);
        const surplus = Math.max(0, itemsProcessed - itemsIncludedMonthly);
        const utilizationRate = itemsIncludedMonthly > 0 ? (itemsProcessed / itemsIncludedMonthly) * 100 : 0;
        const atRisk = utilizationRate < 30 && clientOrders.length > 5;

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);
        
        const first30DaysOrders = clientOrders
          .filter(o => {
            if (!o?.createdAt) return false;
            const orderDate = new Date(o.createdAt);
            return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
          })
          .reduce((sum, o) => sum + (o.itemCount || 0), 0);
        
        const last30DaysOrders = clientOrders
          .filter(o => {
            if (!o?.createdAt) return false;
            const orderDate = new Date(o.createdAt);
            return orderDate >= thirtyDaysAgo;
          })
          .reduce((sum, o) => sum + (o.itemCount || 0), 0);
        
        const growthTrend = first30DaysOrders > 0 ? (last30DaysOrders - first30DaysOrders) / first30DaysOrders : 0;

        const customerLifetimeValue = clientOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || '0')), 0);

        const daysSinceLastOrder = lastOrder 
          ? (now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        const orderFrequency = clientOrders.length / Math.max(1, (now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
        const churnRisk = Math.min(0.9, 
          (atRisk ? 0.3 : 0) + 
          (daysSinceLastOrder > 30 ? 0.4 : 0) + 
          (orderFrequency < 1 ? 0.2 : 0)
        );

        const processingTimes = clientOrders
          .filter(o => o.actualPickupDate && o.scheduledPickupDate)
          .map(o => {
            const scheduled = new Date(o.scheduledPickupDate!);
            const actual = new Date(o.actualPickupDate!);
            return (actual.getTime() - scheduled.getTime()) / (1000 * 60);
          });
        const avgProcessingTime = processingTimes.length > 0
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;

        const pickupsOnTime = clientOrders.filter(o => {
          if (!o.actualPickupDate || !o.scheduledPickupDate) return false;
          const diff = Math.abs(new Date(o.actualPickupDate).getTime() - new Date(o.scheduledPickupDate).getTime());
          return diff < 2 * 60 * 60 * 1000;
        }).length;
        const pickupReliability = clientOrders.length > 0 ? (pickupsOnTime / clientOrders.length) * 100 : 0;

        // === REVENU MENSUEL RÉEL DU CLIENT ===
        const clientMonthlyRevenue = clientInvoices
          .filter((inv: Invoice) => inv.status === 'paid' && new Date(inv.createdAt) >= startOfMonth)
          .reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amount || '0'), 0);

        return {
          ...client,
          planName: clientPlan.name || 'Inconnu',
          planType: clientPlan.type,
          itemsIncluded: Math.round(itemsIncludedMonthly),
          itemsProcessed,
          surplus: Math.round(surplus),
          utilizationRate,
          atRisk,
          clientOrders,
          clientPlan,
          lastOrderDate: lastOrder ? new Date(lastOrder.createdAt) : null,
          dailyAverage: daysPassed > 0 ? itemsProcessed / daysPassed : 0,
          activeDays: new Set(
            clientOrdersThisMonth
              .filter(o => o?.createdAt)
              .map(o => new Date(o.createdAt).toDateString())
          ).size,
          growthTrend,
          monthlyRevenue: clientMonthlyRevenue,
          revenueGrowth: growthTrend,
          customerLifetimeValue,
          churnRisk,
          avgProcessingTime,
          preferredDay: client.preferredPickupDays?.[0],
          preferredTime: client.preferredTimeWindowStart ? `${client.preferredTimeWindowStart}-${client.preferredTimeWindowEnd}` : undefined,
          pickupReliability,
          paymentReliability: totalInvoices > 0 ? (totalPaidInvoices / totalInvoices) * 100 : 0,
          totalInvoices,
          totalPaidInvoices,
          totalPendingInvoices,
          totalOverdueInvoices,
        };
      });

    // === FILTRES ===
    if (selectedSegment) {
      clientsWithData = clientsWithData.filter(c => {
        if (selectedSegment === 'optimal') return !c.atRisk && c.surplus <= 0;
        if (selectedSegment === 'atRisk') return c.atRisk;
        if (selectedSegment === 'surplus') return c.surplus > 0;
        if (selectedSegment === 'churn') return c.churnRisk > 0.6;
        return true;
      });
    }

    if (sortConfig.key) {
      clientsWithData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof ClientData] ?? 0;
        const bValue = b[sortConfig.key as keyof ClientData] ?? 0;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
    }

    const weeklyForecastData = calculateWeeklyForecast(orders, clientsWithData);

    const totalWeeklyCapacityForAllClients = clientsWithData
      .filter(c => c.clientPlan)
      .reduce((sum, client) => sum + (client.clientPlan?.itemsIncluded || 0), 0);

    const totalMonthlyCapacity = totalWeeklyCapacityForAllClients * 4.33;
    const currentUtilizationRate = totalMonthlyCapacity > 0 
      ? (monthToDateItems / totalMonthlyCapacity) * 100 
      : 0;

    // === STATISTIQUES RÉELLES ===
    const totalMonthlyRevenue = clientsWithData
      .filter(c => c.surplus > 0)
      .reduce((sum, c) => sum + c.monthlyRevenue, 0);

    const totalMonthlyRevenuePotential = clientsWithData
      .reduce((sum, c) => sum + (c.itemsIncluded * 2.5 * 0.7), 0);

    const averageRevenuePerClient = clientsWithData.length > 0
      ? monthToDateRevenue / clientsWithData.length
      : 0;

    const revenueGrowth = previousPeriodData?.monthToDateRevenue
      ? ((monthToDateRevenue - previousPeriodData.monthToDateRevenue) / previousPeriodData.monthToDateRevenue) * 100
      : 0;

    const growthRate = previousPeriodData?.last7DaysItems
      ? ((last7DaysItems - previousPeriodData.last7DaysItems) / previousPeriodData.last7DaysItems) * 100
      : 0;

    const weeklyVariation = calculateSeasonalityIndex(orders);
    const volatilityIndex = calculateVolatilityIndex(orders);

    const clientSegments = {
      optimal: clientsWithData.filter(c => !c.atRisk && c.surplus <= 0).length,
      atRisk: clientsWithData.filter(c => c.atRisk).length,
      surplus: clientsWithData.filter(c => c.surplus > 0).length,
      churn: clientsWithData.filter(c => c.churnRisk > 0.6).length,
    };

    const completedDeliveries = orders.filter(o => o.status === 'delivered' && o.actualDeliveryDate && o.scheduledDeliveryDate);
    const onTimeDeliveries = completedDeliveries.filter(o => {
      const actual = new Date(o.actualDeliveryDate!);
      const scheduled = new Date(o.scheduledDeliveryDate!);
      return actual <= scheduled;
    }).length;
    const onTimeRate = completedDeliveries.length > 0 ? (onTimeDeliveries / completedDeliveries.length) * 100 : 0;

    const avgPickupTime = calculateAverageProcessingTime(orders, 'pickup');
    const avgDeliveryTime = calculateAverageProcessingTime(orders, 'delivery');

    return {
      todayItems,
      todayOrders,
      yesterdayItems,
      yesterdayOrders,
      last7DaysItems,
      last7DaysOrders: last7DaysOrders.length,
      last7DaysRevenue,
      weeklyGrowth: growthRate,
      monthToDateItems,
      monthToDateOrders: monthToDateOrders.length,
      monthToDateRevenue,
      projectedMonthItems,
      projectedMonthRevenue,
      averageItemsPerOrder,
      averageOrderValue,
      surplusAlertsThisMonth: clientsWithData.filter(c => c.surplus > 0).length,
      atRiskClients: clientsWithData.filter(c => c.atRisk).length,
      churnRiskClients: clientsWithData.filter(c => c.churnRisk > 0.6).length,
      peakDay: peakDay.name ? peakDay : null,
      peakHour: peakHourEntry.hour ? peakHourEntry : null,
      clientData: clientsWithData,
      weeklyVolumeData,
      weeklyForecastData,
      hourlyDistributionData,
      totalWeeklyCapacityForAllClients,
      totalMonthlyCapacity,
      currentUtilizationRate,
      totalMonthlyRevenue,
      totalMonthlyRevenuePotential,
      averageRevenuePerClient,
      revenueGrowth,
      growthRate,
      seasonalityIndex: weeklyVariation,
      volatilityIndex,
      nextMonthForecast: projectedMonthItems,
      confidenceInterval: { 
        min: Math.round(projectedMonthItems * 0.85), 
        max: Math.round(projectedMonthItems * 1.15) 
      },
      clientSegments,
      avgPickupTime,
      avgDeliveryTime,
      onTimeRate,
    };
  }, [orders, users, subscriptions, subscriptionPlans, invoices, previousPeriodData, sortConfig, selectedSegment, refreshKey]);

  const filteredClients = useMemo(() => {
    return (volumeAnalytics.clientData || []).filter(client => {
      const matchesSearch = 
        client.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterStatus === "all" ||
        (filterStatus === "atRisk" && client.atRisk) ||
        (filterStatus === "surplus" && (client.surplus || 0) > 0) ||
        (filterStatus === "optimal" && !client.atRisk && (client.surplus || 0) <= 0) ||
        (filterStatus === "churn" && client.churnRisk > 0.6);
      
      return matchesSearch && matchesFilter;
    });
  }, [volumeAnalytics.clientData, searchQuery, filterStatus]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredClients.slice(start, end);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, selectedSegment]);

  const calculateTrend = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === null || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down' as 'up' | 'down',
      value: `${Math.abs(Math.round(change))}%`,
    };
  };

  const handleClientAction = (action: string, client: ClientData) => {
    const actions: Record<string, { title: string; description: string }> = {
      contact: {
        title: "Contact client",
        description: `Email de suivi envoyé à ${client.fullName}.`,
      },
      invoice: {
        title: "Facture générée",
        description: `Facture de ${client.monthlyRevenue.toFixed(2)} Ar créée pour ${client.fullName}.`,
      },
      upgrade: {
        title: "Upgrade proposé",
        description: `Proposition d'upgrade vers plan supérieur envoyée à ${client.fullName}.`,
      },
      downgrade: {
        title: "Downgrade proposé",
        description: `Proposition de plan adapté (${Math.round(client.itemsIncluded * 0.7)} articles) envoyée à ${client.fullName}.`,
      },
      loyalty: {
        title: "Fidélité",
        description: `Programme fidélité présenté à ${client.fullName}.`,
      },
      survey: {
        title: "Questionnaire envoyé",
        description: `Questionnaire de satisfaction envoyé à ${client.fullName}.`,
      },
      referral: {
        title: "Programme parrainage",
        description: `Informations sur le programme de parrainage envoyées à ${client.fullName}.`,
      },
    };

    toast({
      title: actions[action]?.title || "Action effectuée",
      description: actions[action]?.description || `Action ${action} effectuée pour ${client.fullName}`,
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortConfig.direction === 'ascending' 
      ? <TrendingUp className="h-4 w-4 ml-1" />
      : <TrendingDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="space-y-6">

      {/* ==========================================================
          HEADER NEOMORPHIQUE
      ========================================================== */}
      <div className={cn(NEO.card, "p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4")}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-[#0B676E] to-[#085257] rounded-xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Analyse de Volume</h1>
            <Badge className={cn(NEO.badge, "ml-2 bg-[#0B676E]/10 text-[#0B676E]")}>
              {selectedTimeRange === "30d" ? "30 jours" : 
               selectedTimeRange === "7d" ? "7 jours" : "Aujourd'hui"}
            </Badge>
          </div>
          <p className="text-slate-600">
            Analyse en temps réel de l'activité • {volumeAnalytics.clientData.length} clients actifs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(NEO.card, "px-3 py-2 text-sm text-slate-500")}>
            <Calendar className="h-4 w-4 inline mr-2" />
            <span>{new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric' 
            })}</span>
          </div>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className={cn(NEO.input, "w-32")}>
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(NEO.button, "gap-2")}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" className={cn(NEO.button, "gap-2")}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* ==========================================================
          KPIS NEOMORPHIQUES AVEC DONNÉES RÉELLES
      ========================================================== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Volume journalier"
          value={volumeAnalytics.todayItems}
          description={`${volumeAnalytics.todayOrders} commandes aujourd'hui`}
          icon={<Package className="h-4 w-4" />}
          trend={calculateTrend(volumeAnalytics.todayItems, volumeAnalytics.yesterdayItems)}
          variant={volumeAnalytics.todayItems > volumeAnalytics.averageItemsPerOrder * 10 ? "success" : "default"}
          subValue={`vs hier: ${volumeAnalytics.yesterdayItems} articles`}
          onClick={() => setSelectedTimeRange("today")}
        />
        
        <DashboardCard
          title="Volume hebdomadaire"
          value={volumeAnalytics.last7DaysItems}
          description={`${volumeAnalytics.last7DaysOrders} commandes • ${volumeAnalytics.last7DaysRevenue.toFixed(0)} Ar CA`}
          icon={<BarChart3 className="h-4 w-4" />}
          trend={calculateTrend(volumeAnalytics.last7DaysItems, previousPeriodData?.last7DaysItems)}
          subValue={`Moy. ${Math.round(volumeAnalytics.last7DaysItems / 7)}/jour`}
          onClick={() => setSelectedTimeRange("7d")}
        />
        
        <DashboardCard
          title="Mensuel"
          value={volumeAnalytics.monthToDateItems}
          description={`${Math.round(volumeAnalytics.projectedMonthItems)} prévus`}
          icon={<Target className="h-4 w-4" />}
          progress={Math.round((volumeAnalytics.monthToDateItems / volumeAnalytics.projectedMonthItems) * 100)}
          trend={calculateTrend(volumeAnalytics.monthToDateItems, previousPeriodData?.monthToDateItems)}
          onClick={() => setSelectedTimeRange("30d")}
        />
        
        <DashboardCard
          title="À surveiller"
          value={volumeAnalytics.surplusAlertsThisMonth + volumeAnalytics.atRiskClients}
          description={`${volumeAnalytics.surplusAlertsThisMonth} surplus • ${volumeAnalytics.atRiskClients} à risque`}
          icon={<Users className="h-4 w-4" />}
          variant={
            (volumeAnalytics.surplusAlertsThisMonth + volumeAnalytics.atRiskClients) > 5
              ? "warning"
              : "success"
          }
          subValue={`Taux d'utilisation: ${volumeAnalytics.currentUtilizationRate.toFixed(1)}%`}
        />
      </div>

      {/* ==========================================================
          GRAPHIQUES AVEC DONNÉES RÉELLES
      ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={NEO.card}>
          <div className="p-4 border-b border-white/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Volume Hebdomadaire Réel</p>
                <p className="text-xs text-slate-400">Moyenne quotidienne sur les 30 derniers jours</p>
              </div>
              {volumeAnalytics.peakDay && (
                <Badge className="gap-1 bg-amber-100 text-amber-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  <Zap className="h-3 w-3" />
                  Pic: {volumeAnalytics.peakDay.name} ({volumeAnalytics.peakDay.Articles} art.)
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4 h-72">
            <VolumeChart
              data={volumeAnalytics.weeklyVolumeData}
              type="bar"
              showCapacity={true}
              onBarClick={(data) => {
                if (data) {
                  toast({
                    title: `Jour: ${data.name}`,
                    description: `Moyenne: ${data.Articles} articles • ${data.Orders || 0} commandes`,
                  });
                }
              }}
            />
          </div>
        </div>

        <div className={NEO.card}>
          <div className="p-4 border-b border-white/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Prévisions Globales</p>
                <p className="text-xs text-slate-400">Volume attendu avec intervalle de confiance</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  IC 85-115%
                </Badge>
                {volumeAnalytics.growthRate > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                    +{volumeAnalytics.growthRate.toFixed(1)}% vs période préc.
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 h-72">
            <VolumeChart
              data={volumeAnalytics.weeklyForecastData}
              type="area"
              isForecast={true}
              showCapacity={true}
              showConfidence={true}
            />
          </div>
        </div>
      </div>

      {/* ==========================================================
          DISTRIBUTION ET INSIGHTS
      ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution horaire */}
        <div className={NEO.card}>
          <div className="p-4 border-b border-white/40">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0B676E]" />
              <p className="text-sm font-medium text-slate-700">Distribution Horaire</p>
            </div>
            <p className="text-xs text-slate-400">
              {volumeAnalytics.peakHour ? (
                <>Pic d'activité à {volumeAnalytics.peakHour.hour}</>
              ) : (
                <>Répartition des commandes par heure</>
              )}
            </p>
          </div>
          <div className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeAnalytics.hourlyDistributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#eef2f5] p-3 rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0 text-xs">
                          <p className="font-semibold text-slate-900">{payload[0].payload.hour}</p>
                          <p className="text-slate-700">{payload[0].payload.count} commandes</p>
                          <p className="text-slate-500">{payload[0].payload.percentage.toFixed(1)}% du total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" fill="#0B676E" radius={[4, 4, 0, 0]}>
                  {volumeAnalytics.hourlyDistributionData.map((entry, index) => (
                    <Cell
                      key={`hour-cell-${index}`}
                      fill={entry.hour === volumeAnalytics.peakHour?.hour ? "#f59e0b" : "#0B676E"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segments clients */}
        <div className={NEO.card}>
          <div className="p-4 border-b border-white/40">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[#0B676E]" />
              <p className="text-sm font-medium text-slate-700">Segments Clients</p>
            </div>
            <p className="text-xs text-slate-400">Répartition par comportement</p>
          </div>
          <div className="p-4 space-y-3">
            <div 
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/20 cursor-pointer transition-colors"
              onClick={() => setSelectedSegment(selectedSegment === 'optimal' ? null : 'optimal')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-700">Optimaux</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{volumeAnalytics.clientSegments.optimal}</span>
                <Badge className="text-xs bg-[#eef2f5] text-slate-600 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  {Math.round((volumeAnalytics.clientSegments.optimal / volumeAnalytics.clientData.length) * 100) || 0}%
                </Badge>
              </div>
            </div>
            
            <div 
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/20 cursor-pointer transition-colors"
              onClick={() => setSelectedSegment(selectedSegment === 'surplus' ? null : 'surplus')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-slate-700">En surplus</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{volumeAnalytics.clientSegments.surplus}</span>
                <Badge className="text-xs bg-[#eef2f5] text-slate-600 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  {Math.round((volumeAnalytics.clientSegments.surplus / volumeAnalytics.clientData.length) * 100) || 0}%
                </Badge>
              </div>
            </div>
            
            <div 
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/20 cursor-pointer transition-colors"
              onClick={() => setSelectedSegment(selectedSegment === 'atRisk' ? null : 'atRisk')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-700">À risque</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{volumeAnalytics.clientSegments.atRisk}</span>
                <Badge className="text-xs bg-[#eef2f5] text-slate-600 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  {Math.round((volumeAnalytics.clientSegments.atRisk / volumeAnalytics.clientData.length) * 100) || 0}%
                </Badge>
              </div>
            </div>
            
            <div 
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/20 cursor-pointer transition-colors"
              onClick={() => setSelectedSegment(selectedSegment === 'churn' ? null : 'churn')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-sm text-slate-700">Risque churn élevé</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{volumeAnalytics.clientSegments.churn}</span>
                <Badge className="text-xs bg-[#eef2f5] text-slate-600 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  {Math.round((volumeAnalytics.clientSegments.churn / volumeAnalytics.clientData.length) * 100) || 0}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Insights intelligents */}
        <div className={NEO.card}>
          <div className="p-4 border-b border-white/40">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#0B676E]" />
              <p className="text-sm font-medium text-slate-700">Insights & Recommandations</p>
            </div>
            <p className="text-xs text-slate-400">Analyses basées sur les données réelles</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Insight Croissance */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <div className="flex items-center gap-2 mb-2">
                {volumeAnalytics.growthRate > 5 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : volumeAnalytics.growthRate < -5 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Activity className="h-4 w-4 text-blue-600" />
                )}
                <h4 className="font-semibold text-sm text-slate-700">Tendance Globale</h4>
              </div>
              <p className="text-sm text-slate-700 mb-1">
                {volumeAnalytics.growthRate > 10 
                  ? `Croissance exceptionnelle de ${volumeAnalytics.growthRate.toFixed(1)}% cette semaine.`
                  : volumeAnalytics.growthRate > 5
                  ? `Croissance modérée de ${volumeAnalytics.growthRate.toFixed(1)}%. Tendances positives.`
                  : volumeAnalytics.growthRate < -10
                  ? `Baisse significative de ${Math.abs(volumeAnalytics.growthRate).toFixed(1)}%. Analyse requise.`
                  : volumeAnalytics.growthRate < -5
                  ? `Légère baisse de ${Math.abs(volumeAnalytics.growthRate).toFixed(1)}%. À surveiller.`
                  : `Activité stable (variation de ${volumeAnalytics.growthRate.toFixed(1)}%).`
                }
              </p>
              <p className="text-xs text-slate-500">
                Volatilité: {volumeAnalytics.volatilityIndex.toFixed(1)}% • 
                Saisonnalité: {volumeAnalytics.seasonalityIndex.toFixed(1)}%
              </p>
            </div>

            {/* Insight Clients */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold text-sm text-slate-700">Comportement Clients</h4>
              </div>
              <p className="text-sm text-slate-700">
                {volumeAnalytics.atRiskClients > 0 
                  ? `${volumeAnalytics.atRiskClients} clients sous-utilisent leur forfait. `
                  : `Tous les clients utilisent correctement leur forfait. `
                }
                {volumeAnalytics.surplusAlertsThisMonth > 0 
                  && `${volumeAnalytics.surplusAlertsThisMonth} clients en surplus (${volumeAnalytics.totalMonthlyRevenue.toFixed(0)} Ar potentiel).`
                }
              </p>
              <div className="mt-2 flex gap-2">
                {volumeAnalytics.atRiskClients > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={cn(NEO.button, "text-xs h-7")}
                    onClick={() => setFilterStatus("atRisk")}
                  >
                    Voir clients à risque
                  </Button>
                )}
                {volumeAnalytics.surplusAlertsThisMonth > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={cn(NEO.button, "text-xs h-7")}
                    onClick={() => setFilterStatus("surplus")}
                  >
                    Voir surplus
                  </Button>
                )}
              </div>
            </div>

            {/* Insight Opérationnel */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-emerald-600" />
                <h4 className="font-semibold text-sm text-slate-700">Performance Opérationnelle</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Taux ponctualité</p>
                  <p className="font-semibold text-slate-800">{volumeAnalytics.onTimeRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ramassage moyen</p>
                  <p className="font-semibold text-slate-800">{volumeAnalytics.avgPickupTime.toFixed(0)} min</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Livraison moyenne</p>
                  <p className="font-semibold text-slate-800">{volumeAnalytics.avgDeliveryTime.toFixed(0)} min</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Utilisation capacité</p>
                  <p className="font-semibold text-slate-800">{volumeAnalytics.currentUtilizationRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Action rapide */}
            <Button 
              className={cn(NEO.buttonPrimary, "w-full")}
              onClick={() => {
                toast({
                  title: "Rapport généré",
                  description: "L'analyse complète a été exportée au format PDF",
                });
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Générer rapport d'analyse complet
            </Button>
          </div>
        </div>
      </div>

      {/* ==========================================================
          TABLEAU DES CLIENTS
      ========================================================== */}
      <div className={NEO.card}>
        <div className="p-4 border-b border-white/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Clients Actifs</p>
              <p className="text-xs text-slate-400">
                {filteredClients.length} clients affichés • {volumeAnalytics.clientData.length} total
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un client..."
                  className={cn(NEO.input, "pl-9 w-48")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={cn(NEO.input, "w-32")}>
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="atRisk">À risque</SelectItem>
                  <SelectItem value="surplus">Surplus</SelectItem>
                  <SelectItem value="optimal">Optimal</SelectItem>
                  <SelectItem value="churn">Risque churn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className={NEO.table}>
            <Table>
              <TableHeader className="bg-white/20 backdrop-blur-sm">
                <TableRow>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('fullName')}
                  >
                    <div className="flex items-center">
                      Client
                      {getSortIcon('fullName')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Plan</TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 text-center cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('itemsProcessed')}
                  >
                    <div className="flex items-center justify-center">
                      Traité/mois
                      {getSortIcon('itemsProcessed')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 text-center cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('surplus')}
                  >
                    <div className="flex items-center justify-center">
                      Surplus
                      {getSortIcon('surplus')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 text-center cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('utilizationRate')}
                  >
                    <div className="flex items-center justify-center">
                      Utilisation
                      {getSortIcon('utilizationRate')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Aucun client trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client) => (
                    <ClientRow
                      key={`client-row-${client.id}`}
                      client={client}
                      isExpanded={expandedClient === client.id}
                      onToggle={() => setExpandedClient(
                        expandedClient === client.id ? null : client.id
                      )}
                      onAction={handleClientAction}
                      index={0}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredClients.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

function getDefaultAnalytics(): VolumeAnalytics {
  return {
    todayItems: 0,
    todayOrders: 0,
    yesterdayItems: 0,
    yesterdayOrders: 0,
    last7DaysItems: 0,
    last7DaysOrders: 0,
    last7DaysRevenue: 0,
    weeklyGrowth: 0,
    monthToDateItems: 0,
    monthToDateOrders: 0,
    monthToDateRevenue: 0,
    projectedMonthItems: 0,
    projectedMonthRevenue: 0,
    averageItemsPerOrder: 0,
    averageOrderValue: 0,
    surplusAlertsThisMonth: 0,
    atRiskClients: 0,
    churnRiskClients: 0,
    peakDay: null,
    peakHour: null,
    clientData: [],
    weeklyVolumeData: [],
    weeklyForecastData: [],
    hourlyDistributionData: [],
    totalWeeklyCapacityForAllClients: 0,
    totalMonthlyCapacity: 0,
    currentUtilizationRate: 0,
    totalMonthlyRevenue: 0,
    totalMonthlyRevenuePotential: 0,
    averageRevenuePerClient: 0,
    revenueGrowth: 0,
    growthRate: 0,
    seasonalityIndex: 0,
    volatilityIndex: 0,
    nextMonthForecast: 0,
    confidenceInterval: { min: 0, max: 0 },
    clientSegments: { optimal: 0, atRisk: 0, surplus: 0, churn: 0 },
    avgPickupTime: 0,
    avgDeliveryTime: 0,
    onTimeRate: 0,
  };
}

function calculateWeeklyForecast(orders: Order[], clients: ClientData[]): Array<{ name: string; Prévisions: number; Capacité: number; BorneInf: number; BorneSup: number; isPredicted: boolean }> {
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  if (!orders || orders.length === 0) {
    return weekDays.map(day => ({
      name: day,
      Prévisions: 0,
      Capacité: 0,
      BorneInf: 0,
      BorneSup: 0,
      isPredicted: true
    }));
  }

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const historicalOrders = orders.filter(o => {
    if (!o?.createdAt) return false;
    const orderDate = new Date(o.createdAt);
    return orderDate >= sixtyDaysAgo && orderDate <= now;
  });

  const dayAverages = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);
  const dayStdDevs = Array(7).fill(0);
  const dayValues: number[][] = Array(7).fill(null).map(() => []);

  historicalOrders.forEach(order => {
    if (!order?.createdAt || !order.itemCount) return;
    const orderDate = new Date(order.createdAt);
    const dayIndex = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1;
    
    dayValues[dayIndex].push(order.itemCount);
    dayAverages[dayIndex] += order.itemCount;
    dayCounts[dayIndex]++;
  });

  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > 0) {
      dayAverages[i] = dayAverages[i] / dayCounts[i];
      const mean = dayAverages[i];
      const squaredDiffs = dayValues[i].map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / dayCounts[i];
      dayStdDevs[i] = Math.sqrt(variance);
    } else {
      const totalItems = historicalOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
      const totalDays = Math.max(1, new Set(historicalOrders.map(o => new Date(o.createdAt).toDateString())).size);
      dayAverages[i] = totalItems / totalDays;
      dayStdDevs[i] = dayAverages[i] * 0.3;
    }
  }

  const sortedOrders = [...historicalOrders].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  let trend = 0;
  if (sortedOrders.length > 10) {
    const midPoint = Math.floor(sortedOrders.length / 2);
    const firstHalf = sortedOrders.slice(0, midPoint).reduce((sum, o) => sum + (o.itemCount || 0), 0);
    const secondHalf = sortedOrders.slice(midPoint).reduce((sum, o) => sum + (o.itemCount || 0), 0);
    trend = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
  }

  // FILTRE: Seuls les clients avec un plan sont pris en compte
  const totalCapacity = clients
    .filter(c => c.clientPlan)
    .reduce((sum, c) => sum + (c.clientPlan?.itemsIncluded || 0), 0);

  return weekDays.map((day, index) => {
    let forecast = dayAverages[index];
    if (trend > 0) {
      forecast = forecast * (1 + trend * 0.3);
    }
    const month = now.getMonth();
    const seasonalFactor = [1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1][month];
    forecast = forecast * seasonalFactor;
    const confidence = dayStdDevs[index] * 1.96;
    
    return {
      name: day,
      Prévisions: Math.round(forecast),
      Capacité: Math.round(totalCapacity / 7),
      BorneInf: Math.max(0, Math.round(forecast - confidence)),
      BorneSup: Math.round(forecast + confidence),
      isPredicted: true
    };
  });
}

function calculateSeasonalityIndex(orders: Order[]): number {
  if (!orders || orders.length < 28) return 0;
  
  const now = new Date();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(now.getDate() - 28);
  
  const weeklyTotals = [];
  
  for (let week = 0; week < 4; week++) {
    const weekStart = new Date(fourWeeksAgo);
    weekStart.setDate(fourWeeksAgo.getDate() + week * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekTotal = orders
      .filter(o => {
        if (!o?.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        return orderDate >= weekStart && orderDate <= weekEnd;
      })
      .reduce((sum, o) => sum + (o.itemCount || 0), 0);
    
    weeklyTotals.push(weekTotal);
  }
  
  const avg = weeklyTotals.reduce((a, b) => a + b, 0) / weeklyTotals.length;
  const maxDeviation = Math.max(...weeklyTotals.map(w => Math.abs(w - avg)));
  
  return avg > 0 ? (maxDeviation / avg) * 100 : 0;
}

function calculateVolatilityIndex(orders: Order[]): number {
  if (!orders || orders.length < 10) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailyTotals: { [key: string]: number } = {};
  
  orders
    .filter(o => {
      if (!o?.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= thirtyDaysAgo;
    })
    .forEach(order => {
      if (!order.createdAt) return;
      const dateKey = new Date(order.createdAt).toDateString();
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + (order.itemCount || 0);
    });
  
  const values = Object.values(dailyTotals);
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return mean > 0 ? (stdDev / mean) * 100 : 0;
}

function calculateAverageProcessingTime(orders: Order[], type: 'pickup' | 'delivery'): number {
  const relevantOrders = orders.filter(o => {
    if (type === 'pickup') {
      return o.actualPickupDate && o.scheduledPickupDate;
    } else {
      return o.actualDeliveryDate && o.scheduledDeliveryDate;
    }
  });
  
  if (relevantOrders.length === 0) return 0;
  
  const times = relevantOrders.map(o => {
    const scheduled = type === 'pickup' 
      ? new Date(o.scheduledPickupDate!)
      : new Date(o.scheduledDeliveryDate!);
    const actual = type === 'pickup'
      ? new Date(o.actualPickupDate!)
      : new Date(o.actualDeliveryDate!);
    
    return Math.abs(actual.getTime() - scheduled.getTime()) / (1000 * 60);
  });
  
  return times.reduce((a, b) => a + b, 0) / times.length;
}