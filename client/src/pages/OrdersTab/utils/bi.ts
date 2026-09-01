// src/pages/OrdersTab/utils/bi.ts
import { 
  Order, StageMetrics, GlobalMetrics, TimeSeriesData, 
  StageTransition, RiskAlert, IntelligentRecommendation, StageHistoryEntry 
} from "../types";
import { WORKFLOW_STEPS } from "../constants";
import { 
  parseISO, addHours, subDays, differenceInHours, 
  format, isValid 
} from "date-fns";
import { getOrderCountdown } from "./sla";

export const generateStageHistory = (order: Order): StageHistoryEntry[] => {
  const history: StageHistoryEntry[] = [];
  const steps = WORKFLOW_STEPS;
  const createdDate = parseISO(order.createdAt);
  let currentDate = new Date(createdDate);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const orderStepIndex = steps.findIndex(s => s.status === order.status);
    if (step.order <= orderStepIndex + 1) {
      const enteredAt = new Date(currentDate);
      let duration: number | undefined;
      
      if (step.status === order.status) {
        duration = differenceInHours(new Date(), enteredAt);
      } else {
        duration = step.sla * 0.7 + Math.random() * step.sla * 0.6;
        currentDate = addHours(currentDate, duration);
      }
      
      history.push({
        stage: step.status,
        enteredAt: enteredAt.toISOString(),
        exitedAt: step.status !== order.status ? currentDate.toISOString() : undefined,
        duration: duration
      });
    }
  }
  return history;
};

export const calculateOverallProgress = (orders: Order[]): { percent: number; completed: number; total: number; byStage: { stage: string; count: number; percent: number; }[]; avgProgress: number } => {
  const totalOrders = orders.length;
  if (totalOrders === 0) return { percent: 0, completed: 0, total: 0, byStage: [], avgProgress: 0 };

  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const activeOrders = orders.filter(o => o.status !== 'delivered');
  
  let totalProgress = 0;
  const byStage: { stage: string; count: number; percent: number; }[] = [];

  WORKFLOW_STEPS.forEach(step => {
    const count = orders.filter(o => o.status === step.status).length;
    const percent = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
    byStage.push({ stage: step.label, count, percent });
    
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.status === step.status);
    const stepProgress = ((stepIndex + 1) / WORKFLOW_STEPS.length) * 100;
    totalProgress += (count * stepProgress);
  });

  const avgProgress = totalOrders > 0 ? totalProgress / totalOrders : 0;
  const globalPercent = totalOrders > 0 ? Math.round(((completedOrders * 100) + (avgProgress * activeOrders.length)) / totalOrders) : 0;

  return { percent: globalPercent, completed: completedOrders, total: totalOrders, byStage, avgProgress: Math.round(avgProgress) };
};

export const calculateStageMetrics = (orders: Order[], now: Date): StageMetrics[] => {
  return WORKFLOW_STEPS.map(step => {
    const stageOrders = orders.filter(o => o.status === step.status);
    const allOrdersThatPassedStage = orders.filter(o => {
      const stepIndex = WORKFLOW_STEPS.findIndex(s => s.status === step.status);
      const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.status === o.status);
      return currentStepIndex >= stepIndex || o.status === step.status;
    });

    const times: number[] = [];
    let delayed = 0;
    let totalTimeSpent = 0;
    let waitingOrders = 0;

    allOrdersThatPassedStage.forEach(order => {
      const history = order.stageHistory || generateStageHistory(order);
      const stageEntry = history.find(h => h.stage === step.status);
      
      if (stageEntry) {
        if (stageEntry.duration) {
          times.push(stageEntry.duration);
          totalTimeSpent += stageEntry.duration;
          if (stageEntry.duration > step.sla) delayed++;
        }
        if (order.status === step.status && stageEntry.duration && stageEntry.duration > step.sla) waitingOrders++;
      }
    });

    times.sort((a, b) => a - b);
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const minTime = times.length > 0 ? times[0] : 0;
    const maxTime = times.length > 0 ? times[times.length - 1] : 0;
    const medianTime = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;

    const throughput = avgTime > 0 ? stageOrders.length / avgTime : 0;
    const efficiency = step.sla > 0 ? Math.max(0, Math.min(100, 100 - ((avgTime - step.sla) / step.sla * 100))) : 100;
    const utilization = step.capacity > 0 ? Math.min(100, (stageOrders.length / step.capacity) * 100) : 0;

    return {
      stage: step.status, label: step.label, count: stageOrders.length,
      avgTimeHours: Math.round(avgTime * 10) / 10, minTimeHours: Math.round(minTime * 10) / 10,
      maxTimeHours: Math.round(maxTime * 10) / 10, medianTimeHours: Math.round(medianTime * 10) / 10,
      delayedCount: delayed,
      delayPercentage: allOrdersThatPassedStage.length > 0 ? Math.round((delayed / allOrdersThatPassedStage.length) * 100) : 0,
      throughput: Math.round(throughput * 100) / 100, trend: avgTime > step.sla * 1.1 ? 'down' : avgTime < step.sla * 0.9 ? 'up' : 'stable',
      color: step.color, icon: step.icon, totalTimeSpent: Math.round(totalTimeSpent * 10) / 10,
      efficiency: Math.round(efficiency), waitingOrders: waitingOrders, capacity: step.capacity,
      utilization: Math.round(utilization), slaHours: step.sla
    };
  });
};

