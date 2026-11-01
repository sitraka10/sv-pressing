// client/src/pages/ClientsTab.tsx
// Actions = icon only (no text), square buttons with color.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Eye, Star, Loader2, XSquare, CheckSquare } from 'lucide-react';
import { NeighborhoodCombobox } from './NeighborhoodCombobox';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnalyticsTab } from './AnalyticsTab';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const BRAND = "#0B676E";
const ui = {
  card: "bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  input: "h-9 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B676E] focus-visible:ring-2 focus-visible:ring-[#0B676E]/15",
  btn: "h-9 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-9 rounded-lg bg-[#0B676E] font-medium text-white hover:bg-[#09565C]",
  dialog: "rounded-xl border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]",
  well: "rounded-lg border border-slate-200 bg-slate-50/70",
  sectionTitle: "text-[10.5px] font-semibold uppercase tracking-wider text-slate-400",
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

/* MiniKPI */
const MiniKPI: React.FC<{
  title: string; value: string | number; subtitle?: string;
  tone?: Tone; progress?: number; progressLabel?: string;
}> = ({ title, value, subtitle, tone = "brand", progress, progressLabel }) => {
  const isZero = value === 0 || value === "0" || value === "0%" || value === "0 Ar";
  return (
    <div className={cn(ui.card, "relative overflow-hidden p-5")}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", isZero ? "text-slate-400" : "text-slate-900")}>{value}</p>
      {subtitle && <p className="mt-1.5 text-[11.5px] text-slate-500">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-slate-500">
            <span>{progressLabel}</span>
            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", accentBar[tone].replace("before:", ""))} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ActionButton — icon only, safe click */
const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: "brand" | "violet" | "amber" | "red" | "emerald" | "slate";
  disabled?: boolean;
}> = ({ icon, label, onClick, color = "slate", disabled }) => {
  const colorMap = {
    brand: "border-[#0B676E]/20 text-[#0B676E] hover:bg-[#0B676E]/10 hover:border-[#0B676E]/40",
    violet: "border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300",
    amber: "border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300",
    red: "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300",
    emerald: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300",
    slate: "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onClick(); }}
          className={cn("h-8 w-8 inline-flex items-center justify-center rounded-lg border bg-white transition-all", colorMap[color], disabled && "opacity-50 cursor-not-allowed")}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px] pointer-events-none">{label}</TooltipContent>
    </Tooltip>
  );
};

const newClientSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  phone2: z.string().optional(),
  address: z.string().min(5, "Adresse trop courte"),
  neighborhood: z.string().min(2, "Quartier requis"),
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
  username: z.string().min(3, "Nom d'utilisateur trop court"),
  password: z.string().optional(),
  planId: z.union([z.number(), z.string(), z.null()]).optional(),
  preferredPickupDays: z.array(z.string()).default([]),
  preferredTimeWindowStart: z.string().optional(),
  preferredTimeWindowEnd: z.string().optional(),
  isActive: z.boolean().default(true),
});

interface UserData {
  id: number; fullName: string; email: string; phone: string; phone2?: string;
  address: string; neighborhood?: string;
  username: string; password?: string; role: string; isActive: boolean;
  status?: 'pending' | 'approved' | 'refused';
  createdAt: string; updatedAt: string;
  preferredPickupDays?: string[]; preferredTimeWindowStart?: string;
  preferredTimeWindowEnd?: string; planId?: number;
}
interface OrderData {
  id: number; clientId: number; status: string; createdAt: string; updatedAt?: string;
  itemCount?: number; totalAmount?: string;
  scheduledPickupDate?: string; scheduledDeliveryDate?: string;
  actualPickupDate?: string; actualDeliveryDate?: string; specialInstructions?: string;
}
interface OrderNote {
  id: number; orderId: number; content: string; createdAt: string;
  author?: { fullName: string }; createdBy?: string; noteType: string; isRead?: boolean;
}
interface SubscriptionData {
  id: number; clientId: number; planId: number; isActive: boolean;
  startDate: string; endDate?: string;
}
interface SubscriptionPlanData {
  id: number; name: string; pricePerMonth: string; itemsIncluded: number;
  pickupsPerWeek: number; deliveryTimeHours: number; features: string[];
  type: string; description?: string;
}
interface ClientsTabProps {
  users: UserData[]; orders: OrderData[]; subscriptions: SubscriptionData[];
  subscriptionPlans: SubscriptionPlanData[];
  externalNewClientData?: Partial<UserData>;
  externalOpenNewClient?: boolean;
  onConsumeExternalOpen?: () => void;
}

