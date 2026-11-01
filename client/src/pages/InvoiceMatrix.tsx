// client/src/components/tabs/InvoiceMatrix.tsx
// Tableau matriciel des paiements + Calendrier avec Sélection Client (Master-Detail)
// Le calendrier marque : les DATES DE PAIEMENT PRÉVUES (échéances à payer / en retard) et les paiements effectués.
// 100% textuel — aucune icône.
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  format, getYear, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  input: "h-9 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/15",
  btn: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-lg bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  well: "rounded-lg border border-slate-200 bg-slate-50/70",
};

type Tone = "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";
const toneClass: Record<Tone, string> = {
  brand: "bg-[#0B676E]/10 text-[#0B676E]",
  green: "bg-emerald-50 text-emerald-700",
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
}> = ({ title, value, subtitle, tone = "brand", progress, progressLabel }) => {
  const isZero = value === 0 || value === "0" || value === "0 Ar";
  const barColor =
    tone === "brand" ? "bg-[#0B676E]" :
    tone === "red" ? "bg-red-500" :
    tone === "amber" ? "bg-amber-500" :
    tone === "purple" ? "bg-violet-500" : "bg-slate-400";
  return (
    <div className={cn(ui.card, "p-4 min-w-0")}>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={cn("mt-1.5 text-[22px] leading-tight font-semibold tabular-nums truncate", isZero ? "text-slate-400" : "text-slate-900")}>{value}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 truncate">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

const TextButton: React.FC<{
  label: string; onClick: () => void;
  className?: string; disabled?: boolean;
}> = ({ label, onClick, className, disabled }) => (
  <Button
    variant="outline" size="sm"
    className={cn("h-8 px-2 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px]", className)}
    onClick={onClick} disabled={disabled}
  >
    {label}
  </Button>
);

/* ============================================================
   CONSTANTES & TYPES
============================================================ */
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), 'MMMM', { locale: fr })
);
const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), 'MMM', { locale: fr })
);

type MonthStatus = 'paid' | 'overdue' | 'pending' | 'no_invoice' | 'not_subscribed';

interface MonthData {
  month: number;
  status: MonthStatus;
  hasInvoice: boolean;
  invoiceId?: number;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  isOverdue?: boolean;
}

interface ClientRow {
  clientId: number;
  clientName: string;
  email: string;
  phone: string;
  planName: string;
  planPrice: number;
  months: MonthData[];
  stats: {
    totalPaid: number;
    totalOverdue: number;
    totalPending: number;
    totalAmount: number;
    paidAmount: number;
    overdueAmount: number;
    pendingAmount: number;
    paymentRate: number;
  };
}

interface InvoiceMatrixProps {
  onDownloadInvoice: (invoiceId: number, invoiceNumber: string) => void;
  onViewInvoiceDetails?: (invoiceId: number) => void;
  onMarkAsPaid?: (invoiceId: number, paymentMethod: 'cash' | 'mobile_money') => void;
}

interface RawClient extends Omit<ClientRow, 'months' | 'stats'> {
  months?: MonthData[];
  stats?: Partial<ClientRow['stats']>;
}

// Événement du calendrier : une date où un client paie (ou doit payer)
type CalendarEventKind = 'paid' | 'overdue' | 'pending';
interface CalendarEvent {
  key: string;
  kind: CalendarEventKind;
  date: Date;
  clientId: number;
  clientName: string;
  planName: string;
  amount?: number;
  invoiceId?: number;
  invoiceNumber?: string;
  method?: string;
  monthLabel: string;
}

const EVENT_LABEL: Record<CalendarEventKind, string> = { pending: 'À payer', overdue: 'En retard', paid: 'Payé' };
const EVENT_CHIP: Record<CalendarEventKind, string> = {
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  overdue: 'bg-red-100 text-red-800 hover:bg-red-200',
  paid: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
};
const EVENT_TONE: Record<CalendarEventKind, Tone> = { pending: 'amber', overdue: 'red', paid: 'green' };

/* ============================================================
   HELPERS
============================================================ */
const safeFormat = (date: string | Date | null | undefined, fmt: string, opts?: any): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  try { return format(d, fmt, opts); } catch { return "—"; }
};

const emptyMonth = (i: number): MonthData => ({
  month: i + 1,
  status: 'no_invoice',
  hasInvoice: false,
});

const normalizeMonths = (raw: MonthData[] | undefined): MonthData[] => {
  const out = Array.from({ length: 12 }, (_, i) => emptyMonth(i));
  if (!Array.isArray(raw)) return out;
  for (const m of raw) {
    if (!m) continue;
    const n = typeof m.month === 'number' ? m.month : NaN;
    if (!Number.isFinite(n) || n < 1 || n > 12) continue;
    out[n - 1] = { ...m, month: n };
  }
  return out;
};

