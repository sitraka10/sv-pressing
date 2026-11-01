// server/routes/orders.routes.ts - VERSION COMPLÈTE AVEC REPORTER
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { orders, users, orderNotes, subscriptions, deliveries, orderStatusHistory } from "../../shared/schema";
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
  phone2?: string;
  address?: string;
  neighborhood?: string;
  addressDetails?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: Date;
  preferredPickupDays?: string[];
  preferredTimeWindowStart?: string;
  preferredTimeWindowEnd?: string;
  capacityInItems?: number;
  vehicleType?: string;
};

// Fonction helper pour typer req.user
function getUser(req: Request): AuthUser {
  return req.user as AuthUser;
}

export default function orderRoutes(app: Express) {
  console.log("🔧 [ORDERS] Chargement des routes...");

  // ═══════════════════════════════════════════════════════════════
  // ⚠️ ROUTES STATIQUES - DOIVENT ÊTRE AVANT /:id !
  // ═══════════════════════════════════════════════════════════════

  // GET /api/orders
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
      res.status(500).json({ message: "Échec" });
    }
  });

  // ✅ GET /api/orders/agent-view - AVANT /:id !
  app.get("/api/orders/agent-view", requireRole(["agent", "admin", "supervisor"]), async (req: Request, res: Response) => {
    console.log("✅ [ORDERS] Route /api/orders/agent-view appelée !");
    try {
      const activeOrders = await db.query.orders.findMany({
        where: not(eq(orders.status, "delivered")),
        orderBy: [desc(orders.createdAt)],
        with: { 
          client: { 
            columns: { 
              id: true,
              fullName: true,
              phone: true,
              phone2: true,
              email: true,
              address: true,
              neighborhood: true,
              addressDetails: true,
              isActive: true,
              preferredPickupDays: true,
              preferredTimeWindowStart: true,
              preferredTimeWindowEnd: true,
              capacityInItems: true,
              vehicleType: true,
              createdAt: true,
              updatedAt: true
            } 
          },
          subscription: {
            with: {
              plan: true
            }
          }
        }
      });
      
      const enrichedOrders = activeOrders.map(order => ({
        ...order,
        client: {
          ...order.client,
          phone2: order.client.phone2 || null,
          address: order.client.address || null,
          addressDetails: order.client.addressDetails || null,
          preferredPickupDays: order.client.preferredPickupDays || [],
          preferredTimeWindowStart: order.client.preferredTimeWindowStart || null,
          preferredTimeWindowEnd: order.client.preferredTimeWindowEnd || null,
          capacityInItems: order.client.capacityInItems || null,
          vehicleType: order.client.vehicleType || 'motorcycle'
        },
        subscriptionDetails: order.subscription ? {
          planName: order.subscription.plan?.name || null,
          planType: order.subscription.plan?.type || null,
          pickupsPerWeek: order.subscription.plan?.pickupsPerWeek || null,
          deliveryTimeHours: order.subscription.plan?.deliveryTimeHours || null,
          itemsIncluded: order.subscription.plan?.itemsIncluded || null,
          pricePerMonth: order.subscription.plan?.pricePerMonth || null,
        } : null,
        totalPrice: order.totalAmount ? parseFloat(order.totalAmount as unknown as string) : null,
        deposit: null,
        remainingAmount: null
      }));
      
      console.log(`✅ [ORDERS] ${enrichedOrders.length} commandes actives trouvées`);
      res.json(enrichedOrders);
    } catch (error) {
      console.error("❌ [ORDERS] Erreur /api/orders/agent-view:", error);
      res.status(500).json({ message: "Erreur interne" });
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
        clientPhone2: client.phone2,
        clientEmail: client.email,
        clientAddress: client.address,
        clientNeighborhood: client.neighborhood,
        clientAddressDetails: client.addressDetails,
        clientCapacityInItems: client.capacityInItems,
        clientVehicleType: client.vehicleType,
        clientPreferredPickupDays: client.preferredPickupDays,
        clientPreferredTimeWindowStart: client.preferredTimeWindowStart,
        clientPreferredTimeWindowEnd: client.preferredTimeWindowEnd,
        clientIsActive: client.isActive
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

  // GET /api/orders/client/:clientId
  app.get("/api/orders/client/:clientId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID client invalide" });
      }
      
      if (user.role === "client" && user.id !== clientId) {
        return res.status(403).json({ message: "Permission refusée" });
      }
      
      const clientOrders = await storage.getOrdersByClient(clientId);
      res.json(clientOrders);
    } catch (error) {
      console.error("Erreur GET /api/orders/client/:clientId:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // GET /api/orders/active
  app.get("/api/orders/active", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const activeOrders = await db.query.orders.findMany({
        where: not(eq(orders.status, "delivered")),
        orderBy: [desc(orders.createdAt)],
        with: { 
          client: { 
            columns: { 
              id: true,
              fullName: true,
              phone: true,
              phone2: true,
              email: true,
              address: true,
              neighborhood: true,
              addressDetails: true,
              isActive: true,
              preferredPickupDays: true,
              preferredTimeWindowStart: true,
              preferredTimeWindowEnd: true,
              capacityInItems: true,
              vehicleType: true
            } 
          }
        }
      });
      res.json(activeOrders);
    } catch (error) {
      console.error("Erreur GET /api/orders/active:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // ⚠️ ROUTES DYNAMIQUES (/:id) - APRÈS LES STATIQUES !
  // ═══════════════════════════════════════════════════════════════

  // GET /api/orders/:id
  app.get("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        console.warn(`⚠️ [ORDERS] ID invalide reçu: "${req.params.id}"`);
        return res.status(400).json({ message: "ID de commande invalide" });
      }
      
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          client: {
            columns: {
              id: true,
              fullName: true,
              phone: true,
              phone2: true,
              email: true,
              address: true,
              neighborhood: true,
              addressDetails: true,
              isActive: true,
              preferredPickupDays: true,
              preferredTimeWindowStart: true,
              preferredTimeWindowEnd: true,
              capacityInItems: true,
              vehicleType: true
            }
          },
          subscription: {
            with: {
              plan: true
            }
          },
          orderNotes: {
            with: {
              author: {
                columns: {
                  id: true,
                  fullName: true,
                  role: true
                }
              }
            }
          },
          statusHistory: {
            with: {
              updatedBy: {
                columns: {
                  id: true,
                  fullName: true
                }
              }
            }
          }
        }
      });
      
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      
      if (user.role === "client" && order.clientId !== user.id) {
        return res.status(403).json({ message: "Permission refusée." });
      }
      
      const enrichedOrder = {
        ...order,
        subscriptionDetails: order.subscription ? {
          planName: order.subscription.plan?.name || null,
          planType: order.subscription.plan?.type || null,
          pickupsPerWeek: order.subscription.plan?.pickupsPerWeek || null,
          deliveryTimeHours: order.subscription.plan?.deliveryTimeHours || null,
          itemsIncluded: order.subscription.plan?.itemsIncluded || null,
          pricePerMonth: order.subscription.plan?.pricePerMonth || null,
        } : null,
        totalPrice: order.totalAmount ? parseFloat(order.totalAmount as unknown as string) : null,
        deposit: null,
        remainingAmount: null
      };
      
      res.json(enrichedOrder);
    } catch (error) {
      console.error("Erreur GET /api/orders/:id:", error);
      res.status(500).json({ message: "Échec de la récupération" });
    }
  });

  // POST /api/orders
  app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const clientId = user.role === "client" ? user.id : req.body.clientId;
      const client = await storage.getUser(clientId);
      if (!client) return res.status(404).json({ message: "Client non trouvé." });
      if (!client.isActive) return res.status(403).json({ message: "Client désactivé." });

      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(eq(subscriptions.clientId, clientId), eq(subscriptions.isActive, true)),
        with: { plan: true }
      });
      if (!activeSubscription) return res.status(400).json({ message: "Pas d'abonnement actif." });

      const pickupDateValue = req.body.pickupDate ?? req.body.scheduledPickupDate;
      if (!pickupDateValue) return res.status(400).json({ message: "La date de ramassage est requise." });
      const pickupDate = new Date(pickupDateValue);
      if (isNaN(pickupDate.getTime())) return res.status(400).json({ message: "Date invalide." });

      const itemCount = Number(req.body.itemCount);
      if (!Number.isInteger(itemCount) || itemCount < 1) {
        return res.status(400).json({ message: "Le nombre d'articles doit être supérieur à zéro." });
      }

      const deliveryDelayHours = activeSubscription.plan?.deliveryTimeHours || 48;
      const deliveryDate = new Date(pickupDate);
      deliveryDate.setHours(deliveryDate.getHours() + deliveryDelayHours);

      const orderData = {
        ...req.body,
        clientId,
        subscriptionId: activeSubscription.id,
        itemCount,
        status: "to_pickup",
        scheduledPickupDate: pickupDate,
        scheduledDeliveryDate: deliveryDate,
      };

      const order = await storage.createOrder(orderData);
      try {
        await storage.addOrderStatusHistory(order.id, "to_pickup", "Commande créée", user.id);
      } catch (historyError) {
        console.error("Impossible d'enregistrer l'historique initial de la commande:", historyError);
      }
      res.status(201).json(order);
    } catch (error) {
      console.error("Erreur POST /api/orders:", error);
      res.status(500).json({ message: "Échec de la création" });
    }
  });

  // POST /api/orders/:id/request-delivery
  app.post("/api/orders/:id/request-delivery", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(orderId)) return res.status(400).json({ message: "ID de commande invalide" });
      if (user.role !== "client") return res.status(403).json({ message: "Cette action est réservée aux clients" });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      if (order.clientId !== user.id) return res.status(403).json({ message: "Permission refusée" });
      if (order.status !== "ready_to_deliver" && order.status !== "to_deliver") {
        return res.status(409).json({ message: "La commande doit être prête avant de demander sa livraison" });
      }

      const existingDelivery = await db.query.deliveries.findFirst({
        where: and(eq(deliveries.orderId, orderId), eq(deliveries.type, "delivery")),
      });
      if (existingDelivery) return res.json(existingDelivery);

      const delivery = await db.transaction(async (tx) => {
        if (order.status === "ready_to_deliver") {
          await tx.update(orders)
            .set({ status: "to_deliver", statusChangedAt: new Date(), updatedAt: new Date() })
            .where(eq(orders.id, orderId));
          await tx.insert(orderStatusHistory).values({
            orderId,
            status: "to_deliver",
            notes: "Livraison demandée par le client",
            updatedBy: user.id,
          });
        }

        const [createdDelivery] = await tx.insert(deliveries).values({
          orderId,
          type: "delivery",
          status: "pending",
          scheduledDate: order.scheduledDeliveryDate,
        }).returning();
        return createdDelivery;
      });

      return res.status(201).json(delivery);
    } catch (error) {
      console.error("Erreur POST /api/orders/:id/request-delivery:", error);
      return res.status(500).json({ message: "Impossible d'enregistrer la demande de livraison" });
    }
  });

  // PATCH /api/orders/:id
  app.patch("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalide" });

      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) return res.status(404).json({ message: "Commande non trouvée" });
      if (user.role === "client" && existingOrder.clientId !== user.id) {
        return res.status(403).json({ message: "Permission refusée." });
      }

      const updateData: any = { updatedAt: new Date() };
      const { status, itemCount, linensDetails, scheduledPickupDate, scheduledDeliveryDate, specialInstructions } = req.body;

      if (user.role === "client" && (status !== undefined || itemCount !== undefined || linensDetails !== undefined || specialInstructions !== undefined)) {
        return res.status(403).json({ message: "Vous ne pouvez modifier que les horaires de votre commande." });
      }

      if (user.role === "client" && scheduledPickupDate !== undefined && existingOrder.status !== "to_pickup") {
        return res.status(409).json({ message: "Le ramassage ne peut plus être reprogrammé à cette étape." });
      }
      if (user.role === "client" && scheduledDeliveryDate !== undefined && !["ready_to_deliver", "to_deliver"].includes(existingOrder.status)) {
        return res.status(409).json({ message: "La livraison ne peut être reprogrammée que lorsque la commande est prête." });
      }

      const allowedStatuses = ["to_pickup", "to_sort", "to_wash", "to_dry", "to_iron", "ready_to_deliver", "to_deliver", "delivered"];
      if (status !== undefined && !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut de commande invalide." });
      }

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
      if (scheduledPickupDate !== undefined) {
        const parsedDate = new Date(scheduledPickupDate);
        if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Date de ramassage invalide." });
        updateData.scheduledPickupDate = parsedDate;
      }
      if (scheduledDeliveryDate !== undefined) {
        const parsedDate = new Date(scheduledDeliveryDate);
        if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Date de livraison invalide." });
        updateData.scheduledDeliveryDate = parsedDate;
      }
      if (specialInstructions) updateData.specialInstructions = specialInstructions;

      const updated = await storage.updateOrder(id, updateData);
      if (!updated) return res.status(404).json({ message: "Commande non trouvée" });

      if (status && status !== existingOrder.status) {
        await storage.addOrderStatusHistory(id, status, undefined, user.id);
      }

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
      res.status(500).json({ message: "Erreur" });
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

  // GET /api/orders/:id/notes
  app.get("/api/orders/:id/notes", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) return res.status(400).json({ message: "ID invalide" });
      
      const notes = await db.query.orderNotes.findMany({
        where: eq(orderNotes.orderId, orderId),
        orderBy: [desc(orderNotes.createdAt)],
        with: {
          author: {
            columns: {
              id: true,
              fullName: true,
              role: true
            }
          }
        }
      });
      
      res.json(notes);
    } catch (error) {
      console.error("Erreur GET /api/orders/:id/notes:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // POST /api/orders/:id/notes
  app.post("/api/orders/:id/notes", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) return res.status(400).json({ message: "ID invalide" });
      
      const { content, noteType = "general" } = req.body;
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Le contenu de la note est requis" });
      }
      
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      
      const note = await db.insert(orderNotes).values({
        orderId,
        content: content.trim(),
        createdBy: user.id,
        noteType,
        clientId: order.clientId,
        orderStatus: order.status,
        isRead: false
      }).returning();
      
      res.status(201).json(note[0]);
    } catch (error) {
      console.error("Erreur POST /api/orders/:id/notes:", error);
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

  // ============================================================
  // ⭐ POST /api/orders/:id/report - REPORTER UNE COMMANDE ⭐
  // ============================================================
  app.post("/api/orders/:id/report", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      
      // Vérifier si l'ID est valide
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de commande invalide" 
        });
      }
      
      // Récupérer les données du signalement
      const { reason, details } = req.body;
      
      // Vérifier si le motif est fourni
      if (!reason || reason.trim() === "") {
        return res.status(400).json({ 
          success: false, 
          message: "Veuillez sélectionner un motif de signalement" 
        });
      }
      
      console.log(`📝 [REPORT] Signalement de la commande #${orderId}`);
      console.log(`📝 [REPORT] Motif: ${reason}`);
      console.log(`📝 [REPORT] Détails: ${details || 'Aucun'}`);
      console.log(`📝 [REPORT] Signalé par: ${user.fullName} (ID: ${user.id})`);
      
      // Vérifier si la commande existe
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Commande non trouvée" 
        });
      }
      
      // Vérifier les permissions
      if (user.role === "client" && order.clientId !== user.id) {
        return res.status(403).json({ 
          success: false, 
          message: "Vous n'avez pas le droit de signaler cette commande" 
        });
      }
      
      // Ajouter une note de signalement
      const noteContent = `⚠️ SIGNALEMENT: ${reason}\n\n📝 Détails: ${details || 'Non spécifié'}\n\n👤 Signalé par: ${user.fullName} (${user.email || user.phone})\n📅 Date: ${new Date().toLocaleString('fr-FR')}`;
      
      await db.insert(orderNotes).values({
        orderId: orderId,
        content: noteContent,
        createdBy: user.id,
        noteType: "report",
        clientId: order.clientId,
        orderStatus: order.status,
        isRead: false,
        createdAt: new Date()
      });
      
      console.log(`✅ [REPORT] Signalement enregistré avec succès pour la commande #${orderId}`);
      
      res.json({ 
        success: true, 
        message: "Signalement envoyé avec succès" 
      });
      
    } catch (error) {
      console.error("❌ [REPORT] Erreur lors du signalement:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erreur lors du signalement",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });
  // ============================================================
  // 📅 PATCH /api/orders/:id/reschedule
  // REPORTER UNE DATE DE RAMASSAGE
  // ============================================================
  app.patch("/api/orders/:id/reschedule", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);

      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          message: "ID de commande invalide"
        });
      }

      const { newPickupDate, reason } = req.body;

      if (!newPickupDate) {
        return res.status(400).json({
          success: false,
          message: "Nouvelle date de ramassage requise"
        });
      }

      const newDate = new Date(newPickupDate);

      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Date invalide"
        });
      }

      if (newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "La nouvelle date doit être dans le futur"
        });
      }

      console.log(`📅 [RESCHEDULE] Commande #${orderId}`);
      console.log(`📅 [RESCHEDULE] Nouvelle date: ${newDate.toISOString()}`);
      console.log(`📝 [RESCHEDULE] Motif: ${reason || "Report occasionnel"}`);

      // Récupérer la commande
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Commande non trouvée"
        });
      }

      // Vérification client
      if (user.role === "client" && order.clientId !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Permission refusée"
        });
      }

      // Mettre à jour la date
      const updated = await storage.updateOrder(orderId, {
  scheduledPickupDate: newDate
});

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Commande non trouvée"
        });
      }

      // Ajouter une note
      const noteContent =
        `📅 REPORT DE RAMASSAGE\n\n` +
        `Nouvelle date : ${newDate.toLocaleString("fr-FR")}\n` +
        `Motif : ${reason || "Report occasionnel"}\n` +
        `👤 Reporté par : ${user.fullName || user.email}\n` +
        `📅 Date de modification : ${new Date().toLocaleString("fr-FR")}`;

      await db.insert(orderNotes).values({
        orderId,
        content: noteContent,
        createdBy: user.id,
        noteType: "report",
        clientId: order.clientId,
        orderStatus: order.status,
        isRead: false,
        createdAt: new Date()
      });

      console.log(`✅ [RESCHEDULE] Commande #${orderId} reportée avec succès`);

      return res.json(updated);

    } catch (error) {
      console.error("❌ [RESCHEDULE] Erreur:", error);

      return res.status(500).json({
        success: false,
        message: "Erreur lors du report de la commande",
        error: error instanceof Error
          ? error.message
          : "Erreur inconnue"
      });
    }
  });
  // ============================================================
  // 🧪 TEST - Vérifier si la route est accessible
  // ============================================================
  app.get("/api/orders/test-report", requireAuth, (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: "Route test reporter accessible!",
      user: (req as any).user?.fullName || "Inconnu"
    });
  });

  console.log("✅ [ORDERS] Routes chargées avec succès !");
}
