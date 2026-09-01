// server/routes/contracts.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { 
  contracts, 
  contractTemplates, 
  contractVersions,
  users, 
  subscriptions, 
  subscriptionPlans
} from "../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { insertContractSchema, updateContractSchema } from "../../shared/schema";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";
import { generateContractPdf } from "../pdf-contract";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ✅ CORRECTION : Utiliser un type helper au lieu de redéclarer
// Ne pas étendre Request avec 'user' car il est déjà déclaré ailleurs

// Définir le type AuthUser localement
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

// ✅ Fonction helper pour typer req.user sans conflit
function getUser(req: Request): AuthUser {
  return req.user as AuthUser;
}

// Template par défaut
const DEFAULT_CONTRACT_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Contrat d'abonnement - {{clientName}}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #666; }
        .content { margin: 30px 0; }
        .clause { margin-bottom: 20px; }
        .clause-title { font-weight: bold; margin-bottom: 10px; }
        .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 250px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 10px; }
        .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">CONTRAT D'ABONNEMENT</div>
        <div class="subtitle">N° {{contractNumber}} - {{issueDate}}</div>
    </div>
    
    <div class="content">
        <p>Entre les soussignés :</p>
        
        <div class="clause">
            <div class="clause-title">1. Parties contractantes</div>
            <p><strong>Le Prestataire :</strong> SV Pressing Madagascar<br>
            Représenté par La Direction<br>
            Antananarivo, Madagascar</p>
            
            <p><strong>Le Client :</strong> {{clientName}}<br>
            Email : {{clientEmail}}<br>
            Téléphone : {{clientPhone}}<br>
            Adresse : {{clientAddress}}</p>
        </div>
        
        <div class="clause">
            <div class="clause-title">2. Objet du contrat</div>
            <p>Le prestataire s'engage à fournir au client le service d'abonnement suivant : <strong>{{planName}}</strong>.</p>
            <p>Description : {{planDescription}}</p>
        </div>
        
        <div class="clause">
            <div class="clause-title">3. Tarifs et conditions de paiement</div>
            <table>
                <tr><th>Type</th><th>Montant</th><th>Périodicité</th></tr>
                <tr><td>Abonnement mensuel</td><td>{{planPrice}} Ar</td><td>Mensuelle</td></tr>
                <tr><td>Frais d'activation</td><td>{{activationFee}} Ar</td><td>Unique</td></tr>
            </table>
            <p>Le paiement est dû avant le 15 de chaque mois.</p>
        </div>
        
        <div class="clause">
            <div class="clause-title">4. Durée et résiliation</div>
            <p>Le présent contrat est conclu pour une durée d'un an à compter du {{startDate}}, renouvelable par tacite reconduction.</p>
            <p>La résiliation doit être notifiée par écrit au moins 30 jours avant la date d'échéance.</p>
        </div>
        
        <div class="clause">
            <div class="clause-title">5. Obligations des parties</div>
            <p><strong>Le prestataire s'engage à :</strong></p>
            <ul>
                <li>Fournir le service conformément aux spécifications</li>
                <li>Assurer une disponibilité du service</li>
                <li>Respecter la confidentialité des données</li>
            </ul>
            <p><strong>Le client s'engage à :</strong></p>
            <ul>
                <li>Payer les factures dans les délais impartis</li>
                <li>Utiliser le service conformément aux conditions générales</li>
                <li>Informer le prestataire de tout changement de situation</li>
            </ul>
        </div>
        
        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line">Signature du prestataire</div>
                <div>Le {{signatureDate}}</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Signature du client</div>
                <div>Lu et approuvé</div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Fait à Antananarivo, le {{signatureDate}}</p>
        <p>Original en deux exemplaires</p>
    </div>
