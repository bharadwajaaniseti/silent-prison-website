import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function loreEntriesHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('lore_entries').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entries: data });
  }
  if (req.method === 'POST') {
    const { entry } = req.body;
    console.log('POST lore entry, entry:', entry);
    const { data, error } = await supabase.from('lore_entries').insert([entry]).select();
    console.log('Supabase insert result:', { data, error });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(500).json({ error: 'Failed to add entry' });
    return res.status(201).json({ entry: data[0] });
  }
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    console.log('DELETE lore entry, id:', id);
    if (!id) return res.status(400).json({ error: 'Missing lore entry ID' });
    const { data, error } = await supabase.from('lore_entries').delete().eq('id', id);
    console.log('Supabase delete result:', { data, error });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Lore entry not found' });
    return res.status(200).json({ message: 'Entry deleted' });
  }
  if (req.method === 'PUT') {
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: 'Missing lore entry ID' });
    const updates = req.body;
    const { data, error } = await supabase.from('lore_entries').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entry: data[0] });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
