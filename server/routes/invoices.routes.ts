// server/routes/invoices.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { invoices, users, subscriptions, subscriptionPlans, cashTransactions, cashBalance } from "../../shared/schema";
import { eq, and, desc, gte, lte, not, sql } from "drizzle-orm";
import { insertInvoiceSchema } from "../../shared/schema";
import PDFDocument from 'pdfkit';
import { generateContractPdf } from "../pdf-contract";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { sendPushToUser } from "../fcm";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";

// Type pour l'utilisateur authentifié
type AuthUser = {
  id: number;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: Date;
};

// Fonction helper pour typer req.user
function getUser(req: Request): AuthUser {
  return req.user as AuthUser;
}

export default function invoiceRoutes(app: Express) {
  
  // ==================== ROUTES FACTURES ====================
  
  // ✅ GET /api/invoices - Liste des factures AVEC FILTRAGE PAR MOIS
  app.get("/api/invoices", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      
      // 📌 Récupération des paramètres de filtrage
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      const status = req.query.status as string || null;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : null;
      const search = req.query.search as string || null;
      
      let result;
      
      if (user.role === "client") {
        // 🔹 Pour les clients : toujours filtrer par leur ID
        let conditions: any[] = [eq(invoices.clientId, user.id)];
        
        // Ajouter le filtre de mois si fourni
        if (month && year) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59);
          conditions.push(gte(invoices.issueDate, startDate));
          conditions.push(lte(invoices.issueDate, endDate));
        } else if (year && !month) {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59);
          conditions.push(gte(invoices.issueDate, startDate));
          conditions.push(lte(invoices.issueDate, endDate));
        }
        
        // Ajouter le filtre de statut
        if (status) {
          conditions.push(eq(invoices.status, status as any));
        }
        
        const invoicesList = await db
          .select()
          .from(invoices)
          .where(and(...conditions))
          .orderBy(desc(invoices.createdAt));
        
        result = invoicesList;
      } else {
        // 🔹 Pour les admins/supervisors
        let conditions: any[] = [];
        
        // Filtre par mois
        if (month && year) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59);
          conditions.push(gte(invoices.issueDate, startDate));
          conditions.push(lte(invoices.issueDate, endDate));
        } else if (year && !month) {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59);
          conditions.push(gte(invoices.issueDate, startDate));
          conditions.push(lte(invoices.issueDate, endDate));
        }
        
        // Filtre par client
        if (clientId) {
          conditions.push(eq(invoices.clientId, clientId));
        }
        
        // Filtre par statut
        if (status) {
          conditions.push(eq(invoices.status, status as any));
        }
        
        let whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const invoicesList = await db
          .select()
          .from(invoices)
          .where(whereClause)
          .orderBy(desc(invoices.createdAt));
        
        // Récupérer les informations des clients
        const clients = await db.select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          isActive: users.isActive
        }).from(users).where(eq(users.role, 'client'));
        
        const clientsMap = new Map(clients.map(c => [c.id, c]));
        
        result = invoicesList.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientId: inv.clientId,
          subscriptionId: inv.subscriptionId,
          amount: inv.amount,
          totalAmount: inv.totalAmount,
          currency: inv.currency,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          status: inv.status,
          paymentMethod: inv.paymentMethod,
          description: inv.description,
          createdAt: inv.createdAt,
          paidDate: inv.paidDate,
          billingPeriodStart: inv.billing_period_start,
          billingPeriodEnd: inv.billing_period_end,
          clientName: clientsMap.get(inv.clientId)?.fullName || 'Client inconnu',
          clientEmail: clientsMap.get(inv.clientId)?.email || 'N/A',
          clientPhone: clientsMap.get(inv.clientId)?.phone || 'N/A',
          clientIsActive: clientsMap.get(inv.clientId)?.isActive || false
        }));
        
        // Filtre par recherche (nom du client ou numéro de facture)
        if (search) {
          const searchLower = search.toLowerCase();
          result = result.filter(inv => 
            inv.clientName.toLowerCase().includes(searchLower) ||
            inv.invoiceNumber.toLowerCase().includes(searchLower) ||
            inv.clientEmail.toLowerCase().includes(searchLower)
          );
        }
      }
      
      res.json(result);
      
    } catch (error) {
      console.error("Erreur récupération factures:", error);
      res.status(500).json({ message: "Échec de la récupération des factures" });
    }
  });

  // ✅ GET /api/invoices/by-month/:year/:month - Récupérer les factures d'un mois spécifique avec statistiques
  app.get("/api/invoices/by-month/:year/:month", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      // Vérification des paramètres
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ 
          success: false, 
          message: "Paramètres invalides. Veuillez fournir une année et un mois valides (1-12)." 
        });
      }
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      // Construction de la clause WHERE
      let conditions: any[] = [
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate)
      ];
      
      if (user.role === "client") {
        conditions.push(eq(invoices.clientId, user.id));
      }
      
      const whereClause = and(...conditions);
      
      // Récupérer les factures
      const invoicesList = await db
        .select()
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.createdAt));
      
      let result;
      let stats = {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        cancelledCount: 0,
        paymentRate: 0
      };
      
      if (user.role === "client") {
        result = invoicesList;
        
        // Calcul des statistiques pour le client
        stats.totalInvoices = invoicesList.length;
        invoicesList.forEach(inv => {
          const amount = parseFloat(inv.totalAmount || inv.amount || '0');
          stats.totalAmount += amount;
          
          if (inv.status === 'paid') {
            stats.paidCount++;
            stats.paidAmount += amount;
          } else if (inv.status === 'pending') {
            stats.pendingCount++;
            stats.pendingAmount += amount;
          } else if (inv.status === 'overdue') {
            stats.overdueCount++;
            stats.overdueAmount += amount;
          } else if (inv.status === 'cancelled') {
            stats.cancelledCount++;
          }
        });
        stats.paymentRate = stats.totalInvoices > 0 ? Math.round((stats.paidCount / stats.totalInvoices) * 100) : 0;
        
        return res.json({
          success: true,
          month,
          year,
          monthName: format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: fr }),
          stats,
          invoices: result
        });
      }
      
      // Pour les admins/supervisors
      // Récupérer les informations des clients
      const clients = await db.select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
        status: users.status
      }).from(users).where(eq(users.role, 'client'));
      
      const clientsMap = new Map(clients.map(c => [c.id, c]));
      
      result = invoicesList.map(inv => ({
        ...inv,
        clientName: clientsMap.get(inv.clientId)?.fullName || 'Client inconnu',
        clientEmail: clientsMap.get(inv.clientId)?.email || 'N/A',
        clientPhone: clientsMap.get(inv.clientId)?.phone || 'N/A',
        clientIsActive: clientsMap.get(inv.clientId)?.isActive || false
      }));
      
      // Calcul des statistiques globales
      stats.totalInvoices = result.length;
      result.forEach(inv => {
        const amount = parseFloat(inv.totalAmount || inv.amount || '0');
        stats.totalAmount += amount;
        
        if (inv.status === 'paid') {
          stats.paidCount++;
          stats.paidAmount += amount;
        } else if (inv.status === 'pending') {
          stats.pendingCount++;
          stats.pendingAmount += amount;
        } else if (inv.status === 'overdue') {
          stats.overdueCount++;
          stats.overdueAmount += amount;
        } else if (inv.status === 'cancelled') {
          stats.cancelledCount++;
        }
      });
      stats.paymentRate = stats.totalInvoices > 0 ? Math.round((stats.paidCount / stats.totalInvoices) * 100) : 0;
      
      // Statistiques par client pour ce mois
      const clientStats = new Map();
      result.forEach(inv => {
        const clientId = inv.clientId;
        if (!clientStats.has(clientId)) {
          clientStats.set(clientId, {
            clientId,
            clientName: inv.clientName,
            totalInvoices: 0,
            totalAmount: 0,
            paidCount: 0,
            paidAmount: 0,
            pendingCount: 0,
            overdueCount: 0
          });
        }
        const stats = clientStats.get(clientId);
        stats.totalInvoices++;
        const amount = parseFloat(inv.totalAmount || inv.amount || '0');
        stats.totalAmount += amount;
        if (inv.status === 'paid') {
          stats.paidCount++;
          stats.paidAmount += amount;
        } else if (inv.status === 'pending') {
          stats.pendingCount++;
        } else if (inv.status === 'overdue') {
          stats.overdueCount++;
        }
      });
      
      res.json({
        success: true,
        month,
        year,
        monthName: format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: fr }),
        stats,
        clientStats: Array.from(clientStats.values()),
        invoices: result
      });
      
    } catch (error) {
      console.error("Erreur récupération factures du mois:", error);
      res.status(500).json({ 
        success: false, 
        message: "Échec de la récupération des factures" 
      });
    }
  });

  // ✅ GET /api/invoices/months - Récupérer tous les mois avec factures
  app.get("/api/invoices/months", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      
      let conditions: any[] = [];
      if (user.role === "client") {
        conditions.push(eq(invoices.clientId, user.id));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Récupérer toutes les factures pour extraire les mois
      const invoicesList = await db
        .select({
          issueDate: invoices.issueDate
        })
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.issueDate));
      
      // Extraire les mois uniques
      const months = new Set<string>();
      const monthsArray: { year: number; month: number; monthName: string; key: string }[] = [];
      
      invoicesList.forEach(inv => {
        if (inv.issueDate) {
          const date = new Date(inv.issueDate);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!months.has(key)) {
            months.add(key);
            monthsArray.push({
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              monthName: format(date, 'MMMM yyyy', { locale: fr }),
              key: key
            });
          }
        }
      });
      
      res.json({
        success: true,
        months: monthsArray
      });
      
    } catch (error) {
      console.error("Erreur récupération mois:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erreur lors de la récupération des mois" 
      });
    }
  });

  // GET /api/invoices/matrix/:year - Vue matricielle
  app.get("/api/invoices/matrix/:year", requireAuth, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      
      console.log(`[MATRIX] Récupération de la matrice pour l'année ${year}`);
      
      const clientsResult = await db.execute(sql`
        SELECT DISTINCT u.id, u.full_name, u.email, u.phone, u.is_active, u.role, u.username, u.created_at, u.updated_at, u.status, u.vehicle_type, u.preferred_pickup_days
        FROM users u
        INNER JOIN invoices i ON i.client_id = u.id
        WHERE u.role = 'client'
          AND i.issue_date >= ${startDate}
          AND i.issue_date <= ${endDate}
        ORDER BY u.is_active DESC, u.full_name
      `);
      
      const clientsWithInvoices = clientsResult.rows;
      console.log(`[MATRIX] ${clientsWithInvoices.length} clients avec factures trouvés pour ${year}`);
      
      const matrix = await Promise.all(clientsWithInvoices.map(async (client: any) => {
        const subResult = await db.execute(sql`
          SELECT s.*, 
                 sp.id as plan_id, 
                 sp.name as plan_name, 
                 sp.price_per_month as plan_price, 
                 sp.description as plan_description,
                 sp.is_active as plan_is_active,
                 sp.features as plan_features,
                 sp.delivery_time_hours as plan_delivery_time_hours
          FROM subscriptions s
          LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
          WHERE s.client_id = ${client.id}
          ORDER BY s.start_date DESC
          LIMIT 1
        `);
        
        let planName: string = 'Sans abonnement';
        let planPrice: number = 0;
        
        if (subResult.rows.length > 0) {
          const row = subResult.rows[0] as any;
          planName = row.plan_name || 'Sans abonnement';
          const priceStr = row.plan_price || '0';
          planPrice = parseFloat(String(priceStr).replace(/[^\d.-]/g, ''));
        }
        
        const monthlyStatus = await Promise.all(
          Array.from({ length: 12 }, async (_, i) => {
            const month = i + 1;
            const startOfMonthDate = new Date(year, i, 1);
            const endOfMonthDate = new Date(year, i + 1, 0);
            
            const invoiceResult = await db.execute(sql`
              SELECT * FROM invoices
              WHERE client_id = ${client.id}
                AND issue_date >= ${startOfMonthDate}
                AND issue_date <= ${endOfMonthDate}
              LIMIT 1
            `);
            
            const invoice = invoiceResult.rows[0] as any;
            
            if (!invoice) {
              return { month, status: 'no_invoice', hasInvoice: false };
            }
            
            const now = new Date();
            const dueDate = invoice.due_date ? new Date(String(invoice.due_date)) : new Date();
            const isOverdue = invoice.status !== 'paid' && 
                            invoice.status !== 'cancelled' &&
                            dueDate < now;
            
            return {
              month,
              status: isOverdue ? 'overdue' : invoice.status,
              hasInvoice: true,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              amount: parseFloat(String(invoice.total_amount || invoice.amount)),
              dueDate: invoice.due_date,
              paidDate: invoice.paid_date,
              paymentMethod: invoice.payment_method,
              billingPeriodStart: invoice.billing_period_start,
              billingPeriodEnd: invoice.billing_period_end,
              isOverdue
            };
          })
        );
        
        const totalPaid = monthlyStatus.filter(m => m.status === 'paid').length;
        const totalOverdue = monthlyStatus.filter(m => m.status === 'overdue').length;
        const totalPending = monthlyStatus.filter(m => m.status === 'pending').length;
        const totalAmount = monthlyStatus.reduce((sum, m) => sum + (m.amount || 0), 0);
        const paidAmount = monthlyStatus.filter(m => m.status === 'paid').reduce((sum, m) => sum + (m.amount || 0), 0);
        const totalInvoices = monthlyStatus.filter(m => m.hasInvoice).length;
        const paymentRate = totalInvoices > 0 ? Math.round((totalPaid / totalInvoices) * 100) : 0;
        
        return {
          clientId: client.id,
          clientName: client.full_name,
          email: client.email,
          phone: client.phone,
          isActive: client.is_active,
          planName: planName,
          planPrice: planPrice,
          subscriptionStartDate: null,
          months: monthlyStatus,
          stats: { 
            totalPaid, 
            totalOverdue, 
            totalPending, 
            totalAmount, 
            paidAmount,
            paymentRate
          }
        };
      }));
      
      const globalStats = {
        totalClients: matrix.length,
        totalInvoices: matrix.reduce((sum, c) => sum + c.months.filter(m => m.hasInvoice).length, 0),
        totalPaid: matrix.reduce((sum, c) => sum + c.stats.totalPaid, 0),
        totalOverdue: matrix.reduce((sum, c) => sum + c.stats.totalOverdue, 0),
        totalPending: matrix.reduce((sum, c) => sum + c.stats.totalPending, 0),
        totalRevenue: matrix.reduce((sum, c) => sum + c.stats.totalAmount, 0),
        collectedRevenue: matrix.reduce((sum, c) => sum + c.stats.paidAmount, 0),
        year
      };
      
      console.log(`[MATRIX] Statistiques globales: ${globalStats.totalClients} clients, ${globalStats.totalInvoices} factures`);
      
      res.json({ year, clients: matrix, globalStats });
    } catch (error) {
      console.error("Erreur matrice factures:", error);
      res.status(500).json({ message: "Erreur lors de la génération de la matrice" });
    }
  });

  // POST /api/invoices - AVEC VÉRIFICATION CLIENT ACTIF
  app.post("/api/invoices", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const invoiceData = {
        ...req.body,
        invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`,
        currency: req.body.currency || "MGA",
        status: req.body.status || "pending",
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 15 * 86400000),
        subtotal: req.body.subtotal || req.body.amount || "0",
        taxAmount: req.body.taxAmount || "0",
        totalAmount: req.body.totalAmount || req.body.amount || "0",
        paymentTerms: req.body.paymentTerms || "Net 15",
        generatedBy: user.id
      };

      const client = await storage.getUser(invoiceData.clientId);
      if (!client) {
        return res.status(404).json({ 
          success: false, 
          message: "Client non trouvé." 
        });
      }
      if (!client.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: "Impossible de créer une facture pour un client désactivé." 
        });
      }

      if (invoiceData.status === "paid") {
        invoiceData.paidDate = invoiceData.paidDate || new Date();
        invoiceData.paymentMethod = invoiceData.paymentMethod || "cash";
      }

      const validatedData = insertInvoiceSchema.parse(invoiceData);
      const invoice = await storage.createInvoice(validatedData);

      if (invoice.status === "paid") {
        const amount = parseFloat(String(invoice.totalAmount || invoice.amount));
        await storage.createCashTransaction({
          type: 'income', 
          amount, 
          category: 'sales',
          description: `Paiement facture ${invoice.invoiceNumber}`,
          reference: `INV-${invoice.id}`, 
          addedBy: user.id, 
          transactionDate: new Date()
        });
      }

      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      console.error("Erreur création facture:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Échec de la création de la facture" });
    }
  });

  // PATCH /api/invoices/:id
  app.patch("/api/invoices/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) return res.status(400).json({ message: "ID invalide" });

      const oldInvoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!oldInvoice) return res.status(404).json({ message: "Facture non trouvée" });

      const oldStatus = oldInvoice.status;
      const newStatus = req.body.status;

      const updates: any = {
        ...req.body,
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : 
                  (req.body.status === "paid" && oldInvoice.status !== "paid" ? new Date() : undefined),
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        billing_period_start: req.body.billingPeriodStart ? new Date(req.body.billingPeriodStart) : undefined,
        billing_period_end: req.body.billingPeriodEnd ? new Date(req.body.billingPeriodEnd) : undefined,
      };

      const amount = parseFloat(String(oldInvoice.totalAmount || oldInvoice.amount));

      if (newStatus === "paid" && oldStatus !== "paid") {
        await storage.createCashTransaction({
          type: 'income', 
          amount, 
          category: 'sales',
          description: `Paiement facture ${oldInvoice.invoiceNumber}`,
          reference: `INV-${invoiceId}`, 
          addedBy: user.id, 
          transactionDate: new Date()
        });
        console.log(`[INVOICE] Paiement facture ${oldInvoice.invoiceNumber}: +${amount} Ar`);
      } 
      else if (newStatus !== "paid" && oldStatus === "paid") {
        await storage.createCashTransaction({
          type: 'expense', 
          amount, 
          category: 'other_expense',
          description: `Annulation paiement facture ${oldInvoice.invoiceNumber}`,
          reference: `INV-${invoiceId}`, 
          addedBy: user.id, 
          transactionDate: new Date()
        });
        console.log(`[INVOICE] Annulation paiement facture ${oldInvoice.invoiceNumber}: -${amount} Ar`);
      }

      const updated = await storage.updateInvoice(invoiceId, updates);
      if (!updated) return res.status(404).json({ message: "Facture non trouvée" });

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Erreur mise à jour facture:", error);
      res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
    }
  });

  // DELETE /api/invoices/:id
  app.delete("/api/invoices/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const invoiceId = parseInt(req.params.id);
      const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!invoice) return res.status(404).json({ message: "Facture non trouvée" });
      
      if (invoice.status === "paid") {
        const amount = parseFloat(String(invoice.totalAmount || invoice.amount));
        await storage.createCashTransaction({
          type: 'expense',
          amount,
          category: 'other_expense',
          description: `Suppression facture payée ${invoice.invoiceNumber}`,
          reference: `INV-${invoiceId}`,
          addedBy: user.id,
          transactionDate: new Date()
        });
        console.log(`[INVOICE] Suppression facture payée ${invoice.invoiceNumber}: -${amount} Ar`);
      }
      
      const deleted = await storage.deleteInvoice(invoiceId);
      if (!deleted) return res.status(500).json({ message: "Échec de la suppression" });
      
      res.json({ success: true, message: "Facture supprimée avec succès" });
    } catch (error) {
      console.error("Erreur suppression facture:", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // GET /api/invoices/:id/download-pdf
  app.get("/api/invoices/:id/download-pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const invoiceId = Number(req.params.id);
      const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!invoice) return res.status(404).json({ message: "Facture non trouvée." });
      
      if (user.role !== "admin" && invoice.clientId !== user.id) {
        return res.status(403).json({ message: "Accès refusé." });
      }

      const client = await storage.getUser(invoice.clientId);
      const subscription = invoice.subscriptionId ? await storage.getSubscription(invoice.subscriptionId) : undefined;
      const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : undefined;

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: any[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="facture_${invoice.invoiceNumber || invoiceId}.pdf"`);
        res.setHeader("Content-Length", pdfData.length.toString());
        res.send(pdfData);
      });

      doc.fontSize(24)
         .fillColor('#0B676E')
         .text('FACTURE', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12)
         .fillColor('#333333');
      
      doc.text(`N° Facture: ${invoice.invoiceNumber}`);
      doc.text(`Date d'émission: ${new Date(invoice.issueDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`);
      
      const statusLabels: Record<string, string> = {
        'paid': 'Payé',
        'pending': 'En attente',
        'overdue': 'En retard',
        'cancelled': 'Annulé'
      };
      doc.text(`Statut: ${statusLabels[invoice.status] || invoice.status}`);
      doc.moveDown();
      
      doc.fontSize(14)
         .fillColor('#0B676E')
         .text('INFORMATIONS CLIENT');
      doc.fontSize(12)
         .fillColor('#333333');
      doc.text(`Nom: ${client?.fullName || 'Client inconnu'}`);
      doc.text(`Email: ${client?.email || 'N/A'}`);
      doc.text(`Téléphone: ${client?.phone || 'N/A'}`);
      doc.moveDown();
      
      if (plan) {
        doc.fontSize(14)
           .fillColor('#0B676E')
           .text('ABONNEMENT');
        doc.fontSize(12)
           .fillColor('#333333');
        doc.text(`Plan: ${plan.name}`);
        doc.text(`Prix: ${plan.pricePerMonth} Ar/mois`);
        if (plan.description) {
          doc.text(`Description: ${plan.description}`);
        }
        doc.moveDown();
      }
      
      doc.fontSize(14)
         .fillColor('#0B676E')
         .text('DÉTAILS');
      doc.fontSize(12)
         .fillColor('#333333');
      
      if (invoice.billing_period_start && invoice.billing_period_end) {
        doc.text(`Période: ${new Date(invoice.billing_period_start).toLocaleDateString('fr-FR')} - ${new Date(invoice.billing_period_end).toLocaleDateString('fr-FR')}`);
      }
      
      doc.moveDown();
      
      const tableTop = doc.y;
      doc.fontSize(10);
      
      doc.fillColor('#0B676E');
      doc.text('Description', 50, tableTop, { width: 300 });
      doc.text('Montant', 350, tableTop, { width: 100, align: 'right' });
      
      doc.moveDown();
      doc.fillColor('#333333');
      
      doc.strokeColor('#CCCCCC')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();
      
      const description = invoice.description || `Abonnement ${plan?.name || 'mensuel'}`;
      doc.text(description, 50, doc.y, { width: 300 });
      doc.text(`${parseFloat(invoice.amount).toLocaleString('fr-FR')} Ar`, 350, doc.y, { width: 100, align: 'right' });
      
      doc.moveDown(2);
      
      doc.strokeColor('#CCCCCC')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();
      
      doc.fontSize(14)
         .fillColor('#0B676E')
         .text('TOTAL', 350, doc.y, { width: 100, align: 'right' });
      doc.fontSize(16)
         .fillColor('#000000')
         .text(`${parseFloat(invoice.totalAmount || invoice.amount).toLocaleString('fr-FR')} Ar`, 350, doc.y, { width: 100, align: 'right' });
      
      doc.moveDown(3);
      
      if (invoice.paymentMethod) {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Mode de paiement: ${invoice.paymentMethod === 'cash' ? 'Espèces' : 'Mobile Money'}`);
      }
      
      doc.fontSize(10)
         .fillColor('#999999')
         .text('Merci pour votre confiance', { align: 'center' });
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });
      
      doc.end();
      
    } catch (e: any) {
      console.error("Erreur génération PDF:", e);
      res.status(500).json({ message: e?.message || "Erreur lors de la génération du PDF" });
    }
  });

  // GET /api/invoices/:id/preview
  app.get("/api/invoices/:id/preview", requireAuth, async (req: Request, res: Response) => {
    try {
      const invoiceId = Number(req.params.id);
      const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!invoice) return res.status(404).json({ message: "Facture non trouvée." });

      const client = await storage.getUser(invoice.clientId);
      const subscription = invoice.subscriptionId ? await storage.getSubscription(invoice.subscriptionId) : undefined;
      const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : undefined;

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: any[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader("Content-Type", "application/pdf");
        res.send(pdfData);
      });

      doc.fontSize(24)
         .fillColor('#0B676E')
         .text('FACTURE', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12)
         .fillColor('#333333');
      doc.text(`N° Facture: ${invoice.invoiceNumber}`);
      doc.text(`Date d'émission: ${new Date(invoice.issueDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`);
      
      const statusLabels: Record<string, string> = {
        'paid': 'Payé',
        'pending': 'En attente',
        'overdue': 'En retard',
        'cancelled': 'Annulé'
      };
      doc.text(`Statut: ${statusLabels[invoice.status] || invoice.status}`);
      doc.moveDown();
      
      doc.fontSize(14)
         .fillColor('#0B676E')
         .text('INFORMATIONS CLIENT');
      doc.fontSize(12)
         .fillColor('#333333');
      doc.text(`Nom: ${client?.fullName || 'Client inconnu'}`);
      doc.text(`Email: ${client?.email || 'N/A'}`);
      doc.text(`Téléphone: ${client?.phone || 'N/A'}`);
      doc.moveDown();
      
      if (plan) {
        doc.fontSize(14)
           .fillColor('#0B676E')
           .text('ABONNEMENT');
        doc.fontSize(12)
           .fillColor('#333333');
        doc.text(`Plan: ${plan.name}`);
        doc.text(`Prix: ${plan.pricePerMonth} Ar/mois`);
        if (plan.description) {
          doc.text(`Description: ${plan.description}`);
        }
        doc.moveDown();
      }
      
      doc.fontSize(14)
         .fillColor('#0B676E')
         .text('DÉTAILS');
      doc.fontSize(12)
         .fillColor('#333333');
      
      if (invoice.billing_period_start && invoice.billing_period_end) {
        doc.text(`Période: ${new Date(invoice.billing_period_start).toLocaleDateString('fr-FR')} - ${new Date(invoice.billing_period_end).toLocaleDateString('fr-FR')}`);
      }
      
      doc.moveDown();
      
      const tableTop = doc.y;
      doc.fontSize(10);
      
      doc.fillColor('#0B676E');
      doc.text('Description', 50, tableTop, { width: 300 });
      doc.text('Montant', 350, tableTop, { width: 100, align: 'right' });
      
      doc.moveDown();
      doc.fillColor('#333333');
      
      doc.strokeColor('#CCCCCC')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();
      
      const description = invoice.description || `Abonnement ${plan?.name || 'mensuel'}`;
      doc.text(description, 50, doc.y, { width: 300 });
      doc.text(`${parseFloat(invoice.amount).toLocaleString('fr-FR')} Ar`, 350, doc.y, { width: 100, align: 'right' });
      
      doc.moveDown(2);
      
      doc.strokeColor('#CCCCCC')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();
      
      doc.fontSize(14)
         .fillColor('#0B676E')
         .text('TOTAL', 350, doc.y, { width: 100, align: 'right' });
      doc.fontSize(16)
         .fillColor('#000000')
         .text(`${parseFloat(invoice.totalAmount || invoice.amount).toLocaleString('fr-FR')} Ar`, 350, doc.y, { width: 100, align: 'right' });
      
      doc.moveDown(3);
      
      if (invoice.paymentMethod) {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Mode de paiement: ${invoice.paymentMethod === 'cash' ? 'Espèces' : 'Mobile Money'}`);
      }
      
      doc.fontSize(10)
         .fillColor('#999999')
         .text('Merci pour votre confiance', { align: 'center' });
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });
      
      doc.end();
      
    } catch (e: any) {
      console.error("Erreur prévisualisation PDF:", e);
      res.status(500).json({ message: "Erreur lors de la prévisualisation" });
    }
  });

  // POST /api/invoices/generate-monthly
  app.post("/api/invoices/generate-monthly", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const activeClients = await storage.getActiveClientsWithSubscriptions();
      const generated: any[] = [];
      const skipped: string[] = [];
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      console.log(`[GENERATE] ${activeClients.length} clients actifs trouvés`);

      for (const client of activeClients) {
        if (!client.isActive) {
          skipped.push(`${client.fullName} (client désactivé)`);
          continue;
        }

        const existing = await storage.getInvoiceByClientAndPeriod(client.id, start, end);
        if (existing) {
          skipped.push(`${client.fullName} (facture existante: #${existing.invoiceNumber})`);
          continue;
        }

        const priceStr = client.plan.pricePerMonth;
        const planPrice = parseFloat(String(priceStr).replace(/[^\d.-]/g, ""));
        
        const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${client.id}-${Date.now()}`;
        
        const invoiceData = {
          clientId: client.id,
          subscriptionId: client.subscription.id,
          invoiceNumber: invoiceNumber,
          amount: planPrice.toString(),
          currency: "MGA",
          status: "pending" as const,
          issueDate: now,
          dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
          billing_period_start: start,
          billing_period_end: end,
          totalAmount: planPrice.toString(),
          subtotal: planPrice.toString(),
          taxAmount: "0",
          paymentTerms: "Net 15",
          generatedBy: user.id,
          is_paid: false,
          description: `Abonnement ${client.plan.name} - ${format(start, 'MMMM yyyy', { locale: fr })}`
        };
        
        const inv = await storage.createInvoice(invoiceData);
        generated.push(inv);
        console.log(`[GENERATE] Facture générée pour ${client.fullName} - ${invoiceNumber}`);
      }
      
      res.status(200).json({ 
        success: true, 
        generatedCount: generated.length, 
        skippedCount: skipped.length,
        generated: generated,
        skipped: skipped,
        message: `${generated.length} facture(s) générée(s), ${skipped.length} ignorée(s)`
      });
    } catch (error: any) {
      console.error("Erreur génération mensuelle factures:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la génération" });
    }
  });

  // GET /api/contracts/:clientId/download
  app.get("/api/contracts/:clientId/download", requireAuth, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getUser(clientId);
      if (!client) return res.status(404).json({ message: "Client non trouvé" });
      
      if (!client.isActive) {
        return res.status(403).json({ message: "Impossible de générer un contrat pour un client désactivé." });
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: and(eq(subscriptions.clientId, clientId), eq(subscriptions.isActive, true))
      });
      if (!subscription) return res.status(404).json({ message: "Aucun abonnement actif trouvé" });

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      const contractPdf = await generateContractPdf(client, subscription, plan);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="contrat_${client.fullName?.replace(/\s+/g, '_') || 'client'}.pdf"`);
      res.send(contractPdf);
    } catch (error: any) {
      console.error("Erreur génération contrat:", error);
      res.status(500).json({ message: "Erreur lors de la génération du contrat" });
    }
  });

  // POST /api/invoices/match-payment
  app.post("/api/invoices/match-payment", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const { clientName, amount, paymentMethod, description } = req.body;
      if (!clientName || !amount) {
        return res.status(400).json({ success: false, message: "Nom du client et montant requis" });
      }

      const matchingClients = await db.select().from(users).where(
        and(eq(users.role, 'client'), sql`LOWER(${users.fullName}) LIKE LOWER(${'%' + clientName + '%'})`)
      );
      if (matchingClients.length === 0) {
        return res.status(404).json({ success: false, message: "Aucun client trouvé avec ce nom" });
      }

      const client = matchingClients[0];
      
      if (!client.isActive) {
        return res.status(403).json({ success: false, message: "Ce client est désactivé. Impossible de traiter un paiement." });
      }

      const pendingInvoices = await db.select().from(invoices).where(
        and(eq(invoices.clientId, client.id), eq(invoices.status, 'pending'))
      ).orderBy(invoices.dueDate);

      if (pendingInvoices.length === 0) {
        return res.status(404).json({ success: false, message: "Aucune facture en attente" });
      }

      const invoiceToPay = pendingInvoices[0];
      
      await storage.updateInvoice(invoiceToPay.id, {
        status: 'paid', 
        paidDate: new Date(), 
        paymentMethod: paymentMethod || 'cash'
      });

      const paidAmount = parseFloat(amount);
      await storage.createCashTransaction({
        type: 'income', 
        amount: paidAmount, 
        category: 'sales',
        description: description || `Paiement ${client.fullName} - Facture #${invoiceToPay.invoiceNumber}`,
        reference: `INV-${invoiceToPay.id}`, 
        addedBy: user.id, 
        transactionDate: new Date()
      });
      console.log(`[INVOICE] Match payment: +${paidAmount} Ar pour ${client.fullName}`);

      res.json({ success: true, message: `Paiement associé à la facture #${invoiceToPay.invoiceNumber}` });
    } catch (error: any) {
      console.error("Erreur association paiement:", error);
      res.status(500).json({ success: false, message: "Erreur lors de l'association" });
    }
  });
}