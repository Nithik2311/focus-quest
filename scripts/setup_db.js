import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    const dbName = process.env.DB_NAME || 'focus_quest';

    // First connect to default postgres db to create the target db if needed
    const setupClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
        database: 'postgres'
    });

    try {
        await setupClient.connect();
        console.log('Connected to PostgreSQL (postgres).');

        const dbRes = await setupClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
        if (dbRes.rowCount === 0) {
            console.log(`Creating database ${dbName}...`);
            await setupClient.query(`CREATE DATABASE ${dbName}`);
        }
        await setupClient.end();

        // Now connect to the actual database
        const client = new Client({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
            database: dbName
        });

        await client.connect();
        console.log(`Connected to PostgreSQL (${dbName}).`);

        const sqlPath = path.join(__dirname, '../server/database.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('Executing database setup...');
        await client.query(sql);

        console.log('Database setup complete.');
        await client.end();
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();
