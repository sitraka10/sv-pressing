// client/src/pages/admin-dashboard-complete.tsx
// 100% textuel — aucune icône. Sidebar & header simplifiés.
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DeliveriesAndPickupsTab } from "./DeliveriesAndPickupsTab";
import { OrdersTab } from "./OrdersTab";
import { ClientsTab } from "./ClientsTab";
import { DriversTab } from "./DriversTab";
import { InvoicesTab } from "./InvoicesTab";
import { AgentsTab } from './admin/AgentsTab';
import { CustomQuotesSection } from "./ClientSiteSections";
import { ExpensesTab } from "./ExpensesTab";
import { PlansTab } from "./PlansTab";
import { VolumeAnalysisTab } from "./VolumeAnalysisTab";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Eye, UserX, UserCheck, Loader2, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* ===== DESIGN SYSTEM ===== */
const BRAND = "#0B676E";
const SURFACE = "#F4F7FB";
const ui = {
  card: "bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]",
  input: "h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/20",
  btn: "h-9 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50",
  btnPrimary: "h-9 rounded-xl bg-[#0B676E] font-medium text-white shadow-none transition-colors hover:bg-[#09565C]",
  btnDanger: "h-9 rounded-xl border border-red-200 bg-white font-medium text-red-600 hover:bg-red-50",
  btnApprove: "h-9 rounded-xl bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  dialog: "rounded-2xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
  well: "rounded-xl border border-slate-200 bg-slate-50/80",
};
const tooltipStyle = { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, boxShadow: "0 8px 24px -6px rgba(15,23,42,.15)" };

