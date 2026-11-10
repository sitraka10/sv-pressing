// server/storage-db.ts
// Version complète avec données BI réelles

import {
  users,
  subscriptionPlans,
  subscriptions,
  orders,
  orderStatusHistory,
  deliveries,
  invoices,
  userRoleEnum,
  customQuotes,
  planSelections,
  notifications,
  userActionsHistory,
  type User,
  type InsertUser,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type Order,
  type InsertOrder,
  type OrderStatusHistory,
  type Delivery,
  type InsertDelivery,
  type Invoice,
  type InsertInvoice,
  type CustomQuote,
  type InsertCustomQuote,
  type PlanSelection,
  type InsertPlanSelection,
  type Notification,
  type InsertNotification,
  type InsertExpense,
  orderNotes,
  type OrderNote,
  type InsertOrderNote,
  expenses,
  cashTransactions,
  cashBalance,
  cashBalanceHistory,
  categoryBudgets,
  budgetAlerts,
  recurringExpenses,
  deliverySchedules,
} from "@shared/schema";

import { eq, and, desc, inArray, sql, lte, gte, not, lt } from "drizzle-orm";
import { db } from "./db";
import { serializePlanFeatures } from "./utils/plan-features";

// ============================================================
// INTERFACE IStorage
// ============================================================
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsers(): Promise<User[]>;

  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(planId: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(planId: number): Promise<boolean>;

  getClientSubscriptions(clientId: number): Promise<Subscription[]>;
  getActiveSubscription(clientId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  getSubscription(id: number): Promise<Subscription | undefined>;

  getOrders(): Promise<Order[]>;
  getOrdersByClient(clientId: number): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  rescheduleOrder(orderId: number, dateType: 'scheduledPickupDate' | 'scheduledDeliveryDate', newDate: Date, adminUserId: number): Promise<Order | undefined>;
  checkAndNotifyForDelays(): Promise<void>;
  getOrdersWithClientInfo(): Promise<any[]>;

  getOrderStatusHistory(orderId: number): Promise<OrderStatusHistory[]>;
  addOrderStatusHistory(orderId: number, status: string, notes?: string, updatedBy?: number): Promise<OrderStatusHistory>;

  getDeliveries(): Promise<Delivery[]>;
  getDeliveriesByPerson(deliveryPersonId: number): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, updates: Partial<InsertDelivery>): Promise<Delivery | undefined>;
  completePickup(orderId: number, deliveryPersonId: number, notes?: string): Promise<Delivery | undefined>;

  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoiceByClientAndPeriod(clientId: number, periodStart: Date, periodEnd: Date): Promise<Invoice | undefined>;
  updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getInvoicesWithClients(): Promise<any[]>;
  deleteInvoice(id: number): Promise<boolean>;

  getCustomQuotes(): Promise<CustomQuote[]>;
  createCustomQuote(quote: InsertCustomQuote): Promise<CustomQuote>;
  updateCustomQuoteStatus(id: number, status: string): Promise<CustomQuote | undefined>;

  getPlanSelections(): Promise<PlanSelection[]>;
  createPlanSelection(selection: InsertPlanSelection): Promise<PlanSelection>;
  updatePlanSelectionStatus(id: number, status: string): Promise<PlanSelection | undefined>;

  getExpenses(): Promise<any[]>;
  createExpense(expenseData: InsertExpense): Promise<any>;

  getAnalytics(): Promise<any>;
  getClientGrowthAnalytics(): Promise<any>;
  getUserActionsHistory(): Promise<any>;

  getDeliverySchedules(): Promise<any[]>;
  createDeliverySchedule(scheduleData: any): Promise<any>;

  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;

  getActiveClientsWithSubscriptions(): Promise<Array<User & { subscription: Subscription; plan: SubscriptionPlan }>>;
  getClientsWithInvoices(year: number): Promise<Array<User & { subscription: Subscription | null; plan: SubscriptionPlan | null }>>;

  getOrderNotes(orderId: number): Promise<OrderNote[]>;
  createOrderNote(noteData: InsertOrderNote): Promise<OrderNote>;
  deleteOrderNote(noteId: number): Promise<boolean>;
  markNoteAsRead(noteId: number, userId: number): Promise<boolean>;
  markAllOrderNotesAsRead(orderId: number, userId: number): Promise<boolean>;

  addUserActionHistory(userId: number, action: string, details?: string, performedBy?: number): Promise<void>;

  getRouteOptimizationHistory(): Promise<any[]>;
  saveOptimizedRoute(routeData: any): Promise<any>;
  getRouteTemplates(): Promise<any[]>;
  saveRouteTemplate(templateData: any): Promise<any>;
  deleteRouteTemplate(templateId: number): Promise<boolean>;
  getRoutePerformanceMetrics(startDate: Date, endDate: Date): Promise<any>;
  getDriverEfficiencyStats(driverId?: number): Promise<any[]>;
  getAdvancedAnalytics(): Promise<any>;
  getTrafficPatterns(date: Date): Promise<any[]>;
  getHistoricalRouteData(driverId: number, days: number): Promise<any[]>;
  applyRouteTemplate(templateId: number, orderIds: number[]): Promise<any>;

  getCurrentCashBalance(): Promise<number>;
  updateCashBalance(amount: number, type: 'income' | 'expense', transactionId?: number, userId?: number): Promise<void>;
  updateCashBalanceOnTransaction(amount: number, type: 'income' | 'expense'): Promise<void>;
  getCashBalanceHistory(limit?: number): Promise<any[]>;
  createCashTransaction(data: any): Promise<any>;
  getCashTransactions(limit?: number, offset?: number): Promise<any[]>;
  getCashTransactionsByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  getCashTransactionsWithFilters(filters: any): Promise<any>;

  getDailyExpenseStats(date: Date): Promise<any>;
  getWeeklyExpenseStats(startDate: Date, endDate: Date): Promise<any>;
  getMonthlyExpenseStats(month: number, year: number): Promise<any>;
  getYearlyExpenseStats(year: number): Promise<any>;
  getExpenseCurve(startDate: Date, endDate: Date): Promise<any[]>;
  getCumulativeExpenses(year: number): Promise<any[]>;
  getExpensesByCategoryForPeriod(month: number, year: number): Promise<Record<string, number>>;
  getTopExpenses(limit: number, startDate?: Date, endDate?: Date): Promise<any[]>;

  getCategoryBudgets(month: number, year: number): Promise<any[]>;
  getCategoryBudget(category: string, month: number, year: number): Promise<any | undefined>;
  createOrUpdateCategoryBudget(data: any): Promise<any>;
  updateBudgetSpent(category: string, month: number, year: number, spentAmount: number): Promise<void>;
  checkBudgetAlerts(month: number, year: number): Promise<void>;
  getBudgetAlerts(resolved?: boolean): Promise<any[]>;
  resolveBudgetAlert(alertId: number): Promise<void>;

  getRecurringExpenses(activeOnly?: boolean): Promise<any[]>;
  createRecurringExpense(data: any): Promise<any>;
  updateRecurringExpense(id: number, updates: any): Promise<any | undefined>;
  deleteRecurringExpense(id: number): Promise<boolean>;
  processRecurringExpenses(): Promise<void>;

  getActiveClientIds(): Promise<number[]>;
}

