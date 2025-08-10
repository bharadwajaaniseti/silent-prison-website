// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import usersHandler from './api/users.js';

// --- Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS: allow Netlify + localhost (add your Netlify URL below)
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://YOUR-NETLIFY-SITE.netlify.app')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin(origin, cb) {
    // allow non-browser/SSR and same-origin
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

// --- Data path (WARNING: Render free web service does not persist files)
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'public', 'data', 'chapters.json');

async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readChapters() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.chapters || [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeChapters(chapters) {
  await ensureDataDirectory();
  const data = { chapters };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- API
app.get('/api/chapters', async (req, res) => {
  try {
    const chapters = await readChapters();
    res.json({ chapters });
  } catch (e) {
    console.error('Error reading chapters:', e);
    res.status(500).json({ error: 'Failed to read chapters' });
  }
});

app.post('/api/chapters', async (req, res) => {
  try {
    const { chapters: newChapters, chapter: singleChapter } = req.body;

    if (newChapters) {
      await writeChapters(newChapters);
      return res.json({ message: 'Chapters updated successfully', chapters: newChapters });
    }

    if (singleChapter) {
      const existing = await readChapters();
      const newChapter = {
        ...singleChapter,
        id: singleChapter.id || `chapter-${Date.now()}`,
        createdAt: singleChapter.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...existing, newChapter];
      await writeChapters(updated);
      return res.status(201).json({ message: 'Chapter added successfully', chapter: newChapter, chapters: updated });
    }

    res.status(400).json({ error: 'Invalid request body' });
  } catch (e) {
    console.error('Error adding chapter:', e);
    res.status(500).json({ error: 'Failed to add chapter' });
  }
});

app.put('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const chapters = await readChapters();
    const idx = chapters.findIndex(ch => ch.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Chapter not found' });

    chapters[idx] = { ...chapters[idx], ...updateData, updatedAt: new Date().toISOString() };
    await writeChapters(chapters);
    res.json({ message: 'Chapter updated successfully', chapter: chapters[idx], chapters });
  } catch (e) {
    console.error('Error updating chapter:', e);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

app.delete('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chapters = await readChapters();
    const filtered = chapters.filter(ch => ch.id !== id);
    if (filtered.length === chapters.length) return res.status(404).json({ error: 'Chapter not found' });

    await writeChapters(filtered);
    res.json({ message: 'Chapter deleted successfully', chapters: filtered });
  } catch (e) {
    console.error('Error deleting chapter:', e);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// Users (your current handler)
app.post('/api/users/login', usersHandler);
app.post('/api/users/register', usersHandler);
app.post('/api/users/verify', usersHandler);
app.get('/api/users/profile', usersHandler);
app.put('/api/users/profile', usersHandler);

// Static (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
export default app;
