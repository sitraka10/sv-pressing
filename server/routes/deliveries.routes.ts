// server/routes/deliveries.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { deliveries, pickups, deliverySchedules } from "../../shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { insertDeliverySchema, insertDeliveryScheduleSchema } from "../../shared/schema";
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

export default function deliveryRoutes(app: Express) {
  // ==================== DELIVERIES ====================
  
  // GET /api/deliveries - Liste des livraisons avec filtres avancés
  app.get("/api/deliveries", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status, driverId, date, type, page = "1", limit = "20" } = req.query;
      const user = getUser(req);
      let result;

      // Construction des conditions de filtrage
      const conditions: any[] = [];
      
      if (status && status !== "all") {
        // ✅ CORRECTION : Utiliser sql pour les enums
        conditions.push(sql`${deliveries.status} = ${status}`);
      }
      
      if (driverId && driverId !== "all") {
        conditions.push(eq(deliveries.deliveryPersonId, parseInt(driverId as string)));
      }
      
      if (type && type !== "all") {
        // ✅ CORRECTION : Utiliser sql pour les enums
        conditions.push(sql`${deliveries.type} = ${type}`);
      }
      
      if (date) {
        const targetDate = new Date(date as string);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        conditions.push(gte(deliveries.scheduledDate, startOfDay));
        conditions.push(lte(deliveries.scheduledDate, endOfDay));
      }

      // Récupération avec pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      if (user.role === "delivery") {
        conditions.push(eq(deliveries.deliveryPersonId, user.id));
      }

      const query = db.select().from(deliveries);
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      result = await query
        .orderBy(desc(deliveries.scheduledDate))
        .limit(parseInt(limit as string))
        .offset(offset);

      // Récupération du compte total pour la pagination
      const countQuery = db.select({ count: sql<number>`count(*)` }).from(deliveries);
      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }
      const countResult = await countQuery;
      const count = countResult[0]?.count || 0;

      res.json({
        data: result,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error("Erreur récupération livraisons:", error);
      res.status(500).json({ message: "Échec de la récupération des livraisons" });
    }
  });

  // GET /api/deliveries/stats - Statistiques des livraisons
  app.get("/api/deliveries/stats", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [monthlyStats, statusStats, typeStats] = await Promise.all([
        db.select({
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
          failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
          inProgress: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
          pending: sql<number>`sum(case when status = 'pending' or status = 'assigned' then 1 else 0 end)`
        }).from(deliveries)
        .where(and(
          gte(deliveries.scheduledDate, startOfMonth),
          lte(deliveries.scheduledDate, endOfMonth)
        )),
        
        db.select({
          status: deliveries.status,
          count: sql<number>`count(*)`
        }).from(deliveries).groupBy(deliveries.status),
        
        db.select({
          type: deliveries.type,
          count: sql<number>`count(*)`
        }).from(deliveries).groupBy(deliveries.type)
      ]);

      // Récupération des livreurs les plus performants
      const topDrivers = await db.select({
        deliveryPersonId: deliveries.deliveryPersonId,
        completedCount: sql<number>`count(*)`,
        successRate: sql<number>`round(100.0 * sum(case when status = 'completed' then 1 else 0 end) / count(*), 1)`
      }).from(deliveries)
      .where(eq(deliveries.status, 'completed'))
      .groupBy(deliveries.deliveryPersonId)
      .orderBy(desc(sql`successRate`))
      .limit(5);

      res.json({
        monthly: monthlyStats[0],
        byStatus: statusStats,
        byType: typeStats,
        topDrivers,
        successRate: monthlyStats[0]?.total > 0 
          ? Math.round((monthlyStats[0].completed / monthlyStats[0].total) * 100) 
          : 0
      });
    } catch (error) {
      console.error("Erreur statistiques:", error);
      res.status(500).json({ message: "Échec de la récupération des statistiques" });
    }
  });

  // POST /api/deliveries - Créer une livraison
  app.post("/api/deliveries", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const taskType = req.body.type === "pickup" ? "pickup" : "delivery";
      const processed = {
        ...req.body,
        type: taskType,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : new Date(),
        completedDate: req.body.completedDate ? new Date(req.body.completedDate) : undefined
      };
      
      const validated = insertDeliverySchema.parse(processed);
      const delivery = await storage.createDelivery(validated);
      
      res.status(201).json(delivery);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur création livraison:", error);
      res.status(500).json({ message: "Échec de la création" });
    }
  });

  // POST /api/deliveries/batch - Création en lot
  app.post("/api/deliveries/batch", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const { deliveries: deliveriesData } = req.body;
      
      if (!Array.isArray(deliveriesData) || deliveriesData.length === 0) {
        return res.status(400).json({ message: "Liste de livraisons requise" });
      }

      const results = [];
      const errors = [];

      for (const deliveryData of deliveriesData) {
        try {
          const processed = {
            ...deliveryData,
            type: deliveryData.type || 'delivery',
            scheduledDate: deliveryData.scheduledDate ? new Date(deliveryData.scheduledDate) : new Date(),
          };
          
          const validated = insertDeliverySchema.parse(processed);
          const delivery = await storage.createDelivery(validated);
          results.push(delivery);
        } catch (error) {
          errors.push({ 
            data: deliveryData, 
            error: error instanceof z.ZodError ? error.errors : 'Validation failed' 
          });
        }
      }

      res.status(201).json({
        created: results,
        failed: errors,
        summary: {
          total: deliveriesData.length,
          success: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error("Erreur création batch:", error);
      res.status(500).json({ message: "Échec de la création en lot" });
    }
  });

  // PATCH /api/deliveries/:id - Mise à jour
  app.patch("/api/deliveries/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const deliveryId = parseInt(req.params.id);
      
      // Vérifier que la livraison existe
      const existingDelivery = await db.select()
        .from(deliveries)
        .where(eq(deliveries.id, deliveryId))
        .limit(1);
      
      if (!existingDelivery || existingDelivery.length === 0) {
        return res.status(404).json({ message: "Livraison non trouvée" });
      }

      // Préparer les données de mise à jour
      const updateData = { ...req.body };
      
      // Conversion des dates
      if (updateData.scheduledDate) {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }
      if (updateData.completedDate) {
        updateData.completedDate = new Date(updateData.completedDate);
      }
      
      // Si le statut passe à "completed", enregistrer la date
      if (updateData.status === "completed" && !updateData.completedDate) {
        updateData.completedDate = new Date();
      }

      const updated = await storage.updateDelivery(deliveryId, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Erreur mise à jour livraison:", error);
      res.status(500).json({ message: "Échec de la mise à jour" });
    }
  });

  // GET /api/deliveries/:id - Détails d'une livraison
  app.get("/api/deliveries/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const delivery = await db.select()
        .from(deliveries)
        .where(eq(deliveries.id, parseInt(req.params.id)))
        .limit(1);
      
      if (!delivery || delivery.length === 0) {
        return res.status(404).json({ message: "Livraison non trouvée" });
      }
      res.json(delivery[0]);
    } catch (error) {
      console.error("Erreur récupération livraison:", error);
      res.status(500).json({ message: "Échec de la récupération" });
    }
  });

  // ==================== PICKUPS ====================
  
  // GET /api/pickups - Liste des ramassages
  app.get("/api/pickups", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status, date, page = "1", limit = "20" } = req.query;
      const conditions: any[] = [];

      if (status && status !== "all") {
        // ✅ CORRECTION : Utiliser sql pour les enums
        conditions.push(sql`${pickups.status} = ${status}`);
      }
      
      if (date) {
        const targetDate = new Date(date as string);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        conditions.push(gte(pickups.scheduledDate, startOfDay));
        conditions.push(lte(pickups.scheduledDate, endOfDay));
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const query = db.select().from(pickups);
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const data = await query
        .orderBy(desc(pickups.scheduledDate))
        .limit(parseInt(limit as string))
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(pickups);
      const count = countResult[0]?.count || 0;

      res.json({
        data,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error("Erreur récupération pickups:", error);
      res.status(500).json({ message: "Échec de la récupération" });
    }
  });

  // POST /api/pickups
  app.post("/api/pickups", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const result = await db.insert(pickups).values({
        clientId: req.body.clientId,
        scheduledDate: new Date(req.body.scheduledDate),
        status: req.body.status || 'pending',
        notes: req.body.notes
      }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Erreur création pickup:", error);
      res.status(500).json({ message: "Échec de la création" });
    }
  });

  // PATCH /api/pickups/:id
  app.patch("/api/pickups/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const updated = await db.update(pickups)
        .set({
          ...(req.body.scheduledDate && { scheduledDate: new Date(req.body.scheduledDate) }),
          ...(req.body.status && { status: req.body.status }),
          ...(req.body.notes !== undefined && { notes: req.body.notes }),
          updatedAt: new Date()
        })
        .where(eq(pickups.id, Number(req.params.id)))
        .returning();
      
      if (updated.length === 0) {
        return res.status(404).json({ message: "Ramassage non trouvé" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Erreur mise à jour pickup:", error);
      res.status(500).json({ message: "Échec de la mise à jour" });
    }
  });

  // POST /api/pickups/complete - Compléter un ramassage
  app.post("/api/pickups/complete", requireRole(["admin", "supervisor", "agent", "delivery"]), async (req: Request, res: Response) => {
    try {
      const { orderId, deliveryPersonId, notes } = req.body;
      if (!orderId || !deliveryPersonId) {
        return res.status(400).json({ message: "orderId et deliveryPersonId requis" });
      }
      
      const completed = await storage.completePickup(orderId, deliveryPersonId, notes);
      if (!completed) {
        return res.status(404).json({ message: "Ramassage non trouvé" });
      }
      
      res.json({ message: "Ramassage terminé", pickup: completed });
    } catch (error) {
      console.error("Erreur complétion pickup:", error);
      res.status(500).json({ message: "Échec de la complétion" });
    }
  });

  // ==================== DELIVERY SCHEDULES ====================
  
  // GET /api/delivery-schedules - Plannings avec filtres
  app.get("/api/delivery-schedules", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const { driverId, date, week } = req.query;
      const conditions: any[] = [];

      if (driverId && driverId !== "all") {
        conditions.push(eq(deliverySchedules.deliveryPersonId, parseInt(driverId as string)));
      }

      if (date) {
        const targetDate = new Date(date as string);
        conditions.push(eq(deliverySchedules.date, targetDate));
      } else if (week) {
        // Filtre par semaine
        const weekStart = new Date(week as string);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        conditions.push(gte(deliverySchedules.date, weekStart));
        conditions.push(lte(deliverySchedules.date, weekEnd));
      }

      const query = db.select().from(deliverySchedules);
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const schedules = await query.orderBy(deliverySchedules.date);
      res.json(schedules);
    } catch (error) {
      console.error("Erreur récupération plannings:", error);
      res.status(500).json({ message: "Échec de la récupération" });
    }
  });

  // POST /api/delivery-schedules
  app.post("/api/delivery-schedules", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const validated = insertDeliveryScheduleSchema.parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date()
      });
      
      const schedule = await storage.createDeliverySchedule(validated);
      res.status(201).json(schedule);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur création planning:", error);
      res.status(500).json({ message: "Échec de la création" });
    }
  });

  // POST /api/delivery-schedules/batch - Création en lot (semaine complète)
  app.post("/api/delivery-schedules/batch", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const { schedules: weekSchedules } = req.body;
      
      if (!Array.isArray(weekSchedules) || weekSchedules.length === 0) {
        return res.status(400).json({ message: "Liste de plannings requise" });
      }

      const results = [];
      for (const schedule of weekSchedules) {
        const validated = insertDeliveryScheduleSchema.parse({
          ...schedule,
          date: schedule.date ? new Date(schedule.date) : new Date()
        });
        const created = await storage.createDeliverySchedule(validated);
        results.push(created);
      }

      res.status(201).json(results);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Échec de la création en lot" });
    }
  });

  // PATCH /api/delivery-schedules/:id
  app.patch("/api/delivery-schedules/:id", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const updated = await db.update(deliverySchedules)
        .set({
          ...(req.body.startTime && { startTime: req.body.startTime }),
          ...(req.body.endTime && { endTime: req.body.endTime }),
          ...(req.body.maxOrders && { maxOrders: req.body.maxOrders }),
          ...(req.body.notes !== undefined && { notes: req.body.notes }),
          ...(req.body.status && { status: req.body.status }),
          updatedAt: new Date()
        })
        .where(eq(deliverySchedules.id, parseInt(req.params.id)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ message: "Planning non trouvé" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Erreur mise à jour planning:", error);
      res.status(500).json({ message: "Échec de la mise à jour" });
    }
  });
}