import 'dotenv/config';

import express from 'express';
import loreEntriesHandler from './api/lore-entries.js';
import charactersHandler from './api/characters.js';
import regionsHandler from './api/regions.js';
import timelineEventsHandler from './api/timeline-events.js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

/* ---------- CORS ---------- */
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Increase payload size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* ---------- Supabase ---------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/* ---------- Health ---------- */
app.get('/healthz', (_req, res) => res.json({ ok: true }));

/* ---------- Chapters ---------- */

// normalize incoming chapter objects (prevents 500s when fields are missing)
function normalizeChapter(c) {
  return {
    id: c.id || `chapter-${Date.now()}`,
    title: (c.title ?? '').toString(),
    content: (c.content ?? '').toString(),
    is_published: !!(c.is_published ?? c.isPublished),
    views: Number.isFinite(c.views) ? c.views : 0,
    created_at: c.created_at || c.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// GET all
app.get('/api/chapters', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ chapters: data || [] });
  } catch (e) {
    console.error('GET /api/chapters:', e);
    res.status(500).json({ error: 'Failed to read chapters' });
  }
});

// POST bulk replace OR add one
app.post('/api/chapters', async (req, res) => {
  try {
    const { chapters: newChapters, chapter: singleChapter } = req.body;

    if (Array.isArray(newChapters)) {
      const payload = newChapters.map(normalizeChapter);
      const { error } = await supabase.from('chapters').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return res.json({ message: 'Chapters updated successfully', chapters: payload });
    }

    if (singleChapter) {
      const row = normalizeChapter(singleChapter);
      const { data, error } = await supabase
        .from('chapters')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ message: 'Chapter added successfully', chapter: data });
    }

    res.status(400).json({ error: 'Invalid request body' });
  } catch (e) {
    console.error('POST /api/chapters:', e);
    res.status(500).json({ error: 'Failed to add/update chapters' });
  }
});