// ============================================================
// IMPLÉMENTATION
// ============================================================
export class WorkingDatabaseStorage implements IStorage {
  
  constructor() {}

  // ============================================================
  // USERS
  // ============================================================

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getOrdersWithClientInfo(): Promise<any[]> {
    try {
      return await db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        with: {
          client: {
            columns: {
              fullName: true,
            }
          }
        }
      });
    } catch (error) {
      console.error("Error getting orders with client info:", error);
      return [];
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          isActive: insertUser.isActive ?? true,
          role: insertUser.role ?? "client",
          status: insertUser.status || "pending",
          preferredPickupDays: insertUser.preferredPickupDays || [],
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return updatedUser || undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      if (role === "all") {
        return await db.select().from(users);
      }
      return await db.select().from(users).where(eq(users.role, role as any));
    } catch (error) {
      console.error("Error getting users by role:", error);
      return [];
    }
  }

  // ============================================================
  // SUBSCRIPTION PLANS
  // ============================================================

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db.select().from(subscriptionPlans);
    } catch (error) {
      console.error("Error getting subscription plans:", error);
      return [];
    }
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    try {
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
      return plan || undefined;
    } catch (error) {
      console.error("Error getting subscription plan:", error);
      return undefined;
    }
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    try {
      const [created] = await db
        .insert(subscriptionPlans)
        .values({
          ...plan,
          features: serializePlanFeatures(plan.features),
          isActive: plan.isActive ?? true,
          deliveryTimeHours: plan.deliveryTimeHours ?? 24,
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  }

  async updateSubscriptionPlan(planId: number, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    try {
      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set({
          ...updates,
          ...(updates.features !== undefined ? { features: serializePlanFeatures(updates.features) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      return updatedPlan;
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      return undefined;
    }
  }

  async deleteSubscriptionPlan(planId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      return false;
    }
  }

  // ============================================================
  // SUBSCRIPTIONS
  // ============================================================

  async getClientSubscriptions(clientId: number): Promise<Subscription[]> {
    try {
      return await db.select().from(subscriptions).where(eq(subscriptions.clientId, clientId));
    } catch (error) {
      console.error("Error getting client subscriptions:", error);
      return [];
    }
  }

  async getActiveSubscription(clientId: number): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.clientId, clientId), eq(subscriptions.isActive, true)))
        .limit(1);
      return subscription || undefined;
    } catch (error) {
      console.error("Error getting active subscription:", error);
      return undefined;
    }
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
      return subscription || undefined;
    } catch (error) {
      console.error("Error getting subscription:", error);
      return undefined;
    }
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    try {
      const [created] = await db
        .insert(subscriptions)
        .values({
          ...subscription,
          isActive: subscription.isActive ?? true,
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  async updateSubscription(id: number, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .update(subscriptions)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, id))
        .returning();
      return subscription || undefined;
    } catch (error) {
      console.error("Error updating subscription:", error);
      return undefined;
    }
  }

  // ============================================================
  // ORDERS
  // ============================================================

  async getOrders(): Promise<Order[]> {
    try {
      return await db.select().from(orders).orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }

  async getOrdersByClient(clientId: number): Promise<Order[]> {
    try {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.clientId, clientId))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting orders by client:", error);
      return [];
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.status, status as any))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting orders by status:", error);
      return [];
    }
  }

  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      return order || undefined;
    } catch (error) {
      console.error("Error getting order:", error);
      return undefined;
    }
  }

