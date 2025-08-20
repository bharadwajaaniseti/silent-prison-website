import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function regionsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('regions').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ regions: data });
  }
  if (req.method === 'POST') {
    const { region } = req.body;
    const { data, error } = await supabase.from('regions').insert([region]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ region: data[0] });
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
    const { data, error } = await supabase.from('regions').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ region: data[0] });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
