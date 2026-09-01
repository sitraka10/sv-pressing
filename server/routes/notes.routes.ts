// server/routes/notes.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { orderNotes, clientNotesHistory, orders, users } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { insertOrderNoteSchema } from "../../shared/schema";
import { requireAuth } from "../middleware/auth.middleware";

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

async function archiveNoteToClientHistory(noteId: number, orderId: number, clientId: number) {
  try {
    const note = await db.select().from(orderNotes).where(eq(orderNotes.id, noteId)).limit(1);
    if (note.length > 0) {
      const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      await db.insert(clientNotesHistory).values({
        clientId, orderId, noteId, content: note[0].content,
        noteType: note[0].noteType || "general", createdBy: note[0].createdBy,
        orderStatus: order.length > 0 ? order[0].status : null, createdAt: new Date()
      });
    }
  } catch (error) {
    console.error("Erreur archivage note:", error);
  }
}

export default function noteRoutes(app: Express) {
  // GET /api/orders/:id/notes
  app.get("/api/orders/:id/notes", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      if (user.role === "client" && order.clientId !== user.id) return res.status(403);
      const notes = await db.query.orderNotes.findMany({
        where: eq(orderNotes.orderId, orderId),
        orderBy: [desc(orderNotes.createdAt)],
        with: { author: { columns: { id: true, fullName: true } } }
      });
      const formatted = notes.map(n => ({
        id: n.id, orderId: n.orderId, content: n.content,
        createdAt: n.createdAt.toISOString(), createdBy: n.createdBy?.toString() || "0",
        author: n.author ? { fullName: n.author.fullName } : undefined,
        isRead: n.isRead || false, noteType: n.noteType || "general"
      }));
      res.json(formatted);
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
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      if (user.role === "client" && order.clientId !== user.id) return res.status(403);
      const { content, noteType, mentions } = req.body;
      if (!content || content.trim().length === 0) return res.status(400).json({ message: "Contenu requis" });
      const noteData: any = { 
        orderId, 
        content: content.trim(), 
        createdBy: user.id, 
        clientId: order.clientId, 
        noteType: noteType || "general", 
        orderStatus: order.status, 
        mentions: mentions || [] 
      };
      const validated = insertOrderNoteSchema ? insertOrderNoteSchema.parse(noteData) : noteData;
      const note = await storage.createOrderNote(validated);
      await archiveNoteToClientHistory(note.id, orderId, order.clientId);
      if (mentions && Array.isArray(mentions)) {
        for (const mentionedUserId of mentions) {
          await storage.createNotification({
            userId: mentionedUserId, 
            type: "order_update",
            title: "Vous avez été mentionné", 
            message: `${user.fullName} vous a mentionné dans la commande #${orderId}`, 
            orderId
          });
        }
      }
      res.status(201).json(note);
    } catch (error) {
      console.error("Erreur POST /api/orders/:id/notes:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // DELETE /api/orders/:orderId/notes/:noteId
  app.delete("/api/orders/:orderId/notes/:noteId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const note = await db.query.orderNotes.findFirst({ where: eq(orderNotes.id, parseInt(req.params.noteId)) });
      if (!note) return res.status(404).json({ message: "Note non trouvée" });
      if (note.createdBy !== user.id && user.role !== "admin") return res.status(403);
      const success = await storage.deleteOrderNote(parseInt(req.params.noteId));
      if (!success) return res.status(500).json({ message: "Échec suppression" });
      res.json({ message: "Note supprimée" });
    } catch (error) {
      console.error("Erreur DELETE /api/orders/:orderId/notes/:noteId:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // PATCH /api/orders/:orderId/notes/:noteId/read
  app.patch("/api/orders/:orderId/notes/:noteId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const success = await storage.markNoteAsRead(parseInt(req.params.noteId), user.id);
      if (!success) return res.status(404).json({ message: "Note non trouvée" });
      res.json({ message: "Note marquée comme lue" });
    } catch (error) {
      console.error("Erreur PATCH /api/orders/:orderId/notes/:noteId/read:", error);
      res.status(500).json({ message: "Échec" });
    }
  });

  // GET /api/clients/:id/notes-history
  app.get("/api/clients/:id/notes-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      const history = await db.select().from(clientNotesHistory).where(eq(clientNotesHistory.clientId, clientId)).orderBy(desc(clientNotesHistory.createdAt));
      const enriched = await Promise.all(history.map(async (note) => {
        const author = await db.select().from(users).where(eq(users.id, note.createdBy)).limit(1);
        return { ...note, authorName: author.length > 0 ? author[0].fullName : "Inconnu" };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Erreur GET /api/clients/:id/notes-history:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
}