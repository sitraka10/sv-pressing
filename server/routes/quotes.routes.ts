// server/routes/quotes.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertCustomQuoteSchema } from "../../shared/schema";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";

export default function quoteRoutes(app: Express) {
  // GET /api/custom-quotes
  app.get("/api/custom-quotes", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getCustomQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Échec" });
    }
  });

  // POST /api/custom-quotes
  app.post("/api/custom-quotes", async (req: Request, res: Response) => {
    try {
      const validated = insertCustomQuoteSchema.parse(req.body);
      const quote = await storage.createCustomQuote(validated);
      await storage.createNotification({
        userId: 1, type: "new_quote",
        title: "Nouveau devis personnalisé", message: `Demande de ${quote.fullName} reçue.`, quoteId: quote.id
      });
      res.status(201).json({ success: true, data: quote, message: "Devis créé avec succès" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: "Données invalides", errors: error.errors });
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  // PATCH /api/custom-quotes/:id/status
  app.patch("/api/custom-quotes/:id/status", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const quote = await storage.updateCustomQuoteStatus(parseInt(req.params.id), req.body.status);
      if (!quote) return res.status(404).json({ message: "Devis non trouvé" });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Échec" });
    }
  });
}