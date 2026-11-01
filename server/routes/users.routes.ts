// server/routes/users.routes.ts - VERSION COMPLÈTE
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ============================================================
// SCHEMA DE VALIDATION
// ============================================================

const updateUserSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
  vehicleType: z.string().optional(),
  capacityInItems: z.number().optional(),
  neighborhood: z.string().optional().nullable(),
  addressDetails: z.string().optional().nullable(),
  preferredPickupDays: z.array(z.string()).optional(),
  preferredTimeWindowStart: z.string().optional(),
  preferredTimeWindowEnd: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(["admin", "supervisor", "agent", "delivery", "client"]).optional(),
  status: z.enum(["pending", "approved", "refused"]).optional(),
}).transform(data => ({
  ...data,
  phone2: data.phone2 === "" ? null : data.phone2,
  address: data.address === "" ? null : data.address,
  neighborhood: data.neighborhood === "" ? null : data.neighborhood,
  addressDetails: data.addressDetails === "" ? null : data.addressDetails,
}));

// ============================================================
// ROUTES
// ============================================================
export default function userRoutes(app: Express) {
  
  // ============================================================
  // GET /api/users
  // Récupérer tous les utilisateurs
  // ============================================================
  app.get("/api/users", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getUsers();
      // Ne pas retourner les mots de passe
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Erreur GET /api/users:", error);
      res.status(500).json({ message: "Échec de la récupération des utilisateurs", error: error.message });
    }
  });

  // ============================================================
  // GET /api/users/:id/full
  // Récupérer toutes les infos d'un utilisateur
  // ============================================================
  app.get("/api/users/:id/full", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Vérifier les permissions
      const currentUser = (req as any).user;
      if (currentUser.role !== "admin" && currentUser.role !== "supervisor" && currentUser.id !== userId) {
        return res.status(403).json({ message: "Permission refusée" });
      }
      
      // Retourner toutes les informations (sans le mot de passe)
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur GET /api/users/:id/full:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // GET /api/users/:id
  // Récupérer un utilisateur spécifique
  // ============================================================
  app.get("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Vérifier les permissions
      const currentUser = (req as any).user;
      if (currentUser.role !== "admin" && currentUser.role !== "supervisor" && currentUser.id !== userId) {
        return res.status(403).json({ message: "Permission refusée" });
      }
      
      // Retourner les informations (sans le mot de passe)
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur GET /api/users/:id:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // POST /api/users
  // Créer un utilisateur
  // ============================================================
  app.post("/api/users", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      if (req.body.password) {
        req.body.password = await hashPassword(req.body.password);
      }
      const newUser = await storage.createUser(req.body);
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur POST /api/users:", error);
      res.status(500).json({ message: "Échec de la création de l'utilisateur" });
    }
  });

  // ============================================================
  // PATCH /api/users/:id
  // Mettre à jour un utilisateur
  // ============================================================
  app.patch("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validated = updateUserSchema.parse(req.body);
      const currentUser = (req as any).user;
      const canManageUsers = currentUser.role === "admin" || currentUser.role === "supervisor";

      if (!canManageUsers && currentUser.id !== id) {
        return res.status(403).json({ message: "Permission refusée" });
      }
      if (!canManageUsers && (validated.role !== undefined || validated.status !== undefined || validated.isActive !== undefined)) {
        return res.status(403).json({ message: "Vous ne pouvez pas modifier les rôles ou le statut d'un compte." });
      }
      if (currentUser.role === "supervisor" && (validated.role !== undefined || validated.status !== undefined || validated.isActive !== undefined)) {
        return res.status(403).json({ message: "Seul un administrateur peut modifier les rôles et le statut des comptes." });
      }
      
      const updates: any = {};
      const fields = ["fullName", "phone", "phone2", "email", "neighborhood", "addressDetails", "preferredPickupDays", "isActive", "preferredTimeWindowStart", "preferredTimeWindowEnd", "vehicleType", "capacityInItems", "role"] as const;
      
      fields.forEach(f => {
        if (validated[f] !== undefined) {
          updates[f] = validated[f];
        }
      });
      
      if (validated.status) {
        updates.status = validated.status;
        updates.isActive = validated.status === "approved";
      }
      
      const updated = await storage.updateUser(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation échouée", errors: e.errors });
      }
      console.error("Erreur PATCH /api/users/:id:", e);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // PATCH /api/users/:id/password
  // Changer le mot de passe
  // ============================================================
  app.patch("/api/users/:id/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const targetId = parseInt(req.params.id);
      const { newPassword, currentPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Mot de passe trop court (minimum 6 caractères)" });
      }
      
      const target = await storage.getUser(targetId);
      if (!target) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const currentUser = (req as any).user;
      const isAdmin = currentUser.role === "admin";
      const isSelf = currentUser.id === targetId;
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({ message: "Permission refusée" });
      }
      
      if (!isAdmin) {
        const isMatch = await bcrypt.compare(currentPassword, target.password);
        if (!isMatch) {
          return res.status(401).json({ message: "Mot de passe actuel incorrect" });
        }
      }
      
      const hashed = await hashPassword(newPassword);
      await storage.updateUser(targetId, { password: hashed });
      res.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (e) {
      console.error("Erreur PATCH /api/users/:id/password:", e);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // PATCH /api/users/:id/toggle-status
  // Activer/Désactiver un utilisateur
  // ============================================================
  app.patch("/api/users/:id/toggle-status", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const updated = await storage.updateUser(userId, { isActive: !user.isActive });
      if (!updated) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur PATCH /api/users/:id/toggle-status:", error);
      res.status(500).json({ message: "Échec du changement de statut" });
    }
  });

  // ============================================================
  // GET /api/clients
  // Récupérer tous les clients
  // ============================================================
  app.get("/api/clients", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const clients = await storage.getUsersByRole("client");
      // Ne pas retourner les mots de passe
      const clientsWithoutPasswords = clients.map(({ password, ...client }) => client);
      res.json(clientsWithoutPasswords);
    } catch (error) {
      console.error("Erreur GET /api/clients:", error);
      res.status(500).json({ message: "Échec de la récupération des clients" });
    }
  });

  // ============================================================
  // GET /api/clients/:id
  // Récupérer un client spécifique
  // ============================================================
  app.get("/api/clients/:id", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID client invalide" });
      }
      
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      if (client.role !== "client") {
        return res.status(400).json({ message: "L'utilisateur n'est pas un client" });
      }
      
      const { password, ...clientWithoutPassword } = client;
      res.json(clientWithoutPassword);
    } catch (error) {
      console.error("Erreur GET /api/clients/:id:", error);
      res.status(500).json({ message: "Échec de la récupération du client" });
    }
  });

  // ============================================================
  // POST /api/clients
  // Créer un client
  // ============================================================
  app.post("/api/clients", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const { fullName, phone, email, phone2, neighborhood, addressDetails, preferredPickupDays, address, capacityInItems, vehicleType } = req.body;
      
      if (!fullName || !phone || !neighborhood) {
        return res.status(400).json({ message: "Champs requis manquants: fullName, phone, neighborhood" });
      }
      
      // Générer un nom d'utilisateur unique
      const username = fullName
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "")
        .substring(0, 20);
      
      let finalUsername = username;
      let counter = 1;
      
      while (await storage.getUserByUsername(finalUsername)) {
        finalUsername = `${username}${counter}`;
        counter++;
      }
      
      const hashed = await hashPassword("password123");
      
      const client = await storage.createUser({
        username: finalUsername,
        password: hashed,
        email: email || `${finalUsername}@svpressing.mg`,
        fullName,
        phone,
        phone2: phone2 || null,
        neighborhood,
        addressDetails: addressDetails || null,
        address: address || null,
        capacityInItems: capacityInItems || null,
        vehicleType: vehicleType || "motorcycle",
        role: "client",
        isActive: true,
        preferredPickupDays: preferredPickupDays || []
      });
      
      const { password, ...clientWithoutPassword } = client;
      res.status(201).json(clientWithoutPassword);
    } catch (error) {
      console.error("Erreur POST /api/clients:", error);
      res.status(500).json({ message: "Échec de la création du client" });
    }
  });

  // ============================================================
  // DELETE /api/clients/:id (soft delete)
  // Désactiver un client avec vérification des commandes
  // ============================================================
  app.delete("/api/clients/:id", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // 1. Vérifier si le client existe
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      // 2. Récupérer toutes les commandes du client
      const clientOrders = await storage.getOrdersByClient(clientId);
      
      // 3. Vérifier les commandes en cours (statut != delivered et != to_pickup)
      const activeOrders = clientOrders.filter(order => 
        order.status !== 'delivered' && order.status !== 'to_pickup'
      );
      
      if (activeOrders.length > 0) {
        const orderNumbers = activeOrders.map(o => `#${o.id}`).join(', ');
        return res.status(400).json({ 
          message: `Impossible de désactiver ce client. Il a ${activeOrders.length} commande${activeOrders.length > 1 ? 's' : ''} en cours (${orderNumbers}).` 
        });
      }
      
      // 4. Vérifier les commandes à ramasser (to_pickup)
      const pickupOrders = clientOrders.filter(order => order.status === 'to_pickup');
      if (pickupOrders.length > 0) {
        const orderNumbers = pickupOrders.map(o => `#${o.id}`).join(', ');
        return res.status(400).json({ 
          message: `Impossible de désactiver ce client. Il a ${pickupOrders.length} ramassage${pickupOrders.length > 1 ? 's' : ''} prévu${pickupOrders.length > 1 ? 's' : ''} (${orderNumbers}).` 
        });
      }
      
      // 5. Désactiver le client
      const updated = await storage.updateUser(clientId, { isActive: false });
      if (!updated) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      // 6. Ajouter une trace dans l'historique
      const currentUser = (req as any).user;
      await storage.addUserActionHistory(
        clientId, 
        'client_deactivated', 
        `Client désactivé par ${currentUser.fullName} (ID: ${currentUser.id})`,
        currentUser.id
      );
      
      const { password, ...clientWithoutPassword } = updated;
      res.json({ 
        message: "Client désactivé avec succès", 
        client: clientWithoutPassword 
      });
    } catch (error) {
      console.error("Erreur désactivation client:", error);
      res.status(500).json({ message: "Échec de la désactivation du client" });
    }
  });

  // ============================================================
  // GET /api/users/delivery-persons
  // Récupérer tous les livreurs
  // ============================================================
  app.get("/api/users/delivery-persons", requireRole(["admin", "supervisor", "agent"]), async (req: Request, res: Response) => {
    try {
      const delivery = await storage.getUsersByRole("delivery");
      const deliveryWithoutPasswords = delivery.map(({ password, ...user }) => user);
      res.json(deliveryWithoutPasswords);
    } catch (error) {
      console.error("Erreur GET /api/users/delivery-persons:", error);
      res.status(500).json({ message: "Échec de la récupération des livreurs" });
    }
  });

  // ============================================================
  // GET /api/users/exists?phone=
  // Vérifier si un numéro de téléphone existe
  // ============================================================
  app.get("/api/users/exists", async (req: Request, res: Response) => {
    try {
      const phone = (req.query.phone as string || "").trim();
      if (!phone) {
        return res.status(400).json({ message: "Paramètre phone requis" });
      }
      
      const all = await storage.getUsers();
      const norm = (p: string | null | undefined) => (p || "").replace(/\s+/g, "").replace(/-/g, "").toLowerCase();
      const target = norm(phone);
      const exists = all.some((u: any) => norm(u.phone) === target || norm(u.phone2) === target);
      
      res.json({ exists });
    } catch (error) {
      console.error("Erreur GET /api/users/exists:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ============================================================
  // PATCH /api/user/profile
  // Mettre à jour le profil de l'utilisateur connecté
  // ============================================================
  app.patch("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      
      const updated = await storage.updateUser(currentUser.id, {
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        phone2: req.body.phone2 || null,
        address: req.body.address,
        preferredPickupDay: req.body.preferredPickupDay || null,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur PATCH /api/user/profile:", error);
      res.status(500).json({ message: "Échec de la mise à jour du profil" });
    }
  });
}
