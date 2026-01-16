-- Focus Quest Database Schema (PostgreSQL)

-- Users Table (Auth)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id VARCHAR(255) PRIMARY KEY,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1,
  quests_completed INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Character Configurations Table
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

-- Enum for Session Status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM('active', 'completed', 'abandoned');
    END IF;
END $$;

-- Sessions Table (for tracking Pomodoro sessions)
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

-- Index for sessions
CREATE INDEX IF NOT EXISTS idx_user_status ON sessions(user_id, status);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_stats_updated_at') THEN
        CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_configs_updated_at') THEN
        CREATE TRIGGER update_character_configs_updated_at BEFORE UPDATE ON character_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
