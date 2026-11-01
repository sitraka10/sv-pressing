
// ============================================================
// FICHIER : server/generate-automatic-pickups.ts
// GÉNÉRATION AUTOMATIQUE DES RAMASSAGES
// Version corrigée
// ============================================================

import { db } from "./db";

import {
  pickups,
  users,
  subscriptions,
} from "../shared/schema";

import {
  eq,
  and,
  gte,
  lt,
  inArray,
} from "drizzle-orm";

// ============================================================
// CONFIGURATION
// ============================================================

const TIME_ZONE = "Indian/Antananarivo";
const MADAGASCAR_OFFSET = "+03:00";
const PERIOD_DAYS = 3;
const PICKUP_HOUR = "09:00";

// ============================================================
// TYPES
// ============================================================

type ClientData = {
  id: number;
  fullName: string;
  preferredPickupDays: unknown;
  preferredPickupDay: unknown;
};

type PickupToInsert = {
  clientId: number;
  scheduledDate: Date;
  status: string;
  notes: string;
};

export type PickupGenerationSummary = {
  generated: number;
  skipped: number;
  ignored: number;
  clientsProcessed: number;
  daysProcessed: number;
  startDate: Date;
  periodDays: number;
};

type TestPickupResult = {
  date: string;
  day: string;
  clients: string[];
};

// ============================================================
// DATE HELPERS
// ============================================================

function getMadagascarDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Impossible de déterminer la date de Madagascar.");
  }

  return `${year}-${month}-${day}`;
}

function addDaysToDate(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function validateDate(dateKey: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("Format de date invalide. Utilisez YYYY-MM-DD.");
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("La date indiquée n'est pas valide.");
  }
}

/**
 * Calcule le jour de la semaine sans dépendre du fuseau horaire
 * configuré sur le serveur.
 *
 * 0 = dimanche, 1 = lundi, ..., 6 = samedi.
 */
function getWeekdayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getWeekdayName(dateKey: string): string {
  const dayNames = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];

  return dayNames[getWeekdayIndex(dateKey)];
}

function getDayStart(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00${MADAGASCAR_OFFSET}`);
}

function getScheduledPickupDate(dateKey: string): Date {
  return new Date(`${dateKey}T${PICKUP_HOUR}:00${MADAGASCAR_OFFSET}`);
}

// ============================================================
// NORMALISATION DES JOURS
// ============================================================

function normalizeDay(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Convertit les jours enregistrés en tableau.
 *
 * Accepte :
 * - ["lundi", "jeudi"]
 * - "lundi"
 * - "lundi,jeudi"
 * - '["lundi","jeudi"]' (JSON string)
 */
function parsePickupDays(value: unknown): string[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeDay)
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const raw = value.trim();

    if (!raw) return [];

    // Essayer de lire un tableau JSON stocké en texte.
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed: unknown = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          return parsed
            .map(normalizeDay)
            .filter(Boolean);
        }
      } catch {
        // Si le JSON est invalide, on essaie le format texte.
      }
    }

    return raw
      .split(/[,;|]/)
      .map(normalizeDay)
      .filter(Boolean);
  }

  return [normalizeDay(value)].filter(Boolean);
}

/**
 * Reconnaît les jours en français, anglais, malagasy
 * et sous forme numérique.
 */
function getDayIndex(value: unknown): number {
  const day = normalizeDay(value);

  const aliases: Record<string, number> = {
    dimanche: 0,
    sunday: 0,
    alahady: 0,
    "0": 0,
    "7": 0,

    lundi: 1,
    monday: 1,
    alatsinainy: 1,
    "1": 1,

    mardi: 2,
    tuesday: 2,
    talata: 2,
    "2": 2,

    mercredi: 3,
    wednesday: 3,
    alarobia: 3,
    "3": 3,

    jeudi: 4,
    thursday: 4,
    alakamisy: 4,
    "4": 4,

    vendredi: 5,
    friday: 5,
    zoma: 5,
    "5": 5,

    samedi: 6,
    saturday: 6,
    asabotsy: 6,
    "6": 6,
  };

  return aliases[day] ?? -1;
}

function getClientPreferredDays(client: ClientData): string[] {
  const days = [
    ...parsePickupDays(client.preferredPickupDays),
    ...parsePickupDays(client.preferredPickupDay),
  ];

  return [...new Set(days)];
}

function clientHasPickupOnDay(
  client: ClientData,
  weekdayIndex: number,
): boolean {
  return getClientPreferredDays(client).some(
    (day) => getDayIndex(day) === weekdayIndex,
  );
}

// ============================================================
// RÉCUPÉRATION DES CLIENTS ACTIFS
// ============================================================

async function getActiveClients(): Promise<ClientData[]> {
  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      preferredPickupDays: users.preferredPickupDays,
      preferredPickupDay: users.preferredPickupDay,
    })
    .from(users)
    .innerJoin(
      subscriptions,
      eq(users.id, subscriptions.clientId),
    )
    .where(
      and(
        eq(users.role, "client"),
        eq(users.isActive, true),
        eq(subscriptions.isActive, true),
      ),
    );

  // Éviter les doublons lorsqu'un client possède plusieurs
  // abonnements actifs.
  const clientMap = new Map<number, ClientData>();

  for (const client of rows) {
    if (clientMap.has(client.id)) continue;

    clientMap.set(client.id, {
      id: client.id,
      fullName: client.fullName || `Client #${client.id}`,
      preferredPickupDays: client.preferredPickupDays,
      preferredPickupDay: client.preferredPickupDay,
    });
  }

  return Array.from(clientMap.values());
}

