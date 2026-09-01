

import React, {
  useState,
  useMemo,
  useEffect,
} from 'react';

import {
  MapContainer as LeafletMapContainer,
  TileLayer as LeafletTileLayer,
  Circle as LeafletCircle,
  Popup as LeafletPopup,
  Tooltip as LeafletTooltip,
  Polyline as LeafletPolyline,
  Marker as LeafletMarker,
} from 'react-leaflet';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './DeliveryMap.css';

// ==========================================================
// COMPATIBILITÉ TYPESCRIPT
// ==========================================================

const MapContainer = LeafletMapContainer as any;
const TileLayer = LeafletTileLayer as any;
const Circle = LeafletCircle as any;
const Popup = LeafletPopup as any;
const Tooltip = LeafletTooltip as any;
const Polyline = LeafletPolyline as any;
const Marker = LeafletMarker as any;

// ==========================================================
// CONFIGURATION LEAFLET
// ==========================================================

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

// ==========================================================
// TYPES
// ==========================================================

interface Coords {
  lat: number;
  lng: number;
}

interface OrderInfo {
  id: number;
  clientName: string;
  status: string;

  estimatedArrival?: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;

  itemCount?: number;

  type: 'pickup' | 'delivery';

  coords: Coords;

  // ========================================================
  // DATES
  // ========================================================

  scheduledDate?: Date | string;

  deliveryDate?: Date | string;

  pickupDate?: Date | string;

  scheduledAt?: Date | string;

  date?: Date | string;

  createdAt?: Date | string;

  // ========================================================
  // AUTRES
  // ========================================================

  priority?: number;

  isVirtualStop?: boolean;

  [key: string]: any;
}

interface NeighborhoodInfo {
  name: string;
  coords: Coords;
  pickups: OrderInfo[];
  deliveries: OrderInfo[];
}

interface DriverInfo {
  id: number;
  name: string;
  color: string;
  currentLoad?: number;
  capacityInItems?: number;
  startCoords?: Coords;
  startAddress?: string;
}

interface ZoneData {
  driver: DriverInfo;
  route?: OrderInfo[];
  orders?: OrderInfo[];
  color: string;
  distanceKm?: number;
  totalDuration?: string;
}

interface DeliveryMapProps {
  center: Coords;

  zoom: number;

  neighborhoods?: NeighborhoodInfo[];

  zoneData?: ZoneData[];

  hoveredStopId?: number | null;

  showTraffic?: boolean;

  simulationData?: any;

  orders?: OrderInfo[];

  dateFilter?: Date;

  svPressingLocation?: Coords;
}

// ==========================================================
// BADGE
// ==========================================================

const Badge: React.FC<{
  variant?: 'default' | 'secondary' | 'warning' | 'danger';
  children: React.ReactNode;
}> = ({
  variant = 'default',
  children,
}) => {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
};

// ==========================================================
// UTILITAIRES DATE
// ==========================================================

/**
 * Retourne la date métier de la commande.
 *
 * IMPORTANT :
 *
 * Pickup:
 *   pickupDate PRIORITAIRE
 *
 * Delivery:
 *   deliveryDate PRIORITAIRE
 *
 * On évite ainsi d'utiliser createdAt
 * à la place de la date réelle de livraison/ramassage.
 */
const getOrderDate = (
  order: OrderInfo | any
): Date | string | undefined => {
  if (!order) {
    return undefined;
  }

  // ========================================================
  // RAMASSAGE
  // ========================================================

  if (
    order.type === 'pickup' ||
    order.type === 'ramassage'
  ) {
    return (
      order.pickupDate ??
      order.pickup_date ??
      order.scheduledDate ??
      order.scheduled_date ??
      order.scheduledAt ??
      order.scheduled_at ??
      order.date ??
      order.createdAt
    );
  }

  // ========================================================
  // LIVRAISON
  // ========================================================

  if (
    order.type === 'delivery' ||
    order.type === 'livraison'
  ) {
    return (
      order.deliveryDate ??
      order.delivery_date ??
      order.scheduledDate ??
      order.scheduled_date ??
      order.scheduledAt ??
      order.scheduled_at ??
      order.date ??
      order.createdAt
    );
  }

  // ========================================================
  // FALLBACK
  // ========================================================

  return (
    order.pickupDate ??
    order.pickup_date ??
    order.deliveryDate ??
    order.delivery_date ??
    order.scheduledDate ??
    order.scheduled_date ??
    order.scheduledAt ??
    order.scheduled_at ??
    order.date ??
    order.createdAt
  );
};

/**
 * Convertit une date vers YYYY-MM-DD.
 *
 * Important:
 * On traite directement les formats ISO
 * pour éviter les problèmes de timezone.
 */
