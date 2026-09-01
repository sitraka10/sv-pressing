import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Types simplifiés
interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
  phone2?: string;
  address: string;
  preferredPickupDay?: string;
  role: "admin" | "client" | "agent" | "delivery";
  isActive: boolean;
  createdAt: Date;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  pricePerMonth: string;
  itemsIncluded: number;
  pickupsPerWeek: number;
  deliveryTimeHours: number;
  features: string[];
  isActive: boolean;
}

interface CustomQuote {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  itemsPerWeek: number;
  pickupsPerWeek: number;
  specialRequirements: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  createdAt: Date;
}

interface PlanSelection {
  id: number;
  planId: number;
  fullName: string;
  firstName: string;
  phone: string;
  address: string;
  specialRequirements: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  createdAt: Date;
}

// Storage en mémoire
const storage = {
  users: new Map<number, User>(),
  plans: new Map<number, SubscriptionPlan>(),
  quotes: new Map<number, CustomQuote>(),
  planSelections: new Map<number, PlanSelection>(),
  orders: new Map<number, any>(),
  deliveries: new Map<number, any>(),
  subscriptions: new Map<number, any>(),
  nextId: 1,
  sessionStore: new MemoryStore({ checkPeriod: 86400000 })
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Initialisation des données
async function initializeData() {
  console.log('Initializing simple storage data...');
  
  // Hash password for all users
  const clientPassword = await hashPassword("password123");
  console.log('Password hashed successfully');
  
  // Plans d'abonnement
  const plans = [
    {
      id: 1,
      name: "Essentiel",
      type: "essential",
      pricePerMonth: "15000",
      itemsIncluded: 15,
      pickupsPerWeek: 1,
      deliveryTimeHours: 48,
      features: [
        "15 pièces de linge incluses",
        "1 ramassage par semaine",
        "Livraison sous 48h",
        "Suivi en temps réel",
        "Support client"
      ],
      isActive: true
    },
    {
      id: 2,
      name: "Famille",
      type: "family",
      pricePerMonth: "35000",
      itemsIncluded: 40,
      pickupsPerWeek: 2,
      deliveryTimeHours: 48,
      features: [
        "40 pièces de linge incluses",
        "2 ramassages par semaine",
        "Livraison sous 48h",
        "Suivi en temps réel",
        "Support prioritaire",
        "Planning flexible"
      ],
      isActive: true
    },
    {
      id: 3,
      name: "Premium",
      type: "premium",
      pricePerMonth: "65000",
      itemsIncluded: 80,
      pickupsPerWeek: 3,
      deliveryTimeHours: 24,
      features: [
        "80 pièces de linge incluses",
        "3 ramassages par semaine",
        "Livraison sous 24h",
        "Suivi en temps réel",
        "Support VIP 24/7",
        "Service de repassage premium",
        "Livraison d'urgence gratuite"
      ],
      isActive: true
    }
  ];

  plans.forEach(plan => storage.plans.set(plan.id, plan));

  // Utilisateurs test - tous utilisent password123
  const adminPassword = clientPassword;
  console.log('Using unified password for all users');

  const users = [
    {
      id: 1,
      username: "admin",
      password: adminPassword,
      email: "admin@svpressing.mg",
      fullName: "Administrateur SV",
      phone: "+261 34 12 345 67",
      phone2: undefined,
      address: "Antananarivo, Madagascar",
      preferredPickupDay: undefined,
      role: "admin" as const,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 2,
      username: "marie.raso",
      password: clientPassword,
      email: "marie.raso@gmail.com",
      fullName: "Marie Rasoamalala",
      phone: "+261 32 12 345 67",
      phone2: "+261 34 12 345 67",
      address: "Lot VB 123, Quartier Analakely, Antananarivo 101",
      preferredPickupDay: "mardi",
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 10, 15)
    },
    {
      id: 3,
      username: "jean.rakoto",
      password: clientPassword,
      email: "jean.rakoto@yahoo.fr",
      fullName: "Jean Rakotonirina",
      phone: "+261 33 45 678 90",
      phone2: undefined,
      address: "Villa 45, Ankadifotsy, Antananarivo",
      preferredPickupDay: "jeudi",
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 9, 22)
    },
    {
      id: 4,
      username: "lova.andry",
      password: clientPassword,
      email: "lova.andry@outlook.com",
      fullName: "Lova Andriamihaja",
      phone: "+261 32 56 789 01",
      phone2: undefined,
      address: "Lot II J 234, Mandrosoa, Antananarivo",
      preferredPickupDay: "lundi",
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 11, 5)
    },
    {
      id: 5,
      username: "naina.raz",
      password: clientPassword,
      email: "naina.razafy@gmail.com",
      fullName: "Naina Razafindrakoto",
      phone: "+261 33 67 890 12",
      phone2: "+261 34 67 890 12",
      address: "Mahamasina Nord, Antananarivo",
      preferredPickupDay: "mercredi",
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 10, 28)
    },
    {
      id: 6,
      username: "patrick.rak",
      password: clientPassword,
      email: "patrick.rakoto@hotmail.com",
      fullName: "Patrick Rakotomalala",
      phone: "+261 32 78 901 23",
      phone2: undefined,
      address: "Rue de l'Indépendance, Antaninarenina",
      preferredPickupDay: "vendredi",
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 9, 12)
    },
    {
      id: 7,
      username: "hanta.ran",
      password: clientPassword,
      email: "hanta.randria@yahoo.fr",
      fullName: "Hanta Randrianarisoa",
      phone: "+261 33 89 012 34",
      phone2: undefined,
      address: "Ankorondrano, près du Carlton",
      preferredPickupDay: "samedi",
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 11, 2)
    },
    {
      id: 8,
      username: "faly.rabe",
      password: clientPassword,
      email: "faly.rabe@gmail.com",
      fullName: "Faly Rabemanantsoa",
      phone: "+261 32 90 123 45",
      phone2: "+261 34 90 123 45",
      address: "Tsaralalàna, Antananarivo",
      preferredPickupDay: "mardi",
      role: "client" as const,
      isActive: false,
      createdAt: new Date(2024, 8, 20)
    },
    {
      id: 9,
      username: "miora.raz",
      password: clientPassword,
      email: "miora.razak@outlook.fr",
      fullName: "Miora Razakandraina",
      phone: "+261 33 01 234 56",
      phone2: undefined,
      address: "Ampefiloha, Antananarivo",
      preferredPickupDay: undefined,
      role: "client" as const,
      isActive: true,
      createdAt: new Date(2024, 11, 10)
    },
    {
      id: 10,
      username: "livreur1",
      password: clientPassword,
      email: "livreur1@svpressing.mg",
      fullName: "Hery Randriamampionona",
      phone: "+261 34 78 901 23",
      phone2: undefined,
      address: "Ivato, Antananarivo",
      preferredPickupDay: undefined,
      role: "delivery" as const,
      isActive: true,
      createdAt: new Date(2024, 8, 10)
    },
    {
      id: 11,
      username: "livreur2",
      password: clientPassword,
      email: "livreur2@svpressing.mg",
      fullName: "Solo Andriantsoa",
      phone: "+261 34 89 012 34",
      phone2: undefined,
      address: "Behoririka, Antananarivo",
      preferredPickupDay: undefined,
      role: "delivery" as const,
      isActive: true,
      createdAt: new Date(2024, 8, 15)
    }
  ];

  // Mettre à jour le nextId pour les nouveaux utilisateurs
  storage.nextId = 12;

  // Ajouter les utilisateurs au storage
  users.forEach(user => storage.users.set(user.id, user));

  // Commandes réelles diversifiées
  const orders = [
    // Ramassages en attente
    {
      id: 1,
      clientId: 2,
      subscriptionId: 1,
      status: "to_pickup",
      serviceType: "standard",
      pickupDate: null,
      deliveryDate: null,
      specialInstructions: "Appartement au 2ème étage, sonnette droite",
      itemCount: 0,
      baseAmount: "25000",
      overageAmount: "0",
      totalAmount: "25000",
      notes: "Ramassage hebdomadaire",
      createdAt: new Date(2024, 11, 18),
      updatedAt: new Date(2024, 11, 18)
    },
    {
      id: 2,
      clientId: 3,
      subscriptionId: 2,
      status: "to_pickup",
      serviceType: "express",
      pickupDate: null,
      deliveryDate: null,
      specialInstructions: "Ramassage urgent - entretien demain",
      itemCount: 0,
      baseAmount: "40000",
      overageAmount: "0",
      totalAmount: "40000",
      notes: "Express demandé",
      createdAt: new Date(2024, 11, 21),
      updatedAt: new Date(2024, 11, 21)
    },
    {
      id: 3,
      clientId: 4,
      subscriptionId: 3,
      status: "to_pickup",
      serviceType: "standard",
      pickupDate: null,
      deliveryDate: null,
      specialInstructions: "Portail bleu, maison avec jardin",
      itemCount: 0,
      baseAmount: "35000",
      overageAmount: "0",
      totalAmount: "35000",
      notes: "Client régulier",
      createdAt: new Date(2024, 11, 20),
      updatedAt: new Date(2024, 11, 20)
    },
    // En traitement
    {
      id: 4,
      clientId: 5,
      subscriptionId: null,
      status: "picked_up",
      serviceType: "standard",
      pickupDate: new Date(2024, 11, 20),
      deliveryDate: null,
      specialInstructions: "Attention boutons dorés",
      itemCount: 12,
      baseAmount: "30000",
      overageAmount: "5000",
      totalAmount: "35000",
      notes: "Ramassé hier",
      createdAt: new Date(2024, 11, 19),
      updatedAt: new Date(2024, 11, 20)
    },
    {
      id: 5,
      clientId: 6,
      subscriptionId: null,
      status: "washing",
      serviceType: "premium",
      pickupDate: new Date(2024, 11, 19),
      deliveryDate: null,
      specialInstructions: "Nettoyage à sec uniquement",
      itemCount: 8,
      baseAmount: "45000",
      overageAmount: "0",
      totalAmount: "45000",
      notes: "En cours nettoyage",
      createdAt: new Date(2024, 11, 18),
      updatedAt: new Date(2024, 11, 21)
    },
    // Prêtes à livrer
    {
      id: 6,
      clientId: 2,
      subscriptionId: 1,
      status: "ready_to_deliver",
      serviceType: "standard",
      pickupDate: new Date(2024, 11, 18),
      deliveryDate: null,
      specialInstructions: "Livraison après 14h",
      itemCount: 15,
      baseAmount: "25000",
      overageAmount: "8000",
      totalAmount: "33000",
      notes: "Nettoyage terminé",
      createdAt: new Date(2024, 11, 17),
      updatedAt: new Date(2024, 11, 21)
    },
    {
      id: 7,
      clientId: 3,
      subscriptionId: 2,
      status: "to_deliver",
      serviceType: "express",
      pickupDate: new Date(2024, 11, 17),
      deliveryDate: null,
      specialInstructions: "Livraison urgente",
      itemCount: 10,
      baseAmount: "40000",
      overageAmount: "0",
      totalAmount: "40000",
      notes: "Express priorité",
      createdAt: new Date(2024, 11, 16),
      updatedAt: new Date(2024, 11, 21)
    },
    {
      id: 8,
      clientId: 7,
      subscriptionId: null,
      status: "ready_to_deliver",
      serviceType: "standard",
      pickupDate: new Date(2024, 11, 16),
      deliveryDate: null,
      specialInstructions: "RAS",
      itemCount: 14,
      baseAmount: "28000",
      overageAmount: "7000",
      totalAmount: "35000",
      notes: "Prêt livraison",
      createdAt: new Date(2024, 11, 15),
      updatedAt: new Date(2024, 11, 21)
    }
  ];

  orders.forEach(order => storage.orders.set(order.id, order));

  // Livraisons test
  const deliveries = [
    {
      id: 1,
      orderId: 1,
      deliveryPersonId: 10,
      status: "assigned",
      scheduledDate: new Date(2024, 11, 22, 14, 0),
      createdAt: new Date(2024, 11, 21),
      updatedAt: new Date(2024, 11, 21)
    },
    {
      id: 2,
      orderId: 2,
      deliveryPersonId: 11,
      status: "pending",
      scheduledDate: new Date(2024, 11, 22, 16, 0),
      createdAt: new Date(2024, 11, 21),
      updatedAt: new Date(2024, 11, 21)
    }
  ];

  deliveries.forEach(delivery => storage.deliveries.set(delivery.id, delivery));

  // Abonnements test
  const subscriptions = [
    {
      id: 1,
      clientId: 2,
      planId: 1,
      status: "active",
      startDate: new Date(2024, 10, 1),
      nextBillingDate: new Date(2024, 11, 1),
      createdAt: new Date(2024, 10, 1)
    },
    {
      id: 2,
      clientId: 3,
      planId: 2,
      status: "active",
      startDate: new Date(2024, 10, 15),
      nextBillingDate: new Date(2024, 11, 15),
      createdAt: new Date(2024, 10, 15)
    },
    {
      id: 3,
      clientId: 4,
      planId: 1,
      status: "active",
      startDate: new Date(2024, 11, 1),
      nextBillingDate: new Date(2024, 11, 30),
      createdAt: new Date(2024, 11, 1)
    }
  ];

  subscriptions.forEach(subscription => storage.subscriptions.set(subscription.id, subscription));
}

