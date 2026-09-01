import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import setupAuth from "./auth";

// ============ TYPES ============
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: "admin" | "client" | "delivery";
  isActive: boolean;
  createdAt: Date;
  password: string;
}

interface Plan {
  id: number;
  name: string;
  pricePerMonth: string;
  itemsIncluded: number;
  pickupsPerWeek: number;
  deliveryTimeHours: number;
  features: string[];
  isActive: boolean;
}

interface Subscription {
  id: number;
  clientId: number;
  planId: number;
  startDate: Date;
  endDate: Date | null;
  preferredPickupDay: string;
  preferredPickupTime: string;
  specialInstructions: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface Order {
  id: number;
  clientId: number;
  subscriptionId: number;
  status: "delivered" | "to_pickup" | "in_progress" | "ready_to_deliver" | "to_sort" | "to_wash" | "to_iron";
  itemCount: number;
  pickupDate: Date;
  deliveryDate: Date;
  notes: string;
  specialInstructions: string;
  overageAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Delivery {
  id: number;
  orderId: number;
  deliveryPersonId: number | null;
  status: "pending" | "completed" | "assigned";
  scheduledDate: Date | null;
  notes: string;
  completedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: string;
  date: Date;
  notes?: string;
  createdAt: Date;
}

interface Invoice {
  id: number;
  clientId: number;
  subscriptionId: number;
  orderId: number | null;
  amount: string;
  invoiceNumber: string;
  currency: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  paidDate: Date | null;
  isPaid: boolean;
  createdAt: Date;
}

interface Contract {
  id: number;
  clientId: number;
  subscriptionId: number;
  contractNumber: string;
  signedDate: Date;
  validFrom: Date;
  validUntil: Date;
  terms: string;
  status: string;
  createdAt: Date;
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
  status: "pending" | "approved" | "reviewed";
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
  status: "pending" | "approved" | "reviewed";
  createdAt: Date;
}

// ============ DONNÉES MOCK ============
let mockUsers: User[] = [
  { id: 1, username: "admin", email: "admin@svpressing.mg", fullName: "Administrateur SV", phone: "+261 32 00 000 01", address: "Antananarivo", role: "admin", isActive: true, createdAt: new Date('2024-01-01'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 2, username: "marie.raso", email: "marie.rasoamalala@gmail.com", fullName: "Marie Rasoamalala", phone: "+261 34 12 345 67", address: "Lot II M 123, Ankazobe, Antananarivo", role: "client", isActive: true, createdAt: new Date('2024-01-15'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 3, username: "jean.rakoto", email: "jean.rakotomalala@yahoo.fr", fullName: "Jean Rakotomalala", phone: "+261 33 98 765 43", address: "45 Avenue de l'Indépendance, Antananarivo", role: "client", isActive: true, createdAt: new Date('2024-02-01'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 4, username: "lova.razafy", email: "lova.razafy@hotmail.com", fullName: "Lova Razafy", phone: "+261 32 44 55 66", address: "Rue Rainilaiarivony, Fianarantsoa", role: "client", isActive: true, createdAt: new Date('2024-02-15'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 5, username: "naina.andro", email: "naina.andrianavalona@gmail.com", fullName: "Naina Andrianavalona", phone: "+261 34 77 88 99", address: "Lot VA 42, Antsirabe", role: "client", isActive: true, createdAt: new Date('2024-03-01'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 6, username: "hery.rabe", email: "hery.rabemananjara@outlook.com", fullName: "Hery Rabemananjara", phone: "+261 33 11 22 33", address: "Cité 67 Ha, Toamasina", role: "client", isActive: true, createdAt: new Date('2024-03-10'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 7, username: "miora.rako", email: "miora.rakotoarisoa@gmail.com", fullName: "Miora Rakotoarisoa", phone: "+261 32 55 66 77", address: "Quartier Analakely, Antananarivo", role: "client", isActive: true, createdAt: new Date('2024-03-20'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 8, username: "tahina.randra", email: "tahina.randriamampionona@yahoo.fr", fullName: "Tahina Randriamampionona", phone: "+261 34 88 99 00", address: "Avenue Rainilaiarivony, Mahajanga", role: "client", isActive: true, createdAt: new Date('2024-04-01'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 9, username: "livreur1", email: "livreur1@svpressing.mg", fullName: "Hery Rakotomalala", phone: "+261 34 00 00 00 04", address: "Ivato, Antananarivo", role: "delivery", isActive: true, createdAt: new Date('2024-01-10'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" },
  { id: 10, username: "livreur2", email: "livreur2@svpressing.mg", fullName: "Niry Ramanana", phone: "+261 34 77 88 99", address: "Antananarivo", role: "delivery", isActive: true, createdAt: new Date('2024-01-20'), password: "14298fecf3fe1b0c80f7a6d530c9e9e6b0c3a19d4ca7f9b82a67d82e63b4ad4c1.b9e8ca2a8d0e7d58f8e3e2b6e4e3e2f4" }
];

let mockPlans: Plan[] = [
  { id: 1, name: "Essentiel", pricePerMonth: "15000", itemsIncluded: 10, pickupsPerWeek: 1, deliveryTimeHours: 72, features: ["Lavage standard", "Séchage", "Pliage"], isActive: true },
  { id: 2, name: "Famille", pricePerMonth: "25000", itemsIncluded: 20, pickupsPerWeek: 2, deliveryTimeHours: 48, features: ["Lavage premium", "Séchage", "Repassage", "Pliage"], isActive: true },
  { id: 3, name: "Premium", pricePerMonth: "40000", itemsIncluded: 35, pickupsPerWeek: 3, deliveryTimeHours: 24, features: ["Lavage premium", "Traitement délicat", "Repassage professionnel", "Livraison express"], isActive: true },
  { id: 4, name: "Entreprise", pricePerMonth: "60000", itemsIncluded: 50, pickupsPerWeek: 5, deliveryTimeHours: 12, features: ["Service dédié", "Collecte quotidienne", "Traitement express", "Support prioritaire"], isActive: true }
];

let mockSubscriptions: Subscription[] = [
  { id: 1, clientId: 2, planId: 2, startDate: new Date('2024-01-15'), endDate: null, preferredPickupDay: "monday", preferredPickupTime: "09:00", specialInstructions: "Éviter l'assouplissant", isActive: true, createdAt: new Date('2024-01-15') },
  { id: 2, clientId: 3, planId: 1, startDate: new Date('2024-02-01'), endDate: null, preferredPickupDay: "wednesday", preferredPickupTime: "14:00", specialInstructions: "", isActive: true, createdAt: new Date('2024-02-01') },
  { id: 3, clientId: 4, planId: 3, startDate: new Date('2024-02-15'), endDate: null, preferredPickupDay: "friday", preferredPickupTime: "10:00", specialInstructions: "Vêtements délicats uniquement", isActive: true, createdAt: new Date('2024-02-15') },
  { id: 4, clientId: 5, planId: 2, startDate: new Date('2024-03-01'), endDate: null, preferredPickupDay: "tuesday", preferredPickupTime: "08:00", specialInstructions: "Linge de maison prioritaire", isActive: true, createdAt: new Date('2024-03-01') },
  { id: 5, clientId: 6, planId: 4, startDate: new Date('2024-03-10'), endDate: null, preferredPickupDay: "monday", preferredPickupTime: "07:00", specialInstructions: "Service express requis", isActive: true, createdAt: new Date('2024-03-10') },
  { id: 6, clientId: 7, planId: 1, startDate: new Date('2024-03-20'), endDate: null, preferredPickupDay: "thursday", preferredPickupTime: "15:00", specialInstructions: "", isActive: true, createdAt: new Date('2024-03-20') },
  { id: 7, clientId: 8, planId: 3, startDate: new Date('2024-04-01'), endDate: null, preferredPickupDay: "saturday", preferredPickupTime: "09:00", specialInstructions: "Uniforms de travail", isActive: true, createdAt: new Date('2024-04-01') }
];

let mockOrders: Order[] = [
  { id: 1, clientId: 2, subscriptionId: 1, status: "delivered", itemCount: 18, pickupDate: new Date('2024-01-22'), deliveryDate: new Date('2024-01-24'), notes: "Linge de maison et vêtements enfants", specialInstructions: "Éviter l'assouplissant", overageAmount: "0", createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-01-24') },
  { id: 2, clientId: 2, subscriptionId: 1, status: "delivered", itemCount: 20, pickupDate: new Date('2024-02-05'), deliveryDate: new Date('2024-02-07'), notes: "Vêtements de travail", specialInstructions: "", overageAmount: "0", createdAt: new Date('2024-02-03'), updatedAt: new Date('2024-02-07') },
  { id: 3, clientId: 2, subscriptionId: 1, status: "to_pickup", itemCount: 16, pickupDate: new Date('2024-04-22'), deliveryDate: new Date('2024-04-24'), notes: "Collection hebdomadaire", specialInstructions: "", overageAmount: "0", createdAt: new Date('2024-04-20'), updatedAt: new Date('2024-04-20') },
  { id: 4, clientId: 3, subscriptionId: 2, status: "delivered", itemCount: 12, pickupDate: new Date('2024-02-14'), deliveryDate: new Date('2024-02-17'), notes: "Chemises et pantalons de bureau", specialInstructions: "", overageAmount: "0", createdAt: new Date('2024-02-12'), updatedAt: new Date('2024-02-17') },
  { id: 5, clientId: 3, subscriptionId: 2, status: "delivered", itemCount: 10, pickupDate: new Date('2024-03-20'), deliveryDate: new Date('2024-03-23'), notes: "Vêtements quotidiens", specialInstructions: "", overageAmount: "0", createdAt: new Date('2024-03-18'), updatedAt: new Date('2024-03-23') },
  { id: 6, clientId: 3, subscriptionId: 2, status: "in_progress", itemCount: 14, pickupDate: new Date('2024-04-17'), deliveryDate: new Date('2024-04-20'), notes: "En cours de lavage", specialInstructions: "", overageAmount: "0", createdAt: new Date('2024-04-15'), updatedAt: new Date('2024-04-17') },
  { id: 7, clientId: 4, subscriptionId: 3, status: "delivered", itemCount: 25, pickupDate: new Date('2024-03-18'), deliveryDate: new Date('2024-03-19'), notes: "Service express - vêtements délicats", specialInstructions: "Traitement délicat uniquement", overageAmount: "0", createdAt: new Date('2024-03-16'), updatedAt: new Date('2024-03-19') },
  { id: 8, clientId: 4, subscriptionId: 3, status: "to_sort", itemCount: 30, pickupDate: new Date('2024-04-21'), deliveryDate: new Date('2024-04-22'), notes: "Collection premium", specialInstructions: "Vêtements haute couture", overageAmount: "5000", createdAt: new Date('2024-04-19'), updatedAt: new Date('2024-04-21') },
  { id: 9, clientId: 5, subscriptionId: 4, status: "delivered", itemCount: 22, pickupDate: new Date('2024-03-26'), deliveryDate: new Date('2024-03-28'), notes: "Linge de maison prioritaire", specialInstructions: "Linge de maison en premier", overageAmount: "0", createdAt: new Date('2024-03-24'), updatedAt: new Date('2024-03-28') },
  { id: 10, clientId: 6, subscriptionId: 5, status: "delivered", itemCount: 45, pickupDate: new Date('2024-03-25'), deliveryDate: new Date('2024-03-25'), notes: "Service express entreprise", specialInstructions: "Service express requis", overageAmount: "0", createdAt: new Date('2024-03-23'), updatedAt: new Date('2024-03-25') },
  { id: 11, clientId: 6, subscriptionId: 5, status: "ready_to_deliver", itemCount: 48, pickupDate: new Date('2024-04-15'), deliveryDate: new Date('2024-04-16'), notes: "Uniformes entreprise", specialInstructions: "Livraison matin", overageAmount: "0", createdAt: new Date('2024-04-13'), updatedAt: new Date('2024-04-15') },
  { id: 12, clientId: 7, subscriptionId: 6, status: "to_wash", itemCount: 8, pickupDate: new Date('2024-04-18'), deliveryDate: new Date('2024-04-21'), notes: "En cours de traitement", specialInstructions: "", overageAmount: "0", createdAt: new Date('2024-04-16'), updatedAt: new Date('2024-04-18') },
  { id: 13, clientId: 8, subscriptionId: 7, status: "to_iron", itemCount: 28, pickupDate: new Date('2024-04-20'), deliveryDate: new Date('2024-04-21'), notes: "Uniformes de travail - repassage", specialInstructions: "Repassage professionnel", overageAmount: "0", createdAt: new Date('2024-04-18'), updatedAt: new Date('2024-04-20') }
];

let mockDeliveries: Delivery[] = [
  { id: 1, orderId: 1, deliveryPersonId: 4, status: "pending", scheduledDate: new Date('2024-06-23'), notes: "Premier passage", completedDate: null, createdAt: new Date('2024-06-20'), updatedAt: new Date('2024-06-20') },
  { id: 2, orderId: 2, deliveryPersonId: 4, status: "completed", scheduledDate: new Date('2024-06-22'), notes: "Livré avec succès", completedDate: new Date('2024-06-22'), createdAt: new Date('2024-06-19'), updatedAt: new Date('2024-06-22') },
  { id: 3, orderId: 3, deliveryPersonId: 6, status: "completed", scheduledDate: new Date('2024-06-20'), notes: "Livraison effectuée", completedDate: new Date('2024-06-20'), createdAt: new Date('2024-06-18'), updatedAt: new Date('2024-06-20') },
  { id: 4, orderId: 4, deliveryPersonId: 4, status: "assigned", scheduledDate: new Date('2024-06-24'), notes: "À livrer demain", completedDate: null, createdAt: new Date('2024-06-21'), updatedAt: new Date('2024-06-21') }
];

let mockExpenses: Expense[] = [
  { id: 1, category: "Produits", description: "Détergents industriels", amount: "150000", date: new Date('2024-06-15'), notes: "Approvisionnement mensuel", createdAt: new Date('2024-06-15') },
  { id: 2, category: "Transport", description: "Carburant véhicules", amount: "80000", date: new Date('2024-06-18'), notes: "Essence livraisons", createdAt: new Date('2024-06-18') },
  { id: 3, category: "Équipement", description: "Maintenance machines", amount: "200000", date: new Date('2024-06-10'), notes: "Réparation lave-linge", createdAt: new Date('2024-06-10') },
  { id: 4, category: "Personnel", description: "Prime livreurs", amount: "120000", date: new Date('2024-06-01'), notes: "Prime mensuelle", createdAt: new Date('2024-06-01') }
];

let mockInvoices: Invoice[] = [
  { id: 1, clientId: 2, subscriptionId: 1, orderId: 1, amount: "25000", invoiceNumber: "SV-2024-001", currency: "MGA", billingPeriodStart: new Date('2024-01-01'), billingPeriodEnd: new Date('2024-01-31'), dueDate: new Date('2024-02-15'), paidDate: new Date('2024-02-10'), isPaid: true, createdAt: new Date('2024-01-20') },
  { id: 2, clientId: 2, subscriptionId: 1, orderId: null, amount: "25000", invoiceNumber: "SV-2024-002", currency: "MGA", billingPeriodStart: new Date('2024-02-01'), billingPeriodEnd: new Date('2024-02-29'), dueDate: new Date('2024-03-15'), paidDate: new Date('2024-03-12'), isPaid: true, createdAt: new Date('2024-02-20') },
  { id: 3, clientId: 2, subscriptionId: 1, orderId: null, amount: "25000", invoiceNumber: "SV-2024-003", currency: "MGA", billingPeriodStart: new Date('2024-03-01'), billingPeriodEnd: new Date('2024-03-31'), dueDate: new Date('2024-04-15'), paidDate: null, isPaid: false, createdAt: new Date('2024-03-20') },
  { id: 4, clientId: 3, subscriptionId: 2, orderId: 2, amount: "15000", invoiceNumber: "SV-2024-004", currency: "MGA", billingPeriodStart: new Date('2024-02-01'), billingPeriodEnd: new Date('2024-02-29'), dueDate: new Date('2024-03-15'), paidDate: new Date('2024-03-08'), isPaid: true, createdAt: new Date('2024-02-20') },
  { id: 5, clientId: 3, subscriptionId: 2, orderId: null, amount: "15000", invoiceNumber: "SV-2024-005", currency: "MGA", billingPeriodStart: new Date('2024-03-01'), billingPeriodEnd: new Date('2024-03-31'), dueDate: new Date('2024-04-15'), paidDate: new Date('2024-04-10'), isPaid: true, createdAt: new Date('2024-03-20') },
  { id: 6, clientId: 4, subscriptionId: 3, orderId: null, amount: "40000", invoiceNumber: "SV-2024-006", currency: "MGA", billingPeriodStart: new Date('2024-02-15'), billingPeriodEnd: new Date('2024-03-14'), dueDate: new Date('2024-03-30'), paidDate: new Date('2024-03-25'), isPaid: true, createdAt: new Date('2024-03-01') },
  { id: 7, clientId: 4, subscriptionId: 3, orderId: 4, amount: "45000", invoiceNumber: "SV-2024-007", currency: "MGA", billingPeriodStart: new Date('2024-03-15'), billingPeriodEnd: new Date('2024-04-14'), dueDate: new Date('2024-04-30'), paidDate: null, isPaid: false, createdAt: new Date('2024-04-01') },
  { id: 8, clientId: 5, subscriptionId: 4, orderId: null, amount: "25000", invoiceNumber: "SV-2024-008", currency: "MGA", billingPeriodStart: new Date('2024-03-01'), billingPeriodEnd: new Date('2024-03-31'), dueDate: new Date('2024-04-15'), paidDate: new Date('2024-04-12'), isPaid: true, createdAt: new Date('2024-03-20') },
  { id: 9, clientId: 6, subscriptionId: 5, orderId: null, amount: "60000", invoiceNumber: "SV-2024-009", currency: "MGA", billingPeriodStart: new Date('2024-03-10'), billingPeriodEnd: new Date('2024-04-09'), dueDate: new Date('2024-04-25'), paidDate: new Date('2024-04-20'), isPaid: true, createdAt: new Date('2024-03-25') },
  { id: 10, clientId: 7, subscriptionId: 6, orderId: null, amount: "15000", invoiceNumber: "SV-2024-010", currency: "MGA", billingPeriodStart: new Date('2024-03-20'), billingPeriodEnd: new Date('2024-04-19'), dueDate: new Date('2024-05-05'), paidDate: null, isPaid: false, createdAt: new Date('2024-04-05') },
  { id: 11, clientId: 8, subscriptionId: 7, orderId: null, amount: "40000", invoiceNumber: "SV-2024-011", currency: "MGA", billingPeriodStart: new Date('2024-04-01'), billingPeriodEnd: new Date('2024-04-30'), dueDate: new Date('2024-05-15'), paidDate: null, isPaid: false, createdAt: new Date('2024-04-15') }
];

let mockContracts: Contract[] = [
  { id: 1, clientId: 2, subscriptionId: 1, contractNumber: "CONT-SV-2024-001", signedDate: new Date('2024-01-15'), validFrom: new Date('2024-01-15'), validUntil: new Date('2025-01-14'), terms: "Contrat d'abonnement Plan Famille - 25000 MGA/mois - 20 pièces incluses - 2 ramassages/semaine", status: "active", createdAt: new Date('2024-01-15') },
  { id: 2, clientId: 3, subscriptionId: 2, contractNumber: "CONT-SV-2024-002", signedDate: new Date('2024-02-01'), validFrom: new Date('2024-02-01'), validUntil: new Date('2025-01-31'), terms: "Contrat d'abonnement Plan Essentiel - 15000 MGA/mois - 10 pièces incluses - 1 ramassage/semaine", status: "active", createdAt: new Date('2024-02-01') },
  { id: 3, clientId: 4, subscriptionId: 3, contractNumber: "CONT-SV-2024-003", signedDate: new Date('2024-02-15'), validFrom: new Date('2024-02-15'), validUntil: new Date('2025-02-14'), terms: "Contrat d'abonnement Plan Premium - 40000 MGA/mois - 35 pièces incluses - 3 ramassages/semaine - Service express", status: "active", createdAt: new Date('2024-02-15') },
  { id: 4, clientId: 5, subscriptionId: 4, contractNumber: "CONT-SV-2024-004", signedDate: new Date('2024-03-01'), validFrom: new Date('2024-03-01'), validUntil: new Date('2025-02-28'), terms: "Contrat d'abonnement Plan Famille - 25000 MGA/mois - 20 pièces incluses - 2 ramassages/semaine", status: "active", createdAt: new Date('2024-03-01') },
  { id: 5, clientId: 6, subscriptionId: 5, contractNumber: "CONT-SV-2024-005", signedDate: new Date('2024-03-10'), validFrom: new Date('2024-03-10'), validUntil: new Date('2025-03-09'), terms: "Contrat d'abonnement Plan Entreprise - 60000 MGA/mois - 50 pièces incluses - 5 ramassages/semaine - Service dédié", status: "active", createdAt: new Date('2024-03-10') },
  { id: 6, clientId: 7, subscriptionId: 6, contractNumber: "CONT-SV-2024-006", signedDate: new Date('2024-03-20'), validFrom: new Date('2024-03-20'), validUntil: new Date('2025-03-19'), terms: "Contrat d'abonnement Plan Essentiel - 15000 MGA/mois - 10 pièces incluses - 1 ramassage/semaine", status: "active", createdAt: new Date('2024-03-20') },
  { id: 7, clientId: 8, subscriptionId: 7, contractNumber: "CONT-SV-2024-007", signedDate: new Date('2024-04-01'), validFrom: new Date('2024-04-01'), validUntil: new Date('2025-03-31'), terms: "Contrat d'abonnement Plan Premium - 40000 MGA/mois - 35 pièces incluses - 3 ramassages/semaine - Service express", status: "active", createdAt: new Date('2024-04-01') }
];

let mockCustomQuotes: CustomQuote[] = [
  { id: 1, fullName: "Andry Rabemananjara", email: "andry@example.mg", phone: "+261 32 11 22 33", address: "Antananarivo", itemsPerWeek: 20, pickupsPerWeek: 2, specialRequirements: "Vêtements délicats uniquement", status: "pending", createdAt: new Date('2024-06-19') },
  { id: 2, fullName: "Naina Randrianarison", email: "naina@example.mg", phone: "+261 33 22 33 44", address: "Antsirabe", itemsPerWeek: 15, pickupsPerWeek: 1, specialRequirements: "Uniformes scolaires", status: "approved", createdAt: new Date('2024-06-17') },
  { id: 3, fullName: "Hery Razanamahefa", email: "hery@example.mg", phone: "+261 34 55 66 77", address: "Mahajanga", itemsPerWeek: 30, pickupsPerWeek: 3, specialRequirements: "Service express", status: "reviewed", createdAt: new Date('2024-06-16') }
];

let mockPlanSelections: PlanSelection[] = [
  { id: 1, planId: 2, fullName: "Lova Razafy", firstName: "Lova", phone: "+261 33 44 55 66", address: "Fianarantsoa", specialRequirements: "Livraison le matin", status: "approved", createdAt: new Date('2024-06-18') },
  { id: 2, planId: 1, fullName: "Miora Rakotomalala", firstName: "Miora", phone: "+261 32 88 99 00", address: "Toamasina", specialRequirements: "", status: "pending", createdAt: new Date('2024-06-20') },
  { id: 3, planId: 3, fullName: "Tahina Andriamanana", firstName: "Tahina", phone: "+261 34 11 22 33", address: "Antsiranana", specialRequirements: "Collecte weekend", status: "reviewed", createdAt: new Date('2024-06-19') }
];

let nextId = 100;

// ============ EXTEND EXPRESS REQUEST ============
declare global {
  namespace Express {
interface User {}  }
}

// ============ AUTH HELPER ============
function isAuthenticated(req: Request): boolean {
  return !!(req as any).user;
}

function getUser(req: Request): User | null {
  return (req as any).user || null;
}

function isAdmin(req: Request): boolean {
  const user = getUser(req);
  return user !== null && user.role === "admin";
}

function isClient(req: Request): boolean {
  const user = getUser(req);
  return user !== null && user.role === "client";
}

// ============ REGISTER ROUTES ============
export function registerRoutes(app: Express) {
app.use(setupAuth);
  // Routes utilisateurs
  app.get("/api/users", (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.sendStatus(401);
    const user = getUser(req);
    res.json(mockUsers.filter(u => u.role !== "admin" || (user && user.role === "admin")));
  });

  app.get("/api/clients", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    res.json(mockUsers.filter(u => u.role === "client"));
  });

  app.post("/api/clients", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const newClient: User = {
      id: nextId++,
      username: req.body.username,
      email: req.body.email,
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      role: "client",
      isActive: true,
      createdAt: new Date(),
      password: "$hashed$"
    };
    
    mockUsers.push(newClient);
    
    if (req.body.planId) {
      const newSubscription: Subscription = {
        id: nextId++,
        clientId: newClient.id,
        planId: req.body.planId,
        startDate: new Date(),
        endDate: null,
        preferredPickupDay: "monday",
        preferredPickupTime: "09:00",
        specialInstructions: "",
        isActive: true,
        createdAt: new Date()
      };
      mockSubscriptions.push(newSubscription);
    }
    
    res.status(201).json(newClient);
  });

  app.patch("/api/clients/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const clientIndex = mockUsers.findIndex(u => u.id === parseInt(req.params.id));
    if (clientIndex === -1) return res.status(404).json({ message: "Client not found" });
    
    mockUsers[clientIndex] = { ...mockUsers[clientIndex], ...req.body };
    res.json(mockUsers[clientIndex]);
  });

  app.delete("/api/clients/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const clientIndex = mockUsers.findIndex(u => u.id === parseInt(req.params.id));
    if (clientIndex === -1) return res.status(404).json({ message: "Client not found" });
    
    mockUsers[clientIndex].isActive = false;
    res.json({ message: "Client deactivated" });
  });

  // Routes commandes
  app.get("/api/orders", (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.sendStatus(401);
    
    const user = getUser(req);
    if (user && user.role === "client") {
      res.json(mockOrders.filter(o => o.clientId === user.id));
    } else {
      res.json(mockOrders);
    }
  });

  app.post("/api/orders", (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.sendStatus(401);
    
    const user = getUser(req)!;
    const newOrder: Order = {
      id: nextId++,
      clientId: user.role === "client" ? user.id : req.body.clientId,
      subscriptionId: req.body.subscriptionId || 1,
      status: "to_pickup",
      itemCount: req.body.itemCount || 0,
      pickupDate: new Date(req.body.pickupDate),
      deliveryDate: new Date(req.body.deliveryDate),
      notes: req.body.notes || "",
      specialInstructions: req.body.specialInstructions || "",
      overageAmount: req.body.overageAmount || "0",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockOrders.push(newOrder);
    res.status(201).json(newOrder);
  });

  app.patch("/api/orders/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.sendStatus(401);
    
    const orderIndex = mockOrders.findIndex(o => o.id === parseInt(req.params.id));
    if (orderIndex === -1) return res.status(404).json({ message: "Order not found" });
    
    const oldStatus = mockOrders[orderIndex].status;
    mockOrders[orderIndex] = { ...mockOrders[orderIndex], ...req.body, updatedAt: new Date() };
    
    if (req.body.status === "ready_to_deliver" && oldStatus !== "ready_to_deliver") {
      const existingDelivery = mockDeliveries.find(d => d.orderId === parseInt(req.params.id));
      if (!existingDelivery) {
        const newDelivery: Delivery = {
          id: nextId++,
          orderId: parseInt(req.params.id),
          deliveryPersonId: null,
          status: "pending",
          scheduledDate: null,
          notes: "Commande prête pour livraison",
          completedDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockDeliveries.push(newDelivery);
      }
    }
    
    res.json(mockOrders[orderIndex]);
  });

  // Routes livraisons
  app.get("/api/deliveries", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    res.json(mockDeliveries);
  });

  app.post("/api/deliveries", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const newDelivery: Delivery = {
      id: nextId++,
      orderId: req.body.orderId,
      deliveryPersonId: req.body.deliveryPersonId,
      status: "pending",
      scheduledDate: new Date(req.body.scheduledDate),
      notes: req.body.notes || "",
      completedDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockDeliveries.push(newDelivery);
    res.status(201).json(newDelivery);
  });

  app.patch("/api/deliveries/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const deliveryIndex = mockDeliveries.findIndex(d => d.id === parseInt(req.params.id));
    if (deliveryIndex === -1) return res.status(404).json({ message: "Delivery not found" });
    
    if (req.body.status === "completed" && !req.body.completedDate) {
      req.body.completedDate = new Date();
    }
    
    mockDeliveries[deliveryIndex] = { ...mockDeliveries[deliveryIndex], ...req.body };
    res.json(mockDeliveries[deliveryIndex]);
  });

  // Routes livreurs
  app.get("/api/delivery-persons", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    res.json(mockUsers.filter(u => u.role === "delivery"));
  });

  app.post("/api/delivery-persons", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const newDeliveryPerson: User = {
      id: nextId++,
      username: req.body.username,
      email: req.body.email,
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      role: "delivery",
      isActive: true,
      createdAt: new Date(),
      password: "$hashed$"
    };
    
    mockUsers.push(newDeliveryPerson);
    res.status(201).json(newDeliveryPerson);
  });

  app.patch("/api/users/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const userIndex = mockUsers.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) return res.status(404).json({ message: "User not found" });
    
    Object.assign(mockUsers[userIndex], req.body);
    res.json(mockUsers[userIndex]);
  });

  app.patch("/api/users/:id/toggle-status", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const userIndex = mockUsers.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) return res.status(404).json({ message: "User not found" });
    
    mockUsers[userIndex].isActive = !mockUsers[userIndex].isActive;
    res.json(mockUsers[userIndex]);
  });

  // Routes dépenses
  app.get("/api/expenses", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    res.json(mockExpenses);
  });

  app.post("/api/expenses", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const newExpense: Expense = {
      id: nextId++,
      category: req.body.category,
      description: req.body.description,
      amount: req.body.amount,
      date: new Date(req.body.date),
      createdAt: new Date()
    };
    
    mockExpenses.push(newExpense);
    res.status(201).json(newExpense);
  });

  // Routes factures
  app.get("/api/invoices", (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.sendStatus(401);
    
    const user = getUser(req);
    if (user && user.role === "client") {
      res.json(mockInvoices.filter(inv => inv.clientId === user.id));
    } else {
      res.json(mockInvoices);
    }
  });

  // Routes plans d'abonnement
  app.get("/api/subscription-plans", (req: Request, res: Response) => {
    res.json(mockPlans);
  });

  app.post("/api/subscription-plans", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const newPlan: Plan = {
      id: nextId++,
      name: req.body.name,
      pricePerMonth: req.body.pricePerMonth,
      itemsIncluded: req.body.itemsIncluded,
      pickupsPerWeek: req.body.pickupsPerWeek,
      deliveryTimeHours: req.body.deliveryTimeHours,
      features: req.body.features || [],
      isActive: true
    };
    
    mockPlans.push(newPlan);
    res.status(201).json(newPlan);
  });

