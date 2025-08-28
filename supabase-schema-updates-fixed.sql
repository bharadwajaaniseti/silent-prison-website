-- =====================================================
-- SUPABASE SQL SCHEMA UPDATES FOR REGIONS VISIBILITY
-- FIXED VERSION FOR UUID COMPATIBILITY
-- =====================================================

-- First, let's check the current regions table structure
-- Run this to see current table structure:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'regions';

-- 1. ADD VISIBILITY COLUMNS TO REGIONS TABLE
-- Add visibility columns for different user types
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS visibility_free_users BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_signed_in_users BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_premium_users BOOLEAN DEFAULT true;

-- 2. ADD COMMENTS TO EXPLAIN THE COLUMNS
COMMENT ON COLUMN regions.visibility_free_users IS 'Whether this region is visible to free/anonymous users';
COMMENT ON COLUMN regions.visibility_signed_in_users IS 'Whether this region is visible to signed-in users';
COMMENT ON COLUMN regions.visibility_premium_users IS 'Whether this region is visible to premium subscribers';

-- 3. CREATE INDEXES FOR BETTER QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_regions_visibility_free 
ON regions(visibility_free_users) 
WHERE visibility_free_users = true;

CREATE INDEX IF NOT EXISTS idx_regions_visibility_signed_in 
ON regions(visibility_signed_in_users) 
WHERE visibility_signed_in_users = true;

CREATE INDEX IF NOT EXISTS idx_regions_visibility_premium 
ON regions(visibility_premium_users) 
WHERE visibility_premium_users = true;

-- 4. CREATE A COMPOSITE INDEX FOR COMPLEX VISIBILITY QUERIES
CREATE INDEX IF NOT EXISTS idx_regions_visibility_composite 
ON regions(visibility_free_users, visibility_signed_in_users, visibility_premium_users);

-- 5. UPDATE EXISTING REGIONS TO HAVE DEFAULT VISIBILITY (if any exist)
UPDATE regions 
SET 
    visibility_free_users = true,
    visibility_signed_in_users = true,
    visibility_premium_users = true
WHERE 
    visibility_free_users IS NULL 
    OR visibility_signed_in_users IS NULL 
    OR visibility_premium_users IS NULL;

