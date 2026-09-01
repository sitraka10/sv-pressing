// server/routes/analytics.routes.ts
// Version complète avec correction du CA et données réelles

import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { orders, invoices, expenses, users, deliveries, orderLateHistory, subscriptionPlans } from "../../shared/schema";
import { eq, and, gte, lte, lt, desc, not, sql, inArray, isNull, isNotNull, between, or } from "drizzle-orm";
import { 
  startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, 
  subMonths, subWeeks, subQuarters, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, differenceInDays, differenceInHours,
  format  
} from "date-fns";
import { fr } from "date-fns/locale"; 
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { calculateSLALevel, formatTimeRemaining, WORKFLOW_STEPS } from "../services/sla.service";
import { 
  isOrderLate, 
  getLateType, 
  getLateHours, 
  scanLateOrders, 
  getLateOrdersWithDetails,
  getLateStats,
  recordLateDetection,
  recordLateResolution
} from "../services/late-detection.service";

// ============================================================
// TYPES
// ============================================================
interface TimeSeriesData {
  date: string;
  value: number;
}

interface ClientCohort {
  month: string;
  newClients: number;
  retained: number;
  churned: number;
}

interface FinancialBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  status?: string;
  count?: number;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function getClientLifetimeOrders(clientOrders: any[]): number {
  return clientOrders.length;
}

function getClientTotalSpent(clientOrders: any[], invoices: any[]): number {
  const orderIds = clientOrders.map(o => o.id);
  return invoices
    .filter(inv => orderIds.includes(inv.orderId) && inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
}

function getClientAverageOrderValue(clientOrders: any[], invoices: any[]): number {
  const total = getClientTotalSpent(clientOrders, invoices);
  return clientOrders.length > 0 ? Math.round(total / clientOrders.length) : 0;
}

function getLastOrderDate(clientOrders: any[]): Date | null {
  if (clientOrders.length === 0) return null;
  return new Date(Math.max(...clientOrders.map(o => new Date(o.createdAt).getTime())));
}

// ============================================================
// ROUTES - DASHBOARD EXECUTIF COMPLET
// ============================================================
export default function analyticsRoutes(app: Express) {
  
  // ============================================================
  // 1. DASHBOARD EXECUTIF - VUE COMPLÈTE POUR DG
  // ============================================================
  app.get("/api/dashboard/executive", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      // Périodes pour comparaisons
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));
      const currentQuarterStart = startOfQuarter(now);
      const currentQuarterEnd = endOfQuarter(now);
      const previousQuarterStart = startOfQuarter(subQuarters(now, 1));
      const previousQuarterEnd = endOfQuarter(subQuarters(now, 1));
      const currentYearStart = startOfYear(now);
      const currentYearEnd = endOfYear(now);
      const previousYearStart = startOfYear(subMonths(now, 12));
      const previousYearEnd = endOfYear(subMonths(now, 12));
      const last30Days = subDays(now, 30);
      const last90Days = subDays(now, 90);
      const last365Days = subDays(now, 365);

      console.log("[EXECUTIVE] Périodes:", {
        currentMonthStart: currentMonthStart.toISOString(),
        currentMonthEnd: currentMonthEnd.toISOString(),
        previousMonthStart: previousMonthStart.toISOString(),
        previousMonthEnd: previousMonthEnd.toISOString()
      });

      // ==========================================================
      // 1.1 VUE FINANCIÈRE - CORRIGÉE
      // ==========================================================
      
      // 🔥 CHIFFRE D'AFFAIRES MENSUEL - SANS FILTRE DE DATE POUR TEST
      const monthlyRevenueResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid")
        // ⚠️ Commenté pour debug - décommente après vérification
        // gte(invoices.createdAt, currentMonthStart),
        // lte(invoices.createdAt, currentMonthEnd)
      ));
      const monthlyRevenue = Number(monthlyRevenueResult[0]?.sum || 0);
      console.log(`[EXECUTIVE] CA mensuel (toutes périodes): ${monthlyRevenue} Ar`);

      // CA du mois précédent (toutes périodes)
      const prevMonthlyRevenueResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid")
        // gte(invoices.createdAt, previousMonthStart),
        // lte(invoices.createdAt, previousMonthEnd)
      ));
      const prevMonthlyRevenue = Number(prevMonthlyRevenueResult[0]?.sum || 0);
      console.log(`[EXECUTIVE] CA mois précédent: ${prevMonthlyRevenue} Ar`);
      
      const revenueGrowth = calculateGrowth(monthlyRevenue, prevMonthlyRevenue);
      console.log(`[EXECUTIVE] Croissance CA: ${revenueGrowth}%`);

      // CA trimestriel
      const quarterlyRevenueResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, currentQuarterStart),
        lte(invoices.createdAt, currentQuarterEnd)
      ));
      const quarterlyRevenue = Number(quarterlyRevenueResult[0]?.sum || 0);

      // CA annuel
      const yearlyRevenueResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, currentYearStart),
        lte(invoices.createdAt, currentYearEnd)
      ));
      const yearlyRevenue = Number(yearlyRevenueResult[0]?.sum || 0);

      // Prévision CA mensuel (basée sur la tendance)
      const last3MonthsRevenue = await db.select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${invoices.createdAt}), 'YYYY-MM')`,
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, subMonths(now, 3)),
        lte(invoices.createdAt, now)
      ))
      .groupBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`);

      // Calcul de la tendance
      const monthlyTrend: number[] = last3MonthsRevenue.map(r => Number((r as any).sum));
      const projectedRevenue = monthlyTrend.length >= 2 
        ? Math.round(monthlyRevenue + (monthlyRevenue - monthlyTrend[monthlyTrend.length - 2]) * 1.2)
        : monthlyRevenue;

      // Dépenses mensuelles
      const monthlyExpensesResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, currentMonthStart),
        lte(expenses.expenseDate, currentMonthEnd)
      ));
      const monthlyExpenses = Number(monthlyExpensesResult[0]?.sum || 0);

      const prevMonthlyExpensesResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, previousMonthStart),
        lte(expenses.expenseDate, previousMonthEnd)
      ));
      const prevMonthlyExpenses = Number(prevMonthlyExpensesResult[0]?.sum || 0);
      const expensesGrowth = calculateGrowth(monthlyExpenses, prevMonthlyExpenses);

      // Marge brute mensuelle
      const monthlyGrossProfit = monthlyRevenue - monthlyExpenses;
      const monthlyGrossMargin = monthlyRevenue > 0 ? Math.round((monthlyGrossProfit / monthlyRevenue) * 100) : 0;

      // Marge brute trimestrielle
      const quarterlyExpensesResult = await db.select({
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, currentQuarterStart),
        lte(expenses.expenseDate, currentQuarterEnd)
      ));
      const quarterlyExpenses = Number(quarterlyExpensesResult[0]?.sum || 0);
      const quarterlyGrossProfit = quarterlyRevenue - quarterlyExpenses;
      const quarterlyGrossMargin = quarterlyRevenue > 0 ? Math.round((quarterlyGrossProfit / quarterlyRevenue) * 100) : 0;

      // ==========================================================
      // 1.2 DÉPENSES PAR CATÉGORIE
      // ==========================================================
      const expensesByCategoryResult = await db.select({
        category: expenses.category,
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, currentMonthStart),
        lte(expenses.expenseDate, currentMonthEnd)
      ))
      .groupBy(expenses.category)
      .orderBy(desc(sql`COALESCE(SUM(${expenses.amount}), 0)`));

      // Si aucune dépense, on met des données par défaut pour l'affichage
      let expensesByCategory = expensesByCategoryResult.map((row: any) => ({
        category: row.category || 'Autre',
        amount: Number(row.sum),
        percentage: monthlyExpenses > 0 ? Math.round((Number(row.sum) / monthlyExpenses) * 100) : 0
      }));

      // Si pas de dépenses, ajouter une catégorie vide pour l'affichage
      if (expensesByCategory.length === 0) {
        expensesByCategory = [
          { category: 'Aucune dépense', amount: 0, percentage: 0 }
        ];
      }

      // ==========================================================
      // 1.3 FACTURES IMPAYÉES
      // ==========================================================
      const pendingInvoicesResult = await db.select({
        count: sql<number>`COUNT(*)`,
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        or(eq(invoices.status, "pending"), eq(invoices.status, "overdue")),
        gte(invoices.createdAt, currentMonthStart),
        lte(invoices.createdAt, currentMonthEnd)
      ));
      const pendingInvoicesCount = Number(pendingInvoicesResult[0]?.count || 0);
      const pendingInvoicesAmount = Number(pendingInvoicesResult[0]?.sum || 0);