  app.patch("/api/subscription-plans/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const planIndex = mockPlans.findIndex(p => p.id === parseInt(req.params.id));
    if (planIndex === -1) return res.status(404).json({ message: "Plan not found" });
    
    Object.assign(mockPlans[planIndex], req.body);
    res.json(mockPlans[planIndex]);
  });

  app.delete("/api/subscription-plans/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || !isAdmin(req)) return res.sendStatus(403);
    
    const planIndex = mockPlans.findIndex(p => p.id === parseInt(req.params.id));
    if (planIndex === -1) return res.status(404).json({ message: "Plan not found" });
    
    mockPlans[planIndex].isActive = false;
    res.json({ message: "Plan deactivated" });
  });

  // Routes devis personnalisés
  app.get("/api/custom-quotes", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    res.json(mockCustomQuotes);
  });

  app.post("/api/custom-quotes", (req: Request, res: Response) => {
    const newQuote: CustomQuote = {
      id: nextId++,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      itemsPerWeek: req.body.itemsPerWeek,
      pickupsPerWeek: req.body.pickupsPerWeek,
      specialRequirements: req.body.specialRequirements || "",
      status: "pending",
      createdAt: new Date()
    };
    
    mockCustomQuotes.push(newQuote);
    res.status(201).json(newQuote);
  });

  app.patch("/api/custom-quotes/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const quoteIndex = mockCustomQuotes.findIndex(q => q.id === parseInt(req.params.id));
    if (quoteIndex === -1) return res.status(404).json({ message: "Quote not found" });
    
    mockCustomQuotes[quoteIndex] = { ...mockCustomQuotes[quoteIndex], ...req.body };
    res.json(mockCustomQuotes[quoteIndex]);
  });

  // Routes sélections de plans
  app.get("/api/plan-selections", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    res.json(mockPlanSelections);
  });

  app.post("/api/plan-selections", (req: Request, res: Response) => {
    const newSelection: PlanSelection = {
      id: nextId++,
      planId: req.body.planId,
      fullName: req.body.fullName,
      firstName: req.body.firstName,
      phone: req.body.phone,
      address: req.body.address,
      specialRequirements: req.body.specialRequirements || "",
      status: "pending",
      createdAt: new Date()
    };
    
    mockPlanSelections.push(newSelection);
    res.status(201).json(newSelection);
  });

  app.patch("/api/plan-selections/:id", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const selectionIndex = mockPlanSelections.findIndex(s => s.id === parseInt(req.params.id));
    if (selectionIndex === -1) return res.status(404).json({ message: "Selection not found" });
    
    mockPlanSelections[selectionIndex] = { ...mockPlanSelections[selectionIndex], ...req.body };
    res.json(mockPlanSelections[selectionIndex]);
  });

  // Route pour les statistiques
  app.get("/api/analytics", (req: Request, res: Response) => {
    if (!isAuthenticated(req) || isClient(req)) return res.sendStatus(403);
    
    const analytics = {
      revenue: 1250000,
      totalOrders: mockOrders.length,
      completedOrders: mockOrders.filter(o => o.status === "delivered").length,
      delayedOrders: 2,
      activeSubscriptions: 45,
      newClients: mockUsers.filter(u => u.role === "client" && 
        new Date(u.createdAt).getMonth() === new Date().getMonth()).length
    };
    
    res.json(analytics);
  });

  const httpServer = createServer(app);
  return httpServer;
}