// Initialiser immédiatement les données
initializeData().catch(console.error);

// API du storage
// Interface IStorage pour compatibilité
export interface IStorage {
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUserByEmail?(email: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: number, updates: any): Promise<any>;
  getSubscriptionPlans(): Promise<any[]>;
  getCustomQuotes(): Promise<any[]>;
  createCustomQuote(quoteData: any): Promise<any>;
  updateCustomQuoteStatus(id: number, status: string): Promise<any>;
  getPlanSelections(): Promise<any[]>;
  createPlanSelection(selectionData: any): Promise<any>;
  updatePlanSelectionStatus(id: number, status: string): Promise<any>;
  sessionStore: any;
}

const simpleStorage = {
  sessionStore: storage.sessionStore,

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(storage.users.values());
    return users.find(user => user.username === username);
  },

  async getUser(id: number): Promise<User | undefined> {
    return storage.users.get(id);
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: storage.nextId++,
      createdAt: new Date()
    };
    storage.users.set(user.id, user);
    return user;
  },

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const user = storage.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    
    storage.users.set(id, updatedUser);
    return updatedUser;
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(storage.plans.values()).filter(plan => plan.isActive);
  },

  async createCustomQuote(quoteData: Omit<CustomQuote, 'id' | 'createdAt' | 'status'>): Promise<CustomQuote> {
    const quote: CustomQuote = {
      ...quoteData,
      id: storage.nextId++,
      status: "pending",
      createdAt: new Date()
    };
    storage.quotes.set(quote.id, quote);
    return quote;
  },

  async getCustomQuotes(): Promise<CustomQuote[]> {
    return Array.from(storage.quotes.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  async updateQuoteStatus(id: number, status: CustomQuote['status']): Promise<CustomQuote | undefined> {
    const quote = storage.quotes.get(id);
    if (!quote) return undefined;
    
    quote.status = status;
    storage.quotes.set(id, quote);
    return quote;
  },

  async createPlanSelection(selectionData: Omit<PlanSelection, 'id' | 'createdAt' | 'status'>): Promise<PlanSelection> {
    const selection: PlanSelection = {
      ...selectionData,
      id: storage.nextId++,
      status: "pending",
      createdAt: new Date()
    };
    storage.planSelections.set(selection.id, selection);
    return selection;
  },

  async getPlanSelections(): Promise<PlanSelection[]> {
    return Array.from(storage.planSelections.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  async updatePlanSelectionStatus(id: number, status: PlanSelection['status']): Promise<PlanSelection | undefined> {
    const selection = storage.planSelections.get(id);
    if (!selection) return undefined;
    
    selection.status = status;
    storage.planSelections.set(id, selection);
    return selection;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const allUsers = Array.from(storage.users.values());
    if (role === "all") {
      return allUsers;
    }
    return allUsers.filter(user => user.role === role);
  },

  async getExpenses(): Promise<any[]> {
    return [
      { id: 1, description: "Produits de nettoyage", amount: "150000", category: "Fournitures", date: new Date(), notes: "" },
      { id: 2, description: "Maintenance machines", amount: "450000", category: "Maintenance", date: new Date(), notes: "" },
      { id: 3, description: "Transport livraisons", amount: "95000", category: "Transport", date: new Date(), notes: "" }
    ];
  },

  async createExpense(expenseData: any): Promise<any> {
    const expense = {
      id: storage.nextId++,
      ...expenseData,
      createdAt: new Date()
    };
    return expense;
  },

  async getAnalytics(): Promise<any> {
    const orders = Array.from(storage.orders.values());
    const completedOrders = orders.filter(o => o.status === "delivered");
    const delayedOrders = orders.filter(o => 
      o.status !== "delivered" && new Date() > new Date(o.scheduledDeliveryDate)
    );
    
    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      delayedOrders: delayedOrders.length,
      revenue: "2850000",
      activeSubscriptions: Array.from(storage.subscriptions.values()).filter(s => s.status === "active").length,
      newClients: Array.from(storage.users.values()).filter(u => 
        u.role === "client" && new Date(u.createdAt).getMonth() === new Date().getMonth()
      ).length
    };
  },

  async getDeliverySchedules(): Promise<any[]> {
    return [
      { id: 1, date: new Date(), deliveryPersonId: 1, orderIds: [1, 2], status: "scheduled" },
      { id: 2, date: new Date(), deliveryPersonId: 1, orderIds: [3], status: "in_progress" }
    ];
  },

  async createDeliverySchedule(scheduleData: any): Promise<any> {
    const schedule = {
      id: storage.nextId++,
      ...scheduleData,
      createdAt: new Date()
    };
    return schedule;
  },

  async getNotificationsByUser(userId: number): Promise<any[]> {
    return [
      { id: 1, message: "Nouvelle commande assignée", type: "info", read: false, createdAt: new Date() },
      { id: 2, message: "Livraison en retard", type: "warning", read: false, createdAt: new Date() }
    ];
  },

  async createNotification(notificationData: any): Promise<any> {
    const notification = {
      id: storage.nextId++,
      ...notificationData,
      createdAt: new Date()
    };
    return notification;
  },

  // Méthodes manquantes pour l'interface complète
  async getActiveSubscription(clientId: number): Promise<any | undefined> {
    return {
      id: 1,
      clientId,
      planId: 1,
      startDate: new Date(),
      endDate: null,
      isActive: true,
      preferredPickupDay: "Lundi",
      preferredPickupTime: "09:00"
    };
  },

  async createSubscription(subscriptionData: any): Promise<any> {
    const subscription = {
      id: storage.nextId++,
      ...subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return subscription;
  },

  async getOrders(): Promise<any[]> {
    // Initialize orders if not done yet
    if (storage.orders.size === 0) {
      // Commandes récentes (Juin 2025)
      storage.orders.set(1, {
        id: 1,
        clientId: 2,
        subscriptionId: 1,
        status: "to_dry",
        itemCount: 15,
        pickupDate: new Date('2025-06-20'),
        deliveryDate: null,
        scheduledPickupDate: new Date('2025-06-20'),
        scheduledDeliveryDate: new Date('2025-06-23'),
        actualPickupDate: new Date('2025-06-20'),
        actualDeliveryDate: null,
        baseAmount: "25000",
        specialInstructions: "Attention aux tissus délicats",
        overageAmount: null,
        notes: "Chemises blanches et costumes",
        createdAt: new Date('2025-06-20'),
        updatedAt: new Date()
      });

      storage.orders.set(2, {
        id: 2,
        clientId: 3,
        subscriptionId: 2,
        status: "delivered",
        itemCount: 8,
        pickupDate: new Date('2025-06-18'),
        deliveryDate: new Date('2025-06-20'),
        scheduledPickupDate: new Date('2025-06-18'),
        scheduledDeliveryDate: new Date('2025-06-20'),
        actualPickupDate: new Date('2025-06-18'),
        actualDeliveryDate: new Date('2025-06-20'),
        baseAmount: "15000",
        specialInstructions: null,
        overageAmount: null,
        notes: "Livraison à domicile confirmée",
        createdAt: new Date('2025-06-18'),
        updatedAt: new Date('2025-06-20')
      });

      storage.orders.set(3, {
        id: 3,
        clientId: 4,
        subscriptionId: 3,
        status: "ready_to_deliver",
        itemCount: 22,
        pickupDate: new Date('2025-06-19'),
        deliveryDate: null,
        scheduledPickupDate: new Date('2025-06-19'),
        scheduledDeliveryDate: new Date('2025-06-22'),
        actualPickupDate: new Date('2025-06-19'),
        actualDeliveryDate: null,
        baseAmount: "35000",
        specialInstructions: "Pressing haute qualité requis",
        overageAmount: "5000",
        notes: "Dépassement: 2 pièces supplémentaires",
        createdAt: new Date('2025-06-19'),
        updatedAt: new Date('2025-06-21')
      });

      // Commandes Mai 2025
      storage.orders.set(4, {
        id: 4,
        clientId: 2,
        subscriptionId: 1,
        status: "delivered",
        itemCount: 18,
        pickupDate: new Date('2025-05-28'),
        deliveryDate: new Date('2025-05-30'),
        scheduledPickupDate: new Date('2025-05-28'),
        scheduledDeliveryDate: new Date('2025-05-30'),
        actualPickupDate: new Date('2025-05-28'),
        actualDeliveryDate: new Date('2025-05-30'),
        baseAmount: "25000",
        specialInstructions: null,
        overageAmount: null,
        notes: "Client satisfait du service",
        createdAt: new Date('2025-05-28'),
        updatedAt: new Date('2025-05-30')
      });

      storage.orders.set(5, {
        id: 5,
        clientId: 3,
        subscriptionId: 2,
        status: "delivered",
        itemCount: 12,
        pickupDate: new Date('2025-05-25'),
        deliveryDate: new Date('2025-05-27'),
        scheduledPickupDate: new Date('2025-05-25'),
        scheduledDeliveryDate: new Date('2025-05-27'),
        actualPickupDate: new Date('2025-05-25'),
        actualDeliveryDate: new Date('2025-05-27'),
        baseAmount: "15000",
        specialInstructions: "Livraison bureau",
        overageAmount: null,
        notes: "Livraison effectuée au bureau",
        createdAt: new Date('2025-05-25'),
        updatedAt: new Date('2025-05-27')
      });

      storage.orders.set(6, {
        id: 6,
        clientId: 4,
        subscriptionId: 3,
        status: "delivered",
        itemCount: 25,
        pickupDate: new Date('2025-05-20'),
        deliveryDate: new Date('2025-05-22'),
        scheduledPickupDate: new Date('2025-05-20'),
        scheduledDeliveryDate: new Date('2025-05-22'),
        actualPickupDate: new Date('2025-05-20'),
        actualDeliveryDate: new Date('2025-05-22'),
        baseAmount: "35000",
        specialInstructions: null,
        overageAmount: "7500",
        notes: "Dépassement: 5 pièces supplémentaires",
        createdAt: new Date('2025-05-20'),
        updatedAt: new Date('2025-05-22')
      });

      // Commandes Avril 2025
      storage.orders.set(7, {
        id: 7,
        clientId: 2,
        subscriptionId: 1,
        status: "delivered",
        itemCount: 14,
        pickupDate: new Date('2025-04-15'),
        deliveryDate: new Date('2025-04-17'),
        scheduledPickupDate: new Date('2025-04-15'),
        scheduledDeliveryDate: new Date('2025-04-17'),
        actualPickupDate: new Date('2025-04-15'),
        actualDeliveryDate: new Date('2025-04-17'),
        baseAmount: "25000",
        specialInstructions: null,
        overageAmount: null,
        notes: "Service standard",
        createdAt: new Date('2025-04-15'),
        updatedAt: new Date('2025-04-17')
      });

      storage.orders.set(8, {
        id: 8,
        clientId: 3,
        subscriptionId: 2,
        status: "delivered",
        itemCount: 10,
        pickupDate: new Date('2025-04-10'),
        deliveryDate: new Date('2025-04-12'),
        scheduledPickupDate: new Date('2025-04-10'),
        scheduledDeliveryDate: new Date('2025-04-12'),
        actualPickupDate: new Date('2025-04-10'),
        actualDeliveryDate: new Date('2025-04-12'),
        baseAmount: "15000",
        specialInstructions: "Repassage soigné",
        overageAmount: null,
        notes: "Excellent résultat",
        createdAt: new Date('2025-04-10'),
        updatedAt: new Date('2025-04-12')
      });

      // Commandes Mars 2025
      storage.orders.set(9, {
        id: 9,
        clientId: 4,
        subscriptionId: 3,
        status: "delivered",
        itemCount: 30,
        pickupDate: new Date('2025-03-28'),
        deliveryDate: new Date('2025-03-30'),
        scheduledPickupDate: new Date('2025-03-28'),
        scheduledDeliveryDate: new Date('2025-03-30'),
        actualPickupDate: new Date('2025-03-28'),
        actualDeliveryDate: new Date('2025-03-30'),
        baseAmount: "35000",
        specialInstructions: "Nettoyage à sec uniquement",
        overageAmount: "12500",
        notes: "Dépassement: 10 pièces supplémentaires",
        createdAt: new Date('2025-03-28'),
        updatedAt: new Date('2025-03-30')
      });

      storage.orders.set(10, {
        id: 10,
        clientId: 2,
        subscriptionId: 1,
        status: "delivered",
        itemCount: 16,
        pickupDate: new Date('2025-03-15'),
        deliveryDate: new Date('2025-03-17'),
        scheduledPickupDate: new Date('2025-03-15'),
        scheduledDeliveryDate: new Date('2025-03-17'),
        actualPickupDate: new Date('2025-03-15'),
        actualDeliveryDate: new Date('2025-03-17'),
        baseAmount: "25000",
        specialInstructions: null,
        overageAmount: "2500",
        notes: "Dépassement: 1 pièce supplémentaire",
        createdAt: new Date('2025-03-15'),
        updatedAt: new Date('2025-03-17')
      });
    }
    return Array.from(storage.orders.values());
  },

  async getOrdersByClient(clientId: number): Promise<any[]> {
    const orders = await this.getOrders();
    return orders.filter(order => order.clientId === clientId);
  },

  async getOrder(id: number): Promise<any | undefined> {
    await this.getOrders(); // Ensure orders are initialized
    return storage.orders.get(id);
  },

  async createOrder(orderData: any): Promise<any> {
    const order = {
      id: storage.nextId++,
      ...orderData,
      status: "to_pickup",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    storage.orders.set(order.id, order);
    return order;
  },

  async updateOrder(id: number, updates: any): Promise<any | undefined> {
    await this.getOrders(); // Ensure orders are initialized
    const order = storage.orders.get(id);
    if (order) {
      Object.assign(order, updates, { updatedAt: new Date() });
      storage.orders.set(id, order);
      console.log(`Order ${id} updated in storage:`, order);
      return order;
    }
    console.log(`Order ${id} not found in storage`);
    return undefined;
  },

  async addOrderStatusHistory(orderId: number, status: string, notes?: string, updatedBy?: number): Promise<any> {
    const history = {
      id: storage.nextId++,
      orderId,
      status,
      notes: notes || null,
      updatedBy: updatedBy || null,
      createdAt: new Date()
    };
    return history;
  },

  async getOrderStatusHistory(orderId: number): Promise<any[]> {
    return [
      {
        id: 1,
        orderId,
        status: "to_pickup",
        notes: "Commande créée",
        updatedBy: 1,
        createdAt: new Date()
      }
    ];
  },

  async getDeliveries(): Promise<any[]> {
    return [
      {
        id: 1,
        orderId: 1,
        deliveryPersonId: 3,
        status: "pending",
        scheduledDate: new Date(),
        completedDate: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  },

  async getDeliveriesByPerson(deliveryPersonId: number): Promise<any[]> {
    const deliveries = await this.getDeliveries();
    return deliveries.filter(delivery => delivery.deliveryPersonId === deliveryPersonId);
  },

  async createDelivery(deliveryData: any): Promise<any> {
    const delivery = {
      id: storage.nextId++,
      ...deliveryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return delivery;
  },

  async updateDelivery(id: number, updates: any): Promise<any | undefined> {
    const deliveries = await this.getDeliveries();
    const delivery = deliveries.find(d => d.id === id);
    if (delivery) {
      Object.assign(delivery, updates, { updatedAt: new Date() });
      return delivery;
    }
    return undefined;
  },

  async getInvoicesByClient(clientId: number): Promise<any[]> {
    return [
      {
        id: 1,
        clientId,
        subscriptionId: 1,
        orderId: 1,
        invoiceNumber: "INV-2024-001",
        amount: "125000",
        currency: "MGA",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        dueDate: new Date(),
        paidDate: null,
        isPaid: false,
        createdAt: new Date()
      }
    ];
  },

  async createInvoice(invoiceData: any): Promise<any> {
    const invoice = {
      id: storage.nextId++,
      ...invoiceData,
      invoiceNumber: `INV-2024-${String(storage.nextId).padStart(3, '0')}`,
      createdAt: new Date()
    };
    return invoice;
  },

  async updateCustomQuoteStatus(id: number, status: string): Promise<any | undefined> {
    return this.updateQuoteStatus(id, status as any);
  },

  // Méthode pour récupérer tous les abonnements
  async getAllSubscriptions(): Promise<any[]> {
    return Array.from(storage.subscriptions.values());
  },
  
};

// Initialiser les données au démarrage
initializeData();

// Export des types et du storage principal
export { User, SubscriptionPlan, CustomQuote };
export { simpleStorage };
export default simpleStorage;