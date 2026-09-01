// shared/utils/route-utils.ts

// ============ CONFIGURATION ============
export const LAUNDRY_LOCATION_COORDS = { lat: -18.931515, lng: 47.474647 };

export const WORKFLOW_STEPS = [
  { status: 'to_pickup', label: 'À ramasser', sla: 8 },
  { status: 'to_sort', label: 'À trier', sla: 4 },
  { status: 'to_wash', label: 'En lavage', sla: 6 },
  { status: 'to_dry', label: 'En séchage', sla: 4 },
  { status: 'to_iron', label: 'En repassage', sla: 5 },
  { status: 'ready_to_deliver', label: 'Prêt à livrer', sla: 2 },
  { status: 'to_deliver', label: 'En livraison', sla: 8 },
  { status: 'delivered', label: 'Livré', sla: 0 },
];

// ============ QUARTIERS D'ANTANANARIVO ============
export const ANTANANARIVO_NEIGHBORHOODS: Record<string, { lat: number; lng: number }> = {
  'Antanimena': { lat: -18.8816, lng: 47.5118 },
  'Andraharo': { lat: -18.8991, lng: 47.5231 },
  'Isoraka': { lat: -18.9136, lng: 47.5253 },
  'Ambohijatovo': { lat: -18.9094, lng: 47.5268 },
  'Analakely': { lat: -18.9068, lng: 47.5251 },
  'Anosy': { lat: -18.9114, lng: 47.5193 },
  'Ampandrianomby': { lat: -18.8956, lng: 47.5081 },
  'Antohomadinika': { lat: -18.8803, lng: 47.5115 },
  'Ambatobe': { lat: -18.8689, lng: 47.5231 },
  'Ankadimbahoaka': { lat: -18.8859, lng: 47.5112 },
  'Andranomena': { lat: -18.8984, lng: 47.5089 },
  'Ambohimiarinarivo': { lat: -18.8835, lng: 47.4989 },
  'Ambatomanga': { lat: -18.9222, lng: 47.5066 },
  'Andoharanofotsy': { lat: -18.9681, lng: 47.5108 },
  'Ampitatafika': { lat: -18.9392, lng: 47.5068 },
  'Anjanahary': { lat: -18.9511, lng: 47.5138 },
  'Faravohitra': { lat: -18.9062, lng: 47.5325 },
  'Ambohidrapeto': { lat: -18.9153, lng: 47.5316 },
  'Mahamasina': { lat: -18.9092, lng: 47.5334 },
  'Tsaralalana': { lat: -18.8986, lng: 47.5302 },
  'Isotry': { lat: -18.9163, lng: 47.5288 },
  'Andohanitaranjo': { lat: -18.9123, lng: 47.5359 },
  'Ambohimanarina': { lat: -18.8952, lng: 47.5408 },
  'Ambatofotsy': { lat: -18.8883, lng: 47.5391 },
  'Ampefiloha': { lat: -18.8951, lng: 47.5185 },
  'Ankorondrano': { lat: -18.8865, lng: 47.5235 },
  'Antsahavola': { lat: -18.9065, lng: 47.5288 },
};

// ============ FONCTIONS ============

/**
 * Calcule la distance Haversine entre deux points
 */
export function getHaversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertit une heure en Date
 */
export function convertTimeToDate(timeStr: string | undefined, baseDate: Date): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Récupère les coordonnées d'un quartier
 */
export function getCoordsFromAddress(neighborhood: string | null): { lat: number; lng: number } | null {
  if (!neighborhood) return null;
  const foundKey = Object.keys(ANTANANARIVO_NEIGHBORHOODS).find(key =>
    neighborhood.toLowerCase().includes(key.toLowerCase())
  );
  return foundKey ? ANTANANARIVO_NEIGHBORHOODS[foundKey] : null;
}

/**
 * Génère une couleur aléatoire
 */
export function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// ============ TYPES ============

export interface OrderPoint {
  id: number;
  type: 'pickup' | 'delivery';
  coords: { lat: number; lng: number };
  clientName: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  deliveryTimeWindowStart?: string;
  deliveryTimeWindowEnd?: string;
  itemCount?: number;
  priority?: string;
  neighborhood?: string;
}

// ============ GÉNÉRATION DE TOURNÉE ============

/**
 * Génère une tournée optimisée pour un livreur
 */
export function generatePickupRoute(
  driver: { id: number; name: string; capacityInItems?: number },
  startCoords: { lat: number; lng: number },
  orders: OrderPoint[],
  startDate: Date
): {
  driver: { id: number; name: string; capacityInItems?: number };
  orders: OrderPoint[];
  route: any[];
  distanceKm: number;
  totalDuration: string;
  color?: string;
  efficiencyScore?: number;
} {
  if (orders.length === 0) {
    return {
      driver,
      orders: [],
      route: [],
      distanceKm: 0,
      totalDuration: '0h00'
    };
  }

  // Trier les commandes par distance depuis le point de départ
  const sortedOrders = [...orders].sort((a, b) => {
    const distA = getHaversineDistance(startCoords, a.coords);
    const distB = getHaversineDistance(startCoords, b.coords);
    return distA - distB;
  });

  let totalDistance = 0;
  let currentCoords = startCoords;
  const route = [];

  for (const order of sortedOrders) {
    const distance = getHaversineDistance(currentCoords, order.coords);
    totalDistance += distance;
    currentCoords = order.coords;
    
    route.push({
      ...order,
      estimatedArrival: calculateEstimatedArrival(totalDistance),
      distanceFromPrevious: distance,
    });
  }

  // Retour au point de départ
  const returnDistance = getHaversineDistance(currentCoords, startCoords);
  totalDistance += returnDistance;

  const totalDuration = calculateDuration(totalDistance, sortedOrders.length);

  return {
    driver: {
      id: driver.id,
      name: driver.name,
      capacityInItems: driver.capacityInItems,
    },
    orders: sortedOrders,
    route,
    distanceKm: parseFloat(totalDistance.toFixed(2)),
    totalDuration,
    efficiencyScore: calculateRouteEfficiency(sortedOrders, totalDistance, driver),
  };
}

function calculateEstimatedArrival(distanceKm: number): string {
  const avgSpeed = 30;
  const timeHours = distanceKm / avgSpeed;
  const totalMinutes = Math.round(timeHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateDuration(distanceKm: number, stops: number): string {
  const drivingTime = distanceKm / 30;
  const stopTime = stops * 0.25;
  const totalHours = drivingTime + stopTime;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

function calculateRouteEfficiency(orders: OrderPoint[], distance: number, driver: any): number {
  const load = orders.reduce((sum, o) => sum + (o.itemCount || 40), 0);
  const capacity = driver.capacityInItems || 100;
  const loadEfficiency = Math.min(load / capacity, 1) * 100;
  const distanceEfficiency = Math.max(0, 100 - (distance / 10));
  return Math.round((loadEfficiency * 0.6 + distanceEfficiency * 0.4));
}