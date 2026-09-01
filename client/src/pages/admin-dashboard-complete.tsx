// client/src/pages/admin-dashboard-complete.tsx
// Version complète avec gestion des utilisateurs (Admin/Agent/Supervisor)
import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DeliveriesAndPickupsTab } from "./DeliveriesAndPickupsTab";
import { OrdersTab } from "./OrdersTab";
import { ClientsTab } from "./ClientsTab";
import { DriversTab } from "./DriversTab";
import { InvoicesTab } from "./InvoicesTab";
import { AgentsTab } from './admin/AgentsTab';
import AdsTab from './admin/AdsTab';
import { BITab } from "./BITab";
import { QuotesTab } from './QuotesTab';
import { RegistrationsSection, CustomQuotesSection } from "./ClientSiteSections";
import { ExpensesTab } from "./ExpensesTab";
import { PlansTab } from "./PlansTab";
import { NotificationBell } from './NotificationBell';
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import {
  ResponsiveContainer, PieChart, Pie, Tooltip as RechartsTooltip, Legend, Cell,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, AreaChart, Area, ComposedChart,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Treemap, ReferenceLine, ReferenceArea, Brush,
  ScatterChart as RechartsScatterChart,
} from "recharts";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package, Truck, Users, Euro, TrendingUp, TrendingDown, Clock, Calendar,
  FileText, FileCheck, Download, Settings, Plus, Edit, Loader2, Printer,
  Search, RotateCcw, MapPin, Filter, Eye, EyeOff, History, UserCheck, UserPlus,
  Phone, CheckCircle, Check, X, AlertTriangle, XCircle, Trash2, Route, BarChart3,
  Timer, DollarSign, User, ChevronLeft, ChevronRight, Brain, Sparkles, Zap, Target,
  LogOut, Shield, Star, Repeat, Bell, ListFilter, Lock, Pencil, FilterX, Mail,
  FilePlus, Info, Smartphone, Landmark, CreditCard, Wallet, CalendarDays, Megaphone,
  LayoutDashboard, ArrowUp, ArrowDown, Percent, Crown, Award, Medal, RefreshCw,
  PieChart as PieChartIcon, Gauge, Activity, Flame, Snowflake, Cloud, Sun, Moon,
  Wind, Droplets, Compass, Layers, Grid, List, PanelLeft, PanelRight, Maximize2,
  Minimize2, ArrowRight, ArrowLeft, Circle, CircleCheck, CircleAlert, CircleX,
  IndianRupee, Coins, Receipt, ClipboardList, CalendarRange, ClockArrowUp,
  ClockArrowDown, HandCoins, BadgeCheck, BadgeAlert, BadgeInfo, BadgeX,
  ChartNoAxesColumn, ChartSpline, ChartCandlestick, ChartPie, BarChartHorizontal,
  LineChart as LineChartIcon, AreaChart as AreaChartIcon, Radar as RadarIcon,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, CircleDollarSign,
  Banknote, PiggyBank, Briefcase, Building, Building2, Store, ShoppingBag, ShoppingCart,
  Clipboard, ClipboardCheck, ClipboardX, Ticket, TicketCheck, TicketX, Blocks, Grid2x2,
  LayoutGrid, LayoutPanelTop, LayoutTemplate, PanelTop, PanelBottom, PanelTopInactive,
  PanelBottomInactive, Split, Merge, ArrowUpFromDot, ArrowDownToDot, ArrowUpWideNarrow,
  ArrowDownWideNarrow, SlidersHorizontal, SlidersVertical, GripVertical, GripHorizontal,
  MoveHorizontal, MoveVertical, Maximize, Minimize, ZoomIn, ZoomOut, Rotate3d, Orbit,
  Globe, Network, Share2, Link, Link2, Unlink, ExternalLink, ArrowUpRight, ArrowDownLeft,
  ArrowRightLeft, ArrowLeftRight, CornerDownRight, CornerDownLeft, CornerUpRight,
  CornerUpLeft, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight, ChevronUp,
  ChevronDown, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  AlignLeft, AlignRight, AlignCenter, AlignJustify, Indent, Outdent, ListChecks,
  ListTodo, ListEnd, ListStart, ListCollapse, ListTree, ListVideo, ListMusic,
  ListFilter as ListFilterIcon, ListPlus, ListMinus, ListRestart, ListOrdered, ListX,
  ListChevron, ListBullet, ListNumber, ListArrow, ListChecks as ListChecksIcon,
  Headphones, Key,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, isWithinInterval, subHours, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { VolumeAnalysisTab } from "./VolumeAnalysisTab";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// ============================================================
// STYLES NEOMORPHIQUES - CONSTANTES
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
};

// ============================================================
// CONSTANTES & COULEURS - PALETTE PROFESSIONNELLE
// ============================================================
const COLORS = {
  primary: "#0B676E",
  primaryLight: "#20B2AA",
  primaryDark: "#085257",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
  purple: "#7C3AED",
  pink: "#DB2777",
  orange: "#EA580C",
  indigo: "#4F46E5",
  teal: "#0D9488",
  gray: "#6B7280",
  slate: "#475569",
  zinc: "#71717A",
  neutral: "#737373",
  stone: "#78716C",
  amber: "#D97706",
  lime: "#65A30D",
  emerald: "#059669",
  cyan: "#0891B2",
  sky: "#0284C7",
  violet: "#7C3AED",
  fuchsia: "#C026D3",
  rose: "#E11D48",
  chart: ["#0B676E", "#20B2AA", "#0D9488", "#0891B2", "#2563EB", "#4F46E5", "#7C3AED", "#DB2777", "#D97706", "#DC2626"],
  status: {
    to_pickup: "#D97706",
    to_sort: "#2563EB",
    to_wash: "#7C3AED",
    to_dry: "#DB2777",
    to_iron: "#EA580C",
    ready_to_deliver: "#059669",
    to_deliver: "#0891B2",
    delivered: "#10B981"
  }
};

const STATUS_LABELS: Record<string, string> = {
  to_pickup: "À ramasser",
  to_sort: "À trier",
  to_wash: "À laver",
  to_dry: "À sécher",
  to_iron: "À repasser",
  ready_to_deliver: "Prêt à livrer",
  to_deliver: "À livrer",
  delivered: "Livré"
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================
const safeArray = (data: any): any[] => Array.isArray(data) ? data : [];
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M Ar`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K Ar`;
  return `${Math.round(value).toLocaleString()} Ar`;
};
const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};
const formatDate = (date: any): string => {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : format(d, "dd/MM/yyyy", { locale: fr });
};
const formatDateTime = (date: any): string => {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : format(d, "dd/MM/yyyy HH:mm", { locale: fr });
};
const getStatusLabel = (status: string): string => STATUS_LABELS[status] || status;
const getStatusColor = (status: string): string => COLORS.status[status as keyof typeof COLORS.status] || COLORS.gray;

// ============================================================
// SCHÉMAS DE VALIDATION
// ============================================================
const newOrderSchema = z.object({
  clientId: z.number(),
  itemCount: z.number().min(1, "Au moins 1 pièce"),
  pickupDate: z.date(),
  timeWindowStart: z.string().optional(),
  timeWindowEnd: z.string().optional(),
  specialInstructions: z.string().optional(),
});

const assignDeliverySchema = z.object({
  deliveryPersonId: z.number().optional(),
  scheduledDate: z.date(),
  notes: z.string().optional(),
}).refine(data => data.deliveryPersonId && data.deliveryPersonId > 0, {
  message: "Veuillez sélectionner un livreur",
  path: ["deliveryPersonId"],
});

// ============================================================
// COMPOSANT - CARTE KPI PROFESSIONNELLE
// ============================================================
interface KPIProfessionalProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
  progress?: number;
  progressLabel?: string;
  onClick?: () => void;
}

