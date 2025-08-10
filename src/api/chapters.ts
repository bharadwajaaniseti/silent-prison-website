// API endpoints for chapter management
import { Chapter } from '../utils/chaptersStorage';

const API_BASE = 'http://localhost:3001/api';

// Save all chapters to backend
export const apiSaveChapters = async (chapters: Chapter[]): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save chapters');
    }
    
    console.log('Chapters saved to backend successfully');
  } catch (error) {
    console.error('Error saving chapters to backend:', error);
    // Fallback to localStorage
    localStorage.setItem('chapters', JSON.stringify(chapters));
    console.log('Fallback: Chapters saved to localStorage');
  }
};

// Fetch chapters from backend
export const apiFetchChapters = async (): Promise<Chapter[]> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE}/chapters`);
    if (response.ok) {
      const data = await response.json();
      return data.chapters || [];
    }
    
    throw new Error('Failed to fetch from backend');
  } catch (error) {
    console.error('Error fetching chapters from backend:', error);
    
    // Fallback to localStorage
    try {
      const localChapters = localStorage.getItem('chapters');
      return localChapters ? JSON.parse(localChapters) : [];
    } catch {
      return [];
    }
  }
};

// Add single chapter to backend
export const apiAddChapter = async (chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chapter> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add chapter');
    }
    
    const data = await response.json();
    return data.chapter;
  } catch (error) {
    console.error('Error adding chapter to backend:', error);
    throw error;
  }
};

// Update chapter in backend
export const apiUpdateChapter = async (id: string, updates: Partial<Chapter>): Promise<Chapter> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE}/chapters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update chapter');
    }
    
    const data = await response.json();
    return data.chapter;
  } catch (error) {
    console.error('Error updating chapter in backend:', error);
    throw error;
  }
};

// Delete chapter from backend
export const apiDeleteChapter = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE}/chapters/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return false; // Chapter not found
      }
      throw new Error('Failed to delete chapter');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting chapter from backend:', error);
    throw error;
  }
};
