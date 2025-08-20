import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function timelineEventsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('timeline_events').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ events: data });
  }
  if (req.method === 'POST') {
    const { event } = req.body;
    const { data, error } = await supabase.from('timeline_events').insert([event]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ event: data[0] });
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
    const { data, error } = await supabase.from('timeline_events').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ event: data[0] });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