export const calculateGlobalMetrics = (orders: Order[], now: Date): GlobalMetrics => {
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status !== 'delivered').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  
  const delayedOrders = orders.filter(o => {
    if (o.status === 'delivered') return false;
    const countdown = getOrderCountdown(o, now);
    return countdown?.isLate || false;
  }).length;

  const completionTimes: number[] = [];
  orders.filter(o => o.status === 'delivered' && o.actualDeliveryDate && o.createdAt).forEach(o => {
    const start = parseISO(o.createdAt);
    const end = parseISO(o.actualDeliveryDate!);
    completionTimes.push(differenceInHours(end, start));
  });

  const avgCompletionTime = completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0;
  const sortedTimes = [...completionTimes].sort((a, b) => a - b);
  const medianCompletionTime = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;
  const onTimeRate = totalOrders > 0 ? Math.round(((totalOrders - delayedOrders) / totalOrders) * 100) : 100;

  const stageMetrics = calculateStageMetrics(orders, now);
  const bottleneckStage = stageMetrics.reduce((max, stage) => stage.delayPercentage > max.delayPercentage && stage.count > 0 ? stage : max, stageMetrics[0]);

  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentOrders = orders.filter(o => parseISO(o.createdAt) >= thirtyDaysAgo);
  const avgDailyVolume = Math.round(recentOrders.length / 30);
  const projectedVolume = Math.round(avgDailyVolume * 30);

  const lastWeek = subDays(new Date(), 7);
  const lastMonth = subDays(new Date(), 30);
  
  const ordersLastWeek = orders.filter(o => parseISO(o.createdAt) >= lastWeek).length;
  const ordersPreviousWeek = orders.filter(o => {
    const date = parseISO(o.createdAt);
    return date >= subDays(lastWeek, 7) && date < lastWeek;
  }).length;
  const weeklyGrowth = ordersPreviousWeek > 0 ? Math.round(((ordersLastWeek - ordersPreviousWeek) / ordersPreviousWeek) * 100) : 0;

  const ordersLastMonth = orders.filter(o => parseISO(o.createdAt) >= lastMonth).length;
  const ordersPreviousMonth = orders.filter(o => {
    const date = parseISO(o.createdAt);
    return date >= subDays(lastMonth, 30) && date < lastMonth;
  }).length;
  const monthlyGrowth = ordersPreviousMonth > 0 ? Math.round(((ordersLastMonth - ordersPreviousMonth) / ordersPreviousMonth) * 100) : 0;

  const ordersWithItems = orders.filter(o => o.itemCount && o.itemCount > 0);
  const avgItemsPerOrder = ordersWithItems.length > 0 ? Math.round((ordersWithItems.reduce((sum, o) => sum + (o.itemCount || 0), 0) / ordersWithItems.length) * 10) / 10 : 0;
  const totalItemsProcessed = orders.reduce((sum, o) => sum + (o.itemCount || 0), 0);

  const hourDistribution: Record<number, number> = {};
  orders.forEach(o => {
    const hour = parseISO(o.createdAt).getHours();
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourDistribution).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hour]) => `${hour}h`);
  const lowActivityHours = Object.entries(hourDistribution).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([hour]) => `${hour}h`);

  const riskScore = Math.min(100, Math.round(
    (delayedOrders / Math.max(1, activeOrders)) * 30 +
    (stageMetrics.filter(s => s.delayPercentage > 20).length * 10) +
    (stageMetrics.filter(s => s.utilization > 90).length * 10) +
    (weeklyGrowth > 20 ? 20 : 0)
  ));

  const recoveryTime = stageMetrics.reduce((sum, stage) => stage.delayPercentage > 20 ? sum + (stage.count * 2) : sum, 0);

  const weekendOrders = orders.filter(o => { const day = parseISO(o.createdAt).getDay(); return day === 0 || day === 6; }).length;
  const weekendVolume = weekendOrders;
  const weekdayVolume = orders.length - weekendOrders;

  return {
    totalOrders, activeOrders, completedOrders, delayedOrders,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10, medianCompletionTime: Math.round(medianCompletionTime * 10) / 10,
    onTimeRate, bottleneckStage: bottleneckStage?.label || 'Aucun', criticalOrders: delayedOrders,
    avgDailyVolume, projectedVolume, weeklyGrowth, monthlyGrowth, avgItemsPerOrder, totalItemsProcessed,
    peakHours, lowActivityHours, riskScore, recoveryTime, weekendVolume, weekdayVolume
  };
};

