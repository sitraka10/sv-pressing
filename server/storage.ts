// server/storage.ts
import { WorkingDatabaseStorage } from "./storage-db";

// Utiliser la base de données PostgreSQL pour la persistance
export const storage = new WorkingDatabaseStorage();