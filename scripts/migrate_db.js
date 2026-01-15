import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'focus_quest',
        multipleStatements: true
    });

    try {
        console.log('Connected to MySQL.');

        // 1. Drop old tables
        console.log('Dropping deprecated tables...');
        await connection.query('DROP TABLE IF EXISTS health_history');
        await connection.query('DROP TABLE IF EXISTS character_configs');
        // We drop character_configs to recreate it with the new schema (Cols instead of JSON)
        // Note: This results in data loss for configs, which is acceptable for this prototype phase.

        // 2. Read new schema
        const sqlPath = path.join(__dirname, '../server/database.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        // 3. Re-run setup to create tables
        console.log('Applying new schema...');
        await connection.query(sql);

        console.log('Database migration complete.');
    } catch (error) {
        console.error('Database migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrateDatabase();