export const calculateTimeSeriesData = (orders: Order[], now: Date, days: number = 30): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const dateStr = format(date, 'dd/MM');
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const ordersCreated = orders.filter(o => parseISO(o.createdAt) >= startOfDay && parseISO(o.createdAt) <= endOfDay);
    const ordersCompleted = orders.filter(o => o.actualDeliveryDate && parseISO(o.actualDeliveryDate) >= startOfDay && parseISO(o.actualDeliveryDate) <= endOfDay);
    const ordersDelayedOnDay = orders.filter(o => o.status !== 'delivered' && (getOrderCountdown(o, now)?.isLate || false));

    const times: number[] = [];
    ordersCompleted.forEach(o => {
      if (o.createdAt && o.actualDeliveryDate) {
        times.push(differenceInHours(parseISO(o.actualDeliveryDate), parseISO(o.createdAt)));
      }
    });
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const dayOfWeek = date.getDay();

    data.push({
      date: dateStr, completed: ordersCompleted.length, created: ordersCreated.length,
      delayed: ordersDelayedOnDay.length, avgTime: Math.round(avgTime * 10) / 10,
      dayOfWeek, isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    });
  }
  return data;
};

export const calculateStageTransitions = (orders: Order[], now: Date): StageTransition[] => {
  const transitions: Record<string, { count: number; totalTime: number; delays: number; timeDistribution: Record<string, number> }> = {};

  orders.forEach(order => {
    const history = order.stageHistory || generateStageHistory(order);
    for (let i = 0; i < history.length - 1; i++) {
      const fromEntry = history[i], toEntry = history[i + 1];
      if (fromEntry.exitedAt && toEntry.enteredAt) {
        const key = `${fromEntry.stage}->${toEntry.stage}`;
        const enteredTime = parseISO(toEntry.enteredAt);
        const timeSpent = differenceInHours(enteredTime, parseISO(fromEntry.exitedAt));
        const hourSlot = `${Math.floor(enteredTime.getHours() / 4) * 4}-${Math.floor(enteredTime.getHours() / 4) * 4 + 4}`;
        const fromStep = WORKFLOW_STEPS.find(s => s.status === fromEntry.stage);
        const isDelayed = timeSpent > (fromStep?.sla || 8);
        
        if (!transitions[key]) transitions[key] = { count: 0, totalTime: 0, delays: 0, timeDistribution: {} };
        transitions[key].count++;
        transitions[key].totalTime += timeSpent;
        if (isDelayed) transitions[key].delays++;
        transitions[key].timeDistribution[hourSlot] = (transitions[key].timeDistribution[hourSlot] || 0) + 1;
      }
    }
  });

  return Object.entries(transitions).map(([key, value]) => {
    const [fromStage, toStage] = key.split('->');
    const fromStep = WORKFLOW_STEPS.find(s => s.status === fromStage);
    const toStep = WORKFLOW_STEPS.find(s => s.status === toStage);
    return {
      fromStage: fromStep?.label || fromStage, toStage: toStep?.label || toStage,
      avgTimeHours: Math.round((value.totalTime / value.count) * 10) / 10,
      count: value.count, delayRate: Math.round((value.delays / value.count) * 100), timeOfDay: value.timeDistribution
    };
  });
};

