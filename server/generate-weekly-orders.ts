
import { db } from "./db";
import { orders, users, subscriptions, subscriptionPlans } from "../shared/schema";
import { eq, and, inArray, gte, lt, isNull, or, lte } from "drizzle-orm";
import { storage } from "./storage";
 
/* ============================================================
   CONSTANTES / TYPES
============================================================ */
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000; // Madagascar = UTC+3
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 3; // J+1 .. J+3
 
const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
 
// Accepte français / anglais / abréviations / accents / majuscules
const DAY_ALIASES: Record<string, number> = {
  dimanche: 0, dim: 0, sunday: 0, sun: 0,
  lundi: 1, lun: 1, monday: 1, mon: 1,
  mardi: 2, mar: 2, tuesday: 2, tue: 2, tues: 2,
  mercredi: 3, mer: 3, wednesday: 3, wed: 3,
  jeudi: 4, jeu: 4, thursday: 4, thu: 4, thur: 4, thurs: 4,
  vendredi: 5, ven: 5, friday: 5, fri: 5,
  samedi: 6, sam: 6, saturday: 6, sat: 6,
};
 
const normalizeDay = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const key = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\.$/, "");
  return key in DAY_ALIASES ? DAY_ALIASES[key] : null;
};
 
/** Début (00:00 heure de Madagascar) du jour J+offset, exprimé en UTC. */
function madagascarDay(offsetDays: number) {
  const nowMad = new Date(Date.now() + TZ_OFFSET_MS);
  const fakeMidnight = Date.UTC(nowMad.getUTCFullYear(), nowMad.getUTCMonth(), nowMad.getUTCDate() + offsetDays);
  const start = new Date(fakeMidnight - TZ_OFFSET_MS);
  const end = new Date(start.getTime() + DAY_MS);
  const dayIndex = new Date(fakeMidnight).getUTCDay();
  return { start, end, dayIndex, label: `${DAY_NAMES[dayIndex]} ${new Date(fakeMidnight).toISOString().slice(0, 10)}` };
}
 
type GenerationSummary = {
  generated: number;
  skipped: number;
  ignored: number;
  clientsProcessed: number;
  daysProcessed: number;
  startDate: Date;
  periodDays: number;
  orderIds: number[];
};
 
// Verrou en mémoire : évite deux générations simultanées (cron + bouton + démarrage)
let isRunning = false;
 
