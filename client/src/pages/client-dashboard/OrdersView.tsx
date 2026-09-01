import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Truck, CheckCircle, Droplet, Wind, Zap, Calendar as CalendarIcon, Filter } from "lucide-react";

// --- Interfaces ---
interface Order {
    id: number;
    status: "to_pickup" | "to_sort" | "to_wash" | "to_dry" | "to_iron" | "ready_to_deliver" | "to_deliver" | "delivered";
    itemCount: number;
    scheduledPickupDate: Date;
    scheduledDeliveryDate: Date;
    createdAt: Date;
}

// --- Constantes et Helpers ---
const statusConfig = {
    to_pickup: { label: "Ramassage", icon: ShoppingBag },
    to_sort: { label: "Triage", icon: Package },
    to_wash: { label: "Lavage", icon: Droplet },
    to_dry: { label: "Séchage", icon: Wind },
    to_iron: { label: "Repassage", icon: Zap },
    ready_to_deliver: { label: "Prêt", icon: CheckCircle },
    to_deliver: { label: "Livraison", icon: Truck },
    delivered: { label: "Livré", icon: CheckCircle }
};
const statusSteps = Object.keys(statusConfig) as (keyof typeof statusConfig)[];
const formatDate = (date: any, formatStr = "dd MMMM yyyy") => {
    try { return format(new Date(date), formatStr, { locale: fr }); } catch { return "Date invalide"; }
};

