// ClientSiteSections.tsx - VERSION CORRIGÉE
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  UserPlus,
  UserCheck,
  User,
  AlertTriangle,
  FileText,
  CheckCircle,
  X,
  Phone,
  Shield,
  Clock,
  Star,
  Package,
  Truck,
  Calendar,
  MapPin,
  Mail,
  ChevronRight,
  Users,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Info,
  Home,
  ClipboardCheck,
  ShoppingBag,
  MessageSquare,
  Zap,
  Sparkles,
  Target,
  PieChart,
  BarChart3,
  Crown,
  Heart,
  ShieldCheck,
  Building,
  Award,
  Check,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  PlusCircle,
  Euro,
  Tag,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Mutation<T> = {
  mutate: (vars: T, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => void;
  isPending?: boolean;
};

type SafeFormatDate = (d?: string | Date | null) => string;

/* =========================
   Interface pour les abonnements
   ========================= */
interface Subscription {
  id: number;
  planId: number;
  planName: string;
  planType: string;
  planPrice: string;
  clientName: string;
  clientFirstName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  specialRequirements?: string;
  status: string;
  createdAt: string;
  userId?: number;
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  userAddress?: string;
  userCreatedAt?: string;
  userStatus?: string;
  userIsActive?: boolean;
  userSelectedPlanId?: number;
  neighborhood?: string;
}

/* =========================
   Inscriptions avec Plans Choisis - DESIGN PROFESSIONNEL AVEC ONGLETS ET PAGINATION
   ========================= */
export function RegistrationsSection({
  users,
  toggleUserStatusMutation,
  safeFormatDate,
  subscriptionPlans = [],
}: {
  users: any[] | undefined;
  toggleUserStatusMutation: Mutation<{ id: string; status: "approved" | "refused"; isActive?: boolean }>;
  safeFormatDate: SafeFormatDate;
  subscriptionPlans?: any[];
}) {
  // 🎯 ÉTATS NÉCESSAIRES POUR LES ABONNEMENTS
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
  
  // 🎯 ÉTATS DE PAGINATION
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 🎯 FONCTION POUR RÉCUPÉRER LES ABONNEMENTS
  const fetchAllSubscriptions = async () => {
    console.log("🔄 Récupération des abonnements...");
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/pending-subscriptions?status=all', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log(`📡 Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log("📊 Résultat API:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setSubscriptions(result.data);
        console.log(`✅ ${result.data.length} abonnements chargés (tous statuts)`);
        
        setHiddenIds(new Set());
        setProcessingIds(new Set());
      } else {
        throw new Error("Format de données invalide");
      }
      
    } catch (error) {
      console.error("❌ Erreur fetch:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 CHARGEMENT INITIAL
  useEffect(() => {
    fetchAllSubscriptions();
    const interval = setInterval(fetchAllSubscriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🎯 FUSIONNER LES DONNÉES
  const effectiveUsers = React.useMemo(() => {
    if (loading && forceData.length === 0 && subscriptions.length === 0) return [];
    
    if (subscriptions.length > 0) {
      return subscriptions.map(item => ({
        ...item,
        fullName: item.clientName || item.userFullName || item.fullName,
        email: item.clientEmail || item.userEmail || item.email,
        phone: item.clientPhone || item.userPhone || item.phone,
        address: item.clientAddress || item.userAddress || item.address,
        createdAt: item.createdAt || item.userCreatedAt,
        status: item.status || item.userStatus || "pending",
        isActive: item.userIsActive || false,
        userId: item.userId || item.id,
        selectedPlanId: item.planId || item.userSelectedPlanId,
        planName: item.planName || `Plan ${item.planId}`,
        planType: item.planType,
        planPrice: item.planPrice,
        specialRequirements: item.specialRequirements,
        hasValidPlan: !!(item.planId || item.planName),
        planSelectionId: item.id,
        neighborhood: item.neighborhood || "Non spécifié"
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
        planType: item.planType,
        planPrice: item.planPrice,
        hasValidPlan: !!(item.selectedPlanId || item.planId || item.planName),
        planSelectionId: item.id,
        neighborhood: item.neighborhood || "Non spécifié"
      }));
    }
    
    const validUsers = Array.isArray(users) 
      ? users.filter(u => u.selectedPlanId || u.planId || u.planName)
      : [];
    
    return validUsers.map(u => ({
      ...u,
      planSelectionId: u.id,
      neighborhood: u.neighborhood || "Non spécifié"
    }));
  }, [users, forceData, subscriptions, loading]);

  // 🎯 FONCTION POUR CRÉER UN CLIENT À PARTIR D'UNE INSCRIPTION
  const createClientFromSubscription = async (subscription: any) => {
    try {
      console.log("📝 Création du client depuis l'inscription:", subscription);
      
      const clientData = {
        fullName: subscription.clientName || subscription.fullName,
        phone: subscription.clientPhone || subscription.phone,
        email: subscription.clientEmail || subscription.email,
        neighborhood: subscription.neighborhood || "Non spécifié",
        addressDetails: subscription.clientAddress || subscription.address || "",
        preferredPickupDays: []
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      const newClient = await response.json();
      console.log("✅ Client créé:", newClient);
      
      // Créer l'abonnement pour ce client
      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clientId: newClient.id,
          planId: subscription.planId || subscription.selectedPlanId,
          startDate: new Date().toISOString(),
          isActive: true
        })
      });

      if (!subscriptionResponse.ok) {
        console.warn("⚠️ Client créé mais échec de création d'abonnement");
      }

      return newClient;
    } catch (error) {
      console.error("❌ Erreur création client:", error);
      throw error;
    }
  };

  // 🎯 FONCTION POUR METTRE À JOUR LE STATUT D'UNE PLANSELECTION
  const updatePlanSelectionStatus = async (planSelectionId: number, status: "approved" | "refused") => {
    try {
      console.log(`🔄 Mise à jour planSelection ${planSelectionId} -> ${status}`);
      
      const response = await fetch(`/api/plan-selections/${planSelectionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: status
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ PlanSelection ${planSelectionId} mis à jour:`, result);
      
      return true;
    } catch (error) {
      console.error(`❌ Erreur mise à jour planSelection ${planSelectionId}:`, error);
      throw error;
    }
  };

  // 🎯 OBTENIR LES DÉTAILS DU PLAN
  const getPlanDetails = (registration: any) => {
    if (subscriptionPlans && registration.planId) {
      const realPlan = subscriptionPlans.find(p => p.id === registration.planId);
      if (realPlan) {
        return {
          id: realPlan.id,
          name: realPlan.name,
          type: realPlan.type || 'essential',
          pricePerMonth: realPlan.pricePerMonth || realPlan.price || '0',
          itemsIncluded: realPlan.itemsIncluded || 0,
          pickupsPerWeek: realPlan.pickupsPerWeek || 0,
          deliveryTimeHours: realPlan.deliveryTimeHours || 24,
          features: realPlan.features || [],
          description: realPlan.description || '',
          source: 'real-db'
        };
      }
    }

    if (registration.planName && registration.planPrice) {
      return {
        id: registration.planId || 0,
        name: registration.planName,
        type: registration.planType || 'essential',
        pricePerMonth: registration.planPrice,
        itemsIncluded: registration.itemsIncluded || 0,
        pickupsPerWeek: registration.pickupsPerWeek || 0,
        deliveryTimeHours: registration.deliveryTimeHours || 24,
        features: registration.features || [],
        description: registration.description || '',
        source: 'api-direct'
      };
    }

    return {
      id: registration.planId || 0,
      name: registration.planName || 'Plan Inconnu',
      type: registration.planType || 'essential',
      pricePerMonth: registration.planPrice || '0',
      itemsIncluded: 0,
      pickupsPerWeek: 0,
      deliveryTimeHours: 24,
      features: [],
      description: '',
      source: 'fallback'
    };
  };

  // 🎯 CONFIGURATION DES PLANS
  const getPlanConfig = (planType: string) => {
    const type = (planType || '').toLowerCase();
    let normalizedType = 'essential';
    if (type.includes('premium')) normalizedType = 'premium';
    else if (type.includes('family') || type.includes('familial')) normalizedType = 'family';
    else if (type.includes('essential') || type.includes('essentiel')) normalizedType = 'essential';
    
    const configs = {
      'premium': {
        label: 'Premium',
        badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        textColor: 'text-white',
        bgColor: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
        icon: Crown,
        description: 'Solution complète haut de gamme',
        accentColor: 'text-amber-600',
        shadow: 'shadow-amber-100',
        priceRange: '75,000 Ar/mois'
      },
      'family': {
        label: 'Familial',
        badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        textColor: 'text-white',
        bgColor: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200',
        icon: Users,
        description: 'Idéal pour les familles',
        accentColor: 'text-blue-600',
        shadow: 'shadow-blue-100',
        priceRange: '45,000 Ar/mois'
      },
      'essential': {
        label: 'Essentiel',
        badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
        textColor: 'text-white',
        bgColor: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        icon: ShieldCheck,
        description: 'Solution économique essentielle',
        accentColor: 'text-green-600',
        shadow: 'shadow-green-100',
        priceRange: '25,000 Ar/mois'
      }
    };
    
    return configs[normalizedType as keyof typeof configs] || configs.essential;
  };

  // 🎯 FILTRER ET TRIER - UTILISATEURS EN ATTENTE
  const pending = React.useMemo(() => {
    let filtered = effectiveUsers
      .filter((u: any) => 
        (u.role === "client" || !u.role) &&
        (u.status === "pending" || !u.status || u.status === "") &&
        u.hasValidPlan !== false
      )
      .filter((u: any) => {
        const id = Number(u.userId || u.id);
        return !hiddenIds.has(id) && !processingIds.has(id);
      });
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.fullName || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.phone || '').includes(query)
      );
    }
    
    if (filterPlan !== "all") {
      filtered = filtered.filter((u: any) => {
        const plan = getPlanDetails(u);
        return plan.type === filterPlan;
      });
    }
    
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      
      switch (sortBy) {
        case "newest": return dateB.getTime() - dateA.getTime();
        case "oldest": return dateA.getTime() - dateB.getTime();
        case "name": return (a.fullName || '').localeCompare(b.fullName || '');
        default: return dateB.getTime() - dateA.getTime();
      }
    });
    
    return filtered;
  }, [effectiveUsers, hiddenIds, processingIds, searchQuery, filterPlan, sortBy]);

  // 🎯 FILTRER ET TRIER - UTILISATEURS ACCEPTÉS
  const approved = React.useMemo(() => {
    let filtered = effectiveUsers
      .filter((u: any) => 
        (u.role === "client" || !u.role) &&
        u.status === "approved" &&
        u.hasValidPlan !== false
      );
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.fullName || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.phone || '').includes(query)
      );
    }
    
    if (filterPlan !== "all") {
      filtered = filtered.filter((u: any) => {
        const plan = getPlanDetails(u);
        return plan.type === filterPlan;
      });
    }
    
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      
      switch (sortBy) {
        case "newest": return dateB.getTime() - dateA.getTime();
        case "oldest": return dateA.getTime() - dateB.getTime();
        case "name": return (a.fullName || '').localeCompare(b.fullName || '');
        default: return dateB.getTime() - dateA.getTime();
      }
    });
    
    return filtered;
  }, [effectiveUsers, searchQuery, filterPlan, sortBy]);

  // 🎯 CALCULS PAGINATION
  const currentUsers = React.useMemo(() => {
    return activeTab === "pending" ? pending : approved;
  }, [activeTab, pending, approved]);

  const totalItems = currentUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = currentUsers.slice(startIndex, endIndex);

  // 🎯 FONCTIONS PAGINATION
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 🎯 RÉINITIALISER LA PAGE QUAND ON CHANGE D'ONGLET OU DE FILTRES
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterPlan, sortBy]);

  // 🎯 CALCULS STATISTIQUES
  const calculatePotentialRevenue = (usersList: any[]) => {
    return usersList.reduce((total, user) => {
      const plan = getPlanDetails(user);
      if (plan.pricePerMonth && plan.pricePerMonth !== '0') {
        try {
          const price = typeof plan.pricePerMonth === 'string' 
            ? parseInt(plan.pricePerMonth.replace(/\D/g, ''), 10) 
            : plan.pricePerMonth;
          return total + (isNaN(price) ? 0 : price);
        } catch {
          return total;
        }
      }
      return total;
    }, 0);
  };

  const statsByPlanType = React.useMemo(() => {
    const stats = {
      premium: { count: 0, revenue: 0 },
      family: { count: 0, revenue: 0 },
      essential: { count: 0, revenue: 0 }
    };
    
    const currentUsers = activeTab === "pending" ? pending : approved;
    
    currentUsers.forEach(user => {
      const plan = getPlanDetails(user);
      const type = plan.type;
      const price = typeof plan.pricePerMonth === 'string' 
        ? parseInt(plan.pricePerMonth.replace(/\D/g, ''), 10) 
        : plan.pricePerMonth;
      
      if (stats[type as keyof typeof stats]) {
        stats[type as keyof typeof stats].count++;
        stats[type as keyof typeof stats].revenue += isNaN(price) ? 0 : price;
      }
    });
    
    return stats;
  }, [pending, approved, activeTab]);

  // 🎯 COMPOSANT HEADER
  const HeaderSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Inscriptions</h1>
          </div>
          <p className="text-gray-600">Gérez les inscriptions avec plans choisis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                activeTab === "pending" ? "bg-green-500 animate-pulse" : "bg-blue-500"
              }`}></div>
              <span className="font-bold">
                {activeTab === "pending" ? pending.length : approved.length}
              </span>
              <span>{activeTab === "pending" ? "en attente" : "acceptés"}</span>
            </div>
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAllSubscriptions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>
    </div>
  );

  // 🎯 COMPOSANT ONGLETS
  const TabsSection = () => (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En attente
                {pending.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    {pending.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Acceptés
                {approved.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                    {approved.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Rechercher un client ${activeTab === "pending" ? "en attente" : "accepté"}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterPlan === "all" ? "Tous les plans" : 
                   filterPlan === "premium" ? "Premium" :
                   filterPlan === "family" ? "Familial" : "Essentiel"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterPlan("all")}>
                  Tous les plans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPlan("premium")}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Premium
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPlan("family")}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Familial
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPlan("essential")}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Essentiel
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Trier
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Plus récent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Plus ancien
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Nom (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 🎯 COMPOSANT STATS PRINCIPALES
  const MainStats = () => {
    const currentUsers = activeTab === "pending" ? pending : approved;
    const totalRevenue = calculatePotentialRevenue(currentUsers);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenus potentiels */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {activeTab === "pending" ? "Revenus potentiels" : "Revenus générés"}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('fr-FR').format(totalRevenue)}
                  <span className="text-sm text-gray-600 ml-1">Ar</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {activeTab === "pending" ? "Si tous validés" : "Total généré"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {activeTab === "pending" ? "Clients en attente" : "Clients acceptés"}
                </p>
                <p className="text-3xl font-bold text-gray-900">{currentUsers.length}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {activeTab === "pending" ? "Inscriptions à traiter" : "Inscriptions validées"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moyenne */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {activeTab === "pending" ? "Valeur moyenne" : "Revenu moyen"}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {currentUsers.length > 0 
                    ? new Intl.NumberFormat('fr-FR').format(
                        Math.round(totalRevenue / currentUsers.length)
                      )
                    : '0'}
                  <span className="text-sm text-gray-600 ml-1">Ar</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {activeTab === "pending" ? "Par client" : "Par inscription"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 🎯 COMPOSANT STATISTIQUES PAR PLAN
  const PlanStats = () => {
    const currentUsers = activeTab === "pending" ? pending : approved;
    
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Répartition par plan</h3>
            <Badge variant="outline" className="capitalize">
              {activeTab === "pending" ? "En attente" : "Acceptés"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Essentiel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Essentiel</span>
                </div>
                <Badge variant="secondary">{statsByPlanType.essential.count}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenus</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('fr-FR').format(statsByPlanType.essential.revenue)} Ar
                  </span>
                </div>
                <Progress value={currentUsers.length > 0 ? (statsByPlanType.essential.count / currentUsers.length) * 100 : 0} 
                  className="h-2 bg-gray-100" indicatorClassName="bg-green-500" />
              </div>
            </div>

            {/* Familial */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Familial</span>
                </div>
                <Badge variant="secondary">{statsByPlanType.family.count}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenus</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('fr-FR').format(statsByPlanType.family.revenue)} Ar
                  </span>
                </div>
                <Progress value={currentUsers.length > 0 ? (statsByPlanType.family.count / currentUsers.length) * 100 : 0} 
                  className="h-2 bg-gray-100" indicatorClassName="bg-blue-500" />
              </div>
            </div>

            {/* Premium */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="font-medium">Premium</span>
                </div>
                <Badge variant="secondary">{statsByPlanType.premium.count}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenus</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('fr-FR').format(statsByPlanType.premium.revenue)} Ar
                  </span>
                </div>
                <Progress value={currentUsers.length > 0 ? (statsByPlanType.premium.count / currentUsers.length) * 100 : 0} 
                  className="h-2 bg-gray-100" indicatorClassName="bg-amber-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🎯 COMPOSANT PAGINATION
  const PaginationSection = () => {
    if (totalItems <= itemsPerPage) return null;
    
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Affichage de <span className="font-semibold">{startIndex + 1}</span> à{" "}
              <span className="font-semibold">{endIndex}</span> sur{" "}
              <span className="font-semibold">{totalItems}</span> inscriptions{" "}
              {activeTab === "pending" ? "en attente" : "acceptées"}
              {processingIds.size > 0 && activeTab === "pending" && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-blue-600">
                    {processingIds.size} en traitement
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Par page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
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
                        className="h-8 w-8"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="mx-1">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => goToPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm" onClick={fetchAllSubscriptions}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🎯 COMPOSANT CARTE CLIENT INDIVIDUELLE
  const ClientCard = ({ registration, isApproved = false }: { registration: any, isApproved?: boolean }) => {
    const selectedPlan = getPlanDetails(registration);
    const planConfig = getPlanConfig(selectedPlan.type);
    const PlanIcon = planConfig.icon;
    
    const getInitials = (name: string) => {
      return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL';
    };

    const handleApprove = async () => {
      const userId = Number(registration.userId || registration.id);
      const planSelectionId = registration.planSelectionId || registration.id;
      
      if (window.confirm(`Approuver l'inscription de ${registration.fullName} ?`)) {
        try {
          setProcessingIds(prev => new Set(prev).add(userId));
          setHiddenIds(prev => new Set(prev).add(userId));
          
          // 1. Mettre à jour le statut du planSelection
          await updatePlanSelectionStatus(planSelectionId, "approved");
          
          // 2. Créer le client dans la base
          const newClient = await createClientFromSubscription(registration);
          
          // 3. Appeler la mutation existante (pour les notifications, etc.)
          toggleUserStatusMutation.mutate({
            id: userId.toString(),
            status: "approved",
            isActive: true,
          }, {
            onSuccess: () => {
              console.log(`✅ Client ${registration.fullName} créé et approuvé`);
              
              setTimeout(() => {
                fetchAllSubscriptions();
                
                setProcessingIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(userId);
                  return newSet;
                });
              }, 1000);
            },
            onError: (error) => {
              console.error("❌ Erreur lors de l'approbation de l'utilisateur:", error);
              
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
              
              setHiddenIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          });
          
        } catch (error) {
          console.error("❌ Erreur lors de l'approbation:", error);
          
          setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          
          setHiddenIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
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
          
          toggleUserStatusMutation.mutate({
            id: userId.toString(),
            status: "refused",
            isActive: false,
          }, {
            onSuccess: () => {
              console.log(`❌ Client ${registration.fullName} refusé avec succès`);
              
              setTimeout(() => {
                fetchAllSubscriptions();
                
                setProcessingIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(userId);
                  return newSet;
                });
              }, 1000);
            },
            onError: (error) => {
              console.error("❌ Erreur lors du refus de l'utilisateur:", error);
              
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
              
              setHiddenIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          });
          
        } catch (error) {
          console.error("❌ Erreur lors du refus:", error);
          
          setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          
          setHiddenIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    };

    const isProcessing = processingIds.has(Number(registration.userId || registration.id));

    return (
      <Card className={`hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Traitement en cours...</p>
            </div>
          </div>
        )}
        
        <div className={`absolute top-0 left-0 w-full h-1 ${planConfig.badgeColor}`}></div>
        
        <CardContent className="p-6">
          {/* En-tête */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                <AvatarFallback className={`${planConfig.badgeColor} ${planConfig.textColor}`}>
                  {getInitials(registration.fullName || 'CL')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {registration.fullName || 'Client sans nom'}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {registration.email || 'Non spécifié'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {registration.phone || 'Non spécifié'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isApproved ? (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Accepté
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  <Clock className="h-3 w-3 mr-2" />
                  En attente
                </Badge>
              )}
              {!isProcessing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log('Voir détails:', registration)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    {!isApproved && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={handleReject}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Refuser
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Plan */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Plan sélectionné</span>
              </div>
              <Badge className={`${planConfig.badgeColor} ${planConfig.textColor} font-semibold`}>
                {planConfig.label}
              </Badge>
            </div>
            
            <div className={`rounded-lg p-4 border ${planConfig.borderColor} bg-gradient-to-r ${planConfig.bgColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xl text-gray-900">{selectedPlan.name}</p>
                  <p className="text-sm text-gray-600">{planConfig.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('fr-FR').format(
                      parseInt(selectedPlan.pricePerMonth.toString().replace(/\D/g, '')) || 0
                    )}
                    <span className="text-sm text-gray-600 ml-1">Ar/mois</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">ID: {selectedPlan.id}</p>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {selectedPlan.itemsIncluded || '∞'} pièces
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {selectedPlan.pickupsPerWeek || 2} collectes/semaine
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Livraison {selectedPlan.deliveryTimeHours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Assurance incluse</span>
                </div>
              </div>
            </div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Adresse</p>
              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-900">{registration.address || 'Non spécifiée'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Date d'inscription</p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-900">
                    {safeFormatDate(registration.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Il y a {Math.floor((new Date().getTime() - new Date(registration.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Exigences spéciales */}
          {registration.specialRequirements && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Exigences spéciales :</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {registration.specialRequirements}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isApproved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Accepté le {safeFormatDate(registration.updatedAt || registration.createdAt)}</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>En attente depuis {safeFormatDate(registration.createdAt)}</span>
                </>
              )}
            </div>
            
            {!isApproved && !isProcessing && (
              <div className="flex gap-2 w-full sm:w-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white flex-1 sm:flex-none"
                        onClick={handleApprove}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {toggleUserStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Accepter l'inscription et activer le compte</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleReject}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refuser l'inscription</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            
            {isApproved && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🎯 ÉTAT DE CHARGEMENT
  if (loading && pending.length === 0 && approved.length === 0) {
    return (
      <div className="space-y-8">
        <HeaderSection />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-blue-100 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement des inscriptions</h3>
          <p className="text-gray-600">Récupération des données en cours...</p>
        </div>
      </div>
    );
  }

  // 🎯 MESSAGE D'ERREUR
  if (error && !loading) {
    return (
      <div className="space-y-8">
        <HeaderSection />
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Erreur de chargement</h3>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={fetchAllSubscriptions} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🎯 RENDU PRINCIPAL
  return (
    <div className="space-y-8">
      <HeaderSection />
      <TabsSection />
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchAllSubscriptions} className="ml-auto">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "pending" && pending.length === 0 && !loading && (
        <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-8 shadow-lg">
              <UserCheck className="h-12 w-12 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucune inscription en attente</h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg mb-8">
              Toutes les inscriptions avec plans ont été traitées.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchAllSubscriptions} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setActiveTab("approved")}
              >
                <CheckCircle className="h-4 w-4" />
                Voir les acceptés
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "approved" && approved.length === 0 && !loading && (
        <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 mb-8 shadow-lg">
              <Users className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun client accepté</h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg mb-8">
              Aucune inscription n'a encore été acceptée.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchAllSubscriptions} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setActiveTab("pending")}
              >
                <Clock className="h-4 w-4" />
                Voir les en attente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {(activeTab === "pending" && pending.length > 0) || (activeTab === "approved" && approved.length > 0) ? (
        <>
          <MainStats />
          <PlanStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedUsers.map((registration: any) => (
              <ClientCard 
                key={`${registration.userId || registration.id}-${registration.planSelectionId}`} 
                registration={registration} 
                isApproved={activeTab === "approved"}
              />
            ))}
          </div>
          
          <PaginationSection />
        </>
      ) : null}
    </div>
  );
}

/* =========================
   Devis Personnalisés - AVEC FONCTIONNALITÉ DE CONVERSION EN PLANS PRIVÉS
   ========================= */
export function CustomQuotesSection({
  customQuotes,
  updateQuoteStatusMutation,
  setNewPlanData,
  setIsNewPlanOpen,
  setActiveTab,
  toast,
  safeFormatDate,
  createPlanMutation,
  queryClient,
}: {
  customQuotes: any[] | undefined;
  updateQuoteStatusMutation: Mutation<{ id: string; status: "approved" | "rejected" | "reviewed" }>;
  setNewPlanData: (d: any) => void;
  setIsNewPlanOpen: (v: boolean) => void;
  setActiveTab: (v: string) => void;
  toast: (opts: { title: string; description?: string; variant?: string }) => void;
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
    planName: "",
    pricePerMonth: "",
    description: "",
    itemsIncluded: 20,
    pickupsPerWeek: 2,
    deliveryTimeHours: 48,
  });
  
  // 🎯 ÉTATS DE PAGINATION
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(10);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  // 🎯 FONCTION POUR CRÉER UN CLIENT À PARTIR D'UN DEVIS
  const createClientFromQuote = async (quote: any) => {
    try {
      console.log("📝 Création du client depuis le devis:", quote);
      
      const clientData = {
        fullName: quote.fullName,
        phone: quote.phone,
        email: quote.email,
        neighborhood: quote.neighborhood || "Non spécifié",
        addressDetails: quote.addressDetails || "",
        preferredPickupDays: []
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      const newClient = await response.json();
      console.log("✅ Client créé depuis devis:", newClient);
      return newClient;
    } catch (error) {
      console.error("❌ Erreur création client depuis devis:", error);
      throw error;
    }
  };

  // 🎯 FONCTION POUR CRÉER UN PLAN PRIVÉ ET UN ABONNEMENT
  const createPrivatePlanFromQuote = async (quote: any, planData: any) => {
    try {
      // 1. Créer le client d'abord
      const newClient = await createClientFromQuote(quote);
      
      // 2. Créer le plan privé
      const planPayload = {
        name: planData.planName,
        pricePerMonth: `${planData.pricePerMonth} Ar`,
        type: "custom",
        itemsIncluded: Number(planData.itemsIncluded),
        pickupsPerWeek: Number(planData.pickupsPerWeek),
        deliveryTimeHours: Number(planData.deliveryTimeHours),
        isActive: true,
        features: ["Ramassage à domicile", "Nettoyage premium", "Support prioritaire"],
        description: planData.description,
        clientId: newClient.id,
        clientName: quote.fullName,
        clientEmail: quote.email
      };

      const planResponse = await fetch('/api/subscription-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(planPayload)
      });

      if (!planResponse.ok) {
        throw new Error(`Erreur création plan: ${planResponse.status}`);
      }

      const newPlan = await planResponse.json();
      
      // 3. Créer l'abonnement pour le client
      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clientId: newClient.id,
          planId: newPlan.id,
          startDate: new Date().toISOString(),
          isActive: true
        })
      });

      if (!subscriptionResponse.ok) {
        console.warn("⚠️ Plan créé mais échec de création d'abonnement");
      }

      return { client: newClient, plan: newPlan };
    } catch (error) {
      console.error("❌ Erreur création plan privé:", error);
      throw error;
    }
  };

  // 🎯 FONCTION POUR CRÉER UN PLAN STANDARD POUR UN DEVIS
  const createStandardPlanFromQuote = async (quote: any, planId: number) => {
    try {
      // 1. Créer le client
      const newClient = await createClientFromQuote(quote);
      
      // 2. Créer l'abonnement avec le plan standard
      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clientId: newClient.id,
          planId: planId,
          startDate: new Date().toISOString(),
          isActive: true
        })
      });

      if (!subscriptionResponse.ok) {
        throw new Error(`Erreur création abonnement: ${subscriptionResponse.status}`);
      }

      return newClient;
    } catch (error) {
      console.error("❌ Erreur création plan standard:", error);
      throw error;
    }
  };

  // 🎯 FONCTION PRINCIPALE POUR APPROUVER UN DEVIS
  const handleQuoteApprove = async (quote: any) => {
    const quoteId = quote.id;
    
    if (window.confirm(`Approuver le devis de ${quote.fullName} et créer un client ?`)) {
      try {
        setProcessingQuoteIds(prev => new Set(prev).add(quoteId));
        setHiddenQuoteIds(prev => new Set(prev).add(quoteId));
        
        // Par défaut, on crée un plan personnalisé basé sur le devis
        const planData = {
          planName: `${quote.fullName} - Personnalisé`,
          pricePerMonth: quote.estimatedValue?.toString() || "50000",
          description: `Plan personnalisé pour ${quote.fullName}\n\nDemande initiale: ${quote.notes || "Aucune note"}\nPièces/semaine: ${quote.itemsPerWeek || "Non spécifié"}\nType de service: ${quote.serviceType || "Standard"}`,
          itemsIncluded: quote.itemsPerWeek || 20,
          pickupsPerWeek: 2,
          deliveryTimeHours: 48,
        };
        
        // Créer le plan privé et le client
        const { client, plan } = await createPrivatePlanFromQuote(quote, planData);
        
        console.log(`✅ Client ${client.fullName} créé avec plan personnalisé ${plan.name}`);
        
        // Mettre à jour le statut du devis
        updateQuoteStatusMutation.mutate({ id: quoteId, status: "approved" }, {
          onSuccess: () => {
            toast({ 
              title: "Devis approuvé et client créé", 
              description: `Le client ${client.fullName} a été créé avec un plan personnalisé.`
            });
            
            // Invalider les caches
            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
              queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            }
            
            setTimeout(() => {
              setProcessingQuoteIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(quoteId);
                return newSet;
              });
            }, 1000);
          },
          onError: (error) => {
            console.error("❌ Erreur mise à jour statut devis:", error);
            toast({
              title: "Erreur",
              description: "Client créé mais erreur de mise à jour du devis.",
              variant: "destructive"
            });
            
            setProcessingQuoteIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(quoteId);
              return newSet;
            });
            
            setHiddenQuoteIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(quoteId);
              return newSet;
            });
          }
        });
        
      } catch (error) {
        console.error("❌ Erreur lors de l'approbation:", error);
        toast({
          title: "Erreur de création",
          description: error instanceof Error ? error.message : "Impossible de créer le client.",
          variant: "destructive"
        });
        
        setProcessingQuoteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(quoteId);
          return newSet;
        });
        
        setHiddenQuoteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(quoteId);
          return newSet;
        });
      }
    }
  };

  const allQuotes = React.useMemo(() => {
    let filtered = Array.isArray(customQuotes)
      ? customQuotes.filter((q: any) => 
          !hiddenQuoteIds.has(q.id) && !processingQuoteIds.has(q.id)
        )
      : [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q: any) =>
        (q.fullName || '').toLowerCase().includes(query) ||
        (q.email || '').toLowerCase().includes(query) ||
        (q.phone || '').includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((q: any) => q.status === statusFilter);
    }

    return filtered;
  }, [customQuotes, hiddenQuoteIds, processingQuoteIds, searchQuery, statusFilter]);

  // 🎯 CALCULS PAGINATION
  const totalItems = allQuotes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const quotes = allQuotes.slice(startIndex, endIndex);

  // 🎯 FONCTIONS PAGINATION
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 🎯 RÉINITIALISER LA PAGE QUAND ON CHANGE DE FILTRES
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const stats = React.useMemo(() => ({
    pending: allQuotes.filter((q: any) => q.status === "pending").length,
    approved: allQuotes.filter((q: any) => q.status === "approved").length,
    rejected: allQuotes.filter((q: any) => q.status === "rejected").length,
    all: customQuotes?.length || 0,
    totalValue: allQuotes.reduce((sum, q) => sum + (q.estimatedValue || 0), 0)
  }), [allQuotes, customQuotes]);

  const handleQuoteStatusUpdate = (quoteId: string, status: "approved" | "rejected" | "reviewed") => {
    if (status === "approved") {
      // Pour l'approbation, on utilise la nouvelle fonction handleQuoteApprove
      const quote = allQuotes.find(q => q.id === quoteId);
      if (quote) {
        handleQuoteApprove(quote);
      }
      return;
    }
    
    // Pour le rejet ou la révision, on utilise l'ancienne logique
    setProcessingQuoteIds(prev => new Set(prev).add(quoteId));
    setHiddenQuoteIds(prev => new Set(prev).add(quoteId));
    
    updateQuoteStatusMutation.mutate({ id: quoteId, status }, {
      onSuccess: () => {
        setTimeout(() => {
          setProcessingQuoteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(quoteId);
            return newSet;
          });
        }, 1000);
        
        toast({ 
          title: `Devis ${status === "approved" ? "approuvé" : status === "rejected" ? "refusé" : "révisé"}`, 
          description: `Le devis a été ${status === "approved" ? "accepté" : status === "rejected" ? "refusé" : "révisé"} avec succès.`
        });
      }
    });
  };

  // 🎯 FONCTION POUR OUVRIR LE MODAL DE CONVERSION
  const openConvertToPrivatePlan = (quote: any) => {
    setSelectedQuoteForConversion(quote);
    setConversionFormData({
      planName: `${quote.fullName} - Personnalisé`,
      pricePerMonth: quote.estimatedValue?.toString() || "",
      description: `Plan personnalisé pour ${quote.fullName}\n\nDemande initiale: ${quote.notes || "Aucune note"}\nPièces/semaine: ${quote.itemsPerWeek || "Non spécifié"}\nType de service: ${quote.serviceType || "Standard"}`,
      itemsIncluded: quote.itemsPerWeek || 20,
      pickupsPerWeek: 2,
      deliveryTimeHours: 48,
    });
    setConvertDialogOpen(true);
  };

  // 🎯 FONCTION POUR CRÉER UN PLAN PRIVÉ À PARTIR D'UN DEVIS
  const handleCreatePrivatePlan = async () => {
    if (!selectedQuoteForConversion) return;

    const { planName, pricePerMonth, description, itemsIncluded, pickupsPerWeek, deliveryTimeHours } = conversionFormData;

    if (!planName || !pricePerMonth || isNaN(Number(pricePerMonth))) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir un nom de plan et un prix valide.",
        variant: "destructive"
      });
      return;
    }

    try {
      const quoteId = selectedQuoteForConversion.id;
      setProcessingQuoteIds(prev => new Set(prev).add(quoteId));
      
      const planData = {
        planName,
        pricePerMonth,
        description,
        itemsIncluded,
        pickupsPerWeek,
        deliveryTimeHours
      };
      
      // Créer le plan privé et le client
      const { client, plan } = await createPrivatePlanFromQuote(selectedQuoteForConversion, planData);
      
      // Mettre à jour le statut du devis
      updateQuoteStatusMutation.mutate({ id: quoteId, status: "approved" }, {
        onSuccess: () => {
          // Invalider les caches
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
          }

          toast({
            title: "Plan privé créé",
            description: `Le plan "${planName}" a été créé et le client ${client.fullName} a été enregistré.`
          });

          // Fermer le modal
          setConvertDialogOpen(false);
          setSelectedQuoteForConversion(null);
          
          setTimeout(() => {
            setProcessingQuoteIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(quoteId);
              return newSet;
            });
          }, 1000);
        }
      });

    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast({
        title: "Erreur de création",
        description: error instanceof Error ? error.message : "Impossible de créer le plan privé.",
        variant: "destructive"
      });
      
      setProcessingQuoteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedQuoteForConversion.id);
        return newSet;
      });
    }
  };

  const HeaderSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Devis Personnalisés</h1>
          </div>
          <p className="text-gray-600">Gérez les demandes de plans sur mesure</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="font-bold">{allQuotes.length}</span>
              <span>{statusFilter === "all" ? "devis" : statusFilter === "pending" ? "en attente" : statusFilter}</span>
            </div>
          </Badge>
        </div>
      </div>
    </div>
  );

  const FilterSection = () => (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Rechercher un devis${statusFilter !== "all" ? ` ${statusFilter}` : ""}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="all">
                Tous
                {stats.all > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800">
                    {stats.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  En attente
                  {stats.pending > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                      {stats.pending}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="approved">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approuvés
                  {stats.approved > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                      {stats.approved}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Refusés
                  {stats.rejected > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                      {stats.rejected}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.all}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approuvés</p>
              <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur totale</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Intl.NumberFormat('fr-FR').format(stats.totalValue)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 🎯 COMPOSANT PAGINATION
  const PaginationSection = () => {
    if (totalItems <= itemsPerPage) return null;
    
    return (
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Affichage de <span className="font-semibold">{startIndex + 1}</span> à{" "}
              <span className="font-semibold">{endIndex}</span> sur{" "}
              <span className="font-semibold">{totalItems}</span> devis{" "}
              {statusFilter !== "all" && ` ${statusFilter}`}
              {processingQuoteIds.size > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-purple-600">
                    {processingQuoteIds.size} en traitement
                  </span>
                </>
              )}
              <span className="mx-2">•</span>
              Valeur totale : 
              <span className="font-bold text-gray-900 ml-2">
                {new Intl.NumberFormat('fr-FR').format(stats.totalValue)} Ar
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Par page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
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
                        className="h-8 w-8"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="mx-1">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => goToPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🎯 MODAL DE CONVERSION DEVIS → PLAN PRIVÉ
  const ConvertToPrivatePlanDialog = () => (
    <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Convertir le devis en plan privé
          </DialogTitle>
          <DialogDescription>
            Créez un plan personnalisé pour le client à partir de sa demande de devis
          </DialogDescription>
        </DialogHeader>

        {selectedQuoteForConversion && (
          <div className="space-y-6 py-4">
            {/* Informations du devis */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Demande initiale</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Client:</span>
                  <p className="font-medium">{selectedQuoteForConversion.fullName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{selectedQuoteForConversion.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Pièces/semaine:</span>
                  <p className="font-medium">{selectedQuoteForConversion.itemsPerWeek || "Non spécifié"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Valeur estimée:</span>
                  <p className="font-medium">
                    {new Intl.NumberFormat('fr-FR').format(selectedQuoteForConversion.estimatedValue || 0)} Ar
                  </p>
                </div>
              </div>
            </div>

            {/* Formulaire de création du plan */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Nom du plan *</Label>
                <Input
                  id="planName"
                  placeholder="ex: Plan Personnalisé - Jean Dupont"
                  value={conversionFormData.planName}
                  onChange={(e) => setConversionFormData({...conversionFormData, planName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerMonth">Prix mensuel (Ar) *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="pricePerMonth"
                    type="number"
                    placeholder="50000"
                    className="pl-10"
                    value={conversionFormData.pricePerMonth}
                    onChange={(e) => setConversionFormData({...conversionFormData, pricePerMonth: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemsIncluded">Articles inclus</Label>
                  <Input
                    id="itemsIncluded"
                    type="number"
                    value={conversionFormData.itemsIncluded}
                    onChange={(e) => setConversionFormData({...conversionFormData, itemsIncluded: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupsPerWeek">Ramassages/semaine</Label>
                  <Input
                    id="pickupsPerWeek"
                    type="number"
                    value={conversionFormData.pickupsPerWeek}
                    onChange={(e) => setConversionFormData({...conversionFormData, pickupsPerWeek: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTimeHours">Délai livraison (h)</Label>
                  <Input
                    id="deliveryTimeHours"
                    type="number"
                    value={conversionFormData.deliveryTimeHours}
                    onChange={(e) => setConversionFormData({...conversionFormData, deliveryTimeHours: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description du plan</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Décrivez les spécificités de ce plan personnalisé..."
                  value={conversionFormData.description}
                  onChange={(e) => setConversionFormData({...conversionFormData, description: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreatePrivatePlan}
            className="bg-gradient-to-r from-orange-500 to-amber-500"
          >
            <Shield className="h-4 w-4 mr-2" />
            Créer le plan privé
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const QuoteCard = ({ quote }: { quote: any }) => {
    const isProcessing = processingQuoteIds.has(quote.id);
    
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "approved":
          return {
            color: "bg-green-100 text-green-800",
            icon: CheckCircle,
            label: "Approuvé"
          };
        case "rejected":
          return {
            color: "bg-red-100 text-red-800",
            icon: XCircle,
            label: "Refusé"
          };
        default:
          return {
            color: "bg-amber-100 text-amber-800",
            icon: Clock,
            label: "En attente"
          };
      }
    };

    const statusConfig = getStatusConfig(quote.status);
    const StatusIcon = statusConfig.icon;

    return (
      <Card className={`hover:shadow-lg transition-all duration-300 border ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Traitement en cours...</p>
            </div>
          </div>
        )}
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {quote.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{quote.fullName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600">{quote.email}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">{quote.phone}</span>
                </div>
              </div>
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-2" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Besoin</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{quote.itemsPerWeek} pièces/semaine</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Type de service</p>
              <Badge variant="outline">{quote.serviceType || "Standard"}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Valeur estimée</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('fr-FR').format(quote.estimatedValue || 0)} Ar
              </p>
            </div>
          </div>

          {quote.notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{quote.notes}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Créé le {safeFormatDate(quote.createdAt)}
            </div>
            
            {quote.status === "pending" && !isProcessing && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleQuoteStatusUpdate(quote.id, "approved")}
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approuver et créer client
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuoteStatusUpdate(quote.id, "rejected")}
                >
                  <X className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openConvertToPrivatePlan(quote)}
                  className="border-orange-300 text-orange-600"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Créer plan privé
                </Button>
              </div>
            )}
            
            {quote.status !== "pending" && !isProcessing && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!Array.isArray(customQuotes) || customQuotes.length === 0) {
    return (
      <div className="space-y-8">
        <HeaderSection />
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 mb-8">
              <FileText className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun devis personnalisé</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Aucune demande de devis personnalisé n'a été soumise pour le moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeaderSection />
      <FilterSection />
      <StatsCards />
      
      {quotes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-gray-100 to-slate-100 mb-8">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {statusFilter === "pending" ? "Aucun devis en attente" :
               statusFilter === "approved" ? "Aucun devis approuvé" :
               statusFilter === "rejected" ? "Aucun devis refusé" : "Aucun devis"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {statusFilter === "pending" ? 
                "Tous les devis ont été traités." :
                statusFilter === "approved" ?
                "Aucun devis n'a encore été approuvé." :
                statusFilter === "rejected" ?
                "Aucun devis n'a été refusé." :
                "Aucune donnée disponible."
              }
            </p>
            <Button 
              variant="outline" 
              onClick={() => setStatusFilter("all")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Voir tous les devis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {quotes.map((quote: any) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
          
          <PaginationSection />
        </>
      )}

      {/* Modal de conversion */}
      <ConvertToPrivatePlanDialog />
    </div>
  );
}