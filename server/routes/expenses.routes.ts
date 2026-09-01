// server/routes/expenses.routes.ts
// Version complète avec SYNCHRONISATION ADMIN ↔ AGENT
// ✅ CORRECTION : Agent voit TOUTES les dépenses (admin + agents)
// ✅ CORRECTION : Les dépenses des agents sont directement approuvées
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { expenses, cashTransactions, cashBalance, categoryBudgets, users } from "../../shared/schema";
import { eq, and, gte, lte, like, asc, desc, sql, or } from "drizzle-orm";
import { insertExpenseSchema, updateExpenseSchema } from "../../shared/schema";
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

export default function expenseRoutes(app: Express) {

  // ============================================================
  // ✅ ROUTE CORRIGÉE: GET /api/expenses/my
  // Description: Récupère les dépenses de la période
  // CORRECTION: Agent voit TOUTES les dépenses (admin + agents)
  // ============================================================
  app.get("/api/expenses/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      console.log("[EXPENSES] GET /api/expenses/my - User:", user.id, "Role:", user.role);
      
      const { timePeriod = "today" } = req.query;
      const now = new Date();
      let start: Date;
      
      // Calcul de la date de début selon la période
      switch (timePeriod) {
        case "today":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          break;
        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(0);
      }
      
      // ✅ CORRECTION : TOUS les utilisateurs voient TOUTES les dépenses
      // Plus de filtre par addedBy = userId
      const result = await db
        .select({
          expense: expenses,
          creator: {
            id: users.id,
            fullName: users.fullName,
            role: users.role
          }
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.addedBy, users.id))
        .where(gte(expenses.expenseDate, start))
        .orderBy(desc(expenses.expenseDate));
      
      // Calcul du total
      const total = result.reduce((sum, row) => sum + parseFloat(row.expense.amount as unknown as string), 0);
      const pendingCount = result.filter(row => row.expense.status === "pending").length;
      const approvedCount = result.filter(row => row.expense.status === "approved").length;
      const refusedCount = result.filter(row => row.expense.status === "refused").length;
      
      console.log(`[EXPENSES] ${result.length} dépenses trouvées, total: ${total} Ar`);
      
      res.json({
        data: result.map(row => ({
          ...row.expense,
          amount: parseFloat(row.expense.amount as unknown as string),
          // Ajouter les infos du créateur
          createdByUser: row.creator ? {
            id: row.creator.id,
            fullName: row.creator.fullName,
            role: row.creator.role
          } : null
        })),
        total,
        count: result.length,
        pendingCount,
        approvedCount,
        refusedCount,
        period: timePeriod
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/my:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ✅ ROUTE CORRIGÉE: POST /api/expenses/agent
  // Description: Un agent déclare une dépense (APPROUVÉE DIRECTEMENT)
  // CORRECTION: status = "approved" au lieu de "pending"
  // ============================================================
  app.post("/api/expenses/agent", requireRole(["agent", "admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      console.log("[EXPENSES] POST /api/expenses/agent - User:", user.id);
      console.log("[EXPENSES] Body:", req.body);
      
      // Catégories autorisées pour les agents (restreintes)
      const allowedCategories = [
        "Carburant véhicule",
        "Carburant livraison",
        "Entretien véhicule",
        "Repas personnel",
        "Indemnité transport",
        "Livraison moto",
        "Fournitures bureau",
        "Imprévu",
        "Autres"
      ];
      
      // Validation de la catégorie
      if (!allowedCategories.includes(req.body.category)) {
        return res.status(400).json({ 
          message: `Catégorie non autorisée. Choisissez parmi: ${allowedCategories.join(", ")}` 
        });
      }
      
      // Validation des données avec Zod
      const validated = insertExpenseSchema.parse({
        ...req.body,
        expense_date: new Date(req.body.expenseDate || Date.now()),
        addedBy: user.id,
        status: "approved", // ✅ CHANGÉ : Directement approuvé
        currency: "MGA"
      });
      
      console.log("[EXPENSES] Données validées:", validated);
      
      // Création de la dépense
      const expense = await storage.createExpense(validated);
      console.log(`[EXPENSES] ✅ Dépense agent #${expense.id} créée: ${expense.amount} Ar`);
      
      // Création de la transaction de caisse (pour traçabilité)
      await storage.createCashTransaction({
        type: 'expense',
        amount: expense.amount,
        category: expense.category,
        description: `[Agent ${user.fullName}] ${expense.description}`,
        transactionDate: expense.expenseDate,
        reference: `EXP-AGENT-${expense.id}`,
        addedBy: user.id,
        notes: `Dépense déclarée par agent ${user.fullName} - Validée automatiquement`
      });
      
      res.status(201).json({ 
        success: true, 
        data: {
          ...expense,
          amount: parseFloat(expense.amount as unknown as string)
        }
      });
    } catch (error: any) {
      console.error("[EXPENSES] Erreur POST /api/expenses/agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Erreur de validation", 
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Échec de la création" 
      });
    }
  });

  // ============================================================
  // ✅ ROUTE: PATCH /api/expenses/:id/validate
  // Description: Admin valide ou refuse une dépense d'agent
  // Note: Cette route peut être conservée pour les rares cas
  // où une dépense agent aurait besoin d'être ajustée
  // ============================================================
  app.patch("/api/expenses/:id/validate", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      console.log(`[EXPENSES] PATCH /api/expenses/${req.params.id}/validate`);
      
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) {
        return res.status(400).json({ message: "ID invalide" });
      }
      
      const { action, notes } = req.body; // action: "approved" | "refused"
      
      if (!["approved", "refused"].includes(action)) {
        return res.status(400).json({ message: "Action invalide. Utilisez 'approved' ou 'refused'" });
      }
      
      // Récupération de la dépense
      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, expenseId));
      
      if (!expense) {
        return res.status(404).json({ message: "Dépense non trouvée" });
      }
      
      // Mise à jour du statut
      const [updated] = await db
        .update(expenses)
        .set({ 
          status: action,
          approvedBy: user.id,
          notes: notes 
            ? `${expense.notes || ''}\n[${action.toUpperCase()} par ${user.fullName}] ${notes}`.trim() 
            : expense.notes,
          updatedAt: new Date() 
        })
        .where(eq(expenses.id, expenseId))
        .returning();
      
      console.log(`[EXPENSES] Dépense #${expenseId} ${action === 'approved' ? 'validée' : 'refusée'} par ${user.fullName}`);
      
      // Notification à l'agent qui a créé la dépense (si ce n'est pas déjà fait)
      try {
        await storage.createNotification({
          userId: expense.addedBy,
          type: 'order_update',
          title: `Dépense ${action === 'approved' ? 'validée' : 'refusée'}`,
          message: `Votre dépense de ${expense.amount} Ar (${expense.category}) a été ${action === 'approved' ? 'validée' : 'refusée'} par ${user.fullName}`,
        });
      } catch (notifError) {
        console.warn("[EXPENSES] Notification agent non créée:", notifError);
      }
      
      res.json({ 
        success: true,
        data: {
          ...updated,
          amount: parseFloat(updated.amount as unknown as string)
        }
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur validation dépense:", error);
      res.status(500).json({ message: "Échec de la validation" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/expenses (admin)
  // ============================================================
  app.get("/api/expenses", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("[EXPENSES] GET /api/expenses - Début de la requête");
      console.log("[EXPENSES] Query params reçus:", req.query);

      const { 
        category, 
        timePeriod, 
        startDate, 
        endDate, 
        sortBy, 
        sortOrder, 
        search, 
        page, 
        limit,
        status,
        createdBy
      } = req.query;

      const conditions: any[] = [];

      // FILTRE PAR STATUT
      if (status && typeof status === "string" && status !== "all") {
        console.log(`[EXPENSES] Filtre statut: ${status}`);
        // ✅ CORRECTION : Utiliser sql pour les enums
        conditions.push(sql`${expenses.status} = ${status}`);
      }

      // FILTRE PAR CRÉATEUR
      if (createdBy && typeof createdBy === "string" && createdBy !== "all") {
        console.log(`[EXPENSES] Filtre créé par: ${createdBy}`);
        if (createdBy === "agent") {
          const agents = await db.select({ id: users.id }).from(users).where(eq(users.role, "agent"));
          const agentIds = agents.map(a => a.id);
          if (agentIds.length > 0) {
            conditions.push(or(...agentIds.map(id => eq(expenses.addedBy, id))));
          }
        } else if (createdBy === "admin") {
          const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
          const adminIds = admins.map(a => a.id);
          if (adminIds.length > 0) {
            conditions.push(or(...adminIds.map(id => eq(expenses.addedBy, id))));
          }
        }
      }

      // RECHERCHE TEXTUELLE
      if (search && typeof search === "string" && search.trim() !== "") {
        const searchTerm = search.trim();
        console.log(`[EXPENSES] RECHERCHE ACTIVE - Terme: "${searchTerm}"`);
        const searchConditions: any[] = [];
        searchConditions.push(like(expenses.category, `%${searchTerm}%`));
        searchConditions.push(like(expenses.description, `%${searchTerm}%`));
        searchConditions.push(like(expenses.notes, `%${searchTerm}%`));
        searchConditions.push(like(expenses.receiptNumber, `%${searchTerm}%`));
        conditions.push(or(...searchConditions));
      }

      // FILTRE PAR CATÉGORIE
      if (category && typeof category === "string" && category !== "all") {
conditions.push(sql`${expenses.category} = ${category}`);
      }

      // FILTRE PAR PÉRIODE
      if (startDate && typeof startDate === "string" && startDate !== "") {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(expenses.expenseDate, start));
        if (endDate && typeof endDate === "string" && endDate !== "") {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          conditions.push(lte(expenses.expenseDate, end));
        }
      } else if (timePeriod && typeof timePeriod === "string" && timePeriod !== "all") {
        const now = new Date();
        let start: Date;
        switch (timePeriod) {
          case "today": start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
          case "week": start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); break;
          case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
          case "year": start = new Date(now.getFullYear(), 0, 1); break;
          default: start = new Date(0);
        }
        conditions.push(gte(expenses.expenseDate, start));
      }

      // TRI
      let orderByColumn;
      if (sortBy === "amount") orderByColumn = expenses.amount;
      else if (sortBy === "description") orderByColumn = expenses.description;
      else orderByColumn = expenses.expenseDate;
      const orderDirection = (sortOrder === "asc" ? asc : desc);

      // PAGINATION
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 20;
      const offset = (pageNum - 1) * limitNum;

      // EXÉCUTION
      let result;
      let total;
      if (conditions.length > 0) {
        result = await db.select().from(expenses).where(and(...conditions))
          .orderBy(orderDirection(orderByColumn)).limit(limitNum).offset(offset);
        const totalResult = await db.select({ count: sql<number>`count(*)` }).from(expenses).where(and(...conditions));
        total = Number(totalResult[0]?.count) || 0;
      } else {
        result = await db.select().from(expenses).orderBy(orderDirection(orderByColumn)).limit(limitNum).offset(offset);
        const totalResult = await db.select({ count: sql<number>`count(*)` }).from(expenses);
        total = Number(totalResult[0]?.count) || 0;
      }

      const formattedResult = result.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount as unknown as string)
      }));

      res.json({
        data: formattedResult,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses:", error);
      res.status(500).json({ error: "Erreur serveur", details: String(error) });
    }
  });

  // ============================================================
  // ROUTE: POST /api/expenses (admin)
  // ============================================================
  app.post("/api/expenses", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      console.log("[EXPENSES] POST /api/expenses - Création d'une dépense");
      
      const validated = insertExpenseSchema.parse({ 
        ...req.body, 
        expense_date: new Date(req.body.expenseDate || req.body.expense_date || Date.now()), 
        addedBy: user.id,
        status: "approved" // Admin = directement approuvé
      });
      
      const expense = await storage.createExpense(validated);
      
      await storage.createCashTransaction({
        type: 'expense',
        amount: expense.amount,
        category: expense.category,
        description: `Dépense: ${expense.description}`,
        transactionDate: expense.expenseDate,
        reference: `EXP-${expense.id}`,
        addedBy: user.id,
        notes: expense.notes
      });
      
      res.status(201).json({ success: true, data: expense });
    } catch (error: any) {
      console.error("[EXPENSES] Erreur POST /api/expenses:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      }
      res.status(500).json({ success: false, message: "Échec de la création" });
    }
  });
