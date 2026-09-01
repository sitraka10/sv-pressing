// server/routes/orders.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { orders, users, orderNotes, subscriptions } from "../../shared/schema";
import { eq, and, not, desc } from "drizzle-orm";
import { isOrderLate, getLateType, recordLateDetection, recordLateResolution } from "../services/late-detection.service";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

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

export default function orderRoutes(app: Express) {

  // ═══════════════════════════════════════════════════════════════
  // ⚠️ ROUTES STATIQUES - DOIVENT ÊTRE AVANT /:id !
  // ═══════════════════════════════════════════════════════════════

  // GET /api/orders - Liste toutes les commandes
  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      let result;
      if (user.role === "client") {
        result = await storage.getOrdersByClient(user.id);
      } else if (["admin", "supervisor", "agent"].includes(user.role)) {
        result = await storage.getOrdersWithClientInfo();
        if (user.role !== "admin") {
          const activeClientIds = await storage.getActiveClientIds();
          result = result.filter((order: any) => activeClientIds.includes(order.clientId));
        }
      } else {
        return res.status(403).json({ message: "Permission refusée." });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Erreur GET /api/orders:", error);
      res.status(500).json({ message: "Échec de la récupération des commandes" });
    }
  });

  // ✅ GET /api/orders/agent-view - AVANT /:id !
  app.get("/api/orders/agent-view", requireRole(["agent", "admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const activeOrders = await db.query.orders.findMany({
        where: not(eq(orders.status, "delivered")),
        orderBy: [desc(orders.createdAt)],
        with: { client: { columns: { fullName: true } } }
      });
      res.json(activeOrders);
    } catch (error) {
      console.error("Erreur GET /api/orders/agent-view:", error);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  });

  // ✅ GET /api/orders/late - AVANT /:id !
  app.get("/api/orders/late", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const lateOrders = await db.select({ order: orders, client: users })
        .from(orders)
        .innerJoin(users, eq(orders.clientId, users.id))
        .where(and(eq(orders.isLate, true), not(eq(orders.status, "delivered"))))
        .orderBy(desc(orders.lateDetectedAt));
      res.json(lateOrders.map(({ order, client }) => ({
        ...order,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientNeighborhood: client.neighborhood
      })));
    } catch (error) {
      console.error("Erreur GET /api/orders/late:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ✅ POST /api/orders/check-late - AVANT /:id !
  app.post("/api/orders/check-late", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const activeOrders = await db.select().from(orders).where(not(eq(orders.status, "delivered")));
      let lateCount = 0;
      const now = new Date();
      for (const order of activeOrders) {
        if (isOrderLate(order) && !order.isLate) {
          const lateType = getLateType(order);
          let lateHours = 0;
          if (order.scheduledPickupDate) {
            lateHours = Math.floor((now.getTime() - new Date(order.scheduledPickupDate).getTime()) / 3600000);
          }
          await recordLateDetection(order.id, lateType, lateHours);
          lateCount++;
        }
      }
      res.json({ message: "Vérification terminée", lateDetected: lateCount, totalChecked: activeOrders.length });
    } catch (error) {
      console.error("Erreur POST /api/orders/check-late:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // ⚠️ ROUTES DYNAMIQUES (/:id) - APRÈS les statiques !
  // ═══════════════════════════════════════════════════════════════

  // GET /api/orders/:id - AVEC VALIDATION isNaN
  app.get("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      // ✅ VALIDATION CRITIQUE
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID de commande invalide" });
      }
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      if (user.role === "client" && order.clientId !== user.id) {
        return res.status(403).json({ message: "Permission refusée." });
      }
      res.json(order);
    } catch (error) {
      console.error("Erreur GET /api/orders/:id:", error);
      res.status(500).json({ message: "Échec de la récupération de la commande" });
    }
  });

  // POST /api/orders
  app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const clientId = user.role === "client" ? user.id : req.body.clientId;
      const client = await storage.getUser(clientId);
      if (!client) return res.status(404).json({ message: "Client non trouvé." });
      if (!client.isActive) return res.status(403).json({ message: "Ce client est désactivé." });

      const activeSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientId, clientId),
        with: { plan: true }
      });
      if (!activeSubscription) return res.status(400).json({ message: "Le client n'a pas d'abonnement actif." });

      const pickupDate = new Date(req.body.pickupDate);
      if (isNaN(pickupDate.getTime())) return res.status(400).json({ message: "Format de date invalide." });

      const deliveryDelayHours = activeSubscription.plan?.deliveryTimeHours || 48;
      const deliveryDate = new Date(pickupDate);
      deliveryDate.setHours(deliveryDate.getHours() + deliveryDelayHours);

      const orderData = {
        ...req.body,
        clientId,
        subscriptionId: activeSubscription.id,
        status: "to_pickup",
        scheduledPickupDate: pickupDate,
        scheduledDeliveryDate: deliveryDate,
      };

      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Erreur POST /api/orders:", error);
      res.status(500).json({ message: "Échec de la création de la commande" });
    }
  });

  // PATCH /api/orders/:id
  app.patch("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID de commande invalide" });

      const updateData: any = { updatedAt: new Date() };
      const { status, itemCount, linensDetails, scheduledPickupDate, scheduledDeliveryDate, specialInstructions, deliveryTimeWindowStart, deliveryTimeWindowEnd } = req.body;

      if (status) {
        updateData.status = status;
        updateData.statusChangedAt = new Date();
        if (status === "delivered") {
          updateData.actualDeliveryDate = new Date();
          if (user) await recordLateResolution(id, user.id);
        }
      }
      if (itemCount !== undefined) updateData.itemCount = parseInt(itemCount);
      if (linensDetails !== undefined) updateData.linensDetails = linensDetails;
      if (scheduledPickupDate) updateData.scheduledPickupDate = scheduledPickupDate;
      if (scheduledDeliveryDate) updateData.scheduledDeliveryDate = scheduledDeliveryDate;
      if (deliveryTimeWindowStart !== undefined) updateData.deliveryTimeWindowStart = deliveryTimeWindowStart;
      if (deliveryTimeWindowEnd !== undefined) updateData.deliveryTimeWindowEnd = deliveryTimeWindowEnd;
      if (specialInstructions) updateData.specialInstructions = specialInstructions;

      const updated = await storage.updateOrder(id, updateData);
      if (!updated) return res.status(404).json({ message: "Commande non trouvée" });

      const order = await storage.getOrder(id);
      if (order && !order.isLate && isOrderLate(order)) {
        const lateType = getLateType(order);
        let lateHours = 0;
        if (order.status === "to_pickup" && order.scheduledPickupDate) {
          lateHours = Math.floor((Date.now() - new Date(order.scheduledPickupDate).getTime()) / 3600000);
        }
        await recordLateDetection(id, lateType, lateHours);
      }

      res.json(updated);
    } catch (err: any) {
      console.error(`Erreur PATCH /api/orders/${req.params.id}:`, err);
      res.status(500).json({ message: "Erreur lors de la modification" });
    }
  });

