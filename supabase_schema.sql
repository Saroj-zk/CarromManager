-- Pocket Masters Carrom Championship 2026
-- Supabase PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean existing tables (Optional, comment out if not needed)
-- DROP TABLE IF EXISTS matches CASCADE;
-- DROP TABLE IF EXISTS teams CASCADE;
-- DROP TABLE IF EXISTS news CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;

-- 1. Create Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code VARCHAR(5) NOT NULL UNIQUE, -- e.g., A1, B4
  group_name CHAR(1) NOT NULL CHECK (group_name IN ('A', 'B', 'C', 'D')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for group query optimization
CREATE INDEX idx_teams_group ON teams(group_name);

-- 2. Create Matches Table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name CHAR(1) CHECK (group_name IN ('A', 'B', 'C', 'D')), -- NULL for knockout matches
  team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_a_score INT DEFAULT 0,
  team_b_score INT DEFAULT 0,
  winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  stage TEXT NOT NULL CHECK (stage IN ('LEAGUE', 'QF', 'SF', 'FINAL')),
  status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED')),
  match_date TIMESTAMPTZ DEFAULT NOW(),
  round_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent team from playing against itself
  CONSTRAINT chk_different_teams CHECK (team_a_id <> team_b_id)
);

CREATE INDEX idx_matches_stage ON matches(stage);
CREATE INDEX idx_matches_status ON matches(status);

-- 3. Create News & Announcements Table
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Tournament Settings Table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Seed Initial Settings
INSERT INTO settings (key, value) VALUES 
('draw_points_enabled', 'false'::jsonb),
('passcode', '"PocketMasters2026"'::jsonb),
('tournament_stage', '"LEAGUE"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable Row Level Security (RLS)
-- If configuring Supabase Auth, you can lock down write operations to authenticated admins.
-- For a local tournament website, we will enable read access to all, and write access authenticated.
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create Policies (Select all, write restricted)
CREATE POLICY "Allow public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on news" ON news FOR SELECT USING (true);
CREATE POLICY "Allow public read access on settings" ON settings FOR SELECT USING (true);

-- For admin writes, these can be set to authenticated users
-- Or bypass RLS with service_role key when performing mutations.
CREATE POLICY "Allow service role write access on teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write access on matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write access on news" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
