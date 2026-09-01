// server/routes/routes.routes.ts
import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { users, orders } from "@shared/schema";
import { eq, inArray, not } from "drizzle-orm";
import { requireRole } from "../middleware/auth.middleware";

// ============================================================
// CONSTANTES
// ============================================================
const LAUNDRY_LOCATION_COORDS = { lat: -18.931515, lng: 47.474647 };

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

// Obtenir les coordonnées à partir d'une adresse
const getCoordsFromAddress = (address: string | null) => {
  if (!address) return null;
  // Simulation de coordonnées basées sur l'adresse
  // En production, utiliser une API de géocodage
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = -18.9 + (hash % 10) * 0.01;
  const lng = 47.4 + (hash % 15) * 0.01;
  return { lat, lng };
};

// Calculer la distance Haversine entre deux points
const getHaversineDistance = (coords1: any, coords2: any) => {
  if (!coords1 || !coords2) return 9999;
  const R = 6371; // Rayon de la Terre en km
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Générer une route de ramassage
const generatePickupRoute = (driver: any, startCoords: any, orders: any[], startDate: Date) => {
  // Trier les commandes par distance
  const sortedOrders = [...orders].sort((a, b) => {
    const distA = getHaversineDistance(startCoords, a.coords);
    const distB = getHaversineDistance(startCoords, b.coords);
    return distA - distB;
  });

  let currentTime = new Date(startDate);
  let totalDistance = 0;
  let currentPos = startCoords;

  const route = {
    driver: {
      id: driver.id,
      name: driver.name || driver.fullName || `Livreur ${driver.id}`,
    },
    orders: sortedOrders.map((order, index) => {
      const travelTime = index === 0 ? 0 : getHaversineDistance(currentPos, order.coords) * 2; // 2 min/km
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);
      totalDistance += travelTime;
      currentPos = order.coords;

      return {
        ...order,
        estimatedArrival: new Date(currentTime),
        estimatedDeparture: new Date(currentTime.getTime() + 15 * 60000), // 15 minutes de service
        sequence: index + 1,
      };
    }),
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedDuration: sortedOrders.length * 25,
    color: '#4F46E5',
    startTime: startDate,
    endTime: new Date(currentTime.getTime() + 15 * 60000),
  };
  return route;
};

// Convertir une chaîne de temps en Date
const convertTimeToDate = (timeStr: string | null, baseDate: Date) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(h, m, 0, 0);
  return date;
};

// Générer une couleur aléatoire
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
};

