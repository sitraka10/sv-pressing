// ClientSiteSections.tsx — VERSION REFONDUE
// Design plat & pro, aligné sur admin-dashboard-complete.
// Logique métier 100 % conservée.
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, UserPlus, UserCheck, User, AlertTriangle, FileText,
  CheckCircle, X, Phone, Shield, Clock, Star, Package, Truck,
  Calendar, MapPin, Mail, Users, DollarSign, RefreshCw, TrendingUp,
  Info, Home, MessageSquare, Crown, ShieldCheck, Check,
  XCircle, Eye, Download, Filter, Search, MoreVertical, Edit,
  Trash2, ChevronDown, AlertCircle, ChevronLeft,
  ChevronRight as ChevronRightIcon, Euro, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   TYPES
============================================================ */
type Mutation<T> = {
  mutate: (vars: T, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => void;
  isPending?: boolean;
};
type SafeFormatDate = (d?: string | Date | null) => string;

interface Subscription {
  id: number; planId: number; planName: string; planType: string;
  planPrice: string; clientName: string; clientFirstName: string;
  clientEmail: string; clientPhone: string; clientAddress: string;
  specialRequirements?: string; status: string; createdAt: string;
  userId?: number; userFullName?: string; userEmail?: string;
  userPhone?: string; userAddress?: string; userCreatedAt?: string;
  userStatus?: string; userIsActive?: boolean;
  userSelectedPlanId?: number; neighborhood?: string;
}

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  input: "h-9 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/15",
  btn: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-lg bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  btnApprove: "h-9 rounded-lg bg-emerald-600 font-medium text-white hover:bg-emerald-700",
  btnReject: "h-9 rounded-lg border border-red-200 bg-white font-medium text-red-600 hover:bg-red-50",
  btnView: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  dialog: "rounded-xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
  well: "rounded-lg border border-slate-200 bg-slate-50/70",
};

type Tone = "brand" | "green" | "red" | "amber" | "blue" | "slate" | "purple";
const accentBar: Record<Tone, string> = {
  brand: "before:bg-[#0B676E]", green: "before:bg-emerald-500", red: "before:bg-red-500",
  amber: "before:bg-amber-500", blue: "before:bg-blue-500", purple: "before:bg-violet-500", slate: "before:bg-slate-400",
};
const Pill: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = "slate", className, children }) => {
  const map: Record<Tone, string> = {
    brand: "bg-[#0B676E]/8 text-[#0B676E]", green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700", purple: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", map[tone], className)}>{children}</span>;
};