</body>
</html>`;

// Fonction utilitaire pour générer le contenu du contrat
const generateContractContent = async (data: {
  contractNumber: string;
  clientId: number;
  subscriptionId?: number | null;
  templateId?: number | null;
  startDate: Date;
  endDate?: Date | null;
  title: string;
}) => {
  const client = await storage.getUser(data.clientId);
  let subscription = null;
  let plan = null;
  
  if (data.subscriptionId) {
    subscription = await storage.getSubscription(data.subscriptionId);
    if (subscription) {
      plan = await storage.getSubscriptionPlan(subscription.planId);
    }
  }
  
  let template = null;
  if (data.templateId) {
    template = await db.query.contractTemplates.findFirst({
      where: eq(contractTemplates.id, data.templateId)
    });
  }
  
  const templateContent = template?.templateContent || DEFAULT_CONTRACT_TEMPLATE;
  
  // Remplacer les variables
  const replacements: Record<string, string> = {
    contractNumber: data.contractNumber,
    clientName: client?.fullName || "Client",
    clientEmail: client?.email || "N/A",
    clientPhone: client?.phone || "N/A",
    clientAddress: client?.address || "Non renseignée",
    planName: plan?.name || "Non spécifié",
    planPrice: plan?.pricePerMonth ? String(plan.pricePerMonth) : "0",
    planDescription: plan?.description || "",
    startDate: format(data.startDate, "dd MMMM yyyy", { locale: fr }),
    endDate: data.endDate
      ? format(data.endDate, "dd MMMM yyyy", { locale: fr })
      : "Sans date d'expiration",
    dueDate: format(
      new Date(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        15
      ),
      "dd MMMM yyyy",
      { locale: fr }
    ),
    issueDate: format(new Date(), "dd MMMM yyyy", { locale: fr }),
    signatureDate: format(new Date(), "dd MMMM yyyy", { locale: fr }),
    activationFee: "0",
  };
  
  let content = templateContent;
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  
  return content;
};

export default function contractRoutes(app: Express) {
  
  // ==================== TEMPLATES ====================
  
  // GET /api/contracts/templates - Liste des templates
  app.get("/api/contracts/templates", requireAuth, async (req: Request, res: Response) => {
    try {
      const templates = await db
        .select()
        .from(contractTemplates)
        .orderBy(desc(contractTemplates.createdAt));
      
      res.json(templates);
    } catch (error) {
      console.error("Erreur récupération templates:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des templates"
      });
    }
  });
  
  // GET /api/contracts/templates/:id - Template par ID
  app.get("/api/contracts/templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await db.query.contractTemplates.findFirst({
        where: eq(contractTemplates.id, id)
      });
      
      if (!template) {
        return res.status(404).json({
          message: "Template non trouvé"
        });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Erreur récupération template:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération du template"
      });
    }
  });
  
  // POST /api/contracts/templates - Créer un template (admin seulement)
  app.post("/api/contracts/templates", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      
      const templateData = {
        ...req.body,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [newTemplate] = await db
        .insert(contractTemplates)
        .values(templateData)
        .returning();
      
      res.status(201).json({
        success: true,
        data: newTemplate
      });
    } catch (error: any) {
      console.error("Erreur création template:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la création du template"
      });
    }
  });
  
  // PATCH /api/contracts/templates/:id - Modifier un template (admin seulement)
  app.patch("/api/contracts/templates/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const updates = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      const [updated] = await db
        .update(contractTemplates)
        .set(updates)
        .where(eq(contractTemplates.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({
          message: "Template non trouvé"
        });
      }
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error: any) {
      console.error("Erreur modification template:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la modification"
      });
    }
  });
  
  // DELETE /api/contracts/templates/:id - Supprimer un template (admin seulement)
  app.delete("/api/contracts/templates/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      await db
        .delete(contractTemplates)
        .where(eq(contractTemplates.id, id));
      
      res.json({
        success: true,
        message: "Template supprimé"
      });
    } catch (error) {
      console.error("Erreur suppression template:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression"
      });
    }
  });
  
  // ==================== CONTRATS ====================
  
  // GET /api/contracts - Liste des contrats
  app.get("/api/contracts", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      let result;
      
      if (user.role === "client") {
        result = await db
          .select()
          .from(contracts)
          .where(eq(contracts.clientId, user.id))
          .orderBy(desc(contracts.createdAt));
      } else {
        result = await db
          .select()
          .from(contracts)
          .orderBy(desc(contracts.createdAt));
      }
      
      // Enrichir avec les infos client et abonnement
      const enriched = await Promise.all(
        result.map(async (contract) => {
          const client = await storage.getUser(contract.clientId);
          const subscription = contract.subscriptionId
            ? await storage.getSubscription(contract.subscriptionId)
            : null;
          
          let plan = null;
          if (subscription) {
            plan = await storage.getSubscriptionPlan(subscription.planId);
          }
          
          return {
            ...contract,
            clientName: client?.fullName || "Inconnu",
            clientEmail: client?.email,
            clientPhone: client?.phone,
            planName: plan?.name || null,
            planPrice: plan?.pricePerMonth || null,
          };
        })
      );
      
      res.json(enriched);
    } catch (error) {
      console.error("Erreur récupération contrats:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des contrats"
      });
    }
  });
  
  // GET /api/contracts/:id - Détail d'un contrat
  app.get("/api/contracts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, id)
      });
      
      if (!contract) {
        return res.status(404).json({
          message: "Contrat non trouvé"
        });
      }
      
      const user = getUser(req);
      
      if (user.role !== "admin" && contract.clientId !== user.id) {
        return res.status(403).json({
          message: "Accès refusé"
        });
      }
      
      const client = await storage.getUser(contract.clientId);
      const subscription = contract.subscriptionId
        ? await storage.getSubscription(contract.subscriptionId)
        : null;
      
      let plan = null;
      
      if (subscription) {
        plan = await storage.getSubscriptionPlan(subscription.planId);
      }
      
      const versions = await db
        .select()
        .from(contractVersions)
        .where(eq(contractVersions.contractId, id))
        .orderBy(desc(contractVersions.version));
      
      res.json({
        ...contract,
        clientName: client?.fullName,
        clientEmail: client?.email,
        clientPhone: client?.phone,
        clientAddress: client?.address,
        planName: plan?.name,
        planPrice: plan?.pricePerMonth,
        versions,
      });
    } catch (error) {
      console.error("Erreur récupération contrat:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération du contrat"
      });
    }
  });
  
  // POST /api/contracts - Créer un contrat
  app.post("/api/contracts", requireRole(["admin", "supervisor"]), async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      
      const contractNumber =
        req.body.contractNumber ||
        `CON-${format(new Date(), "yyyyMMdd")}-${Date.now()}`;
      
      const startDate = req.body.startDate
        ? new Date(req.body.startDate)
        : new Date();
      
      const endDate = req.body.endDate
        ? new Date(req.body.endDate)
        : null;
      
      // Générer le contenu
      const content = await generateContractContent({
        contractNumber,
        clientId: req.body.clientId,
        subscriptionId: req.body.subscriptionId,
        templateId: req.body.templateId,
        startDate,
        endDate,
        title: req.body.title,
      });
      
      const contractData = {
        contractNumber,
        clientId: req.body.clientId,
        subscriptionId: req.body.subscriptionId || null,
        title: req.body.title,
        content,
        startDate,
        endDate,
        status: req.body.status || "draft",
        isAutoRenew: req.body.isAutoRenew ?? true,
        notes: req.body.notes || null,
        terms: req.body.terms || null,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [newContract] = await db
        .insert(contracts)
        .values(contractData)
        .returning();
      
      res.status(201).json({
        success: true,
        data: newContract
      });
    } catch (error: any) {
      console.error("Erreur création contrat:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la création"
      });
    }
  });
  
  // PATCH /api/contracts/:id - Modifier un contrat
  app.patch("/api/contracts/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = getUser(req);
      
      const oldContract = await db.query.contracts.findFirst({
        where: eq(contracts.id, id)
      });
      
      if (!oldContract) {
        return res.status(404).json({
          message: "Contrat non trouvé"
        });
      }
      
      // Sauvegarder la version précédente si le contenu change
      if (req.body.content || req.body.title) {
        const currentVersions = await db
          .select()
          .from(contractVersions)
          .where(eq(contractVersions.contractId, id));
        
        const nextVersion = currentVersions.length + 1;
        
        await db.insert(contractVersions).values({
          contractId: id,
          version: nextVersion,
          content: oldContract.content,
          changes: req.body.versionNotes || "Modification du contrat",
          modifiedBy: user.id,
          modifiedAt: new Date(),
        });
      }
      
      const updates = {
        ...req.body,
        updatedAt: new Date(),
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        endDate: req.body.endDate
          ? new Date(req.body.endDate)
          : undefined,
        signedDate: req.body.signedDate
          ? new Date(req.body.signedDate)
          : undefined,
        cancelledDate: req.body.cancelledDate
          ? new Date(req.body.cancelledDate)
          : undefined,
      };
      
      const [updated] = await db
        .update(contracts)
        .set(updates)
        .where(eq(contracts.id, id))
        .returning();
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error: any) {
      console.error("Erreur modification contrat:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la modification"
      });
    }
  });
  
  // POST /api/contracts/:id/sign - Signature électronique
  app.post("/api/contracts/:id/sign", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const {
        signatureData,
        signatureType = "electronic"
      } = req.body;
      
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, id)
      });
      
      if (!contract) {
        return res.status(404).json({
          message: "Contrat non trouvé"
        });
      }
      
      const user = getUser(req);
      const isClient = contract.clientId === user.id;
      const isAdmin = user.role === "admin";
      
      if (!isClient && !isAdmin) {
        return res.status(403).json({
          message: "Seul le client ou un admin peut signer"
        });
      }
      
      const updates: any = {
        status: "signed",
        signedDate: new Date(),
        signatureType,
        signatureIp: req.ip,
        signatureUserAgent: req.headers["user-agent"],
      };
      
      if (isClient) {
        updates.clientSignature = signatureData;
      } else {
        updates.companySignature = signatureData;
      }
      
      const [updated] = await db
        .update(contracts)
        .set(updates)
        .where(eq(contracts.id, id))
        .returning();
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error: any) {
      console.error("Erreur signature contrat:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la signature"
      });
    }
  });
  
  // POST /api/contracts/:id/upload-signed - Upload PDF signé
  app.post("/api/contracts/:id/upload-signed", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { signedDocumentUrl } = req.body;
      
      const [updated] = await db
        .update(contracts)
        .set({
          signedDocumentUrl,
          status: "signed",
          signedDate: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error: any) {
      console.error("Erreur upload contrat signé:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de l'upload"
      });
    }
  });
  
  // GET /api/contracts/:id/download-pdf - Télécharger PDF
  app.get("/api/contracts/:id/download-pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, id)
      });
      
      if (!contract) {
        return res.status(404).json({
          message: "Contrat non trouvé"
        });
      }
      
      const user = getUser(req);
      
      if (user.role !== "admin" && contract.clientId !== user.id) {
        return res.status(403).json({
          message: "Accès refusé"
        });
      }
      
      const client = await storage.getUser(contract.clientId);
      
      let subscription = null;
      let plan = null;
      
      if (contract.subscriptionId) {
        subscription = await storage.getSubscription(contract.subscriptionId);
        
        if (subscription) {
          plan = await storage.getSubscriptionPlan(subscription.planId);
        }
      }
      
      const pdfBuffer = await generateContractPdf(
        client,
        subscription,
        plan,
        contract.content
      );
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="contrat_${contract.contractNumber}.pdf"`
      );
      res.setHeader(
        "Content-Length",
        pdfBuffer.length.toString()
      );
      
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Erreur génération PDF contrat:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la génération du PDF"
      });
    }
  });
  
  // GET /api/contracts/:id/preview - Prévisualisation
  app.get("/api/contracts/:id/preview", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, id)
      });
      
      if (!contract) {
        return res.status(404).json({
          message: "Contrat non trouvé"
        });
      }
      
      const user = getUser(req);
      
      if (user.role !== "admin" && contract.clientId !== user.id) {
        return res.status(403).json({
          message: "Accès refusé"
        });
      }
      
      const client = await storage.getUser(contract.clientId);
      
      let subscription = null;
      let plan = null;
      
      if (contract.subscriptionId) {
        subscription = await storage.getSubscription(contract.subscriptionId);
        
        if (subscription) {
          plan = await storage.getSubscriptionPlan(subscription.planId);
        }
      }
      
      const pdfBuffer = await generateContractPdf(
        client,
        subscription,
        plan,
        contract.content
      );
      
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Erreur prévisualisation contrat:", error);
      res.status(500).json({
        message: error.message || "Erreur lors de la prévisualisation"
      });
    }
  });
  
  // DELETE /api/contracts/:id - Supprimer un contrat
  app.delete("/api/contracts/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Supprimer d'abord les versions
      await db
        .delete(contractVersions)
        .where(eq(contractVersions.contractId, id));
      
      // Puis le contrat
      await db
        .delete(contracts)
        .where(eq(contracts.id, id));
      
      res.json({
        success: true,
        message: "Contrat supprimé avec succès"
      });
    } catch (error) {
      console.error("Erreur suppression contrat:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression"
      });
    }
  });
  
  // POST /api/contracts/generate-from-subscription/:subscriptionId
  app.post(
    "/api/contracts/generate-from-subscription/:subscriptionId",
    requireRole(["admin"]),
    async (req: Request, res: Response) => {
      try {
        const user = getUser(req);
        const subscriptionId = parseInt(req.params.subscriptionId);
        
        const subscription = await storage.getSubscription(subscriptionId);
        
        if (!subscription) {
          return res.status(404).json({
            message: "Abonnement non trouvé"
          });
        }
        
        // Vérifier si un contrat existe déjà
        const existingContract = await db.query.contracts.findFirst({
          where: and(
            eq(contracts.subscriptionId, subscriptionId),
            eq(contracts.status, "active")
          )
        });
        
        if (existingContract) {
          return res.status(400).json({
            message: "Un contrat actif existe déjà pour cet abonnement"
          });
        }
        
        const client = await storage.getUser(subscription.clientId);
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        
        const contractNumber =
          `CON-${format(new Date(), "yyyyMMdd")}-${subscription.clientId}`;
        
        const content = await generateContractContent({
          contractNumber,
          clientId: subscription.clientId,
          subscriptionId: subscription.id,
          startDate: subscription.startDate,
          endDate: subscription.endDate || null,
          title:
            `Contrat d'abonnement ${plan?.name || ""} - ` +
            `${format(subscription.startDate, "yyyy")}`,
        });
        
        const [newContract] = await db
          .insert(contracts)
          .values({
            contractNumber,
            clientId: subscription.clientId,
            subscriptionId: subscription.id,
            title:
              `Contrat d'abonnement ${plan?.name || ""} - ` +
              `${format(subscription.startDate, "yyyy")}`,
            content,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: "draft",
            isAutoRenew: true,
            createdBy: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        res.status(201).json({
          success: true,
          data: newContract
        });
      } catch (error: any) {
        console.error(
          "Erreur génération contrat depuis abonnement:",
          error
        );
        
        res.status(500).json({
          message: error.message || "Erreur lors de la génération"
        });
      }
    }
  );
  
  // GET /api/contracts/stats/summary - Statistiques
  app.get(
    "/api/contracts/stats/summary",
    requireRole(["admin"]),
    async (req: Request, res: Response) => {
      try {
        const allContracts = await db.select().from(contracts);
        
        const now = new Date();
        
        const stats = {
          total: allContracts.length,
          active: allContracts.filter(
            c => c.status === "active"
          ).length,
          signed: allContracts.filter(
            c => c.status === "signed"
          ).length,
          draft: allContracts.filter(
            c => c.status === "draft"
          ).length,
          expired: allContracts.filter(
            c =>
              c.status === "expired" ||
              (
                c.endDate &&
                new Date(c.endDate) < now &&
                c.status === "active"
              )
          ).length,
          cancelled: allContracts.filter(
            c => c.status === "cancelled"
          ).length,
          terminated: allContracts.filter(
            c => c.status === "terminated"
          ).length,
          pending_signature: allContracts.filter(
            c => c.status === "pending_signature"
          ).length,
          autoRenew: allContracts.filter(
            c => c.isAutoRenew
          ).length,
          expiringSoon: allContracts.filter(c => {
            if (c.status !== "active") return false;
            if (!c.endDate) return false;
            
            const daysUntilExpiry = Math.ceil(
              (
                new Date(c.endDate).getTime() -
                now.getTime()
              ) /
              (1000 * 60 * 60 * 24)
            );
            
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          }).length,
        };
        
        res.json(stats);
      } catch (error) {
        console.error("Erreur statistiques contrats:", error);
        res.status(500).json({
          message: "Erreur lors de la récupération des statistiques"
        });
      }
    }
  );
}