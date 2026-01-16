# Focus Quest - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

Create the PostgreSQL database and tables:

```bash
psql -U postgres -f server/database.sql
```

**Alternative (if `psql` is not in PATH):**
```bash
node scripts/setup_db.js
```

Or manually:
1. Open pgAdmin or psql terminal
2. Run the SQL file: `server/database.sql`
3. Verify the database `focus_quest` was created

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=focus_quest
DB_PORT=5432
PORT=5001
NODE_ENV=development
```

### 4. Start the Application

**Terminal 1 - Frontend (React + Vite):**
```bash
npm run dev
```
Frontend will run on http://localhost:3000

**Terminal 2 - Backend (Express + PostgreSQL):**
```bash
npm run server
```
Backend will run on http://localhost:5001

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Features Overview

### ✅ Phase 1: Landing Page
- Hero section with animated character
- Eye tracking (eyeballs follow cursor)
- Magic scroll revealing Pomodoro technique
- Secure authentication modal

### ✅ Phase 2: Character Customization
- Customizable avatar system
- Base options (gender, skin tone)
- Accessories (glasses, shoes)
- Aura effects

### ✅ Phase 3: Focus Quest
- Pomodoro timer (25min work / 5min break)
- State machine for focus loop
- Yellow zone grace period (5 seconds)
- HP drain system (10 HP every 5 seconds)
- Alert system with speech bubbles
- Tab closure warning

### ✅ Phase 4: Dashboard
- XP and level display
- Quests completed counter
- Focus consistency chart

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `.env` credentials
- Ensure database `focus_quest` exists
- Run `server/database.sql` again if needed

### Port Already in Use
- Change `PORT` in `.env` for backend
- Change port in `vite.config.js` for frontend

### Eye Tracking Not Working
- Ensure mouse is moving over the hero section
- Check browser console for errors

## Development Notes

- Frontend uses localStorage for MVP (can be switched to API calls)
- Backend API endpoints are ready but optional for MVP
- All user inputs are sanitized for XSS prevention
- State persistence uses localStorage by default

## Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.
