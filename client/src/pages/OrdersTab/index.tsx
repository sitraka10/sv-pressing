// src/pages/OrdersTab/index.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, History, BarChart3, Calendar, Filter, Search,
  X, Inbox, Package, AlertTriangle, ArrowRight, Eye, MessageSquare,
  ChevronLeft, ChevronRight, Download, CheckCircle2, Target, Hourglass,
  Layers, ChartSpline, AlertOctagon, Info, Sparkles, Gauge, Users, Brain,
  CalendarClock, Workflow, UserCheck, Phone, Mail, MapPin, CreditCard,
  CalendarDays, Truck, Save, Loader2, Droplets, Wind,
  TrendingUp, TrendingDown, Minus, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format, parseISO, differenceInHours, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Order, User, Delivery, OrdersTabProps } from './types';
import { WORKFLOW_STEPS } from './constants';
import { formatDate, getStatusBadge, formatRelativeTime } from './utils/format';
import { getOrderCountdown, getNextStatus } from './utils/sla';
import {
  calculateOverallProgress, calculateStageMetrics, calculateGlobalMetrics,
  generateRiskAlerts, generateIntelligentRecommendations,
  calculateTimeSeriesData, calculateStageTransitions
} from './utils/bi';
import { useResponsive } from './hooks/useResponsive';
import { StatCard } from './components/StatCard';
import { MetricCard } from './components/MetricCard';
import { SLADisplay } from './components/SLADisplay';
import { WorkflowProgressBar } from './components/WorkflowProgressBar';
import { NoteItem } from './components/NoteItem';
import { MobileOrderCard, DesktopOrderCard } from './components/OrderCard';
import { PlanningIntelligentComponent } from './components/PlanningIntelligent';