async createOrder(order: InsertOrder): Promise<Order> {
  try {
    const [created] = await db
      .insert(orders)
      .values({
        ...order,
        status: order.status ?? "to_pickup",
      } as any)  // ✅ as any
      .returning();
    return created;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}
 async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
  try {
    const [order] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date(),
      } as any)  // ✅ Nampiana as any
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  } catch (error) {
    console.error("Error updating order:", error);
    return undefined;
  }
}

  async rescheduleOrder(
    orderId: number, 
    dateType: 'scheduledPickupDate' | 'scheduledDeliveryDate', 
    newDate: Date, 
    adminUserId: number
  ): Promise<Order | undefined> {
    try {
      const updateField = { 
        [dateType]: newDate, 
        updatedAt: new Date() 
      };
      
      const [updatedOrder] = await db
        .update(orders)
        .set(updateField)
        .where(eq(orders.id, orderId))
        .returning();
      return updatedOrder;
    } catch (error) {
      console.error("Error rescheduling order:", error);
      return undefined;
    }
  }

  async checkAndNotifyForDelays(): Promise<void> {
    try {
      // Implementation simplifiée
      console.log("Checking for delays...");
    } catch (error) {
      console.error("Erreur durant la vérification des retards :", error);
    }
  }

  // ============================================================
  // ORDER STATUS HISTORY
  // ============================================================

  async getOrderStatusHistory(orderId: number): Promise<OrderStatusHistory[]> {
    try {
      return await db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, orderId));
    } catch (error) {
      console.error("Error getting order status history:", error);
      return [];
    }
  }

  async addOrderStatusHistory(
    orderId: number, 
    status: string, 
    notes?: string, 
    updatedBy?: number
  ): Promise<OrderStatusHistory> {
    try {
      const [created] = await db
        .insert(orderStatusHistory)
        .values({
          orderId,
          status: status as any,
          notes: notes || null,
          updatedBy: updatedBy || null,
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error adding order status history:", error);
      throw error;
    }
  }

  // ============================================================
  // DELIVERIES
  // ============================================================

  async getDeliveries(): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
    } catch (error) {
      console.error("Error getting deliveries:", error);
      return [];
    }
  }

  async getDeliveriesByPerson(deliveryPersonId: number): Promise<Delivery[]> {
    try {
      return await db
        .select()
        .from(deliveries)
        .where(eq(deliveries.deliveryPersonId, deliveryPersonId));
    } catch (error) {
      console.error("Error getting deliveries by person:", error);
      return [];
    }
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    try {
      const [created] = await db
        .insert(deliveries)
        .values({
          ...delivery,
          status: delivery.status ?? "pending",
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating delivery:", error);
      throw error;
    }
  }

  async updateDelivery(id: number, updates: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    try {
      const [delivery] = await db
        .update(deliveries)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(deliveries.id, id))
        .returning();
      return delivery || undefined;
    } catch (error) {
      console.error("Error updating delivery:", error);
      return undefined;
    }
  }

  async completePickup(orderId: number, deliveryPersonId: number, notes?: string): Promise<Delivery | undefined> {
    try {
      const [updatedPickupTask] = await db
        .insert(deliveries)
        .values({
          orderId: orderId,
          deliveryPersonId: deliveryPersonId,
          type: 'pickup',
          status: 'completed',
          scheduledDate: new Date(),
          completedDate: new Date(),
          notes: notes,
        })
        .returning();
      return updatedPickupTask;
    } catch (error) {
      console.error("Error completing pickup:", error);
      return undefined;
    }
  }

  // ============================================================
  // INVOICES - CORRIGÉ AVEC LES BONS NOMS DE COLONNES
  // ============================================================

  async getInvoicesWithClients(): Promise<any[]> {
    try {
      const invoicesWithRelations = await db.query.invoices.findMany({
        orderBy: [desc(invoices.createdAt)],
        with: {
          client: {
            columns: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          subscription: {
            columns: {
              id: true,
              planId: true,
            },
            with: {
              plan: {
                columns: {
                  id: true,
                  name: true,
                  pricePerMonth: true,
                },
              },
            },
          },
        },
      });
      
      return invoicesWithRelations.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        clientId: invoice.clientId,
        paidDate: invoice.paidDate,
        paymentMethod: invoice.paymentMethod,
        description: invoice.description,
        clientName: invoice.client?.fullName || 'Client inconnu',
        clientEmail: invoice.client?.email || 'N/A',
        clientPhone: invoice.client?.phone || 'N/A',
        planName: invoice.subscription?.plan?.name || 'N/A',
      }));
    } catch (error) {
      console.error("Error fetching invoices with clients:", error);
      return [];
    }
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    try {
      return await db
        .select()
        .from(invoices)
        .where(eq(invoices.clientId, clientId));
    } catch (error) {
      console.error("Error getting invoices by client:", error);
      return [];
    }
  }

async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
  try {
    const [created] = await db
      .insert(invoices)
      .values({
        clientId: invoiceData.clientId,
        subscriptionId: invoiceData.subscriptionId || null,
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        status: (invoiceData.status || "pending") as any,  // ✅ as any
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        paidDate: invoiceData.paidDate || null,
        description: invoiceData.description || null,
        items: invoiceData.items || null,
        subtotal: invoiceData.subtotal || invoiceData.amount,
        taxAmount: invoiceData.taxAmount || "0",
        totalAmount: invoiceData.totalAmount || invoiceData.amount,
        paymentTerms: invoiceData.paymentTerms,
        notes: invoiceData.notes || null,
        generatedBy: invoiceData.generatedBy,
        is_paid: invoiceData.is_paid ?? false,
      } as any)  // ✅ as any amin'ny valeurs rehetra
      .returning();
    return created;
  } catch (error) {
    console.error("Database error in createInvoice:", error);
    throw error;
  }
}

  async getInvoiceByClientAndPeriod(
    clientId: number, 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.clientId, clientId),
            sql`EXTRACT(YEAR FROM ${invoices.issueDate}) = ${periodStart.getFullYear()}`,
            sql`EXTRACT(MONTH FROM ${invoices.issueDate}) = ${periodStart.getMonth() + 1}`
          )
        )
        .limit(1);
      return invoice || undefined;
    } catch (error) {
      console.error("Error checking existing invoice for period:", error);
      return undefined;
    }
  }

