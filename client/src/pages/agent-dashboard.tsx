// client/src/pages/agent-dashboard.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Package,
  Clock,
  User,
  AlertTriangle,
  Wallet,
  Plus,
  Calendar,
  CheckCircle,
  Truck,
  CheckSquare,
  Scissors,
  Droplet,
  Wind,
  Shirt,
  LogOut,
  ListChecks,
  LayoutGrid,
  MessageSquare,
  X,
  ChevronRight,
  Phone,
  MapPin,
  FileText,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Ban,
  Filter,
  ChevronLeft,
  Home,
  Mail,
  Clock as ClockIcon,
  DollarSign,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================
// STYLES NÉOMORPHIQUES - AVEC SCROLL CORRIGÉ
// ============================================================
const NEO = {
  card: "bg-[#eef2f5] rounded-2xl sm:rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  cardPressed: "bg-[#eef2f5] rounded-2xl sm:rounded-3xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]",
  button: "bg-[#eef2f5] rounded-xl sm:rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  input: "bg-[#eef2f5] rounded-xl sm:rounded-2xl shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] border-0 focus:ring-2 focus:ring-[#0B676E] transition-all duration-300",
  badge: "shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
  dialogContent: "bg-[#eef2f5] rounded-2xl sm:rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 w-[95vw] sm:w-full max-w-[95vw] sm:max-w-[500px] md:max-w-[550px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6",
  dialogContentLarge: "bg-[#eef2f5] rounded-2xl sm:rounded-3xl shadow-[24px_24px_48px_#b8c2ca,-24px_-24px_48px_#ffffff] border-0 w-[95vw] sm:w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[700px] lg:max-w-[800px] max-h-[95vh] overflow-hidden flex flex-col p-0",
};

// ============================================================
// TYPES
// ============================================================
type OrderStatus =
  | "to_pickup"
  | "to_sort"
  | "to_wash"
  | "to_dry"
  | "to_iron"
  | "ready_to_deliver"
  | "to_deliver"
  | "delivered";

type Priority = "urgent" | "high" | "medium" | "low";

interface Client {
  id: number;
  fullName: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
  addressDetails?: string | null;
  neighborhood?: string | null;
  email?: string;
  isActive?: boolean;
  capacityInItems?: number | null;
  vehicleType?: string | null;
  preferredPickupDays?: string[];
  preferredTimeWindowStart?: string | null;
  preferredTimeWindowEnd?: string | null;
}

interface Order {
  id: number;
  status: OrderStatus;
  client: Client;
  itemCount?: number;
  scheduledPickupDate: string;
  scheduledDeliveryDate?: string;
  specialInstructions?: string;
  linensDetails?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientNeighborhood?: string;
  createdAt?: string;
  totalPrice?: number;
  deposit?: number;
  remainingAmount?: number;
  subscriptionDetails?: {
    planName: string | null;
    planType: string | null;
    pickupsPerWeek: number | null;
    deliveryTimeHours: number | null;
    itemsIncluded: number | null;
    pricePerMonth: string | null;
  } | null;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  status?: string;
  notes?: string;
  createdByUser?: {
    id: number;
    fullName: string;
    role: string;
  };
}

interface OrderNote {
  id: number;
  orderId: number;
  content: string;
  createdAt: string;
  author?: { fullName: string };
  createdBy?: string;
  noteType: string;
  isRead?: boolean;
}

// ============================================================
// CONFIGURATION DES 7 STATUTS POUR LE KANBAN
// ============================================================
const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}> = {
  to_pickup: {
    label: 'À ramasser',
    icon: <Package className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-400',
    gradient: 'from-amber-500 to-orange-500'
  },
  to_sort: {
    label: 'À trier',
    icon: <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-400',
    gradient: 'from-blue-500 to-cyan-500'
  },
  to_wash: {
    label: 'À laver',
    icon: <Droplet className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-400',
    gradient: 'from-cyan-500 to-sky-500'
  },
  to_dry: {
    label: 'À sécher',
    icon: <Wind className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-400',
    gradient: 'from-purple-500 to-indigo-500'
  },
  to_iron: {
    label: 'À repasser',
    icon: <Shirt className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-400',
    gradient: 'from-pink-500 to-rose-500'
  },
  ready_to_deliver: {
    label: 'Prêt à livrer',
    icon: <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-400',
    gradient: 'from-emerald-500 to-green-500'
  },
  to_deliver: {
    label: 'À livrer',
    icon: <Truck className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-400',
    gradient: 'from-indigo-500 to-blue-500'
  },
  delivered: {
    label: 'Livré',
    icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-400',
    gradient: 'from-slate-500 to-gray-500'
  },
};

// Ordre séquentiel du workflow (strict)
const WORKFLOW_ORDER: OrderStatus[] = [
  'to_pickup',
  'to_sort',
  'to_wash',
  'to_dry',
  'to_iron',
  'ready_to_deliver',
  'to_deliver',
  'delivered'
];

// ============================================================
// CALCUL DE PRIORITÉ BASÉ SUR LE DEADLINE
// ============================================================
const calculatePriority = (order: Order) => {
  const now = new Date();
  let deadline: Date;

  if (order.status === 'to_pickup') {
    deadline = new Date(order.scheduledPickupDate);
  } else {
    deadline = order.scheduledDeliveryDate
      ? new Date(order.scheduledDeliveryDate)
      : new Date(order.scheduledPickupDate);
  }

  const hoursLeft = differenceInHours(deadline, now);
  const minutesLeft = differenceInMinutes(deadline, now);

  if (hoursLeft < 0) {
    return {
      priority: 'urgent' as Priority,
      hoursLeft,
      label: `EN RETARD (${Math.abs(hoursLeft)}h)`,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      icon: <AlertTriangle className="h-3 w-3" />
    };
  }
  if (hoursLeft < 2) {
    return {
      priority: 'urgent' as Priority,
      hoursLeft,
      label: `Urgent (${minutesLeft}min)`,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      icon: <AlertTriangle className="h-3 w-3" />
    };
  }
  if (hoursLeft < 6) {
    return {
      priority: 'high' as Priority,
      hoursLeft,
      label: `Haute (${hoursLeft}h)`,
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-400',
      icon: <ArrowUpCircle className="h-3 w-3" />
    };
  }
  if (hoursLeft < 24) {
    return {
      priority: 'medium' as Priority,
      hoursLeft,
      label: `Moyenne (${hoursLeft}h)`,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-400',
      icon: <Clock className="h-3 w-3" />
    };
  }
  return {
    priority: 'low' as Priority,
    hoursLeft,
    label: `Basse (${Math.floor(hoursLeft / 24)}j)`,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-400',
    icon: <ArrowDownCircle className="h-3 w-3" />
  };
};

const priorityConfig = {
  urgent: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
    label: 'Urgent',
    dotColor: 'bg-red-500'
  },
  high: {
    icon: <ArrowUpCircle className="h-3 w-3" />,
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-400',
    label: 'Haute',
    dotColor: 'bg-orange-500'
  },
  medium: {
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-400',
    label: 'Moyenne',
    dotColor: 'bg-amber-500'
  },
  low: {
    icon: <ArrowDownCircle className="h-3 w-3" />,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-400',
    label: 'Basse',
    dotColor: 'bg-emerald-500'
  },
};

