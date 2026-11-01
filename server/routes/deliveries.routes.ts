
// server/routes/deliveries.routes.ts

import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import {
  deliveries,
  pickups,
  deliverySchedules,
  users,
  insertDeliverySchema,
  insertDeliveryScheduleSchema,
} from "../../shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { z } from "zod";

// ======================================================
// TYPES
// ======================================================

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

// ======================================================
// AUTOMATIC PICKUPS HELPERS
// ======================================================

type PickupDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

function normalizePickupDays(value: unknown): string[] {
  if (!value) return [];

  const values = Array.isArray(value) ? value : [value];

  const aliases: Record<string, PickupDay> = {
    lundi: "monday",
    mardi: "tuesday",
    mercredi: "wednesday",
    jeudi: "thursday",
    vendredi: "friday",
    samedi: "saturday",
    dimanche: "sunday",

    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
    saturday: "saturday",
    sunday: "sunday",
  };

  return values
    .map((value) =>
      String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    )
    .map((day) => aliases[day])
    .filter((day): day is PickupDay => Boolean(day));
}

function getAntananarivoDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Antananarivo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getWeekday(dateString: string): PickupDay {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  const days: PickupDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[date.getUTCDay()];
}

function getAntananarivoDayRange(dateString: string) {
  // Madagascar = UTC+3
  const start = new Date(`${dateString}T00:00:00+03:00`);
  const end = new Date(`${dateString}T23:59:59.999+03:00`);

  return { start, end };
}

// ======================================================
// GENERATION AUTOMATIQUE DES RAMASSAGES
// ======================================================

