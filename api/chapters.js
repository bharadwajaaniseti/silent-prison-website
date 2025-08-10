const fs = require('fs').promises;
const path = require('path');

// Path to the chapters JSON file
const CHAPTERS_FILE_PATH = path.join(__dirname, '..', 'public', 'data', 'chapters.json');

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

// API handler function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all chapters
        const chapters = await readChapters();
        res.status(200).json({ chapters });
        break;

      case 'POST':
        // Add new chapter or update all chapters
        const { chapters: newChapters, chapter: singleChapter } = req.body;
        
        if (newChapters) {
          // Replace all chapters
          await writeChapters(newChapters);
          res.status(200).json({ message: 'Chapters updated successfully', chapters: newChapters });
        } else if (singleChapter) {
          // Add single chapter
          const existingChapters = await readChapters();
          const updatedChapters = [...existingChapters, {
            ...singleChapter,
            id: singleChapter.id || `chapter-${Date.now()}`,
            createdAt: singleChapter.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }];
          await writeChapters(updatedChapters);
          res.status(201).json({ message: 'Chapter added successfully', chapters: updatedChapters });
        } else {
          res.status(400).json({ error: 'Invalid request body' });
        }
        break;

      case 'PUT':
        // Update existing chapter
        const { id, ...updateData } = req.body;
        if (!id) {
          res.status(400).json({ error: 'Chapter ID is required' });
          return;
        }

        const chaptersToUpdate = await readChapters();
        const chapterIndex = chaptersToUpdate.findIndex(ch => ch.id === id);
        
        if (chapterIndex === -1) {
          res.status(404).json({ error: 'Chapter not found' });
          return;
        }

        chaptersToUpdate[chapterIndex] = {
          ...chaptersToUpdate[chapterIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };

        await writeChapters(chaptersToUpdate);
        res.status(200).json({ 
          message: 'Chapter updated successfully', 
          chapter: chaptersToUpdate[chapterIndex],
          chapters: chaptersToUpdate 
        });
        break;

      case 'DELETE':
        // Delete chapter
        const { id: deleteId } = req.query;
        if (!deleteId) {
          res.status(400).json({ error: 'Chapter ID is required' });
          return;
        }

        const chaptersToDelete = await readChapters();
        const filteredChapters = chaptersToDelete.filter(ch => ch.id !== deleteId);
        
        if (filteredChapters.length === chaptersToDelete.length) {
          res.status(404).json({ error: 'Chapter not found' });
          return;
        }

        await writeChapters(filteredChapters);
        res.status(200).json({ 
          message: 'Chapter deleted successfully', 
          chapters: filteredChapters 
        });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
