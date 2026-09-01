// server/routes/subscriptions.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { subscriptions, subscriptionPlans, planSelections, users } from "@shared/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { insertSubscriptionSchema, insertPlanSelectionSchema } from "@shared/schema";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ============================================================
// ROUTES
// ============================================================
export default function subscriptionRoutes(app: Express) {
  
  // ============================================================
  // GET /api/subscription-plans
  // Récupérer tous les plans d'abonnement
  // ============================================================
  app.get("/api/subscription-plans", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Échec de la récupération des plans" });
    }
  });

  // ============================================================
  // POST /api/subscription-plans
  // Créer un plan d'abonnement
  // ============================================================
  app.post("/api/subscription-plans", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Échec de la création du plan" });
    }
  });

  // ============================================================
  // PUT /api/subscription-plans/:id
  // Mettre à jour un plan d'abonnement
  // ============================================================
  app.put("/api/subscription-plans/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateSubscriptionPlan(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ message: "Plan non trouvé" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Échec de la mise à jour du plan" });
    }
  });

  // ============================================================
  // DELETE /api/subscription-plans/:id
  // Supprimer un plan d'abonnement
  // ============================================================
  app.delete("/api/subscription-plans/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteSubscriptionPlan(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Plan non trouvé" });
      }
      res.json({ message: "Plan supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Échec de la suppression du plan" });
    }
  });

  // ============================================================
  // GET /api/subscriptions
  // Récupérer tous les abonnements actifs
  // ============================================================
  app.get("/api/subscriptions", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const all = await db.query.subscriptions.findMany({ 
        where: eq(subscriptions.isActive, true) 
      });
      res.json(all);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Échec de la récupération des abonnements" });
    }
  });

  // ============================================================
  // GET /api/subscriptions/current
  // Récupérer l'abonnement actuel de l'utilisateur connecté
  // ============================================================
  app.get("/api/subscriptions/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const sub = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.clientId, user.id), 
          eq(subscriptions.isActive, true)
        ),
        with: { plan: true }
      });
      
      if (!sub) {
        return res.status(404).json({ message: "Aucun abonnement actif" });
      }
      
      res.json(sub);
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ message: "Échec de la récupération de l'abonnement" });
    }
  });

  // ============================================================
  // GET /api/subscription
  // Alias - Récupérer l'abonnement actuel
  // ============================================================
  app.get("/api/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const sub = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.clientId, user.id), 
          eq(subscriptions.isActive, true)
        ),
        with: { plan: true }
      });
      
      if (!sub) {
        return res.status(404).json({ message: "Aucun abonnement actif" });
      }
      
      res.json(sub);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Échec de la récupération de l'abonnement" });
    }
  });

  // ============================================================
  // GET /api/my-subscription
  // Récupérer l'abonnement avec les préférences utilisateur
  // ============================================================
  app.get("/api/my-subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientId, user.id),
        with: { plan: true }
      });
      
      if (!sub) {
        return res.json(null);
      }

      const userPrefs = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { 
          preferredPickupDays: true, 
          preferredTimeWindowStart: true, 
          preferredTimeWindowEnd: true 
        }
      });

      res.json({ 
        ...sub, 
        ...userPrefs 
      });
    } catch (error) {
      console.error("Error fetching my subscription:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================================
  // POST /api/subscriptions
  // Créer un abonnement
  // ============================================================
  app.post("/api/subscriptions", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const validated = insertSubscriptionSchema.parse(req.body);
      const sub = await storage.createSubscription(validated);
      res.status(201).json(sub);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Échec de la création de l'abonnement" });
    }
  });

  // ============================================================
  // PATCH /api/subscriptions/:id
  // Mettre à jour un abonnement
  // ============================================================
  app.patch("/api/subscriptions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const subId = parseInt(req.params.id);
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const sub = await db.query.subscriptions.findFirst({ 
        where: eq(subscriptions.id, subId) 
      });
      
      if (!sub) {
        return res.status(404).json({ message: "Abonnement non trouvé" });
      }

      const isAdmin = user.role === "admin";
      const isOwner = sub.clientId === user.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Permission refusée" });
      }

      const userUpdates: any = {};
      
      if (req.body.preferredTimeWindowStart) {
        userUpdates.preferredTimeWindowStart = req.body.preferredTimeWindowStart;
      }
      if (req.body.preferredTimeWindowEnd) {
        userUpdates.preferredTimeWindowEnd = req.body.preferredTimeWindowEnd;
      }
      if (req.body.preferredPickupDays) {
        userUpdates.preferredPickupDays = req.body.preferredPickupDays;
      }

      if (Object.keys(userUpdates).length > 0) {
        await storage.updateUser(sub.clientId, userUpdates);
      }

      if (req.body.planId && req.body.planId !== sub.planId) {
        await storage.updateSubscription(subId, { planId: req.body.planId });
      }

      if (req.body.specialInstructions) {
        await storage.updateSubscription(subId, { 
          specialInstructions: req.body.specialInstructions 
        });
      }

      res.json({ message: "Abonnement mis à jour avec succès" });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // GET /api/plan-selection/:userId
  // Récupérer la sélection de plan d'un utilisateur
  // ============================================================
  app.get("/api/plan-selection/:userId", async (req: Request, res: Response) => {
    try {
      const data = await db.select({
        user: users,
        planSelection: planSelections,
        plan: subscriptionPlans
      })
      .from(users)
      .leftJoin(planSelections, eq(users.id, planSelections.userId))
      .leftJoin(subscriptionPlans, eq(planSelections.planId, subscriptionPlans.id))
      .where(eq(users.id, Number(req.params.userId)))
      .limit(1);

      res.json(data[0] || null);
    } catch (error: any) {
      console.error("Error fetching plan selection:", error);
      res.status(500).json({ error: error.message || "Erreur serveur" });
    }
  });

  // ============================================================
  // POST /api/plan-selection
  // Créer une sélection de plan
  // ============================================================
  app.post("/api/plan-selection", async (req: Request, res: Response) => {
    try {
      const parsed = insertPlanSelectionSchema.parse(req.body);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await db.query.users.findFirst({
        where: or(
          eq(users.email, parsed.email), 
          eq(users.phone, parsed.phone)
        )
      });

      let userId: number;
      let isNewUser = false;

      if (existingUser) {
        userId = existingUser.id;
        await db.update(users)
          .set({
            status: "pending",
            isActive: false,
            address: parsed.address,
            fullName: parsed.fullName,
            phone: parsed.phone,
            selectedPlanId: parsed.planId
          })
          .where(eq(users.id, userId));
      } else {
        // Créer un nom d'utilisateur unique
        const baseUsername = parsed.fullName
          .toLowerCase()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "")
          .substring(0, 20);
        
        let finalUsername = baseUsername;
        let counter = 1;
        
        while (await db.query.users.findFirst({ where: eq(users.username, finalUsername) })) {
          finalUsername = `${baseUsername}${counter}`;
          counter++;
        }

        const hashed = await hashPassword("defaultPassword123");
        
        const newUser = await db.insert(users)
          .values({
            fullName: parsed.fullName,
            email: parsed.email,
            phone: parsed.phone,
            address: parsed.address,
            role: "client",
            isActive: false,
            username: finalUsername,
            password: hashed,
            status: "pending",
            selectedPlanId: parsed.planId,
            preferredPickupDays: [],
            vehicleType: null,
            capacityInItems: null,
            neighborhood: null,
            addressDetails: null,
            preferredTimeWindowStart: null,
            preferredTimeWindowEnd: null
          })
          .returning();
        
        userId = newUser[0].id;
        isNewUser = true;
      }

      // Créer ou mettre à jour la sélection
      const existingSelection = await db.query.planSelections.findFirst({
        where: eq(planSelections.userId, userId)
      });

      const selectionData = {
        planId: parsed.planId,
        planName: parsed.planName,
        planType: parsed.planType,
        planPrice: parsed.planPrice,
        fullName: parsed.fullName,
        firstName: parsed.firstName || "",
        email: parsed.email,
        phone: parsed.phone,
        address: parsed.address,
        specialRequirements: parsed.specialRequirements || "",
        status: "pending",
        userId
      };

      let planSelectionId: number;

     if (existingSelection) {
  const updated = await db.update(planSelections)
    .set({
      ...selectionData,
      updatedAt: new Date(),
    } as any) 
    .where(eq(planSelections.id, existingSelection.id))
    .returning();
  planSelectionId = existingSelection.id;
}else {
        const created = await db.insert(planSelections)
          .values(selectionData)
          .returning();
        planSelectionId = created[0].id;
      }

      // Créer une notification
      await storage.createNotification({
        userId: 1,
        type: "new_registration",
        title: isNewUser ? "Nouvelle inscription" : "Mise à jour abonnement",
        message: `${parsed.fullName} (${parsed.phone}) - Plan: ${parsed.planName}`,
        clientId: userId,
        quoteId: planSelectionId
      });

      res.status(201).json({
        success: true,
        message: "Demande soumise avec succès",
        data: {
          planSelectionId,
          userId,
          planName: parsed.planName,
          planType: parsed.planType,
          planPrice: parsed.planPrice,
          isNewUser
        }
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: error.errors
        });
      }
      console.error("Error creating plan selection:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  });

  // ============================================================
  // GET /api/pending-subscriptions
  // Récupérer les demandes d'abonnement en attente
  // ============================================================
  app.get("/api/pending-subscriptions", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const result = await db.select({
        id: planSelections.id,
        planId: planSelections.planId,
        planName: planSelections.planName,
        planType: planSelections.planType,
        planPrice: planSelections.planPrice,
        clientName: planSelections.fullName,
        clientEmail: planSelections.email,
        clientPhone: planSelections.phone,
        clientAddress: planSelections.address,
        specialRequirements: planSelections.specialRequirements,
        status: planSelections.status,
        createdAt: planSelections.createdAt,
        userId: users.id,
        userFullName: users.fullName
      })
      .from(planSelections)
      .leftJoin(users, eq(planSelections.userId, users.id))
      .orderBy(desc(planSelections.createdAt));

      res.json({
        success: true,
        count: result.length,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Error fetching pending subscriptions:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message
      });
    }
  });

  // ============================================================
  // PATCH /api/plan-selections/:id/status
  // Mettre à jour le statut d'une sélection de plan
  // ============================================================
  app.patch("/api/plan-selections/:id/status", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const selection = await storage.updatePlanSelectionStatus(
        parseInt(req.params.id), 
        req.body.status
      );
      
      if (!selection) {
        return res.status(404).json({ message: "Sélection non trouvée" });
      }
      
      res.json(selection);
    } catch (error) {
      console.error("Error updating plan selection status:", error);
      res.status(500).json({ message: "Échec de la mise à jour du statut" });
    }
  });

  // ============================================================
  // GET /api/admin/clients-with-plans
  // Récupérer tous les clients avec leurs plans
  // ============================================================
  app.get("/api/admin/clients-with-plans", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const allUsers = await db.query.users.findMany();
      const allSelections = await db.query.planSelections.findMany();
      const allPlans = await db.query.subscriptionPlans.findMany();

      res.json({
        users: allUsers,
        planSelections: allSelections,
        subscriptionPlans: allPlans
      });
    } catch (error) {
      console.error("Error fetching clients with plans:", error);
      res.status(500).json({ message: "Échec de la récupération des données" });
    }
  });
}