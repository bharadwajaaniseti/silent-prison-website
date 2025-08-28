import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

// Helper function to transform database region to frontend format
function transformRegionFromDB(region) {
  return {
    id: region.id,
    name: region.name,
    subtitle: region.subtitle,
    position: region.position,
    color: region.color,
    description: region.description,
    keyLocations: region.key_locations || [],
    population: region.population,
    threat: region.threat,
    connections: region.connections || [],
    imageUrl: region.region_icon || '',
    visibility: {
      freeUsers: region.visibility_free_users ?? true,
      signedInUsers: region.visibility_signed_in_users ?? true,
      premiumUsers: region.visibility_premium_users ?? true,
    },
    createdAt: region.created_at,
    updatedAt: region.updated_at
  };
}

// Helper function to transform frontend region to database format
function transformRegionToDB(region) {
  return {
    name: region.name,
    subtitle: region.subtitle,
    position: region.position,
    color: region.color,
    description: region.description,
    key_locations: region.keyLocations || [],
    population: region.population,
    threat: region.threat,
    connections: region.connections || [],
    region_icon: region.imageUrl || region.region_icon || '',
    visibility_free_users: region.visibility?.freeUsers ?? true,
    visibility_signed_in_users: region.visibility?.signedInUsers ?? true,
    visibility_premium_users: region.visibility?.premiumUsers ?? true
  };
}

export default async function regionsHandler(req, res) {
  // Handle different URL patterns
  const urlParts = req.url.split('/');
  const regionId = urlParts[urlParts.length - 1];
  const isVisibilityUpdate = req.url.includes('/visibility');
  const isBulkOperation = req.url.includes('/bulk');
  const isUserTypeQuery = req.url.includes('/user-type/');
  
  if (req.method === 'GET') {
    try {
      // Handle user-type specific queries
      if (isUserTypeQuery) {
        const userType = urlParts[urlParts.length - 1];
        const { data, error } = await supabase.rpc('get_regions_for_user_type', { user_type: userType });
        if (error) throw error;
        
        const mappedData = data?.map(transformRegionFromDB) || [];
        return res.status(200).json({ regions: mappedData });
      }
      
      // Regular GET all regions
      const { data, error } = await supabase.from('regions').select('*');
      if (error) throw error;
      
      const mappedData = data?.map(transformRegionFromDB) || [];
      return res.status(200).json({ regions: mappedData });
    } catch (error) {
      console.error('GET regions error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      // Handle bulk operations
      if (isBulkOperation) {
        const { regions } = req.body;
        if (!Array.isArray(regions)) {
          return res.status(400).json({ error: 'Regions must be an array' });
        }
        
        // Use the bulk insert function
        const { data, error } = await supabase.rpc('bulk_insert_regions', { regions_data: regions });
        if (error) throw error;
        
        // Process places for each region
        const placesPromises = regions.map(async (region) => {
          if (region.places && region.places.length > 0) {
            try {
              const regionId = region.id || data.find(r => r.success)?.inserted_id;
              if (regionId) {
                await supabase.rpc('bulk_insert_places', { 
                  places_data: region.places, 
                  parent_region_id: regionId 
                });
              }
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
        
        const responseRegions = insertedRegions?.map(transformRegionFromDB) || [];
        return res.status(201).json({ 
          regions: responseRegions,
          results: data
        });
      }
      
      // Handle single region creation
      const { region } = req.body;
      if (!region) {
        return res.status(400).json({ error: 'Region data is required' });
      }
      
      const dbRegion = transformRegionToDB(region);
      const { data, error } = await supabase.from('regions').insert([dbRegion]).select();
      if (error) throw error;
      
      // Handle places if they exist
      if (region.places && region.places.length > 0) {
        try {
          await supabase.rpc('bulk_insert_places', { 
            places_data: region.places, 
            parent_region_id: data[0].id 
          });
        } catch (placesError) {
          console.error('Error inserting places:', placesError);
        }
      }
      
      const mappedRegion = transformRegionFromDB(data[0]);
      return res.status(201).json({ region: mappedRegion });
    } catch (error) {
      console.error('POST regions error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'PUT') {
    try {
      if (!regionId || regionId === 'regions') {
        return res.status(400).json({ error: 'Missing region ID' });
      }
      
      // Handle visibility-only updates
      if (isVisibilityUpdate) {
        const { visibility } = req.body;
        if (!visibility) {
          return res.status(400).json({ error: 'Visibility data is required' });
        }
        
        const { data, error } = await supabase
          .from('regions')
          .update({
            visibility_free_users: visibility.freeUsers,
            visibility_signed_in_users: visibility.signedInUsers,
            visibility_premium_users: visibility.premiumUsers,
            updated_at: new Date().toISOString()
          })
          .eq('id', regionId)
          .select();
        
        if (error) throw error;
        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Region not found' });
        }
        
        const mappedRegion = transformRegionFromDB(data[0]);
        return res.status(200).json({ region: mappedRegion });
      }
      
      // Handle full region updates
      const updates = req.body;
      const dbUpdates = {};
      
      // Map frontend fields to database format
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.keyLocations !== undefined) dbUpdates.key_locations = updates.keyLocations;
      if (updates.population !== undefined) dbUpdates.population = updates.population;
      if (updates.threat !== undefined) dbUpdates.threat = updates.threat;
      if (updates.connections !== undefined) dbUpdates.connections = updates.connections;
      if (updates.imageUrl !== undefined || updates.region_icon !== undefined) {
        dbUpdates.region_icon = updates.imageUrl || updates.region_icon;
      }
      if (updates.visibility !== undefined) {
        dbUpdates.visibility_free_users = updates.visibility.freeUsers;
        dbUpdates.visibility_signed_in_users = updates.visibility.signedInUsers;
        dbUpdates.visibility_premium_users = updates.visibility.premiumUsers;
      }
      
      dbUpdates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('regions')
        .update(dbUpdates)
        .eq('id', regionId)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }
      
      const mappedRegion = transformRegionFromDB(data[0]);
      return res.status(200).json({ region: mappedRegion });
    } catch (error) {
      console.error('PUT regions error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      if (!regionId || regionId === 'regions') {
        return res.status(400).json({ error: 'Missing region ID' });
      }
      
      // Delete places first (cascade should handle this, but being explicit)
      await supabase.from('places').delete().eq('region_id', regionId);
      
      // Delete the region
      const { error } = await supabase.from('regions').delete().eq('id', regionId);
      if (error) throw error;
      
      return res.status(200).json({ message: 'Region deleted successfully' });
    } catch (error) {
      console.error('DELETE regions error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}