const KPIProfessional: React.FC<KPIProfessionalProps> = ({
  title, value, subtitle, trend, trendLabel, icon, color = "primary",
  loading, progress, progressLabel, onClick
}) => {
  const isPositive = trend !== undefined && trend >= 0;
  const colorMap: Record<string, string> = {
    primary: "bg-[#0B676E]/10 text-[#0B676E]",
    success: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
    gray: "bg-gray-50 text-gray-600"
  };
  const progressColorMap: Record<string, string> = {
    primary: "bg-[#0B676E]",
    success: "bg-emerald-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    yellow: "bg-amber-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500",
    gray: "bg-gray-500"
  };
  return (
    <div className={cn(NEO.card, "p-5", onClick && "cursor-pointer")} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
          {trend !== undefined && !loading && trend !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium mt-1",
              isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% {trendLabel || "vs mois précédent"}
            </div>
          )}
          {progress !== undefined && !loading && (
            <div className="mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{progressLabel || "Progression"}</span>
                <span className="font-medium text-slate-700">{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#eef2f5] rounded-full overflow-hidden mt-0.5 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", progressColorMap[color] || progressColorMap.primary)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3",
          colorMap[color] || colorMap.primary,
          "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT - MINI TREND CHART
// ============================================================
const MiniTrendChart: React.FC<{ data: any[]; dataKey: string; color?: string; height?: number }> = ({
  data, dataKey, color = "#0B676E", height = 40
}) => {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ============================================================
// COMPOSANT - COMPARATIF PROFESSIONNEL
// ============================================================
const ComparisonProfessional: React.FC<{
  title: string;
  current: number;
  previous: number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
}> = ({ title, current, previous, unit = "", icon, color = "teal" }) => {
  const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const isPositive = diff >= 0;
  const colorMap: Record<string, string> = {
    teal: "border-[#0B676E]/20 bg-[#0B676E]/5",
    emerald: "border-emerald-100 bg-emerald-50",
    blue: "border-blue-100 bg-blue-50",
    red: "border-red-100 bg-red-50",
    amber: "border-amber-100 bg-amber-50",
    purple: "border-purple-100 bg-purple-50"
  };
  return (
    <div className={cn("rounded-2xl border p-4", colorMap[color] || colorMap.teal, NEO.card)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <p className="text-xs font-medium text-slate-500">{title}</p>
        </div>
        <Badge className={cn(
          "text-[10px] font-medium border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
          isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        )}>
          {isPositive ? "+" : ""}{diff}%
        </Badge>
      </div>
      <div className="flex items-end gap-3 mt-1">
        <p className="text-xl font-bold text-slate-900">{current}{unit}</p>
        <p className="text-xs text-slate-400">vs {previous}{unit}</p>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT - HEALTH GAUGE
// ============================================================
const HealthGauge: React.FC<{ score: number; status: string }> = ({ score, status }) => {
  const statusConfig = {
    excellent: { color: "bg-emerald-500", label: "Excellent", icon: <BadgeCheck className="h-4 w-4" /> },
    bon: { color: "bg-blue-500", label: "Bon", icon: <CircleCheck className="h-4 w-4" /> },
    attention: { color: "bg-amber-500", label: "Attention", icon: <CircleAlert className="h-4 w-4" /> },
    critique: { color: "bg-red-500", label: "Critique", icon: <CircleX className="h-4 w-4" /> }
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.excellent;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className={cn(
          "h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white",
          config.color,
          "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]"
        )}>
          {score}%
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Badge className={cn("text-[10px] gap-1 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]", config.color)}>
            {config.icon} {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT - CANDLESTICK CHART
// ============================================================
const CandlestickChart: React.FC<{ data: any[]; dataKey: string; color?: string }> = ({
  data, dataKey, color = "#0B676E"
}) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-xs">Données insuffisantes</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
        <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => formatCurrency(v)} />
        <RechartsTooltip
          contentStyle={{ backgroundColor: "#eef2f5", border: "none", borderRadius: "16px", fontSize: "11px", boxShadow: "12px 12px 24px #b8c2ca, -12px -12px 24px #ffffff" }}
          formatter={(value: any) => [formatCurrency(Number(value)), "CA"]}
        />
        <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ============================================================
// COMPOSANT - SCATTER PLOT
// ============================================================
const CorrelationScatter: React.FC<{ data: any[]; xKey: string; yKey: string }> = ({
  data, xKey, yKey
}) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-xs">Données insuffisantes</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={9} />
        <YAxis dataKey={yKey} stroke="#94a3b8" fontSize={9} />
        <RechartsTooltip
          contentStyle={{ backgroundColor: "#eef2f5", border: "none", borderRadius: "16px", fontSize: "11px", boxShadow: "12px 12px 24px #b8c2ca, -12px -12px 24px #ffffff" }}
          formatter={(value: any, name: string) => [value, name === 'orders' ? 'Commandes' : 'Revenus']}
        />
        <Scatter name="Corrélation" data={data} fill="#0B676E" />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
};

// ============================================================
// COMPOSANT - RADAR CHART
// ============================================================
const PerformanceRadar: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-xs">Données insuffisantes</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
        <PolarRadiusAxis stroke="#94a3b8" fontSize={9} />
        <RechartsTooltip
          contentStyle={{ backgroundColor: "#eef2f5", border: "none", borderRadius: "16px", fontSize: "11px", boxShadow: "12px 12px 24px #b8c2ca, -12px -12px 24px #ffffff" }}
        />
        <Radar name="Performance" dataKey="value" stroke="#0B676E" fill="#0B676E" fillOpacity={0.3} />
        <Radar name="Objectif" dataKey="target" stroke="#20B2AA" fill="#20B2AA" fillOpacity={0.1} strokeDasharray="5 5" />
        <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// ============================================================
// COMPOSANT - DASHBOARD EXECUTIF BI
// ============================================================
const ExecutiveDashboardBI: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["/api/dashboard/stats"] });
  const { data: orderAnalytics, isLoading: ordersLoading } = useQuery({ queryKey: ["/api/analytics/orders"] });
  const { data: deliveryAnalytics, isLoading: deliveryLoading } = useQuery({ queryKey: ["/api/analytics/deliveries"] });
  const { data: clientAnalytics, isLoading: clientsLoading } = useQuery({ queryKey: ["/api/analytics/clients"] });
  const { data: lateOrdersData, isLoading: lateLoading } = useQuery({ queryKey: ["/api/analytics/late-orders"] });
  const { data: executiveData, isLoading: executiveLoading } = useQuery({ queryKey: ["/api/dashboard/executive"] });
  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({ queryKey: ["/api/analytics/hourly"] });

  const isLoading = statsLoading || ordersLoading || deliveryLoading || clientsLoading || lateLoading || executiveLoading || hourlyLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#0B676E]" />
        <p className="text-slate-500 text-sm">Chargement du tableau de bord exécutif...</p>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-[#0B676E] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-[#0B676E] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-[#0B676E] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const orders = orderAnalytics || { total: 0, active: 0, delivered: 0, today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, growth: 0, lateOrders: 0, lateStats: { pickupLate: 0, deliveryLate: 0, statusStuck: 0, criticalLate: 0, avgLateHours: 0 }, byStatus: {} };
  const deliveries = deliveryAnalytics || { total: 0, completed: 0, pending: 0, assigned: 0, failed: 0, successRate: 0, avgDeliveryTime: 0, monthDeliveries: 0, monthCompleted: 0, byStatus: {}, last30Days: [] };
  const clients = clientAnalytics || { total: 0, active: 0, pending: 0, refused: 0, approved: 0, inactive: 0, newThisMonth: 0, newThisYear: 0, clientsWithOrdersThisMonth: 0, retention: 0, engagementRate: 0, topClients: [] };
  const lateData = lateOrdersData || { activeLate: { total: 0, pickupLate: 0, deliveryLate: 0, stuckStatus: 0, criticalLate: 0, avgLateHours: 0, byStatus: {}, details: [] }, recentHistory: [], summary: { totalLateLast30Days: 0, resolvedLast30Days: 0 } };
  const executive = executiveData || { financial: { monthly: { revenue: 0, revenueGrowth: 0, expenses: 0, expensesGrowth: 0, grossProfit: 0, grossMargin: 0, averageOrderValue: 0, projectedRevenue: 0 }, expensesByCategory: [], revenueByMonth: [] }, operational: { orders: { total: 0, active: 0, delivered: 0, last30Days: 0, predictedNextMonth: 0 }, processing: { averageHours: 0, lateOrders: { total: 0 } }, driverPerformance: [] }, clients: { topClients: [], cohorts: [] }, alerts: [], recommendations: [] };
  const hourlyStats = hourlyData || { byHour: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, orders: 0, revenue: 0 })) };

  const monthlyRevenue = executive?.financial?.monthly?.revenue || 0;
  const monthlyExpenses = executive?.financial?.monthly?.expenses || 0;
  const profit = monthlyRevenue - monthlyExpenses;
  const grossMargin = executive?.financial?.monthly?.grossMargin || 0;
  const avgOrderValue = executive?.financial?.monthly?.averageOrderValue || 0;

  const statusData = Object.entries(orders.byStatus || {}).map(([key, value]) => ({
    name: getStatusLabel(key), value, color: getStatusColor(key)
  }));
  const revenueData = executive.financial?.revenueByMonth || [];
  const lateByStatusData = Object.entries(lateData.activeLate.byStatus || {}).map(([key, value]) => ({
    status: getStatusLabel(key), count: value, color: getStatusColor(key)
  }));

  const totalOrdersValue = orders.total || 0;
  const deliveredOrdersValue = orders.delivered || 0;
  const successRateValue = deliveries.successRate || 0;
  const retentionRateValue = clients.retention || 0;
  const growthValue = orders.growth || 0;
  const activeClientsValue = clients.active || 0;
  const totalClientsValue = clients.total || 0;
  const clientRatio = totalClientsValue > 0 ? Math.min(100, (activeClientsValue / totalClientsValue) * 100) : 0;
  const efficiencyValue = totalOrdersValue > 0 ? Math.min(100, (deliveredOrdersValue / totalOrdersValue) * 100) : 0;

  const radarData = [
    { subject: 'Commandes', value: Math.min(100, (totalOrdersValue / 100) * 100), target: 70 },
    { subject: 'Livraisons', value: successRateValue, target: 85 },
    { subject: 'Clients', value: clientRatio, target: 60 },
    { subject: 'Rétention', value: retentionRateValue, target: 80 },
    { subject: 'Efficacité', value: efficiencyValue, target: 75 },
    { subject: 'Croissance', value: Math.min(100, (growthValue * 10) + 50), target: 70 },
  ];

  const scatterData = (orders.recentHistory || []).map((d: any) => ({
    orders: d.total || 0, revenue: d.revenue || 0, date: d.date
  }));

  const hourlyChartData = hourlyStats.byHour.map((h: any) => ({
    hour: h.hour, orders: h.orders || 0, revenue: h.revenue || 0
  }));

  const retentionRate = clients.retention || 0;
  const successRate = deliveries.successRate || 0;
  const lateTotal = lateData.activeLate.total || 0;

  const healthScore = Math.max(0, 100 - (lateTotal * 2) - (stats?.financial?.overdueInvoices?.count || 0) * 1.5 - (clients.pending * 0.5));
  const healthStatus = healthScore >= 80 ? "excellent" : healthScore >= 60 ? "bon" : healthScore >= 40 ? "attention" : "critique";

  return (
    <div className="space-y-5">
      {/* EN-TÊTE */}
      <div className={cn(NEO.card, "p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3")}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#0B676E]/10 flex items-center justify-center text-[#0B676E] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tableau de bord exécutif</h2>
            <p className="text-xs text-slate-400">Données en temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Live</span>
          </div>
          <Button variant="outline" size="sm" className={cn(NEO.button, "h-8 text-xs")}>
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Filtres
          </Button>
          <Button variant="outline" size="sm" className={cn(NEO.button, "h-8 text-xs")}>
            <Calendar className="h-3.5 w-3.5 text-slate-400" /> Aujourd'hui
          </Button>
          <Button size="sm" className={cn(NEO.buttonPrimary, "h-8 text-xs")}>
            <Download className="h-3.5 w-3.5" /> Exporter
          </Button>
        </div>
      </div>

      {/* KPI PROFESSIONNELS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPIProfessional title="Chiffre d'affaires" value={formatCurrency(monthlyRevenue)} subtitle={`${formatCurrency(profit)} de profit`} trend={executive?.financial?.monthly?.revenueGrowth || 0} icon={<TrendingUp className="h-5 w-5" />} color="primary" progress={grossMargin} progressLabel="Marge brute" />
        <KPIProfessional title="Commandes" value={orders.total} subtitle={`${orders.active} actives · ${orders.delivered} livrées`} trend={orders.growth} icon={<Package className="h-5 w-5" />} color="blue" progress={orders.total > 0 ? Math.round((orders.delivered / orders.total) * 100) : 0} progressLabel="Taux de complétion" />
        <KPIProfessional title="Clients" value={clients.total} subtitle={`${clients.active} actifs · ${clients.pending} en attente`} icon={<Users className="h-5 w-5" />} color="purple" progress={retentionRate} progressLabel="Rétention" />
        <KPIProfessional title="Livraisons" value={`${successRate}%`} subtitle={`${deliveries.completed}/${deliveries.total} complétées`} icon={<Truck className="h-5 w-5" />} color={successRate >= 90 ? "success" : successRate >= 70 ? "yellow" : "red"} progress={successRate} progressLabel="Taux de succès" />
      </div>

      {/* SANTÉ GLOBALE + COMPARATIFS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className={cn(NEO.card, "p-5 lg:col-span-1")}>
          <div className="pb-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Santé de l'entreprise</p>
          </div>
          <HealthGauge score={healthScore} status={healthStatus} />
          <div className="grid grid-cols-2 gap-2 w-full mt-3 text-center">
            <div className="bg-[#eef2f5] rounded-2xl p-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-sm font-bold text-slate-900">{lateTotal}</p>
              <p className="text-[10px] text-slate-400">Retards</p>
            </div>
            <div className="bg-[#eef2f5] rounded-2xl p-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-sm font-bold text-slate-900">{stats?.financial?.overdueInvoices?.count || 0}</p>
              <p className="text-[10px] text-slate-400">Impayés</p>
            </div>
            <div className="bg-[#eef2f5] rounded-2xl p-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-sm font-bold text-slate-900">{clients.pending}</p>
              <p className="text-[10px] text-slate-400">Inscriptions</p>
            </div>
            <div className="bg-[#eef2f5] rounded-2xl p-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-sm font-bold text-slate-900">{formatCurrency(executive?.financial?.monthly?.projectedRevenue || 0)}</p>
              <p className="text-[10px] text-slate-400">CA projeté</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          <ComparisonProfessional title="CA vs mois dernier" current={monthlyRevenue} previous={monthlyRevenue - (monthlyRevenue * (executive?.financial?.monthly?.revenueGrowth || 0) / 100)} unit=" Ar" icon={<TrendingUp className="h-4 w-4" />} color="teal" />
          <ComparisonProfessional title="Commandes vs mois dernier" current={orders.thisMonth || 0} previous={orders.thisMonth ? orders.thisMonth - (orders.thisMonth * (orders.growth || 0) / 100) : 0} icon={<ClipboardList className="h-4 w-4" />} color="blue" />
          <ComparisonProfessional title="Nouveaux clients vs mois dernier" current={clients.newThisMonth || 0} previous={clients.newThisMonth ? clients.newThisMonth - (clients.newThisMonth * 0.1) : 0} icon={<UserPlus className="h-4 w-4" />} color="purple" />
          <ComparisonProfessional title="Taux de succès vs objectif" current={successRate} previous={90} unit="%" icon={<Target className="h-4 w-4" />} color="success" />
        </div>
      </div>

      {/* ALERTES & RECOMMANDATIONS */}
      {(executive.alerts?.length > 0 || executive.recommendations?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {executive.alerts?.length > 0 && (
            <div className={cn(NEO.card, "p-4 bg-red-50/40")}>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2 text-red-700 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Alertes ({executive.alerts.length})
                </div>
                <Badge className="bg-red-100 text-red-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-[10px]">
                  {executive.alerts.filter((a: any) => a.level === "critical").length} critiques
                </Badge>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 mt-2">
                {executive.alerts.slice(0, 4).map((alert: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-2 rounded-xl text-xs",
                    alert.level === "critical" ? "bg-red-100 text-red-800 border-l-2 border-red-600" :
                    alert.level === "warning" ? "bg-amber-100 text-amber-800 border-l-2 border-amber-600" :
                    "bg-blue-100 text-blue-800 border-l-2 border-blue-600",
                    "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                  )}>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      <span className="inline-block w-3 text-center">→</span> {alert.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {executive.recommendations?.length > 0 && (
            <div className={cn(NEO.card, "p-4 bg-[#0B676E]/5")}>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2 text-[#0B676E] text-xs font-medium">
                  <Brain className="h-3.5 w-3.5" />
                  Recommandations ({executive.recommendations.length})
                </div>
                <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-[10px]">
                  {executive.recommendations.filter((r: any) => r.priority === "high").length} urgentes
                </Badge>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 mt-2">
                {executive.recommendations.slice(0, 4).map((rec: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-2 rounded-xl text-xs bg-white/80",
                    rec.priority === "high" ? "border-l-2 border-red-500" :
                    rec.priority === "medium" ? "border-l-2 border-amber-500" :
                    "border-l-2 border-[#0B676E]",
                    "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                  )}>
                    <p className="font-medium text-slate-900">{rec.title}</p>
                    <p className="text-[10px] text-[#0B676E] mt-0.5">
                      <span className="inline-block w-3 text-center">→</span> {rec.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAPHIQUES PRINCIPAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className={cn(NEO.card, "p-4 lg:col-span-2")}>
          <div className="flex justify-between items-center pb-1">
            <div>
              <p className="text-xs font-medium text-slate-700">Évolution du chiffre d'affaires</p>
              <p className="text-[10px] text-slate-400">12 derniers mois</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-[10px]">
                {formatCurrency(monthlyRevenue)}
              </Badge>
              <Badge className={cn(
                "text-[10px] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                executive?.financial?.monthly?.revenueGrowth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}>
                {executive?.financial?.monthly?.revenueGrowth >= 0 ? "▲" : "▼"} {Math.abs(executive?.financial?.monthly?.revenueGrowth || 0)}%
              </Badge>
            </div>
          </div>
          <div className="h-[200px] mt-2">
            <CandlestickChart data={revenueData} dataKey="value" color="#0B676E" />
          </div>
        </div>
        <div className={cn(NEO.card, "p-4")}>
          <div className="pb-1">
            <p className="text-xs font-medium text-slate-700">Répartition des commandes</p>
            <p className="text-[10px] text-slate-400">{orders.active} actives</p>
          </div>
          <div className="h-[200px] mt-2">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: "#eef2f5", border: "none", borderRadius: "16px", fontSize: "11px", boxShadow: "12px 12px 24px #b8c2ca, -12px -12px 24px #ffffff" }} formatter={(value: any) => [value, "Commandes"]} />
                  <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Aucune donnée</div>
            )}
          </div>
        </div>
      </div>

      {/* GRAPHIQUES BI AVANCÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className={cn(NEO.card, "p-4")}>
          <div className="pb-1">
            <p className="text-xs font-medium text-slate-700">Performance globale</p>
            <p className="text-[10px] text-slate-400">vs objectifs</p>
          </div>
          <div className="h-[160px] mt-1">
            <PerformanceRadar data={radarData} />
          </div>
        </div>
        <div className={cn(NEO.card, "p-4")}>
          <div className="pb-1">
            <p className="text-xs font-medium text-slate-700">Activité horaire</p>
            <p className="text-[10px] text-slate-400">Commandes par heure</p>
          </div>
          <div className="h-[160px] mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={8} interval={2} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#eef2f5", border: "none", borderRadius: "16px", fontSize: "11px", boxShadow: "12px 12px 24px #b8c2ca, -12px -12px 24px #ffffff" }} formatter={(value: any) => [value, "Commandes"]} />
                <Area type="monotone" dataKey="orders" stroke="#0B676E" fill="#0B676E" fillOpacity={0.3} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={cn(NEO.card, "p-4")}>
          <div className="pb-1">
            <p className="text-xs font-medium text-slate-700">Corrélation Commandes / Revenus</p>
            <p className="text-[10px] text-slate-400">Analyse de tendance</p>
          </div>
          <div className="h-[160px] mt-1">
            <CorrelationScatter data={scatterData} xKey="orders" yKey="revenue" />
          </div>
        </div>
      </div>

      {/* ANALYSE DES RETARDS */}
      {lateTotal > 0 && (
        <div className={cn(NEO.card, "p-4 bg-amber-50/40")}>
          <div className="flex justify-between items-center pb-1">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              Analyse des retards
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-[10px]">
              {lateTotal} retard(s)
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <div className="bg-[#eef2f5] rounded-2xl p-2.5 text-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-lg font-bold text-amber-600">{lateData.activeLate.pickupLate}</p>
              <p className="text-[10px] text-slate-500">Ramassage</p>
            </div>
            <div className="bg-[#eef2f5] rounded-2xl p-2.5 text-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-lg font-bold text-amber-600">{lateData.activeLate.deliveryLate}</p>
              <p className="text-[10px] text-slate-500">Livraison</p>
            </div>
            <div className="bg-[#eef2f5] rounded-2xl p-2.5 text-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <p className="text-lg font-bold text-yellow-600">{lateData.activeLate.stuckStatus}</p>
              <p className="text-[10px] text-slate-500">Bloqué</p>
            </div>
            <div className="bg-[#eef2f5] rounded-2xl p-2.5 text-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff] border-2 border-red-200">
              <p className="text-lg font-bold text-red-600">{lateData.activeLate.criticalLate}</p>
              <p className="text-[10px] text-slate-500">+24h</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP CLIENTS */}
      {executive.clients?.topClients?.length > 0 && (
        <div className={cn(NEO.card, "p-4")}>
          <div className="flex justify-between items-center pb-1">
            <p className="text-xs font-medium text-slate-700">Top 5 clients</p>
            <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-[10px]">
              {executive.clients.topClients.length} clients
            </Badge>
          </div>
          <div className="space-y-1.5 mt-2">
            {executive.clients.topClients.slice(0, 5).map((client: any, idx: number) => (
              <div key={client.id} className={cn(
                "flex items-center gap-3 p-2 rounded-2xl transition-colors",
                idx === 0 && "bg-[#0B676E]/5 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
              )}>
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  idx === 0 ? "bg-amber-400 text-amber-900" :
                  idx === 1 ? "bg-slate-300 text-slate-700" :
                  idx === 2 ? "bg-amber-600 text-amber-100" :
                  "bg-slate-100 text-slate-500",
                  "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{client.fullName}</p>
                  <p className="text-[10px] text-slate-400">{client.orderCount || 0} commandes</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#0B676E]">{formatCurrency(client.totalSpent || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERFORMANCE LIVREURS */}
      {executive.operational?.driverPerformance?.length > 0 && (
        <div className={cn(NEO.card, "p-4")}>
          <div className="pb-1">
            <p className="text-xs font-medium text-slate-700">Performance des livreurs</p>
            <p className="text-[10px] text-slate-400">Livraisons complétées ce mois</p>
          </div>
          <div className="space-y-1.5 mt-2">
            {executive.operational.driverPerformance.slice(0, 5).map((driver: any, idx: number) => {
              const maxDeliveries = Math.max(...executive.operational.driverPerformance.map((d: any) => d.deliveries));
              const percentage = maxDeliveries > 0 ? (driver.deliveries / maxDeliveries) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-[#eef2f5]/50 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-medium flex-shrink-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    {driver.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">{driver.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600 border-0">
                      {driver.deliveries}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL AdminDashboardComplete
// ============================================================
export default function AdminDashboardComplete() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // ==================== ÉTATS ====================
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderClientOpen, setNewOrderClientOpen] = useState(false);
  const [isAssignDeliveryOpen, setIsAssignDeliveryOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editClientData, setEditClientData] = useState<any>({});
  const [isClientHistoryOpen, setIsClientHistoryOpen] = useState(false);
  const [clientHistoryData, setClientHistoryData] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isDriverDetailsOpen, setIsDriverDetailsOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
  const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);
  const [driverHistoryData, setDriverHistoryData] = useState<any>(null);
  const [editDriverData, setEditDriverData] = useState<any>({});
  const [selectedDeliveryForUpdate, setSelectedDeliveryForUpdate] = useState<any>(null);
  const [isDeliveryUpdateOpen, setIsDeliveryUpdateOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedClientForSub, setSelectedClientForSub] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSortingDialogOpen, setIsSortingDialogOpen] = useState(false);
  const [sortingOrderId, setSortingOrderId] = useState<number | null>(null);
  const [sortingData, setSortingData] = useState({ itemCount: "", linensDetails: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [pickupFilter, setPickupFilter] = useState("all");
  const [selectedDriverFilter, setSelectedDriverFilter] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedRegistrationUser, setSelectedRegistrationUser] = useState<any>(null);
  const [registrationAction, setRegistrationAction] = useState<"approve" | "refuse" | null>(null);
  const [isRegistrationConfirmOpen, setIsRegistrationConfirmOpen] = useState(false);
  const [isRegistrationProcessing, setIsRegistrationProcessing] = useState(false);
  const [registrationsCurrentPage, setRegistrationsCurrentPage] = useState(1);
  const [registrationsPerPage, setRegistrationsPerPage] = useState(5);

  // ==================== REQUÊTES API ====================
  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({ queryKey: ["/api/orders"] });
  const { data: users = [], refetch: refetchUsers } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { data: deliveries = [] } = useQuery<any[]>({ queryKey: ["/api/deliveries"] });
  const { data: invoices = [] } = useQuery<any[]>({ queryKey: ["/api/invoices"] });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions");
      return res.json();
    },
  });
  const { data: subscriptionPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      if (!res.ok) throw new Error("Échec de la récupération des plans");
      return await res.json();
    },
  });
  const { data: customQuotes = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-quotes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/custom-quotes");
      if (!res.ok) throw new Error("Échec de la récupération des devis");
      return await res.json();
    },
  });

  const { data: dashboardStats, isLoading: dashboardLoading } = useQuery({ queryKey: ["/api/dashboard/stats"], enabled: user?.role === "admin" });
  const { data: orderAnalytics } = useQuery({ queryKey: ["/api/analytics/orders"], enabled: user?.role === "admin" });
  const { data: deliveryAnalytics } = useQuery({ queryKey: ["/api/analytics/deliveries"], enabled: user?.role === "admin" });
  const { data: financialAnalytics } = useQuery({ queryKey: ["/api/analytics/financial/simple"], enabled: user?.role === "admin" });
  const { data: clientAnalytics } = useQuery({ queryKey: ["/api/analytics/clients"], enabled: user?.role === "admin" });
  const { data: lateOrdersData } = useQuery({ queryKey: ["/api/analytics/late-orders"], enabled: user?.role === "admin" });

  const clients = safeArray(users).filter((user: any) => user.role === "client");

  // ==================== DONNÉES SÉCURISÉES ====================
  const safeOrders = safeArray(orders);
  const safeUsers = safeArray(users);
  const safeDeliveries = safeArray(deliveries);
  const safeInvoices = safeArray(invoices);
  const safeCustomQuotes = safeArray(customQuotes);

  // ==================== CALCULS ====================
  const totalOrders = dashboardStats?.orders?.total ?? safeOrders.length;
  const activeOrders = dashboardStats?.orders?.active ?? safeOrders.filter((o: any) => o.status !== 'delivered').length;
  const deliveredOrders = dashboardStats?.orders?.delivered ?? safeOrders.filter((o: any) => o.status === 'delivered').length;
  const todayOrders = dashboardStats?.orders?.today ?? safeOrders.filter((o: any) => {
    if (!o.createdAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(o.createdAt) >= today;
  }).length;
  const lateOrders = dashboardStats?.orders?.late ?? lateOrdersData?.activeLate?.total ?? 0;
  const monthlyRevenue = dashboardStats?.financial?.revenue ?? 0;
  const pendingInvoicesCount = dashboardStats?.financial?.pendingInvoices?.count ?? safeInvoices.filter((inv: any) => inv.status === 'pending').length;
  const overdueInvoicesCount = dashboardStats?.financial?.overdueInvoices?.count ?? safeInvoices.filter((inv: any) => inv.status === 'overdue').length;
  const totalClients = dashboardStats?.clients?.total ?? safeUsers.filter((u: any) => u.role === 'client').length;
  const activeClients = dashboardStats?.clients?.active ?? safeUsers.filter((u: any) => u.role === 'client' && u.isActive === true).length;
  const pendingClients = dashboardStats?.clients?.pending ?? safeUsers.filter((u: any) => u.role === 'client' && u.status === 'pending').length;
  const newClientsThisMonth = dashboardStats?.clients?.new ?? 0;
  const retentionRate = dashboardStats?.clients?.retention ?? (totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0);
  const deliveryByStatus = deliveryAnalytics?.byStatus ?? {};
  const deliverySuccessRate = dashboardStats?.deliveries?.successRate ?? 0;
  const pendingQuotes = safeCustomQuotes.filter((q: any) => q.status === 'pending').length;

  // ==================== FORMULAIRES ====================
  const newOrderForm = useForm<z.infer<typeof newOrderSchema>>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: { itemCount: 10, pickupDate: new Date() },
  });
  const assignDeliveryForm = useForm<z.infer<typeof assignDeliverySchema>>({
    resolver: zodResolver(assignDeliverySchema),
  });

  // ==================== MUTATIONS ====================
  const createOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newOrderSchema>) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/orders"] });
      setIsNewOrderOpen(false);
      newOrderForm.reset();
      setActiveTab("orders");
      toast({ title: "Commande créée", description: "La nouvelle commande a été créée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error?.message || "Échec de la création", variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "refused" }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/clients"] });
      toast({ title: "Statut mis à jour", description: "Le statut du client a été modifié" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error?.message || "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, itemCount, linensDetails }: {
      orderId: number; status: string; itemCount?: number; linensDetails?: string;
    }) => {
      const updateData: any = { status };
      if (itemCount !== undefined) updateData.itemCount = itemCount;
      if (linensDetails !== undefined) updateData.linensDetails = linensDetails;
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/orders"] });
      setIsSortingDialogOpen(false);
      toast({ title: "Statut mis à jour", description: "Le statut de la commande a été modifié" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  const editClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const res = await apiRequest("PATCH", `/api/users/${clientData.id}`, clientData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsEditClientOpen(false);
      toast({ title: "Client modifié", description: "Les informations ont été mises à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/deliveries/${deliveryId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/deliveries"] });
      toast({ title: "Statut mis à jour", description: "Le statut de la livraison a été modifié" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/custom-quotes/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] }); },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const assignDeliveryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignDeliverySchema> & { orderId: number }) => {
      const deliveryData = {
        orderId: data.orderId,
        deliveryPersonId: data.deliveryPersonId,
        scheduledDate: data.scheduledDate,
        notes: data.notes || "",
      };
      const res = await apiRequest("POST", "/api/deliveries", deliveryData);
      return res.json();
    },
    onSuccess: async (_, variables) => {
      await apiRequest("PATCH", `/api/orders/${variables.orderId}`, { status: "to_deliver" });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAssignDeliveryOpen(false);
      setSelectedOrderForDelivery(null);
      assignDeliveryForm.reset();
      toast({ title: "Livreur assigné", description: "Le livreur a été assigné avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message || "Impossible d'assigner le livreur", variant: "destructive" });
    },
  });

  const subscribeToPlanMutation = useMutation({
    mutationFn: async ({ clientId, planId }: { clientId: number; planId: number }) => {
      const res = await apiRequest("POST", "/api/subscriptions", { clientId, planId, startDate: new Date(), isActive: true });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Abonnement réussi", description: "Le client a été abonné" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsSubscriptionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateSubscriptionPlanMutation = useMutation({
    mutationFn: async ({ subscriptionId, newPlanId }: { subscriptionId: number; newPlanId: number }) => {
      const res = await apiRequest("PATCH", `/api/subscriptions/${subscriptionId}`, { planId: newPlanId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plan mis à jour", description: "L'abonnement a été modifié" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsSubscriptionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // ==================== FONCTIONS UTILITAIRES ====================
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      to_pickup: "À ramasser", to_sort: "À trier", to_wash: "À laver", to_dry: "À sécher",
      to_iron: "À repasser", ready_to_deliver: "Prêt à livrer", to_deliver: "À livrer", delivered: "Livré",
    };
    return statusMap[status] || status;
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.orderId) {
      const orderToView = safeArray(orders).find((o: any) => o.id === notification.orderId);
      if (orderToView) { setActiveTab("orders"); setSelectedOrder(orderToView); setIsOrderDetailsOpen(true); }
    } else if (notification.quoteId) { setActiveTab("quotes"); }
    else if (notification.clientId) { setActiveTab("clients"); }
  };

  const handleSortingClick = (orderId: number) => { setSortingOrderId(orderId); setIsSortingDialogOpen(true); };
  const handleSortingConfirm = () => {
    if (!sortingData.itemCount || !sortingOrderId) {
      toast({ title: "Erreur", description: "Le nombre de vêtements est obligatoire", variant: "destructive" });
      return;
    }
    updateOrderStatusMutation.mutate({
      orderId: sortingOrderId, status: "to_wash",
      itemCount: parseInt(sortingData.itemCount), linensDetails: sortingData.linensDetails || undefined,
    });
  };
  const handleStatusChange = (orderId: number, newStatus: string) => {
    if (newStatus === "to_sort") { handleSortingClick(orderId); }
    else { updateOrderStatusMutation.mutate({ orderId, status: newStatus }); }
  };

  const openRegistrationConfirmDialog = (user: any, action: "approve" | "refuse") => {
    setSelectedRegistrationUser(user); setRegistrationAction(action); setIsRegistrationConfirmOpen(true);
  };
  const handleRegistrationAction = async () => {
    if (!selectedRegistrationUser || !registrationAction) return;
    setIsRegistrationProcessing(true);
    try {
      await toggleUserStatusMutation.mutateAsync({
        id: selectedRegistrationUser.id, status: registrationAction === "approve" ? "approved" : "refused",
      });
      setIsRegistrationConfirmOpen(false);
      setSelectedRegistrationUser(null); setRegistrationAction(null);
    } finally { setIsRegistrationProcessing(false); }
  };
  const openClientDetailsFromRegistration = (user: any) => { setSelectedClient(user); setIsClientDetailsOpen(true); };

  // ==================== PAGINATION ====================
  const PaginationControls = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, onItemsPerPageChange }: {
    currentPage: number; totalPages: number; onPageChange: (page: number) => void;
    totalItems: number; itemsPerPage: number; onItemsPerPageChange: (value: number) => void;
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-white/40">
        <div className="text-sm text-slate-500 order-2 sm:order-1">
          Affichage de <span className="font-medium text-slate-700">{startItem}</span> à <span className="font-medium text-slate-700">{endItem}</span> sur <span className="font-medium text-slate-700">{totalItems}</span> inscription(s)
        </div>
        <div className="flex flex-wrap gap-2 order-1 sm:order-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={cn(NEO.button, "h-9 gap-1")}>
            <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Précédent</span>
          </Button>
          <div className="hidden md:flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => onPageChange(pageNum)}
                  className={cn("w-9 h-9 p-0", currentPage === pageNum ? NEO.buttonPrimary : NEO.button)}>
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <div className="flex md:hidden items-center px-4 py-1.5 bg-[#eef2f5] rounded-2xl text-sm font-medium text-slate-600 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
            Page {currentPage} / {totalPages}
          </div>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className={cn(NEO.button, "h-9 gap-1")}>
            <span className="hidden sm:inline">Suivant</span><ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 order-3">
          <span className="text-sm text-slate-500 hidden sm:inline">Lignes:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(v) => onItemsPerPageChange(parseInt(v))}>
            <SelectTrigger className={cn(NEO.input, "w-[80px] h-9")}><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#eef2f5] border-0 rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff]">
              <SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  if (user?.role !== "admin") {
    return <div className="p-4 sm:p-6 text-center text-slate-500">Accès non autorisé</div>;
  }

  const pendingRegistrations = safeUsers.filter((u: any) => u.role === 'client' && u.status === 'pending');
  const indexOfLastRegistration = registrationsCurrentPage * registrationsPerPage;
  const indexOfFirstRegistration = indexOfLastRegistration - registrationsPerPage;
  const currentRegistrations = pendingRegistrations.slice(indexOfFirstRegistration, indexOfLastRegistration);
  const totalRegistrationPages = Math.ceil(pendingRegistrations.length / registrationsPerPage);

  // ==================== RENDU PRINCIPAL ====================
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#eef2f5] p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ==================== EN-TÊTE NEOMORPHIQUE ==================== */}
          <div className={cn(NEO.card, "p-5 bg-gradient-to-br from-[#0B676E] to-teal-600 text-white")}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <img src={`${import.meta.env.BASE_URL}assets/img/Sasavanda_Gris.png`} alt="SV Pressing" className="h-10 w-auto brightness-0 invert" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-2xl backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <div className="h-9 w-9 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                    {user?.username?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white text-sm">{user?.username || "Administrateur"}</p>
                    <p className="text-xs text-white/70">Super administrateur</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("ads")} className="h-10 w-10 p-0 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <Megaphone className="h-4 w-4" />
                </Button>
                <NotificationBell onNotificationClick={handleNotificationClick} />
                <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-[#0B676E] hover:bg-slate-100 shadow-[8px_8px_16px_rgba(0,0,0,0.2),-8px_-8px_16px_rgba(255,255,255,0.1)] transition-all duration-200">
                      <Plus className="h-4 w-4 mr-2" />Nouvelle commande
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                    <DialogHeader>
                      <DialogTitle className="text-slate-800">Créer une commande</DialogTitle>
                      <DialogDescription className="text-slate-500">Ajouter une commande pour un client existant</DialogDescription>
                    </DialogHeader>
                    <Form {...newOrderForm}>
                      <form onSubmit={newOrderForm.handleSubmit((data) => createOrderMutation.mutate(data))} className="space-y-5 py-4">
                        <FormField control={newOrderForm.control} name="clientId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Client *</FormLabel>
                            <Popover open={newOrderClientOpen} onOpenChange={setNewOrderClientOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn(NEO.input, "w-full justify-between text-slate-700")}>
                                    {clients.find((c: any) => c.id === field.value)?.fullName || "Sélectionner un client"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                                <Command className="bg-[#eef2f5]">
                                  <CommandInput placeholder="Rechercher..." className="bg-[#eef2f5] rounded-2xl" />
                                  <CommandList>
                                    <CommandEmpty>Aucun résultat</CommandEmpty>
                                    <CommandGroup>
                                      {clients.map((client: any) => (
                                        <CommandItem key={client.id} value={client.fullName} onSelect={() => { field.onChange(client.id); setNewOrderClientOpen(false); }} className="rounded-xl hover:bg-[#0B676E]/10">
                                          <div>
                                            <p className="font-medium text-slate-800">{client.fullName}</p>
                                            <p className="text-xs text-slate-500">{client.email}</p>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={newOrderForm.control} name="pickupDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Date de ramassage</FormLabel>
                              <FormControl>
                                <Input type="date" className={NEO.input} value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField control={newOrderForm.control} name="itemCount" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Nombre de pièces</FormLabel>
                              <FormControl>
                                <Input type="number" className={NEO.input} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={newOrderForm.control} name="timeWindowStart" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Heure début</FormLabel>
                              <FormControl><Input type="time" className={NEO.input} {...field} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={newOrderForm.control} name="timeWindowEnd" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Heure fin</FormLabel>
                              <FormControl><Input type="time" className={NEO.input} {...field} /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={newOrderForm.control} name="specialInstructions" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Instructions spéciales</FormLabel>
                            <FormControl><Textarea className={NEO.input} {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <DialogFooter>
                          <Button type="submit" disabled={createOrderMutation.isPending} className={NEO.buttonPrimary}>
                            {createOrderMutation.isPending ? "Création..." : "Créer la commande"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" disabled={logoutMutation.isPending}>
                      {logoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Déconnexion</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-800">Confirmer la déconnexion</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">Voulez-vous vraiment vous déconnecter ?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={NEO.button}>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => logoutMutation.mutate()} className={NEO.buttonPrimary}>Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* ==================== ONGLETS PRINCIPAUX NEOMORPHIQUES ==================== */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className={cn(NEO.card, "p-1 overflow-x-auto")}>
              <TabsList className="inline-flex w-auto gap-0.5 bg-transparent">
                <TabsTrigger value="dashboard" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <LayoutDashboard className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="volume-analysis" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Volume</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <Package className="h-4 w-4" /><span className="hidden sm:inline">Commandes</span>
                </TabsTrigger>
                <TabsTrigger value="deliveries" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <Truck className="h-4 w-4" /><span className="hidden sm:inline">Livraisons</span>
                </TabsTrigger>
                <TabsTrigger value="clients" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <Users className="h-4 w-4" /><span className="hidden sm:inline">Clients</span>
                </TabsTrigger>
                {/* ✅ NOUVEAU ONGLET : UTILISATEURS (Admin/Agent/Supervisor) */}
                <TabsTrigger value="agents" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <Shield className="h-4 w-4" /><span className="hidden sm:inline">Utilisateurs</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <Target className="h-4 w-4" /><span className="hidden sm:inline">Plans</span>
                </TabsTrigger>
                <TabsTrigger value="drivers" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <UserCheck className="h-4 w-4" /><span className="hidden sm:inline">Livreurs</span>
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <DollarSign className="h-4 w-4" /><span className="hidden sm:inline">Dépenses</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <FileText className="h-4 w-4" /><span className="hidden sm:inline">Factures</span>
                </TabsTrigger>
                <TabsTrigger value="quotes" className="gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                  <FilePlus className="h-4 w-4" /><span className="hidden sm:inline">Site Client</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ==================== DASHBOARD ==================== */}
            <TabsContent value="dashboard" className="space-y-6">
              <ExecutiveDashboardBI />
            </TabsContent>
            <TabsContent value="volume-analysis" className="space-y-6">
              <VolumeAnalysisTab orders={safeOrders} users={safeUsers} subscriptions={safeArray(subscriptions)} subscriptionPlans={safeArray(subscriptionPlans)} />
            </TabsContent>
            <TabsContent value="orders" className="space-y-6">
              <OrdersTab orders={safeOrders} users={safeUsers} deliveries={safeDeliveries} handleStatusChange={handleStatusChange} setSelectedOrder={setSelectedOrder} setIsOrderDetailsOpen={setIsOrderDetailsOpen} />
            </TabsContent>
            <TabsContent value="deliveries" className="space-y-6">
              <DeliveriesAndPickupsTab orders={safeOrders} users={safeUsers} deliveries={safeDeliveries} queryClient={queryClient} />
            </TabsContent>
            <TabsContent value="clients" className="space-y-6">
              <ClientsTab users={safeUsers} orders={safeOrders} subscriptions={safeArray(subscriptions)} subscriptionPlans={safeArray(subscriptionPlans)} externalNewClientData={{}} externalOpenNewClient={false} onConsumeExternalOpen={() => {}} />
            </TabsContent>
            {/* ✅ NOUVEAU TABCONTENT : GESTION DES UTILISATEURS */}
            <TabsContent value="agents" className="space-y-6">
              <AgentsTab users={safeUsers} />
            </TabsContent>
            <TabsContent value="plans" className="space-y-6">
              <PlansTab subscriptionPlans={safeArray(subscriptionPlans)} subscriptions={safeArray(subscriptions)} toast={toast} queryClient={queryClient} />
            </TabsContent>
            <TabsContent value="drivers" className="space-y-6">
              <DriversTab users={safeUsers} deliveries={safeDeliveries} orders={safeOrders} queryClient={queryClient} toast={toast} toggleUserStatusMutation={toggleUserStatusMutation} />
            </TabsContent>
            <TabsContent value="expenses" className="space-y-6">
              <ExpensesTab />
            </TabsContent>
            <TabsContent value="invoices" className="space-y-6">
              <InvoicesTab users={safeUsers} subscriptions={safeArray(subscriptions)} subscriptionPlans={safeArray(subscriptionPlans)} />
            </TabsContent>
            <TabsContent value="ads" className="space-y-6">
              <AdsTab />
            </TabsContent>

            {/* ==================== SECTION SITE CLIENT ==================== */}
            <TabsContent value="quotes" className="space-y-6">
              <div className={cn(NEO.card, "p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4")}>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Gestion des demandes client</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Inscriptions, devis personnalisés et plans privés</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-[#0B676E]/10 rounded-full text-xs font-medium text-[#0B676E] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <UserPlus className="inline h-3 w-3 mr-1" />{pendingClients} inscriptions
                  </div>
                  <div className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <FileText className="inline h-3 w-3 mr-1" />{safeCustomQuotes.length} devis
                  </div>
                  <div className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <Shield className="inline h-3 w-3 mr-1" />{safeArray(subscriptionPlans).filter((p: any) => p.type === "custom").length} plans privés
                  </div>
                </div>
              </div>
              <Tabs defaultValue="registrations" className="w-full">
                <TabsList className="inline-flex gap-2 bg-[#eef2f5] p-1 rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                  <TabsTrigger value="registrations" className="gap-2 px-4 py-2 text-sm rounded-2xl data-[state=active]:bg-white data-[state=active]:text-[#0B676E] data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                    <UserPlus className="h-4 w-4" /> Inscriptions
                  </TabsTrigger>
                  <TabsTrigger value="custom-quotes" className="gap-2 px-4 py-2 text-sm rounded-2xl data-[state=active]:bg-white data-[state=active]:text-[#0B676E] data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                    <FileText className="h-4 w-4" /> Devis personnalisés
                  </TabsTrigger>
                  <TabsTrigger value="private-plans" className="gap-2 px-4 py-2 text-sm rounded-2xl data-[state=active]:bg-white data-[state=active]:text-[#0B676E] data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 hover:text-slate-800 transition-all">
                    <Shield className="h-4 w-4" /> Plans privés
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="registrations" className="mt-6">
                  <div className={cn(NEO.card, "overflow-hidden")}>
                    <div className="bg-[#eef2f5]/50 border-b border-white/40 px-4 py-3">
                      <p className="text-base font-medium text-slate-800">Inscriptions en attente de validation</p>
                      <p className="text-sm text-slate-500">Les clients ont choisi un abonnement lors de leur inscription. Validez ou refusez leur demande.</p>
                    </div>
                    <div className="p-0">
                      {pendingRegistrations.length === 0 ? (
                        <div className="text-center py-12">
                          <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Aucune inscription en attente</p>
                          <p className="text-sm text-slate-400 mt-1">Toutes les demandes d'inscription ont été traitées</p>
                        </div>
                      ) : (
                        <>
                          <div className="divide-y divide-white/40">
                            {currentRegistrations.map((user: any) => {
                              const userSubscription = safeArray(subscriptionPlans).find((plan: any) => plan.id === user.selectedPlanId);
                              const subscriptionName = userSubscription?.name || user.selectedPlanName || "Plan standard";
                              const subscriptionPrice = userSubscription?.pricePerMonth || user.selectedPlanPrice || "0";
                              return (
                                <div key={user.id} className="p-4 hover:bg-white/10 transition-colors">
                                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[#0B676E]/10 flex items-center justify-center flex-shrink-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                          <User className="h-5 w-5 text-[#0B676E]" />
                                        </div>
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-slate-900">{user.fullName}</p>
                                            <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] text-xs">
                                              <Package className="h-3 w-3 mr-1" />{subscriptionName} - {subscriptionPrice} Ar/mois
                                            </Badge>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
                                            {user.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>}
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Inscrit le {formatDate(user.createdAt)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" onClick={() => openClientDetailsFromRegistration(user)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Visualiser le profil</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" onClick={() => openRegistrationConfirmDialog(user, "refuse")} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl" disabled={toggleUserStatusMutation.isPending}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Refuser l'inscription</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" onClick={() => openRegistrationConfirmDialog(user, "approve")} className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl" disabled={toggleUserStatusMutation.isPending}>
                                            <Check className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Approuver l'inscription</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {pendingRegistrations.length > registrationsPerPage && (
                            <div className="px-4 py-3 border-t border-white/40">
                              <PaginationControls currentPage={registrationsCurrentPage} totalPages={totalRegistrationPages} onPageChange={setRegistrationsCurrentPage} totalItems={pendingRegistrations.length} itemsPerPage={registrationsPerPage} onItemsPerPageChange={(value) => { setRegistrationsPerPage(value); setRegistrationsCurrentPage(1); }} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="custom-quotes" className="mt-6">
                  <div className={cn(NEO.card, "overflow-hidden")}>
                    <div className="bg-[#eef2f5]/50 border-b border-white/40 px-4 py-3">
                      <p className="text-base font-medium text-slate-800">Devis personnalisés</p>
                      <p className="text-sm text-slate-500">Gérez les demandes de devis et convertissez-les en plans privés</p>
                    </div>
                    <div className="p-0">
                      <CustomQuotesSection customQuotes={safeCustomQuotes} updateQuoteStatusMutation={updateQuoteStatusMutation} setNewPlanData={() => {}} setIsNewPlanOpen={() => {}} setActiveTab={setActiveTab} toast={toast} safeFormatDate={formatDate} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="private-plans" className="mt-6">
                  <div className={cn(NEO.card, "overflow-hidden")}>
                    <div className="bg-[#eef2f5]/50 border-b border-white/40 px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-base font-medium text-slate-800">Plans privés créés</p>
                          <p className="text-sm text-slate-500">Plans d'abonnement personnalisés générés à partir des devis approuvés</p>
                        </div>
                        <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">{safeArray(subscriptionPlans).filter((p: any) => p.type === "custom").length} plans</Badge>
                      </div>
                    </div>
                    <div className="p-5">
                      {safeArray(subscriptionPlans).filter((p: any) => p.type === "custom").length === 0 ? (
                        <div className="text-center py-12">
                          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Aucun plan privé créé pour le moment</p>
                          <p className="text-sm text-slate-400 mt-1">Les plans privés créés depuis les devis approuvés apparaîtront ici</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {safeArray(subscriptionPlans).filter((plan: any) => plan.type === "custom").map((plan: any) => (
                            <div key={plan.id} className={cn(NEO.card, "p-4 hover:-translate-y-1 transition-all")}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-[#0B676E]/10 rounded-xl flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <Shield className="h-5 w-5 text-[#0B676E]" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">{plan.name}</p>
                                    <p className="text-lg font-bold text-[#0B676E]">{plan.pricePerMonth} Ar<span className="text-sm font-normal text-slate-500">/mois</span></p>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setActiveTab("plans")} className={NEO.button}>
                                  <Edit className="h-3 w-3 mr-1" />Modifier
                                </Button>
                              </div>
                              <div className="mt-3 pt-3 border-t border-white/40 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1"><Package className="h-3 w-3" />{plan.itemsIncluded} pièces/semaine</div>
                                <div className="flex items-center gap-1"><Truck className="h-3 w-3" />{plan.pickupsPerWeek} ramassage(s)</div>
                                <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Livraison {plan.deliveryTimeHours}h</div>
                                <div className="flex items-center gap-1"><Repeat className="h-3 w-3" />Fréquence: {plan.frequency || "Hebdomadaire"}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          {/* ==================== DIALOGUES NEOMORPHIQUES ==================== */}
          <AlertDialog open={isRegistrationConfirmOpen} onOpenChange={setIsRegistrationConfirmOpen}>
            <AlertDialogContent className="max-w-md bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-slate-800">
                  {registrationAction === "approve" ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                  {registrationAction === "approve" ? "Approuver l'inscription" : "Refuser l'inscription"}
                </AlertDialogTitle>
                <AlertDialogDescription className="pt-2 text-slate-500">
                  {registrationAction === "approve" ? (
                    <div className="space-y-2">
                      <p>Vous êtes sur le point d'approuver l'inscription de <span className="font-semibold text-slate-900">{selectedRegistrationUser?.fullName}</span>.</p>
                      <p className="text-sm text-slate-500">Le client recevra une notification et pourra se connecter immédiatement.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>Vous êtes sur le point de refuser l'inscription de <span className="font-semibold text-slate-900">{selectedRegistrationUser?.fullName}</span>.</p>
                      <p className="text-sm text-slate-500">Cette action est irréversible. Le client ne pourra pas accéder à la plateforme.</p>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel disabled={isRegistrationProcessing} className={NEO.button}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegistrationAction} disabled={isRegistrationProcessing} className={cn("min-w-[100px]", registrationAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700", "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)]")}>
                  {isRegistrationProcessing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Traitement...</>) : (<>{registrationAction === "approve" ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}{registrationAction === "approve" ? "Approuver" : "Refuser"}</>)}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isSortingDialogOpen} onOpenChange={setIsSortingDialogOpen}>
            <DialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Triage de la commande</DialogTitle>
                <DialogDescription className="text-slate-500">Saisissez les informations de triage</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-700">Nombre de vêtements *</Label>
                  <Input type="number" className={NEO.input} value={sortingData.itemCount} onChange={(e) => setSortingData({ ...sortingData, itemCount: e.target.value })} placeholder="Ex: 15" />
                </div>
                <div>
                  <Label className="text-slate-700">Détails (facultatif)</Label>
                  <Input className={NEO.input} value={sortingData.linensDetails} onChange={(e) => setSortingData({ ...sortingData, linensDetails: e.target.value })} placeholder="Ex: 5 chemises, 3 pantalons" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSortingDialogOpen(false)} className={NEO.button}>Annuler</Button>
                <Button onClick={handleSortingConfirm} className={NEO.buttonPrimary}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
            <DialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Détails de la commande #{selectedOrder?.id}</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                    <div><p className="text-xs text-slate-500">Client</p><p className="font-medium text-slate-900">{safeUsers.find((u: any) => u.id === selectedOrder.clientId)?.fullName || "Inconnu"}</p></div>
                    <div><p className="text-xs text-slate-500">Statut</p><Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">{getStatusText(selectedOrder.status)}</Badge></div>
                    <div><p className="text-xs text-slate-500">Date de création</p><p className="text-sm text-slate-700">{formatDateTime(selectedOrder.createdAt)}</p></div>
                    <div><p className="text-xs text-slate-500">Pièces estimées</p><p className="text-sm text-slate-700">{selectedOrder.itemCount || "Non défini"}</p></div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)} className={NEO.button}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isClientDetailsOpen} onOpenChange={setIsClientDetailsOpen}>
            <DialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Profil client - {selectedClient?.fullName}</DialogTitle>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm text-slate-900">{selectedClient.email}</p>
                      <p className="text-xs text-slate-500 mt-2">Téléphone</p>
                      <p className="text-sm text-slate-900">{selectedClient.phone || "Non renseigné"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Adresse</p>
                      <p className="text-sm text-slate-900">{selectedClient.address || "Non renseignée"}</p>
                      <p className="text-xs text-slate-500 mt-2">Inscrit le</p>
                      <p className="text-sm text-slate-900">{formatDate(selectedClient.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-white/40">
                    <Button variant="outline" className={cn(NEO.button, "flex-1")} onClick={() => { setEditClientData(selectedClient); setIsClientDetailsOpen(false); setIsEditClientOpen(true); }}>
                      <Edit className="h-4 w-4 mr-2" />Modifier
                    </Button>
                    <Button variant="outline" className={cn(NEO.button, "flex-1")} onClick={() => { setIsSubscriptionDialogOpen(true); setSelectedClientForSub(selectedClient); setIsClientDetailsOpen(false); }}>
                      <Star className="h-4 w-4 mr-2" />Abonnement
                    </Button>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsClientDetailsOpen(false)} className={NEO.button}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
            <DialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Modifier le client</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); editClientMutation.mutate(editClientData); }} className="space-y-4">
                <div>
                  <Label className="text-slate-700">Nom complet</Label>
                  <Input className={NEO.input} value={editClientData.fullName || ""} onChange={(e) => setEditClientData({ ...editClientData, fullName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-slate-700">Email</Label>
                  <Input type="email" className={NEO.input} value={editClientData.email || ""} onChange={(e) => setEditClientData({ ...editClientData, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-slate-700">Téléphone</Label>
                  <Input className={NEO.input} value={editClientData.phone || ""} onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-slate-700">Adresse</Label>
                  <Input className={NEO.input} value={editClientData.address || ""} onChange={(e) => setEditClientData({ ...editClientData, address: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditClientOpen(false)} className={NEO.button}>Annuler</Button>
                  <Button type="submit" className={NEO.buttonPrimary}>Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
            <DialogContent className="max-w-2xl bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Gérer l'abonnement de {selectedClientForSub?.fullName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {(() => {
                  const currentSub = safeArray(subscriptions).find((s: any) => s.clientId === selectedClientForSub?.id && s.isActive);
                  const currentPlan = currentSub && safeArray(subscriptionPlans).find((p: any) => p.id === currentSub.planId);
                  return (
                    <>
                      <div className="p-4 bg-[#0B676E]/10 rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                        <p className="text-sm font-medium text-slate-700 mb-2">Abonnement actuel</p>
                        {currentPlan ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-900">{currentPlan.name}</p>
                              <p className="text-xs text-slate-500">Depuis le {formatDate(currentSub.startDate)}</p>
                            </div>
                            <p className="font-bold text-[#0B676E]">{currentPlan.pricePerMonth} Ar/mois</p>
                          </div>
                        ) : (
                          <p className="text-slate-500">Aucun abonnement actif</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-3">Changer de plan</p>
                        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {safeArray(subscriptionPlans).map((plan: any) => (
                            <div key={plan.id} className={cn(
                              "p-3 rounded-2xl cursor-pointer transition-all",
                              plan.id === currentPlan?.id ? "bg-[#0B676E]/10 shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]" : NEO.card
                            )} onClick={() => {
                              if (currentSub) { updateSubscriptionPlanMutation.mutate({ subscriptionId: currentSub.id, newPlanId: plan.id }); }
                              else { subscribeToPlanMutation.mutate({ clientId: selectedClientForSub.id, planId: plan.id }); }
                            }}>
                              <div className="flex justify-between">
                                <p className="font-semibold text-slate-900">{plan.name}</p>
                                <p className="font-bold text-[#0B676E]">{plan.pricePerMonth} Ar</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{plan.itemsIncluded} articles • {plan.pickupsPerWeek} ramassages/semaine</p>
                              {plan.id === currentPlan?.id && <Badge className="mt-2 bg-[#0B676E] text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">Actuel</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)} className={NEO.button}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}