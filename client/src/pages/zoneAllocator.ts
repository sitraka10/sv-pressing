// C:/Users/felan/OneDrive/Bureau/2025/SV PRESSING/APP/sasavanda/client/src/pages/zoneAllocator.ts

// --- Définitions des types et constantes ---

interface Coords {
  lat: number;
  lng: number;
}

// Interface pour les commandes entrantes du backend
interface OrderPoint {
  id: number;
  type: 'pickup' | 'delivery';
  coords: Coords;
  clientName: string;
  // Ces champs doivent être des chaînes 'HH:MM'
  timeWindowStart?: string;
  timeWindowEnd?: string;
  // Ajouté pour alignement avec l'objet order si les noms varient
  deliveryTimeWindowStart?: string;
  deliveryTimeWindowEnd?: string;
  itemCount?: number; // Ajouté pour la capacité des livreurs
}

// Interface pour les arrêts de la tournée avec toutes les infos de calcul
interface RouteStop {
  id: number | string;
  type: 'home' | 'pickup' | 'delivery' | 'laundry';
  coords: Coords;
  clientName: string;
  // Ces champs seront des objets Date APRÈS CONVERSION INTERNE
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
  estimatedArrival?: string;
  departureTimeMs?: number; // Heure de départ en millisecondes pour le calcul
  status?: 'on_time' | 'late'; // Statut de ponctualité
}

// Constantes pour les calculs
const LAUNDRY_LOCATION_COORDS: Coords = { lat: -18.931515, lng: 47.474647 };
const AVERAGE_SPEED_KMH = 20; // Vitesse moyenne en ville en km/h
const TIME_PER_STOP_MIN = 15; // Temps moyen passé à chaque arrêt en minutes

// --- Fonctions Utilitaires ---

// EXPORTÉ pour être utilisé par les routes
export function getHaversineDistance(p1: Coords, p2: Coords): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTotalDistance(route: RouteStop[]): number {
  let distance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    distance += getHaversineDistance(route[i].coords, route[i + 1].coords);
  }
  return distance;
}

/**
 * Convertit une chaîne de temps "HH:MM" en un objet Date, en utilisant une date de base.
 * @param timeString La chaîne de temps au format "HH:MM".
 * @param baseDate La date à utiliser comme base (pour le jour, mois, année). Par défaut: la date actuelle.
 * @returns Un objet Date avec l'heure définie, ou undefined si la chaîne est invalide.
 */
// EXPORTÉ pour être utilisé par les routes
export function convertTimeToDate(timeString?: string, baseDate: Date = new Date()): Date | undefined {
    if (!timeString) return undefined;

    // Ajout d'une vérification de format simple
    if (!/^\d{2}:\d{2}$/.test(timeString)) {
        console.warn(`Format d'heure invalide: "${timeString}". Retourne undefined.`);
        return undefined;
    }

    const [hours, minutes] = timeString.split(':').map(Number);

    // Vérifier si les heures et minutes sont des nombres valides
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`Heures/minutes invalides dans "${timeString}". Retourne undefined.`);
        return undefined;
    }

    const resultDate = new Date(baseDate); // Utilise la date fournie ou la date actuelle
    resultDate.setHours(hours, minutes, 0, 0); // Définit les heures et minutes
    return resultDate;
}

// --- Algorithme d'Optimisation (2-Opt) ---

/**
 * Optimise une route en utilisant l'algorithme 2-Opt, en maintenant les points de début et de fin fixes.
 * @param points Tableau des arrêts (RouteStop) incluant le début et la fin.
 * @returns La route optimisée et sa distance.
 */
function calculateOptimizedRouteWithFixedEnds(
  points: RouteStop[]
): { route: RouteStop[]; distance: number } {
  if (points.length < 2) return { route: points, distance: 0 };

  let bestRoute = [...points];
  let bestDistance = calculateTotalDistance(bestRoute);
  let improved = true;

  // L'algorithme 2-Opt ne modifie pas le premier et le dernier point si i et j sont choisis judicieusement.
  // i commence à 1 (pour ne pas toucher au premier point), j va jusqu'à length - 2 (pour ne pas toucher au dernier).
  while (improved) {
    improved = false;
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        // Crée une nouvelle route en inversant la sous-séquence entre i et j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1),
        ];
        const newDistance = calculateTotalDistance(newRoute);
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }
  return { route: bestRoute, distance: bestDistance };
}

// --- Fonction Principale (Exportée) ---

/**
 * Génère une route optimisée (ramassage ou livraison) pour un seul livreur.
 * @param driver Informations sur le livreur.
 * @param driverHomeCoords Coordonnées du domicile du livreur.
 * @param orders Liste des points de commande (ramassages/livraisons).
 * @param startTime L'heure de début prévue pour la tournée (objet Date).
 * @returns Un objet contenant les détails de la tournée générée.
 */
