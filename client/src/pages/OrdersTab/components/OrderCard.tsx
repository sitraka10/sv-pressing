// src/pages/OrdersTab/components/OrderCard.tsx
// 100% flat, 100% textuel, boutons rouges si retard.
import React from "react";
import { Button } from "@/components/ui/button";
import { Order } from "../types";
import { formatDate } from "../utils/format";
import { getOrderCountdown, getNextStatus } from "../utils/sla";
import { WORKFLOW_STEPS } from "../constants";
import { cn } from "@/lib/utils";
import { WorkflowProgressBar } from "./WorkflowProgressBar";
import { SLADisplay } from "./SLADisplay";

/* ============================================================
   DESIGN SYSTEM
============================================================ */
const ui = {
  card: "rounded-xl border bg-white transition-colors",
  cardNormal: "border-slate-200/70 hover:border-slate-300",
  cardLate: "border-slate-300",
  btnPrimary: "h-8 rounded-lg bg-slate-800 text-white text-[11.5px] font-semibold hover:bg-slate-900",
  btnDanger: "h-8 rounded-lg bg-red-600 text-white text-[11.5px] font-semibold hover:bg-red-700",
  btnSecondary: "h-8 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11.5px] font-medium hover:bg-slate-50",
  btnGhost: "h-7 px-2 rounded-md text-[11px] font-medium text-slate-600 hover:bg-slate-100",
  infoBox: "min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5",
  sectionTitle: "text-[10.5px] font-semibold uppercase tracking-wider text-slate-500",
};

/* ============================================================
   STATUS
============================================================ */
const STATUS_LABELS: Record<string, string> = {
  to_pickup: "À ramasser", to_sort: "À trier", to_wash: "À laver",
  to_dry: "À sécher", to_iron: "À repasser", ready_to_deliver: "Prêt à livrer",
  to_deliver: "À livrer", delivered: "Livré",
};
const getStatusLabel = (s: string) => STATUS_LABELS[s] || s;

const STATUS_TONE: Record<string, string> = {
  to_pickup: "bg-slate-100 text-slate-700",
  to_sort: "bg-slate-100 text-slate-700",
  to_wash: "bg-slate-100 text-slate-700",
  to_dry: "bg-slate-100 text-slate-700",
  to_iron: "bg-slate-100 text-slate-700",
  ready_to_deliver: "bg-slate-100 text-slate-700",
  to_deliver: "bg-slate-100 text-slate-700",
  delivered: "bg-slate-100 text-slate-700",
};
const getStatusTone = (s: string) => STATUS_TONE[s] || "bg-slate-100 text-slate-600";

const NEXT_STATUS_LABELS: Record<string, string> = {
  to_sort: "Passer au tri", to_wash: "Passer au lavage", to_dry: "Passer au séchage",
  to_iron: "Passer au repassage", ready_to_deliver: "Marquer prêt",
  to_deliver: "Mettre en livraison", delivered: "Marquer livré",
};
const getNextStatusLabel = (status: string) => NEXT_STATUS_LABELS[status] || "Étape suivante";

/* ============================================================
   HELPERS
============================================================ */
interface ClientLite { id: number; fullName?: string; }

interface CountdownData {
  label?: string;
  remaining?: string;
  formatted?: string;
  text?: string;
  displayTime?: string;
  isLate?: boolean;
  late?: boolean;
}
type Countdown = CountdownData | string | null | undefined;

interface CountdownInfo {
  label: string;
  isLate: boolean;
}

const getClientName = (clients: ClientLite[], clientId: number) =>
  clients.find((c) => c.id === clientId)?.fullName || "Client inconnu";

const parseCountdown = (countdown: Countdown): CountdownInfo | null => {
  if (!countdown) return null;
  if (typeof countdown === "string") return { label: countdown, isLate: false };
  const label = countdown.label ?? countdown.remaining ?? countdown.formatted ?? countdown.text ?? countdown.displayTime ?? "";
  if (!label) return null;
  return { label, isLate: countdown.isLate === true || countdown.late === true };
};

/**
 * Détection robuste du retard :
 * 1. countdown.isLate (venant de getOrderCountdown)
 * 2. Fallback : scheduledDeliveryDate < now && status !== delivered
 */
