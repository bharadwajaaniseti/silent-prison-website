// Utility functions for managing chapters in JSON file storage
import { apiFetchChapters, apiSaveChapters, apiAddChapter, apiUpdateChapter, apiDeleteChapter } from '../api/chapters';

export interface Chapter {
  id: string;
  title: string;
  volume: string;
  content: string;
  isPublished: boolean;
  memberOnly: boolean;
  createdAt: string;
  updatedAt: string;
  views?: number; // Optional for backward compatibility
}

export interface ChaptersData {
  chapters: Chapter[];
}

// Fetch chapters from backend
export const fetchChapters = async (): Promise<Chapter[]> => {
  return await apiFetchChapters();
};

// Save chapters to backend
export const saveChapters = async (chapters: Chapter[]): Promise<void> => {
  return await apiSaveChapters(chapters);
};

// Add a new chapter
export const addChapter = async (chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chapter> => {
  return await apiAddChapter(chapterData);
};

// Update an existing chapter
export const updateChapter = async (id: string, updates: Partial<Chapter>): Promise<Chapter | null> => {
  try {
    return await apiUpdateChapter(id, updates);
  } catch (error) {
    console.error('Error updating chapter:', error);
    return null;
  }
};

// Delete a chapter
export const deleteChapter = async (id: string): Promise<boolean> => {
  return await apiDeleteChapter(id);
};

// Get a single chapter by ID
export const getChapterById = async (id: string): Promise<Chapter | null> => {
  const chapters = await fetchChapters();
  return chapters.find(ch => ch.id === id) || null;
};

// Migration function to move data from localStorage to JSON file
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    const localChapters = localStorage.getItem('chapters');
    if (localChapters) {
      const chapters: Chapter[] = JSON.parse(localChapters);
      if (chapters.length > 0) {
        console.log('Migrating chapters from localStorage to JSON file');
        await saveChapters(chapters);
        // Optionally remove from localStorage after successful migration
        // localStorage.removeItem('chapters');
      }
    }
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
  }
};
