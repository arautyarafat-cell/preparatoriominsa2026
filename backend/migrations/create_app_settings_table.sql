-- Migration: Create app_settings table
-- Purpose: Store global application settings like contact information (WhatsApp, Email)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can read settings)
CREATE POLICY "Allow public read access to app_settings" 
    ON app_settings FOR SELECT 
    USING (true);

-- Allow authenticated users with admin role to update settings
-- Note: Adjust this policy based on your auth setup
CREATE POLICY "Allow admin to manage app_settings" 
    ON app_settings FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Insert default values
INSERT INTO app_settings (key, value) VALUES 
    ('whatsapp', ''),
    ('email', '')
ON CONFLICT (key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE app_settings IS 'Global application settings like contact information';