// ============================
// STYLES NEOMORPHIC
// ============================
const neomorphic = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)]",
  cardHover: "hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  pressed: "shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  input: "bg-[#eef2f5] rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-teal-500",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  badge: "bg-[#0B676E] text-white shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  glass: "backdrop-blur-xl bg-white/25 rounded-2xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]",
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  users,
  deliveries,
  handleStatusChange,
  handleAddNote,
  setSelectedOrder,
  setIsOrderDetailsOpen
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [now, setNow] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [committedSearchQuery, setCommittedSearchQuery] = useState("");
  const [gestionPage, setGestionPage] = useState(1);
  const [historiquePage, setHistoriquePage] = useState(1);
  const [historiqueItemsPerPage, setHistoriqueItemsPerPage] = useState(10);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("gestion");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedOrderForNote, setSelectedOrderForNote] = useState<Order | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [ordersWithNotes, setOrdersWithNotes] = useState<Order[]>(orders);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ open: boolean; orderId: number; currentStatus: string; newStatus: string; requiresItemCount?: boolean; itemCount?: number }>({ open: false, orderId: 0, currentStatus: '', newStatus: '' });
  const [itemCountInput, setItemCountInput] = useState<number>(0);
  const [biTimeRange, setBiTimeRange] = useState('30');
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; orderId: number; orderNumber?: number; currentDate?: string; clientName?: string }>({ open: false, orderId: 0 });
  const [newPickupDate, setNewPickupDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [showOnlyNotes, setShowOnlyNotes] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setOrdersWithNotes(orders);
  }, [orders]);

  useEffect(() => {
    const timer = setTimeout(() => setCommittedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setGestionPage(1);
  }, [selectedStatus, committedSearchQuery]);

  useEffect(() => {
    setHistoriquePage(1);
  }, [activeTab]);

  useEffect(() => {
    setItemsPerPage(isMobile ? 5 : 10);
    setHistoriqueItemsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  const clients = useMemo(() => Array.isArray(users) ? users.filter(u => u.role === "client") : [], [users]);
  const lateOrders = useMemo(() => ordersWithNotes.filter(order => order.status !== "delivered" && (getOrderCountdown(order, now)?.isLate || false)), [ordersWithNotes, now]);

  const filteredGestionOrders = useMemo(() => {
    let filtered = ordersWithNotes.filter(order => {
      if (order.status === "delivered") return false;
      if (selectedStatus === 'late') return getOrderCountdown(order, now)?.isLate || false;
      if (selectedStatus && order.status !== selectedStatus) return false;
      if (committedSearchQuery) {
        const client = clients.find(c => c.id === order.clientId);
        const searchLower = committedSearchQuery.toLowerCase();
        return order.id.toString().includes(searchLower) || client?.fullName.toLowerCase().includes(searchLower);
      }
      return true;
    });

    if (showOnlyNotes) {
      filtered = filtered.filter(order => order.notes && order.notes.length > 0);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersWithNotes, selectedStatus, committedSearchQuery, clients, now, showOnlyNotes]);

  const paginatedGestionOrders = useMemo(() => filteredGestionOrders.slice((gestionPage - 1) * itemsPerPage, gestionPage * itemsPerPage), [filteredGestionOrders, gestionPage, itemsPerPage]);
  const totalGestionPages = Math.ceil(filteredGestionOrders.length / itemsPerPage);

  const historiqueOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'delivered')
      .sort((a, b) => new Date(b.actualDeliveryDate || b.updatedAt || b.createdAt).getTime() - new Date(a.actualDeliveryDate || a.updatedAt || a.createdAt).getTime());
  }, [orders]);

  const paginatedHistoriqueOrders = useMemo(() =>
    historiqueOrders.slice((historiquePage - 1) * historiqueItemsPerPage, historiquePage * historiqueItemsPerPage),
    [historiqueOrders, historiquePage, historiqueItemsPerPage]
  );
  const totalHistoriquePages = Math.ceil(historiqueOrders.length / historiqueItemsPerPage);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    WORKFLOW_STEPS.forEach(step => counts[step.status] = 0);
    filteredGestionOrders.forEach(order => { if (counts[order.status] !== undefined) counts[order.status] += 1; });
    return counts;
  }, [filteredGestionOrders]);

  const overallProgress = useMemo(() => calculateOverallProgress(orders), [orders]);
  const stageMetrics = useMemo(() => calculateStageMetrics(orders, now), [orders, now]);
  const globalMetrics = useMemo(() => calculateGlobalMetrics(orders, now), [orders, now]);
  const timeSeriesData = useMemo(() => calculateTimeSeriesData(orders, now, parseInt(biTimeRange)), [orders, now, biTimeRange]);
  const stageTransitions = useMemo(() => calculateStageTransitions(orders, now), [orders, now]);
  const riskAlerts = useMemo(() => generateRiskAlerts(globalMetrics, stageMetrics, now), [globalMetrics, stageMetrics, now]);
  const intelligentRecommendations = useMemo(() => generateIntelligentRecommendations(globalMetrics, stageMetrics, stageTransitions, timeSeriesData), [globalMetrics, stageMetrics, stageTransitions, timeSeriesData]);

  const handleStatusClick = (status: string) => setSelectedStatus(selectedStatus === status ? null : status);

  const markNoteAsRead = useCallback(async (noteId: number, orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/notes/${noteId}/read`, { method: 'PATCH' });
      if (response.ok) {
        setOrdersWithNotes(prev => prev.map(order => {
          if (order.id === orderId && order.notes) {
            return {
              ...order,
              notes: order.notes.map(note => note.id === noteId ? { ...note, isRead: true } : note)
            };
          }
          return order;
        }));
        if (selectedOrderForNote?.id === orderId) {
          setSelectedOrderForNote(prev => prev ? {
            ...prev,
            notes: prev.notes?.map(note => note.id === noteId ? { ...note, isRead: true } : note)
          } : prev);
        }
      }
    } catch (error) {
      console.error("Erreur lors du marquage de la note:", error);
    }
  }, [selectedOrderForNote]);

  const handleOpenNoteDialog = useCallback(async (order: Order) => {
    setSelectedOrderForNote(order);
    setNewNoteContent("");
    setIsLoadingNotes(true);
    setNoteDialogOpen(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/notes`);
      if (response.ok) {
        const notes = await response.json();
        const orderWithNotes = { ...order, notes };
        setSelectedOrderForNote(orderWithNotes);
        setOrdersWithNotes(prev => prev.map(o => o.id === order.id ? { ...o, notes } : o));
      }
    } catch (error) {
      console.error("Erreur chargement notes:", error);
      toast({ title: "Erreur", description: "Impossible de charger les notes", variant: "destructive" });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [toast]);

  const handleSaveNote = useCallback(async () => {
    if (!selectedOrderForNote || !newNoteContent.trim()) return;
    setIsSavingNote(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrderForNote.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent.trim(), noteType: 'general', createdBy: user?.id || 1 })
      });
      if (!response.ok) throw new Error('Erreur');
      const result = await response.json();
      const updatedOrder = { ...selectedOrderForNote, notes: [result, ...(selectedOrderForNote.notes || [])] };
      setSelectedOrderForNote(updatedOrder);
      setOrdersWithNotes(prev => prev.map(o => o.id === selectedOrderForNote.id ? updatedOrder : o));
      if (handleAddNote) handleAddNote(selectedOrderForNote.id, newNoteContent.trim());
      setNewNoteContent("");
      toast({ title: "Succès", description: "Note ajoutée" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter la note", variant: "destructive" });
    } finally {
      setIsSavingNote(false);
    }
  }, [selectedOrderForNote, newNoteContent, user, handleAddNote, toast]);

  const handleReschedule = async () => {
    if (!newPickupDate) {
      toast({ title: "Date requise", description: "Sélectionnez une nouvelle date", variant: "destructive" });
      return;
    }
    const selectedDate = new Date(newPickupDate);
    if (selectedDate <= new Date()) {
      toast({ title: "Date invalide", description: "La date doit être dans le futur", variant: "destructive" });
      return;
    }
    setIsRescheduling(true);
    try {
      const response = await fetch(`/api/orders/${rescheduleDialog.orderId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPickupDate, reason: rescheduleReason || "Report occasionnel" })
      });
      if (!response.ok) throw new Error('Erreur');
      const updatedOrder = await response.json();
      setOrdersWithNotes(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      toast({ title: "Ramassage reporté", description: `Commande #${rescheduleDialog.orderNumber} reprogrammée` });
      setRescheduleDialog({ open: false, orderId: 0 });
      setNewPickupDate("");
      setRescheduleReason("");
    } catch (error: any) {
      toast({ title: "Erreur", description: "Impossible de reporter", variant: "destructive" });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleStatusChangeRequest = (orderId: number, newStatus: string) => {
    const order = ordersWithNotes.find(o => o.id === orderId);
    if (!order) return;
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.status === order.status);
    const newIndex = WORKFLOW_STEPS.findIndex(s => s.status === newStatus);
    if (newIndex !== currentIndex + 1) {
      toast({ title: "Étape incorrecte", description: `Passez d'abord par ${WORKFLOW_STEPS[currentIndex + 1]?.label}`, variant: "destructive" });
      return;
    }
    const requiresItemCount = newStatus === 'to_sort' && !order.itemCount;
    setStatusChangeDialog({ open: true, orderId, currentStatus: order.status, newStatus, requiresItemCount, itemCount: order.itemCount });
    if (order.itemCount) setItemCountInput(order.itemCount);
  };

  const confirmStatusChange = () => {
    const { orderId, newStatus, requiresItemCount } = statusChangeDialog;
    if (requiresItemCount && itemCountInput <= 0) {
      toast({ title: "Nombre d'articles requis", description: "Saisissez le nombre d'articles", variant: "destructive" });
      return;
    }
    handleStatusChange(orderId, newStatus, requiresItemCount ? itemCountInput : undefined);
    setStatusChangeDialog({ open: false, orderId: 0, currentStatus: '', newStatus: '' });
    setItemCountInput(0);
    toast({ title: "Statut mis à jour", description: `Commande #${orderId} mise à jour` });
  };

  const openOrderDetail = (order: Order) => {
    const client = clients.find(c => c.id === order.clientId);
    const delivery = deliveries.find(d => d.orderId === order.id);
    setSelectedOrderDetail({ ...order, clientDetails: client, deliveryDetails: delivery });
    setDetailDialogOpen(true);
  };

  const getUnreadNotesCount = useCallback((order: Order) => order.notes?.filter(note => !note.isRead).length || 0, []);
  const hasAnyNotes = useCallback((order: Order) => order.notes && order.notes.length > 0, []);

  const handlePlanningOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // ============================
  // RENDER
  // ============================
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#eef2f5] p-3 sm:p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Onglets Neomorphic */}
            <div className={cn(neomorphic.glass, "p-1 mb-4 sm:mb-6 sticky top-4 z-10")}>
              <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 bg-[#eef2f5] rounded-xl p-1 gap-1 shadow-[inset_2px_2px_6px_#b8c2ca,inset_-2px_-2px_6px_#ffffff]">
                <TabsTrigger
                  value="gestion"
                  className="data-[state=active]:bg-[#eef2f5] data-[state=active]:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] data-[state=active]:text-teal-700 rounded-xl py-2 text-xs sm:text-sm font-medium transition-all"
                >
                  <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Suivi</span>
                  <span className="sm:hidden">Suivi</span>
                  {lateOrders.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-red-500 text-white border-0 px-1 py-0.5 text-[10px]">
                      {lateOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="historique"
                  className="data-[state=active]:bg-[#eef2f5] data-[state=active]:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] data-[state=active]:text-teal-700 rounded-xl py-2 text-xs sm:text-sm font-medium transition-all"
                >
                  <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Historique</span>
                  <span className="sm:hidden">Hist.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analyse"
                  className="data-[state=active]:bg-[#eef2f5] data-[state=active]:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] data-[state=active]:text-teal-700 rounded-xl py-2 text-xs sm:text-sm font-medium transition-all"
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analyse</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger
                  value="planning"
                  className="data-[state=active]:bg-[#eef2f5] data-[state=active]:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] data-[state=active]:text-teal-700 rounded-xl py-2 text-xs sm:text-sm font-medium transition-all"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Planning</span>
                  <span className="sm:hidden">Plan</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ==================== ONGLET GESTION ==================== */}
            <TabsContent value="gestion" className="mt-0 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Carte principale - Teal Neomorphic */}
                <div className={cn(
                  neomorphic.card,
                  "lg:col-span-3 relative overflow-hidden p-4 sm:p-6",
                  "bg-gradient-to-br from-[#0B676E] via-[#0B676E] to-[#085257] text-white"
                )}>
                  <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                      <div>
                        <h2 className="text-base sm:text-xl font-bold">Commandes en cours</h2>
                        <p className="text-teal-100 text-xs sm:text-sm">Suivi en temps réel</p>
                      </div>
                      <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                        <span className="text-xl sm:text-3xl font-bold">{filteredGestionOrders.length}</span>
                        <span className="text-xs sm:text-sm ml-1 text-white/80">active{filteredGestionOrders.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <p className="text-teal-100 text-[10px] sm:text-xs">Progression</p>
                        <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
                          <span className="text-lg sm:text-2xl font-bold">{overallProgress.percent}%</span>
                          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${overallProgress.percent}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <p className="text-teal-100 text-[10px] sm:text-xs">En retard</p>
                        <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
                          <span className="text-lg sm:text-2xl font-bold text-red-300">{globalMetrics.delayedOrders}</span>
                          {globalMetrics.delayedOrders > 0 && <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-300" />}
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <p className="text-teal-100 text-[10px] sm:text-xs">Ponctualité</p>
                        <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
                          <span className="text-lg sm:text-2xl font-bold text-green-300">{globalMetrics.onTimeRate}%</span>
                          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${globalMetrics.onTimeRate}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte Urgent - Neomorphic avec rouge */}
                <div
                  className={cn(
                    "relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300",
                    neomorphic.card,
                    selectedStatus === 'late' && "ring-2 ring-red-500 ring-offset-4 ring-offset-[#eef2f5]"
                  )}
                  onClick={() => setSelectedStatus(selectedStatus === 'late' ? null : 'late')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600" />
                  <div className="relative p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <p className="text-white/80 text-xs sm:text-sm font-medium">Commandes urgentes</p>
                      <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white/70" />
                    </div>
                    <p className="text-2xl sm:text-4xl font-bold">{lateOrders.length}</p>
                    <p className="text-white/70 text-[10px] sm:text-sm mt-1">en retard sur le SLA</p>
                    <div className="mt-3 sm:mt-4 flex items-center gap-1 text-[10px] sm:text-xs text-white/60">
                      <span>Cliquer pour filtrer</span>
                      <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtres Neomorphic */}
              <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Filtrer par étape</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-notes-filter"
                        checked={showOnlyNotes}
                        onCheckedChange={setShowOnlyNotes}
                        className="data-[state=checked]:bg-[#0B676E]"
                      />
                      <Label htmlFor="show-notes-filter" className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                        <MessageSquare className="h-3 w-3" />
                        Commandes avec notes
                      </Label>
                    </div>
                    {selectedStatus && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStatus(null)}
                        className="text-xs h-7 px-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <X className="h-3 w-3 mr-1" />Effacer
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {WORKFLOW_STEPS.filter(s => s.status !== 'delivered').map(step => (
                    <StatCard
                      key={step.status}
                      title={step.label}
                      value={statusCounts[step.status] || 0}
                      icon={step.icon}
                      color={step.color}
                      onClick={() => handleStatusClick(step.status)}
                      isActive={selectedStatus === step.status}
                    />
                  ))}
                </div>
              </div>

              {/* Recherche Neomorphic */}
              <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher par n° ou client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(neomorphic.input, "pl-8 sm:pl-10 text-sm")}
                    />
                  </div>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                    <SelectTrigger className={cn(neomorphic.input, "w-24 sm:w-32 text-sm")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                      <SelectItem value="5">5 / page</SelectItem>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                  {filteredGestionOrders.length > 0 && (
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGestionPage(p => Math.max(1, p - 1))}
                        disabled={gestionPage === 1}
                        className={cn(neomorphic.button, "h-8 w-8 p-0 border-0")}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-gray-600">{gestionPage} / {totalGestionPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGestionPage(p => Math.min(totalGestionPages, p + 1))}
                        disabled={gestionPage === totalGestionPages}
                        className={cn(neomorphic.button, "h-8 w-8 p-0 border-0")}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des commandes */}
              <AnimatePresence mode="wait">
                {paginatedGestionOrders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(neomorphic.card, "p-8 sm:p-12 text-center")}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-[#eef2f5] rounded-3xl shadow-[inset_6px_6px_12px_#b8c2ca,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center">
                      <Inbox className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Aucune commande</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      {selectedStatus === 'late' ? "Aucun retard" :
                        selectedStatus ? `Aucune commande "${WORKFLOW_STEPS.find(s => s.status === selectedStatus)?.label}"` :
                        "Aucun résultat"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 sm:space-y-4">
                    {paginatedGestionOrders.map((order, idx) => (
                      isMobile ?
                        <MobileOrderCard
                          key={order.id}
                          order={order}
                          idx={idx}
                          clients={clients}
                          now={now}
                          handleStatusChange={handleStatusChange}
                          handleStatusChangeRequest={handleStatusChangeRequest}
                          handleOpenNoteDialog={handleOpenNoteDialog}
                          openOrderDetail={openOrderDetail}
                          setRescheduleDialog={setRescheduleDialog}
                          expandedOrderId={expandedOrderId}
                          toggleOrderExpand={toggleOrderExpand}
                        /> :
                        <DesktopOrderCard
                          key={order.id}
                          order={order}
                          idx={idx}
                          clients={clients}
                          now={now}
                          handleStatusChange={handleStatusChange}
                          handleStatusChangeRequest={handleStatusChangeRequest}
                          handleOpenNoteDialog={handleOpenNoteDialog}
                          openOrderDetail={openOrderDetail}
                          setRescheduleDialog={setRescheduleDialog}
                        />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ==================== ONGLET HISTORIQUE ==================== */}
            <TabsContent value="historique" className="mt-0">
              <div className={cn(neomorphic.card, "overflow-hidden")}>
                <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/40 bg-white/30 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                        <History className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                        Historique des commandes livrées
                      </h3>
                      <p className="text-xs text-gray-500">
                        {historiqueOrders.length} commandes • Temps moyen: {globalMetrics.avgCompletionTime}h • Taux ponctualité: {globalMetrics.onTimeRate}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Select value={historiqueItemsPerPage.toString()} onValueChange={(v) => { setHistoriqueItemsPerPage(Number(v)); setHistoriquePage(1); }}>
                          <SelectTrigger className={cn(neomorphic.input, "w-20 h-8 text-xs")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                            <SelectItem value="5">5 / page</SelectItem>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="20">20 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Badge className={neomorphic.badge + " text-xs"}>
                        <CheckCircle2 className="h-2.5 w-2.5 inline mr-1" />
                        Livrées
                      </Badge>
                      <Badge className={cn(
                        "border-0 text-xs shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                        globalMetrics.onTimeRate >= 90 ? "bg-green-100 text-green-700" :
                        globalMetrics.onTimeRate >= 75 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        Taux: {globalMetrics.onTimeRate}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {historiqueOrders.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-[#eef2f5] rounded-3xl shadow-[inset_6px_6px_12px_#b8c2ca,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center">
                      <Package className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Aucune commande livrée</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/30 backdrop-blur-sm border-b border-white/40">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">N° Commande</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Articles</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ramassage</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Livraison</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Durée</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Performance</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/30">
                          {paginatedHistoriqueOrders.map((order) => {
                            const client = clients.find(c => c.id === order.clientId);
                            const duration = order.actualDeliveryDate ? differenceInHours(parseISO(order.actualDeliveryDate), parseISO(order.createdAt)) : null;
                            const isOnTime = duration !== null && duration <= 24;
                            const isWarning = duration !== null && duration > 24 && duration <= 48;
                            const isCritical = duration !== null && duration > 48;

                            return (
                              <tr
                                key={order.id}
                                className="hover:bg-white/30 transition-colors cursor-pointer"
                                onClick={() => openOrderDetail(order)}
                              >
                                <td className="px-4 py-3">
                                  <span className="font-mono font-medium text-gray-800 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-xl text-sm shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                                    #{order.id}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-gray-800 text-sm">{client?.fullName || 'Inconnu'}</p>
                                    <p className="text-xs text-gray-400">{client?.neighborhood || 'Quartier non défini'}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">{order.itemCount || '-'} pièce{order.itemCount !== 1 ? 's' : ''}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">{formatDate(order.scheduledPickupDate, "dd/MM/yyyy")}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">{formatDate(order.actualDeliveryDate || order.scheduledDeliveryDate, "dd/MM/yyyy")}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={cn(
                                    "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                                    duration && isOnTime ? "bg-green-100 text-green-700" :
                                    duration && isWarning ? "bg-yellow-100 text-yellow-700" :
                                    duration && isCritical ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                  )}>
                                    {duration}h
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {isOnTime ? (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs font-medium">Dans les temps</span>
                                      </div>
                                    ) : isWarning ? (
                                      <div className="flex items-center gap-1 text-yellow-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-xs font-medium">Léger retard</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-xs font-medium">Retard important</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button variant="ghost" size="sm" className={neomorphic.button + " text-[#0B676E] h-8 w-8 p-0 border-0"}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalHistoriquePages > 1 && (
                      <div className="px-4 py-3 border-t border-white/40 bg-white/30 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">
                          Affichage de {(historiquePage - 1) * historiqueItemsPerPage + 1} à {Math.min(historiquePage * historiqueItemsPerPage, historiqueOrders.length)} sur {historiqueOrders.length} commandes
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoriquePage(p => Math.max(1, p - 1))}
                            disabled={historiquePage === 1}
                            className={cn(neomorphic.button, "h-8 px-3 text-xs border-0")}
                          >
                            <ChevronLeft className="h-3 w-3 mr-1" />
                            Précédent
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalHistoriquePages) }, (_, i) => {
                              let pageNum;
                              if (totalHistoriquePages <= 5) {
                                pageNum = i + 1;
                              } else if (historiquePage <= 3) {
                                pageNum = i + 1;
                              } else if (historiquePage >= totalHistoriquePages - 2) {
                                pageNum = totalHistoriquePages - 4 + i;
                              } else {
                                pageNum = historiquePage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={historiquePage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setHistoriquePage(pageNum)}
                                  className={cn(
                                    "h-8 w-8 p-0 text-xs border-0",
                                    historiquePage === pageNum ? neomorphic.buttonPrimary : neomorphic.button
                                  )}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoriquePage(p => Math.min(totalHistoriquePages, p + 1))}
                            disabled={historiquePage === totalHistoriquePages}
                            className={cn(neomorphic.button, "h-8 px-3 text-xs border-0")}
                          >
                            Suivant
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="px-4 py-3 border-t border-white/40 bg-white/30 backdrop-blur-sm flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-[10px] text-gray-500">≤24h (optimal)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-[10px] text-gray-500">24-48h (alerte)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-[10px] text-gray-500">&gt;48h (critique)</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(neomorphic.button, "text-xs text-[#0B676E] border-0")}
                        onClick={() => {
                          toast({ title: "Export", description: "Export en cours de développement" });
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exporter
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ==================== ONGLET ANALYSE ==================== */}
            <TabsContent value="analyse" className="mt-0 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <MetricCard title="Total commandes" value={globalMetrics.totalOrders} icon={Package} color="teal" />
                <MetricCard title="Taux ponctualité" value={`${globalMetrics.onTimeRate}%`} icon={Target} color="green" trend={globalMetrics.onTimeRate > 85 ? 5 : -3} />
                <MetricCard title="Commandes en retard" value={globalMetrics.delayedOrders} icon={AlertTriangle} color="red" trend={globalMetrics.delayedOrders > 5 ? 20 : -10} />
                <MetricCard title="Temps moyen" value={`${globalMetrics.avgCompletionTime}h`} icon={Hourglass} color="purple" trend={globalMetrics.avgCompletionTime < 30 ? -8 : 12} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                  <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 text-gray-700">
                    <Layers className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                    Performance par étape
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {stageMetrics.slice(0, isMobile ? 4 : 8).map(stage => (
                      <div key={stage.stage}>
                        <div className="flex justify-between text-xs mb-1">
                          <div className="flex items-center gap-1">
                            {stage.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                            {stage.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                            {stage.trend === 'stable' && <Minus className="h-3 w-3 text-gray-400" />}
                            <span className="text-xs sm:text-sm">{stage.label}</span>
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            stage.avgTimeHours > stage.slaHours ? "text-red-500" : "text-green-500"
                          )}>
                            {stage.avgTimeHours}h / {stage.slaHours}h
                          </span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <div className={cn(
                            "h-full rounded-full transition-all",
                            stage.avgTimeHours > stage.slaHours ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-[#0B676E] to-teal-400"
                          )} style={{ width: `${Math.min(100, (stage.avgTimeHours / stage.slaHours) * 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-1">
                          <span>{stage.count} commande{stage.count !== 1 ? 's' : ''}</span>
                          <span>Retards: {stage.delayPercentage}%</span>
                          <span>Charge: {stage.utilization}%</span>
                          <span>Efficacité: {stage.efficiency}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                  <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 text-gray-700">
                    <ChartSpline className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                    Métriques clés
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Croissance hebdomadaire</span>
                        <span className={cn("font-medium", globalMetrics.weeklyGrowth >= 0 ? "text-green-600" : "text-red-600")}>
                          {globalMetrics.weeklyGrowth >= 0 ? "+" : ""}{globalMetrics.weeklyGrowth}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                        <div className={cn(
                          "h-full rounded-full",
                          globalMetrics.weeklyGrowth >= 0 ? "bg-green-500" : "bg-red-500"
                        )} style={{ width: `${Math.min(100, Math.abs(globalMetrics.weeklyGrowth))}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Volume journalier moyen</span>
                        <span className="font-medium text-[#0B676E]">{globalMetrics.avgDailyVolume} commandes/jour</span>
                      </div>
                      <div className="h-1.5 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                        <div className="h-full bg-[#0B676E] rounded-full" style={{ width: `${Math.min(100, (globalMetrics.avgDailyVolume / 20) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Score de risque</span>
                        <span className={cn(
                          "font-medium",
                          globalMetrics.riskScore < 30 ? "text-green-600" : globalMetrics.riskScore < 60 ? "text-yellow-600" : "text-red-600"
                        )}>{globalMetrics.riskScore}%</span>
                      </div>
                      <div className="h-1.5 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                        <div className={cn(
                          "h-full rounded-full",
                          globalMetrics.riskScore < 30 ? "bg-green-500" : globalMetrics.riskScore < 60 ? "bg-yellow-500" : "bg-red-500"
                        )} style={{ width: `${globalMetrics.riskScore}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-[#eef2f5] rounded-2xl p-2 text-center shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                        <p className="text-[10px] text-gray-500">Heures de pointe</p>
                        <p className="text-xs font-semibold text-gray-700">{globalMetrics.peakHours.join(", ")}</p>
                      </div>
                      <div className="bg-[#eef2f5] rounded-2xl p-2 text-center shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
                        <p className="text-[10px] text-gray-500">Articles traités</p>
                        <p className="text-xs font-semibold text-gray-700">{globalMetrics.totalItemsProcessed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {riskAlerts.length > 0 && (
                <div className={cn(neomorphic.card, "p-3 sm:p-4 border-0")}>
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <AlertOctagon className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800 text-xs sm:text-sm">Alertes critiques</h4>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    {riskAlerts.slice(0, isMobile ? 2 : 3).map((alert, i) => (
                      <div key={i} className={cn(
                        "p-2 rounded-2xl",
                        alert.level === 'danger' ? "bg-red-100" : alert.level === 'warning' ? "bg-yellow-100" : "bg-blue-100"
                      )}>
                        <div className="flex items-center gap-2">
                          {alert.level === 'danger' && <AlertCircle className="h-3 w-3 text-red-600" />}
                          {alert.level === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                          {alert.level === 'info' && <Info className="h-3 w-3 text-blue-600" />}
                          <span className="font-medium text-xs text-gray-800">{alert.title}</span>
                        </div>
                        <p className="text-amber-700 text-[10px] sm:text-xs mt-0.5">{alert.description}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Action: {alert.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {intelligentRecommendations.length > 0 && (
                <div className={cn(neomorphic.card, "p-3 sm:p-4 border-0")}>
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                    <h4 className="font-semibold text-[#0B676E] text-xs sm:text-sm">Recommandations intelligentes</h4>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    {intelligentRecommendations.slice(0, isMobile ? 2 : 3).map(rec => (
                      <div key={rec.id} className={cn(
                        "p-2 rounded-2xl transition-all",
                        rec.priority === 'high' ? "bg-indigo-100 border-l-4 border-l-red-400" : "bg-white/40"
                      )}>
                        <div className="flex items-center gap-2">
                          {rec.priority === 'high' && <AlertCircle className="h-3 w-3 text-red-500" />}
                          {rec.type === 'bottleneck' && <Gauge className="h-3 w-3 text-orange-500" />}
                          {rec.type === 'capacity' && <Users className="h-3 w-3 text-blue-500" />}
                          {rec.type === 'prediction' && <Brain className="h-3 w-3 text-purple-500" />}
                          <p className="font-medium text-xs text-gray-800">{rec.title}</p>
                          <Badge className={cn(
                            "text-[10px] shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]",
                            rec.timeframe === 'immediate' ? "bg-red-100 text-red-700" :
                            rec.timeframe === 'short' ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                          )}>{rec.timeframe === 'immediate' ? 'Urgent' : rec.timeframe === 'short' ? 'Court terme' : 'Moyen terme'}</Badge>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-0.5">{rec.description}</p>
                        <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                          <span>Impact: {rec.impact}</span>
                          <span>•</span>
                          <span>ROI: {rec.roi}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ==================== ONGLET PLANNING ==================== */}
            <TabsContent value="planning" className="mt-0">
              <PlanningIntelligentComponent
                orders={orders}
                users={users}
                onOrderClick={handlePlanningOrderClick}
              />
            </TabsContent>
          </Tabs>

          {/* ==================== DIALOGUES ==================== */}

          {/* Dialog Détails Commande */}
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className={cn(
              "max-w-4xl max-h-[85vh] overflow-y-auto p-0 w-[95vw] sm:w-full",
              neomorphic.glass,
              "rounded-3xl border border-white/60"
            )}>
              {selectedOrderDetail && (() => {
                const client = clients.find(c => c.id === selectedOrderDetail.clientId);
                const isLate = getOrderCountdown(selectedOrderDetail, now)?.isLate || false;
                const duration = selectedOrderDetail.actualDeliveryDate ? differenceInHours(parseISO(selectedOrderDetail.actualDeliveryDate), parseISO(selectedOrderDetail.createdAt)) : null;
                return (
                  <div className="space-y-0">
                    <div className={cn(
                      "relative overflow-hidden rounded-t-3xl p-4 sm:p-5 text-white",
                      isLate ? "bg-gradient-to-r from-red-600 to-orange-600" : "bg-gradient-to-r from-[#0B676E] to-teal-600"
                    )}>
                      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                            <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-xl font-bold">Commande #{selectedOrderDetail.id}</h2>
                            <p className="text-white/80 text-[10px] sm:text-sm">
                              Créée le {formatDate(selectedOrderDetail.createdAt, "dd MMMM yyyy à HH:mm")}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(selectedOrderDetail.status, isLate)}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                            <span className="font-semibold text-xs sm:text-sm text-gray-700">Client</span>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <p className="font-medium text-gray-800 text-sm sm:text-base">{client?.fullName || 'Client inconnu'}</p>
                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client?.phone || '-'}</span>
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client?.email?.substring(0, 20) || '-'}</span>
                            </div>
                            <div className="flex items-start gap-1 text-xs text-gray-600">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{client?.address || 'Adresse non renseignée'}</span>
                            </div>
                          </div>
                        </div>
                        <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                            <span className="font-semibold text-xs sm:text-sm text-gray-700">Commande</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div>
                              <p className="text-[10px] sm:text-xs text-gray-500">Articles</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-800">{selectedOrderDetail.itemCount || '-'} pièce{selectedOrderDetail.itemCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-gray-500">Durée</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-800">{duration ? `${duration}h` : 'En cours'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-gray-500">Montant base</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-800">{selectedOrderDetail.baseAmount ? `${selectedOrderDetail.baseAmount} FCFA` : '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-gray-500">Supplément</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-800">{selectedOrderDetail.overageAmount ? `${selectedOrderDetail.overageAmount} FCFA` : '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                          <span className="font-semibold text-xs sm:text-sm text-gray-700">Calendrier</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-gray-500">Ramassage prévu</p>
                              <p className="font-semibold text-xs sm:text-sm text-gray-800">{formatDate(selectedOrderDetail.scheduledPickupDate, "dd MMMM yyyy")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center flex-shrink-0">
                              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-gray-500">Livraison prévue</p>
                              <p className="font-semibold text-xs sm:text-sm text-gray-800">{formatDate(selectedOrderDetail.scheduledDeliveryDate, "dd MMMM yyyy")}</p>
                            </div>
                          </div>
                          {selectedOrderDetail.actualDeliveryDate && (
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-gray-500">Livrée le</p>
                                <p className="font-semibold text-xs sm:text-sm text-gray-800">{formatDate(selectedOrderDetail.actualDeliveryDate, "dd MMMM yyyy")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedOrderDetail.specialInstructions && (
                        <div className={cn(neomorphic.card, "p-3 sm:p-4 border-0 bg-amber-50")}>
                          <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                            <span className="font-semibold text-xs sm:text-sm text-amber-800">Instructions spéciales</span>
                          </div>
                          <p className="text-amber-700 text-xs sm:text-sm italic">"{selectedOrderDetail.specialInstructions}"</p>
                        </div>
                      )}

                      {selectedOrderDetail.notes && selectedOrderDetail.notes.length > 0 && (
                        <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                            <span className="font-semibold text-xs sm:text-sm text-gray-700">Notes ({selectedOrderDetail.notes.length})</span>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedOrderDetail.notes.slice(0, isMobile ? 3 : 5).map(note => (
                              <NoteItem key={note.id} note={note} onMarkAsRead={() => markNoteAsRead(note.id, selectedOrderDetail.id)} />
                            ))}
                          </div>
                          {selectedOrderDetail.notes.length > (isMobile ? 3 : 5) && (
                            <p className="text-[10px] text-gray-400 text-center mt-2">+{selectedOrderDetail.notes.length - (isMobile ? 3 : 5)} autres notes...</p>
                          )}
                        </div>
                      )}

                      <div className={cn(neomorphic.card, "p-3 sm:p-4")}>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Workflow className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                          <span className="font-semibold text-xs sm:text-sm text-gray-700">Progression</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progression globale</span>
                            <span className="font-semibold">{Math.round(((WORKFLOW_STEPS.findIndex(s => s.status === selectedOrderDetail.status) + 1) / WORKFLOW_STEPS.length) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-[#eef2f5] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <div className="h-full bg-gradient-to-r from-[#0B676E] to-teal-400 rounded-full" style={{ width: `${((WORKFLOW_STEPS.findIndex(s => s.status === selectedOrderDetail.status) + 1) / WORKFLOW_STEPS.length) * 100}%` }} />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {WORKFLOW_STEPS.map((step, idx) => {
                              const isCompleted = idx <= WORKFLOW_STEPS.findIndex(s => s.status === selectedOrderDetail.status);
                              return (
                                <Badge key={step.status} variant={isCompleted ? "default" : "outline"} className={cn(
                                  isCompleted ? "bg-[#0B676E] text-white border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff]" : "bg-[#eef2f5] text-gray-400 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff] border-0",
                                  "text-[10px] sm:text-xs"
                                )}>
                                  {step.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className={cn(neomorphic.button, "w-full sm:w-auto border-0")}>
                          Fermer
                        </Button>
                        <Button
                          onClick={() => { setSelectedOrder(selectedOrderDetail); setIsOrderDetailsOpen(true); setDetailDialogOpen(false); }}
                          className={cn(neomorphic.buttonPrimary, "w-full sm:w-auto")}
                        >
                          Voir plus <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </DialogFooter>
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Dialog Notes */}
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogContent className={cn(
              "max-w-2xl rounded-3xl w-[95vw] sm:w-full",
              neomorphic.glass,
              "border border-white/60"
            )}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-800">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                  Notes - Commande #{selectedOrderForNote?.id}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {isLoadingNotes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#0B676E]" />
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2 pr-2">
                        {selectedOrderForNote?.notes?.length ? (
                          [...selectedOrderForNote.notes]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(n => <NoteItem key={n.id} note={n} onMarkAsRead={() => markNoteAsRead(n.id, selectedOrderForNote!.id)} />)
                        ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">Aucune note</div>
                        )}
                      </div>
                    </ScrollArea>
                    <Textarea
                      placeholder="Nouvelle note..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className={cn(neomorphic.input, "text-sm")}
                      rows={3}
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button variant="outline" onClick={() => setNoteDialogOpen(false)} className={cn(neomorphic.button, "w-full sm:w-auto border-0")}>
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSaveNote}
                        disabled={!newNoteContent.trim() || isSavingNote}
                        className={cn(neomorphic.buttonPrimary, "w-full sm:w-auto")}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Report */}
          <Dialog open={rescheduleDialog.open} onOpenChange={(open) => !open && setRescheduleDialog({ open: false, orderId: 0 })}>
            <DialogContent className={cn(
              "sm:max-w-md rounded-3xl w-[95vw] sm:w-full",
              neomorphic.glass,
              "border border-white/60"
            )}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-800">
                  <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  Reporter le ramassage
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className={cn(neomorphic.card, "p-3")}>
                  <p className="text-sm font-medium">Commande #{rescheduleDialog.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">Client: {rescheduleDialog.clientName}</p>
                  <p className="text-xs text-gray-500">Date actuelle: {rescheduleDialog.currentDate}</p>
                </div>
                <Input
                  type="date"
                  value={newPickupDate}
                  onChange={(e) => setNewPickupDate(e.target.value)}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  className={cn(neomorphic.input, "text-sm")}
                />
                <Select value={rescheduleReason} onValueChange={setRescheduleReason}>
                  <SelectTrigger className={cn(neomorphic.input, "text-sm")}>
                    <SelectValue placeholder="Raison du report" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#eef2f5] rounded-2xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff] border-0">
                    <SelectItem value="Client absent">Client absent</SelectItem>
                    <SelectItem value="Report demandé">Report demandé</SelectItem>
                    <SelectItem value="Problème logistique">Problème logistique</SelectItem>
                  </SelectContent>
                </Select>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, orderId: 0 })} className={cn(neomorphic.button, "w-full sm:w-auto border-0")}>
                    Annuler
                  </Button>
                  <Button onClick={handleReschedule} disabled={!newPickupDate || isRescheduling} className={cn(neomorphic.buttonPrimary, "w-full sm:w-auto")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Confirmer
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Changement Statut */}
          <AlertDialog open={statusChangeDialog.open} onOpenChange={(open) => !open && setStatusChangeDialog({ ...statusChangeDialog, open: false })}>
            <AlertDialogContent className={cn(
              "w-[95vw] sm:w-full",
              neomorphic.glass,
              "rounded-3xl border border-white/60"
            )}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg text-gray-800">Confirmer le changement</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Passer de {WORKFLOW_STEPS.find(s => s.status === statusChangeDialog.currentStatus)?.label} à {WORKFLOW_STEPS.find(s => s.status === statusChangeDialog.newStatus)?.label} ?
                  {statusChangeDialog.requiresItemCount && (
                    <div className="mt-3">
                      <label className="text-sm font-medium">Nombre d'articles</label>
                      <Input
                        type="number"
                        min="1"
                        value={itemCountInput || ''}
                        onChange={(e) => setItemCountInput(parseInt(e.target.value) || 0)}
                        className={cn(neomorphic.input, "mt-1 text-sm")}
                        placeholder="Saisir le nombre"
                      />
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className={cn(neomorphic.button, "w-full sm:w-auto border-0")}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={confirmStatusChange} className={cn(neomorphic.buttonPrimary, "w-full sm:w-auto")}>Confirmer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </TooltipProvider>
  );
};

export default OrdersTab;