// server/routes/index.ts
import { Express } from "express";
import authRoutes from "../auth";
import orderRoutes from "./orders.routes";
import invoiceRoutes from "./invoices.routes";
import userRoutes from "./users.routes";
import subscriptionRoutes from "./subscriptions.routes";
import deliveryRoutes from "./deliveries.routes";
import routesRoutes from "./routes.routes";
import analyticsRoutes from "./analytics.routes";
import expenseRoutes from "./expenses.routes";
import notificationRoutes from "./notifications.routes";
import noteRoutes from "./notes.routes";
import quoteRoutes from "./quotes.routes";
import seoRoutes from "./seo.routes";
import contractRoutes from "./contracts.routes";

export function registerAllRoutes(app: Express) {
  // ✅ 1. Routes d'authentification (login, logout, user) — PRIORITAIRES
  app.use(authRoutes);

  // ✅ 2. Routes API métier
  orderRoutes(app);
  invoiceRoutes(app);
  userRoutes(app);
  subscriptionRoutes(app);
  deliveryRoutes(app);
  routesRoutes(app);
  analyticsRoutes(app);
  expenseRoutes(app);
  notificationRoutes(app);
  noteRoutes(app);
  quoteRoutes(app);
  seoRoutes(app);
  contractRoutes(app); // Routes des contrats
}