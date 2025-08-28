// Example backend API routes for handling regions with Supabase
// This is a Node.js/Express example - adapt to your backend framework

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

// GET /api/regions - Fetch all regions (with visibility filtering)
router.get('/regions', async (req, res) => {
  try {
    const userType = req.query.userType || 'free'; // Default to free user
    
    // Use the custom function we created in SQL
    const { data, error } = await supabase
      .rpc('get_regions_for_user_type', { user_type: userType });
    
    if (error) throw error;
    
    // Transform the data to match frontend expectations
    const regions = data.map(region => ({
      id: region.id,
      name: region.name,
      subtitle: region.subtitle,
      position: {
        x: parseFloat(region.position_x),
        y: parseFloat(region.position_y)
      },
      color: region.color,
      description: region.description,
      keyLocations: region.key_locations || [],
      population: region.population,
      threat: region.threat,
      connections: region.connections || [],
      imageUrl: region.image_url,
      visibility: {
        freeUsers: region.visibility_free_users,
        signedInUsers: region.visibility_signed_in_users,
        premiumUsers: region.visibility_premium_users
      }
    }));
    
    res.json({ regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// GET /api/regions/user-type/:userType - Fetch regions for specific user type
router.get('/regions/user-type/:userType', async (req, res) => {
  try {
    const { userType } = req.params;
    
    const { data, error } = await supabase
      .rpc('get_regions_for_user_type', { user_type: userType });
    
    if (error) throw error;
    
    const regions = data.map(region => ({
      id: region.id,
      name: region.name,
      subtitle: region.subtitle,
      position: {
        x: parseFloat(region.position_x),
        y: parseFloat(region.position_y)
      },
      color: region.color,
      description: region.description,
      keyLocations: region.key_locations || [],
      population: region.population,
      threat: region.threat,
      connections: region.connections || [],
      imageUrl: region.image_url,
      visibility: {
        freeUsers: region.visibility_free_users,
        signedInUsers: region.visibility_signed_in_users,
        premiumUsers: region.visibility_premium_users
      }
    }));
    
    res.json({ regions });
  } catch (error) {
    console.error('Error fetching regions for user type:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// POST /api/regions - Add a single region
router.post('/regions', async (req, res) => {
  try {
    const { region } = req.body;
    
    // Transform frontend data to database format
    const dbRegion = {
      id: region.id || `region-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: region.name,
      subtitle: region.subtitle,
      position_x: region.position?.x || 0,
      position_y: region.position?.y || 0,
      color: region.color,
      description: region.description,
      key_locations: region.keyLocations || [],
      population: region.population,
      threat: region.threat,
      connections: region.connections || [],
      image_url: region.imageUrl || region.region_icon,
      visibility_free_users: region.visibility?.freeUsers ?? true,
      visibility_signed_in_users: region.visibility?.signedInUsers ?? true,
      visibility_premium_users: region.visibility?.premiumUsers ?? true
    };
    
    const { data, error } = await supabase
      .from('regions')
      .insert([dbRegion])
      .select()
      .single();
    
    if (error) throw error;
    
    // Handle places if they exist
    if (region.places && region.places.length > 0) {
      const places = region.places.map(place => ({
        id: place.id,
        region_id: data.id,
        name: place.name,
        type: place.type,
        position_x: place.position.x,
        position_y: place.position.y,
        size: place.size,
        importance: place.importance,
        description: place.description,
        connections: place.connections || []
      }));
      
      const { error: placesError } = await supabase
        .from('places')
        .insert(places);
      
      if (placesError) {
        console.error('Error inserting places:', placesError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Transform back to frontend format
    const responseRegion = {
      id: data.id,
      name: data.name,
      subtitle: data.subtitle,
      position: {
        x: parseFloat(data.position_x),
        y: parseFloat(data.position_y)
      },
      color: data.color,
      description: data.description,
      keyLocations: data.key_locations || [],
      population: data.population,
      threat: data.threat,
      connections: data.connections || [],
      imageUrl: data.image_url,
      visibility: {
        freeUsers: data.visibility_free_users,
        signedInUsers: data.visibility_signed_in_users,
        premiumUsers: data.visibility_premium_users
      }
    };
    
    res.json({ region: responseRegion });
  } catch (error) {
    console.error('Error adding region:', error);
    res.status(500).json({ error: 'Failed to add region' });
  }
});

// POST /api/regions/bulk - Bulk add regions from JSON
router.post('/regions/bulk', async (req, res) => {
  try {
    const { regions } = req.body;
    
    if (!Array.isArray(regions)) {
      return res.status(400).json({ error: 'Regions must be an array' });
    }
    
    // Use the bulk insert function we created in SQL
    const { data, error } = await supabase
      .rpc('bulk_insert_regions', { regions_data: regions });
    
    if (error) throw error;
    
    // Process places for each region
    const placesPromises = regions.map(async (region) => {
      if (region.places && region.places.length > 0) {
        try {
          await supabase
            .rpc('bulk_insert_places', { 
              places_data: region.places, 
              parent_region_id: region.id 
            });
        } catch (placesError) {
          console.error(`Error inserting places for region ${region.id}:`, placesError);
        }
      }
    });
    
    await Promise.all(placesPromises);
    
    // Fetch the inserted regions to return them
    const insertedIds = data.filter(result => result.success).map(result => result.inserted_id);
    
    const { data: insertedRegions, error: fetchError } = await supabase
      .from('regions')
      .select('*')
      .in('id', insertedIds);
    
    if (fetchError) throw fetchError;
    
    // Transform to frontend format
    const responseRegions = insertedRegions.map(region => ({
      id: region.id,
      name: region.name,
      subtitle: region.subtitle,
      position: {
        x: parseFloat(region.position_x),
        y: parseFloat(region.position_y)
      },
      color: region.color,
      description: region.description,
      keyLocations: region.key_locations || [],
      population: region.population,
      threat: region.threat,
      connections: region.connections || [],
      imageUrl: region.image_url,
      visibility: {
        freeUsers: region.visibility_free_users,
        signedInUsers: region.visibility_signed_in_users,
        premiumUsers: region.visibility_premium_users
      }
    }));
    
    res.json({ 
      regions: responseRegions,
      results: data // Include detailed results
    });
  } catch (error) {
    console.error('Error bulk adding regions:', error);
    res.status(500).json({ error: 'Failed to bulk add regions' });
  }
});

// PUT /api/regions/:id - Update a region
router.put('/regions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Transform frontend data to database format
    const dbUpdates = {};
    
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.subtitle) dbUpdates.subtitle = updates.subtitle;
    if (updates.position) {
      dbUpdates.position_x = updates.position.x;
      dbUpdates.position_y = updates.position.y;
    }
    if (updates.color) dbUpdates.color = updates.color;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.keyLocations) dbUpdates.key_locations = updates.keyLocations;
    if (updates.population) dbUpdates.population = updates.population;
    if (updates.threat) dbUpdates.threat = updates.threat;
    if (updates.connections) dbUpdates.connections = updates.connections;
    if (updates.imageUrl || updates.region_icon) {
      dbUpdates.image_url = updates.imageUrl || updates.region_icon;
    }
    if (updates.visibility) {
      dbUpdates.visibility_free_users = updates.visibility.freeUsers;
      dbUpdates.visibility_signed_in_users = updates.visibility.signedInUsers;
      dbUpdates.visibility_premium_users = updates.visibility.premiumUsers;
    }
    
    dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('regions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to frontend format
    const responseRegion = {
      id: data.id,
      name: data.name,
      subtitle: data.subtitle,
      position: {
        x: parseFloat(data.position_x),
        y: parseFloat(data.position_y)
      },
      color: data.color,
      description: data.description,
      keyLocations: data.key_locations || [],
      population: data.population,
      threat: data.threat,
      connections: data.connections || [],
      imageUrl: data.image_url,
      visibility: {
        freeUsers: data.visibility_free_users,
        signedInUsers: data.visibility_signed_in_users,
        premiumUsers: data.visibility_premium_users
      }
    };
    
    res.json({ region: responseRegion });
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ error: 'Failed to update region' });
  }
});

// PUT /api/regions/:id/visibility - Update region visibility only
router.put('/regions/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    
    const { data, error } = await supabase
      .from('regions')
      .update({
        visibility_free_users: visibility.freeUsers,
        visibility_signed_in_users: visibility.signedInUsers,
        visibility_premium_users: visibility.premiumUsers,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    const responseRegion = {
      id: data.id,
      name: data.name,
      subtitle: data.subtitle,
      position: {
        x: parseFloat(data.position_x),
        y: parseFloat(data.position_y)
      },
      color: data.color,
      description: data.description,
      keyLocations: data.key_locations || [],
      population: data.population,
      threat: data.threat,
      connections: data.connections || [],
      imageUrl: data.image_url,
      visibility: {
        freeUsers: data.visibility_free_users,
        signedInUsers: data.visibility_signed_in_users,
        premiumUsers: data.visibility_premium_users
      }
    };
    
    res.json({ region: responseRegion });
  } catch (error) {
    console.error('Error updating region visibility:', error);
    res.status(500).json({ error: 'Failed to update region visibility' });
  }
});

// DELETE /api/regions/:id - Delete a region
router.delete('/regions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete places first (cascade should handle this, but being explicit)
    await supabase
      .from('places')
      .delete()
      .eq('region_id', id);
    
    // Delete the region
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting region:', error);
    res.status(500).json({ error: 'Failed to delete region' });
  }
});

module.exports = router;