export const generateRiskAlerts = (metrics: GlobalMetrics, stageMetrics: StageMetrics[], now: Date): RiskAlert[] => {
  const alerts: RiskAlert[] = [];

  if (metrics.delayedOrders > 10) {
    alerts.push({ level: 'danger', title: 'Retards critiques', description: `${metrics.delayedOrders} commandes en retard`, action: 'Activer le plan d\'urgence', impact: 'Risque client élevé', metric: metrics.delayedOrders, threshold: 10 });
  } else if (metrics.delayedOrders > 5) {
    alerts.push({ level: 'warning', title: 'Retards préoccupants', description: `${metrics.delayedOrders} commandes en retard`, action: 'Réaffecter des ressources', impact: 'Impact modéré sur SLA', metric: metrics.delayedOrders, threshold: 5 });
  }

  const bottlenecks = stageMetrics.filter(s => s.delayPercentage > 30 && s.count > 0);
  bottlenecks.forEach(bottleneck => {
    alerts.push({ level: bottleneck.delayPercentage > 50 ? 'danger' : 'warning', title: `Goulot à l'étape "${bottleneck.label}"`, description: `${bottleneck.delayPercentage}% de retards`, action: 'Ajouter des ressources immédiatement', impact: `${bottleneck.avgTimeHours}h vs SLA ${bottleneck.slaHours}h`, metric: bottleneck.delayPercentage, threshold: 30 });
  });

  if (metrics.avgCompletionTime > 36) {
    alerts.push({ level: 'danger', title: 'Temps de cycle trop long', description: `${metrics.avgCompletionTime}h (objectif: 24h)`, action: 'Revoir le processus de production', impact: 'Perte de compétitivité', metric: metrics.avgCompletionTime, threshold: 24 });
  } else if (metrics.avgCompletionTime > 30) {
    alerts.push({ level: 'warning', title: 'Temps de cycle élevé', description: `${metrics.avgCompletionTime}h (objectif: 24h)`, action: 'Optimiser les étapes critiques', impact: 'Délais clients allongés', metric: metrics.avgCompletionTime, threshold: 24 });
  }

  const overUtilizedStages = stageMetrics.filter(s => s.utilization > 90);
  overUtilizedStages.forEach(stage => {
    alerts.push({ level: 'warning', title: `Capacité saturée: "${stage.label}"`, description: `Utilisation à ${stage.utilization}%`, action: 'Augmenter la capacité ou répartir la charge', impact: 'Risque de goulot d\'étranglement', metric: stage.utilization, threshold: 90 });
  });

  if (metrics.onTimeRate < 70) {
    alerts.push({ level: 'danger', title: 'Ponctualité insuffisante', description: `${metrics.onTimeRate}% de livraisons dans les temps`, action: 'Audit complet des processus', impact: 'Mécontentement client', metric: metrics.onTimeRate, threshold: 70 });
  } else if (metrics.onTimeRate < 85) {
    alerts.push({ level: 'warning', title: 'Ponctualité à améliorer', description: `${metrics.onTimeRate}% de livraisons dans les temps`, action: 'Identifier les causes de retard', impact: 'Image de marque', metric: metrics.onTimeRate, threshold: 85 });
  }

  return alerts.slice(0, 5);
};

