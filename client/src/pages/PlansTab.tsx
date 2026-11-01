// client/src/pages/PlansTab.tsx
import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Eye, EyeOff, Loader2, Trash2, RefreshCw, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ui = {
  card: "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  input: "h-9 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/15",
  btn: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-lg bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  dialog: "rounded-xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
  well: "rounded-lg border border-slate-200/80 bg-slate-50/50",
  sectionTitle: "text-[10.5px] font-semibold uppercase tracking-wider text-slate-400",
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
    tone === "brand" ? "bg-[#0B676E]" : tone === "red" ? "bg-red-500" :
    tone === "amber" ? "bg-amber-500" : tone === "blue" ? "bg-blue-500" :
    tone === "purple" ? "bg-violet-500" : "bg-slate-400";
  return (
    <div className={cn(ui.card, "p-5 min-w-0")}>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={cn("mt-2 text-[26px] leading-tight font-semibold tabular-nums truncate", isZero ? "text-slate-400" : "text-slate-900")}>{value}</p>
      {subtitle && <p className="mt-1 text-[11.5px] text-slate-500 truncate">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ActionButton icon-only voafaritra tsara */
const IconButton: React.FC<{
  icon: React.ReactNode; label: string; onClick: () => void;
  className?: string; disabled?: boolean; size?: "sm" | "md";
}> = ({ icon, label, onClick, className, disabled, size = "sm" }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onClick(); }}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border bg-white transition-all hover:shadow-sm",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {icon}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-[11px] pointer-events-none">{label}</TooltipContent>
  </Tooltip>
);

/* Field component ho an'ny inputs */
const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-[11.5px] text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
    {hint && <p className="text-[10.5px] text-slate-400">{hint}</p>}
  </div>
);

const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn("space-y-3", className)}>
    <span className={ui.sectionTitle}>{title}</span>
    {children}
  </div>
);

