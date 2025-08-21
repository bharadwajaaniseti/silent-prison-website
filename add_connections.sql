-- Add connections field to regions table
ALTER TABLE regions ADD COLUMN IF NOT EXISTS connections jsonb DEFAULT '[]'::jsonb;

-- Add index for connections
CREATE INDEX IF NOT EXISTS idx_regions_connections ON regions USING GIN(connections);
