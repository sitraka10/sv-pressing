// src/pages/OrdersTab/index.tsx
// Interface 100% flat, 100% textuelle, design pro — bleu principal (navbar).
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format, parseISO, differenceInHours, addDays } from 'date-fns';

import { Order, User, Delivery, OrdersTabProps } from './types';
import { WORKFLOW_STEPS } from './constants';
import { formatDate, getStatusBadge } from './utils/format';
import { getOrderCountdown } from './utils/sla';
import {
  calculateOverallProgress, calculateStageMetrics, calculateGlobalMetrics,
  generateRiskAlerts, generateIntelligentRecommendations,
  calculateTimeSeriesData, calculateStageTransitions
} from './utils/bi';
import { useResponsive } from './hooks/useResponsive';
import { MetricCard } from './components/MetricCard';
import { NoteItem } from './components/NoteItem';
import { MobileOrderCard, DesktopOrderCard } from './components/OrderCard';
import { PlanningIntelligentComponent } from './components/PlanningIntelligent';

/* ============================================================
   DESIGN SYSTEM — bleu principal
============================================================ */
const ui = {
  card: "bg-white rounded-xl border border-slate-200",
  input: "h-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-300",
  btn: "h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50",
  btnPrimary: "h-8 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700",
  btnDanger: "h-8 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700",
  dialog: "rounded-xl border border-slate-200 bg-white shadow-xl",
  well: "rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5",
  h1: "text-base font-semibold text-slate-900",
  h2: "text-sm font-semibold text-slate-900",
  h3: "text-xs font-semibold uppercase tracking-wide text-slate-500",
  text: "text-xs text-slate-500",
  value: "text-2xl font-semibold text-slate-900 tabular-nums",
};

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders, users, deliveries,
  handleStatusChange, handleAddNote,
  setSelectedOrder, setIsOrderDetailsOpen
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile } = useResponsive();

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

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { setOrdersWithNotes(orders); }, [orders]);
  useEffect(() => { const t = setTimeout(() => setCommittedSearchQuery(searchQuery), 300); return () => clearTimeout(t); }, [searchQuery]);
  useEffect(() => { setGestionPage(1); }, [selectedStatus, committedSearchQuery]);
  useEffect(() => { setHistoriquePage(1); }, [activeTab]);
  useEffect(() => { setItemsPerPage(isMobile ? 5 : 10); setHistoriqueItemsPerPage(isMobile ? 5 : 10); }, [isMobile]);

  /* ---- Logique métier ---- */
  const clients = useMemo(() => Array.isArray(users) ? users.filter(u => u.role === "client") : [], [users]);
  const lateOrders = useMemo(() => ordersWithNotes.filter(o => o.status !== "delivered" && (getOrderCountdown(o, now)?.isLate || false)), [ordersWithNotes, now]);

  const filteredGestionOrders = useMemo(() => {
    let filtered = ordersWithNotes.filter(order => {
      if (order.status === "delivered") return false;
      if (selectedStatus === 'late') return getOrderCountdown(order, now)?.isLate || false;
      if (selectedStatus && order.status !== selectedStatus) return false;
      if (committedSearchQuery) {
        const client = clients.find(c => c.id === order.clientId);
        const s = committedSearchQuery.toLowerCase();
        return order.id.toString().includes(s) || client?.fullName.toLowerCase().includes(s);
      }
      return true;
    });
    if (showOnlyNotes) filtered = filtered.filter(o => o.notes && o.notes.length > 0);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersWithNotes, selectedStatus, committedSearchQuery, clients, now, showOnlyNotes]);

  const paginatedGestionOrders = useMemo(() => filteredGestionOrders.slice((gestionPage - 1) * itemsPerPage, gestionPage * itemsPerPage), [filteredGestionOrders, gestionPage, itemsPerPage]);
  const totalGestionPages = Math.ceil(filteredGestionOrders.length / itemsPerPage);

  const historiqueOrders = useMemo(() => orders
    .filter(o => o.status === 'delivered')
    .sort((a, b) => new Date(b.actualDeliveryDate || b.updatedAt || b.createdAt).getTime() - new Date(a.actualDeliveryDate || a.updatedAt || a.createdAt).getTime()),
  [orders]);

  const paginatedHistoriqueOrders = useMemo(() =>
    historiqueOrders.slice((historiquePage - 1) * historiqueItemsPerPage, historiquePage * historiqueItemsPerPage),
    [historiqueOrders, historiquePage, historiqueItemsPerPage]);
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

  /* ---- Handlers ---- */
  const handleStatusClick = (status: string) => setSelectedStatus(selectedStatus === status ? null : status);

  const markNoteAsRead = useCallback(async (noteId: number, orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/notes/${noteId}/read`, { method: 'PATCH' });
      if (response.ok) {
        setOrdersWithNotes(prev => prev.map(order => {
          if (order.id === orderId && order.notes) {
            return { ...order, notes: order.notes.map(note => note.id === noteId ? { ...note, isRead: true } : note) };
          }
          return order;
        }));
        if (selectedOrderForNote?.id === orderId) {
          setSelectedOrderForNote(prev => prev ? { ...prev, notes: prev.notes?.map(note => note.id === noteId ? { ...note, isRead: true } : note) } : prev);
        }
      }
    } catch (error) { console.error("Erreur marquage note:", error); }
  }, [selectedOrderForNote]);

  const handleOpenNoteDialog = useCallback(async (order: Order) => {
    setSelectedOrderForNote(order); setNewNoteContent(""); setIsLoadingNotes(true); setNoteDialogOpen(true);
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
    } finally { setIsLoadingNotes(false); }
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
      toast({ title: "Note ajoutée" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter la note", variant: "destructive" });
    } finally { setIsSavingNote(false); }
  }, [selectedOrderForNote, newNoteContent, user, handleAddNote, toast]);

  const handleReschedule = async () => {
    if (!newPickupDate) { toast({ title: "Date requise", description: "Sélectionnez une date", variant: "destructive" }); return; }
    const selectedDate = new Date(newPickupDate);
    if (selectedDate <= new Date()) { toast({ title: "Date invalide", description: "La date doit être dans le futur", variant: "destructive" }); return; }
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
      setRescheduleDialog({ open: false, orderId: 0 }); setNewPickupDate(""); setRescheduleReason("");
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de reporter", variant: "destructive" });
    } finally { setIsRescheduling(false); }
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
      toast({ title: "Nombre d'articles requis", description: "Saisissez le nombre", variant: "destructive" });
      return;
    }
    handleStatusChange(orderId, newStatus, requiresItemCount ? itemCountInput : undefined);
    setStatusChangeDialog({ open: false, orderId: 0, currentStatus: '', newStatus: '' });
    setItemCountInput(0);
    toast({ title: "Statut mis à jour", description: `Commande #${orderId}` });
  };

  const openOrderDetail = (order: Order) => {
    const client = clients.find(c => c.id === order.clientId);
    const delivery = deliveries.find(d => d.orderId === order.id);
    setSelectedOrderDetail({ ...order, clientDetails: client, deliveryDetails: delivery });
    setDetailDialogOpen(true);
  };

  const toggleOrderExpand = (orderId: number) => setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  const handlePlanningOrderClick = (order: Order) => { setSelectedOrder(order); setIsOrderDetailsOpen(true); };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <TooltipProvider>
      <div className="space-y-4">

        {/* ===== TABS — bleu actif ===== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-4 overflow-x-auto">
            <TabsList className="inline-flex w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-1">
              <TabsTrigger
                value="gestion"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Suivi
                {lateOrders.length > 0 && (
                  <span className="ml-1 rounded bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">
                    {lateOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="historique" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Historique
              </TabsTrigger>
              <TabsTrigger value="analyse" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Analyse
              </TabsTrigger>
              <TabsTrigger value="planning" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Planning
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ==================== GESTION ==================== */}
          <TabsContent value="gestion" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className={cn(ui.card, "lg:col-span-3 p-5")}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className={ui.h1}>Commandes en cours</h2>
                    <p className={cn(ui.text, "mt-0.5")}>Suivi en temps réel</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {globalMetrics.delayedOrders > 0 && (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        {globalMetrics.delayedOrders} en retard
                      </span>
                    )}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <span className="text-xl font-semibold text-slate-900 tabular-nums">{filteredGestionOrders.length}</span>
                      <span className="text-xs text-slate-500 ml-1">active{filteredGestionOrders.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-slate-500">Progression</p>
                      <span className="text-[10px] font-medium text-slate-400">
                        {overallProgress.percent < 33 ? "Début" : overallProgress.percent < 66 ? "En cours" : "Avancé"}
                      </span>
                    </div>
                    <p className={ui.value}>{overallProgress.percent}%</p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${overallProgress.percent}%` }} />
                    </div>
                  </div>

                  <div className={cn("rounded-lg border p-3", globalMetrics.delayedOrders > 0 ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50/60")}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn("text-[11px]", globalMetrics.delayedOrders > 0 ? "text-red-700" : "text-slate-500")}>En retard</p>
                    </div>
                    <p className={cn(ui.value, globalMetrics.delayedOrders > 0 ? "text-red-600" : "text-slate-900")}>
                      {globalMetrics.delayedOrders}
                    </p>
                    <p className={cn("text-[10.5px] mt-0.5", globalMetrics.delayedOrders > 0 ? "text-red-600/80" : "text-slate-500")}>
                      sur SLA
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-slate-500">Ponctualité</p>
                      <span className={cn("text-[10px] font-medium",
                        globalMetrics.onTimeRate >= 90 ? "text-emerald-600"
                        : globalMetrics.onTimeRate >= 75 ? "text-amber-600" : "text-red-600")}>
                        {globalMetrics.onTimeRate >= 90 ? "Excellent" : globalMetrics.onTimeRate >= 75 ? "Correct" : "À améliorer"}
                      </span>
                    </div>
                    <p className={ui.value}>{globalMetrics.onTimeRate}%</p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full",
                        globalMetrics.onTimeRate >= 90 ? "bg-emerald-500"
                        : globalMetrics.onTimeRate >= 75 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${globalMetrics.onTimeRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border transition-all cursor-pointer",
                  lateOrders.length > 0 ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50/60",
                  selectedStatus === 'late' && "ring-2 ring-red-500 ring-offset-2"
                )}
                onClick={() => setSelectedStatus(selectedStatus === 'late' ? null : 'late')}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className={cn("text-xs font-medium", lateOrders.length > 0 ? "text-red-700" : "text-slate-600")}>Commandes urgentes</p>
                  </div>
                  <p className={cn("text-3xl font-semibold tabular-nums", lateOrders.length > 0 ? "text-red-600" : "text-slate-900")}>{lateOrders.length}</p>
                  <p className={cn("text-[11px] mt-1", lateOrders.length > 0 ? "text-red-600/80" : "text-slate-500")}>en retard sur le SLA</p>
                  <div className={cn("mt-3 text-[11px] font-medium", lateOrders.length > 0 ? "text-red-600" : "text-slate-600")}>Cliquer pour filtrer</div>
                </div>
              </div>
            </div>

            <div className={cn(ui.card, "p-4")}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-medium text-slate-700">Filtrer par étape</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="show-notes-filter" checked={showOnlyNotes} onCheckedChange={setShowOnlyNotes} className="data-[state=checked]:bg-blue-600" />
                    <Label htmlFor="show-notes-filter" className="text-xs text-slate-600 cursor-pointer">Commandes avec notes</Label>
                  </div>
                  {selectedStatus && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStatus(null)} className="text-xs h-7 px-2 text-red-600 hover:bg-red-50 rounded-md">Effacer</Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {WORKFLOW_STEPS.filter(s => s.status !== 'delivered').map(step => {
                  const count = statusCounts[step.status] || 0;
                  const active = selectedStatus === step.status;
                  return (
                    <button key={step.status} type="button" onClick={() => handleStatusClick(step.status)}
                      className={cn("flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        active ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50")}>
                      <span className={cn("text-[11px] font-medium truncate", active ? "text-blue-700" : "text-slate-500")}>{step.label}</span>
                      <span className={cn("text-2xl font-semibold tabular-nums leading-none", active ? "text-blue-700" : count > 0 ? "text-slate-900" : "text-slate-300")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={cn(ui.card, "p-4")}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input placeholder="Rechercher par n° ou client…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(ui.input, "flex-1")} />
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className={cn(ui.input, "w-32")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 / page</SelectItem>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>
                {filteredGestionOrders.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setGestionPage(p => Math.max(1, p - 1))} disabled={gestionPage === 1} className={ui.btn}>Préc.</Button>
                    <span className="text-xs text-slate-600">{gestionPage} / {totalGestionPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setGestionPage(p => Math.min(totalGestionPages, p + 1))} disabled={gestionPage === totalGestionPages} className={ui.btn}>Suiv.</Button>
                  </div>
                )}
              </div>
            </div>

            {paginatedGestionOrders.length === 0 ? (
              <div className={cn(ui.card, "py-12 text-center")}>
                <h3 className="text-sm font-semibold text-slate-800">Aucune commande</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedStatus === 'late' ? "Aucun retard" : selectedStatus ? `Aucune commande « ${WORKFLOW_STEPS.find(s => s.status === selectedStatus)?.label} »` : "Aucun résultat"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedGestionOrders.map((order, idx) => (
                  isMobile
                    ? <MobileOrderCard key={order.id} order={order} idx={idx} clients={clients} now={now}
                        handleStatusChange={handleStatusChange}
                        handleStatusChangeRequest={handleStatusChangeRequest}
                        handleOpenNoteDialog={handleOpenNoteDialog}
                        openOrderDetail={openOrderDetail}
                        setRescheduleDialog={setRescheduleDialog}
                        expandedOrderId={expandedOrderId}
                        toggleOrderExpand={toggleOrderExpand} />
                    : <DesktopOrderCard key={order.id} order={order} idx={idx} clients={clients} now={now}
                        handleStatusChange={handleStatusChange}
                        handleStatusChangeRequest={handleStatusChangeRequest}
                        handleOpenNoteDialog={handleOpenNoteDialog}
                        openOrderDetail={openOrderDetail}
                        setRescheduleDialog={setRescheduleDialog} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ==================== HISTORIQUE ==================== */}
          <TabsContent value="historique" className="mt-0">
            <div className={cn(ui.card, "overflow-hidden")}>
              <div className="border-b border-slate-100 px-5 py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={ui.h2}>Historique des commandes livrées</h3>
                    <p className={cn(ui.text, "mt-0.5")}>
                      {historiqueOrders.length} commandes • Temps moyen : {globalMetrics.avgCompletionTime}h • Ponctualité : {globalMetrics.onTimeRate}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={historiqueItemsPerPage.toString()} onValueChange={(v) => { setHistoriqueItemsPerPage(Number(v)); setHistoriquePage(1); }}>
                      <SelectTrigger className={cn(ui.input, "w-24 h-8 text-xs")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 / page</SelectItem>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">Livrées</span>
                    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium",
                      globalMetrics.onTimeRate >= 90 ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-700")}>
                      Taux : {globalMetrics.onTimeRate}%
                    </span>
                  </div>
                </div>
              </div>

              {historiqueOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-500">Aucune commande livrée</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-100 bg-slate-50/60">
                        <tr>
                          {["N° Commande", "Client", "Articles", "Ramassage", "Livraison", "Durée", "Performance", "Actions"].map((h, i) => (
                            <th key={i} className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500", i === 7 ? "text-center" : "text-left")}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedHistoriqueOrders.map((order) => {
                          const client = clients.find(c => c.id === order.clientId);
                          const duration = order.actualDeliveryDate ? differenceInHours(parseISO(order.actualDeliveryDate), parseISO(order.createdAt)) : null;
                          const isOnTime = duration !== null && duration <= 24;
                          const isWarning = duration !== null && duration > 24 && duration <= 48;
                          const isCritical = duration !== null && duration > 48;

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => openOrderDetail(order)}>
                              <td className="px-4 py-3">
                                <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-mono text-blue-700">#{order.id}</span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs font-medium text-slate-900">{client?.fullName || 'Inconnu'}</p>
                                <p className="text-[11px] text-slate-500">{client?.neighborhood || 'Quartier non défini'}</p>
                              </td>
                              <td className="px-4 py-3"><span className="text-xs text-slate-700">{order.itemCount || '-'} pièce{order.itemCount !== 1 ? 's' : ''}</span></td>
                              <td className="px-4 py-3"><span className="text-xs text-slate-700">{formatDate(order.scheduledPickupDate, "dd/MM/yyyy")}</span></td>
                              <td className="px-4 py-3"><span className="text-xs text-slate-700">{formatDate(order.actualDeliveryDate || order.scheduledDeliveryDate, "dd/MM/yyyy")}</span></td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                                  duration === null ? "bg-slate-100 text-slate-500"
                                  : isOnTime ? "bg-slate-100 text-slate-700"
                                  : isWarning ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700")}>
                                  {duration !== null ? `${duration}h` : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("text-xs",
                                  duration === null ? "text-slate-400"
                                  : isOnTime ? "text-slate-700" : isWarning ? "text-amber-700" : "text-red-700")}>
                                  {duration === null ? "Non défini" : isOnTime ? "Dans les temps" : isWarning ? "Léger retard" : "Retard important"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:bg-slate-100">Voir</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalHistoriquePages > 1 && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        {(historiquePage - 1) * historiqueItemsPerPage + 1}–{Math.min(historiquePage * historiqueItemsPerPage, historiqueOrders.length)} sur {historiqueOrders.length} commandes
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setHistoriquePage(p => Math.max(1, p - 1))} disabled={historiquePage === 1} className={ui.btn}>Préc.</Button>
                        {Array.from({ length: Math.min(5, totalHistoriquePages) }, (_, i) => {
                          let pageNum;
                          if (totalHistoriquePages <= 5) pageNum = i + 1;
                          else if (historiquePage <= 3) pageNum = i + 1;
                          else if (historiquePage >= totalHistoriquePages - 2) pageNum = totalHistoriquePages - 4 + i;
                          else pageNum = historiquePage - 2 + i;
                          return (
                            <Button key={pageNum} size="sm" className={cn("w-8", historiquePage === pageNum ? ui.btnPrimary : ui.btn)} onClick={() => setHistoriquePage(pageNum)}>{pageNum}</Button>
                          );
                        })}
                        <Button variant="outline" size="sm" onClick={() => setHistoriquePage(p => Math.min(totalHistoriquePages, p + 1))} disabled={historiquePage === totalHistoriquePages} className={ui.btn}>Suiv.</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ==================== ANALYSE ==================== */}
          <TabsContent value="analyse" className="mt-0 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard title="Total commandes" value={globalMetrics.totalOrders} color="teal" />
              <MetricCard title="Taux ponctualité" value={`${globalMetrics.onTimeRate}%`} color="green" trend={globalMetrics.onTimeRate > 85 ? 5 : -3} />
              <MetricCard title="En retard" value={globalMetrics.delayedOrders} color="red" trend={globalMetrics.delayedOrders > 5 ? 20 : -10} />
              <MetricCard title="Temps moyen" value={`${globalMetrics.avgCompletionTime}h`} color="purple" trend={globalMetrics.avgCompletionTime < 30 ? -8 : 12} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={cn(ui.card, "p-5")}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={ui.h2}>Performance par étape</h4>
                  <span className={ui.text}>Temps réel vs SLA</span>
                </div>
                <div className="space-y-4">
                  {stageMetrics.slice(0, isMobile ? 4 : 8).map(stage => {
                    const isLate = stage.avgTimeHours > stage.slaHours;
                    const pct = Math.min(100, (stage.avgTimeHours / stage.slaHours) * 100);
                    return (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-slate-700">{stage.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-semibold tabular-nums", isLate ? "text-red-600" : "text-slate-700")}>{stage.avgTimeHours}h</span>
                            <span className="text-[10.5px] text-slate-400">/ {stage.slaHours}h</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", isLate ? "bg-red-500" : "bg-blue-600")} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
                          <span>{stage.count} cde{stage.count !== 1 ? 's' : ''}</span>
                          <div className="flex items-center gap-3">
                            <span className={stage.delayPercentage > 0 ? "text-red-600" : "text-slate-500"}>Retards: {stage.delayPercentage}%</span>
                            <span>Charge: {stage.utilization}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={cn(ui.card, "p-5 flex flex-col justify-between")}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={ui.h2}>Métriques clés</h4>
                    <span className={ui.text}>Indicateurs de santé</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { l: "Croissance hebdomadaire", v: `${globalMetrics.weeklyGrowth >= 0 ? "+" : ""}${globalMetrics.weeklyGrowth}%`, pct: Math.min(100, Math.abs(globalMetrics.weeklyGrowth)), tone: globalMetrics.weeklyGrowth >= 0 ? "blue" : "red" },
                      { l: "Volume journalier moyen", v: `${globalMetrics.avgDailyVolume} cdes/jour`, pct: Math.min(100, (globalMetrics.avgDailyVolume / 20) * 100), tone: "blue" },
                      { l: "Score de risque", v: `${globalMetrics.riskScore}%`, pct: globalMetrics.riskScore, tone: globalMetrics.riskScore < 30 ? "blue" : globalMetrics.riskScore < 60 ? "amber" : "red" },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-600">{m.l}</span>
                          <span className={cn("font-semibold",
                            m.tone === "red" ? "text-red-600" : m.tone === "amber" ? "text-amber-600" : "text-blue-700")}>{m.v}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full",
                            m.tone === "red" ? "bg-red-500" : m.tone === "amber" ? "bg-amber-500" : "bg-blue-600")}
                            style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-5 mt-5 border-t border-slate-100">
                  <div className={cn(ui.well)}>
                    <p className="text-[10.5px] text-slate-500 mb-0.5">Heures de pointe</p>
                    <p className="text-xs font-semibold text-slate-900">{globalMetrics.peakHours.join(", ") || "—"}</p>
                  </div>
                  <div className={cn(ui.well)}>
                    <p className="text-[10.5px] text-slate-500 mb-0.5">Articles traités</p>
                    <p className="text-xs font-semibold text-slate-900">{globalMetrics.totalItemsProcessed}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {riskAlerts.length > 0 && (
                <div className={cn(ui.card, "p-5")}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={ui.h2}>Alertes critiques</h4>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">{riskAlerts.length} active{riskAlerts.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {riskAlerts.slice(0, isMobile ? 2 : 4).map((alert, i) => (
                      <div key={i} className={cn("rounded-lg border-l-2 p-3 text-xs",
                        alert.level === 'danger' ? "border-red-500 bg-red-50/50"
                        : alert.level === 'warning' ? "border-amber-500 bg-amber-50/50"
                        : "border-blue-500 bg-blue-50/50")}>
                        <p className="font-semibold text-slate-800 mb-0.5">{alert.title}</p>
                        <p className="text-slate-600 leading-relaxed">{alert.description}</p>
                        {alert.action && <p className="text-[10.5px] text-slate-500 mt-1.5">Action : {alert.action}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {intelligentRecommendations.length > 0 && (
                <div className={cn(ui.card, "p-5")}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={ui.h2}>Recommandations</h4>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{intelligentRecommendations.length} suggestion{intelligentRecommendations.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {intelligentRecommendations.slice(0, isMobile ? 2 : 4).map(rec => (
                      <div key={rec.id} className={cn("rounded-lg border-l-2 p-3 text-xs",
                        rec.priority === 'high' ? "border-red-500 bg-red-50/50" : "border-blue-500 bg-blue-50/50")}>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-slate-800">{rec.title}</p>
                          <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide",
                            rec.timeframe === 'immediate' ? "bg-red-100 text-red-700"
                            : rec.timeframe === 'short' ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700")}>
                            {rec.timeframe === 'immediate' ? 'Urgent' : rec.timeframe === 'short' ? 'Court' : 'Moyen'}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{rec.description}</p>
                        <div className="flex gap-3 mt-1.5 text-[10.5px] text-slate-500">
                          <span>Impact : {rec.impact}</span>
                          <span>ROI : {rec.roi}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ==================== PLANNING ==================== */}
          <TabsContent value="planning" className="mt-0">
            <PlanningIntelligentComponent orders={orders} users={users} onOrderClick={handlePlanningOrderClick} />
          </TabsContent>
        </Tabs>

        {/* ==================== DIALOG DÉTAILS — header blanc, brand bleu ===== */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-3xl max-h-[85vh] overflow-y-auto p-0 w-[95vw] sm:w-full")}>
            {selectedOrderDetail && (() => {
              const client = clients.find(c => c.id === selectedOrderDetail.clientId);
              const isLate = getOrderCountdown(selectedOrderDetail, now)?.isLate || false;
              const duration = selectedOrderDetail.actualDeliveryDate
                ? differenceInHours(parseISO(selectedOrderDetail.actualDeliveryDate), parseISO(selectedOrderDetail.createdAt))
                : null;
              const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.status === selectedOrderDetail.status);
              const progressPct = ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;

              return (
                <div>
                  {/* HEADER — blanc, comme la sidebar */}
                  <div className="border-b border-slate-200 px-5 py-4 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Commande #{selectedOrderDetail.id}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Créée le {formatDate(selectedOrderDetail.createdAt, "dd MMMM yyyy à HH:mm")}
                        </p>
                      </div>
                      {isLate && (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          Retard
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="px-5 py-4 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={cn(ui.well)}>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Client</p>
                        <p className="text-sm font-medium text-slate-900">{client?.fullName || 'Client inconnu'}</p>
                        <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                          <p>{client?.phone || '—'}</p>
                          <p>{client?.email || '—'}</p>
                          <p>{client?.address || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className={cn(ui.well)}>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Commande</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><p className="text-slate-500">Articles</p><p className="font-semibold text-slate-900">{selectedOrderDetail.itemCount || '—'}</p></div>
                          <div><p className="text-slate-500">Durée</p><p className="font-semibold text-slate-900">{duration !== null ? `${duration}h` : 'En cours'}</p></div>
                          <div><p className="text-slate-500">Montant base</p><p className="font-semibold text-slate-900">{selectedOrderDetail.baseAmount ? `${selectedOrderDetail.baseAmount} Ar` : '—'}</p></div>
                          <div><p className="text-slate-500">Supplément</p><p className="font-semibold text-slate-900">{selectedOrderDetail.overageAmount ? `${selectedOrderDetail.overageAmount} Ar` : '—'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className={cn(ui.well)}>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Calendrier</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div><p className="text-slate-500">Ramassage prévu</p><p className="font-semibold text-slate-900">{formatDate(selectedOrderDetail.scheduledPickupDate, "dd MMMM yyyy")}</p></div>
                        <div><p className="text-slate-500">Livraison prévue</p><p className="font-semibold text-slate-900">{formatDate(selectedOrderDetail.scheduledDeliveryDate, "dd MMMM yyyy")}</p></div>
                        {selectedOrderDetail.actualDeliveryDate && (
                          <div><p className="text-slate-500">Livrée le</p><p className="font-semibold text-slate-700">{formatDate(selectedOrderDetail.actualDeliveryDate, "dd MMMM yyyy")}</p></div>
                        )}
                      </div>
                    </div>

                    {selectedOrderDetail.specialInstructions && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Instructions spéciales</p>
                        <p className="text-xs text-slate-600 italic">« {selectedOrderDetail.specialInstructions} »</p>
                      </div>
                    )}

                    {selectedOrderDetail.notes && selectedOrderDetail.notes.length > 0 && (
                      <div className={cn(ui.well)}>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Notes ({selectedOrderDetail.notes.length})</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedOrderDetail.notes.slice(0, isMobile ? 3 : 5).map(note => (
                            <NoteItem key={note.id} note={note} onMarkAsRead={() => markNoteAsRead(note.id, selectedOrderDetail.id)} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={cn(ui.well)}>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Progression</p>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {WORKFLOW_STEPS.map((step, idx) => {
                          const isCompleted = idx <= currentStepIndex;
                          return (
                            <span key={step.status}
                              className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-medium",
                                isCompleted ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                              {step.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER — blanc */}
                  <div className="border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row justify-end gap-2 bg-white">
                    <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className={ui.btn}>Fermer</Button>
                    <Button onClick={() => { setSelectedOrder(selectedOrderDetail); setIsOrderDetailsOpen(true); setDetailDialogOpen(false); }} className={ui.btnPrimary}>
                      Voir plus
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ==================== DIALOG NOTES ==================== */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className={cn(ui.dialog, "max-w-2xl w-[95vw] sm:w-full")}>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-slate-900">Notes — Commande #{selectedOrderForNote?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingNotes ? (
                <div className="flex justify-center py-8"><span className="text-xs text-slate-400">Chargement…</span></div>
              ) : (
                <>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2 pr-2">
                      {selectedOrderForNote?.notes?.length ? (
                        [...selectedOrderForNote.notes]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map(n => <NoteItem key={n.id} note={n} onMarkAsRead={() => markNoteAsRead(n.id, selectedOrderForNote!.id)} />)
                      ) : (
                        <p className="text-center text-xs text-slate-400 py-8">Aucune note</p>
                      )}
                    </div>
                  </ScrollArea>
                  <Textarea placeholder="Nouvelle note…" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} className={cn(ui.input, "h-auto min-h-[80px]")} rows={3} />
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button variant="outline" onClick={() => setNoteDialogOpen(false)} className={cn(ui.btn, "w-full sm:w-auto")}>Annuler</Button>
                    <Button onClick={handleSaveNote} disabled={!newNoteContent.trim() || isSavingNote} className={cn(ui.btnPrimary, "w-full sm:w-auto")}>Enregistrer</Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ==================== DIALOG REPORT ==================== */}
        <Dialog open={rescheduleDialog.open} onOpenChange={(open) => !open && setRescheduleDialog({ open: false, orderId: 0 })}>
          <DialogContent className={cn(ui.dialog, "sm:max-w-md w-[95vw] sm:w-full")}>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-slate-900">Reporter le ramassage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className={cn(ui.well, "text-xs")}>
                <p className="font-medium text-slate-900">Commande #{rescheduleDialog.orderNumber}</p>
                <p className="text-slate-600 mt-1">Client : {rescheduleDialog.clientName}</p>
                <p className="text-slate-600">Date actuelle : {rescheduleDialog.currentDate}</p>
              </div>
              <Input type="date" value={newPickupDate} onChange={(e) => setNewPickupDate(e.target.value)} min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} className={ui.input} />
              <Select value={rescheduleReason} onValueChange={setRescheduleReason}>
                <SelectTrigger className={ui.input}><SelectValue placeholder="Raison du report" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client absent">Client absent</SelectItem>
                  <SelectItem value="Report demandé">Report demandé</SelectItem>
                  <SelectItem value="Problème logistique">Problème logistique</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, orderId: 0 })} className={cn(ui.btn, "w-full sm:w-auto")}>Annuler</Button>
                <Button onClick={handleReschedule} disabled={!newPickupDate || isRescheduling} className={cn(ui.btnPrimary, "w-full sm:w-auto")}>Confirmer</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ==================== ALERT STATUT ==================== */}
        <AlertDialog open={statusChangeDialog.open} onOpenChange={(open) => !open && setStatusChangeDialog({ ...statusChangeDialog, open: false })}>
          <AlertDialogContent className={cn(ui.dialog, "w-[95vw] sm:w-full")}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm font-semibold text-slate-900">Confirmer le changement</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Passer de <strong>{WORKFLOW_STEPS.find(s => s.status === statusChangeDialog.currentStatus)?.label}</strong>
                {" à "}
                <strong>{WORKFLOW_STEPS.find(s => s.status === statusChangeDialog.newStatus)?.label}</strong> ?
                {statusChangeDialog.requiresItemCount && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium">Nombre d'articles</Label>
                    <Input type="number" min="1" value={itemCountInput || ''} onChange={(e) => setItemCountInput(parseInt(e.target.value) || 0)} className={cn(ui.input, "mt-1")} placeholder="Saisir le nombre" />
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className={cn(ui.btn, "w-full sm:w-auto")}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange} className={cn(ui.btnPrimary, "w-full sm:w-auto")}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default OrdersTab;