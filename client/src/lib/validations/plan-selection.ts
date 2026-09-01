// src/lib/validations/plan-selection.ts
import { z } from "zod";

export const insertPlanSelectionSchema = z.object({
  // Informations du plan
  planId: z.number().min(1, "L'ID du plan est requis"),
  planName: z.string().min(1, "Le nom du plan est requis"),
  planType: z.string().min(1, "Le type de plan est requis"),
  planPrice: z.string().min(1, "Le prix du plan est requis"),
  
  // Informations personnelles
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  address: z.string().min(5, "Adresse invalide"),
  specialRequirements: z.string().optional().default(""),
  status: z.string().default("pending"),
});

export type InsertPlanSelection = z.infer<typeof insertPlanSelectionSchema>;