-- 6. CREATE A FUNCTION TO GET REGIONS BASED ON USER TYPE
-- Note: Adjusted return type to match your actual regions table structure
CREATE OR REPLACE FUNCTION get_regions_for_user_type(user_type TEXT DEFAULT 'free')
RETURNS TABLE (
    id UUID,
    name TEXT,
    subtitle TEXT,
    position_x NUMERIC,
    position_y NUMERIC,
    color TEXT,
    description TEXT,
    key_locations TEXT[],
    population TEXT,
    threat TEXT,
    connections TEXT[],
    image_url TEXT,
    visibility_free_users BOOLEAN,
    visibility_signed_in_users BOOLEAN,
    visibility_premium_users BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    CASE user_type
        WHEN 'free' THEN
            RETURN QUERY
            SELECT r.* FROM regions r 
            WHERE r.visibility_free_users = true;
        WHEN 'signed_in' THEN
            RETURN QUERY
            SELECT r.* FROM regions r 
            WHERE r.visibility_signed_in_users = true;
        WHEN 'premium' THEN
            RETURN QUERY
            SELECT r.* FROM regions r 
            WHERE r.visibility_premium_users = true;
        ELSE
            -- Default to free user permissions
            RETURN QUERY
            SELECT r.* FROM regions r 
            WHERE r.visibility_free_users = true;
    END CASE;
END;
$$;

-- 7. CREATE A FUNCTION TO BULK INSERT REGIONS
-- Updated to handle UUID generation properly
CREATE OR REPLACE FUNCTION bulk_insert_regions(regions_data JSONB)
RETURNS TABLE (
    inserted_id UUID,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    region_item JSONB;
    region_id UUID;
    region_name TEXT;
    region_subtitle TEXT;
    region_pos_x NUMERIC;
    region_pos_y NUMERIC;
    region_color TEXT;
    region_description TEXT;
    region_key_locations TEXT[];
    region_population TEXT;
    region_threat TEXT;
    region_connections TEXT[];
    region_image_url TEXT;
    region_vis_free BOOLEAN;
    region_vis_signed BOOLEAN;
    region_vis_premium BOOLEAN;
BEGIN
    -- Loop through each region in the JSON array
    FOR region_item IN SELECT * FROM jsonb_array_elements(regions_data)
    LOOP
        BEGIN
            -- Extract values from JSON
            -- Try to parse the provided ID as UUID, or generate a new one
            BEGIN
                region_id := (region_item->>'id')::UUID;
            EXCEPTION WHEN OTHERS THEN
                region_id := gen_random_uuid();
            END;
            
            region_name := region_item->>'name';
            region_subtitle := region_item->>'subtitle';
            region_pos_x := (region_item->'position'->>'x')::NUMERIC;
            region_pos_y := (region_item->'position'->>'y')::NUMERIC;
            region_color := region_item->>'color';
            region_description := region_item->>'description';
            region_population := region_item->>'population';
            region_threat := region_item->>'threat';
            region_image_url := region_item->>'imageUrl';
            
            -- Extract arrays
            SELECT ARRAY(SELECT jsonb_array_elements_text(region_item->'keyLocations')) INTO region_key_locations;
            SELECT ARRAY(SELECT jsonb_array_elements_text(region_item->'connections')) INTO region_connections;
            
            -- Extract visibility settings with defaults
            region_vis_free := COALESCE((region_item->'visibility'->>'freeUsers')::BOOLEAN, true);
            region_vis_signed := COALESCE((region_item->'visibility'->>'signedInUsers')::BOOLEAN, true);
            region_vis_premium := COALESCE((region_item->'visibility'->>'premiumUsers')::BOOLEAN, true);
            
            -- Insert the region
            INSERT INTO regions (
                id, name, subtitle, position_x, position_y, color, description,
                key_locations, population, threat, connections, image_url,
                visibility_free_users, visibility_signed_in_users, visibility_premium_users,
                created_at, updated_at
            ) VALUES (
                region_id,
                region_name,
                region_subtitle,
                region_pos_x,
                region_pos_y,
                region_color,
                region_description,
                region_key_locations,
                region_population,
                region_threat,
                region_connections,
                region_image_url,
                region_vis_free,
                region_vis_signed,
                region_vis_premium,
                now(),
                now()
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                subtitle = EXCLUDED.subtitle,
                position_x = EXCLUDED.position_x,
                position_y = EXCLUDED.position_y,
                color = EXCLUDED.color,
                description = EXCLUDED.description,
                key_locations = EXCLUDED.key_locations,
                population = EXCLUDED.population,
                threat = EXCLUDED.threat,
                connections = EXCLUDED.connections,
                image_url = EXCLUDED.image_url,
                visibility_free_users = EXCLUDED.visibility_free_users,
                visibility_signed_in_users = EXCLUDED.visibility_signed_in_users,
                visibility_premium_users = EXCLUDED.visibility_premium_users,
                updated_at = now();
            
            -- Return success
            inserted_id := region_id;
            success := true;
            error_message := NULL;
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return error
            inserted_id := region_id;
            success := false;
            error_message := SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

-- 8. CREATE PLACES TABLE (if it doesn't exist)
-- Fixed to use UUID for region_id to match regions table
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('city', 'town', 'outpost', 'landmark', 'facility', 'ruins')),
    position_x NUMERIC NOT NULL,
    position_y NUMERIC NOT NULL,
    size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    importance INTEGER NOT NULL CHECK (importance >= 1 AND importance <= 5),
    description TEXT,
    connections TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CREATE INDEXES FOR PLACES TABLE
CREATE INDEX IF NOT EXISTS idx_places_region_id ON places(region_id);
CREATE INDEX IF NOT EXISTS idx_places_type ON places(type);
CREATE INDEX IF NOT EXISTS idx_places_size ON places(size);
CREATE INDEX IF NOT EXISTS idx_places_importance ON places(importance);

-- 10. CREATE FUNCTION TO BULK INSERT PLACES
-- Updated to handle UUID properly
CREATE OR REPLACE FUNCTION bulk_insert_places(places_data JSONB, parent_region_id UUID)
RETURNS TABLE (
    inserted_id UUID,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    place_item JSONB;
    place_id UUID;
    place_name TEXT;
    place_type TEXT;
    place_pos_x NUMERIC;
    place_pos_y NUMERIC;
    place_size TEXT;
    place_importance INTEGER;
    place_description TEXT;
    place_connections TEXT[];
BEGIN
    -- Loop through each place in the JSON array
    FOR place_item IN SELECT * FROM jsonb_array_elements(places_data)
    LOOP
        BEGIN
            -- Extract values from JSON
            -- Try to parse the provided ID as UUID, or generate a new one
            BEGIN
                place_id := (place_item->>'id')::UUID;
            EXCEPTION WHEN OTHERS THEN
                place_id := gen_random_uuid();
            END;
            
            place_name := place_item->>'name';
            place_type := place_item->>'type';
            place_pos_x := (place_item->'position'->>'x')::NUMERIC;
            place_pos_y := (place_item->'position'->>'y')::NUMERIC;
            place_size := place_item->>'size';
            place_importance := (place_item->>'importance')::INTEGER;
            place_description := place_item->>'description';
            
            -- Extract connections array
            SELECT ARRAY(SELECT jsonb_array_elements_text(place_item->'connections')) INTO place_connections;
            
            -- Insert the place
            INSERT INTO places (
                id, region_id, name, type, position_x, position_y, size,
                importance, description, connections, created_at, updated_at
            ) VALUES (
                place_id,
                parent_region_id,
                place_name,
                place_type,
                place_pos_x,
                place_pos_y,
                place_size,
                place_importance,
                place_description,
                place_connections,
                now(),
                now()
            )
            ON CONFLICT (id) DO UPDATE SET
                region_id = EXCLUDED.region_id,
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                position_x = EXCLUDED.position_x,
                position_y = EXCLUDED.position_y,
                size = EXCLUDED.size,
                importance = EXCLUDED.importance,
                description = EXCLUDED.description,
                connections = EXCLUDED.connections,
                updated_at = now();
            
            -- Return success
            inserted_id := place_id;
            success := true;
            error_message := NULL;
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return error
            inserted_id := place_id;
            success := false;
            error_message := SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

-- 11. CREATE RLS (Row Level Security) POLICIES FOR REGIONS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Free users can view public regions" ON regions;
DROP POLICY IF EXISTS "Signed-in users can view their accessible regions" ON regions;
DROP POLICY IF EXISTS "Premium users can view premium regions" ON regions;
DROP POLICY IF EXISTS "Admins have full access" ON regions;

-- Policy for free users (including anonymous)
CREATE POLICY "Free users can view public regions" ON regions
    FOR SELECT
    USING (visibility_free_users = true);

-- Policy for signed-in users
CREATE POLICY "Signed-in users can view their accessible regions" ON regions
    FOR SELECT
    USING (
        visibility_signed_in_users = true 
        AND auth.role() = 'authenticated'
    );

-- Policy for premium users (you'll need to implement premium user detection)
CREATE POLICY "Premium users can view premium regions" ON regions
    FOR SELECT
    USING (
        visibility_premium_users = true 
        AND auth.role() = 'authenticated'
        -- Add your premium user check here, e.g.:
        -- AND (auth.jwt() ->> 'user_metadata' ->> 'subscription_type') = 'premium'
    );

-- Admin policy (full access)
CREATE POLICY "Admins have full access" ON regions
    FOR ALL
    USING (
        auth.role() = 'authenticated' 
        AND (auth.jwt() ->> 'user_metadata' ->> 'role') = 'admin'
    );

-- 12. CREATE RLS POLICIES FOR PLACES
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Places visibility follows region visibility" ON places;
DROP POLICY IF EXISTS "Admins have full access to places" ON places;

-- Places inherit visibility from their parent region
CREATE POLICY "Places visibility follows region visibility" ON places
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM regions r 
            WHERE r.id = places.region_id 
            AND (
                (r.visibility_free_users = true) OR
                (r.visibility_signed_in_users = true AND auth.role() = 'authenticated') OR
                (r.visibility_premium_users = true AND auth.role() = 'authenticated')
                -- Add premium user check here too
            )
        )
    );

-- Admin policy for places
CREATE POLICY "Admins have full access to places" ON places
    FOR ALL
    USING (
        auth.role() = 'authenticated' 
        AND (auth.jwt() ->> 'user_metadata' ->> 'role') = 'admin'
    );

-- 13. GRANT NECESSARY PERMISSIONS
-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_regions_for_user_type(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_insert_regions(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_insert_places(JSONB, UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT ON regions TO anon, authenticated;
GRANT SELECT ON places TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON regions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON places TO authenticated;

-- 14. EXAMPLE QUERIES TO TEST THE SETUP

-- Get all regions visible to free users
-- SELECT * FROM get_regions_for_user_type('free');

-- Get all regions visible to signed-in users
-- SELECT * FROM get_regions_for_user_type('signed_in');

-- Get all regions visible to premium users
-- SELECT * FROM get_regions_for_user_type('premium');

-- Test bulk insert with UUID generation
-- SELECT * FROM bulk_insert_regions('[{"name": "Test Region", "subtitle": "Test", "position": {"x": 50, "y": 50}, "color": "from-blue-500 to-blue-600", "description": "Test description", "keyLocations": ["Location 1"], "population": "1000", "threat": "Low", "visibility": {"freeUsers": true, "signedInUsers": true, "premiumUsers": true}}]'::jsonb);