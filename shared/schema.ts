// shared/schema.ts - Version complète avec catégories en français
import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum, varchar, date, json, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================================
// ENUMS
// =====================================================

export const userRoleEnum = pgEnum("user_role", ["admin", "supervisor", "agent", "delivery", "client"]);

export const orderStatusEnum = pgEnum("order_status", [
  "to_pickup",
  "to_sort", 
  "to_wash",
  "to_dry",
  "to_iron",
  "ready_to_deliver",
  "to_deliver",
  "delivered"
]);

export const subscriptionTypeEnum = pgEnum("subscription_type", ["essential", "family", "premium", "custom"]);

export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "assigned", "in_progress", "completed", "failed"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "order_status",
  "order_update",
  "pickup_reminder",
  "delivery_reminder",
  "subscription_change",
  "payment_due",
  "new_quote",
  "new_registration",
  "order_late"
]);

export const contractStatusEnum = pgEnum("contract_status", ["active", "expired", "cancelled", "pending", "draft", "pending_signature", "signed", "terminated"]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "paid", "overdue", "cancelled", "partial"]);

export const invoiceStatusZod = z.enum(["pending", "paid", "overdue", "cancelled", "partial"]);

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "mobile_money", "bank_transfer", "credit_card", "cheque"]);

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);

export const deliveryTypeEnum = pgEnum("delivery_type", ["pickup", "delivery"]);

export const userRegistrationStatusEnum = pgEnum("user_registration_status", ["pending", "approved", "refused"]);

export const orderLateTypeEnum = pgEnum("order_late_type", [
  "pickup_late",
  "delivery_late", 
  "status_stuck",
  "resolved"
]);

// =====================================================
// ENUMS POUR TRÉSORERIE ET BUDGETS - VERSION FUSIONNÉE
// =====================================================

export const cashTransactionTypeEnum = pgEnum("cash_transaction_type", ["income", "expense"]);

export const cashCategoryEnum = pgEnum("cash_category", [
  "deposit",
  "withdrawal", 
  "sales",
  "other_income",
  "operational",
  "salary",
  "maintenance",
  "other_expense",
  "client_payment",
  "client_express",
  "client_delivery",
  "client_industrial",
  "cash_drawer",
  "refund",
  "loan",
  "grant",
  "investment",
  "sale_equipment",
]);

// =====================================================
// EXPENSE CATEGORY ENUM - VERSION FRANÇAISE COMPLÈTE
// =====================================================

export const expenseCategoryEnum = pgEnum("expense_category", [
  // ===== NETTOYAGE =====
  "Détergent en poudre",
  "Détergent liquide",
  "Assouplissant",
  "Eau de Javel",
  "Détachant",
  "Dégraissant professionnel",
  "Désinfectant",
  
  // ===== ÉQUIPEMENTS =====
  "Machine à laver",
  "Sèche-linge",
  "Fer à repasser",
  "Table à repasser",
  "Défroisseur vapeur",
  "Chaudière",
  "Extracteur",
  "Plieuse",
  
  // ===== EMBALLAGES =====
  "Sachet plastique",
  "Carton",
  "Cintre",
  "Housse de protection",
  "Étiquette autocollante",
  
  // ===== BUREAU =====
  "Papier ticket",
  "Cartouche encre",
  "Fournitures bureau",
  "Équipement informatique",
  "Logiciel comptable",
  
  // ===== ÉNERGIE =====
  "Carburant groupe électrogène",
  "Carburant véhicule",
  "Électricité JIRAMA",
  "Eau JIRAMA",
  "Internet",
  "Téléphone",
  "Maintenance solaire",
  "Maintenance groupe électrogène",
  
  // ===== LOCAUX =====
  "Loyer local",
  "Taxe foncière",
  "Rénovation",
  "Sécurité",
  "Service de nettoyage",
  
  // ===== PERSONNEL =====
  "Salaire employé",
  "Heures supplémentaires",
  "Prime",
  "Charges sociales",
  "Formation",
  "Assurance santé",
  "Uniforme",
  "Indemnité transport",
  
  // ===== LIVRAISON =====
  "Livraison moto",
  "Livraison voiture",
  "Livreur",
  "Carburant livraison",
  "Entretien véhicule",
  "Assurance véhicule",
  
  // ===== MARKETING =====
  "Flyer publicitaire",
  "Réseaux sociaux",
  "Promotion",
  "Enseigne",
  "Publicité radio/TV",
  "Site web",
  
  // ===== SERVICES =====
  "Honoraire comptable",
  "Frais juridiques",
  "Consulting",
  
  // ===== TAXES =====
  "IRSA",
  "TVA",
  "IB",
  "Taxe municipale",
  "Patente",
  
  // ===== FINANCES =====
  "Frais bancaires",
  "Transfert d'argent",
  "Intérêts emprunt",
  "Prime d'assurance",
  
  // ===== DIVERS =====
  "Repas personnel",
  "Eau en bouteille",
  "Café/Thé",
  "Pharmacie",
  "Événement social",
  "Imprévu",
  "Vol/perte",
  "Autres",
]);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const signatureTypeEnum = pgEnum("signature_type", ["electronic", "handwritten", "uploaded"]);