// PUT update one
app.put('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = normalizeChapter({ id, ...req.body });
    const { data, error } = await supabase
      .from('chapters')
      .update({
        title: updates.title,
        content: updates.content,
        is_published: updates.is_published,
        views: updates.views,
        updated_at: updates.updated_at
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(404).json({ error: 'Chapter not found' });
    res.json({ message: 'Chapter updated successfully', chapter: data });
  } catch (e) {
    console.error('PUT /api/chapters/:id:', e);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// DELETE one
app.delete('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Chapter deleted successfully' });
  } catch (e) {
    console.error('DELETE /api/chapters/:id:', e);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// Increment views (RPC if available, fallback to manual)
app.post('/api/chapters/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.rpc('increment_views', { chapter_id: id });
    if (error) {
      const { data: cur } = await supabase.from('chapters').select('views').eq('id', id).single();
      const views = (cur?.views || 0) + 1;
      await supabase.from('chapters').update({ views, updated_at: new Date().toISOString() }).eq('id', id);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/chapters/:id/view:', e);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

/* ---------- Stats & Activity (added) ---------- */
app.get('/api/stats', async (_req, res) => {
  try {
    const { count: totalUsers } = await supabase
      .from('users_app')
      .select('*', { count: 'exact', head: true });

    const { data: chRows, error: chErr } = await supabase
      .from('chapters')
      .select('views');
    if (chErr) throw chErr;

    const totalViews = (chRows || []).reduce((s, r) => s + (r.views || 0), 0);
    const { count: totalChapters } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true });

    // Get lore entries count from database
    const { count: totalLore } = await supabase
      .from('lore_entries')
      .select('*', { count: 'exact', head: true });

    // memberCount: count users with role='member'
    const { count: memberCount } = await supabase
      .from('users_app')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member');

    const stats = {
      totalViews: totalViews || 0,
      dailyViews: Math.floor((totalViews || 0) * 0.08),
      totalUsers: totalUsers ?? 0,
      totalChapters: totalChapters ?? 0,
      totalLore: totalLore ?? 0,
      memberCount: memberCount ?? 0
    };

    console.log('Computed stats:', stats);
    res.json({ stats });
  } catch (e) {
    console.error('GET /api/stats:', e);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

app.get('/api/activity/recent', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('id,title,updated_at,is_published')
      .order('updated_at', { ascending: false })
      .limit(5);
    if (error) throw error;

    const activities = (data || []).map(c => ({
      type: 'chapter',
      message: `Chapter updated: "${c.title}"`,
      time: c.updated_at,
      icon: 'calendar'
    }));

    res.json({ activities });
  } catch (e) {
    console.error('GET /api/activity/recent:', e);
    res.status(500).json({ error: 'Failed to load recent activity' });
  }
});

/* ---------- Users (auth) ---------- */

// POST /api/users/register
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, role = 'member' } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Make FIRST user admin (optional quality-of-life)
    let finalRole = role;
    const { count } = await supabase.from('users_app').select('*', { count: 'exact', head: true });
    if ((count ?? 0) === 0) finalRole = 'admin';

    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users_app')
      .insert({ username, email, password_hash, role: finalRole })
      .select()
      .single();

    if (error) {
      if (String(error.message).includes('duplicate')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      throw error;
    }

    const token = jwt.sign({ sub: data.id, role: data.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registered', token, user: data });
  } catch (e) {
    console.error('POST /api/users/register:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/users/login
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user, error } = await supabase
      .from('users_app')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    await supabase.from('users_app').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Logged in', token, user });
  } catch (e) {
    console.error('POST /api/users/login:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/users/verify
app.post('/api/users/verify', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    const { data: user } = await supabase.from('users_app').select('*').eq('id', payload.sub).single();
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/users/profile
app.get('/api/users/profile', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const { sub } = jwt.verify(token, JWT_SECRET);
    const { data: user } = await supabase.from('users_app').select('*').eq('id', sub).single();
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// PUT /api/users/profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const { sub } = jwt.verify(token, JWT_SECRET);
    const updates = { ...req.body };

    if (updates.newPassword) {
      updates.password_hash = await bcrypt.hash(updates.newPassword, 10);
      delete updates.newPassword;
      delete updates.currentPassword;
    }

    const { data: user, error } = await supabase
      .from('users_app')
      .update(updates)
      .eq('id', sub)
      .select()
      .single();
    if (error) throw error;

    res.json({ user });
  } catch (e) {
    console.error('PUT /api/users/profile:', e);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

/* ---------- API Routes ---------- */
// API routes for all sections
// Place DELETE and PUT routes before catch-all routes for correct matching
app.delete('/api/lore-entries/:id', (req, res) => {
  req.url = `/api/lore-entries/${req.params.id}`;
  loreEntriesHandler(req, res);
});
app.put('/api/lore-entries/:id', (req, res) => {
  req.url = `/api/lore-entries/${req.params.id}`;
  loreEntriesHandler(req, res);
});
app.all('/api/lore-entries', (req, res) => loreEntriesHandler(req, res));

app.delete('/api/characters/:id', (req, res) => {
  req.url = `/api/characters/${req.params.id}`;
  charactersHandler(req, res);
});
app.put('/api/characters/:id', (req, res) => {
  req.url = `/api/characters/${req.params.id}`;
  charactersHandler(req, res);
});
app.all('/api/characters', (req, res) => charactersHandler(req, res));

// Regions routes - order matters for proper matching
app.post('/api/regions/bulk', (req, res) => {
  req.url = '/api/regions/bulk';
  regionsHandler(req, res);
});

app.get('/api/regions/user-type/:userType', (req, res) => {
  req.url = `/api/regions/user-type/${req.params.userType}`;
  regionsHandler(req, res);
});

app.put('/api/regions/:id/visibility', (req, res) => {
  req.url = `/api/regions/${req.params.id}/visibility`;
  regionsHandler(req, res);
});

app.delete('/api/regions/:id', (req, res) => {
  req.url = `/api/regions/${req.params.id}`;
  regionsHandler(req, res);
});

app.put('/api/regions/:id', (req, res) => {
  req.url = `/api/regions/${req.params.id}`;
  regionsHandler(req, res);
});

app.all('/api/regions', (req, res) => regionsHandler(req, res));

app.delete('/api/timeline-events/:id', (req, res) => {
  req.url = `/api/timeline-events/${req.params.id}`;
  timelineEventsHandler(req, res);
});
app.put('/api/timeline-events/:id', (req, res) => {
  req.url = `/api/timeline-events/${req.params.id}`;
  timelineEventsHandler(req, res);
});
app.all('/api/timeline-events', (req, res) => timelineEventsHandler(req, res));

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

export default app;