const fmtAr = (n: number | undefined): string => {
  const v = Number(n) || 0;
  if (v === 0) return "0 Ar";
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M Ar`;
  if (Math.abs(v) >= 100_000) return `${Math.round(v / 1000)}k Ar`;
  return `${v.toLocaleString("fr-FR")} Ar`;
};

const getStatusConfig = (status: MonthStatus): {
  bg: string; border: string; text: string; label: string;
} => {
  switch (status) {
    case 'paid':
      return { bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', label: 'Payé' };
    case 'overdue':
      return { bg: 'bg-red-50 hover:bg-red-100', border: 'border-red-400', text: 'text-red-700', label: 'En retard' };
    case 'pending':
      return { bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', label: 'En attente' };
    case 'not_subscribed':
      return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-400', label: 'Non abonné' };
    case 'no_invoice':
    default:
      return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', label: 'Pas de facture' };
  }
};

const buildClient = (c: RawClient): ClientRow => {
  try {
    const months = normalizeMonths(c.months);
    const agg = months.reduce(
      (acc, m) => {
        if (!m.hasInvoice) return acc;
        const amt = Number(m.amount) || 0;
        acc.totalAmount += amt;
        if (m.status === 'paid') { acc.totalPaid += 1; acc.paidAmount += amt; }
        else if (m.status === 'overdue') { acc.totalOverdue += 1; acc.overdueAmount += amt; }
        else if (m.status === 'pending') { acc.totalPending += 1; acc.pendingAmount += amt; }
        return acc;
      },
      { totalPaid: 0, totalOverdue: 0, totalPending: 0, totalAmount: 0, paidAmount: 0, overdueAmount: 0, pendingAmount: 0 }
    );
    const totalInvoices = agg.totalPaid + agg.totalOverdue + agg.totalPending;
    const paymentRate = totalInvoices > 0 ? Math.round((agg.totalPaid / totalInvoices) * 100) : 0;

    return {
      clientId: Number(c.clientId) || 0,
      clientName: String(c.clientName || 'Client inconnu'),
      email: String(c.email || ''),
      phone: String(c.phone || ''),
      planName: String(c.planName || 'Standard'),
      planPrice: Number(c.planPrice) || 0,
      months,
      stats: { ...agg, paymentRate },
    };
  } catch {
    return {
      clientId: 0,
      clientName: 'Client invalide',
      email: '',
      phone: '',
      planName: 'Standard',
      planPrice: 0,
      months: Array.from({ length: 12 }, (_, i) => emptyMonth(i)),
      stats: { totalPaid: 0, totalOverdue: 0, totalPending: 0, totalAmount: 0, paidAmount: 0, overdueAmount: 0, pendingAmount: 0, paymentRate: 0 },
    };
  }
};

const exportToCsv = (clients: ClientRow[], year: number) => {
  try {
    const header = [
      'Client', 'Email', 'Téléphone', 'Plan', 'Prix/mois',
      ...MONTHS_SHORT.map((m) => `${m} ${year}`),
      'Total', 'Payé', 'En retard', 'En attente', 'Taux (%)',
    ];
    const rows = clients.map((c) => [
      c.clientName, c.email, c.phone, c.planName, String(c.planPrice),
      ...c.months.map((m) => {
        if (!m.hasInvoice) return '';
        const label = m.status === 'paid' ? 'Payé' : m.status === 'overdue' ? 'Retard' : m.status === 'pending' ? 'Attente' : '';
        return `${label} ${m.amount ?? 0}`.trim();
      }),
      String(c.stats.totalAmount), String(c.stats.paidAmount),
      String(c.stats.totalOverdue), String(c.stats.totalPending), String(c.stats.paymentRate),
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matrice-paiements-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // silently fail
  }
};

/* ============================================================
   CLIENT ROW (memoized)
============================================================ */
interface ClientRowViewProps {
  client: ClientRow;
  year: number;
  currentMonth: number;
  isCurrentYear: boolean;
  onDownloadInvoice: (invoiceId: number, invoiceNumber: string) => void;
  onViewInvoiceDetails?: (invoiceId: number) => void;
  onRequestMarkAsPaid?: (payload: { invoiceId: number; invoiceNumber?: string; method: 'cash' | 'mobile_money'; monthLabel: string; amountLabel: string }) => void;
}

const ClientRowView = memo(function ClientRowView({
  client, year, currentMonth, isCurrentYear,
  onDownloadInvoice, onViewInvoiceDetails, onRequestMarkAsPaid,
}: ClientRowViewProps) {
  const rateColor =
    client.stats.paymentRate >= 80 ? 'bg-emerald-500' :
    client.stats.paymentRate >= 50 ? 'bg-amber-500' :
    client.stats.paymentRate > 0 ? 'bg-red-500' : 'bg-slate-300';

  return (
    <tr className={cn(
      "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
      client.stats.totalOverdue > 0 && "bg-red-50/30"
    )}>
      <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", rateColor)} />
            <span className="font-semibold text-[13px] text-slate-900 truncate max-w-[180px]">
              {client.clientName}
            </span>
            {client.stats.totalOverdue > 0 && (
              <Pill tone="red">{client.stats.totalOverdue} retard{client.stats.totalOverdue > 1 ? 's' : ''}</Pill>
            )}
          </div>
          {client.email && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 min-w-0">
              <span className="truncate max-w-[120px]">{client.email}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Pill tone="brand">{client.planName}</Pill>
            <span className="text-[11px] text-slate-500">{fmtAr(client.planPrice)}/mois</span>
          </div>
        </div>
      </td>

      {client.months.map((m, idx) => {
        const config = getStatusConfig(m.status);
        const isCurrent = idx === currentMonth && isCurrentYear;
        const monthLabel = `${MONTHS[idx]} ${year}`;

        if (!m.hasInvoice || m.status === 'not_subscribed' || m.status === 'no_invoice') {
          return (
            <td key={idx} className="p-1.5 text-center">
              <div
                className={cn(ui.well, "min-h-[76px] flex items-center justify-center", isCurrent && "ring-1 ring-[#0B676E]/30")}
                aria-label={`${monthLabel} — pas de facture`}
              >
                <span className="text-[11px] text-slate-400 font-medium">-</span>
              </div>
            </td>
          );
        }

        return (
          <td key={idx} className="p-1.5 text-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`${monthLabel} — ${config.label} — ${fmtAr(m.amount)}`}
                  className={cn(
                    "w-full p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center gap-1 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B676E]/40",
                    config.bg, config.border, m.status === 'overdue' && "shadow-sm",
                    isCurrent && "ring-2 ring-[#0B676E] ring-offset-2"
                  )}
                >
                  <div className={cn("font-semibold text-[12px] tabular-nums", config.text)}>{fmtAr(m.amount)}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10.5px] font-medium">{config.label}</span>
                  </div>
                  {m.dueDate && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      Éch. {safeFormat(m.dueDate, 'dd/MM')}
                    </div>
                  )}
                </button>
              </PopoverTrigger>

              <PopoverContent className="w-64 p-3 rounded-lg border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]" side="top" align="center">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[13px] text-slate-900">{monthLabel}</h4>
                    <Pill tone={m.status === 'paid' ? 'green' : m.status === 'overdue' ? 'red' : m.status === 'pending' ? 'amber' : 'slate'}>{config.label}</Pill>
                  </div>
                  <div className="text-[12px]">
                    <p className="font-semibold text-slate-800">Facture #{m.invoiceNumber ?? '—'}</p>
                    <p className="text-slate-600 tabular-nums">{fmtAr(m.amount)}</p>
                  </div>
                  {m.dueDate && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium">Échéance :</span> {safeFormat(m.dueDate, 'dd MMM yyyy', { locale: fr })}
                    </div>
                  )}
                  {m.paidDate && (
                    <div className="text-[11px] text-emerald-600">
                      <span className="font-medium">Payé le :</span> {safeFormat(m.paidDate, 'dd MMM yyyy', { locale: fr })}
                    </div>
                  )}
                  {m.paymentMethod && m.status === 'paid' && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium">Mode :</span> {m.paymentMethod === 'cash' ? 'Espèces' : 'Mobile Money'}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                    {m.invoiceId && onViewInvoiceDetails && (
                      <Button size="sm" variant="ghost" className="justify-start h-8 text-[11.5px] hover:bg-slate-50" onClick={() => onViewInvoiceDetails(m.invoiceId!)}>
                        Voir détails
                      </Button>
                    )}
                    {m.invoiceId && m.invoiceNumber && (
                      <Button size="sm" variant="ghost" className="justify-start h-8 text-[11.5px] hover:bg-slate-50" onClick={() => onDownloadInvoice(m.invoiceId!, m.invoiceNumber!)}>
                        Télécharger PDF
                      </Button>
                    )}
                    {(m.status === 'pending' || m.status === 'overdue') && m.invoiceId && onRequestMarkAsPaid && (
                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <Button size="sm" variant="ghost" className="justify-start h-8 text-[11.5px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 w-full"
                          onClick={() => onRequestMarkAsPaid({ invoiceId: m.invoiceId!, invoiceNumber: m.invoiceNumber, method: 'cash', monthLabel, amountLabel: fmtAr(m.amount) })}>
                          Marquer payé (Espèces)
                        </Button>
                        <Button size="sm" variant="ghost" className="justify-start h-8 text-[11.5px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full"
                          onClick={() => onRequestMarkAsPaid({ invoiceId: m.invoiceId!, invoiceNumber: m.invoiceNumber, method: 'mobile_money', monthLabel, amountLabel: fmtAr(m.amount) })}>
                          Marquer payé (Mobile Money)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </td>
        );
      })}

      <td className="p-2 bg-slate-50/40 border-l border-slate-200">
        <div className="space-y-1 text-center">
          <div className="text-[12px] font-semibold text-slate-800 tabular-nums">
            {client.stats.totalAmount > 0 ? fmtAr(client.stats.totalAmount) : '-'}
          </div>
          <div className="flex justify-center gap-1.5">
            <span className="text-[10.5px] text-emerald-600 font-medium" title="Payées">P {client.stats.totalPaid}</span>
            <span className="text-[10.5px] text-red-600 font-medium" title="En retard">R {client.stats.totalOverdue}</span>
            <span className="text-[10.5px] text-amber-600 font-medium" title="En attente">A {client.stats.totalPending}</span>
          </div>
          <div className="mt-1.5">
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", rateColor)} style={{ width: `${client.stats.paymentRate}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">{client.stats.paymentRate}%</div>
          </div>
        </div>
      </td>
    </tr>
  );
});

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export function InvoiceMatrix({ onDownloadInvoice, onViewInvoiceDetails, onMarkAsPaid }: InvoiceMatrixProps) {
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'has_overdue' | 'has_pending' | 'all_paid'>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'calendar'>('matrix');

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    invoiceId: number; invoiceNumber?: string;
    method: 'cash' | 'mobile_money';
    monthLabel: string; amountLabel: string;
  } | null>(null);

  const { data: matrixData, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['invoiceMatrix', selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/matrix/${selectedYear}`, { credentials: 'include' });
      if (!res.ok) {
        const msg = res.status === 401 ? 'Non autorisé' : res.status === 403 ? 'Accès refusé' : res.status >= 500 ? 'Erreur serveur' : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      const json = await res.json();
      if (!json || typeof json !== 'object') return { clients: [] };
      if (!Array.isArray(json.clients)) return { clients: [] };
      return json;
    },
    retry: 1,
    staleTime: 60_000,
  });

  const allClients = useMemo<ClientRow[]>(() => {
    try {
      const raw = (matrixData?.clients ?? []) as RawClient[];
      if (!Array.isArray(raw)) return [];
      return raw.filter(Boolean).map(buildClient);
    } catch {
      return [];
    }
  }, [matrixData]);

  const filteredClients = useMemo<ClientRow[]>(() => {
    let list = allClients;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.clientName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.planName?.toLowerCase().includes(q)
      );
    }
    switch (statusFilter) {
      case 'has_overdue': list = list.filter((c) => c.stats.totalOverdue > 0); break;
      case 'has_pending': list = list.filter((c) => c.stats.totalPending > 0); break;
      case 'all_paid': list = list.filter((c) => c.stats.totalPaid > 0 && c.stats.totalOverdue === 0 && c.stats.totalPending === 0); break;
    }
    return list;
  }, [allClients, searchQuery, statusFilter]);

  const globalStats = useMemo(() => {
    return allClients.reduce((acc, c) => ({
      totalClients: acc.totalClients + 1,
      totalPaid: acc.totalPaid + c.stats.totalPaid,
      totalOverdue: acc.totalOverdue + c.stats.totalOverdue,
      totalPending: acc.totalPending + c.stats.totalPending,
      totalAmount: acc.totalAmount + c.stats.totalAmount,
      paidAmount: acc.paidAmount + c.stats.paidAmount,
      overdueAmount: acc.overdueAmount + c.stats.overdueAmount,
      pendingAmount: acc.pendingAmount + c.stats.pendingAmount,
    }), { totalClients: 0, totalPaid: 0, totalOverdue: 0, totalPending: 0, totalAmount: 0, paidAmount: 0, overdueAmount: 0, pendingAmount: 0 });
  }, [allClients]);

  const monthlyTotals = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const rows = filteredClients.map((c) => c.months[idx]).filter((m) => m?.hasInvoice);
      return {
        total: rows.length,
        paid: rows.filter((m) => m.status === 'paid').length,
        overdue: rows.filter((m) => m.status === 'overdue').length,
        pending: rows.filter((m) => m.status === 'pending').length,
        revenue: rows.reduce((s, m) => s + (m.status === 'paid' ? m.amount || 0 : 0), 0),
      };
    });
  }, [filteredClients]);

  /* ---- CALENDRIER ---- */
  const clientsToShowInCalendar = useMemo(() => {
    if (selectedClientId) {
      return filteredClients.filter(c => c.clientId === selectedClientId);
    }
    return filteredClients;
  }, [filteredClients, selectedClientId]);

  // Toutes les dates de paiement : échéance si pas encore payé, date de règlement si payé
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    try {
      return clientsToShowInCalendar.flatMap(client =>
        client.months.flatMap((m, idx): CalendarEvent[] => {
          if (!m.hasInvoice) return [];
          const kind: CalendarEventKind | null =
            m.status === 'paid' ? 'paid' : m.status === 'overdue' ? 'overdue' : m.status === 'pending' ? 'pending' : null;
          if (!kind) return [];
          const raw = kind === 'paid' ? (m.paidDate || m.dueDate) : m.dueDate;
          if (!raw) return [];
          const date = new Date(raw);
          if (isNaN(date.getTime())) return [];
          return [{
            key: `${client.clientId}-${idx}-${m.invoiceId ?? ''}`,
            kind, date,
            clientId: client.clientId,
            clientName: client.clientName,
            planName: client.planName,
            amount: m.amount,
            invoiceId: m.invoiceId,
            invoiceNumber: m.invoiceNumber,
            method: m.paymentMethod,
            monthLabel: `${MONTHS[idx]} ${selectedYear}`,
          }];
        })
      );
    } catch {
      return [];
    }
  }, [clientsToShowInCalendar, selectedYear]);

  // Événements du mois affiché (résumé + liste)
  const monthEvents = useMemo(
    () => calendarEvents
      .filter(e => e.date.getMonth() === calendarDate.getMonth() && e.date.getFullYear() === calendarDate.getFullYear())
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [calendarEvents, calendarDate]
  );
  const monthSummary = useMemo(() => {
    const sum = (k: CalendarEventKind) => {
      const list = monthEvents.filter(e => e.kind === k);
      return { count: list.length, amount: list.reduce((s, e) => s + (e.amount || 0), 0) };
    };
    return { pending: sum('pending'), overdue: sum('overdue'), paid: sum('paid') };
  }, [monthEvents]);

  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const totalInvoices = globalStats.totalPaid + globalStats.totalOverdue + globalStats.totalPending;
  const currentMonth = new Date().getMonth();
  const isCurrentYear = selectedYear === getYear(new Date());
  const hasFilters = searchQuery.length > 0 || statusFilter !== 'all';

  const requestMarkAsPaid = useCallback((payload: any) => setPendingAction(payload), []);
  const confirmMarkAsPaid = useCallback(() => {
    if (!pendingAction || !onMarkAsPaid) return;
    onMarkAsPaid(pendingAction.invoiceId, pendingAction.method);
    setPendingAction(null);
  }, [pendingAction, onMarkAsPaid]);
  const clearFilters = useCallback(() => { setSearchQuery(''); setStatusFilter('all'); }, []);
  const handleExport = useCallback(() => exportToCsv(filteredClients, selectedYear), [filteredClients, selectedYear]);

  // Détail d'un événement (popover) — réutilisé par la cellule et la liste
  const renderEventDetails = (e: CalendarEvent) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[12.5px] text-slate-900 truncate">{e.clientName}</span>
        <Pill tone={EVENT_TONE[e.kind]}>{EVENT_LABEL[e.kind]}</Pill>
      </div>
      <div className="text-[11px] text-slate-600 flex flex-col gap-1">
        <span className="tabular-nums font-semibold text-slate-800">{fmtAr(e.amount)}</span>
        <span>{e.kind === 'paid' ? 'Payé le' : 'À payer le'} : {safeFormat(e.date, 'dd MMMM yyyy', { locale: fr })}</span>
        <span>Facture : {e.invoiceNumber || '-'} ({e.monthLabel})</span>
        <span>Plan : {e.planName}</span>
        {e.kind === 'paid' && e.method && <span>Mode : {e.method === 'cash' ? 'Espèces' : 'Mobile Money'}</span>}
      </div>
      {(e.kind === 'pending' || e.kind === 'overdue') && e.invoiceId && onMarkAsPaid && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
          <Button size="sm" variant="ghost" className="justify-start h-8 text-[11.5px] text-emerald-600 hover:bg-emerald-50"
            onClick={() => requestMarkAsPaid({ invoiceId: e.invoiceId!, invoiceNumber: e.invoiceNumber, method: 'cash', monthLabel: e.monthLabel, amountLabel: fmtAr(e.amount) })}>
            Marquer payé (Espèces)
          </Button>
          <Button size="sm" variant="ghost" className="justify-start h-8 text-[11.5px] text-blue-600 hover:bg-blue-50"
            onClick={() => requestMarkAsPaid({ invoiceId: e.invoiceId!, invoiceNumber: e.invoiceNumber, method: 'mobile_money', monthLabel: e.monthLabel, amountLabel: fmtAr(e.amount) })}>
            Marquer payé (Mobile Money)
          </Button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn(ui.card, "p-12 flex items-center justify-center")}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B676E] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B676E] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B676E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-[12.5px] text-slate-500">Chargement de la matrice…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(ui.card, "p-12 text-center")}>
        <p className="text-[13px] font-semibold text-slate-800">Impossible de charger les données</p>
        <p className="text-[11.5px] text-slate-500 mt-1">{(error as Error)?.message || 'Une erreur est survenue.'}</p>
        <Button onClick={() => refetch()} className={cn(ui.btnPrimary, "mt-4")} disabled={isFetching}>
          {isFetching ? 'Chargement…' : 'Réessayer'}
        </Button>
      </div>
    );
  }

  if (allClients.length === 0) {
    return (
      <div className={cn(ui.card, "p-12 text-center")}>
        <p className="text-[13px] font-semibold text-slate-800">Aucune donnée disponible</p>
        <p className="text-[11.5px] text-slate-500 mt-1">Aucun client avec factures pour {selectedYear}</p>
        <Button onClick={() => setSelectedYear(getYear(new Date()))} className={cn(ui.btnPrimary, "mt-4")}>Revenir à l'année en cours</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">

      {/* EN-TÊTE */}
      <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4")}>
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold text-slate-900">Tableau de Bord des Paiements {selectedYear}</h2>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} • {totalInvoices} facture{totalInvoices > 1 ? 's' : ''}
            {hasFilters && <span className="text-slate-400"> (filtré)</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mr-1">
            <Button variant="ghost" size="sm" className={cn("h-7 px-2 text-[11px] shadow-none", viewMode === 'matrix' ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-white/60")} onClick={() => setViewMode('matrix')}>
              Matrice
            </Button>
            <Button variant="ghost" size="sm" className={cn("h-7 px-2 text-[11px] shadow-none", viewMode === 'calendar' ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:bg-white/60")} onClick={() => setViewMode('calendar')}>
              Calendrier
            </Button>
          </div>
          <TextButton label="Exporter CSV" onClick={handleExport} disabled={filteredClients.length === 0} />
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <TextButton label="Année -1" onClick={() => setSelectedYear(selectedYear - 1)} />
          <span className="text-[14px] font-semibold text-slate-900 px-2 tabular-nums">{selectedYear}</span>
          <TextButton label="Année +1" onClick={() => setSelectedYear(selectedYear + 1)} />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI title="Clients actifs" value={globalStats.totalClients} subtitle={`Année ${selectedYear}`} tone="brand" />
        <MiniKPI title="Payées" value={globalStats.totalPaid} subtitle={`sur ${totalInvoices} factures`} tone="green" />
        <MiniKPI title="En retard" value={globalStats.totalOverdue} subtitle={globalStats.totalOverdue > 0 ? 'Action requise' : 'Aucun retard'} tone="red" />
        <MiniKPI title="Revenus collectés" value={fmtAr(globalStats.paidAmount)} subtitle={`sur ${fmtAr(globalStats.totalAmount)}`} tone="purple" progress={globalStats.totalAmount > 0 ? (globalStats.paidAmount / globalStats.totalAmount) * 100 : 0} progressLabel="Taux de recouvrement" />
      </div>

      {/* VUE CONDITIONNELLE */}
      {viewMode === 'matrix' ? (
        <>
          {/* FILTRES */}
          <div className={ui.card}>
            <div className="p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Input placeholder="Rechercher un client…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(ui.input, "text-[12.5px]")} />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className={cn(ui.input, "w-full sm:w-[180px]")}><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="has_overdue">Avec retards</SelectItem>
                    <SelectItem value="has_pending">Avec en attente</SelectItem>
                    <SelectItem value="all_paid">Tout payé</SelectItem>
                  </SelectContent>
                </Select>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:bg-red-50 text-[11.5px]">Effacer</Button>}
              </div>
            </div>
          </div>

          <div className={ui.card}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1400px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="p-3 text-left font-semibold text-slate-700 sticky left-0 bg-slate-50/80 backdrop-blur z-20 min-w-[220px] border-r border-slate-200">
                      <div className="text-[12px] uppercase tracking-wider">Client</div>
                    </th>
                    {MONTHS_SHORT.map((month, idx) => (
                      <th key={idx} className={cn("p-2 text-center font-semibold min-w-[120px] border-x border-slate-100", idx === currentMonth && isCurrentYear && "bg-[#0B676E]/5")}>
                        <div className={cn("text-[12px]", idx === currentMonth && isCurrentYear ? "text-[#0B676E]" : "text-slate-700")}>{month}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{selectedYear}</div>
                      </th>
                    ))}
                    <th className="p-2 text-center font-semibold bg-slate-50/60 min-w-[110px] border-l border-slate-200 text-[12px] uppercase tracking-wider text-slate-700">Total</th>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/30">
                    <td className="p-2 text-[11px] font-medium text-slate-600 sticky left-0 bg-slate-50/80 backdrop-blur z-20 border-r border-slate-200">
                      Totaux mensuels
                    </td>
                    {monthlyTotals.map((total, idx) => (
                      <td key={idx} className="p-2 text-center">
                        <div className="text-[10.5px] space-y-0.5">
                          <div className="flex justify-center gap-1.5">
                            <span className="text-emerald-600">P {total.paid}</span>
                            <span className="text-red-600">R {total.overdue}</span>
                            <span className="text-amber-600">A {total.pending}</span>
                          </div>
                          {total.revenue > 0 && <div className="text-[10.5px] font-semibold text-[#0B676E] tabular-nums">{fmtAr(total.revenue)}</div>}
                        </div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-semibold text-slate-800 bg-slate-50/30 text-[11px] tabular-nums">
                      {monthlyTotals.reduce((s, t) => s + t.revenue, 0) > 0 ? fmtAr(monthlyTotals.reduce((s, t) => s + t.revenue, 0)) : '-'}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center">
                        <p className="text-[13px] font-semibold text-slate-800">Aucun client ne correspond aux filtres</p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">Effacer les filtres</Button>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <ClientRowView key={client.clientId} client={client} year={selectedYear} currentMonth={currentMonth} isCurrentYear={isCurrentYear}
                        onDownloadInvoice={onDownloadInvoice} onViewInvoiceDetails={onViewInvoiceDetails} onRequestMarkAsPaid={onMarkAsPaid ? requestMarkAsPaid : undefined} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* LÉGENDE uniquement */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border-t border-slate-200 text-[11.5px]">
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <span><span className="font-semibold text-emerald-600">P</span> = Payé</span>
                <span><span className="font-semibold text-red-600">R</span> = En retard</span>
                <span><span className="font-semibold text-amber-600">A</span> = En attente</span>
                <span className="text-slate-400">|</span>
                <span><span className="font-semibold text-slate-500">-</span> = Pas de facture</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ================= VUE CALENDRIER (MASTER-DETAIL) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

          {/* SIDEBAR: LISTE DES CLIENTS */}
          <div className={cn(ui.card, "flex flex-col h-[600px]")}>
            <div className="p-3 border-b border-slate-100">
              <div className="relative mb-2">
                <Input placeholder="Rechercher un client…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(ui.input, "text-[12px] bg-slate-50")} />
              </div>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[11.5px] text-slate-600" onClick={() => setSelectedClientId(null)}>
                Tous les clients (Vue Globale)
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredClients.map((c) => (
                <button
                  key={c.clientId}
                  onClick={() => setSelectedClientId(c.clientId)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors border border-transparent",
                    selectedClientId === c.clientId ? "bg-slate-100 border-slate-200 shadow-sm" : "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0",
                    c.stats.paymentRate >= 80 ? "bg-emerald-500" : c.stats.paymentRate >= 50 ? "bg-amber-500" : c.stats.paymentRate > 0 ? "bg-red-500" : "bg-slate-300"
                  )}>
                    {c.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-slate-900 truncate">{c.clientName}</p>
                    <p className="text-[10.5px] text-slate-500 truncate">{c.email || c.phone || c.planName}</p>
                  </div>
                </button>
              ))}
              {filteredClients.length === 0 && (
                <div className="text-center p-4 text-[11.5px] text-slate-500">Aucun client trouvé.</div>
              )}
            </div>
          </div>

          {/* MAIN: CALENDRIER */}
          <div className={cn(ui.card, "p-4 flex flex-col h-[600px] overflow-y-auto")}>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {selectedClientId
                    ? filteredClients.find(c => c.clientId === selectedClientId)?.clientName
                    : 'Dates de paiement des clients'}
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5 capitalize">
                  {safeFormat(calendarDate, 'MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="h-8 px-2 rounded-lg text-[11px]">
                  Préc.
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date())} className="h-8 px-3 text-[11.5px] rounded-lg">Aujourd'hui</Button>
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="h-8 px-2 rounded-lg text-[11px]">
                  Suiv.
                </Button>
              </div>
            </div>

            {/* RÉSUMÉ DU MOIS + LÉGENDE */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                <p className="text-[10.5px] font-medium text-amber-700">À payer ce mois</p>
                <p className="text-[13px] font-semibold text-amber-900 tabular-nums">{monthSummary.pending.count} · {fmtAr(monthSummary.pending.amount)}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2">
                <p className="text-[10.5px] font-medium text-red-700">En retard</p>
                <p className="text-[13px] font-semibold text-red-900 tabular-nums">{monthSummary.overdue.count} · {fmtAr(monthSummary.overdue.amount)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                <p className="text-[10.5px] font-medium text-emerald-700">Payé</p>
                <p className="text-[13px] font-semibold text-emerald-900 tabular-nums">{monthSummary.paid.count} · {fmtAr(monthSummary.paid.amount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 mb-2 rounded-t-lg">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div key={day} className="py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr gap-1.5">
              {calendarDays.map((day) => {
                const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                const isToday = isSameDay(day, new Date());
                const dayEvents = calendarEvents.filter(e => isSameDay(e.date, day));
                const dayTone: CalendarEventKind | null =
                  dayEvents.some(e => e.kind === 'overdue') ? 'overdue' :
                  dayEvents.some(e => e.kind === 'pending') ? 'pending' :
                  dayEvents.length > 0 ? 'paid' : null;

                return (
                  <div key={day.toString()} className={cn(
                    "min-h-[84px] p-1.5 border rounded-lg transition-colors flex flex-col",
                    !isCurrentMonth ? "bg-slate-50/50 text-slate-400 border-slate-100" :
                      dayTone === 'overdue' ? "bg-red-50/70 border-red-200" :
                      dayTone === 'pending' ? "bg-amber-50/70 border-amber-200" :
                      dayTone === 'paid' ? "bg-emerald-50/60 border-emerald-200" : "bg-white border-slate-100",
                    isToday && "ring-2 ring-[#0B676E]/30 border-[#0B676E]/40"
                  )}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium shrink-0",
                        isToday ? "bg-[#0B676E] text-white" : "text-slate-700",
                        !isCurrentMonth && "text-slate-400"
                      )}>
                        {format(day, 'd')}
                      </div>
                      {isCurrentMonth && dayEvents.length > 0 && (
                        <span className={cn("rounded px-1 text-[9px] font-semibold tabular-nums",
                          dayTone === 'overdue' ? "bg-red-200 text-red-800" : dayTone === 'pending' ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800")}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <Popover key={e.key}>
                          <PopoverTrigger asChild>
                            <div className={cn("text-[10px] rounded px-1.5 py-0.5 cursor-pointer truncate transition-colors font-medium", EVENT_CHIP[e.kind])}>
                              {selectedClientId ? fmtAr(e.amount) : e.clientName}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 rounded-lg border-slate-200 bg-white shadow-xl" side="top">
                            {renderEventDetails(e)}
                          </PopoverContent>
                        </Popover>
                      ))}

                      {dayEvents.length > 3 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="text-[10px] text-slate-500 font-medium cursor-pointer hover:underline pl-1">+ {dayEvents.length - 3} Plus</div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3 max-h-64 overflow-y-auto">
                            <h4 className="text-[12px] font-semibold mb-2 border-b pb-1">
                              Paiements du {format(day, 'dd MMMM', { locale: fr })} ({dayEvents.length})
                            </h4>
                            <div className="space-y-2">
                              {dayEvents.map((e) => (
                                <div key={e.key} className="flex items-center justify-between gap-2 text-[11px]">
                                  <span className="truncate">{e.clientName}</span>
                                  <span className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-medium tabular-nums">{fmtAr(e.amount)}</span>
                                    <Pill tone={EVENT_TONE[e.kind]}>{EVENT_LABEL[e.kind]}</Pill>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LÉGENDE */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-300" />Date de paiement prévue</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" />Date dépassée (en retard)</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />Paiement effectué</span>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MARQUER PAYÉ */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Marquer la facture{pendingAction?.invoiceNumber ? ` #${pendingAction.invoiceNumber}` : ''} comme payée
              {pendingAction?.monthLabel ? ` pour ${pendingAction.monthLabel}` : ''}
              {pendingAction?.amountLabel ? ` (${pendingAction.amountLabel})` : ''} via <strong>{pendingAction?.method === 'cash' ? 'Espèces' : 'Mobile Money'}</strong> ?
              <br /><span className="text-[11.5px] text-slate-500">Cette action est irréversible sans intervention manuelle.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkAsPaid} className="bg-[#0B676E] hover:bg-[#09565C]">Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
