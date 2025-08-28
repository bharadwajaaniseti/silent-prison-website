-- =====================================================
-- SUPABASE SQL SCHEMA UPDATES FOR REGIONS VISIBILITY
-- CORRECTED VERSION - COMPATIBLE WITH EXISTING CODEBASE
-- =====================================================

-- 1. ADD MISSING COLUMNS TO REGIONS TABLE
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS connections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS region_icon TEXT,
ADD COLUMN IF NOT EXISTS visibility_free_users BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_signed_in_users BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_premium_users BOOLEAN DEFAULT true;

-- 2. ADD COMMENTS TO EXPLAIN THE NEW COLUMNS
COMMENT ON COLUMN regions.connections IS 'Array of connected region IDs';
COMMENT ON COLUMN regions.region_icon IS 'URL to region icon/image';
COMMENT ON COLUMN regions.visibility_free_users IS 'Whether this region is visible to free/anonymous users';
COMMENT ON COLUMN regions.visibility_signed_in_users IS 'Whether this region is visible to signed-in users';
COMMENT ON COLUMN regions.visibility_premium_users IS 'Whether this region is visible to premium subscribers';

-- 3. CREATE INDEXES FOR BETTER QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_regions_connections ON regions USING GIN(connections);
CREATE INDEX IF NOT EXISTS idx_regions_visibility_free ON regions(visibility_free_users) WHERE visibility_free_users = true;
CREATE INDEX IF NOT EXISTS idx_regions_visibility_signed_in ON regions(visibility_signed_in_users) WHERE visibility_signed_in_users = true;
CREATE INDEX IF NOT EXISTS idx_regions_visibility_premium ON regions(visibility_premium_users) WHERE visibility_premium_users = true;
CREATE INDEX IF NOT EXISTS idx_regions_visibility_composite ON regions(visibility_free_users, visibility_signed_in_users, visibility_premium_users);

-- 4. UPDATE EXISTING REGIONS TO HAVE DEFAULT VISIBILITY
UPDATE regions 
SET 
    visibility_free_users = COALESCE(visibility_free_users, true),
    visibility_signed_in_users = COALESCE(visibility_signed_in_users, true),
    visibility_premium_users = COALESCE(visibility_premium_users, true),
    connections = COALESCE(connections, '[]'::jsonb)
WHERE 
    visibility_free_users IS NULL 
    OR visibility_signed_in_users IS NULL 
    OR visibility_premium_users IS NULL
    OR connections IS NULL;

