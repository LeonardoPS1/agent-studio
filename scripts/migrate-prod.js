#!/usr/bin/env node
/**
 * Ejecuta migraciones SQL contra PostgreSQL de producción en Dokploy.
 * Uso: node scripts/migrate-prod.js
 * Requiere variables de entorno:
 *   PGHOST=172.18.0.1
 *   PGPORT=5432
 *   PGDATABASE=consultorio_medico
 *   PGUSER=dashboard_user
 *   PGPASSWORD=gLfzAyEq0KQL4Qplamdlx8x9ouZdHcnP
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || '172.18.0.1',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'consultorio_medico',
  user: process.env.PGUSER || 'dashboard_user',
  password: process.env.PGPASSWORD || 'gLfzAyEq0KQL4Qplamdlx8x9ouZdHcnP',
  ssl: false,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Conectando a PostgreSQL producción...');
    
    // Leer archivo de migración
    const migrationPath = join(__dirname, '../apps/studio/migrations/001_init.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('Ejecutando migración 001_init.sql...');
    await client.query(sql);
    
    console.log('✅ Migración completada exitosamente');
    
    // Verificar tablas creadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tablas en BD:', tables.rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();