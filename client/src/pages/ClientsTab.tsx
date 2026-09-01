import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, Edit, Eye, History, CheckCircle, XCircle, Loader2, Users, UserCheck, 
  TrendingUp, DollarSign, Phone, MapPin, Star, CalendarDays, ChevronLeft, 
  ChevronRight, User, Clock, Shield, UserPlus, Package, Truck, Info, ListFilter, 
  FileText, AlertCircle, RefreshCw, Mail, MessageSquare, FileWarning, CheckSquare, 
  XSquare, Calendar, ChevronDown, ChevronUp, Eraser, Clock3, Search 
} from 'lucide-react';
import { NeighborhoodCombobox } from './NeighborhoodCombobox';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnalyticsTab } from './AnalyticsTab';
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  table: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
};

// --- SCHÉMAS DE VALIDATION ---
const newClientSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  phone2: z.string().optional(),
  address: z.string().min(5, "Adresse trop courte"),
  neighborhood: z.string().min(2, "Quartier requis"),
  addressDetails: z.string().optional(),
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  planId: z.number().optional(),
  preferredPickupDays: z.array(z.string()).default([]),
  preferredTimeWindowStart: z.string().optional(),
  preferredTimeWindowEnd: z.string().optional(),
  isActive: z.boolean().default(true),
  role: z.string().default("client"),
});

const editClientSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  phone2: z.string().optional(),
  address: z.string().min(5, "Adresse trop courte"),
  neighborhood: z.string().min(2, "Quartier requis"),
  addressDetails: z.string().optional(),
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().optional(),
  planId: z.union([z.number(), z.string(), z.null()]).optional(),
  preferredPickupDays: z.array(z.string()).default([]),
  preferredTimeWindowStart: z.string().optional(),
  preferredTimeWindowEnd: z.string().optional(),
  isActive: z.boolean().default(true),
});

// --- INTERFACES ET TYPES ---
interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  phone2?: string;
  address: string;
  neighborhood?: string;
  addressDetails?: string;
  username: string;
  password?: string;
  role: string;
  isActive: boolean;
  status?: 'pending' | 'approved' | 'refused';
  createdAt: string;
  updatedAt: string;
  preferredPickupDays?: string[];
  preferredTimeWindowStart?: string;
  preferredTimeWindowEnd?: string;
  planId?: number;
}

interface OrderData {
  id: number;
  clientId: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  itemCount?: number;
  totalAmount?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  specialInstructions?: string;
}

interface OrderNote {
  id: number;
  orderId: number;
  content: string;
  createdAt: string;
  author?: {
    fullName: string;
  };
  createdBy?: string;
  noteType: string;
  isRead?: boolean;
}

interface SubscriptionData {
  id: number;
  clientId: number;
  planId: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

interface SubscriptionPlanData {
  id: number;
  name: string;
  pricePerMonth: string;
  itemsIncluded: number;
  pickupsPerWeek: number;
  deliveryTimeHours: number;
  features: string[];
  type: string;
  description?: string;
}

interface ClientsTabProps {
  users: UserData[];
  orders: OrderData[];
  subscriptions: SubscriptionData[];
  subscriptionPlans: SubscriptionPlanData[];
  externalNewClientData?: Partial<UserData>;
  externalOpenNewClient?: boolean;
  onConsumeExternalOpen?: () => void;
}

export function ClientsTab({ users, orders, subscriptions, subscriptionPlans, externalNewClientData, externalOpenNewClient, onConsumeExternalOpen }: ClientsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // --- États locaux ---
  const [activeTab, setActiveTab] = useState("actifs");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(5);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // États pour les dialogues
  const [newClientData, setNewClientData] = useState<Partial<UserData>>({
    fullName: "", email: "", phone: "", phone2: "", address: "", neighborhood: "", addressDetails: "",
    username: "", password: "", planId: undefined, preferredPickupDays: [],
    preferredTimeWindowStart: "", preferredTimeWindowEnd: "",
    isActive: true, role: "client"
  });
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  const [editClientData, setEditClientData] = useState<UserData | null>(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<UserData | null>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);

  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedClientForSub, setSelectedClientForSub] = useState<UserData | null>(null);

  const [maxPickupsAllowed, setMaxPickupsAllowed] = useState(1);
  const [selectedPickupDays, setSelectedPickupDays] = useState<string[]>([]);

  // État pour les notes (déplié/replié)
  const [expandedNoteSections, setExpandedNoteSections] = useState<Set<number>>(new Set());
  const [showNotesInCard, setShowNotesInCard] = useState<Set<number>>(new Set());

  // États pour la pagination dans le dialogue Détails
  const [notesPage, setNotesPage] = useState(1);
  const [allNotesPage, setAllNotesPage] = useState(1);
  const notesPerPage = 5;
  const allNotesPerPage = 10;

  // États pour les notes par commande
  const [orderNotes, setOrderNotes] = useState<Map<number, OrderNote[]>>(new Map());
  const [loadingNotes, setLoadingNotes] = useState<Set<number>>(new Set());