/* MiniKPI sans icône (barre d'accent à gauche) */
const MiniKPI: React.FC<{
  title: string; value: string | number; subtitle?: string;
  tone?: Tone; progress?: number; progressLabel?: string;
}> = ({ title, value, subtitle, tone = "brand", progress, progressLabel }) => {
  const isZero = value === 0 || value === "0" || value === "0 Ar" || value === "0%";
  return (
    <div className={cn(
      ui.card, "relative overflow-hidden p-4 pl-5",
      "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:content-['']",
      accentBar[tone]
    )}>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={cn("mt-1.5 text-[22px] leading-tight font-semibold tabular-nums", isZero ? "text-slate-400" : "text-slate-900")}>{value}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", accentBar[tone].replace("before:", ""))} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   INSCRIPTIONS SECTION
============================================================ */
export function RegistrationsSection({
  users, toggleUserStatusMutation, safeFormatDate, subscriptionPlans = [],
}: {
  users: any[] | undefined;
  toggleUserStatusMutation: Mutation<{ id: string; status: "approved" | "refused"; isActive?: boolean }>;
  safeFormatDate: SafeFormatDate;
  subscriptionPlans?: any[];
}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [forceData, setForceData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchAllSubscriptions = async () => {
    try {
      setLoading(true); setError(null);
      const response = await fetch('/api/pending-subscriptions?status=all', {
        method: 'GET', credentials: 'include',
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setSubscriptions(result.data);
        setHiddenIds(new Set()); setProcessingIds(new Set());
      } else throw new Error("Format de données invalide");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSubscriptions();
    const interval = setInterval(fetchAllSubscriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  const effectiveUsers = React.useMemo(() => {
    if (loading && forceData.length === 0 && subscriptions.length === 0) return [];
    if (subscriptions.length > 0) {
      return subscriptions.map(item => ({
        ...item,
        fullName: item.clientName || item.userFullName || (item as any).fullName,
        email: item.clientEmail || item.userEmail || (item as any).email,
        phone: item.clientPhone || item.userPhone || (item as any).phone,
        address: item.clientAddress || item.userAddress || (item as any).address,
        createdAt: item.createdAt || item.userCreatedAt,
        status: item.status || item.userStatus || "pending",
        isActive: item.userIsActive || false,
        userId: item.userId || item.id,
        selectedPlanId: item.planId || item.userSelectedPlanId,
        planName: item.planName || `Plan ${item.planId}`,
        planType: item.planType, planPrice: item.planPrice,
        specialRequirements: item.specialRequirements,
        hasValidPlan: !!(item.planId || item.planName),
        planSelectionId: item.id,
        neighborhood: item.neighborhood || "Non spécifié",
      }));
    }
    if (forceData.length > 0) {
      return forceData.map(item => ({
        ...item,
        fullName: item.userFullName || item.fullName,
        email: item.userEmail || item.email,
        phone: item.userPhone || item.phone,
        address: item.userAddress || item.address,
        createdAt: item.userCreatedAt || item.createdAt,
        status: item.userStatus || item.status,
        isActive: item.userIsActive || item.isActive,
        userId: item.userId || item.id,
        selectedPlanId: item.selectedPlanId || item.planId,
        planName: item.planName || `Plan ${item.selectedPlanId || item.planId}`,
        planType: item.planType, planPrice: item.planPrice,
        hasValidPlan: !!(item.selectedPlanId || item.planId || item.planName),
        planSelectionId: item.id,
        neighborhood: item.neighborhood || "Non spécifié",
      }));
    }
    const validUsers = Array.isArray(users) ? users.filter(u => u.selectedPlanId || u.planId || u.planName) : [];
    return validUsers.map(u => ({ ...u, planSelectionId: u.id, neighborhood: u.neighborhood || "Non spécifié" }));
  }, [users, forceData, subscriptions, loading]);

  const createClientFromSubscription = async (subscription: any) => {
    const clientData = {
      fullName: subscription.clientName || subscription.fullName,
      phone: subscription.clientPhone || subscription.phone,
      email: subscription.clientEmail || subscription.email,
      neighborhood: subscription.neighborhood || "Non spécifié",
      addressDetails: subscription.clientAddress || subscription.address || "",
      preferredPickupDays: [],
    };
    const response = await fetch('/api/clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(clientData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }
    const newClient = await response.json();
    await fetch('/api/subscriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        clientId: newClient.id,
        planId: subscription.planId || subscription.selectedPlanId,
        startDate: new Date().toISOString(), isActive: true,
      }),
    });
    return newClient;
  };

  const updatePlanSelectionStatus = async (planSelectionId: number, status: "approved" | "refused") => {
    const response = await fetch(`/api/plan-selections/${planSelectionId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    return true;
  };

  const getPlanDetails = (registration: any) => {
    if (subscriptionPlans && registration.planId) {
      const realPlan = subscriptionPlans.find(p => p.id === registration.planId);
      if (realPlan) return {
        id: realPlan.id, name: realPlan.name, type: realPlan.type || 'essential',
        pricePerMonth: realPlan.pricePerMonth || realPlan.price || '0',
        itemsIncluded: realPlan.itemsIncluded || 0,
        pickupsPerWeek: realPlan.pickupsPerWeek || 0,
        deliveryTimeHours: realPlan.deliveryTimeHours || 24,
        features: realPlan.features || [], description: realPlan.description || '',
        source: 'real-db',
      };
    }
    if (registration.planName && registration.planPrice) return {
      id: registration.planId || 0, name: registration.planName,
      type: registration.planType || 'essential', pricePerMonth: registration.planPrice,
      itemsIncluded: registration.itemsIncluded || 0,
      pickupsPerWeek: registration.pickupsPerWeek || 0,
      deliveryTimeHours: registration.deliveryTimeHours || 24,
      features: registration.features || [], description: registration.description || '',
      source: 'api-direct',
    };
    return {
      id: registration.planId || 0, name: registration.planName || 'Plan Inconnu',
      type: registration.planType || 'essential', pricePerMonth: registration.planPrice || '0',
      itemsIncluded: 0, pickupsPerWeek: 0, deliveryTimeHours: 24,
      features: [], description: '', source: 'fallback',
    };
  };

  const getPlanConfig = (planType: string) => {
    const type = (planType || '').toLowerCase();
    let normalizedType = 'essential';
    if (type.includes('premium')) normalizedType = 'premium';
    else if (type.includes('family') || type.includes('familial')) normalizedType = 'family';
    const configs = {
      premium: { label: 'Premium', badgeColor: 'bg-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: Crown, description: 'Solution complète haut de gamme', priceRange: '75 000 Ar/mois', tone: 'amber' as Tone },
      family: { label: 'Familial', badgeColor: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Users, description: 'Idéal pour les familles', priceRange: '45 000 Ar/mois', tone: 'blue' as Tone },
      essential: { label: 'Essentiel', badgeColor: 'bg-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: ShieldCheck, description: 'Solution économique essentielle', priceRange: '25 000 Ar/mois', tone: 'green' as Tone },
    };
    return configs[normalizedType as keyof typeof configs] || configs.essential;
  };

  const pending = React.useMemo(() => {
    let filtered = effectiveUsers
      .filter((u: any) => (u.role === "client" || !u.role) && (u.status === "pending" || !u.status || u.status === "") && u.hasValidPlan !== false)
      .filter((u: any) => !hiddenIds.has(Number(u.userId || u.id)) && !processingIds.has(Number(u.userId || u.id)));
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.fullName || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.phone || '').includes(query)
      );
    }
    if (filterPlan !== "all") filtered = filtered.filter((u: any) => getPlanDetails(u).type === filterPlan);
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      switch (sortBy) {
        case "newest": return dateB - dateA;
        case "oldest": return dateA - dateB;
        case "name": return (a.fullName || '').localeCompare(b.fullName || '');
        default: return dateB - dateA;
      }
    });
    return filtered;
  }, [effectiveUsers, hiddenIds, processingIds, searchQuery, filterPlan, sortBy]);

  const approved = React.useMemo(() => {
    let filtered = effectiveUsers
      .filter((u: any) => (u.role === "client" || !u.role) && u.status === "approved" && u.hasValidPlan !== false);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.fullName || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.phone || '').includes(query)
      );
    }
    if (filterPlan !== "all") filtered = filtered.filter((u: any) => getPlanDetails(u).type === filterPlan);
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      switch (sortBy) {
        case "newest": return dateB - dateA;
        case "oldest": return dateA - dateB;
        case "name": return (a.fullName || '').localeCompare(b.fullName || '');
        default: return dateB - dateA;
      }
    });
    return filtered;
  }, [effectiveUsers, searchQuery, filterPlan, sortBy]);

  const currentUsers = React.useMemo(() => (activeTab === "pending" ? pending : approved), [activeTab, pending, approved]);
  const totalItems = currentUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = currentUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, filterPlan, sortBy]);

  const calculatePotentialRevenue = (usersList: any[]) => usersList.reduce((total, user) => {
    const plan = getPlanDetails(user);
    if (plan.pricePerMonth && plan.pricePerMonth !== '0') {
      try {
        const price = typeof plan.pricePerMonth === 'string' ? parseInt(plan.pricePerMonth.replace(/\D/g, ''), 10) : plan.pricePerMonth;
        return total + (isNaN(price) ? 0 : price);
      } catch { return total; }
    }
    return total;
  }, 0);

  const statsByPlanType = React.useMemo(() => {
    const stats = { premium: { count: 0, revenue: 0 }, family: { count: 0, revenue: 0 }, essential: { count: 0, revenue: 0 } };
    const currentUsers = activeTab === "pending" ? pending : approved;
    currentUsers.forEach(user => {
      const plan = getPlanDetails(user);
      const type = plan.type;
      const price = typeof plan.pricePerMonth === 'string' ? parseInt(plan.pricePerMonth.replace(/\D/g, ''), 10) : plan.pricePerMonth;
      if (stats[type as keyof typeof stats]) {
        stats[type as keyof typeof stats].count++;
        stats[type as keyof typeof stats].revenue += isNaN(price) ? 0 : price;
      }
    });
    return stats;
  }, [pending, approved, activeTab]);

  /* =========================
     HEADER
  ========================= */
  const HeaderSection = () => (
    <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4")}>
      <div>
        <h2 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#0B676E]" />
          Inscriptions
        </h2>
        <p className="text-[11.5px] text-slate-500 mt-0.5">Gérez les inscriptions avec plans choisis</p>
      </div>
      <div className="flex items-center gap-2">
        <Pill tone={activeTab === "pending" ? "green" : "blue"}>
          <span className={cn("h-1.5 w-1.5 rounded-full", activeTab === "pending" ? "bg-emerald-500 animate-pulse" : "bg-blue-500")} />
          {activeTab === "pending" ? pending.length : approved.length} {activeTab === "pending" ? "en attente" : "acceptés"}
        </Pill>
        <Button variant="outline" size="sm" onClick={fetchAllSubscriptions} className={cn(ui.btn, "gap-1.5")}>
          <RefreshCw className="h-3.5 w-3.5" />Actualiser
        </Button>
      </div>
    </div>
  );

  /* =========================
     FILTERS + TABS
  ========================= */
  const TabsSection = () => (
    <div className={ui.card}>
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex flex-wrap w-full rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <TabsTrigger value="pending" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <Clock className="h-3.5 w-3.5" />En attente
              {pending.length > 0 && <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
              <CheckCircle className="h-3.5 w-3.5" />Acceptés
              {approved.length > 0 && <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">{approved.length}</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col md:flex-row gap-2 items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder={`Rechercher un client ${activeTab === "pending" ? "en attente" : "accepté"}…`}
              className={cn(ui.input, "pl-8 text-[12.5px]")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(ui.btn, "gap-1.5")}>
                  <Filter className="h-3.5 w-3.5" />
                  {filterPlan === "all" ? "Tous les plans" : filterPlan === "premium" ? "Premium" : filterPlan === "family" ? "Familial" : "Essentiel"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterPlan("all")}>Tous les plans</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPlan("premium")}>
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />Premium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPlan("family")}>
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />Familial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPlan("essential")}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />Essentiel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(ui.btn, "gap-1.5")}>
                  Trier<ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>Plus récent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>Plus ancien</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>Nom (A-Z)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  /* =========================
     STATS
  ========================= */
  const MainStats = () => {
    const current = activeTab === "pending" ? pending : approved;
    const totalRevenue = calculatePotentialRevenue(current);
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MiniKPI
          title={activeTab === "pending" ? "Revenus potentiels" : "Revenus générés"}
          value={new Intl.NumberFormat('fr-FR').format(totalRevenue) + " Ar"}
          subtitle={activeTab === "pending" ? "Si tous validés" : "Total généré"}
          tone="blue"
        />
        <MiniKPI
          title={activeTab === "pending" ? "Clients en attente" : "Clients acceptés"}
          value={current.length}
          subtitle={activeTab === "pending" ? "Inscriptions à traiter" : "Inscriptions validées"}
          tone="green"
        />
        <MiniKPI
          title={activeTab === "pending" ? "Valeur moyenne" : "Revenu moyen"}
          value={(current.length > 0 ? new Intl.NumberFormat('fr-FR').format(Math.round(totalRevenue / current.length)) : '0') + " Ar"}
          subtitle={activeTab === "pending" ? "Par client" : "Par inscription"}
          tone="amber"
        />
      </div>
    );
  };

  const PlanStats = () => {
    const current = activeTab === "pending" ? pending : approved;
    return (
      <div className={ui.card}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-slate-900">Répartition par plan</h3>
            <Pill tone="slate">{activeTab === "pending" ? "En attente" : "Acceptés"}</Pill>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'essential', label: 'Essentiel', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
              { key: 'family', label: 'Familial', dot: 'bg-blue-500', bar: 'bg-blue-500' },
              { key: 'premium', label: 'Premium', dot: 'bg-amber-500', bar: 'bg-amber-500' },
            ].map(({ key, label, dot, bar }) => {
              const stat = statsByPlanType[key as keyof typeof statsByPlanType];
              const pct = current.length > 0 ? (stat.count / current.length) * 100 : 0;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", dot)} />
                      <span className="text-[12px] font-medium text-slate-800">{label}</span>
                    </div>
                    <Pill tone="slate">{stat.count}</Pill>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Revenus</span>
                    <span className="font-medium text-slate-800">{new Intl.NumberFormat('fr-FR').format(stat.revenue)} Ar</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* =========================
     PAGINATION
  ========================= */
  const PaginationSection = () => {
    if (totalItems <= itemsPerPage) return null;
    return (
      <div className={cn(ui.card, "p-3 flex flex-col sm:flex-row items-center justify-between gap-3")}>
        <div className="text-[11px] text-slate-500">
          Affichage de <span className="font-medium text-slate-700">{startIndex + 1}</span>–<span className="font-medium text-slate-700">{endIndex}</span> sur{" "}
          <span className="font-medium text-slate-700">{totalItems}</span> inscriptions{" "}
          {activeTab === "pending" ? "en attente" : "acceptées"}
          {processingIds.size > 0 && activeTab === "pending" && (
            <> • <span className="text-blue-600">{processingIds.size} en traitement</span></>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Par page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className={cn(ui.input, "w-[70px] h-7 text-[11px]")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className={cn(ui.btn, "h-7 w-7 p-0")} onClick={prevPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <Button key={pageNum} size="sm" className={cn("w-7 h-7 text-[11px]", currentPage === pageNum ? ui.btnPrimary : ui.btn)} onClick={() => goToPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-[11px] px-1 self-center text-slate-400">…</span>
                <Button variant="outline" size="sm" className={cn(ui.btn, "h-7 w-7 text-[11px]")} onClick={() => goToPage(totalPages)}>{totalPages}</Button>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" className={cn(ui.btn, "h-7 w-7 p-0")} onClick={nextPage} disabled={currentPage === totalPages}>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className={cn(ui.btn, "gap-1.5 h-7 text-[11px]")}>
            <Download className="h-3 w-3" />Exporter
          </Button>
        </div>
      </div>
    );
  };

  /* =========================
     CLIENT CARD
  ========================= */
  const ClientCard = ({ registration, isApproved = false }: { registration: any; isApproved?: boolean }) => {
    const selectedPlan = getPlanDetails(registration);
    const planConfig = getPlanConfig(selectedPlan.type);
    const PlanIcon = planConfig.icon;
    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL';

    const handleApprove = async () => {
      const userId = Number(registration.userId || registration.id);
      const planSelectionId = registration.planSelectionId || registration.id;
      if (window.confirm(`Approuver l'inscription de ${registration.fullName} ?`)) {
        try {
          setProcessingIds(prev => new Set(prev).add(userId));
          setHiddenIds(prev => new Set(prev).add(userId));
          await updatePlanSelectionStatus(planSelectionId, "approved");
          await createClientFromSubscription(registration);
          toggleUserStatusMutation.mutate({ id: userId.toString(), status: "approved", isActive: true }, {
            onSuccess: () => setTimeout(() => {
              fetchAllSubscriptions();
              setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
            }, 1000),
            onError: () => {
              setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
              setHiddenIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
            }
          });
        } catch (error) {
          setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
          setHiddenIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
        }
      }
    };

    const handleReject = async () => {
      const userId = Number(registration.userId || registration.id);
      const planSelectionId = registration.planSelectionId || registration.id;
      if (window.confirm(`Refuser l'inscription de ${registration.fullName} ?`)) {
        try {
          setProcessingIds(prev => new Set(prev).add(userId));
          setHiddenIds(prev => new Set(prev).add(userId));
          await updatePlanSelectionStatus(planSelectionId, "refused");
          toggleUserStatusMutation.mutate({ id: userId.toString(), status: "refused", isActive: false }, {
            onSuccess: () => setTimeout(() => {
              fetchAllSubscriptions();
              setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
            }, 1000),
            onError: () => {
              setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
              setHiddenIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
            }
          });
        } catch (error) {
          setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
          setHiddenIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
        }
      }
    };

    const isProcessing = processingIds.has(Number(registration.userId || registration.id));
    const daysSince = Math.floor((new Date().getTime() - new Date(registration.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className={cn(
        ui.card, "relative overflow-hidden transition-all",
        isProcessing && "opacity-60 pointer-events-none",
        !isApproved ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-amber-400" : "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-emerald-500"
      )}>
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <div className="text-center">
              <Loader2 className="h-7 w-7 text-[#0B676E] animate-spin mx-auto mb-2" />
              <p className="text-[11px] text-slate-600">Traitement en cours…</p>
            </div>
          </div>
        )}

        <div className="p-4 pl-5 space-y-3">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className={cn("text-white font-semibold text-[13px]", planConfig.badgeColor)}>
                  {getInitials(registration.fullName || 'CL')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-semibold text-[13px] text-slate-900 truncate">{registration.fullName || 'Client sans nom'}</h3>
                  {isApproved ? <Pill tone="green"><CheckCircle className="h-3 w-3" />Accepté</Pill> : <Pill tone="amber"><Clock className="h-3 w-3" />En attente</Pill>}
                  <Pill tone={planConfig.tone as Tone}>{planConfig.label}</Pill>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{registration.email || 'Non spécifié'}</span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{registration.phone || 'Non spécifié'}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100" disabled={isProcessing}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-slate-200">
                <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Voir détails</DropdownMenuItem>
                <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                {!isApproved && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={handleReject}>
                      <Trash2 className="h-4 w-4 mr-2" />Refuser
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Plan */}
          <div className={cn("rounded-lg border p-3", planConfig.borderColor, planConfig.bgColor)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <PlanIcon className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-[11.5px] font-semibold text-slate-800">Plan sélectionné</span>
              </div>
              <span className={cn("text-[10.5px] font-semibold text-white px-1.5 py-0.5 rounded", planConfig.badgeColor)}>{planConfig.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-slate-900 truncate">{selectedPlan.name}</p>
                <p className="text-[11px] text-slate-600">{planConfig.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-[15px] text-slate-900 tabular-nums">
                  {new Intl.NumberFormat('fr-FR').format(parseInt(selectedPlan.pricePerMonth.toString().replace(/\D/g, '')) || 0)}
                  <span className="text-[10.5px] text-slate-500 ml-1">Ar</span>
                </p>
                <p className="text-[10px] text-slate-400">ID {selectedPlan.id}</p>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5"><Package className="h-3 w-3 text-slate-500" /><span>{selectedPlan.itemsIncluded || '∞'} pièces</span></div>
              <div className="flex items-center gap-1.5"><Truck className="h-3 w-3 text-slate-500" /><span>{selectedPlan.pickupsPerWeek || 2} collectes/sem.</span></div>
              <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-slate-500" /><span>Livraison {selectedPlan.deliveryTimeHours}h</span></div>
              <div className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-slate-500" /><span>Assurance</span></div>
            </div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11.5px]">
            <div className={cn(ui.well, "p-2.5 flex items-start gap-2")}>
              <Home className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500">Adresse</p>
                <p className="text-slate-800 truncate">{registration.address || 'Non spécifiée'}</p>
              </div>
            </div>
            <div className={cn(ui.well, "p-2.5 flex items-start gap-2")}>
              <Calendar className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500">Inscription</p>
                <p className="text-slate-800 truncate">{safeFormatDate(registration.createdAt)}</p>
                <p className="text-[10px] text-slate-500">il y a {daysSince} j</p>
              </div>
            </div>
          </div>

          {registration.specialRequirements && (
            <div className={cn(ui.well, "p-2.5")}>
              <p className="text-[10.5px] font-medium text-slate-700 mb-1">Exigences spéciales</p>
              <p className="text-[11.5px] text-slate-600">{registration.specialRequirements}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
              {isApproved ? (
                <><CheckCircle className="h-3 w-3 text-emerald-500" /><span>Accepté le {safeFormatDate(registration.updatedAt || registration.createdAt)}</span></>
              ) : (
                <><Clock className="h-3 w-3" /><span>En attente depuis {safeFormatDate(registration.createdAt)}</span></>
              )}
            </div>
            {!isApproved && !isProcessing && (
              <div className="flex gap-1.5 w-full sm:w-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className={cn(ui.btnView, "h-8 text-[11px] gap-1.5 flex-1 sm:flex-none")}>
                        <Eye className="h-3.5 w-3.5" />Profil
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px]">Voir le profil complet</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className={cn(ui.btnReject, "h-8 text-[11px] gap-1.5 flex-1 sm:flex-none")} onClick={handleReject} disabled={toggleUserStatusMutation.isPending}>
                        <UserX className="h-3.5 w-3.5" />Refuser
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px]">Refuser l'inscription</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className={cn(ui.btnApprove, "h-8 text-[11px] gap-1.5 flex-1 sm:flex-none")} onClick={handleApprove} disabled={toggleUserStatusMutation.isPending}>
                        {toggleUserStatusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><UserCheck className="h-3.5 w-3.5" />Approuver</>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px]">Accepter l'inscription et activer le compte</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            {isApproved && (
              <div className="flex gap-1.5 w-full sm:w-auto">
                <Button size="sm" variant="outline" className={cn(ui.btn, "h-8 text-[11px] gap-1.5 flex-1 sm:flex-none")}>
                  <MessageSquare className="h-3.5 w-3.5" />Contacter
                </Button>
                <Button size="sm" variant="outline" className={cn(ui.btn, "h-8 text-[11px] gap-1.5 flex-1 sm:flex-none")}>
                  <Edit className="h-3.5 w-3.5" />Modifier
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* =========================
     RENDER
  ========================= */
  if (loading && pending.length === 0 && approved.length === 0) {
    return (
      <div className="space-y-4">
        <HeaderSection />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-[#0B676E] animate-spin mb-3" />
          <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Chargement des inscriptions</h3>
          <p className="text-[11.5px] text-slate-500">Récupération des données en cours…</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="space-y-4">
        <HeaderSection />
        <div className={cn(ui.card, "p-8 text-center border-red-200 bg-red-50/50")}>
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">Erreur de chargement</h3>
          <p className="text-[11.5px] text-slate-600 mb-3">{error}</p>
          <Button onClick={fetchAllSubscriptions} className={cn(ui.btnPrimary, "gap-1.5")}>
            <RefreshCw className="h-3.5 w-3.5" />Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HeaderSection />
      <TabsSection />

      {error && (
        <div className={cn(ui.card, "p-3 border-red-200 bg-red-50/50 flex items-center gap-2")}>
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-[11.5px] text-red-700 flex-1">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchAllSubscriptions} className={cn(ui.btn, "h-7 text-[11px]")}>Réessayer</Button>
        </div>
      )}

      {activeTab === "pending" && pending.length === 0 && !loading && (
        <div className={cn(ui.card, "p-12 text-center border-dashed")}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 mb-3">
            <UserCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">Aucune inscription en attente</h3>
          <p className="text-[11.5px] text-slate-500 max-w-sm mx-auto mb-4">
            Toutes les inscriptions avec plans ont été traitées.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchAllSubscriptions} className={cn(ui.btnPrimary, "gap-1.5")}>
              <RefreshCw className="h-3.5 w-3.5" />Actualiser
            </Button>
            <Button variant="outline" className={cn(ui.btn, "gap-1.5")} onClick={() => setActiveTab("approved")}>
              <CheckCircle className="h-3.5 w-3.5" />Voir les acceptés
            </Button>
          </div>
        </div>
      )}

      {activeTab === "approved" && approved.length === 0 && !loading && (
        <div className={cn(ui.card, "p-12 text-center border-dashed")}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-3">
            <Users className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">Aucun client accepté</h3>
          <p className="text-[11.5px] text-slate-500 max-w-sm mx-auto mb-4">
            Aucune inscription n'a encore été acceptée.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchAllSubscriptions} className={cn(ui.btnPrimary, "gap-1.5")}>
              <RefreshCw className="h-3.5 w-3.5" />Actualiser
            </Button>
            <Button variant="outline" className={cn(ui.btn, "gap-1.5")} onClick={() => setActiveTab("pending")}>
              <Clock className="h-3.5 w-3.5" />Voir les en attente
            </Button>
          </div>
        </div>
      )}

      {(activeTab === "pending" && pending.length > 0) || (activeTab === "approved" && approved.length > 0) ? (
        <>
          <MainStats />
          <PlanStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {paginatedUsers.map((registration: any) => (
              <ClientCard key={`${registration.userId || registration.id}-${registration.planSelectionId}`} registration={registration} isApproved={activeTab === "approved"} />
            ))}
          </div>
          <PaginationSection />
        </>
      ) : null}
    </div>
  );
}

/* ============================================================
   CUSTOM QUOTES SECTION
============================================================ */
export function CustomQuotesSection({
  customQuotes, updateQuoteStatusMutation, setNewPlanData, setIsNewPlanOpen,
  setActiveTab, toast, safeFormatDate, createPlanMutation, queryClient,
}: {
  customQuotes: any[] | undefined;
  updateQuoteStatusMutation: Mutation<{ id: string; status: "approved" | "rejected" | "reviewed" }>;
  setNewPlanData: (d: any) => void;
  setIsNewPlanOpen: (v: boolean) => void;
  setActiveTab: (v: string) => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" | null }) => void;
  safeFormatDate: SafeFormatDate;
  createPlanMutation?: any;
  queryClient?: any;
}) {
  const [hiddenQuoteIds, setHiddenQuoteIds] = React.useState<Set<number | string>>(new Set());
  const [processingQuoteIds, setProcessingQuoteIds] = React.useState<Set<number | string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [selectedQuoteForConversion, setSelectedQuoteForConversion] = React.useState<any>(null);
  const [conversionFormData, setConversionFormData] = React.useState({
    planName: "", pricePerMonth: "", description: "",
    itemsIncluded: 20, pickupsPerWeek: 2, deliveryTimeHours: 48,
  });
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(10);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  const createClientFromQuote = async (quote: any) => {
    const clientData = {
      fullName: quote.fullName, phone: quote.phone, email: quote.email,
      neighborhood: quote.neighborhood || "Non spécifié",
      addressDetails: quote.addressDetails || "",
      preferredPickupDays: [],
    };
    const response = await fetch('/api/clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(clientData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }
    return response.json();
  };

  const createPrivatePlanFromQuote = async (quote: any, planData: any) => {
    const newClient = await createClientFromQuote(quote);
    const planPayload = {
      name: planData.planName, pricePerMonth: `${planData.pricePerMonth} Ar`,
      type: "custom", itemsIncluded: Number(planData.itemsIncluded),
      pickupsPerWeek: Number(planData.pickupsPerWeek),
      deliveryTimeHours: Number(planData.deliveryTimeHours),
      isActive: true,
      features: ["Ramassage à domicile", "Nettoyage premium", "Support prioritaire"],
      description: planData.description,
      clientId: newClient.id, clientName: quote.fullName, clientEmail: quote.email,
    };
    const planResponse = await fetch('/api/subscription-plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(planPayload),
    });
    if (!planResponse.ok) throw new Error(`Erreur création plan: ${planResponse.status}`);
    const newPlan = await planResponse.json();
    await fetch('/api/subscriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clientId: newClient.id, planId: newPlan.id, startDate: new Date().toISOString(), isActive: true }),
    });
    return { client: newClient, plan: newPlan };
  };

  const handleQuoteApprove = async (quote: any) => {
    const quoteId = quote.id;
    if (window.confirm(`Approuver le devis de ${quote.fullName} et créer un client ?`)) {
      try {
        setProcessingQuoteIds(prev => new Set(prev).add(quoteId));
        setHiddenQuoteIds(prev => new Set(prev).add(quoteId));
        const planData = {
          planName: `${quote.fullName} - Personnalisé`,
          pricePerMonth: quote.estimatedValue?.toString() || "50000",
          description: `Plan personnalisé pour ${quote.fullName}\n\nDemande initiale: ${quote.notes || "Aucune note"}\nPièces/semaine: ${quote.itemsPerWeek || "Non spécifié"}\nType de service: ${quote.serviceType || "Standard"}`,
          itemsIncluded: quote.itemsPerWeek || 20, pickupsPerWeek: 2, deliveryTimeHours: 48,
        };
        const { client, plan } = await createPrivatePlanFromQuote(quote, planData);
        updateQuoteStatusMutation.mutate({ id: quoteId, status: "approved" }, {
          onSuccess: () => {
            toast({ title: "Devis approuvé et client créé", description: `Le client ${client.fullName} a été créé avec un plan personnalisé.` });
            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
              queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            }
            setTimeout(() => setProcessingQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; }), 1000);
          },
          onError: () => {
            toast({ title: "Erreur", description: "Client créé mais erreur de mise à jour du devis.", variant: "destructive" });
            setProcessingQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; });
            setHiddenQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; });
          }
        });
      } catch (error) {
        toast({ title: "Erreur de création", description: error instanceof Error ? error.message : "Impossible de créer le client.", variant: "destructive" });
        setProcessingQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; });
        setHiddenQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; });
      }
    }
  };

  const allQuotes = React.useMemo(() => {
    let filtered = Array.isArray(customQuotes) ? customQuotes.filter((q: any) => !hiddenQuoteIds.has(q.id) && !processingQuoteIds.has(q.id)) : [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((q2: any) => (q2.fullName || '').toLowerCase().includes(q) || (q2.email || '').toLowerCase().includes(q) || (q2.phone || '').includes(q));
    }
    if (statusFilter !== "all") filtered = filtered.filter((q: any) => q.status === statusFilter);
    return filtered;
  }, [customQuotes, hiddenQuoteIds, processingQuoteIds, searchQuery, statusFilter]);

  const totalItems = allQuotes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const quotes = allQuotes.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const stats = React.useMemo(() => ({
    pending: allQuotes.filter((q: any) => q.status === "pending").length,
    approved: allQuotes.filter((q: any) => q.status === "approved").length,
    rejected: allQuotes.filter((q: any) => q.status === "rejected").length,
    all: customQuotes?.length || 0,
    totalValue: allQuotes.reduce((sum, q) => sum + (q.estimatedValue || 0), 0),
  }), [allQuotes, customQuotes]);

  const handleQuoteStatusUpdate = (quoteId: string, status: "approved" | "rejected" | "reviewed") => {
    if (status === "approved") {
      const quote = allQuotes.find(q => q.id === quoteId);
      if (quote) handleQuoteApprove(quote);
      return;
    }
    setProcessingQuoteIds(prev => new Set(prev).add(quoteId));
    setHiddenQuoteIds(prev => new Set(prev).add(quoteId));
    updateQuoteStatusMutation.mutate({ id: quoteId, status }, {
      onSuccess: () => {
        setTimeout(() => setProcessingQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; }), 1000);
        toast({ title: `Devis ${status === "rejected" ? "refusé" : "révisé"}`, description: `Le devis a été ${status === "rejected" ? "refusé" : "révisé"} avec succès.` });
      }
    });
  };

  const openConvertToPrivatePlan = (quote: any) => {
    setSelectedQuoteForConversion(quote);
    setConversionFormData({
      planName: `${quote.fullName} - Personnalisé`,
      pricePerMonth: quote.estimatedValue?.toString() || "",
      description: `Plan personnalisé pour ${quote.fullName}\n\nDemande initiale: ${quote.notes || "Aucune note"}\nPièces/semaine: ${quote.itemsPerWeek || "Non spécifié"}\nType de service: ${quote.serviceType || "Standard"}`,
      itemsIncluded: quote.itemsPerWeek || 20, pickupsPerWeek: 2, deliveryTimeHours: 48,
    });
    setConvertDialogOpen(true);
  };

  const handleCreatePrivatePlan = async () => {
    if (!selectedQuoteForConversion) return;
    const { planName, pricePerMonth, description, itemsIncluded, pickupsPerWeek, deliveryTimeHours } = conversionFormData;
    if (!planName || !pricePerMonth || isNaN(Number(pricePerMonth))) {
      toast({ title: "Erreur de validation", description: "Veuillez saisir un nom de plan et un prix valide.", variant: "destructive" });
      return;
    }
    try {
      const quoteId = selectedQuoteForConversion.id;
      setProcessingQuoteIds(prev => new Set(prev).add(quoteId));
      const { client, plan } = await createPrivatePlanFromQuote(selectedQuoteForConversion, { planName, pricePerMonth, description, itemsIncluded, pickupsPerWeek, deliveryTimeHours });
      updateQuoteStatusMutation.mutate({ id: quoteId, status: "approved" }, {
        onSuccess: () => {
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
          }
          toast({ title: "Plan privé créé", description: `Le plan "${planName}" a été créé et le client ${client.fullName} a été enregistré.` });
          setConvertDialogOpen(false);
          setSelectedQuoteForConversion(null);
          setTimeout(() => setProcessingQuoteIds(prev => { const s = new Set(prev); s.delete(quoteId); return s; }), 1000);
        }
      });
    } catch (error) {
      toast({ title: "Erreur de création", description: error instanceof Error ? error.message : "Impossible de créer le plan privé.", variant: "destructive" });
      setProcessingQuoteIds(prev => { const s = new Set(prev); s.delete(selectedQuoteForConversion.id); return s; });
    }
  };

  const HeaderSection = () => (
    <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4")}>
      <div>
        <h2 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#0B676E]" />Devis personnalisés
        </h2>
        <p className="text-[11.5px] text-slate-500 mt-0.5">Gérez les demandes de plans sur mesure</p>
      </div>
      <Pill tone="purple">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
        {allQuotes.length} {statusFilter === "all" ? "devis" : statusFilter === "pending" ? "en attente" : statusFilter}
      </Pill>
    </div>
  );

  const FilterSection = () => (
    <div className={ui.card}>
      <div className="p-3 flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder={`Rechercher un devis${statusFilter !== "all" ? ` ${statusFilter}` : ""}…`} className={cn(ui.input, "pl-8 text-[12.5px]")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {[
              { v: "all", l: "Tous", count: stats.all, icon: FileText },
              { v: "pending", l: "En attente", count: stats.pending, icon: Clock },
              { v: "approved", l: "Approuvés", count: stats.approved, icon: CheckCircle },
              { v: "rejected", l: "Refusés", count: stats.rejected, icon: XCircle },
            ].map(t => (
              <TabsTrigger key={t.v} value={t.v} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">
                <t.icon className="h-3 w-3" />{t.l}
                {t.count > 0 && <span className="ml-0.5 rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-600">{t.count}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MiniKPI title="Total" value={stats.all} subtitle="Devis reçus" tone="blue" />
      <MiniKPI title="En attente" value={stats.pending} subtitle="À traiter" tone="amber" />
      <MiniKPI title="Approuvés" value={stats.approved} subtitle="Validés" tone="green" />
      <MiniKPI title="Valeur totale" value={new Intl.NumberFormat('fr-FR').format(stats.totalValue) + " Ar"} subtitle="Estimation" tone="purple" />
    </div>
  );

  const PaginationSection = () => {
    if (totalItems <= itemsPerPage) return null;
    return (
      <div className={cn(ui.card, "p-3 flex flex-col sm:flex-row items-center justify-between gap-3")}>
        <div className="text-[11px] text-slate-500">
          Affichage de <span className="font-medium text-slate-700">{startIndex + 1}</span>–<span className="font-medium text-slate-700">{endIndex}</span> sur{" "}
          <span className="font-medium text-slate-700">{totalItems}</span> devis
          {statusFilter !== "all" && ` ${statusFilter}`}
          {processingQuoteIds.size > 0 && <> • <span className="text-violet-600">{processingQuoteIds.size} en traitement</span></>}
          <span className="mx-1">•</span>
          Valeur: <span className="font-semibold text-slate-800">{new Intl.NumberFormat('fr-FR').format(stats.totalValue)} Ar</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className={cn(ui.input, "w-[70px] h-7 text-[11px]")}><SelectValue /></SelectTrigger>
            <SelectContent>{[5, 10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className={cn(ui.btn, "h-7 w-7 p-0")} onClick={prevPage} disabled={currentPage === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return <Button key={pageNum} size="sm" className={cn("w-7 h-7 text-[11px]", currentPage === pageNum ? ui.btnPrimary : ui.btn)} onClick={() => goToPage(pageNum)}>{pageNum}</Button>;
            })}
          </div>
          <Button variant="outline" size="sm" className={cn(ui.btn, "h-7 w-7 p-0")} onClick={nextPage} disabled={currentPage === totalPages}><ChevronRightIcon className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="sm" className={cn(ui.btn, "gap-1.5 h-7 text-[11px]")}><Download className="h-3 w-3" />Exporter</Button>
        </div>
      </div>
    );
  };

  const ConvertToPrivatePlanDialog = () => (
    <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
      <DialogContent className={cn(ui.dialog, "sm:max-w-[600px] max-h-[90vh] overflow-y-auto")}>
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />Convertir en plan privé
          </DialogTitle>
          <DialogDescription className="text-[11.5px]">Créez un plan personnalisé pour le client.</DialogDescription>
        </DialogHeader>
        {selectedQuoteForConversion && (
          <div className="space-y-3 py-2">
            <div className={cn(ui.well, "p-3")}>
              <h4 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">Demande initiale</h4>
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div><span className="text-slate-500">Client:</span><p className="font-medium text-slate-800">{selectedQuoteForConversion.fullName}</p></div>
                <div><span className="text-slate-500">Email:</span><p className="font-medium text-slate-800 truncate">{selectedQuoteForConversion.email}</p></div>
                <div><span className="text-slate-500">Pièces/sem.:</span><p className="font-medium text-slate-800">{selectedQuoteForConversion.itemsPerWeek || "—"}</p></div>
                <div><span className="text-slate-500">Valeur:</span><p className="font-medium text-slate-800">{new Intl.NumberFormat('fr-FR').format(selectedQuoteForConversion.estimatedValue || 0)} Ar</p></div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11.5px]">Nom du plan *</Label>
              <Input className={ui.input} placeholder="Plan Personnalisé" value={conversionFormData.planName} onChange={(e) => setConversionFormData({ ...conversionFormData, planName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11.5px]">Prix mensuel (Ar) *</Label>
              <Input type="number" className={ui.input} placeholder="50000" value={conversionFormData.pricePerMonth} onChange={(e) => setConversionFormData({ ...conversionFormData, pricePerMonth: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5"><Label className="text-[11px]">Articles</Label><Input type="number" className={ui.input} value={conversionFormData.itemsIncluded} onChange={(e) => setConversionFormData({ ...conversionFormData, itemsIncluded: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label className="text-[11px]">Ramassages</Label><Input type="number" className={ui.input} value={conversionFormData.pickupsPerWeek} onChange={(e) => setConversionFormData({ ...conversionFormData, pickupsPerWeek: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label className="text-[11px]">Délai (h)</Label><Input type="number" className={ui.input} value={conversionFormData.deliveryTimeHours} onChange={(e) => setConversionFormData({ ...conversionFormData, deliveryTimeHours: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[11.5px]">Description</Label><Textarea rows={3} className={cn(ui.input, "resize-none")} value={conversionFormData.description} onChange={(e) => setConversionFormData({ ...conversionFormData, description: e.target.value })} /></div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" className={ui.btn} onClick={() => setConvertDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreatePrivatePlan} className={cn(ui.btnPrimary, "gap-1.5")}><Shield className="h-4 w-4" />Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const QuoteCard = ({ quote }: { quote: any }) => {
    const isProcessing = processingQuoteIds.has(quote.id);
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "approved": return { tone: "green" as Tone, icon: CheckCircle, label: "Approuvé" };
        case "rejected": return { tone: "red" as Tone, icon: XCircle, label: "Refusé" };
        default: return { tone: "amber" as Tone, icon: Clock, label: "En attente" };
      }
    };
    const statusConfig = getStatusConfig(quote.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className={cn(
        ui.card, "relative overflow-hidden",
        isProcessing && "opacity-60 pointer-events-none",
        quote.status === "approved" ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-emerald-500"
          : quote.status === "rejected" ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-red-500"
          : "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-amber-400"
      )}>
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <div className="text-center">
              <Loader2 className="h-6 w-6 text-[#0B676E] animate-spin mx-auto mb-1.5" />
              <p className="text-[10.5px] text-slate-600">Traitement…</p>
            </div>
          </div>
        )}
        <div className="p-4 pl-5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold text-[12px]">
                  {quote.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold text-[12.5px] text-slate-900 truncate">{quote.fullName}</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500">
                  <span className="truncate">{quote.email}</span>
                  <span className="text-slate-300">•</span>
                  <span>{quote.phone}</span>
                </div>
              </div>
            </div>
            <Pill tone={statusConfig.tone}><StatusIcon className="h-3 w-3" />{statusConfig.label}</Pill>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className={cn(ui.well, "p-2")}><p className="text-[10px] text-slate-500">Pièces/sem.</p><p className="font-medium text-slate-800">{quote.itemsPerWeek || "—"}</p></div>
            <div className={cn(ui.well, "p-2")}><p className="text-[10px] text-slate-500">Type</p><p className="font-medium text-slate-800 truncate">{quote.serviceType || "Standard"}</p></div>
            <div className={cn(ui.well, "p-2")}><p className="text-[10px] text-slate-500">Valeur</p><p className="font-semibold text-[#0B676E] tabular-nums">{new Intl.NumberFormat('fr-FR').format(quote.estimatedValue || 0)} Ar</p></div>
          </div>

          {quote.notes && <div className={cn(ui.well, "p-2.5 text-[11.5px] text-slate-700")}>{quote.notes}</div>}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2.5 border-t border-slate-100">
            <div className="text-[10.5px] text-slate-500">Créé le {safeFormatDate(quote.createdAt)}</div>
            {quote.status === "pending" && !isProcessing && (
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" className={cn(ui.btnView, "h-7 text-[10.5px] gap-1")}>
                  <Eye className="h-3 w-3" />Profil
                </Button>
                <Button size="sm" className={cn(ui.btnReject, "h-7 text-[10.5px] gap-1")} onClick={() => handleQuoteStatusUpdate(quote.id, "rejected")}>
                  <UserX className="h-3 w-3" />Refuser
                </Button>
                <Button size="sm" className={cn(ui.btnApprove, "h-7 text-[10.5px] gap-1")} onClick={() => handleQuoteStatusUpdate(quote.id, "approved")}>
                  <UserCheck className="h-3 w-3" />Approuver
                </Button>
                <Button size="sm" className={cn(ui.btn, "h-7 text-[10.5px] gap-1 text-amber-600 border-amber-200")} onClick={() => openConvertToPrivatePlan(quote)}>
                  <Shield className="h-3 w-3" />Plan privé
                </Button>
              </div>
            )}
            {quote.status !== "pending" && !isProcessing && (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className={cn(ui.btn, "h-7 text-[10.5px] gap-1")}><Eye className="h-3 w-3" />Voir</Button>
                <Button size="sm" variant="outline" className={cn(ui.btn, "h-7 text-[10.5px] gap-1")}><Edit className="h-3 w-3" />Modifier</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!Array.isArray(customQuotes) || customQuotes.length === 0) {
    return (
      <div className="space-y-4">
        <HeaderSection />
        <div className={cn(ui.card, "p-12 text-center border-dashed")}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-50 mb-3">
            <FileText className="h-7 w-7 text-violet-600" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">Aucun devis personnalisé</h3>
          <p className="text-[11.5px] text-slate-500 max-w-sm mx-auto">Aucune demande de devis personnalisé n'a été soumise pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HeaderSection />
      <FilterSection />
      <StatsCards />

      {quotes.length === 0 ? (
        <div className={cn(ui.card, "p-12 text-center border-dashed")}>
          <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-[14px] font-semibold text-slate-900 mb-1">
            {statusFilter === "pending" ? "Aucun devis en attente" : statusFilter === "approved" ? "Aucun devis approuvé" : statusFilter === "rejected" ? "Aucun devis refusé" : "Aucun devis"}
          </h3>
          <p className="text-[11.5px] text-slate-500 mb-3">Aucune donnée disponible pour ce filtre.</p>
          <Button variant="outline" className={cn(ui.btn, "gap-1.5")} onClick={() => setStatusFilter("all")}>
            <FileText className="h-3.5 w-3.5" />Voir tous les devis
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {quotes.map((quote: any) => <QuoteCard key={quote.id} quote={quote} />)}
          </div>
          <PaginationSection />
        </>
      )}

      <ConvertToPrivatePlanDialog />
    </div>
  );
}