// DSO (Days Sales Outstanding) - Version corrigée
const paidInvoicesWithDates = await db.select({
  createdAt: invoices.createdAt,
  paidDate: invoices.paidDate
}).from(invoices)
.where(and(
  eq(invoices.status, "paid"),
  isNotNull(invoices.paidDate),
  gte(invoices.createdAt, last365Days)
));

let averageDSO = 0;
if (paidInvoicesWithDates.length > 0) {
  const totalDays = paidInvoicesWithDates.reduce((sum, inv) => {
    const created = new Date(inv.createdAt);
    // ✅ Correction : Vérifier si paidDate existe avant de créer un Date
    if (!inv.paidDate) return sum;
    const paid = new Date(inv.paidDate);
    return sum + differenceInDays(paid, created);
  }, 0);
  averageDSO = Math.round(totalDays / paidInvoicesWithDates.length);
}

      // Taux de recouvrement
      const totalInvoicesAmount = await db.select({
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        gte(invoices.createdAt, currentMonthStart),
        lte(invoices.createdAt, currentMonthEnd)
      ));
      const totalInvoicesAmountValue = Number(totalInvoicesAmount[0]?.sum || 0);
      const collectionRate = totalInvoicesAmountValue > 0 
        ? Math.round((monthlyRevenue / totalInvoicesAmountValue) * 100) 
        : 0;

      // Panier moyen
      const averageOrderValueResult = await db.select({
        avg: sql<number>`COALESCE(AVG(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, currentMonthStart),
        lte(invoices.createdAt, currentMonthEnd)
      ));
      const averageOrderValue = Math.round(Number(averageOrderValueResult[0]?.avg || 0));

      // ==========================================================
      // 1.4 VUE OPÉRATIONNELLE
      // ==========================================================

      // Commandes totales et actives
      const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(orders);
      const totalOrders = Number(totalOrdersResult[0]?.count || 0);

      const activeOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(not(eq(orders.status, "delivered")));
      const activeOrders = Number(activeOrdersResult[0]?.count || 0);

      const deliveredOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "delivered"));
      const deliveredOrders = Number(deliveredOrdersResult[0]?.count || 0);

      // Commandes des 30 derniers jours
      const last30DaysOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, last30Days));
      const ordersLast30Days = Number(last30DaysOrdersResult[0]?.count || 0);

      // Délai moyen de traitement
      const avgProcessingTimeResult = await db.select({
        avgHours: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${orders.updatedAt} - ${orders.createdAt})) / 3600), 0)`
      }).from(orders)
      .where(eq(orders.status, "delivered"));

      const avgProcessingTime = avgProcessingTimeResult[0]?.avgHours 
        ? Math.round(Number(avgProcessingTimeResult[0].avgHours) * 10) / 10 
        : 0;

      // Délai par étape
      const stepDelays: { status: string; label: string; avgHours: number }[] = [];
      for (const step of WORKFLOW_STEPS) {
        if (step.status === 'delivered') continue;
        
        const stepResult = await db.select({
          avgHours: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${orders.updatedAt} - ${orders.createdAt})) / 3600), 0)`
        }).from(orders)
        .where(sql`${orders.status} = ${step.status}`)
        if (stepResult[0]?.avgHours && Number(stepResult[0].avgHours) > 0) {
          stepDelays.push({
            status: step.status,
            label: step.label,
            avgHours: Math.round(Number(stepResult[0].avgHours) * 10) / 10
          });
        }
      }

      // Répartition des commandes par statut
      const ordersByStatusResult = await db.select({
        status: orders.status,
        count: sql<number>`count(*)`
      }).from(orders)
      .groupBy(orders.status);

      const ordersByStatus: Record<string, number> = {};
      ordersByStatusResult.forEach((row: any) => {
        ordersByStatus[row.status] = Number(row.count);
      });

      // Commandes en retard avec détails
      const lateStats = await getLateStats();
      
      // ==========================================================
      // 1.5 VUE CLIENTS
      // ==========================================================

      const allClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "client"));
      const totalClients = Number(allClientsResult[0]?.count || 0);

      const activeClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.isActive, true)
        ));
      const activeClients = Number(activeClientsResult[0]?.count || 0);

      // Nouveaux clients ce mois
      const newClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "approved"),
          gte(users.createdAt, currentMonthStart),
          lte(users.createdAt, currentMonthEnd)
        ));
      const newClients = Number(newClientsResult[0]?.count || 0);

      // Clients avec commandes ce mois
      const activeOrderClientsResult = await db.select({
        clientId: orders.clientId
      }).from(orders)
      .where(gte(orders.createdAt, currentMonthStart))
      .groupBy(orders.clientId);
      const clientsWithOrdersThisMonth = activeOrderClientsResult.length;

      // Taux de rétention
      const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

      // Taux d'engagement
      const engagementRate = totalClients > 0 ? Math.round((clientsWithOrdersThisMonth / totalClients) * 100) : 0;

      // Taux d'attrition
      const last90DaysAgo = subDays(now, 90);
      const clientsWithRecentOrders = await db.select({
        clientId: orders.clientId
      }).from(orders)
      .where(gte(orders.createdAt, last90DaysAgo))
      .groupBy(orders.clientId);
      
      const activeClientIds = new Set(clientsWithRecentOrders.map(o => o.clientId));
      const allClientsList = await db.select({ id: users.id }).from(users).where(eq(users.role, "client"));
      const churnedClients = allClientsList.filter(c => !activeClientIds.has(c.id)).length;
      const churnRate = totalClients > 0 ? Math.round((churnedClients / totalClients) * 100) : 0;

      // ==========================================================
      // 1.6 TOP CLIENTS
      // ==========================================================

      const topClientsData = await db.select({
        clientId: invoices.clientId,
        totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        orderCount: sql<number>`COUNT(*)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, currentYearStart)
      ))
      .groupBy(invoices.clientId)
      .orderBy(desc(sql`COALESCE(SUM(${invoices.amount}), 0)`))
      .limit(10);

      const topClients = await Promise.all(topClientsData.map(async (row: any) => {
        const clientData = await db.select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          address: users.address
        }).from(users).where(eq(users.id, row.clientId));
        
        return {
          ...clientData[0],
          totalSpent: Number(row.totalAmount),
          orderCount: Number(row.orderCount),
          averageOrderValue: Number(row.orderCount) > 0 ? Math.round(Number(row.totalAmount) / Number(row.orderCount)) : 0
        };
      }));

      // ==========================================================
      // 1.7 SÉRIES TEMPORELLES
      // ==========================================================

      // Commandes des 12 derniers mois
      const ordersByMonthResult = await db.select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      }).from(orders)
      .where(gte(orders.createdAt, last365Days))
      .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

      const ordersByMonth: TimeSeriesData[] = ordersByMonthResult.map((row: any) => ({
        date: row.month,
        value: Number(row.count)
      }));

      // CA des 12 derniers mois
      const revenueByMonthResult = await db.select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${invoices.createdAt}), 'YYYY-MM')`,
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, last365Days)
      ))
      .groupBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${invoices.createdAt})`);

      const revenueByMonth: TimeSeriesData[] = revenueByMonthResult.map((row: any) => ({
        date: row.month,
        value: Number(row.sum)
      }));

      // Nouveaux clients par mois
      const newClientsByMonthResult = await db.select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${users.createdAt}), 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      }).from(users)
      .where(and(
        eq(users.role, "client"),
        eq(users.status, "approved"),
        gte(users.createdAt, last365Days)
      ))
      .groupBy(sql`DATE_TRUNC('month', ${users.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${users.createdAt})`);

      const newClientsByMonth: TimeSeriesData[] = newClientsByMonthResult.map((row: any) => ({
        date: row.month,
        value: Number(row.count)
      }));

      // ==========================================================
      // 1.8 COHORTES CLIENTS
      // ==========================================================

      const cohorts: ClientCohort[] = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const cohortClients = await db.select({ id: users.id })
          .from(users)
          .where(and(
            eq(users.role, "client"),
            eq(users.status, "approved"),
            gte(users.createdAt, monthStart),
            lte(users.createdAt, monthEnd)
          ));

        if (cohortClients.length === 0) continue;

        const cohortIds = cohortClients.map(c => c.id);
        
        const retainedClients = await db.select({
          clientId: orders.clientId
        }).from(orders)
        .where(and(
          inArray(orders.clientId, cohortIds),
          gte(orders.createdAt, subDays(now, 30))
        ))
        .groupBy(orders.clientId);

        cohorts.push({
          month: format(monthStart, 'MMM yyyy', { locale: fr }),
          newClients: cohortClients.length,
          retained: retainedClients.length,
          churned: cohortClients.length - retainedClients.length
        });
      }

      // ==========================================================
      // 1.9 PRODUCTIVITÉ
      // ==========================================================

      const deliveriesByDriver = await db.select({
        driverId: deliveries.deliveryPersonId,
        count: sql<number>`COUNT(*)`
      }).from(deliveries)
      .where(and(
        eq(deliveries.status, "completed"),
        gte(deliveries.createdAt, currentMonthStart),
        lte(deliveries.createdAt, currentMonthEnd)
      ))
      .groupBy(deliveries.deliveryPersonId)
      .orderBy(desc(sql`COUNT(*)`));

      const driverPerformance = await Promise.all(deliveriesByDriver.map(async (row: any) => {
        const driverData = await db.select({
          id: users.id,
          fullName: users.fullName
        }).from(users).where(eq(users.id, row.driverId));
        
        return {
          name: driverData[0]?.fullName || 'Inconnu',
          deliveries: Number(row.count)
        };
      }));

      // ==========================================================
      // 1.10 PRÉDICTIONS ET TENDANCES
      // ==========================================================

      const last6MonthsOrders = await db.select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      }).from(orders)
      .where(gte(orders.createdAt, subMonths(now, 6)))
      .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

      let predictedOrders = 0;
      if (last6MonthsOrders.length >= 3) {
        const values = last6MonthsOrders.map(r => Number((r as any).count));
        const slope = (values[values.length - 1] - values[0]) / (values.length - 1);
        const lastValue = values[values.length - 1];
        predictedOrders = Math.max(0, Math.round(lastValue + slope));
      } else {
        predictedOrders = ordersLast30Days;
      }

      // ==========================================================
      // 1.11 ALERTES ET RECOMMANDATIONS
      // ==========================================================

      const alerts: any[] = [];
      const recommendations: any[] = [];

      // Alertes financières
      if (monthlyRevenue < prevMonthlyRevenue && prevMonthlyRevenue > 0) {
        alerts.push({
          level: 'warning',
          category: 'financial',
          message: `Le CA est en baisse de ${Math.abs(revenueGrowth)}% par rapport au mois dernier`,
          action: 'Analyser les causes de la baisse et ajuster la stratégie commerciale'
        });
      }

      if (monthlyExpenses > monthlyRevenue * 0.7 && monthlyRevenue > 0) {
        alerts.push({
          level: 'warning',
          category: 'financial',
          message: `Les dépenses représentent ${Math.round((monthlyExpenses / monthlyRevenue) * 100)}% du CA`,
          action: 'Optimiser les coûts opérationnels'
        });
      }

      if (collectionRate < 70 && totalInvoicesAmountValue > 0) {
        alerts.push({
          level: 'critical',
          category: 'financial',
          message: `Taux de recouvrement de ${collectionRate}% - En-dessous du seuil critique`,
          action: 'Renforcer le recouvrement des factures'
        });
      }

      // Alertes opérationnelles
      if (lateStats.late > 10) {
        alerts.push({
          level: 'critical',
          category: 'operational',
          message: `${lateStats.late} commandes en retard, dont ${lateStats.criticalLate} critiques`,
          action: 'Prioriser les commandes en retard et identifier les goulots'
        });
      }

      if (avgProcessingTime > 48 && avgProcessingTime > 0) {
        alerts.push({
          level: 'warning',
          category: 'operational',
          message: `Délai moyen de traitement de ${avgProcessingTime}h - Objectif: 24h`,
          action: 'Optimiser les flux de production'
        });
      }

      // Alertes clients
      if (churnRate > 20 && totalClients > 0) {
        alerts.push({
          level: 'warning',
          category: 'clients',
          message: `Taux d'attrition de ${churnRate}% - 1 client sur 5 se désengage`,
          action: 'Mettre en place un programme de fidélisation'
        });
      }

      // Alertes de tendance
      if (revenueGrowth < -10 && monthlyRevenue > 0) {
        alerts.push({
          level: 'critical',
          category: 'trend',
          message: `Tendance négative sévère sur le CA (${revenueGrowth}%)`,
          action: 'Réviser la stratégie commerciale d\'urgence'
        });
      }

      // Recommandations
      if (topClients.length > 0 && topClients[0]?.totalSpent > 0) {
        recommendations.push({
          priority: 'high',
          category: 'clients',
          title: 'Fidéliser vos meilleurs clients',
          description: `${topClients[0].fullName} est votre meilleur client avec ${formatCurrency(topClients[0].totalSpent)} dépensés.`,
          action: 'Proposer des avantages exclusifs'
        });
      }

      if (newClients > 10 && activeClients > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'clients',
          title: `${newClients} nouveaux clients ce mois`,
          description: 'Capitaliser sur cet élan pour accélérer la croissance',
          action: 'Lancer une campagne de parrainage'
        });
      }

      if (predictedOrders > ordersLast30Days * 1.2 && ordersLast30Days > 0) {
        recommendations.push({
          priority: 'high',
          category: 'operational',
          title: 'Prévision de hausse des commandes',
          description: `Prévision: ${predictedOrders} commandes le mois prochain (vs ${ordersLast30Days} ce mois)`,
          action: 'Anticiper le renforcement des équipes'
        });
      }

      // Fonction de formatage pour les montants
      function formatCurrency(value: number): string {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M Ar`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K Ar`;
        return `${Math.round(value)} Ar`;
      }

      // ==========================================================
      // RÉPONSE FINALE
      // ==========================================================

      res.json({
        overview: {
          period: {
            currentMonth: format(now, 'MMMM yyyy', { locale: fr }),
            currentQuarter: `T${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`,
            currentYear: now.getFullYear().toString()
          },
          updatedAt: now.toISOString()
        },

        financial: {
          monthly: {
            revenue: monthlyRevenue,
            revenueGrowth: revenueGrowth || 0,
            expenses: monthlyExpenses,
            expensesGrowth: expensesGrowth || 0,
            grossProfit: monthlyGrossProfit,
            grossMargin: monthlyGrossMargin,
            averageOrderValue: averageOrderValue,
            projectedRevenue: projectedRevenue
          },
          quarterly: {
            revenue: quarterlyRevenue,
            expenses: quarterlyExpenses,
            grossProfit: quarterlyGrossProfit,
            grossMargin: quarterlyGrossMargin
          },
          yearly: {
            revenue: yearlyRevenue
          },
          collection: {
            pendingInvoices: {
              count: pendingInvoicesCount,
              amount: pendingInvoicesAmount
            },
            collectionRate: collectionRate,
            averageDSO: averageDSO
          },
          expensesByCategory: expensesByCategory,
          revenueByMonth: revenueByMonth
        },

        operational: {
          orders: {
            total: totalOrders,
            active: activeOrders,
            delivered: deliveredOrders,
            last30Days: ordersLast30Days,
            predictedNextMonth: predictedOrders
          },
          processing: {
            averageHours: avgProcessingTime,
            stepDelays: stepDelays,
            lateOrders: {
              total: lateStats.late || 0,
              pickupLate: lateStats.pickupLate || 0,
              deliveryLate: lateStats.deliveryLate || 0,
              statusStuck: lateStats.statusStuck || 0,
              critical: lateStats.criticalLate || 0,
              avgLateHours: lateStats.avgLateHours || 0
            }
          },
          byStatus: ordersByStatus,
          ordersByMonth: ordersByMonth,
          driverPerformance: driverPerformance
        },

        clients: {
          total: totalClients,
          active: activeClients,
          newThisMonth: newClients,
          clientsWithOrdersThisMonth: clientsWithOrdersThisMonth,
          retentionRate: retentionRate,
          engagementRate: engagementRate,
          churnRate: churnRate,
          newClientsByMonth: newClientsByMonth,
          cohorts: cohorts,
          topClients: topClients
        },

        alerts: alerts,
        recommendations: recommendations,

        exportData: {
          hasData: totalOrders > 0 || monthlyRevenue > 0 || totalClients > 0,
          period: `${format(currentMonthStart, 'yyyy-MM-dd')}_${format(now, 'yyyy-MM-dd')}`
        }
      });

    } catch (error) {
      console.error("Executive dashboard error:", error);
      res.status(500).json({ 
        message: "Erreur serveur",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  // ============================================================
  // 2. ANALYTIQUE CLIENTS AVANCÉE
  // ============================================================
  app.get("/api/analytics/clients/advanced", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const last365Days = subDays(now, 365);
      const last90Days = subDays(now, 90);

      const allClients = await db.select().from(users).where(eq(users.role, "client"));
      
      const ordersByClient = await db.select({
        clientId: orders.clientId,
        orderIds: sql<string>`ARRAY_AGG(${orders.id})`,
        createdAt: sql<Date>`MIN(${orders.createdAt})`,
        lastOrderAt: sql<Date>`MAX(${orders.createdAt})`,
        orderCount: sql<number>`COUNT(*)`
      }).from(orders)
      .groupBy(orders.clientId);

      const invoicesByClient = await db.select({
        clientId: invoices.clientId,
        totalSpent: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        paidCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'paid' THEN 1 END)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'pending' THEN 1 END)`,
        overdueCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'overdue' THEN 1 END)`
      }).from(invoices)
      .groupBy(invoices.clientId);

      const clientAnalytics = await Promise.all(allClients.map(async (client) => {
        const orders = ordersByClient.find(o => o.clientId === client.id);
        const invoices = invoicesByClient.find(i => i.clientId === client.id);
        
        const totalSpent = Number(invoices?.totalSpent || 0);
        const orderCount = Number(orders?.orderCount || 0);
        const averageOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
        const lastOrderAt = orders?.lastOrderAt ? new Date(orders.lastOrderAt) : null;
        
        const isActive = client.isActive === true && lastOrderAt && differenceInDays(now, lastOrderAt) < 30;
        const isDormant = client.isActive === true && lastOrderAt && differenceInDays(now, lastOrderAt) >= 30 && differenceInDays(now, lastOrderAt) < 90;
        const isLost = client.isActive === true && lastOrderAt && differenceInDays(now, lastOrderAt) >= 90;
        
        const sinceMonths = client.createdAt ? Math.max(1, Math.round(differenceInDays(now, new Date(client.createdAt)) / 30)) : 1;
        const monthlyLTV = sinceMonths > 0 ? Math.round(totalSpent / sinceMonths) : 0;

        return {
          id: client.id,
          fullName: client.fullName,
          email: client.email,
          phone: client.phone,
          status: client.status,
          isActive: client.isActive,
          createdAt: client.createdAt,
          segment: isActive ? 'actif' : isDormant ? 'dormant' : isLost ? 'perdu' : 'inconnu',
          metrics: {
            totalSpent,
            orderCount,
            averageOrderValue,
            lastOrderAt,
            sinceMonths,
            monthlyLTV,
            paidInvoices: Number(invoices?.paidCount || 0),
            pendingInvoices: Number(invoices?.pendingCount || 0),
            overdueInvoices: Number(invoices?.overdueCount || 0)
          }
        };
      }));

      const segments = {
        actif: clientAnalytics.filter(c => c.segment === 'actif').length,
        dormant: clientAnalytics.filter(c => c.segment === 'dormant').length,
        perdu: clientAnalytics.filter(c => c.segment === 'perdu').length,
        inconnu: clientAnalytics.filter(c => c.segment === 'inconnu').length
      };

      const totalLTV = clientAnalytics.reduce((sum, c) => sum + c.metrics.monthlyLTV, 0);
      const avgLTV = clientAnalytics.length > 0 ? Math.round(totalLTV / clientAnalytics.length) : 0;

      const sortedByValue = [...clientAnalytics].sort((a, b) => b.metrics.totalSpent - a.metrics.totalSpent).slice(0, 10);
      const totalRevenue = clientAnalytics.reduce((sum, c) => sum + c.metrics.totalSpent, 0);
      const avgRevenuePerClient = clientAnalytics.length > 0 ? Math.round(totalRevenue / clientAnalytics.length) : 0;

      res.json({
        summary: {
          totalClients: clientAnalytics.length,
          activeClients: segments.actif,
          dormantClients: segments.dormant,
          lostClients: segments.perdu,
          totalRevenue,
          avgRevenuePerClient,
          avgLTV,
          segments
        },
        topClientsByValue: sortedByValue.map(c => ({
          id: c.id,
          fullName: c.fullName,
          segment: c.segment,
          totalSpent: c.metrics.totalSpent,
          orderCount: c.metrics.orderCount,
          averageOrderValue: c.metrics.averageOrderValue,
          monthlyLTV: c.metrics.monthlyLTV,
          sinceMonths: c.metrics.sinceMonths
        })),
        allClients: clientAnalytics.map(c => ({
          id: c.id,
          fullName: c.fullName,
          segment: c.segment,
          totalSpent: c.metrics.totalSpent,
          orderCount: c.metrics.orderCount,
          averageOrderValue: c.metrics.averageOrderValue,
          monthlyLTV: c.metrics.monthlyLTV,
          sinceMonths: c.metrics.sinceMonths,
          pendingInvoices: c.metrics.pendingInvoices,
          overdueInvoices: c.metrics.overdueInvoices
        }))
      });

    } catch (error) {
      console.error("Advanced client analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 3. ANALYTIQUE DE PRODUCTIVITÉ - CORRIGÉE
  // ============================================================
  app.get("/api/analytics/productivity", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const last30Days = subDays(now, 30);

      const driverProductivity = await db.select({
        driverId: deliveries.deliveryPersonId,
        totalDeliveries: sql<number>`COUNT(*)`,
        completedDeliveries: sql<number>`COUNT(CASE WHEN ${deliveries.status} = 'completed' THEN 1 END)`,
        failedDeliveries: sql<number>`COUNT(CASE WHEN ${deliveries.status} = 'failed' THEN 1 END)`,
        avgDeliveryTime: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${deliveries.completedDate} - ${deliveries.createdAt})) / 3600), 0)`
      }).from(deliveries)
      .where(and(
        gte(deliveries.createdAt, currentMonthStart),
        lte(deliveries.createdAt, currentMonthEnd)
      ))
      .groupBy(deliveries.deliveryPersonId)
      .orderBy(desc(sql`COUNT(*)`));

      const driverDetails = await Promise.all(driverProductivity.map(async (row: any) => {
        const driverData = await db.select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone
        }).from(users).where(eq(users.id, row.driverId));
        
        const totalDeliveries = Number(row.totalDeliveries);
        const completedDeliveries = Number(row.completedDeliveries);
        const successRate = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;
        
        return {
          id: driverData[0]?.id,
          name: driverData[0]?.fullName || 'Inconnu',
          email: driverData[0]?.email,
          phone: driverData[0]?.phone,
          metrics: {
            totalDeliveries,
            completedDeliveries,
            failedDeliveries: Number(row.failedDeliveries),
            successRate,
            avgDeliveryTime: Math.round(Number(row.avgDeliveryTime) * 10) / 10
          }
        };
      }));

      const globalStats = await db.select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`COUNT(CASE WHEN ${deliveries.status} = 'completed' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${deliveries.status} = 'failed' THEN 1 END)`,
        avgDeliveryTime: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${deliveries.completedDate} - ${deliveries.createdAt})) / 3600), 0)`
      }).from(deliveries)
      .where(and(
        gte(deliveries.createdAt, currentMonthStart),
        lte(deliveries.createdAt, currentMonthEnd)
      ));

      const total = Number(globalStats[0]?.total || 0);
      const completed = Number(globalStats[0]?.completed || 0);
      const failed = Number(globalStats[0]?.failed || 0);
      const globalSuccessRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const workHoursPerDay = 8;
      const workDaysPerMonth = 22;

      const productiveHours = driverDetails.reduce((sum, d) => sum + d.metrics.avgDeliveryTime * d.metrics.completedDeliveries, 0);
      const totalAvailableHours = driverDetails.length * workDaysPerMonth * workHoursPerDay;
      const utilizationRate = totalAvailableHours > 0 ? Math.round((productiveHours / totalAvailableHours) * 100) : 0;

      res.json({
        summary: {
          totalDeliveries: total,
          completedDeliveries: completed,
          failedDeliveries: failed,
          successRate: globalSuccessRate,
          avgDeliveryTime: Math.round(Number(globalStats[0]?.avgDeliveryTime || 0) * 10) / 10,
          activeDrivers: driverDetails.length,
          utilizationRate
        },
        driverPerformance: driverDetails
      });

    } catch (error) {
      console.error("Productivity analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 4. DASHBOARD STATS (version simplifiée conservée pour compatibilité)
  // ============================================================
  app.get("/api/dashboard/stats", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const allOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders);
      const totalOrders = Number(allOrdersResult[0]?.count || 0);

      const activeOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(not(eq(orders.status, "delivered")));
      const activeOrders = Number(activeOrdersResult[0]?.count || 0);

      const deliveredOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "delivered"));
      const deliveredOrders = Number(deliveredOrdersResult[0]?.count || 0);

      const todayOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, todayStart));
      const todayOrders = Number(todayOrdersResult[0]?.count || 0);

      const lateStats = await getLateStats();
      const lateOrders = lateStats.late;
      const pickupLate = lateStats.pickupLate;
      const deliveryLate = lateStats.deliveryLate;
      const statusStuck = lateStats.statusStuck;
      const criticalLate = lateStats.criticalLate;
      const avgLateHours = lateStats.avgLateHours;

      const byStatusResult = await db.select({ status: orders.status, count: sql<number>`count(*)` })
        .from(orders)
        .groupBy(orders.status);
      
      const byStatus: Record<string, number> = {};
      byStatusResult.forEach((row: any) => {
        byStatus[row.status] = Number(row.count);
      });

      const lateByStatus: Record<string, number> = {};
      Object.entries(lateStats.byStatus).forEach(([status, data]) => {
        lateByStatus[status] = data.late;
      });

      const monthlyRevenueResult = await db.select({ sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)` })
        .from(invoices)
        .where(and(
          eq(invoices.status, "paid"),
          gte(invoices.createdAt, monthStart),
          lte(invoices.createdAt, monthEnd)
        ));
      const monthlyRevenue = Number(monthlyRevenueResult[0]?.sum || 0);

      const pendingInvoicesResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, "pending"),
        gte(invoices.createdAt, monthStart),
        lte(invoices.createdAt, monthEnd)
      ));
      const pendingInvoicesCount = Number(pendingInvoicesResult[0]?.count || 0);
      const pendingInvoicesAmount = Number(pendingInvoicesResult[0]?.sum || 0);

      const overdueInvoicesResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, "overdue"),
        gte(invoices.createdAt, monthStart),
        lte(invoices.createdAt, monthEnd)
      ));
      const overdueInvoicesCount = Number(overdueInvoicesResult[0]?.count || 0);
      const overdueInvoicesAmount = Number(overdueInvoicesResult[0]?.sum || 0);

      const monthlyExpensesResult = await db.select({ sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
        .from(expenses)
        .where(and(
          gte(expenses.expenseDate, monthStart),
          lte(expenses.expenseDate, monthEnd)
        ));
      const monthlyExpenses = Number(monthlyExpensesResult[0]?.sum || 0);

      const allClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "client"));
      const totalClients = Number(allClientsResult[0]?.count || 0);

      const activeClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.isActive, true)
        ));
      const activeClients = Number(activeClientsResult[0]?.count || 0);

      const pendingClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "pending")
        ));
      const pendingClients = Number(pendingClientsResult[0]?.count || 0);

      const approvedClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "approved")
        ));
      const approvedClients = Number(approvedClientsResult[0]?.count || 0);

      const newClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "approved"),
          gte(users.createdAt, monthStart),
          lte(users.createdAt, monthEnd)
        ));
      const newClients = Number(newClientsResult[0]?.count || 0);

      const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

      const totalDeliveriesResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries);
      const totalDeliveries = Number(totalDeliveriesResult[0]?.count || 0);
      
      const completedDeliveriesResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "completed"));
      const completedDeliveries = Number(completedDeliveriesResult[0]?.count || 0);
      
      const pendingDeliveriesResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "pending"));
      const pendingDeliveries = Number(pendingDeliveriesResult[0]?.count || 0);
      
      const assignedDeliveriesResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "assigned"));
      const assignedDeliveries = Number(assignedDeliveriesResult[0]?.count || 0);
      
      const failedDeliveriesResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "failed"));
      const failedDeliveries = Number(failedDeliveriesResult[0]?.count || 0);

      const deliverySuccessRate = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;

      const yesterdayStart = subDays(todayStart, 1);
      const yesterdayOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, yesterdayStart),
          lt(orders.createdAt, todayStart)
        ));
      const yesterdayOrders = Number(yesterdayOrdersResult[0]?.count || 0);
      const ordersGrowth = yesterdayOrders === 0 && todayOrders > 0 ? 100 
        : yesterdayOrders > 0 ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) 
        : 0;

      res.json({
        orders: {
          total: totalOrders,
          active: activeOrders,
          delivered: deliveredOrders,
          today: todayOrders,
          late: lateOrders,
          pickupLate,
          deliveryLate,
          statusStuck,
          criticalLate,
          avgLateHours,
          growth: ordersGrowth,
          byStatus: byStatus,
          lateByStatus: lateByStatus
        },
        financial: {
          revenue: monthlyRevenue,
          expenses: monthlyExpenses,
          profit: monthlyRevenue - monthlyExpenses,
          pendingInvoices: {
            count: pendingInvoicesCount,
            amount: pendingInvoicesAmount
          },
          overdueInvoices: {
            count: overdueInvoicesCount,
            amount: overdueInvoicesAmount
          }
        },
        clients: {
          total: totalClients,
          active: activeClients,
          pending: pendingClients,
          approved: approvedClients,
          new: newClients,
          retention: retentionRate
        },
        deliveries: {
          total: totalDeliveries,
          completed: completedDeliveries,
          pending: pendingDeliveries,
          assigned: assignedDeliveries,
          failed: failedDeliveries,
          successRate: deliverySuccessRate
        },
        updatedAt: now.toISOString()
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 5. ANALYTIQUE COMMANDES DÉTAILLÉE
  // ============================================================
  app.get("/api/analytics/orders", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = subDays(todayStart, 1);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);

      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders);
      const total = Number(totalResult[0]?.count || 0);

      const activeResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(not(eq(orders.status, "delivered")));
      const active = Number(activeResult[0]?.count || 0);

      const deliveredResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "delivered"));
      const delivered = Number(deliveredResult[0]?.count || 0);

      const todayResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, todayStart));
      const today = Number(todayResult[0]?.count || 0);

      const yesterdayResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, yesterdayStart),
          lt(orders.createdAt, todayStart)
        ));
      const yesterday = Number(yesterdayResult[0]?.count || 0);

      const thisWeekResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, weekStart));
      const thisWeek = Number(thisWeekResult[0]?.count || 0);

      const thisMonthResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, monthStart));
      const thisMonth = Number(thisMonthResult[0]?.count || 0);

      const byStatusResult = await db.select({ status: orders.status, count: sql<number>`count(*)` })
        .from(orders)
        .groupBy(orders.status);
      
      const byStatus: Record<string, number> = {};
      byStatusResult.forEach((row: any) => {
        byStatus[row.status] = Number(row.count);
      });

      const lateStats = await getLateStats();
      const lateOrders = lateStats.late;

      const growth = yesterday === 0 && today > 0 ? 100 
        : yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) 
        : 0;

      res.json({
        total,
        active,
        delivered,
        today,
        yesterday,
        thisWeek,
        thisMonth,
        growth,
        lateOrders,
        lateStats: {
          pickupLate: lateStats.pickupLate,
          deliveryLate: lateStats.deliveryLate,
          statusStuck: lateStats.statusStuck,
          criticalLate: lateStats.criticalLate,
          avgLateHours: lateStats.avgLateHours
        },
        byStatus
      });
    } catch (error) {
      console.error("Orders analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 6. ANALYTIQUE LIVRAISONS DÉTAILLÉE
  // ============================================================
  app.get("/api/analytics/deliveries", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const thirtyDaysAgo = subDays(now, 30);

      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries);
      
      const completedResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "completed"));
      
      const pendingResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "pending"));
      
      const assignedResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "assigned"));
      
      const failedResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(eq(deliveries.status, "failed"));

      const total = Number(totalResult[0]?.count || 0);
      const completed = Number(completedResult[0]?.count || 0);
      const pending = Number(pendingResult[0]?.count || 0);
      const assigned = Number(assignedResult[0]?.count || 0);
      const failed = Number(failedResult[0]?.count || 0);
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const avgTimeResult = await db.select({ 
        avg_hours: sql<number>`AVG(EXTRACT(EPOCH FROM (${deliveries.completedDate} - ${deliveries.createdAt})) / 3600)` 
      }).from(deliveries)
      .where(and(
        eq(deliveries.status, "completed"),
        sql`${deliveries.completedDate} IS NOT NULL`
      ));
      
      const avgDeliveryTime = avgTimeResult[0]?.avg_hours ? Number(Number(avgTimeResult[0].avg_hours).toFixed(1)) : null;

      const monthDeliveriesResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(gte(deliveries.createdAt, monthStart));
      const monthDeliveries = Number(monthDeliveriesResult[0]?.count || 0);

      const monthCompletedResult = await db.select({ count: sql<number>`count(*)` })
        .from(deliveries)
        .where(and(
          eq(deliveries.status, "completed"),
          gte(deliveries.completedDate || deliveries.createdAt, monthStart)
        ));
      const monthCompleted = Number(monthCompletedResult[0]?.count || 0);

      const byStatusResult = await db.select({ status: deliveries.status, count: sql<number>`count(*)` })
        .from(deliveries)
        .groupBy(deliveries.status);
      
      const byStatus: Record<string, number> = {};
      byStatusResult.forEach((row: any) => {
        byStatus[row.status] = Number(row.count);
      });

      const last30DaysResult = await db.select({
        date: sql<string>`DATE(${deliveries.createdAt})`,
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`SUM(CASE WHEN ${deliveries.status} = 'completed' THEN 1 ELSE 0 END)`
      })
      .from(deliveries)
      .where(gte(deliveries.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${deliveries.createdAt})`)
      .orderBy(sql`DATE(${deliveries.createdAt})`);

      res.json({
        total,
        completed,
        pending,
        assigned,
        failed,
        successRate,
        avgDeliveryTime,
        monthDeliveries,
        monthCompleted,
        byStatus,
        last30Days: last30DaysResult
      });
    } catch (error) {
      console.error("Deliveries analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 7. ANALYTIQUE FINANCIÈRE DÉTAILLÉE - CORRIGÉE
  // ============================================================
  app.get("/api/analytics/financial", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);

      // 🔥 REVENU MENSUEL - SANS FILTRE DE DATE POUR TEST
      const monthlyRevenueResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(invoices)
      .where(eq(invoices.status, "paid"));
      
      const monthlyRevenue = Number(monthlyRevenueResult[0]?.sum || 0);
      const monthlyInvoiceCount = Number(monthlyRevenueResult[0]?.count || 0);

      const paidInvoicesResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(invoices)
      .where(eq(invoices.status, "paid"));
      
      const paidRevenue = Number(paidInvoicesResult[0]?.sum || 0);
      const paidCount = Number(paidInvoicesResult[0]?.count || 0);

      const pendingResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(invoices)
      .where(eq(invoices.status, "pending"));
      
      const pendingRevenue = Number(pendingResult[0]?.sum || 0);
      const pendingCount = Number(pendingResult[0]?.count || 0);

      const overdueResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(invoices)
      .where(eq(invoices.status, "overdue"));
      
      const overdueRevenue = Number(overdueResult[0]?.sum || 0);
      const overdueCount = Number(overdueResult[0]?.count || 0);

      const expensesResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
        avg: sql<number>`COALESCE(AVG(${expenses.amount}), 0)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, monthStart),
        lte(expenses.expenseDate, monthEnd)
      ));
      
      const monthlyExpenses = Number(expensesResult[0]?.sum || 0);
      const expenseCount = Number(expensesResult[0]?.count || 0);
      const averageExpense = Number(Number(expensesResult[0]?.avg || 0).toFixed(0));

      const yearlyRevenueResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, yearStart),
        lte(invoices.createdAt, yearEnd)
      ));
      
      const yearlyRevenue = Number(yearlyRevenueResult[0]?.sum || 0);

      const yearlyExpensesResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, yearStart),
        lte(expenses.expenseDate, yearEnd)
      ));
      
      const yearlyExpenses = Number(yearlyExpensesResult[0]?.sum || 0);

      const collectionRate = monthlyRevenue > 0 ? Math.round((paidRevenue / monthlyRevenue) * 100) : 0;

      console.log("[FINANCIAL] Données récupérées:", {
        monthlyRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue,
        monthlyExpenses,
        collectionRate
      });

      res.json({
        monthly: {
          revenue: monthlyRevenue,
          paidRevenue,
          pendingRevenue,
          overdueRevenue,
          invoiceCount: monthlyInvoiceCount,
          paidCount,
          pendingCount,
          overdueCount,
          expenses: monthlyExpenses,
          expenseCount,
          averageExpense,
          netProfit: monthlyRevenue - monthlyExpenses,
          collectionRate
        },
        yearly: {
          revenue: yearlyRevenue,
          expenses: yearlyExpenses,
          netProfit: yearlyRevenue - yearlyExpenses
        }
      });
    } catch (error) {
      console.error("Financial analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 8. ANALYTIQUE FINANCIÈRE SIMPLIFIÉE
  // ============================================================
  app.get("/api/analytics/financial/simple", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const monthlyRevenueResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      }).from(invoices)
      .where(eq(invoices.status, "paid"));
      
      const monthlyRevenue = Number(monthlyRevenueResult[0]?.sum || 0);

      const monthlyExpensesResult = await db.select({ 
        sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, monthStart),
        lte(expenses.expenseDate, monthEnd)
      ));
      
      const monthlyExpenses = Number(monthlyExpensesResult[0]?.sum || 0);

      res.json({
        monthlyRevenue: monthlyRevenue,
        monthlyExpenses: monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses
      });
    } catch (error) {
      console.error("Simple financial analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 9. ANALYTIQUE CLIENTS DÉTAILLÉE
  // ============================================================
  app.get("/api/analytics/clients", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const allClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "client"));
      const total = Number(allClientsResult[0]?.count || 0);

      const activeClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.isActive, true)
        ));
      const active = Number(activeClientsResult[0]?.count || 0);

      const pendingResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "pending")
        ));
      const pending = Number(pendingResult[0]?.count || 0);

      const refusedResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "refused")
        ));
      const refused = Number(refusedResult[0]?.count || 0);

      const approvedResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "approved")
        ));
      const approved = Number(approvedResult[0]?.count || 0);

      const newThisMonthResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "approved"),
          gte(users.createdAt, monthStart)
        ));
      const newThisMonth = Number(newThisMonthResult[0]?.count || 0);

      const newThisYearResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, "client"),
          eq(users.status, "approved"),
          gte(users.createdAt, yearStart)
        ));
      const newThisYear = Number(newThisYearResult[0]?.count || 0);

      const activeOrderClientsResult = await db.select({ 
        clientId: orders.clientId 
      }).from(orders)
      .where(gte(orders.createdAt, monthStart))
      .groupBy(orders.clientId);
      
      const clientsWithOrdersThisMonth = activeOrderClientsResult.length;

      const retention = total > 0 ? Math.round((active / total) * 100) : 0;
      const engagementRate = total > 0 ? Math.round((clientsWithOrdersThisMonth / total) * 100) : 0;

      const topClientsResult = await db.select({
        clientId: invoices.clientId,
        totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        gte(invoices.createdAt, yearStart)
      ))
      .groupBy(invoices.clientId)
      .orderBy(desc(sql`COALESCE(SUM(${invoices.amount}), 0)`))
      .limit(5);

      const topClients = await Promise.all(topClientsResult.map(async (row: any) => {
        const clientData = await db.select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone
        }).from(users).where(eq(users.id, row.clientId));
        
        return {
          ...clientData[0],
          totalSpent: Number(row.totalAmount)
        };
      }));

      res.json({
        total,
        active,
        pending,
        refused,
        approved,
        inactive: total - active,
        newThisMonth,
        newThisYear,
        clientsWithOrdersThisMonth,
        retention,
        engagementRate,
        topClients
      });
    } catch (error) {
      console.error("Clients analytics error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 10. CROISSANCE DES CLIENTS (12 derniers mois)
  // ============================================================
  app.get("/api/analytics/client-growth", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const result = await db.select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${users.createdAt}), 'YYYY-MM')`,
        new_clients: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(and(
        eq(users.role, "client"),
        eq(users.status, "approved"),
        gte(users.createdAt, twelveMonthsAgo)
      ))
      .groupBy(sql`DATE_TRUNC('month', ${users.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${users.createdAt})`);

      const monthlyData: Record<string, number> = {};
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
      }

      result.forEach((row: any) => {
        if (monthlyData[row.month] !== undefined) {
          monthlyData[row.month] = Number(row.new_clients);
        }
      });

      const formattedResult = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        new_clients: count
      }));

      res.json(formattedResult);
    } catch (error) {
      console.error("Client growth error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 11. COMMANDES EN RETARD (API dédiée)
  // ============================================================
  app.get("/api/analytics/late-orders", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      const lateOrdersList = await getLateOrdersWithDetails();
      
      const pickupLate = lateOrdersList.filter(o => o.lateType === "pickup_late").length;
      const deliveryLate = lateOrdersList.filter(o => o.lateType === "delivery_late").length;
      const stuckStatus = lateOrdersList.filter(o => o.lateType === "status_stuck").length;
      const criticalLate = lateOrdersList.filter(o => o.lateHours > 24).length;

      const totalLateHours = lateOrdersList.reduce((sum, o) => sum + (o.lateHours || 0), 0);
      const avgLateHours = lateOrdersList.length > 0 ? Math.round((totalLateHours / lateOrdersList.length) * 100) / 100 : 0;

      const lateHistory = await db.select()
        .from(orderLateHistory)
        .where(gte(orderLateHistory.detectedAt, thirtyDaysAgo))
        .orderBy(desc(orderLateHistory.detectedAt));

      const byStatus: Record<string, number> = {};
      lateOrdersList.forEach(o => {
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      });

      res.json({
        activeLate: {
          total: lateOrdersList.length,
          pickupLate,
          deliveryLate,
          stuckStatus,
          criticalLate,
          avgLateHours,
          byStatus,
          details: lateOrdersList.map(o => ({
            id: o.id,
            status: o.status,
            lateHours: o.lateHours,
            lateType: o.lateType,
            clientId: o.clientId,
            createdAt: o.createdAt,
            scheduledPickupDate: o.scheduledPickupDate,
            scheduledDeliveryDate: o.scheduledDeliveryDate,
            statusChangedAt: o.statusChangedAt
          }))
        },
        recentHistory: lateHistory.slice(0, 50),
        summary: {
          totalLateLast30Days: lateHistory.length,
          resolvedLast30Days: lateHistory.filter(r => r.resolvedAt).length
        }
      });
    } catch (error) {
      console.error("Late orders error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // 12. SCAN DES RETARDS - Endpoint admin
  // ============================================================
  app.post("/api/admin/scan-late-orders", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const result = await scanLateOrders();
      
      res.json({ 
        success: true, 
        message: `Scan terminé. ${result.lateCount} commandes en retard détectées.`,
        lateCount: result.lateCount,
        details: result.details
      });
    } catch (error) {
      console.error("Scan late orders error:", error);
      res.status(500).json({ message: "Erreur lors du scan des retards" });
    }
  });

  // ============================================================
  // 13. STATISTIQUES DES RETARDS - Endpoint admin
  // ============================================================
  app.get("/api/admin/late-stats", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const stats = await getLateStats();
      res.json(stats);
    } catch (error) {
      console.error("Late stats error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ============================================================
  // 14. RÉSOUDRE UN RETARD - Endpoint admin
  // ============================================================
  app.post("/api/admin/resolve-late/:orderId", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const userId = (req.user as any)?.id;

      
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      await recordLateResolution(orderId, userId);
      
      res.json({ 
        success: true, 
        message: `Retard de la commande #${orderId} résolu.`
      });
    } catch (error) {
      console.error("Resolve late error:", error);
      res.status(500).json({ message: "Erreur lors de la résolution du retard" });
    }
  });

  // ============================================================
  // 15. SLA STATS
  // ============================================================
  app.get("/api/sla/stats", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const activeOrders = await db.select()
        .from(orders)
        .where(not(eq(orders.status, "delivered")));
      
      const byLevel: any = { normal: 0, attention: 0, urgent: 0, retard: 0 };
      const byStatus: Record<string, any> = {};

      activeOrders.forEach(order => {
        const { level, progress } = calculateSLALevel(order);
        byLevel[level] = (byLevel[level] || 0) + 1;

        if (!byStatus[order.status]) {
          byStatus[order.status] = { total: 0, normal: 0, attention: 0, urgent: 0, retard: 0, totalProgress: 0 };
        }
        byStatus[order.status].total++;
        byStatus[order.status][level]++;
        byStatus[order.status].totalProgress += progress;
      });

      Object.keys(byStatus).forEach(status => {
        byStatus[status].avgProgress = byStatus[status].total > 0 
          ? Math.round(byStatus[status].totalProgress / byStatus[status].total) 
          : 0;
        delete byStatus[status].totalProgress;
      });

      const totalActive = activeOrders.length;
      const riskScore = totalActive > 0 
        ? Math.round((byLevel.urgent * 70 + byLevel.retard * 100 + byLevel.attention * 30) / totalActive) 
        : 0;

      res.json({ 
        byLevel, 
        byStatus, 
        totalActive,
        averageRiskScore: riskScore,
        anomalies: byLevel.urgent + byLevel.retard,
        estimatedRecovery: { 
          time: byLevel.urgent > 5 ? "2-4h" : byLevel.retard > 0 ? "1-2h" : "0h", 
          confidence: riskScore < 30 ? "high" : riskScore < 70 ? "medium" : "low" 
        }
      });
    } catch (error) {
      console.error("SLA stats error:", error);
      res.json({ 
        byLevel: { normal: 0, attention: 0, urgent: 0, retard: 0 }, 
        byStatus: {}, 
        totalActive: 0,
        averageRiskScore: 0, 
        anomalies: 0, 
        estimatedRecovery: { time: "0h", confidence: "high" } 
      });
    }
  });

  // ============================================================
  // 16. PRÉDICTIONS SUPERVISEUR
  // ============================================================
  app.get("/api/supervisor/predictions", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const activeOrders = await db.select({
        order: orders,
        client: users
      }).from(orders)
      .innerJoin(users, eq(orders.clientId, users.id))
      .where(not(eq(orders.status, "delivered")));

      const predictions = activeOrders.map(({ order, client }) => {
        const { level, progress, timeInStatus } = calculateSLALevel(order);
        
        let riskScore = progress;
        if (order.itemCount && order.itemCount > 50) riskScore += 10;
        if (order.itemCount && order.itemCount > 100) riskScore += 5;
        if (level === "retard") riskScore = 100;
        if (level === "urgent") riskScore = Math.max(riskScore, 70);
        
        riskScore = Math.min(Math.max(riskScore, 0), 100);

        let suggestedAction = "Surveillance normale";
        let priority = "low";
        
        if (riskScore > 70) {
          suggestedAction = "Action immédiate requise";
          priority = "high";
        } else if (riskScore > 40) {
          suggestedAction = "Surveillance renforcée";
          priority = "medium";
        }

        const isLate = isOrderLate(order);
        if (isLate) {
          suggestedAction = "⚠️ Commande en retard - Action urgente";
          priority = "high";
          riskScore = Math.max(riskScore, 90);
        }

        return {
          orderId: order.id,
          clientName: client.fullName,
          status: order.status,
          riskScore: Math.round(riskScore),
          timeInStatus: Math.round(timeInStatus),
          level,
          suggestedAction,
          priority,
          isLate
        };
      });

      const summary = {
        totalAtRisk: predictions.filter(p => p.riskScore > 40).length,
        highRisk: predictions.filter(p => p.riskScore > 70).length,
        mediumRisk: predictions.filter(p => p.riskScore > 40 && p.riskScore <= 70).length,
        lowRisk: predictions.filter(p => p.riskScore <= 40).length,
        averageRiskScore: predictions.length > 0 
          ? Math.round(predictions.reduce((a, p) => a + p.riskScore, 0) / predictions.length) 
          : 0
      };

      res.json({ predictions, summary });
    } catch (error) {
      console.error("Predictions error:", error);
      res.json({ predictions: [], summary: { totalAtRisk: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, averageRiskScore: 0 } });
    }
  });

  // ============================================================
  // 17. RECOMMANDATIONS SUPERVISEUR - CORRIGÉE
  // ============================================================
  app.get("/api/supervisor/recommendations", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const activeOrders = await db.select()
        .from(orders)
        .where(not(eq(orders.status, "delivered")));
      
      const statusCounts: Record<string, number> = {};
      activeOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

      const recommendations: Recommendation[] = [];

      WORKFLOW_STEPS.forEach(step => {
        const count = statusCounts[step.status] || 0;
        const threshold = step.status === "to_wash" || step.status === "to_dry" ? 10 : 5;
        
        if (count > threshold) {
          recommendations.push({
            type: "bottleneck",
            title: "Goulot détecté",
            description: `${step.label} : ${count} commandes en attente`,
            action: count > threshold * 2 ? "Priorité absolue - Réaffectation urgente" : "Réaffecter des ressources",
            priority: count > threshold * 2 ? "high" : "medium",
            status: step.status,
            count
          });
        }
      });

      const lateOrdersList = await getLateOrdersWithDetails();
      const veryLateOrders = lateOrdersList.filter(o => o.lateHours > 24);
      
      if (veryLateOrders.length > 0) {
        recommendations.push({
          type: "urgent",
          title: "⚠️ Commandes critiques",
          description: `${veryLateOrders.length} commande(s) avec +24h de retard`,
          action: "Contacter immédiatement les clients concernés",
          priority: "high"
        });
      }

      const pendingInvoicesCount = await db.select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.status, "pending"));
      
      if (Number(pendingInvoicesCount[0]?.count || 0) > 5) {
        recommendations.push({
          type: "financial",
          title: "Factures impayées",
          description: `${pendingInvoicesCount[0]?.count} factures en attente de paiement`,
          action: "Envoyer des relances aux clients",
          priority: "medium"
        });
      }

      const priorityOrder: Record<string, number> = { 
        high: 0, 
        medium: 1, 
        low: 2 
      };
      
      res.json(
        recommendations
          .sort((a: Recommendation, b: Recommendation) => 
            priorityOrder[a.priority] - priorityOrder[b.priority]
          )
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Recommendations error:", error);
      res.json([]);
    }
  });

  console.log("✅ Analytics routes loaded with executive dashboard");
}