const normalizeDateOnly = (
  value: Date | string | undefined
): string | null => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  // ========================================================
  // DATE JS
  // ========================================================

  if (value instanceof Date) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    return `${value.getFullYear()}-${String(
      value.getMonth() + 1
    ).padStart(2, '0')}-${String(
      value.getDate()
    ).padStart(2, '0')}`;
  }

  const rawValue =
    String(value).trim();

  if (!rawValue) {
    return null;
  }

  // ========================================================
  // YYYY-MM-DD
  // ========================================================

  const directMatch =
    rawValue.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
  }

  // ========================================================
  // YYYY-MM-DDTHH:mm:ss
  // ========================================================

  const isoMatch =
    rawValue.match(
      /^(\d{4})-(\d{2})-(\d{2})T/
    );

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // ========================================================
  // YYYY-MM-DD HH:mm:ss
  // ========================================================

  const sqlMatch =
    rawValue.match(
      /^(\d{4})-(\d{2})-(\d{2})\s/
    );

  if (sqlMatch) {
    return `${sqlMatch[1]}-${sqlMatch[2]}-${sqlMatch[3]}`;
  }

  // ========================================================
  // DD/MM/YYYY
  // ========================================================

  const frenchMatch =
    rawValue.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (frenchMatch) {
    return `${frenchMatch[3]}-${frenchMatch[2]}-${frenchMatch[1]}`;
  }

  // ========================================================
  // FALLBACK
  // ========================================================

  const parsed =
    new Date(rawValue);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(2, '0')}-${String(
    parsed.getDate()
  ).padStart(2, '0')}`;
};

/**
 * Compare uniquement YYYY-MM-DD.
 */
const isSameDate = (
  orderDate:
    | Date
    | string
    | undefined,

  selectedDate:
    | Date
    | undefined
): boolean => {
  if (!selectedDate) {
    return true;
  }

  const normalizedOrderDate =
    normalizeDateOnly(
      orderDate
    );

  const normalizedSelectedDate =
    normalizeDateOnly(
      selectedDate
    );

  if (
    !normalizedOrderDate ||
    !normalizedSelectedDate
  ) {
    return false;
  }

  return (
    normalizedOrderDate ===
    normalizedSelectedDate
  );
};

// ==========================================================
// ICÔNE SV PRESSING
// ==========================================================

const createSVPressingIcon =
  () => {
    return L.divIcon({
      html: `
        <div style="
          background-color:#8B5CF6;
          width:48px;
          height:48px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 4px 15px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:22px;
          position:relative;
        ">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 9L12 3L21 9L12 21L3 9Z" />
            <path d="M9 9L15 9" />
            <path d="M12 9L12 15" />
            <path d="M9 15L15 15" />
          </svg>

          <div style="
            position:absolute;
            bottom:-28px;
            left:50%;
            transform:translateX(-50%);
            white-space:nowrap;
            background:#8B5CF6;
            padding:4px 12px;
            border-radius:20px;
            font-size:11px;
            font-weight:600;
            color:white;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
          ">
            Retour au siège
          </div>
        </div>
      `,

      className:
        'sv-pressing-marker',

      iconSize: [48, 48],

      iconAnchor: [24, 48],
    });
  };

// ==========================================================
// ICÔNE COMMANDE
// ==========================================================

const createDeliveryIcon = (
  type:
    | 'pickup'
    | 'delivery',

  isHovered: boolean,

  priority?: number
) => {
  const iconColor =
    type === 'pickup'
      ? '#3B82F6'
      : '#10B981';

  const size =
    isHovered
      ? 38
      : 32;

  const borderSize =
    isHovered
      ? 3
      : 2;

  return L.divIcon({
    html: `
      <div style="
        background-color:${iconColor};
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        border:${borderSize}px solid white;
        box-shadow:0 2px 10px rgba(0,0,0,0.3);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        position:relative;
      ">

        ${
          type === 'pickup'
            ? `
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 7L4 7" />
                <path d="M16 3L20 7L16 11" />
                <path d="M8 15L4 11L8 7" />
                <circle cx="6" cy="17" r="3" />
                <circle cx="18" cy="17" r="3" />
              </svg>
            `
            : `
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect
                  x="1"
                  y="3"
                  width="15"
                  height="13"
                  rx="2"
                />
                <path d="M16 8L22 8L22 16C22 17.1 21.1 18 20 18L18 18" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="18" r="3" />
              </svg>
            `
        }

        ${
          priority &&
          priority >= 3
            ? `
              <div style="
                position:absolute;
                top:-6px;
                right:-6px;
                background:#EF4444;
                width:16px;
                height:16px;
                border-radius:50%;
                border:2px solid white;
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                ★
              </div>
            `
            : ''
        }
      </div>
    `,

    className:
      'custom-marker',

    iconSize: [
      size,
      size,
    ],

    iconAnchor: [
      size / 2,
      size / 2,
    ],
  });
};

// ==========================================================
// ICÔNE ARRÊT
// ==========================================================

const createRouteStopIcon = (
  type:
    | 'pickup'
    | 'delivery',

  index: number,

  isHovered: boolean
) => {
  const iconColor =
    type === 'pickup'
      ? '#3B82F6'
      : '#10B981';

  const size =
    isHovered
      ? 36
      : 30;

  return L.divIcon({
    html: `
      <div style="
        background-color:${iconColor};
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 12px rgba(0,0,0,0.3);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-weight:bold;
        font-size:${size * 0.4}px;
        position:relative;
      ">

        ${index + 1}

        <div style="
          position:absolute;
          top:-4px;
          right:-4px;
          background:${iconColor};
          border-radius:50%;
          width:${size / 3}px;
          height:${size / 3}px;
          border:1px solid white;
          font-size:8px;
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          ${
            type === 'pickup'
              ? 'P'
              : 'D'
          }
        </div>
      </div>
    `,

    className:
      'route-stop-marker',

    iconSize: [
      size,
      size,
    ],

    iconAnchor: [
      size / 2,
      size / 2,
    ],
  });
};

// ==========================================================
// COMPOSANT PRINCIPAL
// ==========================================================

const DeliveryMap: React.FC<
  DeliveryMapProps
> = ({
  center,

  zoom,

  neighborhoods = [],

  zoneData = [],

  hoveredStopId = null,

  showTraffic = false,

  orders = [],

  dateFilter,

  svPressingLocation,
}) => {
  const [
    selectedStop,
    setSelectedStop,
  ] = useState<any>(null);

  const [
    selectedNeighborhood,
    setSelectedNeighborhood,
  ] = useState<any>(null);

  const [
    showDriverStarts,
    setShowDriverStarts,
  ] = useState(true);

  const [
    roadRoutes,
    setRoadRoutes,
  ] = useState<
    Record<
      string,
      [number, number][]
    >
  >({});

  const [
    showLegend,
    setShowLegend,
  ] = useState(true);

  const showGlobalView =
    zoneData.length === 0;

  // ========================================================
  // FILTRE COMMANDES PAR DATE
  // ========================================================

  const filteredOrders =
    useMemo(() => {
      const allOrders =
        orders || [];

      if (!dateFilter) {
        return allOrders;
      }

      return allOrders.filter(
        (
          order: OrderInfo
        ) => {
          const orderDate =
            getOrderDate(
              order
            );

          return isSameDate(
            orderDate,
            dateFilter
          );
        }
      );
    }, [
      orders,
      dateFilter,
    ]);

  // ========================================================
  // FILTRE ZONES PAR DATE
  // ========================================================

  const filteredZoneData =
    useMemo(() => {
      if (!dateFilter) {
        return zoneData;
      }

      return zoneData
        .map((zone) => {
          const sourceOrders =
            zone.route ||
            zone.orders ||
            [];

          const filteredRoute =
            sourceOrders.filter(
              (
                order: OrderInfo
              ) => {
                if (
                  order.isVirtualStop
                ) {
                  return true;
                }

                const orderDate =
                  getOrderDate(
                    order
                  );

                return isSameDate(
                  orderDate,
                  dateFilter
                );
              }
            );

          return {
            ...zone,

            route:
              filteredRoute,

            orders:
              filteredRoute,
          };
        })

        .filter(
          (zone) => {
            const route =
              zone.route ||
              zone.orders ||
              [];

            return route.some(
              (
                order: any
              ) =>
                !order.isVirtualStop &&
                (
                  order.type ===
                    'pickup' ||
                  order.type ===
                    'delivery'
                )
            );
          }
        );
    }, [
      zoneData,
      dateFilter,
    ]);

  // ========================================================
  // ROUTES OSRM
  // ========================================================

  useEffect(() => {
    let cancelled =
      false;

    const loadRoadRoutes =
      async () => {
        if (
          filteredZoneData.length ===
            0 ||
          !svPressingLocation
        ) {
          setRoadRoutes(
            {}
          );

          return;
        }

        const nextRoutes: Record<
          string,
          [number, number][]
        > = {};

        await Promise.all(
          filteredZoneData.map(
            async (zone) => {
              const stops = (
                zone.route ||
                zone.orders ||
                []
              ).filter(
                (
                  stop: any
                ) =>
                  stop &&
                  !stop.isVirtualStop &&
                  (
                    stop.type ===
                      'pickup' ||
                    stop.type ===
                      'delivery'
                  ) &&
                  stop.coords &&
                  Number.isFinite(
                    stop.coords.lat
                  ) &&
                  Number.isFinite(
                    stop.coords.lng
                  )
              );

              if (
                stops.length ===
                0
              ) {
                return;
              }

              const driverStart =
                zone.driver.startCoords &&
                Number.isFinite(zone.driver.startCoords.lat) &&
                Number.isFinite(zone.driver.startCoords.lng)
                  ? zone.driver.startCoords
                  : svPressingLocation;

              const points =
                [
                  driverStart,
                  ...stops.map(
                    (
                      stop: any
                    ) =>
                      stop.coords
                  ),
                  svPressingLocation,
                ];

              const coordinates =
                points
                  .map(
                    (
                      point
                    ) =>
                      `${point.lng},${point.lat}`
                  )
                  .join(';');

              try {
                const response =
                  await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`
                  );

                if (
                  !response.ok
                ) {
                  return;
                }

                const data =
                  await response.json();

                const geometry =
                  data
                    ?.routes?.[0]
                    ?.geometry
                    ?.coordinates;

                if (
                  Array.isArray(
                    geometry
                  ) &&
                  geometry.length >
                    1
                ) {
                  nextRoutes[
                    zone.driver.id.toString()
                  ] =
                    geometry.map(
                      (
                        point: [
                          number,
                          number
                        ]
                      ) =>
                        [
                          point[1],
                          point[0],
                        ] as [
                          number,
                          number
                        ]
                    );
                }
              } catch {
                // Fallback direct
              }
            }
          )
        );

        if (
          !cancelled
        ) {
          setRoadRoutes(
            nextRoutes
          );
        }
      };

    loadRoadRoutes();

    return () => {
      cancelled = true;
    };
  }, [
    filteredZoneData,
    svPressingLocation,
  ]);

  // ========================================================
  // COMMANDES VISIBLES
  // ========================================================

  const visibleOrders =
    useMemo(() => {
      if (
        filteredZoneData.length >
        0
      ) {
        const allRouteOrders: OrderInfo[] =
          [];

        filteredZoneData.forEach(
          (zone) => {
            const routeData =
              zone.route ||
              zone.orders ||
              [];

            routeData.forEach(
              (
                order: any
              ) => {
                if (
                  order &&
                  !order.isVirtualStop &&
                  order.coords &&
                  typeof order.coords
                    .lat ===
                    'number' &&
                  typeof order.coords
                    .lng ===
                    'number'
                ) {
                  allRouteOrders.push(
                    order
                  );
                }
              }
            );
          }
        );

        return allRouteOrders;
      }

      return filteredOrders;
    }, [
      filteredZoneData,
      filteredOrders,
    ]);

  // ========================================================
  // SIÈGE SV PRESSING
  // ========================================================

  const renderSVPressing =
    () => {
      if (
        !svPressingLocation
      ) {
        return null;
      }

      return (
        <Marker
          position={
            svPressingLocation
          }
          icon={createSVPressingIcon()}
          eventHandlers={{
            click: () => {
              setSelectedStop({
                id: 'sv-pressing',

                clientName:
                  'Siège SV Pressing',

                type: 'depot',

                coords:
                  svPressingLocation,

                status:
                  'Point de retour et de départ',
              });
            },
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[
              0,
              -30,
            ]}
            className="sv-pressing-tooltip"
          >
            Départ et retour -
            SV Pressing
          </Tooltip>
        </Marker>
      );
    };

  // ========================================================
  // MARQUEURS COMMANDES
  // ========================================================

  const renderOrdersMarkers =
    () => {
      if (
        filteredZoneData.length >
        0
      ) {
        return null;
      }

      if (
        visibleOrders.length ===
        0
      ) {
        return (
          <Circle
            center={center}
            radius={500}
            pathOptions={{
              color:
                '#F59E0B',

              fillColor:
                '#F59E0B',

              fillOpacity:
                0.1,

              weight: 2,

              dashArray:
                '5, 5',
            }}
          >
            <Tooltip
              permanent
              direction="center"
              className="neighborhood-label"
            >
              {dateFilter
                ? `Aucune commande pour le ${dateFilter.toLocaleDateString(
                    'fr-FR'
                  )}`
                : 'Aucune commande disponible'}
            </Tooltip>
          </Circle>
        );
      }

      return visibleOrders.map(
        (
          order,
          index
        ) => {
          const isHovered =
            order.id ===
            hoveredStopId;

          return (
            <Marker
              key={`order-${order.id}-${index}`}
              position={
                order.coords
              }
              icon={createDeliveryIcon(
                order.type,
                isHovered,
                order.priority
              )}
              eventHandlers={{
                click: () =>
                  setSelectedStop(
                    order
                  ),
              }}
            >
              <Tooltip
                direction="top"
                offset={[
                  0,
                  -22,
                ]}
                opacity={1}
                className="custom-tooltip"
              >
                <div
                  style={{
                    fontWeight:
                      'bold',
                    marginBottom:
                      '4px',
                  }}
                >
                  {order.type ===
                  'pickup'
                    ? 'Ramassage'
                    : 'Livraison'}{' '}
                  #
                  {order.id}
                </div>

                <div
                  style={{
                    marginBottom:
                      '4px',
                  }}
                >
                  {
                    order.clientName
                  }
                </div>

                {order.itemCount !==
                  undefined && (
                  <div
                    style={{
                      fontSize:
                        '12px',
                    }}
                  >
                    {order.type ===
                    'pickup'
                      ? `+${order.itemCount}`
                      : `-${order.itemCount}`}{' '}
                    articles
                  </div>
                )}

                {order.pickupDate &&
                  order.type ===
                    'pickup' && (
                    <div
                      style={{
                        fontSize:
                          '11px',
                        marginTop:
                          '4px',
                        color:
                          '#2563eb',
                      }}
                    >
                      Ramassage:{' '}
                      {normalizeDateOnly(
                        order.pickupDate
                      )}
                    </div>
                  )}

                {order.deliveryDate &&
                  order.type ===
                    'delivery' && (
                    <div
                      style={{
                        fontSize:
                          '11px',
                        marginTop:
                          '4px',
                        color:
                          '#059669',
                      }}
                    >
                      Livraison:{' '}
                      {normalizeDateOnly(
                        order.deliveryDate
                      )}
                    </div>
                  )}

                {order.estimatedArrival && (
                  <div
                    style={{
                      fontSize:
                        '11px',
                      color:
                        '#64748b',
                    }}
                  >
                    Arrivée prévue:{' '}
                    {
                      order.estimatedArrival
                    }
                  </div>
                )}

                {order.priority &&
                  order.priority >=
                    3 && (
                    <div
                      style={{
                        fontSize:
                          '10px',
                        color:
                          '#ef4444',
                        marginTop:
                          '2px',
                      }}
                    >
                      Priorité haute
                    </div>
                  )}
              </Tooltip>
            </Marker>
          );
        }
      );
    };

  // ========================================================
  // QUARTIERS
  // ========================================================

  const renderNeighborhoodsMarkers =
    () => {
      return neighborhoods
        .map(
          (
            hood
          ) => {
            const hasPickups =
              hood.pickups
                .length >
              0;

            const hasDeliveries =
              hood.deliveries
                .length >
              0;

            const color =
              hasDeliveries
                ? '#22c55e'
                : '#3b82f6';

            if (
              !hasPickups &&
              !hasDeliveries
            ) {
              return null;
            }

            return (
              <Circle
                key={`hood-${hood.name}`}
                center={
                  hood.coords
                }
                radius={250}
                pathOptions={{
                  color,

                  fillColor:
                    color,

                  fillOpacity:
                    0.15,

                  weight: 2,
                }}
                className="neighborhood-circle"
                eventHandlers={{
                  click: () =>
                    setSelectedNeighborhood(
                      hood
                    ),
                }}
              >
                <Tooltip
                  permanent
                  direction="center"
                  className="neighborhood-label"
                >
                  {hood.name} (
                  {hood.pickups.length +
                    hood
                      .deliveries
                      .length}
                  )
                </Tooltip>
              </Circle>
            );
          }
        )
        .filter(Boolean);
    };

  // ========================================================
  // DÉPARTS LIVREURS
  // ========================================================

  const renderDriverStartPoints =
    () => {
      if (
        !showDriverStarts ||
        filteredZoneData.length ===
          0
      ) {
        return null;
      }

      const getDriverInitials =
        (
          name: string
        ): string => {
          const parts =
            name
              .trim()
              .split(
                /\s+/
              )
              .filter(
                Boolean
              );

          if (
            parts.length ===
            0
          ) {
            return '?';
          }

          if (
            parts.length ===
            1
          ) {
            return parts[0]
              .slice(
                0,
                2
              )
              .toUpperCase();
          }

          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        };

      const driverColors =
        [
          '#DC2626',
          '#2563EB',
          '#059669',
          '#7C3AED',
          '#D97706',
          '#DB2777',
          '#0891B2',
          '#65A30D',
        ];

      const workingZones =
        filteredZoneData.filter(
          (
            zone
          ) => {
            const realStops =
              (
                zone.route ||
                zone.orders ||
                []
              ).filter(
                (
                  stop: any
                ) =>
                  stop &&
                  !stop.isVirtualStop &&
                  (
                    stop.type ===
                      'pickup' ||
                    stop.type ===
                      'delivery'
                  ) &&
                  stop.coords &&
                  typeof stop.coords
                    .lat ===
                    'number' &&
                  typeof stop.coords
                    .lng ===
                    'number'
              );

            return (
              realStops.length >
              0
            );
          }
        );

      return workingZones
        .map(
          (
            zone,
            index
          ) => {
            const realStops =
              (
                zone.route ||
                zone.orders ||
                []
              ).filter(
                (
                  stop: any
                ) =>
                  stop &&
                  !stop.isVirtualStop &&
                  (
                    stop.type ===
                      'pickup' ||
                    stop.type ===
                      'delivery'
                  ) &&
                  stop.coords &&
                  typeof stop.coords
                    .lat ===
                    'number' &&
                  typeof stop.coords
                    .lng ===
                    'number'
              );

            const firstStop =
              realStops[0];

            if (
              !firstStop &&
              !svPressingLocation
            ) {
              return null;
            }

            let startPoint:
              Coords;

            if (
              zone.driver.startCoords &&
              Number.isFinite(zone.driver.startCoords.lat) &&
              Number.isFinite(zone.driver.startCoords.lng)
            ) {
              startPoint = zone.driver.startCoords;
            } else if (
              svPressingLocation
            ) {
              const count =
                Math.max(
                  workingZones.length,
                  1
                );

              const angle =
                (2 *
                  Math.PI *
                  index) /
                count;

              const radius =
                0.00115;

              startPoint = {
                lat:
                  svPressingLocation.lat +
                  Math.sin(
                    angle
                  ) *
                    radius,

                lng:
                  svPressingLocation.lng +
                  Math.cos(
                    angle
                  ) *
                    radius,
              };
            } else {
              startPoint = {
                lat:
                  firstStop!.coords
                    .lat -
                  0.008,

                lng:
                  firstStop!.coords
                    .lng -
                  0.008,
              };
            }

            const markerColor =
              driverColors[
                index %
                  driverColors.length
              ];

            const initials =
              getDriverInitials(
                zone.driver
                  .name
              );

            const driverIcon =
              L.divIcon({
                html: `
                  <div style="
                    width:46px;
                    height:46px;
                    border-radius:50%;
                    background:${markerColor};
                    border:4px solid white;
                    box-shadow:0 4px 12px rgba(0,0,0,0.35);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:white;
                    font-weight:800;
                    font-size:14px;
                    position:relative;
                  ">
                    ${initials}

                    <div style="
                      position:absolute;
                      top:-8px;
                      right:-8px;
                      min-width:20px;
                      height:20px;
                      padding:0 5px;
                      border-radius:10px;
                      background:white;
                      color:${markerColor};
                      border:2px solid ${markerColor};
                      font-size:9px;
                      font-weight:800;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                    ">
                      ${index + 1}
                    </div>

                    <div style="
                      position:absolute;
                      top:50px;
                      left:50%;
                      transform:translateX(-50%);
                      white-space:nowrap;
                      background:${markerColor};
                      color:white;
                      padding:4px 9px;
                      border-radius:12px;
                      font-size:10px;
                      font-weight:700;
                      box-shadow:0 2px 8px rgba(0,0,0,0.22);
                    ">
                      ${zone.driver.name}
                    </div>
                  </div>
                `,

                className:
                  'driver-start-marker-all',

                iconSize: [
                  46,
                  70,
                ],

                iconAnchor: [
                  23,
                  46,
                ],
              });

            return (
              <Marker
                key={`driver-start-${zone.driver.id}-${index}`}
                position={
                  startPoint
                }
                icon={
                  driverIcon
                }
                eventHandlers={{
                  click: () => {
                    setSelectedStop(
                      {
                        id: `driver-${zone.driver.id}`,

                        clientName:
                          zone.driver
                            .name,

                        type: 'driver',

                        coords:
                          startPoint,

                        status:
                          'Départ de tournée',

                        driver:
                          zone.driver,
                      }
                    );
                  },
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[
                    0,
                    -44,
                  ]}
                  className="driver-start-tooltip"
                >
                  <div
                    style={{
                      fontWeight:
                        700,
                    }}
                  >
                    {
                      zone
                        .driver
                        .name
                    }
                  </div>

                  <div
                    style={{
                      fontSize:
                        '10px',
                    }}
                  >
                    Départ :
                    {zone.driver.startAddress || 'Adresse du livreur'}
                  </div>

                  <div
                    style={{
                      fontSize:
                        '10px',
                    }}
                  >
                    Véhicule :
                    Bicyclette
                  </div>

                  <div
                    style={{
                      fontSize:
                        '10px',
                    }}
                  >
                    Capacité:{' '}
                    {zone
                      .driver
                      .capacityInItems ??
                      50}{' '}
                    kg
                  </div>

                  <div
                    style={{
                      fontSize:
                        '10px',
                    }}
                  >
                    Arrêts:{' '}
                    {
                      realStops.length
                    }
                  </div>
                </Tooltip>
              </Marker>
            );
          }
        )
        .filter(Boolean);
    };

  // ========================================================
  // ROUTES
  // ========================================================

  const renderRoutes =
    () => {
      const workingZones =
        filteredZoneData.filter(
          (
            zone
          ) => {
            const realStops =
              (
                zone.route ||
                zone.orders ||
                []
              ).filter(
                (
                  stop: any
                ) =>
                  stop &&
                  !stop.isVirtualStop &&
                  (
                    stop.type ===
                      'pickup' ||
                    stop.type ===
                      'delivery'
                  ) &&
                  stop.coords &&
                  typeof stop.coords
                    .lat ===
                    'number' &&
                  typeof stop.coords
                    .lng ===
                    'number'
              );

            return (
              realStops.length >
              0
            );
          }
        );

      return workingZones.map(
        (
          zone,
          zoneIndex
        ) => {
          const realStops =
            (
              zone.route ||
              zone.orders ||
              []
            ).filter(
              (
                stop: any
              ) =>
                stop &&
                !stop.isVirtualStop &&
                (
                  stop.type ===
                    'pickup' ||
                  stop.type ===
                    'delivery'
                ) &&
                stop.coords &&
                typeof stop.coords
                  .lat ===
                  'number' &&
                typeof stop.coords
                  .lng ===
                  'number'
            );

          if (
            realStops.length ===
            0
          ) {
            return null;
          }

          const directPositions: [
            number,
            number
          ][] = [];

          const driverStart =
            zone.driver.startCoords &&
            Number.isFinite(zone.driver.startCoords.lat) &&
            Number.isFinite(zone.driver.startCoords.lng)
              ? zone.driver.startCoords
              : svPressingLocation;

          if (driverStart) {
            directPositions.push([
              driverStart.lat,
              driverStart.lng,
            ]);
          }

          realStops.forEach(
            (
              stop: any
            ) => {
              directPositions.push([
                stop.coords.lat,
                stop.coords.lng,
              ]);
            }
          );

          if (
            svPressingLocation
          ) {
            directPositions.push([
              svPressingLocation.lat,
              svPressingLocation.lng,
            ]);
          }

          const roadPositions =
            roadRoutes[
              zone.driver.id.toString()
            ] ||
            directPositions;

          if (
            roadPositions.length <
            2
          ) {
            return null;
          }

          return (
            <React.Fragment
              key={`route-${zone.driver.id}-${zoneIndex}`}
            >
              <Polyline
                positions={
                  roadPositions
                }
                pathOptions={{
                  color:
                    '#FFFFFF',

                  weight: 12,

                  opacity:
                    0.95,

                  lineCap:
                    'round',

                  lineJoin:
                    'round',
                }}
              />

              <Polyline
                positions={
                  roadPositions
                }
                pathOptions={{
                  color:
                    '#FF0000',

                  weight: 7,

                  opacity: 1,

                  lineCap:
                    'round',

                  lineJoin:
                    'round',
                }}
              />

              {realStops.map(
                (
                  order: any,
                  index
                ) => {
                  const isHovered =
                    order.id ===
                    hoveredStopId;

                  return (
                    <Marker
                      key={`route-stop-${zone.driver.id}-${String(
                        order.id
                      )}-${index}`}
                      position={
                        order.coords
                      }
                      icon={createRouteStopIcon(
                        order.type,
                        index,
                        isHovered
                      )}
                      eventHandlers={{
                        click: () =>
                          setSelectedStop(
                            {
                              ...order,

                              zoneIndex,

                              driver:
                                zone.driver,

                              sequence:
                                index +
                                1,
                            }
                          ),
                      }}
                    >
                      <Tooltip
                        direction="top"
                        offset={[
                          0,
                          -18,
                        ]}
                        className="route-tooltip"
                      >
                        <div
                          style={{
                            fontWeight:
                              'bold',

                            marginBottom:
                              '3px',
                          }}
                        >
                          Étape{' '}
                          {index +
                            1}{' '}
                          - #
                          {
                            order.id
                          }
                        </div>

                        <div>
                          <strong>
                            {order.type ===
                            'pickup'
                              ? 'Ramassage'
                              : 'Livraison'}
                          </strong>
                        </div>

                        <div>
                          <strong>
                            {
                              order.clientName
                            }
                          </strong>
                        </div>

                        <div
                          style={{
                            fontSize:
                              '11px',
                            marginTop:
                              '3px',
                          }}
                        >
                          {order.type ===
                          'pickup'
                            ? `+${order.itemCount || 0}`
                            : `-${order.itemCount || 0}`}{' '}
                          articles
                        </div>

                        {order.pickupDate &&
                          order.type ===
                            'pickup' && (
                            <div
                              style={{
                                fontSize:
                                  '10px',
                                marginTop:
                                  '3px',
                                color:
                                  '#2563eb',
                              }}
                            >
                              Ramassage:{' '}
                              {normalizeDateOnly(
                                order.pickupDate
                              )}
                            </div>
                          )}

                        {order.deliveryDate &&
                          order.type ===
                            'delivery' && (
                            <div
                              style={{
                                fontSize:
                                  '10px',
                                marginTop:
                                  '3px',
                                color:
                                  '#059669',
                              }}
                            >
                              Livraison:{' '}
                              {normalizeDateOnly(
                                order.deliveryDate
                              )}
                            </div>
                          )}

                        {order.estimatedArrival && (
                          <div
                            style={{
                              fontSize:
                                '10px',
                              color:
                                '#64748b',
                              marginTop:
                                '3px',
                            }}
                          >
                            Arrivée:{' '}
                            {
                              order.estimatedArrival
                            }
                          </div>
                        )}

                        {zone.driver
                          .currentLoad !==
                          undefined &&
                          zone.driver
                            .capacityInItems && (
                            <div
                              style={{
                                fontSize:
                                  '10px',
                                marginTop:
                                  '4px',
                              }}
                            >
                              Charge après:{' '}
                              {(() => {
                                let load =
                                  zone
                                    .driver
                                    .currentLoad ||
                                  0;

                                for (
                                  let i = 0;
                                  i <=
                                  index;
                                  i++
                                ) {
                                  const currentStop =
                                    realStops[
                                      i
                                    ];

                                  if (
                                    currentStop.type ===
                                    'pickup'
                                  ) {
                                    load +=
                                      Number(
                                        currentStop.itemCount ||
                                          0
                                      );
                                  } else {
                                    load -=
                                      Number(
                                        currentStop.itemCount ||
                                          0
                                      );
                                  }
                                }

                                return `${load}/${zone.driver.capacityInItems} kg`;
                              })()}
                            </div>
                          )}
                      </Tooltip>
                    </Marker>
                  );
                }
              )}
            </React.Fragment>
          );
        }
      );
    };

  // ========================================================
  // STATISTIQUES
  // ========================================================

  const visiblePickupCount =
    visibleOrders.filter(
      (o) =>
        o.type ===
        'pickup'
    ).length;

  const visibleDeliveryCount =
    visibleOrders.filter(
      (o) =>
        o.type ===
        'delivery'
    ).length;

  const totalDistance =
    filteredZoneData.reduce(
      (
        sum,
        zone
      ) =>
        sum +
        (zone.distanceKm ||
          0),
      0
    );

  const totalStops =
    filteredZoneData.reduce(
      (
        sum,
        zone
      ) =>
        sum +
        (
          zone.route ||
          zone.orders ||
          []
        ).filter(
          (
            order: any
          ) =>
            !order.isVirtualStop
        ).length,
      0
    );

  const totalRoutes =
    filteredZoneData.length;

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div
      style={{
        position:
          'relative',

        height:
          '100%',

        width:
          '100%',
      }}
    >
      {/* ====================================================
          BOUTON LÉGENDE
      ==================================================== */}

      <button
        onClick={() =>
          setShowLegend(
            !showLegend
          )
        }
        style={{
          position:
            'absolute',

          top: '10px',

          right: '10px',

          zIndex: 1000,

          backgroundColor:
            'rgba(255,255,255,0.9)',

          border:
            '2px solid #8B5CF6',

          borderRadius:
            '8px',

          padding:
            '6px 10px',

          boxShadow:
            '0 2px 8px rgba(0,0,0,0.12)',

          cursor:
            'pointer',

          fontSize:
            '14px',

          display:
            'flex',

          alignItems:
            'center',

          gap:
            '4px',

          transition:
            'all 0.2s ease',
        }}
        title={
          showLegend
            ? 'Masquer la légende'
            : 'Afficher la légende'
        }
      >
        <span>
          {showLegend
            ? '📖'
            : '📕'}
        </span>

        <span
          style={{
            fontSize:
              '11px',

            fontWeight:
              '600',

            color:
              '#475569',
          }}
        >
          Légende
        </span>
      </button>

      {/* ====================================================
          CARTE
      ==================================================== */}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={
          true
        }
        style={{
          height:
            '100%',

          width:
            '100%',
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {renderSVPressing()}

        {renderOrdersMarkers()}

        {showDriverStarts &&
          renderDriverStartPoints()}

        {!showGlobalView &&
          renderRoutes()}

        {showGlobalView &&
          renderNeighborhoodsMarkers()}

        {/* ==================================================
            POPUP QUARTIER
        ================================================== */}

        {selectedNeighborhood && (
          <Popup
            position={
              selectedNeighborhood.coords
            }
            onClose={() =>
              setSelectedNeighborhood(
                null
              )
            }
          >
            <div className="map-popup-content">
              <h4>
                Quartier:{' '}
                {
                  selectedNeighborhood.name
                }
              </h4>

              {selectedNeighborhood
                .pickups
                .length >
                0 && (
                <div
                  style={{
                    marginBottom:
                      '12px',
                  }}
                >
                  <strong>
                    Ramassages (
                    {
                      selectedNeighborhood
                        .pickups
                        .length
                    }
                    )
                  </strong>

                  <ul>
                    {selectedNeighborhood.pickups.map(
                      (
                        p: OrderInfo
                      ) => (
                        <li
                          key={`p-${p.id}`}
                        >
                          #{p.id} -{' '}
                          {
                            p.clientName
                          }
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {selectedNeighborhood
                .deliveries
                .length >
                0 && (
                <div>
                  <strong>
                    Livraisons (
                    {
                      selectedNeighborhood
                        .deliveries
                        .length
                    }
                    )
                  </strong>

                  <ul>
                    {selectedNeighborhood.deliveries.map(
                      (
                        d: OrderInfo
                      ) => (
                        <li
                          key={`d-${d.id}`}
                        >
                          #{d.id} -{' '}
                          {
                            d.clientName
                          }
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        )}

        {/* ==================================================
            POPUP COMMANDE
        ================================================== */}

        {selectedStop &&
          selectedStop.id !==
            'sv-pressing' && (
            <Popup
              position={
                selectedStop.coords
              }
              onClose={() =>
                setSelectedStop(
                  null
                )
              }
            >
              <div
                style={{
                  padding:
                    '8px',

                  minWidth:
                    '260px',
                }}
              >
                <div
                  style={{
                    fontWeight:
                      'bold',

                    fontSize:
                      '16px',

                    marginBottom:
                      '12px',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      '8px',
                  }}
                >
                  {selectedStop.type ===
                  'pickup'
                    ? '📦'
                    : '🚚'}

                  <span>
                    {selectedStop.type ===
                    'pickup'
                      ? 'Ramassage'
                      : 'Livraison'}{' '}
                    #
                    {
                      selectedStop.id
                    }

                    {selectedStop.sequence &&
                      ` • Étape ${selectedStop.sequence}`}
                  </span>
                </div>

                <div
                  style={{
                    display:
                      'flex',

                    flexDirection:
                      'column',

                    gap:
                      '8px',
                  }}
                >
                  <div>
                    <strong>
                      Client:{' '}
                    </strong>

                    {
                      selectedStop.clientName
                    }
                  </div>

                  {selectedStop.pickupDate &&
                    selectedStop.type ===
                      'pickup' && (
                      <div>
                        <strong>
                          Ramassage:{' '}
                        </strong>

                        {normalizeDateOnly(
                          selectedStop.pickupDate
                        )}
                      </div>
                    )}

                  {selectedStop.deliveryDate &&
                    selectedStop.type ===
                      'delivery' && (
                    <div>
                      <strong>
                        Livraison:{' '}
                      </strong>

                      {normalizeDateOnly(
                        selectedStop.deliveryDate
                      )}
                    </div>
                  )}

                  {selectedStop.driver && (
                    <div>
                      <strong>
                        Livreur:{' '}
                      </strong>

                      {
                        selectedStop
                          .driver
                          .name
                      }
                    </div>
                  )}

                  {selectedStop.itemCount !==
                    undefined && (
                    <div>
                      <strong>
                        Articles:{' '}
                      </strong>

                      {selectedStop.type ===
                      'pickup'
                        ? `+${selectedStop.itemCount}`
                        : `-${selectedStop.itemCount}`}
                    </div>
                  )}

                  {selectedStop.estimatedArrival && (
                    <div>
                      <strong>
                        Arrivée prévue:{' '}
                      </strong>

                      {
                        selectedStop.estimatedArrival
                      }
                    </div>
                  )}

                  {selectedStop.status && (
                    <div>
                      <strong>
                        Statut:{' '}
                      </strong>

                      <Badge
                        variant={
                          selectedStop.status ===
                            'delivered' ||
                          selectedStop.status ===
                            'completed'
                            ? 'default'
                            : 'warning'
                        }
                      >
                        {
                          selectedStop.status
                        }
                      </Badge>
                    </div>
                  )}

                  {selectedStop.timeWindowStart && (
                    <div
                      style={{
                        fontSize:
                          '12px',

                        backgroundColor:
                          '#f8fafc',

                        padding:
                          '8px',

                        borderRadius:
                          '8px',
                      }}
                    >
                      <strong>
                        Fenêtre horaire
                      </strong>

                      <div>
                        {
                          selectedStop.timeWindowStart
                        }{' '}
                        -{' '}
                        {
                          selectedStop.timeWindowEnd
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}

        {/* ==================================================
            POPUP SIÈGE
        ================================================== */}

        {selectedStop &&
          selectedStop.id ===
            'sv-pressing' && (
            <Popup
              position={
                selectedStop.coords
              }
              onClose={() =>
                setSelectedStop(
                  null
                )
              }
            >
              <div
                style={{
                  padding:
                    '12px',

                  textAlign:
                    'center',

                  minWidth:
                    '200px',
                }}
              >
                <div
                  style={{
                    fontWeight:
                      'bold',

                    fontSize:
                      '16px',

                    marginBottom:
                      '8px',
                  }}
                >
                  Siège SV Pressing
                </div>

                <p
                  style={{
                    fontSize:
                      '13px',

                    color:
                      '#475569',
                  }}
                >
                  Point de départ et
                  retour des livreurs
                </p>
              </div>
            </Popup>
          )}
      </MapContainer>

      {/* ====================================================
          LÉGENDE
      ==================================================== */}

      {showLegend && (
        <div className="leaflet-legend">
          <div
            style={{
              fontWeight:
                'bold',

              fontSize:
                '13px',

              marginBottom:
                '10px',

              display:
                'flex',

              justifyContent:
                'space-between',

              alignItems:
                'center',
            }}
          >
            <span>
              📋 Légende
            </span>

            {filteredZoneData.length >
              0 && (
              <button
                onClick={() =>
                  setShowDriverStarts(
                    !showDriverStarts
                  )
                }
                style={{
                  fontSize:
                    '10px',

                  backgroundColor:
                    '#f1f5f9',

                  border:
                    'none',

                  padding:
                    '4px 10px',

                  borderRadius:
                    '20px',

                  cursor:
                    'pointer',
                }}
              >
                {showDriverStarts
                  ? '🏠'
                  : '📍'}{' '}
                Départs
              </button>
            )}
          </div>

          {/* SIÈGE */}

          <div className="legend-item">
            <div
              className="legend-color"
              style={{
                backgroundColor:
                  '#8B5CF6',
              }}
            />

            <span className="legend-text">
              Siège SV Pressing
              (Départ/Retour)
            </span>
          </div>

          {/* RAMASSAGES */}

          <div className="legend-item">
            <div
              className="legend-color"
              style={{
                backgroundColor:
                  '#3B82F6',
              }}
            />

            <div>
              <span className="legend-text">
                Ramassages (+ linge)
              </span>

              <span className="legend-count">
                {
                  visiblePickupCount
                }
              </span>
            </div>
          </div>

          {/* LIVRAISONS */}

          <div className="legend-item">
            <div
              className="legend-color"
              style={{
                backgroundColor:
                  '#10B981',
              }}
            />

            <div>
              <span className="legend-text">
                Livraisons (- linge)
              </span>

              <span className="legend-count">
                {
                  visibleDeliveryCount
                }
              </span>
            </div>
          </div>

          {/* ROUTES */}

          {filteredZoneData.length >
            0 && (
            <>
              <div className="legend-divider" />

              <div className="legend-item">
                <div
                  className="legend-color-line"
                  style={{
                    backgroundColor:
                      '#FF0000',

                    height:
                      '6px',

                    width:
                      '32px',

                    borderRadius:
                      '4px',
                  }}
                />

                <span className="legend-text">
                  Parcours rouge du
                  livreur
                </span>
              </div>

              <div
                style={{
                  fontSize:
                    '11px',

                  color:
                    '#64748b',

                  marginLeft:
                    '24px',
                }}
              >
                {
                  totalRoutes
                }{' '}
                tournée(s) •{' '}
                {
                  totalStops
                }{' '}
                arrêts
              </div>

              <div
                style={{
                  fontSize:
                    '11px',

                  color:
                    '#64748b',

                  marginLeft:
                    '24px',
                }}
              >
                Distance totale:{' '}
                {totalDistance.toFixed(
                  1
                )}{' '}
                km
              </div>
            </>
          )}

          {/* DATE */}

          {dateFilter && (
            <>
              <div className="legend-divider" />

              <div className="legend-item">
                <span
                  style={{
                    fontSize:
                      '11px',

                    color:
                      '#64748b',
                  }}
                >
                  Date:{' '}
                  {dateFilter.toLocaleDateString(
                    'fr-FR'
                  )}
                </span>
              </div>

              <div
                style={{
                  fontSize:
                    '10px',

                  color:
                    '#94a3b8',

                  marginLeft:
                    '24px',

                  marginTop:
                    '-4px',

                  marginBottom:
                    '4px',
                }}
              >
                {
                  visibleOrders.length
                }{' '}
                commande(s)
                affichée(s)
              </div>
            </>
          )}

          {/* TRAFIC */}

          {showTraffic && (
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  backgroundColor:
                    '#f59e0b',
                }}
              />

              <span className="legend-text">
                Trafic simulé
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;