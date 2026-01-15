const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()
const PORT = 5001
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

// Middleware
app.use(cors({
  origin: true, // Allow any origin in dev mode
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// Debug Middleware
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`)
  next()
})

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
})
app.use('/api', limiter)

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // Read from HttpOnly cookie

  if (!token) return res.status(401).json({ error: 'Access denied' })

  try {
    const verified = jwt.verify(token, JWT_SECRET)
    req.user = verified
    next()
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' })
  }
}


// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'focus_quest',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database')
    connection.release()
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message)
  })

// --- AUTHENTICATION ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    const userId = Date.now().toString()

    await pool.execute(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name, email, passwordHash]
    )

    await pool.execute(
      'INSERT INTO user_stats (user_id) VALUES (?)',
      [userId]
    )

    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    })

    res.json({
      success: true,
      user: { id: userId, name, email }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])

    if (users.length === 0) return res.status(400).json({ error: 'Invalid email or password' })

    const user = users[0]
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' })

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ success: true, message: 'Logged out' })
})

// --- PROTECTED ROUTES ---

// Get Stats
// Helper to safely deserialise BigInts just in case
const toNum = (val) => {
  if (typeof val === 'bigint') return Number(val)
  return Number(val) || 0
}

app.get('/api/users/:userId/stats', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.userId) return res.status(403).json({ error: 'Unauthorized access' })

  try {
    const { userId } = req.params
    const [rows] = await pool.execute('SELECT * FROM user_stats WHERE user_id = ?', [userId])

    let stats = rows.length > 0 ? rows[0] : null
    if (!stats) {
      await pool.execute('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [userId])
      stats = { total_xp: 0, level: 1, quests_completed: 0 }
    }

    const [historyRows] = await pool.execute(
      `SELECT DATE(end_time) as date, COUNT(*) as total_sessions,
         COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as failed_sessions,
         AVG(CASE WHEN total_cycles > 0 THEN (completed_cycles / total_cycles) * 100 ELSE 0 END) as focus_score 
       FROM sessions WHERE user_id = ? AND status IN ('completed', 'abandoned')
       GROUP BY DATE(end_time) ORDER BY date DESC LIMIT 30`,
      [userId]
    )

    console.log(`[Stats Debug] User: ${userId}`)

    const responseData = {
      totalXP: toNum(stats.total_xp),
      level: toNum(stats.level) || 1,
      questsCompleted: toNum(stats.quests_completed),
      healthHistory: historyRows.map(row => ({
        date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        focusScore: Math.round(toNum(row.focus_score)),
        sessionsCompleted: toNum(row.total_sessions),
        sessionsFailed: toNum(row.failed_sessions),
      })).reverse(),
    }

    console.log('[Stats Debug] Sending Data:', responseData)
    res.json(responseData)
  } catch (error) {
    console.error('[Stats Error]', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Secure Progress Update (Server-Side Authority)
app.post('/api/users/:userId/progress', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.userId) return res.status(403).json({ error: 'Unauthorized access' })

  try {
    const { userId } = req.params
    const { type } = req.body // 'cycle' or 'quest'

    // Server-Side Constants
    const XP_PER_CYCLE = 200
    const XP_QUEST_BONUS = 500

    // 1. Fetch Current State (Atomic-like)
    const [rows] = await pool.execute('SELECT * FROM user_stats WHERE user_id = ?', [userId])
    let stats = rows[0]

    if (!stats) {
      await pool.execute('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [userId])
      stats = { total_xp: 0, level: 1, quests_completed: 0 }
    }

    // 2. Calculate New State
    let addedXP = 0
    if (type === 'cycle') addedXP = XP_PER_CYCLE
    else if (type === 'quest') addedXP = XP_QUEST_BONUS

    // Prevent spam/replay? (Basic check: ideally check timestamp of last update, but simpler for now)

    const newXP = (stats.total_xp || 0) + addedXP
    const newLevel = Math.floor(newXP / 1000) + 1
    const newQuestsCompleted = type === 'quest' ? (stats.quests_completed || 0) + 1 : (stats.quests_completed || 0)

    // 3. Update DB
    await pool.execute(
      `UPDATE user_stats 
       SET total_xp = ?, level = ?, quests_completed = ?
       WHERE user_id = ?`,
      [newXP, newLevel, newQuestsCompleted, userId]
    )

    res.json({
      success: true,
      totalXP: newXP,
      level: newLevel,
      questsCompleted: newQuestsCompleted,
      addedXP
    })

  } catch (error) {
    console.error('Error updating progress:', error)
    res.status(500).json({ error: 'Failed to update progress' })
  }
})

// Save Character
app.post('/api/users/:userId/character', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.userId) return res.status(403).json({ error: 'Unauthorized access' })

  const VALIDATION_RULES = {
    genders: ['masculine', 'feminine'],
    hairLengths: ['none', 'normal', 'long'],
    // Armor ID -> Min Level
    armorLevels: {
      basic: 1, rogue: 1, knight: 1,
      barbarian: 2, fairyQueen: 2,
      mage: 4,
      cyber: 5, barbarianKing: 5, angel: 5,
      king: 8, queen: 8
    },
    // Aura Hex -> Min Level
    auraLevels: {
      '#0ea5e9': 1, '#06b6d4': 2, '#8b5cf6': 3,
      '#ec4899': 4, '#f59e0b': 5, '#ef4444': 6
    },
    // Hair Hex -> Min Level
    hairColorLevels: {
      '#2D1B18': 1, '#000000': 1,
      '#EAB308': 2,
      '#B91C1C': 3,
      '#FFFFFF': 4,
      '#4F46E5': 6,
      '#EC4899': 7
    }
  }

  try {
    const { userId } = req.params
    const {
      gender, skinTone, hairLength, hairColor, hasBeard, armorType,
      hasGlasses, glassesColor, hasShoes, shoesColor, auraColor, auraIntensity
    } = req.body

    // --- 1. Fetch User Level for Verification ---
    const [statsRows] = await pool.execute('SELECT level FROM user_stats WHERE user_id = ?', [userId])
    const userLevel = statsRows.length > 0 ? statsRows[0].level : 1

    // --- 2. Validation & Sanitization ---
    const errors = []

    // Enum Checks
    if (gender && !VALIDATION_RULES.genders.includes(gender)) errors.push('Invalid gender')
    if (hairLength && !VALIDATION_RULES.hairLengths.includes(hairLength)) errors.push('Invalid hair length')

    // Level Checks
    if (armorType) {
      const required = VALIDATION_RULES.armorLevels[armorType]
      if (!required) errors.push('Unknown armor type')
      else if (userLevel < required) errors.push(`Armor '${armorType}' requires level ${required}`)
    }

    if (auraColor) {
      const required = VALIDATION_RULES.auraLevels[auraColor]
      // Allow legacy/default colors if not in list, or strict check? Strict is safer.
      if (required && userLevel < required) errors.push(`Aura color requires level ${required}`)
    }

    if (hairColor) {
      const required = VALIDATION_RULES.hairColorLevels[hairColor]
      if (required && userLevel < required) errors.push(`Hair color requires level ${required}`)
    }

    // Basic Sanitization (Hex Colors)
    const isHex = (str) => /^#[0-9A-F]{6}$/i.test(str)
    if (skinTone && !isHex(skinTone)) errors.push('Invalid skin tone format')
    if (glassesColor && !isHex(glassesColor)) errors.push('Invalid glasses color format')

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }

    // --- 3. Save Validated Config ---

    // Ensure stats exist
    await pool.execute('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [userId])

    await pool.execute(
      `INSERT INTO character_configs (
        user_id, gender, skin_tone, hair_length, hair_color, has_beard,
        armor_type, has_glasses, glasses_color, has_shoes, shoes_color,
        aura_color, aura_intensity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gender = VALUES(gender), skin_tone = VALUES(skin_tone), hair_length = VALUES(hair_length),
        hair_color = VALUES(hair_color), has_beard = VALUES(has_beard), armor_type = VALUES(armor_type),
        has_glasses = VALUES(has_glasses), glasses_color = VALUES(glasses_color), has_shoes = VALUES(has_shoes),
        shoes_color = VALUES(shoes_color), aura_color = VALUES(aura_color), aura_intensity = VALUES(aura_intensity)`,
      [
        userId,
        gender || 'masculine',
        skinTone || '#F3C4A0',
        hairLength || 'normal',
        hairColor || '#2D1B18',
        hasBeard ? 1 : 0,
        armorType || 'basic',
        hasGlasses ? 1 : 0,
        glassesColor || '#000000',
        hasShoes ? 1 : 0,
        shoesColor || '#4B5563',
        auraColor || '#0ea5e9',
        auraIntensity || 0.5
      ]
    )
    res.json({ success: true, message: 'Character updated successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save character configuration' })
  }
})

// Get Character
app.get('/api/users/:userId/character', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.userId) return res.status(403).json({ error: 'Unauthorized access' })

  try {
    const { userId } = req.params
    const [rows] = await pool.execute('SELECT * FROM character_configs WHERE user_id = ?', [userId])

    if (rows.length === 0) {
      return res.json({
        gender: 'masculine', skinTone: '#F3C4A0', hairLength: 'normal', hairColor: '#2D1B18',
        hasBeard: false, armorType: 'basic', hasGlasses: false, glassesColor: '#000000',
        hasShoes: true, shoesColor: '#4B5563', auraColor: '#0ea5e9', auraIntensity: 0.5,
      })
    }

    const config = rows[0]
    // Map snake_case to camelCase
    res.json({
      gender: config.gender,
      skinTone: config.skin_tone,
      hairLength: config.hair_length,
      hairColor: config.hair_color,
      hasBeard: Boolean(config.has_beard),
      armorType: config.armor_type,
      hasGlasses: Boolean(config.has_glasses),
      glassesColor: config.glasses_color,
      hasShoes: Boolean(config.has_shoes),
      shoesColor: config.shoes_color,
      auraColor: config.aura_color,
      auraIntensity: parseFloat(config.aura_intensity),
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed' })
  }
})

// Report Session
app.post('/api/sessions', authenticateToken, async (req, res) => {
  // Validate user ID from token matches body
  if (req.user.id !== req.body.userId) return res.status(403).json({ error: 'Unauthorized session report' })

  try {
    const { userId, totalHours, totalCycles, completedCycles, totalXpEarned, status } = req.body
    await pool.execute(
      `INSERT INTO sessions (user_id, total_hours, total_cycles, completed_cycles, total_xp_earned, status, end_time)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, totalHours, totalCycles, completedCycles, totalXpEarned, status]
    )
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
