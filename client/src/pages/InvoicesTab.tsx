// client/src/pages/InvoicesTab.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText, Plus, Euro, AlertTriangle, CheckCircle, Repeat, Filter, Download,
  ListFilter, FilePlus, X, Smartphone, Landmark, CreditCard, Wallet, FilterX,
  TrendingUp, TrendingDown, Edit, Loader2, CalendarIcon, Info, Search, ChevronsUpDown,
  Users, CreditCard as CreditCardIcon, BarChart3, Sparkles, Mail, Phone, User, Clock,
  ArrowUpRight, ArrowDownRight, MoreVertical, Eye, Trash2, Send, Copy, QrCode,
  Banknote, Smartphone as SmartphoneIcon, Check, ChevronRight, ExternalLink, Bell,
  List, Table2, LayoutGrid, Receipt, Printer, RefreshCw, ChevronLeft, DollarSign,
  PieChart, Zap, Shield, Gift, Star, TrendingUp as TrendingUpIcon, Activity
} from "lucide-react";
import { format, isBefore, parseISO, startOfMonth, endOfMonth, subMonths, differenceInDays, addDays, isAfter, getYear, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { InvoiceMatrix } from "./InvoiceMatrix";

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
// INTERFACES
// ============================================================

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  pricePerMonth: string;
  description?: string;
}

interface Subscription {
  id: number;
  clientId: number;
  planId: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

interface NewContractData {
  clientId: number;
  subscriptionId?: number;
  title: string;
  startDate?: Date;
  endDate?: Date;
  status: "draft";
  isAutoRenew: boolean;
  notes?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId: number;
  subscriptionId?: number;
  amount: string;
  totalAmount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: string;
  paymentMethod?: "cash" | "mobile_money" | null;
  description?: string | null;
  createdAt: string;
  paidDate?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  planName?: string;
}

interface EditInvoiceData {
  id?: number;
  clientId: number;
  invoiceNumber: string;
  amount: number;
  totalAmount: number;
  currency: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date | null;
  paymentMethod?: "cash" | "mobile_money" | null;
  description?: string | null;
  billingPeriodStart?: Date | null;
  billingPeriodEnd?: Date | null;
}

// ============================================================
// COMPOSANTS AIDE NEOMORPHIQUES
// ============================================================

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace("MGA", "Ar");
};

const EmptyState = ({ icon, title, description, action }: { 
  icon?: React.ReactElement; 
  title: string; 
  description: string; 
  action?: React.ReactNode;
}) => {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] mb-4">
        {icon && React.cloneElement(icon, { className: "h-10 w-10 text-[#0B676E]" })}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
};

const PaymentMethodBadge = ({ method }: { method: "cash" | "mobile_money" | null | undefined }) => {
  if (!method) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-normal text-xs px-2 py-0.5 border-0",
        method === "cash" 
          ? "bg-[#eef2f5] text-slate-700 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]"
          : "bg-[#eef2f5] text-slate-700 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]"
      )}
    >
      <div className="flex items-center gap-1">
        {method === "cash" ? (
          <>
            <Banknote className="h-3 w-3" />
            <span>Espèces</span>
          </>
        ) : (
          <>
            <SmartphoneIcon className="h-3 w-3" />
            <span>Mobile Money</span>
          </>
        )}
      </div>
    </Badge>
  );
};

