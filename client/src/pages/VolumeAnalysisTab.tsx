// client/src/pages/VolumeAnalysisTab.tsx
// Interface 100% flat, neutre, pro.
// Logique métier 100 % conservée.
import React, { useMemo, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, AreaChart, Area,
} from "recharts";
import { cn } from '@/lib/utils';
import {
  Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

/* ============================================================
   DESIGN SYSTEM — 100% neutre
============================================================ */
const ui = {
  card: "bg-white rounded-xl border border-slate-200",
  input: "h-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300",
  btn: "h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-8 rounded-lg bg-slate-800 text-xs font-medium text-white hover:bg-slate-900",
};
const tooltipStyle = {
  backgroundColor: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 8, fontSize: 12,
  boxShadow: "0 4px 12px -4px rgba(15,23,42,.08)",
};

/* ============================================================
   TYPES
============================================================ */
interface Order {
  id: number; clientId: number; status: string; itemCount: number;
  totalAmount?: string; createdAt: string;
  scheduledPickupDate?: string; actualPickupDate?: string;
  scheduledDeliveryDate?: string; actualDeliveryDate?: string;
  deliveryTimeWindowStart?: string; deliveryTimeWindowEnd?: string;
}
interface User {
  id: number; fullName: string; email: string; phone: string;
  role: string; isActive: boolean; status: string; createdAt: string;
  neighborhood?: string; preferredPickupDays?: string[];
  preferredTimeWindowStart?: string; preferredTimeWindowEnd?: string;
}
interface Subscription {
  id: number; clientId: number; planId: number; isActive: boolean;
  startDate: string; endDate?: string; specialInstructions?: string; createdAt: string;
}
interface SubscriptionPlan {
  id: number; name: string; type: string; pricePerMonth: string;
  itemsIncluded: number; pickupsPerWeek: number; deliveryTimeHours: number;
  features?: string; isActive: boolean;
}
interface Invoice {
  id: number; clientId: number; amount: string; status: string;
  createdAt: string; paidAt?: string; dueDate: string;
}
interface ClientData extends User {
  planName?: string; planType?: string;
  itemsIncluded: number; itemsProcessed: number; surplus: number;
  utilizationRate: number; atRisk: boolean; clientOrders: Order[];
  clientPlan?: SubscriptionPlan; lastOrderDate: Date | null;
  dailyAverage: number; activeDays: number; growthTrend: number;
  monthlyRevenue: number; revenueGrowth: number;
  customerLifetimeValue: number; churnRisk: number; avgProcessingTime: number;
  preferredDay?: string; preferredTime?: string;
  pickupReliability: number; paymentReliability: number; satisfactionScore?: number;
  totalInvoices: number; totalPaidInvoices: number;
  totalPendingInvoices: number; totalOverdueInvoices: number;
}
interface VolumeAnalytics {
  todayItems: number; todayOrders: number;
  yesterdayItems: number; yesterdayOrders: number;
  last7DaysItems: number; last7DaysOrders: number; last7DaysRevenue: number;
  weeklyGrowth: number;
  monthToDateItems: number; monthToDateOrders: number; monthToDateRevenue: number;
  projectedMonthItems: number; projectedMonthRevenue: number;
  averageItemsPerOrder: number; averageOrderValue: number;
  surplusAlertsThisMonth: number; atRiskClients: number; churnRiskClients: number;
  peakDay: { name: string; Articles: number; date: string } | null;
  peakHour: { hour: string; count: number } | null;
  clientData: ClientData[];
  weeklyVolumeData: Array<{ name: string; Articles: number; Orders: number; isPredicted: boolean }>;
  weeklyForecastData: Array<{ name: string; Prévisions: number; Capacité: number; BorneInf: number; BorneSup: number; isPredicted: boolean }>;
  hourlyDistributionData: Array<{ hour: string; count: number; percentage: number }>;
  totalWeeklyCapacityForAllClients: number; totalMonthlyCapacity: number;
  currentUtilizationRate: number;
  totalMonthlyRevenue: number; totalMonthlyRevenuePotential: number;
  averageRevenuePerClient: number; revenueGrowth: number; growthRate: number;
  seasonalityIndex: number; volatilityIndex: number;
  nextMonthForecast: number;
  confidenceInterval: { min: number; max: number };
  clientSegments: { optimal: number; atRisk: number; surplus: number; churn: number };
  avgPickupTime: number; avgDeliveryTime: number; onTimeRate: number;
}

/* ============================================================
   HELPERS UI
============================================================ */
const Pill: React.FC<{
  tone?: "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";
  children: React.ReactNode;
}> = ({ tone = "slate", children }) => {
  const map = {
    brand: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-slate-100 text-slate-700",
    purple: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
};

const MiniKPI: React.FC<{
  title: string; value: string | number; subtitle?: string;
  trend?: { dir: 'up' | 'down'; label: string } | null;
}> = ({ title, value, subtitle, trend }) => (
  <div className={cn(ui.card, "p-5")}>
    <p className="text-xs font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
    <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
      {trend && (
        <span className={cn("inline-flex items-center gap-0.5 font-semibold",
          trend.dir === 'up' ? "text-emerald-600" : "text-red-600")}>
          {trend.dir === 'up' ? '+' : '−'}{trend.label}
        </span>
      )}
      {subtitle && <span className="text-slate-500">{subtitle}</span>}
    </div>
  </div>
);

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

/* ============================================================
   CHART — couleurs neutres
============================================================ */
const VolumeChart = ({
  data, type = "bar", isForecast = false, showCapacity = true, showConfidence = true,
}: {
  data: any[]; type?: "bar" | "area" | "line";
  isForecast?: boolean; showCapacity?: boolean; showConfidence?: boolean;
}) => {
  const colors = {
    actual: "#475569",       // gris foncé (au lieu de teal)
    predicted: "#94a3b8",    // gris moyen (au lieu de violet)
    capacity: "#cbd5e1",     // gris clair
    confidence: "#e2e8f0",   // gris très clair
    high: "#f59e0b",         // amber (garde pour urgence)
    critical: "#ef4444",     // rouge (garde pour critique)
    low: "#10b981",          // emerald (garde pour OK)
  };
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={tooltipStyle} className="p-3">
        <p className="font-semibold text-slate-900 mb-1.5 text-[12px]">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="text-[11.5px] flex justify-between gap-3">
            <span className="text-slate-600">{entry.dataKey}</span>
            <span className="font-semibold text-slate-900">{entry.value}</span>
          </div>
        ))}
        {d?.isPredicted && <p className="mt-1.5 text-[10.5px] text-slate-500">* Estimation</p>}
      </div>
    );
  };

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="vol-forecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.predicted} stopOpacity={0.2} />
              <stop offset="100%" stopColor={colors.predicted} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          {showConfidence && data[0]?.BorneInf !== undefined && (
            <Area type="monotone" dataKey="BorneInf" stroke="none" fill={colors.confidence} fillOpacity={0.35} />
          )}
          <Area type="monotone" dataKey="Prévisions" stroke={colors.predicted}
                fill="url(#vol-forecast)" strokeWidth={2}
                dot={{ r: 3, fill: colors.predicted }} activeDot={{ r: 5 }} />
          {showConfidence && data[0]?.BorneSup !== undefined && (
            <Area type="monotone" dataKey="BorneSup" stroke="none" fill={colors.confidence} fillOpacity={0.35} />
          )}
          {showCapacity && data[0]?.Capacité !== undefined && (
            <Area type="monotone" dataKey="Capacité" stroke={colors.capacity}
                  fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Articles" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={
              entry.isPredicted ? colors.predicted
              : entry.Articles > (entry.Capacité || 100) ? colors.critical
              : entry.Articles > (entry.Capacité || 100) * 0.8 ? colors.high
              : entry.Articles > 0 ? colors.actual : colors.low
            } />
          ))}
        </Bar>
        {showCapacity && data[0]?.Capacité !== undefined && (
          <Bar dataKey="Capacité" fill="none" stroke={colors.capacity}
               strokeWidth={1.5} strokeDasharray="4 4" radius={[6, 6, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ============================================================
   LIGNE CLIENT
============================================================ */
const ClientRow = ({
  client, isExpanded, onToggle, onAction,
}: {
  client: ClientData; isExpanded: boolean;
  onToggle: () => void; onAction: (action: string, client: ClientData) => void;
}) => {
  const utilColor = (r: number) =>
    r > 100 ? "text-red-600" : r > 80 ? "text-emerald-600"
    : r > 50 ? "text-amber-600" : r > 20 ? "text-slate-700" : "text-slate-500";
  const utilBg = (r: number) =>
    r > 100 ? "bg-red-500" : r > 80 ? "bg-emerald-500"
    : r > 50 ? "bg-amber-500" : r > 20 ? "bg-slate-500" : "bg-slate-300";

  return (
    <>
      <TableRow className="hover:bg-slate-50/70 transition-colors">
        <TableCell>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900 text-[13px]">{client.fullName}</div>
            <div className="truncate text-xs text-slate-500">{client.email}</div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col items-start gap-1">
            <Pill tone={client.planType === 'premium' ? "purple" : "slate"}>
              {client.planName || 'Aucun'}
            </Pill>
            {client.clientPlan && (
              <span className="text-[11px] text-slate-500">
                {client.clientPlan.itemsIncluded}/sem.
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-slate-900 tabular-nums">{client.itemsProcessed}</span>
            <span className="text-[11px] text-slate-500">/ {client.itemsIncluded}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-center">
            {(client.surplus || 0) > 0 ? (
              <div className="flex flex-col items-center gap-0.5">
                <Pill tone="red">+{client.surplus}</Pill>
                <span className="text-[11px] text-red-600">{client.monthlyRevenue.toFixed(0)} Ar</span>
              </div>
            ) : (
              <Pill tone="slate">{client.surplus || 0}</Pill>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-2">
            <div className="relative w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", utilBg(client.utilizationRate))}
                   style={{ width: `${Math.min(client.utilizationRate, 100)}%` }} />
            </div>
            <span className={cn("text-[12px] font-medium tabular-nums", utilColor(client.utilizationRate))}>
              {Math.round(client.utilizationRate)}%
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1.5">
            {client.atRisk && (
              <TooltipProvider>
                <ShadTooltip>
                  <TooltipTrigger asChild>
                    <div className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 cursor-help text-[10.5px] font-medium">
                      À risque
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Sous-utilisation du forfait</p>
                    <p className="text-amber-600">Churn: {Math.round(client.churnRisk * 100)}%</p>
                  </TooltipContent>
                </ShadTooltip>
              </TooltipProvider>
            )}
            {(client.surplus || 0) > 0 && (
              <TooltipProvider>
                <ShadTooltip>
                  <TooltipTrigger asChild>
                    <div className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 cursor-help text-[10.5px] font-medium">
                      Surplus
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Surplus: {client.surplus} articles</p>
                    <p className="text-red-600">+{client.monthlyRevenue.toFixed(0)} Ar</p>
                  </TooltipContent>
                </ShadTooltip>
              </TooltipProvider>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle}
                    className="h-7 px-2 text-[11px] text-slate-500 hover:bg-slate-100">
              {isExpanded ? 'Réduire' : 'Détails'}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
          <TableCell colSpan={6} className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div>
                <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500">Statistiques</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: "Moy./jour", v: client.dailyAverage.toFixed(1) },
                    { l: "Jours actifs", v: client.activeDays },
                    { l: "Tendance", v: client.growthTrend > 0 ? `+${Math.round(client.growthTrend * 100)}%` : "Stable" },
                    { l: "Valeur vie", v: `${client.customerLifetimeValue.toFixed(0)} Ar` },
                    { l: "Dernière cde", v: client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString('fr-FR') : "—" },
                    { l: "Risque churn", v: `${Math.round(client.churnRisk * 100)}%` },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <p className="text-[10.5px] text-slate-500">{s.l}</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[12px] font-semibold text-slate-800 mb-1">Insight</p>
                  <p className="text-[12.5px] text-slate-700">
                    {client.atRisk
                      ? `Utilise ${Math.round(client.utilizationRate)}% de son forfait. ${client.dailyAverage < 2 ? 'Fréquence faible.' : ''}`
                      : client.surplus > 0
                      ? `Dépasse son forfait (+${client.surplus} art.). ${client.monthlyRevenue > 50 ? 'Upgrade recommandé.' : ''}`
                      : client.growthTrend > 0.2
                      ? `Croissance +${Math.round(client.growthTrend * 100)}%. À surveiller.`
                      : `Utilisation optimale (${Math.round(client.utilizationRate)}%). Client fidèle.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {client.atRisk ? (
                    <>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('contact', client)}>Contacter</Button>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('downgrade', client)}>Downgrade</Button>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('survey', client)}>Sondage</Button>
                    </>
                  ) : (client.surplus || 0) > 0 ? (
                    <>
                      <Button size="sm" className={cn(ui.btnPrimary, "justify-start")} onClick={() => onAction('invoice', client)}>Facturer</Button>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('upgrade', client)}>Upgrade</Button>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('loyalty', client)}>Fidélité</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} disabled>Optimal</Button>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('loyalty', client)}>Fidélité</Button>
                      <Button variant="outline" size="sm" className={cn(ui.btn, "justify-start")} onClick={() => onAction('referral', client)}>Parrainage</Button>
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

/* ============================================================
   PAGINATION
============================================================ */
const Pagination = ({
  currentPage, totalPages, onPageChange, totalItems, itemsPerPage,
}: {
  currentPage: number; totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number; itemsPerPage: number;
}) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-[12px] text-slate-500">
        {start}–{end} sur <span className="font-medium text-slate-700">{totalItems}</span> clients
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1} className={ui.btn}>
          Préc.
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let n: number;
          if (totalPages <= 5) n = i + 1;
          else if (currentPage <= 3) n = i + 1;
          else if (currentPage >= totalPages - 2) n = totalPages - 4 + i;
          else n = currentPage - 2 + i;
          return (
            <Button key={n} size="sm"
                    className={cn("w-8", currentPage === n ? ui.btnPrimary : ui.btn)}
                    onClick={() => onPageChange(n)}>
              {n}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages} className={ui.btn}>
          Suiv.
        </Button>
      </div>
    </div>
  );
};

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export const VolumeAnalysisTab = ({
  orders: propOrders, users: propUsers, subscriptions: propSubscriptions,
  subscriptionPlans: propSubscriptionPlans, invoices: propInvoices, previousPeriodData,
}: {
  orders?: Order[]; users?: User[]; subscriptions?: Subscription[];
  subscriptionPlans?: SubscriptionPlan[]; invoices?: Invoice[]; previousPeriodData?: any;
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

  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({ queryKey: ["/api/dashboard/executive"] });
  const { data: clientData } = useQuery({ queryKey: ["/api/analytics/clients"] });
  const { data: invoiceData } = useQuery({ queryKey: ["/api/invoices"] });
  const { data: orderData } = useQuery({ queryKey: ["/api/orders"] });

  const orders = (orderData || propOrders || []) as Order[];
  const users = ((clientData as any)?.allClients || propUsers || []) as User[];
  const subscriptions = (propSubscriptions || []) as Subscription[];
  const subscriptionPlans = (propSubscriptionPlans || []) as SubscriptionPlan[];
  const invoices = (invoiceData || propInvoices || []) as Invoice[];

  const handleRefresh = () => {
    setIsLoading(true); refetchAnalytics(); setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 500);
    toast({ title: "Données actualisées" });
  };

  const calculateTrend = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === null || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      dir: change >= 0 ? 'up' as const : 'down' as const,
      label: `${Math.abs(Math.round(change))}%`,
    };
  };

  /* ============================================================
     LOGIQUE MÉTIER (INCHANGÉE)
  ============================================================ */
  const volumeAnalytics = useMemo<VolumeAnalytics>(() => {
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

    const last7DaysOrders = orders.filter(o => {
      if (!o?.createdAt) return false;
      return new Date(o.createdAt) >= sevenDaysAgo;
    });

    const last7DaysItems = last7DaysOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);

    const invoicesPaid = invoices.filter((inv: Invoice) => inv.status === 'paid');

    const last7DaysRevenue = invoicesPaid.filter((inv: Invoice) => {
      if (!inv?.createdAt) return false;
      return new Date(inv.createdAt) >= sevenDaysAgo;
    }).reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amount || '0'), 0);

    const monthToDateOrders = orders.filter(o => {
      if (!o?.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= startOfMonth && orderDate <= endOfMonth;
    });

    const monthToDateItems = monthToDateOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);

    const monthToDateRevenue = invoicesPaid.filter((inv: Invoice) => {
      if (!inv?.createdAt) return false;
      return new Date(inv.createdAt) >= startOfMonth;
    }).reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amount || '0'), 0);

    const daysInMonth = endOfMonth.getDate();
    const daysPassed = now.getDate();
    const dailyAverage = daysPassed > 0 ? monthToDateItems / daysPassed : 0;
    const projectedMonthItems = Math.round(dailyAverage * daysInMonth);
    const projectedMonthRevenue = daysPassed > 0 ? (monthToDateRevenue / daysPassed) * daysInMonth : 0;

    const totalOrdersCount = orders.length;
    const totalItemsAllOrders = orders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
    const averageItemsPerOrder = totalOrdersCount > 0 ? totalItemsAllOrders / totalOrdersCount : 0;
    const averageOrderValue = totalOrdersCount > 0 ? monthToDateRevenue / totalOrdersCount : 0;

    const dayCounts: { [key: string]: { count: number; items: number; date: string } } = {};
    const hourCounts: { [key: number]: number } = {};

    orders.forEach(order => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      const dayKey = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const hour = date.getHours();

      if (!dayCounts[dayKey]) dayCounts[dayKey] = { count: 0, items: 0, date: date.toISOString().split('T')[0] };
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

      return { name: day, Articles: avgItems, Orders: dayOrders.length, isPredicted: false };
    });

    const hourlyDistributionData = Array.from({ length: 24 }, (_, i) => {
      const count = hourCounts[i] || 0;
      const total = Object.values(hourCounts).reduce((a, b) => a + b, 0);
      return { hour: `${i}h`, count, percentage: total > 0 ? (count / total) * 100 : 0 };
    });

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

        const clientInvoices = invoices.filter((inv: Invoice) => inv?.clientId === client.id);
        const totalInvoices = clientInvoices.length;
        const totalPaidInvoices = clientInvoices.filter((inv: Invoice) => inv.status === 'paid').length;
        const totalPendingInvoices = clientInvoices.filter((inv: Invoice) => inv.status === 'pending').length;
        const totalOverdueInvoices = clientInvoices.filter((inv: Invoice) => inv.status === 'overdue').length;

        if (!clientPlan) {
          return {
            ...client,
            planName: 'Aucun', planType: undefined,
            itemsIncluded: 0, itemsProcessed: 0, surplus: 0, utilizationRate: 0, atRisk: true,
            clientOrders, clientPlan: undefined,
            lastOrderDate: lastOrder ? new Date(lastOrder.createdAt) : null,
            dailyAverage: 0, activeDays: 0, growthTrend: 0,
            monthlyRevenue: 0, revenueGrowth: 0, customerLifetimeValue: 0,
            churnRisk: 0.8, avgProcessingTime: 0,
            preferredDay: client.preferredPickupDays?.[0],
            preferredTime: client.preferredTimeWindowStart ? `${client.preferredTimeWindowStart}-${client.preferredTimeWindowEnd}` : undefined,
            pickupReliability: 0, paymentReliability: 0,
            totalInvoices, totalPaidInvoices, totalPendingInvoices, totalOverdueInvoices,
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
          utilizationRate, atRisk,
          clientOrders, clientPlan,
          lastOrderDate: lastOrder ? new Date(lastOrder.createdAt) : null,
          dailyAverage: daysPassed > 0 ? itemsProcessed / daysPassed : 0,
          activeDays: new Set(
            clientOrdersThisMonth.filter(o => o?.createdAt).map(o => new Date(o.createdAt).toDateString())
          ).size,
          growthTrend,
          monthlyRevenue: clientMonthlyRevenue,
          revenueGrowth: growthTrend,
          customerLifetimeValue, churnRisk, avgProcessingTime,
          preferredDay: client.preferredPickupDays?.[0],
          preferredTime: client.preferredTimeWindowStart ? `${client.preferredTimeWindowStart}-${client.preferredTimeWindowEnd}` : undefined,
          pickupReliability,
          paymentReliability: totalInvoices > 0 ? (totalPaidInvoices / totalInvoices) * 100 : 0,
          totalInvoices, totalPaidInvoices, totalPendingInvoices, totalOverdueInvoices,
        };
      });

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
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }

    const weeklyForecastData = calculateWeeklyForecast(orders, clientsWithData);

    const totalWeeklyCapacityForAllClients = clientsWithData
      .filter(c => c.clientPlan)
      .reduce((sum, client) => sum + (client.clientPlan?.itemsIncluded || 0), 0);

    const totalMonthlyCapacity = totalWeeklyCapacityForAllClients * 4.33;
    const currentUtilizationRate = totalMonthlyCapacity > 0 ? (monthToDateItems / totalMonthlyCapacity) * 100 : 0;

    const totalMonthlyRevenue = clientsWithData
      .filter(c => c.surplus > 0)
      .reduce((sum, c) => sum + c.monthlyRevenue, 0);

    const totalMonthlyRevenuePotential = clientsWithData
      .reduce((sum, c) => sum + (c.itemsIncluded * 2.5 * 0.7), 0);

    const averageRevenuePerClient = clientsWithData.length > 0 ? monthToDateRevenue / clientsWithData.length : 0;

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
      todayItems, todayOrders, yesterdayItems, yesterdayOrders,
      last7DaysItems, last7DaysOrders: last7DaysOrders.length,
      last7DaysRevenue, weeklyGrowth: growthRate,
      monthToDateItems, monthToDateOrders: monthToDateOrders.length, monthToDateRevenue,
      projectedMonthItems, projectedMonthRevenue,
      averageItemsPerOrder, averageOrderValue,
      surplusAlertsThisMonth: clientsWithData.filter(c => c.surplus > 0).length,
      atRiskClients: clientsWithData.filter(c => c.atRisk).length,
      churnRiskClients: clientsWithData.filter(c => c.churnRisk > 0.6).length,
      peakDay: peakDay.name ? peakDay : null,
      peakHour: peakHourEntry.hour ? peakHourEntry : null,
      clientData: clientsWithData,
      weeklyVolumeData, weeklyForecastData, hourlyDistributionData,
      totalWeeklyCapacityForAllClients, totalMonthlyCapacity, currentUtilizationRate,
      totalMonthlyRevenue, totalMonthlyRevenuePotential, averageRevenuePerClient,
      revenueGrowth, growthRate,
      seasonalityIndex: weeklyVariation, volatilityIndex,
      nextMonthForecast: projectedMonthItems,
      confidenceInterval: {
        min: Math.round(projectedMonthItems * 0.85),
        max: Math.round(projectedMonthItems * 1.15),
      },
      clientSegments,
      avgPickupTime, avgDeliveryTime, onTimeRate,
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
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, selectedSegment]);

  const handleClientAction = (action: string, client: ClientData) => {
    const actions: Record<string, { title: string; description: string }> = {
      contact: { title: "Contact client", description: `Email de suivi envoyé à ${client.fullName}.` },
      invoice: { title: "Facture générée", description: `Facture de ${client.monthlyRevenue.toFixed(2)} Ar créée pour ${client.fullName}.` },
      upgrade: { title: "Upgrade proposé", description: `Proposition d'upgrade envoyée à ${client.fullName}.` },
      downgrade: { title: "Downgrade proposé", description: `Proposition de plan adapté envoyée à ${client.fullName}.` },
      loyalty: { title: "Fidélité", description: `Programme fidélité présenté à ${client.fullName}.` },
      survey: { title: "Questionnaire envoyé", description: `Questionnaire envoyé à ${client.fullName}.` },
      referral: { title: "Parrainage", description: `Programme parrainage envoyé à ${client.fullName}.` },
    };
    toast({
      title: actions[action]?.title || "Action effectuée",
      description: actions[action]?.description || `Action ${action} effectuée pour ${client.fullName}`,
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="ml-1 opacity-40">↕</span>;
    return sortConfig.direction === 'ascending' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  return (
    <div className="space-y-5">
      {/* ===== EN-TÊTE ===== */}
      <div className={cn(ui.card, "flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between")}>
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Analyse de volume</h2>
            <p className="text-[11.5px] text-slate-500">
              {volumeAnalytics.clientData.length} clients actifs • {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Pill tone="brand">
            {selectedTimeRange === "30d" ? "30 jours" : selectedTimeRange === "7d" ? "7 jours" : "Aujourd'hui"}
          </Pill>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className={cn(ui.input, "w-32")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className={ui.btn}
                  onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Chargement…' : 'Actualiser'}
          </Button>
          <Button variant="outline" size="sm" className={ui.btn}>
            Exporter
          </Button>
        </div>
      </div>

      {/* ===== KPI ===== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MiniKPI title="Volume journalier" value={volumeAnalytics.todayItems}
                 subtitle={`vs hier: ${volumeAnalytics.yesterdayItems}`}
                 trend={calculateTrend(volumeAnalytics.todayItems, volumeAnalytics.yesterdayItems)} />
        <MiniKPI title="Volume hebdomadaire" value={volumeAnalytics.last7DaysItems}
                 subtitle={`${volumeAnalytics.last7DaysOrders} cdes • ${volumeAnalytics.last7DaysRevenue.toFixed(0)} Ar`}
                 trend={calculateTrend(volumeAnalytics.last7DaysItems, previousPeriodData?.last7DaysItems)} />
        <MiniKPI title="Mensuel" value={volumeAnalytics.monthToDateItems}
                 subtitle={`${Math.round(volumeAnalytics.projectedMonthItems)} prévus`} />
        <MiniKPI title="À surveiller"
                 value={volumeAnalytics.surplusAlertsThisMonth + volumeAnalytics.atRiskClients}
                 subtitle={`${volumeAnalytics.surplusAlertsThisMonth} surplus • ${volumeAnalytics.atRiskClients} à risque`} />
      </div>

      {/* ===== GRAPHIQUES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Volume hebdomadaire" subtitle="Moyenne quotidienne sur 30 jours"
               action={volumeAnalytics.peakDay && (
                 <Pill tone="amber">Pic: {volumeAnalytics.peakDay.name}</Pill>
               )}>
          <div className="h-64">
            <VolumeChart data={volumeAnalytics.weeklyVolumeData} type="bar" showCapacity={true} />
          </div>
        </Panel>
        <Panel title="Prévisions" subtitle="Intervalle de confiance 85–115%"
               action={volumeAnalytics.growthRate !== 0 && (
                 <Pill tone={volumeAnalytics.growthRate > 0 ? "green" : "red"}>
                   {volumeAnalytics.growthRate > 0 ? "+" : ""}{volumeAnalytics.growthRate.toFixed(1)}%
                 </Pill>
               )}>
          <div className="h-64">
            <VolumeChart data={volumeAnalytics.weeklyForecastData} type="area"
                         isForecast showCapacity showConfidence />
          </div>
        </Panel>
      </div>

      {/* ===== DISTRIBUTION HORAIRE + SEGMENTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Distribution horaire"
               subtitle={volumeAnalytics.peakHour
                 ? `Pic d'activité à ${volumeAnalytics.peakHour.hour}`
                 : "Répartition des commandes par heure"}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeAnalytics.hourlyDistributionData}
                        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={3}
                       tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={tooltipStyle} className="p-3 text-[11.5px]">
                        <p className="font-semibold text-slate-900">{d.hour}</p>
                        <p className="text-slate-600">{d.count} commandes</p>
                        <p className="text-slate-500">{d.percentage.toFixed(1)}% du total</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {volumeAnalytics.hourlyDistributionData.map((entry, i) => (
                    <Cell key={i}
                          fill={entry.hour === volumeAnalytics.peakHour?.hour ? "#f59e0b" : "#475569"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Segments clients" subtitle="Répartition par comportement">
          <div className="space-y-1.5">
            {[
              { k: 'optimal', label: 'Optimaux', color: 'bg-emerald-500' },
              { k: 'surplus', label: 'En surplus', color: 'bg-red-500' },
              { k: 'atRisk', label: 'À risque', color: 'bg-amber-500' },
              { k: 'churn', label: 'Risque churn', color: 'bg-slate-400' },
            ].map((seg) => {
              const count = volumeAnalytics.clientSegments[seg.k as keyof typeof volumeAnalytics.clientSegments];
              const pct = volumeAnalytics.clientData.length > 0
                ? Math.round((count / volumeAnalytics.clientData.length) * 100) : 0;
              const active = selectedSegment === seg.k;
              return (
                <button key={seg.k}
                        onClick={() => setSelectedSegment(active ? null : seg.k)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                          active ? "bg-slate-100" : "hover:bg-slate-50",
                        )}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", seg.color)} />
                    <span className="text-[13px] text-slate-700">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{count}</span>
                    <Pill tone="slate">{pct}%</Pill>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* ===== INSIGHTS & RECOMMANDATIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Tendance globale" subtitle="Analyse de la croissance">
          <div className="space-y-3">
            <div className={cn(
              "rounded-lg border p-3",
              volumeAnalytics.growthRate > 5 ? "border-emerald-200 bg-emerald-50/60"
              : volumeAnalytics.growthRate < -5 ? "border-red-200 bg-red-50/60"
              : "border-slate-200 bg-slate-50/60",
            )}>
              <p className="text-[12px] font-semibold text-slate-800 mb-1">
                {volumeAnalytics.growthRate > 5 ? "Croissance"
                  : volumeAnalytics.growthRate < -5 ? "Baisse"
                  : "Stable"}
              </p>
              <p className="text-[12.5px] text-slate-700">
                {volumeAnalytics.growthRate > 10 ? `Croissance exceptionnelle de +${volumeAnalytics.growthRate.toFixed(1)}%.`
                  : volumeAnalytics.growthRate > 5 ? `Croissance modérée de +${volumeAnalytics.growthRate.toFixed(1)}%.`
                  : volumeAnalytics.growthRate < -10 ? `Baisse significative de ${Math.abs(volumeAnalytics.growthRate).toFixed(1)}%. Analyse requise.`
                  : volumeAnalytics.growthRate < -5 ? `Légère baisse de ${Math.abs(volumeAnalytics.growthRate).toFixed(1)}%.`
                  : `Activité stable (${volumeAnalytics.growthRate.toFixed(1)}%).`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[10.5px] text-slate-500">Volatilité</p>
                <p className="text-[13px] font-semibold text-slate-900">{volumeAnalytics.volatilityIndex.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[10.5px] text-slate-500">Saisonnalité</p>
                <p className="text-[13px] font-semibold text-slate-900">{volumeAnalytics.seasonalityIndex.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Comportement clients" subtitle="État des forfaits">
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[12px] font-semibold text-slate-800 mb-1">Utilisation</p>
              <p className="text-[12.5px] text-slate-700">
                {volumeAnalytics.atRiskClients > 0
                  ? `${volumeAnalytics.atRiskClients} client${volumeAnalytics.atRiskClients > 1 ? 's' : ''} sous-utilise${volumeAnalytics.atRiskClients > 1 ? 'nt' : ''} leur forfait.`
                  : "Tous les clients utilisent correctement leur forfait."}
                {volumeAnalytics.surplusAlertsThisMonth > 0 && (
                  <> {volumeAnalytics.surplusAlertsThisMonth} en surplus ({volumeAnalytics.totalMonthlyRevenue.toFixed(0)} Ar potentiel).</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {volumeAnalytics.atRiskClients > 0 && (
                <Button size="sm" variant="outline" className={ui.btn}
                        onClick={() => setFilterStatus("atRisk")}>
                  Voir à risque
                </Button>
              )}
              {volumeAnalytics.surplusAlertsThisMonth > 0 && (
                <Button size="sm" variant="outline" className={ui.btn}
                        onClick={() => setFilterStatus("surplus")}>
                  Voir surplus
                </Button>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Performance opérationnelle" subtitle="Indicateurs temps réel">
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Ponctualité", v: `${volumeAnalytics.onTimeRate.toFixed(1)}%` },
              { l: "Ramassage", v: `${volumeAnalytics.avgPickupTime.toFixed(0)} min` },
              { l: "Livraison", v: `${volumeAnalytics.avgDeliveryTime.toFixed(0)} min` },
              { l: "Utilisation", v: `${volumeAnalytics.currentUtilizationRate.toFixed(1)}%` },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                <p className="text-[10.5px] text-slate-500 truncate">{s.l}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{s.v}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ===== TABLE CLIENTS ===== */}
      <Panel title="Clients actifs"
             subtitle={`${filteredClients.length} affichés • ${volumeAnalytics.clientData.length} total`}
             bodyClass="p-0"
             action={
               <div className="flex items-center gap-2">
                 <Input placeholder="Rechercher…" value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(ui.input, "w-48 h-9 text-[12.5px]")} />
                 <Select value={filterStatus} onValueChange={setFilterStatus}>
                   <SelectTrigger className={cn(ui.input, "w-32 h-9")}><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Tous</SelectItem>
                     <SelectItem value="atRisk">À risque</SelectItem>
                     <SelectItem value="surplus">Surplus</SelectItem>
                     <SelectItem value="optimal">Optimal</SelectItem>
                     <SelectItem value="churn">Churn</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             }>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                {[
                  { k: 'fullName', l: 'Client', align: 'left' },
                  { k: null, l: 'Plan', align: 'left' },
                  { k: 'itemsProcessed', l: 'Traité/mois', align: 'center' },
                  { k: 'surplus', l: 'Surplus', align: 'center' },
                  { k: 'utilizationRate', l: 'Utilisation', align: 'center' },
                  { k: null, l: 'Actions', align: 'right' },
                ].map((h, i) => (
                  <TableHead key={i}
                             className={cn(
                               "text-[11px] font-semibold uppercase tracking-wider text-slate-500",
                               h.align === 'center' && "text-center",
                               h.align === 'right' && "text-right",
                               h.k && "cursor-pointer hover:text-slate-700 select-none",
                             )}
                             onClick={h.k ? () => handleSort(h.k!) : undefined}>
                    <div className={cn("flex items-center gap-1",
                      h.align === 'center' && "justify-center",
                      h.align === 'right' && "justify-end")}>
                      {h.l}{h.k && getSortIcon(h.k)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-[13px] text-slate-500">
                    Aucun client trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <ClientRow key={client.id} client={client}
                             isExpanded={expandedClient === client.id}
                             onToggle={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                             onAction={handleClientAction} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-5">
            <Pagination currentPage={currentPage} totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredClients.length} itemsPerPage={itemsPerPage} />
          </div>
        )}
      </Panel>
    </div>
  );
};

/* ============================================================
   FONCTIONS UTILITAIRES (inchangées)
============================================================ */
function getDefaultAnalytics(): VolumeAnalytics {
  return {
    todayItems: 0, todayOrders: 0, yesterdayItems: 0, yesterdayOrders: 0,
    last7DaysItems: 0, last7DaysOrders: 0, last7DaysRevenue: 0, weeklyGrowth: 0,
    monthToDateItems: 0, monthToDateOrders: 0, monthToDateRevenue: 0,
    projectedMonthItems: 0, projectedMonthRevenue: 0,
    averageItemsPerOrder: 0, averageOrderValue: 0,
    surplusAlertsThisMonth: 0, atRiskClients: 0, churnRiskClients: 0,
    peakDay: null, peakHour: null, clientData: [],
    weeklyVolumeData: [], weeklyForecastData: [], hourlyDistributionData: [],
    totalWeeklyCapacityForAllClients: 0, totalMonthlyCapacity: 0,
    currentUtilizationRate: 0, totalMonthlyRevenue: 0, totalMonthlyRevenuePotential: 0,
    averageRevenuePerClient: 0, revenueGrowth: 0, growthRate: 0,
    seasonalityIndex: 0, volatilityIndex: 0, nextMonthForecast: 0,
    confidenceInterval: { min: 0, max: 0 },
    clientSegments: { optimal: 0, atRisk: 0, surplus: 0, churn: 0 },
    avgPickupTime: 0, avgDeliveryTime: 0, onTimeRate: 0,
  };
}

function calculateWeeklyForecast(orders: Order[], clients: ClientData[]): Array<{ name: string; Prévisions: number; Capacité: number; BorneInf: number; BorneSup: number; isPredicted: boolean }> {
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  if (!orders || orders.length === 0) {
    return weekDays.map(day => ({ name: day, Prévisions: 0, Capacité: 0, BorneInf: 0, BorneSup: 0, isPredicted: true }));
  }

  const now = new Date();
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

  const sortedOrders = [...historicalOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let trend = 0;
  if (sortedOrders.length > 10) {
    const midPoint = Math.floor(sortedOrders.length / 2);
    const firstHalf = sortedOrders.slice(0, midPoint).reduce((sum, o) => sum + (o.itemCount || 0), 0);
    const secondHalf = sortedOrders.slice(midPoint).reduce((sum, o) => sum + (o.itemCount || 0), 0);
    trend = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
  }

  const totalCapacity = clients
    .filter(c => c.clientPlan)
    .reduce((sum, c) => sum + (c.clientPlan?.itemsIncluded || 0), 0);

  return weekDays.map((day, index) => {
    let forecast = dayAverages[index];
    if (trend > 0) forecast = forecast * (1 + trend * 0.3);
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
      isPredicted: true,
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
    const weekTotal = orders.filter(o => {
      if (!o?.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= weekStart && orderDate <= weekEnd;
    }).reduce((sum, o) => sum + (o.itemCount || 0), 0);
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
  orders.filter(o => {
    if (!o?.createdAt) return false;
    return new Date(o.createdAt) >= thirtyDaysAgo;
  }).forEach(order => {
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
    if (type === 'pickup') return o.actualPickupDate && o.scheduledPickupDate;
    else return o.actualDeliveryDate && o.scheduledDeliveryDate;
  });
  if (relevantOrders.length === 0) return 0;
  const times = relevantOrders.map(o => {
    const scheduled = type === 'pickup' ? new Date(o.scheduledPickupDate!) : new Date(o.scheduledDeliveryDate!);
    const actual = type === 'pickup' ? new Date(o.actualPickupDate!) : new Date(o.actualDeliveryDate!);
    return Math.abs(actual.getTime() - scheduled.getTime()) / (1000 * 60);
  });
  return times.reduce((a, b) => a + b, 0) / times.length;
}