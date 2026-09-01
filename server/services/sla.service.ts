// server/services/sla.service.ts

export const WORKFLOW_STEPS = [
  { status: "to_pickup", label: "À ramasser", sla: 8 },
  { status: "to_sort", label: "À trier", sla: 4 },
  { status: "to_wash", label: "En lavage", sla: 6 },
  { status: "to_dry", label: "En séchage", sla: 4 },
  { status: "to_iron", label: "En repassage", sla: 5 },
  { status: "ready_to_deliver", label: "Prêt à livrer", sla: 2 },
  { status: "to_deliver", label: "En livraison", sla: 8 },
  { status: "delivered", label: "Livré", sla: 0 },
];

// Statuts exclus des calculs SLA - CORRIGÉ (statuts réels du schéma)
const EXCLUDED_STATUSES: string[] = []; // Aucun statut exclu dans le schéma actuel

// Statuts actifs pour les calculs
const ACTIVE_STATUSES = ['to_pickup', 'to_sort', 'to_wash', 'to_dry', 'to_iron', 'ready_to_deliver', 'to_deliver'];

export function calculateSLALevel(order: any): { level: string; progress: number; timeInStatus: number } {
  // Si livrée, pas de SLA
  if (order.status === 'delivered') {
    return { level: "normal", progress: 100, timeInStatus: 0 };
  }

  const now = new Date();
  const startTime = order.statusChangedAt ? new Date(order.statusChangedAt) : new Date(order.createdAt);
  const timeInStatus = Math.floor((now.getTime() - startTime.getTime()) / 60000);
  const step = WORKFLOW_STEPS.find(s => s.status === order.status);
  
  if (!step || step.sla === 0) {
    return { level: "normal", progress: 0, timeInStatus };
  }
  
  const progress = (timeInStatus / (step.sla * 60)) * 100;
  let level = "normal";
  
  if (progress >= 100) level = "retard";
  else if (progress >= 80) level = "urgent";
  else if (progress >= 60) level = "attention";
  
  return { level, progress: Math.min(Math.round(progress), 100), timeInStatus };
}

export function formatTimeRemaining(timeInMinutes: number, slaHours: number): string {
  const remaining = slaHours * 60 - timeInMinutes;
  if (remaining <= 0) return "Dépassé";
  if (remaining < 60) return `${remaining} min`;
  const h = Math.floor(remaining / 60);
  const m = remaining % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}

export function isOrderActive(order: any): boolean {
  if (!order) return false;
  return order.status !== 'delivered';
}

export function getActiveStatuses(): string[] {
  return ACTIVE_STATUSES;
}

export function getExcludedStatuses(): string[] {
  return EXCLUDED_STATUSES;
}

export function isValidOrder(order: any): boolean {
  if (!order) return false;
  return true; // Tous les statuts du schéma sont valides
}