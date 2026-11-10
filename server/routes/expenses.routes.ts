
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { expenses, cashTransactions, users } from "../../shared/schema";
import { eq, and, gte, lte, like, asc, desc, sql, or, inArray } from "drizzle-orm";
import { insertExpenseSchema, updateExpenseSchema } from "../../shared/schema";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";
 
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
 
function getUser(req: Request): AuthUser {
  return req.user as AuthUser;
}
 
// ============================================================
// HELPERS CAISSE
// ============================================================
 
// Solde = ENTRÉES (cashTransactions income, hors EXP-%) - DÉPENSES (table expenses, non refusées)
async function getBalanceParts() {
  const [inc] = await db
    .select({ total: sql<string>`COALESCE(SUM(${cashTransactions.amount}), 0)` })
    .from(cashTransactions)
    .where(and(
      sql`${cashTransactions.type} = 'income'`,
      sql`COALESCE(${cashTransactions.reference}, '') NOT LIKE 'EXP-%'`
    ));
  const [exp] = await db
    .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(sql`COALESCE(${expenses.status}, '') <> 'refused'`);
  const income = Number(inc?.total ?? 0);
  const expense = Number(exp?.total ?? 0);
  return { income, expense, balance: income - expense };
}
 
async function getBalance(): Promise<number> {
  return (await getBalanceParts()).balance;
}
 
async function addCashTx(data: any) {
  return storage.createCashTransaction(data);
}
 
// ✅ NOUVEAU : la catégorie d'une dépense (expenseCategoryEnum) n'existe pas
// dans cashCategoryEnum. On la convertit en valeur valide pour la caisse.
const toCashCategory = (cat: string): string => {
  if (["Salaire employé", "Heures supplémentaires", "Prime", "Charges sociales"].includes(cat)) return "salary";
  if (cat.startsWith("Maintenance") || cat === "Entretien véhicule") return "maintenance";
  return "operational";
};
 
const refsOf = (id: number) => [`EXP-${id}`, `EXP-AGENT-${id}`];
 
function parseAmount(value: any): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
 
// Début de période (utilisé par plusieurs routes)
function periodStart(timePeriod: string): Date {
  const now = new Date();
  switch (timePeriod) {
    case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    case "month": return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year": return new Date(now.getFullYear(), 0, 1);
    default: return new Date(0);
  }
}
 