const STATUS_LABELS: Record<string, string> = {
  to_pickup: "À ramasser", to_sort: "À trier", to_wash: "À laver", to_dry: "À sécher",
  to_iron: "À repasser", ready_to_deliver: "Prêt à livrer", to_deliver: "À livrer", delivered: "Livré",
};
const STATUS_COLORS: Record<string, string> = {
  to_pickup: "#D97706", to_sort: "#2563EB", to_wash: "#7C3AED", to_dry: "#DB2777",
  to_iron: "#EA580C", ready_to_deliver: "#0B676E", to_deliver: "#0891B2", delivered: "#0B676E",
};
const getStatusLabel = (s: string) => STATUS_LABELS[s] || s;
const getStatusColor = (s: string) => STATUS_COLORS[s] || "#64748B";
const safeArray = (d: any): any[] => (Array.isArray(d) ? d : []);
const formatCurrency = (v: number): string => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M Ar`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} k Ar`;
  return `${Math.round(v).toLocaleString("fr-FR")} Ar`;
};
const formatDate = (d: any): string => {
  if (!d) return "-";
  const x = new Date(d);
  return isNaN(x.getTime()) ? "-" : format(x, "dd/MM/yyyy", { locale: fr });
};
const formatDateTime = (d: any): string => {
  if (!d) return "-";
  const x = new Date(d);
  return isNaN(x.getTime()) ? "-" : format(x, "dd/MM/yyyy HH:mm", { locale: fr });
};
const newOrderSchema = z.object({
  clientId: z.number(),
  itemCount: z.number().min(1, "Au moins 1 pièce"),
  pickupDate: z.date(),
  timeWindowStart: z.string().optional(),
  timeWindowEnd: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type Tone = "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";
const toneClass: Record<Tone, string> = {
  brand: "bg-[#0B676E]/10 text-[#0B676E]",
  green: "bg-[#0B676E]/10 text-[#0B676E]",
  red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700", purple: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-600",
};
const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[tone], className)}>{children}</span>
);
const Panel: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; className?: string; bodyClass?: string; children: React.ReactNode }> = ({ title, subtitle, action, className, bodyClass, children }) => (
  <section className={cn(ui.card, className)}>
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0"><h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}</div>
      {action}
    </header>
    <div className={cn("p-5", bodyClass)}>{children}</div>
  </section>
);
const Empty: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({ title, hint, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-[13.5px] font-semibold text-slate-800">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const KPI: React.FC<{
  title: string; value: string | number; subtitle?: string; trend?: number;
  tone?: Tone; progress?: number; progressLabel?: string;
}> = ({ title, value, subtitle, trend, progress, progressLabel }) => {
  const up = (trend ?? 0) >= 0;
  return (
    <div className={cn(ui.card, "p-5")}>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px]">
        {trend !== undefined && trend !== 0 && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
            up ? "bg-[#0B676E]/10 text-[#0B676E]" : "bg-red-50 text-red-700")}>
            {up ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {subtitle && <span className="truncate text-slate-500">{subtitle}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#0B676E]" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

const HealthRing: React.FC<{ score: number; status: string }> = ({ score, status }) => {
  const cfg: Record<string, { c: string; l: string }> = {
    excellent: { c: "#0B676E", l: "Excellente" },
    bon: { c: "#2563EB", l: "Bonne" },
    attention: { c: "#D97706", l: "À surveiller" },
    critique: { c: "#DC2626", l: "Critique" },
  };
  const { c, l } = cfg[status] || cfg.excellent;
  const r = 52, circ = 2 * Math.PI * r, s = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" /><circle cx="60" cy="60" r={r} fill="none" stroke={c} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (circ * s) / 100} /></svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-semibold text-slate-900">{s}</span><span className="text-[11px] text-slate-500">sur 100</span></div>
      </div>
      <div><p className="text-base font-semibold" style={{ color: c }}>{l}</p><p className="mt-1 text-xs text-slate-500">Basé sur retards, impayés, inscriptions.</p></div>
    </div>
  );
};
const ChartEmpty = () => <div className="flex h-full items-center justify-center text-xs text-slate-400">Données insuffisantes</div>;

const ExecutiveDashboardBI: React.FC = () => {
  const { data: stats, isLoading: l1 } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: orderAnalytics, isLoading: l2 } = useQuery<any>({ queryKey: ["/api/analytics/orders"] });
  const { data: deliveryAnalytics, isLoading: l3 } = useQuery<any>({ queryKey: ["/api/analytics/deliveries"] });
  const { data: clientAnalytics, isLoading: l4 } = useQuery<any>({ queryKey: ["/api/analytics/clients"] });
  const { data: lateOrdersData, isLoading: l5 } = useQuery<any>({ queryKey: ["/api/analytics/late-orders"] });
  const { data: executiveData, isLoading: l6 } = useQuery<any>({ queryKey: ["/api/dashboard/executive"] });
  const { data: hourlyData, isLoading: l7 } = useQuery<any>({ queryKey: ["/api/analytics/hourly"] });
  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return <div className="space-y-4"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />)}</div><div className="grid gap-4 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-2xl bg-slate-200/70 lg:col-span-2" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" /></div></div>;

  const orders = orderAnalytics || { total: 0, active: 0, delivered: 0, growth: 0, byStatus: {} };
  const deliveries = deliveryAnalytics || { total: 0, completed: 0, successRate: 0 };
  const clients = clientAnalytics || { total: 0, active: 0, pending: 0, retention: 0 };
  const late = lateOrdersData?.activeLate || { total: 0 };
  const exec = executiveData || { financial: { monthly: {}, revenueByMonth: [] }, clients: { topClients: [] }, alerts: [], recommendations: [] };
  const hourlyStats = hourlyData || { byHour: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, orders: 0, revenue: 0 })) };

  const m = exec.financial?.monthly || {};
  const revenue = m.revenue || 0;
  const profit = revenue - (m.expenses || 0);
  const revenueGrowth = m.revenueGrowth || 0;
  const successRate = deliveries.successRate || 0;
  const retention = clients.retention || 0;
  const completion = orders.total > 0 ? Math.round((orders.delivered / orders.total) * 100) : 0;
  const overdue = stats?.financial?.overdueInvoices?.count || 0;
  const healthScore = Math.max(0, 100 - late.total * 2 - overdue * 1.5 - (clients.pending || 0) * 0.5);
  const healthStatus = healthScore >= 80 ? "excellent" : healthScore >= 60 ? "bon" : healthScore >= 40 ? "attention" : "critique";
  const statusData = Object.entries(orders.byStatus || {}).map(([k, v]) => ({ name: getStatusLabel(k), value: v as number, color: getStatusColor(k) }));
  const clientRatio = clients.total > 0 ? Math.min(100, (clients.active / clients.total) * 100) : 0;
  const efficiency = orders.total > 0 ? Math.min(100, (orders.delivered / orders.total) * 100) : 0;
  const growthScore = Math.min(100, (orders.growth || 0) * 10 + 50);
  const radarData = [
    { subject: "Commandes", value: Math.min(100, orders.total / 10), target: 70 },
    { subject: "Livraisons", value: successRate, target: 85 },
    { subject: "Clients", value: clientRatio, target: 60 },
    { subject: "Rétention", value: retention, target: 80 },
    { subject: "Efficacité", value: efficiency, target: 75 },
    { subject: "Croissance", value: growthScore, target: 70 },
  ];
  const hourlyChartData = hourlyStats.byHour.map((h: any) => ({ hour: h.hour, orders: h.orders || 0, revenue: h.revenue || 0 }));
  const alerts = safeArray(exec.alerts);
  const recommendations = safeArray(exec.recommendations);
  const criticalCount = alerts.filter((a: any) => a.level === "critical").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI title="Chiffre d'affaires" value={formatCurrency(revenue)} subtitle={`${formatCurrency(profit)} de profit`} trend={revenueGrowth} progress={m.grossMargin || 0} progressLabel="Marge brute" />
        <KPI title="Commandes" value={orders.total} subtitle={`${orders.active} actives`} trend={orders.growth} progress={completion} progressLabel="Complétion" />
        <KPI title="Clients" value={clients.total} subtitle={`${clients.active} actifs`} progress={retention} progressLabel="Rétention" />
        <KPI title="Livraisons" value={`${successRate}%`} subtitle={`${deliveries.completed}/${deliveries.total}`} progress={successRate} progressLabel="Succès" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Évolution du chiffre d'affaires" subtitle="12 derniers mois" action={<Pill tone={revenueGrowth >= 0 ? "brand" : "red"}>{revenueGrowth >= 0 ? "+" : ""}{revenueGrowth}%</Pill>}>
          <div className="h-64">
            {safeArray(exec.financial?.revenueByMonth).length === 0 ? <ChartEmpty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={exec.financial.revenueByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND} stopOpacity={0.35} /><stop offset="100%" stopColor={BRAND} stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} width={70} />
                  <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(Number(v)), "CA"]} />
                  <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2.5} fill="url(#rev)" dot={{ fill: BRAND, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        <Panel title="Répartition des commandes" subtitle={`${orders.active} actives`}>
          <div className="h-64">
            {statusData.length === 0 ? <ChartEmpty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">{statusData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
                  <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, "Commandes"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Performance globale" subtitle="Réel vs objectifs">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} /><PolarRadiusAxis stroke="#94a3b8" fontSize={9} angle={90} />
                <Radar name="Performance" dataKey="value" stroke={BRAND} fill={BRAND} fillOpacity={0.3} />
                <Radar name="Objectif" dataKey="target" stroke="#94a3b8" fill="none" strokeDasharray="4 4" />
                <RTooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Activité horaire" subtitle="Commandes par heure">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={2} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, "Commandes"]} />
                <Area type="monotone" dataKey="orders" stroke="#0B676E" strokeWidth={2} fill="#0B676E" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {(alerts.length > 0 || recommendations.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {alerts.length > 0 && (
            <Panel title="Alertes" subtitle={`${alerts.length} en cours`} action={<Pill tone="red">{criticalCount} critique{criticalCount > 1 ? "s" : ""}</Pill>} bodyClass="p-3">
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.map((a: any, i: number) => (
                  <li key={i} className={cn("rounded-xl border-l-4 p-3 text-[12.5px]", a.level === "critical" ? "border-red-500 bg-red-50/70" : a.level === "warning" ? "border-amber-500 bg-amber-50/70" : "border-[#0B676E] bg-[#0B676E]/5")}>
                    <p className="font-medium text-slate-800">{a.message}</p>
                    {a.action && <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-600"><span className="inline-block w-3 text-center">→</span>{a.action}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {recommendations.length > 0 && (
            <Panel title="Recommandations" subtitle={`${recommendations.length} suggestions`} action={<Pill tone="brand">Prioritaires</Pill>} bodyClass="p-3">
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {recommendations.map((r: any, i: number) => (
                  <li key={i} className={cn("rounded-xl border-l-4 p-3 text-[12.5px]", r.priority === "high" ? "border-red-500 bg-red-50/70" : r.priority === "medium" ? "border-amber-500 bg-amber-50/70" : "border-[#0B676E] bg-[#0B676E]/5")}>
                    <p className="font-medium text-slate-800">{r.title}</p>
                    {r.action && <p className="mt-1 flex items-center gap-1 text-[11px] text-[#0B676E]"><span className="inline-block w-3 text-center">→</span>{r.action}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Santé de l'entreprise" subtitle="Indicateur global">
          <HealthRing score={healthScore} status={healthStatus} />
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[["Retards", late.total], ["Impayés", overdue], ["CA proj.", formatCurrency(m.projectedRevenue || 0)]].map(([k, v]) => (
              <div key={k as string} className={cn(ui.well, "px-2 py-2.5")}><dd className="text-sm font-semibold">{v}</dd><dt className="text-[11px] text-slate-500">{k}</dt></div>
            ))}
          </dl>
        </Panel>
        <Panel title="Top 5 clients" subtitle="Classés par chiffre d'affaires" bodyClass="p-2">
          {safeArray(exec.clients?.topClients).length === 0 ? <Empty title="Aucun client" /> : (
            <ul className="divide-y divide-slate-100">
              {exec.clients.topClients.slice(0, 5).map((c: any, i: number) => (
                <li key={c.id ?? i} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold", i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500")}>{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{c.fullName}</p><p className="text-xs text-slate-500">{c.orderCount || 0} commandes</p></div>
                  <p className="text-sm font-semibold text-[#0B676E]">{formatCurrency(c.totalSpent || 0)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

const PaginationControls: React.FC<{ currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; onPageChange: (p: number) => void; onItemsPerPageChange: (v: number) => void; }> = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-[11.5px] text-slate-500">{start}–{end} sur <span className="font-medium text-slate-700">{totalItems}</span></p>
      <div className="flex items-center gap-2">
        <Select value={String(itemsPerPage)} onValueChange={(v) => onItemsPerPageChange(parseInt(v))}>
          <SelectTrigger className={cn(ui.input, "h-8 w-[84px] text-[11.5px]")}><SelectValue /></SelectTrigger>
          <SelectContent>{[5, 10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={cn(ui.btn, "h-8 px-2 text-[11px]")}>Préc.</Button>
        <span className="min-w-[64px] text-center text-[11.5px] text-slate-600">{currentPage} / {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className={cn(ui.btn, "h-8 px-2 text-[11px]")}>Suiv.</Button>
      </div>
    </div>
  );
};

const RegistrationCard: React.FC<{
  user: any;
  plan: any;
  onViewProfile: () => void;
  onReject: () => void;
  onApprove: () => void;
  isProcessing: boolean;
}> = ({ user, plan, onViewProfile, onReject, onApprove, isProcessing }) => {
  const planName = plan?.name || user.selectedPlanName || "Plan standard";
  const planPrice = plan?.pricePerMonth || user.selectedPlanPrice || "0";
  const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'CL';
  const planType = (plan?.type || 'essential').toLowerCase();
  const planTone: Tone = "brand";
  const planGradient =
    planType === "premium" ? "bg-gradient-to-br from-amber-500 to-orange-500" :
    planType === "family" ? "bg-gradient-to-br from-blue-500 to-indigo-500" :
    "bg-gradient-to-br from-[#0B676E] to-[#09565C]";
  const planBoxClass =
    planType === "premium" ? "border-amber-200 bg-amber-50" :
    planType === "family" ? "border-blue-200 bg-blue-50" :
    "border-[#0B676E]/20 bg-[#0B676E]/5";

  return (
    <div className={cn(
      ui.card, "relative overflow-hidden transition-all",
      isProcessing && "opacity-60 pointer-events-none"
    )}>
      {isProcessing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-[#0B676E] animate-spin mx-auto mb-1.5" />
            <p className="text-[10.5px] text-slate-600">Traitement…</p>
          </div>
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn("shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold text-[13px]", planGradient)}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="font-semibold text-[13px] text-slate-900 truncate">{user.fullName}</h4>
                <Pill tone={planTone}>{planName}</Pill>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span className="truncate">{user.email}</span>
                {user.phone && <><span className="text-slate-300">•</span><span>{user.phone}</span></>}
              </div>
            </div>
          </div>
          <Pill tone="amber">En attente</Pill>
        </div>

        <div className={cn("rounded-lg border p-2.5", planBoxClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-700">Plan sélectionné</span>
            <span className="text-[11px] font-semibold text-slate-900 tabular-nums">
              {new Intl.NumberFormat('fr-FR').format(parseInt(String(planPrice).replace(/\D/g, '')) || 0)} Ar/mois
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className={cn(ui.well, "p-2")}>
            <p className="text-[10px] text-slate-500">Inscription</p>
            <p className="text-[11px] font-medium text-slate-800 truncate">{formatDate(user.createdAt)}</p>
          </div>
          <div className={cn(ui.well, "p-2")}>
            <p className="text-[10px] text-slate-500">Adresse</p>
            <p className="text-[11px] font-medium text-slate-800 truncate">{user.address || user.neighborhood || "—"}</p>
          </div>
        </div>

        {/* ✅ Icon fotsiny, tsy misy text */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className={cn(ui.btn, "h-8 w-8 p-0")} onClick={onViewProfile}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">Voir le profil</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className={cn(ui.btnDanger, "h-8 w-8 p-0")} onClick={onReject} disabled={isProcessing}>
                <UserX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">Refuser</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className={cn(ui.btnApprove, "h-8 w-8 p-0")} onClick={onApprove} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">Approuver</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

const PrivatePlanCard: React.FC<{ plan: any; onEdit: () => void; }> = ({ plan, onEdit }) => {
  const features = plan.features || [];
  return (
    <div className={cn(ui.card, "relative overflow-hidden")}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Pill tone="amber">Plan privé</Pill>
            </div>
            <h4 className="font-semibold text-[13px] text-slate-900 truncate">{plan.name}</h4>
            <p className="text-[15px] font-semibold text-[#0B676E] tabular-nums">
              {new Intl.NumberFormat('fr-FR').format(parseInt(String(plan.pricePerMonth).replace(/\D/g, '')) || 0)}
              <span className="text-[11px] font-normal text-slate-500 ml-1">Ar/mois</span>
            </p>
          </div>
          <Button size="sm" className={cn(ui.btn, "h-8 w-8 p-0")} onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className={cn(ui.well, "p-2")}><span className="text-slate-700"><span className="font-medium">{plan.itemsIncluded}</span> pièces</span></div>
          <div className={cn(ui.well, "p-2")}><span className="text-slate-700"><span className="font-medium">{plan.pickupsPerWeek}</span> ramassages</span></div>
          <div className={cn(ui.well, "p-2")}><span className="text-slate-700"><span className="font-medium">{plan.deliveryTimeHours}h</span></span></div>
          <div className={cn(ui.well, "p-2")}><span className="text-slate-700">{plan.frequency || "Hebdo"}</span></div>
        </div>
        {features.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
            {features.slice(0, 3).map((f: string, i: number) => (
              <Pill key={i} tone="slate">{f}</Pill>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== PAGE ===== */
export default function AdminDashboardComplete() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderClientOpen, setNewOrderClientOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editClientData, setEditClientData] = useState<any>({});
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedClientForSub, setSelectedClientForSub] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteTab, setQuoteTab] = useState<"registrations" | "custom-quotes" | "private-plans">("registrations");
  const [isSortingDialogOpen, setIsSortingDialogOpen] = useState(false);
  const [sortingOrderId, setSortingOrderId] = useState<number | null>(null);
  const [sortingData, setSortingData] = useState({ itemCount: "", linensDetails: "" });
  const [selectedRegistrationUser, setSelectedRegistrationUser] = useState<any>(null);
  const [registrationAction, setRegistrationAction] = useState<"approve" | "refuse" | null>(null);
  const [isRegistrationConfirmOpen, setIsRegistrationConfirmOpen] = useState(false);
  const [isRegistrationProcessing, setIsRegistrationProcessing] = useState(false);
  const [registrationsCurrentPage, setRegistrationsCurrentPage] = useState(1);
  const [registrationsPerPage, setRegistrationsPerPage] = useState(5);
  const [registrationSearch, setRegistrationSearch] = useState("");

  const { data: orders = [] } = useQuery<any[]>({ queryKey: ["/api/orders"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { data: deliveries = [] } = useQuery<any[]>({ queryKey: ["/api/deliveries"] });
  const { data: invoices = [] } = useQuery<any[]>({ queryKey: ["/api/invoices"] });
  const { data: subscriptions = [] } = useQuery({ queryKey: ["subscriptions"], queryFn: async () => (await fetch("/api/subscriptions")).json() });
  const { data: subscriptionPlans = [] } = useQuery<any[]>({ queryKey: ["/api/subscription-plans"], queryFn: async () => { const res = await apiRequest("GET", "/api/subscription-plans"); if (!res.ok) throw new Error("Échec"); return await res.json(); } });
  const { data: customQuotes = [] } = useQuery<any[]>({ queryKey: ["/api/custom-quotes"], queryFn: async () => { const res = await apiRequest("GET", "/api/custom-quotes"); if (!res.ok) throw new Error("Échec"); return await res.json(); } });
  const { data: dashboardStats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"], enabled: user?.role === "admin" });
  const { data: lateOrdersData } = useQuery<any>({ queryKey: ["/api/analytics/late-orders"], enabled: user?.role === "admin" });

  const safeOrders = safeArray(orders);
  const safeUsers = safeArray(users);
  const safeDeliveries = safeArray(deliveries);
  const safeInvoices = safeArray(invoices);
  const safeCustomQuotes = safeArray(customQuotes);
  const safeSubs = safeArray(subscriptions);
  const safePlans = safeArray(subscriptionPlans);
  const clients = safeUsers.filter((u: any) => u.role === "client");
  const customPlans = safePlans.filter((p: any) => p.type === "custom");
  const pendingClients = dashboardStats?.clients?.pending ?? safeUsers.filter((u: any) => u.role === "client" && u.status === "pending").length;
  const lateOrders = dashboardStats?.orders?.late ?? lateOrdersData?.activeLate?.total ?? 0;
  const pendingQuotes = safeCustomQuotes.filter((q: any) => q.status === "pending").length;
  const overdueInvoices = dashboardStats?.financial?.overdueInvoices?.count ?? safeInvoices.filter((i: any) => i.status === "overdue").length;

  const newOrderForm = useForm<z.infer<typeof newOrderSchema>>({ resolver: zodResolver(newOrderSchema), defaultValues: { itemCount: 10, pickupDate: new Date() } });
  const invalidate = (...keys: string[]) => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
  const fail = (e: any, fallback = "Une erreur est survenue") => toast({ title: "Erreur", description: e?.message || fallback, variant: "destructive" });

  const createOrderMutation = useMutation({ mutationFn: async (d: any) => (await apiRequest("POST", "/api/orders", d)).json(), onSuccess: () => { invalidate("/api/orders", "/api/dashboard/stats", "/api/analytics/orders"); setIsNewOrderOpen(false); newOrderForm.reset(); setActiveTab("orders"); toast({ title: "Commande créée" }); }, onError: (e) => fail(e) });
  const toggleUserStatusMutation = useMutation({ mutationFn: async ({ id, status }: any) => (await apiRequest("PATCH", `/api/users/${id}`, { status })).json(), onSuccess: () => { invalidate("/api/users", "/api/dashboard/stats", "/api/analytics/clients"); toast({ title: "Statut mis à jour" }); }, onError: (e) => fail(e) });
  const updateOrderStatusMutation = useMutation({ mutationFn: async ({ orderId, status, itemCount, linensDetails }: any) => { const b: any = { status }; if (itemCount !== undefined) b.itemCount = itemCount; if (linensDetails !== undefined) b.linensDetails = linensDetails; return (await apiRequest("PATCH", `/api/orders/${orderId}`, b)).json(); }, onSuccess: () => { invalidate("/api/orders", "/api/dashboard/stats", "/api/analytics/orders"); setIsSortingDialogOpen(false); toast({ title: "Statut mis à jour" }); }, onError: (e) => fail(e) });
  const editClientMutation = useMutation({ mutationFn: async (c: any) => (await apiRequest("PATCH", `/api/users/${c.id}`, c)).json(), onSuccess: () => { invalidate("/api/users", "/api/dashboard/stats"); setIsEditClientOpen(false); toast({ title: "Client modifié" }); }, onError: (e) => fail(e) });
  const updateQuoteStatusMutation = useMutation({ mutationFn: async ({ id, status }: any) => (await apiRequest("PATCH", `/api/custom-quotes/${id}/status`, { status })).json(), onSuccess: () => invalidate("/api/custom-quotes"), onError: (e) => fail(e) });
  const subscribeToPlanMutation = useMutation({ mutationFn: async ({ clientId, planId }: any) => (await apiRequest("POST", "/api/subscriptions", { clientId, planId, startDate: new Date(), isActive: true })).json(), onSuccess: () => { toast({ title: "Abonnement activé" }); invalidate("/api/users", "subscriptions", "/api/dashboard/stats"); setIsSubscriptionDialogOpen(false); }, onError: (e) => fail(e) });
  const updateSubscriptionPlanMutation = useMutation({ mutationFn: async ({ subscriptionId, newPlanId }: any) => (await apiRequest("PATCH", `/api/subscriptions/${subscriptionId}`, { planId: newPlanId })).json(), onSuccess: () => { toast({ title: "Plan mis à jour" }); invalidate("/api/users", "subscriptions", "/api/dashboard/stats"); setIsSubscriptionDialogOpen(false); }, onError: (e) => fail(e) });

  const handleStatusChange = (orderId: number, status: string) => { if (status === "to_sort") { setSortingOrderId(orderId); setIsSortingDialogOpen(true); } else updateOrderStatusMutation.mutate({ orderId, status }); };
  const handleSortingConfirm = () => { if (!sortingData.itemCount || !sortingOrderId) { toast({ title: "Champ requis", variant: "destructive" }); return; } updateOrderStatusMutation.mutate({ orderId: sortingOrderId, status: "to_wash", itemCount: parseInt(sortingData.itemCount), linensDetails: sortingData.linensDetails || undefined }); };
  const openRegistrationConfirm = (u: any, action: "approve" | "refuse") => { setSelectedRegistrationUser(u); setRegistrationAction(action); setIsRegistrationConfirmOpen(true); };
  const handleRegistrationAction = async () => { if (!selectedRegistrationUser || !registrationAction) return; setIsRegistrationProcessing(true); try { await toggleUserStatusMutation.mutateAsync({ id: selectedRegistrationUser.id, status: registrationAction === "approve" ? "approved" : "refused" }); setIsRegistrationConfirmOpen(false); setSelectedRegistrationUser(null); setRegistrationAction(null); } finally { setIsRegistrationProcessing(false); } };

  if (user?.role !== "admin") return <div className="p-6 text-center text-sm text-slate-500">Accès réservé aux administrateurs.</div>;

  const pendingRegistrations = safeUsers.filter((u: any) => u.role === "client" && u.status === "pending");

  const filteredRegistrations = useMemo(() => {
    if (!registrationSearch.trim()) return pendingRegistrations;
    const q = registrationSearch.toLowerCase();
    return pendingRegistrations.filter((u: any) =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  }, [pendingRegistrations, registrationSearch]);

  const lastIdx = registrationsCurrentPage * registrationsPerPage;
  const currentRegistrations = filteredRegistrations.slice(lastIdx - registrationsPerPage, lastIdx);
  const totalRegistrationPages = Math.ceil(filteredRegistrations.length / registrationsPerPage);

  const nav: { group: string; items: { value: string; label: string; badge?: number; tone?: Tone }[] }[] = [
    { group: "Pilotage", items: [{ value: "dashboard", label: "Tableau de bord" }, { value: "volume-analysis", label: "Analyses" }]},
    { group: "Opérations", items: [{ value: "orders", label: "Commandes", badge: lateOrders, tone: "red" }, { value: "deliveries", label: "Livraisons" }, { value: "drivers", label: "Livreurs" }]},
    { group: "Clientèle", items: [{ value: "clients", label: "Clients" }, { value: "quotes", label: "Site client", badge: pendingClients + pendingQuotes, tone: "amber" }, { value: "plans", label: "Plans" }]},
    { group: "Gestion", items: [{ value: "invoices", label: "Factures", badge: overdueInvoices, tone: "red" }, { value: "expenses", label: "Dépenses" }, { value: "agents", label: "Utilisateurs" }]},
  ];
  const current = nav.flatMap((g) => g.items).find((i) => i.value === activeTab);
  const currentGroup = nav.find((g) => g.items.some((i) => i.value === activeTab))?.group;
  const go = (v: string) => { setActiveTab(v); setMenuOpen(false); };

  const Sidebar = (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-none bg-gradient-to-b from-[#0B676E] to-[#09565C] p-5 text-white shadow-[8px_0_28px_-18px_rgba(11,103,110,0.45)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/5" />
      <div className="relative mb-6 flex flex-col items-center text-center">
        <div className="relative mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold ring-4 ring-white/10">
          {user?.username?.charAt(0).toUpperCase() || "A"}
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0B676E] bg-emerald-400" />
        </div>
        <p className="truncate text-[14px] font-semibold">{user?.username || "Administrateur"}</p>
        <p className="text-[11px] text-white/60">administrateur</p>
      </div>
      <div className="relative mb-4 h-px bg-white/10" />
      <nav className="relative flex-1 space-y-5 overflow-y-auto pr-1">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = activeTab === it.value;
                return (
                  <li key={it.value}>
                    <button onClick={() => go(it.value)} className={cn("group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150", active ? "bg-white/15 text-white shadow-[inset_3px_0_0_0_#ffffff]" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                      <span className="flex-1 text-left">{it.label}</span>
                      {!!it.badge && it.badge > 0 && (<span className={cn("inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold", it.tone === "red" ? "bg-red-100/20 text-red-100" : it.tone === "amber" ? "bg-amber-100/20 text-amber-100" : "bg-white/20 text-white")}>{it.badge}</span>)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="relative mt-4 h-px bg-white/10" />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-center gap-2 rounded-xl bg-white/10 text-white hover:bg-white/20" disabled={logoutMutation.isPending}>
            {logoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span className="text-[12px] font-medium">Se déconnecter</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className={ui.dialog}>
          <AlertDialogHeader><AlertDialogTitle>Se déconnecter ?</AlertDialogTitle><AlertDialogDescription>Confirmer la déconnexion.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className={ui.btn}>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => logoutMutation.mutate()} className={ui.btnPrimary}>Confirmer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const quoteSubTabs = [
    { v: "registrations" as const, label: "Inscriptions", count: pendingRegistrations.length, tone: "amber" as Tone },
    { v: "custom-quotes" as const, label: "Devis", count: safeCustomQuotes.length, tone: "purple" as Tone },
    { v: "private-plans" as const, label: "Plans privés", count: customPlans.length, tone: "brand" as Tone },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen font-sans text-slate-900 antialiased" style={{ backgroundColor: SURFACE }}>
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{Sidebar}</aside>
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[88vw]">{Sidebar}</aside>
          </div>
        )}

        <div>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-[0_2px_12px_-8px_rgba(15,23,42,0.22)]">
            <div className="flex min-h-[68px] items-center gap-3 px-4 md:px-8 lg:pl-[296px]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-[#0B676E]/40 hover:bg-[#0B676E]/5 lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Ouvrir le menu"
              >
                Menu
              </Button>
              <div className="min-w-0 shrink-0">
                <p className="text-sm font-bold tracking-tight text-slate-900">SV Pressing</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B676E]">Espace administration</p>
              </div>
              <div className="hidden h-8 w-px bg-slate-200 md:block" />
              <nav aria-label="Fil d’Ariane" className="hidden min-w-0 items-center gap-2 text-xs md:flex">
                <span className="text-slate-400">{currentGroup || "Pilotage"}</span>
                <span className="text-slate-300">/</span>
                <span className="truncate rounded-md bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-800">{current?.label || "Tableau de bord"}</span>
              </nav>
              <div className="flex-1" />
              <div className="relative hidden w-52 xl:block">
                <label htmlFor="admin-global-search" className="sr-only">Rechercher</label>
                <input id="admin-global-search" type="search" placeholder="Rechercher…" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-[#0B676E] focus:bg-white focus:ring-2 focus:ring-[#0B676E]/15" />
              </div>
              <span className="hidden rounded-full border border-[#0B676E]/15 bg-[#0B676E]/5 px-3 py-1.5 text-[10px] font-semibold text-[#0B676E] md:inline-flex">
                Système opérationnel
              </span>
              <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
                <DialogTrigger asChild>
                  <Button className={cn(ui.btnPrimary, "h-8 text-[12.5px]")}>
                    <span className="hidden sm:inline">Nouvelle commande</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(ui.dialog, "max-h-[90vh] max-w-2xl overflow-y-auto")}>
                  <DialogHeader><DialogTitle>Nouvelle commande</DialogTitle><DialogDescription>Créez une commande pour un client existant.</DialogDescription></DialogHeader>
                  <Form {...newOrderForm}>
                    <form onSubmit={newOrderForm.handleSubmit((d) => createOrderMutation.mutate(d))} className="space-y-4 py-2">
                      <FormField control={newOrderForm.control} name="clientId" render={({ field }) => (
                        <FormItem><FormLabel>Client</FormLabel><Popover open={newOrderClientOpen} onOpenChange={setNewOrderClientOpen}><PopoverTrigger asChild><FormControl><Button type="button" variant="outline" className={cn(ui.input, "w-full justify-between font-normal")}>{clients.find((c: any) => c.id === field.value)?.fullName || "Sélectionner un client"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-[400px] max-w-[90vw] p-0"><Command><CommandInput placeholder="Rechercher…" /><CommandList><CommandEmpty>Aucun</CommandEmpty><CommandGroup>{clients.map((c: any) => <CommandItem key={c.id} value={c.fullName} onSelect={() => { field.onChange(c.id); setNewOrderClientOpen(false); }}><div><p className="font-medium">{c.fullName}</p><p className="text-xs text-slate-500">{c.email}</p></div></CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField control={newOrderForm.control} name="pickupDate" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" className={ui.input} value={field.value ? format(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(new Date(e.target.value))} /></FormControl></FormItem>)} />
                        <FormField control={newOrderForm.control} name="itemCount" render={({ field }) => (<FormItem><FormLabel>Pièces</FormLabel><FormControl><Input type="number" className={ui.input} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={newOrderForm.control} name="specialInstructions" render={({ field }) => (<FormItem><FormLabel>Instructions</FormLabel><FormControl><Textarea className={cn(ui.input, "h-auto min-h-[80px]")} {...field} /></FormControl></FormItem>)} />
                      <DialogFooter><Button type="button" variant="outline" className={ui.btn} onClick={() => setIsNewOrderOpen(false)}>Annuler</Button><Button type="submit" disabled={createOrderMutation.isPending} className={ui.btnPrimary}>{createOrderMutation.isPending ? "Création…" : "Créer"}</Button></DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 md:px-8 lg:pl-[296px]">
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900">{current?.label || "Tableau de bord"}</h1>
                <p className="mt-0.5 hidden text-[11px] capitalize text-slate-500 sm:block">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Connecté : <span className="font-semibold text-slate-700">{user?.username || "Administrateur"}</span></span>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-8 lg:pl-[296px]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="dashboard" className="mt-0"><ExecutiveDashboardBI /></TabsContent>
              <TabsContent value="volume-analysis" className="mt-0"><VolumeAnalysisTab orders={safeOrders} users={safeUsers} subscriptions={safeSubs} subscriptionPlans={safePlans} /></TabsContent>
              <TabsContent value="orders" className="mt-0"><OrdersTab orders={safeOrders} users={safeUsers} deliveries={safeDeliveries} handleStatusChange={handleStatusChange} setSelectedOrder={setSelectedOrder} setIsOrderDetailsOpen={setIsOrderDetailsOpen} /></TabsContent>
              <TabsContent value="deliveries" className="mt-0"><DeliveriesAndPickupsTab orders={safeOrders} users={safeUsers} deliveries={safeDeliveries} queryClient={queryClient} /></TabsContent>
              <TabsContent value="clients" className="mt-0"><ClientsTab users={safeUsers} orders={safeOrders} subscriptions={safeSubs} subscriptionPlans={safePlans} externalNewClientData={{}} externalOpenNewClient={false} onConsumeExternalOpen={() => {}} /></TabsContent>
              <TabsContent value="agents" className="mt-0"><AgentsTab users={safeUsers} /></TabsContent>
              <TabsContent value="plans" className="mt-0"><PlansTab subscriptionPlans={safePlans} subscriptions={safeSubs} toast={toast} queryClient={queryClient} /></TabsContent>
              <TabsContent value="drivers" className="mt-0"><DriversTab users={safeUsers} deliveries={safeDeliveries} orders={safeOrders} queryClient={queryClient} toast={toast} toggleUserStatusMutation={toggleUserStatusMutation} /></TabsContent>
              <TabsContent value="expenses" className="mt-0"><ExpensesTab /></TabsContent>
              <TabsContent value="invoices" className="mt-0"><InvoicesTab users={safeUsers} subscriptions={safeSubs} subscriptionPlans={safePlans} /></TabsContent>

              <TabsContent value="quotes" className="mt-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {quoteSubTabs.map((t) => {
                      return (
                        <button key={t.v} onClick={() => setQuoteTab(t.v)} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors", quoteTab === t.v ? "bg-[#0B676E] text-white" : "text-slate-600 hover:bg-slate-50")}>
                          {t.label}
                          {t.count > 0 && <span className={cn("rounded-full px-1.5 text-[10.5px] font-semibold", quoteTab === t.v ? "bg-white/25 text-white" : toneClass[t.tone])}>{t.count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {quoteTab === "registrations" && (
                  <Panel
                    title="Inscriptions en attente"
                    subtitle={`${filteredRegistrations.length} demande(s) à traiter`}
                    bodyClass="p-0"
                    action={
                      <div className="relative w-full sm:w-64">
                        <Input placeholder="Rechercher…" value={registrationSearch} onChange={(e) => { setRegistrationSearch(e.target.value); setRegistrationsCurrentPage(1); }} className={cn(ui.input, "h-9 text-[12.5px]")} />
                      </div>
                    }
                  >
                    {filteredRegistrations.length === 0 ? (
                      <Empty
                        title={registrationSearch ? "Aucun résultat" : "Aucune inscription en attente"}
                        hint={registrationSearch ? "Essayez un autre terme de recherche" : "Toutes les inscriptions ont été traitées"}
                        action={<Button variant="outline" size="sm" onClick={() => setRegistrationsCurrentPage(1)} className={cn(ui.btn, "gap-1.5")}>Actualiser</Button>}
                      />
                    ) : (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
                          {currentRegistrations.map((u: any) => {
                            const plan = safePlans.find((p: any) => p.id === u.selectedPlanId);
                            return (
                              <RegistrationCard
                                key={u.id}
                                user={u}
                                plan={plan}
                                onViewProfile={() => { setSelectedClient(u); setIsClientDetailsOpen(true); }}
                                onReject={() => openRegistrationConfirm(u, "refuse")}
                                onApprove={() => openRegistrationConfirm(u, "approve")}
                                isProcessing={isRegistrationProcessing && selectedRegistrationUser?.id === u.id}
                              />
                            );
                          })}
                        </div>
                        {filteredRegistrations.length > registrationsPerPage && (
                          <div className="border-t border-slate-100 px-5 py-3">
                            <PaginationControls currentPage={registrationsCurrentPage} totalPages={totalRegistrationPages} totalItems={filteredRegistrations.length} itemsPerPage={registrationsPerPage} onPageChange={setRegistrationsCurrentPage} onItemsPerPageChange={(v) => { setRegistrationsPerPage(v); setRegistrationsCurrentPage(1); }} />
                          </div>
                        )}
                      </>
                    )}
                  </Panel>
                )}

                {quoteTab === "custom-quotes" && (
                  <Panel title="Devis personnalisés" subtitle="Traitez les demandes de plans sur mesure" bodyClass="p-0">
                    <CustomQuotesSection customQuotes={safeCustomQuotes} updateQuoteStatusMutation={updateQuoteStatusMutation} setNewPlanData={() => {}} setIsNewPlanOpen={() => {}} setActiveTab={setActiveTab} toast={toast} safeFormatDate={formatDate} />
                  </Panel>
                )}

                {quoteTab === "private-plans" && (
                  <Panel title="Plans privés" subtitle="Plans sur mesure créés pour vos clients" action={<Pill tone="brand">{customPlans.length} plan(s)</Pill>}>
                    {customPlans.length === 0 ? (
                      <Empty title="Aucun plan privé" hint="Créez un plan privé depuis un devis personnalisé" action={<Button size="sm" className={cn(ui.btnPrimary, "gap-1.5")} onClick={() => setQuoteTab("custom-quotes")}>Voir les devis</Button>} />
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {customPlans.map((p: any) => <PrivatePlanCard key={p.id} plan={p} onEdit={() => setActiveTab("plans")} />)}
                      </div>
                    )}
                  </Panel>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>

        <AlertDialog open={isRegistrationConfirmOpen} onOpenChange={setIsRegistrationConfirmOpen}>
          <AlertDialogContent className={cn(ui.dialog, "max-w-md")}>
            <AlertDialogHeader>
              <AlertDialogTitle>{registrationAction === "approve" ? "Approuver" : "Refuser"} l'inscription</AlertDialogTitle>
              <AlertDialogDescription>Confirmer pour <strong>{selectedRegistrationUser?.fullName}</strong>.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRegistrationProcessing} className={ui.btn}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegistrationAction} disabled={isRegistrationProcessing} className={cn("min-w-[110px] rounded-xl text-white", registrationAction === "approve" ? "bg-[#0B676E] hover:bg-[#09565C]" : "bg-red-600 hover:bg-red-700")}>
                {isRegistrationProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isSortingDialogOpen} onOpenChange={setIsSortingDialogOpen}>
          <DialogContent className={ui.dialog}>
            <DialogHeader><DialogTitle>Triage</DialogTitle><DialogDescription>Saisissez le nombre de vêtements.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre de vêtements</Label><Input type="number" className={ui.input} value={sortingData.itemCount} onChange={(e) => setSortingData({ ...sortingData, itemCount: e.target.value })} /></div>
              <div><Label>Détails</Label><Input className={ui.input} value={sortingData.linensDetails} onChange={(e) => setSortingData({ ...sortingData, linensDetails: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="outline" className={ui.btn} onClick={() => setIsSortingDialogOpen(false)}>Annuler</Button><Button className={ui.btnPrimary} onClick={handleSortingConfirm}>Confirmer</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className={ui.dialog}>
            <DialogHeader><DialogTitle>Commande #{selectedOrder?.id}</DialogTitle></DialogHeader>
            {selectedOrder && <dl className={cn(ui.well, "grid grid-cols-2 gap-4 p-4")}><div><dt className="text-xs text-slate-500">Client</dt><dd className="mt-0.5 text-sm font-medium">{safeUsers.find((u: any) => u.id === selectedOrder.clientId)?.fullName || "-"}</dd></div><div><dt className="text-xs text-slate-500">Statut</dt><dd className="mt-0.5"><Pill tone="brand">{getStatusLabel(selectedOrder.status)}</Pill></dd></div><div><dt className="text-xs text-slate-500">Créée le</dt><dd className="mt-0.5 text-sm">{formatDateTime(selectedOrder.createdAt)}</dd></div><div><dt className="text-xs text-slate-500">Pièces</dt><dd className="mt-0.5 text-sm">{selectedOrder.itemCount || "-"}</dd></div></dl>}
            <DialogFooter><Button variant="outline" className={ui.btn} onClick={() => setIsOrderDetailsOpen(false)}>Fermer</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isClientDetailsOpen} onOpenChange={setIsClientDetailsOpen}>
          <DialogContent className={ui.dialog}>
            <DialogHeader><DialogTitle>Client - {selectedClient?.fullName}</DialogTitle></DialogHeader>
            {selectedClient && <><dl className={cn(ui.well, "grid grid-cols-2 gap-4 p-4")}><div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-0.5 break-all text-sm">{selectedClient.email}</dd></div><div><dt className="text-xs text-slate-500">Téléphone</dt><dd className="mt-0.5 text-sm">{selectedClient.phone || "-"}</dd></div><div><dt className="text-xs text-slate-500">Adresse</dt><dd className="mt-0.5 text-sm">{selectedClient.address || "-"}</dd></div><div><dt className="text-xs text-slate-500">Inscrit</dt><dd className="mt-0.5 text-sm">{formatDate(selectedClient.createdAt)}</dd></div></dl><div className="flex gap-2"><Button variant="outline" className={cn(ui.btn, "flex-1")} onClick={() => { setEditClientData(selectedClient); setIsClientDetailsOpen(false); setIsEditClientOpen(true); }}>Modifier</Button><Button variant="outline" className={cn(ui.btn, "flex-1")} onClick={() => { setSelectedClientForSub(selectedClient); setIsClientDetailsOpen(false); setIsSubscriptionDialogOpen(true); }}>Abo</Button></div></>}
            <DialogFooter><Button variant="outline" className={ui.btn} onClick={() => setIsClientDetailsOpen(false)}>Fermer</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
          <DialogContent className={ui.dialog}>
            <DialogHeader><DialogTitle>Modifier le client</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); editClientMutation.mutate(editClientData); }} className="space-y-4">
              {([["fullName", "Nom"], ["email", "Email"], ["phone", "Téléphone"], ["address", "Adresse"]] as const).map(([k, label]) => (<div key={k}><Label>{label}</Label><Input className={ui.input} value={editClientData[k] || ""} onChange={(e) => setEditClientData({ ...editClientData, [k]: e.target.value })} /></div>))}
              <DialogFooter><Button type="button" variant="outline" className={ui.btn} onClick={() => setIsEditClientOpen(false)}>Annuler</Button><Button type="submit" className={ui.btnPrimary} disabled={editClientMutation.isPending}>Enregistrer</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-2xl")}>
            <DialogHeader><DialogTitle>Abonnement de {selectedClientForSub?.fullName}</DialogTitle></DialogHeader>
            {(() => {
              const currentSub = safeSubs.find((s: any) => s.clientId === selectedClientForSub?.id && s.isActive);
              const currentPlan = currentSub && safePlans.find((p: any) => p.id === currentSub.planId);
              return (<div className="space-y-5"><div className="rounded-xl border border-[#0B676E]/20 bg-[#0B676E]/5 p-4"><p className="mb-2 text-xs font-medium text-slate-500">Abonnement actuel</p>{currentPlan ? <div className="flex justify-between"><div><p className="font-semibold">{currentPlan.name}</p><p className="text-xs text-slate-500">Depuis {formatDate(currentSub.startDate)}</p></div><p className="font-semibold text-[#0B676E]">{currentPlan.pricePerMonth} Ar</p></div> : <p className="text-sm text-slate-500">Aucun</p>}</div><div><p className="mb-2 text-sm font-medium">Changer de plan</p><div className="grid max-h-64 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">{safePlans.map((p: any) => { const isCurrent = p.id === currentPlan?.id; return <button key={p.id} type="button" disabled={isCurrent} onClick={() => currentSub ? updateSubscriptionPlanMutation.mutate({ subscriptionId: currentSub.id, newPlanId: p.id }) : subscribeToPlanMutation.mutate({ clientId: selectedClientForSub.id, planId: p.id })} className={cn("rounded-xl border p-3 text-left", isCurrent ? "border-[#0B676E] bg-[#0B676E]/5" : "border-slate-200 hover:border-[#0B676E]/50")}><div className="flex justify-between gap-2"><p className="font-medium">{p.name}</p><p className="font-semibold text-[#0B676E]">{p.pricePerMonth} Ar</p></div><p className="mt-1 text-xs text-slate-500">{p.itemsIncluded} art. · {p.pickupsPerWeek} ramassages</p>{isCurrent && <Pill tone="brand" className="mt-2">Actuel</Pill>}</button>; })}</div></div></div>);
            })()}
            <DialogFooter><Button variant="outline" className={ui.btn} onClick={() => setIsSubscriptionDialogOpen(false)}>Fermer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}