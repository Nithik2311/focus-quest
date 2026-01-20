# Focus Quest - Gamified EdTech MVP

A secure, gamified Pomodoro-based learning application built with React, Tailwind CSS, Framer Motion, and MySQL.

## Requirements:Chrome Extension Setup

The **Focus Quest Companion** extension is required for tab monitoring and distraction detection.

### Installation Steps:

1. Open Google Chrome and navigate to: `chrome://extensions/`
2. Enable **"Developer mode"** using the toggle switch in the top-right corner.
3. Click the **"Load unpacked"** button that appears in the top-left.
4. Navigate to your project folder and select the `chrome-extension` directory.
5. Click **Select Folder**. "Focus Quest Companion" should now be active.

*Note: Ensure the extension is enabled whenever you are using the Focus Quest app.*

## Features

### Phase 1: Interactive Landing Page
- Hero section with 2D character sprite
- Dynamic cursor tracking (eyeballs follow mouse)
- Magic scroll component revealing Pomodoro technique details
- Secure authentication modal with input sanitization

### Phase 2: Character Customization
- Layered SVG character system
- Customizable base (gender, skin tone)
- Accessories (glasses, shoes)
- Aura effects with adjustable intensity
- Persistent character configuration

### Phase 3: Focus Quest (Pomodoro RPG)
- Session setup with total study hours
- 25-minute work / 5-minute break cycles
- State machine for Focus Loop (Idle, Focusing, Warning, Penalizing, Breaking)
- Yellow zone grace period (5 seconds)
- HP drain system (10 HP every 5 seconds if distracted)
- Alert system with speech bubbles
- Tab closure warning

### Phase 4: Student Dashboard
- Total XP earned display
- Level calculation and progress
- Quests accomplished counter
- Focus consistency chart (health history)

## Security Features

- Input sanitization for all user-defined strings
- XSS prevention
- Secure password hashing (mock for MVP)
- localStorage for state persistence (MVP)
- MySQL backend for production data storage

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Charts**: Recharts

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MySQL database:
```bash
mysql -u root -p < server/database.sql
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the development server:
```bash
npm run dev
```

5. Start the backend server (in a separate terminal):
```bash
npm run server
```

## Project Structure

```
focus-quest/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── utils/           # Utilities (security, storage, XP calculator, state machine)
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── server/
│   ├── index.js         # Express server
│   └── database.sql     # Database schema
├── package.json
└── README.md
```

## Usage

1. **Landing Page**: View the hero section and scroll to see the magic scroll
2. **Registration**: Click "Begin Quest" to register/login
3. **Customization**: Customize your character after registration
4. **Focus Quest**: Set study hours and start your Pomodoro session
5. **Dashboard**: View your stats and progress

## State Machine

The Focus Loop uses a state machine with these states:
- **Idle**: No active session
- **Focusing**: Active work phase
- **Warning**: 5-second grace period after tab switch
- **Penalizing**: HP draining (10 HP every 5 seconds)
- **Breaking**: Break phase active

## XP Calculation

- Base XP per Pomodoro: 100
- XP per minute focused: 2
- Perfect session bonus: 50 XP
- Level formula: `floor(sqrt(XP / 100)) + 1`


