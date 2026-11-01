// client/src/pages/InvoicesTab.tsx
// Interface Factures — flat, pro, 100% textuelle (aucune icône).
// Logique métier 100 % conservée.
import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { format, parseISO, subMonths, differenceInDays, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { InvoiceMatrix } from "./InvoiceMatrix";

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  input: "h-9 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/15",
  btn: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-lg bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  btnDanger: "h-9 rounded-lg border border-red-200 bg-white font-medium text-red-600 hover:bg-red-50",
  dialog: "rounded-xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
  well: "rounded-lg border border-slate-200 bg-slate-50/70",
};

type Tone = "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";
const toneClass: Record<Tone, string> = {
  brand: "bg-[#0B676E]/10 text-[#0B676E]",
  green: "bg-[#0B676E]/10 text-[#0B676E]",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-600",
};

const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", toneClass[tone], className)}>{children}</span>
);

const MiniKPI: React.FC<{
  title: string; value: string | number; subtitle?: string;
  tone?: Tone; progress?: number; progressLabel?: string;
  trend?: { dir: "up" | "down"; label: string } | null;
  onClick?: () => void;
  badge?: number;
}> = ({ title, value, subtitle, tone = "brand", progress, progressLabel, trend, onClick, badge }) => {
  const isZero = value === 0 || value === "0" || value === "0 Ar";
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_4px_-1px_rgba(15,23,42,0.06)] p-4 relative",
        onClick && "cursor-pointer hover:shadow-[0_3px_10px_-3px_rgba(15,23,42,0.1)] hover:border-slate-300 transition-all"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {badge !== undefined && badge > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <p className={cn("mt-1.5 text-[24px] leading-none font-bold tabular-nums", isZero ? "text-slate-400" : "text-slate-900")}>{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        {trend && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10.5px] font-semibold", trend.dir === "up" ? "bg-[#0B676E]/10 text-[#0B676E]" : "bg-red-50 text-red-600")}>
            {trend.label}
          </span>
        )}
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {progress !== undefined && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[10.5px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-semibold text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                tone === "brand" ? "bg-[#0B676E]" :
                tone === "red" ? "bg-red-500" :
                tone === "amber" ? "bg-amber-500" :
                tone === "blue" ? "bg-blue-500" :
                tone === "purple" ? "bg-violet-500" : "bg-slate-400"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   INTERFACES
============================================================ */
interface User { id: number; fullName: string; email: string; phone: string; role: string; createdAt: string; isActive: boolean; }
interface SubscriptionPlan { id: number; name: string; pricePerMonth: string; description?: string; }
interface Subscription { id: number; clientId: number; planId: number; isActive: boolean; startDate: string; endDate?: string; }
interface NewContractData { clientId: number; subscriptionId?: number; title: string; startDate?: Date; endDate?: Date; status: "draft"; isAutoRenew: boolean; notes?: string; }
interface Invoice {
  id: number; invoiceNumber: string; clientId: number; subscriptionId?: number;
  amount: string; totalAmount: string; currency: string;
  issueDate: string; dueDate: string; status: string;
  paymentMethod?: "cash" | "mobile_money" | null;
  description?: string | null; createdAt: string; paidDate?: string | null;
  billingPeriodStart?: string | null; billingPeriodEnd?: string | null;
  clientName?: string; clientEmail?: string; clientPhone?: string; planName?: string;
}
interface EditInvoiceData {
  id?: number; clientId: number; invoiceNumber: string;
  amount: number; totalAmount: number; currency: string; status: string;
  issueDate: Date; dueDate: Date; paidDate?: Date | null;
  paymentMethod?: "cash" | "mobile_money" | null;
  description?: string | null;
  billingPeriodStart?: Date | null; billingPeriodEnd?: Date | null;
}

/* ============================================================
   HELPERS
============================================================ */
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "0 Ar";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return "0 Ar";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "MGA",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num).replace("MGA", "Ar");
};

const safeFormat = (date: string | Date | null | undefined, fmt: string, opts?: any): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  try { return format(d, fmt, opts); } catch { return "—"; }
};

const safeParseISO = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  try {
    const d = parseISO(date);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};

const invoiceAmount = (inv: Invoice | null | undefined): number => {
  if (!inv) return 0;
  const n = parseFloat(inv.totalAmount ?? "") || parseFloat(inv.amount ?? "") || 0;
  return Number.isFinite(n) ? n : 0;
};

const computeInvoiceStatus = (invoice: Invoice): string => {
  if (!invoice) return "pending";
  if (invoice.status === "paid" || invoice.status === "cancelled") return invoice.status;
  const due = safeParseISO(invoice.dueDate);
  if (!due) return invoice.status;
  return isAfter(new Date(), due) ? "overdue" : invoice.status;
};

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode; }) => (
  <div className="text-center py-12 px-4">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0B676E]/8 mb-3">
      <span className="text-[#0B676E] text-[13px] font-semibold">Vide</span>
    </div>
    <h3 className="text-[13.5px] font-semibold text-slate-800 mb-1">{title}</h3>
    <p className="text-[11.5px] text-slate-500 max-w-md mx-auto mb-4">{description}</p>
    {action}
  </div>
);

const PaymentMethodBadge = ({ method }: { method: "cash" | "mobile_money" | null | undefined }) => {
  if (!method) return null;
  return <Pill tone="slate">{method === "cash" ? "Espèces" : "Mobile Money"}</Pill>;
};

const StatusBadge = ({ status, paymentMethod }: { status: string; paymentMethod?: "cash" | "mobile_money" | null }) => {
  const config = {
    paid: { label: "Payé", tone: "brand" as Tone },
    pending: { label: "En attente", tone: "amber" as Tone },
    overdue: { label: "En retard", tone: "red" as Tone },
    cancelled: { label: "Annulé", tone: "slate" as Tone },
  };
  const c = config[status as keyof typeof config] || config.pending;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Pill tone={c.tone}>{c.label}</Pill>
      {status === "paid" && paymentMethod && <PaymentMethodBadge method={paymentMethod} />}
    </div>
  );
};

const PaginationComponent = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: {
  currentPage: number; totalPages: number; onPageChange: (page: number) => void;
  totalItems: number; itemsPerPage: number;
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 mt-4 border-t border-slate-100">
      <div className="text-[11.5px] text-slate-500">
        Affichage de <span className="font-medium text-slate-700">{startItem}</span> à <span className="font-medium text-slate-700">{endItem}</span> sur <span className="font-medium text-slate-700">{totalItems}</span> facture(s)
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={cn(ui.btn, "h-8 px-2 text-[11px]")}>Préc.</Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) pageNum = i + 1;
          else if (currentPage <= 3) pageNum = i + 1;
          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = currentPage - 2 + i;
          return (
            <Button key={pageNum} size="sm" onClick={() => onPageChange(pageNum)}
                    className={cn("w-8 h-8 text-[11.5px]", currentPage === pageNum ? ui.btnPrimary : ui.btn)}>{pageNum}</Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className={cn(ui.btn, "h-8 px-2 text-[11px]")}>Suiv.</Button>
      </div>
    </div>
  );
};

