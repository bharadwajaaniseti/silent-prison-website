import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function charactersHandler(req, res) {
  if (req.method === 'GET') {
    // Fetch all characters
    const { data, error } = await supabase.from('characters').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ characters: data });
  }
  if (req.method === 'POST') {
    // Add new character
    const { character } = req.body;
    const { data, error } = await supabase.from('characters').insert([character]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ character: data[0] });
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
    const { data, error } = await supabase.from('characters').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ character: data[0] });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