// ============================================================
// ROUTES
// ============================================================
export default function routesRoutes(app: Express) {
  
  // ============================================================
  // POST /api/routes/distribute-tasks
  // Distribuer les tâches aux livreurs
  // ============================================================
  app.post("/api/routes/distribute-tasks", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const { driverIds, orderIds, date, startTime } = req.body;
      
      if (!driverIds?.length || !orderIds?.length || !date || !startTime) {
        return res.status(400).json({ 
          message: "Données incomplètes",
          required: ["driverIds", "orderIds", "date", "startTime"]
        });
      }

      // Récupérer les livreurs
      const drivers = await db.select().from(users).where(inArray(users.id, driverIds));
      
      // Récupérer les commandes
      const ordersData = await db.select().from(orders).where(inArray(orders.id, orderIds));
      
      // Récupérer les clients
      const clientIds = [...new Set(ordersData.map(o => o.clientId))];
      const clientsData = await db.select().from(users).where(inArray(users.id, clientIds));

      const planningDate = new Date(date);
      const [startH, startM] = startTime.split(":").map(Number);
      planningDate.setHours(startH, startM, 0, 0);

      // Créer les points de commande
      const allOrderPoints = ordersData.map(order => {
        const client = clientsData.find(c => c.id === order.clientId);
        const coords = client ? getCoordsFromAddress(client.address) : null;
        if (!client || !coords) return null;
        return {
          id: order.id,
          type: order.status === "to_pickup" ? "pickup" : "delivery" as const,
          coords,
          clientName: client.fullName,
          timeWindowStart: null,
          timeWindowEnd: null,
          itemCount: order.itemCount || 40
        };
      }).filter(Boolean) as any[];

      if (allOrderPoints.length === 0) {
        return res.status(400).json({ message: "Aucune commande valide à distribuer" });
      }

      // Initialiser les routes pour chaque livreur
      const assignedRoutesMap = new Map<number, any>();
      
      drivers.forEach(driver => {
        const homeCoords = getCoordsFromAddress(driver.address);
        if (homeCoords) {
          assignedRoutesMap.set(driver.id, {
            driver,
            orders: [],
            currentItems: 0,
            color: getRandomColor(),
            lastCoords: homeCoords
          });
        }
      });

      const unassigned: any[] = [];

      // Trier les commandes par distance par rapport à la laverie
      allOrderPoints.sort((a, b) => {
        return getHaversineDistance(LAUNDRY_LOCATION_COORDS, a.coords) - 
               getHaversineDistance(LAUNDRY_LOCATION_COORDS, b.coords);
      });

      // Assigner les commandes aux livreurs
      for (const order of allOrderPoints) {
        let bestDriverId: number | null = null;
        let minScore = Infinity;
        
        for (const [driverId, driverData] of assignedRoutesMap) {
          const capacity = driverData.driver.capacityInItems || 100;
          if (driverData.currentItems + order.itemCount <= capacity) {
            const dist = getHaversineDistance(driverData.lastCoords, order.coords);
            const loadFactor = driverData.currentItems / capacity;
            const score = dist + loadFactor * 100;
            if (score < minScore) {
              minScore = score;
              bestDriverId = driverId;
            }
          }
        }
        
        if (bestDriverId !== null) {
          const dd = assignedRoutesMap.get(bestDriverId)!;
          dd.orders.push(order);
          dd.currentItems += order.itemCount;
          dd.lastCoords = order.coords;
        } else {
          unassigned.push(order);
        }
      }

      // Générer les routes pour chaque livreur
      const assignedRoutes: any[] = [];
      for (const [driverId, driverData] of assignedRoutesMap) {
        if (driverData.orders.length > 0) {
          const startCoords = getCoordsFromAddress(driverData.driver.address) || LAUNDRY_LOCATION_COORDS;
          const route = generatePickupRoute(
            driverData.driver,
            startCoords,
            driverData.orders,
            planningDate
          );
          route.color = driverData.color;
          assignedRoutes.push(route);
        }
      }

      res.json({
        success: true,
        assignedRoutes,
        unassignedOrders: unassigned.map(o => o.id),
        totalAssigned: assignedRoutes.reduce((acc, r) => acc + r.orders.length, 0),
        totalUnassigned: unassigned.length
      });
      
    } catch (error) {
      console.error("Error distributing tasks:", error);
      res.status(500).json({ 
        message: "Erreur serveur lors de la distribution des tâches",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================
  // POST /api/routes/generate-pickup-route
  // Générer une route de ramassage pour un livreur
  // ============================================================
  app.post("/api/routes/generate-pickup-route", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const { driverId, orderIds, startPoint, startTime } = req.body;
      
      if (!driverId || !orderIds?.length || !startPoint || !startTime) {
        return res.status(400).json({ 
          message: "Données incomplètes",
          required: ["driverId", "orderIds", "startPoint", "startTime"]
        });
      }

      // Récupérer le livreur
      const driver = await storage.getUser(driverId);
      if (!driver || driver.role !== "delivery") {
        return res.status(404).json({ message: "Livreur non trouvé" });
      }

      // Récupérer les commandes
      const ordersData = await db.select().from(orders).where(inArray(orders.id, orderIds));
      
      if (ordersData.length === 0) {
        return res.status(404).json({ message: "Aucune commande trouvée" });
      }

      // Récupérer les clients
      const clientIds = [...new Set(ordersData.map(o => o.clientId))];
      const clientsData = await db.select().from(users).where(inArray(users.id, clientIds));

      const driverHomeCoords = getCoordsFromAddress(driver.address);
      if (!driverHomeCoords) {
        return res.status(400).json({ message: "Adresse du livreur introuvable" });
      }

      // Créer les points de commande
      const orderPoints = ordersData.map(order => {
        const client = clientsData.find(c => c.id === order.clientId);
        const coords = client ? getCoordsFromAddress(client.address) : null;
        if (!client || !coords) return null;
        return {
          id: order.id,
          type: order.status === "to_pickup" ? "pickup" : "delivery" as const,
          coords,
          clientName: client.fullName,
          timeWindowStart: null,
          timeWindowEnd: null,
          deliveryTimeWindowStart: null,
          deliveryTimeWindowEnd: null,
          itemCount: order.itemCount || 40
        };
      }).filter(Boolean) as any[];

      if (orderPoints.length === 0) {
        return res.status(400).json({ message: "Aucune commande valide" });
      }

      const startCoords = startPoint === "home" ? driverHomeCoords : LAUNDRY_LOCATION_COORDS;
      const [startH, startM] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(startH, startM, 0, 0);

      const routeData = generatePickupRoute(
        { id: driver.id, name: driver.fullName },
        startCoords,
        orderPoints,
        startDate
      );

      res.json({
        success: true,
        ...routeData,
        driver: {
          id: driver.id,
          name: driver.fullName,
          phone: driver.phone,
          address: driver.address
        },
        totalOrders: orderPoints.length
      });
      
    } catch (error) {
      console.error("Error generating route:", error);
      res.status(500).json({ 
        message: "Erreur serveur lors de la génération de la route",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}