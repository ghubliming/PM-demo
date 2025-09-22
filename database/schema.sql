-- Prediction Market Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    balance DECIMAL(18,8) NOT NULL DEFAULT 100.0,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Markets table
CREATE TABLE markets (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    option1 TEXT NOT NULL,
    option2 TEXT NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_staked DECIMAL(18,8) NOT NULL DEFAULT 0,
    option1_stakes DECIMAL(18,8) NOT NULL DEFAULT 0,
    option2_stakes DECIMAL(18,8) NOT NULL DEFAULT 0,
    resolved BOOLEAN NOT NULL DEFAULT false,
    winner INTEGER NOT NULL DEFAULT 0,
    resolution_time TIMESTAMPTZ,
    disputed BOOLEAN NOT NULL DEFAULT false,
    dispute_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User positions in markets
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    option1_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
    option2_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, market_id)
);

-- User bets history
CREATE TABLE user_bets (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    option INTEGER NOT NULL CHECK (option IN (1, 2)),
    amount DECIMAL(18,8) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Market disputes
CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    disputer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proposed_winner INTEGER NOT NULL CHECK (proposed_winner IN (1, 2)),
    bond_amount DECIMAL(18,8) NOT NULL,
    dispute_time TIMESTAMPTZ NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    dispute_valid BOOLEAN NOT NULL DEFAULT false,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_markets_end_time ON markets(end_time);
CREATE INDEX idx_markets_resolved ON markets(resolved);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_market_id ON positions(market_id);
CREATE INDEX idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX idx_user_bets_market_id ON user_bets(market_id);
CREATE INDEX idx_disputes_market_id ON disputes(market_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on markets" ON markets FOR ALL USING (true);
CREATE POLICY "Allow all operations on positions" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_bets" ON user_bets FOR ALL USING (true);
CREATE POLICY "Allow all operations on disputes" ON disputes FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();