export function generatePickupRoute(
  driver: { id: number | string; name: string },
  driverHomeCoords: Coords,
  orders: OrderPoint[],
  startTime: Date // startTime est bien un objet Date
) {
  // 1. Tri des commandes par urgence de fin de fenêtre horaire
  const sortedOrders = [...orders].sort((a, b) => {
    // Utilise la fenêtre de temps spécifique à la tâche (pickup ou delivery)
    const aTimeEnd = convertTimeToDate(a.timeWindowEnd || a.deliveryTimeWindowEnd, startTime);
    const bTimeEnd = convertTimeToDate(b.timeWindowEnd || b.deliveryTimeWindowEnd, startTime);

    if (aTimeEnd && bTimeEnd) {
      return aTimeEnd.getTime() - bTimeEnd.getTime();
    }
    // Si une des fenêtres est indéfinie, l'ordre n'est pas strict, mais on essaie de les pousser à la fin
    if (aTimeEnd) return -1; // a a une fenêtre définie, b non -> a est "plus urgent"
    if (bTimeEnd) return 1;  // b a une fenêtre définie, a non -> b est "plus urgent"
    return 0; // Aucune fenêtre définie, pas de préférence
  });

  // 2. Construction de la liste initiale des arrêts (incluant domicile et laverie)
  const homeStop: RouteStop = {
    id: 'home',
    type: 'home',
    coords: driverHomeCoords,
    clientName: `Domicile (${driver.name})`,
    // Formatage de l'heure de départ du domicile
    estimatedArrival: startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    departureTimeMs: startTime.getTime(), // Initialise le temps de départ du domicile
  };

  const laundryStop: RouteStop = {
    id: 'laundry',
    type: 'laundry',
    coords: LAUNDRY_LOCATION_COORDS,
    clientName: 'Laverie',
    // La laverie n'a pas de fenêtre horaire client, mais peut avoir un temps d'opération
  };

  const orderStops: RouteStop[] = sortedOrders.map((o) => ({
    id: o.id,
    type: o.type,
    coords: o.coords,
    clientName: o.clientName,
    // Convertit les chaînes 'HH:MM' en objets Date pour les calculs de fenêtre horaire
    timeWindowStart: convertTimeToDate(o.timeWindowStart || o.deliveryTimeWindowStart, startTime),
    timeWindowEnd: convertTimeToDate(o.timeWindowEnd || o.deliveryTimeWindowEnd, startTime),
  }));

  // La route complète pour l'optimisation doit inclure le point de départ (domicile/laverie) et le point de retour (laverie/domicile)
  // Pour l'instant, on part du domicile et on finit à la laverie.
  const allStops = [homeStop, ...orderStops, laundryStop];

  // 3. OPTIMISATION GÉOGRAPHIQUE : Trouver le meilleur ordre des arrêts intermédiaires.
  // Les points homeStop et laundryStop sont fixes aux extrémités pour le 2-Opt.
  const { route: optimizedGeographicRoute } = calculateOptimizedRouteWithFixedEnds(allStops);

  // 4. CALCUL TEMPOREL : Parcourir la route optimisée pour calculer les heures d'arrivée/départ et la ponctualité.
  let currentTimeMs = homeStop.departureTimeMs!; // Commence avec l'heure de départ du domicile
  const TIME_PER_STOP_MS = TIME_PER_STOP_MIN * 60 * 1000;
  const finalRouteWithTimes: RouteStop[] = [];

  optimizedGeographicRoute.forEach((stop, index) => {
    let arrivalTimeMs = currentTimeMs;

    // Pour tous les arrêts sauf le premier (le point de départ initial)
    if (index > 0) {
      const prevStop = finalRouteWithTimes[index - 1]; // L'arrêt précédent, déjà traité et avec `departureTimeMs`
      const travelDistance = getHaversineDistance(prevStop.coords, stop.coords);
      const travelTimeMs = (travelDistance / AVERAGE_SPEED_KMH) * 3600 * 1000; // en millisecondes
      arrivalTimeMs = prevStop.departureTimeMs! + travelTimeMs;
    } else {
      // C'est le premier arrêt (homeStop), son heure de départ est déjà définie
      finalRouteWithTimes.push(homeStop);
      return; // Passe à l'arrêt suivant
    }

    // Calcul du temps d'attente si le livreur arrive avant la fenêtre horaire du client
    let waitTimeMs = 0;
    if (stop.timeWindowStart && arrivalTimeMs < stop.timeWindowStart.getTime()) {
      waitTimeMs = stop.timeWindowStart.getTime() - arrivalTimeMs;
    }

    // Heure d'arrivée effective (après attente)
    const effectiveArrivalTimeMs = arrivalTimeMs + waitTimeMs;

    // Heure de départ de cet arrêt (arrivée effective + temps passé sur place)
    const departureTimeMs = effectiveArrivalTimeMs + TIME_PER_STOP_MS;

    // Formatage de l'heure d'arrivée estimée pour l'affichage
    const arrivalDate = new Date(effectiveArrivalTimeMs);
    const formattedArrivalTime = `${arrivalDate.getHours().toString().padStart(2, '0')}:${arrivalDate.getMinutes().toString().padStart(2, '0')}`;

    // Vérification de la ponctualité par rapport à la fin de la fenêtre horaire du client
    const isLate = (stop.timeWindowEnd && effectiveArrivalTimeMs > stop.timeWindowEnd.getTime());

    finalRouteWithTimes.push({
      ...stop,
      estimatedArrival: formattedArrivalTime,
      departureTimeMs: departureTimeMs,
      status: isLate ? 'late' : 'on_time',
    });

    // Mettre à jour le temps courant pour le prochain calcul
    currentTimeMs = departureTimeMs;
  });

  // 5. Formatage du retour final
  return {
    driver: driver,
    color: '#3b82f6', // Couleur par défaut pour la tournée
    orders: sortedOrders, // Les commandes originales, triées par l'algo
    route: finalRouteWithTimes, // La route optimisée avec les heures
    distanceKm: calculateTotalDistance(optimizedGeographicRoute).toFixed(2),
    pickups: orders.filter(o => o.type === 'pickup').length,
    deliveries: orders.filter(o => o.type === 'delivery').length,
  };
}