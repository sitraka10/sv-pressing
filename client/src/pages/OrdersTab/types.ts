// src/pages/OrdersTab/types.ts
export interface User {
  id: number;
  role: string;
  fullName: string;
  email?: string;
  phone?: string;
  neighborhood?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface OrderNote {
  id: number;
  orderId: number;
  content: string;
  createdAt: string;
  createdBy: string;
  author?: {
    fullName: string;
  };
  isRead: boolean;
  noteType: string;
}

export interface StageHistoryEntry {
  stage: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number;
}

export interface Order {
  id: number;
  clientId: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  statusChangedAt?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  itemCount?: number;
  specialInstructions?: string;
  baseAmount?: string;
  overageAmount?: string;
  notes?: OrderNote[];
  assignedTo?: number;
  stageHistory?: StageHistoryEntry[];
  clientName?: string;
  clientPhone?: string;
  clientNeighborhood?: string;
  clientEmail?: string;
  clientDetails?: User; // ajout local pour le détail
  deliveryDetails?: any; // ajout local
}

export interface Delivery {
  id: number;
  orderId: number;
  driverId?: number;
  driverName?: string;
  deliveredAt?: string;
  pickupAt?: string;
}

export interface OrdersTabProps {
  orders: Order[];
  users: User[];
  deliveries: Delivery[];
  handleStatusChange: (orderId: number, newStatus: string, itemCount?: number) => void;
  handleAddNote: (orderId: number, noteContent: string) => void;
  setSelectedOrder: (order: Order) => void;
  setIsOrderDetailsOpen: (isOpen: boolean) => void;
}

export interface StageMetrics {
  stage: string;
  label: string;
  count: number;
  avgTimeHours: number;
  minTimeHours: number;
  maxTimeHours: number;
  medianTimeHours: number;
  delayedCount: number;
  delayPercentage: number;
  throughput: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ElementType;
  totalTimeSpent: number;
  efficiency: number;
  waitingOrders: number;
  capacity: number;
  utilization: number;
  slaHours: number;
}

export interface GlobalMetrics {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  avgCompletionTime: number;
  medianCompletionTime: number;
  onTimeRate: number;
  bottleneckStage: string;
  criticalOrders: number;
  avgDailyVolume: number;
  projectedVolume: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  avgItemsPerOrder: number;
  totalItemsProcessed: number;
  peakHours: string[];
  lowActivityHours: string[];
  riskScore: number;
  recoveryTime: number;
  weekendVolume: number;
  weekdayVolume: number;
}

export interface TimeSeriesData {
  date: string;
  completed: number;
  created: number;
  delayed: number;
  avgTime: number;
  dayOfWeek: number;
  isWeekend: boolean;
}

export interface StageTransition {
  fromStage: string;
  toStage: string;
  avgTimeHours: number;
  count: number;
  delayRate: number;
  timeOfDay: Record<string, number>;
}

export interface RiskAlert {
  level: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  description: string;
  action: string;
  impact: string;
  metric: number;
  threshold: number;
}

export interface IntelligentRecommendation {
  id: string;
  type: 'bottleneck' | 'capacity' | 'schedule' | 'process' | 'quality' | 'prediction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
  roi: string;
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  steps: string[];
  metrics: {
    current: number;
    target: number;
    unit: string;
  };
  conditions: string[];
  automation: boolean;
}