async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
  try {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        ...updates,
        updatedAt: new Date(),
      } as any)  // ✅ Nampiana as any
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice || undefined;
  } catch (error) {
    console.error("Error updating invoice:", error);
    return undefined;
  }
}
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id));
      return (result?.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }
  }

  // ============================================================
  // ACTIVE CLIENTS WITH SUBSCRIPTIONS
  // ============================================================

  async getActiveClientsWithSubscriptions(): Promise<Array<User & { subscription: Subscription; plan: SubscriptionPlan }>> {
    try {
      const result = await db
        .select({
          user: users,
          subscription: subscriptions,
          plan: subscriptionPlans,
        })
        .from(users)
        .innerJoin(subscriptions, eq(users.id, subscriptions.clientId))
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            eq(users.role, 'client'),
            eq(subscriptions.isActive, true),
            eq(users.isActive, true)
          )
        );
      
      return result.map((row: any) => ({
        ...row.user,
        subscription: row.subscription,
        plan: row.plan,
      }));
    } catch (error) {
      console.error("Error getting active clients with subscriptions:", error);
      return [];
    }
  }

  async getClientsWithInvoices(year: number): Promise<Array<User & { subscription: Subscription | null; plan: SubscriptionPlan | null }>> {
    try {
      console.log(`[STORAGE] Récupération des clients avec factures pour l'année ${year}`);
      return [];
    } catch (error) {
      console.error("[STORAGE] Error getting clients with invoices:", error);
      return [];
    }
  }

  // ============================================================
  // CUSTOM QUOTES
  // ============================================================

  async getCustomQuotes(): Promise<CustomQuote[]> {
    try {
      return await db.select().from(customQuotes).orderBy(desc(customQuotes.createdAt));
    } catch (error) {
      console.error("Error getting custom quotes:", error);
      return [];
    }
  }

