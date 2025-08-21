import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function loreEntriesHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('lore_entries').select('*');
    if (error) return res.status(500).json({ error: error.message });
    
    // Map database fields to frontend format
    const mappedData = data?.map(entry => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      summary: entry.summary,
      content: entry.content,
      tags: entry.tags || [],
      isPublished: entry.is_published,
      publishDate: entry.publish_date,
      viewCount: entry.view_count || 0,
      featured: entry.featured || false,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    })) || [];
    
    return res.status(200).json({ entries: mappedData });
  }
  
  if (req.method === 'POST') {
    const { entry } = req.body;
    console.log('POST lore entry, entry:', entry);
    
    // Map frontend fields to database format
    const dbEntry = {
      title: entry.title,
      category: entry.category,
      summary: entry.summary,
      content: entry.content,
      tags: entry.tags || [],
      is_published: entry.isPublished || false,
      publish_date: entry.publishDate || new Date().toISOString(),
      view_count: entry.viewCount || 0,
      featured: entry.featured || false
    };
    
    const { data, error } = await supabase.from('lore_entries').insert([dbEntry]).select();
    console.log('Supabase insert result:', { data, error });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(500).json({ error: 'Failed to add entry' });
    
    // Map back to frontend format
    const mappedEntry = {
      id: data[0].id,
      title: data[0].title,
      category: data[0].category,
      summary: data[0].summary,
      content: data[0].content,
      tags: data[0].tags || [],
      isPublished: data[0].is_published,
      publishDate: data[0].publish_date,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
    
    return res.status(201).json({ entry: mappedEntry });
  }
  
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    console.log('DELETE lore entry, id:', id);
    if (!id) return res.status(400).json({ error: 'Missing lore entry ID' });
    const { error } = await supabase.from('lore_entries').delete().eq('id', id);
    console.log('Supabase delete result:', { error });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Entry deleted' });
  }
  
  if (req.method === 'PUT') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing lore entry ID' });
    const updates = req.body;
    
    // Map frontend fields to database format
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
    if (updates.publishDate !== undefined) dbUpdates.publish_date = updates.publishDate;
    dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('lore_entries').update(dbUpdates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedEntry = {
      id: data[0].id,
      title: data[0].title,
      category: data[0].category,
      summary: data[0].summary,
      content: data[0].content,
      tags: data[0].tags || [],
      isPublished: data[0].is_published,
      publishDate: data[0].publish_date,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
    
    return res.status(200).json({ entry: mappedEntry });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
