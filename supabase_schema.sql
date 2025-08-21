-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters Table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  title varchar(255),
  status varchar(50) CHECK (status IN ('alive', 'deceased', 'unknown', 'nightmare')),
  affiliation varchar(255),
  power_type varchar(100),
  power_level integer CHECK (power_level >= 0 AND power_level <= 100),
  image_url text, -- For storing Supabase Storage URLs
  image_path text, -- For storing the storage path/filename
  description text,
  background text,
  relationships jsonb DEFAULT '[]'::jsonb,
  abilities jsonb DEFAULT '[]'::jsonb,
  statistics jsonb DEFAULT '[]'::jsonb, -- For character statistics [{name: string, value: number}]
  metadata jsonb DEFAULT '{}'::jsonb, -- For extensible custom fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Regions Table (Map)
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  subtitle varchar(255),
  position jsonb NOT NULL, -- {x: number, y: number} - coordinates for map
  color varchar(100) NOT NULL, -- CSS gradient classes or hex colors
  description text,
  key_locations jsonb DEFAULT '[]'::jsonb,
  population varchar(100),
  threat varchar(100),
  map_data jsonb DEFAULT '{}'::jsonb, -- For additional map-specific data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  era varchar(50) CHECK (era IN ('ancient', 'pre-convergence', 'convergence', 'post-convergence', 'modern')),
  year varchar(50), -- Flexible for various date formats
  title varchar(500) NOT NULL,
  type varchar(50) CHECK (type IN ('era', 'catastrophe', 'warning', 'discovery', 'political', 'battle', 'other')),
  summary text,
  details text,
  impact text,
  order_index integer DEFAULT 0, -- For custom ordering within eras
  is_major_event boolean DEFAULT false, -- Flag for important events
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lore Entries Table
CREATE TABLE IF NOT EXISTS lore_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(50) CHECK (category IN ('factions', 'powers', 'continents', 'events', 'technology', 'culture', 'characters', 'other')),
  title varchar(500) NOT NULL,
  summary text,
  content text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  publish_date timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  view_count integer DEFAULT 0,
  featured boolean DEFAULT false, -- For highlighting important entries
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_characters_power_type ON characters(power_type);
CREATE INDEX IF NOT EXISTS idx_characters_affiliation ON characters(affiliation);
CREATE INDEX IF NOT EXISTS idx_characters_power_level ON characters(power_level);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_characters_statistics ON characters USING GIN(statistics);

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

-- Full-text search indexes for better search functionality
CREATE INDEX IF NOT EXISTS idx_characters_search ON characters USING GIN(to_tsvector('english', name || ' ' || COALESCE(title, '') || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_lore_search ON lore_entries USING GIN(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, '')));

-- Storage bucket for character images (run this in Supabase dashboard if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('character-images', 'character-images', true);

-- RLS Policies (if you want to enable Row Level Security later)
-- ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lore_entries ENABLE ROW LEVEL SECURITY;

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lore_entries_updated_at BEFORE UPDATE ON lore_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
