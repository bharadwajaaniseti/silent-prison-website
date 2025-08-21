-- Migration script to update existing database to new schema
-- Run this in your Supabase SQL editor

-- Add new columns to characters table
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS image_path text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update existing image data (if any) - copy from old image column to new image_url
UPDATE characters 
SET image_url = image 
WHERE image IS NOT NULL AND image_url IS NULL;

-- Add constraints to characters table (with proper IF NOT EXISTS handling)
DO $$ 
BEGIN
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'characters_status_check') THEN
        ALTER TABLE characters ADD CONSTRAINT characters_status_check 
        CHECK (status IN ('alive', 'deceased', 'unknown', 'nightmare'));
    END IF;
    
    -- Add power level constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'characters_power_level_check') THEN
        ALTER TABLE characters ADD CONSTRAINT characters_power_level_check 
        CHECK (power_level >= 0 AND power_level <= 100);
    END IF;
END $$;

-- Add new columns to timeline_events table
ALTER TABLE timeline_events 
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_major_event boolean DEFAULT false;

-- Add constraints to timeline_events table (with proper IF NOT EXISTS handling)
DO $$ 
BEGIN
    -- Add era constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_era_check') THEN
        ALTER TABLE timeline_events ADD CONSTRAINT timeline_era_check 
        CHECK (era IN ('ancient', 'pre-convergence', 'convergence', 'post-convergence', 'modern'));
    END IF;
    
    -- Add type constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_type_check') THEN
        ALTER TABLE timeline_events ADD CONSTRAINT timeline_type_check 
        CHECK (type IN ('era', 'catastrophe', 'warning', 'discovery', 'political', 'battle', 'other'));
    END IF;
END $$;

-- Add new columns to lore_entries table
ALTER TABLE lore_entries 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Add constraints to lore_entries table (with proper IF NOT EXISTS handling)
DO $$ 
BEGIN
    -- Add category constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lore_category_check') THEN
        ALTER TABLE lore_entries ADD CONSTRAINT lore_category_check 
        CHECK (category IN ('factions', 'powers', 'continents', 'events', 'technology', 'culture', 'characters', 'other'));
    END IF;
END $$;

-- Add new columns to regions table
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS map_data jsonb DEFAULT '{}'::jsonb;

-- Ensure JSONB columns have proper defaults
UPDATE characters SET relationships = '[]'::jsonb WHERE relationships IS NULL;
UPDATE characters SET abilities = '[]'::jsonb WHERE abilities IS NULL;
UPDATE characters SET metadata = '{}'::jsonb WHERE metadata IS NULL;

UPDATE regions SET key_locations = '[]'::jsonb WHERE key_locations IS NULL;
UPDATE regions SET map_data = '{}'::jsonb WHERE map_data IS NULL;

UPDATE lore_entries SET tags = '[]'::jsonb WHERE tags IS NULL;

-- Create performance indexes (will skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_characters_power_type ON characters(power_type);
CREATE INDEX IF NOT EXISTS idx_characters_affiliation ON characters(affiliation);
CREATE INDEX IF NOT EXISTS idx_characters_power_level ON characters(power_level);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);
CREATE INDEX IF NOT EXISTS idx_regions_position ON regions USING GIN(position);

CREATE INDEX IF NOT EXISTS idx_timeline_era ON timeline_events(era);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(type);
CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline_events(era, order_index);
CREATE INDEX IF NOT EXISTS idx_timeline_major ON timeline_events(is_major_event) WHERE is_major_event = true;

CREATE INDEX IF NOT EXISTS idx_lore_category ON lore_entries(category);
CREATE INDEX IF NOT EXISTS idx_lore_published ON lore_entries(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_lore_tags ON lore_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lore_featured ON lore_entries(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_lore_publish_date ON lore_entries(publish_date DESC) WHERE is_published = true;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_characters_search ON characters USING GIN(to_tsvector('english', name || ' ' || COALESCE(title, '') || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_lore_search ON lore_entries USING GIN(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, '')));

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps (will skip if they exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_characters_updated_at') THEN
        CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_regions_updated_at') THEN
        CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_timeline_events_updated_at') THEN
        CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lore_entries_updated_at') THEN
        CREATE TRIGGER update_lore_entries_updated_at BEFORE UPDATE ON lore_entries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Optional: Create the storage bucket for character images
-- (This might need to be run separately in the Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('character-images', 'character-images', true)
-- ON CONFLICT (id) DO NOTHING;

COMMIT;
