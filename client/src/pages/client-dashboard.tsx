import React, { useState, useMemo, useEffect, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNowStrict, getDay, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardView } from './client-dashboard/DashboardView';
import { OrdersView } from './client-dashboard/OrdersView';
import { SubscriptionView } from './client-dashboard/SubscriptionView';
import { InvoicesView } from './client-dashboard/InvoicesView';
import { ProfileView } from './client-dashboard/ProfileView';

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// Icons
import {
  LayoutDashboard, Package, Clock, Truck, CheckCircle, AlertCircle, Calendar as CalendarIcon, Download, Bell, Settings, ArrowUp, Droplet, Wind, Zap, ShoppingBag, MapPin, Phone, User, CreditCard, FileText, RefreshCw, Star, LogOut, X as XIcon, Menu, Filter, Loader2
} from "lucide-react";

// Hooks & Utils
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import ActiveAdPopup from "@/components/ActiveAdPopup";

// --- INTERFACES ---
interface Order {
  id: number;
  status: "to_pickup" | "to_sort" | "to_wash" | "to_dry" | "to_iron" | "ready_to_deliver" | "to_deliver" | "delivered";
  itemCount: number;
  scheduledPickupDate: Date;
  scheduledDeliveryDate: Date;
  createdAt: Date;
}

interface Subscription {
  id: number;
  planId: number;
  isActive: boolean;
  startDate: Date;
  preferredPickupDay: string;
  preferredPickupTime: string;
  specialInstructions?: string;
  plan: {
    name: string;
    pricePerMonth: string;
    itemsIncluded: number;
    pickupsPerWeek: number;
    deliveryTimeHours: number;
    features: string[];
  };
}

interface SubscriptionPlan {
  id: number;
  name: string;
  pricePerMonth: string;
  itemsIncluded: number;
  pickupsPerWeek: number;
  type: 'essential' | 'family' | 'premium' | 'custom';
  isPaid?: boolean;
  createdAt?: Date;
}

interface Notification {
  id: number;
  type: 'order_update' | 'payment_reminder' | 'promo';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// --- SCHEMAS ---
const schedulePickupSchema = z.object({
  scheduledPickupDate: z.date({ required_error: "La date est requise." }),
  itemCount: z.coerce.number().min(1, "Le nombre de pièces doit être au moins 1"),
  specialInstructions: z.string().optional(),
});

const profileSettingsSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  address: z.string().min(5, "Adresse invalide"),
});

const subscriptionUpgradeSchema = z.object({
  planId: z.number(),
  preferredPickupDays: z.array(z.string()).min(1, "Veuillez sélectionner au moins un jour."),
  preferredTimeWindowStart: z.string().optional(), // Champ de début
  preferredTimeWindowEnd: z.string().optional(),   // Champ de fin
  specialInstructions: z.string().optional(),
});



// --- HELPERS & CONSTANTS ---
const statusConfig = {
  to_pickup: { label: "Ramassage", color: "text-amber-500", bgColor: "bg-amber-100", icon: ShoppingBag },
  to_sort: { label: "Triage", color: "text-orange-500", bgColor: "bg-orange-100", icon: Package },
  to_wash: { label: "Lavage", color: "text-blue-500", bgColor: "bg-blue-100", icon: Droplet },
  to_dry: { label: "Séchage", color: "text-cyan-500", bgColor: "bg-cyan-100", icon: Wind },
  to_iron: { label: "Repassage", color: "text-purple-500", bgColor: "bg-purple-100", icon: Zap },
  ready_to_deliver: { label: "Prêt", color: "text-lime-500", bgColor: "bg-lime-100", icon: CheckCircle },
  to_deliver: { label: "Livraison", color: "text-indigo-500", bgColor: "bg-indigo-100", icon: Truck },
  delivered: { label: "Livré", color: "text-emerald-500", bgColor: "bg-emerald-100", icon: CheckCircle }
};
const statusSteps = Object.keys(statusConfig) as (keyof typeof statusConfig)[];

const notificationConfig = {
  order_update: { icon: Package, color: 'text-blue-500' },
  payment_reminder: { icon: CreditCard, color: 'text-red-500' },
  promo: { icon: Star, color: 'text-yellow-500' }
};

