// src/pages/OrdersTab/utils/sla.ts
import { addHours, parseISO, differenceInHours } from "date-fns";
import { Order } from "../types";
import { WORKFLOW_STEPS } from "../constants";

export interface SLAData {
  deadline: Date | null;
  startTime: Date | null;
  totalHours: number;
  type: 'pickup' | 'delivery' | 'intermediate' | null;
  label: string;
}

export interface CountdownData {
  remainingMs: number;
  isLate: boolean;
  lateHours: number;
  progressPercent: number;
  displayTime: string;
}

export const getOrderSLAData = (order: Order, now: Date): SLAData => {
  if (order.status === 'delivered') {
    return { deadline: null, startTime: null, totalHours: 0, type: null, label: 'Terminé' };
  }

  const step = WORKFLOW_STEPS.find(s => s.status === order.status);
  const slaHours = step?.sla || 8;

  if (order.status === 'to_pickup' && order.scheduledPickupDate) {
    const startTime = parseISO(order.scheduledPickupDate);
    const deadline = addHours(startTime, slaHours);
    return { deadline, startTime, totalHours: slaHours, type: 'pickup', label: 'Délai ramassage' };
  }

  if (order.status === 'to_deliver' && order.scheduledDeliveryDate) {
    const startTime = parseISO(order.scheduledDeliveryDate);
    const deadline = addHours(startTime, slaHours);
    return { deadline, startTime, totalHours: slaHours, type: 'delivery', label: 'Délai livraison' };
  }

  const intermediateStatuses = ['to_sort', 'to_wash', 'to_dry', 'to_iron', 'ready_to_deliver'];
  if (intermediateStatuses.includes(order.status)) {
    const baseTimeStr = order.statusChangedAt || order.updatedAt || order.createdAt;
    if (baseTimeStr) {
      const startTime = parseISO(baseTimeStr);
      const deadline = addHours(startTime, slaHours);
      return { deadline, startTime, totalHours: slaHours, type: 'intermediate', label: `Délai ${step?.label}` };
    }
  }

  return { deadline: null, startTime: null, totalHours: 0, type: null, label: 'Délai non défini' };
};

export const getOrderCountdown = (order: Order, now: Date): CountdownData | null => {
  const slaData = getOrderSLAData(order, now);
  if (!slaData.deadline) return null;

  const remainingMs = slaData.deadline.getTime() - now.getTime();
  const isLate = remainingMs <= 0;
  const lateHours = isLate ? Math.abs(Math.floor(remainingMs / (1000 * 60 * 60))) : 0;
  
  let progressPercent = 0;
  if (slaData.startTime) {
    const totalMs = slaData.deadline.getTime() - slaData.startTime.getTime();
    const elapsedMs = now.getTime() - slaData.startTime.getTime();
    progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  }

  let displayTime = '';
  if (isLate) {
    const hours = Math.floor(Math.abs(remainingMs) / (1000 * 60 * 60));
    const minutes = Math.floor((Math.abs(remainingMs) % (1000 * 60 * 60)) / (1000 * 60));
    displayTime = `Retard: ${hours}h ${minutes}m`;
  } else {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    displayTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  return { remainingMs, isLate, lateHours, progressPercent, displayTime };
};

export const getNextStatus = (currentStatus: string): string | null => {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.status === currentStatus);
  if (currentIndex < WORKFLOW_STEPS.length - 1) {
    return WORKFLOW_STEPS[currentIndex + 1].status;
  }
  return null;
};

export const getPreviousStatus = (currentStatus: string): string | null => {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.status === currentStatus);
  if (currentIndex > 0) {
    return WORKFLOW_STEPS[currentIndex - 1].status;
  }
  return null;
};