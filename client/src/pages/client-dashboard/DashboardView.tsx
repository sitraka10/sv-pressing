import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Star, Calendar as CalendarIcon, Truck, CheckCircle, Droplet, Wind, Zap, Info, Loader2, Edit, ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";

// --- Interfaces ---
type OrderStatus = "to_pickup" | "to_sort" | "to_wash" | "to_dry" | "to_iron" | "ready_to_deliver" | "to_deliver" | "delivered";

interface Order {
    id: number;
    status: OrderStatus;
    itemCount: number | null;
    scheduledPickupDate: Date | string | null;
    scheduledDeliveryDate: Date | string | null;
    actualDeliveryDate?: Date | string | null;
    createdAt: Date | string;
}
interface Subscription {
    plan?: { name: string } | null;
    preferredPickupDay?: string;
}

interface DashboardViewProps {
    orders: Order[];
    subscription?: Subscription | null;
    onSchedulePickup: () => void;
    onRequestDelivery: (orderId: number) => void;
    isRequestingDelivery: boolean;
}

interface StatCardProps {
    title: string;
    value: React.ReactNode;
    icon: LucideIcon;
    color: string;
    trend?: "up" | "down";
    trendText?: string;
}

interface RescheduleMutation {
    isPending: boolean;
    mutate: (variables: { orderId: number; updates: Partial<Order> }) => void;
}

// --- Schéma de validation pour la reprogrammation ---
const rescheduleSchema = z.object({
    newDate: z.string().min(1, "La date est requise."),
    newTime: z.string().min(1, "L'heure est requise."),
});

// --- Constantes et Helpers ---
const statusConfig = {
    to_pickup: { label: "Ramassage", message: "Nous préparons notre passage pour récupérer vos articles.", icon: ShoppingBag },
    to_sort: { label: "Triage", message: "Nous trions et inspectons vos vêtements avec soin.", icon: Package },
    to_wash: { label: "Lavage", message: "Vos vêtements sont en cours de lavage.", icon: Droplet },
    to_dry: { label: "Séchage", message: "Séchage en cours, adapté à chaque type de tissu.", icon: Wind },
    to_iron: { label: "Repassage", message: "La touche finale ! Vos articles sont en cours de repassage.", icon: Zap },
    ready_to_deliver: { label: "Prêt", message: "Excellente nouvelle ! Votre commande est prête.", icon: CheckCircle },
    to_deliver: { label: "Livraison", message: "Notre livreur est en route.", icon: Truck },
    delivered: { label: "Livré", message: "Votre commande a été livrée avec succès.", icon: CheckCircle }
};
const statusSteps = Object.keys(statusConfig) as (keyof typeof statusConfig)[];
const formatDate = (date: any, formatStr = "dd MMMM yyyy") => {
    try { return format(new Date(date), formatStr, { locale: fr }); } catch { return "Date invalide"; }
};

