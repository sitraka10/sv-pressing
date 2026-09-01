// src/pages/OrdersTab/components/OrderCard.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, Calendar, Truck, ChevronDown, ArrowRight, Eye,
  MessageSquare
} from 'lucide-react';
import { Order } from '../types';
import { getStatusBadge, formatDate } from '../utils/format';
import { getOrderCountdown, getNextStatus } from '../utils/sla';
import { WORKFLOW_STEPS } from '../constants';
import { cn } from '@/lib/utils';
import { WorkflowProgressBar } from './WorkflowProgressBar';
import { SLADisplay } from './SLADisplay';

// Styles Neomorphic
const neomorphic = {
  card: "bg-[#eef2f5] rounded-3xl shadow-[12px_12px_24px_#b8c2ca,-12px_-12px_24px_#ffffff,inset_1px_1px_1px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[16px_16px_32px_#b8c2ca,-16px_-16px_32px_#ffffff] hover:-translate-y-1",
  button: "bg-[#eef2f5] rounded-2xl shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-0.5 active:shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff] active:translate-y-0.5 border-0",
  buttonPrimary: "bg-gradient-to-br from-[#0B676E] to-[#085257] text-white shadow-[8px_8px_16px_#b8c2ca,-8px_-8px_16px_#ffffff,inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_8px_#b8c2ca,-4px_-4px_8px_#ffffff] hover:-translate-y-1 active:translate-y-0.5",
  badge: "bg-[#0B676E] text-white shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.3)] border-0",
};

interface BaseOrderCardProps {
  order: Order;
  idx: number;
  clients: any[];
  now: Date;
  handleStatusChange: (orderId: number, status: string, itemCount?: number) => void;
  handleStatusChangeRequest: (orderId: number, newStatus: string) => void;
  handleOpenNoteDialog: (order: Order) => void;
  openOrderDetail: (order: Order) => void;
  setRescheduleDialog: (dialog: any) => void;
}

