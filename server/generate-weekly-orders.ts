// FICHIER : server/generate-weekly-orders.ts

import { db } from "./db";
import { orders, users, subscriptions } from "../shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { storage } from "./storage";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type ClientData = {
  id: number;
  fullName: string;
  preferredPickupDays: string[] | null;
  subscriptionId: number;
  preferredDays: string[];
  preferredDayIndices: number[];
};

type OrderToInsert = {
  clientId: number;
  subscriptionId: number;
  status: "to_pickup";
  scheduledPickupDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ============================================================
 * GENERATE TODAY ORDERS
 * ============================================================
 *
 * Génère automatiquement les commandes pour les 3 prochains jours.
 *
 * - Client actif
 * - Abonnement actif
 * - Jour de ramassage correspondant
 * - Pas de doublon
 * - Notification admin
 *
 * ============================================================
 */

export async function generateTodayOrders() {
  console.log(
    "--- Début de la tâche de génération de commandes automatiques ---"
  );

  console.log(
    `📅 Heure d'exécution: ${new Date().toLocaleString("fr-FR")}`
  );

  const summary = {
    generated: 0,
    skipped: 0,
    ignored: 0,
    clientsProcessed: 0,
    daysProcessed: 0,
    startDate: new Date(),
    periodDays: 3,
  };

  try {
    // ==========================================================
    // 1. DATE DU JOUR
    // ==========================================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dayNames: string[] = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];

    // ==========================================================
    // 2. RÉCUPÉRER LES CLIENTS ACTIFS
    // ==========================================================
    //
    // IMPORTANT :
    // On utilise INNER JOIN et non LEFT JOIN.
    //
    // Cela garantit que subscriptionId est un number
    // et non number | null.
    //
    // ==========================================================

    const activeClients = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        preferredPickupDays: users.preferredPickupDays,
        subscriptionId: subscriptions.id,
      })
      .from(users)
      .innerJoin(
        subscriptions,
        eq(users.id, subscriptions.clientId)
      )
      .where(
        and(
          eq(users.isActive, true),
          eq(subscriptions.isActive, true)
        )
      );

    summary.clientsProcessed = activeClients.length;

    console.log(
      `[INFO] ${summary.clientsProcessed} client(s) actif(s) avec abonnement trouvé(s).`
    );

    if (activeClients.length === 0) {
      console.log(
        "[INFO] Aucun client actif avec abonnement trouvé."
      );

      return summary;
    }

    // ==========================================================
    // 3. PRÉPARATION DES CLIENTS
    // ==========================================================

    const clientMap = new Map<number, ClientData>();

    const allPreferredDays = new Set<string>();

    for (const client of activeClients) {
      // --------------------------------------------------------
      // Vérifier les jours préférés
      // --------------------------------------------------------

      if (
        !client.preferredPickupDays ||
        client.preferredPickupDays.length === 0
      ) {
        console.log(
          `[IGNORE] Client ${client.fullName} ignoré : aucun jour de ramassage défini.`
        );

        summary.ignored++;

        continue;
      }

      // --------------------------------------------------------
      // Normalisation
      // --------------------------------------------------------

      const normalizedDays: string[] =
        client.preferredPickupDays.map(
          (day: string) =>
            day.toLowerCase().trim()
        );

      // --------------------------------------------------------
      // Ajouter les jours dans le Set global
      // --------------------------------------------------------

      for (const day of normalizedDays) {
        allPreferredDays.add(day);
      }

      // --------------------------------------------------------
      // Transformer lundi/mardi/etc. en index
      // --------------------------------------------------------

      const preferredDayIndices: number[] =
        normalizedDays
          .map((day: string) =>
            dayNames.findIndex(
              (d: string) => d === day
            )
          )
          .filter(
            (index: number) =>
              index !== -1
          );

      // --------------------------------------------------------
      // Ajouter le client dans la Map
      // --------------------------------------------------------

      clientMap.set(client.id, {
        id: client.id,
        fullName: client.fullName,
        preferredPickupDays:
          client.preferredPickupDays,
        subscriptionId:
          client.subscriptionId,
        preferredDays: normalizedDays,
        preferredDayIndices,
      });
    }

    // ==========================================================
    // Aucun client valide
    // ==========================================================

    if (clientMap.size === 0) {
      console.log(
        "[INFO] Aucun client avec des jours de ramassage définis."
      );

      return summary;
    }

    console.log(
      `[INFO] ${clientMap.size} client(s) avec jours préférés définis.`
    );

    console.log(
      `[INFO] Jours préférés détectés : ${Array.from(
        allPreferredDays
      ).join(", ")}`
    );

    // ==========================================================
    // 4. PLANIFICATION DES 3 PROCHAINS JOURS
    // ==========================================================

    console.log(
      `\n[PLANIF] Planification pour les ${summary.periodDays} prochains jours...`
    );

    for (
      let daysOffset = 1;
      daysOffset <= summary.periodDays;
      daysOffset++
    ) {
      // --------------------------------------------------------
      // Date du ramassage
      // --------------------------------------------------------

      const pickupDate = new Date(today);

      pickupDate.setDate(
        today.getDate() + daysOffset
      );

      pickupDate.setHours(0, 0, 0, 0);

      // --------------------------------------------------------
      // Nom du jour
      // --------------------------------------------------------

      const pickupDayIndex =
        pickupDate.getDay();

      const pickupDayName =
        dayNames[pickupDayIndex];

      // --------------------------------------------------------
      // Vérifier si quelqu'un veut ce jour
      // --------------------------------------------------------

      if (
        !allPreferredDays.has(
          pickupDayName
        )
      ) {
        console.log(
          `[SKIP] ${pickupDayName} ${pickupDate.toLocaleDateString(
            "fr-FR"
          )} : aucun client ne souhaite de ramassage ce jour.`
        );

        continue;
      }

      summary.daysProcessed++;

      console.log(
        `\n[PLANIF] Traitement du ${pickupDayName} ${pickupDate.toLocaleDateString(
          "fr-FR"
        )} (J+${daysOffset})`
      );

      // ========================================================
      // 5. CLIENTS POUR CE JOUR
      // ========================================================

      const clientsForThisDay: ClientData[] = [];

      for (const client of clientMap.values()) {
        if (
          client.preferredDays.includes(
            pickupDayName
          )
        ) {
          clientsForThisDay.push(client);
        }
      }

      if (
        clientsForThisDay.length === 0
      ) {
        console.log(
          `[INFO] Aucun client ne souhaite un ramassage le ${pickupDayName}.`
        );

        continue;
      }

      console.log(
        `[INFO] ${clientsForThisDay.length} client(s) souhaitent un ramassage le ${pickupDayName}.`
      );

      // ========================================================
      // 6. RÉCUPÉRER LES ID CLIENTS
      // ========================================================

      const clientIds: number[] =
        clientsForThisDay.map(
          (client: ClientData) =>
            client.id
        );

      // ========================================================
      // 7. VÉRIFIER LES COMMANDES EXISTANTES
      // ========================================================

      const existingOrders =
        await db.query.orders.findMany({
          where: and(
            inArray(
              orders.clientId,
              clientIds
            ),

            eq(
              orders.status,
              "to_pickup"
            ),

            eq(
              orders.scheduledPickupDate,
              pickupDate
            )
          ),
        });

      // ========================================================
      // Map des commandes existantes
      // ========================================================

      const existingOrderMap =
        new Map<number, number>();

      for (const order of existingOrders) {
        existingOrderMap.set(
          order.clientId,
          order.id
        );
      }

      // ========================================================
      // 8. PRÉPARER LES COMMANDES À INSÉRER
      // ========================================================
      //
      // IMPORTANT :
      //
      // PAS de :
      // source: "auto"
      //
      // car orders.source n'existe pas dans schema.ts.
      //
      // ========================================================

      const ordersToInsert: OrderToInsert[] =
        [];

      for (const client of clientsForThisDay) {
        // ------------------------------------------------------
        // Commande déjà existante ?
        // ------------------------------------------------------

        if (
          existingOrderMap.has(
            client.id
          )
        ) {
          console.log(
            `[SKIP] Client ${client.fullName} : commande #${existingOrderMap.get(
              client.id
            )} existe déjà pour ${pickupDayName}.`
          );

          summary.skipped++;

          continue;
        }

        // ------------------------------------------------------
        // Nouvelle commande
        // ------------------------------------------------------

        const newOrder: OrderToInsert = {
          clientId: client.id,

          subscriptionId:
            client.subscriptionId,

          status: "to_pickup",

          scheduledPickupDate:
            pickupDate,

          createdAt: new Date(),

          updatedAt: new Date(),
        };

        ordersToInsert.push(
          newOrder
        );
      }

      // ========================================================
      // 9. INSERTION DES COMMANDES
      // ========================================================

      if (
        ordersToInsert.length > 0
      ) {
        try {
          const newOrders =
            await db
              .insert(orders)
              .values(ordersToInsert)
              .returning();

          summary.generated +=
            newOrders.length;

          console.log(
            `[SUCCESS] ${newOrders.length} commande(s) créée(s) pour ${pickupDayName}.`
          );

          // ====================================================
          // 10. NOTIFICATIONS ADMIN
          // ====================================================

          const adminUserId = 1;

          for (const order of newOrders) {
            const client =
              clientsForThisDay.find(
                (client: ClientData) =>
                  client.id ===
                  order.clientId
              );

            // --------------------------------------------------
            // IMPORTANT :
            //
            // "new_auto_order" n'existe pas dans le schema.
            //
            // "metadata" n'existe pas non plus.
            //
            // On utilise donc uniquement les propriétés
            // réellement acceptées par createNotification.
            // --------------------------------------------------

            await storage.createNotification({
              userId: adminUserId,

              type: "order_status",

              title:
                "Commande Auto-Générée",

              message:
                `Commande #${order.id} créée pour ${
                  client?.fullName ||
                  "un client"
                } (${pickupDayName} ${pickupDate.toLocaleDateString(
                  "fr-FR"
                )}).`,

              orderId: order.id,
            });
          }

          console.log(
            `[NOTIF] ${newOrders.length} notification(s) créée(s) pour l'admin.`
          );
        } catch (error) {
          console.error(
            `[ERROR] Erreur lors de l'insertion des commandes pour ${pickupDayName}:`,
            error
          );
        }
      } else {
        console.log(
          `[INFO] Toutes les commandes existaient déjà pour ${pickupDayName}.`
        );
      }
    }
  } catch (error) {
    // ==========================================================
    // ERREUR FATALE
    // ==========================================================

    console.error(
      "❌ ERREUR FATALE lors de la génération des commandes :",
      error
    );

    throw error;
  } finally {
    // ==========================================================
    // RÉSUMÉ
    // ==========================================================

    console.log(
      "\n" + "=".repeat(60)
    );

    console.log(
      "--- FIN DE LA TÂCHE ---"
    );

    console.log(
      "RÉSUMÉ :"
    );

    console.log(
      `- Période planifiée : ${summary.periodDays} jours`
    );

    console.log(
      `- Clients traités : ${summary.clientsProcessed}`
    );

    console.log(
      `- Jours planifiés : ${summary.daysProcessed}`
    );

    console.log(
      `- Commandes générées : ${summary.generated}`
    );

    console.log(
      `- Commandes évitées (déjà existantes) : ${summary.skipped}`
    );

    console.log(
      `- Clients ignorés (pas de jours préférés) : ${summary.ignored}`
    );

    console.log(
      `- Durée d'exécution : ${
        Date.now() -
        summary.startDate.getTime()
      }ms`
    );

    console.log(
      "=".repeat(60) + "\n"
    );
  }

  return summary;
}