export const generateIntelligentRecommendations = (metrics: GlobalMetrics, stageMetrics: StageMetrics[], transitions: StageTransition[], timeSeriesData: TimeSeriesData[]): IntelligentRecommendation[] => {
  const recommendations: IntelligentRecommendation[] = [];
  const mainBottleneck = stageMetrics.find(s => s.delayPercentage > 30 && s.count > 0);
  
  if (mainBottleneck) {
    recommendations.push({
      id: 'bottleneck-1', type: 'bottleneck', priority: 'high',
      title: `Débloquer l'étape "${mainBottleneck.label}"`,
      description: `${mainBottleneck.count} commandes en attente avec ${mainBottleneck.delayPercentage}% de retards`,
      impact: `Réduction de ${Math.round(mainBottleneck.avgTimeHours - mainBottleneck.slaHours)}h du temps de cycle`, effort: 'Moyen', roi: 'Élevé',
      timeframe: 'immediate', steps: [`Ajouter 1 personne à l'étape "${mainBottleneck.label}"`, `Traiter les ${mainBottleneck.count} commandes en priorité`, `Revoir le flux de travail de cette étape`],
      metrics: { current: mainBottleneck.count, target: Math.max(0, mainBottleneck.count - 5), unit: 'commandes' },
      conditions: ['Personnel disponible', 'Espace de travail suffisant'], automation: false
    });
  }

  if (metrics.criticalOrders > 0) {
    recommendations.push({
      id: 'critical-1', type: 'process', priority: 'high',
      title: 'Traiter les commandes critiques en urgence',
      description: `${metrics.criticalOrders} commandes en retard dépassant le SLA`,
      impact: 'Sauver la relation client et éviter les pénalités',
      effort: 'Immédiat', roi: 'Préservation du chiffre d\'affaires', timeframe: 'immediate',
      steps: [`Identifier les ${Math.min(5, metrics.criticalOrders)} commandes les plus urgentes`, `Contacter les clients concernés`, `Prioriser ces commandes dans le flux de production`],
      metrics: { current: metrics.criticalOrders, target: 0, unit: 'commandes' },
      conditions: ['Personnel disponible pour contacter les clients'], automation: false
    });
  }

  const highUtilizationStages = stageMetrics.filter(s => s.utilization > 85 && s.count > 0);
  if (highUtilizationStages.length > 0) {
    recommendations.push({
      id: 'capacity-1', type: 'capacity', priority: 'medium',
      title: `Augmenter la capacité de production`,
      description: `${highUtilizationStages.map(s => s.label).join(', ')} à ${highUtilizationStages[0]?.utilization}% de capacité`,
      impact: `Réduction des goulets et amélioration du flux`, effort: 'Élevé', roi: 'Très élevé',
      timeframe: 'medium', steps: [`Recruter du personnel supplémentaire pour ${highUtilizationStages.length} postes`, `Optimiser l'agencement des postes de travail`],
      metrics: { current: highUtilizationStages[0]?.utilization || 0, target: 75, unit: '%' },
      conditions: ['Budget disponible', 'Espace physique'], automation: false
    });
  }

  const lastWeekTrend = timeSeriesData.slice(-7);
  const increasingDelays = lastWeekTrend.filter(d => d.delayed > 0).length > 4;
  if (increasingDelays && metrics.delayedOrders > 3) {
    recommendations.push({
      id: 'prediction-1', type: 'prediction', priority: 'high',
      title: 'Tendance à la hausse des retards détectée',
      description: `Augmentation des retards constatée sur les 7 derniers jours`,
      impact: 'Risque de dégradation de la ponctualité', effort: 'Moyen', roi: 'Élevé',
      timeframe: 'short', steps: [`Analyser les causes profondes des retards`, `Mettre en place un plan d'action correctif`, `Renforcer le suivi des commandes critiques`],
      metrics: { current: metrics.delayedOrders, target: Math.max(0, metrics.delayedOrders - 3), unit: 'commandes' },
      conditions: ['Disponibilité de l\'équipe management'], automation: true
    });
  }

  if (metrics.weeklyGrowth > 15 && metrics.onTimeRate < 90) {
    recommendations.push({
      id: 'schedule-1', type: 'schedule', priority: 'high',
      title: 'Adapter la capacité à la croissance',
      description: `Croissance de ${metrics.weeklyGrowth}% cette semaine, risque de saturation`,
      impact: 'Préserver la qualité malgré la croissance', effort: 'Moyen', roi: 'Très élevé',
      timeframe: 'short', steps: [`Anticiper les besoins en personnel pour la semaine prochaine`, `Répartir la charge sur les créneaux creux`, `Optimiser les plannings`],
      metrics: { current: metrics.weeklyGrowth, target: 15, unit: '%' },
      conditions: ['Visibilité sur les prévisions de commandes'], automation: false
    });
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};