/* ============================================================
   GÉNÉRATION AUTOMATIQUE
============================================================ */
export async function generateTodayOrders(): Promise<GenerationSummary> {
  const summary: GenerationSummary = {
    generated: 0, skipped: 0, ignored: 0, clientsProcessed: 0,
    daysProcessed: 0, startDate: new Date(), periodDays: PERIOD_DAYS, orderIds: [],
  };
 
  if (isRunning) {
    console.log("[AUTO-ORDERS] Génération déjà en cours, appel ignoré.");
    return summary;
  }
  isRunning = true;
 
  try {
    console.log(`--- [AUTO-ORDERS] Début ${new Date().toISOString()} ---`);
 
    // 1. Clients actifs + abonnement valide (le plus récent par client)
    const horizon = madagascarDay(PERIOD_DAYS).end;
    const rows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        preferredPickupDays: users.preferredPickupDays,
        subscriptionId: subscriptions.id,
        subStart: subscriptions.startDate,
        subEnd: subscriptions.endDate,
        deliveryHours: subscriptionPlans.deliveryTimeHours,
      })
      .from(users)
      .innerJoin(subscriptions, eq(users.id, subscriptions.clientId))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(users.isActive, true),
        eq(users.role, "client"),
        eq(subscriptions.isActive, true),
        lte(subscriptions.startDate, horizon),
      ));
 
    // un seul abonnement par client : le plus récent (id le plus grand)
    const latestByClient = new Map<number, (typeof rows)[number]>();
    for (const r of rows) {
      const cur = latestByClient.get(r.id);
      if (!cur || r.subscriptionId > cur.subscriptionId) latestByClient.set(r.id, r);
    }
    const clients = Array.from(latestByClient.values());
    summary.clientsProcessed = clients.length;
    console.log(`[AUTO-ORDERS] ${clients.length} client(s) actif(s) avec abonnement.`);
 
    // 2. Jours préférés normalisés (index 0-6)
    const prefs = new Map<number, Set<number>>();
    for (const c of clients) {
      const idx = (c.preferredPickupDays ?? [])
        .map(normalizeDay)
        .filter((n): n is number => n !== null);
      if (idx.length === 0) {
        console.log(`[AUTO-ORDERS] Ignoré : ${c.fullName} (aucun jour de ramassage valide)`);
        summary.ignored++;
        continue;
      }
      prefs.set(c.id, new Set(idx));
    }
    if (prefs.size === 0) return summary;
 
    // 3. Boucle J+1 .. J+3
    for (let offset = 1; offset <= PERIOD_DAYS; offset++) {
      const day = madagascarDay(offset);
      const dueClients = clients.filter(c => prefs.get(c.id)?.has(day.dayIndex));
      if (dueClients.length === 0) continue;
      summary.daysProcessed++;
 
      // Abonnement valide ce jour-là ?
      const eligible = dueClients.filter(c =>
        c.subStart <= day.end && (!c.subEnd || c.subEnd >= day.start)
      );
 
      // Anti-doublon : TOUTE commande du client prévue ce jour-là (peu importe son statut
      // ou son heure) compte comme déjà existante.
      const existing = eligible.length === 0 ? [] : await db
        .select({ id: orders.id, clientId: orders.clientId })
        .from(orders)
        .where(and(
          inArray(orders.clientId, eligible.map(c => c.id)),
          gte(orders.scheduledPickupDate, day.start),
          lt(orders.scheduledPickupDate, day.end),
        ));
      const hasOrder = new Set(existing.map(o => o.clientId));
 
      const toInsert = eligible
        .filter(c => {
          if (hasOrder.has(c.id)) { summary.skipped++; return false; }
          return true;
        })
        .map(c => ({
          clientId: c.id,
          subscriptionId: c.subscriptionId,
          status: "to_pickup" as const,
          scheduledPickupDate: day.start,
          scheduledDeliveryDate: new Date(day.start.getTime() + (c.deliveryHours || 48) * 3600 * 1000),
        }));
 
      if (toInsert.length === 0) continue;
 
      try {
        const created = await db.insert(orders).values(toInsert).returning();
        summary.generated += created.length;
        summary.orderIds.push(...created.map(o => o.id));
        console.log(`[AUTO-ORDERS] ${created.length} commande(s) créée(s) pour ${day.label}`);
 
        // Notification admins : ne doit jamais faire échouer la génération
        try {
          const admins = await db.select({ id: users.id }).from(users)
            .where(and(eq(users.role, "admin"), eq(users.isActive, true)));
          for (const order of created) {
            const client = eligible.find(c => c.id === order.clientId);
            for (const admin of admins) {
              await storage.createNotification({
                userId: admin.id,
                type: "order_status",
                title: "Ramassage planifié automatiquement",
                message: `Commande #${order.id} créée pour ${client?.fullName ?? "un client"} (${day.label}).`,
                orderId: order.id,
              } as any);
            }
          }
        } catch (notifError) {
          console.error("[AUTO-ORDERS] Notification non envoyée (commandes bien créées):", notifError);
        }
      } catch (error) {
        console.error(`[AUTO-ORDERS] Erreur d'insertion pour ${day.label}:`, error);
      }
    }
    return summary;
  } catch (error) {
    console.error("[AUTO-ORDERS] ERREUR FATALE :", error);
    throw error;
  } finally {
    isRunning = false;
    console.log(
      `--- [AUTO-ORDERS] Fin : ${summary.generated} créée(s), ${summary.skipped} déjà existante(s), ` +
      `${summary.ignored} client(s) ignoré(s), ${Date.now() - summary.startDate.getTime()} ms ---`
    );
  }
}
 
/* ============================================================
   SIMULATION (aucune insertion)
============================================================ */
export async function testOrderGeneration() {
  const client = await db.query.users.findFirst({
    where: and(eq(users.isActive, true), eq(users.role, "client")),
    with: { subscriptions: { where: eq(subscriptions.isActive, true) } },
  });
  if (!client || !client.subscriptions?.[0]) {
    console.log("[AUTO-ORDERS][TEST] Aucun client avec abonnement actif.");
    return [];
  }
  return Array.from({ length: PERIOD_DAYS }, (_, i) => {
    const d = madagascarDay(i + 1);
    return { clientId: client.id, subscriptionId: client.subscriptions[0].id, status: "to_pickup" as const, scheduledPickupDate: d.start, label: d.label };
  });
}
 
/* ============================================================
   RESET — version sécurisée
   N'efface QUE les ramassages FUTURS, encore "to_pickup", jamais collectés et
   sans nombre de pièces saisi. Les commandes réellement traitées sont intouchables.
============================================================ */
export async function resetAutoOrders() {
  const result = await db.delete(orders).where(and(
    eq(orders.status, "to_pickup"),
    gte(orders.scheduledPickupDate, madagascarDay(1).start),
    isNull(orders.actualPickupDate),
    isNull(orders.itemCount),
  )).returning();
  console.log(`[AUTO-ORDERS] ${result.length} ramassage(s) futur(s) vide(s) supprimé(s).`);
  return result.length;
}
 