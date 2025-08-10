import express from 'express';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import usersHandler from './api/users.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to the chapters JSON file
const CHAPTERS_FILE_PATH = path.join(__dirname, 'public', 'data', 'chapters.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(CHAPTERS_FILE_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read chapters from JSON file
async function readChapters() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(CHAPTERS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.chapters || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

// Write chapters to JSON file
async function writeChapters(chapters) {
  await ensureDataDirectory();
  const data = { chapters };
  await fs.writeFile(CHAPTERS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// API Routes

// Get all chapters
app.get('/api/chapters', async (req, res) => {
  try {
    const chapters = await readChapters();
    res.json({ chapters });
  } catch (error) {
    console.error('Error reading chapters:', error);
    res.status(500).json({ error: 'Failed to read chapters' });
  }
});

// Add new chapter
app.post('/api/chapters', async (req, res) => {
  try {
    const { chapters: newChapters, chapter: singleChapter } = req.body;
    
    if (newChapters) {
      // Replace all chapters
      await writeChapters(newChapters);
      res.json({ message: 'Chapters updated successfully', chapters: newChapters });
    } else if (singleChapter) {
      // Add single chapter
      const existingChapters = await readChapters();
      const newChapter = {
        ...singleChapter,
        id: singleChapter.id || `chapter-${Date.now()}`,
        createdAt: singleChapter.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedChapters = [...existingChapters, newChapter];
      await writeChapters(updatedChapters);
      res.status(201).json({ message: 'Chapter added successfully', chapter: newChapter, chapters: updatedChapters });
    } else {
      res.status(400).json({ error: 'Invalid request body' });
    }
  } catch (error) {
    console.error('Error adding chapter:', error);
    res.status(500).json({ error: 'Failed to add chapter' });
  }
});

// Update existing chapter
app.put('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const chapters = await readChapters();
    const chapterIndex = chapters.findIndex(ch => ch.id === id);
    
    if (chapterIndex === -1) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeChapters(chapters);
    res.json({ 
      message: 'Chapter updated successfully', 
      chapter: chapters[chapterIndex],
      chapters 
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// Delete chapter
app.delete('/api/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chapters = await readChapters();
    const filteredChapters = chapters.filter(ch => ch.id !== id);
    
    if (filteredChapters.length === chapters.length) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    await writeChapters(filteredChapters);
    res.json({ 
      message: 'Chapter deleted successfully', 
      chapters: filteredChapters 
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// User authentication routes
app.post('/api/users/login', usersHandler);
app.post('/api/users/register', usersHandler);
app.post('/api/users/verify', usersHandler);
app.get('/api/users/profile', usersHandler);
app.put('/api/users/profile', usersHandler);

// Serve static files from public directory
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/chapters`);
  console.log(`User API available at http://localhost:${PORT}/api/users`);
});

export default app;