/**
 * ============================================================
 * TEST ORDER GENERATION
 * ============================================================
 *
 * Fonction de test.
 *
 * Cette fonction ne fait PAS d'insertion en base.
 * Elle simule seulement les commandes.
 *
 * ============================================================
 */

export async function testOrderGeneration() {
  console.log(
    "🧪 TEST: Génération de commandes de test"
  );

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const dayNames: string[] = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];

  console.log(
    "📅 Test pour les 3 prochains jours"
  );

  // ==========================================================
  // Récupérer un client de test
  // ==========================================================

  const testClient =
    await db.query.users.findFirst({
      where: and(
        eq(
          users.isActive,
          true
        ),

        eq(
          users.role,
          "client"
        )
      ),

      with: {
        subscriptions: {
          where: eq(
            subscriptions.isActive,
            true
          ),
        },
      },
    });

  if (!testClient) {
    console.log(
      "⚠️ Aucun client de test trouvé"
    );

    return;
  }

  // ==========================================================
  // Vérifier l'abonnement
  // ==========================================================

  const testSubscription =
    testClient.subscriptions[0];

  if (!testSubscription) {
    console.log(
      "⚠️ Aucun abonnement actif trouvé pour le client de test"
    );

    return;
  }

  // ==========================================================
  // Tableau des commandes de test
  // ==========================================================

  const testOrders: Array<{
    clientId: number;
    subscriptionId: number;
    status: "to_pickup";
    scheduledPickupDate: Date;
    itemCount: number;
    baseAmount: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // ==========================================================
  // Générer les 3 tests
  // ==========================================================

  for (
    let daysOffset = 1;
    daysOffset <= 3;
    daysOffset++
  ) {
    const pickupDate =
      new Date(today);

    pickupDate.setDate(
      today.getDate() +
        daysOffset
    );

    pickupDate.setHours(
      0,
      0,
      0,
      0
    );

    const pickupDayName =
      dayNames[
        pickupDate.getDay()
      ];

    // --------------------------------------------------------
    // Commande de test
    // --------------------------------------------------------

    const testOrder = {
      clientId:
        testClient.id,

      subscriptionId:
        testSubscription.id,

      status:
        "to_pickup" as const,

      scheduledPickupDate:
        pickupDate,

      itemCount: 40,

      baseAmount: 10000,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    testOrders.push(
      testOrder
    );

    console.log(
      `✅ Simulation pour ${testClient.fullName}:`
    );

    console.log(
      `   - J+${daysOffset}: ${pickupDayName} ${pickupDate.toLocaleDateString(
        "fr-FR"
      )}`
    );

    console.log(
      "   - Statut: to_pickup"
    );
  }

  return testOrders;
}

/**
 * ============================================================
 * RESET AUTO ORDERS
 * ============================================================
 *
 * IMPORTANT :
 *
 * Le schema actuel de orders ne possède pas :
 *
 * orders.source
 *
 * Donc on ne peut PAS faire :
 *
 * eq(orders.source, "auto")
 *
 * On utilise le statut "to_pickup".
 *
 * ============================================================
 */

export async function resetAutoOrders() {
  console.log(
    "🔄 Réinitialisation des commandes de ramassage"
  );

  try {
    // ========================================================
    // Supprimer les commandes "to_pickup"
    // ========================================================

    const result =
      await db
        .delete(orders)
        .where(
          eq(
            orders.status,
            "to_pickup"
          )
        )
        .returning();

    console.log(
      `✅ ${result.length} commande(s) de ramassage supprimée(s).`
    );

    // ========================================================
    // Notification admin
    // ========================================================
    //
    // "system" n'existe pas dans le type notification.
    //
    // On utilise "order_update".
    //
    // ========================================================

    await storage.createNotification({
      userId: 1,

      type: "order_update",

      title:
        "Commandes Auto Réinitialisées",

      message:
        `${result.length} commande(s) de ramassage ont été supprimées.`,
    });

    return result.length;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la réinitialisation:",
      error
    );

    throw error;
  }
}