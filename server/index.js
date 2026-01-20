const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET

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
      callback(null, false); // Return false instead of error to see if it helps
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
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
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

pool.connect()
  .then(c => {
    console.log('✅ PostgreSQL connected')
    c.release()
  })
  .catch(err => console.error('❌ DB Error:', err.message))

// ======================
// AUTH MIDDLEWARE
// ======================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token =
    req.cookies?.token ||
    (authHeader && authHeader.split(' ')[1])

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

// ======================
// AUTH ROUTES
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
  } catch (e) {
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/auth/logout', (_, res) => {
  res.clearCookie('token')
  res.json({ success: true })
})

// ======================
// PROTECTED ROUTES
// ======================

app.get('/api/users/:userId/stats', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.userId)
    return res.status(403).json({ error: 'Forbidden' })

  try {
    const stats = await pool.query(
      'SELECT * FROM user_stats WHERE user_id=$1',
      [req.params.userId]
    )

    res.json(stats.rows[0] || {})
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

app.post('/api/users/:userId/progress', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.userId)
    return res.status(403).json({ error: 'Forbidden' })

  try {
    const { type } = req.body
    const XP = type === 'quest' ? 500 : 200

    await pool.query(
      `UPDATE user_stats
       SET total_xp = total_xp + $1
       WHERE user_id = $2`,
      [XP, req.params.userId]
    )

    res.json({ success: true, addedXP: XP })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