const FilterSection = ({
  searchQuery, setSearchQuery, invoiceFilter, setInvoiceFilter,
  invoiceMonthFilter, setInvoiceMonthFilter, calendarMonth, setCalendarMonth,
  onReset, filteredCount, totalCount, showInvoiceCalendar, setShowInvoiceCalendar,
}: any) => {
  const selectedMonthLabel = invoiceMonthFilter !== "all"
    ? (() => { const [year, month] = invoiceMonthFilter.split("-").map(Number); return year && month ? safeFormat(new Date(year, month - 1, 1), "MMMM yyyy", { locale: fr }) : ""; })()
    : "Toute période";

  const handleCalendarMonthChange = (date: Date) => { setCalendarMonth(date); setInvoiceMonthFilter(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`); };
  const handleCalendarSelect = (date: Date | undefined) => { if (date) handleCalendarMonthChange(date); };
  const goToCurrentMonth = () => handleCalendarMonthChange(new Date());

  return (
    <div className={ui.card}>
      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
              Filtres <Pill tone="brand">{filteredCount} / {totalCount}</Pill>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              {invoiceMonthFilter === "all" ? "Toute période" : selectedMonthLabel}
              {invoiceFilter !== "all" && ` • ${invoiceFilter === "overdue" ? "En retard" : invoiceFilter === "pending" ? "En attente" : invoiceFilter === "paid" ? "Payé" : "Annulé"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setInvoiceMonthFilter("all")} className={cn(ui.btn, invoiceMonthFilter === "all" && "ring-2 ring-[#0B676E]/30")}>Toute période</Button>
            <Button variant="ghost" size="sm" onClick={onReset} className={cn(ui.btn, "text-slate-500 hover:text-red-600")}>Réinitialiser</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Input placeholder="Rechercher par n° facture, client…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(ui.input, "text-[12.5px]")} />
          <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <SelectTrigger className={ui.input}><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 bg-slate-50/70">
            <span className="text-[12.5px] font-medium text-slate-700 capitalize truncate">{selectedMonthLabel}</span>
          </div>
        </div>
        <div>
          {!showInvoiceCalendar ? (
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowInvoiceCalendar(true)} className={cn(ui.btn, "h-8 text-[11.5px]")}>Afficher le calendrier</Button>
              <span className="text-[11.5px] text-slate-500 capitalize truncate">{selectedMonthLabel}</span>
            </div>
          ) : (
            <div className="w-fit max-w-full rounded-lg bg-slate-50 border border-slate-200 p-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Période</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvoiceCalendar(false)} aria-label="Fermer le calendrier" className="h-6 px-2 rounded-md text-[10px] text-slate-500 hover:text-red-600 hover:bg-red-50">Fermer</Button>
              </div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setInvoiceMonthFilter("all")} className={cn(ui.btn, "h-6 px-2 text-[10px]")}>Toutes</Button>
                <Button type="button" variant="ghost" size="sm" onClick={goToCurrentMonth} className={cn(ui.btn, "h-6 px-2 text-[10px]")}>Aujourd'hui</Button>
              </div>
              <Calendar mode="single" month={calendarMonth} onMonthChange={handleCalendarMonthChange}
                        onSelect={handleCalendarSelect} locale={fr}
                        className="w-[220px] p-0 m-0 bg-transparent text-[10px]"
                        classNames={{
                          months: "flex flex-col", month: "space-y-0",
                          caption: "flex justify-center pt-0 pb-1 relative items-center",
                          caption_label: "text-[11px] font-semibold capitalize",
                          nav: "flex items-center gap-0",
                          nav_button: "h-5 w-5 p-0 rounded-md text-slate-600 hover:bg-slate-200",
                          table: "w-full border-collapse m-0",
                          head_row: "flex w-full mb-0",
                          head_cell: "w-[28px] p-0 text-[8px] leading-3 font-medium text-slate-400 text-center capitalize",
                          row: "flex w-full mt-0",
                          cell: "w-[28px] h-[24px] p-0 text-center relative",
                          day: "h-[22px] w-[22px] p-0 mx-auto rounded-md text-[9px] leading-none font-normal",
                          day_selected: "bg-[#0B676E] text-white hover:bg-[#0B676E] focus:bg-[#0B676E]",
                          day_today: "bg-[#0B676E]/10 text-[#0B676E] font-bold",
                          day_outside: "text-slate-300 opacity-40",
                          day_disabled: "text-slate-300 opacity-30",
                        }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   CONTRACT DETAIL VIEW
============================================================ */
const ContractDetailView = ({
  client, subscriptions, subscriptionPlans, invoices,
  onDownloadContract, onViewInvoiceDetails, onMarkAsPaid,
  onDownloadInvoicePdf, formatCurrency: fc,
}: any) => {
  const clientSubscriptions = (subscriptions || []).filter((s: any) => s.clientId === client.id);
  const clientInvoices = (invoices || []).filter((inv: any) => inv.clientId === client.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const paidInvoices = clientInvoices.filter((inv: any) => inv.status === "paid");
  const pendingInvoices = clientInvoices.filter((inv: any) => inv.status === "pending");
  const overdueInvoices = clientInvoices.filter((inv: any) => inv.status === "overdue");
  const totalPaid = paidInvoices.reduce((s: number, i: any) => s + invoiceAmount(i), 0);
  const totalPending = pendingInvoices.reduce((s: number, i: any) => s + invoiceAmount(i), 0);
  const totalOverdue = overdueInvoices.reduce((s: number, i: any) => s + invoiceAmount(i), 0);
  const totalAll = totalPaid + totalPending + totalOverdue;

  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#0B676E]/10 flex items-center justify-center">
                <span className="text-[#0B676E] text-[18px] font-bold">{client.fullName?.charAt(0) || 'C'}</span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">{client.fullName}</h3>
                <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-slate-500 mt-0.5">
                  <span>{client.email}</span>
                  {client.phone && <span>{client.phone}</span>}
                </div>
              </div>
            </div>
            <Button onClick={() => onDownloadContract(client.id)} className={cn(ui.btnPrimary)}>Télécharger le contrat</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0B676E]/5 border border-[#0B676E]/15">
          <p className="text-[10.5px] font-semibold text-[#0B676E] uppercase tracking-wider">Payé</p>
          <p className="text-[16px] font-bold text-[#0B676E] mt-1 tabular-nums">{fc(totalPaid)}</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">{paidInvoices.length} facture(s)</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/60">
          <p className="text-[10.5px] font-semibold text-amber-700 uppercase tracking-wider">En attente</p>
          <p className="text-[16px] font-bold text-amber-700 mt-1 tabular-nums">{fc(totalPending)}</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">{pendingInvoices.length} facture(s)</p>
        </div>
        <div className="p-3 rounded-lg bg-red-50 border border-red-200/60">
          <p className="text-[10.5px] font-semibold text-red-700 uppercase tracking-wider">En retard</p>
          <p className="text-[16px] font-bold text-red-700 mt-1 tabular-nums">{fc(totalOverdue)}</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">{overdueInvoices.length} facture(s)</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-[10.5px] font-semibold text-slate-600 uppercase tracking-wider">Total</p>
          <p className="text-[16px] font-bold text-slate-900 mt-1 tabular-nums">{fc(totalAll)}</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">{clientInvoices.length} facture(s)</p>
        </div>
      </div>

      {clientSubscriptions.length > 0 && (
        <div className={ui.card}>
          <div className="p-4">
            <h4 className="text-[13px] font-semibold text-slate-800 mb-3">Abonnements actifs</h4>
            <div className="space-y-2">
              {clientSubscriptions.map((sub: any) => {
                const plan = (subscriptionPlans || []).find((p: any) => p.id === sub.planId);
                return (
                  <div key={sub.id} className={cn(ui.well, "flex items-center justify-between p-3")}>
                    <div>
                      <p className="text-[12.5px] font-medium text-slate-900">{plan?.name || "Plan standard"}</p>
                      <p className="text-[11px] text-slate-500">{plan?.pricePerMonth || "0"} Ar/mois</p>
                    </div>
                    <div className="text-right">
                      <Pill tone="brand">Actif</Pill>
                      <p className="text-[10.5px] text-slate-400 mt-1">Depuis le {safeFormat(sub.startDate, "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={ui.card}>
        <div className="p-4">
          <h4 className="text-[13px] font-semibold text-slate-800 mb-1">Historique des factures</h4>
          <p className="text-[11.5px] text-slate-500 mb-3">{clientInvoices.length} facture(s) au total</p>
          {clientInvoices.length === 0 ? (
            <EmptyState title="Aucune facture" description="Aucune facture trouvée pour ce client" />
          ) : (
            <div className="space-y-2">
              {clientInvoices.map((invoice: any) => {
                const isOverdue = invoice.status === "overdue";
                const isPending = invoice.status === "pending";
                return (
                  <div key={invoice.id} className={cn("p-3 rounded-lg border", isOverdue ? "bg-red-50/40 border-red-200" : isPending ? "bg-amber-50/40 border-amber-200" : "bg-slate-50/70 border-slate-200")}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-medium text-[12.5px] text-slate-900">{invoice.invoiceNumber}</span>
                          <StatusBadge status={invoice.status} paymentMethod={invoice.paymentMethod} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span>Émis: {safeFormat(invoice.issueDate, "dd MMM yyyy", { locale: fr })}</span>
                          <span>Échéance: {safeFormat(invoice.dueDate, "dd MMM yyyy", { locale: fr })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[13px] text-slate-900 tabular-nums">{fc(invoiceAmount(invoice))}</p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onViewInvoiceDetails(invoice)} className="h-7 px-2 text-[10.5px] text-slate-500 hover:bg-slate-100">Voir</Button>
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <Button variant="ghost" size="sm" onClick={() => onMarkAsPaid({ id: invoice.id, paymentMethod: "cash" })} className="h-7 px-2 text-[10.5px] text-[#0B676E] hover:bg-[#0B676E]/10">Payer</Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => onDownloadInvoicePdf(invoice.id, invoice.invoiceNumber)} className="h-7 px-2 text-[10.5px] text-slate-500 hover:bg-slate-100">PDF</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
export function InvoicesTab({ users, subscriptions, subscriptionPlans }: {
  users: User[]; subscriptions: Subscription[]; subscriptionPlans: SubscriptionPlan[];
}) {
  const { toast } = useToast();
  const { user } = useAuth();

  const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);
  const safeSubscriptions = useMemo(() => Array.isArray(subscriptions) ? subscriptions : [], [subscriptions]);
  const safePlans = useMemo(() => Array.isArray(subscriptionPlans) ? subscriptionPlans : [], [subscriptionPlans]);

  const [viewMode, setViewMode] = useState<'grid' | 'matrix'>('grid');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [isContractViewOpen, setIsContractViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editInvoiceData, setEditInvoiceData] = useState<EditInvoiceData | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState("all");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showInvoiceCalendar, setShowInvoiceCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(12);

  const [newInvoiceClientOpen, setNewInvoiceClientOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState<any>({});
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const [showContractSuggestions, setShowContractSuggestions] = useState(false);
  const [selectedContractClient, setSelectedContractClient] = useState<User | null>(null);
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [selectedContractSubscription, setSelectedContractSubscription] = useState<Subscription | null>(null);
  const [newContractData, setNewContractData] = useState<NewContractData>({
    clientId: 0, title: "", startDate: undefined, endDate: undefined, status: "draft", isAutoRenew: true,
  });

  const invoicesTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNewInvoiceOpen) {
      const defaultIssueDate = new Date();
      const defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      setNewInvoiceData((prev: any) => ({ ...prev, issueDate: prev.issueDate || defaultIssueDate, dueDate: prev.dueDate || defaultDueDate }));
    }
  }, [isNewInvoiceOpen, invoiceMonthFilter]);

  const { data: invoices = [], isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/invoices"); const data = await res.json(); return Array.isArray(data) ? data : []; },
  });

  useEffect(() => { setCurrentPage(1); }, [invoiceFilter, invoiceMonthFilter, searchQuery]);

  const rawInvoices = useMemo(() => {
    const arr = Array.isArray(invoices) ? invoices : [];
    return arr.map(inv => ({ ...inv, status: computeInvoiceStatus(inv) }));
  }, [invoices]);

  const now = new Date();
  const currentMonthRevenue = rawInvoices.filter(inv => {
    if (inv.status !== "paid" || !inv.paidDate) return false;
    const d = new Date(inv.paidDate);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + invoiceAmount(i), 0);
  const unpaidInvoices = rawInvoices.filter(inv => inv.status === "pending" || inv.status === "overdue");
  const unpaidCount = unpaidInvoices.length;
  const unpaidAmount = unpaidInvoices.reduce((s, i) => s + invoiceAmount(i), 0);
  const overdueInvoices = rawInvoices.filter(inv => inv.status === "overdue");
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((s, i) => s + invoiceAmount(i), 0);
  const invoicesIssuedThisMonth = rawInvoices.filter(inv => {
    const src = inv.issueDate || inv.createdAt;
    if (!src) return false;
    const d = new Date(src);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const paidInvoicesThisMonth = invoicesIssuedThisMonth.filter(inv => inv.status === "paid");
  const paymentRate = invoicesIssuedThisMonth.length > 0 ? Math.round((paidInvoicesThisMonth.length / invoicesIssuedThisMonth.length) * 100) : 0;
  const soonDueInvoices = rawInvoices.filter(inv => {
    if (inv.status !== "pending") return false;
    const d = safeParseISO(inv.dueDate);
    if (!d) return false;
    const days = differenceInDays(d, now);
    return days >= 0 && days <= 3;
  });
  const soonDueCount = soonDueInvoices.length;
  const soonDueAmount = soonDueInvoices.reduce((s, i) => s + invoiceAmount(i), 0);

  const lastMonth = subMonths(now, 1);
  const lastMonthRevenue = rawInvoices.filter(inv => {
    if (inv.status !== "paid" || !inv.paidDate) return false;
    const d = new Date(inv.paidDate);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  }).reduce((s, i) => s + invoiceAmount(i), 0);
  const revenueTrend = currentMonthRevenue > lastMonthRevenue ? "up" : currentMonthRevenue < lastMonthRevenue ? "down" : "neutral";

  const contractActiveClients = useMemo(() => {
    const activeSubIds = new Set(safeSubscriptions.filter(s => s.isActive).map(s => s.clientId));
    return safeUsers.filter(u => u.role === "client" && activeSubIds.has(u.id));
  }, [safeUsers, safeSubscriptions]);

  const filteredContractClients = useMemo(() => {
    if (!contractSearchQuery.trim()) return [];
    const q = contractSearchQuery.toLowerCase();
    return contractActiveClients.filter(c => c.fullName?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q)));
  }, [contractActiveClients, contractSearchQuery]);

  const filteredContractSubscriptions = useMemo(() => {
    if (selectedContractClient) return safeSubscriptions.filter(s => s.isActive && s.clientId === selectedContractClient.id);
    return safeSubscriptions.filter(s => s.isActive);
  }, [safeSubscriptions, selectedContractClient]);

  const contractGlobalStats = useMemo(() => {
    const activeSubs = safeSubscriptions.filter(s => s.isActive);
    const allInvoices = rawInvoices.filter(inv => activeSubs.some(sub => sub.clientId === inv.clientId));
    return {
      totalActive: activeSubs.length,
      monthlyRevenue: activeSubs.reduce((s, sub) => { const plan = safePlans.find(p => p.id === sub.planId); return s + (plan ? parseFloat(plan.pricePerMonth) || 0 : 0); }, 0),
      totalPaidInvoices: allInvoices.filter(inv => inv.status === "paid").length,
      totalUnpaidInvoices: allInvoices.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").length,
    };
  }, [safeSubscriptions, safePlans, rawInvoices]);

  const handleFilterClick = (filterType: string) => {
    setInvoiceFilter(filterType); setInvoiceMonthFilter("all"); setSearchQuery(""); setCurrentPage(1);
    setTimeout(() => invoicesTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const resetFilters = () => { setInvoiceFilter("all"); setInvoiceMonthFilter("all"); setCalendarMonth(new Date()); setSearchQuery(""); setCurrentPage(1); };

  /* ---- Mutations ---- */
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        clientId: data.clientId, invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
        amount: data.amount.toString(), totalAmount: data.amount.toString(),
        subtotal: data.amount.toString(), taxAmount: "0",
        currency: data.currency || "MGA", status: data.status || "pending",
        issueDate: data.issueDate ? data.issueDate.toISOString() : new Date().toISOString(),
        dueDate: data.dueDate ? data.dueDate.toISOString() : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        description: data.description || null,
        paymentMethod: data.status === "paid" ? data.paymentMethod : null,
        paidDate: data.status === "paid" ? new Date().toISOString() : null,
        generatedBy: user?.id,
        billingPeriodStart: data.billingPeriodStart ? data.billingPeriodStart.toISOString() : null,
        billingPeriodEnd: data.billingPeriodEnd ? data.billingPeriodEnd.toISOString() : null,
      };
      const res = await apiRequest("POST", "/api/invoices", formattedData);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur création"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["invoiceMatrix"] }); toast({ title: "Facture créée" }); setIsNewInvoiceOpen(false); setNewInvoiceData({}); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // ✅ CORRECTION : mutation complète (tous les champs)
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: EditInvoiceData) => {
      const updates: any = {
        invoiceNumber: data.invoiceNumber.trim(),
        amount: data.amount.toString(),
        totalAmount: data.totalAmount.toString(),
        subtotal: data.amount.toString(),
        taxAmount: "0",
        currency: data.currency,
        status: data.status,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        description: data.description || null,
        billingPeriodStart: data.billingPeriodStart ? data.billingPeriodStart.toISOString() : null,
        billingPeriodEnd: data.billingPeriodEnd ? data.billingPeriodEnd.toISOString() : null,
      };
      if (data.status === "paid") {
        updates.paidDate = (data.paidDate ?? new Date()).toISOString();
        updates.paymentMethod = data.paymentMethod ?? "cash";
      } else {
        updates.paidDate = null;
        updates.paymentMethod = null;
      }
      const res = await apiRequest("PATCH", `/api/invoices/${data.id}`, updates);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur modification"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceMatrix"] });
      toast({ title: "Facture modifiée" });
      setIsEditInvoiceOpen(false);
      setEditInvoiceData(null);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: number; paymentMethod: "cash" | "mobile_money" }) => {
      const res = await apiRequest("PATCH", `/api/invoices/${id}`, { status: "paid", paidDate: new Date().toISOString(), paymentMethod });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["invoiceMatrix"] }); toast({ title: "Facture marquée payée" }); setIsInvoiceDetailsOpen(false); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/invoices/${id}`); if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); } return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["invoiceMatrix"] }); toast({ title: "Facture supprimée" }); setDeleteInvoiceId(null); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: NewContractData) => {
      if (!data.startDate) throw new Error("Veuillez sélectionner la date de début");
      const res = await apiRequest("POST", "/api/contracts", { ...data, startDate: data.startDate.toISOString(), endDate: data.endDate?.toISOString() });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contracts"] }); queryClient.invalidateQueries({ queryKey: ["contractStats"] }); toast({ title: "Contrat créé" }); setIsNewContractOpen(false); setSelectedContractSubscription(null); setNewContractData({ clientId: 0, title: "", startDate: undefined, endDate: undefined, status: "draft", isAutoRenew: true }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const generateMonthlyInvoicesMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/invoices/generate-monthly", {}); if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); } return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["invoiceMatrix"] }); toast({ title: "Génération terminée", description: `${data.generatedCount} générée(s), ${data.skippedCount} ignorée(s)` }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleCreateInvoice = () => {
    if (!newInvoiceData.clientId) {
      toast({ title: "Client requis", description: "Sélectionnez un client", variant: "destructive" }); return;
    }
    const amount = parseFloat(newInvoiceData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant supérieur à 0", variant: "destructive" }); return;
    }
    if (newInvoiceData.status === "paid" && !newInvoiceData.paymentMethod) {
      toast({ title: "Mode de paiement requis", description: "Sélectionnez un mode de paiement", variant: "destructive" }); return;
    }
    const data = { clientId: newInvoiceData.clientId, invoiceNumber: newInvoiceData.invoiceNumber || `INV-${Date.now()}`, amount: amount.toString(), currency: newInvoiceData.currency || "MGA", status: newInvoiceData.status || "pending", issueDate: newInvoiceData.issueDate || new Date(), dueDate: newInvoiceData.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), description: newInvoiceData.description || null, paymentMethod: newInvoiceData.status === "paid" ? newInvoiceData.paymentMethod : null };
    createInvoiceMutation.mutate(data);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditInvoiceData({
      id: invoice.id, clientId: invoice.clientId, invoiceNumber: invoice.invoiceNumber,
      amount: parseFloat(invoice.amount) || 0, totalAmount: parseFloat(invoice.totalAmount || invoice.amount) || 0,
      currency: invoice.currency, status: invoice.status,
      issueDate: invoice.issueDate && !isNaN(new Date(invoice.issueDate).getTime()) ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice.dueDate && !isNaN(new Date(invoice.dueDate).getTime()) ? new Date(invoice.dueDate) : new Date(),
      paidDate: invoice.paidDate && !isNaN(new Date(invoice.paidDate).getTime()) ? new Date(invoice.paidDate) : null,
      paymentMethod: invoice.paymentMethod || null,
      description: invoice.description || null,
      billingPeriodStart: invoice.billingPeriodStart ? new Date(invoice.billingPeriodStart) : null,
      billingPeriodEnd: invoice.billingPeriodEnd ? new Date(invoice.billingPeriodEnd) : null,
    });
    setIsEditInvoiceOpen(true);
  };

  // ✅ CORRECTION : validation avant mutation
  const handleUpdateInvoice = () => {
    if (!editInvoiceData) return;
    if (!editInvoiceData.invoiceNumber?.trim()) {
      toast({ title: "N° facture requis", variant: "destructive" }); return;
    }
    if (!Number.isFinite(editInvoiceData.amount) || editInvoiceData.amount <= 0) {
      toast({ title: "Montant invalide", description: "Doit être supérieur à 0", variant: "destructive" }); return;
    }
    if (!editInvoiceData.issueDate || isNaN(editInvoiceData.issueDate.getTime())) {
      toast({ title: "Date d'émission invalide", variant: "destructive" }); return;
    }
    if (!editInvoiceData.dueDate || isNaN(editInvoiceData.dueDate.getTime())) {
      toast({ title: "Date d'échéance invalide", variant: "destructive" }); return;
    }
    if (editInvoiceData.dueDate < editInvoiceData.issueDate) {
      toast({ title: "Dates incohérentes", description: "L'échéance doit être postérieure à l'émission", variant: "destructive" }); return;
    }
    if (editInvoiceData.status === "paid" && !editInvoiceData.paymentMethod) {
      toast({ title: "Mode de paiement requis", variant: "destructive" }); return;
    }
    updateInvoiceMutation.mutate(editInvoiceData);
  };

  const handleMarkAsPaid = ({ id, paymentMethod }: { id: number; paymentMethod: "cash" | "mobile_money" }) => { updateInvoiceStatusMutation.mutate({ id, paymentMethod }); };

  const handleDownloadInvoicePdf = (invoiceId: number, invoiceNumber: string) => {
    try { window.open(`/api/invoices/${invoiceId}/download-pdf`, '_blank'); toast({ title: "Téléchargement en cours", description: `Facture ${invoiceNumber || invoiceId}` }); }
    catch { toast({ title: "Erreur", description: "Impossible de télécharger", variant: "destructive" }); }
  };

  const handleDownloadContract = (clientId: number) => {
    try { window.open(`/api/contracts/${clientId}/download`, '_blank'); const c = safeUsers.find(u => u.id === clientId); toast({ title: "Téléchargement en cours", description: `Contrat de ${c?.fullName || "client"}` }); }
    catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleOpenNewContract = (client: User | undefined, subscription: Subscription) => {
    if (!client) { toast({ title: "Client introuvable", variant: "destructive" }); return; }
    const plan = safePlans.find(p => p.id === subscription.planId);
    setSelectedContractClient(client); setSelectedContractSubscription(subscription);
    setNewContractData({ clientId: client.id, subscriptionId: subscription.id, title: `Contrat d'abonnement - ${plan?.name || "Plan standard"}`, startDate: undefined, endDate: undefined, status: "draft", isAutoRenew: true });
    setIsNewContractOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    const result = rawInvoices.filter((inv) => {
      if (invoiceFilter !== "all" && inv.status !== invoiceFilter) return false;
      if (invoiceMonthFilter !== "all") {
        const src = inv.issueDate || inv.createdAt;
        if (!src) return false;
        const invDate = new Date(src);
        if (isNaN(invDate.getTime())) return false;
        if (/^\d{4}-\d{2}$/.test(invoiceMonthFilter)) {
          const [y, m] = invoiceMonthFilter.split("-").map(Number);
          if (invDate.getFullYear() !== y || invDate.getMonth() + 1 !== m) return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const client = safeUsers.find(u => u.id === inv.clientId);
        const searchable = [inv.invoiceNumber, inv.description || "", client?.fullName || "", client?.email || "", client?.phone || ""].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [rawInvoices, invoiceFilter, invoiceMonthFilter, searchQuery, safeUsers]);

  const indexOfLast = currentPage * invoicesPerPage;
  const indexOfFirst = indexOfLast - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage) || 1;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* EN-TÊTE */}
        <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4")}>
          <div>
            <h1 className="text-[17px] font-semibold text-slate-900">Facturation</h1>
            <p className="text-[11.5px] text-slate-500 mt-0.5">Gérez les factures, suivez les paiements</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button onClick={() => setViewMode("grid")} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium", viewMode === "grid" ? "bg-[#0B676E] text-white" : "text-slate-600 hover:bg-slate-50")}>Grille</button>
              <button onClick={() => setViewMode("matrix")} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium", viewMode === "matrix" ? "bg-[#0B676E] text-white" : "text-slate-600 hover:bg-slate-50")}>Matrice</button>
            </div>
            <Button variant="outline" onClick={() => { setIsContractViewOpen(true); setSelectedContractClient(null); setContractSearchQuery(''); }} className={ui.btn}>Contrats</Button>
            <Button variant="outline" onClick={() => generateMonthlyInvoicesMutation.mutate()} disabled={generateMonthlyInvoicesMutation.isPending} className={ui.btn}>Génération mensuelle</Button>
            <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
              <DialogTrigger asChild><Button className={ui.btnPrimary}>Nouvelle facture</Button></DialogTrigger>
              <DialogContent className={cn(ui.dialog, "max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto")}>
                <DialogHeader>
                  <DialogTitle className="text-[15px] font-semibold">Créer une facture</DialogTitle>
                  <DialogDescription className="text-[11.5px]">Remplissez les informations ci-dessous.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-[11.5px]">N° Facture</Label><Input placeholder="Auto-généré si vide" value={newInvoiceData.invoiceNumber || ""} onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoiceNumber: e.target.value })} className={ui.input} /></div>
                    <div className="space-y-1.5"><Label className="text-[11.5px]">Client *</Label>
                      <Popover open={newInvoiceClientOpen} onOpenChange={setNewInvoiceClientOpen}>
                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className={cn(ui.input, "w-full justify-between font-normal")}>{safeUsers.find(u => u.id === newInvoiceData.clientId)?.fullName || "Sélectionner un client"}</Button></PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-lg border-slate-200">
                          <Command>
                            <CommandInput placeholder="Rechercher un client..." />
                            <CommandList>
                              <CommandEmpty>Aucun client trouvé</CommandEmpty>
                              <CommandGroup>
                                {safeUsers.filter(u => u.role === "client").map(client => (
                                  <CommandItem key={client.id} onSelect={() => { setNewInvoiceData({ ...newInvoiceData, clientId: client.id }); setNewInvoiceClientOpen(false); }}>
                                    <div><p className="font-medium text-[12.5px]">{client.fullName}</p><p className="text-[11px] text-slate-500">{client.email}</p></div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-[11.5px]">Montant (Ar) *</Label><Input type="number" placeholder="Ex: 25000" value={newInvoiceData.amount || ""} onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: parseFloat(e.target.value) || 0 })} className={ui.input} /></div>
                    <div className="space-y-1.5"><Label className="text-[11.5px]">Devise</Label>
                      <Select value={newInvoiceData.currency || "MGA"} onValueChange={(v) => setNewInvoiceData({ ...newInvoiceData, currency: v })}><SelectTrigger className={ui.input}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MGA">Ariary (Ar)</SelectItem><SelectItem value="EUR">Euro (€)</SelectItem><SelectItem value="USD">Dollar ($)</SelectItem></SelectContent></Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-[11.5px]">Date d'émission *</Label><Input type="date" value={newInvoiceData.issueDate ? safeFormat(newInvoiceData.issueDate, "yyyy-MM-dd") : ""} onChange={(e) => setNewInvoiceData({ ...newInvoiceData, issueDate: e.target.value ? new Date(e.target.value) : undefined })} className={ui.input} /></div>
                    <div className="space-y-1.5"><Label className="text-[11.5px]">Date d'échéance *</Label><Input type="date" value={newInvoiceData.dueDate ? safeFormat(newInvoiceData.dueDate, "yyyy-MM-dd") : ""} onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value ? new Date(e.target.value) : undefined })} className={ui.input} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-[11.5px]">Statut</Label>
                      <Select value={newInvoiceData.status || "pending"} onValueChange={(v) => setNewInvoiceData({ ...newInvoiceData, status: v })}><SelectTrigger className={ui.input}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">En attente</SelectItem><SelectItem value="paid">Payé</SelectItem><SelectItem value="overdue">En retard</SelectItem><SelectItem value="cancelled">Annulé</SelectItem></SelectContent></Select>
                    </div>
                    {newInvoiceData.status === "paid" && (
                      <div className="space-y-1.5"><Label className="text-[11.5px]">Mode de paiement *</Label>
                        <Select onValueChange={(v) => setNewInvoiceData({ ...newInvoiceData, paymentMethod: v })}><SelectTrigger className={ui.input}><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="cash">Espèces</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem></SelectContent></Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5"><Label className="text-[11.5px]">Description</Label><Textarea placeholder="Description…" value={newInvoiceData.description || ""} onChange={(e) => setNewInvoiceData({ ...newInvoiceData, description: e.target.value })} rows={3} className={cn(ui.input, "resize-none min-h-[70px]")} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewInvoiceOpen(false)} className={ui.btn}>Annuler</Button>
                  <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending} className={ui.btnPrimary}>Créer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* MATRICE OU GRILLE */}
        {viewMode === 'matrix' ? (
          <InvoiceMatrix
            onDownloadInvoice={handleDownloadInvoicePdf}
            onViewInvoiceDetails={(invoiceId) => { const inv = invoices.find(i => i.id === invoiceId); if (inv) { setSelectedInvoice(inv); setIsInvoiceDetailsOpen(true); } }}
            onMarkAsPaid={(invoiceId, paymentMethod) => handleMarkAsPaid({ id: invoiceId, paymentMethod })}
          />
        ) : (
          <>
            {/* KPI */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <MiniKPI title="Revenus du mois" value={formatCurrency(currentMonthRevenue)} subtitle={`${paidInvoicesThisMonth.length} facture(s)`} tone="brand" trend={revenueTrend === "up" ? { dir: "up", label: "hausse" } : revenueTrend === "down" ? { dir: "down", label: "baisse" } : null} progress={paymentRate} progressLabel="Taux" />
              <MiniKPI title="Impayés" value={formatCurrency(unpaidAmount)} subtitle={`${unpaidCount} facture(s)`} tone="amber" onClick={() => handleFilterClick("pending")} badge={unpaidCount} />
              <MiniKPI title="En retard" value={formatCurrency(overdueAmount)} subtitle={`${overdueCount} facture(s)`} tone="red" onClick={() => handleFilterClick("overdue")} badge={overdueCount} />
              <MiniKPI title="Taux de paiement" value={`${paymentRate}%`} subtitle={`${paidInvoicesThisMonth.length}/${invoicesIssuedThisMonth.length} réglées`} tone={paymentRate >= 80 ? "brand" : paymentRate >= 50 ? "amber" : "red"} progress={paymentRate} progressLabel="Paiements" />
            </div>

            {/* ALERTES */}
            {(unpaidCount > 5 || soonDueCount > 0) && (
              <div className="grid gap-3 md:grid-cols-2">
                {unpaidCount > 5 && (
                  <div className="p-3.5 rounded-lg border-l-4 border-l-red-500 bg-red-50/40 border border-red-200">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-[13px] text-red-800">{unpaidCount} factures impayées</p>
                        <p className="text-[11.5px] text-red-600">Total: {formatCurrency(unpaidAmount)}</p>
                        <p className="text-[10.5px] text-red-500 mt-0.5">Dont {overdueCount} en retard</p>
                      </div>
                      <Button size="sm" variant="outline" className={cn(ui.btn, "border-red-300 text-red-700 hover:bg-red-100 h-7 text-[11px]")} onClick={() => handleFilterClick("pending")}>Voir</Button>
                    </div>
                  </div>
                )}
                {soonDueCount > 0 && (
                  <div className="p-3.5 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/40 border border-amber-200">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-[13px] text-amber-800">{soonDueCount} échéance(s) proche(s)</p>
                        <p className="text-[11.5px] text-amber-600">Total: {formatCurrency(soonDueAmount)}</p>
                        <p className="text-[10.5px] text-amber-500 mt-0.5">À payer sous 3 jours</p>
                      </div>
                      <Button size="sm" variant="outline" className={cn(ui.btn, "border-amber-300 text-amber-700 hover:bg-amber-100 h-7 text-[11px]")} onClick={() => handleFilterClick("pending")}>Voir</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <FilterSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} invoiceFilter={invoiceFilter} setInvoiceFilter={setInvoiceFilter} invoiceMonthFilter={invoiceMonthFilter} setInvoiceMonthFilter={setInvoiceMonthFilter} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} onReset={resetFilters} filteredCount={filteredInvoices.length} totalCount={rawInvoices.length} showInvoiceCalendar={showInvoiceCalendar} setShowInvoiceCalendar={setShowInvoiceCalendar} />

            {/* Badges filtres actifs */}
            <div className="flex flex-wrap gap-1.5">
              {invoiceMonthFilter !== "all" && (
                <Pill tone="brand">
                  {(() => { const [y, m] = invoiceMonthFilter.split("-").map(Number); return y && m ? safeFormat(new Date(y, m - 1, 1), "MMMM yyyy", { locale: fr }) : "Période"; })()}
                  <span className="cursor-pointer hover:text-red-500 ml-0.5 text-[10px]" onClick={() => setInvoiceMonthFilter("all")}>Retirer</span>
                </Pill>
              )}
              {invoiceFilter !== "all" && (
                <Pill tone="brand">
                  {invoiceFilter === "overdue" ? "En retard" : invoiceFilter === "pending" ? "En attente" : invoiceFilter === "paid" ? "Payé" : "Annulé"}
                  <span className="cursor-pointer hover:text-red-500 ml-0.5 text-[10px]" onClick={() => setInvoiceFilter("all")}>Retirer</span>
                </Pill>
              )}
              {searchQuery && (
                <Pill tone="brand">{searchQuery}<span className="cursor-pointer hover:text-red-500 ml-0.5 text-[10px]" onClick={() => setSearchQuery("")}>Retirer</span></Pill>
              )}
            </div>

            {/* TABLEAU */}
            <div ref={invoicesTableRef}>
              <div className={ui.card}>
                <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-[14px] font-semibold text-slate-900">Factures</h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">{filteredInvoices.length} facture(s) trouvée(s)</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchInvoices()} className={ui.btn}>Actualiser</Button>
                </div>
                <div className="p-4">
                  {isLoadingInvoices ? (
                    <div className="text-center py-12"><p className="text-[12px] text-slate-500">Chargement…</p></div>
                  ) : currentInvoices.length === 0 ? (
                    <EmptyState title="Aucune facture trouvée" description={searchQuery || invoiceFilter !== "all" || invoiceMonthFilter !== "all" ? "Modifiez vos filtres" : "Créez votre première facture"} action={<Button variant="outline" onClick={resetFilters} className={ui.btn}>Réinitialiser</Button>} />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {currentInvoices.map((invoice) => {
                          const client = safeUsers.find(u => u.id === invoice.clientId);
                          const isOverdue = invoice.status === "overdue";
                          const isPending = invoice.status === "pending";
                          const isPaid = invoice.status === "paid";
                          const dueDate = safeParseISO(invoice.dueDate);
                          const dueDays = dueDate ? differenceInDays(dueDate, new Date()) : 999;
                          const isDueSoon = dueDays <= 3 && dueDays >= 0 && isPending;
                          return (
                            <div key={invoice.id} className="group relative bg-white rounded-lg border border-slate-200 p-3.5 transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] cursor-pointer" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceDetailsOpen(true); }}>
                              <div className="flex items-start justify-between mb-2.5 gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <div className={cn("w-2 h-2 rounded-full shrink-0", isPaid ? "bg-[#0B676E]" : isOverdue ? "bg-red-500" : isDueSoon ? "bg-amber-500" : "bg-slate-400")} />
                                    <span className="font-mono font-semibold text-[12px] text-slate-800 truncate">{invoice.invoiceNumber}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{client?.fullName || "Client inconnu"}</p>
                                </div>
                                <StatusBadge status={invoice.status} paymentMethod={invoice.paymentMethod} />
                              </div>
                              <div className="mb-2.5"><p className={cn("text-[20px] font-bold tabular-nums leading-tight", isPaid ? "text-[#0B676E]" : isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-slate-900")}>{formatCurrency(invoiceAmount(invoice))}</p></div>
                              <div className="space-y-1 text-[10.5px] text-slate-500">
                                <div className="flex items-center justify-between"><span>Émis:</span><span className="text-slate-700 font-medium">{safeFormat(invoice.issueDate, "dd/MM/yyyy")}</span></div>
                                <div className="flex items-center justify-between"><span>Échéance:</span><span className={cn("font-medium", isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-slate-700")}>{safeFormat(invoice.dueDate, "dd/MM/yyyy")}</span></div>
                              </div>
                              {isOverdue && <div className="absolute -top-1 -right-1"><Pill tone="red" className="shadow-md text-[9.5px]">Retard</Pill></div>}
                              {isDueSoon && !isOverdue && <div className="absolute -top-1 -right-1"><Pill tone="amber" className="shadow-md text-[9.5px]">Échéance proche</Pill></div>}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                                  <Button variant="ghost" size="sm" aria-label={`Marquer payée ${invoice.invoiceNumber}`} className="h-6 px-2 rounded-full bg-white shadow-sm hover:bg-[#0B676E]/10 text-[10px]" onClick={(e) => { e.stopPropagation(); handleMarkAsPaid({ id: invoice.id, paymentMethod: "cash" }); }}>Payer</Button>
                                )}
                                <Button variant="ghost" size="sm" aria-label={`Télécharger PDF ${invoice.invoiceNumber}`} className="h-6 px-2 rounded-full bg-white shadow-sm hover:bg-slate-100 text-[10px]" onClick={(e) => { e.stopPropagation(); handleDownloadInvoicePdf(invoice.id, invoice.invoiceNumber); }}>PDF</Button>
                                <Button variant="ghost" size="sm" aria-label={`Éditer ${invoice.invoiceNumber}`} className="h-6 px-2 rounded-full bg-white shadow-sm hover:bg-slate-100 text-[10px]" onClick={(e) => { e.stopPropagation(); handleEditInvoice(invoice); }}>Éditer</Button>
                                <Button variant="ghost" size="sm" aria-label={`Supprimer ${invoice.invoiceNumber}`} className="h-6 px-2 rounded-full bg-white shadow-sm hover:bg-red-100 text-[10px]" onClick={(e) => { e.stopPropagation(); setDeleteInvoiceId(invoice.id); }}>Suppr.</Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {filteredInvoices.length > 0 && totalPages > 1 && (
                        <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredInvoices.length} itemsPerPage={invoicesPerPage} />
                      )}
                    </>
                  )}
                  {filteredInvoices.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-end items-center gap-4 text-[11.5px] flex-wrap">
                        <div><span className="text-slate-500">Total:</span> <span className="font-semibold text-slate-900 ml-1">{formatCurrency(filteredInvoices.reduce((s, i) => s + invoiceAmount(i), 0))}</span></div>
                        <div><span className="text-slate-500">Payé:</span> <span className="font-semibold text-[#0B676E] ml-1">{formatCurrency(filteredInvoices.filter(i => i.status === "paid").reduce((s, i) => s + invoiceAmount(i), 0))}</span></div>
                        <div><span className="text-slate-500">Impayé:</span> <span className="font-semibold text-red-600 ml-1">{formatCurrency(filteredInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + invoiceAmount(i), 0))}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* DIALOG DÉTAILS */}
        <Dialog open={isInvoiceDetailsOpen} onOpenChange={setIsInvoiceDetailsOpen}>
          <DialogContent key={selectedInvoice?.id ?? "none"} className={cn(ui.dialog, "max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-0")}>
            {selectedInvoice && (
              <>
                <DialogHeader className="p-5 pb-0"><DialogTitle className="text-[15px] font-semibold">Détails de la facture</DialogTitle></DialogHeader>
                <div className="space-y-4 p-5">
                  <div className={cn(ui.well, "p-4")}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div><p className="text-[11px] text-slate-600 font-medium">N° Facture</p><p className="text-[17px] font-bold text-slate-900">{selectedInvoice.invoiceNumber}</p></div>
                      <StatusBadge status={computeInvoiceStatus(selectedInvoice)} paymentMethod={selectedInvoice.paymentMethod} />
                    </div>
                    <div className="mt-4 text-right"><p className="text-[11px] text-slate-500">Montant total</p><p className="text-[22px] font-bold text-slate-800 tabular-nums">{formatCurrency(invoiceAmount(selectedInvoice))}</p></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-[12px] font-semibold text-slate-700">Client</h4>
                      <div className="space-y-1 pl-4 text-[11.5px]">
                        <p className="font-medium text-slate-900">{safeUsers.find(u => u.id === selectedInvoice.clientId)?.fullName || "N/A"}</p>
                        <p className="text-slate-500">{safeUsers.find(u => u.id === selectedInvoice.clientId)?.email}</p>
                        <p className="text-slate-500">{safeUsers.find(u => u.id === selectedInvoice.clientId)?.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[12px] font-semibold text-slate-700">Dates</h4>
                      <div className="space-y-1 pl-4 text-[11.5px]">
                        <p><span className="text-slate-500">Émission :</span> <span className="font-medium text-slate-800">{safeFormat(selectedInvoice.issueDate, "dd MMMM yyyy", { locale: fr })}</span></p>
                        <p><span className="text-slate-500">Échéance :</span> <span className={cn("font-medium", computeInvoiceStatus(selectedInvoice) === "overdue" ? "text-red-600" : "text-slate-900")}>{safeFormat(selectedInvoice.dueDate, "dd MMMM yyyy", { locale: fr })}</span></p>
                        {selectedInvoice.paidDate && <p><span className="text-slate-500">Payé le :</span> <span className="font-medium text-[#0B676E]">{safeFormat(selectedInvoice.paidDate, "dd MMMM yyyy", { locale: fr })}</span></p>}
                      </div>
                    </div>
                  </div>
                  {selectedInvoice.description && (
                    <div className="space-y-1.5">
                      <h4 className="text-[12px] font-semibold text-slate-700">Description</h4>
                      <p className="text-[11.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedInvoice.description}</p>
                    </div>
                  )}
                  {selectedInvoice.status !== "paid" && selectedInvoice.status !== "cancelled" && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-[12px] font-semibold text-amber-800 mb-2.5">Marquer comme payée</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" className={cn(ui.btn, "flex-1 border-amber-300 hover:bg-amber-100")} onClick={() => handleMarkAsPaid({ id: selectedInvoice.id, paymentMethod: "cash" })}>Espèces</Button>
                        <Button variant="outline" className={cn(ui.btn, "flex-1 border-amber-300 hover:bg-amber-100")} onClick={() => handleMarkAsPaid({ id: selectedInvoice.id, paymentMethod: "mobile_money" })}>Mobile Money</Button>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="p-5 pt-0 flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsInvoiceDetailsOpen(false)} className={ui.btn}>Fermer</Button>
                  <Button onClick={() => handleDownloadInvoicePdf(selectedInvoice.id, selectedInvoice.invoiceNumber)} className={ui.btnPrimary}>Télécharger PDF</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ✅ DIALOG MODIFIER — CORRIGÉ */}
        <Dialog
          open={isEditInvoiceOpen}
          onOpenChange={(open) => {
            setIsEditInvoiceOpen(open);
            if (!open) setEditInvoiceData(null);
          }}
        >
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto")}>
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold">Modifier la facture</DialogTitle>
              <DialogDescription className="text-[11.5px]">Modifiez les informations de la facture</DialogDescription>
            </DialogHeader>

            {editInvoiceData && (
              <div className="space-y-3 py-2">
                {/* Client (lecture seule) + N° facture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Client</Label>
                    <div className={cn(ui.well, "px-3 py-2 min-h-[36px] flex items-center")}>
                      {(() => {
                        const c = safeUsers.find(u => u.id === editInvoiceData.clientId);
                        return c ? (
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-[12.5px] text-slate-900 truncate">{c.fullName}</span>
                            <span className="text-[10.5px] text-slate-500 truncate">{c.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[12.5px]">Client inconnu</span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">N° Facture *</Label>
                    <Input
                      value={editInvoiceData.invoiceNumber}
                      onChange={(e) => setEditInvoiceData({ ...editInvoiceData, invoiceNumber: e.target.value })}
                      className={ui.input}
                    />
                  </div>
                </div>

                {/* Montant + Devise */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Montant (Ar) *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editInvoiceData.amount}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        const safe = Number.isFinite(v) ? v : 0;
                        setEditInvoiceData({ ...editInvoiceData, amount: safe, totalAmount: safe });
                      }}
                      className={ui.input}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Devise</Label>
                    <Select
                      value={editInvoiceData.currency}
                      onValueChange={(v) => setEditInvoiceData({ ...editInvoiceData, currency: v })}
                    >
                      <SelectTrigger className={ui.input}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MGA">Ariary (Ar)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Date d'émission *</Label>
                    <Input
                      type="date"
                      value={safeFormat(editInvoiceData.issueDate, "yyyy-MM-dd")}
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value) : undefined;
                        if (d && !isNaN(d.getTime())) setEditInvoiceData({ ...editInvoiceData, issueDate: d });
                      }}
                      className={ui.input}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Date d'échéance *</Label>
                    <Input
                      type="date"
                      value={safeFormat(editInvoiceData.dueDate, "yyyy-MM-dd")}
                      min={safeFormat(editInvoiceData.issueDate, "yyyy-MM-dd")}
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value) : undefined;
                        if (d && !isNaN(d.getTime())) setEditInvoiceData({ ...editInvoiceData, dueDate: d });
                      }}
                      className={ui.input}
                    />
                  </div>
                </div>

                {/* Statut + Mode de paiement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Statut</Label>
                    <Select
                      value={editInvoiceData.status}
                      onValueChange={(v) => setEditInvoiceData({ ...editInvoiceData, status: v })}
                    >
                      <SelectTrigger className={ui.input}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editInvoiceData.status === "paid" && (
                    <div className="space-y-1.5">
                      <Label className="text-[11.5px]">Mode de paiement *</Label>
                      <Select
                        value={editInvoiceData.paymentMethod || "cash"}
                        onValueChange={(v) => setEditInvoiceData({ ...editInvoiceData, paymentMethod: v as any })}
                      >
                        <SelectTrigger className={ui.input}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Date de paiement (si payé) */}
                {editInvoiceData.status === "paid" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11.5px]">Date de paiement</Label>
                    <Input
                      type="date"
                      value={safeFormat(editInvoiceData.paidDate || new Date(), "yyyy-MM-dd")}
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value) : null;
                        setEditInvoiceData({ ...editInvoiceData, paidDate: d });
                      }}
                      className={ui.input}
                    />
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-[11.5px]">Description</Label>
                  <Textarea
                    value={editInvoiceData.description || ""}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, description: e.target.value })}
                    rows={3}
                    placeholder="Description de la facture…"
                    className={cn(ui.input, "resize-none min-h-[70px]")}
                  />
                </div>

                {/* Récapitulatif */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-[11.5px] flex flex-wrap justify-between gap-3">
                  <div>
                    <span className="text-slate-500">Montant :</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {(() => {
                        const n = Number.isFinite(editInvoiceData.totalAmount) ? editInvoiceData.totalAmount : 0;
                        return new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: editInvoiceData.currency || "MGA",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(n).replace("MGA", "Ar");
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Statut :</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {editInvoiceData.status === "paid"
                        ? "Payé"
                        : editInvoiceData.status === "pending"
                        ? "En attente"
                        : editInvoiceData.status === "overdue"
                        ? "En retard"
                        : "Annulé"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditInvoiceOpen(false)}
                disabled={updateInvoiceMutation.isPending}
                className={ui.btn}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateInvoice}
                disabled={updateInvoiceMutation.isPending}
                className={ui.btnPrimary}
              >
                {updateInvoiceMutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG CONTRAT CRÉATION */}
        <Dialog open={isNewContractOpen} onOpenChange={(open) => { setIsNewContractOpen(open); if (!open) setSelectedContractSubscription(null); }}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto")}>
            <DialogHeader><DialogTitle className="text-[15px] font-semibold">Créer un contrat</DialogTitle><DialogDescription className="text-[11.5px]">Créez le contrat à partir de l'abonnement sélectionné.</DialogDescription></DialogHeader>
            {selectedContractSubscription && (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-[11.5px]">Client</Label><div className={cn(ui.well, "px-3 py-2")}><p className="font-semibold text-[12.5px] text-slate-900">{selectedContractClient?.fullName || "N/A"}</p><p className="text-[11px] text-slate-500">{selectedContractClient?.email || "N/A"}</p></div></div>
                  <div className="space-y-1.5"><Label className="text-[11.5px]">Abonnement</Label><div className={cn(ui.well, "px-3 py-2")}><p className="font-semibold text-[12.5px] text-slate-900">{safePlans.find(p => p.id === selectedContractSubscription.planId)?.name || "Plan standard"}</p><p className="text-[11px] text-slate-500">{safePlans.find(p => p.id === selectedContractSubscription.planId)?.pricePerMonth || "0"} Ar/mois</p></div></div>
                </div>
                <div className="space-y-1.5"><Label className="text-[11.5px]">Titre du contrat *</Label><Input value={newContractData.title} onChange={(e) => setNewContractData({ ...newContractData, title: e.target.value })} className={ui.input} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-[11.5px]">Date de début *</Label><Input type="date" value={safeFormat(newContractData.startDate, "yyyy-MM-dd")} onChange={(e) => setNewContractData({ ...newContractData, startDate: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined })} className={ui.input} /></div>
                  <div className="space-y-1.5"><Label className="text-[11.5px]">Date de fin</Label><Input type="date" value={safeFormat(newContractData.endDate, "yyyy-MM-dd")} min={safeFormat(newContractData.startDate, "yyyy-MM-dd")} onChange={(e) => setNewContractData({ ...newContractData, endDate: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined })} className={ui.input} /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-[11.5px]">Renouvellement automatique</Label>
                  <Select value={newContractData.isAutoRenew ? "true" : "false"} onValueChange={(v) => setNewContractData({ ...newContractData, isAutoRenew: v === "true" })}><SelectTrigger className={ui.input}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Oui</SelectItem><SelectItem value="false">Non</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[11.5px]">Notes</Label><Textarea placeholder="Notes…" value={newContractData.notes || ""} onChange={(e) => setNewContractData({ ...newContractData, notes: e.target.value })} rows={3} className={cn(ui.input, "resize-none")} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewContractOpen(false)} className={ui.btn}>Annuler</Button>
              <Button onClick={() => createContractMutation.mutate(newContractData)} disabled={!newContractData.clientId || !newContractData.title.trim() || !newContractData.startDate || createContractMutation.isPending} className={ui.btnPrimary}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG CONTRATS */}
        <Dialog open={isContractViewOpen} onOpenChange={(open) => { setIsContractViewOpen(open); if (!open) { setSelectedContractClient(null); setContractSearchQuery(''); setShowContractSuggestions(false); } }}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] md:max-w-4xl max-h-[85vh] overflow-y-auto p-0")}>
            <DialogHeader className="p-5 pb-0"><DialogTitle className="text-[15px] font-semibold">Contrats d'abonnement</DialogTitle><DialogDescription className="text-[11.5px]">Gérez les contrats actifs et consultez l'historique des paiements</DialogDescription></DialogHeader>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Input placeholder="Rechercher un client par nom, email ou téléphone…" value={contractSearchQuery} onChange={(e) => { setContractSearchQuery(e.target.value); setShowContractSuggestions(true); }} onFocus={() => setShowContractSuggestions(true)} className={cn(ui.input, "text-[12.5px]")} />
                  {contractSearchQuery && <button onClick={() => { setContractSearchQuery(''); setSelectedContractClient(null); setShowContractSuggestions(false); }} className="absolute inset-y-0 right-0 pr-3 flex items-center"><span className="text-[11px] text-slate-400 hover:text-slate-600">Effacer</span></button>}
                </div>
                {showContractSuggestions && contractSearchQuery && filteredContractClients.length > 0 && (
                  <div className={cn(ui.card, "overflow-hidden")}>
                    <div className="max-h-72 overflow-y-auto">
                      {filteredContractClients.map((client) => (
                        <div key={client.id} className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors" onClick={() => { setSelectedContractClient(client); setContractSearchQuery(client.fullName); setShowContractSuggestions(false); }}>
                          <div>
                            <p className="font-medium text-[12.5px] text-slate-900">{client.fullName}</p>
                            <p className="text-[10.5px] text-slate-500">{client.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedContractClient && <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => { setSelectedContractClient(null); setContractSearchQuery(''); }} className={cn(ui.btn, "text-slate-500 hover:text-red-600")}>Effacer</Button></div>}
              </div>
              {(filteredContractSubscriptions.length === 0 && !selectedContractClient) ? (
                <EmptyState title="Aucun contrat actif" description="Aucun abonnement actif trouvé" />
              ) : (
                <div className="space-y-3">
                  {!selectedContractClient && contractGlobalStats.totalActive > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200"><p className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider">Contrats actifs</p><p className="text-[18px] font-bold text-slate-900 mt-0.5 tabular-nums">{contractGlobalStats.totalActive}</p></div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200"><p className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider">CA mensuel</p><p className="text-[18px] font-bold text-slate-900 mt-0.5 tabular-nums">{formatCurrency(contractGlobalStats.monthlyRevenue)}</p></div>
                      <div className="p-3 rounded-lg bg-[#0B676E]/5 border border-[#0B676E]/15"><p className="text-[10.5px] text-[#0B676E] font-semibold uppercase tracking-wider">Payées</p><p className="text-[18px] font-bold text-[#0B676E] mt-0.5 tabular-nums">{contractGlobalStats.totalPaidInvoices}</p></div>
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200/60"><p className="text-[10.5px] text-red-600 font-semibold uppercase tracking-wider">Impayées</p><p className="text-[18px] font-bold text-red-600 mt-0.5 tabular-nums">{contractGlobalStats.totalUnpaidInvoices}</p></div>
                    </div>
                  )}
                  {selectedContractClient ? (
                    <ContractDetailView client={selectedContractClient} subscriptions={safeSubscriptions} subscriptionPlans={safePlans} invoices={rawInvoices} onDownloadContract={handleDownloadContract} onViewInvoiceDetails={(inv: any) => { setSelectedInvoice(inv); setIsInvoiceDetailsOpen(true); }} onMarkAsPaid={handleMarkAsPaid} onDownloadInvoicePdf={handleDownloadInvoicePdf} formatCurrency={formatCurrency} />
                  ) : (
                    filteredContractSubscriptions.map((sub) => {
                      const client = safeUsers.find(u => u.id === sub.clientId);
                      const plan = safePlans.find(p => p.id === sub.planId);
                      const clientInvoices = rawInvoices.filter(inv => inv.clientId === sub.clientId);
                      const paidCount = clientInvoices.filter(inv => inv.status === "paid").length;
                      const pendingCount = clientInvoices.filter(inv => inv.status === "pending").length;
                      const overdueCount = clientInvoices.filter(inv => inv.status === "overdue").length;
                      const total = paidCount + pendingCount + overdueCount;
                      const rate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
                      return (
                        <div key={sub.id} className={ui.card}>
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-[#0B676E]/10 flex items-center justify-center"><span className="text-[#0B676E] text-[14px] font-bold">{client?.fullName?.charAt(0) || 'C'}</span></div>
                                  <div>
                                    <h4 className="font-semibold text-[13px] text-slate-900">{client?.fullName || "Client"}</h4>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5"><span>{client?.email || "N/A"}</span>{client?.phone && <span>{client.phone}</span>}</div>
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Pill tone="slate">{plan?.name || "Standard"}</Pill>
                                  <Pill tone="blue">{plan?.pricePerMonth || "0"} Ar/mois</Pill>
                                  <span className="text-[10.5px] text-slate-400">Début: {safeFormat(sub.startDate, "dd/MM/yyyy")}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="outline" className={cn(ui.btn, "h-8 text-[11px]")} onClick={() => { setSelectedContractClient(client || null); setContractSearchQuery(client?.fullName || ''); }}>Détails</Button>
                                <Button size="sm" className={cn(ui.btnPrimary, "h-8 text-[11px]")} onClick={() => handleOpenNewContract(client, sub)}>Contrat</Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
                              <div className="text-center"><p className="text-[10.5px] text-slate-500">Factures</p><p className="text-[15px] font-bold text-slate-900 tabular-nums">{total}</p></div>
                              <div className="text-center"><p className="text-[10.5px] text-[#0B676E]">Payées</p><p className="text-[15px] font-bold text-[#0B676E] tabular-nums">{paidCount}</p></div>
                              <div className="text-center"><p className="text-[10.5px] text-amber-600">En attente</p><p className="text-[15px] font-bold text-amber-700 tabular-nums">{pendingCount}</p></div>
                              <div className="text-center"><p className="text-[10.5px] text-red-600">En retard</p><p className="text-[15px] font-bold text-red-700 tabular-nums">{overdueCount}</p></div>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-[10.5px] text-slate-500 mb-1"><span>Taux de paiement</span><span className="font-semibold">{rate}%</span></div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-[#0B676E] h-1.5 rounded-full transition-all duration-500" style={{ width: `${rate}%` }} /></div>
                            </div>
                            {overdueCount > 0 && (
                              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-red-700">{overdueCount} facture(s) en retard — {formatCurrency(clientInvoices.filter(inv => inv.status === "overdue").reduce((s, i) => s + invoiceAmount(i), 0))}</span>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 h-6 text-[10.5px] px-2" onClick={() => { setInvoiceFilter("overdue"); setInvoiceMonthFilter("all"); setSearchQuery(client?.fullName || ''); setIsContractViewOpen(false); }}>Voir</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* CONFIRMATION SUPPRESSION */}
        <AlertDialog open={deleteInvoiceId !== null} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
          <AlertDialogContent className={ui.dialog}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[15px] font-semibold">Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription className="text-[11.5px]">Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className={ui.btn}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteInvoiceId && deleteInvoiceMutation.mutate(deleteInvoiceId)} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}