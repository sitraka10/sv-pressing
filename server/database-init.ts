import dotenv from 'dotenv';
dotenv.config();

import { db } from "./db";
import { users, subscriptionPlans, subscriptions, orders, orderStatusHistory, invoices } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import bcrypt from 'bcryptjs';
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function initializeDatabase() {
  console.log("Initializing database with sample data...");

  // Check if admin user already exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  if (existingAdmin.length > 0) {
    console.log("Database already initialized");
    return;
  }

  const passwordHash = await hashPassword("admin123");

  // Create admin and client users
  const userData = [
    { username: "admin", email: "admin@svpressing.mg", fullName: "Administrateur SV", phone: "+261 20 22 333 44", address: "Antananarivo, Madagascar", role: "admin" as const, isActive: true, password: passwordHash, preferredPickupDay: null },
    { username: "marie.raso", email: "marie.rasoamalala@gmail.com", fullName: "Marie Rasoamalala", phone: "+261 34 12 345 67", address: "Lot II M 123, Ankazobe, Antananarivo", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Lundi" },
    { username: "jean.rakoto", email: "jean.rakotomalala@yahoo.fr", fullName: "Jean Rakotomalala", phone: "+261 33 98 765 43", address: "45 Avenue de l'Indépendance, Antananarivo", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Mardi" },
    { username: "lova.razafy", email: "lova.razafy@hotmail.com", fullName: "Lova Razafy", phone: "+261 32 44 55 66", address: "Rue Rainilaiarivony, Fianarantsoa", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Mercredi" },
    { username: "naina.andro", email: "naina.andrianavalona@gmail.com", fullName: "Naina Andrianavalona", phone: "+261 34 77 88 99", address: "Lot VA 42, Antsirabe", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Jeudi" },
    { username: "hery.rabe", email: "hery.rabemananjara@outlook.com", fullName: "Hery Rabemananjara", phone: "+261 33 11 22 33", address: "Cité 67 Ha, Toamasina", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Vendredi" },
    { username: "miora.rako", email: "miora.rakotoarisoa@gmail.com", fullName: "Miora Rakotoarisoa", phone: "+261 32 55 66 77", address: "Quartier Analakely, Antananarivo", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Samedi" },
    { username: "tahina.randra", email: "tahina.randriamampionona@yahoo.fr", fullName: "Tahina Randriamampionona", phone: "+261 34 88 99 00", address: "Avenue Rainilaiarivony, Mahajanga", role: "client" as const, isActive: true, password: passwordHash, preferredPickupDay: "Dimanche" }
  ];

  const insertedUsers = await db.insert(users).values(userData).returning();
  console.log(`Created ${insertedUsers.length} users`);

  // Create subscription plans
  const planData = [
    { name: "Essentiel", type: "essential" as const, pricePerMonth: "25000", itemsIncluded: 10, pickupsPerWeek: 1, deliveryTimeHours: 48, features: ["Lavage standard", "Séchage", "Pliage soigné", "Collecte hebdomadaire"], isActive: true },
    { name: "Famille", type: "family" as const, pricePerMonth: "45000", itemsIncluded: 25, pickupsPerWeek: 2, deliveryTimeHours: 24, features: ["Lavage premium", "Séchage rapide", "Repassage inclus", "Collecte bi-hebdomadaire", "Service prioritaire"], isActive: true },
    { name: "Premium", type: "premium" as const, pricePerMonth: "75000", itemsIncluded: 50, pickupsPerWeek: 3, deliveryTimeHours: 12, features: ["Lavage de luxe", "Séchage express", "Repassage professionnel", "Collecte tri-hebdomadaire", "Service VIP", "Traitement spécialisé"], isActive: true }
  ];
  const insertedPlans = await db.insert(subscriptionPlans).values(planData as any).returning();
  console.log(`Created ${insertedPlans.length} subscription plans`);

  // Create subscriptions for clients
  const clientUsers = insertedUsers.filter(user => user.role === 'client');
  const subscriptionData = clientUsers.map((user, index) => ({
    clientId: user.id,
    planId: insertedPlans[index % insertedPlans.length].id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    preferredPickupDay: user.preferredPickupDay || "Lundi",
    preferredPickupTime: "09:00",
    isActive: true,
  }));

  const insertedSubscriptions = await db.insert(subscriptions).values(subscriptionData).returning();
  console.log(`Created ${insertedSubscriptions.length} subscriptions`);

  // Create sample orders for clients
  const orderData = clientUsers.slice(0, 3).map((user, index) => ({
    clientId: user.id,
    subscriptionId: insertedSubscriptions.find(s => s.clientId === user.id)?.id || insertedSubscriptions[0].id,
    status: ["to_pickup", "to_wash", "delivered"][index] as "to_pickup" | "to_wash" | "delivered",
    itemCount: 10 + index * 5,
    scheduledPickupDate: new Date(),
    scheduledDeliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    totalAmount: "25000",
    currency: "MGA",
  }));

  const insertedOrders = await db.insert(orders).values(orderData).returning();
  console.log(`Created ${insertedOrders.length} orders`);

  // Create order status history
  const statusHistory = insertedOrders.map(order => ({
    orderId: order.id,
    status: order.status,
    notes: `Commande ${order.status === 'delivered' ? 'livrée' : order.status === 'to_wash' ? 'en lavage' : 'en attente de collecte'}`,
    updatedBy: insertedUsers[0].id,
    timestamp: new Date()
  }));

  await db.insert(orderStatusHistory).values(statusHistory);
  console.log(`Created ${statusHistory.length} status history entries`);

  // ✅ CORRECTION: Create sample invoices with correct schema
  const adminId = insertedUsers.find(u => u.role === 'admin')?.id;
  if (!adminId) {
    throw new Error("Admin user not found after insertion.");
  }
  
  const invoiceData = insertedOrders.map((order, index) => ({
    clientId: order.clientId,
    subscriptionId: order.subscriptionId,
    orderIds: [order.id.toString()],
    invoiceNumber: `INV-2024-${String(index + 1).padStart(4, '0')}`,
    amount: "25000.00",
    currency: "MGA",
    status: 'pending' as const,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    subtotal: "25000.00",
    totalAmount: "25000.00",
    taxAmount: "0.00",
    generatedBy: adminId,
    isPaid: false,
    paidDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(invoices).values(invoiceData).returning();
  console.log(`Created ${invoiceData.length} invoices`);

  console.log("Database initialization completed successfully!");
}