// --- Sous-Composants de la Vue ---
const StatCard = ({ title, value, icon: Icon, color, trend, trendText }: StatCardProps) => (
    <Card
        role="group"
        tabIndex={0}
        aria-label={`${title}: ${value}`}
        className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
        <div className="flex items-center justify-between">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${color} shadow-lg`} aria-hidden="true">
                <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="text-right">
                <p className="text-slate-500 text-sm">{title}</p>
                <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
            </div>
        </div>
        {trend && (
            <div className="flex items-center text-xs mt-3 text-slate-500" aria-live="polite">
                {trend === 'up' ? <ArrowUp className="h-4 w-4 mr-1 text-emerald-500" /> : <ArrowDown className="h-4 w-4 mr-1 text-rose-500" />}
                <span className={trend === 'up' ? "text-emerald-600" : "text-rose-600"}>{trendText}</span>
            </div>
        )}
    </Card>
);

// ✅ NOUVEAU COMPOSANT DE SUIVI, CONFORME À L'IMAGE
const OrderStatusTracker = ({ currentStatus }: { currentStatus: OrderStatus }) => {
    const currentStepIndex = statusSteps.indexOf(currentStatus);
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex items-start justify-between min-w-[480px] w-full" role="list" aria-label="Suivi du statut de la commande">
                {statusSteps.map((status, index) => {
                    const { icon: Icon, label } = statusConfig[status];
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    return (
                        <React.Fragment key={status}>
                            <div className="flex flex-col items-center text-center w-12 flex-shrink-0" role="listitem" aria-current={isActive ? 'step' : undefined}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-slate-100 border-slate-200'
                                        }`}
                                    aria-label={label}
                                >
                                    <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-amber-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                                        }`} />
                                </div>
                                <p className={`mt-1 text-[10px] font-medium transition-colors ${isActive ? 'text-slate-800' : 'text-slate-500'
                                    }`}>{label}</p>
                            </div>
                            {index < statusSteps.length - 1 && (
                                <div className="flex-1 mt-[14px] h-0.5 bg-slate-200 mx-1" aria-hidden="true" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const OrderCard = ({ order }: { order: Order }) => {
    const { label, message } = statusConfig[order.status];
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" aria-hidden="true" />
                <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold tracking-tight">Commande #{order.id}</h3>
                        <Badge variant="outline" className="border-blue-300/70 text-blue-700 bg-blue-50">{label}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                        <span>{message}</span>
                    </p>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                    <OrderStatusTracker currentStatus={order.status} />
                </CardContent>
            </Card>
        </motion.div>
    );
};

const RescheduleDialog = ({ open, onOpenChange, order, type, mutation }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order;
    type: "pickup" | "delivery";
    mutation: RescheduleMutation;
}) => {
    const form = useForm<z.infer<typeof rescheduleSchema>>({ resolver: zodResolver(rescheduleSchema) });
    const title = type === 'pickup' ? "Reporter le Ramassage" : "Reporter la Livraison";
    const currentDate = type === 'pickup' ? order.scheduledPickupDate : order.scheduledDeliveryDate;

    useEffect(() => {
        if (currentDate) {
            form.reset({
                newDate: format(new Date(currentDate), 'yyyy-MM-dd'),
                newTime: format(new Date(currentDate), 'HH:mm'),
            });
        }
    }, [currentDate, form]);

    const onSubmit = (data: z.infer<typeof rescheduleSchema>) => {
        const [year, month, day] = data.newDate.split('-').map(Number);
        const [hours, minutes] = data.newTime.split(':').map(Number);
        const finalDate = new Date(year, month - 1, day, hours, minutes);

        const payload = type === 'pickup'
            ? { scheduledPickupDate: finalDate.toISOString() }
            : { scheduledDeliveryDate: finalDate.toISOString() };

        mutation.mutate({ orderId: order.id, updates: payload });
        onOpenChange(false); // Ferme la fenêtre après la soumission
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title} de la commande #{order?.id}</DialogTitle>
                    <DialogDescription>Date actuelle : {formatDate(currentDate, "EEEE dd MMMM 'à' HH:mm")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="date" {...form.register("newDate")} />
                        <Input type="time" {...form.register("newTime")} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const SmartActionCard = ({ order, onSchedulePickup, onRequestDelivery, isRequestingDelivery, rescheduleMutation }: {
    order?: Order;
    onSchedulePickup: () => void;
    onRequestDelivery: (orderId: number) => void;
    isRequestingDelivery: boolean;
    rescheduleMutation: RescheduleMutation;
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'pickup' | 'delivery'>('pickup');

    if (!order) {
        return (
            <Card className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
                <h4 className="text-lg font-semibold text-slate-800 tracking-tight">Prêt pour une nouvelle commande ?</h4>
                <p className="text-slate-500 mb-4 text-sm">Programmez un ramassage en quelques secondes.</p>
                <Button onClick={onSchedulePickup} className="w-full bg-blue-600 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/60">Programmer un ramassage</Button>
            </Card>
        );
    }

    const canReschedulePickup = order.status === 'to_pickup';
    const canRescheduleDelivery = ['ready_to_deliver', 'to_deliver'].includes(order.status);

    return (
        <>
            <Card className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
                <CardTitle className="mb-1 text-lg tracking-tight">Gérer ma commande</CardTitle>
                <p className="text-sm text-slate-500 mb-4">Modifiez vos créneaux selon vos disponibilités.</p>
                <div className="space-y-5">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Ramassage programmé</p>
                        <p className="font-semibold">{formatDate(order.scheduledPickupDate, "EEEE dd MMMM 'à' HH:mm")}</p>
                        <Button variant="link" className="p-0 h-auto text-sm text-blue-600 disabled:text-slate-400" disabled={!canReschedulePickup} onClick={() => { setDialogType('pickup'); setDialogOpen(true); }}>
                            <Edit className="mr-1 h-3 w-3" /> Modifier
                        </Button>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Livraison estimée</p>
                        <p className="font-semibold">{formatDate(order.scheduledDeliveryDate, "EEEE dd MMMM 'à' HH:mm")}</p>
                        <Button variant="link" className="p-0 h-auto text-sm text-blue-600 disabled:text-slate-400" disabled={!canRescheduleDelivery} onClick={() => { setDialogType('delivery'); setDialogOpen(true); }}>
                            <Edit className="mr-1 h-3 w-3" /> Modifier
                        </Button>
                    </div>
                    {order.status === "ready_to_deliver" && (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={isRequestingDelivery}
                            onClick={() => onRequestDelivery(order.id)}
                        >
                            {isRequestingDelivery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                            Demander la livraison
                        </Button>
                    )}
                </div>
            </Card>
            <RescheduleDialog open={dialogOpen} onOpenChange={setDialogOpen} order={order} type={dialogType} mutation={rescheduleMutation} />
        </>
    );
};

// --- Composant Principal de la Vue ---
export function DashboardView({ orders, subscription, onSchedulePickup, onRequestDelivery, isRequestingDelivery }: DashboardViewProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const rescheduleMutation = useMutation({
        mutationFn: ({ orderId, updates }: { orderId: number, updates: Partial<Order> }) =>
            apiRequest("PATCH", `/api/orders/${orderId}`, updates),
        onSuccess: () => {
            toast({ title: "Commande mise à jour", description: "Votre reprogrammation a été enregistrée." });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        },
        onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
    });

    const currentOrders = orders.filter(o => o.status !== "delivered");
    const mostRecentOrder = [...currentOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const completedOrders = orders.filter((order) => order.status === "delivered");
    const itemsInMonth = completedOrders
        .filter((order) => {
            const completedAt = new Date(order.actualDeliveryDate ?? order.createdAt).getTime();
            return completedAt >= monthStart && completedAt < nextMonthStart;
        })
        .reduce((total, order) => total + (order.itemCount ?? 0), 0);
    const itemsInPreviousMonth = completedOrders
        .filter((order) => {
            const completedAt = new Date(order.actualDeliveryDate ?? order.createdAt).getTime();
            return completedAt >= previousMonthStart && completedAt < monthStart;
        })
        .reduce((total, order) => total + (order.itemCount ?? 0), 0);
    const monthlyItemsChange = itemsInMonth - itemsInPreviousMonth;
    const activeOrdersThisMonth = orders.filter((order) => {
        const createdAt = new Date(order.createdAt).getTime();
        return order.status !== "delivered" && createdAt >= monthStart && createdAt < nextMonthStart;
    }).length;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
            <div className="max-w-none mx-auto px-8 sm:px-10 lg:px-16 xl:px-20 py-12">
                <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
                    <header className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Tableau de bord</h1>
                            <p className="text-slate-600 mt-1 text-sm">Aperçu de votre activité et gestion de vos commandes.</p>
                        </div>
                    </header>

                    <section aria-labelledby="dashboard-overview">
                        <h2 id="dashboard-overview" className="sr-only">Aperçu</h2>
                        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={itemVariants}>
                            <StatCard title="Commandes en cours" value={currentOrders.length} icon={Package} color="bg-gradient-to-br from-cyan-500 to-blue-500" trend={activeOrdersThisMonth > 0 ? "up" : undefined} trendText={`${activeOrdersThisMonth} nouvelle(s) ce mois`} />
                            <StatCard title="Pièces traitées (mois)" value={itemsInMonth} icon={ShoppingBag} color="bg-gradient-to-br from-amber-500 to-orange-500" trend={monthlyItemsChange >= 0 ? "up" : "down"} trendText={`${monthlyItemsChange > 0 ? "+" : ""}${monthlyItemsChange} vs mois précédent`} />
                            <StatCard title="Abonnement" value={subscription?.plan?.name || "Aucun"} icon={Star} color="bg-gradient-to-br from-cyan-600 to-blue-500" />
                        </motion.div>
                    </section>

                    <section aria-labelledby="active-order" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <h2 id="active-order" className="sr-only">Commande active</h2>
                        <motion.div className="lg:col-span-2 space-y-4" variants={itemVariants}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold tracking-tight">Suivi de votre commande active</h3>
                            </div>
                            {mostRecentOrder ? (
                                <OrderCard order={mostRecentOrder} />
                            ) : (
                                <Card className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl ring-1 ring-slate-100 text-center">
                                    <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" aria-hidden="true" />
                                    <h4 className="text-lg font-semibold text-slate-800 tracking-tight">Tout est en ordre !</h4>
                                    <p className="text-slate-500">Vous n'avez aucune commande en cours.</p>
                                </Card>
                            )}
                        </motion.div>
                        <motion.div className="space-y-4" variants={itemVariants}>
                            <h3 className="text-xl font-semibold tracking-tight">Vos actions</h3>
                            <SmartActionCard
                                order={mostRecentOrder}
                                onSchedulePickup={onSchedulePickup}
                                onRequestDelivery={onRequestDelivery}
                                isRequestingDelivery={isRequestingDelivery}
                                rescheduleMutation={rescheduleMutation}
                            />
                        </motion.div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
