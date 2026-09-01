// server/services/late-detection.service.ts
import { db } from "../db";
import { orders } from "@shared/schema";
import { eq, and, not, inArray, isNull } from "drizzle-orm";

// Seuils de retard en heures
const PICKUP_LATE_THRESHOLD_HOURS = 8;
const DELIVERY_LATE_THRESHOLD_HOURS = 8;
const STUCK_STATUS_THRESHOLD_HOURS = 12;
const CRITICAL_LATE_HOURS = 24;

// Statuts bloqués (qui peuvent être en retard)
const STUCK_STATUSES = ["to_sort", "to_wash", "to_dry", "to_iron", "ready_to_deliver"];

// ============================================================
// FONCTION PRINCIPALE : Détecter si une commande est en retard
// ============================================================
export function isOrderLate(order: any): boolean {
  // Si déjà livrée, pas en retard
  if (order.status === 'delivered') {
    return false;
  }

  const now = new Date();
  
  // 1. VÉRIFICATION POUR LES RAMASSAGES (to_pickup)
  if (order.status === "to_pickup") {
    const startDate = order.scheduledPickupDate || order.createdAt;
    if (startDate) {
      const scheduled = new Date(startDate);
      const hoursLate = (now.getTime() - scheduled.getTime()) / 3600000;
      if (hoursLate > PICKUP_LATE_THRESHOLD_HOURS) {
        return true;
      }
    }
  }
  
  // 2. VÉRIFICATION POUR LES LIVRAISONS (to_deliver)
  if (order.status === "to_deliver") {
    const startDate = order.scheduledDeliveryDate || order.statusChangedAt || order.createdAt;
    if (startDate) {
      const scheduled = new Date(startDate);
      const hoursLate = (now.getTime() - scheduled.getTime()) / 3600000;
      if (hoursLate > DELIVERY_LATE_THRESHOLD_HOURS) {
        return true;
      }
    }
  }
  
  // 3. VÉRIFICATION POUR LES STATUTS BLOQUÉS
  if (STUCK_STATUSES.includes(order.status)) {
    const statusTime = order.statusChangedAt 
      ? new Date(order.statusChangedAt) 
      : new Date(order.updatedAt || order.createdAt);
    const hoursInStatus = (now.getTime() - statusTime.getTime()) / 3600000;
    if (hoursInStatus > STUCK_STATUS_THRESHOLD_HOURS) {
      return true;
    }
  }
  
  return false;
}

// ============================================================
// FONCTION : Obtenir le type de retard
// ============================================================
export function getLateType(order: any): string {
  if (order.status === 'delivered') {
    return "delivered";
  }

  const now = new Date();
  
  if (order.status === "to_pickup") {
    const startDate = order.scheduledPickupDate || order.createdAt;
    if (startDate) {
      const scheduled = new Date(startDate);
      const hoursLate = (now.getTime() - scheduled.getTime()) / 3600000;
      if (hoursLate > PICKUP_LATE_THRESHOLD_HOURS) {
        return "pickup_late";
      }
    }
  }
  
  if (order.status === "to_deliver") {
    const startDate = order.scheduledDeliveryDate || order.statusChangedAt || order.createdAt;
    if (startDate) {
      const scheduled = new Date(startDate);
      const hoursLate = (now.getTime() - scheduled.getTime()) / 3600000;
      if (hoursLate > DELIVERY_LATE_THRESHOLD_HOURS) {
        return "delivery_late";
      }
    }
  }
  
  if (STUCK_STATUSES.includes(order.status)) {
    return "status_stuck";
  }
  
  return "unknown";
}

// ============================================================
// FONCTION : Obtenir le nombre d'heures de retard
// ============================================================
export function getLateHours(order: any): number {
  if (!order || order.status === 'delivered') {
    return 0;
  }

  const now = new Date();
  let startTime: Date | null = null;

  if (order.status === "to_pickup") {
    startTime = order.scheduledPickupDate ? new Date(order.scheduledPickupDate) : new Date(order.createdAt);
  } else if (order.status === "to_deliver") {
    startTime = order.scheduledDeliveryDate ? new Date(order.scheduledDeliveryDate) : new Date(order.statusChangedAt || order.createdAt);
  } else if (STUCK_STATUSES.includes(order.status)) {
    startTime = order.statusChangedAt ? new Date(order.statusChangedAt) : new Date(order.updatedAt || order.createdAt);
  }

  if (!startTime) {
    return 0;
  }

  const hoursLate = (now.getTime() - startTime.getTime()) / 3600000;
  return Math.round(hoursLate * 100) / 100;
}

