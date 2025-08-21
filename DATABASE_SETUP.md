# Silent Prison Website - Database Schema Setup

## Overview
This document outlines the optimized database schema for the Silent Prison website, including proper data types, constraints, indexes, and image storage setup.

## Database Schema Changes

### Key Improvements Made:
1. **Enhanced Data Types**: Changed from generic `text` to specific types like `varchar(255)`, `integer` with constraints
2. **Image Storage**: Added proper Supabase Storage integration with `image_url` and `image_path` fields
3. **Performance Indexes**: Added indexes for better query performance
4. **Data Validation**: Added CHECK constraints for enum-like fields
5. **Full-Text Search**: Enabled search across character names, descriptions, and lore content
6. **Auto Timestamps**: Added triggers to automatically update `updated_at` fields

### New Schema Features:

#### Characters Table
- **Status constraint**: Only allows 'alive', 'deceased', 'unknown', 'nightmare'
- **Power level constraint**: Range 0-100
- **Image storage**: Separate fields for URL and storage path
- **Metadata field**: JSONB for extensible custom properties

#### Regions Table
- **Position validation**: JSONB field for map coordinates
- **Map data**: Additional JSONB field for map-specific information

#### Timeline Events Table
- **Era constraint**: Defined historical periods
- **Event type constraint**: Categorized event types
- **Order index**: For custom sorting within eras
- **Major event flag**: Highlight important events

#### Lore Entries Table
- **Category constraint**: Defined content categories
- **View counter**: Track popular entries
- **Featured flag**: Highlight important lore
- **Full-text search**: Searchable content

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# Get these from your Supabase dashboard > Settings > API
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
```

### 2. Database Migration
Run the migration script in your Supabase SQL editor:
```sql
-- Copy and paste the contents of migration.sql
-- This will safely update your existing database
```

### 3. Storage Bucket Setup
In your Supabase dashboard:
1. Go to Storage section
2. Create a new bucket named `character-images`
3. Set it as public
4. Configure policies for authenticated uploads

Or run this SQL:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('character-images', 'character-images', true);
```

### 4. Storage Policies (Optional)
For better security, set up storage policies:
```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING (bucket_id = 'character-images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'character-images' AND auth.role() = 'authenticated');
```

## Image Upload Features

### Current Capabilities:
- **File validation**: Checks file type and size (max 5MB)
- **Automatic compression**: Resizes large images to 800x800px
- **Preview generation**: Shows preview before upload
- **Storage management**: Properly stores and deletes images
- **Fallback support**: Falls back to base64 if Supabase Storage fails

### Supported Formats:
- JPG/JPEG
- PNG
- WebP

## Field Mapping

### Frontend ↔ Database
- `powerType` ↔ `power_type`
- `powerLevel` ↔ `power_level`
- `keyLocations` ↔ `key_locations`
- `isPublished` ↔ `is_published`
- `publishDate` ↔ `publish_date`
- `imagePath` ↔ `image_path`
- `imageUrl` ↔ `image_url`

## Performance Considerations

### Indexes Added:
- Character status, power type, affiliation filtering
- Timeline era and event type filtering
- Lore category and publication status
- Full-text search on names and content
- JSONB indexes for tags and positions

### Query Optimization:
- Use indexed fields in WHERE clauses
- Leverage full-text search for content discovery
- Use JSONB operators for tag filtering
- Consider pagination for large datasets

## Data Validation

### Characters:
- Power level: 0-100 range
- Status: Predefined values only
- Required: name field
- Optional: all other fields

### Regions:
- Position: Must be valid JSONB coordinates
- Required: name, position, color fields

### Timeline Events:
- Era: Predefined historical periods
- Type: Categorized event types
- Required: title field

### Lore Entries:
- Category: Predefined content types
- Required: title, content fields
- Tags: Array format in JSONB

## Migration Safety

The migration script is designed to:
- Add new columns without breaking existing data
- Preserve all existing content
- Add constraints safely
- Create indexes without blocking operations
- Support rollback if needed

## Future Enhancements

Potential improvements:
1. **Versioning**: Track content changes over time
2. **Relationships**: Link entities across tables
3. **Comments**: User feedback on content
4. **Tags**: Hierarchical tagging system
5. **Media**: Support for videos and audio files
