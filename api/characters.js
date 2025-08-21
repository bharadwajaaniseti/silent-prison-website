import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function charactersHandler(req, res) {
  if (req.method === 'GET') {
    // Fetch all characters
    const { data, error } = await supabase.from('characters').select('*');
    if (error) return res.status(500).json({ error: error.message });
    
    // Map database fields to frontend format
    const mappedData = data?.map(character => ({
      id: character.id,
      name: character.name,
      title: character.title,
      status: character.status,
      affiliation: character.affiliation,
      powerType: character.power_type,
      powerLevel: character.power_level,
      image: character.image_url || character.image, // Support both new and old fields
      imagePath: character.image_path || '',
      description: character.description,
      background: character.background,
      relationships: character.relationships || [],
      abilities: character.abilities || [],
      statistics: character.statistics || character.metadata?.statistics || [],
      createdAt: character.created_at,
      updatedAt: character.updated_at
    })) || [];
    
    return res.status(200).json({ characters: mappedData });
  }
  
  if (req.method === 'POST') {
    // Add new character
    const { character } = req.body;
    console.log('POST character, character:', character);
    
    // Map frontend fields to database format
    const dbCharacter = {
      name: character.name,
      title: character.title,
      status: character.status,
      affiliation: character.affiliation,
      power_type: character.powerType,
      power_level: character.powerLevel || 0,
      image_url: character.image || null, // Use new image_url field
      image_path: character.imagePath || null, // Store the storage path
      image: character.image, // Keep old field for backward compatibility
      description: character.description,
      background: character.background,
      relationships: character.relationships || [],
      abilities: character.abilities || [],
      statistics: character.statistics || [],
      metadata: { 
        ...character.metadata,
        statistics: character.statistics || [] // Store in metadata as backup
      }
    };
    
    const { data, error } = await supabase.from('characters').insert([dbCharacter]).select();
    console.log('Supabase insert result:', { data, error });
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedCharacter = {
      id: data[0].id,
      name: data[0].name,
      title: data[0].title,
      status: data[0].status,
      affiliation: data[0].affiliation,
      powerType: data[0].power_type,
      powerLevel: data[0].power_level,
      image: data[0].image_url || data[0].image,
      imagePath: data[0].image_path || '',
      description: data[0].description,
      background: data[0].background,
      relationships: data[0].relationships || [],
      abilities: data[0].abilities || [],
      statistics: data[0].statistics || data[0].metadata?.statistics || [],
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
    
    return res.status(201).json({ character: mappedCharacter });
  }
  
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing character ID' });
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Character deleted' });
  }
  
  if (req.method === 'PUT') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing character ID' });
    const updates = req.body;
    
    // Map frontend fields to database format
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.affiliation !== undefined) dbUpdates.affiliation = updates.affiliation;
    if (updates.powerType !== undefined) dbUpdates.power_type = updates.powerType;
    if (updates.powerLevel !== undefined) dbUpdates.power_level = updates.powerLevel;
    if (updates.image !== undefined) {
      dbUpdates.image_url = updates.image;
      dbUpdates.image = updates.image; // Keep for backward compatibility
    }
    if (updates.imagePath !== undefined) dbUpdates.image_path = updates.imagePath;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.background !== undefined) dbUpdates.background = updates.background;
    if (updates.relationships !== undefined) dbUpdates.relationships = updates.relationships;
    if (updates.abilities !== undefined) dbUpdates.abilities = updates.abilities;
    if (updates.statistics !== undefined) {
      dbUpdates.statistics = updates.statistics;
      // Also store in metadata as backup
      dbUpdates.metadata = { statistics: updates.statistics };
    }
    dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('characters').update(dbUpdates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedCharacter = {
      id: data[0].id,
      name: data[0].name,
      title: data[0].title,
      status: data[0].status,
      affiliation: data[0].affiliation,
      powerType: data[0].power_type,
      powerLevel: data[0].power_level,
      image: data[0].image_url || data[0].image,
      imagePath: data[0].image_path || '',
      description: data[0].description,
      background: data[0].background,
      relationships: data[0].relationships || [],
      abilities: data[0].abilities || [],
      statistics: data[0].statistics || data[0].metadata?.statistics || [],
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
    
    return res.status(200).json({ character: mappedCharacter });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