const formatDate = (date: any, formatStr = "dd MMMM yyyy") => {
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "Date invalide";
    return format(parsed, formatStr, { locale: fr });
  } catch {
    return "Date invalide";
  }
};

const formatTimeLeft = (date: Date) => {
  try {
    return formatDistanceToNowStrict(new Date(date), { addSuffix: true, locale: fr });
  } catch {
    return "Date invalide";
  }
}

// --- MAIN COMPONENT ---
export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>();




  const [maxPickupsAllowed, setMaxPickupsAllowed] = useState(1);

  const upgradeSubscriptionForm = useForm<z.infer<typeof subscriptionUpgradeSchema>>({
    resolver: zodResolver(subscriptionUpgradeSchema),
    defaultValues: {
      planId: 0,
      preferredPickupDays: [],
      preferredTimeWindowStart: "",
      preferredTimeWindowEnd: ""
    }
  });

  // ✅ AJOUTEZ ce `watch` pour surveiller le plan sélectionné dans le formulaire
  const watchedPlanId = upgradeSubscriptionForm.watch('planId');











  // Dialog states
  const [isSchedulePickupOpen, setSchedulePickupOpen] = useState(false);
  const [isProfileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [isUpgradeSubscriptionOpen, setUpgradeSubscriptionOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [openedNotification, setOpenedNotification] = useState<Notification | null>(null);
  


  // --- DATA FETCHING ---
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({ queryKey: ["/api/my-subscription"] });
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({ queryKey: ["/api/notifications/my"], queryFn: () => apiRequest("GET", "/api/notifications/my").then(res => res.json()) });
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices", "client", user?.id], // ✅ Clé unique pour le client, incluant son ID
    queryFn: () => apiRequest("GET", "/api/invoices").then(res => res.json()),
    enabled: !!user?.id // S'assurer que la requête ne part que si l'ID de l'utilisateur est connu
  });
  const { data: subscriptionPlans = [] } = useQuery<SubscriptionPlan[]>({ queryKey: ["/api/subscription-plans"] });

  // Active ad popup now handled by separate component

  const isLoading = ordersLoading || subscriptionLoading;

  // --- MUTATIONS ---
  const schedulePickupMutation = useMutation({
    mutationFn: (data: z.infer<typeof schedulePickupSchema>) => apiRequest("POST", "/api/orders", data),
    onSuccess: () => {
      toast({ title: "Ramassage Programmé!", description: "Votre demande a bien été enregistrée." });
      setSchedulePickupOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: z.infer<typeof profileSettingsSchema>) => apiRequest("PATCH", "/api/user/profile", data),
    onSuccess: () => {
      toast({ title: "Profil Mis à Jour", description: "Vos informations ont été sauvegardées." });
      setProfileSettingsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const upgradeSubscriptionMutation = useMutation({
    mutationFn: (data: any) => {
      // ✅ AJOUTEZ CE LOG
      console.log("--- [FRONTEND] Données envoyées au serveur :", data);
      return apiRequest("PATCH", `/api/subscriptions/${subscription?.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Abonnement mis à jour!", description: "Votre abonnement a été modifié." });
      setUpgradeSubscriptionOpen(false);
      // Invalider les deux requêtes pour rafraîchir toutes les données
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] }); // Pour les préférences sur le user
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const requestDeliveryMutation = useMutation({
    mutationFn: (orderId: number) => apiRequest("POST", `/api/orders/${orderId}/request-delivery`),
    onSuccess: () => {
      toast({ title: "Livraison demandée!", description: "Votre commande est en cours de préparation pour la livraison." });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const markNotificationReadMutation = useMutation({
    // Serveur: /api/notifications/:id/read
    mutationFn: (notificationId: number) =>
      apiRequest("PATCH", `/api/notifications/${notificationId}/read`),

    // Optimistic update: diminuer immédiatement le compteur et marquer l'item comme lu
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/notifications/my"] });

      const previous = queryClient.getQueryData<Notification[]>(["/api/notifications/my"]);

      if (previous) {
        const next = previous.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        queryClient.setQueryData(["/api/notifications/my"], next);
      }

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["/api/notifications/my"], ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/my"] });
    },
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await apiRequest("GET", `/api/invoices/${invoiceId}/download`);
      if (!res.ok) throw new Error("Le téléchargement a échoué.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Téléchargement lancé", description: "Votre facture est en cours de téléchargement." });
    },
    onError: (error: Error) => toast({ title: "Erreur de téléchargement", description: error.message, variant: "destructive" }),
  });

  // --- DERIVED STATE ---
  const currentOrders = useMemo(() => orders.filter(order => order.status !== "delivered"), [orders]);
  const pastOrders = useMemo(() => {
    const delivered = orders.filter(order => order.status === "delivered");
    if (!dateFilter?.from) return delivered;
    return delivered.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: startOfDay(dateFilter.from!), end: endOfDay(dateFilter.to || dateFilter.from!) });
    });
  }, [orders, dateFilter]);

  const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  const orderReadyForDelivery = useMemo(() => currentOrders.find(o => o.status === 'ready_to_deliver'), [currentOrders]);
  const hasPendingOrder = useMemo(() => currentOrders.length > 0, [currentOrders]);

  // --- FORM INSTANCES ---
  const schedulePickupForm = useForm<z.infer<typeof schedulePickupSchema>>({ resolver: zodResolver(schedulePickupSchema) });
  const profileSettingsForm = useForm<z.infer<typeof profileSettingsSchema>>({ resolver: zodResolver(profileSettingsSchema), defaultValues: { fullName: "", email: "", phone: "", address: "" } });


  // Effects to populate forms when data is loaded
  useEffect(() => {
    if (user) {
      profileSettingsForm.reset({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
      })
    }
  }, [user, profileSettingsForm])

  useEffect(() => {
    if (subscription && isUpgradeSubscriptionOpen) {
      upgradeSubscriptionForm.reset({
        planId: subscription.planId,
        preferredPickupDays: subscription.preferredPickupDays || [],
        preferredTimeWindowStart: subscription.preferredTimeWindowStart,
        preferredTimeWindowEnd: subscription.preferredTimeWindowEnd,
        specialInstructions: subscription.specialInstructions || ""
      });
    }
  }, [subscription, subscriptionPlans, isUpgradeSubscriptionOpen, upgradeSubscriptionForm]);



  // ✅ AJOUTEZ cet `useEffect` pour mettre à jour la limite de jours dynamiquement
  useEffect(() => {
    if (watchedPlanId && subscriptionPlans.length > 0) {
      const selectedPlan = subscriptionPlans.find(p => p.id === watchedPlanId);
      if (selectedPlan) {
        setMaxPickupsAllowed(selectedPlan.pickupsPerWeek);
        // On réinitialise les jours sélectionnés pour éviter une sélection invalide
        upgradeSubscriptionForm.setValue('preferredPickupDays', []);
        toast({
          title: `Plan "${selectedPlan.name}" sélectionné`,
          description: `Vous pouvez maintenant choisir jusqu'à ${selectedPlan.pickupsPerWeek} jour(s) de ramassage.`,
        });
      }
    }
  }, [watchedPlanId, subscriptionPlans, upgradeSubscriptionForm, toast]);









  // --- UI COMPONENTS ---
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="p-6 flex items-center gap-6 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${color} shadow-lg`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div>
        <p className="text-slate-500 text-sm">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </Card>
  );

  const OrderStatusTracker = ({ currentStatus }: { currentStatus: keyof typeof statusConfig }) => {
    const currentStepIndex = statusSteps.indexOf(currentStatus);

    return (
      <div className="flex items-center justify-between">
        {statusSteps.map((status, index) => {
          const { icon: Icon, color, bgColor, label } = statusConfig[status];
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <Fragment key={status}>
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? `${bgColor} ${color} border-current shadow-lg` :
                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                      'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  {isCompleted ? <CheckCircle /> : <Icon />}
                </motion.div>
                <p className={`mt-2 text-xs text-center font-semibold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
              </motion.div>
              {index < statusSteps.length - 1 && (
                <div className="flex-1 h-1 bg-slate-200 mx-2 rounded-full">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Commande #{order.id}</CardTitle>
            <Badge className={`${statusConfig[order.status].bgColor} ${statusConfig[order.status].color} border-none`}>{statusConfig[order.status].label}</Badge>
          </div>
          <CardDescription>{order.itemCount} pièces • Créée le {formatDate(order.createdAt, 'd MMM')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <OrderStatusTracker currentStatus={order.status} />
          <div className="grid grid-cols-2 gap-4 text-sm pt-6 border-t">
            <div>
              <p className="font-medium text-slate-500">Ramassage Prévu</p>
              <p className="font-semibold text-slate-700">{formatDate(order.scheduledPickupDate)}</p>
              <p className="text-xs text-cyan-600">{formatTimeLeft(order.scheduledPickupDate)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-500">Livraison Estimée</p>
              <p className="font-semibold text-slate-700">{formatDate(order.scheduledDeliveryDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const Sidebar = ({ className }: { className?: string }) => (
    <aside className={`w-72 md:w-80 p-3 md:p-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-64px)] flex flex-col self-start transition-transform duration-300 ease-in-out ${className}`}>
      <div className="bg-[var(--accent)] border rounded-2xl shadow-sm p-3 md:p-4 mt-6 md:mt-4 -mr-6 flex flex-col gap-1 h-full overflow-auto">
        <nav className="flex flex-col gap-1">
          {[
            { key: "dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
            { key: "orders", label: "Mes Commandes", icon: Package },
            { key: "subscription", label: "Abonnement", icon: Star },
            { key: "invoices", label: "Factures", icon: FileText },
            { key: "profile", label: "Paramètres", icon: Settings },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => { setActiveView(item.key); setSidebarOpen(false); }}
              className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl text-left w-full transition-colors duration-150 border ${activeView === item.key
                ? "bg-[var(--secondary)] border-[var(--secondary)] text-white"
                : "bg-transparent border-white text-white hover:text-[var(--secondary)] hover:border-[var(--secondary)]"
                }`}
            >
              {activeView === item.key && <span aria-hidden className="absolute left-2 h-6 w-1 rounded-full bg-[var(--secondary)]" />}
              <item.icon className={`h-4 w-4 ${activeView === item.key ? "text-white" : "text-white group-hover:text-[var(--secondary)]"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-[240px] pt-8 border-t">
          <button onClick={() => logout()} className="group flex items-center gap-3 px-4 py-2.5 rounded-xl w-full border border-white text-white transition-colors">
            <LogOut className="h-5 w-5 transition-transform duration-600 ease-in-out group-hover:translate-x-3" />
            <span className="transition-transform duration-600 ease-in-out group-hover:translate-x-3">Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );

  const Header = () => (
    <header
      className="sticky top-0 z-40 border-b bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/img/background.jpg)` }}
    >
      <div className="px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/90 hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white/40"><Menu /></button>
          <div className="flex items-center gap-2 cursor-default select-none ml-4 sm:ml-6 md:ml-8">
            <img
              src={`${import.meta.env.BASE_URL}assets/img/Sasavanda_Gris.png`}
              alt="SV Pressing"
              className="h-12 md:h-16 w-auto"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-white text-xs items-center justify-center">{unreadNotificationsCount}</span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Notifications</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notif => {
                  const { icon: Icon, color } = notificationConfig[notif.type] || { icon: Bell, color: 'text-slate-500' };
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setOpenedNotification(notif);
                        setNotificationOpen(true);
                        if (!notif.isRead) {
                          markNotificationReadMutation.mutate(notif.id);
                        }
                      }}
                      className={`flex items-start gap-4 p-4 border-b transition-colors ${!notif.isRead ? 'bg-cyan-50/50 hover:bg-cyan-50' : 'hover:bg-slate-50'}`}
                    >
                      <Icon className={`w-6 h-6 mt-1 shrink-0 ${color}`} />
                      <div>
                        <p className="font-semibold">{notif.title}</p>
                        <p className="text-sm text-slate-600">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatTimeLeft(notif.createdAt)}</p>
                      </div>
                    </div>
                  )
                }) : <p className="p-4 text-center text-sm text-slate-500">Aucune nouvelle notification.</p>}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );

  const PickupReminder = () => {
    if (!subscription?.preferredPickupDay) return null;

    const dayMapping = { "dimanche": 0, "lundi": 1, "mardi": 2, "mercredi": 3, "jeudi": 4, "vendredi": 5, "samedi": 6 };
    const today = getDay(new Date());
    const targetDay = dayMapping[subscription.preferredPickupDay.toLowerCase()];
    if (targetDay === undefined) return null;

    let daysUntilNextPickup = (targetDay - today + 7) % 7;
    if (daysUntilNextPickup === 0) daysUntilNextPickup = 7;

    const nextPickupDate = addDays(new Date(), daysUntilNextPickup);

    return (
      <Card className="bg-cyan-500/10 border-cyan-500/20 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Prochain ramassage automatique</p>
          <p className="text-2xl font-bold text-cyan-600">{formatDate(nextPickupDate)}</p>
          <p className="text-sm text-slate-500">Dans {daysUntilNextPickup} jour{daysUntilNextPickup > 1 ? 's' : ''}</p>
        </div>
      </Card>
    )
  }

  // --- RENDER VIEWS ---
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            orders={orders}
            subscription={subscription}
            onSchedulePickup={() => setSchedulePickupOpen(true)}
            onRequestDelivery={(orderId) => requestDeliveryMutation.mutate(orderId)}
            isRequestingDelivery={requestDeliveryMutation.isPending}
          />
        );
      case "orders":
        return (
          <OrdersView orders={orders} />
        );
      case "subscription":
        return (
          <SubscriptionView subscription={subscription} onUpgrade={() => setUpgradeSubscriptionOpen(true)} />
        );
      case "invoices":
        return (
          <InvoicesView invoices={invoices} />
        );
      case "profile":
        return (
          <ProfileView />
        );
      default:
        return <div>Vue non trouvée</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <div className="px-4 sm:px-6 md:px-8 pt-0">
        <div className="max-w-[110rem] mx-auto flex gap-6">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-16 left-0 h-[calc(100vh-64px)] z-50 lg:hidden">
                <Sidebar className="h-full" />
              </motion.div>
            )}
          </AnimatePresence>
          <Sidebar className="hidden lg:flex shrink-0" />

          <main className="flex-1 min-w-0">
            <div className="px-4 sm:px-6 md:px-8 pb-8 overflow-y-auto pt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isSchedulePickupOpen} onOpenChange={setSchedulePickupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Programmer un ramassage</DialogTitle></DialogHeader>
          <Form {...schedulePickupForm}>
            <form onSubmit={schedulePickupForm.handleSubmit(data => schedulePickupMutation.mutate(data))} className="space-y-4">
              <FormField control={schedulePickupForm.control} name="scheduledPickupDate" render={({ field }) => (
                <FormItem><FormLabel>Date de ramassage</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full justify-start text-left font-normal">{field.value ? formatDate(field.value, 'PPP') : <span>Choisir une date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <FormField control={schedulePickupForm.control} name="itemCount" render={({ field }) => (
                <FormItem><FormLabel>Nombre de pièces (estimation)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={schedulePickupForm.control} name="specialInstructions" render={({ field }) => (
                <FormItem><FormLabel>Instructions spéciales</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={schedulePickupMutation.isPending}>
                {schedulePickupMutation.isPending ? "Programmation..." : "Confirmer le ramassage"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Active Ad Popup */}
      <ActiveAdPopup />

      <Dialog open={isProfileSettingsOpen} onOpenChange={setProfileSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier mon profil</DialogTitle></DialogHeader>
          <Form {...profileSettingsForm}>
            <form onSubmit={profileSettingsForm.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-4">
              <FormField control={profileSettingsForm.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileSettingsForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileSettingsForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileSettingsForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Adresse</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder les changements"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openedNotification?.title ?? "Notification"}</DialogTitle>
            <DialogDescription>
              {openedNotification ? formatTimeLeft(openedNotification.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-slate-700 whitespace-pre-wrap">
              {openedNotification?.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpgradeSubscriptionOpen} onOpenChange={setUpgradeSubscriptionOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto p-4 md:p-5">
          <DialogHeader>
            <DialogTitle className="text-[var(--accent)]">Modifier mon abonnement</DialogTitle>
            <DialogDescription>
              Sélectionnez un nouveau plan et mettez à jour vos préférences de ramassage.
            </DialogDescription>
          </DialogHeader>
          <Form {...upgradeSubscriptionForm}>
            <form onSubmit={upgradeSubscriptionForm.handleSubmit(data => upgradeSubscriptionMutation.mutate(data))} className="space-y-5 pt-2">

              {/* --- Section 1: Choix du Plan --- */}
              <FormField control={upgradeSubscriptionForm.control} name="planId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Choisir un nouveau plan</FormLabel>
                  <div className="grid gap-3 md:grid-cols-3 pt-1">
                    {subscriptionPlans
                      .filter((plan: any) => plan.type !== 'custom')
                      .map((plan) => (
                        <Card
                          key={plan.id}
                          onClick={() => field.onChange(plan.id)}
                          className={`cursor-pointer transition-all duration-200 rounded-lg ${field.value === plan.id ? 'border-[var(--secondary)] border-2 shadow-xl scale-105' : 'hover:shadow-md hover:border-gray-300'}`}
                        >
                          <CardContent className="p-3 text-center">
                            <h5 className="font-bold text-[var(--accent)]">{plan.name}</h5>
                            <p className="text-xl font-extrabold text-[var(--secondary)] my-0.5">{plan.pricePerMonth.replace(/\s*Ar/i, '')}<span className="text-sm font-normal text-gray-500"> Ar</span></p>
                            <p className="text-[13px] text-slate-500">{plan.itemsIncluded} pièces/mois</p>
                            <p className="text-[11px] text-slate-500 font-bold">{plan.pickupsPerWeek} ramassage(s)/sem.</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* --- Section 2: Préférences de Ramassage --- */}
              <div>
                <FormLabel className="text-base font-semibold">Préférences de ramassage</FormLabel>
                <div className="grid gap-6 md:grid-cols-2 pt-4">
                  {/* Choix des jours (logique dynamique) */}
                  <FormField
                    control={upgradeSubscriptionForm.control}
                    name="preferredPickupDays"
                    render={() => (
                      <FormItem>
                        <FormLabel>Jour(s) de ramassage (max: {maxPickupsAllowed})</FormLabel>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 p-4 border rounded-md min-h-[100px]">
                          {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"].map(day => (
                            <FormField key={day} control={upgradeSubscriptionForm.control} name="preferredPickupDays" render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day)}
                                    onCheckedChange={(checked) => {
                                      const currentDays = field.value || [];
                                      if (checked) {
                                        if (currentDays.length < maxPickupsAllowed) {
                                          field.onChange([...currentDays, day]);
                                        } else {
                                          toast({ title: "Limite atteinte", description: `Vous ne pouvez sélectionner que ${maxPickupsAllowed} jour(s).`, variant: "destructive" });
                                        }
                                      } else {
                                        field.onChange(currentDays.filter(value => value !== day));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize text-sm">{day}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Choix de l'heure */}
                  <FormField
                    control={upgradeSubscriptionForm.control}
                    name="preferredTimeWindowStart" // On lie le contrôle à "Start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure de ramassage</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const [start, end] = value.split('-');
                            // On met à jour les DEUX champs du formulaire en même temps
                            upgradeSubscriptionForm.setValue('preferredTimeWindowStart', start);
                            upgradeSubscriptionForm.setValue('preferredTimeWindowEnd', end);
                          }}
                          // La valeur affichée est reconstruite à partir des champs du formulaire
                          value={
                            (upgradeSubscriptionForm.getValues('preferredTimeWindowStart') && upgradeSubscriptionForm.getValues('preferredTimeWindowEnd'))
                              ? `${upgradeSubscriptionForm.getValues('preferredTimeWindowStart')}-${upgradeSubscriptionForm.getValues('preferredTimeWindowEnd')}`
                              : ""
                          }
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Choisir une heure" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="08:00-10:00">08:00 - 10:00</SelectItem>
                            <SelectItem value="10:00-12:00">10:00 - 12:00</SelectItem>
                            <SelectItem value="14:00-16:00">14:00 - 16:00</SelectItem>
                            <SelectItem value="16:00-18:00">16:00 - 18:00</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
              </div>

              {/* --- Section 3: Instructions Spéciales --- */}
              <FormField control={upgradeSubscriptionForm.control} name="specialInstructions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions spéciales (optionnel)</FormLabel>
                  <FormControl><Textarea placeholder="Instructions particulières pour nos livreurs ou notre équipe..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full !bg-[var(--accent)] !text-white hover:!bg-[var(--accent)] focus-visible:ring-[var(--ring)]" disabled={upgradeSubscriptionMutation.isPending}>
                {upgradeSubscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mettre à jour l'abonnement
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}