// ============================================================
// CATÉGORIES DE DÉPENSES AUTORISÉES POUR AGENTS
// ============================================================
const AGENT_EXPENSE_CATEGORIES = [
  "Carburant véhicule",
  "Carburant livraison",
  "Entretien véhicule",
  "Repas personnel",
  "Indemnité transport",
  "Livraison moto",
  "Fournitures bureau",
  "Imprévu",
  "Autres"
];

// ============================================================
// COMPOSANT DE PAGINATION
// ============================================================
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-white/40">
      <div className="text-xs sm:text-sm text-slate-500 order-2 sm:order-1 text-center sm:text-left">
        Affichage de <span className="font-medium text-slate-700">{startItem}</span> à{" "}
        <span className="font-medium text-slate-700">{endItem}</span> sur{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> dépense(s)
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(NEO.button, "gap-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm")}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Précédent</span>
        </Button>

        <div className="hidden sm:flex gap-1">
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
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs",
                  currentPage === pageNum ? NEO.buttonPrimary : NEO.button
                )}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <div className="flex sm:hidden items-center px-3 py-1 bg-[#eef2f5] rounded-xl text-xs font-medium text-slate-600 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
          {currentPage} / {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(NEO.button, "gap-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm")}
        >
          <span className="hidden xs:inline">Suivant</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT CARTE TÂCHE (Workflow séquentiel strict)
