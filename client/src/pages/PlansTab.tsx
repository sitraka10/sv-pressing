import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Eye,
  EyeOff,
  Package,
  Truck,
  Clock,
  Star,
  Shield,
  CheckCircle,
  Loader2,
  Trash2,
  User,
  Mail,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// STYLES NEOMORPHIQUES
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  glass: "backdrop-blur-xl bg-white/25 rounded-3xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
};

export function PlansTab({ subscriptionPlans, subscriptions, toast, queryClient }: {
  subscriptionPlans: any[];
  subscriptions: any[];
  toast: any;
  queryClient: any;
}) {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newPlanData, setNewPlanData] = useState<any>({ features: [] });
  const [planFilter, setPlanFilter] = useState("all");
  
  // États pour la recherche et la pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [plansPerPage, setPlansPerPage] = useState(5);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Envoi création plan:", data);
      const res = await apiRequest("POST", "/api/subscription-plans", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      setIsNewPlanOpen(false);
      toast({
        title: "Plan créé",
        description: `Le plan "${data.name}" a été créé avec succès`,
      });
      return data;
    },
    onError: (error) => {
      console.error("Erreur création plan:", error);
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le plan",
        variant: "destructive"
      });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      console.log("Envoi mise à jour plan:", { id, updates });
      const res = await apiRequest("PUT", `/api/subscription-plans/${id}`, updates);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "La mise à jour du plan a échoué.");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      setEditingPlan(null);
      toast({
        title: "Plan modifié",
        description: `Le plan "${data.name}" a été mis à jour`,
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/subscription-plans/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "La suppression du plan a échoué.");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({
        title: "Plan supprimé",
        description: "Le plan d'abonnement a été supprimé",
      });
    },
  });

  const handleCreateOrUpdatePlan = () => {
    if (!newPlanData.visibility) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de plan (Public ou Privé).",
        variant: "destructive"
      });
      return;
    }

    if (!newPlanData.name ||
      !newPlanData.pricePerMonth ||
      isNaN(Number(newPlanData.pricePerMonth)) ||
      !newPlanData.itemsIncluded ||
      isNaN(Number(newPlanData.itemsIncluded)) ||
      !newPlanData.pickupsPerWeek ||
      isNaN(Number(newPlanData.pickupsPerWeek)) ||
      !newPlanData.deliveryTimeHours ||
      isNaN(Number(newPlanData.deliveryTimeHours))) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires (*) avec des valeurs valides.",
        variant: "destructive"
      });
      return;
    }

    console.log("Données du formulaire:", newPlanData);
    console.log("Features sélectionnées:", newPlanData.features);

    const featuresArray = Array.isArray(newPlanData.features) 
      ? newPlanData.features 
      : [];

    const planData = {
      name: newPlanData.name,
      pricePerMonth: `${newPlanData.pricePerMonth} Ar`,
      type: newPlanData.visibility === 'private' ? 'custom' : 'essential',
      itemsIncluded: Number(newPlanData.itemsIncluded),
      pickupsPerWeek: Number(newPlanData.pickupsPerWeek),
      deliveryTimeHours: Number(newPlanData.deliveryTimeHours),
      isActive: newPlanData.isActive !== false,
      features: featuresArray,
      description: newPlanData.description || null,
      visibility: newPlanData.visibility,
      clientId: newPlanData.clientId || null,
      clientName: newPlanData.clientName || null,
      clientEmail: newPlanData.clientEmail || null,
    };

    console.log("Données envoyées à l'API:", planData);

    if (editingPlan) {
      updatePlanMutation.mutate(
        { id: editingPlan.id, updates: planData },
        {
          onSuccess: () => {
            toast({ title: "Plan mis à jour", description: "Les modifications ont été enregistrées." });
            setIsNewPlanOpen(false);
            setNewPlanData({ features: [] });
            setEditingPlan(null);
          },
          onError: (error) => {
            console.error("Erreur mise à jour:", error);
            let errorMessage = error.message;
            try {
              const errorJson = JSON.parse(error.message);
              if (errorJson.message) errorMessage = errorJson.message;
            } catch (e) { /* ignore */ }
            toast({ title: "Erreur de mise à jour", description: errorMessage, variant: "destructive" });
          }
        }
      );
    } else {
      createPlanMutation.mutate(planData, {
        onSuccess: (data) => {
          toast({ title: "Plan créé avec succès", description: `Le plan "${data.name}" a été créé.` });
          setIsNewPlanOpen(false);
          setNewPlanData({ features: [] });
        },
        onError: (error) => {
          console.error("Erreur création:", error);
          let errorMessage = error.message;
          try {
            const errorJson = JSON.parse(error.message);
            if (errorJson.message) errorMessage = errorJson.message;
          } catch (e) { /* ignore */ }
          toast({ title: "Erreur de création", description: errorMessage, variant: "destructive" });
        }
      });
    }
  };

  const parseFeatures = (features: any) => {
    if (Array.isArray(features)) {
      return features;
    }
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        if (features.includes(',')) {
          return features.split(',').map(f => f.trim()).filter(f => f);
        }
        return features ? [features] : [];
      }
    }
    return [];
  };

  // Filtrage et recherche
  const filteredPlans = useMemo(() => {
    const plans = Array.isArray(subscriptionPlans) ? subscriptionPlans : [];
    
    return plans.filter((plan: any) => {
      // Filtre par type
      if (planFilter === 'public' && plan.type === 'custom') return false;
      if (planFilter === 'private' && plan.type !== 'custom') return false;
      
      // Filtre par statut
      if (statusFilter === 'active' && !plan.isActive) return false;
      if (statusFilter === 'inactive' && plan.isActive) return false;
      
      // Recherche par nom
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = plan.name?.toLowerCase().includes(query);
        const clientNameMatch = plan.clientName?.toLowerCase().includes(query);
        return nameMatch || clientNameMatch;
      }
      
      return true;
    });
  }, [subscriptionPlans, planFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPlans.length / plansPerPage);
  const currentPlans = filteredPlans.slice(
    (currentPage - 1) * plansPerPage,
    currentPage * plansPerPage
  );

  // Réinitialiser la page quand les filtres changent
  const handleFilterChange = (newFilter: string) => {
    setPlanFilter(newFilter);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newFilter: "all" | "active" | "inactive") => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setPlanFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Rendu d'une carte plan en mode grille
  const PlanGridCard = ({ plan }: { plan: any }) => {
    const planFeatures = parseFeatures(plan.features);
    const isPrivate = plan.type === 'custom';
    
    return (
      <div className={cn(
        NEO.card,
        "flex flex-col h-full",
        isPrivate ? "border-l-4 border-l-orange-500" : "border-l-4 border-l-[#0B676E]"
      )}>
        <div className="p-5 flex flex-col flex-1">
          {/* En-tête */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
                isPrivate ? "bg-orange-100 text-orange-600" : "bg-[#0B676E]/10 text-[#0B676E]"
              )}>
                {isPrivate ? <Shield className="h-6 w-6" /> : <Package className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-lg">{plan.name}</h3>
                  <Badge className={cn(NEO.badge, isPrivate ? "bg-orange-500 text-white" : "bg-[#0B676E] text-white")}>
                    {isPrivate ? 'Privé' : 'Public'}
                  </Badge>
                </div>
                <Badge className={cn(NEO.badge, plan.isActive ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                  {plan.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900">{plan.pricePerMonth}</p>
              <p className="text-xs text-slate-500">/mois</p>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <Package className="h-4 w-4 text-[#0B676E]" />
              <div>
                <p className="font-medium text-slate-800 text-sm">{plan.itemsIncluded}</p>
                <p className="text-slate-500 text-[10px]">articles</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <Truck className="h-4 w-4 text-[#0B676E]" />
              <div>
                <p className="font-medium text-slate-800 text-sm">{plan.pickupsPerWeek}x</p>
                <p className="text-slate-500 text-[10px]">ramassages</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <Clock className="h-4 w-4 text-[#0B676E]" />
              <div>
                <p className="font-medium text-slate-800 text-sm">{plan.deliveryTimeHours}h</p>
                <p className="text-slate-500 text-[10px]">livraison</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <Star className="h-4 w-4 text-[#0B676E]" />
              <div>
                <p className="font-medium text-slate-800 text-sm">{planFeatures.length}</p>
                <p className="text-slate-500 text-[10px]">options</p>
              </div>
            </div>
          </div>

          {/* Client associé pour plans privés */}
          {isPrivate && (plan.clientName || plan.clientEmail) && (
            <div className="bg-orange-50 p-2 rounded-xl border border-orange-200 mb-3">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-700 font-medium">
                  {plan.clientName || plan.clientEmail}
                </span>
              </div>
            </div>
          )}

          {/* Fonctionnalités */}
          {planFeatures.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {planFeatures.slice(0, 3).map((feature: string, idx: number) => (
                <Badge key={idx} className={cn(NEO.badge, "bg-[#eef2f5] text-slate-600 text-[10px]")}>
                  {feature}
                </Badge>
              ))}
              {planFeatures.length > 3 && (
                <Badge className={cn(NEO.badge, "bg-[#eef2f5] text-slate-600 text-[10px]")}>
                  +{planFeatures.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-white/40">
            <Button
              variant="outline"
              size="sm"
              className={NEO.button}
              onClick={() => {
                setEditingPlan(plan);
                const features = parseFeatures(plan.features);
                setNewPlanData({
                  ...plan,
                  pricePerMonth: plan.pricePerMonth.replace(' Ar', ''),
                  visibility: plan.type === 'custom' ? 'private' : 'public',
                  features: features
                });
                setIsNewPlanOpen(true);
              }}
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(NEO.button, plan.isActive ? "text-orange-600" : "text-emerald-600")}
              onClick={() => {
                const newStatus = !plan.isActive;
                updatePlanMutation.mutate({
                  id: plan.id,
                  updates: { isActive: newStatus }
                });
              }}
              disabled={updatePlanMutation.isPending}
            >
              {plan.isActive ? (
                <><EyeOff className="h-3 w-3 mr-1" /> Désactiver</>
              ) : (
                <><Eye className="h-3 w-3 mr-1" /> Activer</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(NEO.button, "text-red-600")}
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer le plan "${plan.name}" ?`)) {
                  deletePlanMutation.mutate(plan.id);
                }
              }}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <><Trash2 className="h-3 w-3" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Rendu d'une carte plan en mode liste
  const PlanListItem = ({ plan }: { plan: any }) => {
    const planFeatures = parseFeatures(plan.features);
    const isPrivate = plan.type === 'custom';
    
    return (
      <div className={cn(
        NEO.card,
        "p-4",
        isPrivate ? "border-l-4 border-l-orange-500" : "border-l-4 border-l-[#0B676E]"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
                isPrivate ? "bg-orange-100 text-orange-600" : "bg-[#0B676E]/10 text-[#0B676E]"
              )}>
                {isPrivate ? <Shield className="h-5 w-5" /> : <Package className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{plan.name}</span>
                  <Badge className={cn(NEO.badge, isPrivate ? "bg-orange-500 text-white" : "bg-[#0B676E] text-white")}>
                    {isPrivate ? 'Privé' : 'Public'}
                  </Badge>
                  <Badge className={cn(NEO.badge, plan.isActive ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                    {plan.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                  <span>{plan.itemsIncluded} articles</span>
                  <span>•</span>
                  <span>{plan.pickupsPerWeek} ramassages/semaine</span>
                  <span>•</span>
                  <span>{plan.deliveryTimeHours}h livraison</span>
                  {isPrivate && plan.clientName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {plan.clientName}
                      </span>
                    </>
                  )}
                </div>
                {planFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {planFeatures.slice(0, 3).map((feature: string, idx: number) => (
                      <Badge key={idx} className={cn(NEO.badge, "bg-[#eef2f5] text-slate-600 text-[10px]")}>
                        {feature}
                      </Badge>
                    ))}
                    {planFeatures.length > 3 && (
                      <Badge className={cn(NEO.badge, "bg-[#eef2f5] text-slate-600 text-[10px]")}>
                        +{planFeatures.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">{plan.pricePerMonth}</p>
              <p className="text-xs text-slate-500">/mois</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                className={NEO.button}
                onClick={() => {
                  setEditingPlan(plan);
                  const features = parseFeatures(plan.features);
                  setNewPlanData({
                    ...plan,
                    pricePerMonth: plan.pricePerMonth.replace(' Ar', ''),
                    visibility: plan.type === 'custom' ? 'private' : 'public',
                    features: features
                  });
                  setIsNewPlanOpen(true);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(NEO.button, plan.isActive ? "text-orange-600" : "text-emerald-600")}
                onClick={() => {
                  const newStatus = !plan.isActive;
                  updatePlanMutation.mutate({
                    id: plan.id,
                    updates: { isActive: newStatus }
                  });
                }}
                disabled={updatePlanMutation.isPending}
              >
                {plan.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(NEO.button, "text-red-600")}
                onClick={() => {
                  if (confirm(`Êtes-vous sûr de vouloir supprimer le plan "${plan.name}" ?`)) {
                    deletePlanMutation.mutate(plan.id);
                  }
                }}
                disabled={deletePlanMutation.isPending}
              >
                {deletePlanMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ==========================================================
          EN-TÊTE NEOMORPHIQUE
      ========================================================== */}
      <div className={NEO.card}>
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestion des Plans d'Abonnement</h2>
            <p className="text-sm text-slate-500 mt-1">Gérez les plans publics et privés</p>
          </div>
          <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
            <DialogTrigger asChild>
              <Button className={NEO.buttonPrimary}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
              <DialogHeader>
                <DialogTitle className="text-slate-800">
                  {editingPlan ? "Modifier le Plan d'Abonnement" : "Créer un Nouveau Plan d'Abonnement"}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  {editingPlan ? "Modifiez les détails du plan" : "Créez un plan public ou privé"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Type de plan */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-slate-700">Type de Plan</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={cn(
                        "p-4 border-2 rounded-2xl cursor-pointer transition-all",
                        newPlanData.visibility === 'public'
                          ? "border-[#0B676E] bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                          : "border-white/40 hover:border-[#0B676E]/30"
                      )}
                      onClick={() => setNewPlanData({ ...newPlanData, visibility: 'public' })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full border-2 border-[#0B676E] bg-white flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          {newPlanData.visibility === 'public' && (
                            <div className="w-2 h-2 rounded-full bg-[#0B676E]"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">Plan Public</h3>
                          <p className="text-sm text-slate-500">Visible sur le site vitrine</p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "p-4 border-2 rounded-2xl cursor-pointer transition-all",
                        newPlanData.visibility === 'private'
                          ? "border-orange-500 bg-orange-50 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
                          : "border-white/40 hover:border-orange-300"
                      )}
                      onClick={() => setNewPlanData({ ...newPlanData, visibility: 'private' })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-white flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          {newPlanData.visibility === 'private' && (
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">Plan Privé</h3>
                          <p className="text-sm text-slate-500">Pour un client spécifique</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations client pour plans privés */}
                {newPlanData.visibility === 'private' && (newPlanData.clientName || editingPlan?.clientName) && (
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <h4 className="font-medium text-orange-800">Client associé</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-600">Nom:</span>
                        <p className="font-medium text-slate-800">{newPlanData.clientName || editingPlan?.clientName}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Email:</span>
                        <p className="font-medium text-slate-800">{newPlanData.clientEmail || editingPlan?.clientEmail}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations de base */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Nom du Plan *</Label>
                  <Input
                    placeholder="ex: Premium Family"
                    className={NEO.input}
                    value={newPlanData.name || ""}
                    onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                  />
                </div>

                {/* Tarification */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Prix par Mois (Ar) *</Label>
                    <Input
                      type="number"
                      placeholder="25000"
                      className={NEO.input}
                      value={newPlanData.pricePerMonth || ""}
                      onChange={(e) => setNewPlanData({ ...newPlanData, pricePerMonth: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Articles Inclus *</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      className={NEO.input}
                      value={newPlanData.itemsIncluded || ""}
                      onChange={(e) => setNewPlanData({ ...newPlanData, itemsIncluded: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Ramassages/Semaine *</Label>
                    <Input
                      type="number"
                      placeholder="2"
                      className={NEO.input}
                      value={newPlanData.pickupsPerWeek || ""}
                      onChange={(e) => setNewPlanData({ ...newPlanData, pickupsPerWeek: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Délai de livraison */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Délai de Livraison (heures) *</Label>
                  <Input
                    type="number"
                    placeholder="48"
                    className={NEO.input}
                    value={newPlanData.deliveryTimeHours || ""}
                    onChange={(e) => setNewPlanData({ ...newPlanData, deliveryTimeHours: parseInt(e.target.value) })}
                  />
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Fonctionnalités Incluses</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Ramassage à domicile",
                      "Livraison express",
                      "Nettoyage premium",
                      "Support prioritaire",
                      "Repassage inclus",
                      "Protection textile",
                      "Application mobile",
                      "Suivi en temps réel"
                    ].map((feature) => {
                      const currentFeatures = Array.isArray(newPlanData.features) ? newPlanData.features : [];
                      const isChecked = currentFeatures.includes(feature);
                      
                      return (
                        <div key={feature} className="flex items-center space-x-2 p-2 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <input
                            type="checkbox"
                            id={`feature-${feature}`}
                            checked={isChecked}
                            onChange={(e) => {
                              const updatedFeatures = e.target.checked
                                ? [...currentFeatures, feature]
                                : currentFeatures.filter((f: string) => f !== feature);
                              setNewPlanData({ ...newPlanData, features: updatedFeatures });
                            }}
                            className="rounded border-2 border-slate-300 bg-[#eef2f5] focus:ring-[#0B676E]"
                          />
                          <Label htmlFor={`feature-${feature}`} className="text-sm text-slate-700">{feature}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Description pour plans privés */}
                {newPlanData.visibility === 'private' && (
                  <div className="space-y-2">
                    <Label className="text-slate-700">Description du Plan Personnalisé</Label>
                    <textarea
                      className={cn(NEO.input, "w-full resize-none")}
                      rows={3}
                      placeholder="Décrivez les spécificités de ce plan personnalisé..."
                      value={newPlanData.description || ""}
                      onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })}
                    />
                  </div>
                )}

                {/* Statut */}
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newPlanData.isActive !== false}
                    onChange={(e) => setNewPlanData({ ...newPlanData, isActive: e.target.checked })}
                    className="rounded border-2 border-slate-300 bg-[#eef2f5] focus:ring-[#0B676E]"
                  />
                  <Label htmlFor="isActive" className="text-slate-700">Plan actif (disponible à la souscription)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className={NEO.button} onClick={() => {
                  setNewPlanData({ features: [] });
                  setIsNewPlanOpen(false);
                  setEditingPlan(null);
                }}>
                  Annuler
                </Button>
                <Button
                  className={NEO.buttonPrimary}
                  onClick={handleCreateOrUpdatePlan}
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                >
                  {(createPlanMutation.isPending || updatePlanMutation.isPending)
                    ? "Enregistrement..."
                    : (editingPlan ? "Sauvegarder les modifications" : "Créer le Plan")
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ==========================================================
          BARRE DE RECHERCHE ET FILTRES NEOMORPHIQUE
      ========================================================== */}
      <div className={NEO.card}>
        <div className="p-4 space-y-4">
          {/* Ligne 1 : Recherche et actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un plan..."
                className={cn(NEO.input, "pl-10")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            
            <Select value={planFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className={cn(NEO.input, "w-[140px]")}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="public">Plans publics</SelectItem>
                <SelectItem value="private">Plans privés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className={cn(NEO.input, "w-[140px]")}>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || planFilter !== "all" || statusFilter !== "all") && (
              <Button variant="outline" size="sm" className={NEO.button} onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Ligne 2 : Vue et pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/40">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 w-8 p-0 rounded-lg", viewMode === "grid" && NEO.buttonPrimary)}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 w-8 p-0 rounded-lg", viewMode === "list" && NEO.buttonPrimary)}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-slate-500">
                {filteredPlans.length} plan{filteredPlans.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Select value={plansPerPage.toString()} onValueChange={(v) => {
                setPlansPerPage(parseInt(v));
                setCurrentPage(1);
              }}>
                <SelectTrigger className={cn(NEO.input, "w-[80px] h-8")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className={NEO.button} onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          LISTE DES PLANS NEOMORPHIQUE
      ========================================================== */}
      {filteredPlans.length === 0 ? (
        <div className={NEO.card}>
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? "Aucun plan ne correspond à votre recherche" : "Aucun plan d'abonnement"}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchQuery ? "Essayez d'autres mots-clés ou réinitialisez les filtres" : "Créez votre premier plan d'abonnement pour commencer."}
            </p>
            {searchQuery ? (
              <Button variant="outline" className={NEO.button} onClick={resetFilters}>
                <X className="h-4 w-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            ) : (
              <Button onClick={() => setIsNewPlanOpen(true)} className={NEO.buttonPrimary}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un plan
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPlans.map((plan: any) => (
            <PlanGridCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {currentPlans.map((plan: any) => (
            <PlanListItem key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {/* ==========================================================
          PAGINATION NEOMORPHIQUE
      ========================================================== */}
      {totalPages > 1 && (
        <div className={NEO.card}>
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 order-2 sm:order-1">
              Affichage de {(currentPage - 1) * plansPerPage + 1} à{" "}
              {Math.min(currentPage * plansPerPage, filteredPlans.length)} sur{" "}
              {filteredPlans.length} plan(s)
            </div>
            <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                className={NEO.button}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <div className="flex gap-1">
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
                      className={cn(
                        "w-9 h-9 p-0",
                        currentPage === pageNum ? NEO.buttonPrimary : NEO.button
                      )}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className={NEO.button}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          STATISTIQUES RAPIDES
      ========================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={NEO.card}>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {Array.isArray(subscriptionPlans) ? subscriptionPlans.length : 0}
            </p>
            <p className="text-sm text-slate-500">Total plans</p>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {Array.isArray(subscriptionPlans) ? subscriptionPlans.filter(p => p.isActive).length : 0}
            </p>
            <p className="text-sm text-slate-500">Plans actifs</p>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-[#0B676E]">
              {Array.isArray(subscriptionPlans) ? subscriptionPlans.filter(p => p.type !== 'custom').length : 0}
            </p>
            <p className="text-sm text-slate-500">Plans publics</p>
          </div>
        </div>
        <div className={NEO.card}>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {Array.isArray(subscriptionPlans) ? subscriptionPlans.filter(p => p.type === 'custom').length : 0}
            </p>
            <p className="text-sm text-slate-500">Plans privés</p>
          </div>
        </div>
      </div>
    </div>
  );
}