// server/db.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration du pool PostgreSQL local
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Pas de SSL pour PostgreSQL local
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle(pool, { schema });

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};