// ============================================================
const TaskCard = ({
  order,
  onStatusChange,
  onViewDetails,
  hasNotes,
  notesCount
}: {
  order: Order;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
  hasNotes: boolean;
  notesCount: number;
}) => {
  const { priority, label, color, bgColor, borderColor, icon: priorityIcon } = calculatePriority(order);
  const statusConf = STATUS_CONFIG[order.status];

  const getNextAction = (): {
    status: OrderStatus;
    label: string;
    icon: React.ReactNode;
  } | null => {
    const currentIndex = WORKFLOW_ORDER.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= WORKFLOW_ORDER.length - 1) {
      return null;
    }
    const nextStatus = WORKFLOW_ORDER[currentIndex + 1];
    const nextConf = STATUS_CONFIG[nextStatus];
    return {
      status: nextStatus,
      label: `Passer à : ${nextConf.label}`,
      icon: nextConf.icon
    };
  };

  const nextAction = getNextAction();

  return (
    <div
      className={cn(
        NEO.card,
        "p-3 sm:p-4 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-l-4",
        borderColor
      )}
      onClick={() => onViewDetails(order)}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={cn(
            "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2)] bg-gradient-to-br text-sm sm:text-base",
            statusConf.gradient
          )}>
            #{order.id}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{order.client.fullName}</p>
            <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
              <Badge className={cn("text-[8px] sm:text-[10px] border-0", statusConf.bgColor, statusConf.color)}>
                {statusConf.icon}
                <span className="ml-0.5 sm:ml-1">{statusConf.label}</span>
              </Badge>
              {order.itemCount && (
                <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
                  <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {order.itemCount} pièces
                </span>
              )}
              {hasNotes && (
                <Badge className={cn(
                  "text-[8px] sm:text-[10px] border-0 bg-[#0B676E] text-white gap-0.5 sm:gap-1",
                  NEO.badge
                )}>
                  <MessageSquare className="h-2 w-2 sm:h-3 sm:w-3" />
                  {notesCount} note{notesCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge className={cn("text-[10px] sm:text-xs font-bold border-0 flex-shrink-0 gap-0.5 sm:gap-1", bgColor, color)}>
          {priorityIcon} <span className="hidden xs:inline">{label}</span>
        </Badge>
      </div>

      {order.specialInstructions && (
        <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-amber-50 border-l-2 border-amber-400 rounded text-[10px] sm:text-xs text-amber-800 flex items-start gap-1 sm:gap-2">
          <MessageSquare className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{order.specialInstructions}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/40">
        <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          {order.status === 'to_pickup'
            ? format(new Date(order.scheduledPickupDate), "dd/MM HH:mm", { locale: fr })
            : order.scheduledDeliveryDate
              ? format(new Date(order.scheduledDeliveryDate), "dd/MM HH:mm", { locale: fr })
              : 'Non planifié'}
        </div>
        {nextAction && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(order.id, nextAction.status);
            }}
            className={cn(NEO.buttonPrimary, "h-6 sm:h-8 text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-2 sm:px-3")}
          >
            {nextAction.icon}
            <span className="hidden xs:inline">{nextAction.label}</span>
            <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 xs:hidden" />
          </Button>
        )}
      </div>

      <div className="mt-1 sm:mt-2 text-[8px] sm:text-[10px] text-slate-400 text-center flex items-center justify-center gap-0.5 sm:gap-1">
        <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        Cliquez pour voir les détails
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT CARTE KANBAN (Drag & drop)
// ============================================================
const KanbanCard = ({
  order,
  index,
  onViewDetails,
  hasNotes,
  notesCount
}: {
  order: Order;
  index: number;
  onViewDetails: (order: Order) => void;
  hasNotes: boolean;
  notesCount: number;
}) => {
  const { priority } = calculatePriority(order);
  const config = priorityConfig[priority];

  return (
    <Draggable draggableId={order.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onViewDetails(order)}
        >
          <Card className={cn(
            "mb-2 sm:mb-3 bg-white transition-all duration-300 border-l-4 cursor-pointer",
            snapshot.isDragging ? 'shadow-2xl scale-105 rotate-1' : 'hover:shadow-lg hover:-translate-y-0.5',
            priority === 'urgent' ? 'border-l-red-500' :
            priority === 'high' ? 'border-l-orange-500' :
            priority === 'medium' ? 'border-l-amber-500' : 'border-l-emerald-500'
          )}>
            <CardContent className="p-2 sm:p-3">
              <div className="flex justify-between items-start">
                <p className="font-bold text-slate-800 text-xs sm:text-sm">CDE #{order.id}</p>
                <Badge className={cn("text-[8px] sm:text-[10px] border-0", config.bgColor, config.textColor)}>
                  {config.icon}
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 flex items-center truncate">
                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-slate-400 flex-shrink-0" />
                <span className="truncate">{order.client.fullName}</span>
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 flex items-center">
                <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-slate-400 flex-shrink-0" />
                {order.itemCount || '?'} pièces
              </p>
              {hasNotes && (
                <div className="mt-0.5 flex items-center gap-0.5">
                  <Badge className={cn(
                    "text-[7px] sm:text-[9px] border-0 bg-[#0B676E] text-white gap-0.5",
                    NEO.badge
                  )}>
                    <MessageSquare className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                    {notesCount} note{notesCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
              <p className="text-[8px] sm:text-[10px] text-slate-400 mt-1 flex items-center">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                {new Date(order.scheduledPickupDate).toLocaleDateString('fr-FR')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

// ============================================================
// COMPOSANT COLONNE KANBAN (7 colonnes)
// ============================================================
const KanbanColumn = ({
  status,
  orders,
  onViewDetails,
  notesMap
}: {
  status: OrderStatus;
  orders: Order[];
  onViewDetails: (order: Order) => void;
  notesMap: Map<number, OrderNote[]>;
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className="bg-slate-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex-1 min-w-[180px] sm:min-w-[220px] md:min-w-[240px] h-[450px] sm:h-[500px] md:h-[600px] flex flex-col shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]">
      <div className={cn(
        "flex items-center justify-between mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0",
        config.bgColor
      )}>
        <div className={cn("flex items-center gap-1 sm:gap-2 font-bold text-xs sm:text-sm", config.color)}>
          {config.icon}
          <span className="truncate">{config.label}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] sm:text-xs">{orders.length}</Badge>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-md transition-colors p-0.5 sm:p-1 overflow-y-auto",
              snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
            )}
          >
            <div className="space-y-1 sm:space-y-2">
              {orders.map((order, index) => {
                const notes = notesMap.get(order.id) || [];
                return (
                  <KanbanCard
                    key={order.id}
                    order={order}
                    index={index}
                    onViewDetails={onViewDetails}
                    hasNotes={notes.length > 0}
                    notesCount={notes.length}
                  />
                );
              })}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// ============================================================
// COMPOSANT NOTE ITEM
// ============================================================
const NoteItem = ({ note }: { note: OrderNote }) => {
  const authorName = note.author?.fullName || note.createdBy || 'Système';
  return (
    <div className={cn(
      "p-2 sm:p-3 rounded-xl sm:rounded-2xl",
      !note.isRead
        ? "border-l-4 border-l-[#0B676E] bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]"
        : "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <div className="p-1 rounded-lg bg-[#0B676E]/10 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
            <MessageSquare className="h-3 w-3 text-[#0B676E]" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-slate-800">{authorName}</span>
          {!note.isRead && (
            <Badge className={cn(NEO.badge, "bg-[#0B676E] text-white text-[8px] sm:text-[10px]")}>
              Non lue
            </Badge>
          )}
        </div>
        <span className="text-[10px] sm:text-xs text-slate-500">
          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: fr })}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
    </div>
  );
};

// ============================================================
// COMPOSANT CARTE INFOS CLIENT
// ============================================================
const ClientInfoCard = ({ client }: { client: Client }) => {
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  return (
    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0B676E]/5 to-teal-50/30 border border-[#0B676E]/10">
      <h4 className="font-semibold text-slate-900 flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 text-sm sm:text-base">
        <User className="h-4 w-4 text-[#0B676E]" />
        Informations client
      </h4>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
          <span className="font-medium text-slate-700 truncate">{client.fullName}</span>
          {client.isActive !== undefined && (
            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ml-1 flex-shrink-0 ${client.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          )}
        </div>
        
        {client.phone && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">{client.phone}</span>
            {client.phone2 && (
              <span className="text-slate-400 text-[10px] sm:text-xs flex-shrink-0">(2: {client.phone2})</span>
            )}
          </div>
        )}
        
        {client.email && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">{client.email}</span>
          </div>
        )}
        
        {client.address && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">{client.address}</span>
          </div>
        )}
        
        {client.neighborhood && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">Quartier: {client.neighborhood}</span>
          </div>
        )}
        
        {client.addressDetails && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{client.addressDetails}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
          {client.capacityInItems && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 truncate">Capacité: {client.capacityInItems}</span>
            </div>
          )}
          
          {client.vehicleType && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 truncate">{client.vehicleType}</span>
            </div>
          )}
        </div>
        
        {client.preferredPickupDays && client.preferredPickupDays.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">
              Jours: {client.preferredPickupDays.map(d => dayNames[parseInt(d)] || d).join(', ')}
            </span>
          </div>
        )}
        
        {client.preferredTimeWindowStart && client.preferredTimeWindowEnd && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">
              {client.preferredTimeWindowStart} - {client.preferredTimeWindowEnd}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm pt-1 border-t border-slate-200/50">
          <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-slate-600 font-medium">
            {client.isActive ? 'Client actif' : 'Client inactif'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("tasks");
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expensePeriod, setExpensePeriod] = useState("today");
  const [isSortingDialogOpen, setIsSortingDialogOpen] = useState(false);
  const [orderToSort, setOrderToSort] = useState<Order | null>(null);
  const [sortingData, setSortingData] = useState({ itemCount: '', notes: '' });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderNotes, setOrderNotes] = useState<OrderNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesMap, setNotesMap] = useState<Map<number, OrderNote[]>>(new Map());
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    category: 'Carburant véhicule',
    notes: ''
  });

  // ============================================================
  // FILTRES POUR LES TÂCHES
  // ============================================================
  const [taskFilters, setTaskFilters] = useState({
    search: '',
    status: 'all' as OrderStatus | 'all',
    priority: 'all' as Priority | 'all',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  });

  // ============================================================
  // PAGINATION POUR LES DÉPENSES
  // ============================================================
  const [expensePage, setExpensePage] = useState(1);
  const [expensesPerPage] = useState(10);

  // ============================================================
  // REQUÊTES
  // ============================================================
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['agent_orders'],
    queryFn: () => apiRequest('GET', '/api/orders/agent-view').then(res => res.json()),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery<{
    data: Expense[];
    total: number;
    count: number;
  }>({
    queryKey: ['agent_expenses', expensePeriod],
    queryFn: () => apiRequest('GET', `/api/expenses/my?timePeriod=${expensePeriod}`).then(res => res.json()),
  });

  // ============================================================
  // CHARGEMENT DES NOTES D'UNE COMMANDE
  // ============================================================
  const loadOrderNotes = useCallback(async (orderId: number): Promise<OrderNote[]> => {
    try {
      const response = await fetch(`/api/orders/${orderId}/notes`);
      if (response.ok) {
        const notes = await response.json();
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
        setNotesMap(prev => {
          const newMap = new Map(prev);
          newMap.set(orderId, normalizedNotes);
          return newMap;
        });
        return normalizedNotes;
      }
      return [];
    } catch (error) {
      console.error("Erreur chargement notes:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        if (!notesMap.has(order.id)) {
          loadOrderNotes(order.id);
        }
      });
    }
  }, [orders, loadOrderNotes]);

  // ============================================================
  // MUTATIONS
  // ============================================================
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, itemCount, notes }: {
      orderId: number;
      status: OrderStatus;
      itemCount?: number;
      notes?: string;
    }) => {
      const payload: any = { status };
      if (itemCount !== undefined) payload.itemCount = itemCount;
      if (notes !== undefined) payload.linensDetails = notes;
      return apiRequest('PATCH', `/api/orders/${orderId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent_orders'] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: Error) => toast({
      title: "Erreur",
      description: error.message,
      variant: "destructive"
    })
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/expenses/agent', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent_expenses'] });
      setIsExpenseDialogOpen(false);
      setExpenseData({ description: '', amount: '', category: 'Carburant véhicule', notes: '' });
      toast({ title: "Dépense enregistrée", description: "Dépense validée automatiquement" });
    },
    onError: (error: any) => toast({
      title: "Erreur",
      description: error.message,
      variant: "destructive"
    })
  });

  // ============================================================
  // FILTRAGE DES TÂCHES
  // ============================================================
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (taskFilters.search.trim() !== '') {
      const searchLower = taskFilters.search.toLowerCase();
      filtered = filtered.filter(o => 
        o.client.fullName.toLowerCase().includes(searchLower) ||
        o.id.toString().includes(searchLower)
      );
    }

    if (taskFilters.status !== 'all') {
      filtered = filtered.filter(o => o.status === taskFilters.status);
    }

    if (taskFilters.priority !== 'all') {
      filtered = filtered.filter(o => {
        const { priority } = calculatePriority(o);
        return priority === taskFilters.priority;
      });
    }

    if (taskFilters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (taskFilters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      filtered = filtered.filter(o => {
        const date = new Date(o.scheduledPickupDate);
        return date >= startDate;
      });
    }

    return filtered;
  }, [orders, taskFilters]);

  // ============================================================
  // CALCULS
  // ============================================================
  const tasksByPriority = useMemo(() => {
    const tasks = filteredOrders.map(order => ({ order, ...calculatePriority(order) }));
    return {
      urgent: tasks.filter(t => t.priority === 'urgent').sort((a, b) => a.hoursLeft - b.hoursLeft),
      high: tasks.filter(t => t.priority === 'high').sort((a, b) => a.hoursLeft - b.hoursLeft),
      medium: tasks.filter(t => t.priority === 'medium').sort((a, b) => a.hoursLeft - b.hoursLeft),
      low: tasks.filter(t => t.priority === 'low').sort((a, b) => a.hoursLeft - b.hoursLeft),
    };
  }, [filteredOrders]);

  const kanbanColumns = useMemo(() => ({
    to_pickup: filteredOrders.filter(o => o.status === 'to_pickup'),
    to_sort: filteredOrders.filter(o => o.status === 'to_sort'),
    to_wash: filteredOrders.filter(o => o.status === 'to_wash'),
    to_dry: filteredOrders.filter(o => o.status === 'to_dry'),
    to_iron: filteredOrders.filter(o => o.status === 'to_iron'),
    ready_to_deliver: filteredOrders.filter(o => o.status === 'ready_to_deliver'),
    to_deliver: filteredOrders.filter(o => o.status === 'to_deliver'),
  }), [filteredOrders]);

  const totalTasks = filteredOrders.length;
  const urgentCount = tasksByPriority.urgent.length;

  // ============================================================
  // PAGINATION DES DÉPENSES
  // ============================================================
  const allExpenses = expensesData?.data || [];
  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * expensesPerPage;
    const end = start + expensesPerPage;
    return allExpenses.slice(start, end);
  }, [allExpenses, expensePage, expensesPerPage]);

  const totalExpensePages = Math.ceil(allExpenses.length / expensesPerPage);

  // ============================================================
  // HANDLERS - WORKFLOW STRICT
  // ============================================================
  const handleStatusChange = (orderId: number, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentIndex = WORKFLOW_ORDER.indexOf(order.status);
    const targetIndex = WORKFLOW_ORDER.indexOf(status);

    if (targetIndex !== currentIndex + 1) {
      toast({
        title: "Saut non autorisé",
        description: `Vous devez suivre l'ordre du workflow. Étape actuelle : ${STATUS_CONFIG[order.status].label}`,
        variant: "destructive"
      });
      return;
    }

    if (status === 'to_sort') {
      setOrderToSort(order);
      setSortingData({ itemCount: '', notes: '' });
      setIsSortingDialogOpen(true);
      return;
    }

    updateStatusMutation.mutate({ orderId, status });
  };

  const handleSortingConfirm = () => {
    if (!sortingData.itemCount || !orderToSort) {
      toast({
        title: "Champ requis",
        description: "Le nombre de vêtements est obligatoire",
        variant: "destructive"
      });
      return;
    }

    updateStatusMutation.mutate({
      orderId: orderToSort.id,
      status: 'to_sort',
      itemCount: parseInt(sortingData.itemCount),
      notes: sortingData.notes || undefined
    }, {
      onSuccess: () => {
        toast({ title: "Triage validé !" });
        setIsSortingDialogOpen(false);
        setOrderToSort(null);
        setSortingData({ itemCount: '', notes: '' });
      }
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const orderId = parseInt(draggableId);
    const newStatus = destination.droppableId as OrderStatus;
    const order = orders.find(o => o.id === orderId);

    if (!order || order.status === newStatus) return;

    const currentIndex = WORKFLOW_ORDER.indexOf(order.status);
    const targetIndex = WORKFLOW_ORDER.indexOf(newStatus);

    if (targetIndex !== currentIndex + 1) {
      toast({
        title: "Saut non autorisé",
        description: `Impossible de passer de "${STATUS_CONFIG[order.status].label}" à "${STATUS_CONFIG[newStatus].label}". Vous devez suivre l'ordre du workflow.`,
        variant: "destructive"
      });
      return;
    }

    if (newStatus === 'to_sort') {
      setOrderToSort(order);
      setSortingData({ itemCount: '', notes: '' });
      setIsSortingDialogOpen(true);
      return;
    }

    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setNotesLoading(true);
    loadOrderNotes(order.id).then(notes => {
      setOrderNotes(notes);
      setNotesLoading(false);
    });
  };

  const handleCreateExpense = () => {
    if (!expenseData.description || !expenseData.amount) {
      toast({
        title: "Champs requis",
        description: "Description et montant obligatoires",
        variant: "destructive"
      });
      return;
    }

    createExpenseMutation.mutate({
      description: expenseData.description,
      amount: parseFloat(expenseData.amount),
      category: expenseData.category,
      notes: expenseData.notes,
      expenseDate: new Date().toISOString()
    });
  };

  const resetTaskFilters = () => {
    setTaskFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dateRange: 'all'
    });
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (ordersLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef2f5]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#0B676E] mx-auto" />
          <p className="text-slate-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="min-h-screen bg-[#eef2f5] p-2 sm:p-3 md:p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4 md:space-y-6">

        {/* EN-TÊTE */}
        <div className={cn(NEO.card, "p-3 sm:p-4 md:p-5 bg-gradient-to-br from-[#0B676E] to-teal-600 text-white")}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Bonjour, {user?.fullName}</h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-white/80 mt-0.5 sm:mt-1">
                  {totalTasks} tâche{totalTasks > 1 ? 's' : ''} • {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              onClick={() => logout()}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" /> Déconnexion
            </Button>
          </div>
        </div>

        {/* STATS RAPIDES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className={cn(NEO.card, "p-2 sm:p-3 md:p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Total tâches</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{totalTasks}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
              </div>
            </div>
          </div>
          <div className={cn(NEO.card, "p-2 sm:p-3 md:p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Urgentes</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-red-100 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className={cn(NEO.card, "p-2 sm:p-3 md:p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">En traitement</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                  {orders.filter(o => ['to_sort', 'to_wash', 'to_dry', 'to_iron'].includes(o.status)).length}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-orange-100 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </div>
          </div>
          <div className={cn(NEO.card, "p-2 sm:p-3 md:p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Dépenses du jour</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-[#0B676E]">{(expensesData?.total || 0).toLocaleString()} Ar</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
              </div>
            </div>
          </div>
        </div>

        {/* ONGLETS PRINCIPAUX */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className={cn(NEO.card, "p-0.5 sm:p-1")}>
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger
                value="tasks"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 transition-all gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2"
              >
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Tâches</span> ({totalTasks})
              </TabsTrigger>
              <TabsTrigger
                value="kanban"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 transition-all gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2"
              >
                <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-[#0B676E] data-[state=active]:text-white data-[state=active]:shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] text-slate-600 transition-all gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2"
              >
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Dépenses</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ONGLET TÂCHES AVEC FILTRES */}
          <TabsContent value="tasks" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            {/* BARRE DE FILTRES */}
            <div className={cn(NEO.card, "p-2 sm:p-3 md:p-4")}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Filtres</span>
                </div>

                <div className="flex-1 flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 min-w-[120px] sm:min-w-[150px]">
                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
                    <Input
                      placeholder="Rechercher..."
                      className={cn(NEO.input, "pl-6 sm:pl-8 h-7 sm:h-8 md:h-9 text-xs sm:text-sm")}
                      value={taskFilters.search}
                      onChange={(e) => setTaskFilters(f => ({ ...f, search: e.target.value }))}
                    />
                  </div>

                  <Select
                    value={taskFilters.status}
                    onValueChange={(v) => setTaskFilters(f => ({ ...f, status: v as OrderStatus | 'all' }))}
                  >
                    <SelectTrigger className={cn(NEO.input, "w-[100px] sm:w-[120px] md:w-[130px] h-7 sm:h-8 md:h-9 text-xs")}>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-xl sm:rounded-2xl border-0">
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={taskFilters.priority}
                    onValueChange={(v) => setTaskFilters(f => ({ ...f, priority: v as Priority | 'all' }))}
                  >
                    <SelectTrigger className={cn(NEO.input, "w-[100px] sm:w-[120px] md:w-[130px] h-7 sm:h-8 md:h-9 text-xs")}>
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-xl sm:rounded-2xl border-0">
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={taskFilters.dateRange}
                    onValueChange={(v) => setTaskFilters(f => ({ ...f, dateRange: v as 'all' | 'today' | 'week' | 'month' }))}
                  >
                    <SelectTrigger className={cn(NEO.input, "w-[100px] sm:w-[120px] md:w-[130px] h-7 sm:h-8 md:h-9 text-xs")}>
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-xl sm:rounded-2xl border-0">
                      <SelectItem value="all">Toute période</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetTaskFilters}
                    className={cn(NEO.button, "h-7 sm:h-8 md:h-9 px-2 sm:px-3")}
                  >
                    <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className={cn(NEO.cardPressed, "p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3")}>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#0B676E]/10 flex items-center justify-center flex-shrink-0">
                <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-900">Workflow séquentiel</p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Ramasser → Trier → Laver → Sécher → Repasser → Prêt → Livrer
                </p>
              </div>
              <Badge className="bg-[#0B676E]/10 text-[#0B676E] text-[10px] sm:text-xs">
                {totalTasks}
              </Badge>
            </div>

            {tasksByPriority.urgent.length > 0 && (
              <div>
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 flex items-center justify-center text-white">
                    <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg text-red-700">Urgent ({tasksByPriority.urgent.length})</h3>
                  <Badge className="bg-red-100 text-red-700 border-0 text-[8px] sm:text-[10px]">À traiter</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {tasksByPriority.urgent.map(({ order }) => {
                    const notes = notesMap.get(order.id) || [];
                    return (
                      <TaskCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                        hasNotes={notes.length > 0}
                        notesCount={notes.length}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {tasksByPriority.high.length > 0 && (
              <div>
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-orange-500 flex items-center justify-center text-white">
                    <ArrowUpCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg text-orange-700">Haute priorité ({tasksByPriority.high.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {tasksByPriority.high.map(({ order }) => {
                    const notes = notesMap.get(order.id) || [];
                    return (
                      <TaskCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                        hasNotes={notes.length > 0}
                        notesCount={notes.length}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {tasksByPriority.medium.length > 0 && (
              <div>
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-amber-500 flex items-center justify-center text-white">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg text-amber-700">Priorité moyenne ({tasksByPriority.medium.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {tasksByPriority.medium.map(({ order }) => {
                    const notes = notesMap.get(order.id) || [];
                    return (
                      <TaskCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                        hasNotes={notes.length > 0}
                        notesCount={notes.length}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {tasksByPriority.low.length > 0 && (
              <div>
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <ArrowDownCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg text-emerald-700">Priorité basse ({tasksByPriority.low.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {tasksByPriority.low.map(({ order }) => {
                    const notes = notesMap.get(order.id) || [];
                    return (
                      <TaskCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                        hasNotes={notes.length > 0}
                        notesCount={notes.length}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {totalTasks === 0 && (
              <div className={cn(NEO.card, "p-6 sm:p-8 md:p-12 text-center")}>
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-emerald-500 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Aucune tâche trouvée</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">Aucune commande ne correspond à vos filtres.</p>
                <Button onClick={resetTaskFilters} variant="outline" className={cn(NEO.button, "mt-3 sm:mt-4 text-xs sm:text-sm")}>
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ONGLET KANBAN */}
          <TabsContent value="kanban" className="mt-3 sm:mt-4">
            <div className={cn(NEO.cardPressed, "p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3")}>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#0B676E]/10 flex items-center justify-center flex-shrink-0">
                <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-900">Workflow séquentiel</p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Déplacez les commandes d'une colonne à la suivante uniquement.
                </p>
              </div>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-4 -mx-2 sm:-mx-3 px-2 sm:px-3">
                <KanbanColumn status="to_pickup" orders={kanbanColumns.to_pickup} onViewDetails={handleViewDetails} notesMap={notesMap} />
                <KanbanColumn status="to_sort" orders={kanbanColumns.to_sort} onViewDetails={handleViewDetails} notesMap={notesMap} />
                <KanbanColumn status="to_wash" orders={kanbanColumns.to_wash} onViewDetails={handleViewDetails} notesMap={notesMap} />
                <KanbanColumn status="to_dry" orders={kanbanColumns.to_dry} onViewDetails={handleViewDetails} notesMap={notesMap} />
                <KanbanColumn status="to_iron" orders={kanbanColumns.to_iron} onViewDetails={handleViewDetails} notesMap={notesMap} />
                <KanbanColumn status="ready_to_deliver" orders={kanbanColumns.ready_to_deliver} onViewDetails={handleViewDetails} notesMap={notesMap} />
                <KanbanColumn status="to_deliver" orders={kanbanColumns.to_deliver} onViewDetails={handleViewDetails} notesMap={notesMap} />
              </div>
            </DragDropContext>
          </TabsContent>

          {/* ONGLET DÉPENSES AVEC PAGINATION */}
          <TabsContent value="expenses" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className={cn(NEO.card, "p-3 sm:p-4 md:p-5")}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 flex items-center gap-1 sm:gap-2">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                    Mes dépenses
                  </h3>
                  <p className="text-[10px] sm:text-sm text-slate-500">Gérez vos frais professionnels</p>
                </div>
                <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <Select value={expensePeriod} onValueChange={(v) => {
                    setExpensePeriod(v);
                    setExpensePage(1);
                  }}>
                    <SelectTrigger className={cn(NEO.input, "w-[110px] sm:w-[140px] h-7 sm:h-8 md:h-9 text-xs")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#eef2f5] rounded-xl sm:rounded-2xl border-0">
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setIsExpenseDialogOpen(true)} className={cn(NEO.buttonPrimary, "gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 h-7 sm:h-8 md:h-9")}>
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" /> Ajouter
                  </Button>
                </div>
              </div>

              <div className={cn(NEO.cardPressed, "p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Total</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0B676E]">
                      {(expensesData?.total || 0).toLocaleString()} Ar
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                      {allExpenses.length} dépense{(allExpenses.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl sm:rounded-2xl bg-[#0B676E]/10 flex items-center justify-center shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#0B676E]" />
                  </div>
                </div>
              </div>

              {expensesLoading ? (
                <div className="flex justify-center py-6 sm:py-8">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#0B676E]" />
                </div>
              ) : allExpenses.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Wallet className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-slate-500">Aucune dépense pour cette période</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 sm:space-y-2">
                    {paginatedExpenses.map((expense: Expense) => (
                      <div key={expense.id} className={cn(NEO.card, "p-2 sm:p-3 hover:-translate-y-0.5 transition-all")}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#0B676E]/10 flex items-center justify-center flex-shrink-0 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{expense.description}</p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 mt-0.5">
                                <Badge className="bg-slate-100 text-slate-600 border-0 text-[8px] sm:text-[10px]">
                                  {expense.category}
                                </Badge>
                                <span className="hidden xs:inline">
                                  {format(new Date(expense.expenseDate), "dd/MM HH:mm", { locale: fr })}
                                </span>
                                {expense.createdByUser && (
                                  <Badge className={cn(
                                    "border-0 text-[8px] sm:text-[10px]",
                                    expense.createdByUser.role === 'agent' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-purple-100 text-purple-700'
                                  )}>
                                    <User className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                    <span className="hidden xs:inline">{expense.createdByUser.fullName}</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-1 sm:ml-3">
                            <p className="text-sm sm:text-base md:text-lg font-bold text-red-600">
                              -{expense.amount.toLocaleString()} Ar
                            </p>
                            {expense.status === 'approved' && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[8px] sm:text-[10px] mt-0.5">
                                Validée
                              </Badge>
                            )}
                            {expense.status === 'refused' && (
                              <Badge className="bg-red-100 text-red-700 border-0 text-[8px] sm:text-[10px] mt-0.5">
                                Refusée
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <PaginationControls
                    currentPage={expensePage}
                    totalPages={totalExpensePages}
                    onPageChange={setExpensePage}
                    totalItems={allExpenses.length}
                    itemsPerPage={expensesPerPage}
                  />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ============================================================
            DIALOG TRIAGE OBLIGATOIRE - AVEC SCROLL CORRIGÉ
        ============================================================ */}
        <Dialog open={isSortingDialogOpen} onOpenChange={setIsSortingDialogOpen}>
          <DialogContent className={NEO.dialogContent} aria-describedby="sorting-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900 flex items-center gap-1 sm:gap-2">
                <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                Triage de la commande #{orderToSort?.id}
              </DialogTitle>
              <DialogDescription id="sorting-dialog-description" className="text-xs sm:text-sm text-slate-500">
                <span className="font-semibold text-red-600">Obligatoire</span> - Confirmez le nombre de pièces
              </DialogDescription>
            </DialogHeader>

            {orderToSort && (
              <div className="p-2 sm:p-3 bg-[#0B676E]/5 rounded-lg sm:rounded-xl border border-[#0B676E]/20 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-medium text-slate-900">{orderToSort.client.fullName}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                  {orderToSort.itemCount
                    ? `${orderToSort.itemCount} pièces estimées`
                    : 'Nombre de pièces non défini'}
                </p>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm text-slate-700 font-semibold">Nombre de pièces comptées *</Label>
                <Input
                  type="number"
                  className={NEO.input}
                  placeholder="Ex: 15"
                  value={sortingData.itemCount}
                  onChange={(e) => setSortingData({ ...sortingData, itemCount: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm text-slate-700">Notes de triage (optionnel)</Label>
                <Textarea
                  className={cn(NEO.input, "resize-none")}
                  placeholder="Ex: Tache sur chemise, bouton à recoudre..."
                  value={sortingData.notes}
                  onChange={(e) => setSortingData({ ...sortingData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsSortingDialogOpen(false)}
                className={cn(NEO.button, "w-full sm:w-auto text-xs sm:text-sm")}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSortingConfirm}
                disabled={updateStatusMutation.isPending || !sortingData.itemCount}
                className={cn(NEO.buttonPrimary, "w-full sm:w-auto text-xs sm:text-sm")}
              >
                {updateStatusMutation.isPending ? (
                  <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />Validation...</>
                ) : (
                  <><CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Valider le triage</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============================================================
            DIALOG DÉTAILS COMMANDE - AVEC SCROLL CORRIGÉ  
        ============================================================ */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className={NEO.dialogContentLarge} aria-describedby="order-details-description">
            {selectedOrder && (() => {
              const statusConf = STATUS_CONFIG[selectedOrder.status];
              const { priority, label, color, bgColor } = calculatePriority(selectedOrder);
              const config = priorityConfig[priority];

              return (
                <>
                  {/* HEADER - FIXE */}
                  <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-[#0B676E] to-teal-600 text-white rounded-t-2xl sm:rounded-t-3xl flex-shrink-0">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold shadow-[8px_8px_16px_rgba(0,0,0,0.2)] bg-gradient-to-br text-sm sm:text-base md:text-lg flex-shrink-0",
                          statusConf.gradient
                        )}>
                          #{selectedOrder.id}
                        </div>
                        <div className="min-w-0">
                          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                            {selectedOrder.client.fullName}
                          </DialogTitle>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                            <Badge className={cn("text-[8px] sm:text-[10px] md:text-xs border-0", statusConf.bgColor, statusConf.color)}>
                              {statusConf.icon}
                              <span className="ml-0.5 sm:ml-1">{statusConf.label}</span>
                            </Badge>
                            <Badge className={cn("text-[8px] sm:text-[10px] md:text-xs border-0", bgColor, color)}>
                              {config.icon} <span className="hidden xs:inline">{label}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDetailsOpen(false)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* CONTENU SCROLLABLE */}
                  <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] overflow-y-auto">
                    <div className="space-y-3 sm:space-y-4">
                      <ClientInfoCard client={selectedOrder.client} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <p className="text-[10px] sm:text-xs text-slate-500">Nombre de pièces</p>
                          <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 flex items-center gap-1 sm:gap-2">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                            {selectedOrder.itemCount || 'Non défini'}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <p className="text-[10px] sm:text-xs text-slate-500">Créée le</p>
                          <p className="text-xs sm:text-sm font-medium text-slate-900">
                            {selectedOrder.createdAt
                              ? format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })
                              : 'Non défini'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {selectedOrder.totalPrice !== undefined && selectedOrder.totalPrice !== null && (
                          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                            <p className="text-sm sm:text-base font-bold text-emerald-700 flex items-center gap-1 sm:gap-2">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                              {selectedOrder.totalPrice.toLocaleString()} Ar
                            </p>
                          </div>
                        )}
                        {selectedOrder.deposit !== undefined && selectedOrder.deposit !== null && (
                          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-[10px] sm:text-xs text-slate-500">Acompte</p>
                            <p className="text-sm sm:text-base font-bold text-blue-700 flex items-center gap-1 sm:gap-2">
                              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                              {selectedOrder.deposit.toLocaleString()} Ar
                            </p>
                          </div>
                        )}
                        {selectedOrder.remainingAmount !== undefined && selectedOrder.remainingAmount !== null && (
                          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50 shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-[10px] sm:text-xs text-slate-500">Reste à payer</p>
                            <p className="text-sm sm:text-base font-bold text-amber-700 flex items-center gap-1 sm:gap-2">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                              {selectedOrder.remainingAmount.toLocaleString()} Ar
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                          <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
                            <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Ramassage prévu
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-slate-900">
                            {format(new Date(selectedOrder.scheduledPickupDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </p>
                        </div>
                        {selectedOrder.scheduledDeliveryDate && (
                          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 sm:gap-1">
                              <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Livraison prévue
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-slate-900">
                              {format(new Date(selectedOrder.scheduledDeliveryDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedOrder.subscriptionDetails && (
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#0B676E]/5 border border-[#0B676E]/10">
                          <h4 className="font-semibold text-slate-900 flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 text-xs sm:text-sm">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                            Abonnement
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm">
                            {selectedOrder.subscriptionDetails.planName && (
                              <div>
                                <p className="text-[10px] sm:text-xs text-slate-500">Plan</p>
                                <p className="font-medium text-slate-700 truncate">{selectedOrder.subscriptionDetails.planName}</p>
                              </div>
                            )}
                            {selectedOrder.subscriptionDetails.pickupsPerWeek && (
                              <div>
                                <p className="text-[10px] sm:text-xs text-slate-500">Ramassages/semaine</p>
                                <p className="font-medium text-slate-700">{selectedOrder.subscriptionDetails.pickupsPerWeek}</p>
                              </div>
                            )}
                            {selectedOrder.subscriptionDetails.itemsIncluded && (
                              <div>
                                <p className="text-[10px] sm:text-xs text-slate-500">Pièces incluses</p>
                                <p className="font-medium text-slate-700">{selectedOrder.subscriptionDetails.itemsIncluded}</p>
                              </div>
                            )}
                            {selectedOrder.subscriptionDetails.deliveryTimeHours && (
                              <div>
                                <p className="text-[10px] sm:text-xs text-slate-500">Délai livraison</p>
                                <p className="font-medium text-slate-700">{selectedOrder.subscriptionDetails.deliveryTimeHours}h</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedOrder.specialInstructions && (
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border-l-4 border-amber-400">
                          <h4 className="font-semibold text-amber-900 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                            Instructions spéciales
                          </h4>
                          <p className="text-xs sm:text-sm text-amber-800 whitespace-pre-wrap">{selectedOrder.specialInstructions}</p>
                        </div>
                      )}

                      {selectedOrder.linensDetails && (
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50 border-l-4 border-blue-400">
                          <h4 className="font-semibold text-blue-900 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
                            Détails de triage
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-wrap">{selectedOrder.linensDetails}</p>
                        </div>
                      )}

                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-[#0B676E]" />
                            Notes ({orderNotes.length})
                          </h4>
                          {notesLoading && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-slate-400" />}
                        </div>

                        {notesLoading ? (
                          <div className="text-center py-4 sm:py-6">
                            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-[#0B676E] mx-auto" />
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">Chargement...</p>
                          </div>
                        ) : orderNotes.length === 0 ? (
                          <div className="text-center py-4 sm:py-6 bg-[#eef2f5] rounded-xl sm:rounded-2xl shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]">
                            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300 mx-auto mb-1 sm:mb-2" />
                            <p className="text-xs sm:text-sm text-slate-500">Aucune note</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 sm:space-y-2">
                            {orderNotes.map((note) => (
                              <NoteItem key={note.id} note={note} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>

                  {/* FOOTER - FIXE */}
                  <div className="p-3 sm:p-4 border-t border-white/40 bg-white/10 backdrop-blur-sm rounded-b-2xl sm:rounded-b-3xl flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {(() => {
                        const currentIndex = WORKFLOW_ORDER.indexOf(selectedOrder.status);
                        if (currentIndex !== -1 && currentIndex < WORKFLOW_ORDER.length - 1) {
                          const nextStatus = WORKFLOW_ORDER[currentIndex + 1];
                          const nextConf = STATUS_CONFIG[nextStatus];
                          return (
                            <Button
                              onClick={() => {
                                setIsDetailsOpen(false);
                                handleStatusChange(selectedOrder.id, nextStatus);
                              }}
                              className={cn(NEO.buttonPrimary, "flex-1 gap-1 sm:gap-2 text-xs sm:text-sm")}
                            >
                              {nextConf.icon}
                              <span className="hidden xs:inline">Passer à :</span> {nextConf.label}
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      <Button
                        variant="outline"
                        onClick={() => setIsDetailsOpen(false)}
                        className={cn(NEO.button, "sm:flex-none text-xs sm:text-sm")}
                      >
                        Fermer
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ============================================================
            DIALOG AJOUTER DÉPENSE - AVEC SCROLL CORRIGÉ
        ============================================================ */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className={NEO.dialogContent} aria-describedby="expense-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900 flex items-center gap-1 sm:gap-2">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B676E]" />
                Nouvelle dépense
              </DialogTitle>
              <DialogDescription id="expense-dialog-description" className="text-xs sm:text-sm text-slate-500">
                Enregistrez un frais professionnel. Sera validé automatiquement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm text-slate-700">Catégorie *</Label>
                <Select
                  value={expenseData.category}
                  onValueChange={(v) => setExpenseData({ ...expenseData, category: v })}
                >
                  <SelectTrigger className={NEO.input}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#eef2f5] rounded-xl sm:rounded-2xl border-0">
                    {AGENT_EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm text-slate-700">Description *</Label>
                <Input
                  className={NEO.input}
                  placeholder="Ex: Carburant pour livraison zone Anosy"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm text-slate-700">Montant (Ar) *</Label>
                <Input
                  type="number"
                  className={NEO.input}
                  placeholder="Ex: 25000"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm text-slate-700">Notes (optionnel)</Label>
                <Textarea
                  className={cn(NEO.input, "resize-none")}
                  placeholder="Détails supplémentaires..."
                  value={expenseData.notes}
                  onChange={(e) => setExpenseData({ ...expenseData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsExpenseDialogOpen(false)}
                className={cn(NEO.button, "w-full sm:w-auto text-xs sm:text-sm")}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateExpense}
                disabled={createExpenseMutation.isPending}
                className={cn(NEO.buttonPrimary, "w-full sm:w-auto text-xs sm:text-sm")}
              >
                {createExpenseMutation.isPending ? (
                  <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />Enregistrement...</>
                ) : (
                  <><Wallet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Enregistrer</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}