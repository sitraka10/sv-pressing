// server/routes/notifications.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { deviceTokenStore } from "../deviceTokens";
import { insertNotificationSchema } from "../../shared/schema";
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

export default function notificationRoutes(app: Express) {
  // GET /api/notifications
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const notifs = await storage.getNotificationsByUser(user.id);
      const formatted = notifs.map(n => ({
        id: n.id, user_id: n.userId, type: n.type, title: n.title,
        message: n.message, is_read: n.isRead, order_id: n.orderId,
        quote_id: n.quoteId, client_id: n.clientId, created_at: n.createdAt
      }));
      res.json(formatted);
    } catch (error) {
      console.error("Erreur GET /api/notifications:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // GET /api/notifications/my
  app.get("/api/notifications/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const notifs = await storage.getNotificationsByUser(user.id);
      res.json(notifs);
    } catch (error) {
      console.error("Erreur GET /api/notifications/my:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // POST /api/notifications
  app.post("/api/notifications", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const validated = insertNotificationSchema.parse(req.body);
      const notif = await storage.createNotification(validated);
      res.status(201).json(notif);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Données invalides", errors: error.errors });
      console.error("Erreur POST /api/notifications:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // PATCH /api/notifications/:id/read
  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      await storage.markNotificationAsRead(parseInt(req.params.id), user.id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Erreur PATCH /api/notifications/:id/read:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // PATCH /api/notifications/read-all
  app.patch("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      await storage.markAllNotificationsAsRead(user.id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Erreur PATCH /api/notifications/read-all:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // GET /api/devices/mine
  app.get("/api/devices/mine", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const tokens = await deviceTokenStore.getByUserId(user.id);
      res.json({ userId: user.id, tokens });
    } catch (error) {
      console.error("Erreur GET /api/devices/mine:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // POST /api/devices/register
  app.post("/api/devices/register", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const { token, platform } = req.body || {};
      if (!token || (platform !== "ios" && platform !== "android")) {
        return res.status(400).json({ message: "token et platform requis" });
      }
      deviceTokenStore.upsert({ token, userId: user.id, platform });
      res.json({ success: true, token, platform, userId: user.id, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Erreur POST /api/devices/register:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // DELETE /api/devices/current
  app.delete("/api/devices/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const token = req.body?.token || req.header("x-device-token") || null;
      if (token) {
        const ok = deviceTokenStore.remove(token, user.id);
        return ok ? res.json({ success: true, removed: token }) : res.status(404).json({ success: false, message: "Token non trouvé" });
      }
      const removedCount = deviceTokenStore.removeAllForUser(user.id);
      res.json({ success: true, removedCount });
    } catch (error) {
      console.error("Erreur DELETE /api/devices/current:", error);
      res.status(500).json({ message: "Échec" });
    }
  });
// DELETE /api/devices/:token
app.delete("/api/devices/:token", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const token = req.params.token;
    
    // ✅ CORRECTION : getByUserId retourne un tableau de strings (tokens)
    const userTokens = await deviceTokenStore.getByUserId(user.id);
    const existingToken = userTokens.find(t => t === token);
    
    if (!existingToken) {
      return res.status(404).json({ success: false, message: "Token non trouvé" });
    }
    
    deviceTokenStore.remove(token, user.id);
    res.json({ success: true, removed: token });
  } catch (error) {
    console.error("Erreur DELETE /api/devices/:token:", error);
    res.status(500).json({ message: "Échec" });
  }
});
}