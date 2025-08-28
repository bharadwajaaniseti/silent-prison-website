# Testing Checklist for Region Visibility & JSON Upload

## Pre-Testing Setup

### 1. Database Setup
- [ ] Run the corrected SQL schema: `supabase-schema-updates-corrected.sql`
- [ ] Verify new columns exist in regions table:
  - `connections` (JSONB)
  - `region_icon` (TEXT)
  - `visibility_free_users` (BOOLEAN)
  - `visibility_signed_in_users` (BOOLEAN)
  - `visibility_premium_users` (BOOLEAN)
- [ ] Verify places table was created successfully
- [ ] Check that functions were created:
  - `get_regions_for_user_type()`
  - `bulk_insert_regions()`
  - `bulk_insert_places()`

### 2. Server Setup
- [ ] Update server.js with the new routes from `server-regions-fix.js`
- [ ] Ensure all routes are in the correct order (specific routes before generic ones)
- [ ] Restart the server after making changes

### 3. Environment Variables
- [ ] Verify `SUPABASE_URL` is set correctly
- [ ] Verify `SUPABASE_SERVICE_ROLE` key is set correctly
- [ ] Check that `VITE_API_URL` points to your server

## Backend API Testing

### 1. Basic CRUD Operations
- [ ] **GET /api/regions** - Should return all regions with visibility data
- [ ] **POST /api/regions** - Should create a new region with visibility settings
- [ ] **PUT /api/regions/:id** - Should update region including visibility
- [ ] **DELETE /api/regions/:id** - Should delete region and cascade to places

### 2. New Endpoints
- [ ] **POST /api/regions/bulk** - Should accept array of regions and create them
- [ ] **GET /api/regions/user-type/free** - Should return only regions visible to free users
- [ ] **GET /api/regions/user-type/signed_in** - Should return regions for signed-in users
- [ ] **GET /api/regions/user-type/premium** - Should return regions for premium users
- [ ] **PUT /api/regions/:id/visibility** - Should update only visibility settings

### 3. Data Transformation
- [ ] Database fields correctly map to frontend format:
  - `key_locations` ↔ `keyLocations`
  - `region_icon` ↔ `imageUrl`
  - `visibility_*_users` ↔ `visibility.{userType}`
- [ ] Frontend data correctly transforms to database format

## Frontend Testing

### 1. Admin Panel Access
- [ ] Admin panel loads without errors
- [ ] Existing regions display correctly
- [ ] "Add New Region" button works
- [ ] "Upload JSON" button works

### 2. JSON Upload Modal
- [ ] Modal opens when clicking "Upload JSON"
- [ ] File upload input accepts .json files
- [ ] Textarea allows pasting JSON content
- [ ] Sample JSON format displays correctly
- [ ] Validation works for invalid JSON
- [ ] Validation works for missing required fields
- [ ] Success message appears after successful upload
- [ ] Modal closes after successful upload

### 3. Region Form
- [ ] All existing fields work correctly
- [ ] New visibility checkboxes appear
- [ ] Visibility checkboxes have correct colors (Green/Blue/Yellow)
- [ ] Warning appears when no visibility options are selected
- [ ] Connection checkboxes show available regions
- [ ] Form submission includes visibility data

### 4. Region Management
- [ ] Regions list shows visibility controls
- [ ] Eye/EyeOff icons display correctly
- [ ] Clicking visibility toggles updates the region
- [ ] Visual feedback shows current visibility state
- [ ] Connection count displays correctly

## JSON Upload Testing

### 1. Valid JSON Formats
Test with these JSON structures:

#### Basic Region
```json
[
  {
    "name": "Test Region",
    "subtitle": "Test Subtitle",
    "position": { "x": 50, "y": 50 },
    "color": "from-blue-500 to-blue-600",
    "description": "Test description",
    "keyLocations": ["Location 1"],
    "population": "1000",
    "threat": "Low"
  }
]
```

#### With Visibility Settings
```json
[
  {
    "name": "Premium Region",
    "subtitle": "Premium Content",
    "position": { "x": 30, "y": 70 },
    "color": "from-gold-500 to-gold-600",
    "description": "Premium only region",
    "keyLocations": ["VIP Area"],
    "population": "500",
    "threat": "Exclusive",
    "visibility": {
      "freeUsers": false,
      "signedInUsers": false,
      "premiumUsers": true
    }
  }
]
```

