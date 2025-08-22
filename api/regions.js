import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function regionsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('regions').select('*');
    if (error) return res.status(500).json({ error: error.message });
    
    // Map database fields to frontend format
    const mappedData = data?.map(region => ({
  id: region.id,
  name: region.name,
  subtitle: region.subtitle,
  position: region.position,
  color: region.color,
  description: region.description,
  keyLocations: region.key_locations || [],
  population: region.population,
  threat: region.threat,
  mapData: region.map_data || {},
  connections: region.connections || [],
  region_icon: region.region_icon || '',
  createdAt: region.created_at,
  updatedAt: region.updated_at
    })) || [];
    
    return res.status(200).json({ regions: mappedData });
  }
  
  if (req.method === 'POST') {
    const { region } = req.body;
    console.log('POST region, region:', region);
    
    // Map frontend fields to database format
    const dbRegion = {
      name: region.name,
      subtitle: region.subtitle,
      position: region.position,
      color: region.color,
      description: region.description,
      key_locations: region.keyLocations || [],
      population: region.population,
      threat: region.threat,
      map_data: region.mapData || {},
      connections: region.connections || [],
      region_icon: region.region_icon || ''
    };
    
    const { data, error } = await supabase.from('regions').insert([dbRegion]).select();
    console.log('Supabase insert result:', { data, error });
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedRegion = {
  id: data[0].id,
  name: data[0].name,
  subtitle: data[0].subtitle,
  position: data[0].position,
  color: data[0].color,
  description: data[0].description,
  keyLocations: data[0].key_locations || [],
  population: data[0].population,
  threat: data[0].threat,
  connections: data[0].connections || [],
  region_icon: data[0].region_icon || '',
  createdAt: data[0].created_at,
  updatedAt: data[0].updated_at
    };
    
    return res.status(201).json({ region: mappedRegion });
  }
  
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing region ID' });
    const { error } = await supabase.from('regions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Region deleted' });
  }
  
  if (req.method === 'PUT') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing region ID' });
    const updates = req.body;
    
    // Map frontend fields to database format
    const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
  if (updates.position !== undefined) dbUpdates.position = updates.position;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.keyLocations !== undefined) dbUpdates.key_locations = updates.keyLocations;
  if (updates.population !== undefined) dbUpdates.population = updates.population;
  if (updates.threat !== undefined) dbUpdates.threat = updates.threat;
  if (updates.connections !== undefined) dbUpdates.connections = updates.connections;
  if (updates.region_icon !== undefined) dbUpdates.region_icon = updates.region_icon;
  dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('regions').update(dbUpdates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedRegion = {
  id: data[0].id,
  name: data[0].name,
  subtitle: data[0].subtitle,
  position: data[0].position,
  color: data[0].color,
  description: data[0].description,
  keyLocations: data[0].key_locations || [],
  population: data[0].population,
  threat: data[0].threat,
  connections: data[0].connections || [],
  region_icon: data[0].region_icon || '',
  createdAt: data[0].created_at,
  updatedAt: data[0].updated_at
    };
    
    return res.status(200).json({ region: mappedRegion });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
