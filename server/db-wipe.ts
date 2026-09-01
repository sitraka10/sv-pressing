// server/db-wipe.ts
import { pool } from "./db";

async function wipeDatabase() {
  console.log("🔴 Connexion à la base de données pour un nettoyage complet...");
  const client = await pool.connect();
  console.log("✅ Connecté.");

  try {
    // Étape 1 : Supprimer toutes les tables
    console.log("🔍 Recherche des tables à supprimer...");
    const tablesRes = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);
    const tableNames = tablesRes.rows.map((row) => row.tablename).filter(name => name !== 'drizzle_migrations');

    if (tableNames.length > 0) {
      console.log(`🔥 Suppression des tables : ${tableNames.join(", ")}`);
      await client.query(`DROP TABLE IF EXISTS ${tableNames.map(name => `"${name}"`).join(", ")} CASCADE;`);
      console.log("👍 Tables supprimées.");
    } else {
      console.log("👍 Aucune table à supprimer.");
    }

    // Étape 2 : Supprimer tous les types ENUM personnalisés
    console.log("🔍 Recherche des types ENUM à supprimer...");
    const typesRes = await client.query(`
      SELECT t.typname FROM pg_type t JOIN pg_namespace ns ON ns.oid = t.typnamespace WHERE ns.nspname = 'public' AND t.typtype = 'e';
    `);
    const typeNames = typesRes.rows.map((row) => row.typname);

    if (typeNames.length > 0) {
      console.log(`🔥 Suppression des types : ${typeNames.join(", ")}`);
      await client.query(`DROP TYPE IF EXISTS ${typeNames.map(name => `"${name}"`).join(", ")} CASCADE;`);
      console.log("👍 Types supprimés.");
    } else {
      console.log("👍 Aucun type personnalisé à supprimer.");
    }

    console.log("✅ Nettoyage complet de la base de données terminé !");

  } catch (err) {
    console.error("❌ ERREUR lors du nettoyage :", err);
  } finally {
    await client.release();
    await pool.end();
    console.log(" déconnecté.");
  }
}

wipeDatabase();