export default function expenseRoutes(app: Express) {
 
  // ============================================================
  // GET /api/expenses/my
  // ✅ Agent : ses dépenses seulement. Admin/supervisor : toutes.
  // ✅ Période par défaut = "all" (sinon la liste paraît vide)
  // ============================================================
  app.get("/api/expenses/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const timePeriod = (req.query.timePeriod as string) || "all";
      const start = periodStart(timePeriod);
 
      const conditions: any[] = [gte(expenses.expenseDate, start)];
      if (!["admin", "supervisor"].includes(user.role)) {
        conditions.push(eq(expenses.addedBy, user.id));
      }
 
      const result = await db
        .select({
          expense: expenses,
          creator: { id: users.id, fullName: users.fullName, role: users.role }
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.addedBy, users.id))
        .where(and(...conditions))
        .orderBy(desc(expenses.expenseDate));
 
      const total = result.reduce((sum, row) => sum + parseFloat(row.expense.amount as unknown as string), 0);
      const pendingCount = result.filter(row => row.expense.status === "pending").length;
      const approvedCount = result.filter(row => row.expense.status === "approved").length;
      const refusedCount = result.filter(row => row.expense.status === "refused").length;
 
      res.json({
        data: result.map(row => ({
          ...row.expense,
          amount: parseFloat(row.expense.amount as unknown as string),
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
  // POST /api/expenses/agent
  // ============================================================
  app.post("/api/expenses/agent", requireRole(["agent", "admin", "supervisor"]), async (req: Request, res: Response) => {
    let createdExpenseId: number | null = null;
    try {
      const user = getUser(req);
 
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
 
      if (!allowedCategories.includes(req.body.category)) {
        return res.status(400).json({
          success: false,
          message: `Catégorie non autorisée. Choisissez parmi: ${allowedCategories.join(", ")}`
        });
      }
 
      const amount = parseAmount(req.body.amount);
      if (amount === null) {
        return res.status(400).json({ success: false, message: "Montant invalide" });
      }
 
      const currentBalance = await getBalance();
      if (amount > currentBalance) {
        return res.status(400).json({
          success: false,
          message: `Solde insuffisant (${currentBalance.toLocaleString()} Ar)`
        });
      }
 
      // ✅ expenseDate (et non expense_date)
      const validated = insertExpenseSchema.parse({
        ...req.body,
        expense_date: new Date(req.body.expenseDate || req.body.expense_date || Date.now()),
        addedBy: user.id,
        status: "approved",
        currency: "MGA"
      });
 
      const expense = await storage.createExpense(validated);
      createdExpenseId = expense.id;
 
      await addCashTx({
        type: "expense",
        amount: expense.amount,
        category: toCashCategory(expense.category), // ✅ catégorie valide pour la caisse
        description: `[Agent ${user.fullName}] ${expense.description}`,
        transactionDate: expense.expenseDate,
        reference: `EXP-AGENT-${expense.id}`,
        addedBy: user.id,
        notes: `Dépense déclarée par agent ${user.fullName} - Validée automatiquement`
      });
 
      res.status(201).json({
        success: true,
        data: { ...expense, amount: parseFloat(expense.amount as unknown as string) }
      });
    } catch (error: any) {
      console.error("[EXPENSES] Erreur POST /api/expenses/agent:", error);
 
      if (createdExpenseId !== null) {
        try {
          await db.delete(expenses).where(eq(expenses.id, createdExpenseId));
        } catch (rollbackError) {
          console.error("[EXPENSES] Rollback échoué:", rollbackError);
        }
      }
 
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      }
      res.status(500).json({ success: false, message: "Échec de la création" });
    }
  });
 
  // ============================================================
  // PATCH /api/expenses/:id/validate
  // ============================================================
  app.patch("/api/expenses/:id/validate", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) {
        return res.status(400).json({ message: "ID invalide" });
      }
 
      const { action, notes } = req.body;
      if (!["approved", "refused"].includes(action)) {
        return res.status(400).json({ message: "Action invalide. Utilisez 'approved' ou 'refused'" });
      }
 
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense) {
        return res.status(404).json({ message: "Dépense non trouvée" });
      }
 
      const amount = parseFloat(expense.amount as unknown as string);
 
      const existingTx = await db
        .select({ id: cashTransactions.id })
        .from(cashTransactions)
        .where(inArray(cashTransactions.reference, refsOf(expenseId)));
 
      if (action === "approved" && expense.status !== "approved" && existingTx.length === 0) {
        const balance = await getBalance();
        if (amount > balance) {
          return res.status(400).json({ message: `Solde insuffisant (${balance.toLocaleString()} Ar)` });
        }
      }
 
      const [updated] = await db
        .update(expenses)
        .set({
          status: action,
          approvedBy: user.id,
          notes: notes
            ? `${expense.notes || ""}\n[${action.toUpperCase()} par ${user.fullName}] ${notes}`.trim()
            : expense.notes,
          updatedAt: new Date()
        })
        .where(eq(expenses.id, expenseId))
        .returning();
 
      if (action === "refused" && existingTx.length > 0) {
        await db.delete(cashTransactions)
          .where(inArray(cashTransactions.reference, refsOf(expenseId)));
      } else if (action === "approved" && existingTx.length === 0) {
        await addCashTx({
          type: "expense",
          amount: expense.amount,
          category: toCashCategory(expense.category), // ✅
          description: `Dépense: ${expense.description}`,
          transactionDate: expense.expenseDate,
          reference: `EXP-${expenseId}`,
          addedBy: user.id,
          notes: expense.notes
        });
      }
 
      try {
        await storage.createNotification({
          userId: expense.addedBy,
          type: "order_update",
          title: `Dépense ${action === "approved" ? "validée" : "refusée"}`,
          message: `Votre dépense de ${expense.amount} Ar (${expense.category}) a été ${action === "approved" ? "validée" : "refusée"} par ${user.fullName}`,
        });
      } catch (notifError) {
        console.warn("[EXPENSES] Notification agent non créée:", notifError);
      }
 
      res.json({
        success: true,
        data: { ...updated, amount: parseFloat(updated.amount as unknown as string) }
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur validation dépense:", error);
      res.status(500).json({ message: "Échec de la validation" });
    }
  });
 
  // ============================================================
  // GET /api/expenses
  // ============================================================
  app.get("/api/expenses", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        category, timePeriod, startDate, endDate,
        sortBy, sortOrder, search, page, limit,
        status, createdBy
      } = req.query;
 
      const conditions: any[] = [];
 
      if (status && typeof status === "string" && status !== "all") {
        conditions.push(sql`${expenses.status} = ${status}`);
      }
 
      if (createdBy && typeof createdBy === "string" && createdBy !== "all") {
        if (createdBy === "agent" || createdBy === "admin") {
          const found = await db.select({ id: users.id }).from(users).where(eq(users.role, createdBy));
          const ids = found.map(a => a.id);
          if (ids.length > 0) {
            conditions.push(inArray(expenses.addedBy, ids));
          }
        }
      }
 
      if (search && typeof search === "string" && search.trim() !== "") {
        const searchTerm = search.trim();
        conditions.push(or(
          sql`${expenses.category}::text ILIKE ${`%${searchTerm}%`}`,
          like(expenses.description, `%${searchTerm}%`),
          like(expenses.notes, `%${searchTerm}%`),
          like(expenses.receiptNumber, `%${searchTerm}%`)
        ));
      }
 
      if (category && typeof category === "string" && category !== "all") {
        conditions.push(sql`${expenses.category} = ${category}`);
      }
 
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
        conditions.push(gte(expenses.expenseDate, periodStart(timePeriod)));
      }
 
      let orderByColumn;
      if (sortBy === "amount") orderByColumn = expenses.amount;
      else if (sortBy === "description") orderByColumn = expenses.description;
      else orderByColumn = expenses.expenseDate;
      const orderDirection = sortOrder === "asc" ? asc : desc;
 
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 20;
      const offset = (pageNum - 1) * limitNum;
 
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
 
      const result = await db.select().from(expenses).where(whereClause)
        .orderBy(orderDirection(orderByColumn)).limit(limitNum).offset(offset);
      const totalResult = await db.select({ count: sql<number>`count(*)` }).from(expenses).where(whereClause);
      const total = Number(totalResult[0]?.count) || 0;
 
      res.json({
        data: result.map(exp => ({ ...exp, amount: parseFloat(exp.amount as unknown as string) })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses:", error);
      res.status(500).json({ error: "Erreur serveur", details: String(error) });
    }
  });
 
  // ============================================================
  // POST /api/expenses (admin / supervisor)
  // ============================================================
  app.post("/api/expenses", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    let createdExpenseId: number | null = null;
    try {
      const user = getUser(req);
 
      const amount = parseAmount(req.body.amount);
      if (amount === null) {
        return res.status(400).json({ success: false, message: "Montant invalide" });
      }
 
      const currentBalance = await getBalance();
      if (amount > currentBalance) {
        return res.status(400).json({
          success: false,
          message: `Solde insuffisant (${currentBalance.toLocaleString()} Ar)`
        });
      }
 
      // ✅ expenseDate (et non expense_date)
      const validated = insertExpenseSchema.parse({
        ...req.body,
        expense_date: new Date(req.body.expenseDate || req.body.expense_date || Date.now()),
        addedBy: user.id,
        status: "approved"
      });
 
      const expense = await storage.createExpense(validated);
      createdExpenseId = expense.id;
 
      await addCashTx({
        type: "expense",
        amount: expense.amount,
        category: toCashCategory(expense.category), // ✅
        description: `Dépense: ${expense.description}`,
        transactionDate: expense.expenseDate,
        reference: `EXP-${expense.id}`,
        addedBy: user.id,
        notes: expense.notes
      });
 
      res.status(201).json({ success: true, data: expense });
    } catch (error: any) {
      console.error("[EXPENSES] Erreur POST /api/expenses:", error);
 
      if (createdExpenseId !== null) {
        try {
          await db.delete(expenses).where(eq(expenses.id, createdExpenseId));
        } catch (rollbackError) {
          console.error("[EXPENSES] Rollback échoué:", rollbackError);
        }
      }
 
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      }
      res.status(500).json({ success: false, message: "Échec de la création" });
    }
  });
 
  // ============================================================
  // PATCH /api/expenses/:id
  // ============================================================
  app.patch("/api/expenses/:id", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).json({ message: "ID invalide" });
 
      // ✅ accepter aussi expense_date venant du front
      const body = { ...req.body };
      if (body.expense_date && !body.expenseDate) body.expenseDate = body.expense_date;
      const validated = updateExpenseSchema.parse(body);
 
      const [oldExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!oldExpense) return res.status(404).json({ message: "Dépense non trouvée" });
 
      const oldAmount = parseFloat(oldExpense.amount as unknown as string);
      const newAmount = validated.amount !== undefined ? Number(validated.amount) : oldAmount;
 
      if (!Number.isFinite(newAmount) || newAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
 
      const amountChanged = oldAmount !== newAmount;
 
      if (amountChanged && newAmount > oldAmount) {
        const difference = newAmount - oldAmount;
        const balance = await getBalance();
        if (difference > balance) {
          return res.status(400).json({ message: `Solde insuffisant (${balance.toLocaleString()} Ar)` });
        }
      }
 
      const updateData: any = { ...validated, updatedAt: new Date() };
      if (validated.amount !== undefined) {
        updateData.amount = String(validated.amount);
      }
 
      const [updated] = await db.update(expenses)
        .set(updateData)
        .where(eq(expenses.id, expenseId))
        .returning();
 
      if (!updated) return res.status(404).json({ message: "Dépense non trouvée" });
 
      if (amountChanged) {
        await db.update(cashTransactions)
          .set({ amount: String(newAmount) })
          .where(inArray(cashTransactions.reference, refsOf(expenseId)));
      }
 
      res.json({ ...updated, amount: parseFloat(updated.amount as unknown as string) });
    } catch (error: any) {
      console.error("[EXPENSES] Erreur PATCH /api/expenses:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.issues });
      }
      res.status(500).json({ message: "Échec de la mise à jour" });
    }
  });
 
  // ============================================================
  // DELETE /api/expenses/:id
  // ============================================================
  app.delete("/api/expenses/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).json({ message: "ID invalide" });
 
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense) return res.status(404).json({ message: "Dépense non trouvée" });
 
      await db.delete(cashTransactions)
        .where(inArray(cashTransactions.reference, refsOf(expenseId)));
      await db.delete(expenses).where(eq(expenses.id, expenseId));
 
      res.json({ message: "Dépense supprimée", success: true });
    } catch (error) {
      console.error("[EXPENSES] Erreur DELETE /api/expenses:", error);
      res.status(500).json({ message: "Échec de la suppression" });
    }
  });
 
  // ============================================================
  // GET /api/expenses/stats/daily
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
  // GET /api/expenses/stats/weekly
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
  // GET /api/expenses/stats/monthly
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
 
      const range = and(gte(expenses.expenseDate, startOfMonth), lte(expenses.expenseDate, endOfMonth));
 
      const [result] = await db.select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
        max: sql<number>`COALESCE(MAX(${expenses.amount}), 0)`,
        min: sql<number>`COALESCE(MIN(${expenses.amount}), 0)`,
        average: sql<number>`COALESCE(AVG(${expenses.amount}), 0)`
      }).from(expenses).where(range);
 
      const byCategory = await db.select({
        category: expenses.category,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
      }).from(expenses).where(range).groupBy(expenses.category);
 
      const topExpenses = await db.select().from(expenses)
        .where(range).orderBy(desc(expenses.amount)).limit(5);
 
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
 
      const sortedByCategory = [...byCategory].sort((a, b) =>
        parseFloat(b.total as unknown as string) - parseFloat(a.total as unknown as string)
      );
 
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
          evolution,
          trend: evolution > 0 ? "up" : evolution < 0 ? "down" : "stable"
        }
      });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/stats/monthly:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
 
  // ============================================================
  // GET /api/expenses/stats/curve
  // ============================================================
  app.get("/api/expenses/stats/curve", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period = "month", startDate, endDate } = req.query;
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
        if (period === "week") start.setDate(end.getDate() - 7);
        else if (period === "month") start.setMonth(end.getMonth() - 1);
        else if (period === "year") start.setFullYear(end.getFullYear() - 1);
      }
 
      const curveData = await storage.getExpenseCurve(start, end);
      const total = curveData.reduce((sum: number, item: any) => sum + item.daily, 0);
 
      res.json({ period, startDate: start, endDate: end, data: curveData, total });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/expenses/stats/curve:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
 
  // ============================================================
  // GET /api/cash/balance
  // ============================================================
  app.get("/api/cash/balance", requireAuth, async (req: Request, res: Response) => {
    try {
      const balance = await getBalance();
      const transactions = await storage.getCashTransactions(50);
      res.json({ balance, lastUpdated: new Date(), recentTransactions: transactions });
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/cash/balance:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
 
  // ============================================================
  // GET /api/cash/debug
  // ============================================================
  app.get("/api/cash/debug", requireAuth, async (req: Request, res: Response) => {
    try {
      const rows = await db.select().from(cashTransactions).orderBy(desc(cashTransactions.id)).limit(20);
      const parts = await getBalanceParts();
      res.json({
        totalEntrees: parts.income,
        totalDepenses: parts.expense,
        solde: parts.balance,
        last20Transactions: rows,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
 
  // ============================================================
  // GET /api/cash/transactions
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
  // POST /api/cash/income
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
 
      const transaction = await addCashTx({
        type: "income", amount: validated.amount, category: validated.category,
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
  // POST /api/cash/expense
  // ============================================================
  app.post("/api/cash/expense", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const { amount, category, description, reference, notes, transactionDate, expenseDate, expense_date } = req.body;
      const schema = z.object({
        amount: z.number().min(0.01), category: z.string().min(1),
        description: z.string().min(1), reference: z.string().optional(), notes: z.string().optional()
      });
      const validated = schema.parse({ amount, category, description, reference, notes });
 
      // Date choisie dans le formulaire (sinon aujourd'hui)
      const rawExpenseDate = expenseDate ?? expense_date ?? transactionDate;
      const parsedExpenseDate = rawExpenseDate ? new Date(rawExpenseDate) : new Date();
      if (Number.isNaN(parsedExpenseDate.getTime())) {
        return res.status(400).json({ success: false, message: "Date invalide" });
      }
 
      const currentBalance = await getBalance();
      if (currentBalance < validated.amount) {
        return res.status(400).json({ success: false, message: `Solde insuffisant (${currentBalance.toLocaleString()} Ar)` });
      }
 
      // ✅ expenseDate (amount reste un nombre)
      const expense = await storage.createExpense({
        description: validated.description,
        amount: validated.amount, // nombre : la conversion en string se fait dans storage.createExpense
        category: validated.category,
        expense_date: parsedExpenseDate,
        addedBy: user.id,
        notes: validated.notes,
        currency: "MGA",
        status: "approved"
      });
 
      const extraNotes = [validated.notes, validated.reference ? `Réf: ${validated.reference}` : null]
        .filter(Boolean).join(" | ") || undefined;
 
      let transaction = null;
      let cashTransactionSaved = true;
      try {
        transaction = await addCashTx({
          type: "expense", amount: validated.amount,
          category: toCashCategory(validated.category),
          description: `Dépense: ${validated.description}`,
          reference: `EXP-${expense.id}`,
          notes: extraNotes, addedBy: user.id, transactionDate: parsedExpenseDate
        });
      } catch (cashError) {
        cashTransactionSaved = false;
        console.error(`[EXPENSES] Dépense #${expense.id} enregistrée, mais transaction de caisse échouée:`, cashError);
      }
 
      res.status(201).json({ success: true, data: { expense, transaction }, cashTransactionSaved });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: "Erreur de validation", errors: error.issues });
      console.error("[EXPENSES] Erreur POST /api/cash/expense:", error);
      res.status(500).json({ success: false, message: "Échec de l'enregistrement" });
    }
  });
 
  // ============================================================
  // BUDGETS
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
 
  app.get("/api/budgets/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      const { resolved } = req.query;
      const alerts = await storage.getBudgetAlerts(resolved === "true");
      res.json(alerts);
    } catch (error) {
      console.error("[EXPENSES] Erreur GET /api/budgets/alerts:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
 
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
