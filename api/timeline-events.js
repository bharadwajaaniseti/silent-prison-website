import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function timelineEventsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('timeline_events').select('*').order('era, order_index');
    if (error) return res.status(500).json({ error: error.message });
    
    // Map database fields to frontend format
    const mappedData = data?.map(event => ({
      id: event.id,
      era: event.era,
      year: event.year,
      title: event.title,
      type: event.type,
      summary: event.summary,
      details: event.details,
      impact: event.impact,
      orderIndex: event.order_index || 0,
      isMajorEvent: event.is_major_event || false,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    })) || [];
    
    return res.status(200).json({ events: mappedData });
  }
  
  if (req.method === 'POST') {
    const { event } = req.body;
    
    // Map frontend fields to database format
    const dbEvent = {
      era: event.era,
      year: event.year,
      title: event.title,
      type: event.type,
      summary: event.summary,
      details: event.details,
      impact: event.impact,
      order_index: event.orderIndex || 0,
      is_major_event: event.isMajorEvent || false
    };
    
    const { data, error } = await supabase.from('timeline_events').insert([dbEvent]).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedEvent = {
      id: data[0].id,
      era: data[0].era,
      year: data[0].year,
      title: data[0].title,
      type: data[0].type,
      summary: data[0].summary,
      details: data[0].details,
      impact: data[0].impact,
      orderIndex: data[0].order_index,
      isMajorEvent: data[0].is_major_event,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
    
    return res.status(201).json({ event: mappedEvent });
  }
  
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing event ID' });
    const { error } = await supabase.from('timeline_events').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Event deleted' });
  }
  
  if (req.method === 'PUT') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing event ID' });
    const updates = req.body;
    
    // Map frontend fields to database format
    const dbUpdates = {};
    if (updates.era !== undefined) dbUpdates.era = updates.era;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
    if (updates.details !== undefined) dbUpdates.details = updates.details;
    if (updates.impact !== undefined) dbUpdates.impact = updates.impact;
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
    if (updates.isMajorEvent !== undefined) dbUpdates.is_major_event = updates.isMajorEvent;
    dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('timeline_events').update(dbUpdates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Map back to frontend format
    const mappedEvent = {
      id: data[0].id,
      era: data[0].era,
      year: data[0].year,
      title: data[0].title,
      type: data[0].type,
      summary: data[0].summary,
      details: data[0].details,
      impact: data[0].impact,
      orderIndex: data[0].order_index,
      isMajorEvent: data[0].is_major_event,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
    
    return res.status(200).json({ event: mappedEvent });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