// --- Sous-Composants ---
const OrderStatusTracker = ({ currentStatus }: { currentStatus: keyof typeof statusConfig }) => {
    const currentStepIndex = statusSteps.indexOf(currentStatus);
    const nextStep = statusSteps[currentStepIndex + 1];
    const progress = Math.round((currentStepIndex / (statusSteps.length - 1)) * 100);
    return (
        <div className="w-full" aria-label="Statut de la commande">
            <TooltipProvider>
                <div className="flex items-start justify-between w-full" role="list">
                    {statusSteps.map((status, index) => {
                        const { icon: Icon, label } = statusConfig[status];
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;
                        return (
                            <React.Fragment key={status}>
                                <div className="flex flex-col items-center text-center w-20 flex-shrink-0" role="listitem">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${isActive ? 'bg-amber-50 border-amber-500' : isCompleted ? 'bg-slate-100 border-slate-300' : 'bg-slate-100 border-slate-200'}`}
                                                aria-current={isActive ? 'step' : undefined}
                                                aria-label={label}
                                            >
                                                <Icon aria-hidden className={`h-7 w-7 ${isActive ? 'text-amber-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`} />
                                                <span className="sr-only">{label}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>{label}</TooltipContent>
                                    </Tooltip>
                                    <p className={`mt-2 text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
                                </div>
                                {index < statusSteps.length - 1 && (
                                    <div className={`flex-1 mt-[26px] h-1 mx-1 md:mx-2 ${index < currentStepIndex ? 'bg-amber-300' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </TooltipProvider>

            <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Progression</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} className="mt-2" />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700">Étape actuelle:</span>
                    <span className="text-slate-600">{statusConfig[currentStatus].label}</span>
                    {nextStep && (
                        <>
                            <span className="text-slate-300">•</span>
                            <span className="font-semibold text-slate-700">À venir:</span>
                            <span className="text-slate-600">{statusConfig[nextStep].label}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrderCard = ({ order }: { order: Order }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <Card className="bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-100 hover:shadow-md transition-shadow">
                <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Commande #{order.id}</CardTitle>
                        <Badge variant="outline" className="whitespace-nowrap">{statusConfig[order.status].label}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{order.itemCount} pièces • Créée le {formatDate(order.createdAt, 'd MMM yyyy')}</p>
                </CardHeader>
                <CardContent className="p-6">
                    {order.status !== "delivered" && (
                        <OrderStatusTracker currentStatus={order.status} />
                    )}
                    <div className={order.status !== 'delivered' ? 'mt-6 grid gap-3 sm:grid-cols-2' : 'mt-2 grid gap-3 sm:grid-cols-2'}>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarIcon aria-hidden className="h-4 w-4 text-slate-400" />
                            <span>Ramassage: {formatDate(order.scheduledPickupDate, 'EEE d MMM, HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarIcon aria-hidden className="h-4 w-4 text-slate-400" />
                            <span>Livraison: {formatDate(order.scheduledDeliveryDate, 'EEE d MMM, HH:mm')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const DeliveredOrderRow = ({ order }: { order: Order }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full">
            <div className="w-full bg-white ring-1 ring-slate-100 rounded-xl px-4 py-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-800 truncate">Commande #{order.id}</span>
                            <span className="text-sm text-slate-600 whitespace-nowrap">{order.itemCount} pièces</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">Livré le {formatDate(order.scheduledDeliveryDate, 'EEE d MMM, HH:mm')}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 sm:items-center text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <CalendarIcon aria-hidden className="h-4 w-4 text-slate-400" />
                            <span>Ramassage: {formatDate(order.scheduledPickupDate, 'd MMM')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon aria-hidden className="h-4 w-4 text-slate-400" />
                            <span>Livraison: {formatDate(order.scheduledDeliveryDate, 'd MMM')}</span>
                        </div>
                        <div className="sm:text-right">
                            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">{statusConfig[order.status].label}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Composant Principal de la Vue "Mes Commandes" ---
interface OrdersViewProps {
    orders: Order[];
}

export function OrdersView({ orders }: OrdersViewProps) {
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"current" | "past">("current");

    const currentOrders = useMemo(() => orders.filter(order => order.status !== "delivered").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [orders]);
    const pastOrders = useMemo(() => {
        const delivered = orders.filter(order => order.status === "delivered").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!dateFilter?.from) return delivered;
        return delivered.filter(order => {
            const orderDate = new Date(order.createdAt);
            return isWithinInterval(orderDate, { start: startOfDay(dateFilter.from!), end: endOfDay(dateFilter.to || dateFilter.from!) });
        });
    }, [orders, dateFilter]);

    const filteredCurrentOrders = useMemo(() => {
        return currentOrders.filter(o => {
            const byStatus = statusFilter === "all" ? true : o.status === (statusFilter as keyof typeof statusConfig);
            const q = searchQuery.trim().toLowerCase();
            const byQuery = q === "" ? true : `${o.id}`.includes(q) || statusConfig[o.status].label.toLowerCase().includes(q);
            return byStatus && byQuery;
        });
    }, [currentOrders, searchQuery, statusFilter]);

    const filteredPastOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return pastOrders.filter(o => q === "" ? true : `${o.id}`.includes(q) || statusConfig[o.status].label.toLowerCase().includes(q));
    }, [pastOrders, searchQuery]);

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-white border rounded-2xl mt-6 md:mt-8">
            <div className="max-w-none mx-auto px-6 sm:px-8 lg:px-12 py-8">
            <div className="mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Historique des Commandes</h3>
                <p className="text-sm text-slate-500 mt-1">Consultez vos commandes en cours et passées. Utilisez la recherche et les filtres pour trouver rapidement.</p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "current" | "past")} className="w-full">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TabsList aria-label="Sections des commandes">
                        <TabsTrigger value="current">
                            En cours
                            <span className="ml-2 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs border border-amber-200">{currentOrders.length}</span>
                        </TabsTrigger>
                        <TabsTrigger value="past">
                            Terminées
                            <span className="ml-2 rounded-full bg-slate-50 text-slate-700 px-2 py-0.5 text-xs border border-slate-200">{pastOrders.length}</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">

                        {activeTab === "current" && (
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48" aria-label="Filtrer par statut">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    {statusSteps.filter(s => s !== "delivered").map((s) => (
                                        <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {activeTab === "past" && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2" aria-label="Filtrer les commandes par date">
                                        <Filter className="h-4 w-4" />
                                        <span>
                                            {dateFilter?.from ?
                                                (dateFilter.to
                                                    ? `${formatDate(dateFilter.from, 'd MMM')} - ${formatDate(dateFilter.to, 'd MMM')}`
                                                    : formatDate(dateFilter.from, 'd MMM yyyy')
                                                )
                                                : "Filtrer par date"
                                            }
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <div className="p-3">
                                        <Calendar mode="range" selected={dateFilter} onSelect={setDateFilter} />
                                        <div className="mt-3 flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setDateFilter(undefined)}>Réinitialiser</Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>

                <TabsContent value="current" className="mt-6">
                    {filteredCurrentOrders.length > 0 ? (
                        <div className="space-y-4">
                            {filteredCurrentOrders.map(o => <OrderCard key={o.id} order={o} />)}
                        </div>
                    ) : (
                        <Card className="bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-100">
                            <CardContent className="p-10 text-center">
                                <ShoppingBag aria-hidden className="mx-auto h-10 w-10 text-slate-300" />
                                <p className="mt-3 text-slate-600 font-medium">Aucune commande en cours</p>
                                <p className="text-sm text-slate-500">Ajustez les filtres ou revenez plus tard.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="past" className="mt-6">
                    {filteredPastOrders.length > 0 ? (
                        <div className="space-y-2">
                            {filteredPastOrders.map(o => <DeliveredOrderRow key={o.id} order={o} />)}
                        </div>
                    ) : (
                        <Card className="bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-100">
                            <CardContent className="p-10 text-center">
                                <Package aria-hidden className="mx-auto h-10 w-10 text-slate-300" />
                                <p className="mt-3 text-slate-600 font-medium">Aucune commande terminée</p>
                                <p className="text-sm text-slate-500">Modifiez la période de dates pour élargir la recherche.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
            </div>
        </div>
    );
}