// PATCH /api/orders/:id/reschedule - CORRIGÉ
app.patch("/api/orders/:id/reschedule", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ message: "ID de commande invalide" });

    const { newPickupDate, reason } = req.body;
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Commande non trouvée." });

    const client = await storage.getUser(order.clientId);
    if (client && !client.isActive) return res.status(403).json({ message: "Client désactivé." });

    const pickupDate = new Date(newPickupDate);
    if (isNaN(pickupDate.getTime())) return res.status(400).json({ message: "Date invalide." });
    if (pickupDate <= new Date()) return res.status(400).json({ message: "Date doit être dans le futur." });
    if (order.status !== "to_pickup") return res.status(400).json({ message: "Seules les commandes en attente peuvent être reportées." });

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, order.subscriptionId),
      with: { plan: true }
    });

    const deliveryDelayHours = subscription?.plan?.deliveryTimeHours || 48;
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setHours(deliveryDate.getHours() + deliveryDelayHours);

    // ✅ CORRECTION : Supprimer updatedAt car il n'existe pas dans updateOrder
    const updated = await storage.updateOrder(orderId, {
      scheduledPickupDate: pickupDate,
      scheduledDeliveryDate: deliveryDate,
      // ❌ updatedAt: new Date(), - Supprimer cette ligne
      specialInstructions: reason 
        ? `${order.specialInstructions || ''}\n[REPORTÉ] ${reason}`.trim()
        : order.specialInstructions
    });

    await db.insert(orderNotes).values({
      orderId,
      content: `🚚 Reporté au ${pickupDate.toLocaleDateString('fr-FR')}. Raison: ${reason || 'Non spécifiée'}`,
      createdBy: user.id,
      noteType: "reschedule",
      orderStatus: "to_pickup"
    });

    res.json(updated);
  } catch (error) {
    console.error("Erreur report:", error);
    res.status(500).json({ message: "Erreur lors du report" });
  }
});

  // GET /api/orders/:id/history
  app.get("/api/orders/:id/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) return res.status(400).json({ message: "ID invalide" });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      if (user.role === "client" && order.clientId !== user.id) return res.status(403);
      
      const history = await storage.getOrderStatusHistory(orderId);
      res.json(history);
    } catch (error) {
      console.error("Erreur GET /api/orders/:id/history:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // POST /api/orders/:id/resolve-late
  app.post("/api/orders/:id/resolve-late", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) return res.status(400).json({ message: "ID invalide" });
      await recordLateResolution(orderId, user.id);
      res.json({ message: "Retard résolu" });
    } catch (error) {
      console.error("Erreur POST /api/orders/:id/resolve-late:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // GET /api/orders/:id/notes
  app.get("/api/orders/:id/notes", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) return res.status(400).json({ message: "ID invalide" });
      const notes = await storage.getOrderNotes(orderId);
      res.json(notes);
    } catch (error) {
      console.error("Erreur GET /api/orders/:id/notes:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });
}