const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET

// ======================
// IMPORTANT FIX (proxy)
// ======================
app.set("trust proxy", 1);

// ======================
// MIDDLEWARE
// ======================

const allowedOrigins = [
  'http://localhost:5173',
  'https://focus-quest.vercel.app',
  'https://focus-quest-a699no2vs-nithik-s-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      console.log('CORS Blocked for origin:', origin);
      callback(null, false);
    }
  },
  credentials: true
}));

app.options('*', cors());
app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// ======================
// RATE LIMIT
// ======================

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
}))

// ======================
// DATABASE
// ======================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// ======================
// INIT DB (FULL SCHEMA)
// ======================

const initDB = async () => {
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id VARCHAR(255) PRIMARY KEY,
      total_xp INT DEFAULT 0,
      level INT DEFAULT 1,
      quests_completed INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS character_configs (
      user_id VARCHAR(255) PRIMARY KEY,
      gender VARCHAR(50) DEFAULT 'masculine',
      skin_tone VARCHAR(50) DEFAULT '#F3C4A0',
      hair_length VARCHAR(50) DEFAULT 'normal',
      hair_color VARCHAR(50) DEFAULT '#2D1B18',
      has_beard BOOLEAN DEFAULT FALSE,
      armor_type VARCHAR(50) DEFAULT 'basic',
      has_glasses BOOLEAN DEFAULT FALSE,
      glasses_color VARCHAR(50) DEFAULT '#000000',
      has_shoes BOOLEAN DEFAULT TRUE,
      shoes_color VARCHAR(50) DEFAULT '#4B5563',
      aura_color VARCHAR(50) DEFAULT '#0ea5e9',
      aura_intensity DECIMAL(3, 2) DEFAULT 0.50,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE
    );

    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
            CREATE TYPE session_status AS ENUM('active', 'completed', 'abandoned');
        END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP WITH TIME ZONE NULL,
      total_hours DECIMAL(4,2) NOT NULL,
      total_cycles INT NOT NULL,
      completed_cycles INT DEFAULT 0,
      total_xp_earned INT DEFAULT 0,
      status session_status DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_user_status ON sessions(user_id, status);

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_stats_updated_at') THEN
            CREATE TRIGGER update_user_stats_updated_at
            BEFORE UPDATE ON user_stats
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
        END IF;
    END $$;

    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_configs_updated_at') THEN
            CREATE TRIGGER update_character_configs_updated_at
            BEFORE UPDATE ON character_configs
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
        END IF;
    END $$;
    `;

    await pool.query(sql);
    console.log("✅ Full DB schema initialized");
  } catch (err) {
    console.error("❌ Schema error:", err.message);
  }
};

// ======================
// CONNECT + INIT
// ======================

pool.connect()
  .then(async (c) => {
    console.log('✅ PostgreSQL connected');
    c.release();
    await initDB();
  })
  .catch(err => console.error('❌ DB Error:', err.message));

// ======================
// AUTH MIDDLEWARE
// ======================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token =
    req.cookies?.token ||
    (authHeader && authHeader.split(' ')[1])

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

// ======================
// AUTH ROUTES (UNCHANGED)
// ======================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    const exists = await pool.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    )
    if (exists.rows.length)
      return res.status(400).json({ error: 'User already exists' })

    const hash = await bcrypt.hash(password, 10)
    const userId = Date.now().toString()

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES ($1,$2,$3,$4)',
      [userId, name, email, hash]
    )

    await pool.query(
      'INSERT INTO user_stats (user_id) VALUES ($1)',
      [userId]
    )

    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 86400000
    })

    res.json({ success: true, token, user: { id: userId, name, email } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    )

    if (!result.rows.length)
      return res.status(400).json({ error: 'Invalid credentials' })

    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)

    if (!match)
      return res.status(400).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 86400000
    })

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})