export function PlansTab({ subscriptionPlans, subscriptions, toast, queryClient }: {
  subscriptionPlans: any[]; subscriptions: any[]; toast: any; queryClient: any;
}) {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newPlanData, setNewPlanData] = useState<any>({ features: [] });
  const [planFilter, setPlanFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [plansPerPage, setPlansPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/subscription-plans", data); return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] }); setIsNewPlanOpen(false); setNewPlanData({ features: [] }); setEditingPlan(null); toast({ title: "✅ Plan créé" }); },
    onError: (error: any) => toast({ title: "❌ Erreur", description: error.message || "Échec de la création", variant: "destructive" }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => { const res = await apiRequest("PUT", `/api/subscription-plans/${id}`, updates); if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.message || "Échec de la mise à jour"); } return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] }); setEditingPlan(null); setIsNewPlanOpen(false); setNewPlanData({ features: [] }); toast({ title: "✅ Plan mis à jour" }); },
    onError: (error: any) => toast({ title: "❌ Erreur", description: error.message, variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/subscription-plans/${id}`); if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.message || "Échec de la suppression"); } return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] }); toast({ title: "✅ Plan supprimé" }); },
    onError: (error: any) => toast({ title: "❌ Erreur", description: error.message, variant: "destructive" }),
  });

  const handleCreateOrUpdatePlan = () => {
    if (!newPlanData.visibility) { toast({ title: "Type requis", description: "Choisissez Public ou Privé.", variant: "destructive" }); return; }
    if (!newPlanData.name || !newPlanData.pricePerMonth || isNaN(Number(newPlanData.pricePerMonth)) || !newPlanData.itemsIncluded || isNaN(Number(newPlanData.itemsIncluded)) || !newPlanData.pickupsPerWeek || isNaN(Number(newPlanData.pickupsPerWeek)) || !newPlanData.deliveryTimeHours || isNaN(Number(newPlanData.deliveryTimeHours))) {
      toast({ title: "Champs requis", description: "Remplissez tous les champs obligatoires (*).", variant: "destructive" }); return;
    }
    const featuresArray = Array.isArray(newPlanData.features) ? newPlanData.features : [];
    const planData = { 
      name: newPlanData.name, pricePerMonth: `${newPlanData.pricePerMonth} Ar`, 
      type: newPlanData.visibility === "private" ? "custom" : "essential", 
      itemsIncluded: Number(newPlanData.itemsIncluded), pickupsPerWeek: Number(newPlanData.pickupsPerWeek), 
      deliveryTimeHours: Number(newPlanData.deliveryTimeHours), isActive: newPlanData.isActive !== false, 
      features: featuresArray, description: newPlanData.description || null, 
      visibility: newPlanData.visibility, clientId: newPlanData.clientId || null, 
      clientName: newPlanData.clientName || null, clientEmail: newPlanData.clientEmail || null 
    };
    if (editingPlan) updatePlanMutation.mutate({ id: editingPlan.id, updates: planData }); else createPlanMutation.mutate(planData);
  };

  const parseFeatures = (features: any): string[] => {
    if (Array.isArray(features)) { return features.map((f: any) => { if (typeof f === "string") return f.replace(/^["'{\s]+|["'}\s]+$/g, "").trim(); return String(f || "").trim(); }).filter(Boolean); }
    if (typeof features === "string") {
      const trimmed = features.trim(); if (!trimmed) return [];
      try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean); if (parsed && typeof parsed === "object") return Object.values(parsed).map(String).map(s => s.trim()).filter(Boolean); } catch {}
      const cleaned = trimmed.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
      const parts = cleaned.split(/"\s*"|"\s*,\s*"|,\s*(?=")|\n/).map(p => p.replace(/^["'\s]+|["'\s]+$/g, "").trim()).filter(Boolean);
      if (parts.length > 0) return parts;
      return trimmed.split(",").map(f => f.replace(/^["'\s]+|["'\s]+$/g, "").trim()).filter(Boolean);
    }
    return [];
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setNewPlanData({ ...plan, pricePerMonth: String(plan.pricePerMonth).replace(" Ar", ""), visibility: plan.type === "custom" ? "private" : "public", features: parseFeatures(plan.features) });
    setIsNewPlanOpen(true);
  };

  const resetForm = () => { setNewPlanData({ features: [] }); setEditingPlan(null); };

  const filteredPlans = useMemo(() => {
    const plans = Array.isArray(subscriptionPlans) ? subscriptionPlans : [];
    return plans.filter((plan: any) => {
      if (planFilter === "public" && plan.type === "custom") return false;
      if (planFilter === "private" && plan.type !== "custom") return false;
      if (statusFilter === "active" && !plan.isActive) return false;
      if (statusFilter === "inactive" && plan.isActive) return false;
      if (searchQuery) { const q = searchQuery.toLowerCase(); return plan.name?.toLowerCase().includes(q) || plan.clientName?.toLowerCase().includes(q); }
      return true;
    });
  }, [subscriptionPlans, planFilter, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredPlans.length / plansPerPage);
  const currentPlans = filteredPlans.slice((currentPage - 1) * plansPerPage, currentPage * plansPerPage);

  const resetFilters = () => { setPlanFilter("all"); setStatusFilter("all"); setSearchQuery(""); setCurrentPage(1); };

  const stats = useMemo(() => {
    const plans = Array.isArray(subscriptionPlans) ? subscriptionPlans : [];
    const active = plans.filter(p => p.isActive).length;
    const pub = plans.filter(p => p.type !== "custom").length;
    const priv = plans.filter(p => p.type === "custom").length;
    const totalRevenue = plans.filter(p => p.isActive).reduce((sum, p) => sum + (parseInt(String(p.pricePerMonth).replace(/\D/g, "")) || 0), 0);
    return { total: plans.length, active, public: pub, private: priv, totalRevenue, activeRate: plans.length > 0 ? (active / plans.length) * 100 : 0, subscribers: subscriptions?.length || 0 };
  }, [subscriptionPlans, subscriptions]);

  const formatPrice = (price: string | number) => new Intl.NumberFormat("fr-FR").format(parseInt(String(price).replace(/\D/g, "")) || 0);

  // ==========================================
  // CARTE GRILLE
  // ==========================================
  const PlanGridCard = ({ plan }: { plan: any }) => {
    const features = parseFeatures(plan.features);
    const isPrivate = plan.type === "custom";
    return (
      <div className={cn(ui.card, "relative flex flex-col transition-all hover:border-slate-300 hover:shadow-md group", !plan.isActive && "opacity-70")}>
        <div className="p-5 flex-1 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white text-[13px] font-bold shadow-sm", isPrivate ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-[#0B676E] to-[#09565C]")}>
                P
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-[14.5px] text-slate-900 truncate group-hover:text-[#0B676E] transition-colors">{plan.name}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Pill tone={isPrivate ? "purple" : "brand"}>{isPrivate ? "Privé" : "Public"}</Pill>
                  <Pill tone={plan.isActive ? "green" : "slate"}>{plan.isActive ? "Actif" : "Inactif"}</Pill>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100 shrink-0">•••</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-slate-200 w-48">
                <DropdownMenuItem onClick={() => openEditPlan(plan)}><Edit className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updatePlanMutation.mutate({ id: plan.id, updates: { isActive: !plan.isActive } })} className={plan.isActive ? "text-amber-600" : "text-[#0B676E]"}>
                  {plan.isActive ? <><EyeOff className="h-4 w-4 mr-2" />Désactiver</> : <><Eye className="h-4 w-4 mr-2" />Activer</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { if (confirm(`Supprimer le plan "${plan.name}" ?`)) deletePlanMutation.mutate(plan.id); }} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Supprimer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isPrivate && plan.clientName && (<p className="text-[11.5px] text-violet-600 font-medium truncate">Client : {plan.clientName}</p>)}

          {/* Price & Stats */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] leading-none font-bold text-slate-900 tabular-nums">{formatPrice(plan.pricePerMonth)}</span>
            <span className="text-[12px] font-medium text-slate-500">Ar/mois</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-center"><p className="text-[15px] font-semibold text-slate-900 tabular-nums">{plan.itemsIncluded}</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Articles</p></div>
            <div className="text-center border-x border-slate-200"><p className="text-[15px] font-semibold text-slate-900 tabular-nums">{plan.pickupsPerWeek}x</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Ramassages</p></div>
            <div className="text-center"><p className="text-[15px] font-semibold text-slate-900 tabular-nums">{plan.deliveryTimeHours}h</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Livraison</p></div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="space-y-2 mt-auto">
              <span className="text-[11.5px] font-semibold text-slate-800">{features.length} option{features.length > 1 ? "s" : ""} incluse{features.length > 1 ? "s" : ""}</span>
              <div className="flex flex-wrap gap-1">
                {features.slice(0, 3).map((f: string, i: number) => (<span key={i} className="inline-flex items-center rounded bg-slate-100 text-slate-700 px-2 py-1 text-[10.5px] font-medium truncate max-w-[150px]" title={f}>{f}</span>))}
                {features.length > 3 && (<span className="inline-flex items-center rounded bg-[#0B676E]/10 text-[#0B676E] px-2 py-1 text-[10.5px] font-bold">+{features.length - 3}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-1.5 rounded-b-xl">
          <IconButton icon={<Edit className="h-3.5 w-3.5" />} label="Modifier" onClick={() => openEditPlan(plan)} className="text-violet-600 border-violet-200 hover:bg-violet-50" />
          <IconButton icon={updatePlanMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : plan.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} label={plan.isActive ? "Désactiver" : "Activer"} onClick={() => updatePlanMutation.mutate({ id: plan.id, updates: { isActive: !plan.isActive } })} disabled={updatePlanMutation.isPending} className={plan.isActive ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-[#0B676E] border-[#0B676E]/30 hover:bg-[#0B676E]/10"} />
          <IconButton icon={deletePlanMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} label="Supprimer" onClick={() => { if (confirm(`Supprimer le plan "${plan.name}" ?`)) deletePlanMutation.mutate(plan.id); }} disabled={deletePlanMutation.isPending} className="text-red-600 border-red-200 hover:bg-red-50" />
        </div>
      </div>
    );
  };

  // ==========================================
  // LISTE
  // ==========================================
  const PlanListItem = ({ plan }: { plan: any }) => {
    const features = parseFeatures(plan.features);
    const isPrivate = plan.type === "custom";
    return (
      <div className={cn(ui.card, "p-4 min-w-0 transition-all hover:border-slate-300 hover:shadow-sm", !plan.isActive && "opacity-70")}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shadow-sm", isPrivate ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-[#0B676E] to-[#09565C]")}>
                P
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 text-[13.5px] truncate">{plan.name}</span>
                  <Pill tone={isPrivate ? "purple" : "brand"}>{isPrivate ? "Privé" : "Public"}</Pill>
                  <Pill tone={plan.isActive ? "green" : "slate"}>{plan.isActive ? "Actif" : "Inactif"}</Pill>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500 mt-1">
                  <span>{plan.itemsIncluded} articles</span>
                  <span className="text-slate-300">•</span>
                  <span>{plan.pickupsPerWeek}x / semaine</span>
                  <span className="text-slate-300">•</span>
                  <span>{plan.deliveryTimeHours}h livraison</span>
                  {isPrivate && plan.clientName && (<><span className="text-slate-300">•</span><span className="text-violet-600 font-medium">{plan.clientName}</span></>)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">{formatPrice(plan.pricePerMonth)}</p>
              <p className="text-[10.5px] text-slate-500 uppercase tracking-wider">Ar/mois</p>
            </div>
            <div className="flex gap-1.5 border-l border-slate-200 pl-4 py-1">
              <IconButton icon={<Edit className="h-3.5 w-3.5" />} label="Modifier" onClick={() => openEditPlan(plan)} className="text-violet-600 border-violet-200 hover:bg-violet-50" />
              <IconButton icon={updatePlanMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : plan.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} label={plan.isActive ? "Désactiver" : "Activer"} onClick={() => updatePlanMutation.mutate({ id: plan.id, updates: { isActive: !plan.isActive } })} disabled={updatePlanMutation.isPending} className={plan.isActive ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-[#0B676E] border-[#0B676E]/30 hover:bg-[#0B676E]/10"} />
              <IconButton icon={deletePlanMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} label="Supprimer" onClick={() => { if (confirm(`Supprimer le plan "${plan.name}" ?`)) deletePlanMutation.mutate(plan.id); }} disabled={deletePlanMutation.isPending} className="text-red-600 border-red-200 hover:bg-red-50" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plans d'abonnement</h1>
            <p className="text-sm text-slate-500 mt-1">Gérez les plans publics et privés pour vos clients.</p>
          </div>
          <Button onClick={() => { resetForm(); setIsNewPlanOpen(true); }} className={cn(ui.btnPrimary, "h-10 px-5 shadow-sm")}>
            + Nouveau plan
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniKPI title="Total plans" value={stats.total} subtitle={`${stats.public} publics • ${stats.private} privés`} tone="brand" />
          <MiniKPI title="Plans actifs" value={stats.active} subtitle={`sur ${stats.total}`} tone="green" progress={stats.activeRate} progressLabel="Taux d'activité" />
          <MiniKPI title="Abonnés" value={stats.subscribers} subtitle="Clients abonnés" tone="purple" />
          <MiniKPI title="CA potentiel" value={formatPrice(stats.totalRevenue) + " Ar"} subtitle="Si tous actifs" tone="amber" />
        </div>

        {/* TOOLBAR */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <Input placeholder="Rechercher un plan…" className={cn(ui.input, "pl-9 h-10 bg-slate-50 focus:bg-white")} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className={cn(ui.input, "w-full sm:w-[150px] h-10")}><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="public">Publics</SelectItem>
                  <SelectItem value="private">Privés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className={cn(ui.input, "w-full sm:w-[150px] h-10")}><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-[#0B676E]/10 text-[#0B676E]" : "text-slate-400 hover:bg-slate-100")}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-[#0B676E]/10 text-[#0B676E]" : "text-slate-400 hover:bg-slate-100")}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
              </div>
            </div>
          </div>

          {/* CONTENU GRILLE / LISTE */}
          {filteredPlans.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 font-medium">Aucun plan d'abonnement trouvé.</p>
              {(searchQuery || planFilter !== "all" || statusFilter !== "all") && (
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Effacer les filtres</Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {currentPlans.map((plan: any) => <PlanGridCard key={plan.id} plan={plan} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {currentPlans.map((plan: any) => <PlanListItem key={plan.id} plan={plan} />)}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-sm text-slate-500">
                Affichage <span className="font-medium text-slate-900">{(currentPage - 1) * plansPerPage + 1}</span> à <span className="font-medium text-slate-900">{Math.min(currentPage * plansPerPage, filteredPlans.length)}</span> sur <span className="font-medium text-slate-900">{filteredPlans.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={plansPerPage.toString()} onValueChange={(v) => { setPlansPerPage(parseInt(v)); setCurrentPage(1); }}>
                  <SelectTrigger className={cn(ui.input, "w-[80px] h-9")}><SelectValue /></SelectTrigger>
                  <SelectContent>{[6, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" size="sm" className={ui.btn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Préc.</Button>
                <Button variant="outline" size="sm" className={ui.btn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suiv.</Button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            DIALOG: NOUVEAU / MODIFIER PLAN
            ============================================================ */}
        <Dialog open={isNewPlanOpen} onOpenChange={(open) => { setIsNewPlanOpen(open); if (!open) resetForm(); }}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[720px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
            {/* HEADER */}
            <div className="shrink-0 border-b border-slate-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className={cn("shrink-0 h-11 w-11 rounded-lg flex items-center justify-center text-white font-bold text-[14px]", newPlanData.visibility === "private" ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-[#0B676E] to-[#09565C]")}>
                  P
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-[15px] font-semibold text-slate-900">{editingPlan ? "Modifier le plan" : "Nouveau plan"}</DialogTitle>
                  <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">{editingPlan ? "Modifiez les détails du plan d'abonnement." : "Créez un plan public ou privé pour vos clients."}</DialogDescription>
                </div>
                <Pill tone={newPlanData.visibility === "private" ? "purple" : "brand"}>{newPlanData.visibility === "private" ? "Privé" : newPlanData.visibility === "public" ? "Public" : "—"}</Pill>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              
              <FormSection title="Type de plan">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewPlanData({ ...newPlanData, visibility: "public" })} className={cn("p-3 rounded-lg border-2 text-left transition-all", newPlanData.visibility === "public" ? "border-[#0B676E] bg-[#0B676E]/5" : "border-slate-200 hover:border-[#0B676E]/30")}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", newPlanData.visibility === "public" ? "border-[#0B676E]" : "border-slate-300")}>
                        {newPlanData.visibility === "public" && <div className="w-1.5 h-1.5 rounded-full bg-[#0B676E]" />}
                      </div>
                      <span className="font-medium text-[12px] text-slate-800">Public</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 ml-5.5">Visible sur le site</p>
                  </button>
                  <button type="button" onClick={() => setNewPlanData({ ...newPlanData, visibility: "private" })} className={cn("p-3 rounded-lg border-2 text-left transition-all", newPlanData.visibility === "private" ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300")}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", newPlanData.visibility === "private" ? "border-violet-500" : "border-slate-300")}>
                        {newPlanData.visibility === "private" && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                      </div>
                      <span className="font-medium text-[12px] text-slate-800">Privé</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 ml-5.5">Pour un client spécifique</p>
                  </button>
                </div>
              </FormSection>

              {newPlanData.visibility === "private" && (newPlanData.clientName || editingPlan?.clientName) && (
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <span className="text-[10.5px] font-semibold text-violet-800 uppercase tracking-wider">Client associé</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] mt-1.5">
                    <div><span className="text-slate-500">Nom :</span> <span className="font-medium text-slate-800">{newPlanData.clientName || editingPlan?.clientName}</span></div>
                    <div><span className="text-slate-500">Email :</span> <span className="font-medium text-slate-800 truncate">{newPlanData.clientEmail || editingPlan?.clientEmail}</span></div>
                  </div>
                </div>
              )}

              <FormSection title="Informations" className="pt-4 border-t border-slate-100">
                <Field label="Nom du plan" required>
                  <Input className={ui.input} placeholder="Ex : Premium Family" value={newPlanData.name || ""} onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Prix / mois (Ar)" required>
                    <Input type="number" className={ui.input} placeholder="25000" value={newPlanData.pricePerMonth || ""} onChange={(e) => setNewPlanData({ ...newPlanData, pricePerMonth: Number(e.target.value) })} />
                  </Field>
                  <Field label="Articles" required>
                    <Input type="number" className={ui.input} placeholder="20" value={newPlanData.itemsIncluded || ""} onChange={(e) => setNewPlanData({ ...newPlanData, itemsIncluded: parseInt(e.target.value) })} />
                  </Field>
                  <Field label="Ramassages / sem." required>
                    <Input type="number" className={ui.input} placeholder="2" value={newPlanData.pickupsPerWeek || ""} onChange={(e) => setNewPlanData({ ...newPlanData, pickupsPerWeek: parseInt(e.target.value) })} />
                  </Field>
                </div>
                <Field label="Délai de livraison (heures)" required>
                  <Input type="number" className={ui.input} placeholder="48" value={newPlanData.deliveryTimeHours || ""} onChange={(e) => setNewPlanData({ ...newPlanData, deliveryTimeHours: parseInt(e.target.value) })} />
                </Field>
              </FormSection>

              <FormSection title="Fonctionnalités" className="pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["Ramassage à domicile", "Livraison express", "Nettoyage premium", "Support prioritaire", "Repassage inclus", "Protection textile", "Application mobile", "Suivi en temps réel"].map((feature) => {
                    const currentFeatures = Array.isArray(newPlanData.features) ? newPlanData.features : [];
                    const isChecked = currentFeatures.includes(feature);
                    return (
                      <div key={feature} className={cn("flex items-center space-x-2 p-2.5 rounded-lg border transition-colors", isChecked ? "border-[#0B676E] bg-[#0B676E]/5" : "border-slate-200 hover:border-slate-300 bg-white")}>
                        <Checkbox id={`feature-${feature}`} checked={isChecked} onCheckedChange={(checked) => { const updated = checked ? [...currentFeatures, feature] : currentFeatures.filter((f: string) => f !== feature); setNewPlanData({ ...newPlanData, features: updated }); }} />
                        <Label htmlFor={`feature-${feature}`} className="text-[11.5px] cursor-pointer flex-1 text-slate-700">{feature}</Label>
                      </div>
                    );
                  })}
                </div>
              </FormSection>

              {newPlanData.visibility === "private" && (
                <FormSection title="Description" className="pt-4 border-t border-slate-100">
                  <Field label="Description du plan personnalisé">
                    <Textarea className={cn(ui.input, "resize-none min-h-[80px] py-2")} rows={3} placeholder="Décrivez les spécificités du plan…" value={newPlanData.description || ""} onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })} />
                  </Field>
                </FormSection>
              )}

              <div className="flex items-center space-x-2 p-3 rounded-lg border border-slate-200 bg-slate-50 mt-4">
                <Checkbox id="isActive" checked={newPlanData.isActive !== false} onCheckedChange={(checked) => setNewPlanData({ ...newPlanData, isActive: checked === true })} />
                <Label htmlFor="isActive" className="text-[12px] cursor-pointer font-medium text-slate-800">Plan actif (disponible à la souscription)</Label>
              </div>
            </div>

            {/* FOOTER STICKY */}
            <div className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" className={ui.btn} onClick={() => { resetForm(); setIsNewPlanOpen(false); }}>Annuler</Button>
              <Button className={cn(ui.btnPrimary, "gap-1.5 min-w-[120px]")} onClick={handleCreateOrUpdatePlan} disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                {(createPlanMutation.isPending || updatePlanMutation.isPending) ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</> : editingPlan ? "Enregistrer" : "Créer le plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}