export const MobileOrderCard: React.FC<BaseOrderCardProps & { expandedOrderId: number | null; toggleOrderExpand: (id: number) => void }> = ({
  order, idx, clients, now, handleStatusChange, handleStatusChangeRequest,
  handleOpenNoteDialog, openOrderDetail, setRescheduleDialog,
  expandedOrderId, toggleOrderExpand
}) => {
  const client = clients.find(c => c.id === order.clientId);
  const isLate = getOrderCountdown(order, now)?.isLate || false;
  const hasNotes = order.notes && order.notes.length > 0;
  const unreadCount = order.notes?.filter(n => !n.isRead).length || 0;
  const currentStep = WORKFLOW_STEPS.findIndex(s => s.status === order.status);
  const nextStep = getNextStatus(order.status);
  const isExpanded = expandedOrderId === order.id;

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={cn(
        neomorphic.card,
        isLate ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#0B676E]"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-2xl flex items-center justify-center",
              "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
              isLate ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-[#0B676E] to-teal-500"
            )}>
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800">#{order.id}</span>
                {getStatusBadge(order.status, isLate)}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{client?.fullName || 'Client inconnu'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenNoteDialog(order)}
                className={cn(neomorphic.button, "h-7 px-2 text-[#0B676E] border-0")}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs font-bold bg-red-500 text-white rounded-full min-w-[16px] h-4 px-1">
                    {unreadCount}
                  </span>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleOrderExpand(order.id)}
              className={cn(neomorphic.button, "h-7 w-7 p-0 border-0")}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(order.createdAt, "dd/MM")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3" />
            <span>{order.itemCount || '?'}</span>
          </div>
        </div>

        <div className="mt-2">
          <SLADisplay order={order} now={now} />
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-white/40 space-y-3">
                <WorkflowProgressBar status={order.status} onClick={(status) => {
                  const step = WORKFLOW_STEPS.find(s => s.status === status);
                  if (step && step.order <= currentStep) handleStatusChange(order.id, status);
                  else if (step && step.order === currentStep + 1) handleStatusChangeRequest(order.id, status);
                }} />

                <div className="grid grid-cols-2 gap-2">
                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-2xl",
                    "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
                  )}>
                    <Calendar className="h-3 w-3 text-[#0B676E]" />
                    <div>
                      <p className="text-[10px] text-gray-500">Ramassage</p>
                      <p className="font-semibold text-xs">{formatDate(order.scheduledPickupDate, "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-2xl",
                    "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
                  )}>
                    <Truck className="h-3 w-3 text-[#0B676E]" />
                    <div>
                      <p className="text-[10px] text-gray-500">Livraison</p>
                      <p className="font-semibold text-xs">{formatDate(order.scheduledDeliveryDate, "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === "to_pickup" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRescheduleDialog({ open: true, orderId: order.id, orderNumber: order.id, currentDate: formatDate(order.scheduledPickupDate, "dd MMMM yyyy"), clientName: client?.fullName })}
                      className={cn(neomorphic.button, "flex-1 text-amber-600 border-0 text-xs")}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Reporter
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenNoteDialog(order)}
                    className={cn(neomorphic.button, "flex-1 text-gray-600 border-0 text-xs")}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Notes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openOrderDetail(order)}
                    className={cn(neomorphic.button, "flex-1 text-[#0B676E] border-0 text-xs")}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Détails
                  </Button>
                </div>

                {nextStep && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChangeRequest(order.id, nextStep)}
                    className={cn(
                      "w-full rounded-2xl shadow-sm text-xs",
                      isLate ? "bg-gradient-to-r from-red-600 to-orange-600 text-white" : neomorphic.buttonPrimary
                    )}
                  >
                    {nextStep === 'delivered' ? 'Marquer livré' :
                      nextStep === 'to_sort' ? 'Passer au tri' :
                      nextStep === 'to_wash' ? 'Passer au lavage' :
                      nextStep === 'to_dry' ? 'Passer au séchage' :
                      nextStep === 'to_iron' ? 'Passer au repassage' :
                      nextStep === 'ready_to_deliver' ? 'Marquer prêt' :
                      nextStep === 'to_deliver' ? 'Mettre en livraison' : 'Passer à l\'étape suivante'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const DesktopOrderCard: React.FC<BaseOrderCardProps> = ({
  order, idx, clients, now, handleStatusChange, handleStatusChangeRequest,
  handleOpenNoteDialog, openOrderDetail, setRescheduleDialog
}) => {
  const client = clients.find(c => c.id === order.clientId);
  const isLate = getOrderCountdown(order, now)?.isLate || false;
  const hasNotes = order.notes && order.notes.length > 0;
  const unreadCount = order.notes?.filter(n => !n.isRead).length || 0;
  const currentStep = WORKFLOW_STEPS.findIndex(s => s.status === order.status);
  const nextStep = getNextStatus(order.status);

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={cn(
        neomorphic.card,
        isLate ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#0B676E]"
      )}
    >
      <div className="p-4 border-b border-white/40 bg-white/20 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center",
              "shadow-[inset_2px_2px_4px_#b8c2ca,inset_-2px_-2px_4px_#ffffff]",
              isLate ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-[#0B676E] to-teal-500"
            )}>
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-bold text-gray-800">Commande #{order.id}</span>
                {getStatusBadge(order.status, isLate)}
                {hasNotes && (
                  <Badge
                    variant="outline"
                    className="bg-[#eef2f5] text-[#0B676E] border-0 shadow-[4px_4px_8px_#b8c2ca,-2px_-2px_4px_#ffffff] cursor-pointer"
                    onClick={() => handleOpenNoteDialog(order)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {unreadCount > 0 ? `${unreadCount} note${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : `${order.notes?.length || 0} note${(order.notes?.length || 0) > 1 ? 's' : ''}`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{client?.fullName || 'Client inconnu'}</span>
                <span>•</span>
                <span>Créée le {formatDate(order.createdAt, "dd/MM/yyyy")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOrderDetail(order)}
              className={cn(neomorphic.button, "text-[#0B676E] border-0")}
            >
              <Eye className="h-4 w-4 mr-1" />Détails
            </Button>
            {order.status === "to_pickup" && (
              <Button                variant="ghost"
                size="sm"
                onClick={() => setRescheduleDialog({ open: true, orderId: order.id, orderNumber: order.id, currentDate: formatDate(order.scheduledPickupDate, "dd MMMM yyyy"), clientName: client?.fullName })}
                className={cn(neomorphic.button, "text-amber-600 border-0")}
              >
                <Calendar className="h-4 w-4 mr-1" />Reporter
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenNoteDialog(order)}
              className={cn(
                neomorphic.button,
                "border-0",
                unreadCount > 0 ? "text-[#0B676E]" : "text-gray-500"
              )}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Notes {unreadCount > 0 && `(${unreadCount})`}
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <WorkflowProgressBar status={order.status} onClick={(status) => {
          const step = WORKFLOW_STEPS.find(s => s.status === status);
          if (step && step.order <= currentStep) handleStatusChange(order.id, status);
          else if (step && step.order === currentStep + 1) handleStatusChangeRequest(order.id, status);
        }} />
        <SLADisplay order={order} now={now} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-2xl",
            "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
          )}>
            <Package className="h-4 w-4 text-[#0B676E]" />
            <div>
              <p className="text-xs text-gray-500">Articles</p>
              <p className="font-semibold text-sm">{order.itemCount || 'À compter'} pièce{order.itemCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-2xl",
            "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
          )}>
            <Calendar className="h-4 w-4 text-[#0B676E]" />
            <div>
              <p className="text-xs text-gray-500">Ramassage</p>
              <p className="font-semibold text-sm">{formatDate(order.scheduledPickupDate, "dd/MM/yyyy")}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-2xl",
            "bg-[#eef2f5] shadow-[inset_4px_4px_8px_#b8c2ca,inset_-4px_-4px_8px_#ffffff]"
          )}>
            <Truck className="h-4 w-4 text-[#0B676E]" />
            <div>
              <p className="text-xs text-gray-500">Livraison</p>
              <p className="font-semibold text-sm">{formatDate(order.scheduledDeliveryDate, "dd/MM/yyyy")}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-white/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { const prevStatus = WORKFLOW_STEPS[currentStep - 1]?.status; if (prevStatus) handleStatusChange(order.id, prevStatus); }}
            disabled={currentStep === 0}
            className={cn(neomorphic.button, "rounded-2xl border-0")}
          >
            <ArrowRight className="h-3 w-3 mr-1 rotate-180" />Retour
          </Button>
          {nextStep && (
            <Button
              size="sm"
              onClick={() => handleStatusChangeRequest(order.id, nextStep)}
              className={cn(
                "rounded-2xl shadow-sm",
                isLate ? "bg-gradient-to-r from-red-600 to-orange-600 text-white" : neomorphic.buttonPrimary
              )}
            >
              {nextStep === 'delivered' ? 'Marquer livré' :
                nextStep === 'to_sort' ? 'Passer au tri' :
                nextStep === 'to_wash' ? 'Passer au lavage' :
                nextStep === 'to_dry' ? 'Passer au séchage' :
                nextStep === 'to_iron' ? 'Passer au repassage' :
                nextStep === 'ready_to_deliver' ? 'Marquer prêt' :
                nextStep === 'to_deliver' ? 'Mettre en livraison' : 'Passer à l\'étape suivante'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};