const StatusBadge = ({ status, paymentMethod }: { status: string; paymentMethod?: "cash" | "mobile_money" | null }) => {
  const statusConfig = {
    paid: {
      label: "Payé",
      className: "bg-emerald-100 text-emerald-800 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
      icon: <Check className="h-3 w-3" />
    },
    pending: {
      label: "En attente",
      className: "bg-amber-100 text-amber-800 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
      icon: <Clock className="h-3 w-3" />
    },
    overdue: {
      label: "En retard",
      className: "bg-red-100 text-red-800 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
      icon: <AlertTriangle className="h-3 w-3" />
    },
    cancelled: {
      label: "Annulé",
      className: "bg-slate-100 text-slate-800 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
      icon: <X className="h-3 w-3" />
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Badge variant="outline" className={cn("gap-1.5 font-medium px-2.5 py-1", config.className)}>
        {config.icon}
        <span>{config.label}</span>
      </Badge>
      {status === "paid" && paymentMethod && (
        <PaymentMethodBadge method={paymentMethod} />
      )}
    </div>
  );
};

// ============================================================
// CARTE DE TABLEAU DE BORD NEOMORPHIQUE
// ============================================================
const DashboardCard = ({ title, value, description, icon, trend, variant = "default", loading = false, onClick, alertCount = 0 }: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactElement;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "destructive" | "success" | "info" | "warning";
  loading?: boolean;
  onClick?: () => void;
  alertCount?: number;
}) => {
  const isUp = trend === "up";
  
  const variantStyles = {
    default: {
      iconBg: "bg-[#0B676E]/10",
      iconColor: "text-[#0B676E]",
      value: "text-slate-900",
      description: "text-slate-500",
    },
    destructive: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      value: "text-slate-900",
      description: "text-slate-500",
    },
    success: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      value: "text-slate-900",
      description: "text-slate-500",
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      value: "text-slate-900",
      description: "text-slate-500",
    },
    warning: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      value: "text-slate-900",
      description: "text-slate-500",
    }
  };

  const styles = variantStyles[variant as keyof typeof variantStyles] || variantStyles.default;

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
          <div className="flex items-center gap-1">
            <div className="relative">
              <div className={cn("p-1 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]", styles.iconBg)}>
                {React.cloneElement(icon, { className: cn("h-4 w-4", styles.iconColor) })}
              </div>
              {alertCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                  <span className="text-white text-[10px] font-bold px-1">{alertCount > 9 ? '9+' : alertCount}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <div className="flex items-baseline gap-1">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <h3 className={cn("text-2xl font-bold", styles.value)}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </h3>
                )}
                {trend && trend !== "neutral" && !loading && (
                  <Badge
                    className={cn(
                      "gap-1 px-2 py-0.5 text-xs font-medium border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                      isUp ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    )}
                  >
                    {isUp ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{isUp ? "+" : ""}</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p className={cn("text-sm", styles.description)}>{description}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT DE PAGINATION NEOMORPHIQUE
// ============================================================
const PaginationComponent = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-white/40">
      <div className="text-sm text-slate-500 order-2 sm:order-1">
        Affichage de <span className="font-medium text-slate-700">{startItem}</span> à <span className="font-medium text-slate-700">{endItem}</span> sur <span className="font-medium text-slate-700">{totalItems}</span> facture(s)
      </div>
      <div className="flex flex-wrap gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(NEO.button, "gap-1 h-9")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>
        
        <div className="hidden md:flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
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
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-9 h-9 p-0",
                  currentPage === pageNum ? NEO.buttonPrimary : NEO.button
                )}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <div className="flex md:hidden items-center px-4 py-1.5 bg-[#eef2f5] rounded-2xl text-sm font-medium text-slate-600 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
          Page {currentPage} / {totalPages}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(NEO.button, "gap-1 h-9")}
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1 order-3">
        <span className="text-sm text-slate-500 hidden sm:inline">Lignes:</span>
        <Select value={itemsPerPage.toString()} onValueChange={() => onPageChange(1)}>
          <SelectTrigger className={cn(NEO.input, "w-[80px] h-9")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ============================================================
// SECTION DES FILTRES NEOMORPHIQUE
// ============================================================
const FilterSection = ({ 
  searchQuery, setSearchQuery, 
  invoiceFilter, setInvoiceFilter, 
  invoiceMonthFilter, setInvoiceMonthFilter,
  calendarMonth, setCalendarMonth,
  unpaidCount, unpaidAmount,
  onReset,
  filteredCount,
  totalCount,
  showInvoiceCalendar,
  setShowInvoiceCalendar
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  invoiceFilter: string;
  setInvoiceFilter: (v: string) => void;
  invoiceMonthFilter: string;
  setInvoiceMonthFilter: (v: string) => void;
  calendarMonth: Date;
  setCalendarMonth: (date: Date) => void;
  unpaidCount: number;
  unpaidAmount: number;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
  showInvoiceCalendar: boolean;
  setShowInvoiceCalendar: (v: boolean) => void;
}) => {
  const selectedMonthLabel = invoiceMonthFilter !== "all"
    ? (() => {
        const [year, month] = invoiceMonthFilter.split("-").map(Number);
        if (!year || !month) return "";
        return format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: fr });
      })()
    : "Toute période";

  const handleCalendarMonthChange = (date: Date) => {
    setCalendarMonth(date);
    setInvoiceMonthFilter(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    handleCalendarMonthChange(date);
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    handleCalendarMonthChange(today);
  };

  return (
    <div className={NEO.card}>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-1 text-xl font-semibold text-slate-800">
              <Filter className="h-5 w-5 text-[#0B676E]" />
              Filtres
              <Badge className="ml-2 bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                {filteredCount} / {totalCount}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Affinez votre liste de factures
              {invoiceMonthFilter === "all"
                ? " • Toute période"
                : ` • ${selectedMonthLabel}`}
              {invoiceFilter !== "all" && ` • ${invoiceFilter === "overdue" ? "En retard" : invoiceFilter === "pending" ? "En attente" : invoiceFilter === "paid" ? "Payé" : "Annulé"}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInvoiceMonthFilter("all")}
              className={cn(
                NEO.button,
                invoiceMonthFilter === "all" && "ring-2 ring-[#0B676E]/30"
              )}
            >
              <List className="h-4 w-4 mr-2" />
              Toute période
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className={cn(NEO.button, "text-slate-500 hover:text-red-600")}
            >
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par n° facture, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(NEO.input, "pl-10 h-10")}
            />
          </div>

          <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <SelectTrigger className={cn(NEO.input, "h-10")}>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 px-4 h-10 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
            <CalendarIcon className="h-4 w-4 text-[#0B676E] flex-shrink-0" />
            <span className="text-sm font-medium text-slate-700 capitalize truncate">
              {selectedMonthLabel}
            </span>
          </div>
        </div>

        {/* CALENDRIER */}
        <div className="mt-3">
          {!showInvoiceCalendar ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInvoiceCalendar(true)}
                className={cn(NEO.button, "h-8 px-3 text-xs gap-2")}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-[#0B676E]" />
                Afficher le calendrier
              </Button>

              <span className="text-xs text-slate-500 capitalize truncate">
                {selectedMonthLabel}
              </span>
            </div>
          ) : (
            <div className="w-fit max-w-full rounded-xl bg-[#eef2f5] p-1.5
              shadow-[6px_6px_12px_#b8c2ca,-6px_-6px_12px_#ffffff]">

              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[9px] font-medium text-slate-600">
                  Période
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInvoiceCalendar(false)}
                  className="h-5 w-5 p-0 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50"
                  aria-label="Fermer le calendrier"
                  title="Fermer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-1 mb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInvoiceMonthFilter("all")}
                  className={cn(NEO.button, "h-5 px-1.5 text-[8px] rounded-md")}
                >
                  Toutes
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentMonth}
                  className={cn(NEO.button, "h-5 px-1.5 text-[8px] rounded-md")}
                >
                  Aujourd'hui
                </Button>
              </div>

              <Calendar
                mode="single"
                month={calendarMonth}
                onMonthChange={handleCalendarMonthChange}
                onSelect={handleCalendarSelect}
                locale={fr}
                className="w-[210px] p-0 m-0 bg-transparent text-[8px]"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-0",
                  caption: "flex justify-center pt-0 pb-0.5 relative items-center",
                  caption_label: "text-[10px] font-semibold capitalize",
                  nav: "flex items-center gap-0",
                  nav_button:
                    "h-5 w-5 p-0 rounded-md text-slate-600 hover:bg-slate-200",
                  table: "w-full border-collapse m-0",
                  head_row: "flex w-full mb-0",
                  head_cell:
                    "w-[27px] p-0 text-[7px] leading-3 font-medium text-slate-400 text-center capitalize",
                  row: "flex w-full mt-0",
                  cell: "w-[27px] h-[22px] p-0 text-center relative",
                  day: "h-[21px] w-[21px] p-0 mx-auto rounded-md text-[8px] leading-none font-normal",
                  day_selected: "bg-[#0B676E] text-white hover:bg-[#0B676E] focus:bg-[#0B676E]",
                  day_today: "bg-[#0B676E]/10 text-[#0B676E] font-bold",
                  day_outside: "text-slate-300 opacity-40",
                  day_disabled: "text-slate-300 opacity-30",
                }}
              />
            </div>
          )}
        </div>

        {unpaidCount > 0 && (
          <div className="flex items-center gap-1 px-4 py-3 mt-4 bg-red-50 rounded-2xl border border-red-200 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-red-700">{unpaidCount} impayée(s)</span>
              <span className="text-red-600 ml-2">{formatCurrency(unpaidAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// VUE DÉTAILLÉE DES CONTRATS NEOMORPHIQUE
// ============================================================
const ContractDetailView = ({ 
  client, 
  subscriptions, 
  subscriptionPlans, 
  invoices, 
  onDownloadContract, 
  onViewInvoiceDetails, 
  onMarkAsPaid,
  onDownloadInvoicePdf,
  formatCurrency: formatCurrencyFn,
  format: formatDate,
  fr: frLocale
}: { 
  client: User;
  subscriptions: Subscription[];
  subscriptionPlans: SubscriptionPlan[];
  invoices: Invoice[];
  onDownloadContract: (clientId: number) => void;
  onViewInvoiceDetails: (invoice: Invoice) => void;
  onMarkAsPaid: ({ id, paymentMethod }: { id: number; paymentMethod: "cash" | "mobile_money" }) => void;
  onDownloadInvoicePdf: (invoiceId: number, invoiceNumber: string) => void;
  formatCurrency: (amount: number | string) => string;
  format: (date: Date, formatStr: string, options?: any) => string;
  fr: any;
}) => {
  const clientSubscriptions = subscriptions.filter(s => s.clientId === client.id);
  const clientInvoices = invoices.filter(inv => inv.clientId === client.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const paidInvoices = clientInvoices.filter(inv => inv.status === "paid");
  const pendingInvoices = clientInvoices.filter(inv => inv.status === "pending");
  const overdueInvoices = clientInvoices.filter(inv => inv.status === "overdue");
  
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  const totalAll = totalPaid + totalPending + totalOverdue;

  return (
    <div className="space-y-6">
      {/* En-tête client */}
      <div className={NEO.card}>
        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <User className="h-8 w-8 text-[#0B676E]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{client.fullName}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </span>
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Client depuis: {formatDate(new Date(client.createdAt), "MMMM yyyy", { locale: frLocale })}
                  </span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => onDownloadContract(client.id)} 
              className={cn(NEO.buttonPrimary, "gap-1")}
            >
              <Download className="h-4 w-4" />
              Télécharger le contrat
            </Button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn(NEO.cardPressed, "p-4 bg-emerald-50/40")}>
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Payé</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrencyFn(totalPaid)}</p>
          <p className="text-xs text-emerald-500 mt-1">{paidInvoices.length} facture(s)</p>
        </div>
        <div className={cn(NEO.cardPressed, "p-4 bg-amber-50/40")}>
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">En attente</p>
          <p className="text-2xl font-bold text-amber-700">{formatCurrencyFn(totalPending)}</p>
          <p className="text-xs text-amber-500 mt-1">{pendingInvoices.length} facture(s)</p>
        </div>
        <div className={cn(NEO.cardPressed, "p-4 bg-red-50/40")}>
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide">En retard</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrencyFn(totalOverdue)}</p>
          <p className="text-xs text-red-500 mt-1">{overdueInvoices.length} facture(s)</p>
        </div>
        <div className={cn(NEO.cardPressed, "p-4")}>
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Total général</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrencyFn(totalAll)}</p>
          <p className="text-xs text-slate-500 mt-1">{clientInvoices.length} facture(s)</p>
        </div>
      </div>

      {/* Abonnements actifs */}
      {clientSubscriptions.length > 0 && (
        <div className={NEO.card}>
          <div className="p-5">
            <div className="flex items-center gap-1 text-lg font-semibold text-slate-800 mb-4">
              <Repeat className="h-5 w-5 text-[#0B676E]" />
              Abonnements actifs
            </div>
            <div className="space-y-3">
              {clientSubscriptions.map(sub => {
                const plan = subscriptionPlans.find(p => p.id === sub.planId);
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <div>
                      <p className="font-medium text-slate-900">{plan?.name || "Plan standard"}</p>
                      <p className="text-sm text-slate-500">
                        {plan?.pricePerMonth || "0"} Ar/mois
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                        Actif
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        Depuis le {formatDate(new Date(sub.startDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Historique des factures */}
      <div className={NEO.card}>
        <div className="p-5">
          <div className="flex items-center gap-1 text-lg font-semibold text-slate-800 mb-2">
            <Receipt className="h-5 w-5 text-[#0B676E]" />
            Historique des factures
          </div>
          <p className="text-sm text-slate-500 mb-4">{clientInvoices.length} facture(s) au total</p>
          
          {clientInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucune facture trouvée pour ce client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientInvoices.map(invoice => {
                const plan = subscriptionPlans.find(p => p.id === subscriptions.find(s => s.id === invoice.subscriptionId)?.planId);
                const isOverdue = invoice.status === "overdue";
                const isPending = invoice.status === "pending";
                
                return (
                  <div 
                    key={invoice.id} 
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      isOverdue ? "bg-red-50/40 border-red-200" : 
                      isPending ? "bg-amber-50/40 border-amber-200" : 
                      NEO.card
                    )}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-mono font-medium text-slate-900">
                            {invoice.invoiceNumber}
                          </span>
                          <StatusBadge status={invoice.status} paymentMethod={invoice.paymentMethod} />
                          {plan && (
                            <Badge className="bg-[#eef2f5] text-slate-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                              {plan.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Émis: {formatDate(new Date(invoice.issueDate), "dd MMMM yyyy", { locale: frLocale })}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Échéance: {formatDate(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: frLocale })}
                          </span>
                          {invoice.paidDate && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check className="h-3.5 w-3.5" />
                              Payé le: {formatDate(new Date(invoice.paidDate), "dd MMMM yyyy", { locale: frLocale })}
                            </span>
                          )}
                        </div>
                        {invoice.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-1">{invoice.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrencyFn(parseFloat(invoice.amount))}</p>
                        </div>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewInvoiceDetails(invoice)}
                                className={cn(NEO.button, "h-8 w-8 p-0")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Détails</TooltipContent>
                          </Tooltip>
                          
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onMarkAsPaid({ id: invoice.id, paymentMethod: "cash" })}
                                  className={cn(NEO.button, "h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700")}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Marquer payé</TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDownloadInvoicePdf(invoice.id, invoice.invoiceNumber)}
                                className={cn(NEO.button, "h-8 w-8 p-0")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>PDF</TooltipContent>
                          </Tooltip>
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

// ============================================================
// COMPOSANT PRINCIPAL - INVOICES TAB NEOMORPHIQUE
// ============================================================

export function InvoicesTab({ users, subscriptions, subscriptionPlans }: {
  users: User[];
  subscriptions: Subscription[];
  subscriptionPlans: SubscriptionPlan[];
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient_ = queryClient;

  // États
  const [viewMode, setViewMode] = useState<'grid' | 'matrix'>('grid');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [isContractViewOpen, setIsContractViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editInvoiceData, setEditInvoiceData] = useState<EditInvoiceData | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});
  const downloadTimers = useRef<Record<number, NodeJS.Timeout | undefined>>({});
  
  // États des filtres
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState("all");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showInvoiceCalendar, setShowInvoiceCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(12);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    invoiceNumber: true,
    clientName: true,
    plan: true,
    dates: true,
    amount: true,
    status: true,
    actions: true,
  });
  
  // États des dialogues
  const [newInvoiceClientOpen, setNewInvoiceClientOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState<{
    clientId?: number;
    invoiceNumber?: string;
    amount?: number;
    currency?: string;
    status?: string;
    issueDate?: Date;
    dueDate?: Date;
    paymentMethod?: "cash" | "mobile_money";
    description?: string;
  }>({});
  
  // États pour la recherche de contrats
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const [showContractSuggestions, setShowContractSuggestions] = useState(false);
  const [selectedContractClient, setSelectedContractClient] = useState<User | null>(null);

  // États pour création de contrat depuis un abonnement
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [selectedContractSubscription, setSelectedContractSubscription] = useState<Subscription | null>(null);
  const [newContractData, setNewContractData] = useState<NewContractData>({
    clientId: 0,
    title: "",
    startDate: undefined,
    endDate: undefined,
    status: "draft",
    isAutoRenew: true,
  });
  
  const invoicesTableRef = useRef<HTMLDivElement>(null);

  // Initialiser les dates par défaut
  useEffect(() => {
    if (isNewInvoiceOpen) {
      let defaultIssueDate = new Date();
      let defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      
      if (invoiceMonthFilter === "current_month") {
        defaultIssueDate = new Date();
        defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      } else if (invoiceMonthFilter === "last_month") {
        const lastMonth = subMonths(new Date(), 1);
        defaultIssueDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        defaultDueDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      } else if (invoiceMonthFilter === "current_year") {
        const currentYear = new Date().getFullYear();
        defaultIssueDate = new Date(currentYear, 0, 1);
        defaultDueDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
      }
      
      setNewInvoiceData(prev => ({
        ...prev,
        issueDate: prev.issueDate || defaultIssueDate,
        dueDate: prev.dueDate || defaultDueDate,
      }));
    }
  }, [isNewInvoiceOpen, invoiceMonthFilter]);

  // Requête des factures
  const { data: invoices = [], isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [invoiceFilter, invoiceMonthFilter, searchQuery]);

  // Vérifier si une facture est en retard
  const isInvoiceOverdue = useMemo(() => (invoice: Invoice): boolean => {
    const now = new Date();
    const dueDate = parseISO(invoice.dueDate);
    const isDueDatePassed = isAfter(now, dueDate);
    const isNotPaidOrCancelled = invoice.status !== "paid" && invoice.status !== "cancelled";
    return (isDueDatePassed && isNotPaidOrCancelled) || invoice.status === "overdue";
  }, []);

  // Mise à jour du statut overdue
  useEffect(() => {
    const updateOverdueStatus = async () => {
      for (const invoice of invoices) {
        if (isInvoiceOverdue(invoice) && invoice.status !== "overdue") {
          try {
            await apiRequest("PATCH", `/api/invoices/${invoice.id}`, { status: "overdue" });
          } catch (error) {
            console.error(`Erreur mise à jour facture ${invoice.id}:`, error);
          }
        }
      }
      refetchInvoices();
    };
    updateOverdueStatus();
  }, [invoices, isInvoiceOverdue, refetchInvoices]);

  // ==================== CALCULS DES KPI ====================
  
  const rawInvoices = useMemo(() => {
    const invoicesArray = Array.isArray(invoices) ? invoices : [];
    return invoicesArray.map(invoice => ({
      ...invoice,
      status: isInvoiceOverdue(invoice) && invoice.status !== "paid" && invoice.status !== "cancelled" ? "overdue" : invoice.status,
    }));
  }, [invoices, isInvoiceOverdue]);

  const now = new Date();
  const currentMonthRevenue = rawInvoices
    .filter(inv => inv.status === "paid" && inv.paidDate && new Date(inv.paidDate).getMonth() === now.getMonth() && new Date(inv.paidDate).getFullYear() === now.getFullYear())
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  
  const unpaidInvoices = rawInvoices.filter(inv => inv.status === "pending" || inv.status === "overdue");
  const unpaidCount = unpaidInvoices.length;
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  
  const overdueInvoices = rawInvoices.filter(inv => inv.status === "overdue");
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  
  const invoicesIssuedThisMonth = rawInvoices.filter(inv => {
    const invDate = new Date(inv.issueDate || inv.createdAt);
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  });
  const paidInvoicesThisMonth = invoicesIssuedThisMonth.filter(inv => inv.status === "paid");
  const paymentRate = invoicesIssuedThisMonth.length > 0 
    ? Math.round((paidInvoicesThisMonth.length / invoicesIssuedThisMonth.length) * 100) 
    : 0;
  
  const soonDueInvoices = rawInvoices.filter(inv => {
    if (inv.status !== "pending") return false;
    const dueDate = parseISO(inv.dueDate);
    const daysUntilDue = differenceInDays(dueDate, now);
    return daysUntilDue >= 0 && daysUntilDue <= 3;
  });
  const soonDueCount = soonDueInvoices.length;
  const soonDueAmount = soonDueInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  
  const lastMonth = subMonths(now, 1);
  const lastMonthRevenue = rawInvoices
    .filter(inv => inv.status === "paid" && inv.paidDate && new Date(inv.paidDate).getMonth() === lastMonth.getMonth() && new Date(inv.paidDate).getFullYear() === lastMonth.getFullYear())
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0);
  const revenueTrend = currentMonthRevenue > lastMonthRevenue ? "up" : currentMonthRevenue < lastMonthRevenue ? "down" : "neutral";

  // ==================== CLIENTS POUR RECHERCHE CONTRATS ====================
  
  const contractActiveClients = useMemo(() => {
    const activeSubscriptionClientIds = new Set(
      subscriptions.filter(s => s.isActive).map(s => s.clientId)
    );
    return users.filter(u => u.role === "client" && activeSubscriptionClientIds.has(u.id));
  }, [users, subscriptions]);

  const filteredContractClients = useMemo(() => {
    if (!contractSearchQuery.trim()) return [];
    const query = contractSearchQuery.toLowerCase();
    return contractActiveClients.filter(client =>
      client.fullName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.phone && client.phone.toLowerCase().includes(query))
    );
  }, [contractActiveClients, contractSearchQuery]);

  const filteredContractSubscriptions = useMemo(() => {
    if (selectedContractClient) {
      return subscriptions.filter(s => s.isActive && s.clientId === selectedContractClient.id);
    }
    return subscriptions.filter(s => s.isActive);
  }, [subscriptions, selectedContractClient]);

  const contractGlobalStats = useMemo(() => {
    const activeSubs = subscriptions.filter(s => s.isActive);
    const allClientInvoices = invoices.filter(inv => activeSubs.some(sub => sub.clientId === inv.clientId));
    
    return {
      totalActive: activeSubs.length,
      monthlyRevenue: activeSubs.reduce((sum, sub) => {
        const plan = subscriptionPlans.find(p => p.id === sub.planId);
        return sum + (plan ? parseFloat(plan.pricePerMonth) : 0);
      }, 0),
      totalPaidInvoices: allClientInvoices.filter(inv => inv.status === "paid").length,
      totalUnpaidInvoices: allClientInvoices.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").length,
    };
  }, [subscriptions, subscriptionPlans, invoices]);

  // ==================== GESTION DES CLICS SUR ALERTES ====================
  
  const handleFilterClick = (filterType: string) => {
    setInvoiceFilter(filterType);
    setInvoiceMonthFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
    
    setTimeout(() => {
      invoicesTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  
  const resetFilters = () => {
    const today = new Date();
    setInvoiceFilter("all");
    setInvoiceMonthFilter("all");
    setCalendarMonth(today);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ==================== MUTATIONS ====================

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        clientId: data.clientId,
        invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
        amount: data.amount.toString(),
        totalAmount: data.amount.toString(),
        subtotal: data.amount.toString(),
        taxAmount: "0",
        currency: data.currency || "MGA",
        status: data.status || "pending",
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
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur création facture");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["invoices"] });
      queryClient_.invalidateQueries({ queryKey: ["invoiceMatrix"] });
      toast({ title: "Facture créée", description: "La facture a été créée avec succès" });
      setIsNewInvoiceOpen(false);
      setNewInvoiceData({});
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: EditInvoiceData) => {
      const updates: any = {
        invoiceNumber: data.invoiceNumber,
        amount: data.amount.toString(),
        totalAmount: data.totalAmount.toString(),
        currency: data.currency,
        status: data.status,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        description: data.description || null,
      };
      
      if (data.status === "paid") {
        updates.paidDate = data.paidDate ? data.paidDate.toISOString() : new Date().toISOString();
        updates.paymentMethod = data.paymentMethod;
      } else {
        updates.paidDate = null;
        updates.paymentMethod = null;
      }
      
      if (data.billingPeriodStart) updates.billingPeriodStart = data.billingPeriodStart.toISOString();
      if (data.billingPeriodEnd) updates.billingPeriodEnd = data.billingPeriodEnd.toISOString();
      
      const res = await apiRequest("PATCH", `/api/invoices/${data.id}`, updates);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["invoices"] });
      queryClient_.invalidateQueries({ queryKey: ["invoiceMatrix"] });
      toast({ title: "Facture modifiée", description: "La facture a été mise à jour" });
      setIsEditInvoiceOpen(false);
      setEditInvoiceData(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: number; paymentMethod: "cash" | "mobile_money" }) => {
      const res = await apiRequest("PATCH", `/api/invoices/${id}`, {
        status: "paid",
        paidDate: new Date().toISOString(),
        paymentMethod: paymentMethod,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["invoices"] });
      queryClient_.invalidateQueries({ queryKey: ["invoiceMatrix"] });
      toast({ title: "✅ Payé", description: "La facture a été marquée comme payée" });
      setIsInvoiceDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur suppression");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["invoices"] });
      queryClient_.invalidateQueries({ queryKey: ["invoiceMatrix"] });
      toast({ title: "🗑️ Supprimée", description: "La facture a été supprimée" });
      setDeleteInvoiceId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: NewContractData) => {
      if (!data.startDate) {
        throw new Error("Veuillez sélectionner la date convenue de début du contrat");
      }

      const res = await apiRequest("POST", "/api/contracts", {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur création contrat");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient_.invalidateQueries({ queryKey: ["contracts"] });
      queryClient_.invalidateQueries({ queryKey: ["contractStats"] });
      toast({
        title: "✅ Contrat créé",
        description: "Le contrat a été créé avec succès",
      });
      setIsNewContractOpen(false);
      setSelectedContractSubscription(null);
      setNewContractData({
        clientId: 0,
        title: "",
        startDate: undefined,
        endDate: undefined,
        status: "draft",
        isAutoRenew: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateMonthlyInvoicesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/invoices/generate-monthly", {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur génération");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient_.invalidateQueries({ queryKey: ["invoices"] });
      queryClient_.invalidateQueries({ queryKey: ["invoiceMatrix"] });
      toast({
        title: "Génération terminée",
        description: `${data.generatedCount} facture(s) générée(s), ${data.skippedCount} ignorée(s)`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // ==================== GESTIONNAIRES ====================

  const handleCreateInvoice = () => {
    const data = {
      clientId: newInvoiceData.clientId,
      invoiceNumber: newInvoiceData.invoiceNumber || `INV-${Date.now()}`,
      amount: newInvoiceData.amount?.toString() || "0",
      currency: newInvoiceData.currency || "MGA",
      status: newInvoiceData.status || "pending",
      issueDate: newInvoiceData.issueDate || new Date(),
      dueDate: newInvoiceData.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      description: newInvoiceData.description || null,
      paymentMethod: newInvoiceData.status === "paid" ? newInvoiceData.paymentMethod : null,
    };
    
    if (!data.clientId || !data.amount || parseFloat(data.amount) <= 0) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    if (data.status === "paid" && !data.paymentMethod) {
      toast({ title: "Paiement requis", description: "Sélectionnez un mode de paiement", variant: "destructive" });
      return;
    }
    createInvoiceMutation.mutate(data);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditInvoiceData({
      id: invoice.id,
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      amount: parseFloat(invoice.amount),
      totalAmount: parseFloat(invoice.totalAmount || invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      paidDate: invoice.paidDate ? new Date(invoice.paidDate) : null,
      paymentMethod: invoice.paymentMethod || null,
      description: invoice.description || null,
      billingPeriodStart: invoice.billingPeriodStart ? new Date(invoice.billingPeriodStart) : null,
      billingPeriodEnd: invoice.billingPeriodEnd ? new Date(invoice.billingPeriodEnd) : null,
    });
    setIsEditInvoiceOpen(true);
  };

  const handleMarkAsPaid = ({ id, paymentMethod }: { id: number; paymentMethod: "cash" | "mobile_money" }) => {
    updateInvoiceStatusMutation.mutate({ id, paymentMethod });
  };

  const handleDeleteInvoice = (id: number) => {
    setDeleteInvoiceId(id);
  };

  const handleDownloadInvoicePdf = (invoiceId: number, invoiceNumber: string) => {
    try {
      const url = `/api/invoices/${invoiceId}/download-pdf`;
      window.open(url, '_blank');
      
      toast({
        title: "Téléchargement en cours",
        description: `La facture ${invoiceNumber || invoiceId} est en cours de téléchargement`,
      });
    } catch (error: any) {
      console.error("Erreur téléchargement PDF:", error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le PDF",
        variant: "destructive",
      });
    }
  };

  // ✅ FANITSIA IZAO: FANOVANA NY handleDownloadContract MIARAKA AMIN'NY WINDOW.OPEN
  const handleDownloadContract = (clientId: number) => {
    try {
      const url = `/api/contracts/${clientId}/download`;
      window.open(url, '_blank');
      
      const client = users.find(u => u.id === clientId);
      toast({
        title: "Téléchargement en cours",
        description: `Le contrat de ${client?.fullName || "client"} est en cours de téléchargement`,
      });
    } catch (error: any) {
      console.error("Erreur téléchargement contrat:", error);
      toast({
        title: "❌ Erreur de téléchargement",
        description: "Impossible de télécharger le contrat",
        variant: "destructive",
      });
    }
  };

  const handleOpenNewContract = (client: User | undefined, subscription: Subscription) => {
    if (!client) {
      toast({
        title: "❌ Client introuvable",
        description: "Impossible de créer le contrat pour ce client.",
        variant: "destructive",
      });
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === subscription.planId);

    setSelectedContractClient(client);
    setSelectedContractSubscription(subscription);
    setNewContractData({
      clientId: client.id,
      subscriptionId: subscription.id,
      title: `Contrat d'abonnement - ${plan?.name || "Plan standard"}`,
      startDate: undefined,
      endDate: undefined,
      status: "draft",
      isAutoRenew: true,
    });
    setIsNewContractOpen(true);
  };

  // ==================== FILTRES ET PAGINATION ====================

  const filteredInvoices = useMemo(() => {
    const invoicesArray = Array.isArray(invoices) ? invoices : [];
    
    const updatedInvoices = invoicesArray.map(invoice => ({
      ...invoice,
      status: isInvoiceOverdue(invoice) && invoice.status !== "paid" && invoice.status !== "cancelled" ? "overdue" : invoice.status,
    }));
    
    const result = updatedInvoices.filter((invoice: Invoice) => {
      if (invoiceFilter !== "all" && invoice.status !== invoiceFilter) return false;
      
      if (invoiceMonthFilter !== "all") {
        const invDate = invoice.issueDate
          ? new Date(invoice.issueDate)
          : new Date(invoice.createdAt);

        if (isNaN(invDate.getTime())) {
          return false;
        }

        if (/^\d{4}-\d{2}$/.test(invoiceMonthFilter)) {
          const [selectedYear, selectedMonth] = invoiceMonthFilter
            .split("-")
            .map(Number);

          if (
            invDate.getFullYear() !== selectedYear ||
            invDate.getMonth() + 1 !== selectedMonth
          ) {
            return false;
          }
        }
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const client = users.find(u => u.id === invoice.clientId);
        const searchable = [
          invoice.invoiceNumber,
          invoice.description || "",
          client?.fullName || "",
          client?.email || "",
          client?.phone || "",
        ].join(" ").toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      
      return true;
    });
    
    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [invoices, invoiceFilter, invoiceMonthFilter, searchQuery, users, isInvoiceOverdue]);

  // Pagination
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-[#eef2f5] min-h-screen">
        
        {/* EN-TÊTE NEOMORPHIQUE */}
        <div className={NEO.card}>
          <div className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Facturation
              </h1>
              <p className="text-slate-500 mt-1">
                Gérez les factures, suivez les paiements et consultez les statistiques
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Sélecteur Vue Grille / Matrice */}
              <div className={cn(NEO.card, "p-1 flex gap-1")}>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "gap-1 rounded-2xl px-3 h-9",
                    viewMode === 'grid' && NEO.buttonPrimary
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Grille</span>
                </Button>
                <Button
                  variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('matrix')}
                  className={cn(
                    "gap-1 rounded-2xl px-3 h-9",
                    viewMode === 'matrix' && NEO.buttonPrimary
                  )}
                >
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Matrice</span>
                </Button>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setIsContractViewOpen(true);
                  setSelectedContractClient(null);
                  setContractSearchQuery('');
                }}
                className={cn(NEO.button, "gap-1 h-9 px-3 text-sm")}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Contrats</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => generateMonthlyInvoicesMutation.mutate()} 
                disabled={generateMonthlyInvoicesMutation.isPending}
                className={cn(NEO.button, "gap-1 h-9 px-3 text-sm")}
              >
                {generateMonthlyInvoicesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Génération mensuelle</span>
              </Button>
              
              <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
                <DialogTrigger asChild>
                  <Button className={cn(NEO.buttonPrimary, "gap-1 shadow-lg h-9 px-4 text-sm")}>
                    <Plus className="h-4 w-4" />
                    Nouvelle facture
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-1 text-2xl text-slate-800">
                      <FilePlus className="h-6 w-6 text-[#0B676E]" />
                      Créer une facture
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Remplissez les informations ci-dessous pour créer une nouvelle facture
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* N° Facture et Client */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">N° Facture</Label>
                        <Input
                          placeholder="Auto-généré si vide"
                          value={newInvoiceData.invoiceNumber || ""}
                          onChange={(e) => setNewInvoiceData({ 
                            ...newInvoiceData, 
                            invoiceNumber: e.target.value 
                          })}
                          className={NEO.input}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Client *</Label>
                        <Popover open={newInvoiceClientOpen} onOpenChange={setNewInvoiceClientOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className={cn(NEO.input, "w-full justify-between")}>
                              {(() => {
                                const client = users.find(u => u.id === newInvoiceData.clientId);
                                return client ? client.fullName : "Sélectionner un client";
                              })()}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0 bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                            <Command className="bg-[#eef2f5]">
                              <CommandInput placeholder="Rechercher un client..." className="bg-[#eef2f5] rounded-2xl" />
                              <CommandList>
                                <CommandEmpty>Aucun client trouvé</CommandEmpty>
                                <CommandGroup>
                                  {users.filter(u => u.role === "client").map(client => (
                                    <CommandItem
                                      key={client.id}
                                      onSelect={() => {
                                        setNewInvoiceData({ ...newInvoiceData, clientId: client.id });
                                        setNewInvoiceClientOpen(false);
                                      }}
                                      className="flex flex-col items-start gap-1 rounded-xl hover:bg-[#0B676E]/10"
                                    >
                                      <span className="font-medium text-slate-800">{client.fullName}</span>
                                      <span className="text-xs text-slate-500">{client.email}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Montant et Devise */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Montant (Ar) *</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 25000"
                          value={newInvoiceData.amount || ""}
                          onChange={(e) => setNewInvoiceData({ 
                            ...newInvoiceData, 
                            amount: parseFloat(e.target.value) || 0 
                          })}
                          className={NEO.input}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Devise</Label>
                        <Select value={newInvoiceData.currency || "MGA"} onValueChange={(v) => setNewInvoiceData({ ...newInvoiceData, currency: v })}>
                          <SelectTrigger className={NEO.input}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                            <SelectItem value="MGA">Ariary (Ar)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                            <SelectItem value="USD">Dollar ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* DATES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Date d'émission *</Label>
                        <Input
                          type="date"
                          value={newInvoiceData.issueDate ? format(newInvoiceData.issueDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            setNewInvoiceData({ 
                              ...newInvoiceData, 
                              issueDate: date 
                            });
                          }}
                          className={NEO.input}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Date d'échéance *</Label>
                        <Input
                          type="date"
                          value={newInvoiceData.dueDate ? format(newInvoiceData.dueDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            setNewInvoiceData({ 
                              ...newInvoiceData, 
                              dueDate: date 
                            });
                          }}
                          className={NEO.input}
                        />
                      </div>
                    </div>

                    {/* Statut et Paiement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Statut</Label>
                        <Select value={newInvoiceData.status || "pending"} onValueChange={(v) => setNewInvoiceData({ ...newInvoiceData, status: v })}>
                          <SelectTrigger className={NEO.input}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="overdue">En retard</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newInvoiceData.status === "paid" && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Mode de paiement *</Label>
                          <Select onValueChange={(v) => setNewInvoiceData({ ...newInvoiceData, paymentMethod: v as "cash" | "mobile_money" })}>
                            <SelectTrigger className={NEO.input}>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                              <SelectItem value="cash">Espèces</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Description (optionnelle)</Label>
                      <Textarea
                        placeholder="Description de la facture..."
                        value={newInvoiceData.description || ""}
                        onChange={(e) => setNewInvoiceData({ ...newInvoiceData, description: e.target.value })}
                        rows={3}
                        className={cn(NEO.input, "resize-none")}
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={() => setIsNewInvoiceOpen(false)} className={NEO.button}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending} className={cn(NEO.buttonPrimary, "gap-1")}>
                      {createInvoiceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Créer la facture
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Vue Matrice */}
        {viewMode === 'matrix' ? (
          <InvoiceMatrix 
            onDownloadInvoice={handleDownloadInvoicePdf}
            onViewInvoiceDetails={(invoiceId) => {
              const invoice = invoices.find(inv => inv.id === invoiceId);
              if (invoice) {
                setSelectedInvoice(invoice);
                setIsInvoiceDetailsOpen(true);
              }
            }}
            onMarkAsPaid={(invoiceId, paymentMethod) => {
              handleMarkAsPaid({ id: invoiceId, paymentMethod });
            }}
          />
        ) : (
          <>
            {/* Tableau de bord KPI néomorphique */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <DashboardCard
                title="Revenus du mois"
                value={formatCurrency(currentMonthRevenue)}
                description={`${paidInvoicesThisMonth.length} facture(s) payée(s)`}
                icon={<Euro className="h-4 w-4" />}
                variant="success"
                loading={isLoadingInvoices}
                trend={revenueTrend}
              />
              
              <DashboardCard
                title="Impayés"
                value={formatCurrency(unpaidAmount)}
                description={`${unpaidCount} facture(s) non réglée(s)`}
                icon={<AlertTriangle className="h-4 w-4" />}
                variant="destructive"
                loading={isLoadingInvoices}
                onClick={() => handleFilterClick("pending")}
                alertCount={unpaidCount}
              />
              
              <DashboardCard
                title="En retard"
                value={formatCurrency(overdueAmount)}
                description={`${overdueCount} facture(s) dépassée(s)`}
                icon={<AlertTriangle className="h-4 w-4" />}
                variant="destructive"
                loading={isLoadingInvoices}
                onClick={() => handleFilterClick("overdue")}
                alertCount={overdueCount}
              />
              
              <DashboardCard
                title="Taux de paiement"
                value={`${paymentRate}%`}
                description={`${paidInvoicesThisMonth.length}/${invoicesIssuedThisMonth.length} réglées`}
                icon={<CheckCircle className="h-4 w-4" />}
                variant="info"
                loading={isLoadingInvoices}
                trend={paymentRate >= 80 ? "up" : paymentRate >= 50 ? "neutral" : "down"}
              />
            </div>

            {/* Alertes */}
            {(unpaidCount > 5 || soonDueCount > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {unpaidCount > 5 && (
                  <div className={cn(NEO.card, "p-4 bg-red-50/40 border-l-4 border-l-red-500")}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-red-200 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <AlertTriangle className="h-5 w-5 text-red-700" />
                        </div>
                        <div>
                          <p className="font-bold text-red-800">Alerte : {unpaidCount} factures impayées</p>
                          <p className="text-sm text-red-600">Montant total impayé : {formatCurrency(unpaidAmount)}</p>
                          <p className="text-xs text-red-500 mt-1">Dont {overdueCount} en retard</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={cn(NEO.button, "border-red-300 text-red-700 hover:bg-red-200")}
                        onClick={() => handleFilterClick("pending")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les impayés
                      </Button>
                    </div>
                  </div>
                )}
                
                {soonDueCount > 0 && (
                  <div className={cn(NEO.card, "p-4 bg-amber-50/40 border-l-4 border-l-amber-500")}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-amber-200 rounded-xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <Clock className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-bold text-amber-800">{soonDueCount} facture(s) à échéance proche</p>
                          <p className="text-sm text-amber-600">Montant : {formatCurrency(soonDueAmount)}</p>
                          <p className="text-xs text-amber-500 mt-1">À payer dans les 3 jours</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={cn(NEO.button, "border-amber-300 text-amber-700 hover:bg-amber-200")}
                        onClick={() => handleFilterClick("pending")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les échéances
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section Filtres */}
            <FilterSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              invoiceFilter={invoiceFilter}
              setInvoiceFilter={setInvoiceFilter}
              invoiceMonthFilter={invoiceMonthFilter}
              setInvoiceMonthFilter={setInvoiceMonthFilter}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              unpaidCount={unpaidCount}
              unpaidAmount={unpaidAmount}
              onReset={resetFilters}
              filteredCount={filteredInvoices.length}
              totalCount={rawInvoices.length}
              showInvoiceCalendar={showInvoiceCalendar}
              setShowInvoiceCalendar={setShowInvoiceCalendar}
            />

            {/* Badges des filtres actifs */}
            <div className="flex flex-wrap gap-1">
              {invoiceMonthFilter !== "all" && (
                <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] py-1.5">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {invoiceMonthFilter !== "all" && (() => {
                    const [year, month] = invoiceMonthFilter.split("-").map(Number);
                    return year && month
                      ? format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: fr })
                      : "Période";
                  })()}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => setInvoiceMonthFilter("all")}
                  />
                </Badge>
              )}
              {invoiceFilter !== "all" && (
                <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] py-1.5">
                  <Filter className="h-3 w-3 mr-1" />
                  {invoiceFilter === "overdue" ? "En retard" : invoiceFilter === "pending" ? "En attente" : invoiceFilter === "paid" ? "Payé" : "Annulé"}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => setInvoiceFilter("all")}
                  />
                </Badge>
              )}
              {searchQuery && (
                <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] py-1.5">
                  <Search className="h-3 w-3 mr-1" />
                  {searchQuery}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
            </div>

            {/* TABLEAU DES FACTURES - VUE GRILLE (CARREE) */}
            <div ref={invoicesTableRef}>
              <div className={NEO.card}>
                <div className="p-5 border-b border-white/40">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-xl font-bold text-slate-800">
                        <LayoutGrid className="h-5 w-5 text-[#0B676E]" />
                        Factures
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {filteredInvoices.length} facture(s) trouvée(s)
                        {invoiceFilter !== "all" && ` • Filtré : ${invoiceFilter === "overdue" ? "En retard" : invoiceFilter === "pending" ? "En attente" : invoiceFilter === "paid" ? "Payé" : "Annulé"}`}
                        {invoiceMonthFilter !== "all" && (() => {
                          const [year, month] = invoiceMonthFilter.split("-").map(Number);
                          return year && month
                            ? ` • ${format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: fr })}`
                            : "";
                        })()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => refetchInvoices()} className={cn(NEO.button, "gap-1 h-9")}>
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Actualiser</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  {isLoadingInvoices ? (
                    <div className="text-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#0B676E] mb-4" />
                      <p className="text-slate-500">Chargement des factures...</p>
                    </div>
                  ) : currentInvoices.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="h-12 w-12" />}
                      title="Aucune facture trouvée"
                      description={searchQuery || invoiceFilter !== "all" || invoiceMonthFilter !== "all" 
                        ? "Essayez de modifier vos filtres" 
                        : "Créez votre première facture"}
                      action={
                        <div className="flex flex-wrap gap-3 justify-center">
                          <Button variant="outline" onClick={resetFilters} className={NEO.button}>
                            <FilterX className="h-4 w-4 mr-2" />
                            Réinitialiser les filtres
                          </Button>
                          {!searchQuery && invoiceFilter === "all" && invoiceMonthFilter === "all" && (
                            <Button onClick={() => setIsNewInvoiceOpen(true)} className={NEO.buttonPrimary}>
                              <Plus className="h-4 w-4 mr-2" />
                              Nouvelle facture
                            </Button>
                          )}
                        </div>
                      }
                    />
                  ) : (
                    <>
                      {/* GRILLE CARRÉE - ISAKY NY FACTURE ZARAINA KARATRA */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {currentInvoices.map((invoice) => {
                          const client = users.find(u => u.id === invoice.clientId);
                          const isOverdue = invoice.status === "overdue";
                          const isPending = invoice.status === "pending";
                          const isPaid = invoice.status === "paid";
                          const dueDays = differenceInDays(parseISO(invoice.dueDate), new Date());
                          const isDueSoon = dueDays <= 3 && dueDays >= 0 && isPending;
                          
                          return (
                            <div
                              key={invoice.id}
                              className={cn(
                                "group relative bg-[#eef2f5] rounded-2xl p-4 transition-all duration-200 cursor-pointer",
                                "shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]",
                                "hover:shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff]",
                                "hover:-translate-y-1",
                                isOverdue && "border-l-4 border-l-red-500",
                                isDueSoon && "border-l-4 border-l-amber-500"
                              )}
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsInvoiceDetailsOpen(true);
                              }}
                            >
                              {/* En-tête */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full flex-shrink-0",
                                      isPaid ? "bg-emerald-500" :
                                      isOverdue ? "bg-red-500" :
                                      isDueSoon ? "bg-amber-500" : "bg-slate-400"
                                    )} />
                                    <span className="font-mono font-semibold text-sm text-slate-800 truncate">
                                      {invoice.invoiceNumber}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {client?.fullName || "Client inconnu"}
                                  </p>
                                </div>
                                <StatusBadge status={invoice.status} paymentMethod={invoice.paymentMethod} />
                              </div>

                              {/* Montant */}
                              <div className="mb-3">
                                <p className={cn(
                                  "text-2xl font-bold",
                                  isPaid ? "text-emerald-700" :
                                  isOverdue ? "text-red-700" :
                                  isDueSoon ? "text-amber-700" : "text-slate-800"
                                )}>
                                  {formatCurrency(parseFloat(invoice.amount))}
                                </p>
                                {invoice.paymentMethod && (
                                  <PaymentMethodBadge method={invoice.paymentMethod} />
                                )}
                              </div>

                              {/* Dates */}
                              <div className="space-y-1 text-xs text-slate-500">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    Émis:
                                  </span>
                                  <span className="text-slate-700">
                                    {format(new Date(invoice.issueDate), "dd/MM/yyyy")}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Échéance:
                                  </span>
                                  <span className={cn(
                                    "font-medium",
                                    isOverdue ? "text-red-600" :
                                    isDueSoon ? "text-amber-600" : "text-slate-700"
                                  )}>
                                    {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                                    {isDueSoon && ` (J${dueDays})`}
                                    {isOverdue && ` (J${dueDays})`}
                                  </span>
                                </div>
                                {invoice.paidDate && (
                                  <div className="flex items-center justify-between text-emerald-600">
                                    <span className="flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Payé:
                                    </span>
                                    <span>{format(new Date(invoice.paidDate), "dd/MM/yyyy")}</span>
                                  </div>
                                )}
                              </div>

                              {/* Badges Retard / J+ */}
                              {isOverdue && (
                                <div className="absolute -top-1 -right-1">
                                  <Badge className="bg-red-500 text-white border-0 text-[9px] px-1.5 py-0.5 rounded-full shadow-lg">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                    Retard
                                  </Badge>
                                </div>
                              )}
                              {isDueSoon && !isOverdue && (
                                <div className="absolute -top-1 -right-1">
                                  <Badge className="bg-amber-500 text-white border-0 text-[9px] px-1.5 py-0.5 rounded-full shadow-lg">
                                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                                    J+{dueDays}
                                  </Badge>
                                </div>
                              )}

                              {/* ✅ ACTIONS AVEC TOOLTIP - COMPLET */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* 1. Marquer payé */}
                                {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full bg-white/80 shadow-md hover:bg-emerald-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsPaid({ id: invoice.id, paymentMethod: "cash" });
                                        }}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="text-xs bg-slate-800 text-white border-0 rounded-xl shadow-lg">
                                      Marquer comme payé
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                
                                {/* 2. Télécharger PDF */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full bg-white/80 shadow-md hover:bg-blue-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadInvoicePdf(invoice.id, invoice.invoiceNumber);
                                      }}
                                    >
                                      <Download className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs bg-slate-800 text-white border-0 rounded-xl shadow-lg">
                                    Télécharger PDF
                                  </TooltipContent>
                                </Tooltip>
                                
                                {/* 3. Modifier */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full bg-white/80 shadow-md hover:bg-slate-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditInvoice(invoice);
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-slate-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs bg-slate-800 text-white border-0 rounded-xl shadow-lg">
                                    Modifier
                                  </TooltipContent>
                                </Tooltip>
                                
                                {/* 4. ✅ SUPPRIMER */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full bg-white/80 shadow-md hover:bg-red-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteInvoice(invoice.id);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs bg-slate-800 text-white border-0 rounded-xl shadow-lg">
                                    Supprimer
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {filteredInvoices.length > 0 && totalPages > 1 && (
                        <PaginationComponent
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          totalItems={filteredInvoices.length}
                          itemsPerPage={invoicesPerPage}
                        />
                      )}
                    </>
                  )}
                  
                  {/* Résumé des totaux */}
                  {filteredInvoices.length > 0 && (
                    <div className="mt-4 p-4 bg-white/10 rounded-2xl border-t border-white/40">
                      <div className="flex justify-end items-center gap-6 text-sm flex-wrap">
                        <div>
                          <span className="text-slate-500">Total général :</span>
                          <span className="font-semibold text-slate-900 ml-2">
                            {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Payé :</span>
                          <span className="font-semibold text-emerald-600 ml-2">
                            {formatCurrency(filteredInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Impayé :</span>
                          <span className="font-semibold text-red-600 ml-2">
                            {formatCurrency(filteredInvoices.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* DIALOGUE DÉTAILS FACTURE */}
        <Dialog open={isInvoiceDetailsOpen} onOpenChange={setIsInvoiceDetailsOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            {selectedInvoice && (
              <>
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="flex items-center gap-1 text-2xl text-slate-800">
                    <Receipt className="h-6 w-6 text-[#0B676E]" />
                    Détails de la facture
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 p-6">
                  <div className={NEO.cardPressed}>
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">N° Facture</p>
                          <p className="text-2xl font-bold text-slate-900">{selectedInvoice.invoiceNumber}</p>
                        </div>
                        <StatusBadge status={selectedInvoice.status} paymentMethod={selectedInvoice.paymentMethod} />
                      </div>
                      <div className="mt-6 text-right">
                        <p className="text-sm text-slate-500">Montant total</p>
                        <p className="text-3xl font-bold text-slate-800">
                          {formatCurrency(parseFloat(selectedInvoice.amount))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 flex items-center gap-1">
                        <User className="h-4 w-4 text-[#0B676E]" />
                        Client
                      </h4>
                      <div className="space-y-2 pl-6">
                        <p className="font-medium text-slate-900">{users.find(u => u.id === selectedInvoice.clientId)?.fullName || "N/A"}</p>
                        <p className="text-sm text-slate-500">{users.find(u => u.id === selectedInvoice.clientId)?.email}</p>
                        <p className="text-sm text-slate-500">{users.find(u => u.id === selectedInvoice.clientId)?.phone}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-[#0B676E]" />
                        Dates
                      </h4>
                      <div className="space-y-2 pl-6">
                        <p className="text-sm">
                          <span className="text-slate-500">Émission :</span>{" "}
                          <span className="font-medium text-slate-800">{format(new Date(selectedInvoice.issueDate), "dd MMMM yyyy", { locale: fr })}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-slate-500">Échéance :</span>{" "}
                          <span className={cn("font-medium", selectedInvoice.status === "overdue" ? "text-red-600" : "text-slate-900")}>
                            {format(new Date(selectedInvoice.dueDate), "dd MMMM yyyy", { locale: fr })}
                          </span>
                        </p>
                        {selectedInvoice.paidDate && (
                          <p className="text-sm">
                            <span className="text-slate-500">Payé le :</span>{" "}
                            <span className="font-medium text-emerald-600">{format(new Date(selectedInvoice.paidDate), "dd MMMM yyyy", { locale: fr })}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.description && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-700">Description</h4>
                      <p className="text-sm text-slate-600 bg-[#eef2f5] p-3 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">{selectedInvoice.description}</p>
                    </div>
                  )}

                  {selectedInvoice.status !== "paid" && selectedInvoice.status !== "cancelled" && (
                    <div className={NEO.cardPressed + " p-5 bg-amber-50/40 border border-amber-200"}>
                      <p className="font-semibold mb-4 flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="h-5 w-5" />
                        Marquer comme payée
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          className={cn(NEO.button, "flex-1 gap-1 border-amber-300 hover:bg-amber-100")}
                          onClick={() => handleMarkAsPaid({ id: selectedInvoice.id, paymentMethod: "cash" })}
                        >
                          <Banknote className="h-4 w-4" />
                          Paiement en espèces
                        </Button>
                        <Button
                          variant="outline"
                          className={cn(NEO.button, "flex-1 gap-1 border-amber-300 hover:bg-amber-100")}
                          onClick={() => handleMarkAsPaid({ id: selectedInvoice.id, paymentMethod: "mobile_money" })}
                        >
                          <SmartphoneIcon className="h-4 w-4" />
                          Mobile Money
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter className="p-6 pt-0 flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setIsInvoiceDetailsOpen(false)} className={NEO.button}>
                    Fermer
                  </Button>
                  <Button onClick={() => handleDownloadInvoicePdf(selectedInvoice.id, selectedInvoice.invoiceNumber)} className={NEO.buttonPrimary}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOGUE MODIFICATION FACTURE */}
        <Dialog open={isEditInvoiceOpen} onOpenChange={setIsEditInvoiceOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            <DialogHeader>
              <DialogTitle className="text-2xl text-slate-800">Modifier la facture</DialogTitle>
              <DialogDescription className="text-slate-500">
                Modifiez les informations de la facture
              </DialogDescription>
            </DialogHeader>
            {editInvoiceData && (
              <div className="space-y-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">N° Facture</Label>
                    <Input
                      value={editInvoiceData.invoiceNumber}
                      onChange={(e) => setEditInvoiceData({ ...editInvoiceData, invoiceNumber: e.target.value })}
                      className={NEO.input}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Montant (Ar)</Label>
                    <Input
                      type="number"
                      value={editInvoiceData.amount}
                      onChange={(e) => setEditInvoiceData({ ...editInvoiceData, amount: parseFloat(e.target.value), totalAmount: parseFloat(e.target.value) })}
                      className={NEO.input}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Date d'émission</Label>
                    <Input
                      type="date"
                      value={editInvoiceData.issueDate ? format(editInvoiceData.issueDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        if (date) setEditInvoiceData({ ...editInvoiceData, issueDate: date });
                      }}
                      className={NEO.input}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Date d'échéance</Label>
                    <Input
                      type="date"
                      value={editInvoiceData.dueDate ? format(editInvoiceData.dueDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        if (date) setEditInvoiceData({ ...editInvoiceData, dueDate: date });
                      }}
                      className={NEO.input}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Statut</Label>
                    <Select value={editInvoiceData.status} onValueChange={(v) => setEditInvoiceData({ ...editInvoiceData, status: v })}>
                      <SelectTrigger className={NEO.input}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editInvoiceData.status === "paid" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Mode de paiement</Label>
                      <Select value={editInvoiceData.paymentMethod || "cash"} onValueChange={(v) => setEditInvoiceData({ ...editInvoiceData, paymentMethod: v as any })}>
                        <SelectTrigger className={NEO.input}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Description</Label>
                  <Textarea
                    value={editInvoiceData.description || ""}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, description: e.target.value })}
                    rows={3}
                    className={cn(NEO.input, "resize-none")}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setIsEditInvoiceOpen(false)} className={NEO.button}>
                Annuler
              </Button>
              <Button onClick={() => updateInvoiceMutation.mutate(editInvoiceData!)} disabled={updateInvoiceMutation.isPending} className={NEO.buttonPrimary}>
                {updateInvoiceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOGUE CRÉATION CONTRAT DEPUIS UN ABONNEMENT */}
        <Dialog open={isNewContractOpen} onOpenChange={(open) => {
          setIsNewContractOpen(open);
          if (!open) {
            setSelectedContractSubscription(null);
          }
        }}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800">
                <FileText className="h-6 w-6 text-[#0B676E]" />
                Créer un contrat
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Créez le contrat à partir de l'abonnement sélectionné. La date du contrat doit être celle convenue avec le client.
              </DialogDescription>
            </DialogHeader>

            {selectedContractSubscription && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Client</Label>
                    <div className="px-4 py-3 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                      <p className="font-semibold text-slate-900">{selectedContractClient?.fullName || "N/A"}</p>
                      <p className="text-sm text-slate-500">{selectedContractClient?.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Abonnement</Label>
                    <div className="px-4 py-3 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                      <p className="font-semibold text-slate-900">
                        {subscriptionPlans.find(p => p.id === selectedContractSubscription.planId)?.name || "Plan standard"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {subscriptionPlans.find(p => p.id === selectedContractSubscription.planId)?.pricePerMonth || "0"} Ar/mois
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Titre du contrat *</Label>
                  <Input
                    value={newContractData.title}
                    onChange={(e) => setNewContractData({ ...newContractData, title: e.target.value })}
                    className={NEO.input}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Date convenue de début *</Label>
                    <Input
                      type="date"
                      value={newContractData.startDate ? format(newContractData.startDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => setNewContractData({
                        ...newContractData,
                        startDate: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined,
                      })}
                      className={NEO.input}
                    />
                    <p className="text-xs text-slate-500">Date de début réellement convenue dans le contrat.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Date convenue de fin</Label>
                    <Input
                      type="date"
                      value={newContractData.endDate ? format(newContractData.endDate, "yyyy-MM-dd") : ""}
                      min={newContractData.startDate ? format(newContractData.startDate, "yyyy-MM-dd") : undefined}
                      onChange={(e) => setNewContractData({
                        ...newContractData,
                        endDate: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined,
                      })}
                      className={NEO.input}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Renouvellement automatique</Label>
                  <Select
                    value={newContractData.isAutoRenew ? "true" : "false"}
                    onValueChange={(v) => setNewContractData({ ...newContractData, isAutoRenew: v === "true" })}
                  >
                    <SelectTrigger className={NEO.input}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Notes</Label>
                  <Textarea
                    placeholder="Notes concernant l'accord avec le client..."
                    value={newContractData.notes || ""}
                    onChange={(e) => setNewContractData({ ...newContractData, notes: e.target.value })}
                    rows={4}
                    className={cn(NEO.input, "resize-none")}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setIsNewContractOpen(false)}
                className={NEO.button}
              >
                Annuler
              </Button>
              <Button
                onClick={() => createContractMutation.mutate(newContractData)}
                disabled={!newContractData.clientId || !newContractData.title.trim() || !newContractData.startDate || createContractMutation.isPending}
                className={cn(NEO.buttonPrimary, "gap-1")}
              >
                {createContractMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer le contrat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOGUE CONTRATS */}
        <Dialog open={isContractViewOpen} onOpenChange={(open) => {
          setIsContractViewOpen(open);
          if (!open) {
            setSelectedContractClient(null);
            setContractSearchQuery('');
            setShowContractSuggestions(false);
          }
        }}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[85vh] overflow-y-auto p-0 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-1 text-2xl text-slate-800">
                <FileText className="h-6 w-6 text-[#0B676E]" />
                Contrats d'abonnement
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Gérez les contrats actifs et consultez l'historique des paiements par client
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
              {/* Barre de recherche */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    placeholder="Rechercher un client par nom, email ou téléphone..."
                    value={contractSearchQuery}
                    onChange={(e) => {
                      setContractSearchQuery(e.target.value);
                      setShowContractSuggestions(true);
                    }}
                    onFocus={() => setShowContractSuggestions(true)}
                    className={cn(NEO.input, "pl-10 h-11 text-base")}
                  />
                  {contractSearchQuery && (
                    <button
                      onClick={() => {
                        setContractSearchQuery('');
                        setSelectedContractClient(null);
                        setShowContractSuggestions(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>

                {showContractSuggestions && contractSearchQuery && filteredContractClients.length > 0 && (
                  <div className={NEO.card + " absolute z-50 w-[calc(100%-3rem)] max-w-[calc(100%-3rem)] overflow-hidden"}>
                    <div className="max-h-80 overflow-y-auto">
                      {filteredContractClients.map((client) => (
                        <div
                          key={client.id}
                          className="p-3 hover:bg-white/20 cursor-pointer border-b border-white/20 last:border-0 transition-colors"
                          onClick={() => {
                            setSelectedContractClient(client);
                            setContractSearchQuery(client.fullName);
                            setShowContractSuggestions(false);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <div className="w-8 h-8 rounded-full bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                  <User className="h-4 w-4 text-[#0B676E]" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{client.fullName}</p>
                                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {client.email}
                                    </span>
                                    {client.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {client.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContractClient && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedContractClient(null);
                        setContractSearchQuery('');
                      }}
                      className={NEO.button + " text-slate-500 hover:text-red-600"}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Effacer la sélection
                    </Button>
                  </div>
                )}
              </div>

              {(filteredContractSubscriptions.length === 0 && !selectedContractClient) ? (
                <EmptyState
                  icon={<FileText className="h-12 w-12" />}
                  title="Aucun contrat actif"
                  description="Aucun abonnement actif n'a été trouvé"
                />
              ) : (
                <div className="space-y-4">
                  {!selectedContractClient && contractGlobalStats.totalActive > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className={NEO.cardPressed + " p-4"}>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Contrats actifs</p>
                        <p className="text-2xl font-bold text-slate-900">{contractGlobalStats.totalActive}</p>
                      </div>
                      <div className={NEO.cardPressed + " p-4"}>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Chiffre d'affaires mensuel</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(contractGlobalStats.monthlyRevenue)}</p>
                      </div>
                      <div className={NEO.cardPressed + " p-4 bg-emerald-50/40"}>
                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Factures payées</p>
                        <p className="text-2xl font-bold text-emerald-700">{contractGlobalStats.totalPaidInvoices}</p>
                      </div>
                      <div className={NEO.cardPressed + " p-4 bg-red-50/40"}>
                        <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Factures impayées</p>
                        <p className="text-2xl font-bold text-red-700">{contractGlobalStats.totalUnpaidInvoices}</p>
                      </div>
                    </div>
                  )}

                  {selectedContractClient ? (
                    <ContractDetailView
                      client={selectedContractClient}
                      subscriptions={subscriptions}
                      subscriptionPlans={subscriptionPlans}
                      invoices={invoices}
                      onDownloadContract={handleDownloadContract}
                      onViewInvoiceDetails={(invoice) => {
                        setSelectedInvoice(invoice);
                        setIsInvoiceDetailsOpen(true);
                      }}
                      onMarkAsPaid={handleMarkAsPaid}
                      onDownloadInvoicePdf={handleDownloadInvoicePdf}
                      formatCurrency={formatCurrency}
                      format={format}
                      fr={fr}
                    />
                  ) : (
                    filteredContractSubscriptions.map((sub) => {
                      const client = users.find(u => u.id === sub.clientId);
                      const plan = subscriptionPlans.find(p => p.id === sub.planId);
                      const clientInvoices = invoices.filter(inv => inv.clientId === sub.clientId);
                      const paidCount = clientInvoices.filter(inv => inv.status === "paid").length;
                      const pendingCount = clientInvoices.filter(inv => inv.status === "pending").length;
                      const overdueCount = clientInvoices.filter(inv => inv.status === "overdue").length;
                      
                      return (
                        <div key={sub.id} className={NEO.card + " overflow-hidden"}>
                          <div className="p-5">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <User className="h-5 w-5 text-[#0B676E]" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg text-slate-900">{client?.fullName || "Client"}</h4>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {client?.email || "N/A"}
                                      </span>
                                      {client?.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3.5 w-3.5" />
                                          {client.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                  <Badge className="bg-[#eef2f5] text-slate-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] font-normal">
                                    {plan?.name || "Standard"}
                                  </Badge>
                                  <Badge className="bg-blue-100 text-blue-700 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] font-normal">
                                    {plan?.pricePerMonth || "0"} Ar/mois
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    Début: {format(new Date(sub.startDate), "dd/MM/yyyy")}
                                    {sub.endDate && ` - Fin: ${format(new Date(sub.endDate), "dd/MM/yyyy")}`}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedContractClient(client || null);
                                    setContractSearchQuery(client?.fullName || '');
                                  }}
                                  className={NEO.button + " gap-1"}
                                >
                                  <Eye className="h-4 w-4" />
                                  Détails
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleOpenNewContract(client, sub)} 
                                  className={NEO.buttonPrimary + " gap-1"}
                                >
                                  <FileText className="h-4 w-4" />
                                  Contrat
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/40">
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Factures</p>
                                <p className="text-xl font-bold text-slate-800">{paidCount + pendingCount + overdueCount}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-emerald-600">Payées</p>
                                <p className="text-xl font-bold text-emerald-700">{paidCount}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-amber-600">En attente</p>
                                <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-red-600">En retard</p>
                                <p className="text-xl font-bold text-red-700">{overdueCount}</p>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Taux de paiement</span>
                                <span>{paidCount + pendingCount + overdueCount > 0 ? Math.round((paidCount / (paidCount + pendingCount + overdueCount)) * 100) : 0}%</span>
                              </div>
                              <div className="w-full bg-[#eef2f5] rounded-full h-2 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <div 
                                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${paidCount + pendingCount + overdueCount > 0 ? (paidCount / (paidCount + pendingCount + overdueCount)) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            
                            {overdueCount > 0 && (
                              <div className={NEO.cardPressed + " mt-4 p-3 bg-red-50/40 border border-red-200 flex items-center justify-between"}>
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                  <span className="text-sm text-red-700">
                                    {overdueCount} facture(s) en retard - Montant total: {formatCurrency(
                                      clientInvoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount), 0)
                                    )}
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className={NEO.button + " text-red-600 hover:text-red-700"}
                                  onClick={() => {
                                    setInvoiceFilter("overdue");
                                    setInvoiceMonthFilter("all");
                                    setSearchQuery(client?.fullName || '');
                                    setIsContractViewOpen(false);
                                  }}
                                >
                                  Voir les détails
                                </Button>
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

        {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION */}
        <AlertDialog open={deleteInvoiceId !== null} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
          <AlertDialogContent className="bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-800">Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                Cette action est irréversible. La facture sera définitivement supprimée de la base de données.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3">
              <AlertDialogCancel className={NEO.button}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteInvoiceId && deleteInvoiceMutation.mutate(deleteInvoiceId)} 
                className="bg-red-600 hover:bg-red-700 text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff]"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}