-- 5. CREATE PLACES TABLE (if it doesn't exist)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('city', 'town', 'outpost', 'landmark', 'facility', 'ruins')),
    place_position JSONB NOT NULL, -- {x: number, y: number} - pixel offsets from region center
    size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    importance INTEGER NOT NULL CHECK (importance >= 1 AND importance <= 5),
    description TEXT,
    connections JSONB DEFAULT '[]'::jsonb, -- Array of place IDs
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CREATE INDEXES FOR PLACES TABLE
CREATE INDEX IF NOT EXISTS idx_places_region_id ON places(region_id);
CREATE INDEX IF NOT EXISTS idx_places_type ON places(type);
CREATE INDEX IF NOT EXISTS idx_places_size ON places(size);
CREATE INDEX IF NOT EXISTS idx_places_importance ON places(importance);
CREATE INDEX IF NOT EXISTS idx_places_connections ON places USING GIN(connections);

-- 7. CREATE FUNCTION TO GET REGIONS BASED ON USER TYPE
CREATE OR REPLACE FUNCTION get_regions_for_user_type(user_type TEXT DEFAULT 'free')
RETURNS TABLE (
    id UUID,
    name TEXT,
    subtitle TEXT,
    "position" JSONB,
    color TEXT,
    description TEXT,
    key_locations JSONB,
    population TEXT,
    threat TEXT,
    map_data JSONB,
    connections JSONB,
    region_icon TEXT,
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

-- 8. CREATE FUNCTION TO BULK INSERT REGIONS
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
    region_position JSONB;
    region_color TEXT;
    region_description TEXT;
    region_key_locations JSONB;
    region_population TEXT;
    region_threat TEXT;
    region_connections JSONB;
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
            region_position := region_item->'position';
            region_color := region_item->>'color';
            region_description := region_item->>'description';
            region_population := region_item->>'population';
            region_threat := region_item->>'threat';
            region_image_url := region_item->>'imageUrl';
            
            -- Extract arrays as JSONB
            region_key_locations := COALESCE(region_item->'keyLocations', '[]'::jsonb);
            region_connections := COALESCE(region_item->'connections', '[]'::jsonb);
            
            -- Extract visibility settings with defaults
            region_vis_free := COALESCE((region_item->'visibility'->>'freeUsers')::BOOLEAN, true);
            region_vis_signed := COALESCE((region_item->'visibility'->>'signedInUsers')::BOOLEAN, true);
            region_vis_premium := COALESCE((region_item->'visibility'->>'premiumUsers')::BOOLEAN, true);
            
            -- Insert the region
            INSERT INTO regions (
                id, name, subtitle, "position", color, description,
                key_locations, population, threat, connections, region_icon,
                visibility_free_users, visibility_signed_in_users, visibility_premium_users,
                created_at, updated_at
            ) VALUES (
                region_id,
                region_name,
                region_subtitle,
                region_position,
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
                "position" = EXCLUDED."position",
                color = EXCLUDED.color,
                description = EXCLUDED.description,
                key_locations = EXCLUDED.key_locations,
                population = EXCLUDED.population,
                threat = EXCLUDED.threat,
                connections = EXCLUDED.connections,
                region_icon = EXCLUDED.region_icon,
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

-- 9. CREATE FUNCTION TO BULK INSERT PLACES
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
    place_position JSONB;
    place_size TEXT;
    place_importance INTEGER;
    place_description TEXT;
    place_connections JSONB;
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
            place_position := place_item->'position';
            place_size := place_item->>'size';
            place_importance := (place_item->>'importance')::INTEGER;
            place_description := place_item->>'description';
            
            -- Extract connections array as JSONB
            place_connections := COALESCE(place_item->'connections', '[]'::jsonb);
            
            -- Insert the place
            INSERT INTO places (
                id, region_id, name, type, place_position, size,
                importance, description, connections, created_at, updated_at
            ) VALUES (
                place_id,
                parent_region_id,
                place_name,
                place_type,
                place_position,
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
                place_position = EXCLUDED.place_position,
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

-- 10. CREATE TRIGGERS FOR PLACES TABLE
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. GRANT NECESSARY PERMISSIONS
GRANT EXECUTE ON FUNCTION get_regions_for_user_type(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION bulk_insert_regions(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_insert_places(JSONB, UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT ON places TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON places TO authenticated;

-- 12. CREATE RLS POLICIES (Optional - uncomment if you want to enable RLS)
/*
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

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

-- Policy for premium users
CREATE POLICY "Premium users can view premium regions" ON regions
    FOR SELECT
    USING (
        visibility_premium_users = true 
        AND auth.role() = 'authenticated'
        -- Add your premium user check here
    );

-- Admin policy (full access)
CREATE POLICY "Admins have full access" ON regions
    FOR ALL
    USING (
        auth.role() = 'authenticated' 
        AND (auth.jwt() ->> 'user_metadata' ->> 'role') = 'admin'
    );

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
*/

-- 13. EXAMPLE USAGE QUERIES
-- Get all regions visible to free users:
-- SELECT * FROM get_regions_for_user_type('free');

-- Bulk insert regions from JSON:
-- SELECT * FROM bulk_insert_regions('[{"name": "Test Region", "subtitle": "Test", "position": {"x": 50, "y": 50}, "color": "from-blue-500 to-blue-600", "description": "Test description", "keyLocations": ["Location 1"], "population": "1000", "threat": "Low", "visibility": {"freeUsers": true, "signedInUsers": true, "premiumUsers": true}}]'::jsonb);