// ============================================================
// ROUTE: PATCH /api/expenses/:id
// ============================================================
app.patch("/api/expenses/:id", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).json({ message: "ID invalide" });
    
    const validated = updateExpenseSchema.parse(req.body);
    
    const [oldExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!oldExpense) return res.status(404).json({ message: "Dépense non trouvée" });
    
    // ✅ CORRECTION : Préparer les données avec conversion de type
    const updateData: any = {
      ...validated,
      updatedAt: new Date()
    };
    
    // Convertir amount en string si présent
    if (validated.amount !== undefined) {
      updateData.amount = String(validated.amount);
    }
    
    const [updated] = await db.update(expenses)
      .set(updateData)
      .where(eq(expenses.id, expenseId))
      .returning();
    
    if (!updated) return res.status(404).json({ message: "Dépense non trouvée" });
    
    const oldAmount = parseFloat(oldExpense.amount as unknown as string);
    const newAmount = validated.amount ? parseFloat(validated.amount as unknown as string) : oldAmount;
    
    if (oldAmount !== newAmount) {
      const difference = newAmount - oldAmount;
      if (difference > 0) {
        await storage.createCashTransaction({
          type: 'expense', amount: difference, category: oldExpense.category,
          description: `Ajustement dépense #${expenseId}: +${difference} Ar`,
          reference: `EXP-${expenseId}-ADJ`, addedBy: user.id, transactionDate: new Date(),
        });
      } else {
        await storage.createCashTransaction({
          type: 'income', amount: Math.abs(difference), category: 'other_income',
          description: `Ajustement dépense #${expenseId}: -${Math.abs(difference)} Ar`,
          reference: `EXP-${expenseId}-ADJ`, addedBy: user.id, transactionDate: new Date(),
        });
      }
    }
    
    res.json({ ...updated, amount: parseFloat(updated.amount as unknown as string) });
  } catch (error: any) {
    console.error("[EXPENSES] Erreur PATCH /api/expenses:", error);
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Données invalides", errors: error.errors });
    res.status(500).json({ message: "Échec de la mise à jour" });
  }
});
  // ============================================================
  // ROUTE: DELETE /api/expenses/:id
  // ============================================================
  app.delete("/api/expenses/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).json({ message: "ID invalide" });
      
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense) return res.status(404).json({ message: "Dépense non trouvée" });
      
      const amount = parseFloat(expense.amount as unknown as string);
      
      await db.delete(expenses).where(eq(expenses.id, expenseId)).returning();
      
      await storage.createCashTransaction({
        type: 'income', amount: amount, category: 'other_income',
        description: `Annulation dépense #${expenseId}: ${expense.description}`,
        reference: `EXP-${expenseId}-DEL`, addedBy: user.id, transactionDate: new Date(),
      });
      
      res.json({ message: "Dépense supprimée", success: true });
    } catch (error) {
      console.error("[EXPENSES] Erreur DELETE /api/expenses:", error);
      res.status(500).json({ message: "Échec de la suppression" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/expenses/stats/daily
  // ============================================================
  app.get("/api/expenses/stats/daily", requireAuth, async (req: Request, res: Response) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const result = await db.select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(expenses).where(and(gte(expenses.expenseDate, startOfDay), lte(expenses.expenseDate, endOfDay)));
      
      res.json({
        date: today,
        total: parseFloat(result[0]?.total as unknown as string || "0"),
        count: Number(result[0]?.count || 0)
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/stats/daily:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/expenses/stats/weekly
  // ============================================================
  app.get("/api/expenses/stats/weekly", requireAuth, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      const result = await db.select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
        average: sql<number>`COALESCE(AVG(${expenses.amount}), 0)`
      }).from(expenses).where(and(gte(expenses.expenseDate, startOfWeek), lte(expenses.expenseDate, endOfWeek)));
      
      res.json({
        week: { start: startOfWeek, end: endOfWeek },
        total: parseFloat(result[0]?.total as unknown as string || "0"),
        count: Number(result[0]?.count || 0),
        average: parseFloat(result[0]?.average as unknown as string || "0"),
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/stats/weekly:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/expenses/stats/monthly
  // ============================================================
  app.get("/api/expenses/stats/monthly", requireAuth, async (req: Request, res: Response) => {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const targetMonth = month ? parseInt(month as string) : now.getMonth() + 1;
      const targetYear = year ? parseInt(year as string) : now.getFullYear();
      
      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(targetYear, targetMonth, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const [result] = await db.select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
        max: sql<number>`COALESCE(MAX(${expenses.amount}), 0)`,
        min: sql<number>`COALESCE(MIN(${expenses.amount}), 0)`,
        average: sql<number>`COALESCE(AVG(${expenses.amount}), 0)`
      }).from(expenses).where(and(gte(expenses.expenseDate, startOfMonth), lte(expenses.expenseDate, endOfMonth)));
      
      const byCategory = await db.select({
        category: expenses.category,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses).where(and(gte(expenses.expenseDate, startOfMonth), lte(expenses.expenseDate, endOfMonth)))
        .groupBy(expenses.category);
      
      const topExpenses = await db.select().from(expenses)
        .where(and(gte(expenses.expenseDate, startOfMonth), lte(expenses.expenseDate, endOfMonth)))
        .orderBy(desc(expenses.amount)).limit(5);
      
      const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
      const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
      const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
      const endOfPrevMonth = new Date(prevYear, prevMonth, 0);
      endOfPrevMonth.setHours(23, 59, 59, 999);
      
      const [prevResult] = await db.select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses).where(and(gte(expenses.expenseDate, startOfPrevMonth), lte(expenses.expenseDate, endOfPrevMonth)));
      
      const currentTotal = parseFloat(result?.total as unknown as string || "0");
      const prevTotal = parseFloat(prevResult?.total as unknown as string || "0");
      const evolution = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
      
      const sortedByCategory = [...byCategory].sort((a, b) => {
        const totalA = parseFloat(a.total as unknown as string);
        const totalB = parseFloat(b.total as unknown as string);
        return totalB - totalA;
      });
      
      res.json({
        month: targetMonth, year: targetYear,
        startDate: startOfMonth, endDate: endOfMonth,
        total: currentTotal,
        count: Number(result?.count || 0),
        max: parseFloat(result?.max as unknown as string || "0"),
        min: parseFloat(result?.min as unknown as string || "0"),
        average: parseFloat(result?.average as unknown as string || "0"),
        byCategory: sortedByCategory.map(c => ({
          category: c.category,
          total: parseFloat(c.total as unknown as string)
        })),
        topExpenses: topExpenses.map(e => ({
          id: e.id, description: e.description,
          amount: parseFloat(e.amount as unknown as string),
          category: e.category, expenseDate: e.expenseDate
        })),
        comparison: {
          previousMonthTotal: prevTotal,
          evolution: evolution,
          trend: evolution > 0 ? 'up' : evolution < 0 ? 'down' : 'stable'
        }
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/stats/monthly:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/expenses/stats/curve
  // ============================================================
  app.get("/api/expenses/stats/curve", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period = 'month', startDate, endDate } = req.query;
      let start: Date, end: Date;
      
      if (startDate && endDate && typeof startDate === "string" && typeof endDate === "string") {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date();
        end.setHours(23, 59, 59, 999);
        start = new Date();
        start.setHours(0, 0, 0, 0);
        if (period === 'week') start.setDate(end.getDate() - 7);
        else if (period === 'month') start.setMonth(end.getMonth() - 1);
        else if (period === 'year') start.setFullYear(end.getFullYear() - 1);
      }
      
      const curveData = await storage.getExpenseCurve(start, end);
      const total = curveData.reduce((sum: number, item: any) => sum + item.daily, 0);
      
      res.json({
        period: period, startDate: start, endDate: end,
        data: curveData, total: total
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/stats/curve:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/cash/balance
  // ============================================================
  app.get("/api/cash/balance", requireAuth, async (req: Request, res: Response) => {
    try {
      const balance = await storage.getCurrentCashBalance();
      const transactions = await storage.getCashTransactions(50);
      res.json({ balance, lastUpdated: new Date(), recentTransactions: transactions });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/cash/balance:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/cash/transactions
  // ============================================================
  app.get("/api/cash/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, type, page, limit } = req.query;
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 50;
      
      const filters: any = { page: pageNum, limit: limitNum };
      if (startDate && typeof startDate === "string" && startDate !== "") filters.startDate = new Date(startDate);
      if (endDate && typeof endDate === "string" && endDate !== "") filters.endDate = new Date(endDate);
      if (type && typeof type === "string" && type !== "all") filters.type = type;
      
      const transactions = await storage.getCashTransactionsWithFilters(filters);
      res.json(transactions);
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/cash/transactions:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: POST /api/cash/income
  // ============================================================
  app.post("/api/cash/income", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const { amount, category, description, reference, notes } = req.body;
      const schema = z.object({
        amount: z.number().min(0.01), category: z.string().min(1),
        description: z.string().min(1), reference: z.string().optional(), notes: z.string().optional()
      });
      const validated = schema.parse({ amount, category, description, reference, notes });
      
      const transaction = await storage.createCashTransaction({
        type: 'income', amount: validated.amount, category: validated.category,
        description: validated.description, reference: validated.reference,
        notes: validated.notes, addedBy: user.id, transactionDate: new Date()
      });
      
      res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      console.error("[EXPENSES] Erreur POST /api/cash/income:", error);
      res.status(500).json({ success: false, message: "Échec de l'enregistrement" });
    }
  });

  // ============================================================
  // ROUTE: POST /api/cash/expense
  // ============================================================
  app.post("/api/cash/expense", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const { amount, category, description, reference, notes } = req.body;
      const schema = z.object({
        amount: z.number().min(0.01), category: z.string().min(1),
        description: z.string().min(1), reference: z.string().optional(), notes: z.string().optional()
      });
      const validated = schema.parse({ amount, category, description, reference, notes });
      
      const currentBalance = await storage.getCurrentCashBalance();
      if (currentBalance < validated.amount) {
        return res.status(400).json({ success: false, message: `Solde insuffisant (${currentBalance.toLocaleString()} Ar)` });
      }
      
      const expense = await storage.createExpense({
        description: validated.description, amount: validated.amount, category: validated.category,
        expense_date: new Date(), addedBy: user.id, notes: validated.notes,
        currency: "MGA", status: "approved"
      });
      
      const transaction = await storage.createCashTransaction({
        type: 'expense', amount: validated.amount, category: validated.category,
        description: `Dépense: ${validated.description}`, reference: validated.reference || `EXP-${expense.id}`,
        notes: validated.notes, addedBy: user.id, transactionDate: new Date()
      });
      
      res.status(201).json({ success: true, data: { expense, transaction } });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      console.error("[EXPENSES] Erreur POST /api/cash/expense:", error);
      res.status(500).json({ success: false, message: "Échec de l'enregistrement" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/budgets
  // ============================================================
  app.get("/api/budgets", requireAuth, async (req: Request, res: Response) => {
    try {
      const { month, year } = req.query;
      const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const budgets = await storage.getCategoryBudgets(targetMonth, targetYear);
      const expensesByCategory = await storage.getExpensesByCategoryForPeriod(targetMonth, targetYear);
      
      const budgetsWithSpent = budgets.map(budget => {
        const spent = expensesByCategory[budget.category] || 0;
        return {
          id: budget.id, category: budget.category, month: budget.month, year: budget.year,
          budgetAmount: budget.budgetAmount, spentAmount: spent,
          remaining: budget.budgetAmount - spent,
          percentageUsed: budget.budgetAmount > 0 ? (spent / budget.budgetAmount) * 100 : 0,
          alertThreshold: budget.alertThreshold, notes: budget.notes
        };
      });
      
      res.json(budgetsWithSpent);
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/budgets:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: POST /api/budgets
  // ============================================================
  app.post("/api/budgets", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const { category, month, year, budgetAmount, alertThreshold, notes } = req.body;
      const schema = z.object({
        category: z.string().min(1), month: z.number().min(1).max(12),
        year: z.number().min(2000).max(2100), budgetAmount: z.number().min(0),
        alertThreshold: z.number().min(0).max(100).optional(), notes: z.string().optional()
      });
      const validated = schema.parse({ category, month, year, budgetAmount, alertThreshold, notes });
      
      const budget = await storage.createOrUpdateCategoryBudget(validated);
      res.status(201).json({ success: true, data: budget });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      console.error("[EXPENSES] Erreur POST /api/budgets:", error);
      res.status(500).json({ success: false, message: "Échec de l'enregistrement" });
    }
  });

  // ============================================================
  // ROUTE: GET /api/budgets/alerts
  // ============================================================
  app.get("/api/budgets/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      const { resolved } = req.query;
      const alerts = await storage.getBudgetAlerts(resolved === 'true');
      res.json(alerts);
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/budgets/alerts:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // ROUTE: POST /api/budgets/alerts/:id/resolve
  // ============================================================
  app.post("/api/budgets/alerts/:id/resolve", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const alertId = parseInt(req.params.id);
      if (isNaN(alertId)) return res.status(400).json({ message: "ID invalide" });
      
      await storage.resolveBudgetAlert(alertId);
      res.json({ success: true, message: "Alerte résolue" });
    } catch (error) {
      console.error("[EXPENSES] Erreur POST /api/budgets/alerts/:id/resolve:", error);
      res.status(500).json({ message: "Échec" });
    }
  });
}