async function generateAutomaticPickups(targetDate?: string) {
  const dateString = targetDate || getAntananarivoDateString();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Format de date invalide. Format attendu : YYYY-MM-DD.");
  }

  const parsedDate = new Date(`${dateString}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateString
  ) {
    throw new Error("La date fournie est invalide.");
  }

  const weekday = getWeekday(dateString);
  const { start, end } = getAntananarivoDayRange(dateString);

  // Récupérer les clients
  const clients = await db
    .select({
      id: users.id,
      preferredPickupDay: users.preferredPickupDay,
      preferredPickupDays: users.preferredPickupDays,
    })
    .from(users)
    .where(eq(users.role, "client"));

  let generated = 0;
  let skipped = 0;
  let withoutPickupDay = 0;
  const errors: Array<{ clientId: number; message: string }> = [];

  for (const client of clients) {
    try {
      const preferredDays = [
        ...normalizePickupDays(client.preferredPickupDays),
        ...normalizePickupDays(client.preferredPickupDay),
      ];

      const uniqueDays = [...new Set(preferredDays)];

      if (uniqueDays.length === 0) {
        withoutPickupDay++;
        continue;
      }

      // Vérifier si le client a choisi le jour actuel
      if (!uniqueDays.includes(weekday)) {
        continue;
      }

      // Vérifier si un ramassage existe déjà pour ce client et ce jour
      const existingPickup = await db
        .select({ id: pickups.id })
        .from(pickups)
        .where(
          and(
            eq(pickups.clientId, client.id),
            gte(pickups.scheduledDate, start),
            lte(pickups.scheduledDate, end)
          )
        )
        .limit(1);

      if (existingPickup.length > 0) {
        skipped++;
        continue;
      }

      // Créer le ramassage
      await db.insert(pickups).values({
        clientId: client.id,
        scheduledDate: start,
        status: "pending",
        notes:
          "Ramassage généré automatiquement selon les jours préférés du client.",
      });

      generated++;
    } catch (error: any) {
      console.error(
        `[PICKUPS] Erreur client ${client.id}:`,
        error
      );

      errors.push({
        clientId: client.id,
        message: error?.message || "Erreur inconnue",
      });
    }
  }

  return {
    date: dateString,
    weekday,
    totalClients: clients.length,
    generated,
    skipped,
    withoutPickupDay,
    failed: errors.length,
    errors,
  };
}

// ======================================================
// ROUTES
// ======================================================

export default function deliveryRoutes(app: Express) {

  // ====================================================
  // DELIVERIES
  // ====================================================

  // GET /api/deliveries
  app.get("/api/deliveries", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        status,
        driverId,
        date,
        type,
        page = "1",
        limit = "20",
      } = req.query;

      const user = getUser(req);
      const conditions: any[] = [];

      if (status && status !== "all") {
        conditions.push(sql`${deliveries.status} = ${status}`);
      }

      if (driverId && driverId !== "all") {
        conditions.push(
          eq(deliveries.deliveryPersonId, parseInt(driverId as string))
        );
      }

      if (type && type !== "all") {
        conditions.push(sql`${deliveries.type} = ${type}`);
      }

      if (date) {
        const targetDate = new Date(date as string);

        if (Number.isNaN(targetDate.getTime())) {
          return res.status(400).json({ message: "Date invalide." });
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        conditions.push(gte(deliveries.scheduledDate, startOfDay));
        conditions.push(lte(deliveries.scheduledDate, endOfDay));
      }

      if (user.role === "delivery") {
        conditions.push(eq(deliveries.deliveryPersonId, user.id));
      }

      const pageNumber = Math.max(1, parseInt(page as string) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt(limit as string) || 20)
      );
      const offset = (pageNumber - 1) * pageSize;

      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      const dataQuery = db.select().from(deliveries);
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(deliveries);

      const result = await (whereCondition
        ? dataQuery.where(whereCondition)
        : dataQuery)
        .orderBy(desc(deliveries.scheduledDate))
        .limit(pageSize)
        .offset(offset);

      const countResult = await (whereCondition
        ? countQuery.where(whereCondition)
        : countQuery);

      const count = Number(countResult[0]?.count || 0);

      return res.json({
        data: result,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      });
    } catch (error) {
      console.error("Erreur récupération livraisons:", error);
      return res.status(500).json({
        message: "Échec de la récupération des livraisons",
      });
    }
  });

  // GET /api/deliveries/stats
  app.get(
    "/api/deliveries/stats",
    requireRole(["admin", "supervisor", "agent"]),
    async (_req: Request, res: Response) => {
      try {
        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        const [monthlyStats, statusStats, typeStats] =
          await Promise.all([
            db
              .select({
                total: sql<number>`count(*)`,
                completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
                failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
                inProgress: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
                pending: sql<number>`sum(case when status = 'pending' or status = 'assigned' then 1 else 0 end)`,
              })
              .from(deliveries)
              .where(
                and(
                  gte(deliveries.scheduledDate, startOfMonth),
                  lte(deliveries.scheduledDate, endOfMonth)
                )
              ),

            db
              .select({
                status: deliveries.status,
                count: sql<number>`count(*)`,
              })
              .from(deliveries)
              .groupBy(deliveries.status),

            db
              .select({
                type: deliveries.type,
                count: sql<number>`count(*)`,
              })
              .from(deliveries)
              .groupBy(deliveries.type),
          ]);

        const topDrivers = await db
          .select({
            deliveryPersonId: deliveries.deliveryPersonId,
            completedCount: sql<number>`count(*)`,
            successRate: sql<number>`round(100.0 * sum(case when status = 'completed' then 1 else 0 end) / count(*), 1)`,
          })
          .from(deliveries)
          .where(eq(deliveries.status, "completed"))
          .groupBy(deliveries.deliveryPersonId)
          .orderBy(desc(sql`successRate`))
          .limit(5);

        const total = Number(monthlyStats[0]?.total || 0);
        const completed = Number(monthlyStats[0]?.completed || 0);

        return res.json({
          monthly: monthlyStats[0],
          byStatus: statusStats,
          byType: typeStats,
          topDrivers,
          successRate:
            total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      } catch (error) {
        console.error("Erreur statistiques:", error);
        return res.status(500).json({
          message: "Échec de la récupération des statistiques",
        });
      }
    }
  );

  // POST /api/deliveries
  app.post(
    "/api/deliveries",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        const taskType =
          req.body.type === "pickup" ? "pickup" : "delivery";

        const processed = {
          ...req.body,
          type: taskType,
          scheduledDate: req.body.scheduledDate
            ? new Date(req.body.scheduledDate)
            : new Date(),
          completedDate: req.body.completedDate
            ? new Date(req.body.completedDate)
            : undefined,
        };

        const validated = insertDeliverySchema.parse(processed);
        const delivery = await storage.createDelivery(validated);

        return res.status(201).json(delivery);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Données invalides",
            errors: error.errors,
          });
        }

        console.error("Erreur création livraison:", error);
        return res.status(500).json({ message: "Échec de la création" });
      }
    }
  );

  // POST /api/deliveries/batch
  app.post(
    "/api/deliveries/batch",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        const { deliveries: deliveriesData } = req.body;

        if (
          !Array.isArray(deliveriesData) ||
          deliveriesData.length === 0
        ) {
          return res.status(400).json({
            message: "Liste de livraisons requise",
          });
        }

        const results: any[] = [];
        const errors: any[] = [];

        for (const deliveryData of deliveriesData) {
          try {
            const processed = {
              ...deliveryData,
              type: deliveryData.type || "delivery",
              scheduledDate: deliveryData.scheduledDate
                ? new Date(deliveryData.scheduledDate)
                : new Date(),
            };

            const validated = insertDeliverySchema.parse(processed);
            const delivery = await storage.createDelivery(validated);
            results.push(delivery);
          } catch (error) {
            errors.push({
              data: deliveryData,
              error:
                error instanceof z.ZodError
                  ? error.errors
                  : "Validation failed",
            });
          }
        }

        return res.status(201).json({
          created: results,
          failed: errors,
          summary: {
            total: deliveriesData.length,
            success: results.length,
            failed: errors.length,
          },
        });
      } catch (error) {
        console.error("Erreur création batch:", error);
        return res.status(500).json({
          message: "Échec de la création en lot",
        });
      }
    }
  );

  // PATCH /api/deliveries/:id
  app.patch(
    "/api/deliveries/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const deliveryId = Number(req.params.id);

        if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
          return res.status(400).json({ message: "ID invalide." });
        }

        const existingDelivery = await db
          .select()
          .from(deliveries)
          .where(eq(deliveries.id, deliveryId))
          .limit(1);

        if (existingDelivery.length === 0) {
          return res.status(404).json({
            message: "Livraison non trouvée",
          });
        }

        const updateData: any = { ...req.body };

        if (updateData.scheduledDate) {
          updateData.scheduledDate = new Date(updateData.scheduledDate);
        }

        if (updateData.completedDate) {
          updateData.completedDate = new Date(updateData.completedDate);
        }

        if (
          updateData.status === "completed" &&
          !updateData.completedDate
        ) {
          updateData.completedDate = new Date();
        }

        const updated = await storage.updateDelivery(
          deliveryId,
          updateData
        );

        return res.json(updated);
      } catch (error) {
        console.error("Erreur mise à jour livraison:", error);
        return res.status(500).json({
          message: "Échec de la mise à jour",
        });
      }
    }
  );

  // GET /api/deliveries/:id
  app.get(
    "/api/deliveries/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ message: "ID invalide." });
        }

        const delivery = await db
          .select()
          .from(deliveries)
          .where(eq(deliveries.id, id))
          .limit(1);

        if (delivery.length === 0) {
          return res.status(404).json({
            message: "Livraison non trouvée",
          });
        }

        return res.json(delivery[0]);
      } catch (error) {
        console.error("Erreur récupération livraison:", error);
        return res.status(500).json({
          message: "Échec de la récupération",
        });
      }
    }
  );

  // ====================================================
  // PICKUPS
  // ====================================================

  // GET /api/pickups
  app.get(
    "/api/pickups",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { status, date, page = "1", limit = "20" } = req.query;
        const conditions: any[] = [];

        if (status && status !== "all") {
          conditions.push(sql`${pickups.status} = ${status}`);
        }

        if (date) {
          const dateString = String(date);
          const range = getAntananarivoDayRange(dateString);

          if (
            Number.isNaN(range.start.getTime()) ||
            Number.isNaN(range.end.getTime())
          ) {
            return res.status(400).json({ message: "Date invalide." });
          }

          conditions.push(gte(pickups.scheduledDate, range.start));
          conditions.push(lte(pickups.scheduledDate, range.end));
        }

        const pageNumber = Math.max(1, parseInt(page as string) || 1);
        const pageSize = Math.min(
          100,
          Math.max(1, parseInt(limit as string) || 20)
        );

        const offset = (pageNumber - 1) * pageSize;
        const whereCondition =
          conditions.length > 0 ? and(...conditions) : undefined;

        const dataQuery = db.select().from(pickups);
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(pickups);

        const data = await (whereCondition
          ? dataQuery.where(whereCondition)
          : dataQuery)
          .orderBy(desc(pickups.scheduledDate))
          .limit(pageSize)
          .offset(offset);

        const countResult = await (whereCondition
          ? countQuery.where(whereCondition)
          : countQuery);

        const count = Number(countResult[0]?.count || 0);

        return res.json({
          data,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            total: count,
            totalPages: Math.ceil(count / pageSize),
          },
        });
      } catch (error) {
        console.error("Erreur récupération pickups:", error);
        return res.status(500).json({
          message: "Échec de la récupération",
        });
      }
    }
  );

  // POST /api/pickups
  app.post(
    "/api/pickups",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        if (!req.body.clientId || !req.body.scheduledDate) {
          return res.status(400).json({
            message: "clientId et scheduledDate sont requis.",
          });
        }

        const scheduledDate = new Date(req.body.scheduledDate);

        if (Number.isNaN(scheduledDate.getTime())) {
          return res.status(400).json({
            message: "Date de ramassage invalide.",
          });
        }

        const result = await db
          .insert(pickups)
          .values({
            clientId: Number(req.body.clientId),
            scheduledDate,
            status: req.body.status || "pending",
            notes: req.body.notes,
          })
          .returning();

        return res.status(201).json(result[0]);
      } catch (error) {
        console.error("Erreur création pickup:", error);
        return res.status(500).json({
          message: "Échec de la création",
        });
      }
    }
  );

  // POST /api/pickups/generate-today
  // Génération manuelle par un administrateur.
  app.post(
    "/api/pickups/generate-today",
    requireRole(["admin"]),
    async (req: Request, res: Response) => {
      try {
        const date = req.body?.date
          ? String(req.body.date)
          : undefined;

        const summary = await generateAutomaticPickups(date);

        return res.json({
          success: true,
          message: `${summary.generated} ramassage(s) créé(s).`,
          summary,
        });
      } catch (error: any) {
        console.error(
          "[PICKUPS] Erreur génération automatique:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error?.message ||
            "Erreur de génération des ramassages.",
        });
      }
    }
  );

  // PATCH /api/pickups/:id
  app.patch(
    "/api/pickups/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ message: "ID invalide." });
        }

        const updated = await db
          .update(pickups)
          .set({
            ...(req.body.scheduledDate && {
              scheduledDate: new Date(req.body.scheduledDate),
            }),
            ...(req.body.status && { status: req.body.status }),
            ...(req.body.notes !== undefined && {
              notes: req.body.notes,
            }),
            updatedAt: new Date(),
          })
          .where(eq(pickups.id, id))
          .returning();

        if (updated.length === 0) {
          return res.status(404).json({
            message: "Ramassage non trouvé",
          });
        }

        return res.json(updated[0]);
      } catch (error) {
        console.error("Erreur mise à jour pickup:", error);
        return res.status(500).json({
          message: "Échec de la mise à jour",
        });
      }
    }
  );

  // POST /api/pickups/complete
  app.post(
    "/api/pickups/complete",
    requireRole(["admin", "supervisor", "agent", "delivery"]),
    async (req: Request, res: Response) => {
      try {
        const { orderId, deliveryPersonId, notes } = req.body;

        if (!orderId || !deliveryPersonId) {
          return res.status(400).json({
            message: "orderId et deliveryPersonId requis",
          });
        }

        const completed = await storage.completePickup(
          orderId,
          deliveryPersonId,
          notes
        );

        if (!completed) {
          return res.status(404).json({
            message: "Ramassage non trouvé",
          });
        }

        return res.json({
          message: "Ramassage terminé",
          pickup: completed,
        });
      } catch (error) {
        console.error("Erreur complétion pickup:", error);
        return res.status(500).json({
          message: "Échec de la complétion",
        });
      }
    }
  );

  // ====================================================
  // DELIVERY SCHEDULES
  // ====================================================

  // GET /api/delivery-schedules
  app.get(
    "/api/delivery-schedules",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        const { driverId, date, week } = req.query;
        const conditions: any[] = [];

        if (driverId && driverId !== "all") {
          conditions.push(
            eq(
              deliverySchedules.deliveryPersonId,
              parseInt(driverId as string)
            )
          );
        }

        if (date) {
          const targetDate = new Date(date as string);

          if (Number.isNaN(targetDate.getTime())) {
            return res.status(400).json({
              message: "Date invalide.",
            });
          }

          const start = new Date(targetDate);
          start.setHours(0, 0, 0, 0);

          const end = new Date(targetDate);
          end.setHours(23, 59, 59, 999);

          conditions.push(gte(deliverySchedules.date, start));
          conditions.push(lte(deliverySchedules.date, end));
        } else if (week) {
          const weekStart = new Date(week as string);

          if (Number.isNaN(weekStart.getTime())) {
            return res.status(400).json({
              message: "Semaine invalide.",
            });
          }

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          conditions.push(gte(deliverySchedules.date, weekStart));
          conditions.push(lte(deliverySchedules.date, weekEnd));
        }

        const whereCondition =
          conditions.length > 0 ? and(...conditions) : undefined;

        const query = db.select().from(deliverySchedules);

        const schedules = await (whereCondition
          ? query.where(whereCondition)
          : query).orderBy(deliverySchedules.date);

        return res.json(schedules);
      } catch (error) {
        console.error("Erreur récupération plannings:", error);
        return res.status(500).json({
          message: "Échec de la récupération",
        });
      }
    }
  );

  // POST /api/delivery-schedules
  app.post(
    "/api/delivery-schedules",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        const validated = insertDeliveryScheduleSchema.parse({
          ...req.body,
          date: req.body.date
            ? new Date(req.body.date)
            : new Date(),
        });

        const schedule = await storage.createDeliverySchedule(validated);

        return res.status(201).json(schedule);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Données invalides",
            errors: error.errors,
          });
        }

        console.error("Erreur création planning:", error);
        return res.status(500).json({
          message: "Échec de la création",
        });
      }
    }
  );

  // POST /api/delivery-schedules/batch
  app.post(
    "/api/delivery-schedules/batch",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        const { schedules: weekSchedules } = req.body;

        if (
          !Array.isArray(weekSchedules) ||
          weekSchedules.length === 0
        ) {
          return res.status(400).json({
            message: "Liste de plannings requise",
          });
        }

        const results = [];

        for (const schedule of weekSchedules) {
          const validated = insertDeliveryScheduleSchema.parse({
            ...schedule,
            date: schedule.date
              ? new Date(schedule.date)
              : new Date(),
          });

          const created = await storage.createDeliverySchedule(validated);
          results.push(created);
        }

        return res.status(201).json(results);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Données invalides",
            errors: error.errors,
          });
        }

        console.error("Erreur création plannings:", error);
        return res.status(500).json({
          message: "Échec de la création en lot",
        });
      }
    }
  );

  // PATCH /api/delivery-schedules/:id
  app.patch(
    "/api/delivery-schedules/:id",
    requireRole(["admin", "supervisor", "agent"]),
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ message: "ID invalide." });
        }

        const updated = await db
          .update(deliverySchedules)
          .set({
            ...(req.body.startTime && {
              startTime: req.body.startTime,
            }),
            ...(req.body.endTime && {
              endTime: req.body.endTime,
            }),
            ...(req.body.maxOrders && {
              maxOrders: req.body.maxOrders,
            }),
            ...(req.body.notes !== undefined && {
              notes: req.body.notes,
            }),
            ...(req.body.status && {
              status: req.body.status,
            }),
            updatedAt: new Date(),
          })
          .where(eq(deliverySchedules.id, id))
          .returning();

        if (updated.length === 0) {
          return res.status(404).json({
            message: "Planning non trouvé",
          });
        }

        return res.json(updated[0]);
      } catch (error) {
        console.error("Erreur mise à jour planning:", error);
        return res.status(500).json({
          message: "Échec de la mise à jour",
        });
      }
    }
  );
}