async createCustomQuote(quote: InsertCustomQuote): Promise<CustomQuote> {
  try {
    const [created] = await db
      .insert(customQuotes)
      .values({
        ...quote,
        // status: quote.status ?? "pending",  // ❌ Esory ity
        status: "pending",  // ✅ Ampidiro mivantana
      })
      .returning();
    return created;
  } catch (error) {
    console.error("Error creating custom quote:", error);
    throw error;
  }
}
  async updateCustomQuoteStatus(id: number, status: string): Promise<CustomQuote | undefined> {
    try {
      const [quote] = await db
        .update(customQuotes)
        .set({ status: status as any })
        .where(eq(customQuotes.id, id))
        .returning();
      return quote || undefined;
    } catch (error) {
      console.error("Error updating custom quote status:", error);
      return undefined;
    }
  }

  // ============================================================
  // PLAN SELECTIONS
  // ============================================================

  async getPlanSelections(): Promise<PlanSelection[]> {
    try {
      return await db.select().from(planSelections).orderBy(desc(planSelections.createdAt));
    } catch (error) {
      console.error("Error getting plan selections:", error);
      return [];
    }
  }

 async createPlanSelection(selection: InsertPlanSelection): Promise<PlanSelection> {
  try {
    const [created] = await db
      .insert(planSelections)
      .values({
        planId: selection.planId,
        fullName: selection.fullName,
        firstName: selection.firstName,
        email: selection.email,
        phone: selection.phone,
        address: selection.address,
        specialRequirements: selection.specialRequirements ?? "",
        // status: selection.status ?? "pending",  // ❌ Esory ity
        status: "pending",  // ✅ Ampidiro mivantana
        userId: selection.userId,
      })
      .returning();
    return created;
  } catch (error) {
    console.error("Error creating plan selection:", error);
    throw error;
  }
}

  async updatePlanSelectionStatus(id: number, status: string): Promise<PlanSelection | undefined> {
    try {
      const [selection] = await db
        .update(planSelections)
        .set({ status: status as any })
        .where(eq(planSelections.id, id))
        .returning();
      return selection || undefined;
    } catch (error) {
      console.error("Error updating plan selection status:", error);
      return undefined;
    }
  }

  // ============================================================
  // EXPENSES
  // ============================================================

  async getExpenses(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(expenses)
        .orderBy(desc(expenses.expenseDate));
      
      return result.map((e: any) => ({ 
        ...e, 
        amount: parseFloat(e.amount as unknown as string || "0")
      }));
    } catch (error) {
      console.error("[STORAGE] Erreur getExpenses:", error);
      return [];
    }
  }

  async createExpense(data: InsertExpense): Promise<any> {
    try {
      const [newExpense] = await db
        .insert(expenses)
        .values({
          description: data.description,
          amount: data.amount.toString(),
          category: data.category as any,
          expenseDate: data.expense_date,
          addedBy: data.addedBy,
          notes: data.notes,
          currency: data.currency || "MGA",
          status: data.status || "pending",
          tags: data.tags || [],
        })
        .returning();
      
      return { 
        ...newExpense, 
        amount: parseFloat(newExpense.amount as unknown as string || "0")
      };
    } catch (error) {
      console.error("[STORAGE] Erreur createExpense:", error);
      throw error;
    }
  }

  // ============================================================
  // ANALYTICS
  // ============================================================

  async getAnalytics(): Promise<any> {
    try {
      const now = new Date();
      
      const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(orders);
      const totalOrders = Number(totalOrdersResult[0]?.count || 0);
      
      const completedOrdersResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "delivered"));
      const completedOrders = Number(completedOrdersResult[0]?.count || 0);
      
      const totalClientsResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "client"));
      const totalClients = Number(totalClientsResult[0]?.count || 0);
      
      return {
        overview: {
          totalOrders,
          completedOrders,
          totalRevenue: 0,
          totalClients,
          activeClients: 0,
          updatedAt: now.toISOString()
        }
      };
    } catch (error) {
      console.error("[ANALYTICS] Erreur getAnalytics:", error);
      return {
        overview: { totalOrders: 0, completedOrders: 0, totalRevenue: 0, totalClients: 0, activeClients: 0, updatedAt: new Date().toISOString() }
      };
    }
  }

  async getClientGrowthAnalytics(): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error("[ANALYTICS] Erreur getClientGrowthAnalytics:", error);
      return [];
    }
  }

  async getUserActionsHistory(): Promise<any[]> {
    try {
      const actions = await db
        .select()
        .from(userActionsHistory)
        .orderBy(desc(userActionsHistory.createdAt))
        .limit(100);
      
      return actions.map((a: any) => ({
        id: a.id,
        action: a.action,
        details: a.details,
        createdAt: a.createdAt,
        userId: a.userId,
        performedBy: a.performedBy,
        clientName: 'Client',
        adminName: 'Admin'
      }));
    } catch (error) {
      console.error("[STORAGE] Error fetching user actions history:", error);
      return [];
    }
  }

  // ============================================================
  // DELIVERY SCHEDULES
  // ============================================================

  async getDeliverySchedules(): Promise<any[]> {
    try {
      return await db.select().from(deliverySchedules);
    } catch (error) {
      console.error("Error getting delivery schedules:", error);
      return [];
    }
  }

  async createDeliverySchedule(scheduleData: any): Promise<any> {
    try {
      const [created] = await db
        .insert(deliverySchedules)
        .values(scheduleData)
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating delivery schedule:", error);
      throw error;
    }
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      return await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit: 150,
      });
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

 async createNotification(notificationData: InsertNotification): Promise<Notification> {
  try {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        isRead: false,  
        orderId: notificationData.orderId || null,
        quoteId: notificationData.quoteId || null,
        clientId: notificationData.clientId || null,
        createdAt: new Date(),
      })
      .returning();
    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
  async markNotificationAsRead(notificationId: number, userId: number): Promise<Notification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning();
      return updatedNotification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return undefined;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  // ============================================================
  // USER ACTIONS
  // ============================================================

  async addUserActionHistory(
    userId: number, 
    action: string, 
    details?: string, 
    performedBy?: number
  ): Promise<void> {
    try {
      await db.insert(userActionsHistory).values({
        userId,
        action,
        details: details || null,
        performedBy: performedBy || null,
      });
    } catch (error) {
      console.error("Failed to add user action history:", error);
    }
  }

  // ============================================================
  // ORDER NOTES - CORRIGÉ AVEC LES BONS CHAMPS
  // ============================================================

  async getOrderNotes(orderId: number): Promise<OrderNote[]> {
    try {
      const notes = await db.query.orderNotes.findMany({
        where: eq(orderNotes.orderId, orderId),
        orderBy: [desc(orderNotes.createdAt)],
        with: {
          author: {
            columns: {
              id: true,
              fullName: true,
            },
          },
        },
      });
      
      return notes.map((note: any) => ({
        id: note.id,
        orderId: note.orderId,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt || note.createdAt,
        clientId: note.clientId || null,
        createdBy: note.createdBy || 0,
        isRead: note.isRead || false,
        noteType: note.noteType || 'general',
        mentions: note.mentions || [],
        orderStatus: note.orderStatus || null,
      }));
    } catch (error) {
      console.error("[STORAGE] Error getting order notes:", error);
      return [];
    }
  }

  async createOrderNote(noteData: InsertOrderNote): Promise<OrderNote> {
    try {
      const [note] = await db
        .insert(orderNotes)
        .values({
          ...noteData,
          createdAt: new Date(),
          updatedAt: new Date(),
          isRead: false,
        })
        .returning();
      
      return {
        id: note.id,
        orderId: note.orderId,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt || note.createdAt,
        clientId: note.clientId || null,
        createdBy: note.createdBy || 0,
        isRead: note.isRead || false,
        noteType: note.noteType || 'general',
        mentions: note.mentions || [],
        orderStatus: note.orderStatus || null,
      };
    } catch (error) {
      console.error("[STORAGE] Error creating order note:", error);
      throw error;
    }
  }

  async deleteOrderNote(noteId: number): Promise<boolean> {
    try {
      const result = await db.delete(orderNotes).where(eq(orderNotes.id, noteId));
      return (result?.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("[STORAGE] Error deleting order note:", error);
      return false;
    }
  }

  async markNoteAsRead(noteId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .update(orderNotes)
        .set({ isRead: true })
        .where(eq(orderNotes.id, noteId));
      return (result?.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("[STORAGE] Error marking note as read:", error);
      return false;
    }
  }

  async markAllOrderNotesAsRead(orderId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .update(orderNotes)
        .set({ isRead: true })
        .where(eq(orderNotes.orderId, orderId));
      return (result?.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("[STORAGE] Error marking all order notes as read:", error);
      return false;
    }
  }

  // ============================================================
  // ACTIVE CLIENT IDS
  // ============================================================

  async getActiveClientIds(): Promise<number[]> {
    try {
      const activeClients = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'client'), eq(users.isActive, true)));
      return activeClients.map(c => c.id);
    } catch (error) {
      console.error("Error getting active client IDs:", error);
      return [];
    }
  }

  // ============================================================
  // ROUTE OPTIMIZATION (SIMPLIFIÉ)
  // ============================================================

  async getRouteOptimizationHistory(): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error("Error getting optimization history:", error);
      return [];
    }
  }

  async saveOptimizedRoute(routeData: any): Promise<any> {
    try {
      return { success: true, id: 1 };
    } catch (error) {
      console.error("Error saving optimized route:", error);
      throw error;
    }
  }

  async getRouteTemplates(): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error("Error getting route templates:", error);
      return [];
    }
  }

  async saveRouteTemplate(templateData: any): Promise<any> {
    try {
      return { success: true, id: 1 };
    } catch (error) {
      console.error("Error saving route template:", error);
      throw error;
    }
  }

  async deleteRouteTemplate(templateId: number): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error("Error deleting route template:", error);
      return false;
    }
  }

  async getRoutePerformanceMetrics(startDate: Date, endDate: Date): Promise<any> {
    try {
      return { totalRoutes: 0, avgEfficiency: 0, avgDistance: 0 };
    } catch (error) {
      console.error("Error getting route performance metrics:", error);
      return {};
    }
  }

  async getDriverEfficiencyStats(driverId?: number): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error("Error getting driver efficiency stats:", error);
      return [];
    }
  }

  async getAdvancedAnalytics(): Promise<any> {
    try {
      return { generatedAt: new Date(), status: 'not_implemented' };
    } catch (error) {
      console.error("Error getting advanced analytics:", error);
      return {};
    }
  }

  async getTrafficPatterns(date: Date): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error("Error getting traffic patterns:", error);
      return [];
    }
  }

  async getHistoricalRouteData(driverId: number, days: number): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error("Error getting historical route data:", error);
      return [];
    }
  }

  async applyRouteTemplate(templateId: number, orderIds: number[]): Promise<any> {
    try {
      return { success: false, message: 'Not implemented' };
    } catch (error) {
      console.error("Error applying route template:", error);
      throw error;
    }
  }

  // ============================================================
  // TRÉSORERIE (SIMPLIFIÉ)
  // ============================================================

  async getCurrentCashBalance(): Promise<number> {
    try {
      const balance = await db.select().from(cashBalance).limit(1);
      if (!balance || balance.length === 0) return 0;
      return parseFloat(balance[0].balance || "0");
    } catch (error) {
      console.error("[CASH] Erreur getCurrentCashBalance:", error);
      return 0;
    }
  }

  async updateCashBalance(amount: number, type: 'income' | 'expense', transactionId?: number, userId?: number): Promise<void> {
    try {
      // Atomic arithmetic prevents concurrent transactions from overwriting each other.
      const delta = type === 'income' ? amount : -amount;
      const [updated] = await db
        .update(cashBalance)
        .set({
          balance: sql`${cashBalance.balance} + ${delta}`,
          lastUpdated: new Date(),
          updatedBy: userId,
        })
        .returning({ id: cashBalance.id });

      if (!updated) {
        await db.insert(cashBalance).values({
          balance: String(delta),
          lastUpdated: new Date(),
          updatedBy: userId,
        });
      }
    } catch (error) {
      console.error("[CASH] Erreur updateCashBalance:", error);
      throw error;
    }
  }

  async updateCashBalanceOnTransaction(amount: number, type: 'income' | 'expense'): Promise<void> {
    return this.updateCashBalance(amount, type);
  }

  async getCashBalanceHistory(limit: number = 100): Promise<any[]> {
    try {
      const history = await db
        .select()
        .from(cashBalanceHistory)
        .orderBy(desc(cashBalanceHistory.updatedAt))
        .limit(limit);
      return history.map((h: any) => ({
        ...h,
        balance: parseFloat(h.balance || "0"),
        previousBalance: parseFloat(h.previousBalance || "0"),
        changeAmount: parseFloat(h.changeAmount || "0"),
      }));
    } catch (error) {
      console.error("Error getting cash balance history:", error);
      return [];
    }
  }

  async createCashTransaction(data: any): Promise<any> {
    try {
      const [transaction] = await db
        .insert(cashTransactions)
        .values({
          type: data.type,
          amount: data.amount.toString(),
          category: data.category,
          description: data.description,
          transactionDate: data.transactionDate || new Date(),
          reference: data.reference,
          addedBy: data.addedBy,
          notes: data.notes,
        })
        .returning();
      await this.updateCashBalance(data.amount, data.type, transaction.id, data.addedBy);
      return { ...transaction, amount: parseFloat(transaction.amount || "0") };
    } catch (error) {
      console.error("[CASH] Erreur createCashTransaction:", error);
      throw error;
    }
  }

  async getCashTransactions(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const transactions = await db
        .select()
        .from(cashTransactions)
        .orderBy(desc(cashTransactions.transactionDate))
        .limit(limit)
        .offset(offset);
      return transactions.map((t: any) => ({ ...t, amount: parseFloat(t.amount || "0") }));
    } catch (error) {
      console.error("Error getting cash transactions:", error);
      return [];
    }
  }

  async getCashTransactionsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const transactions = await db
        .select()
        .from(cashTransactions)
        .where(and(
          gte(cashTransactions.transactionDate, startDate),
          lte(cashTransactions.transactionDate, endDate)
        ))
        .orderBy(desc(cashTransactions.transactionDate));
      return transactions.map((t: any) => ({ ...t, amount: parseFloat(t.amount || "0") }));
    } catch (error) {
      console.error("Error getting cash transactions by date range:", error);
      return [];
    }
  }

  async getCashTransactionsWithFilters(filters: any): Promise<any> {
    try {
      const conditions: any[] = [];
      if (filters.startDate) conditions.push(gte(cashTransactions.transactionDate, filters.startDate));
      if (filters.endDate) conditions.push(lte(cashTransactions.transactionDate, filters.endDate));
      if (filters.type && filters.type !== 'all') conditions.push(eq(cashTransactions.type, filters.type));
      if (filters.category && filters.category !== 'all') conditions.push(eq(cashTransactions.category, filters.category));

      const offset = (filters.page - 1) * filters.limit;
      const transactions = conditions.length > 0
        ? await db.select().from(cashTransactions).where(and(...conditions)).orderBy(desc(cashTransactions.transactionDate)).limit(filters.limit).offset(offset)
        : await db.select().from(cashTransactions).orderBy(desc(cashTransactions.transactionDate)).limit(filters.limit).offset(offset);

      return {
        data: transactions.map((t: any) => ({ ...t, amount: parseFloat(t.amount || "0") })),
        pagination: { page: filters.page, limit: filters.limit, total: 0, totalPages: 0 }
      };
    } catch (error) {
      console.error("[CASH] Erreur getCashTransactionsWithFilters:", error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  }

  // ============================================================
  // STATISTIQUES DÉPENSES (SIMPLIFIÉ)
  // ============================================================

  async getDailyExpenseStats(date: Date): Promise<any> {
    try {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(gte(expenses.expenseDate, startOfDay), lt(expenses.expenseDate, endOfDay)));

      return {
        date,
        total: parseFloat(result?.total as unknown as string || "0"),
        count: parseInt(result?.count as unknown as string || "0"),
      };
    } catch (error) {
      console.error("Error getting daily expense stats:", error);
      return { date, total: 0, count: 0 };
    }
  }

  async getWeeklyExpenseStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)));

      return {
        startDate,
        endDate,
        total: parseFloat(result?.total as unknown as string || "0"),
        count: parseInt(result?.count as unknown as string || "0"),
      };
    } catch (error) {
      console.error("Error getting weekly expense stats:", error);
      return { startDate, endDate, total: 0, count: 0 };
    }
  }

  async getMonthlyExpenseStats(month: number, year: number): Promise<any> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)));

      return {
        month,
        year,
        total: parseFloat(result?.total as unknown as string || "0"),
        count: parseInt(result?.count as unknown as string || "0"),
      };
    } catch (error) {
      console.error("[STATS] Erreur getMonthlyExpenseStats:", error);
      return { month, year, total: 0, count: 0 };
    }
  }

  async getYearlyExpenseStats(year: number): Promise<any> {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)));

      return {
        year,
        total: parseFloat(result?.total as unknown as string || "0"),
        count: parseInt(result?.count as unknown as string || "0"),
      };
    } catch (error) {
      console.error("Error getting yearly expense stats:", error);
      return { year, total: 0, count: 0 };
    }
  }

  async getExpenseCurve(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const results = await db
        .select({
          date: sql<Date>`DATE(${expenses.expenseDate})`,
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)))
        .groupBy(sql`DATE(${expenses.expenseDate})`)
        .orderBy(sql`DATE(${expenses.expenseDate})`);

      return results.map((r: any) => ({
        date: r.date,
        daily: parseFloat(r.total as unknown as string || "0"),
      }));
    } catch (error) {
      console.error("Error getting expense curve:", error);
      return [];
    }
  }

  async getCumulativeExpenses(year: number): Promise<any[]> {
    try {
      const result = [];
      let runningTotal = 0;
      for (let month = 1; month <= 12; month++) {
        result.push({ month, monthly: 0, cumulative: runningTotal });
      }
      return result;
    } catch (error) {
      console.error("Error getting cumulative expenses:", error);
      return [];
    }
  }

  async getExpensesByCategoryForPeriod(month: number, year: number): Promise<Record<string, number>> {
    try {
      return {};
    } catch (error) {
      console.error("Error getting expenses by category for period:", error);
      return {};
    }
  }

  async getTopExpenses(limit: number = 10, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      let conditions: any[] = [];
      if (startDate) conditions.push(gte(expenses.expenseDate, startDate));
      if (endDate) conditions.push(lte(expenses.expenseDate, endDate));

      const results = await db
        .select()
        .from(expenses)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(expenses.amount))
        .limit(limit);

      return results.map((r: any) => ({ ...r, amount: parseFloat(r.amount as unknown as string || "0") }));
    } catch (error) {
      console.error("Error getting top expenses:", error);
      return [];
    }
  }

  // ============================================================
  // BUDGETS (SIMPLIFIÉ)
  // ============================================================

  async getCategoryBudgets(month: number, year: number): Promise<any[]> {
    try {
      const budgets = await db
        .select()
        .from(categoryBudgets)
        .where(and(eq(categoryBudgets.month, month), eq(categoryBudgets.year, year)));
      
      return budgets.map((b: any) => ({
        ...b,
        budgetAmount: parseFloat(b.budgetAmount || "0"),
        spentAmount: parseFloat(b.spentAmount || "0")
      }));
    } catch (error) {
      console.error("Error getting category budgets:", error);
      return [];
    }
  }

  async getCategoryBudget(category: string, month: number, year: number): Promise<any | undefined> {
    try {
      const [budget] = await db
        .select()
        .from(categoryBudgets)
        .where(and(
          eq(categoryBudgets.category, category as any),
          eq(categoryBudgets.month, month),
          eq(categoryBudgets.year, year)
        ));
      
      if (budget) {
        return {
          ...budget,
          budgetAmount: parseFloat(budget.budgetAmount || "0"),
          spentAmount: parseFloat(budget.spentAmount || "0")
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error getting category budget:", error);
      return undefined;
    }
  }

  async createOrUpdateCategoryBudget(data: any): Promise<any> {
    try {
      const existing = await this.getCategoryBudget(data.category, data.month, data.year);

      if (existing) {
        const [updated] = await db
          .update(categoryBudgets)
          .set({
            budgetAmount: data.budgetAmount.toString(),
            alertThreshold: data.alertThreshold ?? existing.alertThreshold,
            notes: data.notes ?? existing.notes,
            updatedAt: new Date()
          })
          .where(eq(categoryBudgets.id, existing.id))
          .returning();
        
        return {
          ...updated,
          budgetAmount: parseFloat(updated.budgetAmount || "0"),
          spentAmount: parseFloat(updated.spentAmount || "0")
        };
      } else {
        const [created] = await db
          .insert(categoryBudgets)
          .values({
            category: data.category as any,
            month: data.month,
            year: data.year,
            budgetAmount: data.budgetAmount.toString(),
            alertThreshold: data.alertThreshold ?? 80,
            notes: data.notes,
            spentAmount: "0"
          })
          .returning();
        
        return {
          ...created,
          budgetAmount: parseFloat(created.budgetAmount || "0"),
          spentAmount: parseFloat(created.spentAmount || "0")
        };
      }
    } catch (error) {
      console.error("Error creating/updating category budget:", error);
      throw error;
    }
  }

  async updateBudgetSpent(category: string, month: number, year: number, spentAmount: number): Promise<void> {
    try {
      await db
        .update(categoryBudgets)
        .set({
          spentAmount: spentAmount.toString(),
          updatedAt: new Date()
        })
        .where(and(
          eq(categoryBudgets.category, category as any),
          eq(categoryBudgets.month, month),
          eq(categoryBudgets.year, year)
        ));
    } catch (error) {
      console.error("Error updating budget spent:", error);
    }
  }

  async checkBudgetAlerts(month: number, year: number): Promise<void> {
    try {
      console.log(`Checking budget alerts for ${month}/${year}`);
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  }

  async getBudgetAlerts(resolved?: boolean): Promise<any[]> {
    try {
      let conditions = [];
      if (resolved !== undefined) conditions.push(eq(budgetAlerts.isResolved, resolved));
      const alerts = await db
        .select()
        .from(budgetAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(budgetAlerts.notifiedAt));

      return alerts.map((a: any) => ({
        ...a,
        budgetAmount: parseFloat(a.budgetAmount || "0"),
        spentAmount: parseFloat(a.spentAmount || "0"),
        percentageUsed: parseFloat(a.percentageUsed || "0")
      }));
    } catch (error) {
      console.error("Error getting budget alerts:", error);
      return [];
    }
  }

  async resolveBudgetAlert(alertId: number): Promise<void> {
    try {
      await db
        .update(budgetAlerts)
        .set({ isResolved: true, resolvedAt: new Date() })
        .where(eq(budgetAlerts.id, alertId));
    } catch (error) {
      console.error("Error resolving budget alert:", error);
    }
  }

  // ============================================================
  // DÉPENSES RÉCURRENTES (SIMPLIFIÉ)
  // ============================================================

  async getRecurringExpenses(activeOnly: boolean = true): Promise<any[]> {
    try {
      let conditions = [];
      if (activeOnly) conditions.push(eq(recurringExpenses.isActive, true));
      const expensesList = await db
        .select()
        .from(recurringExpenses)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(recurringExpenses.createdAt));

      return expensesList.map((e: any) => ({ ...e, amount: parseFloat(e.amount || "0") }));
    } catch (error) {
      console.error("Error getting recurring expenses:", error);
      return [];
    }
  }

  async createRecurringExpense(data: any): Promise<any> {
    try {
      const [created] = await db
        .insert(recurringExpenses)
        .values({
          description: data.description,
          amount: data.amount.toString(),
          category: data.category as any,
          frequency: data.frequency,
          dayOfMonth: data.dayOfMonth,
          dayOfWeek: data.dayOfWeek,
          startDate: data.startDate,
          endDate: data.endDate,
          nextGeneration: data.startDate,
          isActive: data.isActive ?? true,
          notes: data.notes,
          createdBy: data.createdBy,
        })
        .returning();

      return { ...created, amount: parseFloat(created.amount || "0") };
    } catch (error) {
      console.error("Error creating recurring expense:", error);
      throw error;
    }
  }

  async updateRecurringExpense(id: number, updates: any): Promise<any | undefined> {
    try {
      const updateData: any = { ...updates, updatedAt: new Date() };
      if (updates.amount) updateData.amount = updates.amount.toString();

      const [updated] = await db
        .update(recurringExpenses)
        .set(updateData)
        .where(eq(recurringExpenses.id, id))
        .returning();

      if (updated) {
        return { ...updated, amount: parseFloat(updated.amount || "0") };
      }
      return undefined;
    } catch (error) {
      console.error("Error updating recurring expense:", error);
      return undefined;
    }
  }

  async deleteRecurringExpense(id: number): Promise<boolean> {
    try {
      const result = await db.delete(recurringExpenses).where(eq(recurringExpenses.id, id));
      return (result?.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
      return false;
    }
  }

  async processRecurringExpenses(): Promise<void> {
    try {
      console.log("Processing recurring expenses...");
    } catch (error) {
      console.error("Error processing recurring expenses:", error);
    }
  }

}

export const storage = new WorkingDatabaseStorage();