#### With Places
```json
[
  {
    "name": "Complex Region",
    "subtitle": "With Places",
    "position": { "x": 60, "y": 40 },
    "color": "from-green-500 to-green-600",
    "description": "Region with places",
    "keyLocations": ["Main Hub"],
    "population": "2000",
    "threat": "Medium",
    "places": [
      {
        "name": "Central Plaza",
        "type": "landmark",
        "position": { "x": 0, "y": 0 },
        "size": "large",
        "importance": 5,
        "description": "Main gathering area"
      }
    ]
  }
]
```

### 2. Error Handling
- [ ] Empty JSON shows error
- [ ] Invalid JSON syntax shows error
- [ ] Non-array JSON shows error
- [ ] Missing required fields show specific error
- [ ] Network errors are handled gracefully

## Visibility System Testing

### 1. Database Level
- [ ] `get_regions_for_user_type('free')` returns correct regions
- [ ] `get_regions_for_user_type('signed_in')` returns correct regions
- [ ] `get_regions_for_user_type('premium')` returns correct regions
- [ ] Default visibility is set to true for all user types

### 2. API Level
- [ ] `/api/regions/user-type/free` filters correctly
- [ ] `/api/regions/user-type/signed_in` filters correctly
- [ ] `/api/regions/user-type/premium` filters correctly
- [ ] Visibility updates persist in database

### 3. Frontend Level
- [ ] Toggle buttons work for each user type
- [ ] Visual indicators show correct state
- [ ] Changes are saved immediately
- [ ] UI updates reflect database state

## Integration Testing

### 1. End-to-End Workflow
- [ ] Upload JSON with mixed visibility settings
- [ ] Verify regions appear in admin panel
- [ ] Toggle visibility for some regions
- [ ] Check that changes persist after page refresh
- [ ] Verify user-type filtering works correctly

### 2. Error Recovery
- [ ] Failed uploads don't corrupt existing data
- [ ] Network errors don't break the interface
- [ ] Invalid data is rejected gracefully
- [ ] Partial failures are handled correctly

## Performance Testing

### 1. Large Data Sets
- [ ] Upload 50+ regions at once
- [ ] Verify bulk operations complete successfully
- [ ] Check that UI remains responsive
- [ ] Confirm database performance is acceptable

### 2. Concurrent Operations
- [ ] Multiple visibility toggles work correctly
- [ ] Simultaneous uploads don't conflict
- [ ] Database transactions handle concurrency

## Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Common Issues & Solutions

### Database Issues
- **"position" keyword error**: Use the corrected SQL schema
- **Function not found**: Ensure all functions were created successfully
- **Permission denied**: Check that grants were applied correctly

### API Issues
- **404 on new endpoints**: Verify server routes are updated correctly
- **500 errors**: Check server logs for specific error messages
- **CORS issues**: Ensure API_BASE URL is correct

### Frontend Issues
- **Modal not opening**: Check for JavaScript errors in console
- **Upload not working**: Verify API endpoints are accessible
- **Visibility toggles not working**: Check network requests in dev tools

## Success Criteria

✅ **All tests pass** means:
1. Database schema is correctly updated
2. All API endpoints work as expected
3. JSON upload accepts valid data and rejects invalid data
4. Visibility controls work for all user types
5. Data persists correctly between sessions
6. No console errors or warnings
7. UI is responsive and user-friendly

## Troubleshooting Commands

### Check Database Schema
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'regions';

-- Test functions
SELECT * FROM get_regions_for_user_type('free');
```

### Test API Endpoints
```bash
# Test basic regions endpoint
curl http://localhost:3000/api/regions

# Test user-type filtering
curl http://localhost:3000/api/regions/user-type/free

# Test bulk upload
curl -X POST http://localhost:3000/api/regions/bulk \
  -H "Content-Type: application/json" \
  -d '{"regions": [{"name": "Test", "subtitle": "Test"}]}'
```

### Check Frontend
- Open browser dev tools
- Check Console tab for errors
- Check Network tab for failed requests
- Verify API responses contain expected data