import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        console.log('Connected to MySQL.');

        const sqlPath = path.join(__dirname, '../server/database.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('Executing database setup...');
        await connection.query(sql);

        console.log('Database setup complete.');
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

setupDatabase();