// ============================================================
// GÉNÉRATION INTERNE
// ============================================================

async function generatePickupsForPeriod(
  referenceDate: string,
  firstOffset: number,
  numberOfDays: number,
): Promise<PickupGenerationSummary> {
  validateDate(referenceDate);

  const summary: PickupGenerationSummary = {
    generated: 0,
    skipped: 0,
    ignored: 0,
    clientsProcessed: 0,
    daysProcessed: 0,
    startDate: new Date(
      `${referenceDate}T12:00:00${MADAGASCAR_OFFSET}`,
    ),
    periodDays: numberOfDays,
  };

  console.log("\n============================================================");
  console.log("🚚 GÉNÉRATION AUTOMATIQUE DES RAMASSAGES");
  console.log("============================================================");
  console.log(`📅 Date de référence : ${referenceDate}`);
  console.log(`🌍 Fuseau horaire : ${TIME_ZONE}`);
  console.log(`📆 Nombre de jours : ${numberOfDays}`);

  try {
    // 1. Récupérer les clients actifs avec abonnement actif.
    const clients = await getActiveClients();

    summary.clientsProcessed = clients.length;

    console.log(
      `👥 ${clients.length} client(s) actif(s) avec abonnement actif.`,
    );

    if (clients.length === 0) {
      console.log("ℹ️ Aucun client actif avec abonnement actif.");
      return summary;
    }

    // 2. Garder les clients ayant au moins un jour valide.
    const validClients: ClientData[] = [];

    for (const client of clients) {
      const selectedDays = getClientPreferredDays(client);
      const validDays = selectedDays.filter(
        (day) => getDayIndex(day) !== -1,
      );

      if (validDays.length === 0) {
        console.log(
          `[IGNORE] ${client.fullName} : aucun jour de ramassage valide.`,
        );
        summary.ignored++;
        continue;
      }

      validClients.push(client);
    }

    console.log(
      `✅ ${validClients.length} client(s) avec jours valides.`,
    );

    if (validClients.length === 0) {
      return summary;
    }

    // 3. Traiter les dates demandées.
    for (
      let daysOffset = firstOffset;
      daysOffset < firstOffset + numberOfDays;
      daysOffset++
    ) {
      const pickupDateKey = addDaysToDate(
        referenceDate,
        daysOffset,
      );

      const weekdayIndex = getWeekdayIndex(pickupDateKey);
      const weekdayName = getWeekdayName(pickupDateKey);

      const dayStart = getDayStart(pickupDateKey);
      const nextDayStart = getDayStart(
        addDaysToDate(pickupDateKey, 1),
      );

      const scheduledDate = getScheduledPickupDate(pickupDateKey);

      console.log(
        `\n📅 ${weekdayName} ${pickupDateKey}`,
      );

      // 4. Trouver les clients concernés.
      const clientsForThisDay = validClients.filter(
        (client) =>
          clientHasPickupOnDay(client, weekdayIndex),
      );

      if (clientsForThisDay.length === 0) {
        console.log(
          `[INFO] Aucun client prévu pour ${weekdayName}.`,
        );
        continue;
      }

      summary.daysProcessed++;

      console.log(
        `👥 ${clientsForThisDay.length} client(s) concerné(s).`,
      );

      // 5. Chercher les ramassages déjà enregistrés.
      const clientIds = clientsForThisDay.map(
        (client) => client.id,
      );

      const existingPickups = await db
        .select({
          id: pickups.id,
          clientId: pickups.clientId,
        })
        .from(pickups)
        .where(
          and(
            inArray(pickups.clientId, clientIds),
            gte(pickups.scheduledDate, dayStart),
            lt(pickups.scheduledDate, nextDayStart),
          ),
        );

      const existingClientIds = new Set(
        existingPickups.map((pickup) => pickup.clientId),
      );

      // 6. Préparer uniquement les nouveaux ramassages.
      const pickupsToInsert: PickupToInsert[] = [];

      for (const client of clientsForThisDay) {
        if (existingClientIds.has(client.id)) {
          console.log(
            `[SKIP] ${client.fullName} : ramassage déjà existant.`,
          );
          summary.skipped++;
          continue;
        }

        pickupsToInsert.push({
          clientId: client.id,
          scheduledDate,
          status: "scheduled",
          notes: `Ramassage automatique - ${weekdayName} ${pickupDateKey}`,
        });
      }

      // 7. Insérer les nouveaux ramassages.
      if (pickupsToInsert.length === 0) {
        console.log(
          `[INFO] Aucun nouveau ramassage à créer pour ${pickupDateKey}.`,
        );
        continue;
      }

      const insertedPickups = await db
        .insert(pickups)
        .values(pickupsToInsert)
        .returning({
          id: pickups.id,
          clientId: pickups.clientId,
        });

      summary.generated += insertedPickups.length;

      console.log(
        `✅ ${insertedPickups.length} ramassage(s) créé(s).`,
      );

      for (const pickup of insertedPickups) {
        const client = clientsForThisDay.find(
          (item) => item.id === pickup.clientId,
        );

        console.log(
          `   - Ramassage #${pickup.id} : ${
            client?.fullName || `Client #${pickup.clientId}`
          }`,
        );
      }
    }

    return summary;
  } catch (error) {
    console.error(
      "❌ ERREUR GÉNÉRATION AUTOMATIQUE DES RAMASSAGES :",
      error,
    );

    throw error;
  } finally {
    console.log("\n============================================================");
    console.log("📊 RÉSUMÉ DE LA GÉNÉRATION");
    console.log("============================================================");
    console.log(`- Clients traités : ${summary.clientsProcessed}`);
    console.log(`- Jours planifiés : ${summary.daysProcessed}`);
    console.log(`- Ramassages créés : ${summary.generated}`);
    console.log(`- Ramassages existants : ${summary.skipped}`);
    console.log(`- Clients ignorés : ${summary.ignored}`);
    console.log(`- Période : ${summary.periodDays} jour(s)`);
    console.log("============================================================\n");
  }
}

// ============================================================
// GÉNÉRATION AUTOMATIQUE DES 3 PROCHAINS JOURS
// ============================================================

/**
 * À partir d'aujourd'hui, planifie J+1, J+2 et J+3.
 */
export async function generateAutomaticPickups(
  requestedDate?: string,
): Promise<PickupGenerationSummary> {
  const referenceDate = requestedDate || getMadagascarDate();

  return generatePickupsForPeriod(
    referenceDate,
    1,
    PERIOD_DAYS,
  );
}

// ============================================================
// TEST SANS INSERTION EN BASE
// ============================================================

/**
 * Simule la génération sans créer de données.
 */
export async function testAutomaticPickupGeneration(
  requestedDate?: string,
): Promise<TestPickupResult[]> {
  const referenceDate = requestedDate || getMadagascarDate();

  validateDate(referenceDate);

  console.log("\n🧪 TEST DE GÉNÉRATION AUTOMATIQUE DES RAMASSAGES");
  console.log(`📅 Date de référence : ${referenceDate}`);

  const clients = await getActiveClients();
  const results: TestPickupResult[] = [];

  for (let daysOffset = 1; daysOffset <= PERIOD_DAYS; daysOffset++) {
    const dateKey = addDaysToDate(referenceDate, daysOffset);
    const weekdayIndex = getWeekdayIndex(dateKey);
    const weekdayName = getWeekdayName(dateKey);

    const matchingClients = clients.filter(
      (client) =>
        clientHasPickupOnDay(client, weekdayIndex),
    );

    const result: TestPickupResult = {
      date: dateKey,
      day: weekdayName,
      clients: matchingClients.map(
        (client) => client.fullName,
      ),
    };

    results.push(result);

    console.log(`\n📅 ${weekdayName} ${dateKey}`);

    if (matchingClients.length === 0) {
      console.log("   Aucun client prévu.");
    } else {
      for (const client of matchingClients) {
        console.log(`   - ${client.fullName}`);
      }
    }
  }

  console.log("\n🧪 Test terminé : aucune insertion en base.");

  return results;
}

// ============================================================
// GÉNÉRATION POUR UNE DATE PRÉCISE
// ============================================================

/**
 * Génère uniquement les ramassages de la date demandée.
 * Contrairement à generateAutomaticPickups(), cette fonction
 * ne planifie pas les deux jours suivants.
 */
export async function generatePickupsForDate(
  date: string,
): Promise<PickupGenerationSummary> {
  validateDate(date);

  console.log(
    `📅 Génération ciblée des ramassages pour le ${date}`,
  );

  return generatePickupsForPeriod(date, 0, 1);
}