const computeIsLate = (order: Order, now: Date, countdown: Countdown): boolean => {
  // 1. Countdown structuré
  const info = parseCountdown(countdown);
  if (info?.isLate) return true;

  // 2. Fallback : date de livraison dépassée
  if (order.status === 'delivered') return false;
  if (!order.scheduledDeliveryDate) return false;
  const d = new Date(order.scheduledDeliveryDate);
  if (isNaN(d.getTime())) return false;
  return now > d;
};

/* ============================================================
   PETITS COMPOSANTS
============================================================ */
const OrderInfo = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={ui.infoBox}>
    <p className="text-[10.5px] font-medium text-slate-500">{label}</p>
    <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", getStatusTone(status))}>
    {getStatusLabel(status)}
  </span>
);

const LateBadge = () => (
  <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">Retard</span>
);

const CountdownBadge = ({ countdown, isLate }: { countdown: Countdown; isLate: boolean }) => {
  const info = parseCountdown(countdown);
  if (!info) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
        Délai non défini
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-medium",
      isLate ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700")}>
      {isLate ? `Retard : ${info.label}` : `Délai restant : ${info.label}`}
    </span>
  );
};

/* ============================================================
   TYPES
============================================================ */
interface BaseOrderCardProps {
  order: Order;
  idx: number;
  clients: ClientLite[];
  now: Date;
  isMobile?: boolean;
  expandedOrderId?: number | null;
  toggleOrderExpand?: (id: number) => void;
  handleStatusChange: (orderId: number, status: string, itemCount?: number) => void;
  handleStatusChangeRequest: (orderId: number, newStatus: string) => void;
  handleOpenNoteDialog: (order: Order) => void;
  openOrderDetail: (order: Order) => void;
  setRescheduleDialog: (dialog: any) => void;
}

