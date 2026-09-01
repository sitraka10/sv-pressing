import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createSupervisor() {
  console.log('\n🚀 CRÉATION SUPERVISEUR - VERSION COMPLÈTE');
  console.log('===========================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. Vérifier l'état actuel de l'enum
    console.log('📋 Vérification de l\'enum user_role...');
    const enumCheck = await pool.query(`
      SELECT enum_range(NULL::user_role) as role_values
    `);
    
    console.log(`   Actuel : ${enumCheck.rows[0].role_values}`);

    // 2. Ajouter 'supervisor' à l'enum s'il n'existe pas
    if (!enumCheck.rows[0].role_values.includes('supervisor')) {
      console.log('➕ Ajout de "supervisor" à l\'enum user_role...');
      try {
        await pool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor'`);
        console.log('✅ "supervisor" ajouté avec succès !');
      } catch (alterError: any) {
        // Si la valeur existe déjà, on continue
        console.log('ℹ️ "supervisor" existe déjà ou a été ajouté');
      }
    } else {
      console.log('✅ "supervisor" existe déjà dans l\'enum');
    }

    // 3. Vérifier que l'ajout a fonctionné
    const newEnumCheck = await pool.query(`
      SELECT enum_range(NULL::user_role) as role_values
    `);
    console.log(`📋 Nouvel enum : ${newEnumCheck.rows[0].role_values}`);

    // 4. Créer l'utilisateur avec le nom simple "agentsv"
    const username = 'agentsv';
    const email = 'agentsv@svpressing.com';
    const password = 'Supervisor2025!';
    const fullName = 'Agent Superviseur';
    const phone = '+261349900002';
    
    console.log('\n📋 Création de l\'utilisateur :');
    console.log(`   Utilisateur : ${username}`);
    console.log(`   Email : ${email}`);
    console.log(`   Mot de passe : ${password}`);
    console.log(`   Rôle : supervisor`);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      `SELECT username, email FROM "public"."users" WHERE username = $1 OR email = $2`,
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('\n⚠️  Un utilisateur avec ce nom ou email existe déjà :');
      existingUser.rows.forEach(row => {
        console.log(`   - ${row.username} | ${row.email}`);
      });
      
      // Suggérer des alternatives
      console.log('\n💡 Suggestions :');
      console.log(`   agentsv2`);
      console.log(`   agentsv_${Date.now().toString().slice(-4)}`);
      return;
    }

    // Hacher le mot de passe
    console.log('\n🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insérer l'utilisateur
    console.log('💾 Insertion dans la base de données...');
    
    const result = await pool.query(`
      INSERT INTO "public"."users" (
        username,
        password,
        email,
        full_name,
        phone,
        role,
        is_active,
        status,
        address,
        neighborhood,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::user_role,
        $7, $8::user_registration_status, $9, $10, NOW(), NOW()
      )
      RETURNING id, username, email, role, status, created_at
    `, [
      username,
      hashedPassword,
      email,
      fullName,
      phone,
      'supervisor',  // Maintenant ça marche car on a ajouté à l'enum
      true,
      'approved',
      'Antananarivo, Madagascar',
      'Analakely'
    ]);

    // SUCCÈS !
    console.log('\n✅✅✅ SUPERVISEUR CRÉÉ AVEC SUCCÈS ! ✅✅✅');
    console.log('===========================================');
    console.log(`🆔 ID : ${result.rows[0].id}`);
    console.log(`👤 Utilisateur : ${result.rows[0].username}`);
    console.log(`📧 Email : ${result.rows[0].email}`);
    console.log(`🔑 Mot de passe : ${password}`);
    console.log(`🎯 Rôle : ${result.rows[0].role}`);
    console.log(`📊 Statut : ${result.rows[0].status}`);
    console.log('===========================================');
    
    console.log('\n🔗 Connexion :');
    console.log(`   URL: /auth`);
    console.log(`   Utilisateur: agentsv`);
    console.log(`   Mot de passe: Supervisor2025!`);
    console.log(`   Redirection: /supervisor`);
    console.log('\n✨ Vous pouvez maintenant vous connecter ! ✨');

  } catch (error: any) {
    console.error('\n❌ ERREUR DÉTAILLÉE :');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
    
    if (error.message.includes('enum')) {
      console.log('\n💡 Problème avec l\'enum. Vérifions manuellement :');
      try {
        const manualCheck = await pool.query(`
          SELECT enum_range(NULL::user_role)
        `);
        console.log('   Enum actuel :', manualCheck.rows[0].enum_range);
      } catch (e) {
        console.log('   Impossible de vérifier l\'enum');
      }
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createSupervisor();