export function ClientsTab({ users, orders, subscriptions, subscriptionPlans, externalNewClientData, externalOpenNewClient, onConsumeExternalOpen }: ClientsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("actifs");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(5);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [editClientData, setEditClientData] = useState<UserData | null>(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserData | null>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedClientForSub, setSelectedClientForSub] = useState<UserData | null>(null);

  const [maxPickupsAllowed, setMaxPickupsAllowed] = useState(1);
  const [selectedPickupDays, setSelectedPickupDays] = useState<string[]>([]);
  const [expandedNoteSections, setExpandedNoteSections] = useState<Set<number>>(new Set());
  const [showNotesInCard, setShowNotesInCard] = useState<Set<number>>(new Set());
  const [orderNotes, setOrderNotes] = useState<Map<number, OrderNote[]>>(new Map());
  const [loadingNotes, setLoadingNotes] = useState<Set<number>>(new Set());
  const notesPerPage = 5;

  const newClientForm = useForm<z.infer<typeof newClientSchema>>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", phone2: "", address: "", neighborhood: "",
      username: "", password: "", planId: undefined,
      preferredPickupDays: [], preferredTimeWindowStart: "", preferredTimeWindowEnd: "",
      isActive: true, role: "client",
    },
  });
  const editClientForm = useForm<z.infer<typeof editClientSchema>>({ resolver: zodResolver(editClientSchema) });

  const loadOrderNotes = useCallback(async (orderId: number) => {
    try {
      setLoadingNotes(prev => { const s = new Set(prev); s.add(orderId); return s; });
      const response = await fetch(`/api/orders/${orderId}/notes`);
      if (response.ok) {
        const notes = await response.json();
        const normalizedNotes = notes.map((note: any) => ({
          id: note.id, orderId, content: note.content || '',
          createdAt: note.createdAt || new Date().toISOString(),
          author: note.author || (note.createdBy ? { fullName: note.createdBy } : undefined),
          createdBy: note.createdBy || note.author?.fullName || 'Système',
          noteType: note.noteType || 'general',
          isRead: note.isRead !== undefined ? note.isRead : true,
        }));
        setOrderNotes(prev => { const m = new Map(prev); m.set(orderId, normalizedNotes); return m; });
        return normalizedNotes;
      }
      return [];
    } catch { return []; }
    finally { setLoadingNotes(prev => { const s = new Set(prev); s.delete(orderId); return s; }); }
  }, []);

  const loadClientNotes = useCallback(async (clientId: number) => {
    const clientOrders = orders.filter(o => o.clientId === clientId);
    for (const order of clientOrders) {
      if (!orderNotes.has(order.id)) await loadOrderNotes(order.id);
    }
  }, [orders, orderNotes, loadOrderNotes]);

  useEffect(() => {
    if (externalOpenNewClient) {
      if (externalNewClientData) newClientForm.reset(externalNewClientData as any);
      setIsNewClientOpen(true);
      onConsumeExternalOpen?.();
    }
  }, [externalOpenNewClient]);

  useEffect(() => {
    if (editClientData) {
      editClientForm.reset({
        fullName: editClientData.fullName || "", email: editClientData.email || "",
        phone: editClientData.phone || "", phone2: editClientData.phone2 || "",
        address: editClientData.address || "", neighborhood: editClientData.neighborhood || "",
        username: editClientData.username || "",
        password: "", planId: editClientData.planId?.toString() || "none",
        preferredPickupDays: editClientData.preferredPickupDays || [],
        preferredTimeWindowStart: editClientData.preferredTimeWindowStart || "",
        preferredTimeWindowEnd: editClientData.preferredTimeWindowEnd || "",
        isActive: editClientData.isActive ?? true,
      });
      setSelectedPickupDays(editClientData.preferredPickupDays || []);
    }
  }, [editClientData, editClientForm]);

  useEffect(() => {
    if (selectedClient && isClientDetailsOpen) loadClientNotes(selectedClient.id);
  }, [selectedClient, isClientDetailsOpen, loadClientNotes]);

  const allClients = useMemo(() => (users || []).filter(u => u.role === 'client'), [users]);

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
      total: countedClients.length, active: activeClients.length,
      newThisMonth: allClients.filter(c => new Date(c.createdAt) >= startOfMonth).length,
      monthlyRevenue, suspended: allClients.filter(c => !c.isActive).length,
    };
  }, [allClients, subscriptions, subscriptionPlans]);

  const lastActivityMap = useMemo(() => {
    const map = new Map<number, Date>();
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const prev = map.get(order.clientId);
      if (!prev || d > prev) map.set(order.clientId, d);
    }
    for (const c of allClients) if (!map.has(c.id)) map.set(c.id, new Date(c.createdAt));
    return map;
  }, [orders, allClients]);

  const filteredClients = useMemo(() => {
    let tabFiltered = allClients;
    if (activeTab === "actifs") tabFiltered = allClients.filter(c => c.isActive);
    else if (activeTab === "suspendus") tabFiltered = allClients.filter(c => !c.isActive);
    else if (activeTab === "tous") tabFiltered = allClients.filter(c => c.isActive && c.status !== 'refused');

    if (subscriptionFilter !== "all") {
      tabFiltered = tabFiltered.filter(client => {
        const activeSub = subscriptions.find(s => s.clientId === client.id && s.isActive);
        if (subscriptionFilter === "none") return !activeSub;
        return !!activeSub && activeSub.planId === parseInt(subscriptionFilter);
      });
    }
    if ((activeTab === "tous" || activeTab === "actifs") && activityFilter !== "all") {
      const THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      tabFiltered = tabFiltered.filter(client => {
        const last = lastActivityMap.get(client.id);
        if (!last) return activityFilter === "old";
        const isRecent = (now - last.getTime()) <= THRESHOLD_MS;
        return activityFilter === "recent" ? isRecent : !isRecent;
      });
    }
    if (!clientSearchTerm) return tabFiltered;
    const s = clientSearchTerm.toLowerCase();
    return tabFiltered.filter(c =>
      c.fullName?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) || c.neighborhood?.toLowerCase().includes(s)
    );
  }, [allClients, activeTab, clientSearchTerm, subscriptionFilter, subscriptions, activityFilter, lastActivityMap]);

  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const currentClients = filteredClients.slice((currentPage - 1) * clientsPerPage, currentPage * clientsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, clientSearchTerm, subscriptionFilter, activityFilter]);

  const currentSubscriptionInDialog = subscriptions.find(s => s.clientId === selectedClientForSub?.id && s.isActive);
  const currentPlanInDialog = currentSubscriptionInDialog ? subscriptionPlans.find(p => p.id === currentSubscriptionInDialog.planId) : null;

  const daysOfWeek = [
    { value: "lundi", label: "Lun" }, { value: "mardi", label: "Mar" },
    { value: "mercredi", label: "Mer" }, { value: "jeudi", label: "Jeu" },
    { value: "vendredi", label: "Ven" }, { value: "samedi", label: "Sam" },
    { value: "dimanche", label: "Dim" },
  ];

  const createClientMutation = useMutation({
    mutationFn: (data: Partial<UserData>) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewClientOpen(false); newClientForm.reset(); setSelectedPickupDays([]);
      toast({ title: "Client créé" });
    },
    onError: (e: any) => toast({ title: "Échec", description: e.message, variant: "destructive" }),
  });

  const editClientMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<UserData> }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}`, data.data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditClientOpen(false); setEditClientData(null); editClientForm.reset(); setSelectedPickupDays([]);
      toast({ title: "Client mis à jour" });
    },
    onError: (e: any) => toast({ title: "Échec", description: e.message, variant: "destructive" }),
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("PATCH", `/api/users/${userId}/toggle-status`, {}),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      const previousUsers = queryClient.getQueryData<UserData[]>(["/api/users"]);
      queryClient.setQueryData<UserData[]>(["/api/users"], (oldData = []) =>
        oldData.map(user => user.id === userId ? { ...user, isActive: !user.isActive } : user));
      return { previousUsers };
    },
    onError: (err, userId, context: any) => {
      if (context?.previousUsers) queryClient.setQueryData(["/api/users"], context.previousUsers);
      toast({ title: "Échec", variant: "destructive" });
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
    mutationFn: async ({ clientId, planId, currentSubscriptionId }: any) => {
      let res: Response;
      if (currentSubscriptionId) res = await apiRequest("PATCH", `/api/subscriptions/${currentSubscriptionId}`, { planId, clientId });
      else res = await apiRequest("POST", "/api/subscriptions", { clientId, planId, startDate: new Date().toISOString() });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsSubscriptionDialogOpen(false); setSelectedClientForSub(null);
      toast({ title: "Abonnement mis à jour" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    const plan = newClientForm.watch("planId") ? subscriptionPlans.find(p => p.id === newClientForm.watch("planId")) : null;
    setMaxPickupsAllowed(plan ? plan.pickupsPerWeek : 1);
  }, [newClientForm.watch("planId"), subscriptionPlans]);

  useEffect(() => {
    if (editClientData?.id) {
      const sub = subscriptions.find(s => s.clientId === editClientData.id && s.isActive);
      const plan = sub ? subscriptionPlans.find(p => p.id === sub.planId) : null;
      setMaxPickupsAllowed(plan ? plan.pickupsPerWeek : 1);
    } else setMaxPickupsAllowed(1);
  }, [editClientData, subscriptions, subscriptionPlans]);

  const handlePickupDaySelection = (dayValue: string, currentDays: string[], max: number, onChange: (d: string[]) => void) => {
    if (currentDays.includes(dayValue)) onChange(currentDays.filter(d => d !== dayValue));
    else if (currentDays.length < max) onChange([...currentDays, dayValue]);
    else toast({ title: "Limite atteinte", description: `${max} jour(s) maximum.`, variant: "destructive" });
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': case 'ready_to_deliver': return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
      case 'to_deliver': return { bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'to_pickup': return { bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'to_wash': case 'to_dry': case 'to_iron': case 'to_sort': return { bg: 'bg-orange-50', text: 'text-orange-700' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700' };
    }
  };
  const getOrderStatusText = (status: string) => {
    const map: Record<string, string> = {
      to_pickup: 'À ramasser', pickup_late: 'Ramassage en retard', to_sort: 'À trier',
      to_wash: 'À laver', to_dry: 'À sécher', to_iron: 'À repasser',
      ready_to_deliver: 'Prêt à livrer', to_deliver: 'À livrer', delivered: 'Livré',
    };
    return map[status] || status;
  };
  const getNoteAuthorName = (note: OrderNote) => note.author?.fullName || note.createdBy || 'Système';

  const calculateUnreadNotesCount = (clientId: number) => {
    let n = 0;
    orders.filter(o => o.clientId === clientId).forEach(o => {
      (orderNotes.get(o.id) || []).forEach(note => { if (note.isRead === false) n++; });
    });
    return n;
  };
  const getAllClientNotes = (clientId: number) => {
    const clientOrders = orders.filter(o => o.clientId === clientId);
    const withNotes: { order: OrderData; notes: OrderNote[] }[] = [];
    clientOrders.forEach(o => {
      const notes = orderNotes.get(o.id) || [];
      if (notes.length > 0) withNotes.push({ order: o, notes: [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
    });
    return withNotes.sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());
  };
  const getRecentClientNotes = (clientId: number, limit = 3) => {
    const all: OrderNote[] = [];
    orders.filter(o => o.clientId === clientId).forEach(o => all.push(...(orderNotes.get(o.id) || [])));
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  };
  const getClientOrdersWithNotes = (clientId: number) =>
    orders.filter(o => o.clientId === clientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const toggleShowNotesInCard = (clientId: number) => {
    const s = new Set(showNotesInCard);
    s.has(clientId) ? s.delete(clientId) : s.add(clientId);
    setShowNotesInCard(s);
  };

  const formatDate = (date: string | undefined, f = "dd MMM yyyy à HH:mm") => {
    if (!date || isNaN(new Date(date).getTime())) return 'Non défini';
    return format(new Date(date), f, { locale: fr });
  };
  const formatRelativeTime = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR').format(Math.round(v)) + " Ar";

  const NoteItem = ({ note, showOrderLink = false }: { note: OrderNote; showOrderLink?: boolean }) => (
    <div className={cn("p-3 rounded-lg border", !note.isRead ? "border-l-4 border-l-[#0B676E] bg-[#0B676E]/5 border-[#0B676E]/20" : "bg-slate-50/70 border-slate-200")}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-slate-800">{getNoteAuthorName(note)}</span>
          {!note.isRead && <Pill tone="brand">Non lue</Pill>}
        </div>
        <span className="text-[11px] text-slate-500">{formatRelativeTime(note.createdAt)}</span>
      </div>
      <p className="text-[12.5px] text-slate-700 whitespace-pre-wrap">{note.content}</p>
      {showOrderLink && (
        <div className="mt-2 pt-2 border-t border-slate-200">
          <Button variant="ghost" size="sm" className="text-[#0B676E] hover:text-[#0B676E] text-[11.5px] h-7">
            Voir la commande #{note.orderId}
          </Button>
        </div>
      )}
    </div>
  );

  /* ============================================================
     SOUS-COMPOSANT : Section (pour structurer les formulaires)
     ============================================================ */
  const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={cn("space-y-3", className)}>
      <span className={ui.sectionTitle}>{title}</span>
      {children}
    </div>
  );

  /* ============================================================
     SOUS-COMPOSANT : Champ de formulaire avec erreur inline
     ============================================================ */
  const Field: React.FC<{
    label: string; required?: boolean; error?: string; children: React.ReactNode;
  }> = ({ label, required, error, children }) => (
    <div className="space-y-1.5">
      <Label className="text-[11.5px] text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-[10.5px] text-red-500">{error}</p>}
    </div>
  );

  /* ============================================================
     SOUS-COMPOSANT : Sélecteur de jours de ramassage
     ============================================================ */
  const PickupDaysSelector: React.FC<{
    selected: string[]; max: number; onChange: (next: string[]) => void;
  }> = ({ selected, max, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
      {daysOfWeek.map(d => {
        const isSel = selected.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => handlePickupDaySelection(d.value, selected, max, onChange)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-[11.5px] font-medium transition-colors",
              isSel
                ? "border-[#0B676E] bg-[#0B676E]/10 text-[#0B676E]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* HEADER */}
        <div className={cn(ui.card, "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5")}>
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900">Gestion des clients</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Suivez l'activité et optimisez vos opérations</p>
          </div>
          <Button onClick={() => setIsNewClientOpen(true)} className={cn(ui.btnPrimary)}>Nouveau client</Button>
        </div>

        {/* KPI */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MiniKPI title="Total clients" value={stats.total} subtitle={`${stats.active} actifs`} tone="brand"
                   progress={stats.total > 0 ? (stats.active / stats.total) * 100 : 0} progressLabel="Taux d'activité" />
          <MiniKPI title="Clients actifs" value={stats.active} subtitle={`${stats.suspended} suspendus`} tone="green" />
          <MiniKPI title="Nouveaux ce mois" value={`+${stats.newThisMonth}`} subtitle="Inscriptions récentes" tone="blue" />
          <MiniKPI title="Revenus mensuels" value={formatCurrency(stats.monthlyRevenue)} subtitle="Abonnements actifs" tone="amber" />
        </div>

        {/* TABS + LISTE */}
        <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setCurrentPage(1); }}>
          <TabsList className="inline-flex flex-wrap w-full rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <TabsTrigger value="analytics" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">Analytiques</TabsTrigger>
            <TabsTrigger value="tous" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">Tous ({allClients.filter(c => c.status !== 'refused' && c.isActive).length})</TabsTrigger>
            <TabsTrigger value="actifs" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">Actifs ({stats.active})</TabsTrigger>
            <TabsTrigger value="suspendus" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-slate-600 data-[state=active]:bg-[#0B676E] data-[state=active]:text-white">Suspendus ({stats.suspended})</TabsTrigger>
          </TabsList>

          {["tous", "actifs", "suspendus"].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className={ui.card}>
                <div className="p-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Input placeholder="Rechercher un client…" className={cn(ui.input, "text-[12.5px]")} value={clientSearchTerm} onChange={(e) => { setClientSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <Select value={subscriptionFilter} onValueChange={(v) => { setSubscriptionFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className={cn(ui.input, "w-full sm:w-[200px]")}><SelectValue placeholder="Abonnement" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les abonnements</SelectItem>
                        <SelectItem value="none">Sans abonnement</SelectItem>
                        {subscriptionPlans.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(tab === "tous" || tab === "actifs") && (
                      <Select value={activityFilter} onValueChange={(v) => { setActivityFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className={cn(ui.input, "w-full sm:w-[180px]")}><SelectValue placeholder="Activité" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes activités</SelectItem>
                          <SelectItem value="recent">Récents (≤ 30j)</SelectItem>
                          <SelectItem value="old">Anciens (&gt; 30j)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {currentClients.length > 0 ? currentClients.map(client => {
                    const clientSub = subscriptions.find(s => s.clientId === client.id && s.isActive);
                    const clientPlan = clientSub ? subscriptionPlans.find(p => p.id === clientSub.planId) : null;
                    const clientOrders = getClientOrdersWithNotes(client.id);
                    const lastOrder = clientOrders[0];
                    const clientNotes = getAllClientNotes(client.id);
                    const totalNotes = clientNotes.reduce((t, i) => t + i.notes.length, 0);
                    const recentNotes = getRecentClientNotes(client.id, 2);
                    const unreadNotesCount = calculateUnreadNotesCount(client.id);
                    const showNotes = showNotesInCard.has(client.id);

                    return (
                      <div key={client.id} className={cn(ui.card, "relative overflow-hidden", client.isActive ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[#0B676E]" : "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-slate-300")}>
                        <div className="p-4 pl-5 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B676E] to-[#085257] text-white flex items-center justify-center font-semibold text-sm">
                                {client.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h4 className="font-semibold text-[13.5px] text-slate-900">{client.fullName}</h4>
                                  {clientPlan ? <Pill tone="brand">{clientPlan.name}</Pill> : <Pill tone="slate">Sans abonnement</Pill>}
                                  {unreadNotesCount > 0 && <Pill tone="red">{unreadNotesCount}</Pill>}
                                  {totalNotes > 0 && (
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[#0B676E] text-[11px]" onClick={() => toggleShowNotesInCard(client.id)}>
                                      {totalNotes} {showNotes ? '▼' : '▲'}
                                    </Button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                                  <span>{client.email}</span>
                                </div>
                              </div>
                            </div>
                            <Pill tone={client.isActive ? "green" : "slate"}>{client.isActive ? 'Actif' : 'Suspendu'}</Pill>
                          </div>

                          {showNotes && recentNotes.length > 0 && (
                            <div className="rounded-lg border border-[#0B676E]/15 bg-[#0B676E]/5 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[12px] font-semibold text-[#0B676E]">Notes récentes ({recentNotes.length})</h5>
                                <Pill tone="brand">{totalNotes} total</Pill>
                              </div>
                              <div className="space-y-2">
                                {recentNotes.map((note, idx) => <NoteItem key={idx} note={note} />)}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[12px] pt-3 border-t border-slate-100">
                            <div className="flex items-start gap-2">
                              <div><p className="font-medium text-slate-800">{client.phone}</p>{client.phone2 && <p className="text-[11px] text-slate-500">2nd: {client.phone2}</p>}</div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div><p className="text-slate-800 truncate">{client.neighborhood || 'Non spécifié'}</p></div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div><p className="text-slate-800">{clientPlan ? `${clientPlan.itemsIncluded} art/mois` : 'Aucun abonnement'}</p>{clientPlan && <p className="text-[11px] text-[#0B676E] font-medium">{clientPlan.pricePerMonth}</p>}</div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div><p className="text-slate-800 truncate">{(client.preferredPickupDays?.length ?? 0) > 0 ? client.preferredPickupDays!.join(', ') : 'Jour non défini'}</p>{client.preferredTimeWindowStart && client.preferredTimeWindowEnd && (<p className="text-[11px] text-[#0B676E]">{client.preferredTimeWindowStart} - {client.preferredTimeWindowEnd}</p>)}</div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-slate-100">
                            <div className="space-y-0.5">
                              <p className="text-[11px] text-slate-500">Dernière activité: {lastOrder ? formatDistanceToNow(new Date(lastOrder.createdAt), { addSuffix: true, locale: fr }) : 'Jamais'}</p>
                              <p className="text-[11px] text-slate-500">{clientOrders.length} commande{clientOrders.length !== 1 ? 's' : ''}{totalNotes > 0 && ` • ${totalNotes} note${totalNotes !== 1 ? 's' : ''}`}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <ActionButton icon={<Eye className="h-4 w-4" />} label="Détails" color="brand" onClick={() => { setSelectedClient(client); setIsClientDetailsOpen(true); }} />
                              <ActionButton icon={<Edit className="h-4 w-4" />} label="Modifier" color="violet" onClick={() => { setEditClientData(client); setIsEditClientOpen(true); }} />
                              <ActionButton icon={<Star className="h-4 w-4" />} label="Abonnement" color="amber" onClick={() => { setSelectedClientForSub(client); setIsSubscriptionDialogOpen(true); }} />
                              <ActionButton
                                icon={toggleUserStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : client.isActive ? <XSquare className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                                label={client.isActive ? "Suspendre" : "Activer"}
                                color={client.isActive ? "red" : "emerald"}
                                onClick={() => toggleUserStatusMutation.mutate(client.id)}
                                disabled={toggleUserStatusMutation.isPending}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12"><p className="text-[13px] text-slate-500">Aucun client trouvé</p></div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-4 pb-4 border-t border-slate-100">
                    <div className="text-[11.5px] text-slate-500">{Math.min((currentPage - 1) * clientsPerPage + 1, filteredClients.length)}–{Math.min(currentPage * clientsPerPage, filteredClients.length)} sur {filteredClients.length}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Select value={clientsPerPage.toString()} onValueChange={(v) => { setClientsPerPage(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger className={cn(ui.input, "w-[80px] h-8 text-[12px]")}><SelectValue /></SelectTrigger>
                        <SelectContent>{[5, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className={ui.btn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Préc.</Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let n: number;
                        if (totalPages <= 5) n = i + 1;
                        else if (currentPage <= 3) n = i + 1;
                        else if (currentPage >= totalPages - 2) n = totalPages - 4 + i;
                        else n = currentPage - 2 + i;
                        return <Button key={n} size="sm" className={cn("w-8", currentPage === n ? ui.btnPrimary : ui.btn)} onClick={() => setCurrentPage(n)}>{n}</Button>;
                      })}
                      <Button variant="outline" size="sm" className={ui.btn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suiv.</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
        </Tabs>

        {/* ============================================================
            DIALOG: NOUVEAU CLIENT
            ============================================================ */}
        <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[680px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
            <div className="shrink-0 border-b border-slate-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-11 w-11 rounded-lg bg-[#0B676E] flex items-center justify-center text-white font-semibold text-[16px]">
                  +
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-[15px] font-semibold text-slate-900">Nouveau client</DialogTitle>
                  <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">
                    Créez un nouveau compte client et configurez son abonnement.
                  </DialogDescription>
                </div>
                <Pill tone="brand">Nouveau</Pill>
              </div>
            </div>

            <form
              onSubmit={newClientForm.handleSubmit((data) => {
                createClientMutation.mutate({ ...data, preferredPickupDays: selectedPickupDays });
              })}
              className="flex-1 overflow-y-auto flex flex-col"
            >
              <div className="space-y-5 px-5 py-5">
                <FormSection title="Identité">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nom complet" required error={newClientForm.formState.errors.fullName?.message}>
                      <Input {...newClientForm.register("fullName")} className={ui.input} placeholder="Nom et prénom" />
                    </Field>
                    <Field label="Nom d'utilisateur" required error={newClientForm.formState.errors.username?.message}>
                      <Input {...newClientForm.register("username")} className={ui.input} placeholder="jean.rakoto" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Contact" className="pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Email" required error={newClientForm.formState.errors.email?.message}>
                      <Input type="email" {...newClientForm.register("email")} className={ui.input} placeholder="email@exemple.com" />
                    </Field>
                    <Field label="Téléphone" required error={newClientForm.formState.errors.phone?.message}>
                      <Input {...newClientForm.register("phone")} className={ui.input} placeholder="+261 32 00 000 00" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Téléphone 2">
                      <Input {...newClientForm.register("phone2")} className={ui.input} placeholder="Optionnel" />
                    </Field>
                    <Field label="Quartier" required error={newClientForm.formState.errors.neighborhood?.message}>
                      <NeighborhoodCombobox
                        value={newClientForm.watch("neighborhood") || ""}
                        onSelect={(n) => newClientForm.setValue("neighborhood", n, { shouldValidate: true })}
                      />
                    </Field>
                  </div>
                  <Field label="Adresse" required error={newClientForm.formState.errors.address?.message}>
                    <Input {...newClientForm.register("address")} className={ui.input} placeholder="Adresse complète" />
                  </Field>
                </FormSection>

                <FormSection title="Abonnement" className="pt-3 border-t border-slate-100">
                  <Field label="Plan">
                    <Select
                      value={newClientForm.watch("planId")?.toString() || "none"}
                      onValueChange={(v) => newClientForm.setValue("planId", v === "none" ? undefined : Number(v))}
                    >
                      <SelectTrigger className={ui.input}><SelectValue placeholder="Sélectionner un plan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sans abonnement</SelectItem>
                        {subscriptionPlans.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} — {p.pricePerMonth}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={`Jours de ramassage (max ${maxPickupsAllowed})`}>
                    <PickupDaysSelector
                      selected={selectedPickupDays}
                      max={maxPickupsAllowed}
                      onChange={(next) => {
                        setSelectedPickupDays(next);
                        newClientForm.setValue("preferredPickupDays", next);
                      }}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Heure début">
                      <Input type="time" {...newClientForm.register("preferredTimeWindowStart")} className={ui.input} />
                    </Field>
                    <Field label="Heure fin">
                      <Input type="time" {...newClientForm.register("preferredTimeWindowEnd")} className={ui.input} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Sécurité" className="pt-3 border-t border-slate-100">
                  <Field label="Mot de passe" required error={newClientForm.formState.errors.password?.message}>
                    <Input type="password" {...newClientForm.register("password")} className={ui.input} placeholder="••••••••" />
                  </Field>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      checked={newClientForm.watch("isActive")}
                      onCheckedChange={(v) => newClientForm.setValue("isActive", !!v)}
                    />
                    <Label className="text-[11.5px] text-slate-700">Activer le compte immédiatement</Label>
                  </div>
                </FormSection>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsNewClientOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createClientMutation.isPending} className={cn(ui.btnPrimary, "gap-1.5 min-w-[120px]")}>
                  {createClientMutation.isPending ? "Création…" : "Créer le client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ============================================================
            DIALOG: DÉTAILS CLIENT
            ============================================================ */}
        <Dialog open={isClientDetailsOpen} onOpenChange={setIsClientDetailsOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[760px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
            {selectedClient && (
              <>
                <div className="shrink-0 border-b border-slate-200 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B676E] to-[#085257] text-white flex items-center justify-center font-semibold text-base">
                        {selectedClient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-[15px] font-semibold text-slate-900 truncate">{selectedClient.fullName}</DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-1 text-[11.5px] text-slate-500 mt-0.5">
                          <span>#{selectedClient.id}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{selectedClient.email}</span>
                        </DialogDescription>
                      </div>
                    </div>
                    <Pill tone={selectedClient.isActive ? "green" : "slate"}>
                      {selectedClient.isActive ? 'Actif' : 'Suspendu'}
                    </Pill>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                  {/* Contact */}
                  <div className={cn(ui.well, "p-4")}>
                    <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div>
                        <p className="text-[10.5px] text-slate-500">Email</p>
                        <p className="font-medium text-slate-900 break-all">{selectedClient.email}</p>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-slate-500">Téléphone</p>
                        <p className="font-medium text-slate-900">{selectedClient.phone}</p>
                      </div>
                      {selectedClient.phone2 && (
                        <div>
                          <p className="text-[10.5px] text-slate-500">Téléphone 2</p>
                          <p className="font-medium text-slate-900">{selectedClient.phone2}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10.5px] text-slate-500">Nom d'utilisateur</p>
                        <p className="font-medium text-slate-900">{selectedClient.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className={cn(ui.well, "p-4")}>
                    <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Adresse</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div>
                        <p className="text-[10.5px] text-slate-500">Quartier</p>
                        <p className="font-medium text-slate-900">{selectedClient.neighborhood || 'Non spécifié'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10.5px] text-slate-500">Adresse complète</p>
                        <p className="font-medium text-slate-900 break-words">{selectedClient.address || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Abonnement */}
                  <div className={cn(ui.well, "p-4")}>
                    <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Abonnement</h4>
                    {(() => {
                      const sub = subscriptions.find(s => s.clientId === selectedClient.id && s.isActive);
                      const plan = sub ? subscriptionPlans.find(p => p.id === sub.planId) : null;
                      return plan ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
                          <div>
                            <p className="text-[10.5px] text-slate-500">Plan</p>
                            <p className="font-medium text-slate-900">{plan.name}</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] text-slate-500">Prix</p>
                            <p className="font-medium text-[#0B676E]">{plan.pricePerMonth}</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] text-slate-500">Articles / mois</p>
                            <p className="font-medium text-slate-900">{plan.itemsIncluded}</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] text-slate-500">Ramassages / semaine</p>
                            <p className="font-medium text-slate-900">{plan.pickupsPerWeek}</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] text-slate-500">Délai livraison</p>
                            <p className="font-medium text-slate-900">{plan.deliveryTimeHours}h</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] text-slate-500">Début</p>
                            <p className="font-medium text-slate-900">{formatDate(sub!.startDate, "dd MMM yyyy")}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[12px] text-slate-500">Aucun abonnement actif</p>
                      );
                    })()}
                  </div>

                  {/* Préférences */}
                  <div className={cn(ui.well, "p-4")}>
                    <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Préférences de ramassage</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div>
                        <p className="text-[10.5px] text-slate-500">Jours</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedClient.preferredPickupDays?.length ?? 0) > 0
                            ? selectedClient.preferredPickupDays!.map(d => <Pill key={d} tone="brand">{d}</Pill>)
                            : <span className="text-[11.5px] text-slate-500">Non défini</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-slate-500">Créneau horaire</p>
                        <p className="font-medium text-slate-900">
                          {selectedClient.preferredTimeWindowStart && selectedClient.preferredTimeWindowEnd
                            ? `${selectedClient.preferredTimeWindowStart} – ${selectedClient.preferredTimeWindowEnd}`
                            : 'Non défini'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compte */}
                  <div className={cn(ui.well, "p-4")}>
                    <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Compte</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div>
                        <p className="text-[10.5px] text-slate-500 mb-1">Statut</p>
                        <Pill tone={selectedClient.isActive ? "green" : "slate"}>{selectedClient.isActive ? 'Actif' : 'Suspendu'}</Pill>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-slate-500">Inscrit le</p>
                        <p className="font-medium text-slate-900">{formatDate(selectedClient.createdAt, "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-slate-500">Dernière mise à jour</p>
                        <p className="font-medium text-slate-900">{formatDate(selectedClient.updatedAt, "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className={cn(ui.well, "p-4")}>
                    <h4 className="text-[12px] font-semibold text-slate-900 mb-3">Notes récentes</h4>
                    {getRecentClientNotes(selectedClient.id, 5).length > 0 ? (
                      <div className="space-y-2">
                        {getRecentClientNotes(selectedClient.id, 5).map((note, idx) => <NoteItem key={idx} note={note} />)}
                      </div>
                    ) : (
                      <p className="text-[12px] text-slate-500">Aucune note</p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-wrap gap-2 justify-end">
                  <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsClientDetailsOpen(false)}>Fermer</Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(ui.btn, "border-violet-200 text-violet-600 hover:bg-violet-50")}
                    onClick={() => { setEditClientData(selectedClient); setIsEditClientOpen(true); setIsClientDetailsOpen(false); }}
                  >
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    className={cn(ui.btnPrimary)}
                    onClick={() => { setSelectedClientForSub(selectedClient); setIsSubscriptionDialogOpen(true); }}
                  >
                    Gérer l'abonnement
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ============================================================
            DIALOG: MODIFICATION CLIENT
            ============================================================ */}
        <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[680px] max-h-[90vh] overflow-hidden p-0 flex flex-col")}>
            <div className="shrink-0 border-b border-slate-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-11 w-11 rounded-lg bg-gradient-to-br from-[#0B676E] to-[#085257] text-white flex items-center justify-center font-semibold text-[14px]">
                  {getInitials(editClientData?.fullName || "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-[15px] font-semibold text-slate-900">Modifier le client</DialogTitle>
                  <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">
                    Mettez à jour les informations du profil et de l'abonnement.
                  </DialogDescription>
                </div>
                {editClientData && <Pill tone={editClientData.isActive ? "green" : "slate"}>{editClientData.isActive ? "Actif" : "Suspendu"}</Pill>}
              </div>
            </div>

            <form
              onSubmit={editClientForm.handleSubmit((data) => {
                if (!editClientData) return;

                const { password, planId, ...profileData } = data;
                const payload: Partial<UserData> = {
                  ...profileData,
                  planId: planId && planId !== "none" ? Number(planId) : undefined,
                  preferredPickupDays: selectedPickupDays,
                };

                // Ne jamais envoyer un mot de passe vide : cela évite
                // qu'une chaîne vide soit interprétée comme un nouveau mot de passe.
                if (password?.trim()) payload.password = password;

                editClientMutation.mutate({ id: editClientData.id, data: payload });
              })}
              className="flex-1 overflow-y-auto flex flex-col"
            >
              <div className="space-y-5 px-5 py-5">
                <FormSection title="Identité">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nom complet" required error={editClientForm.formState.errors.fullName?.message}>
                      <Input {...editClientForm.register("fullName")} className={ui.input} />
                    </Field>
                    <Field label="Nom d'utilisateur" required error={editClientForm.formState.errors.username?.message}>
                      <Input {...editClientForm.register("username")} className={ui.input} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Contact" className="pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Email" required error={editClientForm.formState.errors.email?.message}>
                      <Input type="email" {...editClientForm.register("email")} className={ui.input} />
                    </Field>
                    <Field label="Téléphone" required error={editClientForm.formState.errors.phone?.message}>
                      <Input {...editClientForm.register("phone")} className={ui.input} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Téléphone 2">
                      <Input {...editClientForm.register("phone2")} className={ui.input} />
                    </Field>
                    <Field label="Quartier" required error={editClientForm.formState.errors.neighborhood?.message}>
                      <NeighborhoodCombobox
                        value={editClientForm.watch("neighborhood") || ""}
                        onSelect={(n) => editClientForm.setValue("neighborhood", n, { shouldValidate: true })}
                      />
                    </Field>
                  </div>
                  <Field label="Adresse" required error={editClientForm.formState.errors.address?.message}>
                    <Input {...editClientForm.register("address")} className={ui.input} />
                  </Field>
                </FormSection>

                <FormSection title="Abonnement" className="pt-3 border-t border-slate-100">
                  <Field label="Plan">
                    <Select
                      value={editClientForm.watch("planId")?.toString() || "none"}
                      onValueChange={(v) => editClientForm.setValue("planId", v === "none" ? null : Number(v))}
                    >
                      <SelectTrigger className={ui.input}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sans abonnement</SelectItem>
                        {subscriptionPlans.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} — {p.pricePerMonth}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={`Jours de ramassage (max ${maxPickupsAllowed})`}>
                    <PickupDaysSelector
                      selected={selectedPickupDays}
                      max={maxPickupsAllowed}
                      onChange={(next) => {
                        setSelectedPickupDays(next);
                        editClientForm.setValue("preferredPickupDays", next);
                      }}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Heure début">
                      <Input type="time" {...editClientForm.register("preferredTimeWindowStart")} className={ui.input} />
                    </Field>
                    <Field label="Heure fin">
                      <Input type="time" {...editClientForm.register("preferredTimeWindowEnd")} className={ui.input} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Sécurité" className="pt-3 border-t border-slate-100">
                  <Field label="Nouveau mot de passe" error={editClientForm.formState.errors.password?.message}>
                    <Input type="password" {...editClientForm.register("password")} className={ui.input} placeholder="Laisser vide pour ne pas changer" />
                  </Field>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      checked={editClientForm.watch("isActive")}
                      onCheckedChange={(v) => editClientForm.setValue("isActive", !!v)}
                    />
                    <Label className="text-[11.5px] text-slate-700">Compte actif</Label>
                  </div>
                </FormSection>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsEditClientOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={editClientMutation.isPending} className={cn(ui.btnPrimary, "gap-1.5 min-w-[120px]")}>
                  {editClientMutation.isPending ? "Sauvegarde…" : "Enregistrer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ============================================================
            DIALOG: ABONNEMENT
            ============================================================ */}
        <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-[95vw] sm:max-w-[480px] p-0 overflow-hidden")}>
            <div className="border-b border-slate-200 px-5 py-4">
              <DialogTitle className="text-[15px] font-semibold text-slate-900">Abonnement</DialogTitle>
              <DialogDescription className="text-[11.5px] text-slate-500 mt-0.5">
                {selectedClientForSub?.fullName}
              </DialogDescription>
            </div>
            <div className="px-5 py-4 space-y-3">
              {currentPlanInDialog && (
                <div className={cn(ui.well, "p-3 text-[12px]")}>
                  <p className="text-[10.5px] text-slate-500">Abonnement actuel</p>
                  <p className="font-medium text-slate-900">{currentPlanInDialog.name} • {currentPlanInDialog.pricePerMonth}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-[11.5px] text-slate-700">Plan</Label>
                <Select
                  value={currentPlanInDialog?.id.toString() || "none"}
                  onValueChange={(v) => {
                    if (!selectedClientForSub) return;
                    handleSubscriptionMutation.mutate({
                      clientId: selectedClientForSub.id,
                      planId: v === "none" ? null : Number(v),
                      currentSubscriptionId: currentSubscriptionInDialog?.id,
                    });
                  }}
                >
                  <SelectTrigger className={ui.input}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} — {p.pricePerMonth}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t border-slate-200 px-5 py-3 flex justify-end">
              <Button type="button" variant="outline" className={ui.btn} onClick={() => setIsSubscriptionDialogOpen(false)}>Fermer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );

  /* Helper pour les initiales */
  function getInitials(name: string) {
    return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  }
}