// =====================================================
// TABLE USER_ACTIONS_HISTORY
// =====================================================

export const userActionsHistory = pgTable("user_actions_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  performedBy: integer("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// TABLE USERS - Version complète avec tous les champs
// =====================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  phone2: text("phone2"),
  address: text("address"),
  neighborhood: text("neighborhood"),
  addressDetails: text("address_details"),
  capacityInItems: integer("capacity_in_items"),
  vehicleType: text("vehicle_type").default("motorcycle"),
  preferredPickupDay: text("preferred_pickup_day"),
  preferredPickupDays: text("preferred_pickup_days").array(),
  preferredTimeWindowStart: text("preferred_time_window_start"),
  preferredTimeWindowEnd: text("preferred_time_window_end"), 
  role: userRoleEnum("role").notNull().default("client"),
  isActive: boolean("is_active").notNull().default(true),
  status: userRegistrationStatusEnum("status").notNull().default("pending"),
  selectedPlanId: integer("selected_plan_id").references(() => subscriptionPlans.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE SUBSCRIPTION_PLANS
// =====================================================

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  pricePerMonth: varchar("price_per_month", { length: 50 }).notNull(),
  itemsIncluded: integer("items_included").notNull().default(0),
  pickupsPerWeek: integer("pickups_per_week").notNull().default(0),
  deliveryTimeHours: integer("delivery_time_hours").notNull().default(48),
  features: text("features"),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE SUBSCRIPTIONS
// =====================================================

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  specialInstructions: text("special_instructions"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE ORDERS
// =====================================================

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  status: orderStatusEnum("status").notNull().default("to_pickup"),
  itemCount: integer("item_count"),
  deliveryTimeWindowStart: text("delivery_time_window_start"),
  deliveryTimeWindowEnd: text("delivery_time_window_end"),
  scheduledPickupDate: timestamp("scheduled_pickup_date"),
  actualPickupDate: timestamp("actual_pickup_date"),
  scheduledDeliveryDate: timestamp("scheduled_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }),
  specialInstructions: text("special_instructions"),
  linensDetails: text("linens_details"),
  overageAmount: decimal("overage_amount", { precision: 10, scale: 2 }),
  statusChangedAt: timestamp("status_changed_at").defaultNow(),
  isLate: boolean("is_late").default(false),
  lateType: orderLateTypeEnum("late_type"),
  lateDetectedAt: timestamp("late_detected_at"),
  lateResolvedAt: timestamp("late_resolved_at"),
  lateHours: integer("late_hours").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE PICKUPS
// =====================================================

export const pickups = pgTable("pickups", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE ORDER_STATUS_HISTORY
// =====================================================

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  status: orderStatusEnum("status").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes"),
  updatedBy: integer("updated_by").references(() => users.id),
});

// =====================================================
// TABLE ORDER_LATE_HISTORY
// =====================================================

export const orderLateHistory = pgTable("order_late_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  lateType: orderLateTypeEnum("late_type").notNull(),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  lateHours: integer("late_hours").notNull().default(0),
  notes: text("notes"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// TABLE DELIVERIES
// =====================================================

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  deliveryPersonId: integer("delivery_person_id").references(() => users.id),
  type: deliveryTypeEnum("type").notNull().default("delivery"),
  status: deliveryStatusEnum("status").notNull().default("pending"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE NOTIFICATIONS
// =====================================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  orderId: integer("order_id").references(() => orders.id),
  quoteId: integer("quote_id").references(() => customQuotes.id),
  clientId: integer("client_id").references(() => users.id),
  lateDetails: jsonb("late_details").default(null),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// TABLE CONTRACTS (VERSION AMÉLIORÉE)
// =====================================================

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  contractNumber: text("contract_number").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: contractStatusEnum("status").notNull().default("draft"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  signedDate: timestamp("signed_date"),
  cancelledDate: timestamp("cancelled_date"),
  isAutoRenew: boolean("is_auto_renew").default(true),
  clientSignature: text("client_signature"),
  companySignature: text("company_signature"),
  signatureType: signatureTypeEnum("signature_type"),
  signatureIp: text("signature_ip"),
  signatureUserAgent: text("signature_user_agent"),
  signedDocumentUrl: text("signed_document_url"),
  originalDocumentUrl: text("original_document_url"),
  notes: text("notes"),
  terms: text("terms"),
  pdfPath: text("pdf_path"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE CONTRACT_TEMPLATES
// =====================================================

export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: subscriptionTypeEnum("type").notNull(),
  description: text("description"),
  templateContent: text("template_content").notNull(),
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE CONTRACT_VERSIONS (HISTORIQUE)
// =====================================================

export const contractVersions = pgTable("contract_versions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changes: text("changes"),
  modifiedBy: integer("modified_by").references(() => users.id),
  modifiedAt: timestamp("modified_at").notNull().defaultNow(),
});

// =====================================================
// TABLE ANALYTICS
// =====================================================

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalOrders: integer("total_orders").notNull().default(0),
  completedOrders: integer("completed_orders").notNull().default(0),
  delayedOrders: integer("delayed_orders").notNull().default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  activeSubscriptions: integer("active_subscriptions").notNull().default(0),
  newClients: integer("new_clients").notNull().default(0),
  latePickups: integer("late_pickups").notNull().default(0),
  lateDeliveries: integer("late_deliveries").notNull().default(0),
  stuckStatuses: integer("stuck_statuses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// TABLE EXPENSES (DÉPENSES) - AVEC CATÉGORIES EN FRANÇAIS
// =====================================================

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MGA"),
  category: text("category").notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  accountingPeriod: text("accounting_period"),
  addedBy: integer("added_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  receiptNumber: text("receipt_number"),
  receiptImageUrl: text("receipt_image_url"),
  status: text("status"),
  notes: text("notes"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// =====================================================
// TABLE CASH_TRANSACTIONS (TRÉSORERIE)
// =====================================================

export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  type: cashTransactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: cashCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  reference: varchar("reference", { length: 100 }),
  addedBy: integer("added_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================================================
// TABLE CASH_BALANCE (SOLDE ACTUEL)
// =====================================================

export const cashBalance = pgTable("cash_balance", {
  id: serial("id").primaryKey(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// =====================================================
// TABLE CASH_BALANCE_HISTORY (HISTORIQUE DES SOLDES)
// =====================================================

export const cashBalanceHistory = pgTable("cash_balance_history", {
  id: serial("id").primaryKey(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  previousBalance: decimal("previous_balance", { precision: 10, scale: 2 }).notNull(),
  changeAmount: decimal("change_amount", { precision: 10, scale: 2 }).notNull(),
  changeType: cashTransactionTypeEnum("change_type").notNull(),
  transactionId: integer("transaction_id").references(() => cashTransactions.id),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE CATEGORY_BUDGETS (BUDGETS PAR CATÉGORIE)
// =====================================================

export const categoryBudgets = pgTable("category_budgets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0"),
  alertThreshold: integer("alert_threshold").default(80),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================================================
// TABLE BUDGET_ALERTS (ALERTES DE BUDGET)
// =====================================================

export const budgetAlerts = pgTable("budget_alerts", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").references(() => categoryBudgets.id),
  category: text("category").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).notNull(),
  percentageUsed: decimal("percentage_used", { precision: 5, scale: 2 }).notNull(),
  alertType: varchar("alert_type", { length: 20 }).notNull(),
  isResolved: boolean("is_resolved").default(false),
  notifiedAt: timestamp("notified_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// =====================================================
// TABLE RECURRING_EXPENSES (DÉPENSES RÉCURRENTES)
// =====================================================

export const recurringExpenses = pgTable("recurring_expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  dayOfMonth: integer("day_of_month"),
  dayOfWeek: integer("day_of_week"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  lastGenerated: timestamp("last_generated"),
  nextGeneration: timestamp("next_generation"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================================================
// TABLE DELIVERY_SCHEDULES
// =====================================================

export const deliverySchedules = pgTable("delivery_schedules", {
  id: serial("id").primaryKey(),
  deliveryPersonId: integer("delivery_person_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  maxDeliveries: integer("max_deliveries").notNull().default(10),
  currentDeliveries: integer("current_deliveries").notNull().default(0),
  zone: text("zone").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE DELIVERY_ROUTES
// =====================================================

export const deliveryRoutes = pgTable("delivery_routes", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => deliverySchedules.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  sequence: integer("sequence").notNull(),
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  status: deliveryStatusEnum("status").notNull().default("pending"),
  distance: decimal("distance", { precision: 8, scale: 2 }),
  duration: integer("duration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// TABLE INVOICES
// =====================================================

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  orderIds: text("order_ids").array(),
  paymentMethod: paymentMethodEnum("payment_method"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MGA"),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  description: text("description"),
  items: text("items").array(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentTerms: text("payment_terms").default("Net 30"),
  notes: text("notes"),
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  billing_period_start: timestamp("billing_period_start"),
  billing_period_end: timestamp("billing_period_end"),
  is_paid: boolean("is_paid"),
});

// =====================================================
// TABLE PAYMENTS
// =====================================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentNumber: text("payment_number").notNull().unique(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MGA"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  transactionId: text("transaction_id"),
  referenceNumber: text("reference_number"),
  phoneNumber: text("phone_number"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  chequeNumber: text("cheque_number"),
  paymentDate: timestamp("payment_date"),
  processedDate: timestamp("processed_date"),
  confirmationCode: text("confirmation_code"),
  notes: text("notes"),
  receiptPath: text("receipt_path"),
  processedBy: integer("processed_by").references(() => users.id),
  verifiedBy: integer("verified_by").references(() => users.id),
  isPartialPayment: boolean("is_partial_payment").notNull().default(false),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE ADS
// =====================================================

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE CUSTOM_QUOTES
// =====================================================

export const customQuotes = pgTable("custom_quotes", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address").notNull(),
  itemsPerWeek: integer("items_per_week").notNull(),
  pickupsPerWeek: integer("pickups_per_week").notNull(),
  specialRequirements: text("special_requirements").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =====================================================
// TABLE PLAN_SELECTIONS
// =====================================================

export const planSelections = pgTable("plan_selections", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  planName: varchar("plan_name", { length: 255 }),
  planType: varchar("plan_type", { length: 50 }),
  planPrice: varchar("plan_price", { length: 50 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  address: text("address").notNull(),
  specialRequirements: text("special_requirements").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

// =====================================================
// TABLE ORDER_NOTES
// =====================================================

export const orderNotes = pgTable("order_notes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isRead: boolean("is_read").notNull().default(false),
  noteType: text("note_type").default("general"),
  mentions: integer("mentions").array(),
  clientId: integer("client_id").references(() => users.id),
  orderStatus: text("order_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// TABLE USER_SESSIONS
// =====================================================

export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull(),
});

// =====================================================
// TABLE CLIENT_NOTES_HISTORY
// =====================================================

export const clientNotesHistory = pgTable("client_notes_history", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  noteId: integer("note_id").references(() => orderNotes.id),
  content: text("content").notNull(),
  noteType: text("note_type").default("general"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  orderStatus: text("order_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// RELATIONS
// =====================================================

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  orders: many(orders),
  deliveries: many(deliveries),
  invoices: many(invoices),
  statusUpdates: many(orderStatusHistory),
  clientNotes: many(clientNotesHistory),
  cashTransactions: many(cashTransactions),
  recurringExpenses: many(recurringExpenses),
  contracts: many(contracts),
  contractTemplates: many(contractTemplates),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  client: one(users, {
    fields: [subscriptions.clientId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  orders: many(orders),
  invoices: many(invoices),
  contracts: many(contracts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(users, {
    fields: [orders.clientId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [orders.subscriptionId],
    references: [subscriptions.id],
  }),
  statusHistory: many(orderStatusHistory),
  deliveries: many(deliveries),
  invoices: many(invoices),
  orderNotes: many(orderNotes),
  lateHistory: many(orderLateHistory),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  updatedBy: one(users, {
    fields: [orderStatusHistory.updatedBy],
    references: [users.id],
  }),
}));

export const orderLateHistoryRelations = relations(orderLateHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderLateHistory.orderId],
    references: [orders.id],
  }),
  resolvedBy: one(users, {
    fields: [orderLateHistory.resolvedBy],
    references: [users.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  deliveryPerson: one(users, {
    fields: [deliveries.deliveryPersonId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(users, {
    fields: [invoices.clientId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  payments: many(payments),
  generatedBy: one(users, {
    fields: [invoices.generatedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  client: one(users, {
    fields: [contracts.clientId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [contracts.subscriptionId],
    references: [subscriptions.id],
  }),
  createdByUser: one(users, {
    fields: [contracts.createdBy],
    references: [users.id],
  }),
  versions: many(contractVersions),
}));

export const contractTemplatesRelations = relations(contractTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [contractTemplates.createdBy],
    references: [users.id],
  }),
}));

export const contractVersionsRelations = relations(contractVersions, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractVersions.contractId],
    references: [contracts.id],
  }),
  modifiedByUser: one(users, {
    fields: [contractVersions.modifiedBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  addedBy: one(users, {
    fields: [expenses.addedBy],
    references: [users.id],
  }),
}));

export const cashTransactionsRelations = relations(cashTransactions, ({ one, many }) => ({
  addedByUser: one(users, {
    fields: [cashTransactions.addedBy],
    references: [users.id],
  }),
  balanceHistory: many(cashBalanceHistory),
}));

export const categoryBudgetsRelations = relations(categoryBudgets, ({ many }) => ({
  alerts: many(budgetAlerts),
}));

export const recurringExpensesRelations = relations(recurringExpenses, ({ one }) => ({
  createdByUser: one(users, {
    fields: [recurringExpenses.createdBy],
    references: [users.id],
  }),
}));

export const deliverySchedulesRelations = relations(deliverySchedules, ({ one, many }) => ({
  deliveryPerson: one(users, {
    fields: [deliverySchedules.deliveryPersonId],
    references: [users.id],
  }),
  routes: many(deliveryRoutes),
}));

export const deliveryRoutesRelations = relations(deliveryRoutes, ({ one }) => ({
  schedule: one(deliverySchedules, {
    fields: [deliveryRoutes.scheduleId],
    references: [deliverySchedules.id],
  }),
  order: one(orders, {
    fields: [deliveryRoutes.orderId],
    references: [orders.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  processedBy: one(users, {
    fields: [payments.processedBy],
    references: [users.id],
  }),
}));

export const customQuotesRelations = relations(customQuotes, ({ one }) => ({}));

export const planSelectionsRelations = relations(planSelections, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [planSelections.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, {
    fields: [orderNotes.orderId],
    references: [orders.id],
  }),
  author: one(users, {
    fields: [orderNotes.createdBy],
    references: [users.id],
  }),
  client: one(users, {
    fields: [orderNotes.clientId],
    references: [users.id],
  }),
}));

export const clientNotesHistoryRelations = relations(clientNotesHistory, ({ one }) => ({
  client: one(users, {
    fields: [clientNotesHistory.clientId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [clientNotesHistory.orderId],
    references: [orders.id],
  }),
  note: one(orderNotes, {
    fields: [clientNotesHistory.noteId],
    references: [orderNotes.id],
  }),
  createdByUser: one(users, {
    fields: [clientNotesHistory.createdBy],
    references: [users.id],
  }),
}));

// =====================================================
// SCHÉMAS DE VALIDATION ZOD
// =====================================================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  vehicleType: z.string().optional().default("motorcycle"),
  selectedPlanId: z.number().optional().nullable(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const insertOrderSchema = z.object({
  clientId: z.number().optional(),
  subscriptionId: z.number().optional(),
  status: z.string().default("to_pickup"),
  itemCount: z.number().min(1),
  scheduledPickupDate: z.union([z.string().datetime(), z.date()]).transform(val => new Date(val)),
  scheduledDeliveryDate: z.union([z.string().datetime(), z.date()]).transform(val => new Date(val)),
  totalAmount: z.string().regex(/^\d+$/),
  specialInstructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  linensDetails: z.string().optional().nullable(),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  issueDate: z.union([z.string().datetime(), z.date()]).transform(val => new Date(val)),
  dueDate: z.union([z.string().datetime(), z.date()]).transform(val => new Date(val)),
  paidDate: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  subscriptionId: z.number().optional(),
  orderId: z.number().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export const insertCustomQuoteSchema = createInsertSchema(customQuotes).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPlanSelectionSchema = createInsertSchema(planSelections).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  userId: z.number().optional().nullable(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// =====================================================
// SCHÉMAS POUR CONTRATS
// =====================================================

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  contractNumber: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  signedDate: z.coerce.date().optional().nullable(),
  cancelledDate: z.coerce.date().optional().nullable(),
});

export const updateContractSchema = insertContractSchema.partial();

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractVersionSchema = createInsertSchema(contractVersions).omit({
  id: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

// =====================================================
// SCHÉMAS POUR EXPENSES AVEC CATÉGORIES EN FRANÇAIS
// =====================================================

export const insertExpenseSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  amount: z.union([z.string(), z.number()]).transform(val => Number(val)),
  currency: z.string().default("MGA"),
  category: z.string().min(1, "La catégorie est requise"),
  expense_date: z.coerce.date(),
  accountingPeriod: z.string().optional(),
  addedBy: z.number(),
  approvedBy: z.number().optional(),
  receiptNumber: z.string().optional(),
  receiptImageUrl: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().array().optional(),
});

export const updateExpenseSchema = insertExpenseSchema.partial();

export const insertCashTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().min(1, "La description est requise"),
  transactionDate: z.date().optional(),
  reference: z.string().optional(),
  addedBy: z.number(),
  notes: z.string().optional(),
});

export const insertCategoryBudgetSchema = z.object({
  category: z.string().min(1, "La catégorie est requise"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  budgetAmount: z.number().min(0, "Le montant doit être positif"),
  alertThreshold: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const insertRecurringExpenseSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  category: z.string().min(1, "La catégorie est requise"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  dayOfMonth: z.number().min(1).max(31).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
  createdBy: z.number(),
});

export const insertDeliveryScheduleSchema = createInsertSchema(deliverySchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentDeliveries: true,
});

export const insertDeliveryRouteSchema = createInsertSchema(deliveryRoutes).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdSchema = createInsertSchema(ads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderNoteSchema = createInsertSchema(orderNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRead: true,
  clientId: true,
  orderStatus: true,
}).extend({
  clientId: z.number().optional(),
  orderStatus: z.string().optional(),
});

export const insertClientNoteHistorySchema = createInsertSchema(clientNotesHistory).omit({
  id: true,
  createdAt: true,
});

export const insertOrderLateHistorySchema = createInsertSchema(orderLateHistory).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  resolvedBy: true,
});

// =====================================================
// TYPES (EXPORT)
// =====================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type OrderLateHistory = typeof orderLateHistory.$inferSelect;
export type InsertOrderLateHistory = z.infer<typeof insertOrderLateHistorySchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertInvoiceType = z.infer<typeof insertInvoiceSchema>;

export type CustomQuote = typeof customQuotes.$inferSelect;
export type InsertCustomQuote = z.infer<typeof insertCustomQuoteSchema>;

export type PlanSelection = typeof planSelections.$inferSelect;
export type InsertPlanSelection = z.infer<typeof insertPlanSelectionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;

export type ContractVersion = typeof contractVersions.$inferSelect;
export type InsertContractVersion = z.infer<typeof insertContractVersionSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type CashTransaction = typeof cashTransactions.$inferSelect;
export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;

export type CashBalance = typeof cashBalance.$inferSelect;
export type InsertCashBalance = typeof cashBalance.$inferInsert;

export type CashBalanceHistory = typeof cashBalanceHistory.$inferSelect;
export type InsertCashBalanceHistory = typeof cashBalanceHistory.$inferInsert;

export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type InsertCategoryBudget = z.infer<typeof insertCategoryBudgetSchema>;

export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type InsertBudgetAlert = typeof budgetAlerts.$inferInsert;

export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type InsertRecurringExpense = z.infer<typeof insertRecurringExpenseSchema>;

export type DeliverySchedule = typeof deliverySchedules.$inferSelect;
export type InsertDeliverySchedule = z.infer<typeof insertDeliveryScheduleSchema>;

export type DeliveryRoute = typeof deliveryRoutes.$inferSelect;
export type InsertDeliveryRoute = z.infer<typeof insertDeliveryRouteSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type Ad = typeof ads.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;

export type OrderNote = typeof orderNotes.$inferSelect;
export type InsertOrderNote = z.infer<typeof insertOrderNoteSchema>;

export type ClientNotesHistory = typeof clientNotesHistory.$inferSelect;
export type InsertClientNotesHistory = z.infer<typeof insertClientNoteHistorySchema>;

export type UserActionHistory = typeof userActionsHistory.$inferSelect;
export type InsertUserActionHistory = typeof userActionsHistory.$inferInsert;