/* ============================================================
   ORDER CARD
============================================================ */
export const OrderCard: React.FC<BaseOrderCardProps> = ({
  order, clients, now, isMobile = false,
  expandedOrderId, toggleOrderExpand,
  handleStatusChange, handleStatusChangeRequest,
  handleOpenNoteDialog, openOrderDetail, setRescheduleDialog,
}) => {
  const clientName = getClientName(clients, order.clientId);
  const countdown = getOrderCountdown(order, now) as Countdown;

  // ⬇️ Détection robuste : countdown.isLate OU scheduledDeliveryDate < now
  const isLate = computeIsLate(order, now, countdown);

  const hasNotes = Boolean(order.notes?.length);
  const unreadCount = order.notes?.filter((note: any) => !note.isRead).length || 0;
  const currentStep = WORKFLOW_STEPS.findIndex((step) => step.status === order.status);
  const nextStep = getNextStatus(order.status);
  const isExpanded = expandedOrderId === order.id;

  // Bouton "next step" : rouge si retard, gris sinon
  const nextBtnClass = isLate ? ui.btnDanger : ui.btnPrimary;

  const handleWorkflowClick = (status: string) => {
    const step = WORKFLOW_STEPS.find((item) => item.status === status);
    if (!step) return;
    if (step.order <= currentStep) handleStatusChange(order.id, status);
    else if (step.order === currentStep + 1) handleStatusChangeRequest(order.id, status);
  };

  const rescheduleAction = () => setRescheduleDialog({
    open: true,
    orderId: order.id,
    orderNumber: order.id,
    currentDate: formatDate(order.scheduledPickupDate, "dd MMMM yyyy"),
    clientName,
  });

  const goNext = () => nextStep && handleStatusChangeRequest(order.id, nextStep);
  const goPrev = () => {
    const previousStatus = WORKFLOW_STEPS[currentStep - 1]?.status;
    if (previousStatus) handleStatusChange(order.id, previousStatus);
  };

  /* ============================================================
     MOBILE
  ============================================================ */
  if (isMobile) {
    return (
      <article className={cn(ui.card, isLate ? ui.cardLate : ui.cardNormal)}>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-[13px] font-semibold text-slate-900">Commande #{order.id}</h3>
                <StatusBadge status={order.status} />
                {isLate && <LateBadge />}
              </div>
              <p className="mt-0.5 truncate text-[11.5px] text-slate-500">Client : {clientName}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleOrderExpand?.(order.id)}
              className={ui.btnGhost}
            >
              {isExpanded ? "Réduire" : "Détails"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>{formatDate(order.createdAt, "dd/MM/yyyy")}</span>
            <span>{order.itemCount ?? "À compter"} pièce{order.itemCount === 1 ? "" : "s"}</span>
          </div>
          <div>
            <CountdownBadge countdown={countdown} isLate={isLate} />
          </div>

          <SLADisplay order={order} now={now} />

          {isExpanded && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div>
                <h4 className={cn(ui.sectionTitle, "mb-2")}>Progression</h4>
                <WorkflowProgressBar status={order.status} onClick={handleWorkflowClick} />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <OrderInfo label="Ramassage" value={formatDate(order.scheduledPickupDate, "dd/MM/yyyy")} />
                <OrderInfo label="Livraison" value={formatDate(order.scheduledDeliveryDate, "dd/MM/yyyy")} />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Button variant="outline" size="sm" onClick={() => openOrderDetail(order)} className={ui.btnSecondary}>
                  Détails
                </Button>
                {order.status === "to_pickup" && (
                  <Button variant="outline" size="sm" onClick={rescheduleAction} className={ui.btnSecondary}>
                    Reporter
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleOpenNoteDialog(order)} className={ui.btnSecondary}>
                  Notes{unreadCount > 0 && <span className="ml-1 text-slate-700">({unreadCount})</span>}
                </Button>
              </div>
              {nextStep && (
                <Button size="sm" onClick={goNext} className={cn("w-full", nextBtnClass)}>
                  {getNextStatusLabel(nextStep)}
                </Button>
              )}
            </div>
          )}

          {!isExpanded && (
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openOrderDetail(order)} className={ui.btnGhost}>
                  Détails
                </Button>
                {hasNotes && (
                  <Button variant="ghost" size="sm" onClick={() => handleOpenNoteDialog(order)} className={ui.btnGhost}>
                    Notes{unreadCount > 0 && <span className="ml-1 text-slate-700">({unreadCount})</span>}
                  </Button>
                )}
              </div>
              {nextStep && (
                <Button size="sm" onClick={goNext} className={nextBtnClass}>
                  Étape suivante
                </Button>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  /* ============================================================
     DESKTOP
  ============================================================ */
  return (
    <article className={cn(ui.card, isLate ? ui.cardLate : ui.cardNormal)}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-slate-900">Commande #{order.id}</h3>
            <StatusBadge status={order.status} />
            {isLate && <LateBadge />}
            {hasNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenNoteDialog(order)}
                className={cn(ui.btnGhost, "text-slate-700 hover:bg-slate-100")}
              >
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : `${order.notes?.length} note${(order.notes?.length || 0) > 1 ? "s" : ""}`}
              </Button>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <span className="truncate">{clientName}</span>
            <span className="text-slate-300">•</span>
            <span>Créée le {formatDate(order.createdAt, "dd/MM/yyyy")}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <CountdownBadge countdown={countdown} isLate={isLate} />
          <Button variant="ghost" size="sm" onClick={() => openOrderDetail(order)} className={ui.btnGhost}>
            Détails
          </Button>
          {order.status === "to_pickup" && (
            <Button variant="ghost" size="sm" onClick={rescheduleAction} className={ui.btnGhost}>
              Reporter
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenNoteDialog(order)}
            className={ui.btnGhost}
          >
            Notes
          </Button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <OrderInfo label="Articles" value={`${order.itemCount ?? "À compter"} pièce${order.itemCount === 1 ? "" : "s"}`} />
          <OrderInfo label="Ramassage prévu" value={formatDate(order.scheduledPickupDate, "dd/MM/yyyy")} />
          <OrderInfo label="Livraison prévue" value={formatDate(order.scheduledDeliveryDate, "dd/MM/yyyy")} />
        </div>

        <SLADisplay order={order} now={now} />

        <div>
          <h4 className={cn(ui.sectionTitle, "mb-2")}>Progression</h4>
          <WorkflowProgressBar status={order.status} onClick={handleWorkflowClick} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] text-slate-500">
            {hasNotes ? (unreadCount > 0 ? `${unreadCount} note(s) non lue(s)` : `${order.notes?.length || 0} note(s)`) : "Aucune note"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep <= 0}
              onClick={goPrev}
              className={cn(ui.btnSecondary, "disabled:opacity-40")}
            >
              Retour
            </Button>
            {nextStep && (
              <Button size="sm" onClick={goNext} className={nextBtnClass}>
                {getNextStatusLabel(nextStep)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/* ============================================================
   ALIAS
============================================================ */
export const MobileOrderCard = OrderCard;
export const DesktopOrderCard = OrderCard;