  // Formulaires
  const newClientForm = useForm<z.infer<typeof newClientSchema>>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      phone2: "",
      address: "",
      neighborhood: "",
      addressDetails: "",
      username: "",
      password: "",
      planId: undefined,
      preferredPickupDays: [],
      preferredTimeWindowStart: "",
      preferredTimeWindowEnd: "",
      isActive: true,
      role: "client"
    }
  });

  const editClientForm = useForm<z.infer<typeof editClientSchema>>({
    resolver: zodResolver(editClientSchema),
  });

  // --- Fonction pour charger les notes d'une commande (comme dans OrdersTab) ---
  const loadOrderNotes = useCallback(async (orderId: number) => {
    try {
      console.log(`Chargement des notes pour la commande ${orderId}...`);
      setLoadingNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(orderId);
        return newSet;
      });

      const response = await fetch(`/api/orders/${orderId}/notes`);
      if (response.ok) {
        const notes = await response.json();
        console.log(`${notes.length} notes chargées pour la commande ${orderId}:`, notes);
        
        // Normaliser les notes comme dans OrdersTab
        const normalizedNotes = notes.map((note: any) => ({
          id: note.id,
          orderId: orderId,
          content: note.content || '',
          createdAt: note.createdAt || new Date().toISOString(),
          author: note.author || (note.createdBy ? { fullName: note.createdBy } : undefined),
          createdBy: note.createdBy || note.author?.fullName || 'Système',
          noteType: note.noteType || 'general',
          isRead: note.isRead !== undefined ? note.isRead : true
        }));

        setOrderNotes(prev => {
          const newMap = new Map(prev);
          newMap.set(orderId, normalizedNotes);
          return newMap;
        });

        return normalizedNotes;
      } else {
        console.error(`Erreur HTTP ${response.status} lors du chargement des notes`);
        return [];
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error);
      return [];
    } finally {
      setLoadingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  }, []);

  // Fonction pour charger les notes d'un client (toutes ses commandes)
  const loadClientNotes = useCallback(async (clientId: number) => {
    const clientOrders = orders.filter(order => order.clientId === clientId);
    console.log(`Chargement des notes pour ${clientOrders.length} commandes du client ${clientId}...`);
    
    for (const order of clientOrders) {
      if (!orderNotes.has(order.id)) {
        await loadOrderNotes(order.id);
      }
    }
  }, [orders, orderNotes, loadOrderNotes]);

  // Effet pour ouvrir le dialogue Nouveau Client depuis l'extérieur
  useEffect(() => {
    if (externalOpenNewClient) {
      if (externalNewClientData) {
        setNewClientData(prev => ({ ...prev, ...externalNewClientData }));
        newClientForm.reset(externalNewClientData);
      }
      setIsNewClientOpen(true);
      onConsumeExternalOpen && onConsumeExternalOpen();
    }
  }, [externalOpenNewClient]);

  // Effet pour initialiser le formulaire d'édition
  useEffect(() => {
    if (editClientData) {
      console.log('Initialisation du formulaire d\'édition avec:', editClientData);
      editClientForm.reset({
        fullName: editClientData.fullName || "",
        email: editClientData.email || "",
        phone: editClientData.phone || "",
        phone2: editClientData.phone2 || "",
        address: editClientData.address || "",
        neighborhood: editClientData.neighborhood || "",
        addressDetails: editClientData.addressDetails || "",
        username: editClientData.username || "",
        password: "",
        planId: editClientData.planId?.toString() || "none",
        preferredPickupDays: editClientData.preferredPickupDays || [],
        preferredTimeWindowStart: editClientData.preferredTimeWindowStart || "",
        preferredTimeWindowEnd: editClientData.preferredTimeWindowEnd || "",
        isActive: editClientData.isActive || true
      });
      // Initialiser les jours sélectionnés pour l'édition
      setSelectedPickupDays(editClientData.preferredPickupDays || []);
    }
  }, [editClientData, editClientForm]);

  // --- Données calculées et filtrées ---
  const allClients = useMemo(() => {
    return (users || []).filter(u => u.role === 'client');
  }, [users]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const activeClients = allClients.filter(c => c.isActive);
    const monthlyRevenue = activeClients.reduce((total, client) => {
      const sub = subscriptions.find(s => s.clientId === client.id && s.isActive);
      const plan = sub ? subscriptionPlans.find(p => p.id === sub.planId) : null;
      return total + (plan ? parseFloat(plan.pricePerMonth.replace(/[^\d.-]/g, '')) : 0);
    }, 0);

    const countedClients = allClients.filter(c => c.status !== 'refused');
    return {
      total: countedClients.length,
      active: activeClients.length,
      newThisMonth: allClients.filter(c => new Date(c.createdAt) >= startOfMonth).length,
      monthlyRevenue: monthlyRevenue,
      suspended: allClients.filter(c => !c.isActive).length,
    }
  }, [allClients, subscriptions, subscriptionPlans]);

  const lastActivityMap = useMemo(() => {
    const map = new Map<number, Date>();
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const prev = map.get(order.clientId);
      if (!prev || d > prev) map.set(order.clientId, d);
    }
    for (const c of allClients) {
      if (!map.has(c.id)) {
        map.set(c.id, new Date(c.createdAt));
      }
    }
    return map;
  }, [orders, allClients]);

  const filteredClients = useMemo(() => {
    let tabFiltered = allClients;
    if (activeTab === "actifs") {
      tabFiltered = allClients.filter(client => client.isActive);
    } else if (activeTab === "suspendus") {
      tabFiltered = allClients.filter(client => !client.isActive);
    } else if (activeTab === "tous") {
      tabFiltered = allClients.filter(client => client.isActive && client.status !== 'refused');
    }

    if ((activeTab === "tous" || activeTab === "actifs" || activeTab === "suspendus") && subscriptionFilter !== "all") {
      tabFiltered = tabFiltered.filter(client => {
        const activeSub = subscriptions.find(s => s.clientId === client.id && s.isActive);
        if (subscriptionFilter === "none") return !activeSub;
        const planId = parseInt(subscriptionFilter);
        return !!activeSub && activeSub.planId === planId;
      });
    }

    if ((activeTab === "tous" || activeTab === "actifs") && activityFilter !== "all") {
      const THRESHOLD_DAYS = 30;
      const now = new Date();
      const thresholdMs = THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
      tabFiltered = tabFiltered.filter(client => {
        const last = lastActivityMap.get(client.id);
        if (!last) return activityFilter === "old";
        const isRecent = (now.getTime() - last.getTime()) <= thresholdMs;
        return activityFilter === "recent" ? isRecent : !isRecent;
      });
    }

    if (!clientSearchTerm) return tabFiltered;
    const search = clientSearchTerm.toLowerCase();
    return tabFiltered.filter(client =>
      client.fullName?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.phone?.toLowerCase().includes(search) ||
      client.neighborhood?.toLowerCase().includes(search)
    );
  }, [allClients, activeTab, clientSearchTerm, subscriptionFilter, subscriptions, activityFilter, lastActivityMap]);

  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const currentClients = filteredClients.slice((currentPage - 1) * clientsPerPage, currentPage * clientsPerPage);

  // Charger les notes quand un client est sélectionné pour détails
  useEffect(() => {
    if (selectedClient && isClientDetailsOpen) {
      loadClientNotes(selectedClient.id);
    }
  }, [selectedClient, isClientDetailsOpen, loadClientNotes]);

  // Charger les notes pour les clients affichés dans la liste
  useEffect(() => {
    const loadNotesForDisplayedClients = async () => {
      for (const client of currentClients) {
        const clientOrders = orders.filter(order => order.clientId === client.id);
        // Charger les notes seulement pour les 2 premières commandes de chaque client
        for (let i = 0; i < Math.min(2, clientOrders.length); i++) {
          if (!orderNotes.has(clientOrders[i].id)) {
            await loadOrderNotes(clientOrders[i].id);
          }
        }
      }
    };

    if (currentClients.length > 0) {
      loadNotesForDisplayedClients();
    }
  }, [currentClients, orders, orderNotes, loadOrderNotes]);

  const currentSubscriptionInDialog = useMemo(() => {
    return Array.isArray(subscriptions)
      ? subscriptions.find(sub => sub.clientId === selectedClientForSub?.id && sub.isActive)
      : null;
  }, [subscriptions, selectedClientForSub]);

  const currentPlanInDialog = useMemo(() => {
    return currentSubscriptionInDialog && Array.isArray(subscriptionPlans)
      ? subscriptionPlans.find(p => p.id === currentSubscriptionInDialog.planId)
      : null;
  }, [currentSubscriptionInDialog, subscriptionPlans]);

  // Jours de la semaine pour les préférences de ramassage
  const daysOfWeek = [
    { value: "lundi", label: "Lundi" },
    { value: "mardi", label: "Mardi" },
    { value: "mercredi", label: "Mercredi" },
    { value: "jeudi", label: "Jeudi" },
    { value: "vendredi", label: "Vendredi" },
    { value: "samedi", label: "Samedi" },
    { value: "dimanche", label: "Dimanche" }
  ];

  // --- Mutations ---
  const createClientMutation = useMutation({
    mutationFn: (data: Partial<UserData>) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewClientOpen(false);
      newClientForm.reset();
      setNewClientData({
        fullName: "", email: "", phone: "", phone2: "", address: "", neighborhood: "", addressDetails: "",
        username: "", password: "", planId: undefined, preferredPickupDays: [],
        preferredTimeWindowStart: "", preferredTimeWindowEnd: "",
        isActive: true, role: "client"
      });
      setSelectedPickupDays([]);
      toast({ 
        title: "✅ Client créé avec succès", 
        description: "Le nouveau client a été ajouté à la liste.",
        variant: "success" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Échec de la création", 
        description: error.message || "Une erreur est survenue lors de la création du client.",
        variant: "destructive" 
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/password`, { newPassword });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Échec de la modification du mot de passe.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "✅ Mot de passe mis à jour", 
        description: "Le mot de passe du client a été modifié.",
        variant: "success" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Échec de la modification", 
        description: error.message || "Une erreur est survenue.",
        variant: "destructive" 
      });
    },
  });

  const editClientMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<UserData> }) => {
      console.log('Envoi des données de modification:', data);
      const response = await apiRequest("PATCH", `/api/users/${data.id}`, data.data);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        throw new Error(errorData.message || "Échec de la modification du client.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditClientOpen(false);
      setEditClientData(null);
      editClientForm.reset();
      setSelectedPickupDays([]);
      toast({ 
        title: "✅ Client mis à jour", 
        description: "Les informations ont été modifiées.",
        variant: "success" 
      });
    },
    onError: (error: any) => {
      console.error('Erreur de mutation:', error);
      toast({ 
        title: "❌ Échec de la modification", 
        description: error.message || "Une erreur est survenue.",
        variant: "destructive" 
      });
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("PATCH", `/api/users/${userId}/toggle-status`, {}),
    onMutate: async (userId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      const previousUsers = queryClient.getQueryData<UserData[]>(["/api/users"]);
      queryClient.setQueryData<UserData[]>(["/api/users"], (oldData = []) =>
        oldData.map(user =>
          user.id === userId ? { ...user, isActive: !user.isActive } : user
        )
      );
      return { previousUsers };
    },
    onError: (err, userId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["/api/users"], context.previousUsers);
      }
      toast({ 
        title: "❌ Échec de la mise à jour", 
        description: "Une erreur est survenue.",
        variant: "destructive" 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["clientGrowth"] });
      queryClient.invalidateQueries({ queryKey: ["actionsHistory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/clients"] });
    },
  });

  const handleSubscriptionMutation = useMutation({
    mutationFn: async ({ clientId, planId, currentSubscriptionId }: { clientId: number; planId: number; currentSubscriptionId?: number }) => {
      let res: Response;
      if (currentSubscriptionId) {
        res = await apiRequest("PATCH", `/api/subscriptions/${currentSubscriptionId}`, { planId, clientId });
      } else {
        res = await apiRequest("POST", "/api/subscriptions", { 
          clientId, 
          planId, 
          startDate: new Date().toISOString() 
        });
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Échec de l'opération d'abonnement.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsSubscriptionDialogOpen(false);
      setSelectedClientForSub(null);
      toast({ 
        title: "✅ Abonnement mis à jour", 
        description: "L'abonnement du client a été modifié ou créé." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur d'abonnement", 
        description: error.message || "Une erreur est survenue.",
        variant: "destructive" 
      });
    },
  });

  // --- Effets dynamiques ---
  useEffect(() => {
    const plan = newClientData.planId ? subscriptionPlans.find((p: any) => p.id === newClientData.planId) : null;
    setMaxPickupsAllowed(plan ? plan.pickupsPerWeek : 1);
  }, [newClientData.planId, subscriptionPlans]);

  useEffect(() => {
    if (editClientData?.id) {
      const sub = subscriptions.find(s => s.clientId === editClientData.id && s.isActive);
      const plan = sub ? subscriptionPlans.find(p => p.id === sub.planId) : null;
      setMaxPickupsAllowed(plan ? plan.pickupsPerWeek : 1);
    } else {
      setMaxPickupsAllowed(1);
    }
  }, [editClientData, subscriptions, subscriptionPlans]);

  // Fonction pour gérer la sélection des jours de ramassage avec limite (CORRIGÉE)
  const handlePickupDaySelection = (
    dayValue: string, 
    currentDays: string[], 
    maxAllowed: number, 
    onChange: (days: string[]) => void
  ) => {
    // Si le jour est déjà sélectionné, le désélectionner (toujours autorisé)
    if (currentDays.includes(dayValue)) {
      onChange(currentDays.filter(day => day !== dayValue));
    } 
    // Si le jour n'est pas sélectionné, essayer de l'ajouter
    else {
      // Vérifier si la limite n'est PAS atteinte avant l'ajout
      if (currentDays.length < maxAllowed) {
        onChange([...currentDays, dayValue]);
      } else {
        // Limite atteinte (currentDays.length === maxAllowed)
        toast({
          title: "Limite atteinte",
          description: `Vous ne pouvez sélectionner que ${maxAllowed} jour(s) maximum selon le plan d'abonnement.`,
          variant: "destructive"
        });
      }
    }
  };

  // --- Fonctions utilitaires ---
  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'to_deliver':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'to_pickup':
        return <Package className="h-4 w-4 text-amber-600" />;
      case 'ready_to_deliver':
        return <CheckSquare className="h-4 w-4 text-emerald-600" />;
      case 'to_wash':
      case 'to_dry':
      case 'to_iron':
      case 'to_sort':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'to_deliver':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'to_pickup':
        return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'ready_to_deliver':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'to_wash':
      case 'to_dry':
      case 'to_iron':
      case 'to_sort':
        return { bg: 'bg-orange-100', text: 'text-orange-700' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700' };
    }
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'to_pickup': 'À ramasser',
      'pickup_late': 'Ramassage en retard',
      'to_sort': 'À trier',
      'to_wash': 'À laver',
      'to_dry': 'À sécher',
      'to_iron': 'À repasser',
      'ready_to_deliver': 'Prêt à livrer',
      'to_deliver': 'À livrer',
      'delivered': 'Livré'
    };
    return statusMap[status] || status;
  };

  // Fonction pour obtenir le nom d'auteur d'une note
  const getNoteAuthorName = (note: OrderNote): string => {
    return note.author?.fullName || note.createdBy || 'Système';
  };

  // Fonction pour calculer le nombre réel de notes non lues pour un client
  const calculateUnreadNotesCount = (clientId: number): number => {
    let unreadCount = 0;
    
    // Notes des commandes du client
    const clientOrders = orders.filter(order => order.clientId === clientId);
    clientOrders.forEach(order => {
      const notes = orderNotes.get(order.id) || [];
      notes.forEach(note => {
        if (note.isRead === false) {
          unreadCount++;
        }
      });
    });
    
    return unreadCount;
  };

  // Fonction pour obtenir toutes les notes d'un client (regroupées par commande)
  const getAllClientNotes = (clientId: number) => {
    const clientOrders = orders.filter(order => order.clientId === clientId);
    const ordersWithNotes: { order: OrderData, notes: OrderNote[] }[] = [];
    
    clientOrders.forEach(order => {
      const notes = orderNotes.get(order.id) || [];
      if (notes.length > 0) {
        ordersWithNotes.push({
          order: order,
          notes: [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        });
      }
    });
    
    // Trier par date de création de commande décroissante
    return ordersWithNotes.sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());
  };

  // Fonction pour obtenir les notes récentes d'un client (limitées)
  const getRecentClientNotes = (clientId: number, limit: number = 3): OrderNote[] => {
    const clientOrders = orders.filter(order => order.clientId === clientId);
    const allNotes: OrderNote[] = [];
    
    clientOrders.forEach(order => {
      const notes = orderNotes.get(order.id) || [];
      allNotes.push(...notes);
    });
    
    // Trier par date décroissante et limiter
    return allNotes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  // Fonction pour obtenir toutes les commandes d'un client avec leurs notes
  const getClientOrdersWithNotes = (clientId: number): OrderData[] => {
    return orders.filter(order => order.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Fonction pour basculer l'affichage des notes d'une commande
  const toggleNoteSection = (orderId: number) => {
    const newExpanded = new Set(expandedNoteSections);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedNoteSections(newExpanded);
  };

  // Fonction pour basculer l'affichage des notes dans la carte client
  const toggleShowNotesInCard = (clientId: number) => {
    const newShowNotes = new Set(showNotesInCard);
    if (newShowNotes.has(clientId)) {
      newShowNotes.delete(clientId);
    } else {
      newShowNotes.add(clientId);
    }
    setShowNotesInCard(newShowNotes);
  };

  // Formatage de date
  const formatDate = (date: string | undefined, formatStr: string = "dd MMM yyyy à HH:mm"): string => {
    if (!date || isNaN(new Date(date).getTime())) return 'Non défini';
    return format(new Date(date), formatStr, { locale: fr });
  };

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (date: string): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  // Composant NoteItem néomorphique (comme dans OrdersTab)
  const NoteItem = ({ note, showOrderLink = false }: { note: OrderNote, showOrderLink?: boolean }) => {
    return (
      <div className={cn(
        "p-3 rounded-2xl",
        !note.isRead ? "border-l-4 border-l-[#0B676E] bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]" : "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
      )}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
              <MessageSquare className="h-4 w-4 text-[#0B676E]" />
            </div>
            <span className="text-sm font-medium text-slate-800">
              {getNoteAuthorName(note)}
            </span>
            {!note.isRead && (
              <Badge className={cn(NEO.badge, "bg-[#0B676E] text-white text-xs")}>
                Non lue
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {formatRelativeTime(note.createdAt)}
          </span>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
        {showOrderLink && (
          <div className="mt-2 pt-2 border-t border-white/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Logique pour naviguer vers la commande
              }}
              className={cn(NEO.button, "text-[#0B676E] hover:text-[#0B676E] text-xs")}
            >
              <Eye className="h-3 w-3 mr-1" />
              Voir la commande #{note.orderId}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-6">

      {/* ==========================================================
          EN-TÊTE NEOMORPHIQUE
      ========================================================== */}
      <div className={NEO.card}>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Gestion des clients</h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Suivez l'activité, identifiez les tendances et optimisez vos opérations.
              </p>
            </div>
            <Button 
              onClick={() => setIsNewClientOpen(true)} 
              className={cn(NEO.buttonPrimary, "gap-2 shadow-lg")}
            >
              <Plus className="h-4 w-4" />
              Nouveau client
            </Button>
          </div>
        </div>
      </div>

      {/* ==========================================================
          CARTES DE STATISTIQUES NEOMORPHIQUES
      ========================================================== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total clients</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Users className="h-5 w-5 text-[#0B676E]" />
              </div>
            </div>
          </div>
        </div>

        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Clients actifs</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100/30 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Nouveaux ce mois</p>
                <p className="text-2xl font-bold text-slate-900">+{stats.newThisMonth}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100/30 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className={NEO.card}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Revenus mensuels</p>
                <p className="text-2xl font-bold text-slate-900">{stats.monthlyRevenue.toLocaleString('fr-FR')} Ar</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100/30 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          SYSTÈME D'ONGLETS NEOMORPHIQUE
      ========================================================== */}
      <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setCurrentPage(1); }}>
        <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-2 sm:grid-cols-4 p-1 rounded-2xl")}>
          <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <TrendingUp className="h-4 w-4 mr-2 hidden sm:inline" />
            Analytiques
          </TabsTrigger>
          <TabsTrigger value="tous" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <Users className="h-4 w-4 mr-2 hidden sm:inline" />
            Tous les clients ({allClients.filter(c => c.status !== 'refused' && c.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="actifs" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <UserCheck className="h-4 w-4 mr-2 hidden sm:inline" />
            Clients actifs ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="suspendus" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all py-2">
            <XSquare className="h-4 w-4 mr-2 hidden sm:inline" />
            Clients suspendus ({stats.suspended})
          </TabsTrigger>
        </TabsList>

        {["tous", "actifs", "suspendus"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className={NEO.card}>
              {/* Barre de filtres néomorphique */}
              <div className="p-3 sm:p-4 border-b border-white/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <div className="relative flex-1 min-w-[150px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Rechercher un client..."
                        className={cn(NEO.input, "pl-10 h-9")}
                        value={clientSearchTerm}
                        onChange={(e) => { setClientSearchTerm(e.target.value); setCurrentPage(1); }}
                      />
                    </div>
                    
                    {(tab === "tous" || tab === "actifs" || tab === "suspendus") && (
                      <Select
                        value={subscriptionFilter}
                        onValueChange={(value) => { setSubscriptionFilter(value); setCurrentPage(1); }}
                      >
                        <SelectTrigger className={cn(NEO.input, "w-full sm:w-[200px] h-9")}>
                          <SelectValue placeholder="Filtrer par abonnement" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                          <SelectItem value="all">Tous les abonnements</SelectItem>
                          <SelectItem value="none">Sans abonnement</SelectItem>
                          {subscriptionPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {(tab === "tous" || tab === "actifs") && (
                      <Select
                        value={activityFilter}
                        onValueChange={(value) => { setActivityFilter(value); setCurrentPage(1); }}
                      >
                        <SelectTrigger className={cn(NEO.input, "w-full sm:w-[180px] h-9")}>
                          <SelectValue placeholder="Filtrer par activité" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                          <SelectItem value="all">Toutes activités</SelectItem>
                          <SelectItem value="recent">Récents (≤ 30 jours)</SelectItem>
                          <SelectItem value="old">Anciens (&gt; 30 jours)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-4">
                {currentClients.length > 0 ? currentClients.map(client => {
                  const clientSub = subscriptions.find(s => s.clientId === client.id && s.isActive);
                  const clientPlan = clientSub ? subscriptionPlans.find(p => p.id === clientSub.planId) : null;
                  const clientOrders = getClientOrdersWithNotes(client.id);
                  const lastOrder = clientOrders[0];
                  const clientNotes = getAllClientNotes(client.id);
                  const totalNotes = clientNotes.reduce((total, item) => total + item.notes.length, 0);
                  const recentNotes = getRecentClientNotes(client.id, 2);
                  const unreadNotesCount = calculateUnreadNotesCount(client.id);
                  const showNotes = showNotesInCard.has(client.id);
                  
                  return (
                    <div key={client.id} className={cn(NEO.card, "hover:-translate-y-0.5 transition-all duration-300")}>
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* En-tête de la fiche client */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B676E] to-[#085257] text-white flex items-center justify-center font-bold text-lg shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)]">
                              {client.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-xl text-slate-900">
                                  {client.fullName}
                                </h4>
                                {clientPlan ? (
                                  <Badge className="bg-gradient-to-r from-[#0B676E] to-teal-500 text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                    {clientPlan.name}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-400 text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                    Sans abonnement
                                  </Badge>
                                )}
                                {unreadNotesCount > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-red-500 text-white px-2 py-0.5 text-xs font-bold animate-pulse shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                    {unreadNotesCount}
                                  </span>
                                )}
                                {totalNotes > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(NEO.button, "h-6 px-2 text-[#0B676E] hover:text-[#0B676E]")}
                                    onClick={() => toggleShowNotesInCard(client.id)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {totalNotes} note{totalNotes !== 1 ? 's' : ''}
                                    {showNotes ? (
                                      <ChevronUp className="h-3 w-3 ml-1" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    )}
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <p className="text-sm text-slate-600 truncate max-w-xs">{client.email}</p>
                              </div>
                            </div>
                          </div>
                          <Badge className={cn(
                            "px-3 py-1.5 text-sm font-semibold border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                            client.isActive ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white" : "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                          )}>
                            {client.isActive ? '✓ Actif' : '⏸ Suspendu'}
                          </Badge>
                        </div>

                        {/* Aperçu des notes si disponible */}
                        {showNotes && recentNotes.length > 0 && (
                          <div className="mt-2 p-4 bg-[#0B676E]/5 border border-[#0B676E]/20 rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-[#0B676E] flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Notes récentes ({recentNotes.length})
                              </h5>
                              <Badge className="bg-[#0B676E]/10 text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                {totalNotes} note{totalNotes !== 1 ? 's' : ''} totales
                              </Badge>
                            </div>
                            <div className="space-y-3">
                              {recentNotes.map((note, index) => (
                                <NoteItem key={index} note={note} />
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-[#0B676E]/20">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedClient(client); setIsClientDetailsOpen(true); }}
                                className={cn(NEO.button, "text-[#0B676E] hover:text-[#0B676E] w-full")}
                              >
                                <Eye className="h-3 w-3 mr-2" />
                                Voir toutes les notes et commandes
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Informations regroupées néomorphiques */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm border-t border-white/40 pt-4">
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <Phone className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-slate-800 font-medium">{client.phone}</p>
                              {client.phone2 && (
                                <p className="text-slate-500 text-xs mt-1">Second: {client.phone2}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <MapPin className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-slate-800">{client.neighborhood || 'Quartier non spécifié'}</p>
                              {client.addressDetails && (
                                <p className="text-slate-500 text-xs mt-1">{client.addressDetails}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <Star className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-slate-800">{clientPlan ? `${clientPlan.itemsIncluded} articles/mois` : 'Aucun abonnement'}</p>
                              {clientPlan && (
                                <p className="text-[#0B676E] text-xs font-medium mt-1">{clientPlan.pricePerMonth}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-xl bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <CalendarDays className="h-4 w-4 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-slate-800">
                                {(Array.isArray(client.preferredPickupDays) && client.preferredPickupDays.length > 0) 
                                  ? client.preferredPickupDays.join(', ') 
                                  : 'Jour non défini'}
                              </p>
                              {client.preferredTimeWindowStart && client.preferredTimeWindowEnd && (
                                <p className="text-xs text-[#0B676E] font-medium mt-1">
                                  ({client.preferredTimeWindowStart} - {client.preferredTimeWindowEnd})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Pied de la fiche client néomorphique */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-white/40 pt-4 gap-3 sm:gap-2">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500">
                              Dernière activité: {lastOrder ? formatDistanceToNow(new Date(lastOrder.createdAt), { addSuffix: true, locale: fr }) : 'Jamais'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {clientOrders.length} commande{clientOrders.length !== 1 ? 's' : ''} totales
                              {totalNotes > 0 && ` • ${totalNotes} note${totalNotes !== 1 ? 's' : ''}`}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedClient(client); setIsClientDetailsOpen(true); }} 
                              className={cn(NEO.button, "text-[#0B676E] hover:text-[#0B676E]")}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Détails
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setEditClientData(client); setIsEditClientOpen(true); }} 
                              className={cn(NEO.button, "text-purple-600 hover:text-purple-700")}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Modifier
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedClientForSub(client); setIsSubscriptionDialogOpen(true); }} 
                              className={cn(NEO.button, "text-amber-600 hover:text-amber-700")}
                            >
                              <Star className="h-4 w-4 mr-1" /> Abonnement
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                NEO.button,
                                client.isActive ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"
                              )}
                              onClick={() => toggleUserStatusMutation.mutate(client.id)} 
                              disabled={toggleUserStatusMutation.isPending}
                            >
                              {toggleUserStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : client.isActive ? (
                                <XSquare className="h-4 w-4 mr-1" />
                              ) : (
                                <CheckSquare className="h-4 w-4 mr-1" />
                              )}
                              {client.isActive ? "Suspendre" : "Activer"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center py-12 text-slate-500 bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-700 mb-2">Aucun client trouvé</p>
                    <p className="text-slate-500">Ajustez vos critères de recherche ou ajoutez un nouveau client.</p>
                  </div>
                )}
              </div>

              {/* Pied de page avec pagination néomorphique */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-4 border-t border-white/40 px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-sm text-slate-500">
                    Affichage {Math.min((currentPage - 1) * clientsPerPage + 1, filteredClients.length)}-{Math.min(currentPage * clientsPerPage, filteredClients.length)} sur {filteredClients.length} clients
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Label htmlFor="clients-per-page" className="text-sm text-slate-700">Afficher:</Label>
                    <Select value={clientsPerPage.toString()} onValueChange={(value) => { setClientsPerPage(Number(value)); setCurrentPage(1); }}>
                      <SelectTrigger id="clients-per-page" className={cn(NEO.input, "w-[80px] h-9")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => p - 1)} 
                      disabled={currentPage === 1} 
                      className={NEO.button}
                    >
                      <ChevronLeft className="h-4 w-4" /> Précédent
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
                            className={cn(
                              "h-8 w-8 p-0",
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
                      onClick={() => setCurrentPage(p => p + 1)} 
                      disabled={currentPage === totalPages} 
                      className={NEO.button}
                    >
                      Suivant <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>

      {/* ==========================================================
          DIALOGUE AJOUTER UN NOUVEAU CLIENT NEOMORPHIQUE
      ========================================================== */}
      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[700px] lg:max-w-[850px] max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader className="pb-4 border-b border-white/40">
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-[#0B676E]" />
              Ajouter un Nouveau Client
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Remplissez les informations ci-dessous pour créer un nouveau compte client.
            </DialogDescription>
          </DialogHeader>
          <Form {...newClientForm}>
            <form onSubmit={newClientForm.handleSubmit((data) => {
              createClientMutation.mutate(data);
            })} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Informations personnelles</h3>
                  
                  <FormField
                    control={newClientForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="john@exemple.com" type="email" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Téléphone principal *</FormLabel>
                        <FormControl>
                          <Input placeholder="+261 34 12 345 67" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="phone2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Téléphone secondaire</FormLabel>
                        <FormControl>
                          <Input placeholder="+261 34 12 345 68" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Adresse et localisation */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Adresse et localisation</h3>
                  
                  <FormField
                    control={newClientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Adresse complète *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Rue de l'Exemple" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Quartier *</FormLabel>
                        <FormControl>
                          <div>
                            <NeighborhoodCombobox 
                              value={field.value} 
                              onSelect={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="addressDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Détails d'adresse</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Numéro d'appartement, étage, repères, etc." 
                            className={cn(NEO.input, "resize-none")}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Compte et sécurité */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Compte et sécurité</h3>
                  
                  <FormField
                    control={newClientForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Nom d'utilisateur *</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Mot de passe *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Abonnement */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Abonnement</h3>
                  
                  <FormField
                    control={newClientForm.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Plan d'abonnement</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const planId = value && value !== "none" ? parseInt(value) : undefined;
                            field.onChange(planId);
                            
                            // Mettre à jour la limite de jours de ramassage
                            const plan = planId ? subscriptionPlans.find(p => p.id === planId) : null;
                            setMaxPickupsAllowed(plan ? plan.pickupsPerWeek : 1);
                            
                            // Réinitialiser les jours sélectionnés si nécessaire
                            const currentDays = newClientForm.getValues("preferredPickupDays") || [];
                            if (plan && currentDays.length > plan.pickupsPerWeek) {
                              newClientForm.setValue("preferredPickupDays", currentDays.slice(0, plan.pickupsPerWeek));
                              toast({
                                title: "Jours de ramassage ajustés",
                                description: `Le plan ${plan.name} permet seulement ${plan.pickupsPerWeek} jour(s) de ramassage.`,
                                variant: "default"
                              });
                            }
                          }}
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger className={NEO.input}>
                              <SelectValue placeholder="Sélectionner un plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                            <SelectItem value="none">Aucun plan</SelectItem>
                            {subscriptionPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                {plan.name} - {plan.pricePerMonth} ({plan.pickupsPerWeek} jour(s)/semaine)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Préférences de ramassage */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Préférences de ramassage</h3>
                
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      Jours préférés pour le ramassage
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => newClientForm.setValue("preferredPickupDays", [])}
                      className="text-red-500 hover:text-red-700 h-6"
                    >
                      <Eraser className="h-4 w-4 mr-1" /> Effacer les jours
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Le plan d'abonnement limite à {maxPickupsAllowed} jour(s) maximum par semaine
                  </p>
                </div>
                
                <FormField
                  control={newClientForm.control}
                  name="preferredPickupDays"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {daysOfWeek.map((day) => (
                          <FormField
                            key={day.value}
                            control={newClientForm.control}
                            name="preferredPickupDays"
                            render={({ field: formField }) => {
                              const isSelected = formField.value?.includes(day.value);
                              const isDisabled = !isSelected && formField.value?.length >= maxPickupsAllowed;
                              
                              return (
                                <FormItem
                                  key={day.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        handlePickupDaySelection(
                                          day.value, 
                                          formField.value || [], 
                                          maxPickupsAllowed, 
                                          formField.onChange
                                        );
                                      }}
                                      disabled={isDisabled}
                                      className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                    />
                                  </FormControl>
                                  <FormLabel className={`font-normal ${isDisabled ? "text-slate-400 cursor-not-allowed" : "text-slate-700"}`}>
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                      <div className="mt-2 text-xs text-slate-500">
                        {newClientForm.watch("preferredPickupDays")?.length === 0 && (
                          <p>Aucun jour sélectionné</p>
                        )}
                        {newClientForm.watch("preferredPickupDays")?.length > 0 && (
                          <p>
                            Jours sélectionnés:{" "}
                            <span className="font-medium text-slate-700">
                              {newClientForm.watch("preferredPickupDays")?.join(", ")}
                            </span>
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={newClientForm.control}
                    name="preferredTimeWindowStart"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-slate-700">Créneau horaire de début</FormLabel>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => newClientForm.setValue("preferredTimeWindowStart", "")}
                            className="text-red-500 hover:text-red-700 h-6 p-0"
                          >
                            <Eraser className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                        <FormControl>
                          <Input type="time" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newClientForm.control}
                    name="preferredTimeWindowEnd"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-slate-700">Créneau horaire de fin</FormLabel>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => newClientForm.setValue("preferredTimeWindowEnd", "")}
                            className="text-red-500 hover:text-red-700 h-6 p-0"
                          >
                            <Eraser className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                        <FormControl>
                          <Input type="time" className={NEO.input} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-white/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewClientOpen(false)}
                  className={NEO.button}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                  className={NEO.buttonPrimary}
                >
                  {createClientMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer le client
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          DIALOGUE DE MODIFICATION CLIENT NEOMORPHIQUE
      ========================================================== */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[700px] lg:max-w-[850px] max-h-[90vh] overflow-y-auto p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader className="pb-4 border-b border-white/40">
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="h-6 w-6 text-purple-600" />
              Modifier le Client #{editClientData?.id}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Mettez à jour les informations, l'abonnement et les préférences du client.
            </DialogDescription>
          </DialogHeader>
          {editClientData && (
            <Form {...editClientForm}>
              <form
                onSubmit={editClientForm.handleSubmit((formData) => {
                  console.log('Données du formulaire soumises:', formData);
                  
                  // Préparer les données pour l'API
                  const apiData: Partial<UserData> = {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    phone2: formData.phone2 || undefined,
                    address: formData.address,
                    neighborhood: formData.neighborhood,
                    addressDetails: formData.addressDetails || undefined,
                    username: formData.username,
                    isActive: formData.isActive,
                    preferredPickupDays: formData.preferredPickupDays,
                    preferredTimeWindowStart: formData.preferredTimeWindowStart || undefined,
                    preferredTimeWindowEnd: formData.preferredTimeWindowEnd || undefined,
                    planId: formData.planId && formData.planId !== "none" ? 
                      (typeof formData.planId === 'string' ? parseInt(formData.planId) : formData.planId) 
                      : undefined
                  };

                  console.log('Données préparées pour l\'API:', apiData);

                  // Envoyer les modifications du profil
                  editClientMutation.mutate({
                    id: editClientData.id,
                    data: apiData
                  });
                  
                  // Si un nouveau mot de passe a été fourni, le changer
                  if (formData.password && formData.password.trim() !== "") {
                    changePasswordMutation.mutate({
                      userId: editClientData.id,
                      newPassword: formData.password
                    });
                  }
                })}
                className="space-y-6 py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informations personnelles */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Informations personnelles</h3>
                    
                    <FormField
                      control={editClientForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Nom complet *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="john@exemple.com" type="email" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Téléphone principal *</FormLabel>
                          <FormControl>
                            <Input placeholder="+261 34 12 345 67" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="phone2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Téléphone secondaire</FormLabel>
                          <FormControl>
                            <Input placeholder="+261 34 12 345 68" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Adresse et localisation */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Adresse et localisation</h3>
                    
                    <FormField
                      control={editClientForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Adresse complète *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Rue de l'Exemple" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Quartier *</FormLabel>
                          <FormControl>
                            <div>
                              <NeighborhoodCombobox 
                                value={field.value} 
                                onSelect={field.onChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="addressDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Détails d'adresse</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Numéro d'appartement, étage, repères, etc." 
                              className={cn(NEO.input, "resize-none")}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Compte et sécurité */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Compte et sécurité</h3>
                    
                    <FormField
                      control={editClientForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Nom d'utilisateur *</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Nouveau mot de passe (laisser vide pour ne pas changer)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Statut et abonnement */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Statut et abonnement</h3>
                    
                    <FormField
                      control={editClientForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-white/40 p-4 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-slate-700">Client actif</FormLabel>
                            <p className="text-sm text-slate-500">
                              Le client peut passer des commandes et accéder à son compte
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="planId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Plan d'abonnement</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                                  
                              // Mettre à jour la limite de jours de ramassage
                              const planId = value && value !== "none" ? parseInt(value) : undefined;
                              const plan = planId ? subscriptionPlans.find(p => p.id === planId) : null;
                              const currentDays = editClientForm.getValues("preferredPickupDays") || [];
                              setMaxPickupsAllowed(plan ? plan.pickupsPerWeek : 1);
                                  
                              // Ajuster les jours sélectionnés si nécessaire
                              if (plan && currentDays.length > plan.pickupsPerWeek) {
                                const adjustedDays = currentDays.slice(0, plan.pickupsPerWeek);
                                editClientForm.setValue("preferredPickupDays", adjustedDays);
                                toast({
                                  title: "Jours de ramassage ajustés",
                                  description: `Le plan ${plan.name} permet seulement ${plan.pickupsPerWeek} jour(s) de ramassage.`,
                                  variant: "default"
                                });
                              }
                            }}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className={NEO.input}>
                                <SelectValue placeholder="Sélectionner un plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                              <SelectItem value="none">Aucun plan</SelectItem>
                              {subscriptionPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name} - {plan.pricePerMonth} ({plan.pickupsPerWeek} jour(s)/semaine)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Préférences de ramassage */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-slate-900 border-b border-white/40 pb-2">Préférences de ramassage</h3>
                  
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        Jours préférés pour le ramassage
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => editClientForm.setValue("preferredPickupDays", [])}
                        className="text-red-500 hover:text-red-700 h-6"
                      >
                        <Eraser className="h-4 w-4 mr-1" /> Effacer les jours
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Le plan d'abonnement limite à {maxPickupsAllowed} jour(s) maximum par semaine
                    </p>
                  </div>
                  
                  <FormField
                    control={editClientForm.control}
                    name="preferredPickupDays"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {daysOfWeek.map((day) => (
                            <FormField
                              key={day.value}
                              control={editClientForm.control}
                              name="preferredPickupDays"
                              render={({ field: formField }) => {
                                const isSelected = formField.value?.includes(day.value);
                                const isDisabled = !isSelected && formField.value?.length >= maxPickupsAllowed;
                                
                                return (
                                  <FormItem
                                    key={day.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          handlePickupDaySelection(
                                            day.value, 
                                            formField.value || [], 
                                            maxPickupsAllowed, 
                                            formField.onChange
                                          );
                                        }}
                                        disabled={isDisabled}
                                        className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                      />
                                    </FormControl>
                                    <FormLabel className={`font-normal ${isDisabled ? "text-slate-400 cursor-not-allowed" : "text-slate-700"}`}>
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                        <div className="mt-2 text-xs text-slate-500">
                          {editClientForm.watch("preferredPickupDays")?.length === 0 && (
                            <p>Aucun jour sélectionné</p>
                          )}
                          {editClientForm.watch("preferredPickupDays")?.length > 0 && (
                            <p>
                              Jours sélectionnés:{" "}
                              <span className="font-medium text-slate-700">
                                {editClientForm.watch("preferredPickupDays")?.join(", ")}
                              </span>
                            </p>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editClientForm.control}
                      name="preferredTimeWindowStart"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-slate-700">Créneau horaire de début</FormLabel>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => editClientForm.setValue("preferredTimeWindowStart", "")}
                              className="text-red-500 hover:text-red-700 h-6 p-0"
                            >
                              <Eraser className="h-4 w-4 mr-1" />
                            </Button>
                          </div>
                          <FormControl>
                            <Input type="time" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editClientForm.control}
                      name="preferredTimeWindowEnd"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-slate-700">Créneau horaire de fin</FormLabel>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => editClientForm.setValue("preferredTimeWindowEnd", "")}
                              className="text-red-500 hover:text-red-700 h-6 p-0"
                            >
                              <Eraser className="h-4 w-4 mr-1" />
                            </Button>
                          </div>
                          <FormControl>
                            <Input type="time" className={NEO.input} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-white/40">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditClientOpen(false)}
                    className={NEO.button}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={editClientMutation.isPending || changePasswordMutation.isPending}
                    className={NEO.buttonPrimary}
                  >
                    {(editClientMutation.isPending || changePasswordMutation.isPending) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          DIALOGUE DE DÉTAILS DU CLIENT NEOMORPHIQUE
      ========================================================== */}
      <Dialog open={isClientDetailsOpen} onOpenChange={setIsClientDetailsOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/40 bg-gradient-to-r from-[#0B676E]/5 to-[#0B676E]/10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-6 w-6 text-[#0B676E]" />
                  {selectedClient?.fullName}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  Détails complets du client, historique d'activité et notes des commandes
                </DialogDescription>
              </div>
              <Badge 
                className={cn(
                  "text-sm px-3 py-1 border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                  selectedClient?.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                )}
              >
                {selectedClient?.isActive ? "✓ Actif" : "⏸ Suspendu"}
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs pour naviguer entre info client et notes néomorphique */}
            <Tabs defaultValue="info" className="w-full px-6 pt-4">
              <TabsList className={cn(NEO.cardPressed, "grid w-full grid-cols-3 p-1 rounded-2xl")}>
                <TabsTrigger value="info" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all">
                  <Info className="h-4 w-4 mr-2 hidden sm:inline" />
                  Informations Client
                </TabsTrigger>
                <TabsTrigger value="commands" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all">
                  <Package className="h-4 w-4 mr-2 hidden sm:inline" />
                  Commandes ({selectedClient ? getClientOrdersWithNotes(selectedClient.id).length : 0})
                </TabsTrigger>
                <TabsTrigger value="all-notes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 data-[state=active]:text-slate-900 transition-all">
                  <MessageSquare className="h-4 w-4 mr-2 hidden sm:inline" />
                  Toutes les Notes ({selectedClient ? getAllClientNotes(selectedClient.id).reduce((total, item) => total + item.notes.length, 0) : 0})
                </TabsTrigger>
              </TabsList>
              
              {/* Contenu principal avec scrolling */}
              <div className="flex-1 overflow-y-auto p-1 pb-6">
                {/* Onglet Informations Client */}
                <TabsContent value="info" className="mt-4 space-y-6">
                  {selectedClient && (() => {
                    const clientSub = subscriptions.find(s => s.clientId === selectedClient.id && s.isActive);
                    const clientPlan = clientSub ? subscriptionPlans.find(p => p.id === clientSub.planId) : null;
                    const clientOrders = getClientOrdersWithNotes(selectedClient.id);
                    const clientNotes = getAllClientNotes(selectedClient.id);
                    const totalNotesCount = clientNotes.reduce((total, item) => total + item.notes.length, 0);
                    const unreadNotesCount = calculateUnreadNotesCount(selectedClient.id);

                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Informations Personnelles néomorphiques */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center text-slate-900 border-b border-white/40 pb-2">
                              <User className="h-5 w-5 mr-2 text-[#0B676E]" />
                              Informations Personnelles
                            </h3>
                            <div className="space-y-3 pl-2">
                              <div className="flex items-start gap-3 p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <Mail className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-500">Email</p>
                                  <p className="text-slate-900 font-medium">{selectedClient.email}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <Phone className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-500">Téléphone</p>
                                  <p className="text-slate-900 font-medium">{selectedClient.phone}</p>
                                  {selectedClient.phone2 && (
                                    <p className="text-slate-600 text-xs mt-1">Second: {selectedClient.phone2}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <MapPin className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-500">Adresse</p>
                                  <p className="text-slate-900">{selectedClient.neighborhood || 'Quartier non spécifié'}</p>
                                  {selectedClient.addressDetails && (
                                    <p className="text-slate-600 text-xs mt-1">{selectedClient.addressDetails}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <Calendar className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-500">Date d'inscription</p>
                                  <p className="text-slate-900">
                                    {format(new Date(selectedClient.createdAt), 'dd MMMM yyyy', { locale: fr })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Informations sur l'Abonnement néomorphiques */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center text-slate-900 border-b border-white/40 pb-2">
                              <Star className="h-5 w-5 mr-2 text-amber-500" />
                              Abonnement
                            </h3>
                            <div className="space-y-3 pl-2">
                              {clientPlan ? (
                                <>
                                  <div className="flex items-start justify-between gap-3 p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <div>
                                      <p className="text-sm text-slate-500">Plan</p>
                                      <p className="text-slate-900 font-medium">{clientPlan.name}</p>
                                    </div>
                                    <Badge className="bg-gradient-to-r from-[#0B676E] to-teal-500 text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                      {clientPlan.pricePerMonth}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    <div>
                                      <p className="text-sm text-slate-500">Articles/mois</p>
                                      <p className="text-slate-900 font-medium">{clientPlan.itemsIncluded}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-500">Ramassages/semaine</p>
                                      <p className="text-slate-900 font-medium">{clientPlan.pickupsPerWeek}</p>
                                    </div>
                                  </div>
                                  {clientSub && (
                                    <div className="p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                      <p className="text-sm text-slate-500">Début d'abonnement</p>
                                      <p className="text-slate-900">
                                        {format(new Date(clientSub.startDate), 'dd MMMM yyyy', { locale: fr })}
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-4 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                  <Star className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                  <p className="text-slate-500">Aucun abonnement actif.</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Préférences de Ramassage néomorphiques */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center text-slate-900 border-b border-white/40 pb-2">
                              <Clock className="h-5 w-5 mr-2 text-purple-600" />
                              Préférences
                            </h3>
                            <div className="space-y-3 pl-2">
                              <div className="p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                <p className="text-sm text-slate-500">Jours préférés</p>
                                <p className="text-slate-900">
                                  {(selectedClient.preferredPickupDays && selectedClient.preferredPickupDays.length > 0) 
                                    ? selectedClient.preferredPickupDays.join(', ') 
                                    : 'Non définis'}
                                </p>
                              </div>
                              {selectedClient.preferredTimeWindowStart && selectedClient.preferredTimeWindowEnd && (
                                <div className="p-2 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                  <p className="text-sm text-slate-500">Créneau horaire</p>
                                  <p className="text-slate-900">
                                    {selectedClient.preferredTimeWindowStart} - {selectedClient.preferredTimeWindowEnd}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Statistiques Rapides néomorphiques */}
                        <div className="pt-4 border-t border-white/40">
                          <h3 className="font-semibold text-lg flex items-center mb-3 text-slate-900">
                            <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                            Statistiques
                          </h3>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="p-4 bg-gradient-to-br from-[#0B676E]/10 to-[#0B676E]/5 rounded-2xl border border-[#0B676E]/20 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-2xl font-bold text-[#0B676E]">{clientOrders.length}</p>
                              <p className="text-xs text-[#0B676E] font-medium">Commandes totales</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-emerald-100/30 to-emerald-50 rounded-2xl border border-emerald-200 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-2xl font-bold text-emerald-700">
                                {clientOrders.filter(o => o.status === 'delivered').length}
                              </p>
                              <p className="text-xs text-emerald-600 font-medium">Commandes livrées</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-100/30 to-purple-50 rounded-2xl border border-purple-200 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-2xl font-bold text-purple-700">{totalNotesCount}</p>
                              <p className="text-xs text-purple-600 font-medium">Notes totales</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-amber-100/30 to-amber-50 rounded-2xl border border-amber-200 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <p className="text-lg font-bold text-amber-700 truncate">
                                {formatDistanceToNow(new Date(selectedClient.createdAt), { addSuffix: true, locale: fr })}
                              </p>
                              <p className="text-xs text-amber-600 font-medium">Client depuis</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>
                
                {/* Onglet Commandes avec Notes néomorphique */}
                <TabsContent value="commands" className="mt-4">
                  {selectedClient && (() => {
                    const clientOrders = getClientOrdersWithNotes(selectedClient.id);
                    const clientNotes = getAllClientNotes(selectedClient.id);
                    const totalNotesCount = clientNotes.reduce((total, item) => total + item.notes.length, 0);
                    const unreadNotesCount = calculateUnreadNotesCount(selectedClient.id);
                    const totalNotesPages = Math.ceil(clientOrders.length / notesPerPage);
                    const paginatedOrders = clientOrders.slice(
                      (notesPage - 1) * notesPerPage,
                      notesPage * notesPerPage
                    );

                    return (
                      <div className="space-y-6">
                        {/* En-tête avec stats néomorphique */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h3 className="font-semibold text-lg flex items-center text-slate-900">
                            <Package className="h-5 w-5 mr-2 text-amber-600" />
                            Historique des Commandes
                            <Badge className={cn(NEO.badge, "ml-2 bg-[#eef2f5] text-slate-600")}>
                              {clientOrders.length} commande{clientOrders.length !== 1 ? 's' : ''}
                            </Badge>
                            {totalNotesCount > 0 && (
                              <Badge className={cn(NEO.badge, "ml-2 bg-[#0B676E]/10 text-[#0B676E]")}>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {totalNotesCount} note{totalNotesCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {unreadNotesCount > 0 && (
                              <Badge className="ml-2 bg-red-500 text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                {unreadNotesCount} non lue{unreadNotesCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </h3>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotesPage(1)}
                              disabled={notesPage === 1}
                              className={NEO.button}
                            >
                              Première
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotesPage(p => Math.max(p - 1, 1))}
                              disabled={notesPage === 1}
                              className={NEO.button}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-slate-600">
                              Page {notesPage} sur {totalNotesPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotesPage(p => Math.min(p + 1, totalNotesPages))}
                              disabled={notesPage === totalNotesPages}
                              className={NEO.button}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotesPage(totalNotesPages)}
                              disabled={notesPage === totalNotesPages}
                              className={NEO.button}
                            >
                              Dernière
                            </Button>
                          </div>
                        </div>
                        
                        {clientOrders.length === 0 ? (
                          <div className="text-center py-8 bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                            <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500">Aucune commande pour ce client.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {paginatedOrders.map((order) => {
                              const notes = orderNotes.get(order.id) || [];
                              const hasNotes = notes.length > 0;
                              const unreadOrderNotes = notes.filter(n => n.isRead === false).length;
                              const isExpanded = expandedNoteSections.has(order.id);
                              
                              return (
                                <div key={order.id} className={NEO.card + " overflow-hidden"}>
                                  {/* En-tête de la commande néomorphique */}
                                  <div 
                                    className="flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 cursor-pointer transition-colors"
                                    onClick={() => toggleNoteSection(order.id)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${getOrderStatusColor(order.status).bg} shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]`}>
                                        {getOrderStatusIcon(order.status)}
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-slate-900">
                                          Commande #{order.id} • {getOrderStatusText(order.status)}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                          <p className="text-sm text-slate-500">
                                            {formatDate(order.createdAt, "dd MMM yyyy")}
                                            {order.itemCount && ` • ${order.itemCount} article${order.itemCount > 1 ? 's' : ''}`}
                                          </p>
                                          {hasNotes && (
                                            <Badge className={cn(NEO.badge, "text-xs bg-[#eef2f5] text-slate-600")}>
                                              <MessageSquare className="h-3 w-3 mr-1" />
                                              {notes.length} note{notes.length > 1 ? 's' : ''}
                                              {unreadOrderNotes > 0 && (
                                                <span className="ml-1 text-red-600">({unreadOrderNotes} non lue{unreadOrderNotes > 1 ? 's' : ''})</span>
                                              )}
                                            </Badge>
                                          )}
                                          {loadingNotes.has(order.id) && (
                                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className={NEO.button}>
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  
                                  {/* Détails de la commande et notes néomorphiques */}
                                  {isExpanded && (
                                    <div className="p-4 bg-white/10 backdrop-blur-sm border-t border-white/40">
                                      {/* Détails de la commande */}
                                      <div className="mb-4 p-3 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <p className="text-slate-500">Statut:</p>
                                            <p className="font-medium text-slate-800">{getOrderStatusText(order.status)}</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-500">Créée le:</p>
                                            <p className="font-medium text-slate-800">{formatDate(order.createdAt)}</p>
                                          </div>
                                          {order.scheduledPickupDate && (
                                            <div>
                                              <p className="text-slate-500">Ramassage prévu:</p>
                                              <p className="font-medium text-slate-800">{formatDate(order.scheduledPickupDate)}</p>
                                            </div>
                                          )}
                                          {order.scheduledDeliveryDate && (
                                            <div>
                                              <p className="text-slate-500">Livraison prévue:</p>
                                              <p className="font-medium text-slate-800">{formatDate(order.scheduledDeliveryDate)}</p>
                                            </div>
                                          )}
                                          {order.itemCount && (
                                            <div>
                                              <p className="text-slate-500">Nombre d'articles:</p>
                                              <p className="font-medium text-slate-800">{order.itemCount}</p>
                                            </div>
                                          )}
                                          {order.specialInstructions && (
                                            <div className="md:col-span-2">
                                              <p className="text-slate-500">Instructions spéciales:</p>
                                              <p className="font-medium text-amber-600 italic">"{order.specialInstructions}"</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Notes de la commande néomorphiques */}
                                      {loadingNotes.has(order.id) ? (
                                        <div className="flex justify-center items-center py-8">
                                          <Loader2 className="h-6 w-6 animate-spin text-[#0B676E] mr-2" />
                                          <p className="text-slate-500">Chargement des notes...</p>
                                        </div>
                                      ) : hasNotes ? (
                                        <div className="space-y-3">
                                          <h5 className="font-medium text-slate-700 flex items-center">
                                            <MessageSquare className="h-4 w-4 mr-2 text-[#0B676E]" />
                                            Notes de la commande ({notes.length})
                                          </h5>
                                          <div className="space-y-3">
                                            {notes.map((note) => (
                                              <NoteItem key={note.id} note={note} />
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 bg-[#eef2f5] rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                          <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                          <p className="text-slate-500">Aucune note pour cette commande.</p>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className={NEO.button + " mt-2"}
                                            onClick={() => loadOrderNotes(order.id)}
                                          >
                                            <RefreshCw className="h-3 w-3 mr-2" />
                                            Charger les notes
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Pagination néomorphique */}
                        {totalNotesPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-white/40">
                            <div className="text-sm text-slate-500">
                              Affichage de {(notesPage - 1) * notesPerPage + 1} à {Math.min(notesPage * notesPerPage, clientOrders.length)} sur {clientOrders.length} commandes
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setNotesPage(prev => Math.max(prev - 1, 1))}
                                disabled={notesPage === 1}
                                className={NEO.button + " h-9"}
                              >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Précédent
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalNotesPages) }, (_, i) => {
                                  let pageNum;
                                  if (totalNotesPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (notesPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (notesPage >= totalNotesPages - 2) {
                                    pageNum = totalNotesPages - 4 + i;
                                  } else {
                                    pageNum = notesPage - 2 + i;
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={notesPage === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setNotesPage(pageNum)}
                                      className={cn(
                                        "h-9 w-9",
                                        notesPage === pageNum ? NEO.buttonPrimary : NEO.button
                                      )}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                                {totalNotesPages > 5 && (
                                  <span className="mx-2 text-slate-500">...</span>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setNotesPage(prev => Math.min(prev + 1, totalNotesPages))}
                                disabled={notesPage === totalNotesPages}
                                className={NEO.button + " h-9"}
                              >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </TabsContent>
                
                {/* Onglet Toutes les Notes néomorphique */}
                <TabsContent value="all-notes" className="mt-4">
                  {selectedClient && (() => {
                    const clientNotes = getAllClientNotes(selectedClient.id);
                    const allNotes = clientNotes.flatMap(item => item.notes.map(note => ({
                      ...note,
                      orderId: item.order.id,
                      orderStatus: item.order.status,
                      orderCreatedAt: item.order.createdAt
                    })));
                    
                    const totalAllNotesPages = Math.ceil(allNotes.length / allNotesPerPage);
                    const paginatedNotes = [...allNotes]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice((allNotesPage - 1) * allNotesPerPage, allNotesPage * allNotesPerPage);
                    
                    const unreadNotesCount = allNotes.filter(n => !n.isRead).length;

                    return (
                      <div className="space-y-4">
                        {/* En-tête avec stats néomorphique */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h3 className="font-semibold text-lg flex items-center text-slate-900">
                            <MessageSquare className="h-5 w-5 mr-2 text-[#0B676E]" />
                            Toutes les Notes
                            <Badge className={cn(NEO.badge, "ml-2 bg-[#0B676E]/10 text-[#0B676E]")}>
                              {allNotes.length} note{allNotes.length !== 1 ? 's' : ''}
                            </Badge>
                            {unreadNotesCount > 0 && (
                              <Badge className="ml-2 bg-red-500 text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                                {unreadNotesCount} non lue{unreadNotesCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </h3>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">
                              Page {allNotesPage} sur {totalAllNotesPages}
                            </span>
                          </div>
                        </div>
                        
                        {allNotes.length === 0 ? (
                          <div className="text-center py-8 bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                            <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500">Aucune note pour ce client.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={NEO.button + " mt-2"}
                              onClick={() => loadClientNotes(selectedClient.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-2" />
                              Charger toutes les notes
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              {paginatedNotes.map((note, index) => (
                                <NoteItem key={index} note={note} showOrderLink={true} />
                              ))}
                            </div>
                            
                            {/* Pagination néomorphique */}
                            {totalAllNotesPages > 1 && (
                              <div className="flex items-center justify-between pt-4 border-t border-white/40">
                                <div className="text-sm text-slate-500">
                                  Affichage de {(allNotesPage - 1) * allNotesPerPage + 1} à {Math.min(allNotesPage * allNotesPerPage, allNotes.length)} sur {allNotes.length} notes
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAllNotesPage(prev => Math.max(prev - 1, 1))}
                                    disabled={allNotesPage === 1}
                                    className={NEO.button + " h-9"}
                                  >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Précédent
                                  </Button>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalAllNotesPages) }, (_, i) => {
                                      let pageNum;
                                      if (totalAllNotesPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (allNotesPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (allNotesPage >= totalAllNotesPages - 2) {
                                        pageNum = totalAllNotesPages - 4 + i;
                                      } else {
                                        pageNum = allNotesPage - 2 + i;
                                      }
                                      
                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={allNotesPage === pageNum ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => setAllNotesPage(pageNum)}
                                          className={cn(
                                            "h-9 w-9",
                                            allNotesPage === pageNum ? NEO.buttonPrimary : NEO.button
                                          )}
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    })}
                                    {totalAllNotesPages > 5 && (
                                      <span className="mx-2 text-slate-500">...</span>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAllNotesPage(prev => Math.min(prev + 1, totalAllNotesPages))}
                                    disabled={allNotesPage === totalAllNotesPages}
                                    className={NEO.button + " h-9"}
                                  >
                                    Suivant
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="px-6 py-4 border-t border-white/40 bg-white/10 backdrop-blur-sm">
              <div className="flex w-full justify-between items-center">
                <div className="text-sm text-slate-500">
                  ID Client: #{selectedClient?.id}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setIsClientDetailsOpen(false);
                      setEditClientData(selectedClient);
                      setIsEditClientOpen(true);
                    }}
                    className={NEO.button}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="outline" onClick={() => setIsClientDetailsOpen(false)} className={NEO.button}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          DIALOGUE GESTION DES ABONNEMENTS NEOMORPHIQUE
      ========================================================== */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-hidden flex flex-col p-6 bg-[#eef2f5] rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Gérer l'abonnement de {selectedClientForSub?.fullName}</DialogTitle>
            <DialogDescription className="text-slate-500">Assignez un nouveau plan ou visualisez l'abonnement actuel.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 py-4 space-y-4 overflow-hidden">
            {(() => {
              const currentSub = subscriptions.find(s => s.clientId === selectedClientForSub?.id && s.isActive);
              const currentPlan = currentSub ? subscriptionPlans.find(p => p.id === currentSub.planId) : null;
              return currentPlan ? (
                <div className="p-4 bg-gradient-to-r from-[#0B676E]/10 to-emerald-50/40 rounded-2xl border border-[#0B676E]/20 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{currentPlan.name}</p>
                      <p className="text-sm text-slate-600">{currentPlan.pricePerMonth} • {currentPlan.itemsIncluded} articles/mois • {currentPlan.pickupsPerWeek} ramassages/semaine</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]">
                      Actif
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info className="h-4 w-4" />
                    Aucun abonnement actif.
                  </div>
                </div>
              );
            })()}
            <div className={NEO.card + " overflow-hidden"}>
              <div className="sticky top-0 z-10 bg-white/20 backdrop-blur-sm flex items-center justify-between px-3 py-2 border-b border-white/40">
                <Label className="m-0 font-semibold text-slate-700">Changer pour un nouveau plan</Label>
              </div>
              <div className="max-h-[46vh] overflow-y-auto pr-3 py-2 space-y-2">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className={cn(NEO.cardPressed, "p-3 transition-colors")}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-800">{plan.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-semibold text-[#0B676E]">{plan.pricePerMonth}</span>
                          <span className="text-xs text-slate-500">• {plan.itemsIncluded} articles/mois</span>
                          <span className="text-xs text-slate-500">• {plan.pickupsPerWeek} ramassages/semaine</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (!selectedClientForSub) return;
                          const currentSub = subscriptions.find(s => s.clientId === selectedClientForSub?.id && s.isActive);
                          handleSubscriptionMutation.mutate({ 
                            clientId: selectedClientForSub.id, 
                            planId: plan.id, 
                            currentSubscriptionId: currentSub?.id 
                          });
                        }} 
                        disabled={handleSubscriptionMutation.isPending}
                        className={NEO.button}
                      >
                        {handleSubscriptionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          'Sélectionner'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)} className={NEO.button}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}