// ============================================================
// FONCTION : Scanner TOUTES les commandes et retourner les retards
// ============================================================
export async function scanLateOrders(): Promise<{ lateCount: number; details: any[] }> {
  try {
    const allOrders = await db.select().from(orders);
    let lateCount = 0;
    const details: any[] = [];

    for (const order of allOrders) {
      // Si déjà livrée, ignorer
      if (order.status === 'delivered') {
        continue;
      }

      const isLate = isOrderLate(order);
      const lateType = getLateType(order);
      const lateHours = getLateHours(order);

      if (isLate && lateType !== 'delivered') {
        details.push({
          orderId: order.id,
          status: order.status,
          lateType,
          lateHours,
          clientId: order.clientId,
          createdAt: order.createdAt
        });
        lateCount++;
      }
    }

    return { lateCount, details };
  } catch (error) {
    console.error("Error scanning late orders:", error);
    return { lateCount: 0, details: [] };
  }
}

// ============================================================
// FONCTION : Obtenir toutes les commandes en retard avec détails
// ============================================================
export async function getLateOrdersWithDetails() {
  try {
    const allOrders = await db.select().from(orders);
    
    const lateOrdersList = allOrders.filter(order => {
      return order.status !== 'delivered' && isOrderLate(order);
    });
    
    return lateOrdersList.map(order => ({
      ...order,
      lateHours: getLateHours(order),
      lateType: getLateType(order),
      isLate: isOrderLate(order)
    }));
  } catch (error) {
    console.error("Error getting late orders:", error);
    return [];
  }
}

// ============================================================
// FONCTION : Obtenir les statistiques des retards
// ============================================================
export async function getLateStats() {
  try {
    const allOrders = await db.select().from(orders);
    
    const stats = {
      totalOrders: allOrders.length,
      delivered: 0,
      active: 0,
      late: 0,
      pickupLate: 0,
      deliveryLate: 0,
      statusStuck: 0,
      byStatus: {} as Record<string, { total: number; late: number }>,
      avgLateHours: 0,
      maxLateHours: 0,
      criticalLate: 0, // plus de 24h
    };

    let totalLateHours = 0;
    let lateCount = 0;

    for (const order of allOrders) {
      // Initialiser les stats par statut
      if (!stats.byStatus[order.status]) {
        stats.byStatus[order.status] = { total: 0, late: 0 };
      }
      stats.byStatus[order.status].total++;

      if (order.status === 'delivered') {
        stats.delivered++;
        continue;
      }

      stats.active++;
      const isLate = isOrderLate(order);
      
      if (isLate) {
        stats.late++;
        const lateHours = getLateHours(order);
        const lateType = getLateType(order);
        
        totalLateHours += lateHours;
        lateCount++;
        
        if (lateHours > stats.maxLateHours) {
          stats.maxLateHours = lateHours;
        }
        
        if (lateHours > 24) {
          stats.criticalLate++;
        }
        
        if (lateType === 'pickup_late') {
          stats.pickupLate++;
        } else if (lateType === 'delivery_late') {
          stats.deliveryLate++;
        } else if (lateType === 'status_stuck') {
          stats.statusStuck++;
        }
        
        stats.byStatus[order.status].late++;
      }
    }

    stats.avgLateHours = lateCount > 0 ? Math.round((totalLateHours / lateCount) * 100) / 100 : 0;

    return stats;
  } catch (error) {
    console.error("Error getting late stats:", error);
    return {
      totalOrders: 0,
      delivered: 0,
      active: 0,
      late: 0,
      pickupLate: 0,
      deliveryLate: 0,
      statusStuck: 0,
      byStatus: {},
      avgLateHours: 0,
      maxLateHours: 0,
      criticalLate: 0,
    };
  }
}

// ============================================================
// FONCTION : Enregistrer une détection de retard (SIMPLIFIÉE - sans table orderLateHistory)
// ============================================================
export async function recordLateDetection(orderId: number, lateType: string, lateHours: number) {
  try {
    console.log(`[LATE] Commande #${orderId} en retard: ${lateType} - ${lateHours}h`);
    // Rien à faire car orderLateHistory n'existe pas
    // On pourrait juste logger ou envoyer une notification
  } catch (error) {
    console.error("Error recording late detection:", error);
  }
}

// ============================================================
// FONCTION : Enregistrer une résolution de retard (SIMPLIFIÉE)
// ============================================================
export async function recordLateResolution(orderId: number, resolvedBy: number) {
  try {
    console.log(`[LATE] Commande #${orderId} résolue par ${resolvedBy}`);
    // Rien à faire car orderLateHistory n'existe pas
  } catch (error) {
    console.error("Error recording late resolution:", error);
  }
}